package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.FinancialPerformance;
import com.rbz.licensingsystem.repository.FinancialPerformanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/financials")
@RequiredArgsConstructor
public class FinancialPerformanceController {

    private final FinancialPerformanceRepository repository;

    @SuppressWarnings("null")
    @PostMapping("/save")
    public ResponseEntity<FinancialPerformance> save(@RequestBody FinancialPerformance data) {
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/list/{companyId}")
    public ResponseEntity<List<FinancialPerformance>> list(@PathVariable Long companyId) {
        return ResponseEntity.ok(repository.findByCompanyId(companyId));
    }

    @SuppressWarnings("null")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
