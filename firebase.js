// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://suggest-health-default-rtdb.firebaseio.com", // ✅ Your Realtime DB URL
});

const db = admin.database();

module.exports = db;
