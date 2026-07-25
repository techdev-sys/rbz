package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.service.ExternalVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/external-verify")
@RequiredArgsConstructor
public class ExternalVerificationController {

    private final ExternalVerificationService verificationService;

    @GetMapping("/tax/{registrationNumber}")
    public ResponseEntity<Map<String, Object>> verifyTax(@PathVariable String registrationNumber) {
        return ResponseEntity.ok(verificationService.verifyTaxCompliance(registrationNumber));
    }

    @GetMapping("/credit")
    public ResponseEntity<Map<String, Object>> getCreditHistory(
            @RequestParam String idNumber,
            @RequestParam String fullName) {
        return ResponseEntity.ok(verificationService.getCreditHistory(idNumber, fullName));
    }

    @GetMapping("/ubo/{registrationNumber}")
    public ResponseEntity<Map<String, Object>> checkUbo(@PathVariable String registrationNumber) {
        return ResponseEntity.ok(verificationService.checkBeneficialOwnership(registrationNumber));
    }
}
