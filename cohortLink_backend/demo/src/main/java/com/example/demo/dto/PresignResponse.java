package com.example.demo.dto;

/**
 * Response body for the {@code POST /api/upload/presign} endpoint.
 *
 * <p>The frontend:
 * <ol>
 *   <li>Uses {@code presignedUrl} to PUT the file directly to S3 (includes authentication
 *       query parameters; valid for a short window configured by {@code aws.s3.presign-duration-minutes}).</li>
 *   <li>Saves {@code publicUrl} in its form state and submits it to the backend when
 *       persisting the entity (club, event, etc.).</li>
 * </ol>
 */
public record PresignResponse(
        String presignedUrl,
        String publicUrl
) {}
