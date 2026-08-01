/**
 * AuthContext.jsx
 *
 * Global authentication state for the entire application.  Mirrors the
 * pattern established by LocationContext — a single provider wraps the
 * app tree and exposes a memoised value via the `useAuth()` hook.
 *
 * Design decisions:
 *   - Firebase handles all JWT / session management; we only store the
 *     resulting user objects (Firebase User + backend UserResponse).
 *   - `initializing` is true while `onAuthStateChanged` has not yet
 *     resolved for the first time — this prevents a brief flash of the
 *     logged-out UI on page refresh.
 *   - Auth mutations (login, register, logout) return the error to the
 *     caller so per-form inline error messages are possible, rather than
 *     polluting global state.
 *   - Profile sync: when a Firebase user appears we attempt to fetch the
 *     backend profile.  If it doesn't exist (404) we create it — this
 *     covers both first-time registration and Google sign-in where the
 *     backend record may not exist yet.
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { registerUser, getUserByUid } from '../services/api';

// ─── Context Definition ──────────────────────────────────────────────────

/**
 * @typedef {Object} AuthContextValue
 * @property {import('firebase/auth').User|null} user        — Firebase user (null when signed out)
 * @property {Object|null} dbUser                            — Backend UserResponse (null when signed out or loading)
 * @property {boolean} initializing                           — True during first onAuthStateChanged check
 * @property {(email: string, password: string) => Promise<void>} login
 * @property {(name: string, email: string, password: string) => Promise<void>} register
 * @property {() => Promise<void>} loginWithGoogle
 * @property {() => Promise<void>} logout
 */

const AuthContext = createContext(/** @type {AuthContextValue} */ (null));

// ─── Helper: sync profile with backend ──────────────────────────────────

/**
 * Ensures a backend UserResponse exists for the given Firebase user.
 * Fetches first; creates if missing.  Returns the UserResponse or null.
 */
async function syncBackendProfile(firebaseUser) {
  try {
    const existing = await getUserByUid(firebaseUser.uid);
    if (existing) return existing;
  } catch {
    // Network error — continue to attempt creation
  }

  // Derive name: displayName > email prefix
  const name =
    firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user';

  try {
    return await registerUser({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name,
    });
  } catch {
    return null;
  }
}

// ─── Provider ────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const isRegistering = useRef(false);

  // Subscribe to Firebase auth state — runs once on mount and cleans up
  // on unmount.  Tracks the initial check so we can show a loader until
  // the session is resolved.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Kick off profile sync (don't block rendering)
        if (!isRegistering.current) {
          syncBackendProfile(firebaseUser).then((profile) => {
            setDbUser(profile);
          });
        }
      } else {
        setDbUser(null);
      }

      // First callback means session is resolved
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // ─── Auth actions ───────────────────────────────────────────────────

  /** Email + password sign-in. */
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // syncBackendProfile is handled by onAuthStateChanged
    // but we await it here so callers can know when the backend
    // record is ready.
    const profile = await syncBackendProfile(cred.user);
    setDbUser(profile);
  }, []);

  /** Email + password registration. Sets displayName to `name`. */
  const register = useCallback(async (name, email, password) => {
    isRegistering.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      
      // Directly create the backend profile using the provided name
      const profile = await registerUser({
        firebaseUid: cred.user.uid,
        email: cred.user.email,
        name: name,
      });
      
      setDbUser(profile);
    } finally {
      isRegistering.current = false;
    }
  }, []);

  /** Google OAuth popup sign-in. */
  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    const profile = await syncBackendProfile(cred.user);
    setDbUser(profile);
  }, []);

  /** Sign out and clear local state. */
  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setDbUser(null);
  }, []);

  // Memoise context value to prevent unnecessary re-renders in consumers
  // when the parent provider re-renders for unrelated reasons.
  const value = useMemo(
    () => ({
      user,
      dbUser,
      initializing,
      login,
      register,
      loginWithGoogle,
      logout,
    }),
    [user, dbUser, initializing, login, register, loginWithGoogle, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Consumer Hook ──────────────────────────────────────────────────────

/**
 * Returns the current auth context value.
 * Must be used inside an `<AuthProvider>` tree.
 *
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
