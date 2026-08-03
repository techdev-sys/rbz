package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Outbound email notifications to applicants on the events that matter:
 * assignment, stage flags, document rejections, and the final decision.
 *
 * Fire-and-forget by design: a notification failure must never fail the
 * regulatory action that triggered it. When SMTP is not configured
 * (MAIL_USERNAME empty), every notification is logged instead of sent, so
 * the system behaves identically in demo environments.
 */
@Service
@Slf4j
public class NotificationService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private CompanyProfileRepository companyProfileRepository;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    private boolean mailConfigured() {
        return fromAddress != null && !fromAddress.isBlank();
    }

    @Async
    public void notifyApplicant(Long companyId, String subject, String body) {
        try {
            CompanyProfile company = companyProfileRepository.findById(companyId).orElse(null);
            if (company == null) {
                log.warn("Notification skipped: company {} not found", companyId);
                return;
            }
            String to = company.getEmailAddress();
            if (to == null || to.isBlank()) {
                log.warn("Notification skipped: company {} has no email address on file", companyId);
                return;
            }

            String fullSubject = "RBZ Licensing Portal — " + subject;
            String fullBody = "Dear " + (company.getContactPersonName() != null ? company.getContactPersonName() : "Applicant") + ",\n\n"
                    + body + "\n\n"
                    + "Please sign in to the RBZ Financial Institutions Licensing Portal for full details.\n\n"
                    + "Reserve Bank of Zimbabwe — Bank Supervision Division\n"
                    + "This is an automated message; please do not reply to this email.";

            if (!mailConfigured()) {
                log.info("[MAIL DISABLED] Would send to {}: {} — {}", to, fullSubject, body);
                return;
            }

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(fullSubject);
            message.setText(fullBody);
            mailSender.send(message);
            log.info("Notification sent to {} for company {}: {}", to, companyId, subject);
        } catch (Exception e) {
            log.error("Failed to send notification for company {}: {}", companyId, e.getMessage());
        }
    }

    public void applicationAssigned(Long companyId) {
        notifyApplicant(companyId,
                "Your application is under review",
                "Your licensing application has been assigned to a Bank Examiner and is now under active review.\n"
                        + "You may be contacted through the portal's secure chat if any clarification is required.");
    }

    public void stageFlagged(Long companyId, String stageName, String examinerComment) {
        String detail = (examinerComment != null && !examinerComment.isBlank())
                ? "\n\nExaminer comments:\n" + examinerComment
                : "";
        notifyApplicant(companyId,
                "Action required — issues raised on \"" + stageName + "\"",
                "The Bank Examiner has flagged the \"" + stageName + "\" section of your application and requested corrections."
                        + detail);
    }

    public void documentRejected(Long companyId, String documentType, String examinerComment) {
        String detail = (examinerComment != null && !examinerComment.isBlank())
                ? "\n\nExaminer note:\n" + examinerComment
                : "";
        notifyApplicant(companyId,
                "Action required — document must be re-submitted",
                "The document \"" + documentType + "\" was reviewed and rejected. Please upload a replacement through the portal."
                        + detail);
    }

    public void finalDecision(Long companyId, boolean approved, String licenseNumber) {
        if (approved) {
            notifyApplicant(companyId,
                    "Licence approved",
                    "Congratulations — your licensing application has been approved."
                            + (licenseNumber != null && !licenseNumber.isBlank()
                                ? "\nYour licence number is " + licenseNumber + "."
                                : "")
                            + "\nYour digital licence is available on the portal.");
        } else {
            notifyApplicant(companyId,
                    "Decision issued on your application",
                    "A decision has been issued on your licensing application. "
                            + "Please sign in to the portal to review the examination report and the reasons provided.");
        }
    }
}
