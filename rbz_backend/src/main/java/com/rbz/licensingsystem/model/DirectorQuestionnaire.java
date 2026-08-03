package com.rbz.licensingsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class DirectorQuestionnaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long directorId;
    private Long companyId;
    private String directorName;

    // Criminal record
    private String hasCriminalConvictions = "NO";
    @Column(columnDefinition = "TEXT")
    private String criminalConvictionsDetails;

    // Previous failures
    private String hasBeenDirectorOfFailedInstitution = "NO";
    @Column(columnDefinition = "TEXT")
    private String failedInstitutionDetails;

    // Regulatory/legal proceedings
    private String hasRegulatoryProceedings = "NO";
    @Column(columnDefinition = "TEXT")
    private String regulatoryProceedingsDetails;

    // Bankruptcy
    private String hasBeenBankrupt = "NO";
    @Column(columnDefinition = "TEXT")
    private String bankruptcyDetails;

    // Outstanding debts to financial institutions
    private String hasOutstandingDebts = "NO";
    @Column(columnDefinition = "TEXT")
    private String outstandingDebtsDetails;

    // Conflicts of interest
    private String hasConflictOfInterest = "NO";
    @Column(columnDefinition = "TEXT")
    private String conflictOfInterestDetails;

    // Professional sanctions
    private String hasProfessionalSanctions = "NO";
    @Column(columnDefinition = "TEXT")
    private String professionalSanctionsDetails;

    // Declaration
    private boolean declarationSigned = false;
    private LocalDate declarationDate;

    private String completionStatus = "PENDING"; // PENDING, COMPLETED
}
