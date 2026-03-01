package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Examiner;
import com.rbz.licensingsystem.repository.ExaminerRepository;
import com.rbz.licensingsystem.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtUtil jwtUtil;
    private final ExaminerRepository examinerRepository;
    private final com.rbz.licensingsystem.repository.CompanyProfileRepository companyProfileRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        String role = credentials.get("role");

        // --- APPLICANT: Mock login ---
        if ("applicant".equals(role)) {
            String token = jwtUtil.generateToken(username != null ? username : "applicant", "APPLICANT");
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            
            if (username != null) {
                Optional<com.rbz.licensingsystem.model.CompanyProfile> profileOpt = 
                    companyProfileRepository.findByEmailAddress(username);
                    
                if (profileOpt.isPresent()) {
                    com.rbz.licensingsystem.model.CompanyProfile profile = profileOpt.get();
                    response.put("companyId", profile.getId());
                    response.put("companyName", profile.getCompanyName());
                    response.put("contactPersonName", profile.getContactPersonName());
                    response.put("applicationStatus", profile.getApplicationStatus());
                }
            }
            return ResponseEntity.ok(response);
        }

        // --- SENIOR BE: Mock login ---
        if ("senior_be".equals(role)) {
            String token = jwtUtil.generateToken(username != null ? username : "dd_be", "SENIOR_BE");
            return ResponseEntity.ok(Map.of("token", token));
        }

        // --- EXAMINER: DB-backed login ---
        if ("examiner".equals(role)) {
            if (username == null || password == null) {
                return ResponseEntity.status(401).body("Username and password are required");
            }

            Optional<Examiner> examinerOpt = examinerRepository.findByUsername(username);
            if (examinerOpt.isEmpty()) {
                log.warn("Login failed: examiner username '{}' not found", username);
                return ResponseEntity.status(401).body("Invalid username or password");
            }

            Examiner examiner = examinerOpt.get();

            if (!"ACTIVE".equals(examiner.getStatus())) {
                log.warn("Login failed: examiner '{}' is {}", username, examiner.getStatus());
                return ResponseEntity.status(401).body("Account is not active. Contact Senior Examiner.");
            }

            if (!passwordEncoder.matches(password, examiner.getPassword())) {
                log.warn("Login failed: invalid password for examiner '{}'", username);
                return ResponseEntity.status(401).body("Invalid username or password");
            }

            String token = jwtUtil.generateToken(examiner.getFullName(), examiner.getRole());

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("fullName", examiner.getFullName());
            response.put("employeeId", examiner.getEmployeeId());
            response.put("designation", examiner.getDesignation());
            response.put("role", examiner.getRole());

            log.info("✅ Examiner login successful: {} ({})", examiner.getFullName(), examiner.getEmployeeId());
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.status(401).body("Invalid credentials");
    }
}
