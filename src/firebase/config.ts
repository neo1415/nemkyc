
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Set session persistence - user must log in again when tab/browser closes
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log('Firebase auth persistence set to SESSION (clears on tab close)');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
export const db = getFirestore(app);
export const storage = getStorage(app);

// Test Firebase connection
console.log('Firebase initialized successfully');

// Test Firestore connection
try {
  console.log('Firestore app:', db.app.name);
} catch (error) {
  console.error('Firestore connection error:', error);
}

// Test Storage connection
try {
  console.log('Storage app:', storage.app.name);
} catch (error) {
  console.error('Storage connection error:', error);
}

export default app;
