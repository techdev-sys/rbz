package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 2 Enhancement: Board Committees
 * Maps to Template Section: "Board Committees"
 */
@Entity
@Data
public class BoardCommittee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: Board Committees Section ---
    private String committeeName; // e.g., "Board Audit Committee", "Credit Committee"

    @Column(columnDefinition = "TEXT")
    private String committeeComposition; // List of members

    @Column(columnDefinition = "TEXT")
    private String termsOfReference;

    private String allMembersNonExecutive; // YES/NO (for Audit Committee)
    private String properlyConstituted; // YES/NO
    private String termsOfReferenceAdequate; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String assessmentComments;

    // --- Stage 4: Chairperson and Documents (New) ---
    private Long chairpersonId; // Foreign Key to Director
    private String chairpersonName; // Denormalized for quick access
    private String termsOfReferenceDocumentPath; // Path to uploaded TOR document
    private java.time.LocalDate torUploadDate;
    private java.time.LocalDate committeeFormedDate;
}
