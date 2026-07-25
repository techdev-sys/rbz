package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.DepositProtection;
import com.rbz.licensingsystem.repository.DepositProtectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/deposit-protection")
@RequiredArgsConstructor
public class DepositProtectionController {

    private final DepositProtectionRepository repository;

    @PostMapping("/save")
    public ResponseEntity<DepositProtection> save(@RequestBody DepositProtection data) {
        DepositProtection existing = repository.findByCompanyId(data.getCompanyId()).orElse(null);
        if (existing != null) {
            data.setId(existing.getId());
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<DepositProtection> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
