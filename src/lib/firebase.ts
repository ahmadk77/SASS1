import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const storage = getStorage(app);
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

// Initialize Firestore with auto-detected long polling fallback to avoid QUIC protocol write errors
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  ...(databaseId && databaseId !== '(default)' ? { databaseId } : {})
});

export const googleProvider = new GoogleAuthProvider();

export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCustomToken };

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error?.code === 'auth/unauthorized-domain') {
      const msg = '⚠️ رابط الموقع على Render غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console.\n\nيرجى الذهاب إلى Firebase Console -> Authentication -> Settings -> Authorized domains وإضافة رابط موقعك.';
      alert(msg);
      throw new Error(msg);
    }
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.info("User closed authentication popup");
      return null;
    }
    console.warn("signInWithPopup failed or blocked, attempting redirect fallback:", error);
    try {
      await signInWithRedirect(auth, googleProvider);
      return null;
    } catch (redirectError: any) {
      if (redirectError?.code === 'auth/unauthorized-domain') {
        const msg = '⚠️ رابط الموقع على Render غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في Firebase Console.\n\nيرجى الذهاب إلى Firebase Console -> Authentication -> Settings -> Authorized domains وإضافة رابط موقعك.';
        alert(msg);
        throw new Error(msg);
      }
      throw redirectError;
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
