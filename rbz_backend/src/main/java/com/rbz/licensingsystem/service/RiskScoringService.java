package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.model.enums.InstitutionType;
import com.rbz.licensingsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskScoringService {

    private final CompanyProfileRepository companyProfileRepository;
    private final CapitalStructureRepository capitalStructureRepository;
    private final DirectorRepository directorRepository;
    private final ShareholderRepository shareholderRepository;
    private final CompanyDocumentRepository documentRepository;
    private final FinancialProjectionRepository projectionRepository;
    private final CompanyProductRepository productRepository;
    private final CapitalAdequacyReturnRepository capitalAdequacyReturnRepository;
    private final DepositProtectionRepository depositProtectionRepository;
    private final LiquidityManagementRepository liquidityManagementRepository;
    private final ITCyberRiskRepository itCyberRiskRepository;

    /**
     * Calculates a risk score from 0-100 (100 = lowest risk, 0 = highest risk).
     * Returns a map with score, category, and breakdown.
     */
    @SuppressWarnings("null")
    @Transactional(readOnly = true)
    public Map<String, Object> scoreApplication(Long companyId) {
        CompanyProfile company = companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));

        Map<String, Object> breakdown = new HashMap<>();
        int total = 0;

        InstitutionType itype = resolveType(company);

        // Weights differ by institution type (always sum to 100)
        // MFI:   capital=30, directors=25, docs=20, ownership=15, biz=10
        // DTMFI: capital=25, directors=20, docs=15, ownership=10, biz=10, dipf=20
        // Bank:  capital=20, directors=15, docs=10, ownership=10, biz=5,  car=15, liquidity=15, it=10

        // --- 1. Capital (weight by type) ---
        int capitalScore = scoreCapital(companyId, company, breakdown, itype);
        total += capitalScore;

        // --- 2. Director Risk ---
        int directorScore = scoreDirectors(companyId, breakdown, itype);
        total += directorScore;

        // --- 3. Document Completeness ---
        int docScore = scoreDocuments(companyId, company, breakdown, itype);
        total += docScore;

        // --- 4. Ownership Structure ---
        int ownershipScore = scoreOwnership(companyId, breakdown, itype);
        total += ownershipScore;

        // --- 5. Business Plan Viability ---
        int businessScore = scoreBusinessPlan(companyId, breakdown, itype);
        total += businessScore;

        // --- 6. DTMFI: Deposit Protection (DIPF) score ---
        if (itype == InstitutionType.DTMFI) {
            int dipfScore = scoreDIPF(companyId, breakdown);
            total += dipfScore;
        }

        // --- 7. Bank: CAR compliance ---
        if (itype == InstitutionType.COMMERCIAL_BANK) {
            int carScore = scoreCARCompliance(companyId, breakdown);
            total += carScore;
            int liqScore = scoreLiquidityCompliance(companyId, breakdown);
            total += liqScore;
            int itScore = scoreITCyberReadiness(companyId, breakdown);
            total += itScore;
        }

        String category = riskCategory(total);
        log.info("Risk score for company {}: {}/100 — {}", companyId, total, category);

        Map<String, Object> result = new HashMap<>();
        result.put("companyId", companyId);
        result.put("companyName", company.getCompanyName());
        result.put("score", total);
        result.put("category", category);
        result.put("breakdown", breakdown);
        result.put("recommendation", scoreRecommendation(total));

        return result;
    }

    @SuppressWarnings("null")
    @Transactional
    public void saveScore(Long companyId) {
        Map<String, Object> result = scoreApplication(companyId);
        companyProfileRepository.findById(companyId).ifPresent(company -> {
            company.setRiskScore((Integer) result.get("score"));
            company.setRiskCategory((String) result.get("category"));
            companyProfileRepository.save(company);
        });
    }

    // ---- Scoring sub-methods ----

    private int scoreCapital(Long companyId, CompanyProfile company, Map<String, Object> breakdown, InstitutionType itype) {
        int maxScore = itype == InstitutionType.COMMERCIAL_BANK ? 20 : itype == InstitutionType.DTMFI ? 25 : 30;
        var capitalOpt = capitalStructureRepository.findByCompanyId(companyId);
        if (capitalOpt.isEmpty()) {
            breakdown.put("capital", Map.of("score", 0, "max", maxScore, "note", "No capital structure submitted"));
            return 0;
        }
        BigDecimal paidUp = capitalOpt.get().getTotalIssuedAndPaidUpCapital();
        if (paidUp == null) paidUp = BigDecimal.ZERO;

        BigDecimal minimum = switch (itype) {
            case COMMERCIAL_BANK -> new BigDecimal("30000000");
            case DTMFI -> new BigDecimal("25000");
            default -> new BigDecimal("5000");
        };
        double ratio = paidUp.doubleValue() / minimum.doubleValue();

        int score;
        String note;
        if (ratio >= 3.0)      { score = maxScore;       note = "Capital is 300%+ of minimum — excellent"; }
        else if (ratio >= 2.0) { score = (int)(maxScore * 0.8); note = "Capital is 200%+ of minimum — strong"; }
        else if (ratio >= 1.5) { score = (int)(maxScore * 0.6); note = "Capital is 150%+ of minimum — adequate"; }
        else if (ratio >= 1.0) { score = (int)(maxScore * 0.4); note = "Capital meets minimum threshold only — marginal"; }
        else                   { score = 0;               note = "Capital is below minimum threshold — FAIL"; }

        breakdown.put("capital", Map.of("score", score, "max", maxScore, "paidUp", paidUp, "minimum", minimum, "note", note));
        return score;
    }

    private int scoreDirectors(Long companyId, Map<String, Object> breakdown, InstitutionType itype) {
        int maxScore = itype == InstitutionType.COMMERCIAL_BANK ? 15 : itype == InstitutionType.DTMFI ? 20 : 25;
        List<Director> directors = directorRepository.findByCompanyId(companyId);
        if (directors.isEmpty()) {
            breakdown.put("directors", Map.of("score", 0, "max", maxScore, "note", "No directors submitted"));
            return 0;
        }
        long flagged = directors.stream().filter(Director::isRiskFlag).count();
        long policeCleared = directors.stream()
                .filter(d -> "YES".equalsIgnoreCase(d.getPoliceClearanceSubmitted())).count();
        long fitProper = directors.stream()
                .filter(d -> "YES".equalsIgnoreCase(d.getProbityFormSubmitted())).count();

        int score = maxScore;
        double penaltyRatio = (double) maxScore / 25.0; // scale penalties with max
        score -= (int)(flagged * 8 * penaltyRatio);
        score -= (int)((directors.size() - policeCleared) * 3 * penaltyRatio);
        score -= (int)((directors.size() - fitProper) * 3 * penaltyRatio);
        score = Math.max(0, score);

        breakdown.put("directors", Map.of("score", score, "max", maxScore, "total", directors.size(),
                "flagged", flagged, "policeCleared", policeCleared, "fitProper", fitProper));
        return score;
    }

    private int scoreDocuments(Long companyId, CompanyProfile company, Map<String, Object> breakdown, InstitutionType itype) {
        int maxScore = itype == InstitutionType.COMMERCIAL_BANK ? 10 : itype == InstitutionType.DTMFI ? 15 : 20;
        List<CompanyDocument> docs = documentRepository.findByCompanyId(companyId);
        int required = switch (itype) {
            case COMMERCIAL_BANK -> 9; // base 7 + AML/CFT + ERM
            case DTMFI -> 8;           // base 7 + AML/CFT
            default -> 5;
        };
        int submitted = Math.min(docs.size(), required);
        int score = (int)((submitted / (double) required) * maxScore);

        breakdown.put("documents", Map.of("score", score, "max", maxScore, "submitted", submitted, "required", required));
        return score;
    }

    private int scoreOwnership(Long companyId, Map<String, Object> breakdown, InstitutionType itype) {
        int maxScore = itype == InstitutionType.COMMERCIAL_BANK ? 10 : 15;
        List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
        if (shareholders.isEmpty()) {
            breakdown.put("ownership", Map.of("score", 0, "max", maxScore, "note", "No shareholders submitted"));
            return 0;
        }
        double total = shareholders.stream()
                .mapToDouble(s -> s.getOwnershipPercentage() != null ? s.getOwnershipPercentage() : 0).sum();
        boolean balanced = Math.abs(total - 100.0) < 0.01;
        boolean noConcentration = shareholders.stream()
                .noneMatch(s -> s.getOwnershipPercentage() != null && s.getOwnershipPercentage() > 50);
        long amlFlagged = shareholders.stream()
                .filter(s -> "NO".equalsIgnoreCase(s.getAmlCftCompliant())).count();

        int score = 0;
        int third = maxScore / 3;
        if (balanced) score += third;
        if (noConcentration) score += third;
        score += Math.max(0, (maxScore - 2 * third) - (int)(amlFlagged * 3));

        breakdown.put("ownership", Map.of("score", score, "max", maxScore, "balanced", balanced,
                "noConcentration", noConcentration, "amlFlagged", amlFlagged));
        return score;
    }

    private int scoreBusinessPlan(Long companyId, Map<String, Object> breakdown, InstitutionType itype) {
        int maxScore = itype == InstitutionType.COMMERCIAL_BANK ? 5 : 10;
        List<FinancialProjection> projections = projectionRepository.findByCompanyId(companyId);
        List<CompanyProduct> products = productRepository.findByCompanyId(companyId);
        int score = 0;
        if (projections.size() >= 3) score += maxScore / 2;
        else if (projections.size() >= 1) score += maxScore / 4;
        if (!products.isEmpty()) score += maxScore / 2;

        breakdown.put("businessPlan", Map.of("score", score, "max", maxScore,
                "projectionYears", projections.size(), "productsDefined", products.size()));
        return score;
    }

    // DTMFI-specific: Deposit Insurance & Protection Fund (20 points)
    private int scoreDIPF(Long companyId, Map<String, Object> breakdown) {
        var dipfOpt = depositProtectionRepository.findByCompanyId(companyId);
        if (dipfOpt.isEmpty()) {
            breakdown.put("depositProtection", Map.of("score", 0, "max", 20, "note", "No DIPF data submitted"));
            return 0;
        }
        DepositProtection d = dipfOpt.get();
        int score = 0;
        String status = d.getDipfRegistrationStatus();
        if ("REGISTERED".equals(status)) score += 10;
        else if ("PENDING".equals(status)) score += 5;

        if (Boolean.TRUE.equals(d.getDepositInsurancePremiumPaid())) score += 5;

        if (d.getLiquidityBufferRatio() != null
                && d.getLiquidityBufferRatio().compareTo(new BigDecimal("10")) >= 0) score += 5;

        breakdown.put("depositProtection", Map.of("score", score, "max", 20,
                "dipfStatus", status != null ? status : "N/A",
                "premiumPaid", d.getDepositInsurancePremiumPaid() != null && d.getDepositInsurancePremiumPaid(),
                "liquidityBufferRatio", d.getLiquidityBufferRatio() != null ? d.getLiquidityBufferRatio() : "N/A"));
        return score;
    }

    // Bank-specific: Capital Adequacy Ratio compliance (15 points)
    private int scoreCARCompliance(Long companyId, Map<String, Object> breakdown) {
        var carOpt = capitalAdequacyReturnRepository.findByCompanyId(companyId);
        if (carOpt.isEmpty()) {
            breakdown.put("carCompliance", Map.of("score", 0, "max", 15, "note", "No CAR data submitted"));
            return 0;
        }
        CapitalAdequacyReturn car = carOpt.get();
        int score = 0;
        BigDecimal ratio = car.getCapitalAdequacyRatio();
        if (ratio != null) {
            if (ratio.compareTo(new BigDecimal("15")) >= 0)      score = 15; // well above minimum
            else if (ratio.compareTo(new BigDecimal("12")) >= 0) score = 10; // meets minimum
            else if (ratio.compareTo(new BigDecimal("8")) >= 0)  score = 5;  // below RBZ min but above FSB
            // below 8%: 0 points
        }
        breakdown.put("carCompliance", Map.of("score", score, "max", 15,
                "car", ratio != null ? ratio : "N/A",
                "tier1", car.getTier1Ratio() != null ? car.getTier1Ratio() : "N/A"));
        return score;
    }

    // Bank-specific: Liquidity (LCR/NSFR) compliance (15 points)
    private int scoreLiquidityCompliance(Long companyId, Map<String, Object> breakdown) {
        var liqOpt = liquidityManagementRepository.findByCompanyId(companyId);
        if (liqOpt.isEmpty()) {
            breakdown.put("liquidityCompliance", Map.of("score", 0, "max", 15, "note", "No liquidity data submitted"));
            return 0;
        }
        LiquidityManagement l = liqOpt.get();
        int score = 0;
        BigDecimal lcr = l.getLiquidityCoverageRatio();
        BigDecimal nsfr = l.getNetStableFundingRatio();
        if (lcr != null && lcr.compareTo(new BigDecimal("120")) >= 0) score += 8;
        else if (lcr != null && lcr.compareTo(new BigDecimal("100")) >= 0) score += 5;
        if (nsfr != null && nsfr.compareTo(new BigDecimal("110")) >= 0) score += 7;
        else if (nsfr != null && nsfr.compareTo(new BigDecimal("100")) >= 0) score += 4;

        breakdown.put("liquidityCompliance", Map.of("score", score, "max", 15,
                "lcr", lcr != null ? lcr : "N/A",
                "nsfr", nsfr != null ? nsfr : "N/A"));
        return score;
    }

    // Bank-specific: IT & Cyber Risk readiness (10 points)
    private int scoreITCyberReadiness(Long companyId, Map<String, Object> breakdown) {
        var itOpt = itCyberRiskRepository.findByCompanyId(companyId);
        if (itOpt.isEmpty()) {
            breakdown.put("itCyberRisk", Map.of("score", 0, "max", 10, "note", "No IT/Cyber data submitted"));
            return 0;
        }
        ITCyberRisk it = itOpt.get();
        int score = 0;
        if (Boolean.TRUE.equals(it.getHasITPolicy())) score += 2;
        if (Boolean.TRUE.equals(it.getHasCyberIncidentResponsePlan())) score += 2;
        if (Boolean.TRUE.equals(it.getHasDisasterRecoveryPlan())) score += 2;
        if (Boolean.TRUE.equals(it.getHasBusinessContinuityPlan())) score += 2;
        if (it.getLastPenetrationTestDate() != null
                && it.getLastPenetrationTestDate().isAfter(java.time.LocalDate.now().minusYears(1))) score += 2;

        breakdown.put("itCyberRisk", Map.of("score", score, "max", 10,
                "hasITPolicy", it.getHasITPolicy() != null && it.getHasITPolicy(),
                "hasCyberPlan", it.getHasCyberIncidentResponsePlan() != null && it.getHasCyberIncidentResponsePlan(),
                "hasDRP", it.getHasDisasterRecoveryPlan() != null && it.getHasDisasterRecoveryPlan()));
        return score;
    }

    private InstitutionType resolveType(CompanyProfile company) {
        if (company.getInstitutionType() != null) return company.getInstitutionType();
        String lt = company.getLicenseType() != null ? company.getLicenseType().toLowerCase() : "";
        if (lt.contains("bank")) return InstitutionType.COMMERCIAL_BANK;
        if (lt.contains("deposit")) return InstitutionType.DTMFI;
        return InstitutionType.MFI;
    }

    private String riskCategory(int score) {
        if (score >= 80) return "LOW";
        if (score >= 60) return "MEDIUM";
        if (score >= 40) return "HIGH";
        return "CRITICAL";
    }

    private String scoreRecommendation(int score) {
        if (score >= 80) return "Application appears sound. Proceed with full review.";
        if (score >= 60) return "Moderate risk identified. Examiner should scrutinise capital and director sections.";
        if (score >= 40) return "High risk. Flag for Senior Examiner attention before proceeding.";
        return "Critical risk indicators present. Senior Examiner must review before any further processing.";
    }
}
