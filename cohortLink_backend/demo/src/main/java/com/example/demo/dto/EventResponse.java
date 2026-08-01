package com.example.demo.dto;

import com.example.demo.entity.Event;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response DTO for a single event.
 *
 * <p>Intentionally a plain Lombok class (not a Java record) so that Jackson can
 * deserialize instances from Redis cache ({@code singleEvent} cache) without a
 * {@code @JsonCreator}. Records have no default constructor, which breaks
 * {@code GenericJackson2JsonRedisSerializer}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventResponse {

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

    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getClub().getId(),
                event.getTitle(),
                event.getDescription(),
                event.getImageUrl(),
                event.getLocationName(),
                event.getLatitude(),
                event.getLongitude(),
                event.getEventTime(),
                event.getMaxCapacity(),
                event.getRemainingSlots(),
                event.isFeatured()
        );
    }
}
