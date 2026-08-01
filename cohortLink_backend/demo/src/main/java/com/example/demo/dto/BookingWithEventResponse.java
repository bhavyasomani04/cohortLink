package com.example.demo.dto;

import com.example.demo.entity.Booking;
import java.time.LocalDateTime;

public record BookingWithEventResponse(
    Long id, 
    Long userId, 
    EventSummary event, 
    String status, 
    LocalDateTime bookedAt
) {
    public static BookingWithEventResponse from(Booking booking) {
        return new BookingWithEventResponse(
            booking.getId(),
            booking.getUser().getId(),
            EventSummary.from(booking.getEvent()),
            booking.getStatus(),
            booking.getBookedAt()
        );
    }
}
