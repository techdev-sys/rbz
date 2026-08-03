package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.ComplianceDocumentation;
import com.rbz.licensingsystem.repository.ComplianceDocumentationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compliance")
@RequiredArgsConstructor
public class ComplianceDocumentationController {

    private final ComplianceDocumentationRepository repository;

    @PostMapping("/save")
    public ResponseEntity<ComplianceDocumentation> save(@RequestBody ComplianceDocumentation data) {
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId()).ifPresent(existing -> data.setId(existing.getId()));
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ComplianceDocumentation> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
