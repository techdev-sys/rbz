package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Economic Assumptions (Table 5 in Report)
 * Stores macroeconomic assumptions used for financial projections
 */
@Entity
@Data
@Table(name = "economic_assumptions")
public class EconomicAssumption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Integer year;

    // Economic Indicators
    private BigDecimal inflationRate; // Year-on-year inflation rate
    private BigDecimal gdpGrowthRate; // GDP growth rate projection
    private BigDecimal lendingRate; // Average lending rate in economy
    private BigDecimal exchangeRate; // USD to ZiG exchange rate if applicable

    @Column(columnDefinition = "TEXT")
    private String assumptionsNotes; // Additional notes on assumptions

    @Column(columnDefinition = "TEXT")
    private String sourceOfAssumptions; // e.g., "Government forecasts", "RBZ projections"

    private String comparisonWithGovernmentForecasts; // Alignment assessment
}
