// firebase.js
const admin = require("firebase-admin");

// Read base64-encoded service account key from environment variable
const serviceAccountBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

if (!serviceAccountBase64) {
  throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable");
}

// Decode and parse the JSON key
const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf-8")
);

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://suggest-health-default-rtdb.firebaseio.com", // ✅ Your Realtime DB URL
});

// Export the Realtime Database reference
const db = admin.database();

module.exports = db;
