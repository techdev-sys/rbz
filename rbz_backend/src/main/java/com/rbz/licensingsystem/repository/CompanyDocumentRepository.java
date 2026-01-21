package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CompanyDocumentRepository extends JpaRepository<CompanyDocument, Long> {
    List<CompanyDocument> findByCompanyId(Long companyId);
}
