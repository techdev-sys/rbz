package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Stage 9: MFI Evaluation Report & Approval Workflow
 * Maps to Template Section: Final Report and Approval Chain
 */
@Entity
@Data
public class EvaluationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // Report metadata
    private String applicationType; // "NEW" or "RENEWAL"
    private LocalDateTime reportGeneratedDate;
    private String reportGeneratedBy;

    // Recommendation
    @Column(columnDefinition = "TEXT")
    private String recommendation; // APPROVE / REJECT / APPROVE_WITH_CONDITIONS

    @Column(columnDefinition = "TEXT")
    private String recommendationConditions;

    @Column(columnDefinition = "TEXT")
    private String recommendationJustification;

    // Approval Workflow
    private String preparedBy;
    private String preparedByDesignation;
    private LocalDateTime preparedDate;

    private String reviewedBy;
    private String reviewedByDesignation;
    private LocalDateTime reviewedDate;

    private String recommendedBy;
    private String recommendedByDesignation;
    private LocalDateTime recommendedDate;

    // Final Approval
    private String finalApprovalStatus; // APPROVED / NOT_APPROVED / PENDING
    private String approvedBy; // Registrar name
    private LocalDateTime approvalDate;

    @Column(columnDefinition = "TEXT")
    private String approvalComments;

    // Generated Report Document
    @Lob
    @Column(columnDefinition = "TEXT")
    private String generatedReportHTML; // Full HTML report

    private String reportPDFPath; // Path to generated PDF

    private String workflowStatus = "DRAFT"; // DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED
}
