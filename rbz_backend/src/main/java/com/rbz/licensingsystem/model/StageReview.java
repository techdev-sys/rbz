package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class StageReview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Integer stageId; // 1=Profile, 2=Ownership, etc.
    private String stageName;

    private String status; // PENDING, APPROVED, FLAGGED

    @Column(columnDefinition = "TEXT")
    private String examinerComment;

    private String examinerName;

    private LocalDateTime lastUpdated;

    @PrePersist
    protected void onCreate() {
        lastUpdated = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
