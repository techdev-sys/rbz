package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.service.LicenseLifecycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/license-lifecycle")
@RequiredArgsConstructor
public class LicenseLifecycleController {

    private final LicenseLifecycleService lifecycleService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return ResponseEntity.ok(lifecycleService.getExpiryDashboard());
    }

    @PostMapping("/renew/{companyId}")
    public ResponseEntity<Map<String, Object>> renewLicense(
            @PathVariable Long companyId,
            @RequestBody Map<String, String> body) {
        String renewedBy = body.getOrDefault("renewedBy", "SYSTEM");
        try {
            return ResponseEntity.ok(lifecycleService.renewLicense(companyId, renewedBy));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/run-expiry-check")
    public ResponseEntity<String> runManualCheck() {
        lifecycleService.checkLicenseExpiry();
        return ResponseEntity.ok("Expiry check completed");
    }
}
