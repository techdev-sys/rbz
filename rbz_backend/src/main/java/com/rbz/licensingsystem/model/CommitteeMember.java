package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Stage 4: Committee Member Tracking
 * Links directors to board committees with role information
 */
@Entity
@Data
public class CommitteeMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long committeeId; // Foreign Key to BoardCommittee
    private Long directorId; // Foreign Key to Director

    private String memberName; // Denormalized for quick access
    private Boolean isChairperson = false;
    private LocalDate dateAppointed;

    // Additional metadata
    private String memberRole; // e.g., "Member", "Secretary"
    private String status = "ACTIVE"; // ACTIVE, INACTIVE
}
