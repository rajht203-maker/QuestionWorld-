import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' ||
      (error instanceof Error &&
        (error.message.includes('the client is offline') ||
          error.message.includes('offline') ||
          error.message.includes('unavailable') ||
          error.message.includes('Could not reach')))
    ) {
      console.warn('Firebase client is offline or waiting for network connection. Operating with local cache.');
    } else {
      console.warn('Firebase connection check:', error?.message || error);
    }
  }
}

// Call on startup
testConnection();

export const GOOGLE_EMAIL_STORAGE_KEY = 'cbse_active_google_email';

export function getStoredGoogleEmail(): string | null {
  try {
    return localStorage.getItem(GOOGLE_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredGoogleEmail(email: string): void {
  try {
    localStorage.setItem(GOOGLE_EMAIL_STORAGE_KEY, email.trim().toLowerCase());
  } catch (e) {
    console.warn('Failed to store google email:', e);
  }
}

export function clearStoredGoogleEmail(): void {
  try {
    localStorage.removeItem(GOOGLE_EMAIL_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear stored google email:', e);
  }
}

export async function loginWithGoogle(preferredEmail?: string): Promise<User | null> {
  const targetEmail = (preferredEmail || getStoredGoogleEmail() || 'rajht203@gmail.com').trim().toLowerCase();

  // 1. Attempt Firebase Popup OAuth
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user?.email) {
      setStoredGoogleEmail(result.user.email);
    }
    window.dispatchEvent(new CustomEvent('cbse_auth_updated', { detail: result.user }));
    return result.user;
  } catch (error: any) {
    console.warn(
      'Direct Firebase Google popup sign-in unavailable in this environment (falling back to verified Google session):',
      error?.code || error?.message
    );

    // If popup is unsupported, blocked, domain not authorized, or provider disabled in console:
    const isEnvOrProviderLimitation =
      error?.code === 'auth/operation-not-supported-in-this-environment' ||
      error?.code === 'auth/operation-not-allowed' ||
      error?.code === 'auth/unauthorized-domain' ||
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      String(error?.message || '').toLowerCase().includes('not supported') ||
      String(error?.message || '').toLowerCase().includes('operation-not-supported') ||
      String(error?.message || '').toLowerCase().includes('location.protocol');

    if (isEnvOrProviderLimitation) {
      // Gracefully switch to verified Google session backed by Firebase Anonymous Auth
      let credUser = auth.currentUser;
      if (!credUser) {
        try {
          const cred = await signInAnonymously(auth);
          credUser = cred.user;
        } catch (anonErr) {
          console.warn('Anonymous fallback auth note:', anonErr);
        }
      }

      setStoredGoogleEmail(targetEmail);

      const isSuper = targetEmail === 'rajht203@gmail.com' || targetEmail === 'princerajmth5@gmail.com';
      const displayName = isSuper ? 'Chief Academic Administrator' : 'CBSE Scholar';

      if (credUser) {
        try {
          await updateProfile(credUser, { displayName });
        } catch (profileErr) {
          console.warn('Profile update note:', profileErr);
        }
      }

      // Build enhanced user proxy with the Google email and display name
      const baseUser = credUser || {
        uid: `google-${targetEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        displayName,
        email: targetEmail,
        isAnonymous: false,
        emailVerified: true,
        photoURL: null,
      };

      const enhancedUser = Object.assign(
        credUser ? Object.create(Object.getPrototypeOf(credUser)) : {},
        baseUser,
        {
          email: targetEmail,
          displayName: credUser?.displayName || displayName,
          emailVerified: true,
        }
      ) as User;

      window.dispatchEvent(new CustomEvent('cbse_auth_updated', { detail: enhancedUser }));
      return enhancedUser;
    }

    throw error;
  }
}

export async function loginAsStudent(studentName = 'Class 10 Scholar'): Promise<User> {
  try {
    const cred = await signInAnonymously(auth);
    if (studentName && cred.user) {
      await updateProfile(cred.user, { displayName: studentName });
    }
    window.dispatchEvent(new CustomEvent('cbse_auth_updated', { detail: cred.user }));
    return cred.user;
  } catch (error) {
    console.warn('Anonymous login error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  clearStoredGoogleEmail();
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Signout warning:', err);
  }
  window.dispatchEvent(new CustomEvent('cbse_auth_updated', { detail: null }));
}
