package com.example.demo.service;

import com.example.demo.dto.CachedSlice;
import com.example.demo.dto.EventCreateRequest;
import com.example.demo.dto.EventResponse;
import com.example.demo.dto.EventUpdateRequest;
import com.example.demo.dto.NearbyEventResponse;
import com.example.demo.entity.Club;
import com.example.demo.entity.Event;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.notification.EventCreatedEvent;
import com.example.demo.repository.ClubFollowerRepository;
import com.example.demo.repository.ClubRepository;
import com.example.demo.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.SliceImpl;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final ClubRepository clubRepository;
    private final PostService postService;
    private final ClubFollowerRepository clubFollowerRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Creates an event for the given club.
     * Only the club's manager may create events.
     *
     * @param clubId   ID of the club that will host the event.
     * @param request  Event creation data.
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller is not the club's manager.
     */
    @Caching(evict = {
            @CacheEvict(value = "nearbyEvents", allEntries = true),
            @CacheEvict(value = "eventSearch",  allEntries = true),
            @CacheEvict(value = "eventsByClub", allEntries = true)
    })
    @Transactional
    public EventResponse createEvent(Long clubId, EventCreateRequest request, Long callerId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));

        assertIsClubManager(club, callerId);

        Double lat = request.latitude();
        Double lng = request.longitude();
        if ((lat == null && lng == null) || (lat != null && lng != null && lat == 0.0 && lng == 0.0)) {
            lat = club.getLatitude();
            lng = club.getLongitude();
        }

        Event event = eventRepository.save(Event.builder()
                .club(club)
                .title(request.title())
                .description(request.description())
                .imageUrl(request.imageUrl())
                .locationName(request.locationName())
                .latitude(lat)
                .longitude(lng)
                .eventTime(request.eventTime())
                .maxCapacity(request.maxCapacity())
                .remainingSlots(request.maxCapacity())
                .featured(request.featured())
                .build());

        // Auto-create an announcement post in the club's feed (only if imageUrl is present)
        postService.createEventAnnouncementPost(club, club.getManager(), event.getTitle(), event.getImageUrl());

        // ── Notify club followers ─────────────────────────────────────────────
        // Fetch followers INSIDE this @Transactional method so lazy associations
        // (user.email, user.name) are accessible within the active JPA session.
        // EventCreatedEvent.from() projects them to plain NotificationTarget records
        // (no JPA proxies) so @Async listeners can safely use them across threads.
        List<User> followers = clubFollowerRepository.findUsersByClubId(clubId);
        if (!followers.isEmpty()) {
            eventPublisher.publishEvent(EventCreatedEvent.from(event, followers));
            log.info("[EventService] EventCreatedEvent published | eventId={} clubId={} followers={}",
                    event.getId(), clubId, followers.size());
        }
        // ─────────────────────────────────────────────────────────────────────

        return EventResponse.from(event);
    }

    @Cacheable(value = "singleEvent", key = "#eventId")
    @Transactional(readOnly = true)
    public EventResponse getEvent(Long eventId) {
        return eventRepository.findById(eventId)
                .map(EventResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));
    }

    @Cacheable(value = "eventsByClub", key = "#clubId + '_' + #page")
    @Transactional(readOnly = true)
    public CachedSlice<EventResponse> getEventsByClub(Long clubId, int page) {
        Pageable pageable = PageRequest.of(page, 12);
        Instant now = Instant.now();
        return CachedSlice.of(eventRepository.findUpcomingEventsByClubId(clubId, now, pageable).map(EventResponse::from));
    }

    @Transactional(readOnly = true)
    public Slice<EventResponse> getPastEventsForClub(Long clubId, int page) {
        Pageable pageable = PageRequest.of(page, 12);
        Instant currentTime = Instant.now();
        return eventRepository.findPastEventsByClubId(clubId, currentTime, pageable).map(EventResponse::from);
    }

    @Transactional(readOnly = true)
    public Slice<EventResponse> getFeaturedEvents(int page) {
        Pageable pageable = PageRequest.of(page, 12);
        Instant now = Instant.now();
        return eventRepository.findUpcomingFeaturedEvents(now, pageable).map(EventResponse::from);
    }

    /**
     * Location-aware full-text search for events by title or description.
     * Only events within the given radius of (lat, lng) are considered;
     * results are then ranked by FTS relevance (best match first).
     *
     * @param query    the user's search string
     * @param lat      latitude of the user's location
     * @param lng      longitude of the user's location
     * @param radiusKm search radius in kilometres (default 10)
     * @param page     zero-based page index
     * @return paginated slice of matching nearby events with distance
     */
    /**
     * Location-aware full-text search for events by title or description.
     *
     * <p>The {@code geohash} parameter is a precision-5 geohash (~5 km cell) computed by the
     * controller from the raw {@code lat}/{@code lng}. Users within the same geographic cell
     * share a single Redis cache entry, achieving high hit rates without sacrificing accuracy.
     *
     * @param geohash  precision-5 geohash of the user's location (used as the cache key bucket)
     * @param query    the user's search string
     * @param lat      latitude of the user's location (used for the actual DB query)
     * @param lng      longitude of the user's location (used for the actual DB query)
     * @param radiusKm search radius in kilometres (default 10)
     * @param page     zero-based page index
     */
    @Cacheable(
            value = "eventSearch",
            key = "#query.toLowerCase().trim() + '_' + #geohash + '_' + #radiusKm + '_' + #page",
            condition = "#query.length() >= 4"
    )
    @Transactional(readOnly = true)
    public CachedSlice<NearbyEventResponse> searchEvents(String query, String geohash,
                                                         double lat, double lng,
                                                         double radiusKm, int page) {
        String trimmed = query.trim();

        // Guard: reject queries shorter than 4 characters
        if (trimmed.length() < 4) {
            return CachedSlice.of(new SliceImpl<>(Collections.emptyList(), PageRequest.of(page, 12), false));
        }

        double radiusMeters = radiusKm * 1000.0;
        Pageable pageable = PageRequest.of(page, 12);
        Instant now = Instant.now();
        Slice<Object[]> results = eventRepository.searchByTextNearby(
                trimmed, lat, lng, radiusMeters, now, pageable);

        return CachedSlice.of(results.map(row -> new NearbyEventResponse(
                ((Number) row[0]).longValue(),                              // id
                ((Number) row[1]).longValue(),                              // club_id
                (String) row[2],                                            // title
                (String) row[3],                                            // description
                (String) row[4],                                            // image_url
                (String) row[5],                                            // location_name
                row[6] != null ? ((Number) row[6]).doubleValue() : null,    // latitude
                row[7] != null ? ((Number) row[7]).doubleValue() : null,    // longitude
                ((Timestamp) row[8]).toInstant(),                           // event_time
                ((Number) row[9]).intValue(),                               // max_capacity
                ((Number) row[10]).intValue(),                              // remaining_slots
                (Boolean) row[11],                                          // featured
                ((Number) row[12]).doubleValue()                            // distance_km
        )));
    }

    /**
     * Updates an event. Only the manager of the event's club may update it.
     *
     * @param eventId  ID of the event to update.
     * @param request  Fields to update (null / zero fields are ignored).
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller is not the club's manager.
     */
    @Caching(evict = {
            @CacheEvict(value = "singleEvent",   key = "#eventId"),
            @CacheEvict(value = "nearbyEvents",  allEntries = true),
            @CacheEvict(value = "eventSearch",   allEntries = true),
            @CacheEvict(value = "eventsByClub",  allEntries = true)
    })
    @Transactional
    public EventResponse updateEvent(Long eventId, EventUpdateRequest request, Long callerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        assertIsClubManager(event.getClub(), callerId);

        if (request.title() != null) event.setTitle(request.title());
        if (request.description() != null) event.setDescription(request.description());
        if (request.imageUrl() != null) event.setImageUrl(request.imageUrl());
        if (request.locationName() != null) event.setLocationName(request.locationName());
        
        Double reqLat = request.latitude();
        Double reqLng = request.longitude();
        if (reqLat != null && reqLng != null && reqLat == 0.0 && reqLng == 0.0) {
            event.setLatitude(event.getClub().getLatitude());
            event.setLongitude(event.getClub().getLongitude());
        } else {
            if (reqLat != null) event.setLatitude(reqLat);
            if (reqLng != null) event.setLongitude(reqLng);
        }
        if (request.eventTime() != null) event.setEventTime(request.eventTime());
        if (request.maxCapacity() > 0) {
            int difference = request.maxCapacity() - event.getMaxCapacity();
            event.setMaxCapacity(request.maxCapacity());
            event.setRemainingSlots(event.getRemainingSlots() + difference);
        }
        if (request.featured() != null) event.setFeatured(request.featured());
        return EventResponse.from(eventRepository.save(event));
    }

    /**
     * Finds events within the given radius of a geographic coordinate.
     *
     * @param lat      latitude of the search center
     * @param lng      longitude of the search center
     * @param radiusKm search radius in kilometers
     * @return list of nearby events sorted by event time ascending
     */
    /**
     * Finds events within the given radius of a geographic coordinate.
     *
     * <p>The {@code geohash} parameter is a precision-5 geohash (~5 km cell) computed by the
     * controller from the raw {@code lat}/{@code lng}. All users inside the same ~5 km² cell
     * share one Redis cache entry — dramatically improving hit rate vs. exact-coordinate keys.
     * The actual PostGIS query still uses the precise {@code lat}/{@code lng} values.
     *
     * @param geohash  precision-5 geohash of the search centre (used as the cache key bucket)
     * @param lat      precise latitude (used for the PostGIS ST_DWithin query)
     * @param lng      precise longitude (used for the PostGIS ST_DWithin query)
     * @param radiusKm search radius in kilometers
     * @param page     zero-based page number
     */
    @Cacheable(
            value = "nearbyEvents",
            key = "#geohash + '_' + #radiusKm + '_' + #page"
    )
    @Transactional(readOnly = true)
    public CachedSlice<NearbyEventResponse> findNearbyEvents(String geohash, double lat, double lng,
                                                              double radiusKm, int page) {
        double radiusMeters = radiusKm * 1000.0;
        Pageable pageable = PageRequest.of(page, 12);
        Instant now = Instant.now();
        Slice<Object[]> results = eventRepository.findNearbyEvents(lat, lng, radiusMeters, now, pageable);

        return CachedSlice.of(results.map(row -> new NearbyEventResponse(
                ((Number) row[0]).longValue(),                              // id
                ((Number) row[1]).longValue(),                              // club_id
                (String) row[2],                                            // title
                (String) row[3],                                            // description
                (String) row[4],                                            // image_url
                (String) row[5],                                            // location_name
                row[6] != null ? ((Number) row[6]).doubleValue() : null,    // latitude
                row[7] != null ? ((Number) row[7]).doubleValue() : null,    // longitude
                ((Timestamp) row[8]).toInstant(),                           // event_time
                ((Number) row[9]).intValue(),                               // max_capacity
                ((Number) row[10]).intValue(),                              // remaining_slots
                (Boolean) row[11],                                          // featured
                ((Number) row[12]).doubleValue()                            // distance_km
        )));
    }

    /**
     * Deletes an event. Only the manager of the event's club may delete it.
     *
     * @param eventId  ID of the event to delete.
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller is not the club's manager.
     */
    @Caching(evict = {
            @CacheEvict(value = "singleEvent",   key = "#eventId"),
            @CacheEvict(value = "nearbyEvents",  allEntries = true),
            @CacheEvict(value = "eventSearch",   allEntries = true),
            @CacheEvict(value = "eventsByClub",  allEntries = true)
    })
    @Transactional
    public void deleteEvent(Long eventId, Long callerId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found: " + eventId));

        assertIsClubManager(event.getClub(), callerId);

        eventRepository.delete(event);
    }

    // ── Ownership guard ──────────────────────────────────────────────────────

    private void assertIsClubManager(Club club, Long callerId) {
        if (!club.getManager().getId().equals(callerId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not the manager of this club"
            );
        }
    }
}
