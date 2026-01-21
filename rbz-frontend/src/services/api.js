import axios from 'axios';

export const API_URL = "http://localhost:8080/api";

// --- STAGE 1: COMPANY PROFILE ---

export const createCompanyProfile = async (companyData) => {
    return axios.post(`${API_URL}/company/save`, companyData);
};


export const getCompanyProfile = async (companyId) => {
    return axios.get(`${API_URL}/company/${companyId}`);
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
            throw new Error(`Unknown document type: ${documentType}`);
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
            throw new Error(`Unknown document type: ${documentType}`);
    }

    return axios.post(`${API_URL}/ownership/${companyId}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};


// --- STAGE 2: DIRECTOR VETTING ---

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
    return axios.post(`${API_URL}/products/save`, productsData);
};

export const getProductsAndServices = async (companyId) => {
    return axios.get(`${API_URL}/products/${companyId}`);
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

// --- STAGE 9: REPORT GENERATION & APPROVAL ---

export const generateReport = async (companyId) => {
    return axios.get(`${API_URL}/mfi-report/generate/${companyId}`);
};

export const getReport = async (companyId) => {
    return axios.get(`${API_URL}/mfi-report/${companyId}`);
};

export const submitReport = async (companyId, reportData) => {
    return axios.post(`${API_URL}/mfi-report/submit/${companyId}`, reportData);
};

export const reviewReport = async (companyId, reviewData) => {
    return axios.post(`${API_URL}/mfi-report/review/${companyId}`, reviewData);
};

export const recommendReport = async (companyId, recommendData) => {
    return axios.post(`${API_URL}/mfi-report/recommend/${companyId}`, recommendData);
};

export const approveReport = async (companyId, approvalData) => {
    return axios.post(`${API_URL}/mfi-report/approve/${companyId}`, approvalData);
};