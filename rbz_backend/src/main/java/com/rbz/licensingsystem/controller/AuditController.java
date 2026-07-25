package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.SystemActivityLog;
import com.rbz.licensingsystem.repository.SystemActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@Slf4j
public class AuditController {

    private final SystemActivityLogRepository logRepository;

    @GetMapping("/logs")
    public ResponseEntity<List<SystemActivityLog>> getLogs(
            @RequestParam(required = false) Long companyId) {
        if (companyId != null) {
            return ResponseEntity.ok(logRepository.findByCompanyId(companyId));
        }
        return ResponseEntity.ok(logRepository.findAllByOrderByIdAsc());
    }

    /**
     * Verify hash-chain integrity. Replays the hash from the first entry
     * to the last and reports any tampering.
     */
    @GetMapping("/verify-integrity")
    public ResponseEntity<Map<String, Object>> verifyIntegrity() {
        List<SystemActivityLog> entries = logRepository.findAllByOrderByIdAsc();

        int total = entries.size();
        int corrupted = 0;
        List<Map<String, Object>> violations = new ArrayList<>();
        String previousHash = "GENESIS";

        for (SystemActivityLog entry : entries) {
            String content = s(entry.getActorRole()) + s(entry.getActorName())
                    + s(entry.getCompanyId()) + s(entry.getActivityType())
                    + s(entry.getDetail()) + entry.getTimestamp().toString();
            String expectedHash = DigestUtils.sha256Hex(content + s(previousHash));

            if (!expectedHash.equals(entry.getEntryHash())) {
                corrupted++;
                Map<String, Object> violation = new LinkedHashMap<>();
                violation.put("entryId", entry.getId());
                violation.put("actorName", entry.getActorName());
                violation.put("activityType", entry.getActivityType());
                violation.put("timestamp", entry.getTimestamp());
                violation.put("storedHash", entry.getEntryHash());
                violation.put("expectedHash", expectedHash);
                violations.add(violation);
                log.error("AUDIT INTEGRITY VIOLATION: entry {} hash mismatch", entry.getId());
            }

            if (!s(previousHash).equals(s(entry.getPreviousHash()))) {
                corrupted++;
                Map<String, Object> violation = new LinkedHashMap<>();
                violation.put("entryId", entry.getId());
                violation.put("issue", "previousHash_broken_chain");
                violation.put("storedPreviousHash", entry.getPreviousHash());
                violation.put("expectedPreviousHash", previousHash);
                violations.add(violation);
            }

            previousHash = entry.getEntryHash();
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalEntries", total);
        result.put("corruptedEntries", corrupted);
        result.put("integrityStatus", corrupted == 0 ? "INTACT" : "COMPROMISED");
        result.put("violations", violations);
        return ResponseEntity.ok(result);
    }

    private String s(Object o) {
        return o == null ? "" : o.toString();
    }
}
