# RBZ Licensing System — Full Workflow Intelligence Analysis

**Date:** 2026-02-25  
**Purpose:** Analyze whether the system intelligence is "all-rounded and interconnected" for the complete licensing workflow.

---

## 🔄 Expected Workflow (As Per Requirements)

```
1. Applicant registers account → starts application (fills 9 stages)
2. Applicant submits application
3. Senior Bank Examiner sees it in their pipeline
4. Senior Bank Examiner delegates (assigns) to a Bank Examiner
5. Bank Examiner reviews all stages, AI assists, generates evaluation report
6. Bank Examiner submits report back to Senior for review
7. Senior Bank Examiner reviews the report
8. Senior approves → License granted
```

---

## ✅ WHAT IS WORKING (Connected)

| Step | Component | Status |
|------|-----------|--------|
| Applicant registers | `ApplicantRegistration.js` → `POST /api/company/save` | ✅ Working |
| Applicant fills 9 stages | `WizardLayout` with stages 1-9 | ✅ Working |
| Applicant submits | `POST /api/company/{id}/submit` → sets `SUBMITTED` | ✅ Working |
| Senior sees submitted apps | `DashboardSenior.js` → `GET /api/company/status/SUBMITTED` | ✅ Working |
| Senior delegates to examiner | `POST /api/company/{id}/assign` → sets `ASSIGNED` + `assignedExaminer` | ✅ Working |
| Examiner sees assigned apps | `DashboardExaminer.js` → `GET /api/company/assigned/{name}` | ✅ Working |
| Examiner opens review wizard | "Conduct Review →" button → `WizardLayout` in read-only mode | ✅ Working |
| AI assists examiner (rule engine) | `WorkflowStatusPanel.js` → `WorkflowEngineService` evaluates rules | ✅ Working |
| Examiner generates report | `ReportGeneration.js` → `MFIReportGenerationService` | ✅ Working |
| Report submit/review/approve API | `MFIReportController` with full workflow chain | ✅ Working |
| AI Learning Service | `LearningService.java` captures events throughout | ✅ Working |

---

## 🔴 GAPS & DISCONNECTIONS IDENTIFIED

### **GAP 1: Senior Examiner Cannot See Completed Reports for Review**
**Severity: CRITICAL**

The Senior Bank Examiner dashboard (`DashboardSenior.js`) only shows application pipeline and staff resources. There is **no tab or view** for the Senior to:
- See reports that have been submitted by examiners (`workflowStatus = 'SUBMITTED'`)
- Review and approve/reject those reports
- View the generated HTML report
- Grant the license

**Current state:** The Senior dashboard is purely a delegation tool — it has no "Reports Pending My Review" section.

**Impact:** The report never comes back to the Senior. The approval chain is broken after the examiner submits.

---

### **GAP 2: No "UNDER_REVIEW" or "COMPLETED" Status Transition After Report Approval**
**Severity: HIGH**

When a report is approved via `POST /api/mfi-report/approve/{companyId}`, the `EvaluationReport.workflowStatus` is set to `APPROVED`, but:
- The `CompanyProfile.applicationStatus` is **never updated** from `ASSIGNED` to `COMPLETED` or `APPROVED`
- There is no connection between report approval and the company's overall application status
- The applicant has **no way to see** that their license was granted

**Impact:** The applicant dashboard still shows "Application In Progress" even after the license is granted.

---

### **GAP 3: Report Approval Button Only Shows for `user_role === 'registrar'`**
**Severity: HIGH**

In `ReportGeneration.js` (line 203):
```javascript
{reportData && reportData.workflowStatus === 'PENDING_APPROVAL' && user_role === 'registrar' && (
```

But the system only has 3 roles: `applicant`, `examiner`, `senior_be`. There is **no `registrar` role**. This means the "Approve License" and "Reject Application" buttons are **never visible** to anyone.

**Impact:** No one in the system can actually approve the final report/license.

---

### **GAP 4: Report Workflow Skips "Review by Senior" Step**
**Severity: MEDIUM**

The `MFIReportController` has this approval chain:
1. `submit` (Examiner → SUBMITTED)
2. `review` (Reviewer → UNDER_REVIEW)
3. `recommend` (Recommender → PENDING_APPROVAL)
4. `approve` (Registrar → APPROVED)

But the frontend has no UI pathway that correctly routes the report through these intermediary steps. The examiner can submit, but there's no frontend form for the Senior to:
- Review (step 2)
- Recommend (step 3)

These API endpoints exist but have **no frontend connected to them**.

---

### **GAP 5: Examiner Name is Hardcoded**
**Severity: MEDIUM**

In `DashboardExaminer.js` (line 10):
```javascript
const examinerName = "P. T. Madamombe";
```

And in `ReportGeneration.js` (line 100):
```javascript
approvedBy: 'P. T. Madamombe',
```

The examiner name should come from the JWT token or user profile, not be hardcoded. If the Senior delegates to "S. K. Moyo", the examiner dashboard still fetches apps for "P. T. Madamombe".

**Impact:** Only one examiner can ever use the system properly.

---

### **GAP 6: Senior Examiner Cannot Review the Application Directly**
**Severity: MEDIUM**

The Senior dashboard has no "Review Application" button. While a route exists at `/senior_be/review`, there's no click handler (`onReviewApp`) wired up in `DashboardSenior.js` to navigate there. The Senior can delegate but cannot personally inspect an application.

---

### **GAP 7: Examiner Staff List is Client-Side Only**
**Severity: MEDIUM**

The examiner list in `DashboardSenior.js` is stored as local React state:
```javascript
const [examiners, setExaminers] = useState([
    { id: 'EX-2026-001', name: 'P. T. Madamombe', ... },
    ...
]);
```

There is **no backend model or API** for managing examiner users. The workload counter is static and doesn't reflect actual assignments.

---

### **GAP 8: ComplianceDocumentation Stage (Stage 7) is Missing from Wizard**
**Severity: LOW**

The stage list in `WizardLayout` jumps from "Financial Projections" (7) to "Growth & Development" (8) to "Documents Upload" (9). The `ComplianceDocumentation.js` component exists but is **not included** in the wizard stages. However, the MFI report generation service still queries compliance data.

---

### **GAP 9: Applicant Cannot See Examiner Feedback**
**Severity: MEDIUM**

When an examiner flags a stage via `ReviewControlPanel`, the comment is saved in `StageReview`. However, the applicant's wizard view shows **no indication** of examiner feedback. The label says "REGULATORY COMMENTS (Visible to Applicant)" but the applicant wizard doesn't fetch or display `StageReview` data.

---

### **GAP 10: Business Plan Review Rules are Always PASS**
**Severity: LOW**

In `WorkflowEngineService.evaluateBusinessPlanReview()`, all 5 rules are hardcoded to `RuleResult.PASS`:
```java
logs.add(createLog(..., RuleResult.PASS, "AI Verification: Executive Summary is present.", ...));
```

These should be connected to actual AI analysis of uploaded documents.

---

## 📋 RECOMMENDED FIXES (Priority Order)

### Priority 1: Connect Report Approval to Senior Dashboard
**Files:** `DashboardSenior.js`, `api.js`

Add a "Reports for Review" tab in the Senior dashboard that:
1. Fetches all `EvaluationReport` records with `workflowStatus = 'SUBMITTED'`
2. Shows report preview (HTML)
3. Allows Senior to "Review" → "Recommend" → "Approve/Reject"
4. Updates `CompanyProfile.applicationStatus` to `COMPLETED`/`APPROVED` upon approval

### Priority 2: Fix Report Approval Role Check
**File:** `ReportGeneration.js`

Change `user_role === 'registrar'` to `user_role === 'senior_be'`, or better yet, show different action buttons based on role:
- `examiner` → "Submit for Review"
- `senior_be` → "Review", "Recommend", "Approve/Reject"

### Priority 3: Connect Report Approval to Application Status
**File:** `MFIReportController.java` → `approveReport()`

After setting `EvaluationReport` status to `APPROVED`, also update `CompanyProfile.applicationStatus = "APPROVED"`.

### Priority 4: Dynamic Examiner Name from Auth
**Files:** `DashboardExaminer.js`, `ReportGeneration.js`, `ReviewControlPanel` usage in `App.js`

Read the examiner name from `localStorage` (set during login) instead of hardcoding it.

### Priority 5: Allow Senior to Review Applications
**File:** `DashboardSenior.js`

Add a "View Details" button on each application row that opens the review wizard (same as examiner).

### Priority 6: Show Examiner Feedback to Applicant
**Files:** Applicant wizard stages, create new `ExaminerFeedbackBanner.js`

Fetch `StageReview` data for the applicant's company and display any `FLAGGED` stages with the examiner's comments.

---

## 🔬 SYSTEM ARCHITECTURE DIAGRAM (Current State)

```
  APPLICANT                    SENIOR BE                    EXAMINER
  ─────────                    ─────────                    ────────
  Register Account             
  Fill 9 Stages               
  Submit Application ───────→ Sees in Pipeline             
                              Delegates ──────────────────→ Sees Assigned Apps
                                                           Reviews (read-only wizard)
                                                           AI Rule Engine helps
                                                           Generates Report
                                                           Submits Report
                              ❌ NO WAY TO SEE REPORT ←── Report goes nowhere visible
                              ❌ CANNOT APPROVE            
  ❌ NEVER NOTIFIED           ❌ CANNOT GRANT LICENSE      ❌ PROCESS DEAD-ENDS
```

## 🎯 TARGET ARCHITECTURE (After Fixes)

```
  APPLICANT                    SENIOR BE                    EXAMINER
  ─────────                    ─────────                    ────────
  Register Account             
  Fill 9 Stages               
  Submit Application ───────→ Sees in Pipeline             
                              Delegates ──────────────────→ Sees Assigned Apps
                                                           Reviews (read-only wizard)
                                                           AI Rule Engine helps
                                                           Generates Report
                              ←──── Report Submitted ─────── Submits Report
                              Reviews Report (HTML view)
                              Approves/Rejects
                              License Granted/Rejected
  Sees "APPROVED" status ←─── Status synced to company
  Can download license doc     
```

---

## 📊 Summary Score — AFTER FIXES

| Dimension | Before | After | Notes |
|-----------|--------|-------|-------|
| Applicant → System | 8/10 | **9/10** | Now shows APPROVED/REJECTED status + congratulatory messages |
| Senior → System | 4/10 | **9/10** | Full report review tab, HTML preview, approve/reject/review/recommend |
| Examiner → System | 7/10 | **8/10** | Dynamic examiner name from auth, proper role-based buttons |
| Report → Approval Flow | 3/10 | **9/10** | Full chain: Submit → Review → Recommend → Approve, status syncs to company |
| End-to-End Connectivity | 4/10 | **9/10** | Complete loop: Applicant → Senior → Examiner → Report → Senior → License → Applicant |
| AI Integration | 6/10 | 6/10 | Learning service captures, BP rules still stubs (low priority) |

**Overall System Interconnectedness: 5/10 → 8.5/10** — All critical workflow gaps are now closed.

### ✅ Fixes Applied
1. **Senior Dashboard — Reports for Review tab** (`DashboardSenior.js`): Full report review with HTML preview, Review/Recommend/Approve/Reject workflow
2. **Report approval syncs to application** (`MFIReportController.java`): `CompanyProfile.applicationStatus` updated on approve/reject  
3. **Role check fixed** (`ReportGeneration.js`): Changed from impossible `registrar` role to `senior_be`
4. **Dynamic examiner names** (`LoginSelection.js`, `DashboardExaminer.js`, `ReportGeneration.js`): Username stored in localStorage during login
5. **Senior can view applications** (`App.js`): `onReviewApp` handler wired to Senior dashboard
6. **Applicant sees result** (`DashboardApplicant.js`): Dynamic status badges + congratulatory/rejection messages
7. **Backend query endpoints** (`EvaluationReportRepository`, `MFIReportController`): Pending review, by-status queries
8. **AI Learning on approval** (`MFIReportController`): Approval/rejection events captured

### 🔮 Remaining Items (Lower Priority)
- GAP 7: Examiner staff list is client-side only (no backend User model)
- GAP 8: ComplianceDocumentation stage not in wizard
- GAP 9: Applicant cannot see examiner stage feedback
- GAP 10: Business Plan review rules are hardcoded PASS

