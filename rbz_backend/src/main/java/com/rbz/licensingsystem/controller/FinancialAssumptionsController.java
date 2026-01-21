package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.FinancialAssumptions;
import com.rbz.licensingsystem.repository.FinancialAssumptionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Stage 6: Financial Assumptions & Projections Controller
 */
@RestController
@RequestMapping("/api/assumptions")
public class FinancialAssumptionsController {

    @Autowired
    private FinancialAssumptionsRepository financialAssumptionsRepository;

    /**
     * Save or update financial assumptions
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveFinancialAssumptions(@RequestBody FinancialAssumptions assumptions) {
        try {
            FinancialAssumptions saved = financialAssumptionsRepository.save(assumptions);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving financial assumptions: " + e.getMessage());
        }
    }

    /**
     * Get financial assumptions by company ID
     */
    @GetMapping("/list/{companyId}")
    public ResponseEntity<?> getFinancialAssumptions(@PathVariable Long companyId) {
        try {
            List<FinancialAssumptions> assumptions = financialAssumptionsRepository.findByCompanyId(companyId);
            return ResponseEntity.ok(assumptions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching financial assumptions: " + e.getMessage());
        }
    }

    /**
     * Get a single assumption by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getFinancialAssumptionById(@PathVariable Long id) {
        try {
            return financialAssumptionsRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching financial assumption: " + e.getMessage());
        }
    }

    /**
     * Delete a financial assumption
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFinancialAssumption(@PathVariable Long id) {
        try {
            financialAssumptionsRepository.deleteById(id);
            return ResponseEntity.ok("Financial assumption deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting financial assumption: " + e.getMessage());
        }
    }
}
