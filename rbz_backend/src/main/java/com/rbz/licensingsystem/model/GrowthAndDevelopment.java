package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Stage 8: Growth Strategies and Developmental Value
 * Maps to Template Sections: "GROWTH STRATEGIES" and "DEVELOPMENTAL VALUE"
 */
@Entity
@Data
public class GrowthAndDevelopment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    // --- Template Source: GROWTH STRATEGIES Section ---
    @Column(columnDefinition = "TEXT")
    private String growthStrategies;

    @Column(columnDefinition = "TEXT")
    private String businessExpansionPlans;

    @Column(columnDefinition = "TEXT")
    private String performanceEnhancementStrategies;

    // --- Template Source: DEVELOPMENTAL VALUE Section ---
    @Column(columnDefinition = "TEXT")
    private String economicBenefits;

    @Column(columnDefinition = "TEXT")
    private String communityBenefits;

    @Column(columnDefinition = "TEXT")
    private String developmentalValueSummary;

    private String stageStatus = "PENDING";
}
