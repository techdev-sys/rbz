package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Stage 10 (Commercial Bank only): Basel III Capital Adequacy Return.
 * CAR = (Tier1 + Tier2) / RiskWeightedAssets * 100
 * RBZ minimum CAR: 12%  |  Minimum Tier 1 paid-up capital: USD 30,000,000
 */
@Entity
@Data
public class CapitalAdequacyReturn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Tier 1 Capital (core capital) ---
    private BigDecimal paidUpShareCapital;
    private BigDecimal retainedEarnings;
    private BigDecimal otherReserves;
    private BigDecimal tier1Capital; // sum of above

    // --- Tier 2 Capital (supplementary) ---
    private BigDecimal generalLoanLossProvisions;
    private BigDecimal subordinatedDebt;
    private BigDecimal revaluationReserves;
    private BigDecimal tier2Capital; // sum of above; must be ≤ tier1Capital

    // --- Risk-Weighted Assets ---
    private BigDecimal riskWeightedAssets;
    private BigDecimal offBalanceSheetExposures;

    // --- Computed ratios (stored for audit trail) ---
    private BigDecimal capitalAdequacyRatio; // % — must be ≥ 12% (RBZ min)
    private BigDecimal tier1Ratio;           // % — Tier1 / RWA

    // --- Compliance flags ---
    private Boolean meetsMinimumPaidUpCapital;  // Tier1 ≥ USD 30,000,000
    private Boolean meetsMinimumCAR;            // CAR ≥ 12%
    private Boolean tier2WithinLimit;           // Tier2 ≤ Tier1

    @Column(columnDefinition = "TEXT")
    private String capitalPlanNarrative;

    private String reportingPeriod; // e.g. "Q4 2025"

    private String stageStatus = "PENDING";
}
