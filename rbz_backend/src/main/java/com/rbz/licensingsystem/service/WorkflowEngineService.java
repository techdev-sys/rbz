package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.repository.GrowthAndDevelopmentRepository;
import com.rbz.licensingsystem.repository.DirectorQuestionnaireRepository;
import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.model.enums.InstitutionType;
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
@SuppressWarnings("null")
public class WorkflowEngineService {

        private final CompanyProfileRepository companyProfileRepository;
        private final RuleEvaluationLogRepository evaluationLogRepository;
        private final StageProgressionRepository stageProgressionRepository;
        private final CompanyDocumentRepository documentRepository;
        private final ShareholderRepository shareholderRepository;
        private final DirectorRepository directorRepository;
        private final CapitalStructureRepository capitalStructureRepository;
        private final CompanyDirectorsRegistryRepository directorsRegistryRepository;
        private final BoardCommitteeRepository boardCommitteeRepository;
        private final FinancialProjectionRepository financialProjectionRepository;
        private final CompanyProductRepository companyProductRepository;
        private final GrowthAndDevelopmentRepository growthAndDevelopmentRepository;
        private final DirectorQuestionnaireRepository directorQuestionnaireRepository;
        private final CapitalAdequacyReturnRepository capitalAdequacyReturnRepository;
        private final DepositProtectionRepository depositProtectionRepository;
        private final LiquidityManagementRepository liquidityManagementRepository;
        private final ITCyberRiskRepository itCyberRiskRepository;
        private final RecoveryResolutionRepository recoveryResolutionRepository;

        @Transactional
        public List<RuleEvaluationLog> evaluateStage(Long companyId, ApplicationStage stage, String evaluatedBy) {
                // Clear previous logs for this stage
                List<RuleEvaluationLog> previousLogs = evaluationLogRepository.findByCompanyIdAndStage(companyId,
                                stage);
                evaluationLogRepository.deleteAll(previousLogs);

                List<RuleEvaluationLog> results = new ArrayList<>();

                switch (stage) {
                        case COMPANY_PROFILE:
                                results.addAll(evaluateCompanyProfile(companyId, evaluatedBy));
                                break;
                        case LEGAL_OWNERSHIP_VALIDATION:
                                results.addAll(evaluateLegalOwnership(companyId, evaluatedBy));
                                break;
                        case DIRECTOR_VALIDATION:
                                results.addAll(evaluateDirectorValidation(companyId, evaluatedBy));
                                break;
                        case BOARD_COMMITTEES:
                                results.addAll(evaluateBoardCommittees(companyId, evaluatedBy));
                                break;
                        case CAPITAL_VALIDATION:
                                results.addAll(evaluateCapitalValidation(companyId, evaluatedBy));
                                break;
                        case BUSINESS_PLAN_REVIEW:
                                results.addAll(evaluateBusinessPlanReview(companyId, evaluatedBy));
                                break;
                        case FINANCIAL_PROJECTIONS:
                                results.addAll(evaluateFinancialProjections(companyId, evaluatedBy));
                                break;
                        case GROWTH_AND_DEVELOPMENT:
                                results.addAll(evaluateGrowthAndDevelopment(companyId, evaluatedBy));
                                break;
                        case DOCUMENT_INTAKE:
                                results.addAll(evaluateDocumentIntake(companyId, evaluatedBy));
                                break;
                        case DEPOSIT_PROTECTION:
                                results.addAll(evaluateDepositProtection(companyId, evaluatedBy));
                                break;
                        case CAPITAL_ADEQUACY:
                                results.addAll(evaluateCapitalAdequacy(companyId, evaluatedBy));
                                break;
                        case LIQUIDITY_MANAGEMENT:
                                results.addAll(evaluateLiquidityManagement(companyId, evaluatedBy));
                                break;
                        case IT_CYBER_RISK:
                                results.addAll(evaluateITCyberRisk(companyId, evaluatedBy));
                                break;
                        case RECOVERY_RESOLUTION:
                                results.addAll(evaluateRecoveryResolution(companyId, evaluatedBy));
                                break;
                        case FINAL_RECOMMENDATION:
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

                // Mark current stage as COMPLETE and advance the stage pointer
                company.setWorkflowStage(stage);
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

                // R-DOC-001: Audited Financial Statements
                boolean hasFinancials = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("financialstatements"));
                logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-001", RuleType.HARD,
                                hasFinancials ? RuleResult.PASS : RuleResult.FAIL,
                                hasFinancials ? "Audited Financial Statements found."
                                                : "Missing Audited Financial Statements.",
                                evaluatedBy));

                // R-DOC-002: Strategic Business Plan
                boolean hasBusinessPlan = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("businessplan"));
                logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-002", RuleType.HARD,
                                hasBusinessPlan ? RuleResult.PASS : RuleResult.FAIL,
                                hasBusinessPlan ? "Strategic Business Plan found." : "Missing Strategic Business Plan.",
                                evaluatedBy));

                // R-DOC-003: Loan Portfolio Report
                boolean hasPortfolio = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("portfolioreport"));
                logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-003", RuleType.HARD,
                                hasPortfolio ? RuleResult.PASS : RuleResult.FAIL,
                                hasPortfolio ? "Loan Portfolio Report found." : "Missing Loan Portfolio Report.",
                                evaluatedBy));

                // R-DOC-004: Credit & Risk Policy Manual
                boolean hasCreditPolicy = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("creditpolicy"));
                logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-004", RuleType.HARD,
                                hasCreditPolicy ? RuleResult.PASS : RuleResult.FAIL,
                                hasCreditPolicy ? "Credit & Risk Policy Manual found."
                                                : "Missing Credit & Risk Policy Manual.",
                                evaluatedBy));

                // R-DOC-005: ZIMRA Tax Clearance Certificate
                boolean hasTaxClearance = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("taxclearance"));
                logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-005", RuleType.HARD,
                                hasTaxClearance ? RuleResult.PASS : RuleResult.FAIL,
                                hasTaxClearance ? "ZIMRA Tax Clearance Certificate found."
                                                : "Missing ZIMRA Tax Clearance Certificate.",
                                evaluatedBy));

                // Institution-specific additional documents
                CompanyProfile docCompany = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType docItype = resolveType(docCompany);

                if (docItype == InstitutionType.DTMFI || docItype == InstitutionType.COMMERCIAL_BANK) {
                        boolean hasAml = docs.stream().anyMatch(d -> d.getDocumentType() != null
                                        && d.getDocumentType().toLowerCase().contains("amlcftpolicy"));
                        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-006", RuleType.HARD,
                                        hasAml ? RuleResult.PASS : RuleResult.FAIL,
                                        hasAml ? "AML/CFT Compliance Programme found."
                                                : "Missing AML/CFT Compliance Programme (required for " + docItype.name() + ").",
                                        evaluatedBy));
                }

                if (docItype == InstitutionType.COMMERCIAL_BANK) {
                        boolean hasRisk = docs.stream().anyMatch(d -> d.getDocumentType() != null
                                        && d.getDocumentType().toLowerCase().contains("riskframework"));
                        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-007", RuleType.HARD,
                                        hasRisk ? RuleResult.PASS : RuleResult.FAIL,
                                        hasRisk ? "Enterprise Risk Management Framework found."
                                                : "Missing Enterprise Risk Management Framework (required for Commercial Banks).",
                                        evaluatedBy));

                        boolean hasIt = docs.stream().anyMatch(d -> d.getDocumentType() != null
                                        && d.getDocumentType().toLowerCase().contains("technologypolicy"));
                        logs.add(createLog(companyId, ApplicationStage.DOCUMENT_INTAKE, "R-DOC-008", RuleType.SOFT,
                                        hasIt ? RuleResult.PASS : RuleResult.FAIL,
                                        hasIt ? "IT & Technology Risk Policy found."
                                                : "IT & Technology Risk Policy not submitted (recommended for Commercial Banks).",
                                        evaluatedBy));
                }

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
                                "Total ownership is " + totalShareholding + "%. "
                                                + (totalIs100 ? "Valid." : "Must be exactly 100%."),
                                evaluatedBy));

                // R-OWN-002: No shareholder exceeds regulatory ownership cap (Assumption: 50%
                // max without special approval)
                boolean hasCapExceeded = shareholders.stream()
                                .anyMatch(s -> s.getOwnershipPercentage() != null && s.getOwnershipPercentage() > 50.0);

                logs.add(createLog(companyId, ApplicationStage.LEGAL_OWNERSHIP_VALIDATION, "R-OWN-002", RuleType.HARD,
                                !hasCapExceeded ? RuleResult.PASS : RuleResult.FAIL,
                                !hasCapExceeded ? "No shareholder exceeds cap."
                                                : "One or more shareholders exceed ownership cap.",
                                evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE 3: CAPITAL_VALIDATION
        // ==========================================================
        private List<RuleEvaluationLog> evaluateCapitalValidation(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CapitalStructure capital = capitalStructureRepository.findByCompanyId(companyId)
                                .orElse(new CapitalStructure());

                        BigDecimal paidUpExtracted = capital.getTotalIssuedAndPaidUpCapital() != null
                                ? capital.getTotalIssuedAndPaidUpCapital()
                                : BigDecimal.ZERO;

                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType itype = resolveType(company);
                BigDecimal minimumCapital;
                String licenseLabel;
                switch (itype) {
                        case COMMERCIAL_BANK -> { minimumCapital = new BigDecimal("30000000.00"); licenseLabel = "Commercial Bank (RBZ 2024)"; }
                        case DTMFI          -> { minimumCapital = new BigDecimal("25000.00");    licenseLabel = "Deposit-Taking MFI"; }
                        default             -> { minimumCapital = new BigDecimal("5000.00");     licenseLabel = "Credit-Only MFI"; }
                }

                boolean hasMinimumCapital = paidUpExtracted.compareTo(minimumCapital) >= 0;

                logs.add(createLog(companyId, ApplicationStage.CAPITAL_VALIDATION, "R-CAP-001", RuleType.HARD,
                                hasMinimumCapital ? RuleResult.PASS : RuleResult.FAIL,
                                "Paid up capital is USD " + paidUpExtracted + ". Minimum required for "
                                                + licenseLabel + " is USD " + minimumCapital + ".",
                                evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE 4: DIRECTOR_VALIDATION
        // ==========================================================
        private List<RuleEvaluationLog> evaluateDirectorValidation(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                List<Director> directors = directorRepository.findByCompanyId(companyId);
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);

                for (int i = 0; i < directors.size(); i++) {
                        Director d = directors.get(i);
                        String name = d.getFullName() != null ? d.getFullName() : "Director " + (i + 1);

                        boolean police = "YES".equalsIgnoreCase(d.getPoliceClearanceSubmitted());
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "dir-police-" + i,
                                        RuleType.HARD,
                                        police ? RuleResult.PASS : RuleResult.FAIL,
                                        police ? name + " has Police Clearance."
                                                        : "Missing Police Clearance for " + name + ".",
                                        evaluatedBy));

                        boolean fit = "YES".equalsIgnoreCase(d.getProbityFormSubmitted());
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "dir-fit-" + i,
                                        RuleType.HARD,
                                        fit ? RuleResult.PASS : RuleResult.FAIL,
                                        fit ? name + " signed Fit & Proper declaration."
                                                        : "Missing signed Fit & Proper declaration for " + name + ".",
                                        evaluatedBy));
                }

                // Rule R-DIR-003: Director Exclusivity check
                boolean hasExclusivityConflict = false;
                StringBuilder conflictMsg = new StringBuilder();

                for (Director d : directors) {
                        if (d.getIdNumber() != null) {
                                List<CompanyDirectorsRegistry> registryHits = directorsRegistryRepository
                                                .findByNationalId(d.getIdNumber());
                                for (CompanyDirectorsRegistry reg : registryHits) {
                                        if (company != null
                                                        && !reg.getCompanyRegistrationNumber()
                                                                        .equals(company.getRegistrationNumber())
                                                        && "ACTIVE".equals(reg.getCompanyStatus())) {
                                                hasExclusivityConflict = true;
                                                conflictMsg.append("Director ").append(d.getFullName())
                                                                .append(" is also in ")
                                                                .append(reg.getCompanyRegistrationNumber())
                                                                .append(". ");
                                        }
                                }
                        }
                }

                logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION, "R-DIR-003", RuleType.HARD,
                                !hasExclusivityConflict ? RuleResult.PASS : RuleResult.FAIL,
                                !hasExclusivityConflict ? "No exclusivity conflicts." : conflictMsg.toString(),
                                evaluatedBy));

                // AI-backed verification rules: use stored results from document upload stage
                for (int i = 0; i < directors.size(); i++) {
                        Director d = directors.get(i);
                        String name = d.getFullName() != null ? d.getFullName() : "Director " + (i + 1);

                        // R-DIR-AI-001: CV must have no risk flags (flagged by AI during upload)
                        boolean noRiskFlag = !d.isRiskFlag();
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION,
                                        "R-DIR-AI-001-" + i, RuleType.HARD,
                                        noRiskFlag ? RuleResult.PASS : RuleResult.FAIL,
                                        noRiskFlag ? name + ": CV analysis found no risk flags."
                                                        : name + ": CV analysis flagged potential risk — review required.",
                                        evaluatedBy));

                        // R-DIR-AI-002: Police clearance AI-verified (soft — warns if not verified)
                        boolean policeVerified = d.isPoliceClearanceVerified();
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION,
                                        "R-DIR-AI-002-" + i, RuleType.SOFT,
                                        policeVerified ? RuleResult.PASS : RuleResult.FAIL,
                                        policeVerified ? name + ": Police clearance AI-verified."
                                                        : name + ": Police clearance not yet AI-verified.",
                                        evaluatedBy));

                        // R-DIR-AI-003: Tax clearance AI-verified (soft)
                        boolean taxVerified = d.isTaxClearanceVerified();
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION,
                                        "R-DIR-AI-003-" + i, RuleType.SOFT,
                                        taxVerified ? RuleResult.PASS : RuleResult.FAIL,
                                        taxVerified ? name + ": Tax clearance AI-verified."
                                                        : name + ": Tax clearance not yet AI-verified.",
                                        evaluatedBy));

                        // R-DIR-DQ-001: Director Questionnaire (fit & proper) must be completed
                        boolean dqCompleted = directorQuestionnaireRepository
                                        .findByDirectorId(d.getId())
                                        .map(dq -> "COMPLETED".equals(dq.getCompletionStatus()))
                                        .orElse(false);
                        logs.add(createLog(companyId, ApplicationStage.DIRECTOR_VALIDATION,
                                        "R-DIR-DQ-001-" + i, RuleType.HARD,
                                        dqCompleted ? RuleResult.PASS : RuleResult.FAIL,
                                        dqCompleted ? name + ": Fit & Proper Questionnaire completed."
                                                        : name + ": Fit & Proper Questionnaire not submitted.",
                                        evaluatedBy));
                }

                return logs;
        }

        // ==========================================================
        // STAGE 5: BUSINESS_PLAN_REVIEW
        // ==========================================================
        private List<RuleEvaluationLog> evaluateBusinessPlanReview(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();

                // R-BP-001: Strategic Business Plan document uploaded
                List<CompanyDocument> docs = documentRepository.findByCompanyId(companyId);
                boolean hasBusinessPlanDoc = docs.stream()
                                .anyMatch(d -> d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("businessplan"));
                logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-001", RuleType.HARD,
                                hasBusinessPlanDoc ? RuleResult.PASS : RuleResult.FAIL,
                                hasBusinessPlanDoc ? "Strategic Business Plan document uploaded."
                                                : "Strategic Business Plan document not uploaded.",
                                evaluatedBy));

                // R-BP-002: Products & Services defined (market analysis evidence)
                List<CompanyProduct> products = companyProductRepository.findByCompanyId(companyId);
                boolean hasProducts = !products.isEmpty();
                logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-002", RuleType.HARD,
                                hasProducts ? RuleResult.PASS : RuleResult.FAIL,
                                hasProducts ? "Products & Services defined (" + products.size() + " product(s))."
                                                : "No Products & Services defined.",
                                evaluatedBy));

                // R-BP-003: Growth & Development plan present (risk/market strategy evidence)
                boolean hasGrowthPlan = growthAndDevelopmentRepository.findByCompanyId(companyId)
                                .map(g -> g.getGrowthStrategies() != null && !g.getGrowthStrategies().isBlank())
                                .orElse(false);
                logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-003", RuleType.HARD,
                                hasGrowthPlan ? RuleResult.PASS : RuleResult.FAIL,
                                hasGrowthPlan ? "Growth & Development strategy is present."
                                                : "Growth & Development strategy is missing.",
                                evaluatedBy));

                // R-BP-004: Financial projections — minimum 3 years required
                List<FinancialProjection> projections = financialProjectionRepository.findByCompanyId(companyId);
                boolean hasMinProjections = projections.size() >= 3;
                logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-004", RuleType.HARD,
                                hasMinProjections ? RuleResult.PASS : RuleResult.FAIL,
                                "Financial projections provided for " + projections.size()
                                                + " year(s). Minimum required is 3.",
                                evaluatedBy));

                // R-BP-005: Governance — at least one board committee defined (soft rule)
                List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);
                boolean hasGovernance = !committees.isEmpty();
                logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-005", RuleType.SOFT,
                                hasGovernance ? RuleResult.PASS : RuleResult.FAIL,
                                hasGovernance ? "Governance structure defined (" + committees.size() + " committee(s))."
                                                : "No board committees defined.",
                                evaluatedBy));

                // R-BP-006: Commercial Banks must offer a diversified product range (≥ 3 products)
                CompanyProfile bpCompany = companyProfileRepository.findById(companyId).orElse(null);
                if (resolveType(bpCompany) == InstitutionType.COMMERCIAL_BANK) {
                        boolean diversified = products.size() >= 3;
                        logs.add(createLog(companyId, ApplicationStage.BUSINESS_PLAN_REVIEW, "R-BP-006", RuleType.HARD,
                                        diversified ? RuleResult.PASS : RuleResult.FAIL,
                                        diversified ? "Diversified product range defined (" + products.size() + " products)."
                                                    : "Commercial Banks require at least 3 distinct products (" + products.size() + " defined).",
                                        evaluatedBy));
                }

                return logs;
        }

        // ==========================================================
        // STAGE CAPITAL_ADEQUACY (Commercial Bank only — Basel III)
        // ==========================================================
        private List<RuleEvaluationLog> evaluateCapitalAdequacy(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);

                InstitutionType itype = (company != null && company.getInstitutionType() != null)
                        ? company.getInstitutionType() : InstitutionType.MFI;

                if (itype != InstitutionType.COMMERCIAL_BANK) {
                        logs.add(createLog(companyId, ApplicationStage.CAPITAL_ADEQUACY, "R-CAP-000", RuleType.SOFT,
                                RuleResult.PASS, "Capital adequacy stage not required for " + itype.name(), evaluatedBy));
                        return logs;
                }

                var carOpt = capitalAdequacyReturnRepository.findByCompanyId(companyId);

                // R-CAP-001: Capital adequacy return submitted
                logs.add(createLog(companyId, ApplicationStage.CAPITAL_ADEQUACY, "R-CAP-001", RuleType.HARD,
                        carOpt.isPresent() ? RuleResult.PASS : RuleResult.FAIL,
                        carOpt.isPresent() ? "Capital adequacy return submitted." : "Capital adequacy return missing.",
                        evaluatedBy));

                if (carOpt.isEmpty()) return logs;
                CapitalAdequacyReturn car = carOpt.get();

                // R-CAP-002: Tier 1 paid-up capital ≥ USD 30,000,000
                BigDecimal minPaidUp = new BigDecimal("30000000");
                boolean t1ok = car.getPaidUpShareCapital() != null
                        && car.getPaidUpShareCapital().compareTo(minPaidUp) >= 0;
                logs.add(createLog(companyId, ApplicationStage.CAPITAL_ADEQUACY, "R-CAP-002", RuleType.HARD,
                        t1ok ? RuleResult.PASS : RuleResult.FAIL,
                        t1ok ? "Paid-up capital meets USD 30M minimum."
                             : "Paid-up capital below USD 30M minimum. Actual: " + car.getPaidUpShareCapital(),
                        evaluatedBy));

                // R-CAP-003: CAR ≥ 12%
                BigDecimal minCAR = new BigDecimal("12");
                boolean carOk = car.getCapitalAdequacyRatio() != null
                        && car.getCapitalAdequacyRatio().compareTo(minCAR) >= 0;
                logs.add(createLog(companyId, ApplicationStage.CAPITAL_ADEQUACY, "R-CAP-003", RuleType.HARD,
                        carOk ? RuleResult.PASS : RuleResult.FAIL,
                        carOk ? "CAR " + car.getCapitalAdequacyRatio() + "% meets 12% minimum."
                              : "CAR " + car.getCapitalAdequacyRatio() + "% is below 12% minimum.",
                        evaluatedBy));

                // R-CAP-004: Tier 2 ≤ Tier 1 (Basel III constraint)
                boolean t2ok = car.getTier1Capital() != null && car.getTier2Capital() != null
                        && car.getTier2Capital().compareTo(car.getTier1Capital()) <= 0;
                logs.add(createLog(companyId, ApplicationStage.CAPITAL_ADEQUACY, "R-CAP-004", RuleType.SOFT,
                        t2ok ? RuleResult.PASS : RuleResult.FAIL,
                        t2ok ? "Tier 2 capital within Tier 1 limit (Basel III compliant)."
                             : "Tier 2 capital exceeds Tier 1 capital — Basel III violation.",
                        evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE 6: FINAL_RECOMMENDATION
        // ==========================================================
        private List<RuleEvaluationLog> evaluateFinalRecommendation(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();

                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                if (company != null) {
                        boolean isReadyForRecommendation = company
                                        .getWorkflowStage() == ApplicationStage.BUSINESS_PLAN_REVIEW &&
                                        company.getWorkflowStatus() == StageStatus.COMPLETE;

                        // R-FIN-001: All previous stages must be complete
                        logs.add(createLog(companyId, ApplicationStage.FINAL_RECOMMENDATION, "R-FIN-001", RuleType.HARD,
                                        isReadyForRecommendation ? RuleResult.PASS : RuleResult.FAIL,
                                        isReadyForRecommendation ? "All previous stages completed successfully."
                                                        : "Previous stages are incomplete.",
                                        evaluatedBy));
                }

                return logs;
        }

        // ==========================================================
        // STAGE 1: COMPANY_PROFILE
        // ==========================================================
        private List<RuleEvaluationLog> evaluateCompanyProfile(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                List<CompanyDocument> docs = documentRepository.findByCompanyId(companyId);
                boolean hasCertInc = docs.stream().anyMatch(d -> "certificate_incorporation"
                                .equalsIgnoreCase(d.getDocumentType())
                                || (d.getDocumentType() != null
                                                && d.getDocumentType().toLowerCase().contains("certificate")));
                logs.add(createLog(companyId, ApplicationStage.COMPANY_PROFILE, "R-DOC-001", RuleType.HARD,
                                hasCertInc ? RuleResult.PASS : RuleResult.FAIL,
                                hasCertInc ? "Certificate of Incorporation found."
                                                : "Missing Certificate of Incorporation.",
                                evaluatedBy));
                return logs;
        }

        // ==========================================================
        // STAGE 4: BOARD_COMMITTEES
        // ==========================================================
        private List<RuleEvaluationLog> evaluateBoardCommittees(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);

                if (committees.isEmpty()) {
                        logs.add(createLog(companyId, ApplicationStage.BOARD_COMMITTEES, "R-BC-000", RuleType.HARD,
                                        RuleResult.FAIL, "No board committees found. Min 1 required.", evaluatedBy));
                        return logs;
                }

                for (int i = 0; i < committees.size(); i++) {
                        BoardCommittee bc = committees.get(i);
                        boolean hasTor = bc.getTermsOfReferenceDocumentPath() != null
                                        && !bc.getTermsOfReferenceDocumentPath().isEmpty();
                        String name = bc.getCommitteeName() != null ? bc.getCommitteeName() : "Committee " + (i + 1);
                        logs.add(createLog(companyId, ApplicationStage.BOARD_COMMITTEES, "bc-tor-" + i, RuleType.HARD,
                                        hasTor ? RuleResult.PASS : RuleResult.FAIL,
                                        hasTor ? name + " Terms of Reference uploaded."
                                                        : "Missing Terms of Reference for " + name + ".",
                                        evaluatedBy));
                }
                return logs;
        }

        // ==========================================================
        // STAGE 7: FINANCIAL_PROJECTIONS
        // ==========================================================
        private List<RuleEvaluationLog> evaluateFinancialProjections(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                List<FinancialProjection> projections = financialProjectionRepository.findByCompanyId(companyId);

                // R-FIN-PROJ-001: Projections submitted
                boolean hasProjections = !projections.isEmpty();
                logs.add(createLog(companyId, ApplicationStage.FINANCIAL_PROJECTIONS, "R-FIN-PROJ-001", RuleType.HARD,
                                hasProjections ? RuleResult.PASS : RuleResult.FAIL,
                                hasProjections ? "Financial projections submitted." : "Missing financial projections.",
                                evaluatedBy));

                // R-FIN-PROJ-002: At least three distinct years of projections
                int distinctYears = (int) projections.stream()
                                .map(FinancialProjection::getYear)
                                .filter(java.util.Objects::nonNull)
                                .distinct()
                                .count();
                boolean horizonOk = distinctYears >= 3;
                logs.add(createLog(companyId, ApplicationStage.FINANCIAL_PROJECTIONS, "R-FIN-PROJ-002", RuleType.HARD,
                                horizonOk ? RuleResult.PASS : RuleResult.FAIL,
                                horizonOk ? "Projections cover " + distinctYears + " distinct year(s)."
                                                : "Projections cover only " + distinctYears
                                                                + " year(s); RBZ requires at least 3.",
                                evaluatedBy));

                // R-FIN-PROJ-003: Profitability achieved by year 3
                java.util.Optional<FinancialProjection> year3 = projections.stream()
                                .filter(p -> p.getYear() != null)
                                .sorted(java.util.Comparator.comparing(FinancialProjection::getYear))
                                .skip(2).findFirst();
                boolean profitableByY3 = year3.map(p -> p.getNetIncome() != null && p.getNetIncome() > 0)
                                .orElse(false);
                logs.add(createLog(companyId, ApplicationStage.FINANCIAL_PROJECTIONS, "R-FIN-PROJ-003", RuleType.SOFT,
                                profitableByY3 ? RuleResult.PASS : RuleResult.FAIL,
                                profitableByY3 ? "Net income is positive by year 3."
                                                : "Net income is not positive by year 3 of the projections.",
                                evaluatedBy));

                // R-FIN-PROJ-004: Opening equity meets minimum capital for the institution type
                CompanyProfile fpCompany = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType fpItype = resolveType(fpCompany);
                BigDecimal minimumCapital;
                String licenseLabel;
                switch (fpItype) {
                        case COMMERCIAL_BANK -> { minimumCapital = new BigDecimal("30000000.00"); licenseLabel = "Commercial Bank"; }
                        case DTMFI          -> { minimumCapital = new BigDecimal("25000.00");    licenseLabel = "DTMFI (Deposit-Taking)"; }
                        default             -> { minimumCapital = new BigDecimal("5000.00");     licenseLabel = "Credit-Only MFI"; }
                }
                BigDecimal openingEquity = projections.stream()
                                .filter(p -> p.getYear() != null && p.getTotalEquity() != null)
                                .sorted(java.util.Comparator.comparing(FinancialProjection::getYear))
                                .findFirst()
                                .map(p -> BigDecimal.valueOf(p.getTotalEquity()))
                                .orElse(BigDecimal.ZERO);
                boolean meetsMinimum = openingEquity.compareTo(minimumCapital) >= 0;
                logs.add(createLog(companyId, ApplicationStage.FINANCIAL_PROJECTIONS, "R-FIN-PROJ-004", RuleType.HARD,
                                meetsMinimum ? RuleResult.PASS : RuleResult.FAIL,
                                meetsMinimum
                                                ? "Opening equity USD " + openingEquity.toPlainString()
                                                                + " meets the " + licenseLabel + " minimum of USD "
                                                                + minimumCapital.toPlainString() + "."
                                                : "Opening equity USD " + openingEquity.toPlainString()
                                                                + " is below the " + licenseLabel + " minimum of USD "
                                                                + minimumCapital.toPlainString() + ".",
                                evaluatedBy));

                // R-FIN-PROJ-005: Commercial Banks should present a 5-year projection horizon (SOFT)
                if (fpItype == InstitutionType.COMMERCIAL_BANK) {
                        boolean fiveYearHorizon = distinctYears >= 5;
                        logs.add(createLog(companyId, ApplicationStage.FINANCIAL_PROJECTIONS, "R-FIN-PROJ-005", RuleType.SOFT,
                                        fiveYearHorizon ? RuleResult.PASS : RuleResult.FAIL,
                                        fiveYearHorizon ? "5-year projection horizon provided — meets Commercial Bank standard."
                                                        : "RBZ recommends 5-year projections for Commercial Banks ("
                                                                + distinctYears + " year(s) provided).",
                                        evaluatedBy));
                }

                return logs;
        }

        // ==========================================================
        // STAGE 8: GROWTH_AND_DEVELOPMENT
        // ==========================================================
        private List<RuleEvaluationLog> evaluateGrowthAndDevelopment(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();

                var growthOpt = growthAndDevelopmentRepository.findByCompanyId(companyId);

                boolean hasStrategies = growthOpt
                                .map(g -> g.getGrowthStrategies() != null && !g.getGrowthStrategies().isBlank())
                                .orElse(false);
                logs.add(createLog(companyId, ApplicationStage.GROWTH_AND_DEVELOPMENT, "R-GROWTH-001", RuleType.HARD,
                                hasStrategies ? RuleResult.PASS : RuleResult.FAIL,
                                hasStrategies ? "Growth strategies provided."
                                                : "Growth strategies section is empty.",
                                evaluatedBy));

                boolean hasExpansion = growthOpt
                                .map(g -> g.getBusinessExpansionPlans() != null && !g.getBusinessExpansionPlans().isBlank())
                                .orElse(false);
                logs.add(createLog(companyId, ApplicationStage.GROWTH_AND_DEVELOPMENT, "R-GROWTH-002", RuleType.SOFT,
                                hasExpansion ? RuleResult.PASS : RuleResult.FAIL,
                                hasExpansion ? "Business expansion plans provided."
                                                : "Business expansion plans not provided.",
                                evaluatedBy));

                boolean hasDevelopmentalValue = growthOpt
                                .map(g -> g.getDevelopmentalValueSummary() != null && !g.getDevelopmentalValueSummary().isBlank())
                                .orElse(false);
                logs.add(createLog(companyId, ApplicationStage.GROWTH_AND_DEVELOPMENT, "R-GROWTH-003", RuleType.SOFT,
                                hasDevelopmentalValue ? RuleResult.PASS : RuleResult.FAIL,
                                hasDevelopmentalValue ? "Developmental value summary provided."
                                                : "Developmental value summary not provided.",
                                evaluatedBy));

                // R-GROWTH-004: Commercial Banks should describe technology / digital banking strategy (SOFT)
                CompanyProfile growthCompany = companyProfileRepository.findById(companyId).orElse(null);
                if (resolveType(growthCompany) == InstitutionType.COMMERCIAL_BANK) {
                        boolean hasTechStrategy = growthOpt
                                        .map(g -> g.getPerformanceEnhancementStrategies() != null
                                                        && !g.getPerformanceEnhancementStrategies().isBlank())
                                        .orElse(false);
                        logs.add(createLog(companyId, ApplicationStage.GROWTH_AND_DEVELOPMENT, "R-GROWTH-004", RuleType.SOFT,
                                        hasTechStrategy ? RuleResult.PASS : RuleResult.FAIL,
                                        hasTechStrategy ? "Technology & performance enhancement strategy provided."
                                                        : "Commercial Banks should describe their technology/digital banking strategy (Performance Enhancement section).",
                                        evaluatedBy));
                }

                return logs;
        }

        // ==========================================================
        // STAGE: DEPOSIT_PROTECTION (DTMFI only)
        // ==========================================================
        private List<RuleEvaluationLog> evaluateDepositProtection(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType itype = resolveType(company);

                // R-DIPF-000: This stage is only relevant for DTMFIs
                if (itype != InstitutionType.DTMFI) {
                        logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-000", RuleType.SOFT,
                                RuleResult.PASS,
                                "Deposit Protection stage not applicable to " + itype + " institutions — automatically passed.",
                                evaluatedBy));
                        return logs;
                }

                var dpOpt = depositProtectionRepository.findByCompanyId(companyId);

                // R-DIPF-001 (HARD): DIPF registration status must be REGISTERED or PENDING
                String dipfStatus = dpOpt.map(DepositProtection::getDipfRegistrationStatus).orElse(null);
                boolean dipfOk = "REGISTERED".equals(dipfStatus) || "PENDING".equals(dipfStatus);
                logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-001", RuleType.HARD,
                        dipfOk ? RuleResult.PASS : RuleResult.FAIL,
                        dipfOk ? "DIPF registration status: " + dipfStatus + "."
                               : "DTMFI must be registered (or have pending registration) with the Deposit Insurance and Protection Fund (DIPF).",
                        evaluatedBy));

                // R-DIPF-002 (HARD): Total deposit liabilities must be declared
                boolean hasLiabilities = dpOpt.map(d -> d.getTotalDepositLiabilities() != null
                        && d.getTotalDepositLiabilities().compareTo(BigDecimal.ZERO) > 0).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-002", RuleType.HARD,
                        hasLiabilities ? RuleResult.PASS : RuleResult.FAIL,
                        hasLiabilities ? "Total deposit liabilities declared."
                                       : "Total deposit liabilities must be declared for DTMFI assessment.",
                        evaluatedBy));

                // R-DIPF-003 (HARD): Deposit insurance premium must be paid (if registered)
                if ("REGISTERED".equals(dipfStatus)) {
                        boolean premiumPaid = dpOpt.map(d -> Boolean.TRUE.equals(d.getDepositInsurancePremiumPaid())).orElse(false);
                        logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-003", RuleType.HARD,
                                premiumPaid ? RuleResult.PASS : RuleResult.FAIL,
                                premiumPaid ? "DIPF insurance premium confirmed as paid."
                                            : "DIPF insurance premium must be paid before license can be issued.",
                                evaluatedBy));
                }

                // R-DIPF-004 (SOFT): Liquidity buffer ratio ≥ 10% of total deposits
                boolean bufferOk = dpOpt.map(d -> d.getLiquidityBufferRatio() != null
                        && d.getLiquidityBufferRatio().compareTo(new BigDecimal("10")) >= 0).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-004", RuleType.SOFT,
                        bufferOk ? RuleResult.PASS : RuleResult.FAIL,
                        bufferOk ? "Liquidity buffer ratio meets or exceeds 10% threshold."
                                 : "Liquidity buffer ratio below 10% of deposit liabilities — recommend increasing liquid asset holdings.",
                        evaluatedBy));

                // R-DIPF-005 (SOFT): Deposit run-off protocol described
                boolean hasProtocol = dpOpt.map(d -> d.getDepositRunoffProtocol() != null
                        && !d.getDepositRunoffProtocol().isBlank()).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.DEPOSIT_PROTECTION, "R-DIPF-005", RuleType.SOFT,
                        hasProtocol ? RuleResult.PASS : RuleResult.FAIL,
                        hasProtocol ? "Deposit run-off protocol documented."
                                    : "Deposit run-off protocol not documented — DTMFI should describe how it manages sudden withdrawal requests.",
                        evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE: LIQUIDITY_MANAGEMENT (Commercial Bank only — Basel III)
        // ==========================================================
        private List<RuleEvaluationLog> evaluateLiquidityManagement(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType itype = resolveType(company);

                if (itype != InstitutionType.COMMERCIAL_BANK) {
                        logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-000", RuleType.SOFT,
                                RuleResult.PASS,
                                "Liquidity Management stage not applicable to " + itype + " institutions — automatically passed.",
                                evaluatedBy));
                        return logs;
                }

                var liqOpt = liquidityManagementRepository.findByCompanyId(companyId);

                // R-LIQ-001 (HARD): LCR ≥ 100% (Basel III minimum)
                boolean lcrOk = liqOpt.map(l -> l.getLiquidityCoverageRatio() != null
                        && l.getLiquidityCoverageRatio().compareTo(new BigDecimal("100")) >= 0).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-001", RuleType.HARD,
                        lcrOk ? RuleResult.PASS : RuleResult.FAIL,
                        liqOpt.map(l -> lcrOk
                                ? "LCR: " + (l.getLiquidityCoverageRatio() != null ? l.getLiquidityCoverageRatio() : "N/A") + "% — meets Basel III minimum of 100%."
                                : "LCR: " + (l.getLiquidityCoverageRatio() != null ? l.getLiquidityCoverageRatio() : "not computed") + "% — below Basel III minimum of 100%. Bank must increase HQLA or reduce cash outflows.")
                                .orElse("Liquidity Management data not submitted."),
                        evaluatedBy));

                // R-LIQ-002 (HARD): NSFR ≥ 100% (Basel III minimum)
                boolean nsfrOk = liqOpt.map(l -> l.getNetStableFundingRatio() != null
                        && l.getNetStableFundingRatio().compareTo(new BigDecimal("100")) >= 0).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-002", RuleType.HARD,
                        nsfrOk ? RuleResult.PASS : RuleResult.FAIL,
                        liqOpt.map(l -> nsfrOk
                                ? "NSFR: " + (l.getNetStableFundingRatio() != null ? l.getNetStableFundingRatio() : "N/A") + "% — meets Basel III minimum of 100%."
                                : "NSFR: " + (l.getNetStableFundingRatio() != null ? l.getNetStableFundingRatio() : "not computed") + "% — below Basel III minimum. Bank must increase stable funding sources.")
                                .orElse("Liquidity Management data not submitted."),
                        evaluatedBy));

                // R-LIQ-003 (SOFT): Traditional liquidity ratio ≥ 25%
                boolean liqRatioOk = liqOpt.map(l -> l.getLiquidityRatio() != null
                        && l.getLiquidityRatio().compareTo(new BigDecimal("25")) >= 0).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-003", RuleType.SOFT,
                        liqRatioOk ? RuleResult.PASS : RuleResult.FAIL,
                        liqOpt.map(l -> liqRatioOk
                                ? "Traditional liquidity ratio: " + l.getLiquidityRatio() + "% — adequate."
                                : "Traditional liquidity ratio: " + (l.getLiquidityRatio() != null ? l.getLiquidityRatio() : "N/A") + "% — RBZ recommends ≥ 25%.")
                                .orElse("Liquidity ratio not computed — submit liquidity data."),
                        evaluatedBy));

                // R-LIQ-004 (SOFT): Stress testing framework in place
                boolean hasStress = liqOpt.map(l -> Boolean.TRUE.equals(l.getHasStressTestingFramework())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-004", RuleType.SOFT,
                        hasStress ? RuleResult.PASS : RuleResult.FAIL,
                        hasStress ? "Liquidity stress testing framework confirmed."
                                  : "No stress testing framework declared — RBZ expects banks to regularly stress test liquidity positions.",
                        evaluatedBy));

                // R-LIQ-005 (HARD): Liquidity contingency plan documented
                boolean hasContingency = liqOpt.map(l -> l.getLiquidityContingencyPlan() != null
                        && !l.getLiquidityContingencyPlan().isBlank()).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.LIQUIDITY_MANAGEMENT, "R-LIQ-005", RuleType.HARD,
                        hasContingency ? RuleResult.PASS : RuleResult.FAIL,
                        hasContingency ? "Liquidity contingency plan documented."
                                       : "Liquidity contingency plan missing — banks must have a documented plan for managing a liquidity crisis.",
                        evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE: IT_CYBER_RISK (Commercial Bank only)
        // ==========================================================
        private List<RuleEvaluationLog> evaluateITCyberRisk(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType itype = resolveType(company);

                if (itype != InstitutionType.COMMERCIAL_BANK) {
                        logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-000", RuleType.SOFT,
                                RuleResult.PASS,
                                "IT & Cyber Risk stage not applicable to " + itype + " institutions — automatically passed.",
                                evaluatedBy));
                        return logs;
                }

                var itOpt = itCyberRiskRepository.findByCompanyId(companyId);

                // R-IT-001 (HARD): Board-approved IT policy
                boolean hasITPolicy = itOpt.map(it -> Boolean.TRUE.equals(it.getHasITPolicy())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-001", RuleType.HARD,
                        hasITPolicy ? RuleResult.PASS : RuleResult.FAIL,
                        hasITPolicy ? "Board-approved IT policy confirmed."
                                    : "Board-approved IT Policy is mandatory per RBZ IT Risk Management Guideline.",
                        evaluatedBy));

                // R-IT-002 (HARD): Cyber incident response plan
                boolean hasCyberPlan = itOpt.map(it -> Boolean.TRUE.equals(it.getHasCyberIncidentResponsePlan())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-002", RuleType.HARD,
                        hasCyberPlan ? RuleResult.PASS : RuleResult.FAIL,
                        hasCyberPlan ? "Cyber incident response plan confirmed."
                                     : "Cyber Incident Response Plan is mandatory for commercial banks.",
                        evaluatedBy));

                // R-IT-003 (HARD): Disaster Recovery Plan
                boolean hasDRP = itOpt.map(it -> Boolean.TRUE.equals(it.getHasDisasterRecoveryPlan())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-003", RuleType.HARD,
                        hasDRP ? RuleResult.PASS : RuleResult.FAIL,
                        hasDRP ? "Disaster Recovery Plan confirmed."
                               : "Disaster Recovery Plan (DRP) is mandatory for commercial banks.",
                        evaluatedBy));

                // R-IT-004 (HARD): Business Continuity Plan
                boolean hasBCP = itOpt.map(it -> Boolean.TRUE.equals(it.getHasBusinessContinuityPlan())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-004", RuleType.HARD,
                        hasBCP ? RuleResult.PASS : RuleResult.FAIL,
                        hasBCP ? "Business Continuity Plan confirmed."
                               : "Business Continuity Plan (BCP) is mandatory for commercial banks.",
                        evaluatedBy));

                // R-IT-005 (SOFT): DR testing frequency ≥ quarterly
                String drFreq = itOpt.map(ITCyberRisk::getDrTestingFrequency).orElse(null);
                boolean drFreqOk = "MONTHLY".equals(drFreq) || "QUARTERLY".equals(drFreq);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-005", RuleType.SOFT,
                        drFreqOk ? RuleResult.PASS : RuleResult.FAIL,
                        drFreqOk ? "DR testing frequency (" + drFreq + ") meets quarterly minimum."
                                 : "RBZ recommends DR tests at least quarterly. Current frequency: " + (drFreq != null ? drFreq : "not specified") + ".",
                        evaluatedBy));

                // R-IT-006 (SOFT): Penetration testing within last 12 months
                boolean hasPenTest = itOpt.map(it -> it.getLastPenetrationTestDate() != null
                        && it.getLastPenetrationTestDate().isAfter(java.time.LocalDate.now().minusYears(1))).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-006", RuleType.SOFT,
                        hasPenTest ? RuleResult.PASS : RuleResult.FAIL,
                        hasPenTest ? "Penetration testing conducted within the last 12 months."
                                   : "No penetration test within the last 12 months — RBZ recommends annual pen testing by an independent firm.",
                        evaluatedBy));

                // R-IT-007 (SOFT): Data residency in Zimbabwe
                boolean dataInZim = itOpt.map(it -> Boolean.TRUE.equals(it.getDataResidencyZimbabwe())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.IT_CYBER_RISK, "R-IT-007", RuleType.SOFT,
                        dataInZim ? RuleResult.PASS : RuleResult.FAIL,
                        dataInZim ? "Core data confirmed as resident in Zimbabwe."
                                  : "Data not confirmed as resident in Zimbabwe — consider RBZ data localisation requirements.",
                        evaluatedBy));

                return logs;
        }

        // ==========================================================
        // STAGE: RECOVERY_RESOLUTION (Commercial Bank only)
        // ==========================================================
        private List<RuleEvaluationLog> evaluateRecoveryResolution(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> logs = new ArrayList<>();
                CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
                InstitutionType itype = resolveType(company);

                if (itype != InstitutionType.COMMERCIAL_BANK) {
                        logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-000", RuleType.SOFT,
                                RuleResult.PASS,
                                "Recovery & Resolution stage not applicable to " + itype + " institutions — automatically passed.",
                                evaluatedBy));
                        return logs;
                }

                var rrOpt = recoveryResolutionRepository.findByCompanyId(companyId);

                // R-RRP-001 (HARD): Board-approved recovery plan
                boolean hasRP = rrOpt.map(rr -> Boolean.TRUE.equals(rr.getHasRecoveryPlan())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-001", RuleType.HARD,
                        hasRP ? RuleResult.PASS : RuleResult.FAIL,
                        hasRP ? "Board-approved Recovery Plan confirmed."
                              : "Recovery Plan approved by the Board is mandatory for commercial banks (FSB/RBZ requirement).",
                        evaluatedBy));

                // R-RRP-002 (HARD): Crisis management framework
                boolean hasCMF = rrOpt.map(rr -> Boolean.TRUE.equals(rr.getHasCrisisManagementFramework())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-002", RuleType.HARD,
                        hasCMF ? RuleResult.PASS : RuleResult.FAIL,
                        hasCMF ? "Crisis Management Framework confirmed."
                               : "Crisis Management Framework is mandatory for commercial banks.",
                        evaluatedBy));

                // R-RRP-003 (SOFT): Capital & liquidity triggers defined
                boolean hasTriggers = rrOpt.map(rr ->
                        (rr.getCapitalTriggers() != null && !rr.getCapitalTriggers().isBlank()) ||
                        (rr.getLiquidityTriggers() != null && !rr.getLiquidityTriggers().isBlank())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-003", RuleType.SOFT,
                        hasTriggers ? RuleResult.PASS : RuleResult.FAIL,
                        hasTriggers ? "Recovery triggers (capital and/or liquidity) documented."
                                    : "Recovery triggers not documented — bank should specify at what point recovery actions are activated.",
                        evaluatedBy));

                // R-RRP-004 (SOFT): Recovery options described
                boolean hasOptions = rrOpt.map(rr ->
                        (rr.getRecapitalisationOptions() != null && !rr.getRecapitalisationOptions().isBlank()) ||
                        (rr.getAssetDisposalOptions() != null && !rr.getAssetDisposalOptions().isBlank())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-004", RuleType.SOFT,
                        hasOptions ? RuleResult.PASS : RuleResult.FAIL,
                        hasOptions ? "Recovery options (recapitalisation / asset disposal) documented."
                                   : "Recovery options not documented — describe how the bank would restore viability.",
                        evaluatedBy));

                // R-RRP-005 (SOFT): RBZ resolution authority notified
                boolean notified = rrOpt.map(rr -> Boolean.TRUE.equals(rr.getResolutionAuthorityNotified())).orElse(false);
                logs.add(createLog(companyId, ApplicationStage.RECOVERY_RESOLUTION, "R-RRP-005", RuleType.SOFT,
                        notified ? RuleResult.PASS : RuleResult.FAIL,
                        notified ? "RBZ resolution authority has been notified of the recovery plan."
                                 : "RBZ resolution authority notification pending — notify before license issuance.",
                        evaluatedBy));

                return logs;
        }

        @Transactional
        public List<RuleEvaluationLog> evaluateAllStages(Long companyId, String evaluatedBy) {
                List<RuleEvaluationLog> allResults = new ArrayList<>();
                for (ApplicationStage stage : ApplicationStage.values()) {
                        allResults.addAll(evaluateStage(companyId, stage, evaluatedBy));
                }
                return allResults;
        }

        // ==========================================================
        // HELPER — resolve InstitutionType from enum or legacy licenseType string
        // ==========================================================
        private InstitutionType resolveType(CompanyProfile company) {
                if (company == null) return InstitutionType.MFI;
                if (company.getInstitutionType() != null) return company.getInstitutionType();
                String lt = company.getLicenseType() != null ? company.getLicenseType().toLowerCase() : "";
                if (lt.contains("bank")) return InstitutionType.COMMERCIAL_BANK;
                if (lt.contains("deposit")) return InstitutionType.DTMFI;
                return InstitutionType.MFI;
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
