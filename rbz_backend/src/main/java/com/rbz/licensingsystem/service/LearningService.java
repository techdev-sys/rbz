package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.SystemActivityLog;
import com.rbz.licensingsystem.repository.SystemActivityLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class LearningService {

    @Autowired
    private SystemActivityLogRepository logRepository;

    @Async
    @Transactional
    public void captureEvent(String role, String name, Long companyId, String type, String detail, String dataJson) {
        try {
            // Chain to previous entry for tamper-evidence
            String previousHash = logRepository.findTopByOrderByIdDesc()
                    .map(SystemActivityLog::getEntryHash)
                    .orElse("GENESIS");

            SystemActivityLog entry = new SystemActivityLog();
            entry.setActorRole(role != null ? role : "SYSTEM");
            entry.setActorName(name != null ? name : "SYSTEM");
            entry.setCompanyId(companyId);
            entry.setActivityType(type);
            entry.setDetail(detail);
            entry.setDataSnapshot(dataJson);
            entry.setPreviousHash(previousHash);

            logRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to capture audit event [{}] for company {}: {}", type, companyId, e.getMessage());
        }
    }

    // Overload for system events not tied to a company
    @Async
    @Transactional
    public void captureSystemEvent(String role, String actorName, String type, String detail) {
        captureEvent(role, actorName, null, type, detail, "");
    }
}
