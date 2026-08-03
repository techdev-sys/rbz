package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.EvaluationReport;
import com.rbz.licensingsystem.model.enums.InstitutionType;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.EvaluationReportRepository;
import com.rbz.licensingsystem.service.InstitutionReportGenerationService;
import com.rbz.licensingsystem.service.LearningService;
import com.rbz.licensingsystem.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * Institution-neutral report controller at /api/report/**.
 * The legacy /api/mfi-report/** paths still work via MFIReportController.
 */
@RestController
@RequestMapping("/api/report")
@RequiredArgsConstructor
public class InstitutionReportController {

    private final InstitutionReportGenerationService reportService;
    private final EvaluationReportRepository evaluationReportRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final LearningService learningService;
    private final NotificationService notificationService;

    @SuppressWarnings("null")
    @GetMapping("/generate/{companyId}")
    public ResponseEntity<String> generateReport(@PathVariable Long companyId) {
        try {
            String html = reportService.generateHTMLReport(companyId);
            EvaluationReport report = evaluationReportRepository.findByCompanyId(companyId)
                    .orElse(new EvaluationReport());
            report.setCompanyId(companyId);
            report.setGeneratedReportHTML(html);
            report.setReportGeneratedDate(LocalDateTime.now());
            report.setWorkflowStatus("DRAFT");
            report.setCurrentApprovalLevel(0);
            // Set approval levels required based on institution type
            companyProfileRepository.findById(companyId).ifPresent(company -> {
                InstitutionType itype = reportService.resolveType(company);
                int levels = switch (itype) {
                    case COMMERCIAL_BANK -> 5;
                    case DTMFI -> 4;
                    default -> 3;
                };
                report.setApprovalLevelsRequired(levels);
            });
            evaluationReportRepository.save(report);
            return ResponseEntity.ok(html);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error generating report. Please try again.");
        }
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<EvaluationReport> getReport(@PathVariable Long companyId) {
        return evaluationReportRepository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/submit/{companyId}")
    public ResponseEntity<String> submitReport(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        EvaluationReport report = evaluationReportRepository.findByCompanyId(companyId).orElse(new EvaluationReport());
        report.setCompanyId(companyId);
        report.setPreparedBy(data.getPreparedBy());
        report.setPreparedByDesignation(data.getPreparedByDesignation());
        report.setPreparedDate(LocalDateTime.now());
        report.setRecommendation(data.getRecommendation());
        report.setRecommendationJustification(data.getRecommendationJustification());
        report.setRecommendationConditions(data.getRecommendationConditions());
        report.setWorkflowStatus("SUBMITTED");
        evaluationReportRepository.save(report);
        return ResponseEntity.ok("Report submitted successfully");
    }

    @PostMapping("/review/{companyId}")
    public ResponseEntity<String> reviewReport(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        return evaluationReportRepository.findByCompanyId(companyId).map(report -> {
            report.setReviewedBy(data.getReviewedBy());
            report.setReviewedByDesignation(data.getReviewedByDesignation());
            report.setReviewedDate(LocalDateTime.now());
            report.setWorkflowStatus("UNDER_REVIEW");
            evaluationReportRepository.save(report);
            return ResponseEntity.ok("Report under review");
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/recommend/{companyId}")
    public ResponseEntity<String> recommendReport(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        return evaluationReportRepository.findByCompanyId(companyId).map(report -> {
            report.setRecommendedBy(data.getRecommendedBy());
            report.setRecommendedByDesignation(data.getRecommendedByDesignation());
            report.setRecommendedDate(LocalDateTime.now());
            report.setCurrentApprovalLevel(3);
            // If institution needs 3 levels (MFI) this is the final pre-approval step
            int levels = report.getApprovalLevelsRequired() != null ? report.getApprovalLevelsRequired() : 3;
            report.setWorkflowStatus(levels <= 3 ? "PENDING_APPROVAL" : "PENDING_DIRECTOR");
            evaluationReportRepository.save(report);
            return ResponseEntity.ok(levels <= 3 ? "Report recommended for Registrar approval."
                    : "Report recommended — awaiting Director sign-off.");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Level 4: Director sign-off (DTMFI + Commercial Bank)
    @PostMapping("/director-sign/{companyId}")
    public ResponseEntity<String> directorSign(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        return evaluationReportRepository.findByCompanyId(companyId).map(report -> {
            int levels = report.getApprovalLevelsRequired() != null ? report.getApprovalLevelsRequired() : 3;
            if (levels < 4) {
                return ResponseEntity.status(400).body("Director sign-off not required for this institution type.");
            }
            if (!"PENDING_DIRECTOR".equals(report.getWorkflowStatus())) {
                return ResponseEntity.status(400).body("Report is not at the Director sign-off stage.");
            }
            report.setDirectorSignedBy(data.getDirectorSignedBy());
            report.setDirectorSignedByDesignation(data.getDirectorSignedByDesignation());
            report.setDirectorSignedDate(LocalDateTime.now());
            report.setDirectorComments(data.getDirectorComments());
            report.setCurrentApprovalLevel(4);
            report.setWorkflowStatus(levels >= 5 ? "PENDING_GOVERNOR" : "PENDING_APPROVAL");
            evaluationReportRepository.save(report);
            learningService.captureEvent("SENIOR", data.getDirectorSignedBy(), companyId, "DIRECTOR_SIGN",
                    "Director sign-off by " + data.getDirectorSignedBy(), "");
            return ResponseEntity.ok(levels >= 5
                    ? "Director sign-off recorded — awaiting Governor approval."
                    : "Director sign-off recorded — awaiting Registrar final approval.");
        }).orElse(ResponseEntity.notFound().build());
    }

    // Level 5: Governor / Deputy Governor sign-off (Commercial Bank only)
    @PostMapping("/governor-sign/{companyId}")
    public ResponseEntity<String> governorSign(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        return evaluationReportRepository.findByCompanyId(companyId).map(report -> {
            int levels = report.getApprovalLevelsRequired() != null ? report.getApprovalLevelsRequired() : 3;
            if (levels < 5) {
                return ResponseEntity.status(400).body("Governor sign-off not required for this institution type.");
            }
            if (!"PENDING_GOVERNOR".equals(report.getWorkflowStatus())) {
                return ResponseEntity.status(400).body("Report is not at the Governor sign-off stage.");
            }
            report.setGovernorSignedBy(data.getGovernorSignedBy());
            report.setGovernorSignedByDesignation(data.getGovernorSignedByDesignation());
            report.setGovernorSignedDate(LocalDateTime.now());
            report.setGovernorComments(data.getGovernorComments());
            report.setCurrentApprovalLevel(5);
            report.setWorkflowStatus("PENDING_APPROVAL");
            evaluationReportRepository.save(report);
            learningService.captureEvent("SENIOR", data.getGovernorSignedBy(), companyId, "GOVERNOR_SIGN",
                    "Governor sign-off by " + data.getGovernorSignedBy(), "");
            return ResponseEntity.ok("Governor sign-off recorded — awaiting final Registrar approval.");
        }).orElse(ResponseEntity.notFound().build());
    }

    @SuppressWarnings("null")
    @PostMapping("/approve/{companyId}")
    public ResponseEntity<String> approveReport(@PathVariable Long companyId, @RequestBody EvaluationReport data) {
        String approver = data.getApprovedBy();
        var reportOpt = evaluationReportRepository.findByCompanyId(companyId);
        var companyOpt = companyProfileRepository.findById(companyId);

        if (reportOpt.isPresent()) {
            String preparedBy = reportOpt.get().getPreparedBy();
            if (preparedBy != null && preparedBy.equalsIgnoreCase(approver)) {
                return ResponseEntity.status(403).body(
                        "Maker-checker violation: the officer who prepared this report cannot also approve it.");
            }
            // Enforce that all prior chain levels are complete
            int levels = reportOpt.get().getApprovalLevelsRequired() != null ? reportOpt.get().getApprovalLevelsRequired() : 3;
            String status = reportOpt.get().getWorkflowStatus();
            if (levels >= 4 && !"PENDING_APPROVAL".equals(status) && !"PENDING_DIRECTOR".equals(status)) {
                if ("PENDING_DIRECTOR".equals(status))
                    return ResponseEntity.status(400).body("Director sign-off required before final approval.");
                if ("PENDING_GOVERNOR".equals(status))
                    return ResponseEntity.status(400).body("Governor sign-off required before final approval.");
            }
        }
        if (companyOpt.isPresent()) {
            String assigned = companyOpt.get().getAssignedExaminer();
            if (assigned != null && assigned.equalsIgnoreCase(approver)) {
                return ResponseEntity.status(403).body(
                        "Maker-checker violation: the assigned examiner cannot approve their own review.");
            }
        }

        return reportOpt.map(report -> {
            report.setFinalApprovalStatus(data.getFinalApprovalStatus());
            report.setApprovedBy(approver);
            report.setApprovedByDesignation(data.getApprovedByDesignation());
            report.setApprovalDate(LocalDateTime.now());
            report.setApprovalComments(data.getApprovalComments());
            String newStatus = "APPROVED".equals(data.getFinalApprovalStatus()) ? "APPROVED" : "REJECTED";
            report.setWorkflowStatus(newStatus);
            evaluationReportRepository.save(report);

            companyOpt.ifPresent(company -> {
                company.setApplicationStatus(newStatus);
                if ("APPROVED".equals(newStatus)) {
                    company.setLicenseGrantedDate(java.time.LocalDate.now());
                    if (company.getLicenseExpiryDate() == null)
                        company.setLicenseExpiryDate(java.time.LocalDate.now().plusYears(1));
                    if (company.getLicenseNumber() == null || company.getLicenseNumber().isBlank()) {
                        InstitutionType itype = reportService.resolveType(company);
                        String prefix = reportService.licensePrefix(itype);
                        long existing = companyProfileRepository.countByLicenseNumberIsNotNull();
                        String code = String.format("%s/%d/%03d", prefix, java.time.LocalDate.now().getYear(), existing + 1);
                        company.setLicenseNumber(code);
                        learningService.captureEvent("SENIOR", approver, companyId, "LICENSE_ISSUED",
                                "License " + code + " issued.", "");
                    }
                }
                companyProfileRepository.save(company);
            });

            learningService.captureEvent("SENIOR", approver, companyId, "REPORT_" + newStatus,
                    "Report " + newStatus.toLowerCase() + " by " + approver, "");

            String licenseNumber = companyOpt.map(c -> c.getLicenseNumber()).orElse(null);
            notificationService.finalDecision(companyId, "APPROVED".equals(newStatus), licenseNumber);

            return ResponseEntity.ok("Report " + newStatus.toLowerCase());
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<EvaluationReport>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(evaluationReportRepository.findByWorkflowStatus(status.toUpperCase()));
    }

    @GetMapping("/pending-review")
    public ResponseEntity<List<EvaluationReport>> getPendingReview() {
        return ResponseEntity.ok(evaluationReportRepository.findByWorkflowStatusIn(
                Arrays.asList("SUBMITTED", "UNDER_REVIEW", "PENDING_APPROVAL",
                        "PENDING_DIRECTOR", "PENDING_GOVERNOR")));
    }
}
