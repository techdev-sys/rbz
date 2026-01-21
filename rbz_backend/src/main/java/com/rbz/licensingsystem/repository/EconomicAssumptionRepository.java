package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.EconomicAssumption;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EconomicAssumptionRepository extends JpaRepository<EconomicAssumption, Long> {
    List<EconomicAssumption> findByCompanyId(Long companyId);
}
