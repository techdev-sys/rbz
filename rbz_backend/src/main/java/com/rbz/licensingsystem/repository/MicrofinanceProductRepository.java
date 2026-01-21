package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.MicrofinanceProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for MicrofinanceProduct entity
 * Supports Stage 5: Product Catalog Management
 */
@Repository
public interface MicrofinanceProductRepository extends JpaRepository<MicrofinanceProduct, Long> {

    List<MicrofinanceProduct> findByIsActiveTrue();

    List<MicrofinanceProduct> findByProductCategory(String category);

    List<MicrofinanceProduct> findByProductNameContainingIgnoreCase(String name);

    List<MicrofinanceProduct> findByIsPredefinedTrue();

    List<MicrofinanceProduct> findByIsActiveTrueOrderByDisplayOrderAsc();

    List<MicrofinanceProduct> findByProductCategoryAndIsActiveTrue(String category);
}
