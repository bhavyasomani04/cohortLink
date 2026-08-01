package com.example.demo.service;

import com.example.demo.dto.UserRegistrationRequest;
import com.example.demo.entity.User;
import com.example.demo.exception.EmailAlreadyExistsException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User registerUser(UserRegistrationRequest request) {
        return userRepository.findByEmail(request.email())
                .map(existingUser -> {
                    if (request.name() != null && !request.name().equals(existingUser.getName())) {
                        existingUser.setName(request.name());
                        return userRepository.save(existingUser);
                    }
                    return existingUser;
                })
                .orElseGet(() -> userRepository.save(User.builder()
                        .firebaseUid(request.firebaseUid())
                        .email(request.email())
                        .name(request.name())
                        .build()));
    }

    @Transactional(readOnly = true)
    public User findByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + uid));
    }

    @Transactional(readOnly = true)
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
}
