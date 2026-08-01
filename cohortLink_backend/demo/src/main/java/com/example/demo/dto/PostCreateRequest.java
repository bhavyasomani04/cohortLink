package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostCreateRequest {
    private String caption;
    private List<ImageDto> images;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImageDto {
        private String originalImageUrl;
        private String thumbnailUrl;
        private Double aspectRatio;
        private Integer sequenceOrder;
    }
}
