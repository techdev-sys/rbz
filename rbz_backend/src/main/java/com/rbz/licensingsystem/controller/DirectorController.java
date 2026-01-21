package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.dto.DirectorDTO;
import com.rbz.licensingsystem.model.Director;
import com.rbz.licensingsystem.repository.DirectorRepository;
import com.rbz.licensingsystem.service.AIService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/application")
@Slf4j
public class DirectorController {

    private final AIService aiService;
    private final DirectorRepository directorRepository;

    @Autowired
    public DirectorController(AIService aiService, DirectorRepository directorRepository) {
        this.aiService = aiService;
        this.directorRepository = directorRepository;
    }

    // === 1. UPLOAD CV (Merged Logic: AI Analysis + Save to DB) ===
    @PostMapping("/uploadCV")
    public ResponseEntity<?> uploadCV(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "companyId", required = false) Long companyId) {
        try {
            log.info("--- NEW CV UPLOAD STARTED ---");

            // 1. AI Extraction
            DirectorDTO directorDTO = aiService.extractDirectorInfo(file);

            if (directorDTO == null) {
                return ResponseEntity.badRequest().body("AI extraction failed.");
            }

            // 2. Create Entity
            Director director = new Director();
            director.setFullName(directorDTO.getFullName());
            // Map other fields safely
            director.setNationality(directorDTO.getNationality());
            director.setIdNumber(directorDTO.getIdNumber());
            director.setRiskFlag(directorDTO.isRiskFlag()); // Note: boolean getter usually isRiskFlag()
            director.setCompanyId(companyId);

            // Handle Experience/Qualifications safely
            director.setExperience(directorDTO.getExperience() != null ? directorDTO.getExperience() : "Not Found");
            director.setQualifications(
                    directorDTO.getQualifications() != null ? directorDTO.getQualifications() : "Not Found");

            director.setStatus("DRAFT");

            // 3. Save to Database
            Director savedDirector = directorRepository.save(director);
            log.info("Saved Director ID: {}", savedDirector.getId());

            return ResponseEntity.ok(savedDirector);

        } catch (Exception e) {
            log.error("Server Error in uploadCV", e);
            return ResponseEntity.internalServerError().body("Server Error: " + e.getMessage());
        }
    }

    // === 2. VERIFY DOCUMENTS (Merged Logic: Accepts directorName) ===
    @PostMapping("/verify-document")
    public ResponseEntity<?> verifyDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType,
            @RequestParam(value = "directorName", required = false) String directorName,
            @RequestParam(value = "companyId", required = false) Long companyId) {

        try {
            String safeName = (directorName != null && !directorName.isEmpty()) ? directorName : "Director Candidate";

            log.info("Verifying {} for {}", docType, safeName);

            return aiService.verifyDocument(file, docType, safeName);

        } catch (Exception e) {
            log.error("Verification failed", e);
            return ResponseEntity.internalServerError().body("Verification failed: " + e.getMessage());
        }
    }

    // === 3. GET DIRECTORS (Essential for listing them) ===
    @GetMapping("/directors/{companyId}")
    public ResponseEntity<List<Director>> getDirectors(@PathVariable Long companyId) {
        return ResponseEntity.ok(directorRepository.findByCompanyId(companyId));
    }

    // === 4. MANUAL SAVE (For adding without CV) ===
    @PostMapping("/save-director")
    public ResponseEntity<?> saveDirector(@RequestBody Director director) {
        Director saved = directorRepository.save(director);
        return ResponseEntity.ok(saved);
    }
}