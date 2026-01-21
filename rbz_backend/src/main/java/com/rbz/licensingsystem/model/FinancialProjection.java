package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 6: Financial Projections (2-Year Projections)
 * Maps to Template Section: "Financial Projections Table"
 */
@Entity
@Data
@Table(name = "financial_projections")
public class FinancialProjection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Integer year; // 2025, 2026, etc.

    // Income & Expenses
    private Double totalIncome;
    private Double totalExpenses;
    private Double tax;
    private Double netIncome;

    // Assets & Liabilities
    private Double totalAssets;
    private Double totalLoans;
    private Double currentLiabilities;
    private Double totalEquity;

    // Ratios (calculated or entered)
    private Double costIncomeRatio;
    private Double returnOnAssets;
    private Double returnOnEquity;

    // Metadata
    @Column(columnDefinition = "TEXT")
    private String notes;
}
