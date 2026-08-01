package com.example.demo.dto;

import com.example.demo.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for User summary.
 * Converted to a Lombok @Data class so Jackson can deserialize it from Redis cache.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {
    private Long id;
    private String email;
    private String name;

    public static UserSummary from(User user) {
        return new UserSummary(user.getId(), user.getEmail(), user.getName());
    }
}
