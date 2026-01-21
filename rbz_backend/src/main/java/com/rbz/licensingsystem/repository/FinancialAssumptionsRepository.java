package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.FinancialAssumptions;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialAssumptionsRepository extends JpaRepository<FinancialAssumptions, Long> {
    List<FinancialAssumptions> findByCompanyId(Long companyId);
}
