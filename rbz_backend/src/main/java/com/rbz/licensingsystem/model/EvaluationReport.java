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

    // Final Approval (Level 3 — Registrar; all institution types)
    private String finalApprovalStatus; // APPROVED / NOT_APPROVED / PENDING
    private String approvedBy;
    private String approvedByDesignation;
    private LocalDateTime approvalDate;

    @Column(columnDefinition = "TEXT")
    private String approvalComments;

    // Level 4 — Director sign-off (DTMFI + Commercial Bank)
    private String directorSignedBy;
    private String directorSignedByDesignation;
    private LocalDateTime directorSignedDate;
    @Column(columnDefinition = "TEXT")
    private String directorComments;

    // Level 5 — Governor / Deputy Governor sign-off (Commercial Bank only)
    private String governorSignedBy;
    private String governorSignedByDesignation;
    private LocalDateTime governorSignedDate;
    @Column(columnDefinition = "TEXT")
    private String governorComments;

    // Institution-aware approval chain metadata
    private Integer approvalLevelsRequired; // 3=MFI, 4=DTMFI, 5=Bank — set on report generation
    private Integer currentApprovalLevel;   // 0=DRAFT,1=SUBMITTED,2=REVIEWED,3=RECOMMENDED,4=DIRECTOR,5=GOVERNOR

    // Generated Report Document
    @Column(columnDefinition = "TEXT")
    private String generatedReportHTML;

    private String reportPDFPath;

    private String workflowStatus = "DRAFT"; // DRAFT, SUBMITTED, UNDER_REVIEW, PENDING_APPROVAL, PENDING_DIRECTOR, PENDING_GOVERNOR, APPROVED, REJECTED
}
