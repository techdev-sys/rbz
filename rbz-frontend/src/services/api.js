import axios from 'axios';
import { clearSession, isStaff } from './session';

export const API_URL = "/api";

/**
 * Turn any caught error into text safe to show a user.
 * Prefers the server's message (our backend always sends clean, human-readable
 * text), maps network failures to plain language, and never surfaces raw
 * axios/exception internals like "Request failed with status code 500".
 */
export const friendlyError = (err, fallback = 'Something went wrong. Please try again.') => {
    const data = err?.response?.data;
    if (typeof data === 'string' && data.trim() && data.length <= 300 && !data.startsWith('<')) {
        return data;
    }
    if (data && typeof data === 'object') {
        if (typeof data.message === 'string' && data.message.trim()) return data.message;
        if (typeof data.error === 'string' && data.error.trim()) return data.error;
    }
    if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
        return 'Cannot reach the server. Please check your connection and try again.';
    }
    return fallback;
};

const PUBLIC_PATHS = new Set(['/', '/login', '/register', '/auth', '/staff-login']);

// --- AXIOS INTERCEPTOR FOR JWT ---
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const wasStaff = isStaff();
            clearSession();

            const path = window.location.pathname;
            if (!PUBLIC_PATHS.has(path)) {
                window.location.href = wasStaff ? '/staff-login' : '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- AUTHENTICATION ---
export const registerApplicant = async (email, password, companyName, contactPersonName) => {
    return axios.post(`${API_URL}/auth/register`, { email, password, companyName, contactPersonName });
};

export const authenticateUser = async (role, username, password) => {
    return axios.post(`${API_URL}/auth/login`, { username, password, role });
};

// --- EXAMINER MANAGEMENT (Senior BE) ---

export const createExaminer = async (examinerData) => {
    return axios.post(`${API_URL}/examiners`, examinerData);
};

export const getExaminers = async () => {
    return axios.get(`${API_URL}/examiners`);
};

export const getActiveExaminers = async () => {
    return axios.get(`${API_URL}/examiners/active`);
};

export const updateExaminer = async (id, data) => {
    return axios.put(`${API_URL}/examiners/${id}`, data);
};

export const deleteExaminer = async (id) => {
    return axios.delete(`${API_URL}/examiners/${id}`);
};

export const getExaminerWorkload = async (id) => {
    return axios.get(`${API_URL}/examiners/${id}/workload`);
};

// --- LICENSE CODE GENERATION ---

export const generateLicenseCode = async (companyId) => {
    return axios.post(`${API_URL}/company/${companyId}/generate-license-code`);
};

// --- STAGE 1: COMPANY PROFILE ---

export const createCompanyProfile = async (companyData) => {
    return axios.post(`${API_URL}/company/save`, companyData);
};

export const getCompanyProfile = async (companyId) => {
    return axios.get(`${API_URL}/company/${companyId}`);
};

export const getAllCompanyProfiles = async () => {
    return axios.get(`${API_URL}/company`);
};

// --- WORKFLOW API ---
export const submitApplication = async (companyId) => {
    return axios.post(`${API_URL}/company/${companyId}/submit`);
};

export const assignApplication = async (companyId, examinerName) => {
    return axios.post(`${API_URL}/company/${companyId}/assign`, null, {
        params: { examinerName }
    });
};

export const getApplicationsByStatus = async (status) => {
    return axios.get(`${API_URL}/company/status/${status}`);
};

export const getAssignedApplications = async (examinerName) => {
    return axios.get(`${API_URL}/company/assigned/${examinerName}`);
};

// --- ACTIVITY (timeline + staff work-queue signals) ---
export const getActivityTimeline = async (companyId) => {
    return axios.get(`${API_URL}/activity/${companyId}`);
};

export const getActivitySummary = async (companyIds) => {
    return axios.get(`${API_URL}/activity/summary`, { params: { ids: companyIds.join(',') } });
};


// This is the function that was missing!
export const uploadCertificate = async (file, companyId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);

    return axios.post(`${API_URL}/company/upload-cert`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// --- STAGE 2: OWNERSHIP (NEW) ---

export const getShareholdingStructure = async (companyId) => {
    return axios.get(`${API_URL}/ownership/shareholding-structure/${companyId}`);
};

export const addShareholderManual = async (companyId, shareholderData) => {
    return axios.post(`${API_URL}/ownership/manual-entry/${companyId}`, shareholderData);
};

export const deleteShareholder = async (shareholderId) => {
    return axios.delete(`${API_URL}/ownership/shareholders/${shareholderId}`);
};

export const validateOwnershipCompliance = async (companyId) => {
    return axios.get(`${API_URL}/ownership/validate-compliance/${companyId}`);
};

export const uploadShareholderDocument = async (shareholderId, documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '';
    // map documentType to endpoint suffix
    switch (documentType) {
        case 'netWorthStatement':
            endpoint = 'upload-net-worth-statement';
            break;
        case 'shareholderAffidavit':
            endpoint = 'upload-shareholder-affidavit';
            break;
        case 'capitalConfirmation':
            endpoint = 'upload-capital-confirmation';
            break;
        case 'applicationForm':
            endpoint = 'upload-application-form';
            break;
        case 'applicationLetter':
            endpoint = 'upload-application-letter';
            break;
        default:
            endpoint = `upload-shareholder-document/${documentType}`;
            break;
    }

    return axios.post(`${API_URL}/ownership/${shareholderId}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const uploadCompanyOwnershipDocument = async (companyId, documentType, file) => {
    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '';
    switch (documentType) {
        case 'applicationFee':
            endpoint = 'upload-application-fee';
            break;
        case 'boardResolution':
            endpoint = 'upload-board-resolution';
            break;
        default:
            endpoint = `upload-document/${documentType}`;
            break;
    }

    return axios.post(`${API_URL}/ownership/${companyId}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

export const getOwnershipUploadedDocuments = async (companyId) => {
    return axios.get(`${API_URL}/ownership/uploaded-documents/${companyId}`);
};


// --- BOARD COMMITTEES ---

export const getBoardCommittees = async (companyId) => {
    return axios.get(`${API_URL}/board-committee/company/${companyId}`);
};

// --- STAGE 2: DIRECTOR VETTING ---

export const getDirectors = async (companyId) => {
    return axios.get(`${API_URL}/director-vetting/company/${companyId}`);
};

export const createDirector = async (director) => {
    return axios.post(`${API_URL}/director-vetting/create`, director);
};

export const updateDirectorRecord = async (directorId, director) => {
    return axios.put(`${API_URL}/director-vetting/${directorId}`, director);
};

export const deleteDirectorRecord = async (directorId) => {
    return axios.delete(`${API_URL}/director-vetting/${directorId}`);
};

export const uploadCV = async (file, companyId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);

    const response = await axios.post(`${API_URL}/application/uploadCV`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // <--- IMPORTANT: Return .data so React can read .riskFlag
};

export const verifyDocument = async (file, docType, companyId, directorName) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);
    formData.append("companyId", companyId);

    // Add the Director Name if it exists
    if (directorName) {
        formData.append("directorName", directorName);
    }

    return axios.post(`${API_URL}/application/verify-document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

// --- STAGE 3: OWNERSHIP (SHAREHOLDERS) ---

export const extractCR11 = async (file, companyId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);

    return axios.post(`${API_URL}/shareholder/upload-cr11`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const saveShareholders = async (shareholdersList) => {
    return axios.post(`${API_URL}/shareholder/save-list`, shareholdersList);
};

export const getShareholders = async (companyId) => {
    return axios.get(`${API_URL}/shareholder/list/${companyId}`);
};

// --- STAGE 3: APPLICATION FORM ---

export const saveApplicationForm = async (formData) => {
    return axios.post(`${API_URL}/application-form/save`, formData);
};

export const getApplicationFormByCompany = async (companyId) => {
    return axios.get(`${API_URL}/application-form/company/${companyId}`);
};

export const getApplicationForm = async (formId) => {
    return axios.get(`${API_URL}/application-form/${formId}`);
};

export const updateApplicationForm = async (formId, formData) => {
    return axios.put(`${API_URL}/application-form/${formId}`, formData);
};

export const submitApplicationForm = async (formId) => {
    return axios.post(`${API_URL}/application-form/${formId}/submit`);
};

// --- STAGE 4: CAPITAL STRUCTURE ---

export const saveCapitalStructure = async (capitalData) => {
    return axios.post(`${API_URL}/capital/save`, capitalData);
};

export const getCapitalStructure = async (companyId) => {
    return axios.get(`${API_URL}/capital/${companyId}`);
};

export const saveFinancialPerformance = async (financialData) => {
    return axios.post(`${API_URL}/financials/save`, financialData);
};

export const getFinancialPerformance = async (companyId) => {
    return axios.get(`${API_URL}/financials/list/${companyId}`);
};

export const saveLoanDistribution = async (loanData) => {
    return axios.post(`${API_URL}/loan-distribution/save`, loanData);
};

export const getLoanDistribution = async (companyId) => {
    return axios.get(`${API_URL}/loan-distribution/list/${companyId}`);
};

// --- STAGE 5: PRODUCTS & SERVICES ---

export const saveProductsAndServices = async (productsData) => {
    return axios.post(`${API_URL}/products-services/save`, productsData);
};

export const getProductsAndServices = async (companyId) => {
    return axios.get(`${API_URL}/products-services/${companyId}`);
};

// --- STAGE 6: FINANCIAL PROJECTIONS ---

export const saveFinancialAssumptions = async (assumptionsData) => {
    return axios.post(`${API_URL}/assumptions/save`, assumptionsData);
};

export const getFinancialAssumptions = async (companyId) => {
    return axios.get(`${API_URL}/assumptions/list/${companyId}`);
};

// New Financial Projections API
export const saveFinancialProjection = async (projectionData) => {
    return axios.post(`${API_URL}/projections/save`, projectionData);
};

export const saveAllFinancialProjections = async (projectionsArray) => {
    return axios.post(`${API_URL}/projections/save-all`, projectionsArray);
};

export const getFinancialProjections = async (companyId) => {
    return axios.get(`${API_URL}/projections/list/${companyId}`);
};

export const uploadProjectionsDocument = async (file, companyId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("companyId", companyId);

    return axios.post(`${API_URL}/projections/upload-extract`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};


// --- STAGE 7: COMPLIANCE ---

export const saveCompliance = async (complianceData) => {
    return axios.post(`${API_URL}/compliance/save`, complianceData);
};

export const getCompliance = async (companyId) => {
    return axios.get(`${API_URL}/compliance/${companyId}`);
};

export const saveComplaints = async (complaintsData) => {
    return axios.post(`${API_URL}/complaints/save`, complaintsData);
};

export const getComplaints = async (companyId) => {
    return axios.get(`${API_URL}/complaints/${companyId}`);
};

// --- STAGE 8: GROWTH & DEVELOPMENT ---

export const saveGrowthAndDevelopment = async (growthData) => {
    return axios.post(`${API_URL}/growth/save`, growthData);
};

export const getGrowthAndDevelopment = async (companyId) => {
    return axios.get(`${API_URL}/growth/${companyId}`);
};

// --- REPORT GENERATION & APPROVAL (institution-neutral /api/report/**) ---

export const generateReport = async (companyId) => {
    return axios.get(`${API_URL}/report/generate/${companyId}`);
};

export const getReport = async (companyId) => {
    return axios.get(`${API_URL}/report/${companyId}`);
};

export const submitReport = async (companyId, reportData) => {
    return axios.post(`${API_URL}/report/submit/${companyId}`, reportData);
};

export const reviewReport = async (companyId, reviewData) => {
    return axios.post(`${API_URL}/report/review/${companyId}`, reviewData);
};

export const recommendReport = async (companyId, recommendData) => {
    return axios.post(`${API_URL}/report/recommend/${companyId}`, recommendData);
};

export const approveReport = async (companyId, approvalData) => {
    return axios.post(`${API_URL}/report/approve/${companyId}`, approvalData);
};

// Multi-level approval chain (Phase 2)
export const directorSignReport = async (companyId, data) => {
    return axios.post(`${API_URL}/report/director-sign/${companyId}`, data);
};

export const governorSignReport = async (companyId, data) => {
    return axios.post(`${API_URL}/report/governor-sign/${companyId}`, data);
};

// --- NEW INSTITUTION-SPECIFIC STAGES ---
export const saveDepositProtection = async (data) =>
    axios.post(`${API_URL}/deposit-protection/save`, data);
export const getDepositProtection = async (companyId) =>
    axios.get(`${API_URL}/deposit-protection/${companyId}`);

export const saveLiquidityManagement = async (data) =>
    axios.post(`${API_URL}/liquidity/save`, data);
export const getLiquidityManagement = async (companyId) =>
    axios.get(`${API_URL}/liquidity/${companyId}`);

export const saveITCyberRisk = async (data) =>
    axios.post(`${API_URL}/it-cyber-risk/save`, data);
export const getITCyberRisk = async (companyId) =>
    axios.get(`${API_URL}/it-cyber-risk/${companyId}`);

export const saveRecoveryResolution = async (data) =>
    axios.post(`${API_URL}/recovery-resolution/save`, data);
export const getRecoveryResolution = async (companyId) =>
    axios.get(`${API_URL}/recovery-resolution/${companyId}`);

// --- SENIOR EXAMINER REPORT REVIEW ---

export const getPendingReviewReports = async () => {
    return axios.get(`${API_URL}/report/pending-review`);
};

export const getReportsByStatus = async (status) => {
    return axios.get(`${API_URL}/report/by-status/${status}`);
};

// --- EXAMINER REVIEW ---

// Maximum upload size in bytes — must match backend FileSecurityHelper.MAX_FILE_SIZE_BYTES.
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Upload a supporting document for a company application.
 * Returns the server response which includes:
 *   { documentId, verificationStatus, aiReason, sha256, version, summary, extractedData }
 *
 * `onProgress(percent)` is called as the upload progresses (0..100).
 */
export const uploadCompanyDocument = async (file, companyId, documentType, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    formData.append('documentType', documentType);

    const response = await axios.post(`${API_URL}/documents/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (!onProgress || !e.total) return;
            onProgress(Math.round((e.loaded * 100) / e.total));
        },
    });
    return response.data;
};

export const getCompanyDocuments = async (companyId) => {
    return axios.get(`${API_URL}/documents/${companyId}`);
};

/**
 * Examiner verdict on a single document.
 * @param documentId  CompanyDocument PK
 * @param verificationStatus  one of EXAMINER_VERIFIED | REJECTED | MANUAL_REVIEW
 * @param examinerComment     free-text note (≤ 2000 chars)
 */
export const reviewDocument = async (documentId, verificationStatus, examinerComment) => {
    return axios.patch(`${API_URL}/documents/${documentId}/review`, {
        verificationStatus,
        examinerComment,
    });
};

export const getDocumentExtractionStatus = async (companyId) => {
    return axios.get(`${API_URL}/documents/status/${companyId}`);
};

export const getStageReviews = async (companyId) => {
    return axios.get(`${API_URL}/review/${companyId}`);
};

export const saveStageReview = async (reviewData) => {
    return axios.post(`${API_URL}/review/save`, reviewData);
};

// --- DIRECTOR QUESTIONNAIRE (DQ / Fit & Proper Form) ---

export const saveDirectorQuestionnaire = async (dqData) => {
    return axios.post(`${API_URL}/director-questionnaire/save`, dqData);
};

export const getDirectorQuestionnaire = async (directorId) => {
    return axios.get(`${API_URL}/director-questionnaire/director/${directorId}`);
};

export const getCompanyDirectorQuestionnaires = async (companyId) => {
    return axios.get(`${API_URL}/director-questionnaire/company/${companyId}`);
};

// Download a CompanyDocument record by its ID (Stage 9 docs)
export const getDocumentDownloadUrl = (documentId) => {
    return `${API_URL}/documents/download/${documentId}`;
};

// Download any uploaded file by its stored path (ownership, director, committee docs)
export const getFileDownloadUrl = (filePath, fileName) => {
    const params = new URLSearchParams({ path: filePath });
    if (fileName) params.append('name', fileName);
    return `${API_URL}/documents/download-by-path?${params.toString()}`;
};

// --- RISK SCORING ---
export const getRiskScore = async (companyId) => {
    return axios.get(`${API_URL}/risk/${companyId}`);
};

export const calculateAndSaveRiskScore = async (companyId) => {
    return axios.post(`${API_URL}/risk/${companyId}/calculate`);
};

// --- AML SCREENING ---
export const screenCompanyAml = async (companyId) => {
    return axios.post(`${API_URL}/aml/screen/${companyId}`);
};

export const screenNameAml = async (name, idNumber) => {
    return axios.post(`${API_URL}/aml/screen-name`, { name, idNumber });
};

// --- LICENSE LIFECYCLE ---
export const getLicenseLifecycleDashboard = async () => {
    return axios.get(`${API_URL}/license-lifecycle/dashboard`);
};

export const renewLicense = async (companyId, renewedBy) => {
    return axios.post(`${API_URL}/license-lifecycle/renew/${companyId}`, { renewedBy });
};

// --- AUDIT LOG ---
export const getAuditLogs = async (companyId) => {
    const params = companyId ? { companyId } : {};
    return axios.get(`${API_URL}/audit/logs`, { params });
};

export const verifyAuditIntegrity = async () => {
    return axios.get(`${API_URL}/audit/verify-integrity`);
};