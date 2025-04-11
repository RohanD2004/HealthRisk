const admin = require("firebase-admin");

const serviceAccountJSON = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON, "base64").toString("utf-8");
const serviceAccount = JSON.parse(serviceAccountJSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://suggest-health-default-rtdb.firebaseio.com",
});

const db = admin.database();
module.exports = db;
