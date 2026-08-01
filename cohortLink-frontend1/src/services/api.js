/**
 * api.js
 *
 * Central HTTP layer for the CohortLink frontend.  Thin wrappers around
 * the native Fetch API keep the surface minimal while providing a single
 * place to attach auth tokens, base-URL config, and error normalisation.
 *
 * Public helpers:
 *   get(path)                 — unauthenticated GET
 *   post(path, body)         — unauthenticated POST (JSON)
 *   authedGet(path)          — authenticated GET  (Bearer token)
 *   authedPost(path, body)   — authenticated POST (Bearer token)
 *   authedPut(path, body)    — authenticated PUT  (Bearer token)
 *   registerUser(payload)    — POST /api/users
 *   getUserByUid(uid)        — GET  /api/users/by-uid/{uid}
 */

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ─── ApiError ─────────────────────────────────────────────────────────────────
// Normalized error class so callers can distinguish 4xx (user error) from
// 5xx (server/transient error) without string-parsing. Pattern from the
// frontend-api-integration-patterns skill.

export class ApiError extends Error {
  /**
   * @param {string} message  Human-readable message
   * @param {number} status   HTTP status code
   * @param {*}      payload  Parsed JSON body from the error response (or null)
   */
  constructor(message, status, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }

  /** True for transient server errors that are safe to retry. */
  get isRetryable() {
    return this.status >= 500;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const { headers = {}, ...restOptions } = options;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...restOptions,
  });

  // 204 No Content → return null immediately
  if (res.status === 204) return null;

  if (!res.ok) {
    // Try to parse a structured error body from the backend
    let payload = null;
    try {
      payload = await res.json();
    } catch (_) { /* backend sent non-JSON body — ignore */ }

    throw new ApiError(
      payload?.message || `Request failed with status ${res.status}`,
      res.status,
      payload,
    );
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Returns an Authorization header with the current Firebase ID token.
 * Must be called at invocation time (not at module level) so the token
 * is always fresh.
 */
async function bearerHeader() {
  const { auth } = await import('../lib/firebase');
  const user = auth.currentUser;
  if (!user) return {};

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// ─── Unauthenticated requests ───────────────────────────────────────────

/** Generic GET (no auth token). */
export async function get(path) {
  return request(path);
}

/** Generic POST (no auth token). */
export async function post(path, body) {
  return request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ─── Authenticated requests ────────────────────────────────────────────

/** GET with Firebase ID token attached. */
export async function authedGet(path) {
  const headers = await bearerHeader();
  return request(path, { headers });
}

/** POST with Firebase ID token attached. */
export async function authedPost(path, body) {
  const headers = await bearerHeader();
  return request(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/** PUT with Firebase ID token attached. */
export async function authedPut(path, body) {
  const headers = await bearerHeader();
  return request(path, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

/** DELETE with Firebase ID token attached. */
export async function authedDelete(path) {
  const headers = await bearerHeader();
  return request(path, {
    method: 'DELETE',
    headers,
  });
}

// ─── Users API ──────────────────────────────────────────────────────────

/**
 * POST /api/users  —  Create a user profile in the backend.
 * @param {{ firebaseUid: string, email: string, name: string }} payload
 * @returns {Promise<Object>} UserResponse
 */
export async function registerUser({ firebaseUid, email, name }) {
  return authedPost('/api/users', { firebaseUid, email, name });
}

/**
 * GET /api/users/by-uid/{firebaseUid}  —  Fetch a user profile.
 * @param {string} firebaseUid
 * @returns {Promise<Object|null>} UserResponse or null if not found.
 */
export async function getUserByUid(firebaseUid) {
  try {
    return await authedGet(`/api/users/by-uid/${firebaseUid}`);
  } catch (err) {
    // Backend returns 404 for unknown UIDs — translate to null.
    if (err.message?.startsWith('API Error 404')) return null;
    throw err;
  }
}

// ─── Events API  (existing — kept unchanged) ────────────────────────────

/**
 * GET /api/events — fetch all events (paginated).
 * @param {number} page
 * @param {number} size
 * @returns {Promise<Array>} Array of EventResponse objects
 */
export async function getEvents(page = 0, size = 12) {
  return get(`/api/events?page=${page}&size=${size}`);
}

/**
 * GET /api/events/featured — returns the single featured event object.
 */
export async function getFeaturedEvent() {
  return get('/api/events/featured');
}

/**
 * GET /api/events/nearby — fetch nearby events (paginated).
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radiusKm=10]
 * @param {number} page
 * @param {number} size
 * @returns {Promise<Array>} Array of NearbyEventResponse objects
 */
export async function getEventsByLocation(lat, lng, radiusKm = 10, page = 0, size = 12) {
  return get(`/api/events/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&page=${page}&size=${size}`);
}

/**
 * GET /api/events/search — search nearby events (paginated).
 * @param {string} q
 * @param {number} lat
 * @param {number} lng
 * @param {number} [radiusKm=10]
 * @param {number} page
 * @param {number} size
 * @returns {Promise<Array>} Array of NearbyEventResponse objects
 */
export async function searchEvents(q, lat, lng, radiusKm = 10, page = 0, size = 12) {
  return get(`/api/events/search?q=${encodeURIComponent(q)}&lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&page=${page}&size=${size}`);
}

// ─── Clubs API ───────────────────────────────────────────────────────────────

/**
 * GET /api/clubs — returns an array of ClubResponse objects.
 */
export async function getClubCategories() {
  return get('/api/clubs');
}

/**
 * GET /api/clubs/:id — fetch a single club by ID.
 * @param {number|string} clubId
 * @returns {Promise<Object>} ClubResponse
 */
export async function getClubById(clubId) {
  return get(`/api/clubs/${clubId}`);
}

/**
 * POST /api/clubs — create a new club.
 * @param {{ name: string, bio: string, profileImageUrl: string|null, category: string, city: string, latitude?: number, longitude?: number }} payload
 * @returns {Promise<Object>} ClubResponse
 */
export async function createClub({ name, bio, profileImageUrl, category, city, latitude = 0, longitude = 0 }) {
  return authedPost('/api/clubs', { name, bio, profileImageUrl: profileImageUrl || null, category, city, latitude, longitude });
}

/**
 * PUT /api/clubs/:id — update an existing club.
 * @param {number} clubId
 * @param {{ name: string, bio: string, profileImageUrl: string|null, category: string, city: string, latitude?: number, longitude?: number }} payload
 * @returns {Promise<Object>} ClubResponse
 */
export async function updateClub(clubId, { name, bio, profileImageUrl, category, city, latitude = 0, longitude = 0 }) {
  return authedPut(`/api/clubs/${clubId}`, { name, bio, profileImageUrl: profileImageUrl || null, category, city, latitude, longitude });
}

/**
 * POST /api/clubs/:id/follow — follow a club.
 */
export async function followClub(clubId) {
  return authedPost(`/api/clubs/${clubId}/follow`, {});
}

/**
 * DELETE /api/clubs/:id/follow — unfollow a club.
 */
export async function unfollowClub(clubId) {
  return authedDelete(`/api/clubs/${clubId}/follow`);
}

/**
 * GET /api/clubs/:id/members — get club members.
 */
export async function getClubMembers(clubId) {
  return get(`/api/clubs/${clubId}/members`);
}

/**
 * GET /api/clubs/user/:userId/joined — get all clubs a user has joined/followed.
 * @param {number|string} userId
 * @returns {Promise<Array>} Array of ClubResponse objects
 */
export async function getJoinedClubs(userId) {
  return get(`/api/clubs/user/${userId}/joined`);
}

// ─── Events Write API ─────────────────────────────────────────────────────────

/**
 * POST /api/events — create a new event under a club.
 * @param {{
 *   title: string,
 *   description: string,
 *   location: string,
 *   startDateTime: string,  ISO-8601
 *   endDateTime: string,    ISO-8601
 *   capacity: number,
 *   clubId: number,
 *   bannerImageUrl: string|null
 * }} payload
 * @returns {Promise<Object>} EventResponse
 */
export async function createEvent({
  title, description, location, startDateTime, endDateTime,
  capacity, clubId, bannerImageUrl, latitude = 0, longitude = 0,
}) {
  return authedPost(`/api/events?clubId=${clubId}`, {
    title,
    description,
    locationName: location,
    eventTime: startDateTime,
    maxCapacity: capacity,
    imageUrl: bannerImageUrl || null,
    latitude,
    longitude,
    featured: false
  });
}

/**
 * PUT /api/events/:id — update an existing event.
 * @param {number} eventId
 * @param {{
 *   title: string,
 *   description: string,
 *   location: string,
 *   startDateTime: string,
 *   endDateTime: string,
 *   capacity: number,
 *   bannerImageUrl: string|null
 * }} payload
 * @returns {Promise<Object>} EventResponse
 */
export async function updateEvent(eventId, {
  title, description, location, startDateTime, endDateTime,
  capacity, bannerImageUrl, latitude = 0, longitude = 0,
}) {
  return authedPut(`/api/events/${eventId}`, {
    title,
    description,
    locationName: location,
    eventTime: startDateTime,
    maxCapacity: capacity,
    imageUrl: bannerImageUrl || null,
    latitude,
    longitude,
    featured: false
  });
}

/**
 * DELETE /api/events/:id — delete an event.
 * @param {number} eventId
 * @returns {Promise<void>}
 */
export async function deleteEvent(eventId) {
  return authedDelete(`/api/events/${eventId}`);
}

// ─── Upload API ───────────────────────────────────────────────────────────────

/**
 * POST /api/upload/presign — request an S3 presigned PUT URL.
 * The browser uploads the file directly to S3 using the returned presignedUrl,
 * then stores the publicUrl as the profileImageUrl.
 *
 * @param {{ filename: string, contentType: string }} payload
 * @returns {Promise<{ presignedUrl: string, publicUrl: string }>}
 */
export async function getPresignedUrl({ filename, contentType }) {
  return authedPost('/api/upload/presign', { filename, contentType });
}

// ─── Bookings API ─────────────────────────────────────────────────────────────

/**
 * POST /api/bookings — register the current user for an event.
 * @param {{ eventId: number }} payload
 * @returns {Promise<Object>} BookingResponse
 */
export async function createBooking({ eventId }) {
  return authedPost('/api/bookings', { eventId });
}

/**
 * GET /api/bookings/event/{eventId}/attendees — fetch attendees for an event.
 * @param {number|string} eventId
 * @returns {Promise<Array>} Array of attendee objects
 */
export async function getEventAttendees(eventId) {
  return get(`/api/bookings/event/${eventId}/attendees`);
}

/**
 * GET /api/bookings/user/{userId}/detailed — fetch detailed bookings for a user.
 * @param {number|string} userId
 * @returns {Promise<Array>} Array of BookingWithEventResponse objects
 */
export async function getDetailedBookingsByUser(userId) {
  return authedGet(`/api/bookings/user/${userId}/detailed`);
}

/**
 * DELETE /api/bookings/{bookingId} — cancel a booking.
 * @param {number|string} bookingId
 * @returns {Promise<void>}
 */
export async function cancelBooking(bookingId) {
  return authedDelete(`/api/bookings/${bookingId}`);
}

// ─── Posts & Feed API ──────────────────────────────────────────────────────────

/**
 * GET /api/posts/club/{clubId} — fetch the cursor-paginated post feed for a club.
 * PUBLIC endpoint — no auth required.
 * @param {number|string} clubId
 * @param {string|null}   cursor  ISO-8601 createdAt of the last loaded post (null for first page)
 * @param {number}        size    Number of posts per page (default 10)
 * @returns {Promise<Array>} Array of FeedPostResponse objects
 */
export async function getClubPostsFeed(clubId, cursor = null, size = 10) {
  const params = new URLSearchParams({ size });
  if (cursor) params.set('cursor', cursor);
  return get(`/api/posts/club/${clubId}?${params.toString()}`);
}

/**
 * POST /api/posts/{postId}/like — like a post.
 * @param {number|string} postId
 * @returns {Promise<null>} 204 No Content
 */
export async function likePost(postId) {
  return authedPost(`/api/posts/${postId}/like`, {});
}

/**
 * DELETE /api/posts/{postId}/like — unlike a post.
 * @param {number|string} postId
 * @returns {Promise<null>} 204 No Content
 */
export async function unlikePost(postId) {
  return authedDelete(`/api/posts/${postId}/like`);
}

/**
 * GET /api/posts/{postId}/comments — fetch paginated comments for a post.
 * @param {number|string} postId
 * @param {number}        page
 * @param {number}        size
 * @returns {Promise<Array>} Array of CommentResponse objects
 */
export async function getPostComments(postId, page = 0, size = 20) {
  return get(`/api/posts/${postId}/comments?page=${page}&size=${size}`);
}

/**
 * POST /api/posts/{postId}/comments — add a comment to a post.
 * @param {number|string} postId
 * @param {string}        content
 * @returns {Promise<Object>} CommentResponse
 */
export async function addComment(postId, content) {
  return authedPost(`/api/posts/${postId}/comments`, { content });
}

/**
 * POST /api/posts?clubId={clubId} — create a new post for a club.
 * @param {number|string} clubId
 * @param {{ caption: string, images: Array }} payload
 * @returns {Promise<Object>} FeedPostResponse
 */
export async function createPost(clubId, { caption, images }) {
  return authedPost(`/api/posts?clubId=${clubId}`, { caption, images });
}
