package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 4: Loan Distribution
 * Maps to Template Section: "Distribution of Loans"
 */
@Entity
@Data
public class LoanDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Long financialPerformanceId; // Links to specific financial period

    // --- Template Source: Distribution of Loans Table ---
    private String purpose; // e.g., "Retail", "Consumption", "Agriculture", etc.
    private Integer numberOfClients;
    private java.math.BigDecimal amount;
    private Double percentageContribution;

    private Integer displayOrder; // For descending order display
}
