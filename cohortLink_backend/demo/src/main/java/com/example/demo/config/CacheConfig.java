package com.example.demo.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;

/**
 * Redis cache configuration for CohortLink.
 *
 * <p>Cache names and their TTLs:
 * <ul>
 *   <li>{@code nearbyEvents}  — PostGIS geo-search results, 2 min TTL</li>
 *   <li>{@code eventSearch}   — FTS + geo combined search, 90 sec TTL</li>
 *   <li>{@code singleEvent}   — Individual event detail by ID, 10 min TTL</li>
 *   <li>{@code eventsByClub}  — Paginated event list per club, 5 min TTL</li>
 *   <li>{@code allClubs}      — Full club discovery list, 5 min TTL</li>
 *   <li>{@code singleClub}    — Individual club detail by ID, 10 min TTL</li>
 * </ul>
 *
 * <p>All caches use JSON serialization for human-readable entries in Redis CLI / RedisInsight.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Shared base config: JSON value serializer + no null caching.
     * Applied to every cache as a baseline, then each cache overrides only its TTL.
     */
    private RedisCacheConfiguration baseCacheConfig() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);

        return RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer(objectMapper)
                        )
                );
    }

    @Bean
    public RedisCacheManagerBuilderCustomizer redisCacheManagerBuilderCustomizer() {
        return builder -> builder
                // PostGIS ST_DWithin geo-search — high frequency, short TTL
                .withCacheConfiguration("nearbyEvents",
                        baseCacheConfig().entryTtl(Duration.ofMinutes(2)))

                // Full-text search + geo — most expensive query, short TTL so results feel live
                .withCacheConfiguration("eventSearch",
                        baseCacheConfig().entryTtl(Duration.ofSeconds(90)))

                // Single event detail — includes remainingSlots, evicted on every booking
                .withCacheConfiguration("singleEvent",
                        baseCacheConfig().entryTtl(Duration.ofMinutes(10)))

                // Paginated event list per club — low write rate, medium TTL
                .withCacheConfiguration("eventsByClub",
                        baseCacheConfig().entryTtl(Duration.ofMinutes(5)))

                // Full club browse list — full table scan, evicted on any club write
                .withCacheConfiguration("allClubs",
                        baseCacheConfig().entryTtl(Duration.ofMinutes(5)))

                // Single club detail — evicted only on that club's update/delete
                .withCacheConfiguration("singleClub",
                        baseCacheConfig().entryTtl(Duration.ofMinutes(10)));
    }
}
