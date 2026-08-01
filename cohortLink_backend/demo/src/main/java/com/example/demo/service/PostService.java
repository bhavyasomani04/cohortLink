package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final ClubRepository clubRepository;
    private final UserRepository userRepository;

    @Transactional
    public FeedPostResponse createPost(String firebaseUid, Long clubId, PostCreateRequest request) {
        User author = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found"));

        Post post = Post.builder()
                .author(author)
                .club(club)
                .caption(request.getCaption())
                .build();

        if (request.getImages() != null) {
            List<PostImage> images = request.getImages().stream().map(img -> PostImage.builder()
                    .post(post)
                    .originalImageUrl(img.getOriginalImageUrl())
                    .thumbnailUrl(img.getThumbnailUrl())
                    .aspectRatio(img.getAspectRatio())
                    .sequenceOrder(img.getSequenceOrder())
                    .build()).collect(Collectors.toList());
            post.setImages(images);
        }

        Post savedPost = postRepository.save(post);
        return mapToFeedPostResponse(savedPost, false);
    }

    @Transactional(readOnly = true)
    public Slice<FeedPostResponse> getClubFeed(String firebaseUid, Long clubId, LocalDateTime cursor, int size) {
        User user = null;
        if (firebaseUid != null) {
            user = userRepository.findByFirebaseUid(firebaseUid).orElse(null);
        }

        if (!clubRepository.existsById(clubId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found");
        }

        PageRequest pageRequest = PageRequest.of(0, size);
        Slice<Post> postSlice;
        
        if (cursor != null) {
            postSlice = postRepository.findClubFeedWithCursor(clubId, cursor, pageRequest);
        } else {
            postSlice = postRepository.findClubFeed(clubId, pageRequest);
        }

        List<Long> postIds = postSlice.getContent().stream().map(Post::getId).collect(Collectors.toList());
        
        // Solve N+1 for Likes only if the user is authenticated
        Set<Long> likedPostIds = (user != null)
                ? likeRepository.findLikedPostIdsByUser(user.getId(), postIds).stream().collect(Collectors.toSet())
                : Set.of();

        return postSlice.map(post -> mapToFeedPostResponse(post, likedPostIds.contains(post.getId())));
    }

    @Transactional
    public void likePost(String firebaseUid, Long postId) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

        if (!likeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            Like like = Like.builder().post(post).user(user).build();
            likeRepository.save(like);
            
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
        }
    }

    @Transactional
    public void unlikePost(String firebaseUid, Long postId) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

        if (likeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            likeRepository.deleteByPostIdAndUserId(postId, user.getId());
            
            if (post.getLikeCount() > 0) {
                post.setLikeCount(post.getLikeCount() - 1);
                postRepository.save(post);
            }
        }
    }

    @Transactional
    public CommentResponse commentOnPost(String firebaseUid, Long postId, CommentCreateRequest request) {
        User user = userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .content(request.getContent())
                .build();
        
        Comment savedComment = commentRepository.save(comment);
        
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        
        return CommentResponse.builder()
                .id(savedComment.getId())
                .content(savedComment.getContent())
                .createdAt(savedComment.getCreatedAt())
                .author(new UserSummary(user.getId(), user.getEmail(), user.getName()))
                .build();
    }

    @Transactional(readOnly = true)
    public Slice<CommentResponse> getPostComments(Long postId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Slice<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageRequest);
        
        return comments.map(comment -> CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .author(new UserSummary(comment.getUser().getId(), comment.getUser().getEmail(), comment.getUser().getName()))
                .build());
    }

    /**
     * Creates an automated announcement post for a club when a new event is created.
     * This is a no-op if imageUrl is null or blank — no image means no post.
     *
     * @param club     the club to post under
     * @param author   the club manager (event creator)
     * @param caption  the event title, used as the post caption
     * @param imageUrl the event image URL; if null or blank, the method returns immediately
     */
    @Transactional
    public void createEventAnnouncementPost(Club club, User author, String caption, String imageUrl) {
        // Guard: no image = no post
        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        Post post = Post.builder()
                .author(author)
                .club(club)
                .caption(caption)
                .build();

        PostImage image = PostImage.builder()
                .post(post)
                .originalImageUrl(imageUrl)
                .thumbnailUrl(imageUrl)  // reuse as thumbnail
                .aspectRatio(1.0)        // default square ratio
                .sequenceOrder(1)
                .build();
        post.setImages(List.of(image));

        postRepository.save(post);
    }

    private FeedPostResponse mapToFeedPostResponse(Post post, boolean hasLiked) {
        return FeedPostResponse.builder()
                .id(post.getId())
                .caption(post.getCaption())
                .createdAt(post.getCreatedAt())
                .likeCount(post.getLikeCount())
                .commentCount(post.getCommentCount())
                .hasLiked(hasLiked)
                .author(new UserSummary(post.getAuthor().getId(), post.getAuthor().getEmail(), post.getAuthor().getName()))
                .club(new FeedPostResponse.ClubSummary(post.getClub().getId(), post.getClub().getName(), post.getClub().getProfileImageUrl()))
                .images(post.getImages().stream().map(img -> FeedPostResponse.ImageResponse.builder()
                        .originalImageUrl(img.getOriginalImageUrl())
                        .thumbnailUrl(img.getThumbnailUrl())
                        .aspectRatio(img.getAspectRatio())
                        .sequenceOrder(img.getSequenceOrder())
                        .build()).collect(Collectors.toList()))
                .build();
    }
}
