package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class SystemActivityLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String actorRole; // APPLICANT, EXAMINER, SENIOR
    private String actorName;
    private Long companyId;
    private String activityType; // STAGE_COMPLETE, DOC_UPLOAD, DOC_REVIEW, DELEGATION
    private String detail;

    @Column(columnDefinition = "TEXT")
    private String dataSnapshot; // JSON snapshot of the data at that time for learning

    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
