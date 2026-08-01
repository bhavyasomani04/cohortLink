package com.example.demo.repository;

import com.example.demo.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;


public interface EventRepository extends JpaRepository<Event, Long> {

    @Query("SELECT e FROM Event e WHERE e.club.id = :clubId AND e.eventTime >= :now ORDER BY e.eventTime ASC")
    Slice<Event> findUpcomingEventsByClubId(@Param("clubId") Long clubId,
                                            @Param("now") java.time.Instant now,
                                            Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.club.id = :clubId AND e.eventTime < :currentTime ORDER BY e.eventTime DESC")
    Slice<Event> findPastEventsByClubId(@Param("clubId") Long clubId, @Param("currentTime") java.time.Instant currentTime, Pageable pageable);


    @Query("SELECT e FROM Event e WHERE e.featured = true AND e.eventTime >= :now ORDER BY e.eventTime ASC")
    Slice<Event> findUpcomingFeaturedEvents(@Param("now") java.time.Instant now, Pageable pageable);

    @Query(value = """
            SELECT e.id, e.club_id, e.title, e.description, e.image_url,
                   e.location_name, e.latitude, e.longitude,
                   e.event_time, e.max_capacity, e.remaining_slots, e.featured,
                   ST_Distance(e.geo_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000.0 AS distance_km
            FROM events e
            WHERE e.geo_location IS NOT NULL
              AND ST_DWithin(e.geo_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radiusMeters)
              AND e.event_time >= :now
            ORDER BY e.event_time ASC
            """, nativeQuery = true)
    Slice<Object[]> findNearbyEvents(@Param("lat") double lat,
                                    @Param("lng") double lng,
                                    @Param("radiusMeters") double radiusMeters,
                                    @Param("now") java.time.Instant now,
                                    Pageable pageable);

    /**
     * Location-aware full-text search across event title and description.
     * <p>
     * Execution plan:
     * 1. GIST index on geo_location eliminates rows outside the radius (fast spatial filter)
     * 2. FTS runs only on the remaining nearby rows (cheap at small radius)
     * 3. ts_rank orders by relevance; event_time breaks ties
     *
     * @param query        the user's search string
     * @param lat          latitude of the user's location
     * @param lng          longitude of the user's location
     * @param radiusMeters search radius in metres
     */
    @Query(value = """
            SELECT e.id, e.club_id, e.title, e.description, e.image_url,
                   e.location_name, e.latitude, e.longitude,
                   e.event_time, e.max_capacity, e.remaining_slots, e.featured,
                   ST_Distance(e.geo_location,
                       ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)) / 1000.0 AS distance_km
            FROM events e
            WHERE e.geo_location IS NOT NULL
              AND ST_DWithin(
                      e.geo_location,
                      ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                      :radiusMeters
                  )
              AND e.event_time >= :now
              AND to_tsvector('english',
                      COALESCE(e.title, '') || ' ' || COALESCE(e.description, ''))
                  @@ plainto_tsquery('english', :query)
            ORDER BY
                ts_rank(
                    to_tsvector('english',
                        COALESCE(e.title, '') || ' ' || COALESCE(e.description, '')),
                    plainto_tsquery('english', :query)
                ) DESC,
                e.event_time ASC
            """, nativeQuery = true)
    Slice<Object[]> searchByTextNearby(@Param("query") String query,
                                       @Param("lat") double lat,
                                       @Param("lng") double lng,
                                       @Param("radiusMeters") double radiusMeters,
                                       @Param("now") java.time.Instant now,
                                       Pageable pageable);

    /**
     * Atomically reserves one slot on an event if any remain.
     *
     * <p>Executes a single SQL {@code UPDATE} statement:
     * <pre>{@code
     * UPDATE events SET remaining_slots = remaining_slots - 1
     * WHERE id = :id AND remaining_slots > 0
     * }</pre>
     *
     * <p>This eliminates the classic TOCTOU (time-of-check / time-of-use) race
     * condition present in read-modify-write patterns. The {@code WHERE remaining_slots > 0}
     * guard and the decrement are one atomic DB operation — the database engine
     * guarantees that exactly one concurrent request will succeed per slot.
     *
     * @param id the ID of the {@link com.example.demo.entity.Event} to decrement.
     * @return {@code 1} if a slot was successfully reserved; {@code 0} if the event
     *         is full or does not exist.
     */
    @Modifying
    @Query("UPDATE Event e SET e.remainingSlots = e.remainingSlots - 1 " +
           "WHERE e.id = :id AND e.remainingSlots > 0")
    int decrementSlotIfAvailable(@Param("id") Long id);
}
