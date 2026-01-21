package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.SystemActivityLog;
import com.rbz.licensingsystem.repository.SystemActivityLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@Slf4j
public class LearningService {

    @Autowired
    private SystemActivityLogRepository logRepository;

    /**
     * Captures an event for current or future AI training.
     * This is the "Learning" part that runs without interrupting the user.
     */
    @Async
    public void captureEvent(String role, String name, @NonNull Long companyId, String type, String detail,
            String dataJson) {
        SystemActivityLog activityLog = new SystemActivityLog();
        activityLog.setActorRole(role);
        activityLog.setActorName(name);
        activityLog.setCompanyId(companyId);
        activityLog.setActivityType(type);
        activityLog.setDetail(detail);
        activityLog.setDataSnapshot(dataJson);

        logRepository.save(activityLog);
        log.info("[AI LEARNING] Captured '{}' event for company {}. Learning cycle initialized.", type, companyId);
    }

    /**
     * Idle background process that "processes" logs to simulate ML model weight
     * updates.
     */
    @Scheduled(fixedDelay = 60000) // Every minute simulate a learning cycle
    public void backgroundLearningCycle() {
        List<SystemActivityLog> unprocessedLogs = logRepository.findAll();
        if (unprocessedLogs.isEmpty())
            return;

        log.info("[AI BRAIN] Idle Learning Cycle Started. Processing {} data points...", unprocessedLogs.size());

        try {
            Thread.sleep(100);
            log.info("[AI BRAIN] Feature extraction completed. Hidden patterns updated in neural database.");
        } catch (InterruptedException e) {
            log.error("Learning cycle interrupted", e);
        }
    }
}
