package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "club_followers", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "club_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClubFollower {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    private LocalDateTime followedAt;

    @PrePersist
    protected void onCreate() {
        if (followedAt == null) {
            followedAt = LocalDateTime.now();
        }
    }
}
