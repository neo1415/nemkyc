const admin = require('./server-utils/firebaseAdminCompat.cjs');

const serviceAccount = require('./service.json'); // Replace with your service account key JSON file path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nem-kyc.firebaseio.com' // Replace with your Firebase project's URL
});

const db = admin.firestore();

module.exports = { db };


// hghgfhjghjcxfgchkjlhfgdkjlhjhgjlgh
