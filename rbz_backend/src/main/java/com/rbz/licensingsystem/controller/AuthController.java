package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.model.Examiner;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.ExaminerRepository;
import com.rbz.licensingsystem.security.JwtUtil;
import com.rbz.licensingsystem.security.TokenBlocklist;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final JwtUtil jwtUtil;
    private final ExaminerRepository examinerRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenBlocklist tokenBlocklist;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        String role = credentials.get("role");

        // --- APPLICANT: DB-backed login ---
        if ("applicant".equals(role)) {
            if (username == null) {
                return ResponseEntity.status(401).body("Email is required");
            }

            Map<String, Object> response = new HashMap<>();
            List<CompanyProfile> profiles = companyProfileRepository.findAllByEmailAddress(username);

            if (profiles.size() > 1) {
                log.error("Duplicate accounts for email '{}': {} rows. Administrator must deduplicate.", username, profiles.size());
                return ResponseEntity.status(409)
                        .body("We are unable to sign you in at the moment. Please contact the Reserve Bank licensing office for assistance.");
            }

            if (!profiles.isEmpty()) {
                CompanyProfile profile = profiles.get(0);
                // Password is mandatory for any existing profile. Accounts that pre-date
                // password support must reset via the registration flow before logging in.
                // Accounts that pre-date password support cannot sign in until re-registered.
                // Deliberately indistinguishable from a wrong password: internal account
                // state must never be revealed to an unauthenticated caller.
                if (profile.getPassword() == null || profile.getPassword().isEmpty()) {
                    log.warn("Applicant login refused: account '{}' has no password set", username);
                    return ResponseEntity.status(401).body("Invalid email or password");
                }
                if (password == null || !passwordEncoder.matches(password, profile.getPassword())) {
                    log.warn("Applicant login failed: invalid password for '{}'", username);
                    return ResponseEntity.status(401).body("Invalid email or password");
                }
                String token = jwtUtil.generateToken(username, "APPLICANT");
                response.put("token", token);
                response.put("companyId", profile.getId());
                response.put("companyName", profile.getCompanyName());
                response.put("contactPersonName", profile.getContactPersonName());
                response.put("applicationStatus", profile.getApplicationStatus());
                response.put("institutionType",
                        profile.getInstitutionType() != null ? profile.getInstitutionType().name() : "MFI");
                log.info("Applicant login: {} (company: {}, type: {})",
                        username, profile.getCompanyName(), profile.getInstitutionType());
            } else {
                // Unknown email. Never issue a token for an account that does not
                // exist — registration is the only way to create an account.
                // Same message as a wrong password so callers cannot probe
                // which email addresses are registered.
                log.warn("Applicant login failed: no account for '{}'", username);
                return ResponseEntity.status(401).body("Invalid email or password");
            }
            return ResponseEntity.ok(response);
        }

        // --- SENIOR BE: DB-backed login (uses Examiner table with SENIOR_BE role) ---
        if ("senior_be".equals(role)) {
            if (username == null || password == null) {
                return ResponseEntity.status(401).body("Username and password are required");
            }

            Optional<Examiner> examinerOpt = examinerRepository.findByUsername(username);
            if (examinerOpt.isEmpty()) {
                log.warn("Senior BE login failed: username '{}' not found", username);
                return ResponseEntity.status(401).body("Invalid username or password");
            }

            Examiner examiner = examinerOpt.get();

            if (!"SENIOR_BE".equals(examiner.getRole()) && !"SENIOR_EXAMINER".equals(examiner.getRole())) {
                log.warn("Senior BE login failed: '{}' does not have senior role (has: {})", username, examiner.getRole());
                return ResponseEntity.status(403).body("Access denied: insufficient role");
            }

            if (!"ACTIVE".equals(examiner.getStatus())) {
                return ResponseEntity.status(401).body("Account is not active. Contact administrator.");
            }

            if (!passwordEncoder.matches(password, examiner.getPassword())) {
                log.warn("Senior BE login failed: invalid password for '{}'", username);
                return ResponseEntity.status(401).body("Invalid username or password");
            }

            String token = jwtUtil.generateToken(examiner.getFullName(), "SENIOR_BE");
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("fullName", examiner.getFullName());
            response.put("employeeId", examiner.getEmployeeId());
            response.put("role", "SENIOR_BE");
            log.info("Senior BE login: {} ({})", examiner.getFullName(), examiner.getEmployeeId());
            return ResponseEntity.ok(response);
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

    /**
     * Create a new applicant account. The account (with its password) is created
     * atomically here — a token is only ever issued for an account that exists
     * and holds a hashed password.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerApplicant(@RequestBody Map<String, String> body) {
        String email = body.get("email") == null ? null : body.get("email").trim();
        String password = body.get("password");
        String companyName = body.get("companyName");
        String contactPersonName = body.get("contactPersonName");

        if (email == null || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return ResponseEntity.badRequest().body("A valid email address is required.");
        }
        if (password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body("Password must be at least 8 characters.");
        }
        if (!companyProfileRepository.findAllByEmailAddress(email).isEmpty()) {
            return ResponseEntity.status(409)
                    .body("An account with this email address already exists. Please sign in instead.");
        }

        CompanyProfile profile = new CompanyProfile();
        profile.setEmailAddress(email);
        profile.setPassword(passwordEncoder.encode(password));
        profile.setCompanyName(companyName);
        profile.setContactPersonName(contactPersonName);
        profile.setApplicationStatus("DRAFT");
        CompanyProfile saved = companyProfileRepository.save(profile);

        String token = jwtUtil.generateToken(email, "APPLICANT");
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("companyId", saved.getId());
        response.put("companyName", saved.getCompanyName());
        response.put("contactPersonName", saved.getContactPersonName());
        response.put("applicationStatus", saved.getApplicationStatus());
        response.put("institutionType", "MFI");
        log.info("New applicant registered: {} (company id {})", email, saved.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Invalidate the bearer token so it can no longer be used. The blocklist
     * holds the token until its natural `exp`, after which it would be
     * rejected anyway.
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok().body("ok");
        }
        String token = authHeader.substring(7);
        try {
            long expiry = jwtUtil.extractExpiration(token).getTime();
            tokenBlocklist.revoke(token, expiry);
            log.info("Token revoked via logout");
        } catch (Exception e) {
            // Token already invalid or unparseable — nothing to do.
        }
        return ResponseEntity.ok().body("ok");
    }
}
