package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating a new club.
 *
 * <p>{@code managerId} is not part of this DTO — it is derived from the
 * authenticated {@link com.example.demo.security.FirebasePrincipal} to prevent IDOR.
 */
public record ClubCreateRequest(
        @NotBlank(message = "Club name is required")
        @Size(min = 2, max = 100, message = "Club name must be between 2 and 100 characters")
        String name,

        @Size(max = 5000, message = "Bio must not exceed 5000 characters")
        String bio,

        String profileImageUrl,

        String category,

        @NotBlank(message = "City is required")
        String city,

        @NotNull(message = "Latitude is required")
        Double latitude,

        @NotNull(message = "Longitude is required")
        Double longitude
) {}
