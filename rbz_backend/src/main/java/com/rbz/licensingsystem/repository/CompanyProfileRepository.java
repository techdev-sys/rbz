package com.rbz.licensingsystem.repository;

import com.rbz.licensingsystem.model.CompanyProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CompanyProfileRepository extends JpaRepository<CompanyProfile, Long> {
    List<CompanyProfile> findByApplicationStatus(String applicationStatus);
    List<CompanyProfile> findByApplicationStatusAndAssignedExaminer(String applicationStatus, String assignedExaminer);
    List<CompanyProfile> findAllByEmailAddress(String emailAddress);
    long countByAssignedExaminer(String assignedExaminer);
    long countByLicenseNumberIsNotNull();
    long countByLicenseTypeAndLicenseNumberIsNotNull(String licenseType);

    java.util.Optional<CompanyProfile> findByLicenseNumber(String licenseNumber);

    // License lifecycle queries
    List<CompanyProfile> findByLicenseExpiryDateBetweenAndApplicationStatus(
            LocalDate from, LocalDate to, String status);
    List<CompanyProfile> findByLicenseExpiryDateBeforeAndApplicationStatus(
            LocalDate date, String status);
}
