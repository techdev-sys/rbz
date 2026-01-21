package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CompanyProduct entity
 * Supports Stage 5: Company Product Selection
 */
@Repository
public interface CompanyProductRepository extends JpaRepository<CompanyProduct, Long> {

    List<CompanyProduct> findByCompanyId(Long companyId);

    List<CompanyProduct> findByCompanyIdAndIsOfferedTrue(Long companyId);

    Optional<CompanyProduct> findByCompanyIdAndProductId(Long companyId, Long productId);

    Long countByCompanyIdAndIsOfferedTrue(Long companyId);

    void deleteByCompanyIdAndProductId(Long companyId, Long productId);
}
