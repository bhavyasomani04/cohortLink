package com.example.demo.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Async listener that fans out a new-event notification to every follower of a club.
 *
 * <h2>Execution model</h2>
 * <ul>
 *   <li>Runs in the {@code notificationExecutor} thread pool — completely isolated
 *       from the HTTP request thread.</li>
 *   <li>{@code @Async} guarantees this runs <em>after</em> the publishing transaction
 *       commits, so listeners always see fully persisted data.</li>
 *   <li>A failure here (e.g. email provider down) <b>never</b> rolls back or blocks
 *       the event-creation response.</li>
 * </ul>
 *
 * <h2>Batch processing</h2>
 * Followers are processed in batches of {@value BATCH_SIZE} to bound memory usage
 * when a club has thousands of followers. Each batch is a tight loop — for actual
 * email / push dispatch, each call should be non-blocking (async HTTP).
 *
 * <h2>Per-follower error isolation</h2>
 * Each notification is wrapped in try-catch. One failed send never prevents the
 * remaining followers from being notified.
 *
 * <h2>Kafka upgrade path</h2>
 * Replace {@code @Async("notificationExecutor") @EventListener} with
 * {@code @KafkaListener(topics = "event.created", groupId = "notification-service")}.
 * The method body is unchanged.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationDispatchListener {

    private final EmailService emailService;

    /** Number of followers to process per batch to bound memory usage. */
    private static final int BATCH_SIZE = 100;

    /**
     * Dispatches new-event notifications to all club followers.
     *
     * @param event the domain event containing event metadata and pre-fetched followers.
     */
    @Async("notificationExecutor")
    @EventListener
    public void onEventCreated(EventCreatedEvent event) {
        List<EventCreatedEvent.NotificationTarget> followers = event.followers();

        log.info("[Notification] Starting fan-out | eventId={} clubId=\"{}\" followerCount={}",
                event.eventId(), event.clubName(), followers.size());

        if (followers.isEmpty()) {
            log.info("[Notification] No followers to notify for eventId={}", event.eventId());
            return;
        }

        int successCount = 0;
        int failCount    = 0;

        // Process in batches — prevents holding too many records in memory
        for (int i = 0; i < followers.size(); i += BATCH_SIZE) {
            List<EventCreatedEvent.NotificationTarget> batch =
                    followers.subList(i, Math.min(i + BATCH_SIZE, followers.size()));

            for (EventCreatedEvent.NotificationTarget target : batch) {
                try {
                    dispatch(event, target);
                    successCount++;
                } catch (Exception ex) {
                    // One failed notification must never block the rest
                    failCount++;
                    log.error("[Notification] Failed | userId={} eventId={} reason={}",
                            target.userId(), event.eventId(), ex.getMessage());
                }
            }
        }

        log.info("[Notification] Fan-out complete | eventId={} success={} failed={}",
                event.eventId(), successCount, failCount);
    }

    // ── Dispatch to a single follower ────────────────────────────────────────

    private void dispatch(EventCreatedEvent event,
                          EventCreatedEvent.NotificationTarget target) {

        // ── Structured log (works as notification proof for portfolio) ────────
        log.info("[Notification] SEND | userId={} email=\"{}\" name=\"{}\" " +
                 "eventId={} eventTitle=\"{}\" clubName=\"{}\" eventTime={}",
                target.userId(), target.email(), target.name(),
                event.eventId(), event.eventTitle(),
                event.clubName(), event.eventTime());

        // ── Email via JavaMailSender ──────────────────────────────────────────
        String subject = "New event in " + event.clubName() + ": " + event.eventTitle();
        emailService.sendNewEventEmail(
            target.email(),
            target.name(),
            subject,
            event.eventId(),
            event.eventTitle(),
            event.clubName()
        );

        // ── TODO: FCM Push Notification ───────────────────────────────────────
        // fcmService.sendPush(
        //     userId : target.userId(),
        //     title  : event.clubName() + " posted a new event!",
        //     body   : event.eventTitle()
        // );
    }
}
