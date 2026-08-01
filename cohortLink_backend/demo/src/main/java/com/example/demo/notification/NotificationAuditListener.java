package com.example.demo.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Independent audit listener for the event-created notification pipeline.
 *
 * <p>Runs as a completely separate {@code @Async} listener from
 * {@link NotificationDispatchListener}. This means:
 * <ul>
 *   <li>A failure in dispatch (e.g. email provider down) never suppresses
 *       the audit record.</li>
 *   <li>A failure in auditing never interrupts notification dispatch.</li>
 *   <li>Both listeners run concurrently in the {@code notificationExecutor} pool.</li>
 * </ul>
 *
 * <p>In production, this log line would be ingested by an ELK stack, Datadog,
 * or written to an {@code audit_log} database table for compliance reporting.
 */
@Slf4j
@Component
public class NotificationAuditListener {

    /**
     * Records a structured audit entry when a new event is created and
     * notifications are about to be dispatched.
     *
     * @param event the domain event carrying notification metadata.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onEventCreated(EventCreatedEvent event) {
        log.info("[AUDIT] action=EVENT_NOTIFICATION_DISPATCHED " +
                 "eventId={} eventTitle=\"{}\" clubId={} clubName=\"{}\" " +
                 "followerCount={} publishedAt={}",
                event.eventId(),
                event.eventTitle(),
                event.clubId(),
                event.clubName(),
                event.followers().size(),
                event.publishedAt()
        );

        // TODO: persist to audit_log table
        // auditLogRepository.save(AuditLog.builder()
        //     .action("EVENT_NOTIFICATION_DISPATCHED")
        //     .entityId(event.eventId())
        //     .metadata(Map.of("clubId", event.clubId(), "followers", event.followers().size()))
        //     .occurredAt(event.publishedAt())
        //     .build());
    }
}
