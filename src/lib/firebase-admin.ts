import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export let firebaseEnabled = false;

let serviceAccount: any = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (e) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e);
  }
}

try {
  if (!getApps().length) {
    const appOptions: any = {
      projectId: firebaseConfig.projectId,
    };

    if (serviceAccount) {
      appOptions.credential = cert(serviceAccount);
    }

    initializeApp(appOptions);
  }
  firebaseEnabled = true;
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  firebaseEnabled = false;
}

export const adminAuth: Auth = firebaseEnabled ? getAuth() : ({
  verifyIdToken: async () => {
    throw new Error('Firebase Auth is disabled or misconfigured on server.');
  }
} as unknown as Auth);

