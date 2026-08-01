# CohortLink API Context for Frontend Development

This document provides the necessary context for AI models assisting in the development of the frontend for the CohortLink project. It defines the available backend REST APIs, their endpoints, HTTP methods, and the expected request/response payloads (DTOs).

## Base URL
Assuming local development, the API base URL will typically be `http://localhost:8080`. All endpoints below are relative to this base URL.

## Authentication
All secure endpoints (creating, updating, deleting, and fetching private data) require a valid Firebase JWT to be sent in the `Authorization` header:
`Authorization: Bearer <your_firebase_token>`

Public endpoints (GET lists, GET by ID, etc.) do **not** require authentication unless noted.

---

## 🚨 CRITICAL: Required Headers for POST/PUT Requests
When making requests that send JSON data, you **must** include both the `Authorization` and `Content-Type` headers. Missing headers cause **403 Forbidden** or **415 Unsupported Media Type** errors.

```javascript
const idToken = await auth.currentUser.getIdToken();

const response = await fetch('http://localhost:8080/api/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,      // Required for security
    'Content-Type': 'application/json'         // Required for Spring Boot to parse the body
  },
  body: JSON.stringify({ eventId: 1 })
});
```

## ⏰ Date/Time Convention
- All `eventTime` fields must be sent as **UTC** ISO-8601 strings (no timezone offset).
  - Example: `"2026-07-15T03:30:00"` represents 9:00 AM IST.
- All date fields returned by the API (e.g. `createdAt`, `eventTime`) are ISO-8601 UTC strings. Parse them with `new Date(value)` on the frontend.

---

## 1. Users API (`/api/users`)

Users are **auto-provisioned** on their first authenticated request. Calling `POST /api/users` is rarely needed.

### Models (DTOs)

**`UserRegistrationRequest`**
```json
{
  "firebaseUid": "string",
  "email": "string",
  "name": "string"
}
```

**`UserResponse`**
```json
{
  "id": 1,
  "firebaseUid": "string",
  "email": "string",
  "name": "string",
  "createdAt": "2023-10-25T10:00:00"
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/users` | ✅ | Register a user manually (admin/migration use) |
| `GET` | `/api/users/{id}` | ✅ | Get user by internal DB ID |
| `GET` | `/api/users/by-uid/{firebaseUid}` | ✅ | Get user by Firebase UID. Use this after login to resolve the user's profile. |

---

## 2. Clubs API (`/api/clubs`)

Manages clubs, membership (following), and discovery.

### Models (DTOs)

**`ClubCreateRequest`** / **`ClubUpdateRequest`**
```json
{
  "name": "string",
  "bio": "string",
  "profileImageUrl": "string",
  "category": "string",
  "city": "string",
  "latitude": 28.6139,
  "longitude": 77.2090
}
```

**`ClubResponse`**
```json
{
  "id": 1,
  "name": "string",
  "bio": "string",
  "profileImageUrl": "string",
  "category": "string",
  "city": "string",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "manager": {
    "id": 1,
    "email": "string",
    "name": "string"
  }
}
```

**`UserSummary`** *(used in members list)*
```json
{
  "id": 1,
  "email": "string",
  "name": "string"
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/clubs` | ✅ | Create a club. The authenticated user becomes the manager. |
| `GET` | `/api/clubs` | ❌ | Get all clubs |
| `GET` | `/api/clubs/search?name=chess` | ❌ | Search clubs by name (case-insensitive, partial match) |
| `GET` | `/api/clubs/{clubId}` | ❌ | Get a single club by ID |
| `PUT` | `/api/clubs/{clubId}` | ✅ | Update a club. Manager only. |
| `DELETE` | `/api/clubs/{clubId}` | ✅ | Delete a club. Manager only. |
| `POST` | `/api/clubs/{clubId}/follow` | ✅ | Follow (join) a club. Authenticated user is the follower. Response: `201 Created` |
| `DELETE` | `/api/clubs/{clubId}/follow` | ✅ | Unfollow a club. Authenticated user is removed. Response: `204 No Content` |
| `GET` | `/api/clubs/{clubId}/members` | ❌ | Get all members (followers) of a club as `[UserSummary, ...]` |
| `GET` | `/api/clubs/user/{userId}/joined` | ❌ | Get all clubs a specific user has joined as `[ClubResponse, ...]` |

---

## 3. Events API (`/api/events`)

Manages events with full-text search and PostGIS spatial queries. **All listing endpoints only return future events** (past events are excluded automatically).

### Models (DTOs)

**`EventCreateRequest`** / **`EventUpdateRequest`**
```json
{
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "locationName": "string",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "eventTime": "2026-07-15T03:30:00",
  "maxCapacity": 100,
  "featured": false
}
```
> **Notes:**
> - `eventTime` must be a **future** UTC timestamp.
> - If `latitude`/`longitude` are `0,0`, they are automatically replaced by the parent club's coordinates.
> - If `imageUrl` is provided, a post is automatically created in the club's feed announcing the event.

**`EventResponse`**
```json
{
  "id": 1,
  "clubId": 1,
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "locationName": "string",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "eventTime": "2026-07-15T03:30:00",
  "maxCapacity": 100,
  "remainingSlots": 95,
  "featured": false
}
```

**`NearbyEventResponse`** *(returned by `/nearby` and `/search`)*
```json
{
  "id": 1,
  "clubId": 1,
  "title": "string",
  "description": "string",
  "imageUrl": "string",
  "locationName": "string",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "eventTime": "2026-07-15T03:30:00",
  "maxCapacity": 100,
  "remainingSlots": 95,
  "featured": false,
  "distanceKm": 0.58
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/events?clubId={id}` | ✅ | Create an event for a club. Manager only. |
| `GET` | `/api/events/{eventId}` | ❌ | Get a single event by ID |
| `GET` | `/api/events/club/{clubId}?page=0` | ❌ | Get upcoming events for a club (paginated, size 12) |
| `GET` | `/api/events/club/{clubId}/past?page=0` | ❌ | Get past events for a club (paginated, size 12) |
| `GET` | `/api/events/featured?page=0` | ❌ | Get upcoming featured events (paginated, size 12) |
| `GET` | `/api/events/nearby?lat=&lng=&radiusKm=10&page=0` | ❌ | Get upcoming events near coordinates, sorted by distance |
| `GET` | `/api/events/search?q=&lat=&lng=&radiusKm=10&page=0` | ❌ | Full-text search on title/description within a radius. Min 2 chars for `q`. |
| `PUT` | `/api/events/{eventId}` | ✅ | Update an event. Club manager only. |
| `DELETE` | `/api/events/{eventId}` | ✅ | Delete an event. Club manager only. Response: `204 No Content` |

---

## 4. Bookings API (`/api/bookings`)

Manages event bookings by users.

### Models (DTOs)

**`BookingCreateRequest`**
```json
{
  "eventId": 1
}
```

**`BookingResponse`**
```json
{
  "id": 1,
  "userId": 1,
  "eventId": 1,
  "status": "CONFIRMED",
  "bookedAt": "2026-06-26T10:00:00"
}
```

**`BookingWithEventResponse`** *(detailed booking, includes event info)*
```json
{
  "id": 1,
  "userId": 1,
  "event": {
    "id": 1,
    "title": "string",
    "description": "string",
    "imageUrl": "string",
    "locationName": "string",
    "eventTime": "2026-07-15T03:30:00"
  },
  "status": "CONFIRMED",
  "bookedAt": "2026-06-26T10:00:00"
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/bookings` | ✅ | Book an event. User is derived from the auth token. |
| `GET` | `/api/bookings/{bookingId}` | ✅ | Get a booking by ID |
| `GET` | `/api/bookings/user/{userId}` | ✅ | Get all bookings for a user |
| `GET` | `/api/bookings/user/{userId}/detailed` | ✅ | Get all bookings with full event details |
| `GET` | `/api/bookings/event/{eventId}/attendees` | ❌ | Get attendees for an event as `[UserSummary, ...]` |
| `DELETE` | `/api/bookings/{bookingId}` | ✅ | Cancel a booking. Response: `204 No Content` |

---

## 5. Upload API (`/api/upload`)

Generates AWS S3 presigned URLs for direct frontend-to-S3 image uploads.

### Models (DTOs)

**`PresignRequest`**
```json
{
  "filename": "image.png",
  "contentType": "image/png"
}
```

**`PresignResponse`**
```json
{
  "presignedUrl": "https://bucket.s3.region.amazonaws.com/images/uuid-image.png?X-Amz-Signature=...",
  "publicUrl": "https://bucket.s3.region.amazonaws.com/images/uuid-image.png"
}
```

### Upload Flow

1. Call `POST /api/upload/presign` with the filename and MIME type.
2. `PUT` the raw file bytes to the returned `presignedUrl` with the exact `Content-Type` header.
3. Use the returned `publicUrl` as the `imageUrl` / `profileImageUrl` in your create/update requests.

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/upload/presign` | ✅ | Get a presigned S3 URL for direct upload |

---

## 6. Posts & Feed API (`/api/posts`)

Manages club posts, the global feed (cursor-based), likes, and comments.

### Models (DTOs)

**`PostCreateRequest`**
```json
{
  "caption": "string",
  "images": [
    {
      "originalImageUrl": "string",
      "thumbnailUrl": "string",
      "aspectRatio": 1.33,
      "sequenceOrder": 1
    }
  ]
}
```

**`FeedPostResponse`**
```json
{
  "id": 1,
  "club": {
    "id": 1,
    "name": "string",
    "profileImageUrl": "string"
  },
  "author": {
    "id": 1,
    "email": "string",
    "name": "string"
  },
  "caption": "string",
  "images": [
    {
      "originalImageUrl": "string",
      "thumbnailUrl": "string",
      "aspectRatio": 1.33,
      "sequenceOrder": 1
    }
  ],
  "likeCount": 150,
  "commentCount": 12,
  "hasLiked": false,
  "createdAt": "2026-07-06T10:00:00"
}
```

**`CommentCreateRequest`**
```json
{
  "content": "string"
}
```

**`CommentResponse`**
```json
{
  "id": 1,
  "author": {
    "id": 1,
    "email": "string",
    "name": "string"
  },
  "content": "string",
  "createdAt": "2026-07-06T10:05:00"
}
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/posts?clubId={id}` | ✅ | Create a post for a club |
| `GET` | `/api/posts/club/{clubId}?cursor=&size=10` | ❌ | Get a club's feed (cursor-based pagination). Pass `createdAt` of the last loaded post as `cursor` for subsequent pages. |
| `POST` | `/api/posts/{postId}/like` | ✅ | Like a post. Response: `204 No Content`. Use optimistic UI. |
| `DELETE` | `/api/posts/{postId}/like` | ✅ | Unlike a post. Response: `204 No Content` |
| `POST` | `/api/posts/{postId}/comments` | ✅ | Add a comment to a post. Response: `201 Created` |
| `GET` | `/api/posts/{postId}/comments?page=0&size=20` | ❌ | Get comments for a post (offset-paginated) |

> **Feed Note:** Do NOT use `page`+`size` for the feed. Always use `cursor` (the `createdAt` of the last visible post) to prevent duplicate posts on re-render.
> **Auto-post:** When a club event is created with a non-null `imageUrl`, a post is automatically published to the club feed using the event image and title.
