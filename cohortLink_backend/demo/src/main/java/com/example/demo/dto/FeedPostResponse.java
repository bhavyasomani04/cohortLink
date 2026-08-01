package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedPostResponse {
    private Long id;
    private ClubSummary club;
    private UserSummary author;
    private String caption;
    private List<ImageResponse> images;
    private Integer likeCount;
    private Integer commentCount;
    private boolean hasLiked;
    private LocalDateTime createdAt;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClubSummary {
        private Long id;
        private String name;
        private String profileImageUrl;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageResponse {
        private String originalImageUrl;
        private String thumbnailUrl;
        private Double aspectRatio;
        private Integer sequenceOrder;
    }
}
