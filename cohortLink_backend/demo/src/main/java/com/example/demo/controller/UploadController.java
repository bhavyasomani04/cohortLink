package com.example.demo.controller;

import com.example.demo.dto.PresignRequest;
import com.example.demo.dto.PresignResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Generates AWS S3 presigned PUT URLs so the frontend can upload images
 * directly to S3 without routing through the backend server.
 *
 * <p>The backend's responsibilities:
 * <ol>
 *   <li>Authenticate the request (enforced by the filter chain).</li>
 *   <li>Sanitise the filename and generate a collision-proof S3 key.</li>
 *   <li>Generate a short-lived presigned PUT URL that enforces the requested Content-Type.</li>
 *   <li>Return the presigned URL alongside the permanent public URL.</li>
 * </ol>
 *
 * <p><b>No multipart upload</b> is implemented here — the frontend uses
 * {@code XMLHttpRequest} for byte-level progress tracking.
 */
@Slf4j
@RestController
@RequestMapping(value = "/api/upload", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class UploadController {

    /** Matches characters that are NOT alphanumeric, hyphen, underscore, or dot. */
    private static final Pattern UNSAFE_CHARS = Pattern.compile("[^a-zA-Z0-9._-]");

    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.region:ap-south-1}")
    private String region;

    @Value("${aws.s3.presign-duration-minutes:15}")
    private int presignDurationMinutes;

    /**
     * Generates a presigned PUT URL for direct-to-S3 image upload.
     *
     * @param request Contains the original filename and image content-type.
     * @return A {@link PresignResponse} with the presigned URL and the permanent public URL.
     */
    @PostMapping("/presign")
    public PresignResponse presign(@Valid @RequestBody PresignRequest request) {
        String safeFilename = sanitiseFilename(request.filename());
        String objectKey = "images/" + UUID.randomUUID() + "-" + safeFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(objectKey)
                .contentType(request.contentType())
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(presignDurationMinutes))
                .putObjectRequest(putObjectRequest)
                .build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        String presignedUrl = presignedRequest.url().toString();
        String publicUrl = "https://%s.s3.%s.amazonaws.com/%s".formatted(bucketName, region, objectKey);

        log.debug("Generated presigned URL for key={}", objectKey);
        return new PresignResponse(presignedUrl, publicUrl);
    }


    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Strips path traversal components and unsafe characters from a filename.
     *
     * <ol>
     *   <li>Takes only the file name portion (no directory separators).</li>
     *   <li>Replaces all non-alphanumeric characters (except {@code . _ -}) with {@code _}.</li>
     *   <li>Truncates to 100 characters to avoid oversized keys.</li>
     * </ol>
     */
    private static String sanitiseFilename(String raw) {
        // Strip directory components (path traversal prevention)
        String name = raw.replaceAll(".*/", "").replaceAll(".*\\\\", "");
        // Replace unsafe characters
        name = UNSAFE_CHARS.matcher(name).replaceAll("_");
        // Truncate
        return name.length() > 100 ? name.substring(0, 100) : name;
    }
}
