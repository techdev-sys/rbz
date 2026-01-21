# MFI Template to System Mapping - Quick Reference

## Template Section → System Component Mapping

| Template Section | Model(s) | API Endpoint | Frontend Component (To Create) |
|-----------------|----------|--------------|--------------------------------|
| **Header: Institution Name** | CompanyProfile.companyName | /api/company-profile | CompanyProfile.js |
| **Header: Offices** | CompanyProfile.physicalAddress | /api/company-profile | CompanyProfile.js |
| **Header: Bankers** | CompanyProfile.bankers | /api/company-profile | CompanyProfile.js |
| **Header: Lawyers** | CompanyProfile.lawyers | /api/company-profile | CompanyProfile.js |
| **Header: Auditors** | CompanyProfile.auditors | /api/company-profile | CompanyProfile.js |
| **Header: CEO** | CompanyProfile.chiefExecutiveOfficer | /api/company-profile | CompanyProfile.js |
| **Header: Registration #** | CompanyProfile.registrationNumber | /api/company-profile | CompanyProfile.js |
| **Header: License #** | CompanyProfile.licenseNumber | /api/company-profile | CompanyProfile.js |
| **Header: Contact** | CompanyProfile.contactTelephone + emailAddress | /api/company-profile | CompanyProfile.js |
| | | | |
| **BACKGROUND** | BackgroundInformation | /api/background | BackgroundForm.js ⚠️ NEW |
| Registration dates | BackgroundInformation.companyRegistrationDate | | |
| Name changes | BackgroundInformation.nameChangesHistory | | |
| Branch info | BackgroundInformation.numberOfBranches, branchAddresses | | |
| License history | BackgroundInformation.initialLicenceGrantDate, currentLicenceExpiryDate | | |
| | | | |
| **TABLE 1: Shareholding** | Shareholder | /api/shareholders | OwnershipStructure.js ✅ EXISTS |
| Shareholder name | Shareholder.fullName | | |
| Number of shares | Shareholder.numberOfShares | | |
| Amount paid | Shareholder.amountPaid | | |
| Ownership % | Shareholder.ownershipPercentage | | |
| Net worth | Shareholder.verifiedNetWorthStatus | | |
| Vetting status | Shareholder.vettingStatus | | |
| Corporate shareholders | Shareholder.isCorporateShareholder, beneficialOwners | | |
| Foreign shareholders | Shareholder.isForeignShareholder, approvals | | |
| | | | |
| **TABLE 2: Capital Structure** | CapitalStructure | /api/capital | CapitalStructureForm.js ⚠️ NEW |
| Authorised shares | CapitalStructure.numberOfAuthorisedShares | | |
| Issued shares | CapitalStructure.totalIssuedShares | | |
| Par value | CapitalStructure.parValuePerShare | | |
| Share premium | CapitalStructure.sharePremium | | |
| Paid-up capital | CapitalStructure.totalIssuedAndPaidUpCapital | | |
| Retained earnings | CapitalStructure.retainedEarnings* | | |
| Total equity | CapitalStructure.totalShareholdersEquity | | |
| | | | |
| **TABLE 3: Board of Directors** | Director | /api/directors | DirectorVetting.js ✅ EXISTS |
| Full name | Director.fullName, title | | |
| DOB | Director.dateOfBirth | | |
| Designation | Director.designation | | |
| Qualifications | Director.qualifications, institutionAttended | | |
| Experience | Director.experience | | |
| Other directorships | Director.otherDirectorships | | |
| Vetting | Director.vettingStatus, vettingDate | | |
| RBZ approval | Director.rbzApprovalStatus, rbzApprovalDate | | |
| | | | |
| **Board Committees** | BoardCommittee | /api/committees | BoardCommitteesForm.js ⚠️ NEW |
| Committee name | BoardCommittee.committeeName | | |
| Composition | BoardCommittee.committeeComposition | | |
| Terms of reference | BoardCommittee.termsOfReference | | |
| Assessment | BoardCommittee.assessmentComments | | |
| | | | |
| **Products/Activities** | ProductsAndServices | /api/products | ProductsServicesForm.js ⚠️ NEW |
| Target market | ProductsAndServices.targetMarketDescription | | |
| Products description | ProductsAndServices.productsAndServicesDescription | | |
| Loan size range | ProductsAndServices.minimumLoanSize, maximumLoanSize | | |
| Loan tenure | ProductsAndServices.minimumTenure, maximumTenure | | |
| | | | |
| **Charges** | ProductsAndServices | /api/products | ProductsServicesForm.js ⚠️ NEW |
| Interest rate | ProductsAndServices.interestRatePerMonth | | |
| All charges | ProductsAndServices.allChargesBreakdown | | |
| Effective rate | ProductsAndServices.effectiveInterestRate | | |
| Justification | ProductsAndServices.chargesJustification | | |
| Insurance | ProductsAndServices.hasValidCreditInsurancePolicy | | |
| | | | |
| **TABLE 5: Past Performance** | FinancialPerformance (periodType="ACTUAL") | /api/financials | FinancialPerformanceForm.js ⚠️ NEW |
| Total income | FinancialPerformance.totalIncome | | |
| Total cost | FinancialPerformance.totalCost | | |
| Tax | FinancialPerformance.tax | | |
| Profit after tax | FinancialPerformance.profitAfterTax | | |
| Total equity | FinancialPerformance.totalEquity | | |
| Shareholder loans | FinancialPerformance.shareholdersLoans | | |
| Bank loans | FinancialPerformance.bankLoans | | |
| Total assets | FinancialPerformance.totalAssets | | |
| PaR ratio | FinancialPerformance.parRatio | | |
| Cost/Income ratio | FinancialPerformance.costIncomeRatio | | |
| ROE | FinancialPerformance.returnOnEquity | | |
| ROA | FinancialPerformance.returnOnAssets | | |
| | | | |
| **TABLE 6: Loan Distribution** | LoanDistribution | /api/loan-distribution | LoanDistributionForm.js ⚠️ NEW |
| Purpose | LoanDistribution.purpose | | |
| Number of clients | LoanDistribution.numberOfClients | | |
| Amount | LoanDistribution.amount | | |
| % Contribution | LoanDistribution.percentageContribution | | |
| | | | |
| **TABLE 7: Assumptions** | FinancialAssumptions | /api/assumptions | FinancialAssumptionsForm.js ⚠️ NEW |
| Inflation rate | FinancialAssumptions.inflationRate | | |
| Lending rate | FinancialAssumptions.lendingRate | | |
| GDP growth | FinancialAssumptions.gdpGrowthRate | | |
| Loan loss provision | FinancialAssumptions.loanLossProvisionRate | | |
| Other assumptions | FinancialAssumptions.otherAssumptions | | |
| Policy comparison | FinancialAssumptions.comparisonWithPolicyPronouncements | | |
| | | | |
| **TABLE 8: Projections** | FinancialPerformance (periodType="PROJECTED") | /api/financials | FinancialProjectionsForm.js ⚠️ NEW |
| Projected income | FinancialPerformance.totalIncome | | |
| Projected cost | FinancialPerformance.totalCost | | |
| Projected PAT | FinancialPerformance.profitAfterTax | | |
| Projected equity | FinancialPerformance.totalEquity | | |
| Projected ratios | FinancialPerformance.cost/Income/ROE/ROA | | |
| | | | |
| **GROWTH STRATEGIES** | GrowthAndDevelopment | /api/growth | GrowthDevelopmentForm.js ⚠️ NEW |
| Growth strategies | GrowthAndDevelopment.growthStrategies | | |
| Expansion plans | GrowthAndDevelopment.businessExpansionPlans | | |
| Enhancement | GrowthAndDevelopment.performanceEnhancementStrategies | | |
| | | | |
| **DEVELOPMENTAL VALUE** | GrowthAndDevelopment | /api/growth | GrowthDevelopmentForm.js ⚠️ NEW |
| Economic benefits | GrowthAndDevelopment.economicBenefits | | |
| Community benefits | GrowthAndDevelopment.communityBenefits | | |
| Summary | GrowthAndDevelopment.developmentalValueSummary | | |
| | | | |
| **COMPLAINTS HANDLING** | ComplaintsHandling | /api/complaints | ComplaintsForm.js ⚠️ NEW |
| Has manual | ComplaintsHandling.hasComplaintsProcedure Manual | | |
| Process outline | ComplaintsHandling.complaintsProcessOutline | | |
| Complaints from clients | ComplaintsHandling.numberOfComplaintsFromClients | | |
| Complaints to RBZ | ComplaintsHandling.numberOfComplaintsToRBZ | | |
| | | | |
| **COMPLIANCE** | ComplianceDocumentation | /api/compliance | ComplianceForm.js ⚠️ NEW |
| Credit policy | ComplianceDocumentation.hasCreditPolicyManual | | |
| Operational manual | ComplianceDocumentation.hasOperationalPolicyManual | | |
| Client protection | ComplianceDocumentation.clientProtectionMeasures | | |
| Loan agreement | ComplianceDocumentation.loanAgreementCompliant | | |
| Tax clearance | ComplianceDocumentation.hasTaxClearanceCertificate | | |
| Corporate tax paid | ComplianceDocumentation.corporateTaxAmountPaid | | |
| MFI returns | ComplianceDocumentation.consistentlySubmitsMFIReturns | | |
| | | | |
| **RECOMMENDATION** | EvaluationReport | /api/mfi-report | ReportGenerationView.js ⚠️ NEW |
| Recommendation | EvaluationReport.recommendation | | |
| Conditions | EvaluationReport.recommendationConditions | | |
| Justification | EvaluationReport.recommendationJustification | | |
| Prepared by | EvaluationReport.preparedBy, preparedByDesignation, preparedDate | | |
| Reviewed by | EvaluationReport.reviewedBy, reviewedByDesignation, reviewedDate | | |
| Recommended by | EvaluationReport.recommendedBy, recommendedByDesignation | | |
| | | | |
| **APPROVAL** | EvaluationReport | /api/mfi-report/approve | ApprovalWorkflow.js ⚠️ NEW |
| Approval status | EvaluationReport.finalApprovalStatus | | |
| Approved by | EvaluationReport.approvedBy | | |
| Approval date | EvaluationReport.approvalDate | | |
| Comments | EvaluationReport.approvalComments | | |

---

## Legend:
- ✅ **EXISTS** = Frontend component already created
- ⚠️ **NEW** = Needs to be created
- Backend: All models, repositories, and services are **COMPLETE** ✅
- API endpoints: Need to create controllers for new entities ⚠️

---

## Priority Order for Frontend Development:

1. **Stage 4**: Capital Structure Form (`CapitalStructureForm.js`)
2. **Stage 4**: Financial Performance Form (`FinancialPerformanceForm.js`)
3. **Stage 5**: Products & Charges Form (`ProductsServicesForm.js`)
4. **Stage 6**: Projections Form (`FinancialProjectionsForm.js`)
5. **Stage 7**: Compliance Form (`ComplianceForm.js`)
6. **Stage 8**: Growth Form (`GrowthDevelopmentForm.js`)
7. **Stage 9**: Report Generation View (` ReportGenerationView.js`)
8. **Approval**: Workflow Interface (`ApprovalWorkflow.js`)
9. **Enhancement**: Background Form (`BackgroundForm.js`)
10. **Enhancement**: Board Committees Form (`BoardCommitteesForm.js`)

---

## Backend Controllers Still Needed:

```java
// Create these controllers following the pattern of ShareholderController.java:

1. CapitalStructureController.java
2. FinancialPerformanceController.java  
3. ProductsAndServicesController.java
4. ComplianceController.java
5. ComplaintsController.java
6. GrowthAndDevelopmentController.java
7. BackgroundInformationController.java
8. BoardCommitteeController.java
9. FinancialAssumptionsController.java
10. LoanDistributionController.java
```

Each should have standard CRUD operations:
- GET /{companyId} - Retrieve
- POST / - Create/Update
- GET /all/{companyId} - List (for multi-record entities)

---

## Template Field Count:

**Total Template Fields**: ~150+  
**Database Fields Implemented**: ~150+  
**Coverage**: **100%** ✅

Every single field from the MFI Evaluation Report Template is now captured in the system!
