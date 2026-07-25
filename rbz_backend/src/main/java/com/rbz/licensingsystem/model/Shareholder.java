package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import com.rbz.licensingsystem.config.PiiEncryptionConverter;

@Entity
@Data
public class Shareholder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Linked to the Company from Stage 1
    private Long companyId;

    // --- Template Source: [71] Shareholder's Name ---
    private String fullName;

    // --- Template Source: [71] Number of shares ---
    private Integer numberOfShares;

    // --- Template Source: [71] Ownership (%) ---
    private Double ownershipPercentage;

    // --- Template Source: [71] Amount Paid ($) ---
    private BigDecimal amountPaid;

    // --- Template Source: [71] Networth (Only for new applications) ---
    @Column(name = "verified_net_worth_status")
    private String netWorthStatus;

    // Changes in shareholding tracking
    private String isNewShareholder; // YES/NO
    private String vettingStatus; // PENDING, APPROVED, REJECTED
    private java.time.LocalDate vettingDate;
    private String shareholdingChangeDate;

    // For corporate shareholders
    private String isCorporateShareholder; // YES/NO

    @Convert(converter = PiiEncryptionConverter.class)
    @Column(columnDefinition = "TEXT")
    private String beneficialOwners; // Details of ultimate beneficial owners

    // For foreign shareholders
    private String isForeignShareholder; // YES/NO
    private String hasExchangeControlApproval; // YES/NO
    private String hasZimbabweInvestmentAuthorityCertificate; // YES/NO

    // Documentation tracking
    @Column(columnDefinition = "TEXT")
    private String documentationSubmitted; // List of submitted documents

    private String shareTransferCertificateSubmitted; // YES/NO
    private String saleAgreementSubmitted; // YES/NO
    private String boardResolutionSubmitted; // YES/NO
    private String proofOfPaymentSubmitted; // YES/NO
    private String affidavitSubmitted; // YES/NO - New: For UBO/AML declaration
    private String capitalContributionConfirmationSubmitted; // YES/NO - New: For capital contribution confirmation

    // --- Stage 2: Ownership Documents (New) ---
    private Boolean shareholdingTableManuallyEntered = false; // Track if manually entered vs AI-extracted

    // Document paths for Stage 2 uploads
    private String applicationFormPath;
    private String applicationLetterPath;
    private String applicationFeeReceiptPath;
    private String netWorthStatementPath;
    private String boardResolutionPath; // For par value confirmation
    private String shareholderAffidavitPath; // UBO declarations
    private String capitalContributionConfirmationPath;

    // Additional ownership fields
    private BigDecimal parValuePerShare;
    private BigDecimal totalIssuedShareCapital;

    @Convert(converter = PiiEncryptionConverter.class)
    @Column(columnDefinition = "TEXT")
    private String ultimateBeneficialOwners; // Structured JSON for UBO details

    private String amlCftCompliant; // YES/NO - from affidavit
    private String unSanctionsListScreened; // YES/NO
    private java.time.LocalDate screeningDate;
}
