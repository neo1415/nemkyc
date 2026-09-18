'use strict';

/**
 * Claim lifecycle: the single source of truth for stages, steps, allowed transitions and how
 * the legacy `status` string is derived. Mirrored for the browser in src/lib/claimLifecycle.ts;
 * keep both files identical in substance (a test compares the two tables).
 *
 * Customer-facing stages come from the claims department's process:
 *   REPORT -> SUBMIT -> REVIEW -> ACCEPT -> PAY   (plus the terminal outcomes closed / declined)
 */

const STAGES = ['report', 'submit', 'review', 'accept', 'pay', 'closed', 'declined'];

const STAGE_LABELS = {
  report: 'Report',
  submit: 'Submit',
  review: 'Review',
  accept: 'Accept',
  pay: 'Pay',
  closed: 'Closed',
  declined: 'Declined',
};

/**
 * Each step belongs to one stage, says who the ball is with, and carries the customer-facing
 * wording from the department's table. `actor` is who may perform the transition INTO the step.
 */
const STEPS = {
  registered:        { stage: 'report',  waitingOn: 'nem',      actor: 'system',   label: 'Claim registered',          customer: 'Your claim has been registered and a claim number issued.' },
  docs_requested:    { stage: 'submit',  waitingOn: 'customer', actor: 'staff',    label: 'Documents requested',       customer: 'We need some documents from you to complete your claim file.' },
  docs_complete:     { stage: 'submit',  waitingOn: 'nem',      actor: 'staff',    label: 'Claim file complete',       customer: 'All required documents have been received.' },
  coverage_confirmed:{ stage: 'review',  waitingOn: 'nem',      actor: 'staff',    label: 'Policy coverage confirmed', customer: 'Your policy covers this loss. We are assessing the claim.' },
  assessed:          { stage: 'review',  waitingOn: 'nem',      actor: 'staff',    label: 'Loss and quantum assessed', customer: 'The loss has been assessed. A decision is being prepared.' },
  offer_issued:      { stage: 'accept',  waitingOn: 'customer', actor: 'staff',    label: 'Settlement offer issued',   customer: 'A settlement offer is ready for you to accept or query.' },
  offer_queried:     { stage: 'accept',  waitingOn: 'nem',      actor: 'customer', label: 'Offer queried',             customer: 'You queried the offer. We are reviewing your query.' },
  offer_revised:     { stage: 'accept',  waitingOn: 'customer', actor: 'staff',    label: 'Revised offer issued',      customer: 'A revised settlement offer is ready for you to accept or query.' },
  offer_accepted:    { stage: 'accept',  waitingOn: 'nem',      actor: 'customer', label: 'Offer accepted',            customer: 'You accepted the offer. We are preparing your discharge voucher.' },
  discharged:        { stage: 'accept',  waitingOn: 'nem',      actor: 'staff',    label: 'Discharge completed',       customer: 'Your discharge voucher has been executed. Payment is being processed.' },
  payment_processed: { stage: 'pay',     waitingOn: 'nem',      actor: 'staff',    label: 'Payment processed',         customer: 'Payment has been processed to your account.' },
  payment_confirmed: { stage: 'pay',     waitingOn: 'nem',      actor: 'staff',    label: 'Payment confirmed',         customer: 'Payment has been confirmed.' },
  closed:            { stage: 'closed',  waitingOn: 'none',     actor: 'staff',    label: 'Claim closed',              customer: 'Your claim is closed. Thank you.' },
  declined:          { stage: 'declined',waitingOn: 'none',     actor: 'staff',    label: 'Claim declined',            customer: 'We are unable to proceed with this claim. The reason is explained below.' },
};

/** step -> steps it may move to. */
const TRANSITIONS = {
  registered:         ['docs_requested', 'docs_complete', 'coverage_confirmed', 'declined'],
  docs_requested:     ['docs_requested', 'docs_complete', 'declined'],
  docs_complete:      ['docs_requested', 'coverage_confirmed', 'declined'],
  coverage_confirmed: ['docs_requested', 'assessed', 'declined'],
  assessed:           ['offer_issued', 'declined'],
  offer_issued:       ['offer_accepted', 'offer_queried', 'offer_revised', 'declined'],
  offer_queried:      ['offer_revised', 'declined'],
  offer_revised:      ['offer_accepted', 'offer_queried', 'offer_revised', 'declined'],
  offer_accepted:     ['discharged'],
  discharged:         ['payment_processed'],
  payment_processed:  ['payment_confirmed'],
  payment_confirmed:  ['closed'],
  closed:             [],
  declined:           [],
};

/** Steps that require extra payload. */
const STEP_REQUIREMENTS = {
  docs_requested: ['outstandingDocuments'],
  offer_issued: ['offer'],
  offer_revised: ['offer'],
  offer_queried: ['queryReason'],
  declined: ['reason'],
  payment_processed: ['payment'],
};

/** The old single-string status that existing tables, badges and emails still read. */
function legacyStatusForStage(stage) {
  switch (stage) {
    case 'report':
    case 'submit':
      return 'pending';
    case 'review':
      return 'processing';
    case 'accept':
    case 'pay':
    case 'closed':
      return 'approved';
    case 'declined':
      return 'rejected';
    default:
      return 'pending';
  }
}

/** Where a claim that predates the lifecycle sits, judged from its legacy status. */
function stepFromLegacyStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'processing':
      return 'coverage_confirmed';
    case 'approved':
    case 'completed':
      return 'offer_issued';
    case 'rejected':
    case 'cancelled':
      return 'declined';
    default:
      return 'registered';
  }
}

function isValidStep(step) {
  return Object.prototype.hasOwnProperty.call(STEPS, step);
}

function canTransition(fromStep, toStep) {
  if (!isValidStep(toStep)) return false;
  const from = isValidStep(fromStep) ? fromStep : 'registered';
  return TRANSITIONS[from].includes(toStep);
}

/** The five customer-facing stages in order, for progress rails. */
const CUSTOMER_STAGES = ['report', 'submit', 'review', 'accept', 'pay'];

function stageIndex(stage) {
  if (stage === 'closed') return CUSTOMER_STAGES.length; // everything done
  if (stage === 'declined') return -1;
  return CUSTOMER_STAGES.indexOf(stage);
}

/**
 * Builds the initial claim block for a freshly submitted claim.
 * FNOL and submission are the same event, so REPORT completes immediately.
 */
function initialClaimBlock(now = Date.now()) {
  return {
    stage: 'report',
    step: 'registered',
    waitingOn: 'nem',
    notifiedAt: now,
    targetDate: now + 60 * 24 * 60 * 60 * 1000, // statutory 60-day settlement clock (NIIRA 2025 s.210)
    history: [{ step: 'registered', stage: 'report', at: now, byUid: null, byName: 'System', note: 'Claim registered from customer submission', customerVisible: true }],
    outstandingDocuments: [],
    offers: [],
    decision: null,
    payment: null,
  };
}

/**
 * Applies a transition to a claim block and returns the new block plus the derived legacy status.
 * Throws with `.code = 'INVALID_TRANSITION'` or `'MISSING_PAYLOAD'` when the request is not allowed.
 */
function applyTransition(claim, input, actor, now = Date.now()) {
  const current = claim && isValidStep(claim.step) ? claim : { ...initialClaimBlock(now), history: [] };
  const { step, note = '', outstandingDocuments, offer, queryReason, reason, payment } = input;

  if (!canTransition(current.step, step)) {
    const err = new Error(`Cannot move a claim from "${current.step}" to "${step}"`);
    err.code = 'INVALID_TRANSITION';
    throw err;
  }
  const missing = (STEP_REQUIREMENTS[step] || []).filter((key) => {
    const value = { outstandingDocuments, offer, queryReason, reason, payment }[key];
    return value === undefined || value === null || (Array.isArray(value) && value.length === 0) || value === '';
  });
  if (missing.length) {
    const err = new Error(`"${step}" requires: ${missing.join(', ')}`);
    err.code = 'MISSING_PAYLOAD';
    err.missing = missing;
    throw err;
  }
  const definition = STEPS[step];
  if (definition.actor !== 'system' && definition.actor !== actor.kind) {
    const err = new Error(`Only ${definition.actor} can move a claim to "${step}"`);
    err.code = 'FORBIDDEN_ACTOR';
    throw err;
  }

  const next = {
    ...current,
    stage: definition.stage,
    step,
    waitingOn: definition.waitingOn,
    history: [
      ...(current.history || []),
      { step, stage: definition.stage, at: now, byUid: actor.uid || null, byName: actor.name || 'System', note: String(note || '').slice(0, 2000), customerVisible: true },
    ],
    outstandingDocuments: Array.isArray(current.outstandingDocuments) ? [...current.outstandingDocuments] : [],
    offers: Array.isArray(current.offers) ? [...current.offers] : [],
  };

  if (step === 'docs_requested') {
    next.outstandingDocuments = outstandingDocuments.map((doc) => ({
      key: String(doc.key || doc.label).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60),
      label: String(doc.label).slice(0, 200),
      required: doc.required !== false,
      receivedAt: doc.receivedAt || null,
      url: doc.url || null,
      requestedAt: now,
    }));
  }
  if (step === 'docs_complete') {
    next.outstandingDocuments = next.outstandingDocuments.map((doc) => ({ ...doc, receivedAt: doc.receivedAt || now }));
  }
  if (step === 'offer_issued' || step === 'offer_revised') {
    const version = next.offers.length + 1;
    next.offers = next.offers.map((o) => (o.status === 'offered' || o.status === 'queried' ? { ...o, status: 'superseded' } : o));
    next.offers.push({
      version,
      amount: Number(offer.amount),
      currency: offer.currency || 'NGN',
      basis: String(offer.basis || '').slice(0, 2000),
      excess: offer.excess === undefined ? null : Number(offer.excess),
      deductions: Array.isArray(offer.deductions) ? offer.deductions.map((d) => ({ label: String(d.label).slice(0, 200), amount: Number(d.amount) })) : [],
      issuedAt: now,
      issuedByUid: actor.uid || null,
      status: 'offered',
      dvUrl: offer.dvUrl || null,
      queryReason: null,
    });
  }
  if (step === 'offer_queried') {
    const latest = next.offers[next.offers.length - 1];
    if (!latest || latest.status !== 'offered') {
      const err = new Error('There is no open offer to query');
      err.code = 'INVALID_TRANSITION';
      throw err;
    }
    next.offers[next.offers.length - 1] = { ...latest, status: 'queried', queryReason: String(queryReason).slice(0, 2000), queriedAt: now };
  }
  if (step === 'offer_accepted') {
    const latest = next.offers[next.offers.length - 1];
    if (!latest || latest.status !== 'offered') {
      const err = new Error('There is no open offer to accept');
      err.code = 'INVALID_TRANSITION';
      throw err;
    }
    next.offers[next.offers.length - 1] = { ...latest, status: 'accepted', acceptedAt: now };
  }
  if (step === 'declined') {
    next.decision = { outcome: 'decline', reason: String(reason).slice(0, 2000), at: now, byUid: actor.uid || null };
  }
  if (step === 'coverage_confirmed' || step === 'assessed') {
    next.decision = { outcome: 'proceed', reason: String(note || '').slice(0, 2000), at: now, byUid: actor.uid || null };
  }
  if (step === 'payment_processed') {
    next.payment = {
      reference: String(payment.reference || '').slice(0, 200),
      amount: payment.amount === undefined ? null : Number(payment.amount),
      currency: payment.currency || 'NGN',
      paidAt: payment.paidAt || now,
      confirmedAt: null,
    };
  }
  if (step === 'payment_confirmed') {
    next.payment = { ...(next.payment || {}), confirmedAt: now };
  }
  if (step === 'closed') {
    next.closedAt = now;
  }

  return { claim: next, status: legacyStatusForStage(next.stage) };
}

module.exports = {
  STAGES,
  STAGE_LABELS,
  STEPS,
  TRANSITIONS,
  STEP_REQUIREMENTS,
  CUSTOMER_STAGES,
  legacyStatusForStage,
  stepFromLegacyStatus,
  isValidStep,
  canTransition,
  stageIndex,
  initialClaimBlock,
  applyTransition,
};
