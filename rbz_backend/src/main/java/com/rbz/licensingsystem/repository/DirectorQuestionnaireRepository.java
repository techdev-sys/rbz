package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.DirectorQuestionnaire;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DirectorQuestionnaireRepository extends JpaRepository<DirectorQuestionnaire, Long> {
    Optional<DirectorQuestionnaire> findByDirectorId(Long directorId);
    List<DirectorQuestionnaire> findByCompanyId(Long companyId);
    long countByCompanyIdAndCompletionStatus(Long companyId, String completionStatus);
}
