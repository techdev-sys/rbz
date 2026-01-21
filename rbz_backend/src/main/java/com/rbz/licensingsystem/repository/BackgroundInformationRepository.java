package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.BackgroundInformation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BackgroundInformationRepository extends JpaRepository<BackgroundInformation, Long> {
    Optional<BackgroundInformation> findByCompanyId(Long companyId);
}
