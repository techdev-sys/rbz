package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.FinancialProjection;
import com.rbz.licensingsystem.repository.FinancialProjectionRepository;
import com.rbz.licensingsystem.service.LearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Stage 6: Financial Projections Controller
 */
@RestController
@RequestMapping("/api/projections")
public class FinancialProjectionController {

    @Autowired
    private FinancialProjectionRepository financialProjectionRepository;

    @Autowired
    private LearningService learningService;

    /**
     * Save or update financial projection
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveFinancialProjection(@RequestBody FinancialProjection projection) {
        try {
            FinancialProjection saved = financialProjectionRepository.save(projection);

            learningService.captureEvent("APPLICANT", "SEC_OFFICER", projection.getCompanyId(),
                    "PROJECTION_SAVE", "Saved financial projection for Year " + projection.getYear(),
                    projection.toString());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving financial projection: " + e.getMessage());
        }
    }

    /**
     * Save multiple projections at once
     */
    @PostMapping("/save-all")
    public ResponseEntity<?> saveAllProjections(@RequestBody List<FinancialProjection> projections) {
        try {
            List<FinancialProjection> saved = financialProjectionRepository.saveAll(projections);

            if (!projections.isEmpty()) {
                learningService.captureEvent("APPLICANT", "SEC_OFFICER", projections.get(0).getCompanyId(),
                        "PROJECTION_SAVE_ALL", "Saved batch of " + projections.size() + " projections", "");
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving financial projections: " + e.getMessage());
        }
    }

    /**
     * Get financial projections by company ID
     */
    @GetMapping("/list/{companyId}")
    public ResponseEntity<?> getFinancialProjections(@PathVariable Long companyId) {
        try {
            List<FinancialProjection> projections = financialProjectionRepository.findByCompanyId(companyId);
            return ResponseEntity.ok(projections);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching financial projections: " + e.getMessage());
        }
    }

    /**
     * Get a specific year's projection
     */
    @GetMapping("/{companyId}/{year}")
    public ResponseEntity<?> getProjectionByYear(@PathVariable Long companyId, @PathVariable Integer year) {
        try {
            return financialProjectionRepository.findByCompanyIdAndYear(companyId, year)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching projection: " + e.getMessage());
        }
    }

    /**
     * Upload document to extract financial projection data
     */
    @PostMapping("/upload-extract")
    public ResponseEntity<?> uploadAndExtractProjections(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyId") Long companyId) {
        try {
            learningService.captureEvent("APPLICANT", "SYSTEM", companyId,
                    "DOC_UPLOAD", "Uploaded Projections Document for Processing: " + file.getOriginalFilename(), "");

            return ResponseEntity.ok(Map.of(
                    "message", "Document uploaded successfully. Processing initialized.",
                    "filename", file.getOriginalFilename(),
                    "size", file.getSize()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing document: " + e.getMessage());
        }
    }

    /**
     * Delete a financial projection
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFinancialProjection(@PathVariable Long id) {
        try {
            financialProjectionRepository.deleteById(id);
            return ResponseEntity.ok("Financial projection deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting financial projection: " + e.getMessage());
        }
    }
}
