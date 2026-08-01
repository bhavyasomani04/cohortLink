package com.example.demo.dto;

import com.example.demo.entity.Club;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a Club.
 * Converted to a Lombok @Data class so Jackson can deserialize it from Redis cache.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClubResponse {
    private Long id;
    private String name;
    private String bio;
    private String profileImageUrl;
    private String category;
    private String city;
    private Double latitude;
    private Double longitude;
    private UserSummary manager;

    public static ClubResponse from(Club club) {
        return new ClubResponse(
            club.getId(),
            club.getName(),
            club.getBio(),
            club.getProfileImageUrl(),
            club.getCategory(),
            club.getCity(),
            club.getLatitude(),
            club.getLongitude(),
            UserSummary.from(club.getManager())
        );
    }
}
