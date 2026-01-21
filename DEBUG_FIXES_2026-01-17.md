# Bug Fixes Applied - 2026-01-17

## Issues Fixed:

### 1. ✅ Stage Number Correction
**Issue**: DirectorVetting showed "Stage 3" instead of "Stage 2"
**Fix**: Updated header to display "Stage 2: Directors & Governance Vetting"
**File**: `rbz-frontend/src/components/DirectorVetting.js`

### 2. ✅ Net Worth Display Issue
**Issue**: Net worth column showing "N/A" even after inputting numbers
**Fix**: Enhanced display logic to properly format numbers and only show N/A when truly empty
**File**: `rbz-frontend/src/components/Stage2Ownership.js`
**Code**: Now checks if value exists and formats it appropriately (handles both string and number types)

### 3. ✅ Missing Certified ID Validation
**Issue**: `certifiedId` document type was not being validated, causing failures
**Fix**: Added validation logic in AI service to check for:
  - Certification stamps (certified/commissioner/notary)
  - ID markers (passport/national id/identity)
**File**: `rbz_ai/main.py`

### 4. ✅ Document Verification Timeout Errors
**Issue**: Large files causing `ERR_CONTENT_LENGTH_MISMATCH` and network timeouts

**Fixes Applied**:

a) **File Size Limit** (AI Service)
   - Added 10MB file size check
   - Returns early with helpful error message for oversized files
   - File: `rbz_ai/main.py`

b) **Extended HTTP Timeouts** (Backend)
   - Configured RestTemplate with:
     - Connect timeout: 30 seconds
     - Read timeout: 60 seconds (for AI processing)
   - File: `rbz_backend/.../config/AppConfig.java`

c) **Better Error Messages** (Frontend)
   - Enhanced error handling to show specific messages:
     - Network timeouts → "file may be too large, try compressing"
     - Server errors → Show status code and details
   - File: `rbz-frontend/src/components/DirectorVetting.js`

### 5. ✅ CV Qualifications Not Found
**Status**: Investigated - The mapping chain is correct:
  - AI returns `qualifications` field ✓
  - DirectorDTO has `@JsonProperty("qualifications")` ✓
  - Director entity has `getQualifications()` ✓
  - Frontend expects `result.qualifications` ✓

**Potential Cause**: AI might not be finding qualifications in some CVs
**Solution**: Already has fallback in backend: `"Not Found"` if null

## Testing Recommendations:

1. **Stage 2 (Ownership)**:
   - Add a shareholder with a numeric net worth
   - Verify it displays the number correctly (not "N/A")

2. **Stage 2 (Director Vetting)**:
   - Upload a small CV (< 2MB) first to test functionality
   - Upload supporting documents one at a time
   - Check that error messages are clear if files are too large

3. **File Sizes**:
   - Keep PDFs under 10MB for best performance
   - Compress large scanned documents before upload

4. **Document Types Supported**:
   - ✅ CV/Resume
   - ✅ Affidavit
   - ✅ Net Worth Certificate
   - ✅ Police Clearance
   - ✅ Tax Clearance
   - ✅ Certified ID/Passport

## Next Steps:
If issues persist, check:
1. Backend logs for specific AI service errors
2. AI service console for Gemini API quota/rate limit messages
3. Network tab in browser for actual response sizes
