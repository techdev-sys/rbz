package com.rbz.licensingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Stub interfaces for external verification bodies.
 * Replace each method body with live HTTP calls when APIs become available.
 */
@Service
@Slf4j
public class ExternalVerificationService {

    /**
     * ZIMRA (Zimbabwe Revenue Authority) — verify tax compliance.
     * Stub: always returns compliant until live API is wired.
     */
    public Map<String, Object> verifyTaxCompliance(String registrationNumber) {
        log.info("ZIMRA stub: verifying tax compliance for {}", registrationNumber);
        Map<String, Object> result = new HashMap<>();
        result.put("source", "ZIMRA");
        result.put("registrationNumber", registrationNumber);
        result.put("status", "STUB_PENDING_INTEGRATION");
        result.put("taxCompliant", null);
        result.put("message", "ZIMRA API integration pending. Manual verification required.");
        return result;
    }

    /**
     * CRBZ (Credit Reference Bureau Zimbabwe) — retrieve credit history.
     * Stub: returns pending status until live API is wired.
     */
    public Map<String, Object> getCreditHistory(String idNumber, String fullName) {
        log.info("CRBZ stub: credit check for {} / {}", fullName, idNumber);
        Map<String, Object> result = new HashMap<>();
        result.put("source", "CRBZ");
        result.put("subjectName", fullName);
        result.put("status", "STUB_PENDING_INTEGRATION");
        result.put("creditScore", null);
        result.put("defaultHistory", null);
        result.put("message", "CRBZ API integration pending. Manual credit reference check required.");
        return result;
    }

    /**
     * ZIMCODD (Zimbabwe Coalition on Debt and Development) — beneficial ownership registry.
     * Stub: returns not-found until live API is wired.
     */
    public Map<String, Object> checkBeneficialOwnership(String companyRegistrationNumber) {
        log.info("ZIMCODD stub: beneficial ownership check for {}", companyRegistrationNumber);
        Map<String, Object> result = new HashMap<>();
        result.put("source", "ZIMCODD");
        result.put("registrationNumber", companyRegistrationNumber);
        result.put("status", "STUB_PENDING_INTEGRATION");
        result.put("uboDisclosed", null);
        result.put("message", "ZIMCODD API integration pending. Manual UBO verification required.");
        return result;
    }

    /**
     * ZIMRA Employer Registration — verify institutional employment records.
     */
    public Map<String, Object> verifyEmployerRegistration(String registrationNumber) {
        log.info("ZIMRA Employer stub: verifying {}", registrationNumber);
        Map<String, Object> result = new HashMap<>();
        result.put("source", "ZIMRA_EMPLOYER");
        result.put("status", "STUB_PENDING_INTEGRATION");
        result.put("message", "ZIMRA Employer API integration pending.");
        return result;
    }
}
