package com.example.demo.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Independent audit listener for the booking notification pipeline.
 *
 * <p>Runs as a completely separate {@code @Async} listener from
 * {@link BookingNotificationListener}. This means:
 * <ul>
 *   <li>A failure in dispatch (e.g. email provider down) never suppresses
 *       the audit record.</li>
 *   <li>A failure in auditing never interrupts notification dispatch.</li>
 *   <li>Both listeners run concurrently in the {@code notificationExecutor} pool.</li>
 * </ul>
 *
 * <p>In production, these log lines would be ingested by an ELK stack, Datadog,
 * or written to an {@code audit_log} database table for compliance reporting.
 */
@Slf4j
@Component
public class BookingAuditListener {

    /**
     * Records a structured audit entry when a booking is confirmed.
     *
     * @param event the domain event carrying booking and event metadata.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        log.info("[AUDIT] action=BOOKING_CONFIRMED " +
                 "bookingId={} userId={} userName=\"{}\" " +
                 "eventId={} eventTitle=\"{}\" clubId={} clubName=\"{}\" " +
                 "eventTime={} confirmedAt={}",
                event.bookingId(),
                event.userId(),
                event.userName(),
                event.eventId(),
                event.eventTitle(),
                event.clubId(),
                event.clubName(),
                event.eventTime(),
                event.confirmedAt()
        );

        // TODO: persist to audit_log table
        // auditLogRepository.save(AuditLog.builder()
        //     .action("BOOKING_CONFIRMED")
        //     .entityId(event.bookingId())
        //     .metadata(Map.of(
        //         "userId",    event.userId(),
        //         "eventId",   event.eventId(),
        //         "clubId",    event.clubId()
        //     ))
        //     .occurredAt(event.confirmedAt())
        //     .build());
    }

    /**
     * Records a structured audit entry when a booking is cancelled.
     *
     * @param event the domain event carrying booking and event metadata.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onBookingCancelled(BookingCancelledEvent event) {
        log.info("[AUDIT] action=BOOKING_CANCELLED " +
                 "bookingId={} userId={} userName=\"{}\" " +
                 "eventId={} eventTitle=\"{}\" clubId={} clubName=\"{}\" " +
                 "eventTime={} cancelledAt={}",
                event.bookingId(),
                event.userId(),
                event.userName(),
                event.eventId(),
                event.eventTitle(),
                event.clubId(),
                event.clubName(),
                event.eventTime(),
                event.cancelledAt()
        );

        // TODO: persist to audit_log table
        // auditLogRepository.save(AuditLog.builder()
        //     .action("BOOKING_CANCELLED")
        //     .entityId(event.bookingId())
        //     .metadata(Map.of(
        //         "userId",  event.userId(),
        //         "eventId", event.eventId(),
        //         "clubId",  event.clubId()
        //     ))
        //     .occurredAt(event.cancelledAt())
        //     .build());
    }
}
