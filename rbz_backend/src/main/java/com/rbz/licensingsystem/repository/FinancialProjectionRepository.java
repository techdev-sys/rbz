package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.FinancialProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialProjectionRepository extends JpaRepository<FinancialProjection, Long> {
    List<FinancialProjection> findByCompanyId(Long companyId);

    Optional<FinancialProjection> findByCompanyIdAndYear(Long companyId, Integer year);
}
