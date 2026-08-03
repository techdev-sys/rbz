package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.ITCyberRisk;
import com.rbz.licensingsystem.repository.ITCyberRiskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/it-cyber-risk")
@RequiredArgsConstructor
public class ITCyberRiskController {

    private final ITCyberRiskRepository repository;

    @PostMapping("/save")
    public ResponseEntity<ITCyberRisk> save(@RequestBody ITCyberRisk data) {
        ITCyberRisk existing = repository.findByCompanyId(data.getCompanyId()).orElse(null);
        if (existing != null) {
            data.setId(existing.getId());
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ITCyberRisk> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
