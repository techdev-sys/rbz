package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDate;

import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.model.enums.StageStatus;

@Entity
@Data
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Template Source: [29] Name of Institution ---
    @Column(nullable = false)
    private String companyName;

    // --- Template Source: [45] Registration Number ---
    private String registrationNumber;

    // --- Template Source: [58] Date of Incorporation ---
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate incorporationDate;

    // --- Template Source: [33] Head Office Address ---
    @Column(columnDefinition = "TEXT")
    private String physicalAddress;

    // --- Template Source: [35] Bankers ---
    private String bankers;

    // --- Template Source: [37] Lawyers ---
    private String lawyers;

    // --- Template Source: [39] Auditors ---
    private String auditors;

    // --- Template Source: [31] Licence Type (Credit-Only or Deposit-Taking) ---
    private String licenseType;

    // --- Template Source: [41] Chief Executive Officer ---
    private String chiefExecutiveOfficer;

    // --- Template Source: [47] Licence Number ---
    private String licenseNumber;

    // Date the license was granted
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate licenseGrantedDate;

    // --- Template Source: [49] Contact Telephone ---
    private String contactTelephone;

    // --- Template Source: [51] Email Address ---
    private String emailAddress;

    // --- Application Details ---
    private String contactPersonName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate applicationDate;

    // Application Fee
    private java.math.BigDecimal applicationFee; // e.g., US$300

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate applicationFeePaymentDate;

    private String applicationFeeReceiptNumber;

    // Logo
    private String logoPath; // Path to uploaded logo image

    // Report References
    private String outstandingInfoLetterDate; // Date letter was sent (e.g., "11 July 2025")
    private String outstandingInfoSubmissionDate; // Date they replied (e.g., "30 July 2025")

    // Supporting Documentation
    private String lawyersEngagementLetterSubmitted; // YES/NO
    private String auditorsEngagementLetterSubmitted; // YES/NO

    // Status of this stage (e.g., "PENDING", "COMPLETED")
    private String stageStatus = "PENDING";

    // --- Workflow Management ---
    private String applicationStatus = "DRAFT"; // DRAFT, SUBMITTED, ASSIGNED, UNDER_REVIEW, COMPLETED
    private String assignedExaminer; // Name of the examiner assigned by Senior BE
    
    // --- Stage-Gated Workflow Engine ---
    @Enumerated(EnumType.STRING)
    private ApplicationStage workflowStage = ApplicationStage.DOCUMENT_INTAKE;

    @Enumerated(EnumType.STRING)
    private StageStatus workflowStatus = StageStatus.IN_PROGRESS;
}
