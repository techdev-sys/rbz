package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Shareholder;
import com.rbz.licensingsystem.repository.ShareholderRepository;
import com.rbz.licensingsystem.service.LearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Ownership Management
 * Supports Stage 2: Ownership Documentation and Shareholding Structure
 */
@RestController
@RequestMapping("/api/ownership")
public class OwnershipController {

    @Autowired
    private ShareholderRepository shareholderRepository;

    @Autowired
    private LearningService learningService;

    private static final String UPLOAD_DIR = "uploads/ownership-documents/";

    /**
     * Get shareholding structure for a company
     */
    @GetMapping("/shareholding-structure/{companyId}")
    public ResponseEntity<List<Shareholder>> getShareholdingStructure(@PathVariable Long companyId) {
        List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
        return ResponseEntity.ok(shareholders);
    }

    /**
     * Manually add/update shareholder entry
     */
    @PostMapping("/manual-entry/{companyId}")
    public ResponseEntity<Shareholder> manualShareholderEntry(
            @PathVariable Long companyId,
            @RequestBody Shareholder shareholder) {

        shareholder.setCompanyId(companyId);
        shareholder.setShareholdingTableManuallyEntered(true);
        Shareholder saved = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", companyId,
                "SHAREHOLDER_ADD", "Added/Updated shareholder: " + saved.getFullName(), saved.toString());

        return ResponseEntity.ok(saved);
    }

    /**
     * Upload application form for a shareholder
     */
    @PostMapping("/{shareholderId}/upload-application-form")
    public ResponseEntity<Shareholder> uploadApplicationForm(
            @PathVariable Long shareholderId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "application-form");
        Shareholder shareholder = shareholderRepository.findById(shareholderId)
                .orElseThrow(() -> new RuntimeException("Shareholder not found"));

        shareholder.setApplicationFormPath(path);
        Shareholder updated = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", updated.getCompanyId(),
                "DOC_UPLOAD", "Uploaded Application Form for " + updated.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Upload application letter
     */
    @PostMapping("/{shareholderId}/upload-application-letter")
    public ResponseEntity<Shareholder> uploadApplicationLetter(
            @PathVariable Long shareholderId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "application-letter");
        Shareholder shareholder = shareholderRepository.findById(shareholderId)
                .orElseThrow(() -> new RuntimeException("Shareholder not found"));

        shareholder.setApplicationLetterPath(path);
        Shareholder updated = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", updated.getCompanyId(),
                "DOC_UPLOAD", "Uploaded Application Letter for " + updated.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Upload application fee receipt
     */
    @PostMapping("/{companyId}/upload-application-fee")
    public ResponseEntity<Map<String, String>> uploadApplicationFee(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "application-fee");

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", companyId,
                "DOC_UPLOAD", "Uploaded Application Fee Receipt", "");

        Map<String, String> response = new HashMap<>();
        response.put("path", path);
        response.put("message", "Application fee receipt uploaded successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Upload net worth statement for a shareholder
     */
    @PostMapping("/{shareholderId}/upload-net-worth-statement")
    public ResponseEntity<Shareholder> uploadNetWorthStatement(
            @PathVariable Long shareholderId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "net-worth-statement");
        Shareholder shareholder = shareholderRepository.findById(shareholderId)
                .orElseThrow(() -> new RuntimeException("Shareholder not found"));

        shareholder.setNetWorthStatementPath(path);
        Shareholder updated = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", updated.getCompanyId(),
                "DOC_UPLOAD", "Uploaded Net Worth Statement for " + updated.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Upload board resolution (par value confirmation)
     */
    @PostMapping("/{companyId}/upload-board-resolution")
    public ResponseEntity<Map<String, String>> uploadBoardResolution(
            @PathVariable Long companyId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "board-resolution");

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", companyId,
                "DOC_UPLOAD", "Uploaded Board Resolution", "");

        Map<String, String> response = new HashMap<>();
        response.put("path", path);
        response.put("message", "Board resolution uploaded successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Upload shareholder affidavit (UBO declaration)
     */
    @PostMapping("/{shareholderId}/upload-shareholder-affidavit")
    public ResponseEntity<Shareholder> uploadShareholderAffidavit(
            @PathVariable Long shareholderId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "shareholder-affidavit");
        Shareholder shareholder = shareholderRepository.findById(shareholderId)
                .orElseThrow(() -> new RuntimeException("Shareholder not found"));

        shareholder.setShareholderAffidavitPath(path);
        shareholder.setScreeningDate(LocalDate.now());
        Shareholder updated = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", updated.getCompanyId(),
                "DOC_UPLOAD", "Uploaded Shareholder Affidavit for " + updated.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Upload capital contribution confirmation
     */
    @PostMapping("/{shareholderId}/upload-capital-confirmation")
    public ResponseEntity<Shareholder> uploadCapitalConfirmation(
            @PathVariable Long shareholderId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String path = saveFile(file, "capital-confirmation");
        Shareholder shareholder = shareholderRepository.findById(shareholderId)
                .orElseThrow(() -> new RuntimeException("Shareholder not found"));

        shareholder.setCapitalContributionConfirmationPath(path);
        Shareholder updated = shareholderRepository.save(shareholder);

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", updated.getCompanyId(),
                "DOC_UPLOAD", "Uploaded Capital Confirmation for " + updated.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Validate shareholding compliance (50% max rule)
     */
    @GetMapping("/validate-compliance/{companyId}")
    public ResponseEntity<Map<String, Object>> validateCompliance(@PathVariable Long companyId) {
        List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);

        Map<String, Object> result = new HashMap<>();
        boolean compliant = true;
        StringBuilder violations = new StringBuilder();

        // Check 50% max shareholding rule
        for (Shareholder sh : shareholders) {
            if (sh.getOwnershipPercentage() != null && sh.getOwnershipPercentage() > 50.0) {
                compliant = false;
                violations.append(sh.getFullName())
                        .append(" owns ")
                        .append(sh.getOwnershipPercentage())
                        .append("% (exceeds 50% limit). ");
            }
        }

        // Check total ownership adds to 100%
        double totalOwnership = shareholders.stream()
                .mapToDouble(sh -> sh.getOwnershipPercentage() != null ? sh.getOwnershipPercentage() : 0.0)
                .sum();

        if (Math.abs(totalOwnership - 100.0) > 0.01) {
            compliant = false;
            violations.append("Total ownership is ")
                    .append(String.format("%.2f", totalOwnership))
                    .append("% (must be exactly 100%). ");
        }

        result.put("compliant", compliant);
        result.put("totalOwnership", totalOwnership);
        result.put("violations", violations.toString());
        result.put("shareholderCount", shareholders.size());

        learningService.captureEvent("APPLICANT", "SYSTEM", companyId,
                "RULE_CHECK", "Checked ownership compliance: " + (compliant ? "PASS" : "FAIL"), result.toString());

        return ResponseEntity.ok(result);
    }

    /**
     * Helper method to save uploaded files
     */
    private String saveFile(MultipartFile file, String type) throws IOException {
        // Create upload directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // Save file with unique name
        String fileName = type + "_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        return filePath.toString();
    }
}
