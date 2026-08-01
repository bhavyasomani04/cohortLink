package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

import java.time.Instant;

@Entity
@Table(name = "events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    private Club club;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    @Column(nullable = false)
    private String locationName;

    private Double latitude;

    private Double longitude;

    @Column(columnDefinition = "geography(Point, 4326)")
    private Point geoLocation;

    @Column(nullable = false)
    private Instant eventTime;

    @Column(nullable = false)
    private Integer maxCapacity;

    @Column(nullable = false)
    private Integer remainingSlots;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean featured;

    /**
     * Automatically syncs the PostGIS geoLocation point from latitude/longitude
     * before any insert or update operation.
     */
    @PrePersist
    @PreUpdate
    private void updateGeoLocation() {
        if (latitude != null && longitude != null) {
            this.geoLocation = GEOMETRY_FACTORY.createPoint(
                    new Coordinate(longitude, latitude));
        }
    }
}
