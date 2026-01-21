package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 6: Financial Assumptions for Projections
 * Maps to Template Section: "Assumptions and Financial Projections"
 */
@Entity
@Data
public class FinancialAssumptions {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Integer projectionYear;

    // --- Template Source: Assumptions Table ---
    private Double inflationRate;
    private Double lendingRate;
    private Double gdpGrowthRate;
    private Double loanLossProvisionRate;
    private Double expectedLoanGrowthRate;
    private Double expectedClientGrowthRate;

    @Column(columnDefinition = "TEXT")
    private String otherAssumptions;

    // Reasonableness assessment
    @Column(columnDefinition = "TEXT")
    private String comparisonWithPolicyPronouncements;

    @Column(columnDefinition = "TEXT")
    private String justificationForVariations;
}
