package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Examiner;
import com.rbz.licensingsystem.repository.ExaminerRepository;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/examiners")
@RequiredArgsConstructor
@Slf4j
public class ExaminerController {

    private final ExaminerRepository examinerRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Create a new examiner (Senior BE creates login for examiner)
     */
    @PostMapping
    public ResponseEntity<?> createExaminer(@RequestBody Map<String, String> request) {
        try {
            String fullName = request.get("fullName");
            String username = request.get("username");
            String password = request.get("password");
            String designation = request.get("designation");
            String role = request.getOrDefault("role", "EXAMINER");
            String email = request.get("email");
            String createdBy = request.getOrDefault("createdBy", "Senior BE");

            if (fullName == null || username == null || password == null || email == null || email.isBlank()) {
                return ResponseEntity.badRequest().body("fullName, username, password, and email are required");
            }

            if (examinerRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body("Username already exists");
            }

            // Generate employee ID
            long count = examinerRepository.count();
            String employeeId = String.format("EX-%d-%03d", java.time.LocalDate.now().getYear(), count + 1);

            // Ensure unique employee ID
            while (examinerRepository.existsByEmployeeId(employeeId)) {
                count++;
                employeeId = String.format("EX-%d-%03d", java.time.LocalDate.now().getYear(), count + 1);
            }

            Examiner examiner = new Examiner();
            examiner.setEmployeeId(employeeId);
            examiner.setFullName(fullName);
            examiner.setUsername(username);
            examiner.setPassword(passwordEncoder.encode(password));
            examiner.setRole(role);
            examiner.setDesignation("Bank Examiner");
            examiner.setEmail(email);
            examiner.setCreatedBy(createdBy);

            Examiner saved = examinerRepository.save(examiner);

            log.info("✅ Examiner created: {} ({}), username: {}", fullName, employeeId, username);

            // Return response without password
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("employeeId", saved.getEmployeeId());
            response.put("fullName", saved.getFullName());
            response.put("username", saved.getUsername());
            response.put("role", saved.getRole());
            response.put("designation", saved.getDesignation());
            response.put("status", saved.getStatus());
            response.put("email", saved.getEmail());
            response.put("createdAt", saved.getCreatedAt());
            response.put("createdBy", saved.getCreatedBy());
            // Include the plain password in the response so Senior BE can share it
            response.put("generatedCredentials", Map.of(
                "username", username,
                "password", password
            ));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("❌ Failed to create examiner", e);
            return ResponseEntity.badRequest().body("Failed to create examiner: " + e.getMessage());
        }
    }

    /**
     * Get all examiners
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllExaminers() {
        List<Examiner> examiners = examinerRepository.findAll();
        List<Map<String, Object>> result = examiners.stream()
                .map(this::toExaminerResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get active examiners only
     */
    @GetMapping("/active")
    public ResponseEntity<List<Map<String, Object>>> getActiveExaminers() {
        List<Examiner> examiners = examinerRepository.findByStatus("ACTIVE");
        List<Map<String, Object>> result = examiners.stream()
                .map(this::toExaminerResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Get examiner by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getExaminer(@PathVariable Long id) {
        return examinerRepository.findById(id)
                .map(e -> ResponseEntity.ok(toExaminerResponse(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Update examiner details
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateExaminer(@PathVariable Long id, @RequestBody Map<String, String> request) {
        return examinerRepository.findById(id)
                .map(examiner -> {
                    if (request.containsKey("fullName")) examiner.setFullName(request.get("fullName"));
                    if (request.containsKey("designation")) examiner.setDesignation(request.get("designation"));
                    if (request.containsKey("status")) examiner.setStatus(request.get("status"));
                    if (request.containsKey("email")) examiner.setEmail(request.get("email"));
                    if (request.containsKey("role")) examiner.setRole(request.get("role"));
                    if (request.containsKey("password")) {
                        examiner.setPassword(passwordEncoder.encode(request.get("password")));
                    }
                    Examiner saved = examinerRepository.save(examiner);
                    log.info("✅ Examiner updated: {} ({})", saved.getFullName(), saved.getEmployeeId());
                    return ResponseEntity.ok(toExaminerResponse(saved));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Deactivate examiner (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivateExaminer(@PathVariable Long id) {
        return examinerRepository.findById(id)
                .map(examiner -> {
                    examiner.setStatus("INACTIVE");
                    examinerRepository.save(examiner);
                    log.info("⚠️ Examiner deactivated: {} ({})", examiner.getFullName(), examiner.getEmployeeId());
                    return ResponseEntity.ok("Examiner deactivated");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get examiner workload (count of assigned applications)
     */
    @GetMapping("/{id}/workload")
    public ResponseEntity<?> getExaminerWorkload(@PathVariable Long id) {
        return examinerRepository.findById(id)
                .map(examiner -> {
                    long count = companyProfileRepository.countByAssignedExaminer(examiner.getFullName());
                    Map<String, Object> response = new HashMap<>();
                    response.put("examinerId", id);
                    response.put("examinerName", examiner.getFullName());
                    response.put("assignedCount", count);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Convert Examiner entity to response map (excluding password)
     */
    private Map<String, Object> toExaminerResponse(Examiner examiner) {
        // Count workload
        long workload = companyProfileRepository.countByAssignedExaminer(examiner.getFullName());

        Map<String, Object> map = new HashMap<>();
        map.put("id", examiner.getId());
        map.put("employeeId", examiner.getEmployeeId());
        map.put("fullName", examiner.getFullName());
        map.put("username", examiner.getUsername());
        map.put("role", examiner.getRole());
        map.put("designation", examiner.getDesignation());
        map.put("status", examiner.getStatus());
        map.put("email", examiner.getEmail());
        map.put("createdAt", examiner.getCreatedAt());
        map.put("createdBy", examiner.getCreatedBy());
        map.put("workload", workload);
        return map;
    }
}
