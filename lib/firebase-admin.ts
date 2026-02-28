import admin from "firebase-admin";
const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!admin.apps.length) {
  if (!b64) throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 ausente");
  const svc = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  admin.initializeApp({ credential: admin.credential.cert(svc) });
}

export const dbAdmin = admin.firestore();
