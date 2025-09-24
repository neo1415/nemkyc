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
// CSRF protection will be applied selectively, not globally

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

// ============= FORM SUBMISSION BACKEND ENDPOINTS =============

// Centralized form submission endpoint with event logging
app.post('/api/submit-form', async (req, res) => {
  try {
    const { formData, formType, userUid, userEmail } = req.body;
    
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

    // Add metadata to form data
    const submissionData = {
      ...formData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: new Date().toLocaleDateString('en-GB'),
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: userEmail || userDetails.email,
      status: 'pending'
    };

    // Submit to Firestore
    const docRef = await db.collection(collectionName).add(submissionData);
    console.log('✅ Document written with ID:', docRef.id);

    // 📝 LOG THE FORM SUBMISSION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'submit',
      actorUid: userUid,
      actorDisplayName: userDetails.displayName || formData?.name || formData?.companyName,
      actorEmail: userDetails.email || userEmail || formData?.email,
      actorRole: userDetails.role,
      targetType: collectionName.replace(/s$/, ''),
      targetId: docRef.id,
      details: {
        formType: formType,
        status: 'pending',
        submitterName: formData?.name || formData?.companyName || 'Unknown',
        submitterEmail: formData?.email || userEmail || 'Unknown'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formType: formType,
        collectionName: collectionName,
        submissionId: docRef.id
      }
    });

    // Send email notifications
    try {
      const finalSubmissionData = { ...submissionData, documentId: docRef.id, collectionName };
      
      // Send user confirmation email
      await sendEmail(userEmail || userDetails.email || formData?.email, 
        `${formType} Submission Confirmation`, 
        generateConfirmationEmailHTML(formType));

      // Send admin notification with PDF
      const isClaimsForm = ['claim', 'motor', 'burglary', 'fire', 'allrisk', 'goods', 'money',
        'employers', 'public', 'professional', 'fidelity', 'contractors', 'group', 'rent', 'combined']
        .some(keyword => formType.toLowerCase().includes(keyword));

      const adminRoles = isClaimsForm ? ['claims'] : ['compliance'];
      const adminEmails = await getEmailsByRoles(adminRoles);
      
      if (adminEmails.length > 0) {
        await sendEmail(adminEmails, 
          `New ${formType} Submission - Review Required`,
          generateAdminNotificationHTML(formType, formData, docRef.id));
      }

      // 📝 LOG EMAIL NOTIFICATIONS
      await logAction({
        action: 'email-sent',
        actorUid: 'system',
        actorDisplayName: 'System',
        actorEmail: 'system@nem-insurance.com',
        actorRole: 'system',
        targetType: 'email',
        targetId: (userEmail || userDetails.email || formData?.email) + ',' + adminEmails.join(','),
        details: {
          emailType: 'submission-notification',
          formType: formType,
          userEmail: userEmail || userDetails.email || formData?.email,
          adminEmails: adminEmails
        },
        ipMasked: req.ipData?.masked,
        ipHash: req.ipData?.hash,
        rawIP: req.ipData?.raw,
        location: location,
        userAgent: req.headers['user-agent'] || 'Unknown',
        meta: {
          relatedSubmission: docRef.id,
          emailCount: adminEmails.length + 1
        }
      });

    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Form submitted successfully',
      documentId: docRef.id,
      collectionName: collectionName
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({ error: 'Form submission failed', details: error.message });
  }
});

// Helper function to determine Firestore collection based on form type
const getFirestoreCollection = (formType) => {
  const formTypeLower = formType.toLowerCase();
  
  // Claims forms
  if (formTypeLower.includes('combined')) return 'combined-gpa-employers-liability-claims';
  if (formTypeLower.includes('motor')) return 'motor-claims';
  if (formTypeLower.includes('burglary')) return 'burglary-claims';
  if (formTypeLower.includes('fire')) return 'fire-special-perils-claims';
  if (formTypeLower.includes('allrisk') || formTypeLower.includes('all risk')) return 'all-risk-claims';
  if (formTypeLower.includes('goods')) return 'goods-in-transit-claims';
  if (formTypeLower.includes('money')) return 'money-insurance-claims';
  if (formTypeLower.includes('employers')) return 'employers-liability-claims';
  if (formTypeLower.includes('public')) return 'public-liability-claims';
  if (formTypeLower.includes('professional')) return 'professional-indemnity-claims';
  if (formTypeLower.includes('fidelity')) return 'fidelity-guarantee-claims';
  if (formTypeLower.includes('contractors')) return 'contractors-claims';
  if (formTypeLower.includes('group')) return 'group-personal-accident-claims';
  if (formTypeLower.includes('rent')) return 'rent-assurance-claims';
  
  // KYC forms
  if (formTypeLower.includes('individual') && formTypeLower.includes('kyc')) return 'Individual-kyc-form';
  if (formTypeLower.includes('corporate') && formTypeLower.includes('kyc')) return 'corporate-kyc-form';
  
  // CDD forms
  if (formTypeLower.includes('individual') && formTypeLower.includes('cdd')) return 'individualCDD';
  if (formTypeLower.includes('corporate') && formTypeLower.includes('cdd')) return 'corporateCDD';
  if (formTypeLower.includes('agents') && formTypeLower.includes('cdd')) return 'agentsCDD';
  if (formTypeLower.includes('brokers') && formTypeLower.includes('cdd')) return 'brokersCDD';
  if (formTypeLower.includes('partners') && formTypeLower.includes('cdd')) return 'partnersCDD';
  
  return 'formSubmissions';
};

// Helper functions for email HTML generation
const generateConfirmationEmailHTML = (formType) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #8B4513;">Form Submission Confirmed</h2>
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
};

const generateAdminNotificationHTML = (formType, formData, documentId) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(90deg, #8B4513, #DAA520); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">NEM Insurance</h1>
      </div>
      <div style="padding: 20px; background: #f9f9f9;">
        <h2 style="color: #8B4513;">New ${formType} Submission</h2>
        <p>A new <strong>${formType}</strong> form has been submitted and requires review.</p>
        <p><strong>Submitter:</strong> ${formData?.name || formData?.companyName || 'N/A'}</p>
        <p><strong>Email:</strong> ${formData?.email || 'N/A'}</p>
        <p><strong>Document ID:</strong> ${documentId}</p>
        
        <div style="margin: 20px 0; padding: 15px; background: #f0f8ff; border-left: 4px solid #8B4513;">
          <p style="margin: 0;"><strong>Action Required:</strong> Please review this submission in the admin dashboard.</p>
        </div>
        
        <p>
          <a href="https://nemforms.com/signin" style="display: inline-block; padding: 10px 20px; background-color: #800020; color: #FFD700; text-decoration: none; border-radius: 5%;">Access Admin Dashboard</a>
        </p>
        
        <p>Best regards,<br>NEM Forms System</p>
      </div>
    </div>
  `;
};

// ============= AUTHENTICATION BACKEND ENDPOINTS =============

// Login endpoint with event logging
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate credentials using Firebase Admin SDK approach
    try {
      // First check if user exists
      const userRecord = await admin.auth().getUserByEmail(email);
      
      // For Firebase Auth, we need to validate the password by attempting sign-in
      // Since we can't directly verify passwords with Admin SDK, we use a different approach
      
      // Create a temporary Firebase client auth instance for validation
      const { initializeApp, getApps } = require('firebase/app');
      const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
      
      // Firebase config from environment or hardcoded (you should set these env vars)
      const firebaseConfig = {
        apiKey: "AIzaSyDTyrzbQ4xYV0IAvngwgCUBf6EPnflacSw",
        authDomain: "nem-customer-feedback-8d3fb.firebaseapp.com",
        projectId: "nem-customer-feedback-8d3fb",
      };
      
      // Initialize client app for validation
      let clientApp;
      const existingApps = getApps();
      if (existingApps.length > 0) {
        clientApp = existingApps.find(app => app.name === 'validation-app') || existingApps[0];
      } else {
        clientApp = initializeApp(firebaseConfig, 'validation-app');
      }
      
      const clientAuth = getAuth(clientApp);
      
      // Validate credentials - this will throw if password is wrong
      const userCredential = await signInWithEmailAndPassword(clientAuth, email, password);
      
      // Sign out immediately after validation
      await clientAuth.signOut();
      
    } catch (authError) {
      // Password validation failed or user doesn't exist
      console.error('Authentication failed:', authError.code, authError.message);
      
      // Log failed attempt
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
          error: authError.code || 'Invalid credentials',
          errorMessage: authError.message
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
      
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Now get user record after successful authentication
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Check if user exists in userroles collection
    const userDoc = await db.collection('userroles').doc(userRecord.uid).get();
    const userRole = userDoc.exists ? userDoc.data().role : 'user';
    
    // Create custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid, {
      role: userRole,
      email: email
    });

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

    res.status(200).json({ 
      success: true,
      customToken, 
      role: userRole,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    
    // 📝 LOG FAILED LOGIN EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'failed-login',
      actorUid: null,
      actorDisplayName: null,
      actorEmail: req.body.email,
      actorRole: null,
      targetType: 'user',
      targetId: req.body.email,
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
    
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
});

// Token exchange endpoint - frontend does Firebase auth, backend verifies token and returns user info
app.post('/api/exchange-token', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;
    const uid = decodedToken.uid;
    
    // Get user from Firestore userroles collection
    const userDoc = await db.collection('userroles').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    
    // Log successful token exchange
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'login-success',
      actorUid: uid,
      actorDisplayName: userData.name,
      actorEmail: email,
      actorRole: userData.role,
      targetType: 'user',
      targetId: uid,
      details: { loginMethod: 'token-exchange' },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: { loginTimestamp: new Date().toISOString() }
    });

    res.json({
      success: true,
      role: userData.role,
      user: { uid, email, displayName: userData.name }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});


// Register endpoint with event logging
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, displayName, role = 'user' } = req.body;
    
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'Email, password, and displayName are required' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });

    // Set role in userroles collection
    await db.collection('userroles').doc(userRecord.uid).set({
      email: email,
      role: role,
      displayName: displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 📝 LOG THE REGISTRATION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'register',
      actorUid: userRecord.uid,
      actorDisplayName: displayName,
      actorEmail: email,
      actorRole: role,
      targetType: 'user',
      targetId: userRecord.uid,
      details: {
        registrationMethod: 'email-password',
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
      success: true,
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// ============= DATA RETRIEVAL BACKEND ENDPOINTS =============

// Get forms data with event logging
app.get('/api/forms/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { viewerUid, page = 1, limit = 50 } = req.query;
    
    console.log(`📊 Forms data request for collection: ${collection}`);
    
    // Get viewer details for logging
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    // Build query
    let query = db.collection(collection);
    
    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
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

// Get specific form by ID with event logging  
app.get('/api/forms/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { viewerUid } = req.query;
    
    // Get viewer details for logging
    let viewerDetails = { displayName: null, email: null, role: null };
    if (viewerUid) {
      viewerDetails = await getUserDetailsForLogging(viewerUid);
    }
    
    const doc = await db.collection(collection).doc(id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const data = {
      id: doc.id,
      ...doc.data()
    };

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

// Update form status with event logging
app.put('/api/forms/:collection/:id/status', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { status, updaterUid, comment, userEmail, formType } = req.body;
    
    if (!status || !updaterUid) {
      return res.status(400).json({ error: 'Status and updaterUid are required' });
    }

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

// ✅ Route to manually generate test events (for development/testing)
app.post('/api/generate-test-events', async (req, res) => {
  try {
    console.log('🧪 Manually generating test events...');
    
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
        meta: { sampleEvent: true, testData: true, generatedAt: new Date().toISOString() }
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
        meta: { sampleEvent: true, adminAction: true, generatedAt: new Date().toISOString() }
      },
      {
        action: 'login',
        actorUid: user?.uid || 'current-user',
        actorDisplayName: user?.displayName || user?.email?.split('@')[0] || 'Current User',
        actorEmail: user?.email || 'current.user@example.com',
        actorRole: 'admin',
        targetType: 'user',
        targetId: user?.uid || 'current-user',
        details: { loginMethod: 'manual-test', success: true },
        ipMasked: req.ipData?.masked || '127.0.0.***',
        ipHash: req.ipData?.hash || 'test-hash',
        rawIP: req.ipData?.raw || '127.0.0.1',
        location: 'Test Location',
        userAgent: req.headers['user-agent'] || 'Test Browser',
        meta: { sampleEvent: true, manualTest: true, generatedAt: new Date().toISOString() }
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
        meta: { sampleEvent: true, complianceReview: true, generatedAt: new Date().toISOString() }
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
        meta: { sampleEvent: true, systemGenerated: true, generatedAt: new Date().toISOString() }
      }
    ];

    let successCount = 0;
    for (const event of sampleEvents) {
      try {
        await logAction(event);
        successCount++;
      } catch (error) {
        console.error('Failed to create sample event:', error);
      }
    }
    
    console.log(`✅ Generated ${successCount}/${sampleEvents.length} test events`);
    res.status(200).json({ 
      message: `Successfully generated ${successCount} test events`,
      success: successCount,
      total: sampleEvents.length
    });
    
  } catch (error) {
    console.error('Error generating test events:', error);
    res.status(500).json({ 
      error: 'Failed to generate test events',
      details: error.message 
    });
  }
});

// ============= USER MANAGEMENT ENDPOINTS WITH EVENT LOGGING =============

// ✅ NEW: Update user role with EVENT LOGGING
app.put('/api/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, updaterUid } = req.body;

    if (role === undefined) {
      return res.status(400).json({ error: 'Role is missing in the request body' });
    }

    // Get current user data before update
    const userDoc = await admin.firestore().collection('userroles').doc(userId).get();
    const oldRole = userDoc.exists ? userDoc.data().role : null;
    
    // Get updater details for logging
    const updaterDetails = await getUserDetailsForLogging(updaterUid);
    
    // Update the 'role' field in the Firestore collection for the specified user
    await admin.firestore().collection('userroles').doc(userId).update({
      role: role,
      dateModified: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get target user details for logging
    const targetUserRecord = await admin.auth().getUser(userId);

    // 📝 LOG THE ROLE UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'role-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        targetUserEmail: targetUserRecord.email,
        targetUserName: targetUserRecord.displayName || targetUserRecord.email?.split('@')[0],
        oldRole: oldRole,
        newRole: role,
        roleChangeType: oldRole ? 'role-modification' : 'initial-role-assignment'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        userId: userId,
        timestamp: new Date().toISOString(),
        updateMethod: 'admin-panel'
      }
    });

    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'User role update failed' });
  }
});

// ✅ NEW: Get all users with EVENT LOGGING
app.get('/api/users', async (req, res) => {
  try {
    const { viewerUid } = req.query;
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    // Fetch users from userroles collection
    const usersSnapshot = await admin.firestore().collection('userroles').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 📝 LOG THE USER LIST VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'user-list',
      targetId: 'all-users',
      details: {
        viewType: 'user-management',
        usersCount: users.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        timestamp: new Date().toISOString(),
        viewContext: 'admin-dashboard'
      }
    });

    res.status(200).json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ✅ NEW: Delete user with EVENT LOGGING
app.delete('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { deleterUid, userName } = req.body;

    // Get user data before deletion for logging
    const userRecord = await admin.auth().getUser(userId);
    const userDoc = await admin.firestore().collection('userroles').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Get deleter details for logging
    const deleterDetails = await getUserDetailsForLogging(deleterUid);

    // Delete from Firebase Auth
    await admin.auth().deleteUser(userId);
    
    // Delete from Firestore
    await admin.firestore().collection('userroles').doc(userId).delete();

    // 📝 LOG THE USER DELETION EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'delete',
      actorUid: deleterUid,
      actorDisplayName: deleterDetails.displayName,
      actorEmail: deleterDetails.email,
      actorRole: deleterDetails.role,
      targetType: 'user',
      targetId: userId,
      details: {
        deletedUserEmail: userRecord.email,
        deletedUserName: userName || userRecord.displayName || userRecord.email?.split('@')[0],
        deletedUserRole: userData.role,
        deletionMethod: 'admin-panel'
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        deletedUserId: userId,
        timestamp: new Date().toISOString(),
        permanentDeletion: true
      }
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============= ADDITIONAL FORMS BACKEND ENDPOINTS =============

// Get forms from multiple collections (for CDD and Claims tables)
app.post('/api/forms/multiple', async (req, res) => {
  try {
    const { collections } = req.body;
    const userAuth = req.headers.authorization;
    
    if (!Array.isArray(collections)) {
      return res.status(400).json({ error: 'Collections must be an array' });
    }
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
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
app.patch('/api/forms/:collectionName/:formId/status', async (req, res) => {
  try {
    const { collectionName, formId } = req.params;
    const { status } = req.body;
    const userAuth = req.headers.authorization;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
    if (userAuth && userAuth.startsWith('Bearer ')) {
      const token = userAuth.split(' ')[1];
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        userDetails = await getUserDetailsForLogging(decodedToken.uid);
        userDetails.uid = decodedToken.uid;
      } catch (err) {
        console.warn('Invalid token for status update:', err);
      }
    }
    
    // Get current form data for logging
    const formDoc = await db.collection(collectionName).doc(formId).get();
    const oldStatus = formDoc.exists ? formDoc.data().status : null;
    
    // Update the form status
    await db.collection(collectionName).doc(formId).update({
      status: status,
      statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      statusUpdatedBy: userDetails.email || 'Unknown'
    });

    // 📝 LOG STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'update-form-status',
      actorUid: userDetails.uid,
      actorDisplayName: userDetails.displayName,
      actorEmail: userDetails.email,
      actorRole: userDetails.role,
      targetType: 'form',
      targetId: formId,
      details: {
        collection: collectionName,
        formId: formId,
        oldStatus: oldStatus,
        newStatus: status,
        timestamp: new Date().toISOString()
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        updateTimestamp: new Date().toISOString()
      }
    });

    console.log(`✅ Updated status for form ${formId} in ${collectionName} from '${oldStatus}' to '${status}'`);
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update form status' });
  }
});

// Delete form with event logging
app.delete('/api/forms/:collectionName/:formId', async (req, res) => {
  try {
    const { collectionName, formId } = req.params;
    const userAuth = req.headers.authorization;
    
    // Get user details for logging
    let userDetails = { displayName: null, email: null, role: null, uid: null };
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
app.get('/api/forms/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { viewerUid } = req.query;
    
    // Get viewer details for logging
    const viewerDetails = await getUserDetailsForLogging(viewerUid);
    
    const dataRef = admin.firestore().collection(collectionName);
    const q = dataRef.orderBy('timestamp', 'desc');
    const snapshot = await q.get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 📝 LOG THE FORMS VIEW EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'view',
      actorUid: viewerUid,
      actorDisplayName: viewerDetails.displayName,
      actorEmail: viewerDetails.email,
      actorRole: viewerDetails.role,
      targetType: 'form-list',
      targetId: collectionName,
      details: {
        viewType: 'form-collection',
        formType: collectionName,
        formsCount: data.length
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        collection: collectionName,
        timestamp: new Date().toISOString(),
        viewContext: 'admin-dashboard'
      }
    });

    res.json({ data });
  } catch (error) {
    console.error(`Error fetching ${collectionName} data:`, error);
    res.status(500).json({ error: `Failed to fetch ${collectionName} data` });
  }
});

// ✅ NEW: Update form status with EVENT LOGGING
app.put('/api/forms/:collectionName/:docId/status', async (req, res) => {
  try {
    const { collectionName, docId } = req.params;
    const { status, updaterUid, userEmail, formType, comment } = req.body;

    // Get current form data before update
    const formDoc = await admin.firestore().collection(collectionName).doc(docId).get();
    const formData = formDoc.exists ? formDoc.data() : {};
    const oldStatus = formData.status;
    
    // Get updater details for logging
    const updaterDetails = await getUserDetailsForLogging(updaterUid);

    // Update form status
    await admin.firestore().collection(collectionName).doc(docId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: updaterUid
    });

    // 📝 LOG THE STATUS UPDATE EVENT
    const location = await getLocationFromIP(req.ipData?.raw || '0.0.0.0');
    await logAction({
      action: 'status-update',
      actorUid: updaterUid,
      actorDisplayName: updaterDetails.displayName,
      actorEmail: updaterDetails.email,
      actorRole: updaterDetails.role,
      targetType: 'form',
      targetId: docId,
      details: {
        formType: formType || collectionName,
        formCollection: collectionName,
        oldStatus: oldStatus,
        newStatus: status,
        comment: comment,
        formSubmitterEmail: userEmail || formData.email
      },
      ipMasked: req.ipData?.masked,
      ipHash: req.ipData?.hash,
      rawIP: req.ipData?.raw,
      location: location,
      userAgent: req.headers['user-agent'] || 'Unknown',
      meta: {
        formId: docId,
        collection: collectionName,
        timestamp: new Date().toISOString(),
        updateMethod: 'admin-panel'
      }
    });

    res.status(200).json({ message: 'Form status updated successfully' });
  } catch (error) {
    console.error('Error updating form status:', error);
    res.status(500).json({ error: 'Failed to update form status' });
  }
});

// ✅ NEW: Download PDF with EVENT LOGGING
app.post('/api/pdf/download', async (req, res) => {
  try {
    const { formData, formType, downloaderUid, fileName } = req.body;
    
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

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log(`📝 Events logging: ${EVENTS_CONFIG.ENABLE_EVENTS_LOGGING ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🌐 IP geolocation: ${EVENTS_CONFIG.ENABLE_IP_GEOLOCATION ? 'ENABLED' : 'DISABLED'}`);
  console.log(`⏰ Raw IP retention: ${EVENTS_CONFIG.RAW_IP_RETENTION_DAYS} days`);
  
  // Force generate sample events on every startup for testing
  console.log('🧪 Generating initial sample events for testing...');
  setTimeout(async () => {
    try {
      const sampleEvents = [
        {
          action: 'login',
          actorUid: 'startup-user',
          actorDisplayName: 'Startup User',
          actorEmail: 'startup@example.com',
          actorRole: 'admin',
          targetType: 'user',
          targetId: 'startup-user',
          details: { loginMethod: 'startup-generated', success: true },
          ipMasked: '127.0.0.***',
          ipHash: 'startup123',
          rawIP: '127.0.0.1',
          location: 'Server Startup',
          userAgent: 'Server/1.0',
          meta: { sampleEvent: true, startupGenerated: true, timestamp: new Date().toISOString() }
        }
      ];

      for (const event of sampleEvents) {
        await logAction(event);
      }
      
      console.log('✅ Startup sample events generated successfully');
    } catch (error) {
      console.log('⚠️  Failed to generate startup sample events:', error.message);
    }
  }, 3000); // Wait 3 seconds after server starts
  
  await setSuperAdminOnStartup();
});
