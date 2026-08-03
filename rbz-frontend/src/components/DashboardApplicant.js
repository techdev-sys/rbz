import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';
import ApplicantRegistration from './ApplicantRegistration';
import HowToApply from './HowToApply';
import ApplicationChat from './ApplicationChat';
import AIChatbot from './AIChatbot';
import ActivityTimeline from './ActivityTimeline';
import { getCompanyProfile, getReport, getStageReviews, getCompanyDocuments } from '../services/api';
import './DashboardApplicant.css';

const STATUS_CONFIG = {
    DRAFT:          { label: 'In Progress',            color: '#003366', bg: 'rgba(0,51,102,0.07)',  border: 'rgba(0,51,102,0.25)' },
    SUBMITTED:      { label: 'Submitted for Review',   color: '#003366', bg: 'rgba(0,51,102,0.07)',  border: 'rgba(0,51,102,0.30)' },
    ASSIGNED:       { label: 'Under Examiner Review',  color: '#001f3f', bg: 'rgba(0,31,63,0.08)',   border: 'rgba(0,31,63,0.28)'  },
    UNDER_REVIEW:   { label: 'Under Examiner Review',  color: '#001f3f', bg: 'rgba(0,31,63,0.08)',   border: 'rgba(0,31,63,0.28)'  },
    NEEDS_REVISION: { label: 'Revisions Required',     color: '#7c5a00', bg: 'rgba(184,150,110,0.1)', border: '#B8966E'            },
    COMPLETED:      { label: 'Review Completed',       color: '#1a5c2e', bg: '#e8f5ec',              border: '#4caf7d'             },
    APPROVED:       { label: 'Licence Approved',       color: '#1a5c2e', bg: '#e8f5ec',              border: '#4caf7d'             },
    REJECTED:       { label: 'Application Declined',   color: '#8b1a1a', bg: '#fde8e8',              border: '#e57373'             },
};

const LICENCE_TYPE_LABELS = {
    'mfi': 'Credit-Only MFI',
    'dtmfi': 'Deposit-Taking MFI',
    'bank': 'Commercial Bank',
    'credit-only mfi': 'Credit-Only MFI',
    'deposit-taking mfi': 'Deposit-Taking MFI',
    'commercial bank': 'Commercial Bank',
};

const resolveTypeLabel = (raw) => {
    if (!raw) return null;
    return LICENCE_TYPE_LABELS[raw.toLowerCase()] || raw;
};

const WORKFLOW_STAGE_MAP = {
    COMPANY_PROFILE: { number: 1, name: 'Company Profile' },
    LEGAL_OWNERSHIP_VALIDATION: { number: 2, name: 'Ownership Structure' },
    DIRECTOR_VALIDATION: { number: 3, name: 'Directors & Governance' },
    BOARD_COMMITTEES: { number: 4, name: 'Application Form' },
    CAPITAL_VALIDATION: { number: 5, name: 'Capital Structure' },
    BUSINESS_PLAN_REVIEW: { number: 6, name: 'Products & Services' },
    FINANCIAL_PROJECTIONS: { number: 7, name: 'Financial Projections' },
    GROWTH_AND_DEVELOPMENT: { number: 8, name: 'Growth & Development' },
    DOCUMENT_INTAKE: { number: 10, name: 'Documents Upload' },
    DEPOSIT_PROTECTION: { number: 10, name: 'Deposit Protection (DIPF)' },
    CAPITAL_ADEQUACY: { number: 10, name: 'Capital Adequacy (Basel III)' },
    LIQUIDITY_MANAGEMENT: { number: 10, name: 'Liquidity Management' },
    IT_CYBER_RISK: { number: 10, name: 'IT & Cyber Risk' },
    RECOVERY_RESOLUTION: { number: 10, name: 'Recovery & Resolution' },
    FINAL_RECOMMENDATION: { number: 11, name: 'Application Review' },
};

const TYPE_CARDS = [
    {
        tag: 'CREDIT-ONLY MFI',
        title: 'Microfinance Institution',
        sub: 'Credit-only lending to individuals and small enterprises under RBZ supervision.',
        capital: 'USD 25,000 equivalent',
        stages: '10',
        color: '#2e7d32',
        value: 'Credit-Only Microfinance'
    },
    {
        tag: 'DEPOSIT-TAKING MFI',
        title: 'Deposit-Taking MFI',
        sub: 'Micro-deposits and lending with DIPF registration under RBZ direct oversight.',
        capital: 'USD 5,000,000 equivalent',
        stages: '11',
        color: '#1565c0',
        value: 'Deposit-Taking Microfinance'
    },
    {
        tag: 'COMMERCIAL BANK',
        title: 'Commercial Bank',
        sub: 'Full-service banking under the Basel III regulatory capital framework.',
        capital: 'USD 30,000,000',
        stages: '14',
        color: '#6a1b9a',
        value: 'Commercial Bank'
    },
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const buildVerifyUrl = (licenceNumber) => {
    if (!licenceNumber) return BACKEND_URL + '/api/public/verify-licence?num=';
    return `${BACKEND_URL}/api/public/verify-licence?num=${encodeURIComponent(licenceNumber)}`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

/* ── Digital Licence Card ── */
const DigitalLicenceCard = ({ institutionName, licenceNumber, licenceType, licenceGrantedDate, companyId }) => {
    const verifyUrl = buildVerifyUrl(licenceNumber);
    const typeLabel = resolveTypeLabel(licenceType) || '—';
    const refNum = `RBZ-${companyId ? String(companyId).padStart(6, '0') : '—'}`;

    return (
        <div className="dl-card">
            <div className="dl-card-header">
                <div className="dl-card-header-left">
                    <img src="/rbz-logo.png" alt="RBZ" className="dl-card-logo" />
                    <div>
                        <div className="dl-card-country">Republic of Zimbabwe</div>
                        <div className="dl-card-authority">Reserve Bank of Zimbabwe</div>
                    </div>
                </div>
                <div className="dl-valid-tag">Valid</div>
            </div>

            <div className="dl-card-divider" />

            <div className="dl-card-title">Financial Institution Licence</div>
            <div className="dl-card-inst">{institutionName || '—'}</div>

            <div className="dl-card-fields">
                <div className="dl-card-field">
                    <div className="dl-field-label">Licence Number</div>
                    <div className="dl-field-value dl-field-mono">{licenceNumber || '—'}</div>
                </div>
                <div className="dl-card-field">
                    <div className="dl-field-label">Category</div>
                    <div className="dl-field-value">{typeLabel}</div>
                </div>
                <div className="dl-card-field">
                    <div className="dl-field-label">Date Issued</div>
                    <div className="dl-field-value">{formatDate(licenceGrantedDate)}</div>
                </div>
            </div>

            <div className="dl-card-divider dl-card-divider-dim" />

            <div className="dl-qr-section">
                <div className="dl-qr-wrap">
                    <QRCodeSVG
                        value={verifyUrl}
                        size={112}
                        bgColor="#ffffff"
                        fgColor="#001f3f"
                        level="H"
                        marginSize={1}
                    />
                </div>
                <div className="dl-qr-meta">
                    <div className="dl-qr-title">Scan to verify</div>
                    <div className="dl-qr-desc">
                        Scanning retrieves live licence status from the RBZ licensing database.
                        Data is read directly from the official record at time of scan.
                    </div>
                    <div className="dl-qr-ref">{refNum}</div>
                    <div className="dl-qr-issuer">Bank Supervision Division</div>
                </div>
            </div>

            <div className="dl-card-footer">
                Issued under the Banking Act [Chapter 24:20] and the Reserve Bank of Zimbabwe Act [Chapter 22:15]
            </div>
        </div>
    );
};


const DashboardApplicant = ({ onLogout, onStartApp }) => {
    const [existingId, setExistingId] = useState(localStorage.getItem('currentCompanyId'));
    const [showRegistration, setShowRegistration] = useState(false);
    const [showHowTo, setShowHowTo] = useState(false);
    const [applicantName, setApplicantName] = useState(localStorage.getItem('applicantName') || 'Applicant');
    const [institutionName, setInstitutionName] = useState(localStorage.getItem('institutionName') || '—');
    const [applicationStatus, setApplicationStatus] = useState('DRAFT');
    const [licenceType, setLicenceType] = useState(null);
    const [licenceNumber, setLicenceNumber] = useState(null);
    const [licenceGrantedDate, setLicenceGrantedDate] = useState(null);
    const [reportData, setReportData] = useState(null);
    const [stageReviews, setStageReviews] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [rejectedDocs, setRejectedDocs] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [profileRecord, setProfileRecord] = useState(null);

    useEffect(() => {
        if (!existingId) return;
        getCompanyProfile(existingId)
            .then(res => {
                const d = res.data;
                setProfileRecord(d);
                if (d.contactPersonName) setApplicantName(d.contactPersonName);
                if (d.companyName) setInstitutionName(d.companyName);
                if (d.applicationStatus) setApplicationStatus(d.applicationStatus);
                if (d.licenseType || d.institutionType) setLicenceType(d.licenseType || d.institutionType);
                if (d.licenseNumber) setLicenceNumber(d.licenseNumber);
                if (d.licenseGrantedDate) setLicenceGrantedDate(d.licenseGrantedDate);
            })
            .catch(() => {});

        getReport(existingId).then(res => { if (res.data) setReportData(res.data); }).catch(() => {});
        getStageReviews(existingId).then(res => { if (res.data) setStageReviews(res.data); }).catch(() => {});
        getCompanyDocuments(existingId)
            .then(res => setRejectedDocs((res.data || []).filter(d => d.verificationStatus === 'REJECTED')))
            .catch(() => {});
    }, [existingId]);

    const handleContinue = () => onStartApp(existingId, 'applicant');

    const handleNewClick = () => {
        if (!selectedCategory) {
            alert("Please select a licence category to begin.");
            return;
        }
        if (existingId) {
            if (window.confirm("Starting a new application will unlink your current session from the existing application. Continue?")) {
                localStorage.removeItem('currentCompanyId');
                setExistingId(null);
                setShowRegistration(true);
            }
        } else {
            setShowRegistration(true);
        }
    };

    const handleRegistrationComplete = (newId) => {
        setExistingId(newId);
        localStorage.setItem('currentCompanyId', newId);
        if (localStorage.getItem('institutionName')) setInstitutionName(localStorage.getItem('institutionName'));
        if (localStorage.getItem('applicantName')) setApplicantName(localStorage.getItem('applicantName'));
        setShowRegistration(false);
        setShowHowTo(true);
    };

    const handleSkipOrStartHowTo = () => {
        setShowHowTo(false);
        onStartApp(existingId, 'applicant');
    };

    if (showRegistration) {
        return <ApplicantRegistration
            initialLicenseType={selectedCategory}
            onRegistered={handleRegistrationComplete}
            onCancel={() => setShowRegistration(false)}
        />;
    }

    if (showHowTo) {
        return (
            <>
                <HowToApply onSkip={handleSkipOrStartHowTo} onStart={handleSkipOrStartHowTo} />
                <ApplicationChat companyId={existingId} currentUserRole="applicant" userName={applicantName} />
            </>
        );
    }

    const statusCfg = STATUS_CONFIG[applicationStatus] || STATUS_CONFIG.DRAFT;
    const isApproved = applicationStatus === 'APPROVED';
    const isRejected = applicationStatus === 'REJECTED';
    const hasFeedback = stageReviews.length > 0 || !!(reportData && (reportData.recommendation || reportData.approvalComments));
    const isReviewState = ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'COMPLETED', 'APPROVED', 'REJECTED'].includes(applicationStatus);
    const isFirstTimeDraft = applicationStatus === 'DRAFT'
        && profileRecord
        && !profileRecord.dateOfIncorporation
        && !profileRecord.physicalAddress
        && !profileRecord.registrationNumber
        && stageReviews.length === 0
        && rejectedDocs.length === 0;
    const mappedStage = isFirstTimeDraft
        ? WORKFLOW_STAGE_MAP.COMPANY_PROFILE
        : (WORKFLOW_STAGE_MAP[profileRecord?.workflowStage] || WORKFLOW_STAGE_MAP.COMPANY_PROFILE);
    const completedStageCount = isReviewState ? 11 : Math.max(0, mappedStage.number - 1);
    const completionPercent = isReviewState ? 100 : Math.round((completedStageCount / 11) * 100);
    const primaryActionLabel = isReviewState
        ? 'View Application'
        : isFirstTimeDraft ? 'Start Application' : `Continue to Stage ${mappedStage.number}`;

    const topBar = (
        <header className="adash-topbar">
            <div className="adash-topbar-inner">
                <div className="adash-brand">
                    <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="adash-logo" />
                    <div>
                        <div className="adash-brand-name">Reserve Bank of Zimbabwe</div>
                        <div className="adash-brand-sub">Financial Institutions Licensing Portal</div>
                    </div>
                </div>
                <div className="adash-nav-right">
                    <div className="adash-greeting">
                        <span className="adash-greeting-label">Signed in as</span>
                        <span className="adash-greeting-name">{applicantName}</span>
                    </div>
                    <button className="adash-logout-btn" onClick={onLogout}>Sign Out</button>
                </div>
            </div>
        </header>
    );

    const feedbackModal = (
        <Modal show={showFeedback} onHide={() => setShowFeedback(false)} size="lg" centered>
            <Modal.Header closeButton style={{ background: '#001f3f', color: 'white', borderRadius: 0 }}>
                <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Examination Feedback</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '1.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
                {reportData && (reportData.recommendation || reportData.approvalComments) && (
                    <div className="adash-modal-section">
                        <div className="adash-modal-section-title">Overall Decision</div>
                        {reportData.recommendation && (
                            <div style={{ marginBottom: '10px' }}>
                                <span className="adash-modal-label">Recommendation: </span>
                                <span className="adash-rec-badge" style={{
                                    color: reportData.recommendation === 'APPROVE' ? '#1a5c2e' : '#8b1a1a',
                                    background: reportData.recommendation === 'APPROVE' ? '#e8f5ec' : '#fde8e8',
                                }}>
                                    {reportData.recommendation}
                                </span>
                            </div>
                        )}
                        {reportData.recommendationJustification && (
                            <div className="adash-modal-field">
                                <div className="adash-modal-label">Examiner Justification</div>
                                <div className="adash-modal-text">{reportData.recommendationJustification}</div>
                            </div>
                        )}
                        {reportData.approvalComments && (
                            <div className="adash-modal-field">
                                <div className="adash-modal-label">Decision Comments</div>
                                <div className="adash-modal-text">{reportData.approvalComments}</div>
                            </div>
                        )}
                        {reportData.recommendationConditions && (
                            <div className="adash-modal-field">
                                <div className="adash-modal-label">Conditions</div>
                                <div className="adash-modal-text">{reportData.recommendationConditions}</div>
                            </div>
                        )}
                    </div>
                )}

                {stageReviews.length > 0 && (
                    <div className="adash-modal-section">
                        <div className="adash-modal-section-title">Stage-by-Stage Review</div>
                        {stageReviews.map((review, idx) => (
                            <div key={idx} className="adash-review-row">
                                <div className="adash-review-row-top">
                                    <span className="adash-review-stage">{review.stageName || `Stage ${review.stageId}`}</span>
                                    <span className="adash-review-status" style={{
                                        color: review.status === 'APPROVED' ? '#1a5c2e' : review.status === 'FLAGGED' ? '#7c5a00' : '#555',
                                        background: review.status === 'APPROVED' ? '#e8f5ec' : review.status === 'FLAGGED' ? '#fef3cd' : '#f0f0f0',
                                    }}>
                                        {review.status || 'REVIEWED'}
                                    </span>
                                </div>
                                {review.examinerComment && (
                                    <div className="adash-review-comment">{review.examinerComment}</div>
                                )}
                                {review.examinerName && (
                                    <div className="adash-review-by">Examiner: {review.examinerName}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!reportData && stageReviews.length === 0 && (
                    <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0', fontSize: '0.88rem' }}>
                        No feedback has been recorded for this application.
                    </p>
                )}
            </Modal.Body>
            <Modal.Footer style={{ borderTop: '1px solid #e0e4e8' }}>
                <Button onClick={() => setShowFeedback(false)} style={{ background: '#001f3f', border: 'none', fontSize: '0.85rem' }}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );

    /* ── VIEW 1: NEW APPLICANT ── */
    if (!existingId) {
        return (
            <div className="adash-page">
                {topBar}
                <main className="adash-main">
                    <div className="adash-new-hero">
                        <div className="adash-new-hero-inner">
                            <div className="adash-eyebrow">New Application</div>
                            <h1 className="adash-new-title">Select a licence category to begin</h1>
                            <p className="adash-new-sub">
                                Choose the licence type that reflects the nature and scope of your institution.
                                The portal will configure the application stages, document requirements and
                                regulatory compliance checks accordingly.
                            </p>
                        </div>
                    </div>

                    <div className="adash-content">
                        <div className="adash-type-grid">
                            {TYPE_CARDS.map((t) => (
                                <div
                                    className={`adash-type-card ${selectedCategory === t.value ? 'selected' : ''}`}
                                    key={t.tag}
                                    style={{
                                        '--tc-color': t.color,
                                        cursor: 'pointer',
                                        border: selectedCategory === t.value ? `2px solid ${t.color}` : '1px solid #e0e4e8',
                                        boxShadow: selectedCategory === t.value ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                        transform: selectedCategory === t.value ? 'translateY(-2px)' : 'none',
                                        transition: 'all 0.2s ease-in-out'
                                    }}
                                    onClick={() => setSelectedCategory(t.value)}
                                >
                                    <div className="adash-tc-tag">{t.tag}</div>
                                    <div className="adash-tc-title">{t.title}</div>
                                    <div className="adash-tc-sub">{t.sub}</div>
                                    <div className="adash-tc-meta">
                                        <div className="adash-tc-meta-item">
                                            <span className="adash-tc-meta-label">Minimum Capital</span>
                                            <span className="adash-tc-meta-value" style={{ color: t.color }}>{t.capital}</span>
                                        </div>
                                        <div className="adash-tc-meta-divider" />
                                        <div className="adash-tc-meta-item">
                                            <span className="adash-tc-meta-label">Application Stages</span>
                                            <span className="adash-tc-meta-value">{t.stages}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="adash-new-cta-row">
                            <div>
                                <button className="adash-btn-primary adash-btn-lg" onClick={handleNewClick}>
                                    Begin Application
                                </button>
                                <p className="adash-cta-note">
                                    You will register your institution details before proceeding to Stage 1.
                                </p>
                            </div>
                        </div>

                        <div className="adash-requirements">
                            <div className="adash-req-header">Documents and information required</div>
                            <div className="adash-req-grid">
                                <div className="adash-req-item">
                                    <div className="adash-req-number">01</div>
                                    <div className="adash-req-title">Institutional Profile</div>
                                    <div className="adash-req-desc">Certificate of incorporation, registered address, ZIMRA tax clearance, and contact officer details.</div>
                                </div>
                                <div className="adash-req-item">
                                    <div className="adash-req-number">02</div>
                                    <div className="adash-req-title">Governance &amp; Ownership</div>
                                    <div className="adash-req-desc">Shareholding structure, director CVs, probity declarations, and board committee composition.</div>
                                </div>
                                <div className="adash-req-item">
                                    <div className="adash-req-number">03</div>
                                    <div className="adash-req-title">Financial Soundness</div>
                                    <div className="adash-req-desc">Audited financials, three-year projections, paid-up capital confirmation, and product schedule.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    /* ── VIEW 2: APPROVED / LICENSED INSTITUTION ── */
    if (isApproved) {
        const refNum = `RBZ-${existingId ? String(existingId).padStart(6, '0') : '—'}`;

        return (
            <div className="adash-page">
                {topBar}

                {/* Licensed institution header bar */}
                <div className="adash-lic-headerbar">
                    <div className="adash-lic-headerbar-inner">
                        <div className="adash-lic-hb-left">
                            <div className="adash-lic-hb-status">
                                Licence Active
                            </div>
                            <div className="adash-lic-hb-inst">{institutionName}</div>
                        </div>
                        <div className="adash-lic-hb-right">
                            <div className="adash-lic-hb-meta">
                                <span className="adash-lic-hb-label">Licence No.</span>
                                <span className="adash-lic-hb-val">{licenceNumber || '—'}</span>
                            </div>
                            <div className="adash-lic-hb-sep" />
                            <div className="adash-lic-hb-meta">
                                <span className="adash-lic-hb-label">Category</span>
                                <span className="adash-lic-hb-val">{resolveTypeLabel(licenceType) || '—'}</span>
                            </div>
                            <div className="adash-lic-hb-sep" />
                            <div className="adash-lic-hb-meta">
                                <span className="adash-lic-hb-label">Date Issued</span>
                                <span className="adash-lic-hb-val">{formatDate(licenceGrantedDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="adash-main">
                    <div className="adash-content">
                        <div className="adash-lic-layout">

                            {/* ── LEFT: Dashboard panels ── */}
                            <div className="adash-lic-left">

                                {/* Welcome panel */}
                                <div className="adash-lic-welcome">
                                    <div className="adash-lic-welcome-content">
                                        <div className="adash-eyebrow" style={{ marginBottom: '0.5rem' }}>Licensed Institution</div>
                                        <h2 className="adash-lic-welcome-title">Welcome, {applicantName}</h2>
                                        <p className="adash-lic-welcome-sub">
                                            {institutionName} is a licensed financial institution under the Reserve Bank of Zimbabwe.
                                            Your licence is in good standing. Use this portal to access your application record and examination history.
                                        </p>
                                    </div>
                                    <div className="adash-lic-welcome-check">
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Stat tiles */}
                                <div className="adash-lic-stats">
                                    <div className="adash-lic-stat">
                                        <div className="adash-lic-stat-label">Application Reference</div>
                                        <div className="adash-lic-stat-value adash-mono">{refNum}</div>
                                    </div>
                                    <div className="adash-lic-stat">
                                        <div className="adash-lic-stat-label">Licence Category</div>
                                        <div className="adash-lic-stat-value">{resolveTypeLabel(licenceType) || '—'}</div>
                                    </div>
                                    <div className="adash-lic-stat">
                                        <div className="adash-lic-stat-label">Date of Issue</div>
                                        <div className="adash-lic-stat-value">{formatDate(licenceGrantedDate)}</div>
                                    </div>
                                    <div className="adash-lic-stat">
                                        <div className="adash-lic-stat-label">Licensing Status</div>
                                        <div className="adash-lic-stat-value" style={{ color: '#1a5c2e', fontWeight: 700 }}>Active</div>
                                    </div>
                                </div>

                                {/* Regulatory information panel */}
                                <div className="adash-lic-info-panel">
                                    <div className="adash-lic-info-header">Regulatory Standing</div>
                                    <div className="adash-lic-info-body">
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Institution</span>
                                            <span className="adash-lic-info-val">{institutionName}</span>
                                        </div>
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Licence Number</span>
                                            <span className="adash-lic-info-val adash-mono">{licenceNumber || '—'}</span>
                                        </div>
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Licence Type</span>
                                            <span className="adash-lic-info-val">{resolveTypeLabel(licenceType) || '—'}</span>
                                        </div>
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Issuing Authority</span>
                                            <span className="adash-lic-info-val">Bank Supervision Division, RBZ</span>
                                        </div>
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Regulatory Framework</span>
                                            <span className="adash-lic-info-val">Banking Act [Chapter 24:20] &amp; RBZ Act [Chapter 22:15]</span>
                                        </div>
                                        <div className="adash-lic-info-row">
                                            <span className="adash-lic-info-label">Contact</span>
                                            <span className="adash-lic-info-val">
                                                <a href="mailto:licensing@rbz.zw" className="adash-link">licensing@rbz.zw</a>
                                                &nbsp;&middot;&nbsp;+263 242 703 000
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="adash-lic-actions">
                                    <button className="adash-btn-secondary" onClick={handleContinue}>
                                        View Application File
                                    </button>
                                    {hasFeedback && (
                                        <button className="adash-btn-ghost" onClick={() => setShowFeedback(true)}>
                                            View Examination Report
                                        </button>
                                    )}
                                </div>

                                <div className="adash-lic-notice">
                                    Official licence documentation and onboarding correspondence will be communicated
                                    through your registered contact details. For any enquiries, contact the Bank Supervision
                                    Division at <a href="mailto:licensing@rbz.zw" className="adash-link">licensing@rbz.zw</a>.
                                </div>
                            </div>

                            {/* ── RIGHT: Digital Licence Card ── */}
                            <div className="adash-lic-right">
                                <div className="adash-lic-card-label">Digital Licence</div>
                                <DigitalLicenceCard
                                    institutionName={institutionName}
                                    licenceNumber={licenceNumber}
                                    licenceType={licenceType}
                                    licenceGrantedDate={licenceGrantedDate}
                                    companyId={existingId}
                                />
                                <p className="adash-lic-card-note">
                                    This digital licence is issued by the Reserve Bank of Zimbabwe.
                                    Scan the QR code to verify the licence holder's details and standing.
                                </p>
                                <button className="adash-btn-primary adash-btn-full" disabled style={{ opacity: 0.45, cursor: 'not-allowed', marginTop: '0.5rem' }}>
                                    Download Licence Certificate (PDF)
                                </button>
                            </div>
                        </div>
                    </div>
                </main>

                {feedbackModal}
                {existingId && (
                    <>
                        <ApplicationChat companyId={existingId} currentUserRole="applicant" userName={applicantName} side="left" />
                        <AIChatbot
                            companyId={existingId}
                            institutionName={institutionName}
                            userName={applicantName}
                        />
                    </>
                )}
            </div>
        );
    }

    /* ── VIEW 3: ACTIVE / IN-PROGRESS APPLICATION ── */
    return (
        <div className="adash-page">
            {topBar}

            <div className="adash-case-bar">
                <div className="adash-case-bar-inner">
                    <div className="adash-case-identity">
                        <div className="adash-case-inst">{institutionName}</div>
                        <div className="adash-case-meta">
                            <span className="adash-case-ref">Ref: RBZ-{existingId ? existingId.toString().padStart(6, '0') : '—'}</span>
                            {resolveTypeLabel(licenceType) && (
                                <>
                                    <span className="adash-case-sep">·</span>
                                    <span className="adash-case-type">{resolveTypeLabel(licenceType)}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div
                        className="adash-status-badge"
                        style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                    >
                        {statusCfg.label}
                    </div>
                </div>
            </div>

            <main className="adash-main">
                <div className="adash-content">

                    {rejectedDocs.length > 0 && (
                        <div className="adash-alert adash-alert-warning">
                            <div className="adash-alert-hd">
                                <div className="adash-alert-title">
                                    Action Required — {rejectedDocs.length} document{rejectedDocs.length !== 1 ? 's' : ''} require re-submission
                                </div>
                                <button className="adash-alert-action" onClick={handleContinue}>Proceed to Upload</button>
                            </div>
                            <ul className="adash-alert-list">
                                {rejectedDocs.slice(0, 5).map((doc) => (
                                    <li key={doc.id}>
                                        <strong>{doc.documentType}</strong>
                                        {doc.fileName && <span className="adash-dimmed"> — {doc.fileName}</span>}
                                        {doc.examinerComment && (
                                            <div className="adash-alert-note">Examiner note: {doc.examinerComment}</div>
                                        )}
                                    </li>
                                ))}
                                {rejectedDocs.length > 5 && (
                                    <li className="adash-dimmed">…and {rejectedDocs.length - 5} additional document(s)</li>
                                )}
                            </ul>
                        </div>
                    )}

                    {applicationStatus === 'NEEDS_REVISION' && (
                        <div className="adash-alert adash-alert-revision">
                            <div className="adash-alert-title">Revisions Requested by Examiner</div>
                            <p className="adash-alert-body">
                                The assigned Bank Examiner has identified items requiring correction.
                                Resume your application to address the flagged areas before resubmission.
                            </p>
                        </div>
                    )}

                    {isRejected && (
                        <div className="adash-alert adash-alert-danger">
                            <div className="adash-alert-hd">
                                <div className="adash-alert-title">Application Not Approved</div>
                                {hasFeedback && (
                                    <button className="adash-alert-action adash-alert-action-danger" onClick={() => setShowFeedback(true)}>
                                        View Full Feedback
                                    </button>
                                )}
                            </div>
                            {reportData?.approvalComments && (
                                <p className="adash-alert-body"><strong>Decision basis: </strong>{reportData.approvalComments}</p>
                            )}
                            {reportData?.recommendationJustification && (
                                <p className="adash-alert-body adash-dimmed"><strong>Examiner notes: </strong>{reportData.recommendationJustification}</p>
                            )}
                            <p className="adash-alert-body adash-dimmed">
                                Please contact the Bank Supervision Division for guidance on reapplication.
                            </p>
                        </div>
                    )}

                    {hasFeedback && !isRejected && (
                        <div className="adash-alert adash-alert-info">
                            <div className="adash-alert-hd">
                                <div>
                                    <div className="adash-alert-title">Examination Feedback Available</div>
                                    <div className="adash-alert-body">{stageReviews.length} stage review{stageReviews.length !== 1 ? 's' : ''} from the assigned Bank Examiner</div>
                                </div>
                                <button className="adash-alert-action adash-alert-action-info" onClick={() => setShowFeedback(true)}>View Feedback</button>
                            </div>
                        </div>
                    )}

                    <section className="adash-brief" aria-labelledby="application-overview-title">
                        <div className="adash-brief-heading">
                            <div>
                                <div className="adash-section-kicker">Application overview</div>
                                <h1 id="application-overview-title">Institution licensing file</h1>
                                <p>Your official working record for the RBZ licensing process.</p>
                            </div>
                            <button className="adash-btn-primary" onClick={handleContinue}>{primaryActionLabel}</button>
                        </div>

                        <div className="adash-brief-metrics">
                            <div className="adash-brief-metric">
                                <span>Current stage</span>
                                <strong>{isReviewState ? 'Regulatory review' : `${mappedStage.number} of 11`}</strong>
                                <small>{isReviewState ? statusCfg.label : mappedStage.name}</small>
                            </div>
                            <div className="adash-brief-metric">
                                <span>Licence category</span>
                                <strong>{resolveTypeLabel(licenceType) || 'Not confirmed'}</strong>
                                <small>Institution classification</small>
                            </div>
                            <div className="adash-brief-metric">
                                <span>File status</span>
                                <strong>{statusCfg.label}</strong>
                                <small>{completionPercent}% of applicant stages complete</small>
                            </div>
                        </div>

                        <div className="adash-progress-block">
                            <div className="adash-progress-copy">
                                <span>Application completion</span>
                                <strong>{completionPercent}%</strong>
                            </div>
                            <div className="adash-progress-track" aria-label={`${completionPercent}% complete`}>
                                <div className="adash-progress-value" style={{ width: `${completionPercent}%` }} />
                            </div>
                            <div className="adash-stage-scale"><span>Registration</span><span>Applicant submission</span><span>RBZ decision</span></div>
                        </div>
                    </section>

                    <div className="adash-dashboard-grid">
                        <section className="adash-next-panel">
                            <div className="adash-section-kicker">Required next action</div>
                            <h2>{isReviewState ? 'Monitor the regulatory review' : isFirstTimeDraft ? 'Complete your company profile' : `Continue ${mappedStage.name}`}</h2>
                            <p>
                                {isReviewState
                                    ? 'Your submission is with the Bank. Monitor this page for examiner correspondence or requests for clarification.'
                                    : isFirstTimeDraft
                                    ? 'Confirm your institution details, registration particulars and primary contact information to establish the application record.'
                                    : 'Continue the outstanding stage and save your entries before proceeding to the next regulatory requirement.'}
                            </p>
                            <div className="adash-next-checklist">
                                <div><span>01</span><p><strong>Review the current stage</strong><small>Check all required fields before saving.</small></p></div>
                                <div><span>02</span><p><strong>Keep evidence ready</strong><small>Use official and current supporting documents.</small></p></div>
                                <div><span>03</span><p><strong>Submit only when complete</strong><small>RBZ review begins after final submission.</small></p></div>
                            </div>
                        </section>

                        <section className="adash-activity-panel">
                            <div className="adash-section-kicker">Official record</div>
                            <ActivityTimeline companyId={existingId} maxEvents={6} />
                        </section>
                    </div>

                    {(isRejected || hasFeedback) && (
                        <div className="adash-feedback-row">
                            <div><strong>Examination feedback is available</strong><span>Review the stage-by-stage report and examiner comments.</span></div>
                            <button className="adash-btn-secondary" onClick={() => setShowFeedback(true)}>View Full Report</button>
                        </div>
                    )}

                    <section className="adash-requirements">
                        <div className="adash-req-header">
                            <span>Readiness framework</span>
                            <small>Core evidence reviewed during institutional licensing</small>
                        </div>
                        <div className="adash-req-grid">
                            <div className="adash-req-item"><div className="adash-req-number">01</div><div><div className="adash-req-title">Institutional Data</div><div className="adash-req-desc">Corporate identity, registration particulars and compliance records.</div></div></div>
                            <div className="adash-req-item"><div className="adash-req-number">02</div><div><div className="adash-req-title">Governance &amp; Vetting</div><div className="adash-req-desc">Director probity, ownership structure and board composition.</div></div></div>
                            <div className="adash-req-item"><div className="adash-req-number">03</div><div><div className="adash-req-title">Financial Soundness</div><div className="adash-req-desc">Capital evidence, projections, statements and licensed products.</div></div></div>
                        </div>
                    </section>
                </div>
            </main>

            {feedbackModal}
            {existingId && (
                <>
                    <ApplicationChat companyId={existingId} currentUserRole="applicant" userName={applicantName} side="left" />
                    <AIChatbot
                        companyId={existingId}
                        currentStage={mappedStage.number}
                        stageName={mappedStage.name}
                        institutionName={institutionName}
                        userName={applicantName}
                    />
                </>
            )}
        </div>
    );
};

export default DashboardApplicant;
