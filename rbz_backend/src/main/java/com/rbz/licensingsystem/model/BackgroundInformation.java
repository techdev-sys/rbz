package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Stage 1 Enhancement: Background Information
 * Maps to Template Section: "BACKGROUND"
 */
@Entity
@Data
public class BackgroundInformation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: BACKGROUND Section ---
    private LocalDate companyRegistrationDate;
    private LocalDate mfiRegistrationDate; // As credit-only MFI

    @Column(columnDefinition = "TEXT")
    private String nameChangesHistory;

    private LocalDate initialLicenceGrantDate;
    private LocalDate currentLicenceExpiryDate;

    // Branch information
    private Integer numberOfBranches;

    @Column(columnDefinition = "TEXT")
    private String branchAddresses; // Annex for branch addresses

    // If licence expired
    private String hasLicenceExpired; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String reasonsForLicenceDelay;

    @Column(columnDefinition = "TEXT")
    private String chronologyOfEvents;

    private String stageStatus = "PENDING";
}
