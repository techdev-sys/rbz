package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.model.EvaluationReport;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.EvaluationReportRepository;
import com.rbz.licensingsystem.service.LearningService;
import com.rbz.licensingsystem.service.MFIReportGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Arrays;

/**
 * Controller for MFI Evaluation Report Generation and Management
 */
@RestController
@RequestMapping("/api/mfi-report")
public class MFIReportController {

    @Autowired
    private MFIReportGenerationService reportService;

    @Autowired
    private EvaluationReportRepository evaluationReportRepository;

    @Autowired
    private CompanyProfileRepository companyProfileRepository;

    @Autowired
    private LearningService learningService;

    /**
     * Generate HTML report for a company
     */
    @GetMapping("/generate/{companyId}")
    public ResponseEntity<String> generateReport(@PathVariable Long companyId) {
        try {
            String htmlReport = reportService.generateHTMLReport(companyId);

            // Save the generated report
            EvaluationReport report = evaluationReportRepository.findByCompanyId(companyId)
                    .orElse(new EvaluationReport());

            report.setCompanyId(companyId);
            report.setGeneratedReportHTML(htmlReport);
            report.setReportGeneratedDate(LocalDateTime.now());
            report.setWorkflowStatus("DRAFT");

            evaluationReportRepository.save(report);

            return ResponseEntity.ok(htmlReport);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error generating report: " + e.getMessage());
        }
    }

    /**
     * Get existing report
     */
    @GetMapping("/{companyId}")
    public ResponseEntity<EvaluationReport> getReport(@PathVariable Long companyId) {
        return evaluationReportRepository.findByCompanyId(companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Submit report for review
     */
    @PostMapping("/submit/{companyId}")
    public ResponseEntity<String> submitReport(
            @PathVariable Long companyId,
            @RequestBody EvaluationReport reportData) {

        EvaluationReport report = evaluationReportRepository.findByCompanyId(companyId)
                .orElse(new EvaluationReport());

        report.setCompanyId(companyId);
        report.setPreparedBy(reportData.getPreparedBy());
        report.setPreparedByDesignation(reportData.getPreparedByDesignation());
        report.setPreparedDate(LocalDateTime.now());
        report.setRecommendation(reportData.getRecommendation());
        report.setRecommendationJustification(reportData.getRecommendationJustification());
        report.setRecommendationConditions(reportData.getRecommendationConditions());
        report.setWorkflowStatus("SUBMITTED");

        evaluationReportRepository.save(report);

        return ResponseEntity.ok("Report submitted successfully");
    }

    /**
     * Review report (for reviewers)
     */
    @PostMapping("/review/{companyId}")
    public ResponseEntity<String> reviewReport(
            @PathVariable Long companyId,
            @RequestBody EvaluationReport reviewData) {

        return evaluationReportRepository.findByCompanyId(companyId)
                .map(report -> {
                    report.setReviewedBy(reviewData.getReviewedBy());
                    report.setReviewedByDesignation(reviewData.getReviewedByDesignation());
                    report.setReviewedDate(LocalDateTime.now());
                    report.setWorkflowStatus("UNDER_REVIEW");
                    evaluationReportRepository.save(report);
                    return ResponseEntity.ok("Report reviewed successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Recommend report (for recommenders)
     */
    @PostMapping("/recommend/{companyId}")
    public ResponseEntity<String> recommendReport(
            @PathVariable Long companyId,
            @RequestBody EvaluationReport recommendData) {

        return evaluationReportRepository.findByCompanyId(companyId)
                .map(report -> {
                    report.setRecommendedBy(recommendData.getRecommendedBy());
                    report.setRecommendedByDesignation(recommendData.getRecommendedByDesignation());
                    report.setRecommendedDate(LocalDateTime.now());
                    report.setWorkflowStatus("PENDING_APPROVAL");
                    evaluationReportRepository.save(report);
                    return ResponseEntity.ok("Report recommended successfully");
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Final approval (Senior Bank Examiner / Registrar)
     */
    @PostMapping("/approve/{companyId}")
    public ResponseEntity<String> approveReport(
            @PathVariable Long companyId,
            @RequestBody EvaluationReport approvalData) {

        return evaluationReportRepository.findByCompanyId(companyId)
                .map(report -> {
                    report.setFinalApprovalStatus(approvalData.getFinalApprovalStatus());
                    report.setApprovedBy(approvalData.getApprovedBy());
                    report.setApprovalDate(LocalDateTime.now());
                    report.setApprovalComments(approvalData.getApprovalComments());
                    String newStatus = "APPROVED".equals(approvalData.getFinalApprovalStatus()) ? "APPROVED" : "REJECTED";
                    report.setWorkflowStatus(newStatus);
                    evaluationReportRepository.save(report);

                    // CRITICAL: Sync the CompanyProfile application status
                    companyProfileRepository.findById(companyId).ifPresent(company -> {
                        company.setApplicationStatus(newStatus);
                        companyProfileRepository.save(company);
                    });

                    // AI LEARNING: Capture the approval/rejection event
                    learningService.captureEvent("SENIOR", approvalData.getApprovedBy(), companyId,
                            "REPORT_" + newStatus, "Report " + newStatus.toLowerCase() + " by " + approvalData.getApprovedBy(),
                            "Comments: " + approvalData.getApprovalComments());

                    return ResponseEntity.ok("Report " + newStatus.toLowerCase());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get reports by workflow status (for Senior dashboard)
     */
    @GetMapping("/by-status/{status}")
    public ResponseEntity<List<EvaluationReport>> getReportsByStatus(@PathVariable String status) {
        List<EvaluationReport> reports = evaluationReportRepository.findByWorkflowStatus(status.toUpperCase());
        return ResponseEntity.ok(reports);
    }

    /**
     * Get all reports pending senior review (SUBMITTED, UNDER_REVIEW, PENDING_APPROVAL)
     */
    @GetMapping("/pending-review")
    public ResponseEntity<List<EvaluationReport>> getPendingReviewReports() {
        List<EvaluationReport> reports = evaluationReportRepository.findByWorkflowStatusIn(
                Arrays.asList("SUBMITTED", "UNDER_REVIEW", "PENDING_APPROVAL"));
        return ResponseEntity.ok(reports);
    }
}
