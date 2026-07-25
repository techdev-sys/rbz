package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.SanctionsEntry;
import com.rbz.licensingsystem.repository.SanctionsEntryRepository;
import com.rbz.licensingsystem.service.AmlScreeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/aml")
@RequiredArgsConstructor
public class AmlScreeningController {

    private final AmlScreeningService amlScreeningService;
    private final SanctionsEntryRepository sanctionsRepository;

    @PostMapping("/screen/{companyId}")
    public ResponseEntity<Map<String, Object>> screenCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(amlScreeningService.screenCompany(companyId));
    }

    @PostMapping("/screen-name")
    public ResponseEntity<List<Map<String, Object>>> screenName(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "");
        String idNumber = body.get("idNumber");
        return ResponseEntity.ok(amlScreeningService.screenName(name, idNumber));
    }

    // Sanctions list management (SENIOR_BE only — secured in SecurityConfiguration)
    @GetMapping("/sanctions")
    public ResponseEntity<List<SanctionsEntry>> listSanctions() {
        return ResponseEntity.ok(sanctionsRepository.findByActiveTrue());
    }

    @PostMapping("/sanctions")
    public ResponseEntity<SanctionsEntry> addSanction(@RequestBody SanctionsEntry entry) {
        entry.setActive(true);
        return ResponseEntity.ok(sanctionsRepository.save(entry));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/sanctions/{id}")
    public ResponseEntity<Void> deactivateSanction(@PathVariable Long id) {
        sanctionsRepository.findById(id).ifPresent(entry -> {
            entry.setActive(false);
            sanctionsRepository.save(entry);
        });
        return ResponseEntity.noContent().build();
    }
}
