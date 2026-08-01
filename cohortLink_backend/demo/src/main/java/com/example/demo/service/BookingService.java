package com.example.demo.service;

import com.example.demo.dto.BookingCreateRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.dto.BookingWithEventResponse;
import com.example.demo.dto.UserSummary;
import com.example.demo.entity.Booking;
import com.example.demo.entity.Event;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.notification.BookingCancelledEvent;
import com.example.demo.notification.BookingConfirmedEvent;
import com.example.demo.repository.BookingRepository;
import com.example.demo.repository.EventRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final CacheManager cacheManager;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Creates a booking for the authenticated caller.
     *
     * <p>{@code callerId} comes from the verified Firebase token — not from the
     * request body — to prevent IDOR.
     *
     * <p><b>Race-condition fix (Point A):</b> Instead of a read-modify-write pattern,
     * we use a single atomic SQL {@code UPDATE ... WHERE remaining_slots > 0}.
     * This eliminates the TOCTOU race — the DB engine guarantees exactly one thread
     * wins per slot under any concurrency level.
     *
     * <p><b>Async notification (Point E):</b> After the booking is committed,
     * {@link BookingConfirmedEvent} is published. It fires async listeners
     * (email + audit) after the transaction commits — never blocking the response.
     *
     * @param request  Contains only {@code eventId}; {@code userId} was removed.
     * @param callerId DB user-id of the authenticated caller.
     */
    // Evict singleEvent cache because remainingSlots changes on every booking
    @CacheEvict(value = "singleEvent", key = "#request.eventId()")
    @Transactional
    public BookingResponse createBooking(BookingCreateRequest request, Long callerId) {
        if (bookingRepository.existsByUserIdAndEventId(callerId, request.eventId()))
            throw new IllegalStateException("User already booked this event");

        // Verify the user and event both exist before attempting the atomic decrement
        User user = userRepository.findById(callerId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + callerId));
        Event event = eventRepository.findById(request.eventId())
            .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + request.eventId()));

        // ── Point A: Atomic slot decrement ────────────────────────────────────
        // Single SQL UPDATE — eliminates read-modify-write TOCTOU race condition.
        // Returns 1 if a slot was reserved; 0 if the event is already full.
        int slotReserved = eventRepository.decrementSlotIfAvailable(event.getId());
        if (slotReserved == 0)
            throw new IllegalStateException("No remaining slots for event: " + request.eventId());

        Booking booking = bookingRepository.save(Booking.builder()
            .user(user)
            .event(event)
            .status("CONFIRMED")
            .build());

        // ── Point E: Publish BookingConfirmedEvent ────────────────────────────
        // Build the event payload inside the @Transactional scope while lazy
        // associations (user, event, club) are still accessible on the open session.
        // Spring fires @Async listeners AFTER this transaction commits.
        eventPublisher.publishEvent(BookingConfirmedEvent.from(booking));

        return BookingResponse.from(booking);
    }

    /**
     * Returns a single booking.
     * Only the booking owner may view it.
     *
     * @param bookingId ID of the booking.
     * @param callerId  DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller does not own this booking.
     */
    @Transactional(readOnly = true)
    public BookingResponse getBooking(Long bookingId, Long callerId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        assertIsOwner(booking, callerId);

        return BookingResponse.from(booking);
    }

    /**
     * Returns all bookings for {@code userId}.
     * Callers may only view their own bookings.
     *
     * @param userId   The user whose bookings are requested.
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if callerId != userId.
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByUser(Long userId, Long callerId) {
        if (!userId.equals(callerId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You may only view your own bookings"
            );
        }
        return bookingRepository.findByUserId(userId).stream().map(BookingResponse::from).toList();
    }

    /**
     * Returns all bookings for {@code userId} with full event details.
     * Callers may only view their own bookings.
     *
     * @param userId   The user whose bookings are requested.
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if callerId != userId.
     */
    @Transactional(readOnly = true)
    public List<BookingWithEventResponse> getBookingsWithEventDetailsByUser(Long userId, Long callerId) {
        if (!userId.equals(callerId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You may only view your own bookings"
            );
        }
        return bookingRepository.findBookingsWithEventByUserId(userId).stream()
                .map(BookingWithEventResponse::from)
                .toList();
    }

    /**
     * Cancels a booking and restores the event slot.
     * Only the booking owner may cancel.
     *
     * <p><b>Async notification (Point E):</b> {@link BookingCancelledEvent} is built
     * <em>before</em> the booking is deleted — while the JPA session is still open
     * and lazy associations are accessible. It is published after deletion and slot
     * restoration, firing async email + audit listeners post-transaction.
     *
     * @param bookingId ID of the booking to cancel.
     * @param callerId  DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller does not own this booking.
     */
    @Transactional
    public void cancelBooking(Long bookingId, Long callerId) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        assertIsOwner(booking, callerId);

        // ── Point E: Build the event payload BEFORE deletion ──────────────────
        // booking.getUser() and booking.getEvent() are lazy — they must be accessed
        // inside the open session. After bookingRepository.delete(), they may be
        // detached and inaccessible.
        BookingCancelledEvent cancelledEvent = BookingCancelledEvent.from(booking);

        Event event = booking.getEvent();
        Long eventId = event.getId();

        event.setRemainingSlots(event.getRemainingSlots() + 1);
        eventRepository.save(event);
        bookingRepository.delete(booking);

        // Manually evict singleEvent cache — @CacheEvict can't use SpEL here
        // because eventId is not in the method signature, only bookingId is.
        var cache = cacheManager.getCache("singleEvent");
        if (cache != null) cache.evict(eventId);

        // ── Publish BookingCancelledEvent ─────────────────────────────────────
        // Fires after the transaction commits — async listeners run in the
        // notificationExecutor pool, never blocking the cancel response.
        eventPublisher.publishEvent(cancelledEvent);
    }

    @Transactional(readOnly = true)
    public List<UserSummary> getAttendeesForEvent(Long eventId) {
        return bookingRepository.findAttendeeSummariesByEventId(eventId);
    }

    // ── Ownership guard ──────────────────────────────────────────────────────

    private void assertIsOwner(Booking booking, Long callerId) {
        if (!booking.getUser().getId().equals(callerId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You do not own this booking"
            );
        }
    }
}
