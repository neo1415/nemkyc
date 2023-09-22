const admin = require('firebase-admin');

const serviceAccount = require('./service.json'); // Replace with your service account key JSON file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nem-kyc.firebaseio.com' // Replace with your Firebase project's URL
});