package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.GrowthAndDevelopment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GrowthAndDevelopmentRepository extends JpaRepository<GrowthAndDevelopment, Long> {
    Optional<GrowthAndDevelopment> findByCompanyId(Long companyId);
}
