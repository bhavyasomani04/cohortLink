package com.example.demo.notification;

import com.example.demo.entity.Booking;

import java.time.Instant;

/**
 * Domain event published when a booking is cancelled and the event slot is restored.
 *
 * <p>Uses a Java 21 {@code record} — immutable, thread-safe, zero boilerplate.
 * Published from {@code BookingService.cancelBooking} after the slot is restored
 * and the booking row is deleted.
 *
 * <h2>Critical ordering note</h2>
 * {@link #from(Booking)} MUST be called <b>before</b> {@code bookingRepository.delete(booking)}
 * while the JPA session is still open. After deletion, lazy associations
 * ({@code booking.getUser()}, {@code booking.getEvent()}) cannot be safely accessed.
 *
 * <h2>Kafka upgrade path</h2>
 * <pre>{@code
 * // In BookingService — replace:
 * applicationEventPublisher.publishEvent(BookingCancelledEvent.from(booking));
 * // With:
 * kafkaTemplate.send("booking.cancelled", booking.getId().toString(),
 *                    BookingCancelledEvent.from(booking));
 *
 * // In listeners — replace:
 * @Async("notificationExecutor") @EventListener
 * // With:
 * @KafkaListener(topics = "booking.cancelled", groupId = "notification-service")
 * }</pre>
 * Business logic inside the listeners: <b>zero changes</b>.
 */
public record BookingCancelledEvent(
        Long bookingId,
        Long userId,
        String userName,
        String userEmail,
        Long eventId,
        String eventTitle,
        Long clubId,
        String clubName,
        Instant eventTime,
        Instant cancelledAt
) {

    /**
     * Factory method — constructs the event payload from a fully-loaded JPA entity.
     * Must be called <b>before</b> the booking is deleted so that lazy associations
     * are still accessible on the open session.
     *
     * @param booking the {@link Booking} that is about to be cancelled.
     */
    public static BookingCancelledEvent from(Booking booking) {
        return new BookingCancelledEvent(
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
