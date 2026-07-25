package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.ComplaintsHandling;
import com.rbz.licensingsystem.repository.ComplaintsHandlingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintsHandlingController {

    private final ComplaintsHandlingRepository repository;

    @PostMapping("/save")
    public ResponseEntity<ComplaintsHandling> save(@RequestBody ComplaintsHandling data) {
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId()).ifPresent(existing -> data.setId(existing.getId()));
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<ComplaintsHandling> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
