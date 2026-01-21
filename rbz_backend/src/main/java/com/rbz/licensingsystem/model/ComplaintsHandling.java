package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 7: Complaints Handling
 * Maps to Template Section: "COMPLAINTS HANDLING"
 */
@Entity
@Data
public class ComplaintsHandling {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: COMPLAINTS HANDLING Section ---
    private String hasComplaintsProcedureManual; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String complaintsProcedureAssessment;

    @Column(columnDefinition = "TEXT")
    private String complaintsProcessOutline;

    // Complaints received by institution from clients
    private Integer numberOfComplaintsFromClients;

    @Column(columnDefinition = "TEXT")
    private String complaintsFromClientsDetails;

    // Complaints received by RBZ against institution
    private Integer numberOfComplaintsToRBZ;

    @Column(columnDefinition = "TEXT")
    private String complaintsToRBZDetails;

    private String stageStatus = "PENDING";
}
