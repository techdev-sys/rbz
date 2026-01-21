package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Message;
import com.rbz.licensingsystem.repository.MessageRepository;
import com.rbz.licensingsystem.service.LearningService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@Slf4j
public class ChatController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private LearningService learningService;

    @GetMapping("/{companyId}")
    public List<Message> getMessages(@PathVariable Long companyId) {
        return messageRepository.findByCompanyIdOrderByTimestampAsc(companyId);
    }

    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody Message message) {
        try {
            Message saved = messageRepository.save(message);

            // AI LEARNING: Capture the conversation for sentiment/context analysis
            learningService.captureEvent(
                    message.getSenderRole(),
                    message.getSenderName(),
                    message.getCompanyId(),
                    "CHAT_MESSAGE",
                    "Message sent in secure chat",
                    message.getContent());

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Error sending message", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
