package com.example.demo.security;

import com.example.demo.entity.User;
import com.example.demo.service.UserSyncService;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Intercepts every HTTP request and validates the Firebase ID Token present in
 * the {@code Authorization: Bearer <token>} header.
 *
 * <p>Flow:
 * <ol>
 *   <li>If no {@code Authorization} header (or not a Bearer token) — passes through
 *       without setting any authentication. The downstream {@link SecurityFilterChain}
 *       will then reject the request if the endpoint requires authentication.</li>
 *   <li>If a Bearer token is present — verifies it with Firebase, upserts the user
 *       in our database, builds a {@link FirebasePrincipal}, and stores it in the
 *       {@link SecurityContextHolder}.</li>
 *   <li>On verification failure — responds immediately with {@code 401 Unauthorized}.</li>
 * </ol>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FirebaseTokenAuthFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final FirebaseAuth firebaseAuth;
    private final UserSyncService userSyncService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        // DEBUG — log every request so we can diagnose 403s
        log.info(">>> [{} {}] Authorization header: {}",
                request.getMethod(),
                request.getRequestURI(),
                authHeader == null ? "MISSING" : authHeader.startsWith(BEARER_PREFIX) ? "Bearer <present>" : authHeader);

        // No Bearer token — continue without authenticating (public endpoints will pass through)
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String idToken = authHeader.substring(BEARER_PREFIX.length()).strip();

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);

            // Upsert the user in our database (creates on first login)
            User user = userSyncService.syncUser(
                    decodedToken.getUid(),
                    decodedToken.getEmail(),
                    decodedToken.getName()
            );

            FirebasePrincipal principal = new FirebasePrincipal(
                    decodedToken.getUid(),
                    decodedToken.getEmail(),
                    decodedToken.getName(),
                    user.getId()
            );

            var authentication = new UsernamePasswordAuthenticationToken(
                    principal,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (FirebaseAuthException e) {
            log.warn("Firebase token verification failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Invalid or expired token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
