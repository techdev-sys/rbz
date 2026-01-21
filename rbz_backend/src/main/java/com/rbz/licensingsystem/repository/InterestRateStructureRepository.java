package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.InterestRateStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InterestRateStructureRepository extends JpaRepository<InterestRateStructure, Long> {
    List<InterestRateStructure> findByCompanyId(Long companyId);
}
