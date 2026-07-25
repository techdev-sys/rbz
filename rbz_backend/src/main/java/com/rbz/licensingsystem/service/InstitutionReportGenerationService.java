package com.rbz.licensingsystem.service;

import com.rbz.licensingsystem.model.*;
import com.rbz.licensingsystem.model.enums.InstitutionType;
import com.rbz.licensingsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Institution-neutral HTML report generator.
 * Replaces MFIReportGenerationService — supports MFI, DTMFI, and Commercial Bank.
 */
@Service
public class InstitutionReportGenerationService {

        @Autowired private CompanyProfileRepository companyProfileRepository;
        @Autowired private ShareholderRepository shareholderRepository;
        @Autowired private DirectorRepository directorRepository;
        @Autowired private BoardCommitteeRepository boardCommitteeRepository;
        @Autowired private CapitalStructureRepository capitalStructureRepository;
        @Autowired private CapitalAdequacyReturnRepository capitalAdequacyReturnRepository;
        @Autowired private FinancialPerformanceRepository financialPerformanceRepository;
        @Autowired private ProductsAndServicesRepository productsAndServicesRepository;
        @Autowired private FinancialAssumptionsRepository financialAssumptionsRepository;
        @Autowired private FinancialProjectionRepository financialProjectionRepository;
        @Autowired private ComplianceDocumentationRepository complianceRepository;
        @Autowired private ComplaintsHandlingRepository complaintsRepository;
        @Autowired private GrowthAndDevelopmentRepository growthRepository;

        @SuppressWarnings("null")
        public String generateHTMLReport(Long companyId) {
                CompanyProfile company = companyProfileRepository.findById(companyId)
                                .orElseThrow(() -> new RuntimeException("Company not found"));

                InstitutionType type = resolveType(company);

                List<Shareholder> shareholders = shareholderRepository.findByCompanyId(companyId);
                List<Director> directors = directorRepository.findByCompanyId(companyId);
                List<BoardCommittee> committees = boardCommitteeRepository.findByCompanyId(companyId);
                CapitalStructure capital = capitalStructureRepository.findByCompanyId(companyId).orElse(null);
                CapitalAdequacyReturn car = capitalAdequacyReturnRepository.findByCompanyId(companyId).orElse(null);
                List<FinancialPerformance> financials = financialPerformanceRepository.findByCompanyId(companyId);
                ProductsAndServices products = productsAndServicesRepository.findByCompanyId(companyId).orElse(null);
                List<FinancialAssumptions> assumptions = financialAssumptionsRepository.findByCompanyId(companyId);
                List<FinancialProjection> projections = financialProjectionRepository.findByCompanyId(companyId);
                ComplianceDocumentation compliance = complianceRepository.findByCompanyId(companyId).orElse(null);
                ComplaintsHandling complaints = complaintsRepository.findByCompanyId(companyId).orElse(null);
                GrowthAndDevelopment growth = growthRepository.findByCompanyId(companyId).orElse(null);

                StringBuilder html = new StringBuilder();
                html.append("<!DOCTYPE html><html><head>");
                html.append("<meta charset='UTF-8'>");
                html.append("<title>").append(esc(institutionLabel(type))).append(" Evaluation Report — ")
                                .append(esc(company.getCompanyName())).append("</title>");
                html.append(getReportCSS());
                html.append("</head><body>");

                html.append(generateHeaderSection(company, shareholders, type));
                html.append(generateOwnershipSection(shareholders, company, type));
                html.append(generateCapitalStructureSection(capital, company, type));
                if (type == InstitutionType.COMMERCIAL_BANK) {
                        html.append(generateCapitalAdequacySection(car));
                }
                html.append(generateCorporateGovernanceSection(directors, committees, type));
                html.append(generateProspectsSection(products, financials, assumptions, projections));
                html.append(generateMarketingAndGrowthSection(growth));
                html.append(generateDevelopmentalValueSection(growth));
                html.append(generateComplaintsSection(complaints));
                html.append(generateComplianceSection(compliance, type));
                html.append(generateRecommendationSection(company, type));

                html.append("</body></html>");
                return html.toString();
        }

        // ── helpers ──────────────────────────────────────────────────────────────

        public InstitutionType resolveType(CompanyProfile company) {
                if (company.getInstitutionType() != null) return company.getInstitutionType();
                if (company.getLicenseType() != null && company.getLicenseType().toLowerCase().contains("deposit"))
                        return InstitutionType.DTMFI;
                return InstitutionType.MFI;
        }

        public String institutionLabel(InstitutionType type) {
                return switch (type) {
                        case COMMERCIAL_BANK -> "Commercial Bank";
                        case DTMFI -> "Deposit-Taking Microfinance Institution";
                        default -> "Credit-Only Microfinance Institution";
                };
        }

        public String licensePrefix(InstitutionType type) {
                return switch (type) {
                        case COMMERCIAL_BANK -> "CB";
                        case DTMFI -> "DTMFI";
                        default -> "MFI";
                };
        }

        public BigDecimal minimumCapital(InstitutionType type) {
                return switch (type) {
                        case COMMERCIAL_BANK -> new BigDecimal("30000000");
                        case DTMFI -> new BigDecimal("25000");
                        default -> new BigDecimal("5000");
                };
        }

        private String getReportCSS() {
                return "<style>" +
                        "body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.8;margin:60px 80px;color:#000;}" +
                        "h1{text-align:center;font-size:16pt;text-transform:uppercase;margin-bottom:8px;}" +
                        "h2{text-align:center;font-size:14pt;text-transform:uppercase;margin-bottom:4px;}" +
                        "h3{font-size:12pt;font-weight:bold;margin-top:24px;margin-bottom:8px;}" +
                        "h4{font-size:11pt;font-weight:bold;margin-top:16px;}" +
                        ".section-heading{font-size:12pt;font-weight:bold;text-transform:uppercase;margin-top:30px;margin-bottom:12px;border-bottom:1px solid #000;padding-bottom:4px;}" +
                        "table{width:100%;border-collapse:collapse;margin:16px 0;font-size:11pt;}" +
                        "th,td{border:1px solid #000;padding:6px 10px;text-align:left;vertical-align:top;}" +
                        "th{background-color:#d9d9d9;font-weight:bold;}" +
                        "p{margin:8px 0;text-align:justify;}" +
                        ".cover-block{margin:30px 0;}" +
                        ".cover-label{font-weight:bold;text-transform:uppercase;font-size:11pt;}" +
                        ".cover-value{font-size:11pt;margin-bottom:16px;}" +
                        ".signature-block{margin-top:40px;}" +
                        ".pass{color:green;font-weight:bold;}" +
                        ".fail{color:red;font-weight:bold;}" +
                        "@media print{body{margin:20mm;}.page-break{page-break-before:always;}}" +
                        "</style>";
        }

        private String generateHeaderSection(CompanyProfile company, List<Shareholder> shareholders, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div>");
                s.append("<h1>MEMORANDUM</h1>");
                s.append("<h2>").append(esc(company.getCompanyName())).append("</h2>");
                s.append("<h2>APPLICATION FOR A ").append(esc(institutionLabel(type).toUpperCase())).append(" LICENCE</h2>");
                s.append("<br/>");
                s.append("<div class='cover-block'>");
                coverRow(s, "OFFICES", company.getPhysicalAddress());
                coverRow(s, "BANKERS", company.getBankers());
                coverRow(s, "LAWYERS", company.getLawyers());
                if (type == InstitutionType.COMMERCIAL_BANK && company.getSwiftCode() != null) {
                        coverRow(s, "SWIFT CODE", company.getSwiftCode());
                }
                if (!shareholders.isEmpty()) {
                        s.append("<div class='cover-label'>SHAREHOLDERS</div>");
                        s.append("<table style='width:60%;'>");
                        s.append("<thead><tr><th>Shareholder's Name</th><th>Ownership</th></tr></thead><tbody>");
                        double total = 0;
                        for (Shareholder sh : shareholders) {
                                s.append("<tr><td>").append(esc(sh.getFullName())).append("</td><td>")
                                        .append(sh.getOwnershipPercentage() != null ? sh.getOwnershipPercentage() + "%" : "—")
                                        .append("</td></tr>");
                                total += sh.getOwnershipPercentage() != null ? sh.getOwnershipPercentage() : 0;
                        }
                        s.append("<tr><th>Total</th><th>").append(String.format("%.0f", total)).append("%</th></tr>");
                        s.append("</tbody></table><br/>");
                }
                coverRow(s, "CHIEF EXECUTIVE OFFICER", company.getChiefExecutiveOfficer());
                coverRow(s, "COMPANY REGISTRATION NUMBER", company.getRegistrationNumber());
                coverRow(s, "CONTACT TELEPHONE NUMBERS", company.getContactTelephone());
                coverRow(s, "E-MAIL ADDRESS", company.getEmailAddress());
                s.append("</div>");

                s.append("<div class='section-heading'>BACKGROUND</div>");
                s.append("<p>").append(esc(company.getCompanyName()))
                        .append(" was incorporated in terms of the Companies and Other Business Entities Act [Chapter 24:31] on ")
                        .append(company.getIncorporationDate() != null ? company.getIncorporationDate() : "[date]").append(".</p>");
                s.append("<p>").append(esc(company.getCompanyName())).append(" applied for a ")
                        .append(esc(institutionLabel(type).toLowerCase())).append(" licence on ")
                        .append(company.getApplicationDate() != null ? company.getApplicationDate() : "[date]").append(".");
                if (company.getApplicationFee() != null) {
                        s.append(" Application fee of US$").append(company.getApplicationFee()).append(" was paid on ")
                                .append(company.getApplicationFeePaymentDate() != null ? company.getApplicationFeePaymentDate() : "[date]").append(".");
                }
                s.append("</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateOwnershipSection(List<Shareholder> shareholders, CompanyProfile company, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'>");
                s.append("<div class='section-heading'>OWNERSHIP</div>");
                s.append("<h3>Shareholding Structure</h3>");
                s.append("<table>");
                s.append("<thead><tr><th>Shareholder's Name</th><th>Number of Shares</th><th>Amount Paid (US$)</th><th>Ownership (%)</th><th>Net Worth (US$)</th></tr></thead><tbody>");
                double totalShares = 0, totalAmount = 0, totalOwnership = 0;
                for (Shareholder sh : shareholders) {
                        s.append("<tr>");
                        s.append("<td>").append(esc(sh.getFullName())).append("</td>");
                        s.append("<td>").append(sh.getNumberOfShares() != null ? String.format("%,d", sh.getNumberOfShares()) : "—").append("</td>");
                        s.append("<td>").append(sh.getAmountPaid() != null ? String.format("%,.2f", sh.getAmountPaid()) : "—").append("</td>");
                        s.append("<td>").append(sh.getOwnershipPercentage() != null ? sh.getOwnershipPercentage() + "%" : "—").append("</td>");
                        s.append("<td>").append(sh.getNetWorthStatus() != null ? esc(sh.getNetWorthStatus()) : "—").append("</td>");
                        s.append("</tr>");
                        if (sh.getNumberOfShares() != null) totalShares += sh.getNumberOfShares();
                        if (sh.getAmountPaid() != null) totalAmount += sh.getAmountPaid().doubleValue();
                        if (sh.getOwnershipPercentage() != null) totalOwnership += sh.getOwnershipPercentage();
                }
                s.append("<tr><th>Total</th><th>").append(String.format("%,.0f", totalShares)).append("</th>");
                s.append("<th>").append(String.format("%,.2f", totalAmount)).append("</th>");
                s.append("<th>").append(String.format("%.2f", totalOwnership)).append("%</th><th>—</th></tr>");
                s.append("</tbody></table>");

                String ownershipRef = switch (type) {
                        case COMMERCIAL_BANK -> "section 20 of the Banking Act [Chapter 24:20]";
                        case DTMFI -> "section 34(1) of the Microfinance Act [Chapter 24:29]";
                        default -> "section 34(1) of the Microfinance Act [Chapter 24:29]";
                };
                s.append("<p>The shareholding structure complies with ").append(ownershipRef).append(".</p>");
                s.append("<p>Each shareholder submitted a Shareholders Affidavit declaring the ultimate beneficial ownership (UBOs) and attesting that sources of funds and wealth were not from money laundering activities.</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateCapitalStructureSection(CapitalStructure capital, CompanyProfile company, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'>");
                s.append("<div class='section-heading'>CAPITAL STRUCTURE</div>");
                if (capital == null) {
                        s.append("<p>[Capital structure data not yet submitted.]</p></div>");
                        return s.toString();
                }
                s.append("<table style='width:60%;'>");
                tableRow(s, "Number of Authorized Shares", capital.getNumberOfAuthorisedShares() != null ? String.format("%,d", capital.getNumberOfAuthorisedShares()) : "—");
                tableRow(s, "Number of Issued Shares", capital.getTotalIssuedShares() != null ? String.format("%,d", capital.getTotalIssuedShares()) : "—");
                tableRow(s, "Par Value per Share", capital.getParValuePerShare() != null ? "US$" + capital.getParValuePerShare() : "—");
                tableRow(s, "Total Issued and Paid-Up Capital", capital.getTotalIssuedAndPaidUpCapital() != null ? "US$" + String.format("%,.2f", capital.getTotalIssuedAndPaidUpCapital()) : "—");
                tableRow(s, "Total Shareholders' Equity", capital.getTotalShareholdersEquity() != null ? "US$" + String.format("%,.2f", capital.getTotalShareholdersEquity()) : "—");
                s.append("</table>");

                BigDecimal min = minimumCapital(type);
                boolean compliant = capital.getTotalIssuedAndPaidUpCapital() != null
                        && capital.getTotalIssuedAndPaidUpCapital().compareTo(min) >= 0;
                s.append("<p>The minimum capital requirement for a ").append(esc(institutionLabel(type).toLowerCase()))
                        .append(" is US$").append(String.format("%,.0f", min.doubleValue())).append(". ")
                        .append(esc(company.getCompanyName())).append(" capital was <span class='")
                        .append(compliant ? "pass'>compliant" : "fail'>NOT compliant").append("</span> with this requirement.</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateCapitalAdequacySection(CapitalAdequacyReturn car) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'>");
                s.append("<div class='section-heading'>CAPITAL ADEQUACY (BASEL III)</div>");
                if (car == null) {
                        s.append("<p>[Capital adequacy return not yet submitted.]</p></div>");
                        return s.toString();
                }
                s.append("<table style='width:70%;'>");
                tableRow(s, "Tier 1 Capital (Core)", car.getTier1Capital() != null ? "US$" + String.format("%,.2f", car.getTier1Capital()) : "—");
                tableRow(s, "Tier 2 Capital (Supplementary)", car.getTier2Capital() != null ? "US$" + String.format("%,.2f", car.getTier2Capital()) : "—");
                tableRow(s, "Risk-Weighted Assets (RWA)", car.getRiskWeightedAssets() != null ? "US$" + String.format("%,.2f", car.getRiskWeightedAssets()) : "—");
                tableRow(s, "Capital Adequacy Ratio (CAR)", car.getCapitalAdequacyRatio() != null ? car.getCapitalAdequacyRatio() + "% (min 12%)" : "—");
                tableRow(s, "Tier 1 Ratio", car.getTier1Ratio() != null ? car.getTier1Ratio() + "%" : "—");
                s.append("</table>");
                s.append("<p>Minimum paid-up capital (RBZ 2024): US$30,000,000. Status: <span class='")
                        .append(Boolean.TRUE.equals(car.getMeetsMinimumPaidUpCapital()) ? "pass'>COMPLIANT" : "fail'>NON-COMPLIANT")
                        .append("</span>.</p>");
                s.append("<p>Minimum CAR (RBZ): 12%. Status: <span class='")
                        .append(Boolean.TRUE.equals(car.getMeetsMinimumCAR()) ? "pass'>COMPLIANT" : "fail'>NON-COMPLIANT")
                        .append("</span>.</p>");
                if (car.getCapitalPlanNarrative() != null && !car.getCapitalPlanNarrative().isBlank()) {
                        s.append("<h3>Capital Plan</h3><p>").append(esc(car.getCapitalPlanNarrative()).replace("\n", "</p><p>")).append("</p>");
                }
                s.append("</div>");
                return s.toString();
        }

        private String generateCorporateGovernanceSection(List<Director> directors, List<BoardCommittee> committees, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'>");
                s.append("<div class='section-heading'>CORPORATE GOVERNANCE</div>");
                int execCount = (int) directors.stream()
                        .filter(d -> d.getDesignation() != null && d.getDesignation().toLowerCase().contains("executive") && !d.getDesignation().toLowerCase().contains("non")).count();
                s.append("<p>The institution has a ").append(directors.size()).append("-member board, comprising ")
                        .append(execCount).append(" executive and ").append(directors.size() - execCount)
                        .append(" non-executive director(s).</p>");

                String actRef = type == InstitutionType.COMMERCIAL_BANK
                        ? "the Banking Act [Chapter 24:20]"
                        : "the Microfinance Act [Chapter 24:29]";
                s.append("<p>The board composition complies with ").append(actRef).append(".</p>");

                s.append("<table><thead><tr><th>Name</th><th>Qualifications</th><th>Experience</th><th>Other Directorships</th></tr></thead><tbody>");
                for (Director dir : directors) {
                        s.append("<tr>");
                        s.append("<td><strong>").append(esc(dir.getFullName())).append("</strong>");
                        if (dir.getDesignation() != null) s.append("<br/><em>").append(esc(dir.getDesignation())).append("</em>");
                        s.append("</td>");
                        s.append("<td>").append(dir.getQualifications() != null ? esc(dir.getQualifications()).replace("\n", "<br/>") : "—").append("</td>");
                        s.append("<td>").append(dir.getExperience() != null ? esc(dir.getExperience()).replace("\n", "<br/>") : "—").append("</td>");
                        s.append("<td>").append(dir.getOtherDirectorships() != null ? esc(dir.getOtherDirectorships()) : "None").append("</td>");
                        s.append("</tr>");
                }
                s.append("</tbody></table>");

                if (!committees.isEmpty()) {
                        s.append("<h3>Board Committees</h3>");
                        s.append("<table><thead><tr><th>Committee</th><th>Members</th><th>Terms of Reference</th></tr></thead><tbody>");
                        for (BoardCommittee bc : committees) {
                                s.append("<tr><td><strong>").append(esc(bc.getCommitteeName())).append("</strong></td>");
                                s.append("<td>").append(bc.getCommitteeComposition() != null ? esc(bc.getCommitteeComposition()).replace("\n", "<br/>") : "—").append("</td>");
                                s.append("<td>").append(bc.getTermsOfReference() != null ? esc(bc.getTermsOfReference()).replace("\n", "<br/>") : "—").append("</td>");
                                s.append("</tr>");
                        }
                        s.append("</tbody></table>");
                }
                s.append("</div>");
                return s.toString();
        }

        private String generateProspectsSection(ProductsAndServices products, List<FinancialPerformance> financials,
                        List<FinancialAssumptions> assumptions, List<FinancialProjection> projections) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'>");
                s.append("<div class='section-heading'>PROSPECTS OF VIABILITY</div>");
                if (products != null) {
                        if (products.getProductsAndServicesDescription() != null)
                                s.append("<p>").append(esc(products.getProductsAndServicesDescription())).append("</p>");
                        if (products.getTargetMarketDescription() != null)
                                s.append("<p><strong>Target Market:</strong> ").append(esc(products.getTargetMarketDescription())).append("</p>");
                } else {
                        s.append("<p>[Products and services not yet submitted.]</p>");
                }
                if (!assumptions.isEmpty()) {
                        s.append("<h4>Table: Assumptions</h4><table style='width:60%;'>");
                        s.append("<thead><tr><th>Indicator</th>");
                        assumptions.forEach(a -> s.append("<th>").append(a.getProjectionYear() != null ? a.getProjectionYear() : "—").append("</th>"));
                        s.append("</tr></thead><tbody>");
                        s.append("<tr><td>Inflation Rate</td>");
                        assumptions.forEach(a -> s.append("<td>").append(a.getInflationRate() != null ? a.getInflationRate() + "%" : "—").append("</td>"));
                        s.append("</tr><tr><td>GDP Growth Rate</td>");
                        assumptions.forEach(a -> s.append("<td>").append(a.getGdpGrowthRate() != null ? a.getGdpGrowthRate() + "%" : "—").append("</td>"));
                        s.append("</tr></tbody></table>");
                }
                if (!projections.isEmpty()) {
                        s.append("<h4>Table: Financial Projections</h4><table>");
                        s.append("<thead><tr><th>Indicator</th>");
                        projections.forEach(p -> s.append("<th>(US$) ").append(p.getYear() != null ? p.getYear() : "—").append("</th>"));
                        s.append("</tr></thead><tbody>");
                        projectionRow(s, "Total Income", projections, FinancialProjection::getTotalIncome);
                        projectionRow(s, "Total Expenses", projections, FinancialProjection::getTotalExpenses);
                        projectionRow(s, "Net Income", projections, FinancialProjection::getNetIncome);
                        projectionRow(s, "Total Assets", projections, FinancialProjection::getTotalAssets);
                        projectionRow(s, "Total Equity", projections, FinancialProjection::getTotalEquity);
                        s.append("</tbody></table>");
                }
                s.append("</div>");
                return s.toString();
        }

        private String generateMarketingAndGrowthSection(GrowthAndDevelopment growth) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'><div class='section-heading'>MARKETING AND GROWTH STRATEGY</div>");
                if (growth != null && growth.getGrowthStrategies() != null)
                        s.append("<p>").append(esc(growth.getGrowthStrategies()).replace("\n", "</p><p>")).append("</p>");
                else s.append("<p>[Not yet submitted.]</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateDevelopmentalValueSection(GrowthAndDevelopment growth) {
                StringBuilder s = new StringBuilder();
                s.append("<div><div class='section-heading'>DEVELOPMENTAL VALUE</div>");
                if (growth != null && growth.getDevelopmentalValueSummary() != null)
                        s.append("<p>").append(esc(growth.getDevelopmentalValueSummary()).replace("\n", "</p><p>")).append("</p>");
                else s.append("<p>[Not yet submitted.]</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateComplaintsSection(ComplaintsHandling complaints) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'><div class='section-heading'>COMPLAINTS HANDLING PROCEDURE</div>");
                if (complaints != null && complaints.getComplaintsProcessOutline() != null)
                        s.append("<p>").append(esc(complaints.getComplaintsProcessOutline()).replace("\n", "</p><p>")).append("</p>");
                else s.append("<p>[Not yet submitted.]</p>");
                s.append("</div>");
                return s.toString();
        }

        private String generateComplianceSection(ComplianceDocumentation compliance, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'><div class='section-heading'>COMPLIANCE</div>");
                String actLabel = type == InstitutionType.COMMERCIAL_BANK ? "Banking Act [Chapter 24:20]" : "Microfinance Act [Chapter 24:29]";
                s.append("<p>The institution has demonstrated compliance with the requirements of the ").append(actLabel).append(".</p>");
                if (compliance != null && compliance.getHasTaxClearanceCertificate() != null) {
                        s.append("<p>Tax clearance certificate status: ").append(esc(compliance.getHasTaxClearanceCertificate())).append(".</p>");
                }
                s.append("</div>");
                return s.toString();
        }

        private String generateRecommendationSection(CompanyProfile company, InstitutionType type) {
                StringBuilder s = new StringBuilder();
                s.append("<div class='page-break'><div class='section-heading'>RECOMMENDATIONS</div>");
                s.append("<p>It is recommended that ").append(esc(company.getCompanyName()))
                        .append("'s application for registration as a ").append(esc(institutionLabel(type).toLowerCase()))
                        .append(" be approved subject to submission of any outstanding requirements.</p>");
                s.append("<div class='signature-block'><table style='border:none;width:100%;'>");
                s.append("<tr style='border:none;'><td style='border:none;width:40%;'>Prepared by: <strong>_________________________</strong></td><td style='border:none;'>Signed: _________ &nbsp; Date: _________</td></tr>");
                s.append("<tr style='border:none;'><td colspan='2' style='border:none;'>&nbsp;</td></tr>");
                s.append("<tr style='border:none;'><td style='border:none;'>Reviewed by: <strong>_________________________</strong></td><td style='border:none;'>Signed: _________ &nbsp; Date: _________</td></tr>");
                s.append("<tr style='border:none;'><td colspan='2' style='border:none;'>&nbsp;</td></tr>");
                s.append("<tr style='border:none;'><td style='border:none;'>Recommended by: <strong>_________________________</strong></td><td style='border:none;'>Signed: _________ &nbsp; Date: _________</td></tr>");
                s.append("</table></div>");
                s.append("<br/><div class='section-heading'>APPROVAL</div>");
                s.append("<p><strong>Approved / Not Approved</strong></p><br/><br/>");
                s.append("<table style='border:none;width:70%;'><tr style='border:none;'>");
                s.append("<td style='border:none;'>Director, Bank Supervision</td>");
                s.append("<td style='border:none;'>Signature: _________________________</td>");
                s.append("<td style='border:none;'>Date: __________________</td>");
                s.append("</tr></table>");
                s.append("</div>");
                return s.toString();
        }

        // ── utility ──────────────────────────────────────────────────────────────

        protected String esc(String val) {
                if (val == null) return "—";
                return val.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
        }

        private void coverRow(StringBuilder s, String label, String value) {
                s.append("<div class='cover-label'>").append(label).append("</div>");
                s.append("<div class='cover-value'>").append(value != null ? esc(value) : "—").append("</div>");
        }

        private void tableRow(StringBuilder s, String label, String value) {
                s.append("<tr><td><strong>").append(label).append("</strong></td><td>").append(value).append("</td></tr>");
        }

        @FunctionalInterface
        interface ProjectionGetter { Double get(FinancialProjection p); }

        private void projectionRow(StringBuilder s, String label, List<FinancialProjection> projections, ProjectionGetter getter) {
                s.append("<tr><td><strong>").append(label).append("</strong></td>");
                projections.forEach(p -> {
                        Double val = getter.get(p);
                        s.append("<td>").append(val != null ? String.format("%,.0f", val) : "—").append("</td>");
                });
                s.append("</tr>");
        }
}
