
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTyrzbQ4xYV0IAvngwgCUBf6EPnflacSw",
  authDomain: "nem-customer-feedback-8d3fb.firebaseapp.com",
  projectId:  "nem-customer-feedback-8d3fb",
  storageBucket: "nem-customer-feedback-8d3fb.appspot.com",
  messagingSenderId: "524975485983",
  appId: "1:524975485983:web:3a859424a3314d53ab112a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
