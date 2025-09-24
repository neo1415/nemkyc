const express = require('express');
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser'); 
const csurf = require('csurf');
const cors = require('cors'); 
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const { body, param,validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const app = express();
const axios = require('axios');
const bcrypt = require('bcrypt'); 
const multer = require("multer");
const { getStorage } = require("firebase-admin/storage");
const crypto = require('crypto');

let config = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
};

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket:"nem-customer-feedback-8d3fb.appspot.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nem-server-rhdb.onrender.com',
  'https://nem-kyc.web.app',
  "crypto-trade-template-591.lovable.app",
  'https://preview--orangery-ventures-harmony-242.lovable.app',
  'https://3463ce13-b353-49e7-b843-5d07a684b845.lovableproject.com',
  "https://preview--psk-services-920.lovable.app",
  "https://psk-services-920.lovable.app",
  "https://glow-convert-sell-623.lovable.app",
  "https://lovable.dev/projects/50464dab-8208-4baa-91a2-13d656b2f461",
  "https://preview--glow-convert-sell-623.lovable.app",
  "https://ai-tool-hub-449.lovable.app",
  "https://lovable.dev/projects/55a3a495-1302-407f-b290-b3e36e458c6b",
  "https://preview--ai-tool-hub-449.lovable.app",
  "https://preview--fleetvision-dashboard-233.lovable.app",
  "https://nem-demo.lovable.app",
  "https://lovable.dev/projects/a070f70a-14d8-4f9a-a3c0-571ec1dec753",
  "https://nem-forms-demo-app.lovable.app",
  "https://lovable.dev/projects/ded87798-8f4c-493e-8dae-d7fa0ba10ef8",
  "https://preview--wrlds-ai-integration-4349.lovable.app",
  "https://wrlds-ai-integration-4349.lovable.app",
  "https://lovable.dev/projects/288cf4b9-0920-44a5-b1a4-a69a5341d47f",
  "https://preview--market-mosaic-online-4342.lovable.app",
  "https://market-mosaic-online-4342.lovable.app",
  "https://lovable.dev/projects/88f314bd-27da-41ea-9068-a49b2abcd1b4",
  "https://88f314bd-27da-41ea-9068-a49b2abcd1b4.lovableproject.com",
  "https://preview--nem-demo.lovable.app",
  'https://nem-kyc.firebaseapp.com',
  'https://nemforms.com'
];

const port = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS policy does not allow access from this origin.'), false);
    }
  },
  credentials: true, // Ensures cookies are sent with CORS requests
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: ['Content-Type', 'CSRF-Token', 'X-Requested-With', 'Authorization', 'x-timestamp'],
}));

// Middleware setup
app.use(morgan('combined', { stream: accessLogStream }));
app.use(helmet());
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"]
  }
}));

app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(hpp());
app.use(mongoSanitize());
app.use(xss());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Cross-site cookie policy
  }
}));

// Initialize CSRF protection middleware
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Cross-site cookie policy
  }
});

// Nonce implementation middleware
const generateNonce = () => {
  return uuidv4();
};

app.use((req, res, next) => {
  res.locals.nonce = generateNonce();
  next();
});

const db = admin.firestore();
const upload = multer({ storage: multer.memoryStorage() });
const bucket = getStorage().bucket();

// ============= EVENTS LOG SYSTEM =============

// Environment configuration for events logging
const EVENTS_CONFIG = {
  IP_HASH_SALT: process.env.EVENTS_IP_SALT || 'nem-events-default-salt-2024',
  ENABLE_IP_GEOLOCATION: process.env.ENABLE_IP_GEOLOCATION === 'true',
  RAW_IP_RETENTION_DAYS: parseInt(process.env.RAW_IP_RETENTION_DAYS) || 30,
  ENABLE_EVENTS_LOGGING: process.env.ENABLE_EVENTS_LOGGING !== 'false' // Default to enabled
};

// IP processing middleware - extracts, masks, and hashes IPs
const processIPMiddleware = (req, res, next) => {
  if (!EVENTS_CONFIG.ENABLE_EVENTS_LOGGING) return next();

  // Extract real IP from various headers
  const extractRealIP = (req) => {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  };

  const realIP = extractRealIP(req).split(',')[0].trim();
  
  // Mask IP (keep first 3 octets, mask last)
  const maskIP = (ip) => {
    if (ip.includes(':')) {
      // IPv6 - mask last 4 groups
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + ':****:****:****:****';
    } else {
      // IPv4 - mask last octet
      const parts = ip.split('.');
      return parts.slice(0, 3).join('.') + '.***';
    }
  };

  // Hash IP with salt for correlation while protecting privacy
  const hashIP = (ip) => {
    return crypto.createHmac('sha256', EVENTS_CONFIG.IP_HASH_SALT)
                 .update(ip)
                 .digest('hex')
                 .substring(0, 16);
  };

  // Attach processed IP data to request
  req.ipData = {
    raw: realIP,
    masked: maskIP(realIP),
    hash: hashIP(realIP)
  };

  next();
};

// Apply IP processing middleware globally
app.use(processIPMiddleware);

// Location enrichment function (optional)
const getLocationFromIP = async (ip) => {
  if (!EVENTS_CONFIG.ENABLE_IP_GEOLOCATION || ip === '0.0.0.0' || ip.includes('127.0.0.1')) {
    return 'Local/Unknown';
  }

  try {
    // Using a free IP geolocation service - you can replace with your preferred service
    const response = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 2000 });
    if (response.data.status === 'success') {
      return `${response.data.city || 'Unknown'}, ${response.data.country || 'Unknown'}`;
    }
  } catch (error) {
    console.warn('IP geolocation failed:', error.message);
  }
  
  return 'Unknown';
};

// Core logAction function - writes event logs to Firestore
const logAction = async (actionData) => {
  console.log('🚀 logAction called with data:', actionData);
  
  if (!EVENTS_CONFIG.ENABLE_EVENTS_LOGGING) {
    console.log('⚠️  Event logging is DISABLED in config');
    return;
  }

  console.log('✅ Event logging is ENABLED, proceeding...');

  try {
    const eventLog = {
      ts: admin.firestore.FieldValue.serverTimestamp(),
      action: actionData.action,
      actorUid: actionData.actorUid || null,
      actorDisplayName: actionData.actorDisplayName || null,
      actorEmail: actionData.actorEmail || null,
      actorRole: actionData.actorRole || null,
      targetType: actionData.targetType,
      targetId: actionData.targetId,
      details: actionData.details || {},
      ipMasked: actionData.ipMasked,
      ipHash: actionData.ipHash,
      location: actionData.location || 'Unknown',
      userAgent: actionData.userAgent || 'Unknown',
      meta: actionData.meta || {}
    };

    console.log('📋 Event log object created:', eventLog);

    // Add raw IP with TTL for retention policy
    if (actionData.rawIP && EVENTS_CONFIG.RAW_IP_RETENTION_DAYS > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + EVENTS_CONFIG.RAW_IP_RETENTION_DAYS);
      eventLog.rawIP = actionData.rawIP;
      eventLog.rawIPExpiry = admin.firestore.Timestamp.fromDate(expiryDate);
      console.log('🔒 Added raw IP with expiry:', expiryDate);
    }

    console.log('💾 Writing to Firestore collection "eventLogs"...');
    const docRef = await db.collection('eventLogs').add(eventLog);
    console.log('✅ Event logged successfully with ID:', docRef.id, '- Action:', actionData.action, 'by', actionData.actorEmail || 'anonymous');
    
    // Verify the document was actually written
    const verifyDoc = await docRef.get();
    if (verifyDoc.exists) {
      console.log('✅ Verification: Document exists in Firestore');
      console.log('📄 Document data:', verifyDoc.data());
    } else {
      console.error('❌ Verification failed: Document not found after write');
    }
    
  } catch (error) {
    console.error('💥 Failed to log event:', error);
    console.error('💥 Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    // Don't throw - logging failures shouldn't break main functionality
  }
};

// Helper function to get user details for logging
const getUserDetailsForLogging = async (uid) => {
  try {
    if (!uid) return { displayName: null, email: null, role: null };
    
    const userRecord = await admin.auth().getUser(uid);
    const userDoc = await db.collection('userroles').doc(uid).get();
    
    return {
      displayName: userRecord.displayName || userRecord.email?.split('@')[0] || 'Unknown',
      email: userRecord.email || null,
      role: userDoc.exists ? userDoc.data().role : null
    };
  } catch (error) {
    console.warn('Failed to get user details for logging:', error);
    return { displayName: null, email: null, role: null };
  }
};

app.use(express.json());


// Timestamp validation middleware
app.use((req, res, next) => {
  if (req.path === '/csrf-token' || 
    req.path === '/listenForUpdates' ||
    req.path === '/send-to-user' ||
    req.path === '/send-to-admin-and-claims' ||
    req.path === '/send-to-admin-and-compliance' ||
    req.path === '/api/update-claim-status') {
    return next(); // Skip timestamp validation for these routes
  }

  const timestamp = req.headers['x-timestamp'];
  if (!timestamp) {
    return res.status(400).send({ error: 'Timestamp is required' });
  }

  const requestTime = new Date(parseInt(timestamp, 10));
  const currentTime = new Date();

  const timeDiff = currentTime - requestTime;
  const maxAllowedTime = 5 * 60 * 1000; // 5 minutes

  if (timeDiff > maxAllowedTime) {
    return res.status(400).send({ error: 'Request too old' });
  }

  next();
});

// Apply CSRF protection middleware conditionally
app.use((req, res, next) => {
  if (req.path === '/csrf-token' || 
    req.path === '/listenForUpdates' ||
    req.path === '/send-to-user' ||
    req.path === '/send-to-admin-and-claims' ||
    req.path === '/send-to-admin-and-compliance' ||
    req.path === '/api/update-claim-status'){
    return next(); // Skip CSRF for this route
  }
  csrfProtection(req, res, next); // Apply CSRF protection
});

// Log the CSRF token when validating
app.use((req, res, next) => {
  // console.log('Received CSRF Token:', req.headers['csrf-token']);
  next();
});

// Endpoint to get CSRF token
app.get('/csrf-token', (req, res) => {
  const csrfToken = req.csrfToken();
  // console.log('Generated CSRF Token:', csrfToken); // Log the generated CSRF token
  res.status(200).json({ csrfToken });
});

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Microsoft's SMTP server
  port: 587,                  // Port for STARTTLS
  secure: false,              // Use STARTTLS
  auth: {
    user: 'kyc@nem-insurance.com', // Your email address
    pass: process.env.EMAIL_PASS,  // Your email password or app password
  },
  logger: true, // Add this
  debug: true   // Add this
});

// Fetch all admin emails from Firebase
async function getAllAdminEmails() {
  try {
    const usersSnapshot = await admin
      .firestore()
      .collection('userroles')
      .where('role', 'in', ['admin', 'compliance'])
      .get();

    const adminEmails = usersSnapshot.docs.map((doc) => doc.data().email);
    return adminEmails;
  } catch (error) {
    console.error('Error fetching admin emails from Firestore:', error);
    return [];
  }
}

// Function to send email to admins
async function sendEmailToAdmins(adminEmails, formType, formData) {
  const firstThreeDetails = Object.keys(formData).slice(0, 4).map(key => `${key}: ${formData[key]}`).join('<br/>');

  const emailContent = `
    <p>A new <strong>${formType}</strong> form has been successfully submitted.</p>
    <p>
    <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Log in to NEM Forms</a>
    </p>
    
    <p>Here is a brief summary for the submission:</p>
    <div style="background-color:#f4f4f4; padding:10px; border-radius:5px;">
      ${firstThreeDetails}
    </div>

    <p>Best regards,<br>NEM Customer Feedback Team</p>
  `;

  try {
    for (const email of adminEmails) {
      const mailOptions = {
        from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
        to: email, 
        subject: `New ${formType} Submission`,
        html: emailContent,
      };
      await transporter.sendMail(mailOptions);
    }
    console.log('Emails sent to admins successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

//  Reusable helper
async function getEmailsByRoles(rolesArray) {
  try {
    // Always include admin and super-admin roles
    const allRoles = [...new Set([...rolesArray, 'admin', 'super-admin'])];
    
    const usersSnapshot = await admin.firestore()
      .collection('userroles')
      .where('role', 'in', allRoles)
      .get();

    return usersSnapshot.docs.map(doc => doc.data().email);
  } catch (error) {
    console.error('Error fetching emails by roles:', error);
    return [];
  }
}

async function sendEmail(to, subject, html, attachments = []) {
  const mailOptions = {
    from: '"NEM FORMS Application" <kyc@nem-insurance.com>',
    to,
    subject,
    html,
    attachments // Add attachments support
  };
  return transporter.sendMail(mailOptions);
}

// ✅ NEW: Claims Approval/Rejection with Evidence Preservation + EVENT LOGGING
app.post('/api/update-claim-status', async (req, res) => {
  try {
    const { 
      collectionName, 
      documentId, 
      status, 
      approverUid, 
      comment, 
      userEmail, 
      formType 
    } = req.body;

    // Validate required fields
    if (!collectionName || !documentId || !status || !approverUid || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: collectionName, documentId, status, approverUid, comment'
      });
    }

    // Get document before update for logging
    const docBefore = await admin.firestore()
      .collection(collectionName)
      .doc(documentId)
      .get();
    
    const beforeData = docBefore.exists ? docBefore.data() : {};

    // Get approver details
    const approverDetails = await getUserDetailsForLogging(approverUid);
    const approverName = approverDetails.displayName || approverDetails.email;

    // Evidence preservation data
    const evidenceData = {
      status,
      approvedBy: approverUid,
      approverName: approverName,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvalComment: comment,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update the claim document with evidence preservation
    await admin.firestore()
      .collection(collectionName)
      .doc(documentId)
      .update(evidenceData);

    // 📝 LOG THE APPROVAL/REJECTION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: status === 'approved' ? 'approve' : 'reject',
      actorUid: approverUid,
      actorDisplayName: approverDetails.displayName,
      actorEmail: approverDetails.email,
      actorRole: approverDetails.role,
      targetType: collectionName,
      targetId: documentId,
      details: {
        from: { status: beforeData.status || 'pending' },
        to: { status: status },
        comment: comment,
        formType: formType
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        userEmail: userEmail,
        formType: formType,
        approverName: approverName
      }
    });

    // Send status update email to user if email provided
    if (userEmail && formType) {
      const isApproved = status === 'approved';
      const statusText = isApproved ? 'approved' : 'rejected';
      const statusColor = isApproved ? '#22c55e' : '#ef4444';
      const statusEmoji = isApproved ? '🎉' : '❌';

      const subject = `${formType} Claim ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">NEM Insurance</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: ${statusColor};">Your ${formType} claim has been ${statusText}! ${statusEmoji}</h2>
            
            <p>Dear Valued Customer,</p>
            
            ${isApproved 
              ? `<p>We are pleased to inform you that your <strong>${formType}</strong> claim has been <strong>approved</strong>.</p>
                 <p>Our claims team will contact you shortly with further details regarding the next steps.</p>`
              : `<p>We regret to inform you that your <strong>${formType}</strong> claim has been <strong>rejected</strong>.</p>
                 <p><strong>Reason:</strong> ${comment}</p>
                 <p>If you have any questions or would like to appeal this decision, please contact our claims team.</p>`
            }
            
            <div style="background: #f0f8ff; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
              <p style="margin: 0;"><strong>Claim Reference:</strong> ${documentId}</p>
              <p style="margin: 5px 0 0 0;"><strong>Decision Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            ${isApproved ? '<p>Congratulations again!</p>' : '<p>Thank you for your understanding.</p>'}
            
            <p>Best regards,<br/>NEM Claims & Support Team</p>
          </div>
        </div>
      `;

      try {
        await sendEmail(userEmail, subject, html);
        
        // 📝 LOG EMAIL SENT EVENT
        await logAction({
          action: 'email-sent',
          actorUid: approverUid,
          actorDisplayName: approverDetails.displayName,
          actorEmail: approverDetails.email,
          actorRole: approverDetails.role,
          targetType: 'email',
          targetId: userEmail,
          details: {
            emailType: `claim-${status}`,
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
            claimStatus: status
          }
        });

        console.log(`${statusText} email sent to user: ${userEmail}`);
      } catch (emailError) {
        console.error(`Failed to send ${statusText} email:`, emailError);
        // Don't fail the main request if email fails
      }
    }

    res.status(200).json({ 
      message: `Claim ${status} successfully with evidence preserved`,
      approver: approverName,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating claim status:', error);
    res.status(500).json({ 
      error: 'Failed to update claim status',
      details: error.message 
    });
  }
});

// ✅ 1. Admin + Compliance
app.post('/send-to-admin-and-compliance', async (req, res) => {
  const { formType, formData, pdfAttachment } = req.body;

  try {
    // Get compliance + admin emails
    const roles = ['compliance'];
    const emails = await getEmailsByRoles(roles);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">New ${formType} Submission</h2>
          <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
          <p><strong>Submitter:</strong> ${formData?.name || formData?.companyName || 'N/A'}</p>
          <p><strong>Email:</strong> ${formData?.email || 'N/A'}</p>
          <p><strong>Document ID:</strong> ${formData?.documentId || 'N/A'}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please review this submission in the admin dashboard.</p>
          </div>
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Admin Dashboard</a>
          </p>
          
          ${pdfAttachment ? '<p><strong>Note:</strong> The complete form details are attached as a PDF.</p>' : ''}
          
          <p>Best regards,<br>NEM Forms System</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    // Send emails to all compliance + admin users
    await sendEmail(emails, `New ${formType} Submission - Review Required`, html, attachments);
    
    res.status(200).json({ message: 'Emails sent to Compliance and Admin teams with PDF attachment' });
  } catch (error) {
    console.error('Error in /send-to-admin-and-compliance:', error);
    res.status(500).json({ error: 'Email dispatch failed' });
  }
});

// ✅ 2. Admin + Claims
app.post('/send-to-admin-and-claims', async (req, res) => {
  const { formType, formData, pdfAttachment } = req.body;

  try {
    // Get claims + admin emails
    const roles = ['claims'];
    const emails = await getEmailsByRoles(roles);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">New ${formType} Submission</h2>
          <p>A new <strong>${formType}</strong> claim has been submitted and requires processing.</p>
          <p><strong>Claimant:</strong> ${formData?.nameOfInsured || formData?.insuredName || formData?.companyName || 'N/A'}</p>
          <p><strong>Email:</strong> ${formData?.email || formData?.insuredEmail || 'N/A'}</p>
          <p><strong>Document ID:</strong> ${formData?.documentId || 'N/A'}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
            <p style="margin: 0;"><strong>Action Required:</strong> Please review and process this claim in the claims dashboard.</p>
          </div>
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Claims Dashboard</a>
          </p>
          
          ${pdfAttachment ? '<p><strong>Note:</strong> The complete claim details are attached as a PDF.</p>' : ''}
          
          <p>Best regards,<br>NEM Claims Team</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    // Send emails to all claims + admin users
    await sendEmail(emails, `New ${formType} Claim - Processing Required`, html, attachments);
    
    res.status(200).json({ message: 'Emails sent to Claims and Admin teams with PDF attachment' });
  } catch (error) {
    console.error('Error in /send-to-admin-and-claims:', error);
    res.status(500).json({ error: 'Email dispatch failed' });
  }
});

// ✅ 3. User Confirmation
app.post('/send-to-user', async (req, res) => {
  const { userEmail, formType, userName } = req.body;

  if (!userEmail || !formType) {
    return res.status(400).json({ error: 'Missing userEmail or formType' });
  }

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8B4513;">Form Submission Confirmed</h2>
          <p>Dear ${userName || 'Valued Customer'},</p>
          <p>Thank you for submitting your <strong>${formType}</strong> form. We have received your submission and it is currently being processed.</p>
          <p>You can track your submission status by logging in:</p>
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Track Your Submission</a>
          </p>
          <p>We will notify you via email once your submission has been reviewed.</p>
          <p>Best regards,<br>NEM Insurance Team</p>
        </div>
      </div>
    `;

    await sendEmail(userEmail, `${formType} Submission Confirmation`, html);
    
    res.status(200).json({ message: 'Confirmation email sent to user' });
  } catch (error) {
    console.error('Error in /send-to-user:', error);
    res.status(500).json({ error: 'User confirmation email failed' });
  }
});

// Status update email endpoint (existing functionality)
app.post('/send-status-update-email', async (req, res) => {
  const { userEmail, formType, status, userName, pdfAttachment } = req.body;

  if (!userEmail || !formType || !status) {
    return res.status(400).json({ error: 'Missing userEmail, formType, or status' });
  }

  try {
    const isApproved = status === 'approved';
    const statusText = isApproved ? 'approved' : 'rejected';
    const statusColor = isApproved ? '#22c55e' : '#ef4444';
    const statusEmoji = isApproved ? '🎉' : '❌';

    const subject = `${formType} Claim ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">NEM Insurance</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: ${statusColor};">Your ${formType} claim has been ${statusText}! ${statusEmoji}</h2>
          
          <p>Dear ${userName || 'Valued Customer'},</p>
          
          ${isApproved 
            ? `<p>We are pleased to inform you that your <strong>${formType}</strong> claim has been <strong>approved</strong>.</p>
               <p>Our claims team will contact you shortly with further details regarding the next steps.</p>`
            : `<p>We regret to inform you that your <strong>${formType}</strong> claim has been <strong>rejected</strong>.</p>
               <p>If you have any questions or would like to appeal this decision, please contact our claims team.</p>`
          }
          
          <p>
            <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">View Your Claims</a>
          </p>
          
          ${isApproved ? '<p>Congratulations again!</p>' : '<p>Thank you for your understanding.</p>'}
          
          <p>Best regards,<br/>NEM Claims & Support Team</p>
        </div>
      </div>
    `;

    // Prepare attachments array
    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: pdfAttachment.filename,
        content: pdfAttachment.content,
        encoding: pdfAttachment.encoding || 'base64'
      });
    }

    await sendEmail(userEmail, subject, html, attachments);
    
    res.status(200).json({ 
      message: `Claim ${statusText} email sent successfully`,
      status: statusText 
    });
  } catch (error) {
    console.error(`Error sending claim ${statusText} email:`, error);
    res.status(500).json({ 
      error: `Failed to send claim ${statusText} email`,
      details: error.message 
    });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ error: 'Email and password are required' });
  }

  try {
    const idToken = await authenticateUser(email, password);
    const customToken = await createCustomToken(email);

    // Get user details for logging
    const userRecord = await admin.auth().getUserByEmail(email);
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : 'user';

    // 📝 LOG SUCCESSFUL LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login',
      actorUid: userRecord.uid,
      actorDisplayName: userRecord.displayName || email.split('@')[0],
      actorEmail: email,
      actorRole: userRole,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        loginMethod: 'email-password',
        success: true
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        loginTimestamp: new Date().toISOString()
      }
    });

    res.status(200).json({ customToken, role: userRole });

  } catch (error) {
    console.error(error.message);
    
    // 📝 LOG FAILED LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'failed-login',
      actorUid: null,
      actorDisplayName: null,
      actorEmail: email,
      actorRole: null,
      targetType: 'user',
      targetId: email,
      details: {
        loginMethod: 'email-password',
        success: false,
        error: error.message
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        attemptTimestamp: new Date().toISOString()
      }
    });
    
    res.status(500).send({ error: 'Authentication failed' });
  }
});

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
app.get('/api/forms/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { viewerUid } = req.query; // Pass viewer UID as query param
    
    console.log('🔍 Form view request:', { collection, id, viewerUid });
    
    // Get the document
    const doc = await admin.firestore().collection(collection).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Get viewer details if UID provided
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    // 📝 LOG THE VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid || null,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: collection.replace(/s$/, ''), // Remove 's' from collection name
      targetId: id,
      details: {
        viewType: 'form-detail',
        formType: doc.data()?.formType || collection
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collection,
        documentId: id,
        viewTimestamp: new Date().toISOString()
      }
    });
    
    res.json({ id: doc.id, ...doc.data() });
    
  } catch (error) {
    console.error('Error fetching form details:', error);
    res.status(500).json({ error: 'Failed to fetch form details' });
  }
});

// ✅ KYC Form Submissions with EVENT LOGGING
app.post('/submit-kyc-individual', async (req, res) => {
  console.log('📝 Individual KYC form submission received');
  await handleFormSubmission(req, res, 'Individual KYC', 'kyc-individual', req.body.submittedByUid);
});

app.post('/submit-kyc-corporate', async (req, res) => {
  console.log('📝 Corporate KYC form submission received');
  await handleFormSubmission(req, res, 'Corporate KYC', 'kyc-corporate', req.body.submittedByUid);
});

// ✅ CDD Form Submissions with EVENT LOGGING
app.post('/submit-cdd-individual', async (req, res) => {
  console.log('📝 Individual CDD form submission received');
  await handleFormSubmission(req, res, 'Individual CDD', 'cdd-individual', req.body.submittedByUid);
});

app.post('/submit-cdd-corporate', async (req, res) => {
  console.log('📝 Corporate CDD form submission received');
  await handleFormSubmission(req, res, 'Corporate CDD', 'cdd-corporate', req.body.submittedByUid);
});

app.post('/submit-cdd-agents', async (req, res) => {
  console.log('📝 Agents CDD form submission received');
  await handleFormSubmission(req, res, 'Agents CDD', 'cdd-agents', req.body.submittedByUid);
});

app.post('/submit-cdd-brokers', async (req, res) => {
  console.log('📝 Brokers CDD form submission received');
  await handleFormSubmission(req, res, 'Brokers CDD', 'cdd-brokers', req.body.submittedByUid);
});

app.post('/submit-cdd-partners', async (req, res) => {
  console.log('📝 Partners CDD form submission received');
  await handleFormSubmission(req, res, 'Partners CDD', 'cdd-partners', req.body.submittedByUid);
});

// ✅ Claims Submissions with EVENT LOGGING
app.post('/submit-claim-motor', async (req, res) => {
  console.log('📝 Motor claim form submission received');
  await handleFormSubmission(req, res, 'Motor Claim', 'claims-motor', req.body.submittedByUid);
});

app.post('/submit-claim-fire', async (req, res) => {
  console.log('📝 Fire & Special Perils claim submission received');
  await handleFormSubmission(req, res, 'Fire & Special Perils Claim', 'claims-fire-special-perils', req.body.submittedByUid);
});

app.post('/submit-claim-burglary', async (req, res) => {
  console.log('📝 Burglary claim form submission received');
  await handleFormSubmission(req, res, 'Burglary Claim', 'claims-burglary', req.body.submittedByUid);
});

app.post('/submit-claim-all-risk', async (req, res) => {
  console.log('📝 All Risk claim form submission received');
  await handleFormSubmission(req, res, 'All Risk Claim', 'claims-all-risk', req.body.submittedByUid);
});

// ✅ User Registration with EVENT LOGGING
app.post('/api/register-user', async (req, res) => {
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
app.get('/api/download/:fileType/:documentId', async (req, res) => {
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
app.post('/api/generate-sample-events', async (req, res) => {
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

// Enhanced form submission function with EVENT LOGGING
async function handleFormSubmission(req, res, formType, collectionName, userUid = null) {
  const formData = req.body;

  // Perform validation as needed here...

  try {
    const docId = uuidv4();

    // Add form to the Firestore collection
    await admin.firestore().collection(collectionName).doc(docId).set({
      ...formData,
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
      documentId: docId
    });
  } catch (err) {
    console.error('Error during form submission:', err);
    res.status(500).json({ error: 'Form submission failed' });
  }
}

const setSuperAdminOnStartup = async () => {
  try {
    const email = 'neowalker502@gmail.com';

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    const uid = user.uid;

    //  Set custom claim if not already set
    if (!user.customClaims?.superAdmin) {
      await admin.auth().setCustomUserClaims(uid, {
        ...user.customClaims,
        superAdmin: true,
      });
      console.log(`Custom claim set: ${email} is now a superAdmin`);
    } else {
      console.log(`Custom claim already exists for ${email}`);
    }

    // Also set Firestore role
    const userDocRef = admin.firestore().collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists || userDoc.data()?.role !== 'superAdmin') {
      await userDocRef.set(
        {
          role: 'superAdmin',
          updatedAt: new Date(),
        },
        { merge: true }
      );
      console.log(`Firestore role set: ${email} is now a superAdmin`);
    } else {
      console.log(`Firestore role already set for ${email}`);
    }
  } catch (error) {
    console.error(`Failed to assign super admin:`, error);
  }
};

// ============= EVENTS LOG API ENDPOINTS =============

// Get event logs with filtering and pagination (Admin only)
app.get('/api/events-logs', async (req, res) => {
  try {
    console.log('🔍 /api/events-logs endpoint called');
    console.log('📤 Request query params:', req.query);
    console.log('📤 Request headers:', {
      'x-timestamp': req.headers['x-timestamp'],
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']?.substring(0, 50)
    });
    
    // Basic validation
    const { 
      page = 1, 
      limit = 50, 
      action, 
      targetType, 
      actorEmail, 
      startDate, 
      endDate,
      searchTerm,
      advanced = 'false'
    } = req.query;

    console.log('📋 Parsed parameters:', {
      page, limit, action, targetType, actorEmail, startDate, endDate, searchTerm, advanced
    });

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      console.error('❌ Invalid page parameter:', page);
      return res.status(400).json({ error: 'Invalid page parameter' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      console.error('❌ Invalid limit parameter:', limit);
      return res.status(400).json({ error: 'Invalid limit parameter (must be 1-100)' });
    }

    console.log('🔍 Checking if eventLogs collection exists...');
    let query = db.collection('eventLogs');

    // Check if collection exists and has documents
    const collectionExists = await db.collection('eventLogs').limit(1).get();
    console.log('📊 Collection check result:', {
      empty: collectionExists.empty,
      size: collectionExists.size,
      docs: collectionExists.docs.length
    });
    
    if (collectionExists.empty) {
      console.log('⚠️  EventLogs collection is empty, returning empty response');
      return res.json({
        events: [],
        pagination: {
          currentPage: pageNum,
          limit: limitNum,
          totalCount: 0,
          totalPages: 0
        }
      });
    }

    console.log('✅ Collection has documents, building query...');

    // Apply filters
    if (action && action !== 'all') {
      console.log('🔽 Filtering by action:', action);
      query = query.where('action', '==', action);
    }

    if (targetType && targetType !== 'all') {
      console.log('🔽 Filtering by targetType:', targetType);
      query = query.where('targetType', '==', targetType);
    }

    if (actorEmail) {
      console.log('🔽 Filtering by actorEmail:', actorEmail);
      query = query.where('actorEmail', '==', actorEmail);
    }

    // Date range filtering
    if (startDate) {
      try {
        const start = admin.firestore.Timestamp.fromDate(new Date(startDate));
        console.log('🔽 Filtering by startDate:', startDate, '→', start.toDate());
        query = query.where('ts', '>=', start);
      } catch (dateError) {
        console.error('❌ Invalid startDate:', startDate, dateError);
        return res.status(400).json({ error: 'Invalid startDate format' });
      }
    }

    if (endDate) {
      try {
        const end = admin.firestore.Timestamp.fromDate(new Date(endDate + 'T23:59:59'));
        console.log('🔽 Filtering by endDate:', endDate, '→', end.toDate());
        query = query.where('ts', '<=', end);
      } catch (dateError) {
        console.error('❌ Invalid endDate:', endDate, dateError);
        return res.status(400).json({ error: 'Invalid endDate format' });
      }
    }

    // Order by timestamp descending
    console.log('📅 Ordering by timestamp desc');
    query = query.orderBy('ts', 'desc');

    // Apply pagination
    const offset = (pageNum - 1) * limitNum;
    console.log('📄 Pagination settings:', { pageNum, limitNum, offset });
    
    if (offset > 0) {
      console.log('⏭️  Applying pagination offset:', offset);
      const startAfterSnapshot = await query.limit(offset).get();
      if (!startAfterSnapshot.empty) {
        const lastVisible = startAfterSnapshot.docs[startAfterSnapshot.docs.length - 1];
        query = query.startAfter(lastVisible);
      }
    }

    query = query.limit(limitNum);

    console.log('⚡ Executing main query...');
    const snapshot = await query.get();
    console.log('📊 Query result:', {
      empty: snapshot.empty,
      size: snapshot.size,
      docs: snapshot.docs.length
    });

    const events = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert timestamp to ISO string for frontend
      const eventData = {
        ...data,
        ts: data.ts ? data.ts.toDate().toISOString() : new Date().toISOString()
      };
      
      // For regular view, exclude sensitive fields
      if (advanced !== 'true') {
        const { rawIP, ipHash, userAgent, location, ...regularData } = eventData;
        return { id: doc.id, ...regularData };
      }
      
      // For advanced view, include all fields but remove rawIP if expired
      if (data.rawIPExpiry && data.rawIPExpiry.toDate() < new Date()) {
        const { rawIP, ...dataWithoutRawIP } = eventData;
        return { id: doc.id, ...dataWithoutRawIP };
      }
      
      return { id: doc.id, ...eventData };
    });

    console.log('🔄 Processed events:', events.length);
    console.log('🔍 Sample events:', events.slice(0, 2));

    // Get total count for pagination (more efficient way)
    console.log('🔢 Calculating total count...');
    const totalCountSnapshot = await db.collection('eventLogs').select().get();
    const totalCount = totalCountSnapshot.size;
    console.log('📊 Total events in collection:', totalCount);

    console.log(`✅ Returning ${events.length} events out of ${totalCount} total`);

    const response = {
      events,
      pagination: {
        currentPage: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    };

    console.log('📤 Final response structure:', {
      eventsCount: response.events.length,
      pagination: response.pagination
    });

    res.json(response);

  } catch (error) {
    console.error('Error fetching event logs:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Return more specific error messages
    if (error.code === 9) { // FAILED_PRECONDITION
      return res.status(400).json({ 
        error: 'Query requires an index. Please ensure Firestore indexes are configured.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch event logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get event details by ID (Admin only)
app.get('/api/events-logs/:id', async (req, res) => {
  try {
    // TODO: Add authentication middleware to verify admin role
    const { id } = req.params;
    
    const doc = await db.collection('eventLogs').doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Event log not found' });
    }

    const data = doc.data();
    
    // Remove rawIP if expired
    if (data.rawIPExpiry && data.rawIPExpiry.toDate() < new Date()) {
      const { rawIP, ...dataWithoutRawIP } = data;
      return res.json({ id: doc.id, ...dataWithoutRawIP });
    }
    
    res.json({ id: doc.id, ...data });
    
  } catch (error) {
    console.error('Error fetching event log details:', error);
    res.status(500).json({ error: 'Failed to fetch event log details' });
  }
});

// Clean up expired raw IPs (scheduled job - call this periodically)
app.post('/api/cleanup-expired-ips', async (req, res) => {
  try {
    // TODO: Add authentication middleware to verify admin/system role
    
    const now = admin.firestore.Timestamp.now();
    const expiredQuery = db.collection('eventLogs')
      .where('rawIPExpiry', '<', now)
      .where('rawIP', '!=', null);

    const snapshot = await expiredQuery.get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No expired IPs to clean up', cleaned: 0 });
    }

    const batch = db.batch();
    let cleanedCount = 0;

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { rawIP: admin.firestore.FieldValue.delete() });
      cleanedCount++;
    });

    await batch.commit();
    
    console.log(`🧹 Cleaned up ${cleanedCount} expired raw IPs`);
    res.json({ message: `Cleaned up ${cleanedCount} expired raw IPs`, cleaned: cleanedCount });
    
  } catch (error) {
    console.error('Error cleaning up expired IPs:', error);
    res.status(500).json({ error: 'Failed to clean up expired IPs' });
  }
});

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log(`📝 Events logging: ${EVENTS_CONFIG.ENABLE_EVENTS_LOGGING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 IP geolocation: ${EVENTS_CONFIG.ENABLE_IP_GEOLOCATION ? 'ENABLED' : 'DISABLED'}`);
  console.log(`⏰ Raw IP retention: ${EVENTS_CONFIG.RAW_IP_RETENTION_DAYS} days`);
  
  // Generate some initial sample events for testing (only in development)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧪 Generating initial sample events for testing...');
    setTimeout(async () => {
      try {
        const sampleEvents = [
          {
            action: 'submit',
            actorUid: 'sample-user-1',
            actorDisplayName: 'John Doe',
            actorEmail: 'john.doe@example.com',
            actorRole: 'user',
            targetType: 'kyc-form',
            targetId: 'kyc-sample-001',
            details: { formType: 'Individual KYC', status: 'processing' },
            ipMasked: '203.115.45.***',
            ipHash: 'abc123def456',
            rawIP: '203.115.45.120',
            location: 'Lagos, Nigeria',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            meta: { sampleEvent: true, testData: true }
          },
          {
            action: 'approve',
            actorUid: 'admin-001',
            actorDisplayName: 'Admin User',
            actorEmail: 'admin@nem-insurance.com',
            actorRole: 'admin',
            targetType: 'claim',
            targetId: 'claim-sample-002',
            details: { 
              from: { status: 'pending' }, 
              to: { status: 'approved' },
              comment: 'Claim approved after review'
            },
            ipMasked: '192.168.1.***',
            ipHash: 'def456ghi789',
            rawIP: '192.168.1.100',
            location: 'Abuja, Nigeria',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
            meta: { sampleEvent: true, adminAction: true }
          },
          {
            action: 'view',
            actorUid: 'compliance-001',
            actorDisplayName: 'Jane Smith',
            actorEmail: 'jane.smith@nem-insurance.com',
            actorRole: 'compliance',
            targetType: 'cdd-form',
            targetId: 'cdd-sample-003',
            details: { viewType: 'form-detail', formType: 'Corporate CDD' },
            ipMasked: '10.0.0.***',
            ipHash: 'ghi789jkl012',
            rawIP: '10.0.0.50',
            location: 'Port Harcourt, Nigeria',
            userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            meta: { sampleEvent: true, complianceReview: true }
          },
          {
            action: 'login',
            actorUid: 'user-002',
            actorDisplayName: 'Bob Wilson',
            actorEmail: 'bob.wilson@example.com',
            actorRole: 'user',
            targetType: 'user',
            targetId: 'user-002',
            details: { loginMethod: 'email-password', success: true },
            ipMasked: '172.16.0.***',
            ipHash: 'jkl012mno345',
            rawIP: '172.16.0.25',
            location: 'Kano, Nigeria',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
            meta: { sampleEvent: true, mobileLogin: true }
          },
          {
            action: 'email-sent',
            actorUid: 'system',
            actorDisplayName: 'System',
            actorEmail: 'system@nem-insurance.com',
            actorRole: 'system',
            targetType: 'email',
            targetId: 'admin@nem-insurance.com',
            details: { 
              emailType: 'admin-notification',
              subject: 'New KYC Submission',
              formType: 'Individual KYC'
            },
            ipMasked: '127.0.0.***',
            ipHash: 'mno345pqr678',
            rawIP: '127.0.0.1',
            location: 'Server Location',
            userAgent: 'System/1.0',
            meta: { sampleEvent: true, systemGenerated: true }
          }
        ];

        for (const event of sampleEvents) {
          await logAction(event);
        }
        
        console.log('✅ Sample events generated successfully');
      } catch (error) {
        console.log('⚠️  Failed to generate sample events:', error.message);
      }
    }, 2000); // Wait 2 seconds after server starts
  }
  
  await setSuperAdminOnStartup(); // ← 🚨 this line makes it happen
});
