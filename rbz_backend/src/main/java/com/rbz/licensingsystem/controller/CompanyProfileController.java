package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.service.CompanyProfileService;
import com.rbz.licensingsystem.service.AIService;
import com.rbz.licensingsystem.service.LearningService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/company")
@Slf4j
public class CompanyProfileController {

    private final CompanyProfileService companyProfileService;
    private final AIService aiService;
    private final LearningService learningService;

    @Autowired
    public CompanyProfileController(CompanyProfileService companyProfileService, AIService aiService,
            LearningService learningService) {
        this.companyProfileService = companyProfileService;
        this.aiService = aiService;
        this.learningService = learningService;
    }

    // === 1. SAVE PROFILE (Text Data) ===
    @PostMapping("/save")
    public ResponseEntity<?> createCompanyProfile(@RequestBody CompanyProfile companyProfile) {
        log.info("========== COMPANY PROFILE SAVE REQUEST ==========");
        log.info("Company Name: {}", companyProfile.getCompanyName());
        log.info("Contact Person: {}", companyProfile.getContactPersonName());
        log.info("===================================================");

        try {
            CompanyProfile savedProfile = companyProfileService.saveCompanyProfile(companyProfile);
            log.info("✅ Profile saved successfully with ID: {}", savedProfile.getId());

            // AI LEARNING: Capture the profile creation data
            learningService.captureEvent("APPLICANT", companyProfile.getContactPersonName(), savedProfile.getId(),
                    "PROFILE_SAVE", "Applicant saved initial company profile", companyProfile.toString());

            return ResponseEntity.ok(savedProfile);
        } catch (Exception e) {
            log.error("❌ Error saving profile", e);
            return ResponseEntity.badRequest().body("Error saving profile: " + e.getMessage());
        }
    }

    // === 2. UPLOAD CERTIFICATE ===
    @PostMapping("/upload-cert")
    public ResponseEntity<?> uploadCertificate(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyId") Long companyId) {

        log.info("Received Certificate Upload for Company ID: {}", companyId);

        learningService.captureEvent("APPLICANT", "SYSTEM", companyId,
                "DOC_UPLOAD", "Uploaded Certificate of Incorporation", "");

        return aiService.verifyCompanyDocument(file, "certificate_incorporation", companyId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompanyProfile> getCompanyProfileById(@PathVariable Long id) {
        return companyProfileService.getCompanyProfileById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<CompanyProfile> getAllCompanyProfiles() {
        return companyProfileService.getAllCompanyProfiles();
    }

    @PutMapping("/{id}")
    public ResponseEntity<CompanyProfile> updateCompanyProfile(@PathVariable Long id,
            @RequestBody CompanyProfile companyProfileDetails) {
        try {
            CompanyProfile updatedProfile = companyProfileService.updateCompanyProfile(id, companyProfileDetails);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // === 3. WORKFLOW ENDPOINTS ===

    /**
     * Submit application (Applicant -> Senior BE)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitApplication(@PathVariable Long id) {
        try {
            CompanyProfile company = companyProfileService.getCompanyProfileById(id)
                    .orElseThrow(() -> new RuntimeException("Company not found"));

            company.setApplicationStatus("SUBMITTED");
            companyProfileService.saveCompanyProfile(company);

            // AI LEARNING: Capture submission event
            learningService.captureEvent("APPLICANT", company.getContactPersonName(), id,
                    "APPLICATION_SUBMISSION", "Applicant submitted the full application", "");

            return ResponseEntity.ok("Application submitted successfully to Senior Bank Examiner");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Assign application (Senior BE -> Examiner)
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assignApplication(
            @PathVariable Long id,
            @RequestParam String examinerName) {
        try {
            CompanyProfile company = companyProfileService.getCompanyProfileById(id)
                    .orElseThrow(() -> new RuntimeException("Company not found"));

            company.setApplicationStatus("ASSIGNED");
            company.setAssignedExaminer(examinerName);
            companyProfileService.saveCompanyProfile(company);

            // AI LEARNING: Capture delegation event
            learningService.captureEvent("SENIOR", "SYSTEM_ADMIN", id,
                    "DELEGATION", "Senior Examiner delegated application to " + examinerName, "");

            return ResponseEntity.ok("Application assigned to " + examinerName);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get applications by status (For dashboards)
     */
    @GetMapping("/status/{status}")
    public List<CompanyProfile> getApplicationsByStatus(@PathVariable String status) {
        return companyProfileService.getCompanyProfilesByStatus(status);
    }

    /**
     * Get applications assigned to an examiner
     */
    @GetMapping("/assigned/{examinerName}")
    public List<CompanyProfile> getAssignedApplications(@PathVariable String examinerName) {
        return companyProfileService.getAssignedCompanyProfiles("ASSIGNED", examinerName);
    }
}