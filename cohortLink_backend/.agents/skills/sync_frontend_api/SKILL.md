---
name: sync_frontend_api
description: Updates the frontend API documentation (forntendApiContext.md) whenever backend API endpoints (controllers) are modified.
---
# Sync Frontend API Documentation

When you create, modify, or delete a REST API endpoint in any of the Spring Boot Controllers, or when you modify any associated request/response DTOs, you **MUST** automatically update the API documentation file located at `E:\cohortLink\cohortLink_backend\SKILL.md`.

### Guidelines:
1. Ensure the `frontendApiContext.md` file stays perfectly in sync with the backend Java code.
2. If adding a new endpoint, document its Method, Path, Query Parameters, Request Body, and Response format under the appropriate Controller heading.
3. If adding a new DTO, document its JSON structure in the "Models (DTOs)" section of the relevant API.
4. If an API is deleted or modified, reflect those changes in `frontendApiContext.md`.
