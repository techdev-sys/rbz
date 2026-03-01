package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.model.RuleEvaluationLog;
import com.rbz.licensingsystem.model.enums.ApplicationStage;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import com.rbz.licensingsystem.repository.RuleEvaluationLogRepository;
import com.rbz.licensingsystem.service.WorkflowEngineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowEngineService workflowEngineService;
    private final CompanyProfileRepository companyProfileRepository;
    private final RuleEvaluationLogRepository evaluationLogRepository;

    @GetMapping("/{companyId}/status")
    public ResponseEntity<Map<String, Object>> getWorkflowStatus(@PathVariable Long companyId) {
        CompanyProfile company = companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company not found"));
        
        List<RuleEvaluationLog> logs = evaluationLogRepository.findByCompanyId(companyId);

        Map<String, Object> response = new HashMap<>();
        response.put("currentStage", company.getWorkflowStage());
        response.put("stageStatus", company.getWorkflowStatus());
        response.put("evaluationLogs", logs);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{companyId}/evaluate/{stage}")
    public ResponseEntity<List<RuleEvaluationLog>> evaluateStage(
            @PathVariable Long companyId, 
            @PathVariable ApplicationStage stage,
            @RequestParam(defaultValue = "system") String evaluatedBy) {
        
        List<RuleEvaluationLog> results = workflowEngineService.evaluateStage(companyId, stage, evaluatedBy);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{companyId}/advance/{stage}")
    public ResponseEntity<String> advanceStage(
            @PathVariable Long companyId, 
            @PathVariable ApplicationStage stage,
            @RequestParam(defaultValue = "system") String user) {
        
        workflowEngineService.advanceStage(companyId, stage, user);
        return ResponseEntity.ok("Stage advanced successfully");
    }
}
