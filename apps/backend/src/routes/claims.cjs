'use strict';

/**
 * Claim lifecycle API: REPORT -> SUBMIT -> REVIEW -> ACCEPT -> PAY.
 *
 * Staff move a claim with POST /api/claims/:collection/:id/transition. Customers act on their own
 * claim: accept or query an offer, and report an outstanding document. All rules (which steps are
 * legal, what payload each needs, who may perform it) live in src/lib/claimLifecycle.cjs; this file
 * only adds authorization, persistence, audit and notification.
 */
const lifecycle = require('../lib/claimLifecycle.cjs');

module.exports = function register(app, ctx) {
  const {
    db,
    admin,
    requireAuth,
    requireClaims,
    normalizeRole,
    isClaimsOrAdminOrCompliance,
    validateCollectionName,
    isClaimFormType,
    resolveAssignedClaimCollections,
    resolveClaimFormConfig,
    normalizeNotificationEmails,
    getClaimStaffEmails,
    buildAdminSubmissionDeepLink,
    buildCustomerDashboardLink,
    sendEmail,
    logAction,
    getUserDetailsForLogging,
    generateClaimStageEmail,
    sensitiveOperationLimiter,
  } = ctx;

  const frontendUrl = () => process.env.FRONTEND_URL || 'https://nemforms.com';

  function badRequest(res, message, extra = {}) {
    return res.status(400).json({ error: 'Bad request', message, ...extra });
  }

  /** Loads the claim document and checks that :collection really is a claim collection. */
  async function loadClaim(req, res) {
    const { collection, id } = req.params;
    try {
      validateCollectionName(collection);
    } catch (error) {
      badRequest(res, 'Unknown collection');
      return null;
    }
    if (!isClaimFormType('', collection)) {
      badRequest(res, 'This is not a claim collection');
      return null;
    }
    const ref = db.collection(collection).doc(String(id));
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      res.status(404).json({ error: 'Not found', message: 'Claim not found' });
      return null;
    }
    return { ref, data: snapshot.data(), collection, id: String(id) };
  }

  function isOwner(user, data) {
    const ownerIds = [data.userUid, data.submittedByUid, data.userId, data.uid].filter(Boolean);
    const ownerEmails = [data.submittedBy, data.userEmail, data.email, data.emailAddress]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());
    return ownerIds.includes(user.uid) || (user.email && ownerEmails.includes(String(user.email).toLowerCase()));
  }

  /** Claims officers only see the claim units they are assigned to; admins and compliance see all. */
  async function assertStaffScope(req, res, collection) {
    const role = normalizeRole(req.user.role);
    if (role !== 'claims') return true;
    const profile = await db.collection('userroles').doc(req.user.uid).get();
    const profileData = profile.exists ? profile.data() : {};
    const allowed = resolveAssignedClaimCollections({
      email: req.user.email,
      role,
      assignedClaimCollections: profileData.assignedClaimCollections,
      claimAccessAll: profileData.claimAccessAll,
    });
    if (allowed === null || (Array.isArray(allowed) && allowed.includes(collection))) return true;
    res.status(403).json({ error: 'Forbidden', message: 'This claim belongs to a unit you are not assigned to' });
    return false;
  }

  async function persistTransition(claimDoc, input, actor, req) {
    const now = Date.now();
    let outcome;
    await db.runTransaction(async (transaction) => {
      const fresh = await transaction.get(claimDoc.ref);
      const current = fresh.exists ? fresh.data() : claimDoc.data;
      const currentBlock = current.claim && lifecycle.isValidStep(current.claim.step)
        ? current.claim
        : { ...lifecycle.initialClaimBlock(now), step: lifecycle.stepFromLegacyStatus(current.status), history: [] };
      if (!current.claim) currentBlock.stage = lifecycle.STEPS[currentBlock.step].stage;
      outcome = lifecycle.applyTransition(currentBlock, input, actor, now);
      transaction.update(claimDoc.ref, {
        claim: outcome.claim,
        status: outcome.status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: actor.uid || null,
        updaterName: actor.name || null,
        lastClaimStep: input.step,
      });
    });

    logAction({
      action: 'claim_transition',
      actorUid: actor.uid || 'system',
      actorDisplayName: actor.name || 'System',
      actorEmail: actor.email || null,
      actorRole: actor.role || actor.kind,
      targetType: claimDoc.collection,
      targetId: claimDoc.id,
      details: { step: input.step, stage: outcome.claim.stage, note: input.note || '' },
      ipMasked: req.ipData?.masked || 'unknown',
      ipHash: req.ipData?.hash || 'unknown',
      rawIP: req.ipData?.raw || null,
      userAgent: req.headers['user-agent'] || 'unknown',
    }).catch((error) => console.error('Failed to log claim transition:', error.message));

    return outcome;
  }

  async function notifyCustomer(claimDoc, outcome, input) {
    const data = claimDoc.data;
    const to = data.submittedBy || data.userEmail || data.email || data.emailAddress;
    if (!to) return;
    const step = lifecycle.STEPS[input.step];
    const latestOffer = outcome.claim.offers[outcome.claim.offers.length - 1] || null;
    try {
      await sendEmail(
        to,
        `${data.formType || 'Claim'} ${data.ticketId ? `#${data.ticketId} ` : ''}- ${step.label}`,
        generateClaimStageEmail({
          fullName: data.name || data.insuredFirstName || data.companyName || [data.firstName, data.lastName].filter(Boolean).join(' ') || 'Valued Customer',
          ticketId: data.ticketId || claimDoc.id,
          formType: data.formType || 'Claim',
          stage: outcome.claim.stage,
          stepLabel: step.label,
          customerMessage: step.customer,
          note: input.note || '',
          reason: input.step === 'declined' ? input.reason : '',
          outstandingDocuments: input.step === 'docs_requested' ? outcome.claim.outstandingDocuments : [],
          offer: input.step === 'offer_issued' || input.step === 'offer_revised' ? latestOffer : null,
          link: buildCustomerDashboardLink(frontendUrl()),
        })
      );
    } catch (error) {
      console.error('Failed to send claim stage email:', error.message);
    }
  }

  async function notifyUnit(claimDoc, outcome, input, actor) {
    const data = claimDoc.data;
    const routing = resolveClaimFormConfig(data.formType, claimDoc.collection);
    const unitMailbox = routing ? normalizeNotificationEmails([routing.unitRecipientEmail]) : [];
    const emails = normalizeNotificationEmails([...unitMailbox, ...(await getClaimStaffEmails(claimDoc.collection))]);
    if (!emails.length) return;
    const step = lifecycle.STEPS[input.step];
    try {
      await sendEmail(
        emails,
        `Customer action on ${data.formType || 'claim'} #${data.ticketId || claimDoc.id}: ${step.label}`,
        generateClaimStageEmail({
          fullName: 'Claims team',
          ticketId: data.ticketId || claimDoc.id,
          formType: data.formType || 'Claim',
          stage: outcome.claim.stage,
          stepLabel: step.label,
          customerMessage: `${actor.name || 'The customer'} ${input.step === 'offer_accepted' ? 'accepted the settlement offer.' : input.step === 'offer_queried' ? `queried the offer: ${input.queryReason}` : 'acted on the claim.'}`,
          note: '',
          reason: '',
          outstandingDocuments: [],
          offer: null,
          link: buildAdminSubmissionDeepLink(claimDoc.collection, claimDoc.id, frontendUrl()),
        })
      );
    } catch (error) {
      console.error('Failed to notify claims unit:', error.message);
    }
  }

  function transitionErrorResponse(res, error) {
    if (error.code === 'INVALID_TRANSITION' || error.code === 'MISSING_PAYLOAD' || error.code === 'FORBIDDEN_ACTOR') {
      return res.status(error.code === 'FORBIDDEN_ACTOR' ? 403 : 409).json({
        error: error.code,
        code: error.code,
        message: error.message,
        details: error.missing || undefined,
      });
    }
    console.error('Claim transition failed:', error);
    return res.status(500).json({ error: 'Transition failed', message: 'We could not update this claim. Please try again.' });
  }

  // ---------------------------------------------------------------------------------------------
  // Staff: move the claim
  // ---------------------------------------------------------------------------------------------
  app.post('/api/claims/:collection/:id/transition', requireAuth, requireClaims, sensitiveOperationLimiter, async (req, res) => {
    try {
      const claimDoc = await loadClaim(req, res);
      if (!claimDoc) return;
      if (!(await assertStaffScope(req, res, claimDoc.collection))) return;

      const { step } = req.body || {};
      if (!lifecycle.isValidStep(step)) return badRequest(res, 'Unknown claim step');
      if (lifecycle.STEPS[step].actor === 'customer') {
        return res.status(403).json({ error: 'Forbidden', message: 'Only the customer can perform this step' });
      }
      const input = {
        step,
        note: typeof req.body.note === 'string' ? req.body.note : '',
        outstandingDocuments: Array.isArray(req.body.outstandingDocuments) ? req.body.outstandingDocuments.filter((d) => d && d.label) : undefined,
        offer: req.body.offer && typeof req.body.offer === 'object' && Number.isFinite(Number(req.body.offer.amount)) ? req.body.offer : undefined,
        reason: typeof req.body.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim() : undefined,
        payment: req.body.payment && typeof req.body.payment === 'object' && req.body.payment.reference ? req.body.payment : undefined,
      };
      const details = await getUserDetailsForLogging(req.user.uid).catch(() => ({}));
      const actor = { kind: 'staff', uid: req.user.uid, email: req.user.email, name: details.displayName || req.user.name || req.user.email, role: normalizeRole(req.user.role) };

      const outcome = await persistTransition(claimDoc, input, actor, req);
      res.json({ success: true, claim: outcome.claim, status: outcome.status });
      notifyCustomer(claimDoc, outcome, input);
    } catch (error) {
      return transitionErrorResponse(res, error);
    }
  });

  // ---------------------------------------------------------------------------------------------
  // Customer: accept or query the open offer
  // ---------------------------------------------------------------------------------------------
  async function customerOfferAction(req, res, step) {
    try {
      const claimDoc = await loadClaim(req, res);
      if (!claimDoc) return;
      if (!isOwner(req.user, claimDoc.data)) {
        return res.status(403).json({ error: 'Forbidden', message: 'This claim is not yours' });
      }
      const version = Number(req.params.version);
      const offers = (claimDoc.data.claim && claimDoc.data.claim.offers) || [];
      const open = offers[offers.length - 1];
      if (!open || open.status !== 'offered' || open.version !== version) {
        return res.status(409).json({ error: 'INVALID_TRANSITION', code: 'INVALID_TRANSITION', message: 'That offer is no longer open' });
      }
      const input = { step, queryReason: step === 'offer_queried' ? String(req.body?.reason || '').trim() : undefined };
      if (step === 'offer_queried' && !input.queryReason) return badRequest(res, 'Please tell us why you are querying the offer');
      const actor = { kind: 'customer', uid: req.user.uid, email: req.user.email, name: req.user.name || req.user.email, role: 'customer' };

      const outcome = await persistTransition(claimDoc, input, actor, req);
      res.json({ success: true, claim: outcome.claim, status: outcome.status });
      notifyUnit(claimDoc, outcome, input, actor);
    } catch (error) {
      return transitionErrorResponse(res, error);
    }
  }

  app.post('/api/claims/:collection/:id/offer/:version/accept', requireAuth, sensitiveOperationLimiter, (req, res) => customerOfferAction(req, res, 'offer_accepted'));
  app.post('/api/claims/:collection/:id/offer/:version/query', requireAuth, sensitiveOperationLimiter, (req, res) => customerOfferAction(req, res, 'offer_queried'));

  // ---------------------------------------------------------------------------------------------
  // Customer: an outstanding document has been uploaded
  // ---------------------------------------------------------------------------------------------
  app.post('/api/claims/:collection/:id/documents/:key', requireAuth, sensitiveOperationLimiter, async (req, res) => {
    try {
      const claimDoc = await loadClaim(req, res);
      if (!claimDoc) return;
      const staff = isClaimsOrAdminOrCompliance(normalizeRole(req.user.role));
      if (!staff && !isOwner(req.user, claimDoc.data)) {
        return res.status(403).json({ error: 'Forbidden', message: 'This claim is not yours' });
      }
      const url = String(req.body?.url || '');
      if (!/^gs:\/\/[a-z0-9._-]+\/.+/i.test(url)) return badRequest(res, 'A storage path from the upload endpoint is required');
      const key = String(req.params.key);

      const now = Date.now();
      let updatedClaim = null;
      await db.runTransaction(async (transaction) => {
        const fresh = await transaction.get(claimDoc.ref);
        const current = fresh.data() || {};
        const block = current.claim;
        if (!block || !Array.isArray(block.outstandingDocuments)) {
          const err = new Error('No documents have been requested for this claim');
          err.code = 'INVALID_TRANSITION';
          throw err;
        }
        const index = block.outstandingDocuments.findIndex((d) => d.key === key);
        if (index === -1) {
          const err = new Error('That document was not requested');
          err.code = 'INVALID_TRANSITION';
          throw err;
        }
        const outstanding = block.outstandingDocuments.map((d, i) => (i === index ? { ...d, receivedAt: now, url } : d));
        const allReceived = outstanding.filter((d) => d.required).every((d) => d.receivedAt);
        updatedClaim = {
          ...block,
          outstandingDocuments: outstanding,
          waitingOn: allReceived ? 'nem' : block.waitingOn,
          history: [
            ...(block.history || []),
            { step: block.step, stage: block.stage, at: now, byUid: req.user.uid, byName: req.user.name || req.user.email, note: `Document received: ${outstanding[index].label}`, customerVisible: true },
          ],
        };
        transaction.update(claimDoc.ref, { claim: updatedClaim, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      });
      res.json({ success: true, claim: updatedClaim, status: claimDoc.data.status || 'pending' });
    } catch (error) {
      return transitionErrorResponse(res, error);
    }
  });
};
