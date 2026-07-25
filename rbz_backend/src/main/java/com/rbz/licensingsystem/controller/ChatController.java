package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.model.Message;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.MessageRepository;
import com.rbz.licensingsystem.service.CompanyAccessService;
import com.rbz.licensingsystem.service.LearningService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {

    private static final int MAX_MESSAGE_LENGTH = 4000;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private CompanyProfileRepository companyProfileRepository;

    @Autowired
    private CompanyAccessService access;

    @Autowired
    private LearningService learningService;

    @GetMapping("/{companyId}")
    public ResponseEntity<?> getMessages(@PathVariable Long companyId) {
        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            log.warn("Chat read denied: user '{}' requested company {}", access.currentPrincipalName(), companyId);
            return ResponseEntity.status(403).body("You are not authorised to view this conversation.");
        }
        return ResponseEntity.ok(messageRepository.findByCompanyIdOrderByTimestampAsc(companyId));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> body) {
        Long companyId;
        try {
            companyId = Long.valueOf(String.valueOf(body.get("companyId")));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("A valid companyId is required.");
        }
        String content = body.get("content") != null ? String.valueOf(body.get("content")).trim() : "";

        if (content.isEmpty()) {
            return ResponseEntity.badRequest().body("Message content is required.");
        }
        if (content.length() > MAX_MESSAGE_LENGTH) {
            return ResponseEntity.badRequest().body("Message exceeds the " + MAX_MESSAGE_LENGTH + " character limit.");
        }
        try {
            access.assertCanAccessCompany(companyId);
        } catch (AccessDeniedException e) {
            log.warn("Chat send denied: user '{}' targeted company {}", access.currentPrincipalName(), companyId);
            return ResponseEntity.status(403).body("You are not authorised to post in this conversation.");
        }

        // Identity is always derived from the JWT — never from the request body —
        // so an applicant cannot post as an examiner or under another name.
        boolean staff = access.isStaff();
        String senderRole = staff ? "EXAMINER" : "APPLICANT";
        String senderName = access.currentPrincipalName();
        if (!staff) {
            senderName = companyProfileRepository.findAllByEmailAddress(senderName).stream()
                    .filter(p -> companyId.equals(p.getId()))
                    .map(CompanyProfile::getContactPersonName)
                    .filter(n -> n != null && !n.isBlank())
                    .findFirst()
                    .orElse(senderName);
        }

        Message message = new Message();
        message.setCompanyId(companyId);
        message.setSenderRole(senderRole);
        message.setSenderName(senderName);
        message.setContent(content);

        try {
            Message saved = messageRepository.save(message);
            learningService.captureEvent(
                    senderRole,
                    senderName,
                    companyId,
                    "CHAT_MESSAGE",
                    "Message sent in secure chat",
                    content);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error sending message", e);
            return ResponseEntity.internalServerError().body("The message could not be sent. Please try again.");
        }
    }
}
