package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 7: Compliance and Documentation
 * Maps to Template Section: "COMPLIANCE"
 */
@Entity
@Data
public class ComplianceDocumentation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: COMPLIANCE Section ---

    // Credit Policy and Procedures
    private String hasCreditPolicyManual; // YES/NO
    private String hasOperationalPolicyManual; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String policyManualAssessment;

    // Client Protection Principles
    @Column(columnDefinition = "TEXT")
    private String clientProtectionMeasures; // Table format in report

    private String incorporatesClientProtection; // YES/NO
    private String incorporatesCodeOfConduct; // YES/NO

    // Loan Agreement Template
    private String hasLoanAgreementTemplate; // YES/NO
    private String loanAgreementCompliant; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String loanAgreementAssessment;

    private String disclosesInterestRates; // YES/NO
    private String disclosesOtherCharges; // YES/NO
    private String disclosesRepaymentSchedule; // YES/NO
    private String disclosesPrepaymentTerms; // YES/NO
    private String disclosesDefaultCharges; // YES/NO

    // Tax Compliance
    private String hasTaxClearanceCertificate; // YES/NO
    private String taxClearanceCertificateNumber; // New: Certificate number
    private String taxClearanceExpiryDate;
    private String taxClearanceIssuedDate; // New: Issue date
    private String hasRemittedCorporateTax; // YES/NO
    private java.math.BigDecimal corporateTaxAmountPaid;

    // Organizational Structure
    @Column(columnDefinition = "TEXT")
    private String organizationalChartPath; // New: Path to uploaded org chart image

    @Column(columnDefinition = "TEXT")
    private String organizationalStructureDescription; // New: Text description if no image

    // Banking and Financial Documentation
    @Column(columnDefinition = "TEXT")
    private String bankStatementReferences; // New: References to bank statements uploaded

    private String bankName; // New: Primary bank
    private String bankAccountNumber; // New: Account number
    private java.math.BigDecimal bankBalanceAsPerStatement; // New: Balance from statement

    // MFI Returns Submission
    private String consistentlySubmitsMFIReturns; // YES/NO

    @Column(columnDefinition = "TEXT")
    private String returnsConsistencyNotes;

    @Column(columnDefinition = "TEXT")
    private String discrepanciesWithFinancials;

    // Client Protection Principles - Detailed Tracking (Table 8)
    @Column(columnDefinition = "TEXT")
    private String appropriateProductDesignStrategy; // New: For Table 8

    @Column(columnDefinition = "TEXT")
    private String preventionOfOverIndebtednessStrategy; // New

    @Column(columnDefinition = "TEXT")
    private String transparencyStrategy; // New

    @Column(columnDefinition = "TEXT")
    private String responsiblePricingStrategy; // New

    @Column(columnDefinition = "TEXT")
    private String fairTreatmentStrategy; // New

    @Column(columnDefinition = "TEXT")
    private String privacyOfClientDataStrategy; // New

    @Column(columnDefinition = "TEXT")
    private String complaintResolutionMechanisms; // New

    // Other Compliance Issues
    @Column(columnDefinition = "TEXT")
    private String otherComplianceIssues;

    private String stageStatus = "PENDING";
}
