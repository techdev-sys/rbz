package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class Examiner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String employeeId; // e.g. EX-2026-001

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // BCrypt hashed

    @Column(nullable = false)
    private String role = "EXAMINER"; // EXAMINER or SENIOR_EXAMINER

    private String designation; // e.g. "Principal Examiner", "Senior Examiner", "Analyst"

    private String status = "ACTIVE"; // ACTIVE, ON_LEAVE, INACTIVE

    private String email;

    private LocalDateTime createdAt;

    private String createdBy;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
