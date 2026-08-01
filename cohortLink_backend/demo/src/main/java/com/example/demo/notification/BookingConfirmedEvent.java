package com.example.demo.notification;

import com.example.demo.entity.Booking;

import java.time.Instant;

/**
 * Domain event published when a booking is successfully confirmed.
 *
 * <p>Uses a Java 21 {@code record} — immutable, thread-safe, zero boilerplate.
 * Published from {@code BookingService.createBooking} after the atomic slot
 * decrement succeeds and the booking row is committed.
 *
 * <h2>Why a record?</h2>
 * Records are value types: immutable and safe to pass across thread boundaries.
 * JPA-managed entities are session-scoped and would throw
 * {@code LazyInitializationException} when accessed from an {@code @Async} listener.
 * This record holds only primitive/value fields — no JPA proxies.
 *
 * <h2>Factory method contract</h2>
 * {@link #from(Booking)} MUST be called inside the active {@code @Transactional}
 * method so that lazy associations ({@code user}, {@code event}, {@code event.club})
 * are still accessible on the open JPA session.
 *
 * <h2>Kafka upgrade path</h2>
 * <pre>{@code
 * // In BookingService — replace:
 * applicationEventPublisher.publishEvent(BookingConfirmedEvent.from(booking));
 * // With:
 * kafkaTemplate.send("booking.confirmed", booking.getId().toString(),
 *                    BookingConfirmedEvent.from(booking));
 *
 * // In listeners — replace:
 * @Async("notificationExecutor") @EventListener
 * // With:
 * @KafkaListener(topics = "booking.confirmed", groupId = "notification-service")
 * }</pre>
 * Business logic inside the listeners: <b>zero changes</b>.
 */
public record BookingConfirmedEvent(
        Long bookingId,
        Long userId,
        String userName,
        String userEmail,
        Long eventId,
        String eventTitle,
        Long clubId,
        String clubName,
        Instant eventTime,
        Instant confirmedAt
) {

    /**
     * Factory method — constructs the event payload from a fully-loaded JPA entity.
     * Must be called <b>inside</b> the active {@code @Transactional} method
     * so that lazy associations are accessible.
     *
     * @param booking the newly persisted and committed {@link Booking}.
     */
    public static BookingConfirmedEvent from(Booking booking) {
        return new BookingConfirmedEvent(
                booking.getId(),
                booking.getUser().getId(),
                booking.getUser().getName(),
                booking.getUser().getEmail(),
                booking.getEvent().getId(),
                booking.getEvent().getTitle(),
                booking.getEvent().getClub().getId(),
                booking.getEvent().getClub().getName(),
                booking.getEvent().getEventTime(),
                Instant.now()
        );
    }
}
