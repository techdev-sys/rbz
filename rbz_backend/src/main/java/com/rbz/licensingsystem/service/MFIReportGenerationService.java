package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service to generate the complete MFI Evaluation Report
 * based on the MFI Evaluation Report Template -2024
 */
@Service
public class MFIReportGenerationService {

        @Autowired
        private CompanyProfileRepository companyProfileRepository;

        @Autowired
        private BackgroundInformationRepository backgroundRepository;

        @Autowired
        private ShareholderRepository shareholderRepository;

        @Autowired
        private DirectorRepository directorRepository;

        @Autowired
        private BoardCommitteeRepository boardCommitteeRepository;

        @Autowired
        private CapitalStructureRepository capitalStructureRepository;

        @Autowired
        private FinancialPerformanceRepository financialPerformanceRepository;

        @Autowired
        private LoanDistributionRepository loanDistributionRepository;

        @Autowired
        private ProductsAndServicesRepository productsAndServicesRepository;

        @Autowired
        private FinancialAssumptionsRepository financialAssumptionsRepository;

        @Autowired
        private ComplianceDocumentationRepository complianceRepository;

        @Autowired
        private ComplaintsHandlingRepository complaintsRepository;

        @Autowired
        private GrowthAndDevelopmentRepository growthRepository;

        @Autowired
        private EvaluationReportRepository evaluationReportRepository;

        /**
         * Generate complete HTML report for a company
         */
        public String generateHTMLReport(Long companyId) {
                StringBuilder html = new StringBuilder();

                // Get all data
                CompanyProfile company = companyProfileRepository.findById(companyId)
                                .orElseThrow(() -> new RuntimeException("Company not found"));

                BackgroundInformation background = backgroundRepository.findByCompanyId(companyId).orElse(null);
                List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
                List<Director> directors = directorRepository.findByCompanyId(companyId);
                List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);
                CapitalStructure capital = capitalStructureRepository.findByCompanyId(companyId).orElse(null);
                List<FinancialPerformance> financials = financialPerformanceRepository.findByCompanyId(companyId);
                ProductsAndServices products = productsAndServicesRepository.findByCompanyId(companyId).orElse(null);
                ComplianceDocumentation compliance = complianceRepository.findByCompanyId(companyId).orElse(null);
                ComplaintsHandling complaints = complaintsRepository.findByCompanyId(companyId).orElse(null);
                GrowthAndDevelopment growth = growthRepository.findByCompanyId(companyId).orElse(null);

                // Build HTML Report
                html.append("<!DOCTYPE html><html><head>");
                html.append("<meta charset='UTF-8'>");
                html.append("<title>MFI Evaluation Report - ").append(company.getCompanyName()).append("</title>");
                html.append(getReportCSS());
                html.append("</head><body>");

                // HEADER SECTION
                html.append(generateHeaderSection(company));

                // TABLE OF CONTENTS
                html.append(generateTableOfContents());

                // GENERAL INFORMATION
                html.append(generateGeneralInformationSection(company, background));

                // BACKGROUND
                html.append(generateBackgroundSection(background));

                // OWNERSHIP
                html.append(generateOwnershipSection(shareholders));

                // CAPITAL STRUCTURE
                html.append(generateCapitalStructureSection(capital));

                // CORPORATE GOVERNANCE
                html.append(generateCorporateGovernanceSection(directors, committees));

                // PROSPECTS OF VIABILITY
                html.append(generateProspectsSection(products, financials));

                // GROWTH STRATEGIES
                html.append(generateGrowthStrategiesSection(growth));

                // DEVELOPMENTAL VALUE
                html.append(generateDevelopmentalValueSection(growth));

                // COMPLAINTS HANDLING
                html.append(generateComplaintsSection(complaints));

                // COMPLIANCE
                html.append(generateComplianceSection(compliance));

                // RECOMMENDATION
                html.append(generateRecommendationSection(companyId));

                html.append("</body></html>");

                return html.toString();
        }

        private String getReportCSS() {
                return "<style>" +
                                "body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 40px; }"
                                +
                                "h1 { text-align: center; font-size: 18pt; text-transform: uppercase; margin-bottom: 30px; }"
                                +
                                "h2 { font-size: 14pt; text-transform: uppercase; margin-top: 30px; border-bottom: 2px solid #000; }"
                                +
                                "h3 { font-size: 12pt; font-weight: bold; margin-top: 20px; }" +
                                "table { width: 100%; border-collapse: collapse; margin: 20px 0; }" +
                                "th, td { border: 1px solid #000; padding: 8px; text-align: left; }" +
                                "th { background-color: #f0f0f0; font-weight: bold; }" +
                                ".header-info { margin-bottom: 10px; }" +
                                ".section { page-break-inside: avoid; }" +
                                "@media print { body { margin: 20px; } .page-break { page-break-before: always; } }" +
                                "</style>";
        }

        private String generateHeaderSection(CompanyProfile company) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section'>");
                section.append("<h1>").append(company.getCompanyName()).append("</h1>");
                section.append("<h1>APPLICATION FOR ").append(company.getLicenseType())
                                .append(" MICROFINANCE LICENCE</h1>");

                section.append("<div class='header-info'><strong>Offices:</strong> ")
                                .append(company.getPhysicalAddress())
                                .append("</div>");
                section.append("<div class='header-info'><strong>Bankers:</strong> ").append(company.getBankers())
                                .append("</div>");
                section.append("<div class='header-info'><strong>Lawyers:</strong> ").append(company.getLawyers())
                                .append("</div>");
                section.append("<div class='header-info'><strong>Auditors:</strong> ").append(company.getAuditors())
                                .append("</div>");

                section.append("<div class='header-info'><strong>Shareholders:</strong> See Table 1</div>");
                section.append("<div class='header-info'><strong>Chief Executive Officer:</strong> ")
                                .append(company.getChiefExecutiveOfficer()).append("</div>");
                section.append("<div class='header-info'><strong>Company Registration Number:</strong> ")
                                .append(company.getRegistrationNumber()).append("</div>");
                section.append("<div class='header-info'><strong>Licence Number:</strong> ")
                                .append(company.getLicenseNumber())
                                .append("</div>");
                section.append("<div class='header-info'><strong>Contact Telephone:</strong> ")
                                .append(company.getContactTelephone()).append("</div>");
                section.append("<div class='header-info'><strong>Email Address:</strong> ")
                                .append(company.getEmailAddress())
                                .append("</div>");

                section.append("</div>");
                return section.toString();
        }

        private String generateTableOfContents() {
                return "<div class='section'><h2>TABLE OF CONTENTS</h2>" +
                                "<ol>" +
                                "<li>GENERAL INFORMATION</li>" +
                                "<li>BACKGROUND</li>" +
                                "<li>OWNERSHIP</li>" +
                                "<li>CAPITAL STRUCTURE</li>" +
                                "<li>CORPORATE GOVERNANCE</li>" +
                                "<li>PROSPECTS OF VIABILITY</li>" +
                                "<li>GROWTH STRATEGIES</li>" +
                                "<li>DEVELOPMENTAL VALUE</li>" +
                                "<li>COMPLAINTS HANDLING</li>" +
                                "<li>COMPLIANCE</li>" +
                                "<li>RECOMMENDATION</li>" +
                                "</ol></div>";
        }

        private String generateGeneralInformationSection(CompanyProfile company, BackgroundInformation background) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>GENERAL INFORMATION</h2>");
                section.append("<p>").append(company.getCompanyName())
                                .append(" (hereinafter referred to as \"the institution\" or \"")
                                .append(company.getCompanyName()).append("\") is applying for a ")
                                .append(company.getLicenseType()).append(" microfinance licence.</p>");
                section.append("</div>");
                return section.toString();
        }

        private String generateBackgroundSection(BackgroundInformation background) {
                if (background == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section'><h2>BACKGROUND</h2>");
                section.append(
                                "<p>The institution was registered in terms of the Companies & Other Business Entities Act [Chapter 24:31] on ")
                                .append(background.getCompanyRegistrationDate()).append(".");

                if (background.getMfiRegistrationDate() != null) {
                        section.append(" It was registered as a credit-only microfinance institution on ")
                                        .append(background.getMfiRegistrationDate()).append(".");
                }

                if (background.getNameChangesHistory() != null && !background.getNameChangesHistory().isEmpty()) {
                        section.append("<p><strong>Name Changes:</strong> ").append(background.getNameChangesHistory())
                                        .append("</p>");
                }

                section.append("<p>The institution has ").append(background.getNumberOfBranches())
                                .append(" branch(es). Branch addresses are provided in Annex A.</p>");

                section.append("</div>");
                return section.toString();
        }

        private String generateOwnershipSection(List<Shareholder> shareholders) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>OWNERSHIP</h2>");
                section.append(
                                "<p>The institution's shareholding structure as confirmed by Form CR11 and the Subscribers' Clause "
                                                +
                                                "of the Memorandum of Association is shown in Table 1 below.</p>");

                section.append("<h3>Table 1: Shareholding Structure</h3>");
                section.append("<table>");
                section.append("<thead><tr>");
                section.append("<th>Shareholder's Name</th>");
                section.append("<th>Number of Shares</th>");
                section.append("<th>Amount Paid ($)</th>");
                section.append("<th>Ownership (%)</th>");
                section.append("<th>Net Worth</th>");
                section.append("</tr></thead><tbody>");

                double totalShares = 0;
                double totalAmount = 0;
                double totalOwnership = 0;

                for (Shareholder sh : shareholders) {
                        section.append("<tr>");
                        section.append("<td>").append(sh.getFullName()).append("</td>");
                        section.append("<td>").append(sh.getNumberOfShares()).append("</td>");
                        section.append("<td>").append(String.format("%.2f", sh.getAmountPaid())).append("</td>");
                        section.append("<td>").append(String.format("%.2f", sh.getOwnershipPercentage()))
                                        .append("</td>");
                        section.append("<td>")
                                        .append(sh.getVerifiedNetWorthStatus() != null ? sh.getVerifiedNetWorthStatus()
                                                        : "-")
                                        .append("</td>");
                        section.append("</tr>");

                        totalShares += sh.getNumberOfShares();
                        totalAmount += sh.getAmountPaid().doubleValue();
                        totalOwnership += sh.getOwnershipPercentage();
                }

                section.append("<tr><th>Total</th>");
                section.append("<th>").append(String.format("%.0f", totalShares)).append("</th>");
                section.append("<th>").append(String.format("%.2f", totalAmount)).append("</th>");
                section.append("<th>").append(String.format("%.2f", totalOwnership)).append("</th>");
                section.append("<th>-</th></tr>");
                section.append("</tbody></table>");

                section.append("</div>");
                return section.toString();
        }

        private String generateCapitalStructureSection(CapitalStructure capital) {
                if (capital == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>CAPITAL STRUCTURE</h2>");
                section.append("<p>The institution's capital structure as at ")
                                .append(capital.getCapitalStructureDate()).append(" is shown in Table 2 below.</p>");

                section.append("<h3>Table 2: Capital Structure</h3>");
                section.append("<table>");
                section.append("<tr><td><strong>Number of Authorised Shares</strong></td><td>")
                                .append(capital.getNumberOfAuthorisedShares()).append("</td></tr>");
                section.append("<tr><td><strong>Total Issued Shares</strong></td><td>")
                                .append(capital.getTotalIssuedShares())
                                .append("</td></tr>");
                section.append("<tr><td><strong>Par Value per Share</strong></td><td>$")
                                .append(capital.getParValuePerShare())
                                .append("</td></tr>");
                section.append("<tr><td><strong>Issued Share Capital at Par Value</strong></td><td>$")
                                .append(capital.getIssuedShareCapitalAtParValue()).append("</td></tr>");
                section.append("<tr><td><strong>Share Premium</strong></td><td>$").append(capital.getSharePremium())
                                .append("</td></tr>");
                section.append("<tr><td><strong>Total Issued and Paid-Up Capital</strong></td><td>$")
                                .append(capital.getTotalIssuedAndPaidUpCapital()).append("</td></tr>");
                section.append("<tr><td><strong>Retained Earnings - Current Year</strong></td><td>$")
                                .append(capital.getRetainedEarningsCurrentYear()).append("</td></tr>");
                section.append("<tr><td><strong>Retained Earnings - Prior Years</strong></td><td>$")
                                .append(capital.getRetainedEarningsPriorYears()).append("</td></tr>");
                section.append("<tr><td><strong>Total Shareholders' Equity</strong></td><td>$")
                                .append(capital.getTotalShareholdersEquity()).append("</td></tr>");
                section.append("</table>");

                section.append("<p>The institution's capital ").append(capital.getMeetsMinimumCapitalRequirement())
                                .append(" meets the minimum capital requirements.</p>");

                section.append("</div>");
                return section.toString();
        }

        private String generateCorporateGovernanceSection(List<Director> directors, List<BoardCommittee> committees) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>CORPORATE GOVERNANCE</h2>");

                // Board of Directors
                section.append("<h3>Board of Directors and Senior Management</h3>");
                section.append("<p>The board comprises ").append(directors.size()).append(" directors.</p>");

                section.append("<h3>Table 3: Board of Directors and Senior Management</h3>");
                section.append("<table>");
                section.append("<thead><tr>");
                section.append("<th>Name of Person</th>");
                section.append("<th>Qualifications</th>");
                section.append("<th>Experience</th>");
                section.append("<th>Other Directorships</th>");
                section.append("</tr></thead><tbody>");

                for (Director dir : directors) {
                        section.append("<tr>");
                        section.append("<td>").append(dir.getTitle() != null ? dir.getTitle() + " " : "")
                                        .append(dir.getFullName()).append("<br/><small>DOB: ")
                                        .append(dir.getDateOfBirth())
                                        .append("<br/>Designation: ").append(dir.getDesignation())
                                        .append("</small></td>");
                        section.append("<td>").append(dir.getQualifications() != null ? dir.getQualifications() : "-")
                                        .append("</td>");
                        section.append("<td>").append(dir.getExperience() != null ? dir.getExperience() : "-")
                                        .append("</td>");
                        section.append("<td>")
                                        .append(dir.getOtherDirectorships() != null ? dir.getOtherDirectorships() : "-")
                                        .append("</td>");
                        section.append("</tr>");
                }

                section.append("</tbody></table>");

                // Board Committees
                if (committees != null && !committees.isEmpty()) {
                        section.append("<h3>Board Committees</h3>");
                        for (BoardCommittee committee : committees) {
                                section.append("<h4>").append(committee.getCommitteeName()).append("</h4>");
                                section.append("<p><strong>Composition:</strong> ")
                                                .append(committee.getCommitteeComposition())
                                                .append("</p>");
                                section.append("<p><strong>Assessment:</strong> ")
                                                .append(committee.getAssessmentComments())
                                                .append("</p>");
                        }
                }

                section.append("</div>");
                return section.toString();
        }

        private String generateProspectsSection(ProductsAndServices products, List<FinancialPerformance> financials) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>PROSPECTS OF VIABILITY</h2>");

                // Products and Services
                if (products != null) {
                        section.append("<h3>Products/activities</h3>");
                        section.append("<p><strong>Target Market:</strong> ")
                                        .append(products.getTargetMarketDescription())
                                        .append("</p>");
                        section.append("<p><strong>Products and Services:</strong> ")
                                        .append(products.getProductsAndServicesDescription()).append("</p>");
                        section.append("<p><strong>Loan Size Range:</strong> $").append(products.getMinimumLoanSize())
                                        .append(" to $").append(products.getMaximumLoanSize()).append("</p>");
                        section.append("<p><strong>Tenure:</strong> ").append(products.getMinimumTenure())
                                        .append(" to ").append(products.getMaximumTenure()).append("</p>");
                }

                // Past Financial Performance
                section.append("<h3>Past Financial Performance</h3>");
                // ... add financial tables

                section.append("</div>");
                return section.toString();
        }

        private String generateGrowthStrategiesSection(GrowthAndDevelopment growth) {
                if (growth == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>GROWTH STRATEGIES</h2>");
                section.append("<p>").append(growth.getGrowthStrategies()).append("</p>");
                section.append("</div>");
                return section.toString();
        }

        private String generateDevelopmentalValueSection(GrowthAndDevelopment growth) {
                if (growth == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section'><h2>DEVELOPMENTAL VALUE</h2>");
                section.append("<p>").append(growth.getDevelopmentalValueSummary()).append("</p>");
                section.append("</div>");
                return section.toString();
        }

        private String generateComplaintsSection(ComplaintsHandling complaints) {
                if (complaints == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>COMPLAINTS HANDLING</h2>");
                section.append("<p>The institution has ").append(complaints.getHasComplaintsProcedureManual())
                                .append(" submitted a complaints procedure manual.</p>");
                section.append("<p>Number of complaints from clients: ")
                                .append(complaints.getNumberOfComplaintsFromClients())
                                .append("</p>");
                section.append("<p>Number of complaints to RBZ: ").append(complaints.getNumberOfComplaintsToRBZ())
                                .append("</p>");
                section.append("</div>");
                return section.toString();
        }

        private String generateComplianceSection(ComplianceDocumentation compliance) {
                if (compliance == null)
                        return "";

                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>COMPLIANCE</h2>");
                section.append("<p>The institution has submitted: Credit Policy Manual (")
                                .append(compliance.getHasCreditPolicyManual())
                                .append("), Operational Policy Manual (")
                                .append(compliance.getHasOperationalPolicyManual())
                                .append(")</p>");
                section.append("<p><strong>Tax Clearance:</strong> ").append(compliance.getHasTaxClearanceCertificate())
                                .append("</p>");
                section.append("<p><strong>MFI Returns Submission:</strong> ")
                                .append(compliance.getConsistentlySubmitsMFIReturns()).append("</p>");
                section.append("</div>");
                return section.toString();
        }

        private String generateRecommendationSection(Long companyId) {
                StringBuilder section = new StringBuilder();
                section.append("<div class='section page-break'><h2>RECOMMENDATION</h2>");
                section.append("<p>[To be completed by Bank Examiner]</p>");
                section.append("<br/><br/>");
                section.append("<p>Prepared by: ________________ Date: ________________</p>");
                section.append("<p>Reviewed by: ________________ Date: ________________</p>");
                section.append("<p>Recommended by: ________________ Date: ________________</p>");
                section.append("<br/><br/>");
                section.append("<h3>APPROVAL</h3>");
                section.append("<p>Approved / Not Approved</p>");
                section.append("<br/><br/>");
                section.append("<p>__________________________ Date: ________________</p>");
                section.append("<p>P. T. Madamombe<br/>Registrar of Microfinance Institutions</p>");
                section.append("</div>");
                return section.toString();
        }
}
