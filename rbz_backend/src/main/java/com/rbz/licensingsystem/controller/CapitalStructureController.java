package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CapitalStructure;
import com.rbz.licensingsystem.repository.CapitalStructureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/capital")
@RequiredArgsConstructor
public class CapitalStructureController {

    private final CapitalStructureRepository repository;

    @PostMapping("/save")
    public ResponseEntity<CapitalStructure> save(@RequestBody CapitalStructure data) {
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId()).ifPresent(existing -> data.setId(existing.getId()));
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CapitalStructure> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
