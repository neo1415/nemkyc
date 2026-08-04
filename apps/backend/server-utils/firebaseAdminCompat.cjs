const { initializeApp, getApps, cert, applicationDefault } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const {
  getFirestore,
  FieldValue,
  FieldPath,
  Timestamp,
} = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

function auth(app) {
  return getAuth(app);
}

function firestore(app) {
  return getFirestore(app);
}

Object.assign(firestore, {
  FieldValue,
  FieldPath,
  Timestamp,
});

function storage(app) {
  return getStorage(app);
}

const admin = {
  initializeApp,
  credential: {
    cert,
    applicationDefault,
  },
  auth,
  firestore,
  storage,
};

Object.defineProperty(admin, 'apps', {
  enumerable: true,
  get: getApps,
});

module.exports = admin;

