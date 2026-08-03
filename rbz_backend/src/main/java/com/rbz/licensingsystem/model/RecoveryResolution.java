package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage: Recovery & Resolution Plan (Commercial Bank only).
 * Aligns with FSB/RBZ requirements for Systemically Important Financial Institutions (SIFIs).
 * Banks must demonstrate they can recover from distress without requiring a taxpayer bailout.
 */
@Entity
@Data
public class RecoveryResolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // Recovery Plan
    private Boolean hasRecoveryPlan;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate recoveryPlanBoardApprovalDate;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate recoveryPlanLastReviewDate;

    // Recovery triggers
    @Column(columnDefinition = "TEXT")
    private String capitalTriggers;                    // e.g. CAR drops below 8% → recovery action
    @Column(columnDefinition = "TEXT")
    private String liquidityTriggers;                  // e.g. LCR drops below 80%
    @Column(columnDefinition = "TEXT")
    private String profitabilityTriggers;

    // Recovery options
    @Column(columnDefinition = "TEXT")
    private String recapitalisationOptions;            // Rights issue, subordinated debt, etc.
    @Column(columnDefinition = "TEXT")
    private String assetDisposalOptions;               // Non-core asset sales
    @Column(columnDefinition = "TEXT")
    private String businessRestructuringOptions;

    // Crisis Management
    private Boolean hasCrisisManagementFramework;
    @Column(columnDefinition = "TEXT")
    private String crisisManagementTeamComposition;
    @Column(columnDefinition = "TEXT")
    private String communicationPlan;                  // Regulator, depositor, public comms

    // Cross-border & Systemic Risk
    private BigDecimal crossBorderExposureUsd;         // Exposure to foreign counterparties
    private Boolean hasSignificantForeignSubsidiaries;
    @Column(columnDefinition = "TEXT")
    private String systemicRiskAssessment;             // Is the bank systemically important?

    // Resolution Authority
    private Boolean resolutionAuthorityNotified;       // RBZ notified of recovery plan
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate notificationDate;

    private String stageStatus = "PENDING";
}
