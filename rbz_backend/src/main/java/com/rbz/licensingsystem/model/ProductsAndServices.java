package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

/**
 * Stage 5: Products and Services
 * Maps to Template Section: "Products/activities"
 */
@Entity
@Data
public class ProductsAndServices {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: Products/activities Section ---
    @Column(columnDefinition = "TEXT")
    private String targetMarketDescription;

    @Column(columnDefinition = "TEXT")
    private String productsAndServicesDescription;

    // Loan parameters
    private BigDecimal minimumLoanSize;
    private BigDecimal maximumLoanSize;
    private String minimumTenure; // e.g., "1 month"
    private String maximumTenure; // e.g., "24 months"

    // --- Template Source: Charges Section ---
    private Double interestRatePerMonth;

    @Column(columnDefinition = "TEXT")
    private String allChargesBreakdown; // All charges with frequency

    @Column(columnDefinition = "TEXT")
    private String chargesJustification;

    private String stageStatus = "PENDING";

    // --- Stage 5: Product Selection Integration (New) ---
    private Boolean productSelectionComplete = false;
    private Integer numberOfProductsOffered = 0;
}
