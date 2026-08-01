package com.example.demo.controller;

import com.example.demo.dto.ClubCreateRequest;
import com.example.demo.dto.ClubResponse;
import com.example.demo.dto.ClubUpdateRequest;
import com.example.demo.security.FirebasePrincipal;
import com.example.demo.service.ClubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value = "/api/clubs", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    /**
     * Creates a club. The authenticated caller automatically becomes the manager.
     * {@code managerUserId} is no longer a query parameter — it is derived from
     * the verified Firebase token to prevent IDOR.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ClubResponse createClub(@Valid @RequestBody ClubCreateRequest request,
                                   @AuthenticationPrincipal FirebasePrincipal principal) {
        return clubService.createClub(principal.dbUserId(), request);
    }

    @GetMapping
    public List<ClubResponse> getAllClubs() {
        return clubService.getAllClubs();
    }

    @GetMapping("/search")
    public List<ClubResponse> searchClubsByName(@RequestParam String name) {
        return clubService.findClubsByName(name);
    }

    @GetMapping("/{clubId}")
    public ClubResponse getClub(@PathVariable Long clubId) {
        return clubService.getClub(clubId);
    }

    /**
     * Updates a club. Ownership is enforced in the service layer — only the
     * club's manager may update it.
     */
    @PutMapping(value = "/{clubId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ClubResponse updateClub(@PathVariable Long clubId,
                                   @Valid @RequestBody ClubUpdateRequest request,
                                   @AuthenticationPrincipal FirebasePrincipal principal) {
        return clubService.updateClub(clubId, request, principal.dbUserId());
    }

    /**
     * Deletes a club. Only the club's manager may delete it.
     */
    @DeleteMapping("/{clubId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteClub(@PathVariable Long clubId,
                           @AuthenticationPrincipal FirebasePrincipal principal) {
        clubService.deleteClub(clubId, principal.dbUserId());
    }

    /**
     * Follows a club. The authenticated caller follows — {@code userId} query
     * param removed to prevent IDOR.
     */
    @PostMapping("/{clubId}/follow")
    @ResponseStatus(HttpStatus.CREATED)
    public void followClub(@PathVariable Long clubId,
                           @AuthenticationPrincipal FirebasePrincipal principal) {
        clubService.followClub(principal.dbUserId(), clubId);
    }

    /**
     * Unfollows a club. The authenticated caller unfollows — {@code userId} query
     * param is derived from the token to prevent IDOR.
     */
    @DeleteMapping("/{clubId}/follow")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollowClub(@PathVariable Long clubId,
                             @AuthenticationPrincipal FirebasePrincipal principal) {
        clubService.unfollowClub(principal.dbUserId(), clubId);
    }

    @GetMapping("/{clubId}/members")
    public List<com.example.demo.dto.UserSummary> getClubMembers(@PathVariable Long clubId) {
        return clubService.getClubMembers(clubId);
    }

    /**
     * Returns all clubs that a specific user has joined (followed).
     */
    @GetMapping("/user/{userId}/joined")
    public List<ClubResponse> getJoinedClubs(@PathVariable Long userId) {
        return clubService.getJoinedClubs(userId);
    }
}
