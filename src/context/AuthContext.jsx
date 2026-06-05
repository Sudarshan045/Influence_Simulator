/**
 * AuthContext.jsx
 * ===============
 * Authentication state provider for the Influence Simulator.
 *
 * Two auth paths:
 *  1. Firebase Auth   — real users (email/password + Google OAuth)
 *  2. Demo Session    — local mock session, persisted in sessionStorage,
 *                       no Firebase dependency, always works.
 *
 * The demo path is prioritised on mount so that a demo session
 * surviving a page refresh is restored before Firebase resolves.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { syncUser } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO USER CONSTANT
// ─────────────────────────────────────────────────────────────────────────────

const DEMO_SESSION_KEY = 'influence_demo_session';

const DEMO_USER = {
  id:         'demo-user-001',
  uid:        'demo-user-001',
  name:       'Demo Analyst',
  email:      'demo@influence.ai',
  role:       'Analyst',
  photoURL:   null,
  provider:   'demo',
  isDemo:     true,
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── On mount: restore demo session first, then wait for Firebase ──────────
  useEffect(() => {
    // Restore demo session from sessionStorage (survives page refresh)
    const storedDemo = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (storedDemo) {
      try {
        setUser(JSON.parse(storedDemo));
        setLoading(false);
        return; // Skip Firebase listener — demo session is active
      } catch {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
      }
    }

    // Firebase auth state listener for real users
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id:       firebaseUser.uid,
          uid:      firebaseUser.uid,
          name:     firebaseUser.displayName || firebaseUser.email.split('@')[0],
          email:    firebaseUser.email,
          role:     'Analyst',
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'password',
          isDemo:   false,
        };
        setUser(userData);

        // Sync to MongoDB (non-blocking, non-critical)
        try { await syncUser(userData); } catch (err) {
          console.warn('[AuthContext] MongoDB sync failed:', err.message);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // ── DEMO LOGIN ─────────────────────────────────────────────────────────────
  /**
   * Starts a local demo session — no Firebase, no network required.
   * Session persists across page refreshes via sessionStorage.
   * Cleared on logout.
   */
  const loginAsDemo = useCallback(() => {
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
  }, []);


  // ── EMAIL / PASSWORD LOGIN ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Intercept demo credentials and use the local demo path
    if (email.trim().toLowerCase() === 'demo@influence.ai' && password === 'password123') {
      loginAsDemo();
      return DEMO_USER;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.warn('[AuthContext] Firebase login failed, checking local storage fallback:', error.message);
      
      // Fallback to localStorage users if Firebase fails (e.g. invalid config)
      const users = JSON.parse(localStorage.getItem('local_influence_users') || '{}');
      const localUser = users[email];
      
      if (localUser && localUser.password === password) {
        // Successful local login
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(localUser));
        setUser(localUser);
        return localUser;
      }
      
      throw new Error('Invalid email or password. Check your credentials and try again.');
    }
  }, [loginAsDemo]);


  // ── SIGNUP ─────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    if (email.trim().toLowerCase() === 'demo@influence.ai') {
      throw new Error('This email address is reserved. Please use a different email.');
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      return result.user;
    } catch (error) {
      console.warn('[AuthContext] Firebase signup failed, falling back to local storage:', error.message);
      
      // Fallback to localStorage if Firebase fails
      const users = JSON.parse(localStorage.getItem('local_influence_users') || '{}');
      if (users[email]) {
        throw new Error('An account with this email already exists.');
      }
      
      const newUser = {
          id: 'local-' + Date.now(),
          uid: 'local-' + Date.now(),
          name: name,
          email: email,
          password: password,
          role: 'Analyst',
          isDemo: false
      };
      
      users[email] = newUser;
      localStorage.setItem('local_influence_users', JSON.stringify(users));
      
      // Auto login after local signup
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    }
  }, []);


  // ── GOOGLE LOGIN ───────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.warn('[AuthContext] Firebase Google login failed, using local mock:', error.message);
      
      // Fallback to a mock Google user if Firebase popup fails
      const mockGoogleUser = {
          id: 'google-mock-' + Date.now(),
          uid: 'google-mock-' + Date.now(),
          name: 'Google User',
          email: 'google.user@example.com',
          role: 'Analyst',
          isDemo: true
      };
      
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(mockGoogleUser));
      setUser(mockGoogleUser);
      return mockGoogleUser;
    }
  }, []);


  // ── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Clear demo session first (handles demo users)
    sessionStorage.removeItem(DEMO_SESSION_KEY);

    // Sign out of Firebase (no-op if demo user, Firebase has no session)
    if (!user?.isDemo) {
      await signOut(auth);
    }

    setUser(null);
  }, [user]);


  // ── LOADING SCREEN ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isDemo: Boolean(user?.isDemo),
        login,
        loginAsDemo,
        signup,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
