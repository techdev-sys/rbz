package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage: IT & Cyber Risk (Commercial Bank only).
 * RBZ Guideline on IT Risk Management — banks must demonstrate robust cyber governance.
 */
@Entity
@Data
public class ITCyberRisk {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // IT Governance
    private Boolean hasITPolicy;                       // Board-approved IT policy
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate itPolicyApprovedDate;
    private String itGovernanceModel;                  // e.g. COBIT, ISO 27001

    // Cyber Security
    private Boolean hasCyberIncidentResponsePlan;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate cyberResponsePlanDate;
    private Boolean hasDataProtectionPolicy;           // GDPR-equivalent / Zimbabwe Data Protection Act

    // Disaster Recovery & Business Continuity
    private Boolean hasDisasterRecoveryPlan;
    private String drTestingFrequency;                 // MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastDrTestDate;
    private Boolean hasBusinessContinuityPlan;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate bcpLastReviewDate;

    // Core Banking System
    private String coreBankingSystemVendor;            // e.g. Temenos T24, Finacle, etc.
    private Boolean cloudStorageUsed;
    private Boolean dataResidencyZimbabwe;             // Is data stored on Zimbabwe-based servers?
    private String primaryDataCentreLocation;

    // Penetration Testing
    @com.fasterxml.jackson.annotation.JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastPenetrationTestDate;
    private String penetrationTestingFirm;
    private String penTestOutcome;                     // PASS, PASS_WITH_FINDINGS, FAIL

    // Cyber Insurance
    private Boolean hasCyberInsurance;
    private BigDecimal cyberInsuranceCoverageUsd;

    @Column(columnDefinition = "TEXT")
    private String itGovernanceNarrative;

    private String stageStatus = "PENDING";
}
