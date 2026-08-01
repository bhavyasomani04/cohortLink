package com.example.demo.repository;

import com.example.demo.entity.Like;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LikeRepository extends ListCrudRepository<Like, Long> {
    Optional<Like> findByPostIdAndUserId(Long postId, Long userId);
    
    void deleteByPostIdAndUserId(Long postId, Long userId);
    
    boolean existsByPostIdAndUserId(Long postId, Long userId);
    
    @Query("SELECT l.post.id FROM Like l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<Long> findLikedPostIdsByUser(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);
}
