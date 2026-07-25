package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.DirectorQuestionnaire;
import com.rbz.licensingsystem.repository.DirectorQuestionnaireRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/director-questionnaire")
public class DirectorQuestionnaireController {

    @Autowired
    private DirectorQuestionnaireRepository repository;

    @PostMapping("/save")
    public ResponseEntity<DirectorQuestionnaire> save(@RequestBody DirectorQuestionnaire dq) {
        DirectorQuestionnaire existing = repository.findByDirectorId(dq.getDirectorId()).orElse(null);
        if (existing != null) {
            dq.setId(existing.getId());
        }
        if (dq.isDeclarationSigned() && dq.getDeclarationDate() == null) {
            dq.setDeclarationDate(LocalDate.now());
        }
        dq.setCompletionStatus(dq.isDeclarationSigned() ? "COMPLETED" : "PENDING");
        return ResponseEntity.ok(repository.save(dq));
    }

    @GetMapping("/director/{directorId}")
    public ResponseEntity<DirectorQuestionnaire> getByDirector(@PathVariable Long directorId) {
        return repository.findByDirectorId(directorId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<DirectorQuestionnaire>> getByCompany(@PathVariable Long companyId) {
        return ResponseEntity.ok(repository.findByCompanyId(companyId));
    }
}
