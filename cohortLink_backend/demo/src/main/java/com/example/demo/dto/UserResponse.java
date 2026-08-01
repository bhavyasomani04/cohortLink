package com.example.demo.dto;

import com.example.demo.entity.User;

import java.time.LocalDateTime;

public record UserResponse(Long id, String firebaseUid, String email, String name, LocalDateTime createdAt) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getFirebaseUid(),
            user.getEmail(),
            user.getName(),
            user.getCreatedAt()
        );
    }
}
