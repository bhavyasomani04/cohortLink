package com.example.demo.config;

import com.example.demo.security.FirebaseTokenAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 6 configuration for the CohortLink backend.
 *
 * <p>Key decisions:
 * <ul>
 *   <li><b>STATELESS sessions</b> — every request is authenticated via a Firebase JWT; no cookies.</li>
 *   <li><b>No HTTP Basic</b> — the Basic Auth auto-config is disabled.</li>
 *   <li><b>CSRF disabled</b> — safe because we are stateless (no session cookie to forge).</li>
 *   <li><b>CORS locked to explicit origins</b> — driven by the {@code CORS_ALLOWED_ORIGINS} env var.</li>
 *   <li><b>FirebaseTokenAuthFilter</b> runs before the standard auth filter.</li>
 *   <li><b>Endpoint rules</b> — public read-only routes are open; all writes require authentication.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final FirebaseTokenAuthFilter firebaseTokenAuthFilter;

    /** Comma-separated list of allowed CORS origins (injected from application.properties). */
    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String allowedOriginsRaw;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // ── Session ────────────────────────────────────────────────
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // ── CORS ────────────────────────────────────────────────────
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            // ── CSRF: disabled for stateless JWT API ────────────────────
            .csrf(AbstractHttpConfigurer::disable)

            // ── HTTP Basic: disabled ────────────────────────────────────
            .httpBasic(AbstractHttpConfigurer::disable)

            // ── Endpoint Authorization Rules ────────────────────────────
            .authorizeHttpRequests(auth -> auth

                // ── Users ──────────────────────────────────────────────
                // POST /api/users is kept permissive for the legacy registration
                // flow, but will be superseded by auto-sync via the Firebase filter.
                .requestMatchers(HttpMethod.POST, "/api/users").permitAll()
                .requestMatchers(HttpMethod.GET,  "/api/users/**").authenticated()

                // ── Clubs ──────────────────────────────────────────────
                // Public: browsing clubs requires no login
                .requestMatchers(HttpMethod.GET, "/api/clubs").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/clubs/search").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/clubs/{clubId}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/clubs/{clubId}/**").permitAll()
                // Protected: all writes require a valid Firebase token
                .requestMatchers(HttpMethod.POST,   "/api/clubs").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/clubs/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/clubs/**").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/clubs/*/follow").authenticated()

                // ── Events ─────────────────────────────────────────────
                // Public: event discovery is open
                .requestMatchers(HttpMethod.GET, "/api/events").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/events/**").permitAll()
                // Protected: create / update / delete
                .requestMatchers(HttpMethod.POST,   "/api/events").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/events/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/events/**").authenticated()

                // ── Bookings ───────────────────────────────────────────
                // Public: anyone can view the attendee list for an event
                .requestMatchers(HttpMethod.GET, "/api/bookings/event/*/attendees").permitAll()
                // NOTE: /api/bookings/** does NOT match the bare /api/bookings path in
                // Spring Security 6 (PathPatternParser), so we list it explicitly.
                .requestMatchers(HttpMethod.POST,   "/api/bookings").authenticated()
                .requestMatchers(HttpMethod.GET,    "/api/bookings/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").authenticated()

                // ── S3 Upload ──────────────────────────────────────────
                .requestMatchers(HttpMethod.POST,   "/api/upload/**").authenticated()
                .requestMatchers(HttpMethod.GET,    "/api/upload/**").authenticated()

                // ── Posts & Feed ───────────────────────────────────────
                // Public: anyone can view a club's feed and comments
                .requestMatchers(HttpMethod.GET, "/api/posts/club/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/posts/*/comments").permitAll()
                // Protected: creating posts, liking, and commenting requires login
                .requestMatchers(HttpMethod.POST,   "/api/posts/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/posts/**").authenticated()

                // ── Fallback: deny everything else ─────────────────────
                .anyRequest().denyAll()
            )

            // ── Firebase filter: runs before the built-in auth filter ──
            .addFilterBefore(firebaseTokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Only the explicitly listed origins (from env var) — never a wildcard
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::strip)
                .filter(s -> !s.isBlank())
                .toList();
        configuration.setAllowedOrigins(origins);

        // Standard HTTP methods for a REST API
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Headers the frontend needs to send
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));

        // Expose standard headers to the browser
        configuration.setExposedHeaders(List.of("Authorization"));

        // Allow credentials (required for Authorization header to be forwarded cross-origin)
        configuration.setAllowCredentials(true);

        // Cache preflight response for 1 hour to reduce OPTIONS noise
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
