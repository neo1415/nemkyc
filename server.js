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
  'https://843d1ea4-027c-40d0-9a4f-1a1f59aedfa0.lovableproject.com',
  "https://preview--sleek-navisphere-65-90-93-704.lovable.app",
  "https://sleek-navisphere-65-90-93-704.lovable.app",
  "https://lovable.dev/projects/2c7e8277-18dc-4b3b-b8b8-36a839c5a31a",
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

app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Server is running!</h1>');
});

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

// ✅ NEW: Claims Approval/Rejection with Evidence Preservation
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

    // Get approver details
    const approverRecord = await admin.auth().getUser(approverUid);
    const approverName = approverRecord.displayName || approverRecord.email;

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

    res.status(200).json({ customToken, role: 'user' });  // Example response

  } catch (error) {
    console.error(error.message);
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

// Function to handle form submission
async function handleFormSubmission(req, res, formType, collectionName) {
  const formData = req.body;

  // Perform validation as needed here...

  try {
    const docId = uuidv4();

    // Add form to the Firestore collection
    await admin.firestore().collection(collectionName).doc(docId).set({
      ...formData,
      status: 'processing',   
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Fetch admin emails
    const adminEmails = await getAllAdminEmails();

    // Send email to admins if found
    if (adminEmails.length > 0) {
      await sendEmailToAdmins(adminEmails, formType, formData);
    } else {
      // console.log('No admin emails found');
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

    res.status(201).json({ message: 'Form submitted successfully' });
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

    // 🔐 Set custom claim if not already set
    if (!user.customClaims?.superAdmin) {
      await admin.auth().setCustomUserClaims(uid, {
        ...user.customClaims,
        superAdmin: true,
      });
      console.log(`✅ Custom claim set: ${email} is now a superAdmin`);
    } else {
      console.log(`ℹ️ Custom claim already exists for ${email}`);
    }

    // 🔐 Also set Firestore role
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
      console.log(`✅ Firestore role set: ${email} is now a superAdmin`);
    } else {
      console.log(`ℹ️ Firestore role already set for ${email}`);
    }
  } catch (error) {
    console.error(`❌ Failed to assign super admin:`, error);
  }
};

app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await setSuperAdminOnStartup(); // ← 🚨 this line makes it happen
});
