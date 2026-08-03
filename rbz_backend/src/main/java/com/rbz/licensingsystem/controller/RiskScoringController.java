package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.service.RiskScoringService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/risk")
@RequiredArgsConstructor
public class RiskScoringController {

    private final RiskScoringService riskScoringService;

    @GetMapping("/{companyId}")
    public ResponseEntity<Map<String, Object>> getScore(@PathVariable Long companyId) {
        try {
            return ResponseEntity.ok(riskScoringService.scoreApplication(companyId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{companyId}/calculate")
    public ResponseEntity<Map<String, Object>> calculateAndSave(@PathVariable Long companyId) {
        try {
            riskScoringService.saveScore(companyId);
            return ResponseEntity.ok(riskScoringService.scoreApplication(companyId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
