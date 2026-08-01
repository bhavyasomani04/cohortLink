package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for nearby / search event queries.
 *
 * <p>Intentionally a plain Lombok class (not a Java record) so that Jackson can
 * deserialize instances from Redis cache without requiring a {@code @JsonCreator}.
 * Records have no default constructor, which breaks {@code GenericJackson2JsonRedisSerializer}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NearbyEventResponse {

    private Long id;
    private Long clubId;
    private String title;
    private String description;
    private String imageUrl;
    private String locationName;
    private Double latitude;
    private Double longitude;
    private Instant eventTime;
    private int maxCapacity;
    private int remainingSlots;
    private boolean featured;
    private Double distanceKm;
}
