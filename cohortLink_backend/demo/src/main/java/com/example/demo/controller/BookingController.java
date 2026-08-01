package com.example.demo.controller;

import com.example.demo.dto.BookingCreateRequest;
import com.example.demo.dto.BookingResponse;
import com.example.demo.dto.BookingWithEventResponse;
import com.example.demo.dto.UserSummary;
import com.example.demo.security.FirebasePrincipal;
import com.example.demo.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/bookings", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Books an event for the authenticated caller.
     * {@code userId} has been removed from the request body — it is derived
     * from the verified Firebase token to prevent IDOR.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse createBooking(@Valid @RequestBody BookingCreateRequest request,
                                         @AuthenticationPrincipal FirebasePrincipal principal) {
        return bookingService.createBooking(request, principal.dbUserId());
    }

    @GetMapping("/{bookingId}")
    public BookingResponse getBooking(@PathVariable Long bookingId,
                                      @AuthenticationPrincipal FirebasePrincipal principal) {
        return bookingService.getBooking(bookingId, principal.dbUserId());
    }

    /**
     * Returns bookings for the specified user.
     * Callers may only view their own bookings — the service enforces this.
     */
    @GetMapping("/user/{userId}")
    public List<BookingResponse> getBookingsByUser(@PathVariable Long userId,
                                                    @AuthenticationPrincipal FirebasePrincipal principal) {
        return bookingService.getBookingsByUser(userId, principal.dbUserId());
    }

    /**
     * Returns detailed bookings for the specified user, including full event information.
     * Callers may only view their own bookings.
     */
    @GetMapping("/user/{userId}/detailed")
    public List<BookingWithEventResponse> getBookingsWithEventDetailsByUser(@PathVariable Long userId,
                                                                            @AuthenticationPrincipal FirebasePrincipal principal) {
        return bookingService.getBookingsWithEventDetailsByUser(userId, principal.dbUserId());
    }

    @GetMapping("/event/{eventId}/attendees")
    public List<UserSummary> getAttendeesForEvent(@PathVariable Long eventId) {
        return bookingService.getAttendeesForEvent(eventId);
    }

    /**
     * Cancels a booking. Only the booking's owner may cancel it.
     */
    @DeleteMapping("/{bookingId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelBooking(@PathVariable Long bookingId,
                              @AuthenticationPrincipal FirebasePrincipal principal) {
        bookingService.cancelBooking(bookingId, principal.dbUserId());
    }
}
