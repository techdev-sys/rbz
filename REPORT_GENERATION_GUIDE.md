# Report Generation Guide

## Overview
The system now includes a comprehensive `MFIEvaluationReportService` that generates RBZ-compliant Microfinance License Application Memoranda. The report format is pixel-perfect to the official samples provided.

## Features
- **Dynamic Years & Currency:** Automatically handles 2026-2027 projections in ZiG while keeping historical data in correct original currency.
- **Submission Verification:** Automatically checks and reports on submitted documents (Affidavits, Resolutions, Tax Clearance, etc.).
- **Dynamic Tables:** Table numbering adjusts automatically based on available data.
- **Logo Support:** Includes company logo in the header.

## How to Generate a Report

### 1. Prerequisite Data
Ensure the following stages are completed for the company:
- **Stage 1 (Company Profile):** Upload Logo, enter application fee details.
- **Stage 2 (Ownership):** Complete shareholders, mark affidavits as submitted.
- **Stage 3 (Directors):** Complete vetting, mark letters of undertaking as submitted.
- **Stage 4 (Capital):** Mark board resolutions as submitted.
- **Stage 6 (Financials):** Enter 2026-2027 projections.
- **Stage 7 (Compliance):** Enter Client Protection Principles (Table 8 data).

### 2. Using the Service
Inject `MFIEvaluationReportService` into your controller:

```java
@Autowired
private MFIEvaluationReportService reportService;

@GetMapping("/generate-memo/{companyId}")
public ResponseEntity<String> generateMemo(@PathVariable Long companyId) {
    String memorandum = reportService.generateMemorandum(companyId);
    return ResponseEntity.ok(memorandum);
}
```

### 3. Output Format
The service returns a formatted text string. This can be:
1. Displayed in a `<pre>` tag on the frontend.
2. Saved as a `.txt` file.
3. Converted to PDF using a library like iText (future enhancement).

## Verified "Submission" Statements
The report will only state "The institution submitted X" if the corresponding flag is set in the database:
- `shareholder.affidavitSubmitted` -> "Each shareholder submitted Shareholders Affidavit..."
- `capital.boardResolutionSubmitted` -> "The institution submitted a board resolution..."
- `compliance.hasCreditPolicyManual` -> "The institution submitted a comprehensive Credit Policy..."

## Data Models Updated
- **CompanyProfile:** LogoPath, Letter Dates
- **Shareholder:** Affidavit Flags, Net Worth Flags
- **CapitalStructure:** Resolution Flags
- **Director:** Vetting Flags
- **ComplianceDocumentation:** Full Table 8 support

## Next Steps
- Verify the generated report text against the physical documents.
- Use the endpoint to download the memo for filing.
