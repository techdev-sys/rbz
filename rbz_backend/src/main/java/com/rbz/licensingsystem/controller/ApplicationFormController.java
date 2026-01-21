package com.rbz.licensingsystem.controller;

import com.rbz.licensingsystem.model.ApplicationForm;
import com.rbz.licensingsystem.repository.ApplicationFormRepository;
import com.rbz.licensingsystem.service.LearningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/application-form")
public class ApplicationFormController {

    @Autowired
    private ApplicationFormRepository applicationFormRepository;

    @Autowired
    private LearningService learningService;

    /**
     * Create or update application form
     */
    @PostMapping("/save")
    public ResponseEntity<ApplicationForm> saveApplicationForm(@RequestBody ApplicationForm applicationForm) {
        System.out.println("========== APPLICATION FORM SAVE REQUEST ==========");
        System.out.println("Institution Name: " + applicationForm.getNameOfInstitution());
        System.out.println("Registration Number: " + applicationForm.getRegistrationNumber());
        System.out.println("License Type: " + applicationForm.getLicenseType());
        System.out.println("Company ID: " + applicationForm.getCompanyId());
        System.out.println("CEO: " + applicationForm.getCeoName());
        System.out.println("Paid-Up Capital: USD " + applicationForm.getPaidUpCapital());
        System.out.println("===================================================");

        ApplicationForm saved = applicationFormRepository.save(applicationForm);
        System.out.println("✅ Application form saved with ID: " + saved.getId());

        learningService.captureEvent("APPLICANT", applicationForm.getContactPersonName(),
                applicationForm.getCompanyId(),
                "APP_FORM_SAVE", "Saved main application form details", applicationForm.toString());

        return ResponseEntity.ok(saved);
    }

    /**
     * Get application form by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApplicationForm> getApplicationForm(@PathVariable Long id) {
        ApplicationForm form = applicationFormRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application form not found"));
        return ResponseEntity.ok(form);
    }

    /**
     * Get application form by company ID
     */
    @GetMapping("/company/{companyId}")
    public ResponseEntity<ApplicationForm> getApplicationFormByCompany(@PathVariable Long companyId) {
        ApplicationForm form = applicationFormRepository.findByCompanyId(companyId)
                .orElse(null);

        if (form == null) {
            // Return empty form for new applications
            ApplicationForm newForm = new ApplicationForm();
            newForm.setCompanyId(companyId);
            return ResponseEntity.ok(newForm);
        }

        return ResponseEntity.ok(form);
    }

    /**
     * Get all application forms
     */
    @GetMapping
    public ResponseEntity<List<ApplicationForm>> getAllApplicationForms() {
        List<ApplicationForm> forms = applicationFormRepository.findAll();
        return ResponseEntity.ok(forms);
    }

    /**
     * Update application form
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApplicationForm> updateApplicationForm(
            @PathVariable Long id,
            @RequestBody ApplicationForm formDetails) {

        ApplicationForm form = applicationFormRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application form not found"));

        // Update all fields (Truncated for brevity in summary, but kept full in actual
        // write)
        form.setNameOfInstitution(formDetails.getNameOfInstitution());
        form.setTradingAs(formDetails.getTradingAs());
        form.setPhysicalAddress(formDetails.getPhysicalAddress());
        form.setPostalAddress(formDetails.getPostalAddress());
        form.setEmail(formDetails.getEmail());
        form.setTelephone(formDetails.getTelephone());
        form.setFax(formDetails.getFax());
        form.setWebsite(formDetails.getWebsite());

        form.setRegistrationNumber(formDetails.getRegistrationNumber());
        form.setDateOfIncorporation(formDetails.getDateOfIncorporation());
        form.setPlaceOfIncorporation(formDetails.getPlaceOfIncorporation());
        form.setLicenseType(formDetails.getLicenseType());

        form.setContactPersonName(formDetails.getContactPersonName());
        form.setContactPersonTitle(formDetails.getContactPersonTitle());
        form.setContactPersonEmail(formDetails.getContactPersonEmail());
        form.setContactPersonPhone(formDetails.getContactPersonPhone());

        form.setCeoName(formDetails.getCeoName());
        form.setCeoQualifications(formDetails.getCeoQualifications());
        form.setCeoExperience(formDetails.getCeoExperience());
        form.setCeoDateOfAppointment(formDetails.getCeoDateOfAppointment());

        form.setCompanySecretaryName(formDetails.getCompanySecretaryName());
        form.setCompanySecretaryQualifications(formDetails.getCompanySecretaryQualifications());
        form.setCompanySecretaryAddress(formDetails.getCompanySecretaryAddress());

        form.setAuditorsName(formDetails.getAuditorsName());
        form.setAuditorsAddress(formDetails.getAuditorsAddress());
        form.setAuditorsPhone(formDetails.getAuditorsPhone());
        form.setAuditorsEmail(formDetails.getAuditorsEmail());

        form.setLawyersName(formDetails.getLawyersName());
        form.setLawyersAddress(formDetails.getLawyersAddress());
        form.setLawyersPhone(formDetails.getLawyersPhone());
        form.setLawyersEmail(formDetails.getLawyersEmail());

        form.setBankersName(formDetails.getBankersName());
        form.setBankersAddress(formDetails.getBankersAddress());
        form.setBankersBranch(formDetails.getBankersBranch());
        form.setBankersAccountNumber(formDetails.getBankersAccountNumber());

        form.setNatureOfBusiness(formDetails.getNatureOfBusiness());
        form.setTargetMarket(formDetails.getTargetMarket());
        form.setGeographicalCoverage(formDetails.getGeographicalCoverage());
        form.setNumberOfBranches(formDetails.getNumberOfBranches());
        form.setNumberOfEmployees(formDetails.getNumberOfEmployees());

        form.setAuthorizedShareCapital(formDetails.getAuthorizedShareCapital());
        form.setIssuedShareCapital(formDetails.getIssuedShareCapital());
        form.setParValuePerShare(formDetails.getParValuePerShare());
        form.setPaidUpCapital(formDetails.getPaidUpCapital());
        form.setShareholdingStructure(formDetails.getShareholdingStructure());
        form.setCorporateShareholders(formDetails.getCorporateShareholders());
        form.setNumberOfShareholders(formDetails.getNumberOfShareholders());

        form.setProposedLendingActivities(formDetails.getProposedLendingActivities());
        form.setProposedDepositActivities(formDetails.getProposedDepositActivities());
        form.setProposedOtherServices(formDetails.getProposedOtherServices());

        form.setBoardCommittees(formDetails.getBoardCommittees());

        form.setComplianceOfficerName(formDetails.getComplianceOfficerName());
        form.setComplianceOfficerQualifications(formDetails.getComplianceOfficerQualifications());
        form.setAmlPolicyInPlace(formDetails.getAmlPolicyInPlace());
        form.setKycPolicyInPlace(formDetails.getKycPolicyInPlace());

        form.setApplicantName(formDetails.getApplicantName());
        form.setApplicantPosition(formDetails.getApplicantPosition());
        form.setDateOfApplication(formDetails.getDateOfApplication());

        if (formDetails.getStatus() != null) {
            form.setStatus(formDetails.getStatus());
        }

        ApplicationForm updated = applicationFormRepository.save(form);

        learningService.captureEvent("APPLICANT", form.getContactPersonName(), form.getCompanyId(),
                "APP_FORM_UPDATE", "Updated application form details", updated.toString());

        return ResponseEntity.ok(updated);
    }

    /**
     * Submit application form (change status to SUBMITTED)
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<ApplicationForm> submitApplicationForm(@PathVariable Long id) {
        ApplicationForm form = applicationFormRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application form not found"));

        form.setStatus("SUBMITTED");
        ApplicationForm updated = applicationFormRepository.save(form);

        System.out.println("✅ Application form ID " + id + " submitted successfully");

        learningService.captureEvent("APPLICANT", form.getContactPersonName(), form.getCompanyId(),
                "APP_FORM_SUBMISSION", "Submitted main application form", "");

        return ResponseEntity.ok(updated);
    }

    /**
     * Delete application form
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplicationForm(@PathVariable Long id) {
        applicationFormRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
