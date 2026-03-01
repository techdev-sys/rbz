package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyDirectorsRegistry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyDirectorsRegistryRepository extends JpaRepository<CompanyDirectorsRegistry, Long> {
    List<CompanyDirectorsRegistry> findByNationalId(String nationalId);
}
