package com.example.demo.service;

import com.example.demo.dto.ClubCreateRequest;
import com.example.demo.dto.ClubResponse;
import com.example.demo.dto.ClubUpdateRequest;
import com.example.demo.entity.Club;
import com.example.demo.entity.ClubFollower;
import com.example.demo.entity.User;
import com.example.demo.exception.AlreadyFollowingException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.ClubFollowerRepository;
import com.example.demo.repository.ClubRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final UserRepository userRepository;
    private final ClubFollowerRepository clubFollowerRepository;

    @CacheEvict(value = "allClubs", allEntries = true)
    @Transactional
    public ClubResponse createClub(Long managerUserId, ClubCreateRequest request) {
        User manager = userRepository.findById(managerUserId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + managerUserId));
        Club club = clubRepository.save(Club.builder()
            .manager(manager)
            .name(request.name())
            .bio(request.bio())
            .profileImageUrl(request.profileImageUrl())
            .category(request.category())
            .city(request.city())
            .latitude(request.latitude())
            .longitude(request.longitude())
            .build());
        return ClubResponse.from(club);
    }

    @Cacheable(value = "singleClub", key = "#clubId")
    @Transactional(readOnly = true)
    public ClubResponse getClub(Long clubId) {
        return clubRepository.findById(clubId)
            .map(ClubResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
    }

    @Transactional(readOnly = true)
    public List<ClubResponse> findClubsByName(String name) {
        return clubRepository.findByNameContainingIgnoreCase(name)
            .stream().map(ClubResponse::from).toList();
    }

    @Cacheable(value = "allClubs")
    @Transactional(readOnly = true)
    public List<ClubResponse> getAllClubs() {
        return clubRepository.findAll().stream().map(ClubResponse::from).collect(java.util.stream.Collectors.toList());
    }

    /**
     * Updates a club. Only the club's manager may perform updates.
     *
     * @param clubId       ID of the club to update.
     * @param request      Fields to update (null fields are ignored).
     * @param callerId     DB user-id of the authenticated caller (from FirebasePrincipal).
     * @throws ResponseStatusException (403) if the caller is not the club's manager.
     */
    @Caching(evict = {
            @CacheEvict(value = "singleClub", key = "#clubId"),
            @CacheEvict(value = "allClubs",   allEntries = true)
    })
    @Transactional
    public ClubResponse updateClub(Long clubId, ClubUpdateRequest request, Long callerId) {
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));

        assertIsManager(club, callerId);

        if (request.name() != null) club.setName(request.name());
        if (request.bio() != null) club.setBio(request.bio());
        if (request.profileImageUrl() != null) club.setProfileImageUrl(request.profileImageUrl());
        if (request.category() != null) club.setCategory(request.category());
        if (request.city() != null) club.setCity(request.city());
        if (request.latitude() != null) club.setLatitude(request.latitude());
        if (request.longitude() != null) club.setLongitude(request.longitude());
        
        return ClubResponse.from(clubRepository.save(club));
    }

    /**
     * Deletes a club. Only the club's manager may delete it.
     *
     * @param clubId   ID of the club to delete.
     * @param callerId DB user-id of the authenticated caller.
     * @throws ResponseStatusException (403) if the caller is not the club's manager.
     */
    @Caching(evict = {
            @CacheEvict(value = "singleClub", key = "#clubId"),
            @CacheEvict(value = "allClubs",   allEntries = true)
    })
    @Transactional
    public void deleteClub(Long clubId, Long callerId) {
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));

        assertIsManager(club, callerId);

        clubRepository.delete(club);
    }

    @Transactional
    public void followClub(Long userId, Long clubId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Club club = clubRepository.findById(clubId)
            .orElseThrow(() -> new ResourceNotFoundException("Club not found: " + clubId));
        if (clubFollowerRepository.existsByUserIdAndClubId(userId, clubId))
            throw new AlreadyFollowingException("User " + userId + " already follows club " + clubId);
        clubFollowerRepository.save(ClubFollower.builder().user(user).club(club).build());
    }

    @Transactional
    public void unfollowClub(Long userId, Long clubId) {
        if (!clubFollowerRepository.existsByUserIdAndClubId(userId, clubId)) {
            throw new ResourceNotFoundException("User " + userId + " is not following club " + clubId);
        }
        clubFollowerRepository.deleteByUserIdAndClubId(userId, clubId);
    }

    @Transactional(readOnly = true)
    public List<com.example.demo.dto.UserSummary> getClubMembers(Long clubId) {
        if (!clubRepository.existsById(clubId)) {
            throw new ResourceNotFoundException("Club not found: " + clubId);
        }
        return clubFollowerRepository.findUsersByClubId(clubId).stream()
                .map(com.example.demo.dto.UserSummary::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClubResponse> getJoinedClubs(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found: " + userId);
        }
        return clubFollowerRepository.findClubsByUserId(userId).stream()
                .map(ClubResponse::from)
                .toList();
    }

    // ── Ownership guard ──────────────────────────────────────────────────────

    private void assertIsManager(Club club, Long callerId) {
        if (!club.getManager().getId().equals(callerId)) {
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You are not the manager of this club"
            );
        }
    }
}
