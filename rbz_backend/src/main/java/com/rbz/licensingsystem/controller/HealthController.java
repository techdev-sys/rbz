package com.rbz.licensingsystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@RestController
public class HealthController {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Autowired
    public HealthController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("RBZ Backend is Online");
    }

    @GetMapping("/test-ai")
    public ResponseEntity<String> testAiConnection() {
        try {
            String pythonResponse = restTemplate.getForObject(aiServiceUrl + "/", String.class);
            return ResponseEntity.ok("Success! AI says: " + pythonResponse);
        } catch (RestClientException e) {
            return ResponseEntity.ok("Error: Could not talk to Python");
        }
    }
}
