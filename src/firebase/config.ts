
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
 apiKey: "AIzaSyB4g7kYRDUxS_fQ_ilwWOq4P-F4D0YAMuY",
  authDomain: "nem-forms-dev-demo.firebaseapp.com",
  projectId: "nem-forms-dev-demo",
  storageBucket: "nem-forms-dev-demo.firebasestorage.app",
  messagingSenderId: "635637955444",
  appId: "1:635637955444:web:25328e1cdd745d28ac0a21",
  measurementId: "G-0JMZ0NMD0H"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
