package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.RecoveryResolution;
import com.rbz.licensingsystem.repository.RecoveryResolutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recovery-resolution")
@RequiredArgsConstructor
public class RecoveryResolutionController {

    private final RecoveryResolutionRepository repository;

    @PostMapping("/save")
    public ResponseEntity<RecoveryResolution> save(@RequestBody RecoveryResolution data) {
        RecoveryResolution existing = repository.findByCompanyId(data.getCompanyId()).orElse(null);
        if (existing != null) {
            data.setId(existing.getId());
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<RecoveryResolution> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
