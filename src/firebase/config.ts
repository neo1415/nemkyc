
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTyrzbQ4xYV0IAvngwgCUBf6EPnflacSw",
  authDomain: "nem-customer-feedback-8d3fb.firebaseapp.com",
  projectId: "nem-customer-feedback-8d3fb",
  storageBucket: "nem-customer-feedback-8d3fb.appspot.com",
  messagingSenderId: "524975485983",
  appId: "1:524975485983:web:3a859424a3314d53ab112a",
  measurementId: "G-8BH08J5X7G"
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
