package com.example.demo.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;

/** Request body for creating a new event. */
public record EventCreateRequest(
        @NotBlank(message = "Event title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        String imageUrl,

        @NotBlank(message = "Location name is required")
        @Size(max = 200, message = "Location name must not exceed 200 characters")
        String locationName,

        @DecimalMin(value = "-90.0",  message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0",   message = "Latitude must be between -90 and 90")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0",  message = "Longitude must be between -180 and 180")
        Double longitude,

        @NotNull(message = "Event time is required")
        @Future(message = "Event time must be in the future")
        Instant eventTime,

        @Min(value = 1, message = "Max capacity must be at least 1")
        int maxCapacity,

        boolean featured
) {}
