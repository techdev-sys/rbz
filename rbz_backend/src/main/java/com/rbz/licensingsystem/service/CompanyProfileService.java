package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.CompanyProfile;
import com.rbz.licensingsystem.repository.CompanyProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CompanyProfileService {

    private final CompanyProfileRepository companyProfileRepository;

    @Autowired
    public CompanyProfileService(CompanyProfileRepository companyProfileRepository) {
        this.companyProfileRepository = companyProfileRepository;
    }

    public CompanyProfile saveCompanyProfile(@NonNull CompanyProfile companyProfile) {
        return companyProfileRepository.save(companyProfile);
    }

    public Optional<CompanyProfile> getCompanyProfileById(@NonNull Long id) {
        return companyProfileRepository.findById(id);
    }

    public List<CompanyProfile> getAllCompanyProfiles() {
        return companyProfileRepository.findAll();
    }

    public CompanyProfile updateCompanyProfile(@NonNull Long id, @NonNull CompanyProfile companyProfileDetails) {
        return companyProfileRepository.findById(id).map(companyProfile -> {
            // Basic Company Info
            companyProfile.setCompanyName(companyProfileDetails.getCompanyName());
            companyProfile.setRegistrationNumber(companyProfileDetails.getRegistrationNumber());
            companyProfile.setIncorporationDate(companyProfileDetails.getIncorporationDate());
            companyProfile.setApplicationDate(companyProfileDetails.getApplicationDate());
            companyProfile.setPhysicalAddress(companyProfileDetails.getPhysicalAddress());
            companyProfile.setLicenseType(companyProfileDetails.getLicenseType());

            // Contact Information
            companyProfile.setChiefExecutiveOfficer(companyProfileDetails.getChiefExecutiveOfficer());
            companyProfile.setContactPersonName(companyProfileDetails.getContactPersonName());
            companyProfile.setContactTelephone(companyProfileDetails.getContactTelephone());
            companyProfile.setEmailAddress(companyProfileDetails.getEmailAddress());

            // Professional Services
            companyProfile.setBankers(companyProfileDetails.getBankers());
            companyProfile.setLawyers(companyProfileDetails.getLawyers());
            companyProfile.setAuditors(companyProfileDetails.getAuditors());

            // Status
            companyProfile.setStageStatus(companyProfileDetails.getStageStatus());

            // Workflow Updates (if provided)
            if (companyProfileDetails.getApplicationStatus() != null) {
                companyProfile.setApplicationStatus(companyProfileDetails.getApplicationStatus());
            }
            if (companyProfileDetails.getAssignedExaminer() != null) {
                companyProfile.setAssignedExaminer(companyProfileDetails.getAssignedExaminer());
            }

            return companyProfileRepository.save(companyProfile);
        }).orElseThrow(() -> new RuntimeException("CompanyProfile not found with id " + id));
    }

    public List<CompanyProfile> getCompanyProfilesByStatus(String status) {
        return companyProfileRepository.findByApplicationStatus(status);
    }

    public List<CompanyProfile> getAssignedCompanyProfiles(String status, String examinerName) {
        return companyProfileRepository.findByApplicationStatusAndAssignedExaminer(status, examinerName);
    }
}
