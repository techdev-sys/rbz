package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LicenseLifecycleService {

    private final CompanyProfileRepository companyProfileRepository;
    private final LearningService learningService;

    /**
     * Runs daily at 07:00 to check for expiring and expired licenses.
     */
    @Scheduled(cron = "0 0 7 * * *")
    @Transactional
    public void checkLicenseExpiry() {
        LocalDate today = LocalDate.now();
        LocalDate warningDate = today.plusDays(60);

        // Licenses expiring within 60 days → DUE_SOON
        List<CompanyProfile> expiringSoon = companyProfileRepository
                .findByLicenseExpiryDateBetweenAndApplicationStatus(today, warningDate, "APPROVED");
        for (CompanyProfile company : expiringSoon) {
            if (!"DUE_SOON".equals(company.getRenewalStatus())) {
                company.setRenewalStatus("DUE_SOON");
                companyProfileRepository.save(company);
                learningService.captureEvent("SYSTEM", "LifecycleScheduler", company.getId(),
                        "LICENSE_DUE_SOON",
                        "License expiring on " + company.getLicenseExpiryDate() + " — renewal required.", "");
                log.info("License DUE_SOON: {} (expires {})", company.getCompanyName(), company.getLicenseExpiryDate());
            }
        }

        // Licenses already expired → OVERDUE
        List<CompanyProfile> expired = companyProfileRepository
                .findByLicenseExpiryDateBeforeAndApplicationStatus(today, "APPROVED");
        for (CompanyProfile company : expired) {
            if (!"OVERDUE".equals(company.getRenewalStatus())) {
                company.setRenewalStatus("OVERDUE");
                companyProfileRepository.save(company);
                learningService.captureEvent("SYSTEM", "LifecycleScheduler", company.getId(),
                        "LICENSE_OVERDUE",
                        "License expired on " + company.getLicenseExpiryDate() + " — still operating without renewal.", "");
                log.warn("License OVERDUE: {} (expired {})", company.getCompanyName(), company.getLicenseExpiryDate());
            }
        }

        log.info("License expiry check complete — {} DUE_SOON, {} OVERDUE", expiringSoon.size(), expired.size());
    }

    /**
     * Mark license as renewed: extend by one year, reset status.
     */
    @SuppressWarnings("null")
    @Transactional
    public Map<String, Object> renewLicense(Long companyId, String renewedBy) {
        CompanyProfile company = companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found: " + companyId));

        LocalDate previousExpiry = company.getLicenseExpiryDate();
        LocalDate newExpiry = (previousExpiry != null && previousExpiry.isAfter(LocalDate.now()))
                ? previousExpiry.plusYears(1)
                : LocalDate.now().plusYears(1);

        company.setLicenseExpiryDate(newExpiry);
        company.setRenewalStatus("RENEWED");
        companyProfileRepository.save(company);

        learningService.captureEvent("SENIOR", renewedBy, companyId,
                "LICENSE_RENEWED",
                "License renewed by " + renewedBy + ". Previous expiry: " + previousExpiry + ". New expiry: " + newExpiry,
                "");

        Map<String, Object> result = new HashMap<>();
        result.put("companyId", companyId);
        result.put("companyName", company.getCompanyName());
        result.put("previousExpiry", previousExpiry);
        result.put("newExpiry", newExpiry);
        result.put("renewedBy", renewedBy);
        return result;
    }

    /**
     * Returns summary of all license expiry statuses for the Senior dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getExpiryDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate in30days = today.plusDays(30);
        LocalDate in60days = today.plusDays(60);

        List<CompanyProfile> dueSoon = companyProfileRepository
                .findByLicenseExpiryDateBetweenAndApplicationStatus(today, in60days, "APPROVED");
        List<CompanyProfile> overdue = companyProfileRepository
                .findByLicenseExpiryDateBeforeAndApplicationStatus(today, "APPROVED");

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("criticalExpiry", dueSoon.stream()
                .filter(c -> c.getLicenseExpiryDate().isBefore(in30days))
                .map(this::toSummary).collect(Collectors.toList()));
        dashboard.put("upcomingExpiry", dueSoon.stream()
                .filter(c -> !c.getLicenseExpiryDate().isBefore(in30days))
                .map(this::toSummary).collect(Collectors.toList()));
        dashboard.put("overdue", overdue.stream().map(this::toSummary).collect(Collectors.toList()));
        dashboard.put("totalAlerts", dueSoon.size() + overdue.size());
        return dashboard;
    }

    private Map<String, Object> toSummary(CompanyProfile c) {
        Map<String, Object> m = new HashMap<>();
        m.put("companyId", c.getId());
        m.put("companyName", c.getCompanyName());
        m.put("licenseNumber", c.getLicenseNumber());
        m.put("licenseType", c.getLicenseType());
        m.put("expiryDate", c.getLicenseExpiryDate());
        m.put("renewalStatus", c.getRenewalStatus());
        return m;
    }
}
