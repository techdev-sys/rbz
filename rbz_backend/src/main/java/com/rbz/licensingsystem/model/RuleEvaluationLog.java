package com.rbz.licensingsystem.model;

import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.model.enums.RuleResult;
import com.rbz.licensingsystem.model.enums.RuleType;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "rule_results")
public class RuleEvaluationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;

    @Enumerated(EnumType.STRING)
    private ApplicationStage stage;

    private String ruleId;

    @Enumerated(EnumType.STRING)
    private RuleType ruleType;

    @Enumerated(EnumType.STRING)
    private RuleResult result;
    
    // Brief description of why it failed or passed (e.g. from the AI or manual check)
    @Column(length = 2000)
    private String details;

    private boolean overrideAllowed;
    private String overrideReason;

    private String evaluatedBy; // "system" or user ID
    private LocalDateTime evaluatedAt;
    
    @PrePersist
    public void prePersist() {
        if (evaluatedAt == null) {
            evaluatedAt = LocalDateTime.now();
        }
    }
}
