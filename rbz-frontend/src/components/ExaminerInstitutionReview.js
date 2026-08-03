import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Card, Row, Col, Badge, Button, Alert, Spinner,
    Form, Table, ProgressBar, Modal
} from 'react-bootstrap';
import {
    getCompanyProfile, getCompanyDocuments, getStageReviews,
    saveStageReview, getDocumentExtractionStatus,
    getShareholdingStructure, getOwnershipUploadedDocuments,
    getDirectors, getApplicationFormByCompany,
    getCapitalStructure, getFinancialPerformance, getLoanDistribution,
    getProductsAndServices, getFinancialProjections, getFinancialAssumptions,
    getGrowthAndDevelopment,
    getDocumentDownloadUrl, getFileDownloadUrl,
    calculateAndSaveRiskScore, screenCompanyAml,
    getDepositProtection, getLiquidityManagement, getITCyberRisk, getRecoveryResolution,
    friendlyError,
} from '../services/api';
import '../Premium.css';
import ExaminerReportDraft from './ExaminerReportDraft';
import DocumentPreviewPanel from './DocumentPreviewPanel';
import ApplicationChat from './ApplicationChat';
import ActivityTimeline from './ActivityTimeline';
import * as XLSX from 'xlsx';

// ──────────────────────────────────────────────
//  STAGE DEFINITIONS
// ──────────────────────────────────────────────
const BASE_STAGES = [
    { id: 1, name: 'Company Profile', description: 'Institution identity, registration, and contact information' },
    { id: 2, name: 'Ownership Structure', description: 'Shareholding, UBO declarations, and ownership compliance' },
    { id: 3, name: 'Directors & Governance', description: 'Director vetting, board composition, and fit-and-proper checks' },
    { id: 4, name: 'Application Form', description: 'Formal application details and regulatory declarations' },
    { id: 5, name: 'Capital Structure', description: 'Capital adequacy, financial health, and asset quality' },
    { id: 6, name: 'Products & Services', description: 'Proposed lending and deposit products' },
    { id: 7, name: 'Financial Projections', description: '3-5 year financial forecasts and assumptions' },
    { id: 8, name: 'Growth & Development', description: 'Branch expansion, technology, and staffing plans' },
    { id: 9, name: 'Documents Upload', description: 'Supporting documentation and verification status' },
];

const DTMFI_EXTRA_STAGES = [
    { id: 10, name: 'Deposit Protection', description: 'DIPF registration, deposit liabilities, liquidity buffer, and run-off protocol' },
];

const BANK_EXTRA_STAGES = [
    { id: 10, name: 'Capital Adequacy', description: 'Basel III Tier 1 & Tier 2 capital — CAR ≥ 12%, minimum paid-up capital USD 30M' },
    { id: 11, name: 'Liquidity Management', description: 'LCR ≥ 100%, NSFR ≥ 100%, stress testing, and contingency funding plan' },
    { id: 12, name: 'IT & Cyber Risk', description: 'IT governance, cyber incident response, DRP, BCP, and penetration testing' },
    { id: 13, name: 'Recovery & Resolution', description: 'Recovery plan, capital/liquidity triggers, crisis management, and RBZ notification' },
];

const resolveInstitutionType = (company) => {
    if (!company) return 'MFI';
    const lt = (company.licenseType || '').toUpperCase();
    const it = (company.institutionType || '').toUpperCase();
    if (lt.includes('COMMERCIAL') || lt.includes('BANK') || it === 'COMMERCIAL_BANK') return 'COMMERCIAL_BANK';
    if (lt.includes('DTMFI') || lt.includes('DEPOSIT') || it === 'DTMFI') return 'DTMFI';
    return 'MFI';
};

const getReviewStages = (company) => {
    const type = resolveInstitutionType(company);
    if (type === 'COMMERCIAL_BANK') return [...BASE_STAGES, ...BANK_EXTRA_STAGES];
    if (type === 'DTMFI')           return [...BASE_STAGES, ...DTMFI_EXTRA_STAGES];
    return BASE_STAGES;
};

// Pre-defined regulatory issues per stage (examiner checklist)
const STAGE_ISSUES = {
    1: [
        'Company name on application does not match certificate of incorporation',
        'Registration number is invalid or unverifiable',
        'Physical address appears incomplete or incorrect',
        'Certificate of incorporation is missing or unclear',
        'Principal business activity not adequately described',
    ],
    2: [
        'Total shareholding does not equal 100%',
        'Shareholder exceeds 50% ownership cap',
        'Ultimate Beneficial Owner (UBO) not declared',
        'Net worth statement missing for one or more shareholders',
        'Shareholder affidavit not submitted',
        'Board resolution not attached',
    ],
    3: [
        'Police clearance certificate missing for one or more directors',
        'Fit-and-proper (probity) declaration not submitted',
        'Director CV/resume is incomplete',
        'Director appears on another active licensed institution (conflict)',
        'ID document missing or expired',
        'Director does not meet minimum qualification requirements',
    ],
    4: [
        'License type applied for does not match business activities described',
        'Paid-up capital declared is below minimum threshold of USD 1,250',
        'CEO name does not match director records',
        'Application letter not attached',
        'Application fee proof of payment not provided',
    ],
    5: [
        'Paid-up capital is below the regulatory minimum of USD 1,250',
        'Audited financial statements are missing',
        'Financial statements are more than 12 months old',
        'Loan portfolio data is inconsistent with financial statements',
        'Capital structure table is incomplete',
    ],
    6: [
        'Product descriptions are vague or incomplete',
        'Interest rates and fee structures not specified',
        'Target market not adequately defined',
        'Risk management for products not addressed',
        'Deposit products listed without required approvals',
    ],
    7: [
        'Financial projections appear unrealistic or unsupported',
        'Assumptions underpinning projections are not documented',
        'Revenue model is unclear',
        'Cash flow projections are missing',
        'Projection period is less than 3 years',
    ],
    8: [
        'Branch expansion plan is insufficiently detailed',
        'Technology and IT systems plan is missing',
        'Staffing projections do not support planned growth',
        'No evidence of capital for planned expansion',
        'Growth plan is inconsistent with financial projections',
    ],
    9: [
        'Audited financial statements not submitted',
        'ZIMRA tax clearance certificate missing',
        'Strategic business plan not attached',
        'Loan portfolio report missing',
        'Credit and risk policy manual not provided',
        'One or more documents are illegible or low quality',
    ],
    // DTMFI — Deposit Protection (stage 10 for DTMFI)
    10: [
        'DIPF registration status is PENDING or NOT_REGISTERED — must be REGISTERED',
        'Deposit liabilities figure is missing or appears inconsistent with financial statements',
        'Liquidity buffer ratio is below the 10% minimum threshold',
        'Run-off protocol document has not been submitted',
        'DIPF premium payment is in arrears or not evidenced',
        'Liquidity buffer assets are not identified or ring-fenced',
    ],
};

// Bank-specific issue sets (stages 10-13 for COMMERCIAL_BANK)
const STAGE_ISSUES_BANK = {
    10: [
        'Capital Adequacy Ratio (CAR) is below the minimum 12% Basel III requirement',
        'Tier 1 core capital is below USD 30 million minimum paid-up capital',
        'Tier 2 supplementary capital details are incomplete or unsupported',
        'Capital Conservation Buffer not demonstrated',
        'Risk-weighted assets calculation is missing or inconsistent',
        'Capital adequacy certification from external auditor not provided',
    ],
    11: [
        'Liquidity Coverage Ratio (LCR) is below 100% — does not meet Basel III minimum',
        'Net Stable Funding Ratio (NSFR) is below 100% — structural liquidity deficiency',
        'High-Quality Liquid Assets (HQLA) breakdown is incomplete',
        'Net cash outflows figure is not supported by evidence',
        'Stress testing scenarios have not been documented',
        'Contingency Funding Plan (CFP) is missing or inadequate',
    ],
    12: [
        'IT governance policy has not been board-approved or is outdated',
        'Cyber Incident Response Plan (CIRP) is missing',
        'Disaster Recovery Plan (DRP) has not been tested in the last 12 months',
        'Business Continuity Plan (BCP) is absent or not rehearsed',
        'No evidence of penetration testing within the required period',
        'Customer data is not stored within Zimbabwe (data residency violation)',
        'Cyber insurance coverage is absent or below the required threshold',
    ],
    13: [
        'Board-approved Recovery Plan is missing',
        'Capital recovery triggers are not defined or are set too low',
        'Liquidity recovery triggers are not defined or are set too low',
        'Recapitalisation options (rights issue, asset disposal) not documented',
        'Crisis Management Framework has not been adopted by the board',
        'RBZ notification protocol in the recovery plan does not reference the Banking Act',
        'Cross-border exposure is material but no resolution authority contact is listed',
    ],
};

const DOC_TYPE_LABELS = {
    financialStatements: 'Audited Financial Statements',
    businessPlan: 'Strategic Business Plan',
    portfolioReport: 'Loan Portfolio Report',
    creditPolicy: 'Credit & Risk Policy Manual',
    operationalManual: 'Operational Policy Manual',
    taxClearance: 'ZIMRA Tax Clearance Certificate',
    insurancePolicy: 'Credit Insurance Policy',
    amlCftPolicy: 'AML/CFT Compliance Programme',
    riskFramework: 'Enterprise Risk Management Framework',
    technologyPolicy: 'IT & Technology Risk Policy',
    certificate_incorporation: 'Certificate of Incorporation',
};

// ──────────────────────────────────────────────
//  DOWNLOAD HELPER
// ──────────────────────────────────────────────

/**
 * DownloadBtn — renders a download link for a document.
 * For CompanyDocument records (Stage 9), pass docId.
 * For ownership/director/committee files, pass filePath + fileName.
 */
const isPathUnavailable = (filePath) =>
    !filePath || filePath.startsWith('SYSTEM_STORAGE/') || filePath.startsWith('UNAVAILABLE/');

const DownloadBtn = ({ docId, filePath, fileName, label }) => {
    const token = localStorage.getItem('jwtToken');
    const [error, setError] = useState(null);
    const unavailable = !docId && isPathUnavailable(filePath);

    if (unavailable) {
        return (
            <span style={{ fontSize: '0.7rem', color: '#ccc', fontStyle: 'italic' }}>unavailable</span>
        );
    }

    const url = docId
        ? getDocumentDownloadUrl(docId)
        : getFileDownloadUrl(filePath, fileName);

    // We need to pass the JWT — use a fetch-based download
    const handleDownload = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await fetch(url, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (!res.ok) {
                setError(`Download failed (${res.status})`);
                return;
            }
            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName || 'document';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            setError(friendlyError(err, 'Download failed. Please try again.'));
        }
    };

    return (
        <>
            <button
                onClick={handleDownload}
                style={{
                    background: 'none', border: 'none', padding: '2px 6px',
                    fontSize: '0.72rem', color: '#003366', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    borderRadius: '4px', fontWeight: 600,
                    textDecoration: 'underline',
                }}
                title={`Download ${fileName || 'document'}`}
            >
                ⬇ {label || 'Download'}
            </button>
            {error && (
                <span style={{ fontSize: '0.68rem', color: '#c0392b', marginLeft: 4 }} title={error}>
                    {error}
                </span>
            )}
        </>
    );
};

/**
 * PreviewBtn — opens an inline preview modal for a path-based file
 * (ownership/director uploads), so the examiner does not have to
 * download every ID or affidavit just to look at it.
 */
const PreviewBtn = ({ filePath, fileName, label }) => {
    const [show, setShow] = useState(false);
    if (isPathUnavailable(filePath)) return null;

    return (
        <>
            <button
                onClick={() => setShow(true)}
                style={{
                    background: 'none', border: 'none', padding: '2px 6px',
                    fontSize: '0.72rem', color: '#1a6b2e', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    borderRadius: '4px', fontWeight: 600,
                    textDecoration: 'underline',
                }}
                title={`Preview ${fileName || 'document'}`}
            >
                {label || 'Preview'}
            </button>
            <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
                <Modal.Body className="p-0">
                    <DocumentPreviewPanel document={{ filePath, fileName }} />
                </Modal.Body>
                <Modal.Footer className="py-2">
                    <Button variant="secondary" size="sm" onClick={() => setShow(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

// ──────────────────────────────────────────────
//  FIELD HELPERS
// ──────────────────────────────────────────────
const Field = ({ label, value, highlight, span }) => {
    const missing = value === null || value === undefined || value === '' || value === 'N/A';
    return (
        <Col md={span || 4} className="mb-3">
            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#999', fontWeight: 600, marginBottom: '3px' }}>
                {label}
            </div>
            <div style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: missing ? '#bbb' : highlight ? '#c0392b' : '#1a1a1a',
                background: highlight && !missing ? '#fff5f5' : 'transparent',
                padding: highlight && !missing ? '2px 6px' : '0',
                borderRadius: '4px',
                display: 'inline-block',
            }}>
                {missing ? <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#ccc' }}>Not provided</span> : String(value)}
            </div>
        </Col>
    );
};

const SectionTitle = ({ title }) => (
    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#003366', fontWeight: 700, borderBottom: '2px solid #e8ecf0', paddingBottom: '6px', marginBottom: '14px', marginTop: '10px' }}>
        {title}
    </div>
);

// ──────────────────────────────────────────────
//  STAGE DATA PANELS
// ──────────────────────────────────────────────

const Stage1Panel = ({ company }) => (
    <div>
        <SectionTitle title="Institution Details" />
        <Row>
            <Field label="Institution Name" value={company?.companyName} />
            <Field label="Registration Number" value={company?.registrationNumber} />
            <Field label="License Type Applied For" value={company?.licenseType} />
            <Field label="Physical Address" value={company?.physicalAddress} span={6} />
            <Field label="Postal Address" value={company?.postalAddress} span={6} />
            <Field label="Phone Number" value={company?.phoneNumber} />
            <Field label="Email Address" value={company?.email} />
            <Field label="Website" value={company?.website} />
            <Field label="Date of Incorporation" value={company?.dateOfIncorporation} />
            <Field label="Principal Business Activity" value={company?.principalBusinessActivity} span={8} />
            <Field label="Application Status" value={company?.applicationStatus} />
        </Row>
    </div>
);

const Stage2Panel = ({ shareholders, ownershipDocs }) => {
    const totalShares = shareholders?.reduce((sum, s) => sum + (parseFloat(s.percentageOwnership) || 0), 0).toFixed(2);
    const overCap = shareholders?.filter(s => parseFloat(s.percentageOwnership) > 50);

    return (
        <div>
            <SectionTitle title="Shareholding Structure" />
            {shareholders?.length > 0 ? (
                <>
                    {parseFloat(totalShares) !== 100 && (
                        <Alert variant="danger" className="py-2 small mb-3 border-0">
                            Attention required: Total shareholding is <strong>{totalShares}%</strong> — it must equal exactly 100%.
                        </Alert>
                    )}
                    {overCap?.length > 0 && (
                        <Alert variant="danger" className="py-2 small mb-3 border-0">
                            Attention required: Shareholder(s) exceed the 50% cap: {overCap.map(s => s.shareholderName).join(', ')}
                        </Alert>
                    )}
                    <Table bordered hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                        <thead style={{ background: '#f4f7f6' }}>
                            <tr>
                                <th>Shareholder Name</th>
                                <th>Type</th>
                                <th>Nationality</th>
                                <th>% Ownership</th>
                                <th>Shares Held</th>
                                <th>Net Worth Stmt</th>
                                <th>Affidavit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shareholders.map((s, i) => (
                                <tr key={i} style={{ background: parseFloat(s.percentageOwnership) > 50 ? '#fff5f5' : 'white' }}>
                                    <td className="fw-semibold">{s.shareholderName || '—'}</td>
                                    <td>{s.shareholderType || '—'}</td>
                                    <td>{s.nationality || '—'}</td>
                                    <td>
                                        <span style={{ color: parseFloat(s.percentageOwnership) > 50 ? '#c0392b' : '#1a1a1a', fontWeight: 700 }}>
                                            {s.percentageOwnership ? `${s.percentageOwnership}%` : '—'}
                                        </span>
                                    </td>
                                    <td>{s.numberOfShares?.toLocaleString() || '—'}</td>
                                    <td>
                                        {s.netWorthStatementPath
                                            ? <><Badge bg="success" style={{ fontSize: '0.65rem' }}>Submitted</Badge> <PreviewBtn filePath={s.netWorthStatementPath} fileName={`net_worth_${s.shareholderName}.pdf`} /> <DownloadBtn filePath={s.netWorthStatementPath} fileName={`net_worth_${s.shareholderName}.pdf`} /></>
                                            : <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem' }}>Missing</Badge>}
                                    </td>
                                    <td>
                                        {s.shareholderAffidavitPath
                                            ? <><Badge bg="success" style={{ fontSize: '0.65rem' }}>Submitted</Badge> <PreviewBtn filePath={s.shareholderAffidavitPath} fileName={`affidavit_${s.shareholderName}.pdf`} /> <DownloadBtn filePath={s.shareholderAffidavitPath} fileName={`affidavit_${s.shareholderName}.pdf`} /></>
                                            : <Badge bg="warning" text="dark" style={{ fontSize: '0.65rem' }}>Missing</Badge>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f4f7f6', fontWeight: 700 }}>
                                <td colSpan={3}>Total</td>
                                <td style={{ color: parseFloat(totalShares) === 100 ? '#1a5c2e' : '#c0392b' }}>{totalShares}%</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </Table>
                </>
            ) : (
                <div className="text-center text-muted py-4">
                    <p className="mb-0 small">No shareholding data submitted yet.</p>
                </div>
            )}
            {ownershipDocs?.length > 0 && (
                <>
                    <SectionTitle title="Ownership Documents" />
                    <Row>
                        {ownershipDocs.map((d, i) => (
                            <Col md={6} key={i} className="mb-2">
                                <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{d.documentType?.replace(/_/g, ' ')}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#999' }}>{d.fileName || 'Uploaded'}</div>
                                    </div>
                                    <PreviewBtn filePath={d.filePath} fileName={d.fileName} />
                                    <DownloadBtn filePath={d.filePath} fileName={d.fileName} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </>
            )}
        </div>
    );
};

const Stage3Panel = ({ directors, onGenerateForm3 }) => (
    <div>
        <div className="d-flex justify-content-between align-items-center">
            <SectionTitle title="Board of Directors" />
            {directors?.length > 0 && (
                <Button
                    size="sm"
                    onClick={onGenerateForm3}
                    style={{ background: '#003366', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '14px', marginBottom: '12px' }}
                >
                    Generate Form 3
                </Button>
            )}
        </div>
        {directors?.length > 0 ? (
            directors.map((d, i) => (
                <Card key={i} className="border-0 mb-3" style={{ background: '#f8f9fa', borderRadius: '8px' }}>
                    <Card.Body className="p-3">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <div className="fw-bold" style={{ color: '#003366', fontSize: '0.95rem' }}>{d.fullName || `Director ${i + 1}`}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{d.designation || '—'} · {d.nationality || '—'}</div>
                            </div>
                            <div className="d-flex gap-1 flex-wrap justify-content-end">
                                <Badge bg={d.policeClearanceSubmitted === 'YES' ? 'success' : 'danger'} style={{ fontSize: '0.65rem' }}>
                                    Police Clearance: {d.policeClearanceSubmitted === 'YES' ? 'Submitted' : 'Missing'}
                                </Badge>
                                <Badge bg={d.probityFormSubmitted === 'YES' ? 'success' : 'danger'} style={{ fontSize: '0.65rem' }}>
                                    Fit &amp; Proper: {d.probityFormSubmitted === 'YES' ? 'Submitted' : 'Missing'}
                                </Badge>
                                <Badge bg={d.vettingStatus === 'APPROVED' ? 'success' : d.vettingStatus === 'REJECTED' ? 'danger' : 'secondary'} style={{ fontSize: '0.65rem' }}>
                                    {d.vettingStatus || 'PENDING'}
                                </Badge>
                            </div>
                        </div>
                        <Row>
                            <Field label="ID/Passport Type" value={d.idDocumentType} />
                            <Field label="ID Number" value={d.idDocumentNumber} />
                            <Field label="ID Verification" value={d.idDocumentVerificationStatus} />
                            <Field label="Date of Birth" value={d.dateOfBirth} />
                            <Field label="Phone" value={d.phoneNumber} />
                            <Field label="Email" value={d.email} />
                            {d.idDocumentPath && (
                                <Col md={4} className="mb-3">
                                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#999', fontWeight: 600, marginBottom: '3px' }}>ID Document</div>
                                    <PreviewBtn filePath={d.idDocumentPath} fileName={`id_${d.fullName}.pdf`} label="Preview ID" />
                                    <DownloadBtn filePath={d.idDocumentPath} fileName={`id_${d.fullName}.pdf`} label="Download ID" />
                                </Col>
                            )}
                        </Row>
                        <Row className="mt-1">
                            {[
                                ['Affidavit', d.affidavitVerified],
                                ['Net Worth Statement', d.netWorthVerified],
                                ['Police Clearance Doc', d.policeClearanceVerified],
                                ['Tax Clearance', d.taxClearanceVerified],
                                ['Certified ID', d.certifiedIdVerified],
                            ].map(([lbl, val]) => (
                                <Col md={4} key={lbl} className="mb-1">
                                    <div style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <span style={{ color: val ? '#1a5c2e' : '#777', fontSize: '0.72rem', fontWeight: 700 }}>{val ? 'YES' : 'NO'}</span>
                                        <span style={{ color: val ? '#1a5c2e' : '#aaa' }}>{lbl}</span>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Card.Body>
                </Card>
            ))
        ) : (
            <div className="text-center text-muted py-4">
                <p className="mb-0 small">No director records submitted yet.</p>
            </div>
        )}
    </div>
);

const Stage4Panel = ({ appForm }) => (
    <div>
        <SectionTitle title="Application Details" />
        <Row>
            <Field label="Institution Name" value={appForm?.nameOfInstitution} />
            <Field label="Registration Number" value={appForm?.registrationNumber} />
            <Field label="License Type" value={appForm?.licenseType} />
            <Field label="CEO / Managing Director" value={appForm?.ceoName} />
            <Field label="Contact Person" value={appForm?.contactPersonName} />
            <Field label="Contact Phone" value={appForm?.contactPersonPhone} />
            <Field label="Contact Email" value={appForm?.contactPersonEmail} />
            <Field label="Paid-Up Capital (USD)" value={appForm?.paidUpCapital} highlight={appForm?.paidUpCapital < 1250} />
            <Field label="Physical Address" value={appForm?.physicalAddress} span={8} />
        </Row>
        <SectionTitle title="Regulatory Declarations" />
        <Row>
            <Field label="Previous License Refused?" value={appForm?.previousLicenseRefused} />
            <Field label="Court Orders Against Institution?" value={appForm?.courtOrdersAgainst} />
            <Field label="Pending Litigation?" value={appForm?.pendingLitigation} />
            <Field label="Declaration Signed?" value={appForm?.declarationSigned ? 'Yes' : 'No'} />
            <Field label="Declaration Date" value={appForm?.declarationDate} />
        </Row>
    </div>
);

const Stage5Panel = ({ capital, financials, loanDist }) => (
    <div>
        <SectionTitle title="Capital Structure" />
        {capital ? (
            <Row>
                <Field label="Paid-Up Capital (USD)" value={capital.paidUpCapitalUsd} highlight={parseFloat(capital.paidUpCapitalUsd) < 1250} />
                <Field label="Paid-Up Capital (ZWL)" value={capital.paidUpCapitalZwl} />
                <Field label="Statutory Reserve" value={capital.statutoryReserve} />
                <Field label="Retained Earnings" value={capital.retainedEarnings} />
                <Field label="Total Shareholders Equity" value={capital.totalShareholdersEquity} />
                <Field label="Capital Adequacy Ratio" value={capital.capitalAdequacyRatio ? `${capital.capitalAdequacyRatio}%` : null} />
            </Row>
        ) : (
            <div className="text-muted small py-2">No capital structure data submitted.</div>
        )}

        {financials?.length > 0 && (
            <>
                <SectionTitle title="Financial Performance" />
                <Table bordered hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                    <thead style={{ background: '#f4f7f6' }}>
                        <tr>
                            <th>Year</th>
                            <th>Total Assets (USD)</th>
                            <th>Total Liabilities</th>
                            <th>Net Profit/Loss</th>
                            <th>Operating Income</th>
                        </tr>
                    </thead>
                    <tbody>
                        {financials.map((f, i) => (
                            <tr key={i}>
                                <td className="fw-semibold">{f.year}</td>
                                <td>{f.totalAssets?.toLocaleString() || '—'}</td>
                                <td>{f.totalLiabilities?.toLocaleString() || '—'}</td>
                                <td style={{ color: f.netProfit < 0 ? '#c0392b' : '#1a5c2e' }}>{f.netProfit?.toLocaleString() || '—'}</td>
                                <td>{f.operatingIncome?.toLocaleString() || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
        )}

        {loanDist?.length > 0 && (
            <>
                <SectionTitle title="Loan Portfolio Distribution" />
                <Table bordered hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                    <thead style={{ background: '#f4f7f6' }}>
                        <tr><th>Category</th><th>Amount (USD)</th><th>% of Portfolio</th><th>NPL Rate</th></tr>
                    </thead>
                    <tbody>
                        {loanDist.map((l, i) => (
                            <tr key={i}>
                                <td>{l.category || l.loanCategory || '—'}</td>
                                <td>{l.amount?.toLocaleString() || '—'}</td>
                                <td>{l.percentageOfPortfolio ? `${l.percentageOfPortfolio}%` : '—'}</td>
                                <td style={{ color: parseFloat(l.nplRate) > 10 ? '#c0392b' : '#1a1a1a' }}>
                                    {l.nplRate ? `${l.nplRate}%` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
        )}
    </div>
);

const Stage6Panel = ({ products }) => (
    <div>
        <SectionTitle title="Proposed Products & Services" />
        {products ? (
            <Row>
                <Field label="Loan Products" value={products.loanProducts} span={6} />
                <Field label="Deposit Products" value={products.depositProducts} span={6} />
                <Field label="Interest Rate Range" value={products.interestRateRange} />
                <Field label="Minimum Loan Size (USD)" value={products.minimumLoanSize} />
                <Field label="Maximum Loan Size (USD)" value={products.maximumLoanSize} />
                <Field label="Loan Tenor (months)" value={products.loanTenor} />
                <Field label="Target Market" value={products.targetMarket} span={8} />
                <Field label="Collateral Requirements" value={products.collateralRequirements} span={8} />
                <Field label="Geographic Coverage" value={products.geographicCoverage} span={8} />
            </Row>
        ) : (
            <div className="text-muted small py-2">No products & services data submitted.</div>
        )}
    </div>
);

const Stage7Panel = ({ projections, assumptions }) => (
    <div>
        {projections?.length > 0 ? (
            <>
                <SectionTitle title="Financial Projections" />
                <Table bordered hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                    <thead style={{ background: '#f4f7f6' }}>
                        <tr>
                            <th>Year</th>
                            <th>Projected Revenue (USD)</th>
                            <th>Projected Expenses</th>
                            <th>Net Profit</th>
                            <th>Loan Portfolio</th>
                            <th>No. of Clients</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projections.map((p, i) => (
                            <tr key={i}>
                                <td className="fw-semibold">Year {p.year || i + 1}</td>
                                <td>{p.projectedRevenue?.toLocaleString() || '—'}</td>
                                <td>{p.projectedExpenses?.toLocaleString() || '—'}</td>
                                <td style={{ color: p.netProfit < 0 ? '#c0392b' : '#1a5c2e', fontWeight: 600 }}>
                                    {p.netProfit?.toLocaleString() || '—'}
                                </td>
                                <td>{p.loanPortfolio?.toLocaleString() || '—'}</td>
                                <td>{p.numberOfClients?.toLocaleString() || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
        ) : (
            <div className="text-muted small py-2">No financial projections submitted.</div>
        )}

        {assumptions?.length > 0 && (
            <>
                <SectionTitle title="Projection Assumptions" />
                <Table bordered hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                    <thead style={{ background: '#f4f7f6' }}>
                        <tr><th>Assumption</th><th>Value / Description</th></tr>
                    </thead>
                    <tbody>
                        {assumptions.map((a, i) => (
                            <tr key={i}>
                                <td className="fw-semibold">{a.assumptionName || a.parameter || `Assumption ${i + 1}`}</td>
                                <td>{a.value || a.description || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </>
        )}
    </div>
);

const Stage8Panel = ({ growth }) => (
    <div>
        <SectionTitle title="Branch & Expansion Plans" />
        {growth ? (
            <Row>
                <Field label="Current Number of Branches" value={growth.currentBranches} />
                <Field label="Planned Branches (Year 1)" value={growth.plannedBranchesY1} />
                <Field label="Planned Branches (Year 3)" value={growth.plannedBranchesY3} />
                <Field label="Planned Branches (Year 5)" value={growth.plannedBranchesY5} />
                <Field label="Current Staff Count" value={growth.currentStaff} />
                <Field label="Projected Staff (Year 1)" value={growth.projectedStaffY1} />
                <Field label="Technology Platform" value={growth.technologyPlatform} />
                <Field label="Core Banking System" value={growth.coreBankingSystem} />
                <Field label="Expansion Strategy" value={growth.expansionStrategy} span={12} />
                <Field label="Staff Training Plan" value={growth.staffTrainingPlan} span={12} />
            </Row>
        ) : (
            <div className="text-muted small py-2">No growth & development data submitted.</div>
        )}
    </div>
);

/** Color mapping for the verificationStatus pill in the doc table. */
const VERIFICATION_BADGE = {
    VERIFIED:           { bg: 'success',   label: 'Verified' },
    EXAMINER_VERIFIED:  { bg: 'success',   label: 'Examiner cleared' },
    MANUAL_REVIEW:      { bg: 'warning',   label: 'Manual review' },
    PENDING:            { bg: 'info',      label: 'Processing' },
    FAILED:             { bg: 'danger',    label: 'Verification failed' },
    REJECTED:           { bg: 'danger',    label: 'Rejected' },
    UNVERIFIED:         { bg: 'secondary', label: 'Unverified (legacy)' },
};

const Stage9Panel = ({ documents, extractionStatus, onDocumentUpdated }) => {
    const [selectedId, setSelectedId] = useState(null);
    const selected = documents?.find((d) => d.id === selectedId) || null;

    return (
        <div>
            <SectionTitle title="Supporting Documents" />
            {documents?.length > 0 ? (
                <Row className="g-3">
                    {/* Left: doc list */}
                    <Col lg={6}>
                        <Table hover responsive size="sm" style={{ fontSize: '0.82rem' }}>
                            <thead style={{ background: '#f4f7f6' }}>
                                <tr className="small text-uppercase text-muted">
                                    <th className="ps-3">Document</th>
                                    <th>Verification</th>
                                    <th>Uploaded</th>
                                    <th>v</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.map((doc) => {
                                    const status = doc.verificationStatus
                                        || (extractionStatus && Object.keys(extractionStatus).some(k => k.toLowerCase().includes((doc.documentType || '').toLowerCase())) ? 'PENDING' : 'UNVERIFIED');
                                    const cfg = VERIFICATION_BADGE[status]
                                        || { bg: 'secondary', label: status };
                                    const isSelected = doc.id === selectedId;
                                    return (
                                        <tr
                                            key={doc.id}
                                            onClick={() => setSelectedId(doc.id)}
                                            style={{
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(0, 51, 102, 0.06)' : undefined,
                                            }}
                                        >
                                            <td className="ps-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div style={{ minWidth: 0 }}>
                                                        <div className="fw-semibold text-truncate" style={{ fontSize: '0.83rem', maxWidth: 220 }} title={doc.fileName}>{doc.fileName}</div>
                                                        <div className="text-muted text-truncate" style={{ fontSize: '0.7rem', maxWidth: 220 }}>{DOC_TYPE_LABELS[doc.documentType] || doc.documentType}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={cfg.bg} style={{ fontSize: '0.65rem' }}>{cfg.label}</Badge>
                                            </td>
                                            <td className="text-muted small">{doc.uploadTimestamp ? new Date(doc.uploadTimestamp).toLocaleDateString() : '—'}</td>
                                            <td className="text-muted small">{doc.version || 1}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </Col>
                    {/* Right: preview + verdict */}
                    <Col lg={6}>
                        <div style={{ position: 'sticky', top: 12 }}>
                            <DocumentPreviewPanel
                                document={selected}
                                onUpdated={onDocumentUpdated}
                            />
                        </div>
                    </Col>
                </Row>
            ) : (
                <div className="text-center text-muted py-4">
                    <p className="mb-0 small">No documents uploaded yet.</p>
                </div>
            )}
        </div>
    );
};

// ──────────────────────────────────────────────
//  INSTITUTION-SPECIFIC STAGE PANELS
// ──────────────────────────────────────────────

const DEPOSIT_PROTECTION_FIELDS = [
    { key: 'dipfRegistrationStatus', label: 'DIPF Registration Status' },
    { key: 'dipfRegistrationNumber', label: 'DIPF Registration Number' },
    { key: 'totalDepositLiabilitiesUsd', label: 'Total Deposit Liabilities (USD)', format: 'currency' },
    { key: 'liquidityBufferUsd', label: 'Liquidity Buffer (USD)', format: 'currency' },
    { key: 'liquidityBufferRatio', label: 'Liquidity Buffer Ratio (%)', format: 'percent' },
    { key: 'runOffProtocolDocumentRef', label: 'Run-Off Protocol Document Reference' },
    { key: 'dipfPremiumCurrent', label: 'DIPF Premium Current?', format: 'bool' },
    { key: 'lastPremiumPaymentDate', label: 'Last Premium Payment Date' },
    { key: 'additionalNotes', label: 'Additional Notes' },
];

const CAPITAL_ADEQUACY_FIELDS = [
    { key: 'totalIssuedAndPaidUpCapital', label: 'Total Paid-Up Capital (USD)', format: 'currency' },
    { key: 'totalShareholdersEquity', label: "Total Shareholders' Equity (USD)", format: 'currency' },
    { key: 'capitalAdequacyRatio', label: 'Capital Adequacy Ratio (CAR %)', format: 'percent' },
    { key: 'tier1Capital', label: 'Tier 1 Core Capital (USD)', format: 'currency' },
    { key: 'tier2Capital', label: 'Tier 2 Supplementary Capital (USD)', format: 'currency' },
    { key: 'riskWeightedAssets', label: 'Risk-Weighted Assets (USD)', format: 'currency' },
];

const LIQUIDITY_FIELDS = [
    { key: 'hqlaLevel1Usd', label: 'HQLA Level 1 — Cash & Central Bank (USD)', format: 'currency' },
    { key: 'hqlaLevel2aUsd', label: 'HQLA Level 2A — Gov Bonds (USD)', format: 'currency' },
    { key: 'hqlaLevel2bUsd', label: 'HQLA Level 2B — Corp Bonds (USD)', format: 'currency' },
    { key: 'totalHqla', label: 'Total HQLA (USD)', format: 'currency' },
    { key: 'totalNetCashOutflows30Days', label: 'Net Cash Outflows (30-day, USD)', format: 'currency' },
    { key: 'liquidityCoverageRatio', label: 'LCR (%)', format: 'percent' },
    { key: 'availableStableFunding', label: 'Available Stable Funding (USD)', format: 'currency' },
    { key: 'requiredStableFunding', label: 'Required Stable Funding (USD)', format: 'currency' },
    { key: 'netStableFundingRatio', label: 'NSFR (%)', format: 'percent' },
    { key: 'liquidAssets', label: 'Liquid Assets (USD)', format: 'currency' },
    { key: 'totalDeposits', label: 'Total Deposits (USD)', format: 'currency' },
    { key: 'liquidityRatio', label: 'Traditional Liquidity Ratio (%)', format: 'percent' },
    { key: 'stressTestingFrequency', label: 'Stress Testing Frequency' },
    { key: 'stressTestingAssumptions', label: 'Stress Testing Assumptions' },
    { key: 'contingencyFundingPlanRef', label: 'Contingency Funding Plan Reference' },
];

const IT_CYBER_FIELDS = [
    { key: 'hasITPolicy', label: 'IT Governance Policy in Place?', format: 'bool' },
    { key: 'hasCyberIncidentResponsePlan', label: 'Cyber Incident Response Plan?', format: 'bool' },
    { key: 'hasDisasterRecoveryPlan', label: 'Disaster Recovery Plan?', format: 'bool' },
    { key: 'drTestingFrequency', label: 'DRP Testing Frequency' },
    { key: 'hasBusinessContinuityPlan', label: 'Business Continuity Plan?', format: 'bool' },
    { key: 'coreBankingSystemVendor', label: 'Core Banking System Vendor' },
    { key: 'dataResidencyZimbabwe', label: 'Data Stored in Zimbabwe?', format: 'bool' },
    { key: 'lastPenetrationTestDate', label: 'Last Penetration Test Date' },
    { key: 'hasCyberInsurance', label: 'Cyber Insurance in Place?', format: 'bool' },
    { key: 'cyberInsuranceCoverageUsd', label: 'Cyber Insurance Coverage (USD)', format: 'currency' },
];

const RECOVERY_FIELDS = [
    { key: 'hasRecoveryPlan', label: 'Board-Approved Recovery Plan?', format: 'bool' },
    { key: 'recoveryPlanBoardApprovalDate', label: 'Recovery Plan Board Approval Date' },
    { key: 'capitalTriggers', label: 'Capital Recovery Triggers' },
    { key: 'liquidityTriggers', label: 'Liquidity Recovery Triggers' },
    { key: 'recapitalisationOptions', label: 'Recapitalisation Options' },
    { key: 'assetDisposalOptions', label: 'Asset Disposal Options' },
    { key: 'hasCrisisManagementFramework', label: 'Crisis Management Framework?', format: 'bool' },
    { key: 'communicationPlan', label: 'Communication Plan' },
    { key: 'crossBorderExposureUsd', label: 'Cross-Border Exposure (USD)', format: 'currency' },
    { key: 'systemicRiskAssessment', label: 'Systemic Risk Assessment' },
    { key: 'resolutionAuthorityNotified', label: 'RBZ Notified?', format: 'bool' },
];

const fmtVal = (val, format) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted">—</span>;
    if (format === 'bool') return val ? <Badge bg="success">Yes</Badge> : <Badge bg="danger">No</Badge>;
    if (format === 'currency') return `USD ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (format === 'percent') return `${Number(val).toFixed(2)}%`;
    return String(val);
};

const InstitutionDataPanel = ({ title, data, fields }) => (
    <div>
        <SectionTitle title={title} />
        {!data ? (
            <Alert variant="warning" className="small">No data submitted for this stage yet.</Alert>
        ) : (
            <Table responsive size="sm" bordered hover style={{ fontSize: '0.82rem' }}>
                <tbody>
                    {fields.map(({ key, label, format }) => (
                        <tr key={key}>
                            <td className="fw-semibold text-muted" style={{ width: '50%', background: '#f8f9fa' }}>{label}</td>
                            <td>{fmtVal(data[key], format)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        )}
    </div>
);

// ──────────────────────────────────────────────
//  MAIN COMPONENT
// ──────────────────────────────────────────────
const ExaminerInstitutionReview = ({ companyId, onBack, viewerRole = 'examiner' }) => {
    const isSeniorView = viewerRole === 'senior_be';
    const [company, setCompany]               = useState(null);
    const [documents, setDocuments]           = useState([]);
    const [reviews, setReviews]               = useState([]);
    const [extractionStatus, setExtStatus]    = useState({});
    const [selectedStage, setSelectedStage]   = useState(1);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState(null);
    const [saving, setSaving]                 = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showModal, setShowModal]           = useState(false);
    const [showReport, setShowReport]         = useState(false);
    const [modalAction, setModalAction]       = useState('');
    const [reviewComment, setReviewComment]   = useState('');
    const [checkedIssues, setCheckedIssues]   = useState([]);
    const [riskScore, setRiskScore]           = useState(null);
    const [riskLoading, setRiskLoading]       = useState(false);
    const [amlResult, setAmlResult]           = useState(null);
    const [amlLoading, setAmlLoading]         = useState(false);

    // Stage-specific data
    const [stageData, setStageData] = useState({
        shareholders: [], ownershipDocs: [], directors: [],
        appForm: null, capital: null, financials: [], loanDist: [],
        products: null, projections: [], assumptions: [], growth: null,
        depositProtection: null, liquidityManagement: null,
        itCyberRisk: null, recoveryResolution: null,
    });

    const examinerName = localStorage.getItem('examinerUsername') || 'Examiner';

    // ── DATA LOADING ──────────────────────────────
    const loadAll = useCallback(async () => {
        if (!companyId) return;
        setLoading(true);
        setError(null);
        try {
            const [companyRes, docsRes, reviewsRes, statusRes] = await Promise.allSettled([
                getCompanyProfile(companyId),
                getCompanyDocuments(companyId),
                getStageReviews(companyId),
                getDocumentExtractionStatus(companyId),
            ]);
            if (companyRes.status === 'fulfilled') setCompany(companyRes.value.data);
            if (docsRes.status === 'fulfilled')    setDocuments(docsRes.value.data || []);
            if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data || []);
            if (statusRes.status === 'fulfilled')  setExtStatus(statusRes.value.data || {});

            // Load all stage data in parallel
            const [ownRes, ownDocRes, dirRes, formRes, capRes, finRes, loanRes, prodRes, projRes, assRes, growRes,
                   dpRes, liqRes, itRes, rrRes] = await Promise.allSettled([
                getShareholdingStructure(companyId),
                getOwnershipUploadedDocuments(companyId),
                getDirectors(companyId),
                getApplicationFormByCompany(companyId),
                getCapitalStructure(companyId),
                getFinancialPerformance(companyId),
                getLoanDistribution(companyId),
                getProductsAndServices(companyId),
                getFinancialProjections(companyId),
                getFinancialAssumptions(companyId),
                getGrowthAndDevelopment(companyId),
                getDepositProtection(companyId),
                getLiquidityManagement(companyId),
                getITCyberRisk(companyId),
                getRecoveryResolution(companyId),
            ]);

            setStageData({
                shareholders:       ownRes.status === 'fulfilled'    ? (ownRes.value?.data?.shareholders || ownRes.value?.data || []) : [],
                ownershipDocs:      ownDocRes.status === 'fulfilled' ? (ownDocRes.value?.data || []) : [],
                directors:          dirRes.status === 'fulfilled'    ? (dirRes.value?.data || []) : [],
                appForm:            formRes.status === 'fulfilled'   ? formRes.value?.data : null,
                capital:            capRes.status === 'fulfilled'    ? capRes.value?.data : null,
                financials:         finRes.status === 'fulfilled'    ? (finRes.value?.data || []) : [],
                loanDist:           loanRes.status === 'fulfilled'   ? (loanRes.value?.data || []) : [],
                products:           prodRes.status === 'fulfilled'   ? prodRes.value?.data : null,
                projections:        projRes.status === 'fulfilled'   ? (projRes.value?.data || []) : [],
                assumptions:        assRes.status === 'fulfilled'    ? (assRes.value?.data || []) : [],
                growth:             growRes.status === 'fulfilled'   ? growRes.value?.data : null,
                depositProtection:  dpRes.status === 'fulfilled'     ? dpRes.value?.data : null,
                liquidityManagement: liqRes.status === 'fulfilled'   ? liqRes.value?.data : null,
                itCyberRisk:        itRes.status === 'fulfilled'     ? itRes.value?.data : null,
                recoveryResolution: rrRes.status === 'fulfilled'     ? rrRes.value?.data : null,
            });
        } catch (err) {
            setError('Failed to load institution data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleCalculateRisk = async () => {
        setRiskLoading(true);
        try {
            const res = await calculateAndSaveRiskScore(companyId);
            setRiskScore(res.data);
        } catch (err) {
            console.error('Risk scoring failed', err);
        } finally {
            setRiskLoading(false);
        }
    };

    const handleAmlScreen = async () => {
        setAmlLoading(true);
        try {
            const res = await screenCompanyAml(companyId);
            setAmlResult(res.data);
        } catch (err) {
            console.error('AML screening failed', err);
        } finally {
            setAmlLoading(false);
        }
    };

    // Sync comment and checked issues when stage changes
    useEffect(() => {
        const stageReview = reviews.find(r => r.stageId === selectedStage);
        setReviewComment(stageReview?.examinerComment || '');
        setCheckedIssues([]);
    }, [selectedStage, reviews]);

    // ── EXPORT FUNCTIONS ──────────────────────────

    // Generates the RBZ "Form 3: Fitness & Probity Vetting" workbook, populated from the
    // directors submitted by the applicant in Stage 3. Examiner-only — applicants never see this.
    const generateForm3Excel = () => {
        const directors = stageData.directors || [];
        if (directors.length === 0) {
            alert('No directors have been submitted for this institution yet.');
            return;
        }

        const institution = company?.companyName || 'Institution';
        const dateReceived = company?.applicationDate || new Date().toLocaleDateString('en-GB');

        const headers = [
            'Date Application Received', 'Name of Institution', 'Name of Proposed Appointee',
            'Position Being Considered for', 'Qualifications', 'Experience',
            'All Documents Submitted', 'Compliance Comment', 'Examiner Responsible'
        ];

        const submittedDocsSummary = (d) => {
            const docs = [
                ['CV', d.qualifications || d.experience],
                ['Affidavit', d.affidavitVerified],
                ['Net Worth Statement', d.netWorthStatementSubmitted === 'YES' || d.netWorthVerified],
                ['Police Clearance', d.policeClearanceSubmitted === 'YES' || d.policeClearanceVerified],
                ['Tax Clearance', d.taxClearanceVerified],
                ['Certified ID/Passport', d.certifiedIdVerified],
                ['Fit & Proper Questionnaire', d.probityFormSubmitted === 'YES'],
            ].filter(([, present]) => !!present).map(([label]) => label);
            return docs.length ? docs.join(', ') : 'None submitted';
        };

        const dataRows = directors.map((d) => [
            dateReceived,
            institution,
            d.fullName || '',
            d.designation || 'Not specified',
            d.qualifications || 'Pending CV analysis',
            d.experience || 'Pending CV analysis',
            submittedDocsSummary(d),
            d.riskFlag ? 'Risk flagged by automated CV screening - requires examiner review' : '',
            ''
        ]);

        const aoa = [
            [],
            [null, null, 'FITNESS  & PROBITY VETTING'],
            [null, null, 'Form 3'],
            ['*N.B. This Form is prepared in compliance with the requirements of the Banking Act [Chapter 24:20]/ the Building Societies Act [Chapter 24:02]/ the Microfinance Act [Chapter 24:30] as read with the Prudential Standard No.07/2017: Fitness and Probity Assessment Criteria'],
            [],
            headers,
            ...dataRows,
            [],
            ['**N.B.  EXAMINER TO COMPLETE SECTION BELOW'],
            [],
            ['Examiner to confirm that a search has been conducted for judgment debts(Indicate Yes/No) ( Where there are findings please capture under Examiner Comments below)'],
            [],
            [],
            ['The Examiner to indicate whether  proposed Appointee requires clearance by another regulatory authority (Where not applicable please indicate N/A) '],
            ['Where such clearance is required Examiner to confirm under comments below that the relevant letter has been actioned and to confirm date such correspondence was actioned'],
            [],
            ['N.B -Where clearance by the Curator is required please attach the letter to the Curator'],
            [],
            ['Examiner to comment on any irregularities noted:'],
            [],
            ["Examiner's Comments:"],
            ['Recommended/Not Recommended for Approval by the Examiner'],
            [],
            ['Name/ Signature of the Examiner', examinerName],
            ['Date :', new Date().toLocaleDateString('en-GB')],
            [],
            ['Date Submitted to Compliance :']
        ];

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        ws['!cols'] = [
            { wch: 20 }, { wch: 24 }, { wch: 26 }, { wch: 24 }, { wch: 40 }, { wch: 40 }, { wch: 28 }, { wch: 32 }, { wch: 20 }
        ];
        ws['!merges'] = [
            { s: { r: 1, c: 2 }, e: { r: 1, c: 4 } },
            { s: { r: 2, c: 2 }, e: { r: 2, c: 4 } }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, institution.substring(0, 28) || 'Form 3');
        XLSX.writeFile(wb, `Form 3 Fitness and Probity - ${institution}.xlsx`);
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const addSheet = (name, rows) => {
            const ws = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
        };

        // 1. Company Profile
        addSheet('Company Profile', [
            ['Field', 'Value'],
            ['Company Name', company?.companyName || ''],
            ['Registration Number', company?.registrationNumber || ''],
            ['License Type', company?.licenseType || ''],
            ['Physical Address', company?.physicalAddress || ''],
            ['Postal Address', company?.postalAddress || ''],
            ['Contact Telephone', company?.contactTelephone || ''],
            ['Email Address', company?.emailAddress || ''],
            ['Website', company?.website || ''],
            ['CEO', company?.chiefExecutiveOfficer || ''],
            ['Bankers', company?.bankers || ''],
            ['Lawyers', company?.lawyers || ''],
            ['Incorporation Date', company?.incorporationDate || ''],
            ['Application Date', company?.applicationDate || ''],
            ['Application Fee', company?.applicationFee || ''],
            ['Application Status', company?.applicationStatus || ''],
        ]);

        // 2. Shareholders
        const shRows = [['Full Name', 'Nationality', '# Shares', 'Amount Paid (US$)', 'Ownership (%)', 'Net Worth (US$)', 'Net Worth Status']];
        stageData.shareholders.forEach(s => shRows.push([
            s.fullName || s.shareholderName || '',
            s.nationality || '',
            s.numberOfShares || '',
            s.amountPaid || '',
            s.percentageOwnership || s.ownershipPercentage || '',
            s.netWorthAmount || '',
            s.verifiedNetWorthStatus || '',
        ]));
        addSheet('Shareholders', shRows);

        // 3. Directors
        const dirRows = [['Full Name', 'Designation', 'Date of Birth', 'Nationality', 'ID Type', 'ID Number', 'ID Expiry', 'Qualifications', 'Experience', 'Other Directorships', 'Risk Flag']];
        stageData.directors.forEach(d => dirRows.push([
            d.fullName || '',
            d.designation || '',
            d.dateOfBirth || '',
            d.nationality || '',
            d.idDocumentType || '',
            d.idDocumentNumber || '',
            d.idDocumentExpiryDate || '',
            d.qualifications || '',
            d.experience || '',
            d.otherDirectorships || '',
            d.riskFlag || '',
        ]));
        addSheet('Directors', dirRows);

        // 4. Capital Structure
        const cap = stageData.capital;
        addSheet('Capital Structure', [
            ['Item', 'Value'],
            ['Authorised Shares', cap?.numberOfAuthorisedShares || ''],
            ['Issued Shares', cap?.totalIssuedShares || ''],
            ['Par Value per Share', cap?.parValuePerShare || ''],
            ['Issued Share Capital at Par', cap?.issuedShareCapitalAtParValue || ''],
            ['Share Premium', cap?.sharePremium || ''],
            ['Total Issued & Paid-Up Capital', cap?.totalIssuedAndPaidUpCapital || ''],
            ['Retained Earnings — Current Year', cap?.retainedEarningsCurrentYear || ''],
            ['Retained Earnings — Prior Years', cap?.retainedEarningsPriorYears || ''],
            ["Total Shareholders' Equity", cap?.totalShareholdersEquity || ''],
        ]);

        // 5. Financial Performance
        const finRows = [['Year', 'Total Income', 'Total Expenses', 'Profit After Tax', 'Total Assets', 'Total Equity']];
        stageData.financials.forEach(f => finRows.push([
            f.financialYear || '', f.totalIncome || '', f.totalExpenses || '',
            f.profitAfterTax || '', f.totalAssets || '', f.totalEquity || '',
        ]));
        addSheet('Financial Performance', finRows);

        // 6. Loan Distribution
        const loanRows = [['Loan Type', 'Amount (US$)', 'Number of Clients', 'Portfolio %']];
        stageData.loanDist.forEach(l => loanRows.push([
            l.loanType || '', l.totalAmount || '', l.numberOfClients || '', l.portfolioPercentage || '',
        ]));
        addSheet('Loan Distribution', loanRows);

        // 7. Products & Services
        const prod = stageData.products;
        addSheet('Products & Services', [
            ['Field', 'Value'],
            ['Products Description', prod?.productsAndServicesDescription || ''],
            ['Target Market', prod?.targetMarketDescription || ''],
            ['Pricing Model', prod?.pricingModel || ''],
            ['Delivery Channels', prod?.deliveryChannels || ''],
        ]);

        // 8. Financial Projections
        const projRows = [['Year', 'Total Income', 'Total Expenses', 'Tax', 'Net Income', 'Total Assets', 'Total Loans', 'Total Equity', 'Cost/Income %', 'ROA %', 'ROE %']];
        stageData.projections.forEach(p => projRows.push([
            p.year || '', p.totalIncome || '', p.totalExpenses || '', p.tax || '',
            p.netIncome || '', p.totalAssets || '', p.totalLoans || '', p.totalEquity || '',
            p.costIncomeRatio || '', p.returnOnAssets || '', p.returnOnEquity || '',
        ]));
        addSheet('Financial Projections', projRows);

        // 9. Economic Assumptions
        const assRows = [['Year', 'Inflation Rate (%)', 'GDP Growth (%)', 'Lending Rate (%)']];
        stageData.assumptions.forEach(a => assRows.push([
            a.projectionYear || '', a.inflationRate || '', a.gdpGrowthRate || '', a.lendingRate || '',
        ]));
        addSheet('Assumptions', assRows);

        // 10. Growth & Development
        const g = stageData.growth;
        addSheet('Growth & Development', [
            ['Field', 'Value'],
            ['Growth Strategies', g?.growthStrategies || ''],
            ['Business Expansion Plans', g?.businessExpansionPlans || ''],
            ['Performance Enhancement', g?.performanceEnhancementStrategies || ''],
            ['Economic Benefits', g?.economicBenefits || ''],
            ['Community Benefits', g?.communityBenefits || ''],
            ['Developmental Value Summary', g?.developmentalValueSummary || ''],
        ]);

        // 11. Application Form
        const af = stageData.appForm;
        addSheet('Application Form', [
            ['Field', 'Value'],
            ['Applicant Name', af?.applicantName || ''],
            ['Application Date', af?.applicationDate || ''],
            ['License Category', af?.licenseCategory || ''],
            ['Proposed Start Date', af?.proposedStartDate || ''],
            ['Registered Office', af?.registeredOffice || ''],
            ['Contact Person', af?.contactPerson || ''],
            ['Contact Email', af?.contactEmail || ''],
            ['Contact Phone', af?.contactPhone || ''],
            ['Business Description', af?.businessDescription || ''],
            ['Regulatory Declarations', af?.regulatoryDeclarations || ''],
        ]);

        const safeName = (company?.companyName || 'Company').replace(/[^a-zA-Z0-9 ]/g, '').trim();
        XLSX.writeFile(wb, `${safeName}_Application_Data.xlsx`);
    };

    const downloadDocumentsZip = async () => {
        const token = localStorage.getItem('jwtToken');
        const res = await fetch(`/api/documents/export-zip/${companyId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) { setError('No documents found or the export failed. Please try again.'); return; }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(company?.companyName || 'Company').replace(/[^a-zA-Z0-9 ]/g, '').trim()}_Documents.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        window.URL.revokeObjectURL(url);
    };

    // ── REVIEW ACTIONS ────────────────────────────
    const handleSaveReview = async (status) => {
        setSaving(true);
        setSuccessMessage('');
        const stages = getReviewStages(company);
        const fullComment = [
            checkedIssues.length > 0 ? 'Issues identified:\n' + checkedIssues.map(i => `• ${i}`).join('\n') : '',
            reviewComment,
        ].filter(Boolean).join('\n\n');

        try {
            await saveStageReview({
                companyId: parseInt(companyId),
                stageId: selectedStage,
                stageName: stages.find(s => s.id === selectedStage)?.name,
                status,
                examinerComment: fullComment || reviewComment,
                examinerName,
            });
            const res = await getStageReviews(companyId);
            setReviews(res.data || []);
            setSuccessMessage(`Stage ${status === 'APPROVED' ? 'approved' : 'flagged'} successfully.`);
            setShowModal(false);
            if (status === 'APPROVED' && selectedStage < stages.length) {
                setTimeout(() => { setSelectedStage(s => s + 1); setSuccessMessage(''); }, 1200);
            }
        } catch (err) {
            setError(friendlyError(err, 'Failed to save the review. Please try again.'));
        } finally {
            setSaving(false);
        }
    };

    // ── HELPERS ───────────────────────────────────
    const getStageReview = (id)   => reviews.find(r => r.stageId === id);
    const getStageStatus = (id)   => getStageReview(id)?.status || 'PENDING';

    const statusBadge = (status) => {
        if (status === 'APPROVED') return <Badge bg="success"  className="px-3 py-2" style={{ fontSize: '0.75rem' }}>Approved</Badge>;
        if (status === 'FLAGGED')  return <Badge bg="danger"   className="px-3 py-2" style={{ fontSize: '0.75rem' }}>Flagged</Badge>;
        return                            <Badge bg="secondary" className="px-3 py-2" style={{ fontSize: '0.75rem', opacity: 0.75 }}>Pending</Badge>;
    };

    const reviewStages  = getReviewStages(company);
    const institutionType = resolveInstitutionType(company);
    const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
    const flaggedCount  = reviews.filter(r => r.status === 'FLAGGED').length;
    const progress      = Math.round((approvedCount / reviewStages.length) * 100);
    const allStagesApproved = approvedCount >= reviewStages.length && flaggedCount === 0;

    const getCommonIssues = (stageId) => {
        if (institutionType === 'COMMERCIAL_BANK' && stageId >= 10) return STAGE_ISSUES_BANK[stageId] || [];
        return STAGE_ISSUES[stageId] || [];
    };

    const renderStageContent = () => {
        const { shareholders, ownershipDocs, directors, appForm, capital, financials, loanDist,
                products, projections, assumptions, growth,
                depositProtection, liquidityManagement, itCyberRisk, recoveryResolution } = stageData;
        switch (selectedStage) {
            case 1: return <Stage1Panel company={company} />;
            case 2: return <Stage2Panel shareholders={shareholders} ownershipDocs={ownershipDocs} />;
            case 3: return <Stage3Panel directors={directors} onGenerateForm3={generateForm3Excel} />;
            case 4: return <Stage4Panel appForm={appForm} />;
            case 5: return <Stage5Panel capital={capital} financials={financials} loanDist={loanDist} />;
            case 6: return <Stage6Panel products={products} />;
            case 7: return <Stage7Panel projections={projections} assumptions={assumptions} />;
            case 8: return <Stage8Panel growth={growth} />;
            case 9: return <Stage9Panel
                documents={documents}
                extractionStatus={extractionStatus}
                onDocumentUpdated={(updated) => setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))}
            />;
            // DTMFI stage 10
            case 10: return institutionType === 'DTMFI'
                ? <InstitutionDataPanel title="Deposit Protection (DIPF)" data={depositProtection} fields={DEPOSIT_PROTECTION_FIELDS} />
                : <InstitutionDataPanel title="Capital Adequacy (Basel III)" data={capital} fields={CAPITAL_ADEQUACY_FIELDS} />;
            // Bank stages 11-13
            case 11: return <InstitutionDataPanel title="Liquidity Management (Basel III)" data={liquidityManagement} fields={LIQUIDITY_FIELDS} />;
            case 12: return <InstitutionDataPanel title="IT & Cyber Risk" data={itCyberRisk} fields={IT_CYBER_FIELDS} />;
            case 13: return <InstitutionDataPanel title="Recovery & Resolution Plan" data={recoveryResolution} fields={RECOVERY_FIELDS} />;
            default: return null;
        }
    };

    // ── LOADING ───────────────────────────────────
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f4f7f6' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted fw-semibold">Loading application data...</p>
                </div>
            </div>
        );
    }

    const currentStage  = reviewStages.find(s => s.id === selectedStage) || reviewStages[0];
    const currentReview = getStageReview(selectedStage);
    const stageStatus   = getStageStatus(selectedStage);
    const commonIssues  = getCommonIssues(selectedStage);

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh', paddingBottom: '60px' }}>

            {/* ── TOP BAR ── */}
            <div className="py-3 text-white shadow-sm" style={{ background: 'var(--rbz-navy)', borderBottom: '4px solid var(--rbz-gold)' }}>
                <Container fluid>
                    <div className="d-flex justify-content-between align-items-center px-4">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '50px', background: 'white', padding: '5px', borderRadius: '5px' }} />
                            <div>
                                <h4 className="fw-bold mb-0">{company?.companyName || 'Institution Review'}</h4>
                                <p className="mb-0 text-white-50 small">
                                {isSeniorView ? 'Senior Bank Examiner — Regulatory Dossier' : 'Bank Examiner — Application Review'} · {institutionType === 'COMMERCIAL_BANK' ? 'Commercial Bank' : institutionType === 'DTMFI' ? 'DTMFI' : 'MFI'}
                            </p>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end me-2">
                                <small className="text-white-50 d-block">Application Status</small>
                                <Badge bg="info" className="px-3 py-2">{company?.applicationStatus || 'ASSIGNED'}</Badge>
                            </div>
                            <Button variant="warning" size="sm" className="rounded-pill px-4 fw-bold"
                                onClick={() => setShowReport(true)}>
                                {isSeniorView ? 'Decision Record' : 'Report Preview'}
                            </Button>
                            <Button variant="outline-light" size="sm" className="rounded-pill px-4 fw-bold" onClick={onBack}>
                                ← Dashboard
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container fluid className="px-4 pt-4 animate-fade-in">
                {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="border-0 shadow-sm">{error}</Alert>}
                {successMessage && (
                    <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="border-0 shadow-sm">
                        {successMessage}
                    </Alert>
                )}

                {/* ── SUMMARY BAR ── */}
                <Card className="border-0 shadow-sm mb-4 overflow-hidden" style={{ borderRadius: '12px' }}>
                    <div className="p-3" style={{ background: 'linear-gradient(135deg, #003366 0%, #00294d 100%)', color: 'white' }}>
                        <Row className="align-items-center g-3">
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Registration No.</small>
                                <strong>{company?.registrationNumber || '—'}</strong>
                            </Col>
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>License Type</small>
                                <strong>{company?.licenseType || '—'}</strong>
                            </Col>
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Assigned Examiner</small>
                                <strong>{company?.assignedExaminer || examinerName}</strong>
                            </Col>
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Documents</small>
                                <strong>{documents.length} uploaded</strong>
                            </Col>
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Flagged Stages</small>
                                <strong style={{ color: flaggedCount > 0 ? '#f1c40f' : '#aaffaa' }}>
                                    {flaggedCount}
                                </strong>
                            </Col>
                            <Col md={1}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Risk Score</small>
                                {riskScore ? (
                                    <strong style={{ color: riskScore.score >= 80 ? '#aaffaa' : riskScore.score >= 60 ? '#f1c40f' : '#ff8888' }}>
                                        {riskScore.score}/100 <span style={{ fontSize: '0.7rem' }}>{riskScore.category}</span>
                                    </strong>
                                ) : (
                                    <button
                                        onClick={handleCalculateRisk}
                                        disabled={riskLoading}
                                        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '4px', fontSize: '0.7rem', padding: '2px 8px', cursor: 'pointer' }}
                                    >
                                        {riskLoading ? '...' : 'Score'}
                                    </button>
                                )}
                            </Col>
                            <Col md={1}>
                                <small className="text-white-50 text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                                    Progress — {approvedCount}/{reviewStages.length}
                                </small>
                                <ProgressBar
                                    now={progress}
                                    variant={progress === 100 ? 'success' : 'warning'}
                                    style={{ height: '8px', borderRadius: '4px' }}
                                />
                            </Col>
                        </Row>
                    </div>
                </Card>

                {/* ── EXPORT PACKAGE BANNER ── */}
                <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px', background: '#f0f7f0', borderLeft: '4px solid #1a6b2e' }}>
                    <Card.Body className="py-3 px-4">
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                            <div>
                                <div className="fw-bold" style={{ color: '#1a3a1a', fontSize: '0.95rem' }}>
                                    Export Application Package
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                                    Download all data and documents to work on your report outside the system
                                </div>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                                <Button
                                    size="sm"
                                    onClick={exportToExcel}
                                    style={{ background: '#217346', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '18px' }}
                                >
                                    Export All Data (Excel)
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={downloadDocumentsZip}
                                    style={{ background: '#1a3a7a', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '18px' }}
                                >
                                    Download All Documents (ZIP)
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={generateForm3Excel}
                                    style={{ background: '#003366', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '18px' }}
                                >
                                    Generate Form 3 (Fitness &amp; Probity)
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleCalculateRisk}
                                    disabled={riskLoading}
                                    style={{ background: '#7a3a00', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '18px' }}
                                >
                                    {riskLoading ? <Spinner size="sm" animation="border" /> : 'Calculate Risk Score'}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleAmlScreen}
                                    disabled={amlLoading}
                                    style={{ background: '#6b1a1a', border: 'none', color: '#fff', fontWeight: 600, borderRadius: '6px', paddingInline: '18px' }}
                                >
                                    {amlLoading ? <Spinner size="sm" animation="border" /> : 'Run AML Screen'}
                                </Button>
                            </div>
                        </div>
                    </Card.Body>
                </Card>

                {/* ── SUBMIT TO SENIOR BE ── */}
                {!isSeniorView && allStagesApproved && (
                    <Alert variant="success" className="border-0 shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3" style={{ borderLeft: '5px solid #1a6b2e', borderRadius: '12px' }}>
                        <div>
                            <div className="fw-bold">All {reviewStages.length} stages approved — ready to escalate</div>
                            <div className="small text-muted">Generate and submit the evaluation report to the Senior Bank Examiner for recommendation.</div>
                        </div>
                        <Button
                            variant="success"
                            className="fw-bold rounded-pill px-4"
                            onClick={() => setShowReport(true)}
                        >
                            Submit Review to Senior Examiner
                        </Button>
                    </Alert>
                )}

                {/* ── RISK SCORE DETAILS ── */}
                {riskScore && (
                    <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '10px', borderLeft: `4px solid ${riskScore.score >= 80 ? '#1a6b2e' : riskScore.score >= 60 ? '#b8860b' : '#8b1a1a'}` }}>
                        <Card.Body className="py-2 px-4">
                            <div className="d-flex align-items-center gap-4 flex-wrap">
                                <div>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888' }}>Risk Score</span>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: riskScore.score >= 80 ? '#1a6b2e' : riskScore.score >= 60 ? '#b8860b' : '#8b1a1a', lineHeight: 1 }}>
                                        {riskScore.score}<span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/100</span>
                                    </div>
                                    <Badge bg={riskScore.score >= 80 ? 'success' : riskScore.score >= 60 ? 'warning' : 'danger'} style={{ fontSize: '0.7rem' }}>
                                        {riskScore.category} RISK
                                    </Badge>
                                </div>
                                {riskScore.breakdown && Object.entries(riskScore.breakdown).map(([key, val]) => (
                                    <div key={key} style={{ minWidth: '100px' }}>
                                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#888', letterSpacing: '0.4px' }}>{key}</span>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{val.score}/{val.max}</div>
                                        {val.note && <div style={{ fontSize: '0.65rem', color: '#666' }}>{val.note}</div>}
                                    </div>
                                ))}
                                <div style={{ flex: 1, fontSize: '0.78rem', color: '#444', fontStyle: 'italic' }}>
                                    {riskScore.recommendation}
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                )}

                {/* ── AML SCREENING RESULTS ── */}
                {amlResult && (
                    <Card className="border-0 shadow-sm mb-3" style={{ borderRadius: '10px', borderLeft: `4px solid ${amlResult.clearStatus === 'CLEAR' ? '#1a6b2e' : '#8b1a1a'}` }}>
                        <Card.Body className="py-2 px-4">
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888' }}>AML Screen</span>
                                    <div>
                                        <Badge bg={amlResult.clearStatus === 'CLEAR' ? 'success' : 'danger'} style={{ fontSize: '0.78rem' }}>
                                            {amlResult.clearStatus === 'CLEAR' ? 'CLEAR' : `FLAGGED — ${amlResult.hitsFound} HIT${amlResult.hitsFound !== 1 ? 'S' : ''}`}
                                        </Badge>
                                    </div>
                                </div>
                                {amlResult.hits && amlResult.hits.map((hit, i) => (
                                    <div key={i} style={{ background: '#fff5f5', borderRadius: '6px', padding: '6px 12px', border: '1px solid #fcc', fontSize: '0.78rem' }}>
                                        <strong>{hit.type}: {hit.name}</strong>
                                        {hit.matches && hit.matches.map((m, j) => (
                                            <div key={j} style={{ color: '#8b1a1a' }}>
                                                → {m.sanctionedName} ({m.listSource}, {m.confidence}% match)
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {amlResult.clearStatus === 'CLEAR' && (
                                    <span style={{ fontSize: '0.78rem', color: '#1a6b2e' }}>
                                        All directors and shareholders screened against sanctions lists — no matches found. Screened: {amlResult.screenedAt}
                                    </span>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                )}

                <Row className="g-4">
                    {/* ── LEFT: STAGE NAV ── */}
                    <Col md={3}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', position: 'sticky', top: '20px' }}>
                            <Card.Header className="bg-white border-0 py-3 px-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>Application Stages</h6>
                            </Card.Header>
                            <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                                {reviewStages.map(stage => {
                                    const status   = getStageStatus(stage.id);
                                    const isActive = selectedStage === stage.id;
                                    return (
                                        <div
                                            key={stage.id}
                                            onClick={() => setSelectedStage(stage.id)}
                                            style={{
                                                padding: '13px 18px', cursor: 'pointer',
                                                borderLeft: isActive ? '4px solid var(--rbz-gold)' : '4px solid transparent',
                                                backgroundColor: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                borderBottom: '1px solid #f5f5f5',
                                            }}
                                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
                                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div>
                                                        <div className="fw-semibold" style={{ fontSize: '0.83rem', color: isActive ? 'var(--rbz-navy)' : '#444' }}>
                                                            {stage.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: '#bbb' }}>Stage {stage.id}</div>
                                                    </div>
                                                </div>
                                                {status === 'APPROVED' && <span style={{ color: '#1a5c2e', fontSize: '0.62rem', fontWeight: 800 }}>APPROVED</span>}
                                                {status === 'FLAGGED'  && <span style={{ color: '#8b1a1a', fontSize: '0.62rem', fontWeight: 800 }}>FLAGGED</span>}
                                                {status === 'PENDING'  && <span style={{ color: '#777', fontSize: '0.62rem', fontWeight: 800 }}>PENDING</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </Col>

                    {/* ── RIGHT: STAGE DETAIL ── */}
                    <Col md={9}>
                        {/* Stage header */}
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div className="d-flex align-items-center gap-3">
                                        <div>
                                            <h4 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                                Stage {currentStage.id}: {currentStage.name}
                                            </h4>
                                            <p className="text-muted mb-0 small">{currentStage.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        {statusBadge(stageStatus)}
                                        {currentReview?.lastUpdated && (
                                            <div className="small text-muted mt-1">
                                                Last reviewed: {new Date(currentReview.lastUpdated).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Data panel + Decision panel */}
                        <Row className="g-4">
                            {/* Applicant-submitted data */}
                            <Col md={7}>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                            Submitted Application Data
                                        </h6>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        {renderStageContent()}
                                    </Card.Body>
                                </Card>
                            </Col>

                            {/* Examiner decision panel / senior findings record */}
                            {isSeniorView ? (
                            <Col md={5}>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '8px', borderTop: '4px solid var(--rbz-gold)', position: 'sticky', top: '20px' }}>
                                    <Card.Header className="bg-white py-3 px-4" style={{ borderBottom: '1px solid #d4cdbd' }}>
                                        <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>Examiner Findings</h6>
                                        <small className="text-muted">Recorded assessment for Stage {selectedStage}</small>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        <div className="mb-4">
                                            <div className="small text-uppercase fw-bold text-muted mb-2" style={{ letterSpacing: '0.7px' }}>Stage disposition</div>
                                            {statusBadge(stageStatus)}
                                        </div>
                                        {currentReview ? (
                                            <div>
                                                <div className="small text-uppercase fw-bold text-muted mb-2" style={{ letterSpacing: '0.7px' }}>Recorded observations</div>
                                                <div className="p-3 mb-3" style={{ background: '#f7f3e9', border: '1px solid #d4cdbd', borderLeft: '3px solid var(--rbz-gold)', fontSize: '0.82rem', whiteSpace: 'pre-wrap' }}>
                                                    {currentReview.examinerComment || 'No additional examiner observations were recorded.'}
                                                </div>
                                                <dl className="mb-0" style={{ fontSize: '0.76rem' }}>
                                                    <div className="d-flex justify-content-between py-2 border-bottom"><dt className="text-muted fw-semibold">Examiner</dt><dd className="mb-0 fw-semibold">{currentReview.examinerName || company?.assignedExaminer || '—'}</dd></div>
                                                    <div className="d-flex justify-content-between py-2 border-bottom"><dt className="text-muted fw-semibold">Decision</dt><dd className="mb-0 fw-semibold">{currentReview.status || 'PENDING'}</dd></div>
                                                    <div className="d-flex justify-content-between py-2"><dt className="text-muted fw-semibold">Recorded</dt><dd className="mb-0">{currentReview.lastUpdated ? new Date(currentReview.lastUpdated).toLocaleString() : '—'}</dd></div>
                                                </dl>
                                            </div>
                                        ) : (
                                            <div className="p-3" style={{ background: '#f7f3e9', border: '1px solid #d4cdbd', color: '#65716f', fontSize: '0.78rem' }}>
                                                No examiner finding has been recorded for this stage. The submitted institutional data remains available for senior review.
                                            </div>
                                        )}
                                        <div className="mt-4 pt-3 border-top small text-muted">
                                            Senior review is read-only at stage level. Formal recommendations and approvals are completed from the decision report.
                                        </div>
                                    </Card.Body>
                                </Card>

                                <Card className="border-0 shadow-sm mt-3" style={{ borderRadius: '8px' }}>
                                    <Card.Body className="p-3 d-flex justify-content-between">
                                        <Button variant="outline-secondary" size="sm" disabled={selectedStage <= 1} onClick={() => setSelectedStage(s => s - 1)}>← Previous</Button>
                                        <span className="small text-muted align-self-center">{selectedStage} / {reviewStages.length}</span>
                                        <Button variant="outline-primary" size="sm" disabled={selectedStage >= reviewStages.length} onClick={() => setSelectedStage(s => s + 1)}>Next →</Button>
                                    </Card.Body>
                                </Card>
                                <div className="mt-3"><ActivityTimeline companyId={companyId} maxEvents={6} compact /></div>
                            </Col>
                            ) : (
                            <Col md={5}>
                                <Card
                                    className="border-0 shadow-sm"
                                    style={{
                                        borderRadius: '12px',
                                        borderTop: `4px solid ${stageStatus === 'APPROVED' ? '#28a745' : stageStatus === 'FLAGGED' ? '#dc3545' : 'var(--rbz-gold)'}`,
                                        position: 'sticky',
                                        top: '20px',
                                    }}
                                >
                                    <Card.Header className="bg-white border-0 py-3 px-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>Examiner Decision</h6>
                                        <small className="text-muted">Stage {selectedStage}: {currentStage.name}</small>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        {/* Approve / Flag buttons */}
                                        <div className="d-grid gap-2 mb-4">
                                            <Button
                                                variant={stageStatus === 'APPROVED' ? 'success' : 'outline-success'}
                                                className="fw-bold py-2"
                                                onClick={() => { setModalAction('APPROVED'); setShowModal(true); }}
                                                disabled={saving}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {stageStatus === 'APPROVED' ? 'Stage Approved' : 'Approve this Stage'}
                                            </Button>
                                            <Button
                                                variant={stageStatus === 'FLAGGED' ? 'danger' : 'outline-danger'}
                                                className="fw-bold py-2"
                                                onClick={() => { setModalAction('FLAGGED'); setShowModal(true); }}
                                                disabled={saving}
                                                style={{ borderRadius: '8px' }}
                                            >
                                                {stageStatus === 'FLAGGED' ? 'Stage Flagged' : 'Flag Issues'}
                                            </Button>
                                        </div>

                                        {/* Common regulatory issues checklist */}
                                        {commonIssues.length > 0 && (
                                            <div className="mb-3">
                                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#999', fontWeight: 600, marginBottom: '8px' }}>
                                                    Common Issues (select to flag)
                                                </div>
                                                {commonIssues.map((issue, i) => (
                                                    <div key={i} className="d-flex align-items-start gap-2 mb-2">
                                                        <Form.Check
                                                            type="checkbox"
                                                            id={`issue-${selectedStage}-${i}`}
                                                            checked={checkedIssues.includes(issue)}
                                                            onChange={e => {
                                                                setCheckedIssues(prev =>
                                                                    e.target.checked ? [...prev, issue] : prev.filter(x => x !== issue)
                                                                );
                                                            }}
                                                            style={{ marginTop: '2px', flexShrink: 0 }}
                                                        />
                                                        <label htmlFor={`issue-${selectedStage}-${i}`} style={{ fontSize: '0.78rem', color: '#555', cursor: 'pointer', lineHeight: '1.3' }}>
                                                            {issue}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Additional comments */}
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small text-uppercase" style={{ color: '#777', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                                                Additional Comments
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Enter additional observations or instructions for the applicant..."
                                                value={reviewComment}
                                                onChange={e => setReviewComment(e.target.value)}
                                                style={{ borderRadius: '8px', border: '2px solid #e9ecef', fontSize: '0.83rem', resize: 'vertical' }}
                                            />
                                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                Comments + selected issues above will be visible to the applicant.
                                            </small>
                                        </Form.Group>

                                        {/* Previous decision */}
                                        {currentReview && (
                                            <div className="p-3 rounded" style={{
                                                background: currentReview.status === 'APPROVED' ? '#e8f5e9' : currentReview.status === 'FLAGGED' ? '#ffebee' : '#f5f5f5',
                                                border: `1px solid ${currentReview.status === 'APPROVED' ? '#c8e6c9' : currentReview.status === 'FLAGGED' ? '#ffcdd2' : '#e0e0e0'}`,
                                            }}>
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <small className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#666' }}>Last Decision</small>
                                                    {statusBadge(currentReview.status)}
                                                </div>
                                                {currentReview.examinerComment && (
                                                    <p className="mb-1 small" style={{ color: '#555', whiteSpace: 'pre-wrap' }}>"{currentReview.examinerComment}"</p>
                                                )}
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                    By {currentReview.examinerName} — {currentReview.lastUpdated ? new Date(currentReview.lastUpdated).toLocaleString() : ''}
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Navigation */}
                                <Card className="border-0 shadow-sm mt-3" style={{ borderRadius: '12px' }}>
                                    <Card.Body className="p-3 d-flex justify-content-between">
                                        <Button variant="outline-secondary" size="sm" className="rounded-pill fw-semibold"
                                            disabled={selectedStage <= 1} onClick={() => setSelectedStage(s => s - 1)}>
                                            ← Previous
                                        </Button>
                                        <span className="small text-muted align-self-center">{selectedStage} / {reviewStages.length}</span>
                                        <Button variant="outline-primary" size="sm" className="rounded-pill fw-semibold"
                                            disabled={selectedStage >= reviewStages.length} onClick={() => setSelectedStage(s => s + 1)}>
                                            Next →
                                        </Button>
                                    </Card.Body>
                                </Card>

                                {/* What has happened on this application */}
                                <div className="mt-3">
                                    <ActivityTimeline companyId={companyId} maxEvents={6} compact />
                                </div>
                            </Col>
                            )}
                        </Row>
                    </Col>
                </Row>
            </Container>

            {/* ── CONFIRM MODAL ── */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ color: 'var(--rbz-navy)', fontSize: '1.1rem' }}>
                        {modalAction === 'APPROVED' ? 'Approve Stage' : 'Flag Stage for Issues'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">
                        {modalAction === 'APPROVED'
                            ? `Confirming that Stage ${selectedStage} — "${currentStage.name}" meets all regulatory requirements.`
                            : `Flagging Stage ${selectedStage} — "${currentStage.name}" for the applicant to address.`
                        }
                    </p>

                    {checkedIssues.length > 0 && (
                        <div className="mb-3 p-3 rounded" style={{ background: '#fff5f5', border: '1px solid #ffcdd2' }}>
                            <div className="fw-bold small mb-2" style={{ color: '#c0392b' }}>Selected Issues:</div>
                            {checkedIssues.map((issue, i) => (
                                <div key={i} className="small" style={{ color: '#555', marginBottom: '3px' }}>• {issue}</div>
                            ))}
                        </div>
                    )}

                    {modalAction === 'FLAGGED' && checkedIssues.length === 0 && !reviewComment && (
                        <Alert variant="warning" className="border-0 small py-2">
                            <strong>Tip:</strong> Select issues from the checklist or add comments to help the applicant understand what to fix.
                        </Alert>
                    )}

                    <Form.Group>
                        <Form.Label className="fw-bold small">Additional Comments</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Add any additional notes..."
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" className="rounded-pill" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button
                        variant={modalAction === 'APPROVED' ? 'success' : 'danger'}
                        size="sm"
                        className="rounded-pill fw-bold px-4"
                        onClick={() => handleSaveReview(modalAction)}
                        disabled={saving}
                    >
                        {saving ? <Spinner animation="border" size="sm" /> : modalAction === 'APPROVED' ? 'Confirm Approval' : 'Confirm Flag'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {showReport && (
                <ExaminerReportDraft
                    companyId={companyId}
                    onClose={() => setShowReport(false)}
                />
            )}

            {/* Direct channel to the applicant for this application */}
            <ApplicationChat
                companyId={companyId}
                currentUserRole={viewerRole}
                userName={examinerName}
            />
        </div>
    );
};

export default ExaminerInstitutionReview;
