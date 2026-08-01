package com.example.demo.repository;

import com.example.demo.dto.UserSummary;
import com.example.demo.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    Optional<Booking> findByUserIdAndEventId(Long userId, Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    long countByEventId(Long eventId);

    @Query("SELECT new com.example.demo.dto.UserSummary(u.id, u.email, u.name) " +
           "FROM Booking b JOIN b.user u WHERE b.event.id = :eventId")
    List<UserSummary> findAttendeeSummariesByEventId(@Param("eventId") Long eventId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.event WHERE b.user.id = :userId")
    List<Booking> findBookingsWithEventByUserId(@Param("userId") Long userId);
}
