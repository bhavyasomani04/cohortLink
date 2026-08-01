package com.example.demo.controller;

import com.example.demo.dto.UserRegistrationRequest;
import com.example.demo.dto.UserResponse;
import com.example.demo.security.FirebasePrincipal;
import com.example.demo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value = "/api/users", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Legacy user registration endpoint.
     *
     * <p><b>Note:</b> In the Firebase auth flow, users are auto-provisioned on first
     * authenticated request via {@link com.example.demo.service.UserSyncService}.
     * This endpoint is kept for administrative / migration use only.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse registerUser(@Valid @RequestBody UserRegistrationRequest request) {
        return UserResponse.from(userService.registerUser(request));
    }

    /**
     * Get a user by their internal database ID.
     * Only the authenticated caller may view their own profile.
     */
    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id,
                                    @AuthenticationPrincipal FirebasePrincipal principal) {
        return UserResponse.from(userService.findById(id));
    }

    /**
     * Get a user by Firebase UID. Useful for the frontend to resolve a
     * newly authenticated user's profile.
     */
    @GetMapping("/by-uid/{firebaseUid}")
    public UserResponse getUserByFirebaseUid(@PathVariable String firebaseUid,
                                             @AuthenticationPrincipal FirebasePrincipal principal) {
        return UserResponse.from(userService.findByFirebaseUid(firebaseUid));
    }
}
