package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage 4: Capital Structure
 * Maps to Template Section: "CAPITAL STRUCTURE"
 */
@Entity
@Data
public class CapitalStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: Capital Structure Table ---
    private Integer numberOfAuthorisedShares;
    private Integer totalIssuedShares;
    private BigDecimal parValuePerShare;
    private BigDecimal issuedShareCapitalAtParValue;
    private BigDecimal sharePremium;
    private BigDecimal totalIssuedAndPaidUpCapital;

    // Retained Earnings
    private BigDecimal retainedEarningsCurrentYear;
    private BigDecimal retainedEarningsPriorYears;
    private BigDecimal totalShareholdersEquity;

    // Additional capital information
    private LocalDate capitalStructureDate;
    private String meetsMinimumCapitalRequirement; // YES/NO

    // Additional capital injections tracking
    @Column(columnDefinition = "TEXT")
    private String capitalInjectionsDetails;

    @Column(columnDefinition = "TEXT")
    private String sourceOfCapitalDocumentation;

    // Document Submission Verification
    private String shareholdersResolutionSubmitted; // YES/NO - Confirming price per share
    private String boardResolutionSubmitted; // YES/NO - Confirming allotment/price

    // For donated equity tracking
    private BigDecimal donatedEquity;

    @Column(columnDefinition = "TEXT")
    private String donorDetails;

    private String stageStatus = "PENDING";
}
