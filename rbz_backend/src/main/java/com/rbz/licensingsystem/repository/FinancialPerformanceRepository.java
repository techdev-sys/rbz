package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.FinancialPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialPerformanceRepository extends JpaRepository<FinancialPerformance, Long> {
    List<FinancialPerformance> findByCompanyId(Long companyId);

    List<FinancialPerformance> findByCompanyIdAndPeriodType(Long companyId, String periodType);
}
