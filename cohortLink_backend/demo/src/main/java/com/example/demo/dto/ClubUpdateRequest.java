package com.example.demo.dto;

import jakarta.validation.constraints.Size;

/** Request body for a partial update of an existing club. All fields are optional. */
public record ClubUpdateRequest(
        @Size(min = 2, max = 100, message = "Club name must be between 2 and 100 characters")
        String name,

        @Size(max = 5000, message = "Bio must not exceed 5000 characters")
        String bio,

        String profileImageUrl,

        String category,

        String city,
        Double latitude,
        Double longitude
) {}
