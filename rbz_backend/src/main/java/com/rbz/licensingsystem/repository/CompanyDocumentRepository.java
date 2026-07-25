package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyDocumentRepository extends JpaRepository<CompanyDocument, Long> {
    List<CompanyDocument> findByCompanyId(Long companyId);

    List<CompanyDocument> findByCompanyIdAndDocumentType(Long companyId, String documentType);

    Optional<CompanyDocument> findFirstByCompanyIdAndDocumentTypeOrderByVersionDesc(Long companyId, String documentType);

    Optional<CompanyDocument> findByCompanyIdAndSha256(Long companyId, String sha256);
}
