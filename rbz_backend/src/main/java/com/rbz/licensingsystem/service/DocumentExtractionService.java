package com.rbz.licensingsystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.repository.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
@SuppressWarnings("null")
public class DocumentExtractionService {

    @Autowired private CapitalStructureRepository capitalStructureRepo;
    @Autowired private FinancialPerformanceRepository financialPerformanceRepo;
    @Autowired private LoanDistributionRepository loanDistributionRepo;
    @Autowired private ProductsAndServicesRepository productsServicesRepo;
    @Autowired private FinancialAssumptionsRepository financialAssumptionsRepo;
    @Autowired private ComplianceDocumentationRepository complianceRepo;
    @Autowired private GrowthAndDevelopmentRepository growthRepo;
    @Autowired private CompanyProfileRepository companyProfileRepo;
    @Autowired private CompanyDocumentRepository companyDocumentRepo;
    @Autowired private FileSecurityHelper fileSecurity;
    @Autowired private CompanyAccessService companyAccess;

    @Value("${ai.service.url:http://localhost:8000}")
    private String AI_SERVICE_URL;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String DOCUMENT_UPLOAD_DIR = "uploads/documents/";

    // Verification statuses
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_VERIFIED = "VERIFIED";
    private static final String STATUS_MANUAL_REVIEW = "MANUAL_REVIEW";
    private static final String STATUS_FAILED = "FAILED";

    /* ============================================================
     * Per-document-type extraction entry points
     * ============================================================ */

    /** Bundle of the persisted document record and the raw AI response, so callers
     *  can do downstream entity mapping without re-querying the AI service. */
    public record ScanResult(CompanyDocument document, Map<String, Object> aiResponse) {}

    public Map<String, Object> extractFinancialStatements(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "financialStatements", "financial_statements");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        if (aiResponse.containsKey("capitalStructure")) {
            CapitalStructure capital = parseCapitalStructure(aiResponse.get("capitalStructure"), companyId);
            capitalStructureRepo.save(capital);
        }
        if (aiResponse.containsKey("financialPerformance")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> performances = (List<Map<String, Object>>) aiResponse.get("financialPerformance");
            for (Map<String, Object> perfData : performances) {
                financialPerformanceRepo.save(parseFinancialPerformance(perfData, companyId));
            }
        }
        return buildResult(doc, aiResponse, "Financial Statements processed");
    }

    public Map<String, Object> extractBusinessPlan(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "businessPlan", "business_plan");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        if (aiResponse.containsKey("products")) {
            productsServicesRepo.save(parseProductsAndServices(aiResponse.get("products"), companyId));
        }
        if (aiResponse.containsKey("assumptions")) {
            financialAssumptionsRepo.save(parseFinancialAssumptions(aiResponse.get("assumptions"), companyId));
        }
        if (aiResponse.containsKey("growth")) {
            growthRepo.save(parseGrowthAndDevelopment(aiResponse.get("growth"), companyId));
        }
        return buildResult(doc, aiResponse, "Business Plan processed");
    }

    public Map<String, Object> extractPortfolioReport(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "portfolioReport", "portfolio_report");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        if (aiResponse.containsKey("loanDistribution")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> distributions = (List<Map<String, Object>>) aiResponse.get("loanDistribution");
            for (Map<String, Object> distData : distributions) {
                loanDistributionRepo.save(parseLoanDistribution(distData, companyId));
            }
        }
        return buildResult(doc, aiResponse, "Portfolio Report processed");
    }

    public Map<String, Object> verifyCreditPolicy(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "creditPolicy", "policy_verification");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                .orElse(new ComplianceDocumentation());
        compliance.setCompanyId(companyId);
        compliance.setHasCreditPolicyManual("YES");
        compliance.setPolicyManualAssessment(stringValue(aiResponse, "assessment", aiResponse.getOrDefault("reason", "").toString()));
        complianceRepo.save(compliance);

        return buildResult(doc, aiResponse, "Credit Policy processed");
    }

    public Map<String, Object> verifyOperationalManual(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "operationalManual", "policy_verification");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                .orElse(new ComplianceDocumentation());
        compliance.setCompanyId(companyId);
        compliance.setHasOperationalPolicyManual("YES");
        complianceRepo.save(compliance);

        return buildResult(doc, aiResponse, "Operational Manual processed");
    }

    public Map<String, Object> extractTaxClearance(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "taxClearance", "tax_clearance");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                .orElse(new ComplianceDocumentation());
        compliance.setCompanyId(companyId);
        compliance.setHasTaxClearanceCertificate("YES");

        if (aiResponse.containsKey("extracted_data")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) aiResponse.get("extracted_data");
            if (data.containsKey("certificate_number")) {
                compliance.setTaxClearanceCertificateNumber(String.valueOf(data.get("certificate_number")));
            }
            if (data.containsKey("expiry_date")) {
                compliance.setTaxClearanceExpiryDate(String.valueOf(data.get("expiry_date")));
            }
            if (data.containsKey("issue_date")) {
                compliance.setTaxClearanceIssuedDate(String.valueOf(data.get("issue_date")));
            }
        } else if (aiResponse.containsKey("expiryDate")) {
            compliance.setTaxClearanceExpiryDate(String.valueOf(aiResponse.get("expiryDate")));
        }
        complianceRepo.save(compliance);

        return buildResult(doc, aiResponse, "Tax Clearance processed");
    }

    public Map<String, Object> extractInsurancePolicy(MultipartFile file, Long companyId) throws Exception {
        ScanResult scan = persistAndScan(file, companyId, "insurancePolicy", "insurance_policy");
        CompanyDocument doc = scan.document();
        Map<String, Object> aiResponse = scan.aiResponse();

        ProductsAndServices products = productsServicesRepo.findByCompanyId(companyId)
                .orElse(new ProductsAndServices());
        if (products.getCompanyId() == null) products.setCompanyId(companyId);
        productsServicesRepo.save(products);

        return buildResult(doc, aiResponse, "Insurance Policy processed");
    }

    public Map<String, String> getExtractionStatus(Long companyId) {
        Map<String, String> status = new HashMap<>();
        status.put("capitalStructure",
                capitalStructureRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        status.put("financialPerformance",
                !financialPerformanceRepo.findByCompanyId(companyId).isEmpty() ? "completed" : "pending");
        status.put("productsAndServices",
                productsServicesRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        status.put("compliance",
                complianceRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        return status;
    }

    /* ============================================================
     * Core: validate, persist to disk, hash, call AI, write result
     * ============================================================ */

    /**
     * Validates the upload, persists it under uploads/documents/ with a sanitized
     * filename, computes its SHA-256, calls the AI service, and writes the
     * verification verdict back onto the CompanyDocument record.
     */
    private ScanResult persistAndScan(MultipartFile file, Long companyId, String documentType, String aiDocType) throws Exception {
        if (companyId == null) {
            throw new IllegalArgumentException("companyId is required");
        }
        // 1. Security validation (size, extension, magic bytes)
        fileSecurity.validate(file);

        // 2. Compute hash and check for an exact-content prior upload of the same type
        byte[] bytes = file.getBytes();
        String sha = fileSecurity.sha256(bytes);

        Optional<CompanyDocument> identical =
                companyDocumentRepo.findByCompanyIdAndSha256(companyId, sha);
        if (identical.isPresent() && documentType.equals(identical.get().getDocumentType())) {
            // Same bytes already on file for this doc type - return without re-running AI
            return new ScanResult(identical.get(), emptyAi("Identical file already on record."));
        }

        // 3. Sanitize filename and persist under uploads/documents/
        String safeOriginal = fileSecurity.sanitizeFilename(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + "_" + safeOriginal;

        File uploadDir = new File(DOCUMENT_UPLOAD_DIR);
        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            throw new IllegalStateException("Could not create upload directory");
        }
        Path dest = Paths.get(DOCUMENT_UPLOAD_DIR, storedName).normalize();
        // Defence-in-depth: ensure normalized path stays inside the upload dir
        if (!dest.toAbsolutePath().startsWith(Paths.get(DOCUMENT_UPLOAD_DIR).toAbsolutePath())) {
            throw new IllegalStateException("Invalid storage path resolved");
        }
        Files.write(dest, bytes);

        // 4. Determine version (next version number for this companyId+documentType)
        int nextVersion = companyDocumentRepo
                .findFirstByCompanyIdAndDocumentTypeOrderByVersionDesc(companyId, documentType)
                .map(d -> (d.getVersion() == null ? 1 : d.getVersion()) + 1)
                .orElse(1);

        // 5. Persist CompanyDocument record (PENDING until AI returns)
        CompanyDocument doc = new CompanyDocument();
        doc.setCompanyId(companyId);
        doc.setDocumentType(documentType);
        doc.setFileName(safeOriginal);
        doc.setFilePath(dest.toString());
        doc.setContentType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setSha256(sha);
        doc.setVersion(nextVersion);
        doc.setVerificationStatus(STATUS_PENDING);
        doc.setUploadedBy(companyAccess.currentPrincipalName());
        companyDocumentRepo.save(doc);

        // 6. Call AI and write status back
        Map<String, Object> aiResponse;
        try {
            aiResponse = callAIService(dest.toFile(), aiDocType, companyId);
        } catch (Exception e) {
            aiResponse = manualReviewResponse("AI service call failed: " + e.getMessage());
        }
        applyAiVerdict(doc, aiResponse);
        companyDocumentRepo.save(doc);

        return new ScanResult(doc, aiResponse);
    }

    /** Maps an AI response to a verificationStatus, aiReason, aiConfidence on the document. */
    private void applyAiVerdict(CompanyDocument doc, Map<String, Object> aiResponse) {
        Object validVal = aiResponse.get("valid");
        Object needsManualVal = aiResponse.get("needs_manual_review");
        boolean valid = Boolean.TRUE.equals(validVal);
        boolean needsManual = Boolean.TRUE.equals(needsManualVal);

        String reason = aiResponse.get("reason") != null
                ? String.valueOf(aiResponse.get("reason"))
                : null;

        if (needsManual) {
            doc.setVerificationStatus(STATUS_MANUAL_REVIEW);
        } else if (valid) {
            doc.setVerificationStatus(STATUS_VERIFIED);
            doc.setVerifiedAt(LocalDateTime.now());
            doc.setVerifiedBy("AI:rbz_ai");
        } else {
            doc.setVerificationStatus(STATUS_FAILED);
        }

        if (reason != null && reason.length() > 1000) {
            reason = reason.substring(0, 1000);
        }
        doc.setAiReason(reason);

        Object conf = aiResponse.get("confidence");
        if (conf instanceof Number) {
            doc.setAiConfidence(((Number) conf).doubleValue());
        }
    }

    private Map<String, Object> buildResult(CompanyDocument doc, Map<String, Object> aiResponse, String summary) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", !STATUS_FAILED.equals(doc.getVerificationStatus()));
        result.put("documentId", doc.getId());
        result.put("verificationStatus", doc.getVerificationStatus());
        result.put("aiReason", doc.getAiReason());
        result.put("sha256", doc.getSha256());
        result.put("version", doc.getVersion());
        result.put("summary", summary);
        result.put("extractedData", aiResponse);
        return result;
    }

    /* ============================================================
     * AI service caller (no silent auto-approve on failure)
     * ============================================================ */

    private Map<String, Object> callAIService(File file, String documentType, Long companyId) {
        String url = AI_SERVICE_URL + "/verify-document";

        String entityName = "Company";
        if (companyId != null) {
            entityName = companyProfileRepo.findById(companyId)
                    .map(CompanyProfile::getCompanyName)
                    .orElse("Company");
        }

        org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        body.add("file", new org.springframework.core.io.FileSystemResource(file));
        body.add("doc_type", documentType);
        body.add("director_name", entityName);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            @SuppressWarnings("unchecked")
            Map<String, Object> parsed = objectMapper.readValue(response.getBody(), Map.class);
            return parsed;
        } catch (Exception e) {
            // Do NOT silently auto-approve. Route to manual review.
            return manualReviewResponse("AI service unreachable: " + e.getMessage());
        }
    }

    private Map<String, Object> manualReviewResponse(String reason) {
        Map<String, Object> r = new HashMap<>();
        r.put("valid", false);
        r.put("needs_manual_review", true);
        r.put("reason", reason);
        r.put("extracted_data", new HashMap<>());
        return r;
    }

    private Map<String, Object> emptyAi(String reason) {
        Map<String, Object> r = new HashMap<>();
        r.put("valid", true);
        r.put("reason", reason);
        return r;
    }

    private String stringValue(Map<String, Object> m, String key, String fallback) {
        Object v = m.get(key);
        return v == null ? fallback : String.valueOf(v);
    }

    /* ============================================================
     * Field-extraction parsers — map AI structured output onto
     * entity fields. Parsers are deliberately lenient: any field
     * the model cannot supply is left null, and the user can edit
     * the entity later in the wizard.
     * ============================================================ */

    @SuppressWarnings("unchecked")
    private CapitalStructure parseCapitalStructure(Object data, Long companyId) {
        CapitalStructure capital = capitalStructureRepo.findByCompanyId(companyId)
                .orElseGet(CapitalStructure::new);
        capital.setCompanyId(companyId);
        if (!(data instanceof Map)) return capital;
        Map<String, Object> m = (Map<String, Object>) data;

        if (m.get("totalIssuedAndPaidUpCapital") != null)
            capital.setTotalIssuedAndPaidUpCapital(toBigDecimal(m.get("totalIssuedAndPaidUpCapital")));
        if (m.get("totalShareholdersEquity") != null)
            capital.setTotalShareholdersEquity(toBigDecimal(m.get("totalShareholdersEquity")));
        if (m.get("retainedEarningsCurrentYear") != null)
            capital.setRetainedEarningsCurrentYear(toBigDecimal(m.get("retainedEarningsCurrentYear")));
        if (m.get("numberOfAuthorisedShares") != null)
            capital.setNumberOfAuthorisedShares(toInteger(m.get("numberOfAuthorisedShares")));
        if (m.get("totalIssuedShares") != null)
            capital.setTotalIssuedShares(toInteger(m.get("totalIssuedShares")));
        if (m.get("parValuePerShare") != null)
            capital.setParValuePerShare(toBigDecimal(m.get("parValuePerShare")));
        return capital;
    }

    private FinancialPerformance parseFinancialPerformance(Map<String, Object> data, Long companyId) {
        Integer year = toInteger(data.get("financialYear"));
        // If a record already exists for this year, update it; else new.
        FinancialPerformance perf = null;
        if (year != null) {
            for (FinancialPerformance existing : financialPerformanceRepo.findByCompanyId(companyId)) {
                if (year.equals(existing.getFinancialYear())) { perf = existing; break; }
            }
        }
        if (perf == null) perf = new FinancialPerformance();
        perf.setCompanyId(companyId);
        if (year != null) perf.setFinancialYear(year);
        if (data.get("periodType") != null) perf.setPeriodType(String.valueOf(data.get("periodType")));
        if (data.get("audited") != null)    perf.setAudited(String.valueOf(data.get("audited")));
        if (data.get("totalIncome") != null)    perf.setTotalIncome(toBigDecimal(data.get("totalIncome")));
        if (data.get("totalCost") != null)      perf.setTotalCost(toBigDecimal(data.get("totalCost")));
        if (data.get("profitAfterTax") != null) perf.setProfitAfterTax(toBigDecimal(data.get("profitAfterTax")));
        if (data.get("totalAssets") != null)    perf.setTotalAssets(toBigDecimal(data.get("totalAssets")));
        if (data.get("totalEquity") != null)    perf.setTotalEquity(toBigDecimal(data.get("totalEquity")));
        if (data.get("parRatio") != null)         perf.setParRatio(toDouble(data.get("parRatio")));
        if (data.get("returnOnEquity") != null)   perf.setReturnOnEquity(toDouble(data.get("returnOnEquity")));
        if (data.get("returnOnAssets") != null)   perf.setReturnOnAssets(toDouble(data.get("returnOnAssets")));
        return perf;
    }

    @SuppressWarnings("unchecked")
    private ProductsAndServices parseProductsAndServices(Object data, Long companyId) {
        ProductsAndServices products = productsServicesRepo.findByCompanyId(companyId)
                .orElseGet(ProductsAndServices::new);
        products.setCompanyId(companyId);
        if (!(data instanceof Map)) return products;
        Map<String, Object> m = (Map<String, Object>) data;

        if (m.get("targetMarketDescription") != null)
            products.setTargetMarketDescription(String.valueOf(m.get("targetMarketDescription")));
        if (m.get("productsAndServicesDescription") != null)
            products.setProductsAndServicesDescription(String.valueOf(m.get("productsAndServicesDescription")));
        if (m.get("minimumLoanSize") != null)
            products.setMinimumLoanSize(toBigDecimal(m.get("minimumLoanSize")));
        if (m.get("maximumLoanSize") != null)
            products.setMaximumLoanSize(toBigDecimal(m.get("maximumLoanSize")));
        if (m.get("interestRatePerMonth") != null)
            products.setInterestRatePerMonth(toDouble(m.get("interestRatePerMonth")));
        return products;
    }

    @SuppressWarnings("unchecked")
    private FinancialAssumptions parseFinancialAssumptions(Object data, Long companyId) {
        FinancialAssumptions assumptions = new FinancialAssumptions();
        assumptions.setCompanyId(companyId);
        if (!(data instanceof Map)) return assumptions;
        Map<String, Object> m = (Map<String, Object>) data;

        if (m.get("inflationRate") != null)            assumptions.setInflationRate(toDouble(m.get("inflationRate")));
        if (m.get("lendingRate") != null)              assumptions.setLendingRate(toDouble(m.get("lendingRate")));
        if (m.get("gdpGrowthRate") != null)            assumptions.setGdpGrowthRate(toDouble(m.get("gdpGrowthRate")));
        if (m.get("expectedLoanGrowthRate") != null)   assumptions.setExpectedLoanGrowthRate(toDouble(m.get("expectedLoanGrowthRate")));
        return assumptions;
    }

    @SuppressWarnings("unchecked")
    private GrowthAndDevelopment parseGrowthAndDevelopment(Object data, Long companyId) {
        GrowthAndDevelopment growth = growthRepo.findByCompanyId(companyId)
                .orElseGet(GrowthAndDevelopment::new);
        growth.setCompanyId(companyId);
        if (!(data instanceof Map)) return growth;
        Map<String, Object> m = (Map<String, Object>) data;

        if (m.get("growthStrategies") != null)
            growth.setGrowthStrategies(String.valueOf(m.get("growthStrategies")));
        if (m.get("businessExpansionPlans") != null)
            growth.setBusinessExpansionPlans(String.valueOf(m.get("businessExpansionPlans")));
        if (m.get("developmentalValueSummary") != null)
            growth.setDevelopmentalValueSummary(String.valueOf(m.get("developmentalValueSummary")));
        return growth;
    }

    private LoanDistribution parseLoanDistribution(Map<String, Object> data, Long companyId) {
        LoanDistribution dist = new LoanDistribution();
        dist.setCompanyId(companyId);
        if (data.get("purpose") != null)
            dist.setPurpose(String.valueOf(data.get("purpose")));
        if (data.get("numberOfClients") != null)
            dist.setNumberOfClients(toInteger(data.get("numberOfClients")));
        if (data.get("amount") != null)
            dist.setAmount(toBigDecimal(data.get("amount")));
        if (data.get("percentageContribution") != null)
            dist.setPercentageContribution(toDouble(data.get("percentageContribution")));
        return dist;
    }

    /* ---- numeric coercion helpers (Gemini may return numbers as strings) ---- */

    private BigDecimal toBigDecimal(Object v) {
        if (v == null) return null;
        if (v instanceof BigDecimal) return (BigDecimal) v;
        if (v instanceof Number) return new BigDecimal(((Number) v).toString());
        try { return new BigDecimal(String.valueOf(v).replaceAll("[^0-9.\\-]", "")); }
        catch (NumberFormatException e) { return null; }
    }

    private Double toDouble(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).doubleValue();
        try { return Double.parseDouble(String.valueOf(v).replaceAll("[^0-9.\\-]", "")); }
        catch (NumberFormatException e) { return null; }
    }

    private Integer toInteger(Object v) {
        if (v == null) return null;
        if (v instanceof Number) return ((Number) v).intValue();
        try { return Integer.parseInt(String.valueOf(v).replaceAll("[^0-9\\-]", "")); }
        catch (NumberFormatException e) { return null; }
    }
}
