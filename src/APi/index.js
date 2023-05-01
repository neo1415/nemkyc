// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth} from 'firebase/auth'
import {getStorage} from 'firebase/storage'
import { getFirestore } from 'firebase/firestore';

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4p-m8gD2mcxOFHw6rTbJb0QBs78Emv3s",
  authDomain: "nem-kyc.firebaseapp.com",
  projectId: "nem-kyc",
  storageBucket: "nem-kyc.appspot.com",
  messagingSenderId: "294942287895",
  appId: "1:294942287895:web:0352e723c74993d9ac9452",
  measurementId: "G-GQ4MKK9YVQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app)

export  const storage = getStorage(app)

export const auth = getAuth()

export default firebaseConfig