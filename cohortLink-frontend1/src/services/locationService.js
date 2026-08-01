/**
 * locationService.js
 *
 * Enterprise-grade location resolution service.
 * Implements a deterministic fallback chain:
 *
 *   [1] localStorage cache (if fresh, < TTL hours old)
 *       ↓ stale or missing
 *   [2] Browser Geolocation API (GPS / Network triangulation)
 *       ↓ permission denied or unavailable
 *   [3] IP-based Geolocation (ipapi.co — no API key required)
 *       ↓ network failure or IP API down
 *   [4] Static default (configurable fallback city)
 *
 * Privacy Note: We deliberately store only city-level coordinates
 * in localStorage — never the raw high-precision GPS signal — to
 * mitigate risk in the event of an XSS attack reading storage.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'cohortlink_user_location';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** IP-based geolocation endpoint. Free tier: 1,000 req/day, no key needed. */
const IP_GEO_URL = 'https://ipapi.co/json/';

const GEO_TIMEOUT_MS = 8000; // 8 s — prevents hanging on slow mobile GPS

/** Fallback used if all strategies fail (static default city). */
const STATIC_DEFAULT = {
  city: 'Mumbai',
  region: 'Maharashtra',
  country: 'IN',
  lat: 19.076,
  lng: 72.8777,
  source: 'default',
};

// ─── Cache Helpers ─────────────────────────────────────────────────────────────

/**
 * Reads the cached location from localStorage.
 * Returns the parsed object if it exists and is still within TTL,
 * otherwise returns null so the caller knows to re-fetch.
 *
 * @returns {LocationData|null}
 */
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    const age = Date.now() - (data.fetchedAt ?? 0);

    if (age > CACHE_TTL_MS) return null; // stale

    return data;
  } catch {
    // Corrupted entry — evict it.
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Persists a LocationData object to localStorage.
 * Always attaches a `fetchedAt` timestamp for TTL comparison.
 *
 * @param {LocationData} data
 */
function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...data, fetchedAt: Date.now() }),
    );
  } catch {
    // localStorage may be unavailable (e.g. private browsing, storage full).
    // Fail silently — the feature degrades gracefully.
  }
}

// ─── Resolution Strategies ────────────────────────────────────────────────────

/**
 * Strategy [2]: Browser Geolocation API.
 *
 * Wraps the callback-based `getCurrentPosition` in a Promise and adds a
 * configurable timeout so we never block the UI waiting for a slow GPS fix.
 *
 * On success the raw high-precision coords are intentionally NOT written to
 * cache; instead they are rounded to ~1 km precision before storage.
 *
 * @returns {Promise<LocationData>}
 */
function resolveViaGPS() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API not supported'));
      return;
    }

    const timer = setTimeout(
      () => reject(new Error('Geolocation timed out')),
      GEO_TIMEOUT_MS,
    );

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        // Round to 2 decimal places (~1.1 km precision) before storing.
        resolve({
          city: null, // GPS gives no city name; caller decides what to store
          region: null,
          country: null,
          lat: parseFloat(position.coords.latitude.toFixed(2)),
          lng: parseFloat(position.coords.longitude.toFixed(2)),
          source: 'gps',
        });
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
      {
        enableHighAccuracy: false, // battery-friendly; city-level accuracy is sufficient
        timeout: GEO_TIMEOUT_MS,
        maximumAge: 5 * 60 * 1000, // accept a cached OS fix up to 5 min old
      },
    );
  });
}

/**
 * Strategy [3]: IP-based Geolocation via ipapi.co.
 *
 * This resolves silently in the background with no user interaction.
 * Returns city-level coordinates + metadata, which is ideal for our cache.
 *
 * @returns {Promise<LocationData>}
 */
async function resolveViaIP() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000); // 5 s timeout

  try {
    const res = await fetch(IP_GEO_URL, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`IP geo API responded with ${res.status}`);

    const json = await res.json();

    if (json.error) throw new Error(`IP geo API error: ${json.reason}`);

    return {
      city: json.city ?? null,
      region: json.region ?? null,
      country: json.country_code ?? null,
      lat: json.latitude ? parseFloat(json.latitude.toFixed(2)) : null,
      lng: json.longitude ? parseFloat(json.longitude.toFixed(2)) : null,
      source: 'ip',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} LocationData
 * @property {string|null} city        - City name (e.g. "Mumbai")
 * @property {string|null} region      - State / province (e.g. "Maharashtra")
 * @property {string|null} country     - ISO 3166-1 alpha-2 code (e.g. "IN")
 * @property {number|null} lat         - Latitude (city-level precision)
 * @property {number|null} lng         - Longitude (city-level precision)
 * @property {'gps'|'ip'|'default'|'cache'} source - How the location was resolved
 * @property {number} [fetchedAt]      - Unix timestamp of when it was cached
 */

/**
 * Resolves the user's location using the full fallback chain described above.
 *
 * - Fast path: returns cached data synchronously (via the resolved Promise)
 *   on repeat visits within the TTL window.
 * - First visit: executes the async fallback chain and caches the result.
 *
 * This function is designed to be called once at app boot from the
 * LocationContext provider, NOT from individual components.
 *
 * @returns {Promise<LocationData>}
 */
export async function resolveUserLocation() {
  // ── [1] Cache hit ───────────────────────────────────────────────────────────
  const cached = readCache();
  if (cached) {
    return { ...cached, source: 'cache', originalSource: cached.source };
  }

  // ── [2] GPS ─────────────────────────────────────────────────────────────────
  try {
    const gpsData = await resolveViaGPS();

    // GPS gives us coords but no city name. We enrich with IP data silently
    // for a better cache entry (so city name is available to display in UI).
    // If IP enrichment fails we still proceed with GPS coords alone.
    let enriched = gpsData;
    try {
      const ipData = await resolveViaIP();
      enriched = {
        ...gpsData,
        city: ipData.city,
        region: ipData.region,
        country: ipData.country,
        // Keep the GPS coords (more accurate) rather than the IP coords.
      };
    } catch {
      // Enrichment failed — use raw GPS coords without city metadata.
    }

    writeCache(enriched);
    return enriched;
  } catch {
    // GPS denied, timed out, or not supported — continue to IP fallback.
  }

  // ── [3] IP Geolocation ──────────────────────────────────────────────────────
  try {
    const ipData = await resolveViaIP();
    writeCache(ipData);
    return ipData;
  } catch {
    // IP API unreachable (offline, rate-limited, blocked) — use static default.
  }

  // ── [4] Static default ──────────────────────────────────────────────────────
  // Do NOT cache the static default — we want to re-try on next page load
  // in case connectivity is restored.
  return STATIC_DEFAULT;
}

/**
 * Forcibly clears the cached location. Call this when:
 *   - The user explicitly changes their city in settings.
 *   - A "Wrong location? Update" prompt is confirmed.
 */
export function clearLocationCache() {
  localStorage.removeItem(CACHE_KEY);
}
