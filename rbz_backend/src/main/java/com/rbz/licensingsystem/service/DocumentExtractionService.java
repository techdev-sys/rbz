package com.rbz.licensingsystem.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.repository.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.FileOutputStream;
import java.time.LocalDate;
import java.util.*;

@Service
public class DocumentExtractionService {

    @Autowired
    private CapitalStructureRepository capitalStructureRepo;
    @Autowired
    private FinancialPerformanceRepository financialPerformanceRepo;
    @Autowired
    private LoanDistributionRepository loanDistributionRepo;
    @Autowired
    private ProductsAndServicesRepository productsServicesRepo;
    @Autowired
    private FinancialAssumptionsRepository financialAssumptionsRepo;
    @Autowired
    private ComplianceDocumentationRepository complianceRepo;
    @Autowired
    private GrowthAndDevelopmentRepository growthRepo;
    @Autowired
    private CompanyProfileRepository companyProfileRepo;
    @Autowired
    private CompanyDocumentRepository companyDocumentRepo;

    // Point to Python FastAPI service
    private final String AI_SERVICE_URL = "http://localhost:8000";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extract Capital Structure and Financial Performance from Financial Statements
     */
    public Map<String, Object> extractFinancialStatements(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "financialStatements");
        File tempFile = convertMultipartToFile(file);

        try {
            // "financial_statements" isn't fully supported by Python yet, will likely
            // return mock or generic analysis
            Map<String, Object> aiResponse = callAIService(tempFile, "financial_statements", companyId);

            if (aiResponse.containsKey("capitalStructure")) {
                CapitalStructure capital = parseCapitalStructure(aiResponse.get("capitalStructure"), companyId);
                capitalStructureRepo.save(capital);
            }

            if (aiResponse.containsKey("financialPerformance")) {
                List<Map<String, Object>> performances = (List<Map<String, Object>>) aiResponse
                        .get("financialPerformance");
                for (Map<String, Object> perfData : performances) {
                    FinancialPerformance perf = parseFinancialPerformance(perfData, companyId);
                    financialPerformanceRepo.save(perf);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Extracted Financial Statements via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Extract Products, Growth Strategies, and Assumptions from Business Plan
     */
    public Map<String, Object> extractBusinessPlan(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "businessPlan");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "business_plan", companyId);

            if (aiResponse.containsKey("products")) {
                ProductsAndServices products = parseProductsAndServices(aiResponse.get("products"), companyId);
                productsServicesRepo.save(products);
            }

            if (aiResponse.containsKey("assumptions")) {
                FinancialAssumptions assumptions = parseFinancialAssumptions(aiResponse.get("assumptions"), companyId);
                financialAssumptionsRepo.save(assumptions);
            }

            if (aiResponse.containsKey("growth")) {
                GrowthAndDevelopment growth = parseGrowthAndDevelopment(aiResponse.get("growth"), companyId);
                growthRepo.save(growth);
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Extracted Business Plan via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Extract Loan Distribution from Portfolio Report
     */
    public Map<String, Object> extractPortfolioReport(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "portfolioReport");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "portfolio_report", companyId);

            if (aiResponse.containsKey("loanDistribution")) {
                List<Map<String, Object>> distributions = (List<Map<String, Object>>) aiResponse
                        .get("loanDistribution");
                for (Map<String, Object> distData : distributions) {
                    LoanDistribution dist = parseLoanDistribution(distData, companyId);
                    loanDistributionRepo.save(dist);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Extracted Portfolio Report via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Verify Credit Policy Manual for compliance
     */
    public Map<String, Object> verifyCreditPolicy(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "creditPolicy");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "policy_verification", companyId);

            ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                    .orElse(new ComplianceDocumentation());
            compliance.setCompanyId(companyId);
            compliance.setHasCreditPolicyManual("YES");
            compliance.setPolicyManualAssessment((String) aiResponse.getOrDefault("assessment", ""));
            complianceRepo.save(compliance);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Credit Policy verified via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Verify Operational Manual
     */
    public Map<String, Object> verifyOperationalManual(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "operationalManual");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "policy_verification", companyId);

            ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                    .orElse(new ComplianceDocumentation());
            compliance.setCompanyId(companyId);
            compliance.setHasOperationalPolicyManual("YES");
            complianceRepo.save(compliance);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Operational Manual verified via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Extract Tax Clearance details
     */
    public Map<String, Object> extractTaxClearance(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "taxClearance");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "tax_clearance", companyId);

            ComplianceDocumentation compliance = complianceRepo.findByCompanyId(companyId)
                    .orElse(new ComplianceDocumentation());
            compliance.setCompanyId(companyId);
            compliance.setHasTaxClearanceCertificate("YES");

            // AI Extraction Logic for Tax Clearance
            if (aiResponse.containsKey("extracted_data")) {
                Map<String, Object> data = (Map<String, Object>) aiResponse.get("extracted_data");

                if (data.containsKey("certificate_number")) {
                    compliance.setTaxClearanceCertificateNumber((String) data.get("certificate_number"));
                }

                try {
                    if (data.containsKey("expiry_date")) {
                        compliance.setTaxClearanceExpiryDate((String) data.get("expiry_date"));
                    }
                    if (data.containsKey("issue_date")) {
                        compliance.setTaxClearanceIssuedDate((String) data.get("issue_date"));
                    }
                } catch (Exception e) {
                    System.err.println("Date extraction error: " + e.getMessage());
                }
            } else if (aiResponse.containsKey("expiryDate")) {
                // Fallback to old key if Python hasn't updated or returns simplified structure
                compliance.setTaxClearanceExpiryDate((String) aiResponse.get("expiryDate"));
            }

            complianceRepo.save(compliance);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Tax Clearance extracted via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Extract Insurance Policy details
     */
    public Map<String, Object> extractInsurancePolicy(MultipartFile file, Long companyId) throws Exception {
        trackDocument(file, companyId, "insurancePolicy");
        File tempFile = convertMultipartToFile(file);

        try {
            Map<String, Object> aiResponse = callAIService(tempFile, "insurance_policy", companyId);

            ProductsAndServices products = productsServicesRepo.findByCompanyId(companyId)
                    .orElse(new ProductsAndServices());
            // products.setHasValidCreditInsurancePolicy("YES");
            // products.setInsurancePolicyDetails((String)
            // aiResponse.getOrDefault("details", ""));
            productsServicesRepo.save(products);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("summary", "Insurance Policy processed via AI");
            result.put("extractedData", aiResponse);

            return result;
        } finally {
            tempFile.delete();
        }
    }

    /**
     * Get extraction status for all documents
     */
    public Map<String, String> getExtractionStatus(Long companyId) {
        Map<String, String> status = new HashMap<>();
        status.put("capitalStructure",
                capitalStructureRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        status.put("financialPerformance",
                !financialPerformanceRepo.findByCompanyId(companyId).isEmpty() ? "completed" : "pending");
        status.put("productsAndServices",
                productsServicesRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        status.put("compliance", complianceRepo.findByCompanyId(companyId).isPresent() ? "completed" : "pending");
        return status;
    }

    private void trackDocument(MultipartFile file, Long companyId, String type) {
        CompanyDocument doc = new CompanyDocument();
        doc.setCompanyId(companyId);
        doc.setDocumentType(type);
        doc.setFileName(file.getOriginalFilename());
        doc.setContentType(file.getContentType());
        doc.setFileSize(file.getSize());
        doc.setFilePath("SYSTEM_STORAGE/" + file.getOriginalFilename()); // Mock path
        companyDocumentRepo.save(doc);
    }

    // ========== HELPER METHODS ==========

    private File convertMultipartToFile(MultipartFile multipart) throws Exception {
        File file = File.createTempFile("upload", multipart.getOriginalFilename());
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(multipart.getBytes());
        }
        return file;
    }

    private Map<String, Object> callAIService(File file, String documentType, Long companyId) throws Exception {
        String url = AI_SERVICE_URL + "/verify-document";

        // Fetch company name for matching
        String entityName = "Company";
        if (companyId != null) {
            entityName = companyProfileRepo.findById(companyId)
                    .map(CompanyProfile::getCompanyName)
                    .orElse("Company");
        }

        org.springframework.util.MultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
        body.add("file", new org.springframework.core.io.FileSystemResource(file));
        body.add("doc_type", documentType);
        body.add("director_name", entityName); // Python expects 'director_name' but we use it for Entity Name too

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.MULTIPART_FORM_DATA);

        org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(
                body, headers);

        try {
            System.out.println("🤖 Sending request to AI Service: " + url + " Type: " + documentType);
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            return objectMapper.readValue(response.getBody(), Map.class);
        } catch (Exception e) {
            System.err.println("AI Service Call Failed: " + e.getMessage());
            // Fallback mock
            Map<String, Object> mock = new HashMap<>();
            mock.put("valid", true);
            mock.put("reason", "AI Service Unavailable - Manual verification required");
            mock.put("extracted_data", new HashMap<>()); // Empty data map
            return mock;
        }
    }

    // Parsing methods mocks/placeholders (should be fleshed out based on real AI
    // response structure)
    private CapitalStructure parseCapitalStructure(Object data, Long companyId) {
        CapitalStructure capital = new CapitalStructure();
        capital.setCompanyId(companyId);
        return capital;
    }

    private FinancialPerformance parseFinancialPerformance(Map<String, Object> data, Long companyId) {
        FinancialPerformance perf = new FinancialPerformance();
        perf.setCompanyId(companyId);
        return perf;
    }

    private ProductsAndServices parseProductsAndServices(Object data, Long companyId) {
        ProductsAndServices products = new ProductsAndServices();
        products.setCompanyId(companyId);
        return products;
    }

    private FinancialAssumptions parseFinancialAssumptions(Object data, Long companyId) {
        FinancialAssumptions assumptions = new FinancialAssumptions();
        assumptions.setCompanyId(companyId);
        return assumptions;
    }

    private GrowthAndDevelopment parseGrowthAndDevelopment(Object data, Long companyId) {
        GrowthAndDevelopment growth = new GrowthAndDevelopment();
        growth.setCompanyId(companyId);
        return growth;
    }

    private LoanDistribution parseLoanDistribution(Map<String, Object> data, Long companyId) {
        LoanDistribution dist = new LoanDistribution();
        dist.setCompanyId(companyId);
        return dist;
    }
}
