package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 5: Predefined Product Catalog
 * Comprehensive list of all microfinance products available for credit-only
 * MFIs
 */
@Entity
@Data
public class MicrofinanceProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Product categorization
    private String productCategory; // "LOAN", "BILL_DISCOUNTING", "LEASE_FINANCE", "OTHER"
    private String productName; // e.g., "Personal Loan", "Business Loan"
    private String productType; // "SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"

    @Column(columnDefinition = "TEXT")
    private String description;

    // Product status
    private Boolean isActive = true;
    private Boolean isPredefined = true; // true for catalog items, false for custom

    // Default parameters (optional, can be overridden by company)
    private String defaultMinTenure;
    private String defaultMaxTenure;

    // Display order in catalog
    private Integer displayOrder = 0;
}
