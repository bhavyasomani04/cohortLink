package com.example.demo.repository;

import com.example.demo.entity.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends ListCrudRepository<Comment, Long>, PagingAndSortingRepository<Comment, Long> {
    
    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ORDER BY c.createdAt DESC")
    Slice<Comment> findByPostIdOrderByCreatedAtDesc(@Param("postId") Long postId, Pageable pageable);
}
