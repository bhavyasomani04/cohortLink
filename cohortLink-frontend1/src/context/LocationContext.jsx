/**
 * LocationContext.jsx
 *
 * Provides a single, app-wide source of truth for the resolved user location.
 *
 * Design decisions:
 *  - Location is resolved ONCE at app boot, not per-component.
 *  - All views consume via `useUserLocation()` hook — no prop drilling.
 *  - The context exposes `location`, `locationLoading`, and `locationError`
 *    so consumers can render appropriate skeletons / fallback UI.
 *  - `refreshLocation()` is exposed for a future "wrong location?" UX.
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { resolveUserLocation, clearLocationCache } from '../services/locationService';

// ─── Context Definition ────────────────────────────────────────────────────────

/**
 * @typedef {Object} LocationContextValue
 * @property {import('../services/locationService').LocationData|null} location
 * @property {boolean} locationLoading
 * @property {Error|null} locationError
 * @property {() => Promise<void>} refreshLocation - Clears cache and re-resolves.
 * @property {(loc: {city: string, latitude: number, longitude: number}) => void} setManualLocation - Overrides auto-detected location.
 */

const LocationContext = createContext(/** @type {LocationContextValue} */ (null));

// ─── Provider ──────────────────────────────────────────────────────────────────

export function LocationProvider({ children }) {
  const [resolvedLocation, setResolvedLocation] = useState(null);
  const [manualLocation, setManualLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  /**
   * Runs the full resolution chain from locationService.
   * Safe to call multiple times — the service handles cache internally.
   */
  const resolve = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const data = await resolveUserLocation();
      setResolvedLocation(data);
    } catch (err) {
      // resolveUserLocation() catches all errors internally and returns the
      // static default. This catch is a last-resort safety net.
      setLocationError(err);
    } finally {
      setLocationLoading(false);
    }
  };

  // Resolve once on mount. No setLoading(true) call needed here because
  // useState(true) already initialises the loading state correctly.
  useEffect(() => {
    resolve();
  }, []);

  /**
   * Forces a fresh resolution, bypassing the cache.
   * Intended for a "Refresh / Wrong location?" action in the UI.
   */
  const refreshLocation = async () => {
    setManualLocation(null);
    clearLocationCache();
    await resolve();
  };

  const activeLocation = manualLocation || resolvedLocation;

  // Memoize the context value to prevent unnecessary re-renders in consumers
  // when the parent provider re-renders for unrelated reasons.
  const value = useMemo(
    () => ({ location: activeLocation, locationLoading, locationError, refreshLocation, setManualLocation }),
    [activeLocation, locationLoading, locationError],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

// ─── Consumer Hook ─────────────────────────────────────────────────────────────

/**
 * Returns the current location context value.
 * Must be used inside a `<LocationProvider>` tree.
 *
 * @returns {LocationContextValue}
 */
export function useUserLocation() {
  const ctx = useContext(LocationContext);
  if (ctx === null) {
    throw new Error('useUserLocation must be used within a <LocationProvider>');
  }
  return ctx;
}
