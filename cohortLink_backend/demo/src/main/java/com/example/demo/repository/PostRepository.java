package com.example.demo.repository;

import com.example.demo.entity.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface PostRepository extends ListCrudRepository<Post, Long>, PagingAndSortingRepository<Post, Long> {
    @Query("SELECT p FROM Post p JOIN FETCH p.club JOIN FETCH p.author WHERE p.club.id = :clubId AND p.createdAt < :cursor ORDER BY p.createdAt DESC")
    Slice<Post> findClubFeedWithCursor(@Param("clubId") Long clubId, @Param("cursor") LocalDateTime cursor, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN FETCH p.club JOIN FETCH p.author WHERE p.club.id = :clubId ORDER BY p.createdAt DESC")
    Slice<Post> findClubFeed(@Param("clubId") Long clubId, Pageable pageable);
}
