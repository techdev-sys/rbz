package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.LiquidityManagement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LiquidityManagementRepository extends JpaRepository<LiquidityManagement, Long> {
    Optional<LiquidityManagement> findByCompanyId(Long companyId);
}
