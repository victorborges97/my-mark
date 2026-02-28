import { credential as adminCredential } from "firebase-admin";
import { getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

let dbAdminInstance: Firestore | null = null;
try {
  const GOOGLE_CLOUD_CREDENTIALS = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString('utf-8')
  );
  const alreadyCreatedAps = getApps();
  const credential = adminCredential.cert(GOOGLE_CLOUD_CREDENTIALS);
  const app =
    alreadyCreatedAps.length === 0
      ? initializeApp({ credential, projectId: 'mymark-32e3d', databaseURL: 'https://mymark-32e3d.firebaseio.com' })
      : alreadyCreatedAps[0];

  dbAdminInstance = getFirestore(app);
} catch {
  dbAdminInstance = null;
}
export const dbAdmin = dbAdminInstance;
