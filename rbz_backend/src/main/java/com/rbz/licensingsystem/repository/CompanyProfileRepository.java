package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, Long> {
    List<CompanyProfile> findByApplicationStatus(String applicationStatus);

    List<CompanyProfile> findByApplicationStatusAndAssignedExaminer(String applicationStatus, String assignedExaminer);
}
