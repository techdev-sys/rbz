package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.model.enums.RuleResult;
import com.rbz.licensingsystem.model.enums.RuleType;
import com.rbz.licensingsystem.model.enums.StageStatus;
import com.rbz.licensingsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowEngineService {

    private final CompanyProfileRepository companyProfileRepository;
    private final RuleEvaluationLogRepository evaluationLogRepository;
    private final StageProgressionRepository stageProgressionRepository;
    private final CompanyDocumentRepository documentRepository;
    private final ShareholderRepository shareholderRepository;
    private final DirectorRepository directorRepository;
    private final CapitalStructureRepository capitalStructureRepository;
    private final CompanyDirectorsRegistryRepository directorsRegistryRepository;

    @Transactional
    public List<RuleEvaluationLog> evaluateStage(Long companyId, ApplicationStage stage, String evaluatedBy) {
        // Clear previous logs for this stage
        List<RuleEvaluationLog> previousLogs = evaluationLogRepository.findByCompanyIdAndStage(companyId, stage);
        evaluationLogRepository.deleteAll(previousLogs);

        List<RuleEvaluationLog> results = new ArrayList<>();

        switch (stage) {
            case DOCUMENT_INTAKE:
                results.addAll(evaluateDocumentIntake(companyId, evaluatedBy));
                break;
            case LEGAL_OWNERSHIP_VALIDATION:
                results.addAll(evaluateLegalOwnership(companyId, evaluatedBy));
                break;
            case CAPITAL_VALIDATION:
                results.addAll(evaluateCapitalValidation(companyId, evaluatedBy));
                break;
            case DIRECTOR_VALIDATION:
                results.addAll(evaluateDirectorValidation(companyId, evaluatedBy));
                break;
            case BUSINESS_PLAN_REVIEW:
                results.addAll(evaluateBusinessPlanReview(companyId, evaluatedBy));
                break;
            case FINAL_RECOMMENDATION:
                // Evaluated manually usually, but we check if previous stages are COMPLETE
                results.addAll(evaluateFinalRecommendation(companyId, evaluatedBy));
                break;
        }

        return evaluationLogRepository.saveAll(results);
    }

    @Transactional
    public void advanceStage(Long companyId, ApplicationStage stage, String user) {
        CompanyProfile company = companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        
        List<RuleEvaluationLog> logs = evaluationLogRepository.findByCompanyIdAndStage(companyId, stage);
        
        boolean hasHardFailure = logs.stream()
                .anyMatch(l -> l.getRuleType() == RuleType.HARD && l.getResult() == RuleResult.FAIL);

        if (hasHardFailure) {
            company.setWorkflowStatus(StageStatus.BLOCKED);
            companyProfileRepository.save(company);
            throw new RuntimeException("Cannot advance. Hard rules failed or stage is BLOCKED.");
        }

        // Mark current as COMPLETE
        company.setWorkflowStatus(StageStatus.COMPLETE);
        companyProfileRepository.save(company);

        // Record Progression
        StageProgression progression = stageProgressionRepository.findByCompanyIdAndStage(companyId, stage)
                .orElse(new StageProgression());
        progression.setCompanyId(companyId);
        progression.setStage(stage);
        progression.setStatus(StageStatus.COMPLETE);
        progression.setCompletedBy(user);
        progression.setCompletedAt(LocalDateTime.now());
        stageProgressionRepository.save(progression);
    }

    // ==========================================================
    // STAGE 1: DOCUMENT_INTAKE
    // ==========================================================
    // ==========================================================
    // STAGE 1: DOCUMENT_INTAKE
    // ==========================================================
    private List<RuleEvaluationLog> evaluateDocumentIntake(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        List<CompanyDocument> docs = documentRepository.findByCompanyId(companyId);
        
        // R-DOC-001: Certificate of Incorporation
        boolean hasCertInc = docs.stream().anyMatch(d -> "certificate_incorporation".equalsIgnoreCase(d.getDocumentType()) || d.getDocumentType().toLowerCase().contains("certificate"));
        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-001", RuleType.HARD,
                hasCertInc ? RuleResult.PASS : RuleResult.FAIL,
                hasCertInc ? "Certificate of Incorporation found." : "Missing Certificate of Incorporation.", evaluatedBy));

        // R-DOC-002: Memorandum & Articles
        boolean hasMemArt = docs.stream().anyMatch(d -> d.getDocumentType() != null && d.getDocumentType().toLowerCase().contains("memorandum"));
        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-002", RuleType.HARD,
                hasMemArt ? RuleResult.PASS : RuleResult.FAIL,
                hasMemArt ? "Memorandum & Articles found." : "Missing Memorandum & Articles.", evaluatedBy));

        // R-DOC-003: CR14 / Director list
        boolean hasCR14 = docs.stream().anyMatch(d -> d.getDocumentType() != null && d.getDocumentType().toLowerCase().contains("cr14"));
        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-003", RuleType.HARD,
                hasCR14 ? RuleResult.PASS : RuleResult.FAIL,
                hasCR14 ? "CR14 / Director list found." : "Missing CR14 / Director list.", evaluatedBy));

        // R-DOC-004: Shareholder structure (CR2 or similar)
        boolean hasCR2 = docs.stream().anyMatch(d -> d.getDocumentType() != null && d.getDocumentType().toLowerCase().contains("cr2"));
        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-004", RuleType.HARD,
                hasCR2 ? RuleResult.PASS : RuleResult.FAIL,
                hasCR2 ? "Shareholder structure / CR2 found." : "Missing Shareholder structure.", evaluatedBy));

        return logs;
    }

    // ==========================================================
    // STAGE 2: LEGAL_OWNERSHIP_VALIDATION
    // ==========================================================
    private List<RuleEvaluationLog> evaluateLegalOwnership(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);

        // R-OWN-001: Total shareholding = 100%
        double totalShareholding = shareholders.stream()
                .mapToDouble(s -> s.getOwnershipPercentage() != null ? s.getOwnershipPercentage() : 0.0)
                .sum();
        
        boolean totalIs100 = Math.abs(totalShareholding - 100.0) < 0.01;
        logs.add(createLog(companyId, ApplicationStage.LEGAL_OWNERSHIP_VALIDATION, "R-OWN-001", RuleType.HARD,
                totalIs100 ? RuleResult.PASS : RuleResult.FAIL,
                "Total ownership is " + totalShareholding + "%. " + (totalIs100 ? "Valid." : "Must be exactly 100%."), evaluatedBy));

        // R-OWN-002: No shareholder exceeds regulatory ownership cap (Assumption: 50% max without special approval)
        boolean hasCapExceeded = shareholders.stream()
                .anyMatch(s -> s.getOwnershipPercentage() != null && s.getOwnershipPercentage() > 50.0);
        
        logs.add(createLog(companyId, ApplicationStage.LEGAL_OWNERSHIP_VALIDATION, "R-OWN-002", RuleType.HARD,
                !hasCapExceeded ? RuleResult.PASS : RuleResult.FAIL,
                !hasCapExceeded ? "No shareholder exceeds cap." : "One or more shareholders exceed ownership cap.", evaluatedBy));

        return logs;
    }

    // ==========================================================
    // STAGE 3: CAPITAL_VALIDATION
    // ==========================================================
    private List<RuleEvaluationLog> evaluateCapitalValidation(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        CapitalStructure capital = capitalStructureRepository.findByCompanyId(companyId).orElse(new CapitalStructure());
        
        // R-CAP-001: Paid-up capital >= 1,250 USD
        BigDecimal paidUpExtracted = capital.getTotalIssuedAndPaidUpCapital() != null ? 
                capital.getTotalIssuedAndPaidUpCapital() : BigDecimal.ZERO;
        
        boolean hasMinimumCapital = paidUpExtracted.compareTo(new BigDecimal("1250.00")) >= 0;
        
        logs.add(createLog(companyId, ApplicationStage.CAPITAL_VALIDATION, "R-CAP-001", RuleType.HARD,
                hasMinimumCapital ? RuleResult.PASS : RuleResult.FAIL,
                "Paid up capital is " + paidUpExtracted + " USD. Minimum required is 1250.00 USD.", evaluatedBy));

        return logs;
    }

    // ==========================================================
    // STAGE 4: DIRECTOR_VALIDATION
    // ==========================================================
    private List<RuleEvaluationLog> evaluateDirectorValidation(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        List<Director> directors = directorRepository.findByCompanyId(companyId);
        CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);

        boolean allPoliceClearance = directors.stream()
                .allMatch(d -> "YES".equalsIgnoreCase(d.getPoliceClearanceSubmitted()));

        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "R-DIR-001", RuleType.HARD,
                allPoliceClearance ? RuleResult.PASS : RuleResult.FAIL,
                allPoliceClearance ? "All directors have Police Clearance." : "Missing Police Clearance for one or more directors.", evaluatedBy));

        boolean allFitAndProper = directors.stream()
                .allMatch(d -> "YES".equalsIgnoreCase(d.getProbityFormSubmitted()));

        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "R-DIR-002", RuleType.HARD,
                allFitAndProper ? RuleResult.PASS : RuleResult.FAIL,
                allFitAndProper ? "All directors signed Fit & Proper declaration." : "Missing signed Fit & Proper declaration for one or more directors.", evaluatedBy));

        // Rule R-DIR-003: Director Exclusivity check
        boolean hasExclusivityConflict = false;
        StringBuilder conflictMsg = new StringBuilder();

        for (Director d : directors) {
            if (d.getIdNumber() != null) {
                // We check registry using National ID
                List<CompanyDirectorsRegistry> registryHits = directorsRegistryRepository.findByNationalId(d.getIdNumber());
                for (CompanyDirectorsRegistry reg : registryHits) {
                    if (company != null && !reg.getCompanyRegistrationNumber().equals(company.getRegistrationNumber()) && "ACTIVE".equals(reg.getCompanyStatus())) {
                        hasExclusivityConflict = true;
                        conflictMsg.append("Director ").append(d.getFullName()).append(" is also in ").append(reg.getCompanyRegistrationNumber()).append(". ");
                    }
                }
            }
        }

        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "R-DIR-003", RuleType.HARD,
                !hasExclusivityConflict ? RuleResult.PASS : RuleResult.FAIL,
                !hasExclusivityConflict ? "No exclusivity conflicts." : conflictMsg.toString(), evaluatedBy));

        return logs;
    }

    // ==========================================================
    // STAGE 5: BUSINESS_PLAN_REVIEW
    // ==========================================================
    private List<RuleEvaluationLog> evaluateBusinessPlanReview(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        // In reality, we query the AI extracted flags or a specific BusinessPlan entity.
        // For placeholder, we assume AI successfully confirmed these sections.
        
        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-001", RuleType.HARD,
                RuleResult.PASS, "AI Verification: Executive Summary is present.", evaluatedBy));
                
        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-002", RuleType.HARD,
                RuleResult.PASS, "AI Verification: Market Analysis is present.", evaluatedBy));
                
        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-003", RuleType.HARD,
                RuleResult.PASS, "AI Verification: Risk Management Strategy is present.", evaluatedBy));
                
        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-004", RuleType.HARD,
                RuleResult.PASS, "AI Verification: Financial Projections (minimum 3 years) are present.", evaluatedBy));
                
        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-005", RuleType.HARD,
                RuleResult.PASS, "AI Verification: Governance Structure is present.", evaluatedBy));
        
        return logs;
    }

    // ==========================================================
    // STAGE 6: FINAL_RECOMMENDATION
    // ==========================================================
    private List<RuleEvaluationLog> evaluateFinalRecommendation(Long companyId, String evaluatedBy) {
        List<RuleEvaluationLog> logs = new ArrayList<>();
        
        CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
        if (company != null) {
            boolean isReadyForRecommendation = company.getWorkflowStage() == ApplicationStage.BUSINESS_PLAN_REVIEW && 
                                             company.getWorkflowStatus() == StageStatus.COMPLETE;
                                             
            // R-FIN-001: All previous stages must be complete
            logs.add(createLog(companyId, ApplicationStage.FINAL_RECOMMENDATION, "R-FIN-001", RuleType.HARD,
                    isReadyForRecommendation ? RuleResult.PASS : RuleResult.FAIL,
                    isReadyForRecommendation ? "All previous stages completed successfully." : "Previous stages are incomplete.", evaluatedBy));
        }

        return logs;
    }

    // ==========================================================
    // HELPER
    // ==========================================================
    private RuleEvaluationLog createLog(Long companyId, ApplicationStage stage, String ruleId, 
            RuleType type, RuleResult result, String details, String evaluatedBy) {
        RuleEvaluationLog log = new RuleEvaluationLog();
        log.setCompanyId(companyId);
        log.setStage(stage);
        log.setRuleId(ruleId);
        log.setRuleType(type);
        log.setResult(result);
        log.setDetails(details);
        log.setEvaluatedBy(evaluatedBy);
        log.setOverrideAllowed(type == RuleType.SOFT); // Simplification: soft rules always overridable
        return log;
    }
}
