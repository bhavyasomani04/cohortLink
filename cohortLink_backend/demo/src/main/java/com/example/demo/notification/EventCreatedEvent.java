package com.example.demo.notification;

import com.example.demo.entity.Event;
import com.example.demo.entity.User;

import java.time.Instant;
import java.util.List;

/**
 * Domain event published when a club manager creates a new event.
 *
 * <p>Uses a Java 21 {@code record} — immutable, thread-safe, zero boilerplate.
 * Passed from {@code EventService} to all {@code @Async} listeners via
 * Spring's in-process event bus.
 *
 * <h2>Why a record instead of a class?</h2>
 * Records are value types: structurally equal, immutable, and ideal as
 * message payloads because they can safely cross thread boundaries.
 *
 * <h2>Why pre-fetch followers as {@link NotificationTarget}?</h2>
 * JPA-managed {@link User} entities are session-scoped. Passing them to an
 * {@code @Async} listener causes {@code LazyInitializationException} because
 * the session is closed by the time the listener thread runs.
 * {@link NotificationTarget} holds only primitive values — fully safe across
 * thread boundaries with no open session required.
 *
 * <h2>Kafka upgrade path</h2>
 * <pre>{@code
 * // In EventService — replace:
 * applicationEventPublisher.publishEvent(EventCreatedEvent.from(event, followers));
 * // With:
 * kafkaTemplate.send("event.created", event.getId().toString(),
 *                    EventCreatedEvent.from(event, followers));
 *
 * // In listeners — replace:
 * @Async("notificationExecutor") @EventListener
 * // With:
 * @KafkaListener(topics = "event.created", groupId = "notification-service")
 * }</pre>
 * Business logic inside the listeners: <b>zero changes</b>.
 */
public record EventCreatedEvent(
        Long eventId,
        String eventTitle,
        String eventImageUrl,
        Instant eventTime,
        Long clubId,
        String clubName,
        List<NotificationTarget> followers,
        Instant publishedAt
) {

    /**
     * Lightweight projection of a follower — only what the notification needs.
     * No JPA proxies, no lazy fields — fully serialisable and thread-safe.
     */
    public record NotificationTarget(Long userId, String email, String name) {}

    /**
     * Factory method — constructs the event from fully-loaded JPA entities.
     * Must be called <b>inside</b> the active {@code @Transactional} method
     * so that lazy associations ({@code club}, {@code name}) are accessible.
     *
     * @param event     the newly persisted {@link Event}.
     * @param followers all {@link User}s following the event's club.
     */
    public static EventCreatedEvent from(Event event, List<User> followers) {
        List<NotificationTarget> targets = followers.stream()
                .map(u -> new NotificationTarget(u.getId(), u.getEmail(), u.getName()))
                .toList();

        return new EventCreatedEvent(
                event.getId(),
                event.getTitle(),
                event.getImageUrl(),
                event.getEventTime(),
                event.getClub().getId(),
                event.getClub().getName(),
                targets,
                Instant.now()
        );
    }
}
