package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage 4: Financial Performance (Past & Projected)
 * Maps to Template Sections: "Past Financial Performance" and "Financial
 * Projections"
 */
@Entity
@Data
public class FinancialPerformance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // Period identification
    private String periodType; // "ACTUAL" or "PROJECTED"
    private Integer financialYear;
    private LocalDate periodStartDate;
    private LocalDate periodEndDate;
    private String audited; // "YES"/"NO"

    // --- Template Source: Key Performance Indicators Table ---
    private BigDecimal totalIncome;
    private BigDecimal totalCost;
    private BigDecimal tax;
    private BigDecimal profitAfterTax;
    private BigDecimal totalEquity;
    private BigDecimal shareholdersLoans;

    @Column(columnDefinition = "TEXT")
    private String shareholdersLoansDetails; // Terms and conditions

    private BigDecimal bankLoans;
    private BigDecimal foreignLinesOfCredit;

    @Column(columnDefinition = "TEXT")
    private String foreignLoansDetails; // Provider details, exchange control approval

    private BigDecimal otherLiabilities;

    @Column(columnDefinition = "TEXT")
    private String otherLiabilitiesExplanation;

    private BigDecimal totalAssets;

    // Calculated Ratios
    private Double parRatio; // Portfolio at Risk
    private Double costIncomeRatio;
    private Double returnOnEquity;
    private Double returnOnAssets;

    // For PAR > 10%, request remedial strategies
    @Column(columnDefinition = "TEXT")
    private String parRatioRemedialStrategies;

    private String stageStatus = "PENDING";
}
