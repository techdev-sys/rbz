package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Director;
import com.rbz.licensingsystem.repository.DirectorRepository;
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
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Director Vetting
 * Supports Stage 3: Corporate Governance (Director Vetting)
 */
@RestController
@RequestMapping("/api/director-vetting")
public class DirectorVettingController {

    @Autowired
    private DirectorRepository directorRepository;

    @Autowired
    private LearningService learningService;

    private static final String UPLOAD_DIR = "uploads/director-documents/";

    /**
     * Get all directors for a company
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Director>> getCompanyDirectors(@PathVariable Long companyId) {
        List<Director> directors = directorRepository.findByCompanyId(companyId);
        return ResponseEntity.ok(directors);
    }

    /**
     * Get a specific director
     */
    @GetMapping("/{directorId}")
    public ResponseEntity<Director> getDirector(@PathVariable Long directorId) {
        Director director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        return ResponseEntity.ok(director);
    }

    /**
     * Create new director with ID/Passport and nationality
     */
    @PostMapping("/create")
    public ResponseEntity<Director> createDirector(@RequestBody Director director) {
        System.out.println("========== CREATE DIRECTOR REQUEST ==========");
        System.out.println("Full Name: " + director.getFullName());
        System.out.println("ID/Passport (idNumber): " + director.getIdNumber());
        System.out.println("Nationality: " + director.getNationality());
        System.out.println("Company ID: " + director.getCompanyId());
        System.out.println("==============================================");

        // Set initial status
        if (director.getStatus() == null || director.getStatus().isEmpty()) {
            director.setStatus("Pending Verification");
        }
        if (director.getVettingStatus() == null || director.getVettingStatus().isEmpty()) {
            director.setVettingStatus("PENDING");
        }

        Director saved = directorRepository.save(director);
        System.out.println("✅ Director saved with ID: " + saved.getId());

        learningService.captureEvent("APPLICANT", "SEC_OFFICER", director.getCompanyId(),
                "DIRECTOR_ADD", "Added director: " + director.getFullName(), director.toString());

        return ResponseEntity.ok(saved);
    }

    /**
     * Update existing director
     */
    @PutMapping("/{directorId}")
    public ResponseEntity<Director> updateDirector(
            @PathVariable Long directorId,
            @RequestBody Director directorDetails) {

        Director director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));

        System.out.println("========== UPDATE DIRECTOR REQUEST ==========");
        System.out.println("Director ID: " + directorId);

        // Update basic info
        if (directorDetails.getFullName() != null) {
            director.setFullName(directorDetails.getFullName());
        }
        if (directorDetails.getIdNumber() != null) {
            director.setIdNumber(directorDetails.getIdNumber());
            System.out.println("Updated ID/Passport: " + directorDetails.getIdNumber());
        }
        if (directorDetails.getNationality() != null) {
            director.setNationality(directorDetails.getNationality());
            System.out.println("Updated Nationality: " + directorDetails.getNationality());
        }

        // Update CV analysis results
        if (directorDetails.getQualifications() != null) {
            director.setQualifications(directorDetails.getQualifications());
        }
        if (directorDetails.getExperience() != null) {
            director.setExperience(directorDetails.getExperience());
        }

        // Update status
        if (directorDetails.getStatus() != null) {
            director.setStatus(directorDetails.getStatus());
        }
        if (directorDetails.getVettingStatus() != null) {
            director.setVettingStatus(directorDetails.getVettingStatus());
        }

        // Update risk flag (from CV analysis)
        director.setRiskFlag(directorDetails.isRiskFlag());

        System.out.println("==============================================");

        Director updated = directorRepository.save(director);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete director
     */
    @DeleteMapping("/{directorId}")
    public ResponseEntity<Void> deleteDirector(@PathVariable Long directorId) {
        Director director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));

        System.out.println("🗑️ Deleting director: " + director.getFullName() + " (ID: " + directorId + ")");

        directorRepository.delete(director);

        return ResponseEntity.ok().build();
    }

    /**
     * Upload ID document for a director
     */
    @PostMapping("/{directorId}/upload-id")
    public ResponseEntity<Director> uploadIdDocument(
            @PathVariable Long directorId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "idNumber", required = false) String idNumber,
            @RequestParam(value = "expiryDate", required = false) String expiryDate) throws IOException {

        Director director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));

        // Create upload directory if it doesn't exist
        File uploadDir = new File(UPLOAD_DIR);
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }

        // Save file with unique name
        String fileName = "id_" + directorId + "_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());

        // Update director
        director.setIdDocumentPath(filePath.toString());
        director.setIdDocumentType(documentType);
        director.setDocumentUploadDate(LocalDate.now());
        director.setIdDocumentVerificationStatus("PENDING");

        if (idNumber != null && !idNumber.isEmpty()) {
            director.setIdDocumentNumber(idNumber);
        }

        if (expiryDate != null && !expiryDate.isEmpty()) {
            director.setIdDocumentExpiryDate(LocalDate.parse(expiryDate));
        }

        Director updated = directorRepository.save(director);
        return ResponseEntity.ok(updated);
    }

    /**
     * Update ID document verification status
     */
    @PutMapping("/{directorId}/verify")
    public ResponseEntity<Director> updateVerificationStatus(
            @PathVariable Long directorId,
            @RequestParam String status) {

        Director director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));

        director.setIdDocumentVerificationStatus(status);

        if (status.equals("VERIFIED")) {
            director.setVettingStatus("APPROVED");
            director.setVettingDate(LocalDate.now());
        }

        Director updated = directorRepository.save(director);

        learningService.captureEvent("EXAMINER", "SYSTEM_AUTO", director.getCompanyId(),
                "DOC_VERIFY", "Director ID verified as " + status + " for " + director.getFullName(), "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Get directors pending vetting
     */
    @GetMapping("/company/{companyId}/pending")
    public ResponseEntity<List<Director>> getPendingDirectors(@PathVariable Long companyId) {
        List<Director> directors = directorRepository.findByCompanyId(companyId);
        List<Director> pending = directors.stream()
                .filter(d -> d.getIdDocumentVerificationStatus() == null ||
                        d.getIdDocumentVerificationStatus().equals("PENDING"))
                .toList();
        return ResponseEntity.ok(pending);
    }

    /**
     * Get vetting summary for a company
     */
    @GetMapping("/company/{companyId}/summary")
    public ResponseEntity<java.util.Map<String, Object>> getVettingSummary(@PathVariable Long companyId) {
        List<Director> directors = directorRepository.findByCompanyId(companyId);

        long total = directors.size();
        long verified = directors.stream()
                .filter(d -> "VERIFIED".equals(d.getIdDocumentVerificationStatus()))
                .count();
        long pending = directors.stream()
                .filter(d -> d.getIdDocumentVerificationStatus() == null ||
                        "PENDING".equals(d.getIdDocumentVerificationStatus()))
                .count();
        long rejected = directors.stream()
                .filter(d -> "REJECTED".equals(d.getIdDocumentVerificationStatus()))
                .count();

        java.util.Map<String, Object> summary = new java.util.HashMap<>();
        summary.put("total", total);
        summary.put("verified", verified);
        summary.put("pending", pending);
        summary.put("rejected", rejected);
        summary.put("percentageComplete", total > 0 ? (verified * 100.0 / total) : 0);

        return ResponseEntity.ok(summary);
    }
}
