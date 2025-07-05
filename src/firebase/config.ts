
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB4g7kYRDUxS_fQ_ilwWOq4P-F4D0YAMuY",
  authDomain: "nem-insurance-42c48.firebaseapp.com",
  projectId: "nem-insurance-42c48",
  storageBucket: "nem-insurance-42c48.firebasestorage.app",
  messagingSenderId: "1098480780228",
  appId: "1:1098480780228:web:f8c9c2e5d3a4b6e7f8c9c2",
  measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
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
