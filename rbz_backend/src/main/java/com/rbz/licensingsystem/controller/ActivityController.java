package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyDocument;
import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.model.Message;
import com.rbz.licensingsystem.model.StageReview;
import com.rbz.licensingsystem.repository.CompanyDocumentRepository;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.MessageRepository;
import com.rbz.licensingsystem.repository.StageReviewRepository;
import com.rbz.licensingsystem.service.CompanyAccessService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Read-only aggregation of everything that has happened on an application,
 * built from tables that already exist (documents, stage reviews, chat).
 *
 * /api/activity/{companyId}  — event timeline (applicant sees own; staff see any)
 * /api/activity/summary?ids= — per-application activity summary for staff work queues
 */
@RestController
@RequestMapping("/api/activity")
@Slf4j
public class ActivityController {

    @Autowired private CompanyProfileRepository companyProfileRepository;
    @Autowired private CompanyDocumentRepository companyDocumentRepository;
    @Autowired private StageReviewRepository stageReviewRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private CompanyAccessService access;

    private Map<String, Object> event(String type, String title, String detail, String actor, LocalDateTime at) {
        Map<String, Object> e = new HashMap<>();
        e.put("type", type);
        e.put("title", title);
        e.put("detail", detail);
        e.put("actor", actor);
        e.put("timestamp", at);
        return e;
    }

    @GetMapping("/{companyId}")
    public ResponseEntity<?> getTimeline(@PathVariable Long companyId) {
        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(403).body("You are not authorised to view this application's activity.");
        }
        Optional<CompanyProfile> companyOpt = companyProfileRepository.findById(companyId);
        if (companyOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        CompanyProfile company = companyOpt.get();

        List<Map<String, Object>> events = new ArrayList<>();

        for (CompanyDocument doc : companyDocumentRepository.findByCompanyId(companyId)) {
            if (doc.getUploadTimestamp() != null) {
                int version = doc.getVersion() != null ? doc.getVersion() : 1;
                events.add(event(
                        "DOCUMENT_UPLOADED",
                        (version > 1 ? "Replacement uploaded: " : "Document uploaded: ") + doc.getDocumentType(),
                        doc.getFileName() + (version > 1 ? " (version " + version + ")" : ""),
                        "Applicant",
                        doc.getUploadTimestamp()));
            }
            if (doc.getVerifiedAt() != null) {
                String status = doc.getVerificationStatus() != null ? doc.getVerificationStatus() : "REVIEWED";
                String title;
                switch (status) {
                    case "EXAMINER_VERIFIED" -> title = "Document verified: " + doc.getDocumentType();
                    case "REJECTED"          -> title = "Document rejected: " + doc.getDocumentType();
                    case "MANUAL_REVIEW"     -> title = "Document sent to manual review: " + doc.getDocumentType();
                    default                  -> title = "Document reviewed: " + doc.getDocumentType();
                }
                events.add(event(
                        "DOCUMENT_VERDICT",
                        title,
                        doc.getExaminerComment(),
                        doc.getVerifiedBy() != null ? doc.getVerifiedBy() : "Examiner",
                        doc.getVerifiedAt()));
            }
        }

        for (StageReview review : stageReviewRepository.findByCompanyId(companyId)) {
            if (review.getLastUpdated() == null) continue;
            String stageName = review.getStageName() != null ? review.getStageName() : ("Stage " + review.getStageId());
            String title = "APPROVED".equals(review.getStatus())
                    ? "Stage approved: " + stageName
                    : "FLAGGED".equals(review.getStatus())
                        ? "Stage flagged: " + stageName
                        : "Stage reviewed: " + stageName;
            events.add(event("STAGE_REVIEW", title, review.getExaminerComment(),
                    review.getExaminerName(), review.getLastUpdated()));
        }

        List<Message> messages = messageRepository.findByCompanyIdOrderByTimestampAsc(companyId);
        if (!messages.isEmpty()) {
            Message last = messages.get(messages.size() - 1);
            events.add(event("CHAT",
                    messages.size() + " message" + (messages.size() != 1 ? "s" : "") + " in secure chat",
                    "Most recent from " + last.getSenderName(),
                    last.getSenderName(),
                    last.getTimestamp()));
        }

        if (company.getLicenseGrantedDate() != null) {
            events.add(event("LICENCE", "Licence granted",
                    "Licence number " + (company.getLicenseNumber() != null ? company.getLicenseNumber() : "pending"),
                    "Reserve Bank of Zimbabwe",
                    company.getLicenseGrantedDate().atStartOfDay()));
        }

        events.sort((a, b) -> {
            LocalDateTime ta = (LocalDateTime) a.get("timestamp");
            LocalDateTime tb = (LocalDateTime) b.get("timestamp");
            return tb.compareTo(ta);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("companyId", companyId);
        response.put("applicationStatus", company.getApplicationStatus());
        response.put("events", events);
        return ResponseEntity.ok(response);
    }

    /**
     * Lightweight per-application signals for staff dashboards:
     * when anything last happened, and whether the applicant has re-uploaded
     * documents or written messages the examiner may not have seen.
     */
    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@RequestParam("ids") String ids) {
        if (!access.isStaff()) {
            return ResponseEntity.status(403).body("Staff only.");
        }
        List<Long> companyIds = new ArrayList<>();
        for (String part : ids.split(",")) {
            try {
                companyIds.add(Long.valueOf(part.trim()));
            } catch (NumberFormatException ignored) {
            }
        }

        Map<Long, Map<String, Object>> out = new HashMap<>();
        for (Long companyId : companyIds) {
            LocalDateTime lastDocumentAt = null;
            int docsAwaitingReview = 0;
            for (CompanyDocument doc : companyDocumentRepository.findByCompanyId(companyId)) {
                LocalDateTime up = doc.getUploadTimestamp();
                if (up != null && (lastDocumentAt == null || up.isAfter(lastDocumentAt))) lastDocumentAt = up;
                // Awaiting examiner attention: never reviewed, or re-uploaded after the last verdict.
                boolean unreviewed = doc.getVerifiedAt() == null
                        && !"VERIFIED".equals(doc.getVerificationStatus())
                        && !"EXAMINER_VERIFIED".equals(doc.getVerificationStatus());
                boolean reuploadedAfterVerdict = doc.getVerifiedAt() != null && up != null && up.isAfter(doc.getVerifiedAt());
                if (unreviewed || reuploadedAfterVerdict) docsAwaitingReview++;
            }

            List<Message> messages = messageRepository.findByCompanyIdOrderByTimestampAsc(companyId);
            LocalDateTime lastMessageAt = null;
            String lastMessageRole = null;
            if (!messages.isEmpty()) {
                Message last = messages.get(messages.size() - 1);
                lastMessageAt = last.getTimestamp();
                lastMessageRole = last.getSenderRole();
            }

            LocalDateTime lastReviewAt = null;
            for (StageReview r : stageReviewRepository.findByCompanyId(companyId)) {
                if (r.getLastUpdated() != null && (lastReviewAt == null || r.getLastUpdated().isAfter(lastReviewAt))) {
                    lastReviewAt = r.getLastUpdated();
                }
            }

            LocalDateTime lastActivityAt = lastDocumentAt;
            if (lastMessageAt != null && (lastActivityAt == null || lastMessageAt.isAfter(lastActivityAt))) lastActivityAt = lastMessageAt;
            if (lastReviewAt != null && (lastActivityAt == null || lastReviewAt.isAfter(lastActivityAt))) lastActivityAt = lastReviewAt;

            Map<String, Object> summary = new HashMap<>();
            summary.put("lastActivityAt", lastActivityAt);
            summary.put("lastDocumentAt", lastDocumentAt);
            summary.put("lastMessageAt", lastMessageAt);
            summary.put("lastMessageRole", lastMessageRole);
            summary.put("docsAwaitingReview", docsAwaitingReview);
            out.put(companyId, summary);
        }
        return ResponseEntity.ok(out);
    }
}
