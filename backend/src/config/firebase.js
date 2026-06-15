const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

if (Object.keys(serviceAccount).length > 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || '44taxi' });
}

module.exports = admin;
