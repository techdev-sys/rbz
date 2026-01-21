package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CapitalStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CapitalStructureRepository extends JpaRepository<CapitalStructure, Long> {
    Optional<CapitalStructure> findByCompanyId(Long companyId);
}
