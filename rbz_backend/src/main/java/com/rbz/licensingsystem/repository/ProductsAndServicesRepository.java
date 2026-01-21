package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.ProductsAndServices;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductsAndServicesRepository extends JpaRepository<ProductsAndServices, Long> {
    Optional<ProductsAndServices> findByCompanyId(Long companyId);
}
