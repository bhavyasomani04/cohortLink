package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for generating an S3 presigned upload URL.
 *
 * <p>The {@code contentType} field is validated against a whitelist of safe
 * image MIME types to prevent attackers from uploading executable content
 * disguised as images.
 */
public record PresignRequest(
        @NotBlank(message = "Filename is required")
        @Size(max = 255, message = "Filename must not exceed 255 characters")
        String filename,

        @NotBlank(message = "Content type is required")
        @Pattern(
            regexp = "image/(jpeg|jpg|png|gif|webp|svg\\+xml)",
            message = "Content type must be a supported image format (jpeg, png, gif, webp, svg)"
        )
        String contentType
) {}
