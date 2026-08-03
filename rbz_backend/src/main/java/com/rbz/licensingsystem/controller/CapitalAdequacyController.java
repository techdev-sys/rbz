package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CapitalAdequacyReturn;
import com.rbz.licensingsystem.repository.CapitalAdequacyReturnRepository;
import com.rbz.licensingsystem.service.CompanyAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@RestController
@RequestMapping("/api/capital-adequacy")
@RequiredArgsConstructor
public class CapitalAdequacyController {

    private final CapitalAdequacyReturnRepository repository;
    private final CompanyAccessService companyAccessService;

    @PostMapping("/save")
    public ResponseEntity<CapitalAdequacyReturn> save(@RequestBody CapitalAdequacyReturn data) {
        companyAccessService.assertCanAccessCompany(data.getCompanyId());
        if (data.getCompanyId() != null) {
            repository.findByCompanyId(data.getCompanyId())
                    .ifPresent(existing -> data.setId(existing.getId()));
        }
        computeRatios(data);
        return ResponseEntity.ok(repository.save(data));
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<CapitalAdequacyReturn> get(@PathVariable Long companyId) {
        companyAccessService.assertCanAccessCompany(companyId);
        return repository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void computeRatios(CapitalAdequacyReturn d) {
        if (d.getTier1Capital() == null || d.getTier2Capital() == null || d.getRiskWeightedAssets() == null) {
            return;
        }
        BigDecimal rwa = d.getRiskWeightedAssets();
        if (rwa.compareTo(BigDecimal.ZERO) == 0) return;

        BigDecimal totalCapital = d.getTier1Capital().add(d.getTier2Capital());
        BigDecimal car = totalCapital.divide(rwa, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal t1Ratio = d.getTier1Capital().divide(rwa, 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);

        d.setCapitalAdequacyRatio(car);
        d.setTier1Ratio(t1Ratio);

        // RBZ thresholds
        BigDecimal minPaidUp = new BigDecimal("30000000"); // USD 30M
        BigDecimal minCAR = new BigDecimal("12");          // 12%

        d.setMeetsMinimumPaidUpCapital(
                d.getPaidUpShareCapital() != null && d.getPaidUpShareCapital().compareTo(minPaidUp) >= 0);
        d.setMeetsMinimumCAR(car.compareTo(minCAR) >= 0);
        d.setTier2WithinLimit(d.getTier2Capital().compareTo(d.getTier1Capital()) <= 0);
    }
}
