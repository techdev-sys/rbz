package com.rbz.licensingsystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.rbz.licensingsystem.service.DocumentExtractionService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
public class DocumentExtractionController {

    @Autowired
    private DocumentExtractionService documentExtractionService;

    /**
     * Upload and extract data from various document types
     * This endpoint uses AI to extract structured data from uploaded documents
     * and automatically populates the corresponding database tables
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractDataFromDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyId") Long companyId,
            @RequestParam("documentType") String documentType) {

        try {
            Map<String, Object> result = new HashMap<>();

            switch (documentType) {
                case "financialStatements":
                    result = documentExtractionService.extractFinancialStatements(file, companyId);
                    break;

                case "businessPlan":
                    result = documentExtractionService.extractBusinessPlan(file, companyId);
                    break;

                case "portfolioReport":
                    result = documentExtractionService.extractPortfolioReport(file, companyId);
                    break;

                case "creditPolicy":
                    result = documentExtractionService.verifyCreditPolicy(file, companyId);
                    break;

                case "operationalManual":
                    result = documentExtractionService.verifyOperationalManual(file, companyId);
                    break;

                case "taxClearance":
                    result = documentExtractionService.extractTaxClearance(file, companyId);
                    break;

                case "insurancePolicy":
                    result = documentExtractionService.extractInsurancePolicy(file, companyId);
                    break;

                default:
                    return ResponseEntity.badRequest().body("Unknown document type: " + documentType);
            }

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process document: " + e.getMessage());
        }
    }

    /**
     * Get extraction status for a company
     */
    @GetMapping("/status/{companyId}")
    public ResponseEntity<?> getExtractionStatus(@PathVariable Long companyId) {
        try {
            Map<String, String> status = documentExtractionService.getExtractionStatus(companyId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get status: " + e.getMessage());
        }
    }
}
