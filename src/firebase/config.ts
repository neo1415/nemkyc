
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY ,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN ,
  projectId:process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId:process.env.REACT_APP_MESSENGER_ID,
  appId: process.env.REACT_APP_FIREBASE_APPID,
  measurementId:process.env.REACT_APP_MEASUREMENT_ID
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
