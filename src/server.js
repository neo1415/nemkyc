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

// const session = require('express-session');
// const crypto = require('crypto');


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

// const firebaseAPIKey = process.env.REACT_APP_FIREBASE_KEY;

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://nem-server-rhdb.onrender.com',
  'https://nem-kyc.web.app',
  "crypto-trade-template-591.lovable.app",
  'https://preview--orangery-ventures-harmony-242.lovable.app',
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

// Rate limiter middleware to limit login attempts
// const = rateLimit({
//   windowMs: 10 * 60 * 1000, // 10 minutes window
//   max: 15, // Allow up to 15 requests per IP
//   message: 'Too many login attempts, please try again later.',
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

// Timestamp validation middleware
app.use((req, res, next) => {
  if (req.path === '/csrf-token' || req.path === '/listenForUpdates') {
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
  if (req.path === '/listenForUpdates') {
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

const authenticateUser = async (email, password) => {
  const firebaseAPIKey = process.env.REACT_APP_FIREBASE_KEY;
  
  try {
    const authResponse = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseAPIKey}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );
    return authResponse.data.idToken;
  } catch (error) {
    throw new Error('Authentication failed');
  }
};

const createCustomToken = async (email) => {
  try {
    // Attempt to get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Successfully fetched user: ${userRecord.uid}`);

    // Attempt to create a custom token for the user
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log(`Custom token created successfully for user: ${userRecord.uid}`);
    
    return customToken;
  } catch (error) {
    // Log specific error messages to understand the failure
    if (error.code === 'auth/user-not-found') {
      console.error(`User not found for email: ${email}`);
    } else {
      console.error('Error creating custom token:', error.message);
    }

    throw new Error('Failed to create custom token');
  }
};

// Function to create super admin user
// const createSuperAdmin = async () => {
//   try {
//     const email = 'adneo502@gmail.com';
//     const password = 'admin1234';
//     const role = 'admin';

//     console.log('Starting the creation of super admin user...');

//     // Check if the user already exists
//     let userRecord;
//     try {
//       userRecord = await admin.auth().getUserByEmail(email);
//       console.log('User already exists:', userRecord);
//     } catch (error) {
//       if (error.code === 'auth/user-not-found') {
//         // User does not exist, create a new one
//         userRecord = await admin.auth().createUser({
//           email,
//           password,
//           displayName: 'Super Admin',
//         });
//         console.log('User created:', userRecord);
//       } else {
//         throw error;
//       }
//     }

//     // Set custom claim to assign Admin role
//     await admin.auth().setCustomUserClaims(userRecord.uid, { [role]: true });
//     console.log('Custom claims set for user:', userRecord.uid);

//     // Update the Firestore document with the admin role
//     const userRolesRef = db.collection('userroles').doc(userRecord.uid);
//     await userRolesRef.set({
//       email: userRecord.email,
//       name: userRecord.displayName,
//       role: 'admin', // Update the role to admin
//     }, { merge: true }); // Merge with existing data if document exists

//     console.log('User role updated in Firestore:', userRecord.uid);

//   } catch (error) {
//     console.error('Error creating super admin user:', error);
//   }
// };

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com', // Microsoft's SMTP server
  port: 587,                  // Port for STARTTLS
  secure: false,              // Use STARTTLS
  auth: {
    user: 'kyc@nem-insurance.com', // Your email address
    pass: process.env.EMAIL_PASS,  // Your email password or app password
  },
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


// Backend route to verify ID token and create a custom token
app.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).send({ error: 'ID token is required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(200).json({ customToken, role: userRecord.customClaims?.role || 'user' });
  } catch (error) {
    console.error('Error verifying ID token:', error);
    res.status(500).send({ error: 'Authentication failed' });
  }
});

app.delete('/delete/:collection/:documentId', async (req, res) => {
  const { collection, documentId } = req.params;

  if (!collection || !documentId) {
    return res.status(400).send({ error: 'Collection and documentId are required' });
  }

  try {
    const docRef = db.collection(collection).doc(documentId);
    await docRef.delete();
    res.status(200).send({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).send({ error: 'Error deleting document' });
  }
});

// Password reset route
app.post('/resetpassword', [
  body('uid').isString().notEmpty(),
  body('newPassword').isString().notEmpty().isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { uid, newPassword } = req.body;

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    await admin.auth().setCustomUserClaims(uid, { forcePasswordReset: null });
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});


app.get('/listenForUpdates', (req, res) => {
  try {
    // Set the response headers to indicate Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const userRolesCollection = db.collection('userroles');

    userRolesCollection.onSnapshot((snapshot) => {
      const userList = snapshot.docs.map((doc) => ({
        uid: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        role: doc.data().role,
      }));

      // Send the updated user list as an event
      res.write(`data: ${JSON.stringify({ users: userList })}\n\n`);
    });
  } catch (error) {
    console.error('Error listening for updates:', error);
    res.status(500).json({ error: 'Failed to listen for updates' });
  }
});


async function fetchUsersFromFirestore() {
  try {
    const usersSnapshot = await admin
      .firestore()
      .collection('userroles')
      // .orderBy('timestamp', 'desc') // Order by timestamp in descending order (latest first)
      .get();

    const userList = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      name: doc.data().name,
      email: doc.data().email,
      role: doc.data().role,
      // Add more user properties  later
    }));

    return userList;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Modify the '/get-users' endpoint to simply fetch and return user data
app.get('/get-users', async (req, res) => {
  try {
    const users = await fetchUsersFromFirestore();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/clear-password-reset-claims', async (req, res) => {
  const { uid } = req.body;

  // console.log('Request received to clear custom claims for UID:', uid);

  try {
    const user = await admin.auth().getUser(uid);
    // console.log('User retrieved:', user);

    const claims = user.customClaims || {}; // Handle the case where customClaims is undefined

    if ('forcePasswordReset' in claims) {
      delete claims.forcePasswordReset;
      await admin.auth().setCustomUserClaims(uid, claims);
      console.log('User claims updated successfully for UID:');
      res.status(200).json({ message: 'User claims updated successfully' });
    } else {
      console.log('No force Password Reset claim found for UID:');
      res.status(200).json({ message: 'No forcePasswordReset claim to remove' });
    }

  } catch (error) {
    console.error('Error updating user claims:', error);
    res.status(500).json({ error: 'Failed to update user claims' });
  }
});

// Backend route to handle login securely
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

// User registration route

app.post('/register', async (req, res) => {

  const generateRandomPassword = (length = 8) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&(_[]|,';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  const { email, name, role = 'Default' } = req.body;
  const trimmedEmail = email.trim(); // Trim any extra spaces
  const temporaryPassword = generateRandomPassword(); // Generate a random password

  try {
    // Basic email validation check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    console.log('Starting user registration process...');

    // Create user in Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: trimmedEmail,
      password: temporaryPassword,
      displayName: name,
    });

    console.log('User created successfully:');

    // Set custom claims, including forcePasswordReset and role
    const claims = {
      forcePasswordReset: true,
      role: role,
    };
    await admin.auth().setCustomUserClaims(userRecord.uid, claims);

    console.log('Custom claims set for user:');

    // Add user to Firestore userRoles collection
    const userRolesRef = db.collection('userroles').doc(userRecord.uid);
    await userRolesRef.set({
      email: userRecord.email,
      name: userRecord.displayName,
      role: role,
    });

    // console.log('User role added to Firestore:', role);

    // Send welcome email
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com', // Microsoft's SMTP server
      port: 587,                  // Port for STARTTLS
      secure: false,              // Use STARTTLS
      auth: {
        user: 'kyc@nem-insurance.com', // Your email address
        pass: process.env.EMAIL_PASS,  // Your email password or app password
      },
    });
    
    const mailOptions = {
      from: 'kyc@nem-insurance.com',
      to: trimmedEmail,
      subject: 'NEM Customer Feedback account',
      html: `<p>Dear ${name},</p>
      <p>Your account has been successfully created. Here are your login details:</p>
      <p><strong>Email:</strong> ${trimmedEmail}<br>
      <strong>Password:</strong> ${temporaryPassword}</p>
      <p>Please click the following link to log in to the application:<br>
      <a href="https://nemforms.com/signin">Log in to NEM Feedback</a></p>
      <p>Best regards,<br>NEM Customer Feedback Team</p>`,
    };

    console.log('Sending welcome email to:', trimmedEmail);

    await transporter.sendMail(mailOptions);

    console.log('Welcome email sent successfully');

    res.status(201).json({ message: 'User registration successful, email sent', user: userRecord });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ error: 'User registration failed', details: error.message });
  }
});



// Define the endpoint to delete a user by UID
app.delete('/delete-user/:uid', async (req, res) => {
  const { uid } = req.params;

  try {
    // Delete the user's document from Firestore
    await admin.firestore().collection('userroles').doc(uid).delete();

    // Delete the user's authentication record from Firebase Authentication
    await admin.auth().deleteUser(uid);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


//Update user role or role assignment
app.post('/update-user-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (role === undefined) {
      return res.status(400).json({ error: 'Role is missing in the request body' });
    }

    // Update the 'role' field in the Firestore collection for the specified user
    await admin.firestore().collection('userroles').doc(uid).update({
      role: role,
    });

    res.status(200).json({ message: 'User role updated successfully in Firestore' });
  } catch (error) {
    console.error('Error updating user role in Firestore:', error);
    res.status(500).json({ error: 'User role update in Firestore failed' });
  }
});


// Role assignment route to assign the 'super admin' role
app.post('/assign-super-admin-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get the existing custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Merge the new 'admin' role with the existing claims
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      superAdmin: true,
    });

    res.status(200).json({ message: 'Super Admin role assigned successfully' });
  } catch (error) {
    console.error('Error assigning super admin role:', error);
    res.status(500).json({ error: 'Super Admin role assignment failed' });
  }
});

// Role assignment route to assign the 'admin' role
app.post('/assign-admin-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get the existing custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Merge the new 'admin' role with the existing claims
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      admin: true,
    });

    res.status(200).json({ message: 'Admin role assigned successfully' });
  } catch (error) {
    console.error('Error assigning admin role:', error);
    res.status(500).json({ error: 'Admin role assignment failed' });
  }
});

// Role assignment route to assign the 'moderator' role
app.post('/assign-compliance-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get the existing custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Merge the new 'moderator' role with the existing claims
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      compliance: true,
    });

    res.status(200).json({ message: 'Compliance role assigned successfully' });
  } catch (error) {
    console.error('Error assigning compliance role:', error);
    res.status(500).json({ error: 'Compliance role assignment failed' });
  }
});

// Role assignment route to assign the 'moderator' role
app.post('/assign-claims-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get the existing custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Merge the new 'moderator' role with the existing claims
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      claims: true,
    });

    res.status(200).json({ message: 'Claims role assigned successfully' });
  } catch (error) {
    console.error('Error assigning claims role:', error);
    res.status(500).json({ error: 'Claims role assignment failed' });
  }
});


// Role assignment route to assign the 'default' role
app.post('/assign-default-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Get the existing custom claims
    const user = await admin.auth().getUser(uid);
    const currentClaims = user.customClaims || {};

    // Merge the 'default' role with the existing claims
    await admin.auth().setCustomUserClaims(uid, {
      ...currentClaims,
      admin: false,
      compliance: false,
    });

    res.status(200).json({ message: 'Default role assigned successfully' });
  } catch (error) {
    console.error('Error assigning default role:', error);
    res.status(500).json({ error: 'Default role assignment failed' });
  }
});

// Check admin claim route (if needed)
app.post('/check-admin-claim', async (req, res) => {
  try {
    const { uid } = req.body;
    const user = await admin.auth().getUser(uid);

    // Check the custom claim
    const isAdmin = !!user.customClaims?.admin;

    res.json({ isAdmin });
  } catch (error) {
    console.error('Error checking admin claim:', error);
    res.status(500).json({ error: 'Error checking admin claim' });
  }
});

app.post('/assign-role/:uid/:role', async (req, res) => {
  try {
    const { uid, role } = req.params;

    // Check if the specified role is one of the allowed roles
    if (role !== 'admin' && role !== 'user' && role !== 'default') {
      res.status(400).json({ error: 'Invalid role specified' });
      return;
    }

    // Set the custom claim for the specified user
    await admin.auth().setCustomUserClaims(uid, { [role]: true });

    res.status(200).json({ message: `${role} role assigned successfully` });
  } catch (error) {
    console.error(`Error assigning ${role} role:`, error);
    res.status(500).json({ error: `${role} role assignment failed` });
  }
});


app.post('/validate-user-role', async (req, res) => {
  try {
    const { uid, role } = req.body;
    // console.log('Validating role for UID:', uid);
    const user = await admin.auth().getUser(uid);
    const userRole = user.customClaims?.role || 'default';

    const isValid = userRole === role;
    console.log('Validation result:', isValid);

    res.json({ valid: isValid });
  } catch (error) {
    console.error('Error validating user role:', error);
    res.status(500).json({ error: 'Error validating user role' });
  }
});

app.post('/check-user-role', async (req, res) => {
  try {
    const { uid } = req.body;
    // console.log('Fetching user role for UID:', uid);
    const user = await admin.auth().getUser(uid);

    // console.log('User retrieved from Firebase:', user);
    // console.log('User custom claims:', user.customClaims);

    // Check and return the role from custom claims
    const role =  user.customClaims?.superAdmin ? 'superAdmin' :
                  user.customClaims?.admin ? 'admin' :
                 user.customClaims?.compliance ? 'compliance' :
                 'default';
    console.log('Fetched role:', role);

    res.json({ role });
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ error: 'Error checking user role' });
  }
});

const parseLogEntry = (entry) => {
  const logPattern = /(\S+) - - \[(.*?)\] "(.*?)" (\d{3}) (\d+) "(.*?)" "(.*?)"/;
  const match = entry.match(logPattern);
  if (match) {
    return {
      ip: match[1] === '::1' ? '127.0.0.1' : match[1],  // Handle IPv6 loopback address
      date: match[2],
      request: match[3],
      statusCode: match[4],
      responseSize: match[5],
      referer: match[6],
      userAgent: match[7],
    };
  }
  return null;
};


app.get('/logs', (req, res) => {
  fs.readFile(path.join(__dirname, 'access.log'), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read log file' });
    }
    const logs = data.split('\n').map((line, index) => {
      const logEntry = parseLogEntry(line);
      return logEntry ? { id: index, ...logEntry } : null;
    }).filter(Boolean);

    // Sort the logs by ID in descending order (latest first)
    logs.sort((a, b) => b.id - a.id);

    res.status(200).json({ logs });
  });
});


app.get('/logs/:id', (req, res) => {
  const logId = parseInt(req.params.id, 10);
  // console.log('Request received for log ID:', logId); // Debugging log

  fs.readFile(path.join(__dirname, 'access.log'), 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file:', err);
      return res.status(500).json({ error: 'Failed to read log file' });
    }
    const logs = data.split('\n').map((line, index) => {
      const logEntry = parseLogEntry(line);
      return logEntry ? { id: index, ...logEntry } : null;
    }).filter(Boolean);

    // console.log('Total logs parsed:', logs.length); // Debugging log

    if (logId >= 0 && logId < logs.length) {
      res.status(200).json({ log: logs[logId] });
    } else {
      res.status(404).json({ error: 'Log not found' });
    }
  });
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

app.post("/submit-public-liability-form", upload.single("claimWrittenForm"), async (req, res) => {
  try {
    const file = req.file;
    const data = req.body;

    // Parse fields from frontend
    const parsedData = {};
    for (const key in data) {
      try {
        parsedData[key] = JSON.parse(data[key]);
      } catch {
        parsedData[key] = data[key];
      }
    }

    // If file exists, upload to Firebase Storage
    let fileUrl = null;
    if (file) {
      const storageFile = bucket.file(`uploads/public-liability/${Date.now()}-${file.originalname}`);

      await storageFile.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Make file publicly readable (optional)
      await storageFile.makePublic();
      fileUrl = storageFile.publicUrl();

      // Replace file with URL
      parsedData.claimWrittenForm = {
        url: fileUrl,
        name: file.originalname,
        type: file.mimetype,
      };
    }

    // Save to Firestore
    await admin.firestore().collection("public-liability-submissions").add({
      ...parsedData,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "Form submitted successfully", fileUrl });
  } catch (error) {
    console.error("Submission error:", error);
    res.status(500).json({ error: "Failed to submit form." });
  }
});


//fetch data for corporate kyc

app.get('/get-corporate-data', async (req, res) => {
  getFormData(req, res, 'corporate-kyc')
});

app.get('/get-brokers-data', async (req, res) => {
  getFormData(req, res, 'brokers-kyc')
});


app.get('/get-partners-data', async (req, res) => {
  getFormData(req, res, 'partners-kyc')
});


// Endpoint to retrieve saved form data for a specific step
app.get('/get-agents-data', async (req, res) => {
  getFormData(req, res, 'agents-kyc')
});

//fetch data for individual kyc
app.get('/get-individual-data', async (req, res) => {
  getFormData(req, res, 'individual-kyc')
});


app.get('/get-corporate-kyc-data', async (req, res) => {
  getFormData(req, res, 'corporate-kyc-form')
});

app.get('/get-individual-kyc-data', async (req, res) => {
  getFormData(req, res, 'Individual-kyc-form')
});

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

// Corporate KYC Form Submission Endpoint
app.post('/submit-corporate-kyc-form', (req, res) => {
  handleFormSubmission(req, res, 'Corporate KYC', 'corporate-kyc-form');
});

// Individual KYC Form Submission Endpoint
app.post('/submit-individual-kyc-form', (req, res) => {
  handleFormSubmission(req, res, 'Individual KYC', 'Individual-kyc-form');
});

app.post('/submit-corporate-form',(req, res) => {
  handleFormSubmission(req, res, 'Corporate CDD', 'corporate-kyc');
});

app.post('/submit-brokers-form', (req, res) => {
  handleFormSubmission(req, res, 'Brokers Form', 'brokers-kyc');
});

app.post('/submit-partners-form', (req, res) => {
  handleFormSubmission(req, res, 'Partners Form', 'partners-kyc');
});

app.post('/submit-agents-form', (req, res) => {
  handleFormSubmission(req, res, 'Agents Form', 'agents-kyc');
});

app.post('/submit-individual-form', (req, res) => {
  handleFormSubmission(req, res, 'Individual CDD', 'individual-kyc');
});

async function handleFormEdit(req, res, collectionName){
  const {docId} = req.params;
  const formData = req.body

  try{
    await admin.firestore().collection(collectionName).doc(docId).update({
      ...formData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    const doc = await admin.firestore().collection(collectionName).doc(docId).get();
    const updatedAtTimestamp = doc.data().timestamp;
    const updatedAtDate = updatedAtTimestamp.toDate();
    const formattedDate = `${String(updatedAtDate.getDate()).padStart(2, '0')}/${String(updatedAtDate.getMonth() + 1).padStart(2, '0')}/${String(updatedAtDate.getFullYear())}`;

    await admin.firestore().collection(collectionName).doc(docId).update({
      updatedAt: formattedDate,
    });

    res.status(200).json({ message: 'Form updated successfully' });
  } catch (err) {
    console.error('Error during form update:', err);
    res.status(500).json({ error: 'Form update failed' });
  }

  }



app.post('/edit-brokers-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'brokers-kyc')
});

app.post('/edit-corporate-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'corporate-kyc')
});

app.post('/edit-individual-form/:docId', async (req, res) => {

  handleFormEdit(req, res, 'individual-kyc')

});

app.post('/edit-agents-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'agents-kyc')
});

app.post('/edit-partners-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'partners-kyc')
});

app.post('/edit-individual-kyc-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'individual-kyc-form')
});

app.post('/edit-corporate-kyc-form/:docId', async (req, res) => {
  handleFormEdit(req, res, 'corporate-kyc-form')
});

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
