package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.ITCyberRisk;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ITCyberRiskRepository extends JpaRepository<ITCyberRisk, Long> {
    Optional<ITCyberRisk> findByCompanyId(Long companyId);
}
