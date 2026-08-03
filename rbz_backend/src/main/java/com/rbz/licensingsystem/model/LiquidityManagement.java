package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Stage: Liquidity Management (Commercial Bank only — Basel III).
 * Captures LCR (Liquidity Coverage Ratio) and NSFR (Net Stable Funding Ratio).
 * RBZ minimum: LCR ≥ 100%, NSFR ≥ 100%.
 */
@Entity
@Data
public class LiquidityManagement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private String reportingPeriod; // e.g. "Q4 2025"

    // --- LCR (Liquidity Coverage Ratio) ---
    // LCR = HQLA / Total Net Cash Outflows (30-day stress) ≥ 100%
    private BigDecimal hqlaLevel1;                     // Level 1 HQLA (cash, gov bonds — 0% haircut)
    private BigDecimal hqlaLevel2A;                    // Level 2A (e.g. agency bonds — 15% haircut)
    private BigDecimal hqlaLevel2B;                    // Level 2B (corporate bonds — 50% haircut)
    private BigDecimal totalHqla;                      // Computed: L1 + 0.85*L2A + 0.5*L2B
    private BigDecimal totalNetCashOutflows30Days;     // Stressed outflows over 30 days
    private BigDecimal liquidityCoverageRatio;          // LCR % — must be ≥ 100%

    // --- NSFR (Net Stable Funding Ratio) ---
    // NSFR = Available Stable Funding / Required Stable Funding ≥ 100%
    private BigDecimal availableStableFunding;         // Long-term liabilities + equity
    private BigDecimal requiredStableFunding;          // Illiquid assets needing stable funding
    private BigDecimal netStableFundingRatio;           // NSFR % — must be ≥ 100%

    // --- Traditional liquidity ratio ---
    private BigDecimal liquidAssets;                   // Cash + near-cash (USD)
    private BigDecimal totalDeposits;
    private BigDecimal liquidityRatio;                  // liquidAssets / totalDeposits * 100; ≥ 25% recommended

    // --- Stress testing ---
    private Boolean hasStressTestingFramework;
    private String stressTestFrequency;                // MONTHLY, QUARTERLY, ANNUAL
    @Column(columnDefinition = "TEXT")
    private String liquidityContingencyPlan;           // How the bank manages a liquidity crisis

    @Column(columnDefinition = "TEXT")
    private String liquidityRiskNarrative;

    private String stageStatus = "PENDING";
}
