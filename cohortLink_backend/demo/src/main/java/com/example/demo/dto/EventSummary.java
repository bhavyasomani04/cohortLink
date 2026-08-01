package com.example.demo.dto;

import com.example.demo.entity.Event;
import java.time.Instant;

public record EventSummary(
    Long id, 
    String title, 
    String description, 
    String imageUrl, 
    String locationName, 
    Instant eventTime
) {
    public static EventSummary from(Event event) {
        return new EventSummary(
            event.getId(),
            event.getTitle(),
            event.getDescription(),
            event.getImageUrl(),
            event.getLocationName(),
            event.getEventTime()
        );
    }
}
