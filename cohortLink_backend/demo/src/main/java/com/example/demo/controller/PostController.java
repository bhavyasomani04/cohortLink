package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.security.FirebasePrincipal;
import com.example.demo.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Slice;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping(value = "/api/posts", produces = MediaType.APPLICATION_JSON_VALUE)
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FeedPostResponse createPost(@RequestParam Long clubId,
                                       @RequestBody PostCreateRequest request,
                                       @AuthenticationPrincipal FirebasePrincipal principal) {
        return postService.createPost(principal.uid(), clubId, request);
    }

    @GetMapping("/club/{clubId}")
    public Slice<FeedPostResponse> getClubFeed(
            @PathVariable Long clubId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursor,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal FirebasePrincipal principal) {
        String uid = (principal != null) ? principal.uid() : null;
        return postService.getClubFeed(uid, clubId, cursor, size);
    }

    @PostMapping("/{postId}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void likePost(@PathVariable Long postId,
                         @AuthenticationPrincipal FirebasePrincipal principal) {
        postService.likePost(principal.uid(), postId);
    }

    @DeleteMapping("/{postId}/like")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlikePost(@PathVariable Long postId,
                           @AuthenticationPrincipal FirebasePrincipal principal) {
        postService.unlikePost(principal.uid(), postId);
    }

    @PostMapping(value = "/{postId}/comments", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CommentResponse addComment(@PathVariable Long postId,
                                      @RequestBody CommentCreateRequest request,
                                      @AuthenticationPrincipal FirebasePrincipal principal) {
        return postService.commentOnPost(principal.uid(), postId, request);
    }

    @GetMapping("/{postId}/comments")
    public Slice<CommentResponse> getComments(@PathVariable Long postId,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return postService.getPostComments(postId, page, size);
    }
}
