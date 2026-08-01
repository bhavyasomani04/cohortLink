package com.example.demo.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Async listener that sends transactional email notifications for booking lifecycle events.
 *
 * <h2>Execution model</h2>
 * <ul>
 *   <li>Runs in the {@code notificationExecutor} thread pool — completely isolated
 *       from the HTTP request thread.</li>
 *   <li>{@code @Async} ensures this fires <em>after</em> the publishing transaction
 *       commits, so listeners always see fully persisted data.</li>
 *   <li>A failure here (e.g. email provider down) <b>never</b> rolls back or blocks
 *       the booking confirmation/cancellation response.</li>
 * </ul>
 *
 * <h2>Failure isolation from BookingAuditListener</h2>
 * This listener is completely independent from {@link BookingAuditListener}.
 * Both run concurrently in the {@code notificationExecutor} pool.
 * An email failure never suppresses the audit record, and vice versa.
 *
 * <h2>Kafka upgrade path</h2>
 * Replace {@code @Async("notificationExecutor") @EventListener} with
 * {@code @KafkaListener(topics = "booking.confirmed", groupId = "notification-service")}.
 * The method body is unchanged.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingNotificationListener {

    private final EmailService emailService;

    /**
     * Sends a booking confirmation email to the attendee.
     *
     * @param event the domain event carrying booking and event metadata.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        log.info("[Notification] BOOKING_CONFIRMED | bookingId={} userId={} email=\"{}\" eventId={} eventTitle=\"{}\"",
                event.bookingId(), event.userId(), event.userEmail(),
                event.eventId(), event.eventTitle());

        try {
            emailService.sendBookingConfirmedEmail(
                    event.userEmail(),
                    event.userName(),
                    event.eventId(),
                    event.eventTitle(),
                    event.clubName(),
                    event.eventTime()
            );
        } catch (Exception ex) {
            // Email failure is non-fatal — booking is already committed in the DB.
            // User is booked regardless; email is best-effort.
            log.error("[Notification] Failed to send booking confirmation email | userId={} bookingId={} reason={}",
                    event.userId(), event.bookingId(), ex.getMessage());
        }
    }

    /**
     * Sends a booking cancellation email to the attendee.
     *
     * @param event the domain event carrying booking and event metadata.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onBookingCancelled(BookingCancelledEvent event) {
        log.info("[Notification] BOOKING_CANCELLED | bookingId={} userId={} email=\"{}\" eventId={} eventTitle=\"{}\"",
                event.bookingId(), event.userId(), event.userEmail(),
                event.eventId(), event.eventTitle());

        try {
            emailService.sendBookingCancelledEmail(
                    event.userEmail(),
                    event.userName(),
                    event.eventId(),
                    event.eventTitle(),
                    event.clubName(),
                    event.eventTime()
            );
        } catch (Exception ex) {
            // Email failure is non-fatal — cancellation and slot restoration are already committed.
            log.error("[Notification] Failed to send booking cancellation email | userId={} bookingId={} reason={}",
                    event.userId(), event.bookingId(), ex.getMessage());
        }
    }
}
