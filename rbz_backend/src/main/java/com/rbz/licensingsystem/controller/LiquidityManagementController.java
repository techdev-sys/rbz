package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.LiquidityManagement;
import com.rbz.licensingsystem.repository.LiquidityManagementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/liquidity")
@RequiredArgsConstructor
public class LiquidityManagementController {

    private final LiquidityManagementRepository repository;

    @PostMapping("/save")
    public ResponseEntity<LiquidityManagement> save(@RequestBody LiquidityManagement data) {
        computeRatios(data);
        LiquidityManagement existing = repository.findByCompanyId(data.getCompanyId()).orElse(null);
        if (existing != null) {
            data.setId(existing.getId());
        }
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<LiquidityManagement> get(@PathVariable Long companyId) {
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void computeRatios(LiquidityManagement d) {
        // Compute total HQLA: Level1 + 0.85*Level2A + 0.5*Level2B
        BigDecimal l1 = nvl(d.getHqlaLevel1());
        BigDecimal l2a = nvl(d.getHqlaLevel2A()).multiply(new BigDecimal("0.85"));
        BigDecimal l2b = nvl(d.getHqlaLevel2B()).multiply(new BigDecimal("0.50"));
        BigDecimal hqla = l1.add(l2a).add(l2b);
        d.setTotalHqla(hqla);

        // LCR
        if (d.getTotalNetCashOutflows30Days() != null && d.getTotalNetCashOutflows30Days().compareTo(BigDecimal.ZERO) > 0) {
            d.setLiquidityCoverageRatio(hqla.divide(d.getTotalNetCashOutflows30Days(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP));
        }

        // NSFR
        if (d.getAvailableStableFunding() != null && d.getRequiredStableFunding() != null
                && d.getRequiredStableFunding().compareTo(BigDecimal.ZERO) > 0) {
            d.setNetStableFundingRatio(d.getAvailableStableFunding()
                    .divide(d.getRequiredStableFunding(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP));
        }

        // Traditional liquidity ratio
        if (d.getLiquidAssets() != null && d.getTotalDeposits() != null
                && d.getTotalDeposits().compareTo(BigDecimal.ZERO) > 0) {
            d.setLiquidityRatio(d.getLiquidAssets()
                    .divide(d.getTotalDeposits(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP));
        }
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
