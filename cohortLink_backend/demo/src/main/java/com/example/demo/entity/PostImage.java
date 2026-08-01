package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(length = 1000, nullable = false)
    private String originalImageUrl;

    @Column(length = 1000, nullable = false)
    private String thumbnailUrl;

    @Column(nullable = false)
    private Double aspectRatio;

    @Column(nullable = false)
    private Integer sequenceOrder;
}
