package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.EvaluationReport;
import com.rbz.licensingsystem.repository.EvaluationReportRepository;
import com.rbz.licensingsystem.service.MFIReportGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

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
     * Final approval (Registrar)
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
                    report.setWorkflowStatus(
                            "APPROVED".equals(approvalData.getFinalApprovalStatus()) ? "APPROVED" : "REJECTED");
                    evaluationReportRepository.save(report);
                    return ResponseEntity.ok("Report " + report.getWorkflowStatus().toLowerCase());
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
