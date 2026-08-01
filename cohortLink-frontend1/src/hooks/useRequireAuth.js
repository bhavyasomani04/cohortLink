/**
 * useRequireAuth.js
 *
 * Soft-gating hook for actions that need an authenticated user.
 * Returns a `requireAuth()` function that:
 *   - If the user is signed in → returns the Firebase user immediately.
 *   - If the user is signed out  → redirects to /login?from=<current_path>
 *     and returns null.
 *
 * Usage (in any component that triggers a protected action):
 *   const requireAuth = useRequireAuth();
 *   const handleBooking = () => {
 *     const user = requireAuth();
 *     if (!user) return;          // redirected to /login
 *     // ... proceed with booking
 *   };
 */

import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useRequireAuth() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (user) return user;
    navigate(`/login?from=${encodeURIComponent(location.pathname)}`, {
      replace: true,
    });
    return null;
  }, [user, navigate, location.pathname]);
}
