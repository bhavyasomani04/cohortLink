package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for the legacy user registration endpoint.
 *
 * <p><b>Note:</b> In the Firebase auth flow users are auto-provisioned on first login
 * via {@link com.example.demo.service.UserSyncService}. This endpoint remains for
 * administrative or migration purposes only and should not be called by the frontend.
 */
public record UserRegistrationRequest(
        @NotBlank(message = "Firebase UID is required")
        String firebaseUid,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be a valid email address")
        String email,

        String name
) {}
