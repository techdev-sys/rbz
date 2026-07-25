package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.LoanDistribution;
import com.rbz.licensingsystem.repository.LoanDistributionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/loan-distribution")
@RequiredArgsConstructor
public class LoanDistributionController {

    private final LoanDistributionRepository repository;

    @SuppressWarnings("null")
    @PostMapping("/save")
    public ResponseEntity<LoanDistribution> save(@RequestBody LoanDistribution data) {
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/list/{companyId}")
    public ResponseEntity<List<LoanDistribution>> list(@PathVariable Long companyId) {
        return ResponseEntity.ok(repository.findByCompanyId(companyId));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
