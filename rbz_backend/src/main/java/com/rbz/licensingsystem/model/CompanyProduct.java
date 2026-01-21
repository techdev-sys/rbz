package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stage 5: Company Product Selection
 * Links companies to products they offer with specific parameters
 */
@Entity
@Data
public class CompanyProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Long productId; // Foreign Key to MicrofinanceProduct

    // For custom "Other" products
    private String customProductName;
    private String customProductDescription;

    // Product offering status
    private Boolean isOffered = true;

    // Product parameters (company-specific)
    private BigDecimal minimumAmount;
    private BigDecimal maximumAmount;
    private String minimumTenure; // e.g., "1 month", "3 months"
    private String maximumTenure; // e.g., "24 months", "36 months"

    // Interest and charges
    private Double interestRatePerMonth;
    private Double interestRatePerAnnum;

    @Column(columnDefinition = "TEXT")
    private String additionalCharges; // Processing fees, late payment fees, etc.

    // Metadata
    private LocalDate dateAdded;
    private String addedBy;
    private LocalDate lastModified;
}
