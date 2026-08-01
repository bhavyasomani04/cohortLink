package com.example.demo.repository;

import com.example.demo.entity.Club;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByNameContainingIgnoreCase(String name);
}
