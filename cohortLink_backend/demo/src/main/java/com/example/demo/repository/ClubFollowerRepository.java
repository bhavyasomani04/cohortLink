package com.example.demo.repository;

import com.example.demo.entity.ClubFollower;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.example.demo.entity.Club;
import com.example.demo.entity.User;
import java.util.List;

public interface ClubFollowerRepository extends JpaRepository<ClubFollower, Long> {
    boolean existsByUserIdAndClubId(Long userId, Long clubId);
    
    void deleteByUserIdAndClubId(Long userId, Long clubId);

    @Query("SELECT cf.user FROM ClubFollower cf WHERE cf.club.id = :clubId")
    List<User> findUsersByClubId(@Param("clubId") Long clubId);

    @Query("SELECT cf.club FROM ClubFollower cf WHERE cf.user.id = :userId")
    List<Club> findClubsByUserId(@Param("userId") Long userId);
}
