package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request body for booking an event.
 *
 * <p>{@code userId} is intentionally absent — the authenticated caller's identity
 * is derived from the {@link com.example.demo.security.FirebasePrincipal} in the
 * {@link org.springframework.security.core.context.SecurityContextHolder}. This
 * prevents IDOR attacks where a caller could book on behalf of another user.
 */
public record BookingCreateRequest(
        @NotNull(message = "eventId is required")
        Long eventId
) {}
