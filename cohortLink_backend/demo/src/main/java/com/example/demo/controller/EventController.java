package com.example.demo.controller;

import ch.hsr.geohash.GeoHash;
import com.example.demo.dto.CachedSlice;
import com.example.demo.dto.EventCreateRequest;
import com.example.demo.dto.EventResponse;
import com.example.demo.dto.EventUpdateRequest;
import com.example.demo.dto.NearbyEventResponse;
import com.example.demo.security.FirebasePrincipal;
import com.example.demo.service.EventService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Slice;

import java.util.List;

@RestController
@RequestMapping(value = "/api/events", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /**
     * Creates an event for a club. The caller must be the manager of the specified club.
     * Ownership is enforced in the service layer.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public EventResponse createEvent(@RequestParam Long clubId,
                                     @Valid @RequestBody EventCreateRequest request,
                                     @AuthenticationPrincipal FirebasePrincipal principal) {
        return eventService.createEvent(clubId, request, principal.dbUserId());
    }

    @GetMapping("/{eventId}")
    public EventResponse getEvent(@PathVariable Long eventId) {
        return eventService.getEvent(eventId);
    }

    @GetMapping("/club/{clubId}")
    public CachedSlice<EventResponse> getEventsByClub(@PathVariable Long clubId,
                                                      @RequestParam(defaultValue = "0") int page) {
        return eventService.getEventsByClub(clubId, page);
    }

    @GetMapping("/club/{clubId}/past")
    public Slice<EventResponse> getPastEventsByClub(@PathVariable Long clubId,
                                                    @RequestParam(defaultValue = "0") int page) {
        return eventService.getPastEventsForClub(clubId, page);
    }

    @GetMapping("/featured")
    public Slice<EventResponse> getFeaturedEvents(@RequestParam(defaultValue = "0") int page) {
        return eventService.getFeaturedEvents(page);
    }

    /**
     * Location-aware full-text search across event title and description.
     * Only events within {@code radiusKm} kilometres of the given coordinate are searched.
     * Results are ranked by FTS relevance — best matches appear first.
     *
     * <p>A precision-5 geohash (~5 km cell) is computed from the incoming coordinates and used
     * as the Redis cache key bucket so that nearby users share the same cache entry.
     *
     * @param q        the search query string from the frontend (min 2 chars)
     * @param lat      latitude of the user's current location
     * @param lng      longitude of the user's current location
     * @param radiusKm search radius in kilometres (default 10)
     * @param page     zero-based page number for pagination
     */
    @GetMapping("/search")
    public CachedSlice<NearbyEventResponse> searchEvents(
            @RequestParam @NotBlank(message = "Search query must not be blank") String q,
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm,
            @RequestParam(defaultValue = "0") int page) {
        // Precision 5 ≈ 5 km cell — users within the same cell share one cache entry
        String geohash = GeoHash.geoHashStringWithCharacterPrecision(lat, lng, 5);
        return eventService.searchEvents(q, geohash, lat, lng, radiusKm, page);
    }

    /**
     * Find events near a geographic coordinate within a given radius.
     *
     * <p>A precision-5 geohash (~5 km cell) is computed from the incoming coordinates and used
     * as the Redis cache key bucket. All users within the same ~5 km² area share one cache
     * entry — dramatically improving hit rate compared to exact-coordinate key bucketing.
     *
     * @param lat      latitude of the search center
     * @param lng      longitude of the search center
     * @param radiusKm search radius in kilometers (default: 10)
     * @param page     zero-based page number
     */
    @GetMapping("/nearby")
    public CachedSlice<NearbyEventResponse> getNearbyEvents(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm,
            @RequestParam(defaultValue = "0") int page) {
        // Precision 5 ≈ 5 km cell — users within the same cell share one cache entry
        String geohash = GeoHash.geoHashStringWithCharacterPrecision(lat, lng, 5);
        return eventService.findNearbyEvents(geohash, lat, lng, radiusKm, page);
    }

    /**
     * Updates an event. Only the manager of the event's club may update it.
     */
    @PutMapping(value = "/{eventId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public EventResponse updateEvent(@PathVariable Long eventId,
                                     @Valid @RequestBody EventUpdateRequest request,
                                     @AuthenticationPrincipal FirebasePrincipal principal) {
        return eventService.updateEvent(eventId, request, principal.dbUserId());
    }

    /**
     * Deletes an event. Only the manager of the event's club may delete it.
     */
    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable Long eventId,
                            @AuthenticationPrincipal FirebasePrincipal principal) {
        eventService.deleteEvent(eventId, principal.dbUserId());
    }
}
