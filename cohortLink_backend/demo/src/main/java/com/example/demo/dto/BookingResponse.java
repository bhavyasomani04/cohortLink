package com.example.demo.dto;

import com.example.demo.entity.Booking;

import java.time.LocalDateTime;

public record BookingResponse(Long id, Long userId, Long eventId, String status, LocalDateTime bookedAt) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
            booking.getId(),
            booking.getUser().getId(),
            booking.getEvent().getId(),
            booking.getStatus(),
            booking.getBookedAt()
        );
    }
}
