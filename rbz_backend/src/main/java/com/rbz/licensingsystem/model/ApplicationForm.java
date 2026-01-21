package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class ApplicationForm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId; // Reference to CompanyProfile

    // Section 1: Institution Information
    private String nameOfInstitution;
    private String tradingAs;

    @Column(length = 500)
    private String physicalAddress;

    @Column(length = 500)
    private String postalAddress;

    private String email;
    private String telephone;
    private String fax;
    private String website;

    // Section 2: Registration Details
    private String registrationNumber;
    private LocalDate dateOfIncorporation;
    private String placeOfIncorporation;
    private String licenseType; // Credit-Only or Deposit-Taking

    // Section 3: Contact Person
    private String contactPersonName;
    private String contactPersonTitle;
    private String contactPersonEmail;
    private String contactPersonPhone;

    // Section 4: Chief Executive Officer
    private String ceoName;
    private String ceoQualifications;
    private String ceoExperience;
    private LocalDate ceoDateOfAppointment;

    // Section 5: Company Secretary
    private String companySecretaryName;
    private String companySecretaryQualifications;
    private String companySecretaryAddress;

    // Section 6: Auditors
    private String auditorsName;
    private String auditorsAddress;
    private String auditorsPhone;
    private String auditorsEmail;

    // Section 7: Lawyers
    private String lawyersName;
    private String lawyersAddress;
    private String lawyersPhone;
    private String lawyersEmail;

    // Section 8: Bankers
    private String bankersName;
    private String bankersAddress;
    private String bankersBranch;
    private String bankersAccountNumber;

    // Section 9: Business Operations
    @Column(columnDefinition = "TEXT")
    private String natureOfBusiness;

    @Column(columnDefinition = "TEXT")
    private String targetMarket;

    private String geographicalCoverage;
    private Integer numberOfBranches;
    private Integer numberOfEmployees;

    // Section 10: Share Capital
    private Double authorizedShareCapital;
    private Double issuedShareCapital;
    private Double parValuePerShare; // Proposed per value per share
    private Double paidUpCapital;
    @Column(columnDefinition = "TEXT")
    private String shareholdingStructure; // Stores JSON for Question 14a (Direct Shareholders)

    @Column(columnDefinition = "TEXT")
    private String corporateShareholders; // Stores JSON for Question 14b (Corporate Shareholders & their breakdown)

    private Integer numberOfShareholders;

    // Section 11: Proposed Operations
    @Column(columnDefinition = "TEXT")
    private String proposedLendingActivities;

    @Column(columnDefinition = "TEXT")
    private String proposedDepositActivities;

    @Column(columnDefinition = "TEXT")
    private String proposedOtherServices;

    // Section 12: Compliance
    @Column(columnDefinition = "TEXT")
    private String boardCommittees; // Stores JSON content of committees

    private String complianceOfficerName;
    private String complianceOfficerQualifications;
    private String amlPolicyInPlace; // Yes/No
    private String kycPolicyInPlace; // Yes/No

    // Section 13: Declaration
    private String applicantName;
    private String applicantPosition;
    private LocalDate dateOfApplication;

    // Metadata
    private LocalDate createdDate;
    private LocalDate lastModifiedDate;
    private String status; // DRAFT, SUBMITTED, APPROVED, REJECTED

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDate.now();
        lastModifiedDate = LocalDate.now();
        if (status == null) {
            status = "DRAFT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastModifiedDate = LocalDate.now();
    }
}
