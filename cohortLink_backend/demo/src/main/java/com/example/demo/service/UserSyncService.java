package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles automatic user synchronisation when a Firebase token is first verified.
 *
 * <p>On first login the user does not yet exist in our database — this service
 * creates the record transparently. On subsequent requests the existing record
 * is returned as-is (no unnecessary writes).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserSyncService {

    private final UserRepository userRepository;

    /**
     * Finds an existing user by their Firebase UID, or creates a new one.
     *
     * @param uid   Firebase UID (stable, globally unique).
     * @param email User's email from the verified token.
     * @param name  Display name from the token (may be null).
     * @return the persisted {@link User} entity.
     */
    @Transactional
    public User syncUser(String uid, String email, String name) {
        return userRepository.findByFirebaseUid(uid)
                .map(existingUser -> {
                    // Update name if Firebase now has one and it differs from what we stored.
                    // This handles the common case where the name was null on first login
                    // because the user hadn't set their display name yet.
                    if (name != null && !name.equals(existingUser.getName())) {
                        log.info("Updating display name for uid={} → \"{}\"", uid, name);
                        existingUser.setName(name);
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> createUser(uid, email, name));
    }

    // ---------- private helpers ----------

    private User createUser(String uid, String email, String name) {
        log.info("First login — auto-provisioning user for uid={}", uid);
        return userRepository.save(User.builder()
                .firebaseUid(uid)
                .email(email)
                .name(name)
                .build());
    }
}
