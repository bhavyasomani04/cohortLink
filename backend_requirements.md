# Backend Requirements Handoff: Auth & Image Upload

This document provides context for the backend AI agent (Spring Boot) to implement the server-side requirements for Authentication and Image Uploads, ensuring it matches the frontend contracts exactly.

## 1. Authentication (Firebase)

The frontend handles user login via the Firebase Web SDK (Email/Password and Google Sign-In) and receives a Firebase ID Token (JWT). The frontend sends this token to the backend in the `Authorization` header.

### Requirements for the Backend AI:
- **Dependency:** Add the `firebase-admin` SDK to the Spring Boot project.
- **Security Filter:** Implement a OncePerRequestFilter (or similar Spring Security mechanism) that intercepts incoming requests.
- **Token Verification:** 
  - Extract the `Bearer <token>` from the `Authorization` header.
  - Use `FirebaseAuth.getInstance().verifyIdToken(token)` to validate the JWT.
- **User Synchronization:**
  - Extract the `uid`, `email`, and `name` (if available) from the verified `FirebaseToken`.
  - Check the SQL database for a `User` entity with this Firebase `uid`.
  - If it does not exist (first-time login), create and save a new `User` record.
  - Set the authenticated user in the `SecurityContextHolder`.

## 2. Image Uploads (AWS S3 Presigned URLs)

To save server bandwidth and enable upload progress bars on the frontend, the frontend uploads images **directly** to AWS S3 using `XMLHttpRequest`. The backend's job is simply to authorize the upload by generating a temporary "Presigned URL".

### Frontend Contract:
The frontend makes a request to the backend to get the upload URL:
- **Method:** `POST`
- **Endpoint:** `/api/upload/presign`
- **Request Body (JSON):**
  ```json
  {
    "filename": "my-club-banner.jpg",
    "contentType": "image/jpeg"
  }
  ```
- **Expected Response (JSON):**
  ```json
  {
    "presignedUrl": "https://your-bucket.s3.amazonaws.com/uuid-filename.jpg?X-Amz-Algorithm=...",
    "publicUrl": "https://your-bucket.s3.amazonaws.com/uuid-filename.jpg"
  }
  ```

### Requirements for the Backend AI:
- **Dependency:** Add the `aws-java-sdk-s3` (or AWS SDK v2 for Java).
- **Configuration:** Inject AWS credentials (`accessKey`, `secretKey`, `region`, `bucketName`) securely.
- **Controller Logic (`/api/upload/presign`):**
  1. Authenticate the request (ensure the user is logged in).
  2. Sanitize the filename and prepend a UUID to prevent collisions (e.g., `images/clubs/{uuid}-{filename}`).
  3. Generate a Presigned `PUT` Object Request using the AWS SDK, valid for a short time (e.g., 15 minutes).
  4. Ensure the presigned URL enforces the requested `contentType`.
  5. Return the generated `presignedUrl` alongside the permanent `publicUrl` (which the frontend will save to the database when submitting the final form).

---

> **Note to Backend AI:** Do not build a multipart file upload controller (`@RequestParam("file") MultipartFile`). The frontend is strictly configured for direct-to-S3 uploads via presigned URLs to support byte-level progress tracking.
