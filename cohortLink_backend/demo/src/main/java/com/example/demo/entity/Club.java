package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

@Entity
@Table(name = "clubs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Club {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id", nullable = false)
    private User manager;

    @Column(nullable = false)

    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String profileImageUrl;

    private String category;

    @Column(nullable = false)
    private String city;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(columnDefinition = "geography(Point, 4326)")
    private Point geoLocation;

    @PrePersist
    @PreUpdate
    private void updateGeoLocation() {
        if (latitude != null && longitude != null) {
            this.geoLocation = GEOMETRY_FACTORY.createPoint(
                    new Coordinate(longitude, latitude));
        }
    }
}
