package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.ComplianceDocumentation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceDocumentationRepository extends JpaRepository<ComplianceDocumentation, Long> {
    Optional<ComplianceDocumentation> findByCompanyId(Long companyId);
}
