package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.Shareholder;
import com.rbz.licensingsystem.service.ShareholderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.rbz.licensingsystem.service.AIService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

@RestController
@RequestMapping("/api/shareholder")
public class ShareholderController {

    private final ShareholderService shareholderService;
    private final AIService aiService;

    @Autowired
    public ShareholderController(ShareholderService shareholderService, AIService aiService) {
        this.shareholderService = shareholderService;
        this.aiService = aiService;
    }

    // 1. Upload CR11 and let AI extract data
    @PostMapping("/upload-cr11")
    public ResponseEntity<?> uploadCR11(
            @RequestParam("file") MultipartFile file,
            @RequestParam("companyId") Long companyId) {
        try {
            // Calls the new Python prompt for "cr11_form" via AIService
            return ResponseEntity.ok(aiService.extractCR11(file));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to extract CR11: " + e.getMessage());
        }
    }

    // 2. Save the list of Shareholders
    @PostMapping("/save-list")
    public ResponseEntity<List<Shareholder>> saveShareholders(@RequestBody List<Shareholder> shareholders) {
        return ResponseEntity.ok(shareholderService.saveAll(shareholders));
    }

    // 3. Get List
    @GetMapping("/list/{companyId}")
    public ResponseEntity<List<Shareholder>> getShareholders(@PathVariable Long companyId) {
        return ResponseEntity.ok(shareholderService.getShareholdersByCompanyId(companyId));
    }
}
