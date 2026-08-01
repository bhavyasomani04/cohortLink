package com.example.demo.security;

import java.io.Serializable;

/**
 * Immutable principal placed in the {@link org.springframework.security.core.context.SecurityContext}
 * after a Firebase ID Token has been successfully verified.
 *
 * <p>Using a Java 21 record keeps this lightweight and thread-safe by default.
 *
 * @param uid      Firebase UID — globally unique, never changes for a user.
 * @param email    User's email address from the verified token.
 * @param name     Display name extracted from the token (may be null for email-only accounts).
 * @param dbUserId The surrogate primary-key of the corresponding {@code User} entity in our DB.
 *                 Populated after the upsert in {@link com.example.demo.service.UserSyncService}.
 */
public record FirebasePrincipal(
        String uid,
        String email,
        String name,
        Long dbUserId
) implements Serializable {}
