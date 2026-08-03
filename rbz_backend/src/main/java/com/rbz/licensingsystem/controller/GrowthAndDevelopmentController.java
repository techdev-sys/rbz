package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.GrowthAndDevelopment;
import com.rbz.licensingsystem.repository.GrowthAndDevelopmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/growth")
@RequiredArgsConstructor
public class GrowthAndDevelopmentController {

    private final GrowthAndDevelopmentRepository repository;

    @PostMapping("/save")
    public ResponseEntity<GrowthAndDevelopment> save(@RequestBody GrowthAndDevelopment data) {
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId()).ifPresent(existing -> data.setId(existing.getId()));
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<GrowthAndDevelopment> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
