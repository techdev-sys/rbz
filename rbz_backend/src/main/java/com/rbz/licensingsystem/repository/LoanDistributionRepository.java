package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.LoanDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanDistributionRepository extends JpaRepository<LoanDistribution, Long> {
    List<LoanDistribution> findByCompanyId(Long companyId);

    List<LoanDistribution> findByFinancialPerformanceId(Long financialPerformanceId);
}
