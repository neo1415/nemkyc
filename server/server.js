const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./service.json');
const cors = require('cors'); 

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nem-kyc.firebaseapp.com', // Replace with your Firebase database URL
});

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = ['https://nkyc.netlify.app', 'http://localhost:3000', 'https://nemkyc.vercel.app'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  })
);
const db = admin.firestore();

app.use(express.json());

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
      // Add more user properties as needed
    }));

    return userList;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Modify your '/get-users' endpoint to simply fetch and return user data
app.get('/get-users', async (req, res) => {
  try {
    const users = await fetchUsersFromFirestore();
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// User registration route
// User registration route
app.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Create a new Firebase user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    //  const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Set the user's role and email in Firestore
    await admin.firestore().collection('userroles').doc(userRecord.uid).set({
      role: 'default',
      email,
      name,
      // timestamp, 
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    
    res.status(500).json({ error: 'Registration failed' });
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

app.post('/check-user-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Fetch the user's role from your database or authentication system
    // In this example, we assume you have a Firestore collection named 'userroles'
    const userSnapshot = await admin.firestore().collection('userroles').doc(uid).get();
    
    if (userSnapshot.exists) {
      const userData = userSnapshot.data();
      const userRole = userData.role; // Assuming 'role' is the custom claim for roles

      res.status(200).json({ role: userRole });
    } else {
      // Handle the case where the user does not exist or has no role set.
      res.status(404).json({ error: 'User not found or no role set' });
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ error: 'Error checking user role' });
  }
});

// ...

// Role assignment route to assign the 'admin' role
app.post('/assign-admin-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Set the 'admin' custom claim for the specified user
    await admin.auth().setCustomUserClaims(uid, { admin: true });

    res.status(200).json({ message: 'Admin role assigned successfully' });
  } catch (error) {
    console.error('Error assigning admin role:', error);
    res.status(500).json({ error: 'Admin role assignment failed' });
  }
});

// Role assignment route to assign the 'moderator' role
app.post('/assign-moderator-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Set the 'moderator' custom claim for the specified user
    await admin.auth().setCustomUserClaims(uid, { moderator: true });

    res.status(200).json({ message: 'Moderator role assigned successfully' });
  } catch (error) {
    console.error('Error assigning moderator role:', error);
    res.status(500).json({ error: 'Moderator role assignment failed' });
  }
});

// Role assignment route to assign the 'default' role
app.post('/assign-default-role/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    // Set the 'default' custom claim for the specified user
    await admin.auth().setCustomUserClaims(uid, { admin: false, moderator: false });

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


app.post('/check-user-role', async (req, res) => {
  try {
    const { uid, role } = req.body;
    const user = await admin.auth().getUser(uid);

    // Check if the custom claim for the specified role exists
    const hasRole = !!user.customClaims?.[role];

    res.json({ hasRole });
  } catch (error) {
    console.error('Error checking user role:', error);
    res.status(500).json({ error: 'Error checking user role' });
  }
});


// ...

// Role assignment route to toggle roles
// Role assignment route to toggle roles
// app.post('/assign-admin-role/:uid', async (req, res) => {
//   try {
//     const { uid } = req.params;

//     // Implement logic to assign the admin role (e.g., 'admin')
//     // Update the user's role in your database or authentication system accordingly
//     // Example: Set the custom claim for the specified user
//     await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

//     // Fetch the user's ID token to update it with the new claims
//     const user = await admin.auth().getUser(uid);
//     const token = await admin.auth().createCustomToken(user.uid, { role: 'admin' });
    
//     res.status(200).json({ message: 'Admin role assigned successfully', token });
//   } catch (error) {
//     console.error('Error assigning admin role:', error);
//     res.status(500).json({ error: 'Admin role assignment failed' });
//   }
// });


// Role assignment route to assign the user role
// app.post('/assign-user-role/:uid', async (req, res) => {
//   try {
//     const { uid } = req.params;

//     // Implement logic to assign the user role (e.g., 'user')
//     // Update the user's role in your database or authentication system accordingly
//     // Example: Set the custom claim for the specified user
//     await admin.auth().setCustomUserClaims(uid, { role: 'user' });

//     res.status(200).json({ message: 'User role assigned successfully' });
//   } catch (error) {
//     console.error('Error assigning user role:', error);
//     res.status(500).json({ error: 'User role assignment failed' });
//   }
// });


// Role assignment route to assign the default role
// app.post('/assign-default-role/:uid', async (req, res) => {
//   try {
//     const { uid } = req.params;

//     // Implement logic to assign the default role (e.g., 'default')
//     // Update the user's role in your database or authentication system accordingly
//     // Example: Set the custom claim for the specified user
//     await admin.auth().setCustomUserClaims(uid, { role: 'default' });

//     res.status(200).json({ message: 'Default role assigned successfully' });
//   } catch (error) {
//     console.error('Error assigning default role:', error);
//     res.status(500).json({ error: 'Default role assignment failed' });
//   }
// });


// User login route
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Implement user authentication logic here, e.g., using Firebase Auth
    // Check if the user's credentials are valid and return an appropriate response

    // Example using Firebase Auth
    const userCredential = await admin.auth().signInWithEmailAndPassword(email, password);
    
    // If authentication is successful, you can return a success response
    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: 'Login failed' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});