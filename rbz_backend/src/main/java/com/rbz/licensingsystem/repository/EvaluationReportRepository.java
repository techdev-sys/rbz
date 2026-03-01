package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.EvaluationReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationReportRepository extends JpaRepository<EvaluationReport, Long> {
    Optional<EvaluationReport> findByCompanyId(Long companyId);
    List<EvaluationReport> findByWorkflowStatus(String workflowStatus);
    List<EvaluationReport> findByWorkflowStatusIn(List<String> statuses);
}
