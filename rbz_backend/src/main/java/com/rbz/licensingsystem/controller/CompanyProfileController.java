package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.service.CompanyProfileService;
import com.rbz.licensingsystem.service.AIService;
import com.rbz.licensingsystem.service.LearningService;
import com.rbz.licensingsystem.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/company")
@Slf4j
public class CompanyProfileController {

    private final CompanyProfileService companyProfileService;
    private final AIService aiService;
    private final LearningService learningService;
    private final CompanyProfileRepository companyProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    @Autowired
    public CompanyProfileController(CompanyProfileService companyProfileService, AIService aiService,
            LearningService learningService, CompanyProfileRepository companyProfileRepository,
            PasswordEncoder passwordEncoder, NotificationService notificationService) {
        this.companyProfileService = companyProfileService;
        this.aiService = aiService;
        this.learningService = learningService;
        this.companyProfileRepository = companyProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    // === 1. SAVE PROFILE (Text Data) ===
    @SuppressWarnings("null")
    @PostMapping("/save")
    public ResponseEntity<?> createCompanyProfile(@RequestBody CompanyProfile companyProfile) {
        log.info("========== COMPANY PROFILE SAVE REQUEST ==========");
        log.info("Company Name: {}", companyProfile.getCompanyName());
        log.info("Contact Person: {}", companyProfile.getContactPersonName());
        log.info("===================================================");

        try {
            // If a plaintext password was sent, hash it before persisting.
            // On update saves (company already exists), preserve existing password if none provided.
            if (companyProfile.getPassword() != null && !companyProfile.getPassword().isEmpty()) {
                companyProfile.setPassword(passwordEncoder.encode(companyProfile.getPassword()));
            } else if (companyProfile.getId() != null) {
                // Preserve existing password on updates
                companyProfileRepository.findById(companyProfile.getId())
                        .ifPresent(existing -> companyProfile.setPassword(existing.getPassword()));
            }

            CompanyProfile savedProfile = companyProfileService.saveCompanyProfile(companyProfile);
            log.info("✅ Profile saved successfully with ID: {}", savedProfile.getId());

            learningService.captureEvent("APPLICANT", companyProfile.getContactPersonName(), savedProfile.getId(),
                    "PROFILE_SAVE", "Applicant saved initial company profile", companyProfile.toString());

            return ResponseEntity.ok(savedProfile);
        } catch (Exception e) {
            log.error("❌ Error saving profile", e);
            return ResponseEntity.badRequest().body("Error saving profile. Please try again.");
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

    @SuppressWarnings("null")
    @GetMapping("/{id}")
    public ResponseEntity<CompanyProfile> getCompanyProfileById(@PathVariable("id") Long id) {
        return companyProfileService.getCompanyProfileById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<CompanyProfile> getAllCompanyProfiles() {
        return companyProfileService.getAllCompanyProfiles();
    }

    @SuppressWarnings("null")
    @PutMapping("/{id}")
    public ResponseEntity<CompanyProfile> updateCompanyProfile(@PathVariable("id") Long id,
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
    @SuppressWarnings("null")
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitApplication(@PathVariable("id") Long id) {
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
            log.error("Failed to submit application {}", id, e);
            return ResponseEntity.badRequest().body("Unable to submit your application. Please try again.");
        }
    }

    /**
     * Assign application (Senior BE -> Examiner)
     */
    @SuppressWarnings("null")
    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assignApplication(
            @PathVariable("id") Long id,
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

            notificationService.applicationAssigned(id);

            return ResponseEntity.ok("Application assigned to " + examinerName);
        } catch (Exception e) {
            log.error("Failed to assign application {}", id, e);
            return ResponseEntity.badRequest().body("Unable to assign this application. Please try again.");
        }
    }

    /**
     * Get applications by status (For dashboards)
     */
    @GetMapping("/status/{status}")
    public List<CompanyProfile> getApplicationsByStatus(@PathVariable("status") String status) {
        return companyProfileService.getCompanyProfilesByStatus(status);
    }

    /**
     * Get applications assigned to an examiner
     */
    @GetMapping("/assigned/{examinerName}")
    public List<CompanyProfile> getAssignedApplications(@PathVariable("examinerName") String examinerName) {
        return companyProfileService.getAssignedCompanyProfiles("ASSIGNED", examinerName);
    }

    /**
     * Generate license code for an approved application
     * Format: PREFIX/YEAR/SEQ (e.g. MFI/2026/001)
     */
    @SuppressWarnings("null")
    @PostMapping("/{id}/generate-license-code")
    public ResponseEntity<?> generateLicenseCode(@PathVariable("id") Long id) {
        try {
            CompanyProfile company = companyProfileService.getCompanyProfileById(id)
                    .orElseThrow(() -> new RuntimeException("Company not found"));

            if (company.getLicenseNumber() != null && !company.getLicenseNumber().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "licenseCode", company.getLicenseNumber(),
                        "message", "License code already exists",
                        "alreadyGenerated", true));
            }

            // Determine prefix from license type
            String licenseType = company.getLicenseType();
            if (licenseType == null) licenseType = "";
            String lowerType = licenseType.toLowerCase();
            String prefix = lowerType.contains("deposit") ? "DTMFI" : "MFI";

            int year = LocalDate.now().getYear();
            long existingCount = companyProfileRepository.countByLicenseTypeAndLicenseNumberIsNotNull(
                    company.getLicenseType() != null ? company.getLicenseType() : "");
            // Fallback: count all licenses if type-specific count is 0
            if (existingCount == 0) {
                existingCount = companyProfileRepository.countByLicenseNumberIsNotNull();
            }
            long seq = existingCount + 1;
            String licenseCode = String.format("%s/%d/%03d", prefix, year, seq);

            company.setLicenseNumber(licenseCode);
            company.setLicenseGrantedDate(LocalDate.now());
            companyProfileService.saveCompanyProfile(company);

            log.info("✅ License code generated: {} for {}", licenseCode, company.getCompanyName());

            learningService.captureEvent("SENIOR", "SYSTEM", id,
                    "LICENSE_GRANTED", "License code generated: " + licenseCode, "");

            Map<String, Object> response = new HashMap<>();
            response.put("licenseCode", licenseCode);
            response.put("companyName", company.getCompanyName());
            response.put("licenseType", company.getLicenseType());
            response.put("grantedDate", company.getLicenseGrantedDate());
            response.put("message", "License code generated successfully");
            response.put("alreadyGenerated", false);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to generate license code", e);
            return ResponseEntity.badRequest().body("Failed to generate license code. Please try again.");
        }
    }
}