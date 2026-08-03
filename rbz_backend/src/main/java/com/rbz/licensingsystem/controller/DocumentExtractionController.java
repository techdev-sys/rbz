package com.rbz.licensingsystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.rbz.licensingsystem.model.BoardCommittee;
import com.rbz.licensingsystem.model.CompanyDocument;
import com.rbz.licensingsystem.model.Director;
import com.rbz.licensingsystem.model.Shareholder;
import com.rbz.licensingsystem.repository.BoardCommitteeRepository;
import com.rbz.licensingsystem.repository.CompanyDocumentRepository;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.DirectorRepository;
import com.rbz.licensingsystem.repository.ShareholderRepository;
import com.rbz.licensingsystem.service.CompanyAccessService;
import com.rbz.licensingsystem.service.DocumentExtractionService;
import com.rbz.licensingsystem.service.FileSecurityHelper.FileValidationException;
import com.rbz.licensingsystem.service.LearningService;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@RestController
@RequestMapping("/api/documents")
public class DocumentExtractionController {

    @Autowired private DocumentExtractionService documentExtractionService;
    @Autowired private CompanyDocumentRepository companyDocumentRepository;
    @Autowired private CompanyProfileRepository companyProfileRepository;
    @Autowired private ShareholderRepository shareholderRepository;
    @Autowired private DirectorRepository directorRepository;
    @Autowired private BoardCommitteeRepository boardCommitteeRepository;
    @Autowired private CompanyAccessService access;
    @Autowired private LearningService learningService;
    @Autowired private com.rbz.licensingsystem.service.NotificationService notificationService;

    /**
     * List all uploaded documents for a company. Applicants only see their own
     * company; examiners and seniors see any.
     */
    @GetMapping("/{companyId}")
    public ResponseEntity<?> getDocuments(@PathVariable Long companyId) {
        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
        List<CompanyDocument> docs = companyDocumentRepository.findByCompanyId(companyId);
        return ResponseEntity.ok(docs);
    }

    /**
     * Upload a document, validate it, persist with SHA-256 + version, and call
     * the AI service to determine VERIFIED / MANUAL_REVIEW / FAILED status.
     */
    @PostMapping("/extract")
    public ResponseEntity<?> extractDataFromDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyId") Long companyId,
            @RequestParam("documentType") String documentType) {

        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }

        try {
            Map<String, Object> result;
            switch (documentType) {
                case "financialStatements":
                    result = documentExtractionService.extractFinancialStatements(file, companyId); break;
                case "businessPlan":
                    result = documentExtractionService.extractBusinessPlan(file, companyId); break;
                case "portfolioReport":
                    result = documentExtractionService.extractPortfolioReport(file, companyId); break;
                case "creditPolicy":
                    result = documentExtractionService.verifyCreditPolicy(file, companyId); break;
                case "operationalManual":
                    result = documentExtractionService.verifyOperationalManual(file, companyId); break;
                case "taxClearance":
                    result = documentExtractionService.extractTaxClearance(file, companyId); break;
                case "insurancePolicy":
                    result = documentExtractionService.extractInsurancePolicy(file, companyId); break;
                default:
                    return ResponseEntity.badRequest().body("Unknown document type: " + documentType);
            }
            return ResponseEntity.ok(result);

        } catch (FileValidationException e) {
            // Surface friendly message to the client; do NOT 500 on a bad upload.
            Map<String, Object> body = new HashMap<>();
            body.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process document. Please try again.");
        }
    }

    /**
     * Examiner per-document review action. Sets verificationStatus + examinerComment
     * and stamps verifiedBy/verifiedAt with the current principal.
     *
     * Allowed verificationStatus values from this endpoint:
     *   - EXAMINER_VERIFIED  (examiner has manually accepted)
     *   - REJECTED           (examiner has rejected; applicant must re-upload)
     *   - MANUAL_REVIEW      (revert: needs another look)
     */
    @SuppressWarnings("null")
    @PatchMapping("/{documentId}/review")
    public ResponseEntity<?> reviewDocument(
            @PathVariable Long documentId,
            @RequestBody Map<String, String> body) {

        if (!access.isStaff()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only examiners or seniors may review documents.");
        }

        CompanyDocument doc = companyDocumentRepository.findById(documentId).orElse(null);
        if (doc == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found");
        }

        String requested = body.get("verificationStatus");
        if (requested == null) {
            return ResponseEntity.badRequest().body("verificationStatus is required");
        }
        switch (requested) {
            case "EXAMINER_VERIFIED":
            case "REJECTED":
            case "MANUAL_REVIEW":
                break;
            default:
                return ResponseEntity.badRequest()
                        .body("verificationStatus must be EXAMINER_VERIFIED, REJECTED or MANUAL_REVIEW");
        }

        String aiStatus = doc.getVerificationStatus();

        doc.setVerificationStatus(requested);
        String comment = body.get("examinerComment");
        if (comment != null) {
            if (comment.length() > 2000) comment = comment.substring(0, 2000);
            doc.setExaminerComment(comment);
        }
        doc.setVerifiedBy(access.currentPrincipalName());
        doc.setVerifiedAt(java.time.LocalDateTime.now());
        companyDocumentRepository.save(doc);

        if ("REJECTED".equals(requested)) {
            notificationService.documentRejected(doc.getCompanyId(), doc.getDocumentType(), doc.getExaminerComment());
        }

        // AI LEARNING: every examiner verdict is a labelled training example —
        // (document type, AI verdict, AI confidence) → examiner decision.
        // Accumulated in the tamper-evident activity log for future model training.
        try {
            Map<String, Object> snapshot = new HashMap<>();
            snapshot.put("documentType", doc.getDocumentType());
            snapshot.put("fileName", doc.getFileName());
            snapshot.put("sha256", doc.getSha256());
            snapshot.put("version", doc.getVersion());
            snapshot.put("aiStatus", aiStatus);
            snapshot.put("aiConfidence", doc.getAiConfidence());
            snapshot.put("aiReason", doc.getAiReason());
            snapshot.put("examinerVerdict", requested);
            snapshot.put("examinerComment", doc.getExaminerComment());
            String dataJson = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(snapshot);
            learningService.captureEvent(
                    "EXAMINER",
                    access.currentPrincipalName(),
                    doc.getCompanyId(),
                    "DOCUMENT_VERDICT",
                    "Document '" + doc.getDocumentType() + "' marked " + requested
                            + " (AI verdict: " + (aiStatus != null ? aiStatus : "NONE") + ")",
                    dataJson);
        } catch (Exception ignore) {
            // Learning capture must never break the review action itself.
        }

        // If this rejection happened during/after submission, surface it on the
        // applicant dashboard by switching the application status to NEEDS_REVISION.
        if ("REJECTED".equals(requested) && doc.getCompanyId() != null) {
            companyProfileRepository.findById(doc.getCompanyId()).ifPresent(profile -> {
                String s = profile.getApplicationStatus();
                if ("SUBMITTED".equals(s) || "ASSIGNED".equals(s) || "UNDER_REVIEW".equals(s)) {
                    profile.setApplicationStatus("NEEDS_REVISION");
                    companyProfileRepository.save(profile);
                }
            });
        }

        return ResponseEntity.ok(doc);
    }

    /**
     * Get extraction status for a company.
     */
    @GetMapping("/status/{companyId}")
    public ResponseEntity<?> getExtractionStatus(@PathVariable Long companyId) {
        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
        try {
            return ResponseEntity.ok(documentExtractionService.getExtractionStatus(companyId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to get status. Please try again.");
        }
    }

    /**
     * Download a document by its CompanyDocument record ID. Caller must own
     * the company (applicant) or be an examiner/senior.
     */
    @SuppressWarnings("null")
    @GetMapping("/download/{documentId}")
    public ResponseEntity<?> downloadDocument(@PathVariable Long documentId) {
        try {
            CompanyDocument doc = companyDocumentRepository.findById(documentId).orElse(null);
            if (doc == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Document not found");
            }

            try {
                access.assertCanAccessCompany(doc.getCompanyId());
            } catch (AccessDeniedException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }

            String filePath = doc.getFilePath();
            if (filePath == null || filePath.startsWith("SYSTEM_STORAGE/") || filePath.startsWith("UNAVAILABLE/")) {
                return ResponseEntity.status(HttpStatus.GONE)
                        .body("File is no longer available on disk. Please re-upload.");
            }

            Path path = Paths.get(filePath).normalize();
            if (!path.toAbsolutePath().startsWith(Paths.get("uploads").toAbsolutePath())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
            }
            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("File not found on disk: " + path.getFileName());
            }

            Resource resource = new UrlResource(path.toUri());
            String contentType = doc.getContentType() != null ? doc.getContentType() : "application/octet-stream";
            String fileName = doc.getFileName() != null ? doc.getFileName() : path.getFileName().toString();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Download failed. Please try again.");
        }
    }

    /**
     * Download a document stored in any uploads/ directory by its file path.
     * Used for ownership/director/committee documents persisted by other controllers.
     * Requires either staff role OR the path resolves to a record whose companyId
     * the caller is allowed to access.
     */
    @SuppressWarnings("null")
    @GetMapping("/download-by-path")
    public ResponseEntity<?> downloadByPath(@RequestParam("path") String filePath,
                                             @RequestParam(value = "name", required = false) String fileName) {
        try {
            if (filePath == null || filePath.isBlank()
                    || filePath.startsWith("SYSTEM_STORAGE/")
                    || filePath.startsWith("UNAVAILABLE/")) {
                return ResponseEntity.status(HttpStatus.GONE).body("File unavailable.");
            }

            Path path = Paths.get(filePath).normalize();
            if (!path.toAbsolutePath().startsWith(Paths.get("uploads").toAbsolutePath())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
            }

            // Authz: staff can read any file under uploads/. Applicants must be
            // matched to a record that references this exact path AND owned by them.
            if (!access.isStaff() && !pathBelongsToCurrentApplicant(filePath)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied.");
            }

            if (!Files.exists(path)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("File not found.");
            }

            Resource resource = new UrlResource(path.toUri());
            String contentType = Files.probeContentType(path);
            if (contentType == null) contentType = "application/octet-stream";
            String name = (fileName != null && !fileName.isBlank()) ? fileName : path.getFileName().toString();

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Download failed. Please try again.");
        }
    }

    /**
     * Returns true if the given path is referenced by a record (CompanyDocument,
     * Shareholder, Director, BoardCommittee) whose companyId the current
     * applicant owns.
     */
    private boolean pathBelongsToCurrentApplicant(String filePath) {
        Long companyId = findCompanyIdForPath(filePath);
        if (companyId == null) return false;
        try {
            access.assertCanAccessCompany(companyId);
            return true;
        } catch (AccessDeniedException e) {
            return false;
        }
    }

    private Long findCompanyIdForPath(String filePath) {
        // Linear scan across the four tables that reference uploaded files. The
        // dataset is small (single-application scope) so this is acceptable.
        for (CompanyDocument doc : companyDocumentRepository.findAll()) {
            if (filePath.equals(doc.getFilePath())) return doc.getCompanyId();
        }
        for (Shareholder s : shareholderRepository.findAll()) {
            if (filePath.equals(s.getNetWorthStatementPath())
                    || filePath.equals(s.getShareholderAffidavitPath())
                    || filePath.equals(s.getCapitalContributionConfirmationPath())
                    || filePath.equals(s.getApplicationFormPath())
                    || filePath.equals(s.getApplicationLetterPath())
                    || filePath.equals(s.getApplicationFeeReceiptPath())
                    || filePath.equals(s.getBoardResolutionPath())) {
                return s.getCompanyId();
            }
        }
        for (Director d : directorRepository.findAll()) {
            if (filePath.equals(d.getIdDocumentPath())) return d.getCompanyId();
        }
        for (BoardCommittee c : boardCommitteeRepository.findAll()) {
            if (filePath.equals(c.getTermsOfReferenceDocumentPath())) return c.getCompanyId();
        }
        return null;
    }

    /**
     * Export ALL uploaded documents for a company as a ZIP archive.
     * Staff-only.
     */
    @GetMapping("/export-zip/{companyId}")
    public void exportAllDocuments(@PathVariable Long companyId,
                                   HttpServletResponse response) throws IOException {

        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, e.getMessage());
            return;
        }

        response.setContentType("application/zip");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"Application_" + companyId + "_Documents.zip\"");

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream())) {

            List<CompanyDocument> companyDocs = companyDocumentRepository.findByCompanyId(companyId);
            for (CompanyDocument doc : companyDocs) {
                String folder = "01_Supporting_Documents/" + sanitize(doc.getDocumentType()) + "/";
                addToZip(zos, doc.getFilePath(), folder + sanitize(doc.getFileName()));
            }

            List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
            for (Shareholder s : shareholders) {
                String folder = "02_Ownership/" + sanitize(s.getFullName()) + "/";
                addToZip(zos, s.getNetWorthStatementPath(),               folder + "net_worth_statement");
                addToZip(zos, s.getShareholderAffidavitPath(),             folder + "shareholder_affidavit");
                addToZip(zos, s.getCapitalContributionConfirmationPath(),  folder + "capital_confirmation");
                addToZip(zos, s.getApplicationFormPath(),                  folder + "application_form");
                addToZip(zos, s.getApplicationLetterPath(),                folder + "application_letter");
                addToZip(zos, s.getApplicationFeeReceiptPath(),            folder + "application_fee_receipt");
                addToZip(zos, s.getBoardResolutionPath(),                  folder + "board_resolution");
            }

            List<Director> directors = directorRepository.findByCompanyId(companyId);
            for (Director d : directors) {
                String folder = "03_Directors/" + sanitize(d.getFullName()) + "/";
                addToZip(zos, d.getIdDocumentPath(), folder + "id_document");
            }

            List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);
            for (BoardCommittee c : committees) {
                String folder = "04_Committees/" + sanitize(c.getCommitteeName()) + "/";
                addToZip(zos, c.getTermsOfReferenceDocumentPath(), folder + "terms_of_reference");
            }

            zos.finish();
        }
    }

    private void addToZip(ZipOutputStream zos, String filePath, String entryBaseName) throws IOException {
        if (filePath == null || filePath.isBlank()
                || filePath.startsWith("SYSTEM_STORAGE/")
                || filePath.startsWith("UNAVAILABLE/")) return;

        Path path = Paths.get(filePath).normalize();
        if (!path.toAbsolutePath().startsWith(Paths.get("uploads").toAbsolutePath())) return;
        if (!Files.exists(path)) return;

        String original = path.getFileName().toString();
        int dot = original.lastIndexOf('.');
        String ext = (dot >= 0) ? original.substring(dot) : "";
        String entryName = entryBaseName.endsWith(ext) ? entryBaseName : entryBaseName + ext;

        zos.putNextEntry(new ZipEntry(entryName));
        Files.copy(path, zos);
        zos.closeEntry();
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "unknown";
        return name.replaceAll("[^a-zA-Z0-9._\\- ]", "_").trim();
    }
}
