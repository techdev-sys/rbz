package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Public (no-auth) endpoint for QR code licence verification.
 * Scanned QR codes resolve to GET /api/public/verify-licence?num=MFI/2026/001
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicLicenceVerificationController {

    private final CompanyProfileRepository companyProfileRepository;

    private static final DateTimeFormatter DISPLAY_FMT =
            DateTimeFormatter.ofPattern("dd MMMM yyyy");

    @GetMapping("/verify-licence")
    public ResponseEntity<Map<String, Object>> verifyLicence(
            @RequestParam(name = "num") String licenceNumber) {

        Map<String, Object> body = new LinkedHashMap<>();

        Optional<CompanyProfile> opt = companyProfileRepository.findByLicenseNumber(licenceNumber);

        if (opt.isEmpty()) {
            body.put("verified", false);
            body.put("message", "No licence found matching the provided number.");
            return ResponseEntity.status(404).body(body);
        }

        CompanyProfile c = opt.get();
        boolean isApproved = "APPROVED".equalsIgnoreCase(c.getApplicationStatus());

        body.put("verified", isApproved);
        body.put("licenceNumber", c.getLicenseNumber());
        body.put("institution",   c.getCompanyName());
        body.put("licenceType",   c.getLicenseType());
        body.put("dateIssued",    c.getLicenseGrantedDate() != null
                                     ? c.getLicenseGrantedDate().format(DISPLAY_FMT) : null);
        body.put("status",        isApproved ? "ACTIVE" : c.getApplicationStatus());
        body.put("issuingAuthority", "Reserve Bank of Zimbabwe — Bank Supervision Division");
        body.put("regulatoryBasis",  "Banking Act [Chapter 24:20] & Reserve Bank of Zimbabwe Act [Chapter 22:15]");

        return ResponseEntity.ok(body);
    }
}
