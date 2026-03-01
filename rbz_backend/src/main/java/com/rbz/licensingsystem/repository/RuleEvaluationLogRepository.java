package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.RuleEvaluationLog;
import com.rbz.licensingsystem.model.enums.ApplicationStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleEvaluationLogRepository extends JpaRepository<RuleEvaluationLog, Long> {
    List<RuleEvaluationLog> findByCompanyIdAndStage(Long companyId, ApplicationStage stage);
    List<RuleEvaluationLog> findByCompanyId(Long companyId);
}
