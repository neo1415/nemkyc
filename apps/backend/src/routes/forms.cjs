'use strict';

// Node's crypto module: the `crypto` global is WebCrypto and has no randomBytes/createHash.
const crypto = require('crypto');

/**
 * Customer form submissions and staff form data access. Extracted verbatim from server.js.
 *
 * Two registration points, because Express registration order is behaviour (checked against
 * scripts/route-table.baseline.jsonl) and the auth + verification routes sit between them:
 *   register(app, ctx)   retired /submit-* routes, register-user, download, sample events,
 *                        public upload and /api/submit-form with guest provisioning
 *   dataRoutes(app, ctx) form listing/detail/document download, status update (with the claim
 *                        lifecycle and events modules registered in their original positions),
 *                        multi-collection listing, deletion and PDF download logging
 */

module.exports = function register(app, ctx) {
  const {
    admin,
    bucket,
    buildAdminSubmissionDeepLink,
    buildCustomerDashboardLink,
    claimLifecycle,
    db,
    generateSetPasswordEmail,
    generateTicketId,
    getAllAdminEmails,
    getAllClaimCollections,
    getCustomerFormConfig,
    getEmailsByRoles,
    getClaimStaffEmails,
    normalizeNotificationEmails,
    getLocationFromIP,
    getUserDetailsForLogging,
    guestProvisionLimiter,
    isClaimFormType,
    logAction,
    logAuditSecurityEvent,
    logger,
    publicFormSubmissionLimiter,
    publicUploadLimiter,
    requireAuth,
    requireAuthOrGuest,
    requireCompliance,
    requireSuperAdmin,
    resolveClaimFormConfig,
    resolveClaimNotificationEmails,
    sanitizeHtmlFields,
    sendEmail,
    sendEmailToAdmins,
    upload,
    uuidv4,
    validateCollectionName,
    validateFormSubmission,
  } = ctx;

// Legacy getFormData function - kept for backward compatibility
async function getFormData(req, res, collectionName){
  const dataRef = db.collection(collectionName);
  const q = dataRef.orderBy('timestamp', 'desc');
  const snapshot = await q.get();

  const data = snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...doc.data(),
    };
  });

  res.json(data);
}

// ✅ NEW: Form viewing with EVENT LOGGING
// ✅ PROTECTED: Requires authentication, users can view their own or admins can view all
// NOTE: GET /api/forms/:collection/:id is defined once, further below, with an ownership check.

// ✅ KYC Form Submissions with EVENT LOGGING
const rejectDeprecatedSubmissionRoute = (_req, res) => res.status(410).json({
  error: 'This submission endpoint has been retired',
  message: 'Please refresh the application and submit the form again.'
});

app.post('/submit-kyc-individual', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Individual KYC form submission received');
  await handleFormSubmission(req, res, 'Individual KYC', 'kyc-individual', req.body.submittedByUid);
});

app.post('/submit-kyc-corporate', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Corporate KYC form submission received');
  await handleFormSubmission(req, res, 'Corporate KYC', 'kyc-corporate', req.body.submittedByUid);
});

// ✅ CDD Form Submissions with EVENT LOGGING
app.post('/submit-cdd-individual', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Individual CDD form submission received');
  await handleFormSubmission(req, res, 'Individual CDD', 'cdd-individual', req.body.submittedByUid);
});

app.post('/submit-cdd-corporate', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Corporate CDD form submission received');
  await handleFormSubmission(req, res, 'Corporate CDD', 'cdd-corporate', req.body.submittedByUid);
});

app.post('/submit-cdd-agents', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Agents CDD form submission received');
  await handleFormSubmission(req, res, 'Agents CDD', 'cdd-agents', req.body.submittedByUid);
});

app.post('/submit-cdd-brokers', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Brokers CDD form submission received');
  await handleFormSubmission(req, res, 'Brokers CDD', 'cdd-brokers', req.body.submittedByUid);
});

app.post('/submit-cdd-partners', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Partners CDD form submission received');
  await handleFormSubmission(req, res, 'Partners CDD', 'cdd-partners', req.body.submittedByUid);
});

// ✅ Claims Submissions with EVENT LOGGING
app.post('/submit-claim-motor', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Motor claim form submission received');
  await handleFormSubmission(req, res, 'Motor Claim', 'claims-motor', req.body.submittedByUid);
});

app.post('/submit-claim-fire', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Fire & Special Perils claim submission received');
  await handleFormSubmission(req, res, 'Fire & Special Perils Claim', 'claims-fire-special-perils', req.body.submittedByUid);
});

app.post('/submit-claim-burglary', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 Burglary claim form submission received');
  await handleFormSubmission(req, res, 'Burglary Claim', 'claims-burglary', req.body.submittedByUid);
});

app.post('/submit-claim-all-risk', rejectDeprecatedSubmissionRoute, async (req, res) => {
  console.log('📝 All Risk claim form submission received');
  await handleFormSubmission(req, res, 'All Risk Claim', 'claims-all-risk', req.body.submittedByUid);
});

// ✅ User Registration with EVENT LOGGING
app.post('/api/register-user', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { email, displayName, role = 'user' } = req.body;
    
    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and displayName are required' });
    }
    
    // Create user in Firebase Auth (this is a simplified version)
    // In practice, you'd use proper user creation methods
    
    // 📝 LOG THE REGISTRATION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'register',
      actorUid: null, // New user, no UID yet
      actorDisplayName: displayName,
      actorEmail: email,
      actorRole: role,
      targetType: 'user',
      targetId: email, // Use email as temporary ID
      details: {
        registrationMethod: 'admin-created',
        assignedRole: role
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        registrationTimestamp: new Date().toISOString()
      }
    });
    
    res.status(201).json({ 
      message: 'User registration logged successfully',
      email,
      displayName,
      role 
    });
    
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ✅ File Download Tracking with EVENT LOGGING
app.get('/api/download/:fileType/:documentId', requireAuth, requireCompliance, async (req, res) => {
  try {
    const { fileType, documentId } = req.params;
    const { downloaderUid, fileName } = req.query;
    
    // Get downloader details if UID provided
    let downloaderDetails = { displayName: null, email: null, role: null };
    if (downloaderUid) {
      downloaderDetails = await getUserDetailsForLogging(downloaderUid);
    }
    
    // 📝 LOG THE FILE DOWNLOAD EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'file-download',
      actorUid: downloaderUid || null,
      actorDisplayName: downloaderDetails.displayName,
      actorEmail: downloaderDetails.email,
      actorRole: downloaderDetails.role,
      targetType: 'file',
      targetId: documentId,
      details: {
        fileType: fileType,
        fileName: fileName || `${fileType}-${documentId}`,
        downloadMethod: 'direct-link'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        downloadTimestamp: new Date().toISOString(),
        fileSize: 'unknown' // Could be calculated if needed
      }
    });
    
    // In a real implementation, you'd serve the actual file here
    res.json({ 
      message: `File download logged: ${fileName || fileType}`,
      documentId,
      fileType
    });
    
  } catch (error) {
    console.error('Error logging file download:', error);
    res.status(500).json({ error: 'File download logging failed' });
  }
});

// ✅ Generate Sample Events for Testing (DEVELOPMENT ONLY)
app.post('/api/generate-sample-events', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Sample events can only be generated in development' });
    }
    
    const sampleEvents = [
      {
        action: 'submit',
        actorDisplayName: 'John Doe',
        actorEmail: 'john.doe@example.com',
        actorRole: 'user',
        targetType: 'kyc-form',
        targetId: 'sample-kyc-123',
        details: { formType: 'Individual KYC', status: 'processing' }
      },
      {
        action: 'approve',
        actorDisplayName: 'Admin User',
        actorEmail: 'admin@nem-insurance.com',
        actorRole: 'admin',
        targetType: 'claim',
        targetId: 'sample-claim-456',
        details: { from: { status: 'pending' }, to: { status: 'approved' } }
      },
      {
        action: 'view',
        actorDisplayName: 'Jane Smith',
        actorEmail: 'jane.smith@nem-insurance.com',
        actorRole: 'compliance',
        targetType: 'cdd-form',
        targetId: 'sample-cdd-789',
        details: { viewType: 'form-detail' }
      },
      {
        action: 'login',
        actorDisplayName: 'Bob Wilson',
        actorEmail: 'bob.wilson@example.com',
        actorRole: 'user',
        targetType: 'user',
        targetId: 'user-123',
        details: { loginMethod: 'email-password', success: true }
      }
    ];
    
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    
    for (const event of sampleEvents) {
      await logAction({
        ...event,
        actorUid: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ipMasked: req.ipData?.masked || '192.168.1.***',
        ipHash: req.ipData?.hash || 'sample-hash',
        rawIP: req.ipData?.raw || '192.168.1.100',
        location: location,
        userAgent: req.headers['user-agent'] || 'Sample Browser',
        meta: { 
          sampleEvent: true,
          generatedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('✅ Generated sample events for testing');
    res.json({ 
      message: 'Sample events generated successfully',
      eventsGenerated: sampleEvents.length
    });
    
  } catch (error) {
    console.error('Error generating sample events:', error);
    res.status(500).json({ error: 'Failed to generate sample events' });
  }
});

// Enhanced form submission function with EVENT LOGGING and TICKET ID
async function handleFormSubmission(req, res, formType, collectionName, userUid = null) {
  const formData = req.body;

  // Perform validation as needed here...

  try {
    const docId = uuidv4();
    
    // Generate unique ticket ID for this submission
    // Requirements: 3.1, 3.2, 3.3, 3.4
    let ticketIdResult;
    try {
      ticketIdResult = await generateTicketId(formType);
      logger.info(`Generated ticket ID ${ticketIdResult.ticketId} for ${formType} submission`);
    } catch (ticketError) {
      // Fallback: use UUID-based ID if ticket generation fails
      logger.error('Failed to generate ticket ID, using fallback:', ticketError.message);
      ticketIdResult = {
        ticketId: `GEN-${Date.now().toString().slice(-8)}`,
        prefix: 'GEN',
        number: Date.now().toString().slice(-8)
      };
    }

    // Add form to the Firestore collection with ticket ID
    await admin.firestore().collection(collectionName).doc(docId).set({
      ...formData,
      ticketId: ticketIdResult.ticketId, // Store the ticket ID
      status: 'processing',   
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: userUid, // Track who submitted it
    });

    // 📝 LOG THE FORM SUBMISSION EVENT
    let userDetails = { displayName: null, email: null, role: null };
    if (userUid) {
      userDetails = await getUserDetailsForLogging(userUid);
    }
    
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'submit',
      actorUid: userUid,
      actorDisplayName: userDetails.displayName || formData?.name || formData?.companyName,
      actorEmail: userDetails.email || formData?.email,
      actorRole: userDetails.role,
      targetType: collectionName.replace(/s$/, ''), // Remove 's' from collection name (e.g., 'claims' -> 'claim')
      targetId: docId,
      details: {
        formType: formType,
        ticketId: ticketIdResult.ticketId, // Include ticket ID in log
        status: 'processing',
        submitterName: formData?.name || formData?.companyName || 'Unknown',
        submitterEmail: formData?.email || 'Unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formType: formType,
        ticketId: ticketIdResult.ticketId, // Include ticket ID in meta
        collectionName: collectionName,
        submissionId: docId
      }
    });

    // Fetch admin emails
    const adminEmails = await getAllAdminEmails();

    // Send email to admins if found
    if (adminEmails.length > 0) {
      await sendEmailToAdmins(adminEmails, formType, formData);
      
      // 📝 LOG THE EMAIL NOTIFICATION EVENT
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: adminEmails.join(','),
        details: {
          emailType: 'admin-notification',
          formType: formType,
          recipients: adminEmails
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docId,
          adminCount: adminEmails.length
        }
      });
    }

    // Fetch document and format created date
    const doc = await admin.firestore().collection(collectionName).doc(docId).get();
    const createdAtTimestamp = doc.data().timestamp;
    const createdAtDate = createdAtTimestamp.toDate();
    const formattedDate = `${String(createdAtDate.getDate()).padStart(2, '0')}/${String(createdAtDate.getMonth() + 1).padStart(2, '0')}/${String(createdAtDate.getFullYear())}`;

    // Update the document with formatted date
    await admin.firestore().collection(collectionName).doc(docId).update({
      createdAt: formattedDate,
    });

    res.status(201).json({ 
      message: 'Form submitted successfully',
      documentId: docId,
      ticketId: ticketIdResult.ticketId // Return ticket ID in response (Requirements: 3.4)
    });
  } catch (err) {
    console.error('Error during form submission:', err);
    res.status(500).json({ error: 'Form submission failed' });
  }
}

// ============= FORM SUBMISSION BACKEND ENDPOINTS =============

/**
 * Creates the account behind a guest submission: a Firebase user with an unguessable password
 * that is never disclosed, plus the `users` and `userroles` profiles. The person receives a
 * set-your-password link by email, so no credential ever travels in mail.
 * Throws { code: 'ACCOUNT_EXISTS' } when the email already belongs to a user.
 */
async function provisionGuestAccount(guest, req) {
  const email = String(guest.email).trim().toLowerCase();
  const name = String(guest.name).trim();

  try {
    await admin.auth().getUserByEmail(email);
    const exists = new Error('An account already exists for this email');
    exists.code = 'ACCOUNT_EXISTS';
    throw exists;
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error;
  }

  const userRecord = await admin.auth().createUser({
    email,
    displayName: name,
    password: crypto.randomBytes(32).toString('base64url'),
    emailVerified: false
  });
  const uid = userRecord.uid;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  batch.set(db.collection('users').doc(uid), {
    uid,
    email,
    name,
    displayName: name,
    role: 'default',
    provisionedBy: 'guest-submission',
    mustChangePassword: false,
    createdAt: now,
    updatedAt: now
  });
  batch.set(db.collection('userroles').doc(uid), {
    uid,
    email,
    name,
    role: 'default',
    provisionedBy: 'guest-submission',
    dateCreated: now,
    dateModified: now
  });
  batch.set(db.collection('loginMetadata').doc(uid), {
    loginCount: 0,
    createdAt: now
  });
  await batch.commit();

  await logAuditSecurityEvent({
    eventType: 'guest_account_provisioned',
    severity: 'low',
    description: 'Account created automatically from a customer form submission',
    userId: uid,
    ipAddress: req.ip || 'unknown',
    metadata: { email }
  }).catch(() => {});

  return { uid, email, name, role: 'default' };
}

/**
 * Builds the single-use, one-hour Firebase "set your password" link that lands on the
 * frontend's /resetpassword page and then continues to the dashboard.
 */
async function buildSetPasswordLink(email) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
  return admin.auth().generatePasswordResetLink(email, {
    url: `${frontendUrl}/dashboard`,
    handleCodeInApp: false
  });
}

const ALLOWED_PUBLIC_UPLOAD_ROOTS = new Set([
  'individual-kyc', 'corporate-kyc',
  'individual-cdd', 'corporate-cdd', 'naicom-corporate-cdd',
  'partners-cdd', 'naicom-partners-cdd', 'agents-cdd', 'brokers-cdd',
  'individual-nfiu', 'corporate-nfiu',
  'combined-gpa-employers-liability-claims', 'motor-claims', 'burglary-claims',
  'fire-special-perils-claims', 'all-risk-claims', 'goods-in-transit-claims',
  'money-insurance-claims', 'employers-liability-claims', 'public-liability-claims',
  'professional-indemnity-claims', 'fidelity-guarantee-claims', 'contractors-claims',
  'group-personal-accident-claims', 'rent-assurance-claims',
  // Keep uploads aligned with the canonical claims registry so new and existing
  // Smart, Home, and agricultural claim forms cannot fail at the upload boundary.
  ...getAllClaimCollections()
]);

// Upload customer documents through the backend so Firebase Storage can deny
// anonymous writes. Return an internal gs:// reference instead of issuing a
// permanent bearer download token.
app.post('/api/public/upload', publicUploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'A document is required' });
    }

    const requestedPath = String(req.body?.path || '');
    const root = requestedPath.split('/')[0].trim().toLowerCase();
    if (!ALLOWED_PUBLIC_UPLOAD_ROOTS.has(root)) {
      return res.status(400).json({ error: 'Unsupported document category' });
    }

    const safeName = String(req.file.originalname || 'document')
      .normalize('NFKC')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-120);
    const objectName = `${root}/${uuidv4()}/${Date.now()}_${safeName}`;
    const object = bucket.file(objectName);

    await object.save(req.file.buffer, {
      resumable: false,
      validation: 'crc32c',
      metadata: {
        contentType: req.file.mimetype,
        cacheControl: 'private, max-age=0, no-store'
      }
    });

    return res.status(201).json({ url: `gs://${bucket.name}/${objectName}` });
  } catch (error) {
    console.error('Public document upload failed:', error);
    return res.status(500).json({
      error: 'Document upload failed',
      message: 'We could not upload this document. Please check the file and try again.'
    });
  }
});

// Centralized form submission endpoint with event logging
// Public for the customer-facing KYC/CDD forms; all other forms still require authentication.
// ✅ VALIDATED: Input validation applied
app.post('/api/submit-form', publicFormSubmissionLimiter, guestProvisionLimiter, requireAuthOrGuest, validateFormSubmission, sanitizeHtmlFields, async (req, res) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  console.log('Form submission received:', {
    requestId,
    formType: req.body?.formType,
    authenticated: Boolean(req.user)
  });
  
  try {
    const { formData, formType, userEmail } = req.body;

    // Guest submission: create the account first so the submission is bound to a real uid.
    let provisionedGuest = null;
    if (!req.user && req.body.guest) {
      try {
        provisionedGuest = await provisionGuestAccount(req.body.guest, req);
        req.user = { ...provisionedGuest, displayName: provisionedGuest.name };
      } catch (provisionError) {
        if (provisionError.code === 'ACCOUNT_EXISTS') {
          return res.status(409).json({
            error: 'Account exists',
            code: 'ACCOUNT_EXISTS',
            message: 'This email already has an account. Please sign in to submit.'
          });
        }
        console.error('❌ Guest account provisioning failed:', provisionError.message);
        return res.status(500).json({
          error: 'Account creation failed',
          message: 'We could not create your account. Please try again or sign in.'
        });
      }
    }

    const userUid = req.user?.uid || null;
    
    console.log('📝 Form submission received:', { formType, userUid, userEmail });
    
    if (!formData || !formType) {
      return res.status(400).json({ error: 'Missing formData or formType' });
    }

    // Get user details for logging if UID provided
    let userDetails = { displayName: null, email: null, role: null };
    if (userUid) {
      userDetails = await getUserDetailsForLogging(userUid);
    }

    // Determine Firestore collection based on form type
    const collectionName = getFirestoreCollection(formType);
    console.log('📂 Using collection:', collectionName);
    console.log('💾 ABOUT TO SAVE TO FIRESTORE COLLECTION:', collectionName);

    // Generate unique ticket ID for this submission
    const ticketIdResult = await generateTicketId(formType);
    const ticketId = ticketIdResult.ticketId;
    console.log('🎫 Generated ticket ID:', ticketId);

    // Get the submitter's email (prioritize userEmail, then userDetails, then formData)
    // Normalize to lowercase for consistent querying
    const rawEmail = req.user?.email || userDetails.email || userEmail || formData?.email || formData?.emailAddress;
    const submitterEmail = rawEmail ? rawEmail.toLowerCase().trim() : null;
    const personalName = [formData?.firstName, formData?.lastName].filter(Boolean).join(' ').trim();
    const submitterName = formData?.name || formData?.insuredFirstName || formData?.companyName || personalName || userDetails.displayName || 'Valued Customer';

    // Add metadata to form data
    const submissionData = {
      ...formData,
      ticketId: ticketId,
      formType: formType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toLocaleDateString('en-GB'),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: submitterEmail,
      userUid,
      submittedByUid: userUid,
      status: 'pending',
      ...(isClaimFormType(formType, collectionName) ? { claim: claimLifecycle.initialClaimBlock() } : {})
    };

    // Submit atomically with an idempotency record so retries cannot create duplicates.
    const rawIdempotencyKey = req.body.idempotencyKey || req.headers['x-idempotency-key'] || requestId;
    const idempotencyHash = crypto
      .createHash('sha256')
      .update(`${formType}:${rawIdempotencyKey}`)
      .digest('hex');
    const idempotencyRef = db.collection('form-submission-idempotency').doc(idempotencyHash);
    const docRef = db.collection(collectionName).doc();
    let duplicateSubmission = null;

    await db.runTransaction(async transaction => {
      const existingSubmission = await transaction.get(idempotencyRef);
      if (existingSubmission.exists) {
        duplicateSubmission = existingSubmission.data();
        return;
      }

      transaction.set(docRef, {
        ...submissionData,
        idempotencyKeyHash: idempotencyHash
      });
      transaction.set(idempotencyRef, {
        documentId: docRef.id,
        collectionName,
        ticketId,
        formType,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    if (duplicateSubmission) {
      console.log('Duplicate form submission safely ignored:', { requestId, formType });
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'This form was already submitted successfully.',
        documentId: duplicateSubmission.documentId,
        ticketId: duplicateSubmission.ticketId,
        collectionName: duplicateSubmission.collectionName,
        requestId
      });
    }

    console.log('✅ Document written with ID:', docRef.id);
    console.log('✅ SAVED TO COLLECTION:', collectionName);

    // 📝 LOG THE FORM SUBMISSION EVENT
    // Confirm the durable Firestore write immediately. Notification delivery must not
    // keep the customer waiting or make a successful submission appear to fail.
    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      documentId: docRef.id,
      ticketId: ticketId,
      collectionName: collectionName,
      requestId
    });

    // Audit enrichment is non-critical. A geolocation or logging outage must never
    // turn a durable Firestore write into a customer-visible submission failure.
    let location = null;
    try {
      location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
      await logAction({
        action: 'submit',
        actorUid: userUid || 'anonymous',
        actorDisplayName: userDetails.displayName || formData?.name || formData?.companyName,
        actorEmail: userDetails.email || userEmail || formData?.email || formData?.emailAddress,
        actorRole: userDetails.role,
        targetType: collectionName.replace(/s$/, ''),
        targetId: docRef.id,
        details: {
          formType,
          ticketId,
          status: 'pending',
          submitterName: formData?.name || formData?.companyName || 'Unknown',
          submitterEmail: formData?.email || formData?.emailAddress || userEmail || 'Unknown'
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: { formType, ticketId, collectionName, submissionId: docRef.id }
      });
    } catch (auditError) {
      console.error('Post-submission audit logging failed:', {
        requestId,
        message: auditError.message
      });
    }

    // Send email notifications after the response has been committed.
    try {
      const finalSubmissionData = { ...submissionData, documentId: docRef.id, collectionName };
      
      // Send user confirmation email with ticket ID
      if (submitterEmail) {
        await sendEmail(submitterEmail, 
          `${formType} Submission Confirmation - Ticket #${ticketId}`, 
          generateConfirmationEmailHTML(formType, ticketId, submitterName));
        console.log('📧 User confirmation email sent to:', submitterEmail);
      }

      // New guest account: send the set-your-password link as a separate message so the
      // credential never sits next to the submission details.
      if (provisionedGuest) {
        try {
          const setPasswordUrl = await buildSetPasswordLink(provisionedGuest.email);
          await sendEmail(provisionedGuest.email,
            'Your NEM Forms account - set your password',
            generateSetPasswordEmail({
              fullName: provisionedGuest.name,
              email: provisionedGuest.email,
              setPasswordUrl,
              ticketId,
              formType
            }));
          console.log('📧 Set-password email sent to new guest account');
        } catch (accountEmailError) {
          console.error('❌ Failed to send set-password email:', accountEmailError.message);
        }
      }

      const claimRouting = resolveClaimFormConfig(formType, collectionName);
      const isClaimsForm = isClaimFormType(formType, collectionName);

      // Claims: the unit's shared mailbox plus every account whose role/assignment covers this
      // collection (admins, super admins, assigned claims officers). Compliance: role-based.
      let notificationEmails = [];
      if (isClaimsForm) {
        const unitMailbox = claimRouting ? normalizeNotificationEmails([claimRouting.unitRecipientEmail]) : [];
        const staff = await getClaimStaffEmails(collectionName);
        notificationEmails = normalizeNotificationEmails([...unitMailbox, ...staff]);
      }
      if (notificationEmails.length === 0) {
        const adminRoles = isClaimsForm ? ['claims'] : ['compliance'];
        notificationEmails = await getEmailsByRoles(adminRoles);
      }

      if (notificationEmails.length > 0) {
        await sendEmail(
          notificationEmails,
          `New ${formType} Submission - Ticket #${ticketId} - Review Required`,
          generateAdminNotificationHTML(
            formType,
            formData,
            docRef.id,
            ticketId,
            submitterName,
            submitterEmail,
            collectionName
          )
        );
        console.log('📧 Staff notification email sent to:', notificationEmails);
      } else {
        console.warn('⚠️ No notification recipients found for submission:', { formType, collectionName });
      }

      // 📝 LOG EMAIL NOTIFICATIONS
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: (submitterEmail || 'unknown') + ',' + notificationEmails.join(','),
        details: {
          emailType: 'submission-notification',
          formType: formType,
          ticketId: ticketId,
          userEmail: submitterEmail,
          adminEmails: notificationEmails,
          claimRouting: claimRouting ? {
            policyRisk: claimRouting.policyRisk,
            unitRecipientEmail: claimRouting.unitRecipientEmail,
            unitAdminEmail: claimRouting.unitAdminEmail
          } : null
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docRef.id,
          ticketId: ticketId,
          emailCount: notificationEmails.length + 1
        }
      });

    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail submission if email fails
    }

  } catch (error) {
    console.error('Form submission error:', { requestId, message: error.message, code: error.code });
    if (res.headersSent) {
      return;
    }
    res.status(500).json({
      error: 'Form submission failed',
      message: 'We could not submit your form right now. Your information is still available on this page; please wait a moment and try again.',
      requestId
    });
  }
});

// Helper function to determine Firestore collection based on form type
const getFirestoreCollection = (formType) => {
  const formTypeLower = formType.toLowerCase();
  console.log('🔍 getFirestoreCollection called with formType:', formType);
  console.log('🔍 formTypeLower:', formTypeLower);
  
  const claimFormConfig = resolveClaimFormConfig(formType);
  const customerFormConfig = getCustomerFormConfig(formType);
  let collection = claimFormConfig?.collection || customerFormConfig?.collection;
  
  if (claimFormConfig) {
    console.log('Matched claim form routing:', claimFormConfig);
  } else if (customerFormConfig?.collection) {
    console.log('Matched customer form routing:', customerFormConfig);
  } else if (!collection && formTypeLower.includes('combined')) collection = 'combined-gpa-employers-liability-claims';
  else if (!collection && formTypeLower.includes('motor') && !formTypeLower.includes('smart')) collection = 'motor-claims';
  else if (!collection && formTypeLower.includes('burglary')) collection = 'burglary-claims';
  else if (!collection && formTypeLower.includes('fire')) collection = 'fire-special-perils-claims';
  else if (!collection && (formTypeLower.includes('allrisk') || formTypeLower.includes('all risk'))) collection = 'all-risk-claims';
  else if (!collection && formTypeLower.includes('goods')) collection = 'goods-in-transit-claims';
  else if (!collection && formTypeLower.includes('money')) collection = 'money-insurance-claims';
  else if (!collection && formTypeLower.includes('employers')) collection = 'employers-liability-claims';
  else if (!collection && formTypeLower.includes('public')) collection = 'public-liability-claims';
  else if (!collection && formTypeLower.includes('professional')) collection = 'professional-indemnity-claims';
  else if (!collection && formTypeLower.includes('fidelity')) collection = 'fidelity-guarantee-claims';
  else if (!collection && formTypeLower.includes('contractors')) collection = 'contractors-claims';
  else if (!collection && formTypeLower.includes('group')) collection = 'group-personal-accident-claims';
  else if (!collection && formTypeLower.includes('rent')) collection = 'rent-assurance-claims';
  
  // NEM Smart Protection Claims
  else if (!collection && formTypeLower.includes('smart motorist protection')) collection = 'smart-motorist-protection-claims';
  else if (!collection && formTypeLower.includes('smart students protection')) collection = 'smart-students-protection-claims';
  else if (!collection && formTypeLower.includes('smart traveller protection')) collection = 'smart-traveller-protection-claims';
  else if (!collection && formTypeLower.includes('smart artisan protection')) collection = 'smart-artisan-protection-claims';
  else if (!collection && formTypeLower.includes('smart generation z protection')) collection = 'smart-generation-z-protection-claims';
  else if (!collection && formTypeLower.includes('nem home protection')) collection = 'nem-home-protection-claims';
  
  // NEM Agricultural Claims
  else if (!collection && formTypeLower.includes('livestock')) collection = 'livestock-claims';
  else if (!collection && (formTypeLower.includes('poultry') || formTypeLower === 'poultry claim')) collection = 'poultry-claims';
  else if (!collection && (formTypeLower.includes('fishery') || formTypeLower.includes('fish farm') || formTypeLower === 'fishery fish farm')) collection = 'fishery-fish-farm-claims';
  else if (!collection && formTypeLower.includes('farm') && (formTypeLower.includes('property') || formTypeLower.includes('produce'))) collection = 'farm-property-produce-claims';
  else if (!collection && formTypeLower.includes('yield index')) collection = 'yield-index-claims';
  else if (!collection && (formTypeLower.includes('multi-perils crop') || formTypeLower.includes('multi perils crop'))) collection = 'multi-perils-crop-claims';
  
  // KYC forms
  else if (formTypeLower.includes('individual') && formTypeLower.includes('kyc')) {
    console.log('✅ Matched: Individual KYC -> Individual-kyc-form');
    collection = 'Individual-kyc-form';
  }
  else if (formTypeLower.includes('corporate') && formTypeLower.includes('kyc')) {
    console.log('✅ Matched: Corporate KYC -> corporate-kyc-form');
    collection = 'corporate-kyc-form';
  }
  
  // NFIU forms
  else if (formTypeLower.includes('individual') && formTypeLower.includes('nfiu')) {
    console.log('✅ Matched: Individual NFIU -> individual-nfiu-form');
    collection = 'individual-nfiu-form';
  }
  else if (formTypeLower.includes('corporate') && formTypeLower.includes('nfiu')) {
    console.log('✅ Matched: Corporate NFIU -> corporate-nfiu-form');
    collection = 'corporate-nfiu-form';
  }
  
  // CDD forms
  else if (formTypeLower.includes('individual') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Individual CDD -> individual-kyc');
    collection = 'individual-kyc';
  }
  else if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Corporate CDD (or NAICOM Corporate CDD) -> corporate-kyc');
    collection = 'corporate-kyc';
  }
  else if (formTypeLower.includes('agents') && formTypeLower.includes('cdd')) collection = 'agentsCDD';
  else if (formTypeLower.includes('brokers') && formTypeLower.includes('cdd')) {
    console.log('✅ Matched: Brokers CDD -> brokers-kyc');
    collection = 'brokers-kyc';
  }
  else if (formTypeLower.includes('partners') && formTypeLower.includes('cdd')) collection = 'partnersCDD';
  
  else {
    console.log('⚠️ No match found, using default: formSubmissions');
    collection = 'formSubmissions';
  }
  
  // Validate against whitelist
  return validateCollectionName(collection);
};

// Helper functions for email HTML generation
const generateConfirmationEmailHTML = (formType, ticketId, userName = 'Valued Customer') => {
  const dashboardUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
  const customerDashboardLink = buildCustomerDashboardLink(dashboardUrl);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #800020;">Thank you for your submission!</h2>
        <p>Dear ${userName},</p>
        <p>We have successfully received your <strong>${formType}</strong> form.</p>
        
        <div style="background: #fff; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Your Ticket ID</p>
          <h2 style="margin: 10px 0; color: #800020; font-size: 28px; letter-spacing: 2px;">${ticketId}</h2>
          <p style="margin: 0; font-size: 12px; color: #666;">Please reference this ID in all future correspondence</p>
        </div>
        
        <p>Our team will review your submission and get back to you shortly.</p>
        <p>You can track your submission status by logging into your dashboard:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${customerDashboardLink}" style="background: #800020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            View or Track Submission
          </a>
        </div>
        
        <p>We will notify you via email once your submission has been reviewed.</p>
        
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated email. Please do not reply to this message.<br>
          If you have any questions, please contact our support team.
        </p>
        <p>Best regards,<br><strong>NEM Insurance Team</strong></p>
      </div>
    </div>
  `;
};

const generateAdminNotificationHTML = (formType, formData, documentId, ticketId, submitterName, submitterEmail, collectionName) => {
  const adminDashboardUrl = process.env.FRONTEND_URL || 'https://nemforms.com';
  const reviewUrl = buildAdminSubmissionDeepLink(collectionName, documentId, adminDashboardUrl);
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #800020, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #800020;">New ${formType} Submission</h2>
        <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
        
        <div style="background: #fff; border: 2px solid #800020; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #666;">Ticket ID</p>
          <h2 style="margin: 10px 0; color: #800020; font-size: 24px; letter-spacing: 2px;">${ticketId}</h2>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Submitter Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submitterName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${submitterEmail || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Document ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-family: monospace;">${documentId}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #666;">Phone:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formData?.phone || formData?.phoneNumber || 'N/A'}</td>
          </tr>
        </table>
        
        <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-left: 4px solid #DAA520; border-radius: 4px;">
          <p style="margin: 0; color: #856404;"><strong>⚠️ Action Required:</strong> Please review this submission in the admin dashboard.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" style="background: #800020; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Review Submission Securely
          </a>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center;">
          Sign in to view the full submission, uploaded documents, and download the PDF from the platform.
        </p>
        
        <hr style="border: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from NEM Forms System. Sensitive details are not attached to this email.
        </p>
        <p>Best regards,<br><strong>NEM Forms System</strong></p>
      </div>
    </div>
  `;
};
};

module.exports.dataRoutes = function dataRoutes(app, ctx) {
  const {
    admin,
    db,
    getLocationFromIP,
    getStorage,
    getUserDetailsForLogging,
    isClaimsOrAdminOrCompliance,
    logAction,
    requireAuth,
    requireClaims,
    resolveAssignedClaimCollections,
    resolveClaimFormConfig,
    sanitizeHtmlFields,
    sendEmail,
    validateCollectionName,
    validateFormStatusUpdate,
  } = ctx;

// ============= DATA RETRIEVAL BACKEND ENDPOINTS =============

// Get forms data with event logging
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
app.get('/api/forms/:collection', requireAuth, requireClaims, async (req, res) => {
  try {
    const { collection } = req.params;
    const { page = 1, limit = 50 } = req.query;
    validateCollectionName(collection);
    const viewerUid = req.user.uid;
    
    console.log(`📊 Forms data request for collection: ${collection}`);
    console.log('👤 Requested by:', req.user.email, 'Role:', req.user.role);
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    // Build query
    let query = db.collection(collection);
    
    // Apply pagination
    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;
    
    query = query.orderBy('timestamp', 'desc');
    
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }
    
    query = query.limit(limitNum);
    const snapshot = await query.get();
    
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get total count for pagination
    const totalSnapshot = await db.collection(collection).get();
    const totalCount = totalSnapshot.size;

    // 📝 LOG THE DATA RETRIEVAL EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'collection',
      targetId: collection,
      details: {
        viewType: 'table-data',
        recordCount: data.length,
        page: pageNum,
        limit: limitNum
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        totalRecords: totalCount,
        paginationInfo: { page: pageNum, limit: limitNum, offset }
      }
    });

    res.json({
      data,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });

  } catch (error) {
    console.error(`Error fetching forms data from ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to fetch forms data', details: error.message });
  }
});

const resolveManagedStorageObject = (storedValue, expectedBucketName) => {
  const rawValue = typeof storedValue === 'string' ? storedValue : storedValue?.url;
  if (!rawValue || typeof rawValue !== 'string') return null;

  if (rawValue.startsWith('gs://')) {
    const withoutScheme = rawValue.slice(5);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex < 1) return null;
    const bucketName = withoutScheme.slice(0, slashIndex);
    return bucketName === expectedBucketName ? withoutScheme.slice(slashIndex + 1) : null;
  }

  try {
    const parsed = new URL(rawValue);
    if (parsed.hostname === 'firebasestorage.googleapis.com') {
      const match = parsed.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);
      if (!match || decodeURIComponent(match[1]) !== expectedBucketName) return null;
      return decodeURIComponent(match[2]);
    }
    if (parsed.hostname === 'storage.googleapis.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts.shift() !== expectedBucketName || parts.length === 0) return null;
      return decodeURIComponent(parts.join('/'));
    }
  } catch {
    return null;
  }

  return null;
};

// Download stored submission documents through the authenticated application.
// Raw Firebase token URLs are never opened in the browser or placed in its address bar.
app.get('/api/forms/:collection/:id/documents/:field', requireAuth, async (req, res) => {
  try {
    const { collection, id, field } = req.params;
    validateCollectionName(collection);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(field)) {
      return res.status(400).json({ error: 'Invalid document field' });
    }

    const claimConfig = resolveClaimFormConfig(null, collection);
    const staffRoles = new Set(['claims', 'compliance', 'admin', 'super admin']);
    if (req.user.role === 'claims') {
      if (!claimConfig) {
        return res.status(403).json({ error: 'You do not have access to this document' });
      }
      const assignments = resolveAssignedClaimCollections(req.user);
      if (assignments !== null && !assignments.includes(collection)) {
        return res.status(403).json({ error: 'You do not have access to this claim type' });
      }
    }

    const submission = await db.collection(collection).doc(id).get();
    if (!submission.exists) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = submission.data();
    if (!staffRoles.has(req.user.role)) {
      const ownerIds = [submissionData.userUid, submissionData.userId, submissionData.uid,
        submissionData.submittedByUid, submissionData.submittedBy].filter(Boolean);
      const ownerEmails = [submissionData.userEmail, submissionData.email, submissionData.emailAddress,
        submissionData.submittedByEmail, submissionData.submittedBy]
        .filter(Boolean)
        .map((value) => String(value).trim().toLowerCase());
      const isOwner = ownerIds.includes(req.user.uid)
        || ownerEmails.includes(String(req.user.email || '').trim().toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have access to this document' });
      }
    }

    const bucket = getStorage().bucket();
    const objectName = resolveManagedStorageObject(submissionData[field], bucket.name);
    if (!objectName || objectName.includes('\0')) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const storageFile = bucket.file(objectName);
    const [exists] = await storageFile.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const [metadata] = await storageFile.getMetadata();
    const safeName = (objectName.split('/').pop() || 'document')
      .replace(/[\r\n"\\]/g, '_')
      .slice(0, 180);
    res.set({
      'Content-Type': metadata.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Content-Type-Options': 'nosniff'
    });
    storageFile.createReadStream()
      .on('error', (error) => {
        console.error('Secure document stream failed:', error.message);
        if (!res.headersSent) res.status(500).json({ error: 'Document download failed' });
        else res.destroy(error);
      })
      .pipe(res);
  } catch (error) {
    console.error('Secure document download failed:', error.message);
    if (!res.headersSent) res.status(500).json({ error: 'Document download failed' });
  }
});

// Get specific form by ID with event logging
// ✅ PROTECTED: Requires authentication, users can view their own or admins can view all
app.get('/api/forms/:collection/:id', requireAuth, async (req, res) => {
  try {
    const { collection, id } = req.params;
    validateCollectionName(collection);
    const viewerUid = req.user.uid;
    
    console.log('👤 Form detail requested by:', req.user.email, 'Role:', req.user.role);
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    const doc = await db.collection(collection).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = {
      id: doc.id,
      ...doc.data()
    };

    if (!isClaimsOrAdminOrCompliance(req.user.role)) {
      const ownerIds = [data.userUid, data.userId, data.uid, data.submittedBy].filter(Boolean);
      const ownerEmails = [data.userEmail, data.email, data.emailAddress, data.submittedByEmail]
        .filter(Boolean)
        .map(value => String(value).trim().toLowerCase());
      const isOwner = ownerIds.includes(req.user.uid) || ownerEmails.includes(String(req.user.email).toLowerCase());
      if (!isOwner) {
        return res.status(403).json({ error: 'You do not have access to this submission' });
      }
    }

    // 📝 LOG THE DOCUMENT VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: collection,
      targetId: id,
      details: {
        viewType: 'form-detail',
        formType: data.formType || 'unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id
      }
    });

    res.json(data);

  } catch (error) {
    console.error(`Error fetching document ${req.params.id} from ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

// ============= FORM EDITING AND STATUS UPDATE ENDPOINTS =============
require('./claims.cjs')(app, ctx);

// Update form status with event logging
// ✅ PROTECTED: Requires claims, compliance, admin, or super admin role
// ✅ VALIDATED: Input validation applied
app.put('/api/forms/:collection/:id/status', requireAuth, requireClaims, validateFormStatusUpdate, sanitizeHtmlFields, async (req, res) => {
  try {
    const { collection, id } = req.params;
    validateCollectionName(collection);
    const { status, comment, userEmail, formType } = req.body;
    const updaterUid = req.user.uid;
    
    console.log('👤 Status update by:', req.user.email, 'Role:', req.user.role);

    // Get document before update for logging
    const docBefore = await db.collection(collection).doc(id).get();
    if (!docBefore.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const beforeData = docBefore.data();
    
    // Get updater details
    const updaterDetails = await getUserDetailsForLogging(updaterUid);
    
    // Update document
    const updateData = {
      status: status,
      updatedBy: updaterUid,
      updaterName: updaterDetails.displayName || updaterDetails.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (comment) {
      updateData.updateComment = comment;
    }
    
    await db.collection(collection).doc(id).update(updateData);

    // 📝 LOG THE STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'status-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: collection,
      targetId: id,
      details: {
        from: { status: beforeData.status || 'unknown' },
        to: { status: status },
        comment: comment,
        formType: formType || beforeData.formType
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id,
        userEmail: userEmail,
        updaterName: updaterDetails.displayName || updaterDetails.email
      }
    });

    // Send status update email if user email provided
    if (userEmail && formType) {
      try {
        const isApproved = status === 'approved';
        const statusText = isApproved ? 'approved' : (status === 'rejected' ? 'rejected' : 'updated');
        const statusColor = isApproved ? '#22c55e' : (status === 'rejected' ? '#ef4444' : '#f59e0b');
        const statusEmoji = isApproved ? '🎉' : (status === 'rejected' ? '❌' : '📝');

        const subject = `${formType} Status Update - ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
        
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">NEM Insurance</h1>
            </div>
            <div style="padding: 20px; background: #f9f9f9;">
              <h2 style="color: ${statusColor};">Your ${formType} has been ${statusText}! ${statusEmoji}</h2>
              
              <p>Dear Valued Customer,</p>
              
              <p>We wanted to update you on the status of your <strong>${formType}</strong> submission.</p>
              
              <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
                <p style="margin: 0;"><strong>New Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
                <p style="margin: 5px 0 0 0;"><strong>Reference ID:</strong> ${id}</p>
                ${comment ? `<p style="margin: 5px 0 0 0;"><strong>Notes:</strong> ${comment}</p>` : ''}
              </div>
              
              <p>
                <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">View Your Dashboard</a>
              </p>
              
              <p>Best regards,<br/>NEM Insurance Team</p>
            </div>
          </div>
        `;

        await sendEmail(userEmail, subject, html);
        
        // 📝 LOG EMAIL SENT EVENT
        await logAction({
          action: 'email-sent',
          actorUid: updaterUid,
          actorDisplayName: updaterDetails.displayName,
          actorEmail: updaterDetails.email,
          actorRole: updaterDetails.role,
          targetType: 'email',
          targetId: userEmail,
          details: {
            emailType: `status-${status}`,
            subject: subject
          },
          ipMasked: req.ipData?.masked,
          ipHash: req.ipData?.hash,
          rawIP: req.ipData?.raw,
          location: location,
          userAgent: req.headers['user-agent'] || 'Unknown',
          meta: {
            emailTarget: userEmail,
            formType: formType,
            newStatus: status,
            relatedDocument: id
          }
        });

      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      updatedBy: updaterDetails.displayName || updaterDetails.email,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update status', details: error.message });
  }
});

require('./events.cjs')(app, ctx);

// ============= USER MANAGEMENT ENDPOINTS WITH EVENT LOGGING =============

// ✅ NEW: Update user role with EVENT LOGGING

// ✅ NEW: Get all users with EVENT LOGGING

// ✅ NEW: Delete user with EVENT LOGGING

// ============= ADDITIONAL FORMS BACKEND ENDPOINTS =============

// Get forms from multiple collections (for CDD and Claims tables)
app.post('/api/forms/multiple', requireAuth, requireClaims, async (req, res) => {
  try {
    const { collections } = req.body;
    
    if (!Array.isArray(collections)) {
      return res.status(400).json({ error: 'Collections must be an array' });
    }

    if (collections.length === 0 || collections.length > 25) {
      return res.status(400).json({ error: 'Choose between 1 and 25 collections' });
    }
    collections.forEach(validateCollectionName);
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    const userAuth = req.headers.authorization;
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for multiple forms fetch:', err);
      }
    }
    
    console.log(`📊 Fetching forms from multiple collections: ${collections.join(', ')}`);
    
    const allForms = [];
    let totalRecords = 0;
    
    for (const collectionName of collections) {
      try {
        const formsRef = db.collection(collectionName);
        let snapshot;
        
        // Try different timestamp fields for ordering
        try {
          snapshot = await formsRef.orderBy('timestamp', 'desc').get();
          if (snapshot.docs.length === 0) {
            snapshot = await formsRef.orderBy('submittedAt', 'desc').get();
            if (snapshot.docs.length === 0) {
              snapshot = await formsRef.orderBy('createdAt', 'desc').get();
              if (snapshot.docs.length === 0) {
                snapshot = await formsRef.get();
              }
            }
          }
        } catch (error) {
          snapshot = await formsRef.get();
        }
        
        snapshot.docs.forEach(doc => {
          allForms.push({
            id: doc.id,
            collection: collectionName,
            ...doc.data()
          });
        });
        
        totalRecords += snapshot.docs.length;
        console.log(`✅ Fetched ${snapshot.docs.length} forms from ${collectionName}`);
        
      } catch (error) {
        console.error(`Error fetching from collection ${collectionName}:`, error);
      }
    }

    // 📝 LOG MULTIPLE COLLECTIONS RETRIEVAL EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view-multiple-forms-data',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'forms-collections',
      targetId: collections.join(','),
      details: {
        collections: collections,
        recordsCount: totalRecords,
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        accessTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Successfully fetched ${totalRecords} total forms from ${collections.length} collections`);
    res.status(200).json({ data: allForms });
    
  } catch (error) {
    console.error('Error fetching multiple collections:', error);
    res.status(500).json({ error: 'Failed to fetch forms from multiple collections' });
  }
});

// Update form status with event logging

// Delete form with event logging
app.delete('/api/forms/:collectionName/:formId', requireAuth, requireClaims, async (req, res) => {
  try {
    const { collectionName, formId } = req.params;
    validateCollectionName(collectionName);
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    const userAuth = req.headers.authorization;
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for form deletion:', err);
      }
    }
    
    // Get current form data for logging
    const formDoc = await db.collection(collectionName).doc(formId).get();
    const formData = formDoc.exists ? formDoc.data() : {};
    
    // Delete the form
    await db.collection(collectionName).doc(formId).delete();

    // 📝 LOG FORM DELETION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete-form',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'form',
      targetId: formId,
      details: {
        collection: collectionName,
        formId: formId,
        deletedFormData: {
          // Only log non-sensitive identifying info
          formType: formData.formType || collectionName,
          email: formData.email,
          createdAt: formData.createdAt || formData.timestamp,
          status: formData.status
        },
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deleteTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Deleted form ${formId} from ${collectionName}`);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// ✅ NEW: Get forms data with EVENT LOGGING

// ✅ NEW: Update form status with EVENT LOGGING

// ✅ NEW: Download PDF with EVENT LOGGING
app.post('/api/pdf/download', requireAuth, requireClaims, async (req, res) => {
  try {
    const { formData, formType, fileName } = req.body;
    const downloaderUid = req.user.uid;
    
    // Get downloader details for logging
    const downloaderDetails = await getUserDetailsForLogging(downloaderUid);

    // 📝 LOG THE PDF DOWNLOAD EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'download',
      actorUid: downloaderUid,
      actorDisplayName: downloaderDetails.displayName,
      actorEmail: downloaderDetails.email,
      actorRole: downloaderDetails.role,
      targetType: 'pdf',
      targetId: formData.id || 'unknown',
      details: {
        downloadType: 'pdf-form',
        formType: formType,
        fileName: fileName,
        formSubmitterEmail: formData.email
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formId: formData.id,
        timestamp: new Date().toISOString(),
        downloadContext: 'admin-panel'
      }
    });

    // Return success - actual PDF generation will be handled by frontend
    res.status(200).json({ 
      message: 'PDF download logged successfully',
      allowDownload: true 
    });
  } catch (error) {
    console.error('Error logging PDF download:', error);
    res.status(500).json({ error: 'Failed to log PDF download' });
  }
});
};
