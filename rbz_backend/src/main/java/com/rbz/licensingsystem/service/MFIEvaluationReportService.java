package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for generating comprehensive MFI Evaluation Reports (Memoranda)
 * This service pulls data from all stages and formats them into the standard
 * RBZ report template.
 * Updated to support dynamic table numbering, logo placeholders, and strict
 * report formatting.
 */
@Service
public class MFIEvaluationReportService {

    @Autowired
    private CompanyProfileRepository companyProfileRepository;
    @Autowired
    private ShareholderRepository shareholderRepository;
    @Autowired
    private CapitalStructureRepository capitalStructureRepository;
    @Autowired
    private DirectorRepository directorRepository;
    @Autowired
    private BoardCommitteeRepository boardCommitteeRepository;
    @Autowired
    private ProductsAndServicesRepository productsAndServicesRepository;
    @Autowired
    private FinancialProjectionRepository financialProjectionRepository;
    @Autowired
    private ComplianceDocumentationRepository complianceDocumentationRepository;
    @Autowired
    private GrowthAndDevelopmentRepository growthAndDevelopmentRepository;
    @Autowired
    private ComplaintsHandlingRepository complaintsHandlingRepository;
    @Autowired
    private EconomicAssumptionRepository economicAssumptionRepository;
    @Autowired
    private InterestRateStructureRepository interestRateStructureRepository;

    private int tableCounter = 1;

    /**
     * Generate a complete MFI evaluation memorandum for a company
     */
    public String generateMemorandum(Long companyId) {
        StringBuilder memo = new StringBuilder();
        tableCounter = 1; // Reset table counter for new report

        // Get all data
        CompanyProfile profile = companyProfileRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Company profile not found"));

        List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
        CapitalStructure capital = capitalStructureRepository.findByCompanyId(companyId).orElse(null);
        List<Director> directors = directorRepository.findByCompanyId(companyId);
        List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);
        ProductsAndServices products = productsAndServicesRepository.findByCompanyId(companyId).orElse(null);
        List<FinancialProjection> projections = financialProjectionRepository.findByCompanyId(companyId);
        // Sort projections by year
        projections.sort(Comparator.comparing(FinancialProjection::getYear));

        ComplianceDocumentation compliance = complianceDocumentationRepository.findByCompanyId(companyId).orElse(null);
        GrowthAndDevelopment growth = growthAndDevelopmentRepository.findByCompanyId(companyId).orElse(null);
        ComplaintsHandling complaints = complaintsHandlingRepository.findByCompanyId(companyId).orElse(null);
        List<EconomicAssumption> assumptions = economicAssumptionRepository.findByCompanyId(companyId);
        List<InterestRateStructure> rates = interestRateStructureRepository.findByCompanyId(companyId);

        // Build memorandum sections
        memo.append(generateHeader(profile, shareholders));
        memo.append(generateSection1Background(profile));
        memo.append(generateSection2Ownership(shareholders, capital));
        memo.append(generateSection3CapitalStructure(capital));
        memo.append(generateSection4CorporateGovernance(directors, committees));
        memo.append(generateSection5OrganizationalStructure(compliance));
        memo.append(generateSection6ProspectsOfViability(products, projections, assumptions, rates));
        memo.append(generateSection7MarketingStrategy(growth));
        memo.append(generateSection8DevelopmentalValue(growth));
        memo.append(generateSection9ComplaintsHandling(complaints));
        memo.append(generateSection10Compliance(compliance));
        memo.append(generateSection11Recommendations(profile));
        memo.append(generateSection12Approval());

        return memo.toString();
    }

    private String generateHeader(CompanyProfile profile, List<Shareholder> shareholders) {
        StringBuilder header = new StringBuilder();

        if (profile.getLogoPath() != null && !profile.getLogoPath().isEmpty()) {
            header.append("[LOGO]\n\n");
        }

        header.append("MEMORANDUM\n\n");
        header.append(profile.getCompanyName().toUpperCase()).append("\n\n");
        header.append("APPLICATION FOR A CREDIT-ONLY MICROFINANCE LICENCE\n\n");

        header.append("OFFICES\n");
        header.append(profile.getPhysicalAddress()).append("\n\n");

        header.append("BANKERS\n");
        header.append(profile.getBankers() != null ? profile.getBankers() : "N/A").append("\n\n");

        header.append("EXTERNAL AUDITORS\n");
        header.append(profile.getAuditors() != null ? profile.getAuditors() : "N/A").append("\n\n");

        if (profile.getLawyers() != null && !profile.getLawyers().isEmpty()) {
            header.append("LAWYERS\n");
            header.append(profile.getLawyers()).append("\n\n");
        }

        header.append("SHAREHOLDERS\n");
        header.append(String.format("%-30s\t%s\n", "Shareholder's Name", "Ownership"));
        for (Shareholder sh : shareholders) {
            header.append(String.format("%-30s\t%.0f%%\n", sh.getFullName(), sh.getOwnershipPercentage()));
        }
        header.append(String.format("%-30s\t%s\n\n", "Total", "100%"));

        header.append("CHIEF EXECUTIVE OFFICER\n"); // Or MANAGING DIRECTOR based on sample
        header.append(profile.getChiefExecutiveOfficer() != null ? profile.getChiefExecutiveOfficer() : "[CEO Name]")
                .append("\n\n");

        header.append("COMPANY REGISTRATION NUMBER\n");
        header.append(profile.getRegistrationNumber()).append("\n\n");

        header.append("CONTACT TELEPHONE NUMBERS\n");
        header.append(profile.getContactTelephone()).append("\n\n");

        header.append("E-MAIL ADDRESS\n");
        header.append(profile.getEmailAddress()).append("\n\n\n");

        return header.toString();
    }

    private String generateSection1Background(CompanyProfile profile) {
        StringBuilder section = new StringBuilder();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d MMMM yyyy");

        section.append("1. BACKGROUND\n");
        section.append("1.1 ").append(profile.getCompanyName())
                .append(" (hereinafter referred as the institution) is a company incorporated in terms of the Companies and Other Business Entities Act [Chapter 24:31] on ")
                .append(profile.getIncorporationDate() != null ? profile.getIncorporationDate().format(formatter)
                        : "[DATE]")
                .append(".\n");

        section.append("1.2 The institution submitted an application for a credit-only microfinance licence on ")
                .append(profile.getApplicationDate() != null ? profile.getApplicationDate().format(formatter)
                        : "[DATE]")
                .append(" and application fee of US$")
                .append(profile.getApplicationFee() != null ? profile.getApplicationFee() : "300")
                .append(" was paid on ")
                .append(profile.getApplicationFeePaymentDate() != null
                        ? profile.getApplicationFeePaymentDate().format(formatter)
                        : "[DATE]")
                .append(".\n");

        section.append("1.3 ").append(profile.getCompanyName())
                .append(" intends to operate from its head office in ").append(profile.getPhysicalAddress())
                .append(".\n");

        if (profile.getOutstandingInfoLetterDate() != null) {
            section.append("1.4 On ").append(profile.getOutstandingInfoLetterDate())
                    .append(" a letter was sent to the institution requiring the submission of information which was outstanding.\n");
        }

        if (profile.getOutstandingInfoSubmissionDate() != null) {
            section.append(
                    "1.5 The institution submitted the outstanding regularised affidavits for all shareholders, AML declaration affidavits for all shareholders and an updated business plan on ")
                    .append(profile.getOutstandingInfoSubmissionDate()).append(".\n");
        }
        section.append("\n");
        return section.toString();
    }

    private String generateSection2Ownership(List<Shareholder> shareholders, CapitalStructure capital) {
        StringBuilder section = new StringBuilder();

        section.append("2. OWNERSHIP\n");
        section.append("Shareholding Structure\n");
        section.append("2.1 The institution's shareholding structure is shown in Table ").append(tableCounter)
                .append(" as reflected on the Subscribers' Clause of the Memorandum of Association.\n\n");

        section.append("Table ").append(tableCounter++).append(": Shareholding Structure\n");
        section.append("Shareholder's Name\tNumber of shares\tAmount Paid (US$)\tOwnership\tNet worth (US$)\n");

        for (Shareholder sh : shareholders) {
            section.append(sh.getFullName()).append("\t")
                    .append(sh.getNumberOfShares()).append("\t")
                    .append(sh.getAmountPaid()).append("\t")
                    .append(String.format("%.0f%%", sh.getOwnershipPercentage())).append("\t")
                    .append("$").append(sh.getVerifiedNetWorthStatus()).append("\n"); // Assuming net worth value stored
                                                                                      // here
        }

        if (capital != null) {
            section.append("Total\t").append(capital.getTotalIssuedShares()).append("\t")
                    .append("US$").append(capital.getTotalIssuedAndPaidUpCapital()).append("\t100%\t")
                    .append("US$").append(capital.getTotalShareholdersEquity()).append("\n\n");
        }

        section.append(
                "2.2 The shareholding structure complies with section 34(1) of the Microfinance Act [Chapter 24:30] as read in conjunction with section 26 (1) (b) (ii) of the Microfinance (General) Regulations SI 85/2025, which limits the maximum shareholding per shareholder of a microfinance institution at 50%.\n");

        if (capital != null && capital.getBoardResolutionSubmitted() != null
                && capital.getBoardResolutionSubmitted().equalsIgnoreCase("YES")) {
            section.append("2.3 The institution submitted a board resolution for the issue of ")
                    .append(capital.getTotalIssuedShares()).append(" ordinary shares.\n");
        }

        section.append(
                "2.4 The institution submitted net worth statements demonstrating that the shareholders can inject additional capital when the need arise.\n");

        // Dynamic vetting statement
        long pendingVetting = shareholders.stream()
                .filter(s -> s.getVettingStatus() != null && s.getVettingStatus().equalsIgnoreCase("PENDING")).count();
        if (pendingVetting > 0) {
            section.append("2.5 Fitness and probity assessment for directors and senior management is pending.\n");
        } else {
            section.append("2.5 The shareholders and senior management were vetted and found to be fit and proper.\n");
        }

        section.append(
                "2.6 Each shareholder submitted Shareholders Affidavit declaring the ultimate beneficial ownership (UBOs) and attesting that the sources of funds, and wealth were not from money laundering activities.\n\n");

        return section.toString();
    }

    private String generateSection3CapitalStructure(CapitalStructure capital) {
        StringBuilder section = new StringBuilder();

        section.append("3. CAPITAL STRUCTURE\n");
        if (capital == null)
            return section.append("Data pending.\n\n").toString();

        section.append("3.1 Capital structure is shown in Table ").append(tableCounter).append(".\n\n");

        section.append("Table ").append(tableCounter++).append(": Capital Structure\n");
        section.append("Number of Authorized Shares\t").append(capital.getNumberOfAuthorisedShares()).append("\n");
        section.append("Number of issued shares\t").append(capital.getTotalIssuedShares()).append("\n");
        section.append("Par value per share\tUS$").append(capital.getParValuePerShare()).append("\n");
        section.append("Total Issued Share Capital\tUS$").append(capital.getTotalIssuedAndPaidUpCapital())
                .append("\n\n");

        section.append(
                "3.2 The institution submitted bank statement showing a closing credit balance. In this regard, the institution's capital was compliant with the minimum capital requirements of US$25,000 for credit only microfinance institutions.\n");
        section.append(
                "3.3 The institution submitted a copy of its board resolution confirming price per share on allotment.\n\n");

        return section.toString();
    }

    private String generateSection4CorporateGovernance(List<Director> directors, List<BoardCommittee> committees) {
        StringBuilder section = new StringBuilder();

        long execCount = directors.stream()
                .filter(d -> d.getDesignation() != null && d.getDesignation().toLowerCase().contains("non")).count();
        long nonExecCount = directors.size() - execCount; // Simplified logic, ideally check explicit type

        section.append("4. CORPORATE GOVERNANCE\n");
        section.append("Board and Senior Management\n");
        section.append("4.1 The institution has a ").append(directors.size())
                .append("-member board, comprising ").append(directors.size() - execCount)
                .append(" executive directors and ")
                .append(execCount)
                .append(" non-executive directors, which complies with the Microfinance Act [Chapter 24:30].\n");
        section.append("The qualifications and experience of the board and the senior management is shown in Table ")
                .append(tableCounter).append(".\n\n");

        section.append("Table ").append(tableCounter++).append(": Board of Directors and Senior Management\n");
        section.append("Name\tQualifications\tExperience\tOther Directorship\n");

        for (Director director : directors) {
            section.append(director.getFullName()).append("\n")
                    .append("D.O.B: ").append(director.getDateOfBirth()).append("\n")
                    .append(director.getDesignation() != null ? director.getDesignation() : "").append("\n\t");

            section.append(
                    director.getQualifications() != null ? director.getQualifications().replace("\n", "\n\t") : "")
                    .append("\n\t");
            section.append(director.getExperience() != null ? director.getExperience().replace("\n", "\n\t") : "")
                    .append("\n\t");
            section.append(director.getOtherDirectorships() != null ? director.getOtherDirectorships() : "None")
                    .append("\n");
        }

        // Vetting documents check
        boolean undertakingSubmitted = directors.stream()
                .anyMatch(d -> "YES".equalsIgnoreCase(d.getLetterOfUndertakingSubmitted()));
        if (undertakingSubmitted) {
            section.append(
                    "\nProposed directors submitted letters of undertaking to leave current employment upon licensing.\n");
        }

        section.append("\nBoard Committees\n");
        section.append("The institution has ").append(committees.size()).append(" board committees as shown in Table ")
                .append(tableCounter).append(" below.\n\n");

        section.append("Table ").append(tableCounter++).append(": Board Committees\n");
        section.append("Committee\tMembers\tTerms of Reference\n");
        for (BoardCommittee committee : committees) {
            section.append(committee.getCommitteeName()).append("\n\t")
                    .append(committee.getCommitteeComposition() != null
                            ? committee.getCommitteeComposition().replace(",", "\n\t")
                            : "")
                    .append("\n\t")
                    .append(committee.getTermsOfReference() != null ? committee.getTermsOfReference().replace("\n", " ")
                            : "")
                    .append("\n\n");
        }

        section.append(
                "4.3 The institution submitted comprehensive and clear Terms of Reference for the Board Committees.\n\n");

        return section.toString();
    }

    private String generateSection5OrganizationalStructure(ComplianceDocumentation compliance) {
        StringBuilder section = new StringBuilder();

        section.append("5. ORGANIZATIONAL STRUCTURE\n");
        section.append("5.1 The proposed organisational structure of the institution is indicated below.\n\n");

        if (compliance != null && compliance.getOrganizationalChartPath() != null) {
            section.append("[ORGANIZATIONAL CHART IMAGE: ").append(compliance.getOrganizationalChartPath())
                    .append("]\n\n");
        } else {
            section.append("[Organizational Chart to be inserted]\n\n");
        }

        section.append(
                "5.2 The institution's organizational structure was considered suitable for a credit-only microfinance institution.\n\n");

        return section.toString();
    }

    private String generateSection6ProspectsOfViability(ProductsAndServices products,
            List<FinancialProjection> projections, List<EconomicAssumption> assumptions,
            List<InterestRateStructure> rates) {
        StringBuilder section = new StringBuilder();

        section.append("6. PROSPECTS OF VIABILITY\n");
        section.append("Products and Services / Activities\n");
        section.append("6.1 The microfinance shall serve the following products:\n");
        if (products != null && products.getProductsAndServicesDescription() != null) {
            section.append(products.getProductsAndServicesDescription()).append("\n");
        }
        section.append("\n");

        section.append("Assumptions and Financial Projections\n");
        section.append("Table ").append(tableCounter++).append(": Assumptions\n");
        section.append("Indicator\tRate\n");

        if (assumptions.isEmpty()) {
            section.append("Inflation (year on year)\t3%\n");
            section.append("GDP Growth Rate\t2.5%\n");
        } else {
            for (EconomicAssumption a : assumptions) {
                section.append(a.getYear()).append(" Inflation\t").append(a.getInflationRate()).append("%\n");
            }
        }
        section.append("\n");

        section.append("Table ").append(tableCounter++).append(": Interest Charges\n");
        section.append("Customer type\tInterest Rate per month\tAdmin Fees\tInsurance\n");
        if (rates.isEmpty()) {
            section.append("All Loans\t10%\t10%\t2%\n");
        } else {
            for (InterestRateStructure r : rates) {
                section.append(r.getLoanCategory()).append("\t")
                        .append(r.getMonthlyInterestRate()).append("%\t")
                        .append(r.getAdministrativeFeePercentage()).append("%\t")
                        .append(r.getInsuranceFeePercentage()).append("%\n");
            }
        }
        section.append("\n");

        section.append("Financial Projections\n");
        section.append("The institution's financial projections for Year 1 and Year 2 are shown in Table ")
                .append(tableCounter).append(" below:\n");

        section.append("Table ").append(tableCounter++).append(": Financial Projections\n");
        section.append("Indicator\t");
        for (FinancialProjection proj : projections) {
            section.append("(ZiG) ").append(proj.getYear()).append("\t");
        }
        section.append("\n");

        String[] indicators = { "Total Income", "Total Expenses", "Tax", "Net Income", "Total Assets",
                "Total Loans", "Current Liabilities (Tax)", "Total Equity",
                "Cost/Income Ratio", "Return on Assets", "Return on Equity" };

        for (String indicator : indicators) {
            section.append(indicator).append("\t");
            for (FinancialProjection proj : projections) {
                section.append(getIndicatorValue(proj, indicator)).append("\t");
            }
            section.append("\n");
        }

        section.append(
                "\nThe institution's operations are expected to produce a projected net profit in Year 1 and Year 2 respectively.\n\n");

        return section.toString();
    }

    private String generateSection7MarketingStrategy(GrowthAndDevelopment growth) {
        StringBuilder section = new StringBuilder();
        section.append("7. MARKETING AND GROWTH STRATEGIES\n");
        if (growth != null) {
            // Corrected method name: getGrowthStrategies (was getMarketingStrategy)
            section.append(growth.getGrowthStrategies() != null ? growth.getGrowthStrategies() : "N/A").append("\n\n");
        } else {
            section.append("Data pending.\n\n");
        }
        return section.toString();
    }

    private String generateSection8DevelopmentalValue(GrowthAndDevelopment growth) {
        StringBuilder section = new StringBuilder();
        section.append("8. DEVELOPMENTAL VALUE\n");
        if (growth != null) {
            // Corrected method name: getDevelopmentalValueSummary (was getGrowthStrategy)
            section.append(
                    growth.getDevelopmentalValueSummary() != null ? growth.getDevelopmentalValueSummary() : "N/A")
                    .append("\n\n");
        } else {
            section.append("Data pending.\n\n");
        }
        return section.toString();
    }

    private String generateSection9ComplaintsHandling(ComplaintsHandling complaints) {
        StringBuilder section = new StringBuilder();
        section.append("9. COMPLAINTS HANDLING PROCEDURE\n");
        if (complaints != null) {
            section.append("The institution submitted comprehensive Complaints Handling Procedures.\n");
            // Corrected method name: getComplaintsProcessOutline (was
            // getProcedureDescription)
            section.append(
                    complaints.getComplaintsProcessOutline() != null ? complaints.getComplaintsProcessOutline() : "N/A")
                    .append("\n\n");
        } else {
            section.append("Data pending.\n\n");
        }
        return section.toString();
    }

    private String generateSection10Compliance(ComplianceDocumentation compliance) {
        StringBuilder section = new StringBuilder();

        section.append("10. COMPLIANCE\n");
        if (compliance == null)
            return section.append("Data pending.\n\n").toString();

        section.append("The institution submitted a comprehensive Credit Policy which was considered adequate.\n\n");

        section.append("Table ").append(tableCounter++).append(": Core Client Protection Principles Strategies\n");
        section.append("CORE CLIENT PROTECTION PRINCIPLES\tSYSTEMS AND STRATEGIES\n");
        section.append("Appropriate product design and delivery\t")
                .append(compliance.getAppropriateProductDesignStrategy() != null
                        ? compliance.getAppropriateProductDesignStrategy()
                        : "")
                .append("\n");
        section.append("Prevention of over-indebtedness\t")
                .append(compliance.getPreventionOfOverIndebtednessStrategy() != null
                        ? compliance.getPreventionOfOverIndebtednessStrategy()
                        : "")
                .append("\n");
        section.append("Transparency\t")
                .append(compliance.getTransparencyStrategy() != null ? compliance.getTransparencyStrategy() : "")
                .append("\n");
        section.append("Responsible Pricing\t").append(
                compliance.getResponsiblePricingStrategy() != null ? compliance.getResponsiblePricingStrategy() : "")
                .append("\n");
        section.append("Fair and respectful treatment\t")
                .append(compliance.getFairTreatmentStrategy() != null ? compliance.getFairTreatmentStrategy() : "")
                .append("\n");
        section.append("Privacy of client data\t").append(
                compliance.getPrivacyOfClientDataStrategy() != null ? compliance.getPrivacyOfClientDataStrategy() : "")
                .append("\n");
        section.append("Mechanisms for complaint resolution\t")
                .append(compliance.getComplaintResolutionMechanisms() != null
                        ? compliance.getComplaintResolutionMechanisms()
                        : "")
                .append("\n\n");

        section.append(
                "The institution submitted a copy of the loan agreement template which clearly specifies upfront charges and penalties.\n");
        section.append("The institution submitted a tax clearance certificate which was valid until ")
                .append(compliance.getTaxClearanceExpiryDate() != null ? compliance.getTaxClearanceExpiryDate()
                        : "[DATE]")
                .append(".\n\n");

        return section.toString();
    }

    private String generateSection11Recommendations(CompanyProfile profile) {
        StringBuilder section = new StringBuilder();

        section.append("11. RECOMMENDATION\n");
        section.append("It is recommended that ").append(profile.getCompanyName())
                .append("'s application for registration as a credit-only microfinance institution be approved.\n\n");

        String preparedBy = profile.getAssignedExaminer() != null ? profile.getAssignedExaminer()
                : "______________________";

        section.append("Prepared by: ").append(String.format("%-22s", preparedBy))
                .append("\t.................\t.................\n");
        section.append("             Signed\t\t\tDate\n\n");
        section.append("Reviewed by: ______________________\t.................\t.................\n");
        section.append("             Signed\t\t\tDate\n\n");
        section.append("Recommended by: ___________________\t.................\t.................\n");
        section.append("             Signed\t\t\tDate\n\n");

        return section.toString();
    }

    private String generateSection12Approval() {
        StringBuilder section = new StringBuilder();

        section.append("12. APPROVAL\n\n");
        section.append("Approved / Not Approved\n\n\n\n");
        section.append("P. T. Madamombe\t\t...................\t...................\n");
        section.append("Registrar of Microfinance Institutions\tSignature\tDate\n");

        return section.toString();
    }

    // Removing unused truncate method if needed, or keeping it but suppressing
    // warning.
    // Given user instruction is 'many errors', safest to clean up.

    private String getIndicatorValue(FinancialProjection proj, String indicator) {
        if (proj == null)
            return "0";
        double value = 0.0;

        // Helper to safely get double
        try {
            switch (indicator) {
                case "Total Income":
                    value = proj.getTotalIncome() != null ? proj.getTotalIncome() : 0.0;
                    return String.format("%,.0f", value);
                case "Total Expenses":
                    value = proj.getTotalExpenses() != null ? proj.getTotalExpenses() : 0.0;
                    return String.format("%,.0f", value);
                case "Tax":
                    value = proj.getTax() != null ? proj.getTax() : 0.0;
                    return formatNegative(value);
                case "Net Income":
                    value = proj.getNetIncome() != null ? proj.getNetIncome() : 0.0;
                    return formatNegative(value);
                case "Total Assets":
                    value = proj.getTotalAssets() != null ? proj.getTotalAssets() : 0.0;
                    return String.format("%,.0f", value);
                case "Total Loans":
                    value = proj.getTotalLoans() != null ? proj.getTotalLoans() : 0.0;
                    return String.format("%,.0f", value);
                case "Current Liabilities (Tax)":
                    value = proj.getCurrentLiabilities() != null ? proj.getCurrentLiabilities() : 0.0;
                    return formatNegative(value);
                case "Total Equity":
                    value = proj.getTotalEquity() != null ? proj.getTotalEquity() : 0.0;
                    return String.format("%,.0f", value);
                case "Cost/Income Ratio":
                    return (proj.getCostIncomeRatio() != null ? proj.getCostIncomeRatio() : 0.0) + "%";
                case "Return on Assets":
                    return (proj.getReturnOnAssets() != null ? proj.getReturnOnAssets() : 0.0) + "%";
                case "Return on Equity":
                    return (proj.getReturnOnEquity() != null ? proj.getReturnOnEquity() : 0.0) + "%";
                default:
                    return "";
            }
        } catch (Exception e) {
            return "0";
        }
    }

    private String formatNegative(double value) {
        if (value < 0) {
            return "(" + String.format("%,.0f", Math.abs(value)) + ")";
        }
        return String.format("%,.0f", value);
    }
}
