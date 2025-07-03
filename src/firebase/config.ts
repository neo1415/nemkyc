
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Only connect to emulators in development if not already connected
if (process.env.NODE_ENV === 'development') {
  try {
    // These will only connect if not already connected
    if (!auth.emulatorConfig) {
      // connectAuthEmulator(auth, 'http://localhost:9099');
    }
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      // connectFirestoreEmulator(db, 'localhost', 8080);
    }
    if (!storage._delegate._host.includes('localhost')) {
      // connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    console.log('Emulators not available or already connected');
  }
}

export default app;
