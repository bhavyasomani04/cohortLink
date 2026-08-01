package com.example.demo.dto;

import jakarta.validation.constraints.*;

import java.time.Instant;

/** Request body for updating an existing event. All fields are optional. */
public record EventUpdateRequest(
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        String imageUrl,

        @Size(max = 200, message = "Location name must not exceed 200 characters")
        String locationName,

        @DecimalMin(value = "-90.0",  message = "Latitude must be between -90 and 90")
        @DecimalMax(value = "90.0",   message = "Latitude must be between -90 and 90")
        Double latitude,

        @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
        @DecimalMax(value = "180.0",  message = "Longitude must be between -180 and 180")
        Double longitude,

        Instant eventTime,

        @Min(value = 0, message = "Max capacity cannot be negative")
        int maxCapacity,

        Boolean featured
) {}
