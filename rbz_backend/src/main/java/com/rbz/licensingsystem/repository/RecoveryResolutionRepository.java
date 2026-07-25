package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.RecoveryResolution;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RecoveryResolutionRepository extends JpaRepository<RecoveryResolution, Long> {
    Optional<RecoveryResolution> findByCompanyId(Long companyId);
}
