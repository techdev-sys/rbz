package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.DepositProtection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DepositProtectionRepository extends JpaRepository<DepositProtection, Long> {
    Optional<DepositProtection> findByCompanyId(Long companyId);
}
