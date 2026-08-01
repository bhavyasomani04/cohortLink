package com.example.demo.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

/**
 * Utility class for retrieving the authenticated {@link FirebasePrincipal}
 * from the current thread's {@link SecurityContextHolder}.
 *
 * <p>Use this in controllers to obtain the caller's identity without
 * relying on caller-supplied IDs in the request body or query params.
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the {@link FirebasePrincipal} of the currently authenticated user.
     *
     * @throws ResponseStatusException (403 Forbidden) if no authentication is present.
     */
    public static FirebasePrincipal currentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof FirebasePrincipal principal)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authenticated");
        }
        return principal;
    }
}
