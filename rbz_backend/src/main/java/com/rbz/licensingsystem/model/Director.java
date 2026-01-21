package com.rbz.licensingsystem.model;

import jakarta.persistence.*;

@Entity
public class Director {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fullName;
    private String dateOfBirth;

    // "TEXT" allows unlimited length for long CVs
    @Column(columnDefinition = "TEXT")
    private String qualifications;

    @Column(columnDefinition = "TEXT")
    private String experience;

    private String status;

    private String nationality;
    private String idNumber;

    // === FIX 1: CHANGE THIS TO BOOLEAN ===
    private boolean riskFlag;

    private Long companyId;

    // --- Template Source: Board Table - Additional Fields ---
    private String designation; // CEO, Executive Director, Non-Executive Director, etc.
    private String title; // Dr, Mr, Mrs, etc.

    @Column(columnDefinition = "TEXT")
    private String otherDirectorships; // Other companies where this person is a director

    // Vetting and Approval
    private String vettingStatus; // PENDING, APPROVED, REJECTED
    private java.time.LocalDate vettingDate;
    private java.time.LocalDate appointmentDate;
    private String rbzApprovalStatus; // PENDING, APPROVED, REJECTED
    private java.time.LocalDate rbzApprovalDate;

    // Qualifications details
    private String institutionAttended;
    private String countryOfQualification;

    // --- Stage 3: Director Vetting - ID/Passport Documents (New) ---
    private String idDocumentPath; // File path to uploaded ID or Passport
    private String idDocumentType; // "NATIONAL_ID" or "PASSPORT"
    private String idDocumentNumber;
    private java.time.LocalDate idDocumentExpiryDate;
    private String idDocumentVerificationStatus; // PENDING, VERIFIED, REJECTED
    private java.time.LocalDate documentUploadDate;

    // Additional Vetting Documents
    private String letterOfUndertakingSubmitted; // YES/NO - To leave current employment
    private String netWorthStatementSubmitted; // YES/NO
    private String policeClearanceSubmitted; // YES/NO
    private String probityFormSubmitted; // YES/NO

    public String getLetterOfUndertakingSubmitted() {
        return letterOfUndertakingSubmitted;
    }

    public void setLetterOfUndertakingSubmitted(String letterOfUndertakingSubmitted) {
        this.letterOfUndertakingSubmitted = letterOfUndertakingSubmitted;
    }

    public String getNetWorthStatementSubmitted() {
        return netWorthStatementSubmitted;
    }

    public void setNetWorthStatementSubmitted(String netWorthStatementSubmitted) {
        this.netWorthStatementSubmitted = netWorthStatementSubmitted;
    }

    public String getPoliceClearanceSubmitted() {
        return policeClearanceSubmitted;
    }

    public void setPoliceClearanceSubmitted(String policeClearanceSubmitted) {
        this.policeClearanceSubmitted = policeClearanceSubmitted;
    }

    public String getProbityFormSubmitted() {
        return probityFormSubmitted;
    }

    public void setProbityFormSubmitted(String probityFormSubmitted) {
        this.probityFormSubmitted = probityFormSubmitted;
    }

    // --- Getters and Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(String dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getQualifications() {
        return qualifications;
    }

    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
    }

    public String getExperience() {
        return experience;
    }

    public void setExperience(String experience) {
        this.experience = experience;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getIdNumber() {
        return idNumber;
    }

    public void setIdNumber(String idNumber) {
        this.idNumber = idNumber;
    }

    // === FIX 2: UPDATE GETTER AND SETTER FOR BOOLEAN ===
    public boolean isRiskFlag() {
        return riskFlag;
    } // Boolean getters often use "is" instead of "get"

    public void setRiskFlag(boolean riskFlag) {
        this.riskFlag = riskFlag;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    // === Additional Field Getters/Setters ===

    public String getDesignation() {
        return designation;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getOtherDirectorships() {
        return otherDirectorships;
    }

    public void setOtherDirectorships(String otherDirectorships) {
        this.otherDirectorships = otherDirectorships;
    }

    public String getVettingStatus() {
        return vettingStatus;
    }

    public void setVettingStatus(String vettingStatus) {
        this.vettingStatus = vettingStatus;
    }

    public java.time.LocalDate getVettingDate() {
        return vettingDate;
    }

    public void setVettingDate(java.time.LocalDate vettingDate) {
        this.vettingDate = vettingDate;
    }

    public java.time.LocalDate getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(java.time.LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getRbzApprovalStatus() {
        return rbzApprovalStatus;
    }

    public void setRbzApprovalStatus(String rbzApprovalStatus) {
        this.rbzApprovalStatus = rbzApprovalStatus;
    }

    public java.time.LocalDate getRbzApprovalDate() {
        return rbzApprovalDate;
    }

    public void setRbzApprovalDate(java.time.LocalDate rbzApprovalDate) {
        this.rbzApprovalDate = rbzApprovalDate;
    }

    public String getInstitutionAttended() {
        return institutionAttended;
    }

    public void setInstitutionAttended(String institutionAttended) {
        this.institutionAttended = institutionAttended;
    }

    public String getCountryOfQualification() {
        return countryOfQualification;
    }

    public void setCountryOfQualification(String countryOfQualification) {
        this.countryOfQualification = countryOfQualification;
    }

    public String getIdDocumentPath() {
        return idDocumentPath;
    }

    public void setIdDocumentPath(String idDocumentPath) {
        this.idDocumentPath = idDocumentPath;
    }

    public String getIdDocumentType() {
        return idDocumentType;
    }

    public void setIdDocumentType(String idDocumentType) {
        this.idDocumentType = idDocumentType;
    }

    public String getIdDocumentNumber() {
        return idDocumentNumber;
    }

    public void setIdDocumentNumber(String idDocumentNumber) {
        this.idDocumentNumber = idDocumentNumber;
    }

    public java.time.LocalDate getIdDocumentExpiryDate() {
        return idDocumentExpiryDate;
    }

    public void setIdDocumentExpiryDate(java.time.LocalDate idDocumentExpiryDate) {
        this.idDocumentExpiryDate = idDocumentExpiryDate;
    }

    public String getIdDocumentVerificationStatus() {
        return idDocumentVerificationStatus;
    }

    public void setIdDocumentVerificationStatus(String idDocumentVerificationStatus) {
        this.idDocumentVerificationStatus = idDocumentVerificationStatus;
    }

    public java.time.LocalDate getDocumentUploadDate() {
        return documentUploadDate;
    }

    public void setDocumentUploadDate(java.time.LocalDate documentUploadDate) {
        this.documentUploadDate = documentUploadDate;
    }
}