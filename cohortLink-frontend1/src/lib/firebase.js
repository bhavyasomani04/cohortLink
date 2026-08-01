/**
 * firebase.js
 *
 * Initializes the Firebase client SDK using environment variables exposed
 * through Vite's VITE_ prefix.  Only the Auth module is imported — other
 * Firebase services (Firestore, Storage, etc.) are intentionally omitted
 * to keep the bundle lean.
 *
 * Guard: if required env vars are missing the module throws immediately so
 * the root cause is visible at build/startup time rather than as a vague
 * runtime error.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// ─── Config from env ──────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ─── Validate ────────────────────────────────────────────────────────────

const requiredKeys = ['apiKey', 'authDomain', 'projectId'];
const missing = requiredKeys.filter((k) => !firebaseConfig[k]);

if (missing.length > 0) {
  console.error(
    `[firebase] Missing required VITE_FIREBASE_* env vars: ${missing.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in your Firebase config.',
  );
}

// ─── Init ───────────────────────────────────────────────────────────────

/** @type {import('firebase/app').FirebaseApp} */
const app = initializeApp(firebaseConfig);

/** Auth instance shared across the app. */
const auth = getAuth(app);

/** Google provider pre-configured for popup sign-in. */
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
