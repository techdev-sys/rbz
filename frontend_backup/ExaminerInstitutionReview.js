import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Card, Row, Col, Badge, Button, Alert, Spinner,
    Form, Table, ProgressBar, Modal, OverlayTrigger, Tooltip
} from 'react-bootstrap';
import {
    getCompanyProfile, getCompanyDocuments, getStageReviews,
    saveStageReview, getDocumentExtractionStatus
} from '../services/api';
import '../Premium.css';

// ──────────────────────────────────────────────
//  STAGE DEFINITIONS (mirrors the applicant wizard)
// ──────────────────────────────────────────────
const REVIEW_STAGES = [
    { id: 1, name: 'Company Profile', icon: '🏢', description: 'Institution identity, registration, and contact information' },
    { id: 2, name: 'Ownership Structure', icon: '📊', description: 'Shareholding, UBO declarations, and ownership compliance' },
    { id: 3, name: 'Directors & Governance', icon: '👥', description: 'Director vetting, board composition, and fit-and-proper checks' },
    { id: 4, name: 'Application Form', icon: '📝', description: 'Formal application details and regulatory declarations' },
    { id: 5, name: 'Capital Structure', icon: '💰', description: 'Capital adequacy, financial health, and asset quality' },
    { id: 6, name: 'Products & Services', icon: '🏦', description: 'Proposed lending and deposit products' },
    { id: 7, name: 'Financial Projections', icon: '📈', description: '3-5 year financial forecasts and assumptions' },
    { id: 8, name: 'Growth & Development', icon: '🌱', description: 'Branch expansion, technology, and staffing plans' },
    { id: 9, name: 'Documents Upload', icon: '📁', description: 'Supporting documentation and verification status' },
];

// Map document types to stage numbers to know which docs belong where
const DOC_TYPE_STAGE_MAP = {
    financialStatements: 5,
    businessPlan: 7,
    portfolioReport: 5,
    creditPolicy: 9,
    operationalManual: 9,
    taxClearance: 9,
    insurancePolicy: 9,
    certificate_incorporation: 1,
};

const DOC_TYPE_LABELS = {
    financialStatements: 'Audited Financial Statements',
    businessPlan: 'Strategic Business Plan',
    portfolioReport: 'Loan Portfolio Report',
    creditPolicy: 'Credit & Risk Policy Manual',
    operationalManual: 'Operational Policy Manual',
    taxClearance: 'ZIMRA Tax Clearance Certificate',
    insurancePolicy: 'Credit Insurance Policy',
    certificate_incorporation: 'Certificate of Incorporation',
};

// ──────────────────────────────────────────────
//  MAIN COMPONENT
// ──────────────────────────────────────────────
const ExaminerInstitutionReview = ({ companyId, onBack }) => {
    const [company, setCompany] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [extractionStatus, setExtractionStatus] = useState({});
    const [selectedStage, setSelectedStage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Review form state
    const [reviewComment, setReviewComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveAction, setApproveAction] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const examinerName = localStorage.getItem('examinerUsername') || 'P. T. Madamombe';

    // ──────────────────────────────────────────
    //  DATA LOADING
    // ──────────────────────────────────────────
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
            if (docsRes.status === 'fulfilled') setDocuments(docsRes.value.data || []);
            if (reviewsRes.status === 'fulfilled') setReviews(reviewsRes.value.data || []);
            if (statusRes.status === 'fulfilled') setExtractionStatus(statusRes.value.data || {});
        } catch (err) {
            setError('Failed to load institution data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // Sync comment from loaded reviews when stage changes
    useEffect(() => {
        const stageReview = reviews.find(r => r.stageId === selectedStage);
        setReviewComment(stageReview?.examinerComment || '');
    }, [selectedStage, reviews]);

    // ──────────────────────────────────────────
    //  REVIEW ACTIONS
    // ──────────────────────────────────────────
    const handleSaveReview = async (status) => {
        setSaving(true);
        setSuccessMessage('');
        try {
            await saveStageReview({
                companyId: parseInt(companyId),
                stageId: selectedStage,
                stageName: REVIEW_STAGES.find(s => s.id === selectedStage)?.name,
                status,
                examinerComment: reviewComment,
                examinerName,
            });
            // Refresh reviews
            const res = await getStageReviews(companyId);
            setReviews(res.data || []);
            setSuccessMessage(`Stage ${status === 'APPROVED' ? 'approved' : 'flagged'} successfully.`);
            setShowApproveModal(false);

            // Auto-advance to next stage if approved
            if (status === 'APPROVED' && selectedStage < REVIEW_STAGES.length) {
                setTimeout(() => {
                    setSelectedStage(prev => prev + 1);
                    setSuccessMessage('');
                }, 1200);
            }
        } catch (err) {
            setError('Failed to save review decision. ' + (err.response?.data || err.message));
        } finally {
            setSaving(false);
        }
    };

    const openApproveModal = (action) => {
        setApproveAction(action);
        setShowApproveModal(true);
    };

    // ──────────────────────────────────────────
    //  HELPERS
    // ──────────────────────────────────────────
    const getStageReview = (stageId) => reviews.find(r => r.stageId === stageId);

    const getStageStatus = (stageId) => {
        const review = getStageReview(stageId);
        if (!review) return 'PENDING';
        return review.status;
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return <Badge bg="success" className="px-3 py-2" style={{ fontSize: '0.75rem' }}>✓ Approved</Badge>;
            case 'FLAGGED':
                return <Badge bg="danger" className="px-3 py-2" style={{ fontSize: '0.75rem' }}>⚠ Flagged</Badge>;
            default:
                return <Badge bg="secondary" className="px-3 py-2" style={{ fontSize: '0.75rem', opacity: 0.6 }}>● Pending</Badge>;
        }
    };

    const getStageDocuments = (stageId) => {
        if (stageId === 9) {
            // For the documents stage, show ALL uploaded docs
            return documents;
        }
        return documents.filter(doc => DOC_TYPE_STAGE_MAP[doc.documentType] === stageId);
    };

    const approvedStages = reviews.filter(r => r.status === 'APPROVED').length;
    const overallProgress = Math.round((approvedStages / REVIEW_STAGES.length) * 100);

    // ──────────────────────────────────────────
    //  RENDER
    // ──────────────────────────────────────────
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f4f7f6' }}>
                <div className="text-center">
                    <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted fw-semibold">Loading institution data...</p>
                </div>
            </div>
        );
    }

    const currentStage = REVIEW_STAGES.find(s => s.id === selectedStage);
    const currentReview = getStageReview(selectedStage);
    const stageDocs = getStageDocuments(selectedStage);

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh', paddingBottom: '60px' }}>
            {/* ────── TOP BAR ────── */}
            <div className="py-3 text-white shadow-sm" style={{ background: 'var(--rbz-navy)', borderBottom: '4px solid var(--rbz-gold)' }}>
                <Container fluid>
                    <div className="d-flex justify-content-between align-items-center px-4">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '50px', background: 'white', padding: '5px', borderRadius: '5px' }} />
                            <div>
                                <h4 className="fw-bold mb-0">
                                    {company?.companyName || 'Institution Review'}
                                </h4>
                                <p className="mb-0 text-white-50 small">
                                    Examiner Review — Microfinance Licensing Application
                                </p>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="text-end me-3">
                                <small className="text-white-50 d-block">Application Status</small>
                                <Badge bg="info" className="px-3 py-2">{company?.applicationStatus || 'ASSIGNED'}</Badge>
                            </div>
                            <Button
                                variant="outline-light"
                                size="sm"
                                className="rounded-pill px-4 fw-bold"
                                onClick={onBack}
                            >
                                ← Back to Dashboard
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container fluid className="px-4 pt-4 animate-fade-in">
                {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="border-0 shadow-sm">{error}</Alert>}
                {successMessage && (
                    <Alert variant="success" dismissible onClose={() => setSuccessMessage('')} className="border-0 shadow-sm d-flex align-items-center gap-2">
                        <span className="fs-5">✅</span> {successMessage}
                    </Alert>
                )}

                {/* ────── INSTITUTION SUMMARY BAR ────── */}
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
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Examiner</small>
                                <strong>{company?.assignedExaminer || examinerName}</strong>
                            </Col>
                            <Col md={2}>
                                <small className="text-white-50 text-uppercase d-block" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Documents</small>
                                <strong>{documents.length} uploaded</strong>
                            </Col>
                            <Col md={4}>
                                <small className="text-white-50 text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                                    Review Progress — {approvedStages}/{REVIEW_STAGES.length} stages approved
                                </small>
                                <ProgressBar
                                    now={overallProgress}
                                    variant={overallProgress === 100 ? 'success' : 'warning'}
                                    style={{ height: '8px', borderRadius: '4px' }}
                                />
                            </Col>
                        </Row>
                    </div>
                </Card>

                <Row className="g-4">
                    {/* ────── LEFT: STAGE NAVIGATION ────── */}
                    <Col md={3}>
                        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px', position: 'sticky', top: '20px' }}>
                            <Card.Header className="bg-white border-0 py-3 px-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                    Application Stages
                                </h6>
                            </Card.Header>
                            <div style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto' }}>
                                {REVIEW_STAGES.map(stage => {
                                    const status = getStageStatus(stage.id);
                                    const isActive = selectedStage === stage.id;

                                    return (
                                        <div
                                            key={stage.id}
                                            onClick={() => setSelectedStage(stage.id)}
                                            style={{
                                                padding: '14px 18px',
                                                cursor: 'pointer',
                                                borderLeft: isActive ? '4px solid var(--rbz-gold)' : '4px solid transparent',
                                                backgroundColor: isActive ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                                                transition: 'all 0.2s ease',
                                                borderBottom: '1px solid #f5f5f5',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isActive) e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                            }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ fontSize: '1.1rem' }}>{stage.icon}</span>
                                                    <div>
                                                        <div
                                                            className="fw-semibold"
                                                            style={{
                                                                fontSize: '0.85rem',
                                                                color: isActive ? 'var(--rbz-navy)' : '#444',
                                                            }}
                                                        >
                                                            {stage.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.7rem', color: '#999' }}>
                                                            Stage {stage.id}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    {status === 'APPROVED' && (
                                                        <span style={{ color: '#28a745', fontSize: '1.1rem' }}>✓</span>
                                                    )}
                                                    {status === 'FLAGGED' && (
                                                        <span style={{ color: '#dc3545', fontSize: '1.1rem' }}>⚠</span>
                                                    )}
                                                    {status === 'PENDING' && (
                                                        <span style={{ color: '#ccc', fontSize: '0.8rem' }}>●</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    </Col>

                    {/* ────── RIGHT: STAGE DETAIL PANEL ────── */}
                    <Col md={9}>
                        {/* Stage Header */}
                        <Card className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                            <Card.Body className="p-4">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <div className="d-flex align-items-center gap-3 mb-2">
                                            <span style={{ fontSize: '2rem' }}>{currentStage.icon}</span>
                                            <div>
                                                <h4 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                                    Stage {currentStage.id}: {currentStage.name}
                                                </h4>
                                                <p className="text-muted mb-0 small">{currentStage.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        {getStatusBadge(getStageStatus(selectedStage))}
                                        {currentReview?.lastUpdated && (
                                            <div className="small text-muted mt-1">
                                                Last reviewed: {new Date(currentReview.lastUpdated).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Two-column layout: Documents + Review Panel */}
                        <Row className="g-4">
                            {/* Documents Column */}
                            <Col md={7}>
                                <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <Card.Header className="bg-white border-0 py-3 px-4 d-flex justify-content-between align-items-center" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                            📄 Uploaded Documents
                                        </h6>
                                        <Badge bg="light" text="dark" className="border">
                                            {stageDocs.length} file{stageDocs.length !== 1 ? 's' : ''}
                                        </Badge>
                                    </Card.Header>
                                    <Card.Body className="p-0">
                                        {stageDocs.length === 0 ? (
                                            <div className="text-center py-5">
                                                <div style={{ fontSize: '2.5rem', opacity: 0.3 }}>📭</div>
                                                <p className="text-muted mt-2 mb-0">No documents uploaded for this stage</p>
                                                <small className="text-muted">
                                                    {selectedStage === 9 ? 'No supporting documents have been submitted yet.' : 'The applicant has not uploaded documents relevant to this stage.'}
                                                </small>
                                            </div>
                                        ) : (
                                            <Table hover responsive className="mb-0 align-middle">
                                                <thead className="bg-light">
                                                    <tr className="small text-uppercase text-muted">
                                                        <th className="ps-4">Document</th>
                                                        <th>Type</th>
                                                        <th>Size</th>
                                                        <th>Uploaded</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stageDocs.map(doc => (
                                                        <tr key={doc.id}>
                                                            <td className="ps-4">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span style={{ fontSize: '1.2rem' }}>
                                                                        {doc.contentType?.includes('pdf') ? '📕' : doc.contentType?.includes('image') ? '🖼️' : '📄'}
                                                                    </span>
                                                                    <div>
                                                                        <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                                                            {doc.fileName}
                                                                        </div>
                                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                                            {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.7rem' }}>
                                                                    {doc.contentType?.split('/')[1]?.toUpperCase() || 'FILE'}
                                                                </Badge>
                                                            </td>
                                                            <td className="text-muted small">
                                                                {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}
                                                            </td>
                                                            <td className="text-muted small">
                                                                {doc.uploadTimestamp ? new Date(doc.uploadTimestamp).toLocaleDateString() : '—'}
                                                            </td>
                                                            <td>
                                                                <Badge bg="success" className="px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                                                    ✓ Received
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Extraction Status for document-related stages */}
                                {(selectedStage === 5 || selectedStage === 9) && Object.keys(extractionStatus).length > 0 && (
                                    <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '12px' }}>
                                        <Card.Header className="bg-white border-0 py-3 px-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                            <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                                🤖 AI Extraction Status
                                            </h6>
                                        </Card.Header>
                                        <Card.Body className="p-3">
                                            <Row className="g-2">
                                                {Object.entries(extractionStatus).map(([key, value]) => (
                                                    <Col md={6} key={key}>
                                                        <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ background: value === 'completed' ? '#e8f5e9' : '#fff3e0' }}>
                                                            <span className="small fw-semibold" style={{ color: '#333' }}>
                                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                                            </span>
                                                            <Badge bg={value === 'completed' ? 'success' : 'warning'} className={value !== 'completed' ? 'text-dark' : ''} style={{ fontSize: '0.65rem' }}>
                                                                {value === 'completed' ? '✓ Extracted' : '○ Pending'}
                                                            </Badge>
                                                        </div>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </Card.Body>
                                    </Card>
                                )}
                            </Col>

                            {/* Review Panel Column */}
                            <Col md={5}>
                                <Card
                                    className="border-0 shadow-sm"
                                    style={{
                                        borderRadius: '12px',
                                        borderTop: `4px solid ${getStageStatus(selectedStage) === 'APPROVED' ? '#28a745' : getStageStatus(selectedStage) === 'FLAGGED' ? '#dc3545' : 'var(--rbz-gold)'}`,
                                        position: 'sticky',
                                        top: '20px',
                                    }}
                                >
                                    <Card.Header className="bg-white border-0 py-3 px-4" style={{ borderBottom: '2px solid #f0f0f0' }}>
                                        <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)' }}>
                                            🛡️ Examiner Decision
                                        </h6>
                                        <small className="text-muted">Stage {selectedStage}: {currentStage.name}</small>
                                    </Card.Header>
                                    <Card.Body className="p-4">
                                        {/* Action Buttons */}
                                        <div className="d-grid gap-2 mb-4">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Mark this stage as satisfactorily reviewed</Tooltip>}
                                            >
                                                <Button
                                                    variant={getStageStatus(selectedStage) === 'APPROVED' ? 'success' : 'outline-success'}
                                                    className="fw-bold py-2"
                                                    onClick={() => openApproveModal('APPROVED')}
                                                    disabled={saving}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    {getStageStatus(selectedStage) === 'APPROVED' && <span className="me-2">✓</span>}
                                                    {getStageStatus(selectedStage) === 'APPROVED' ? 'Stage Approved' : 'Approve this Stage'}
                                                </Button>
                                            </OverlayTrigger>

                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>Flag issues that require applicant action</Tooltip>}
                                            >
                                                <Button
                                                    variant={getStageStatus(selectedStage) === 'FLAGGED' ? 'danger' : 'outline-danger'}
                                                    className="fw-bold py-2"
                                                    onClick={() => openApproveModal('FLAGGED')}
                                                    disabled={saving}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    {getStageStatus(selectedStage) === 'FLAGGED' && <span className="me-2">⚠</span>}
                                                    {getStageStatus(selectedStage) === 'FLAGGED' ? 'Stage Flagged' : 'Flag Issues'}
                                                </Button>
                                            </OverlayTrigger>
                                        </div>

                                        {/* Comment Box */}
                                        <Form.Group className="mb-3">
                                            <Form.Label className="fw-bold small text-uppercase" style={{ color: '#777', letterSpacing: '0.5px', fontSize: '0.7rem' }}>
                                                Regulatory Comments
                                            </Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={4}
                                                placeholder="Enter observations, findings, or instructions for the applicant..."
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                style={{
                                                    borderRadius: '8px',
                                                    border: '2px solid #e9ecef',
                                                    fontSize: '0.85rem',
                                                    resize: 'vertical',
                                                }}
                                            />
                                            <div className="d-flex justify-content-between mt-2">
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                    These comments are visible to the applicant.
                                                </small>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 text-primary"
                                                    style={{ fontSize: '0.75rem' }}
                                                    onClick={() => handleSaveReview(getStageStatus(selectedStage) || 'PENDING')}
                                                    disabled={saving}
                                                >
                                                    {saving ? 'Saving...' : 'Save Comment'}
                                                </Button>
                                            </div>
                                        </Form.Group>

                                        {/* Previous review info */}
                                        {currentReview && (
                                            <div
                                                className="p-3 rounded"
                                                style={{
                                                    background: currentReview.status === 'APPROVED' ? '#e8f5e9' : currentReview.status === 'FLAGGED' ? '#ffebee' : '#f5f5f5',
                                                    border: `1px solid ${currentReview.status === 'APPROVED' ? '#c8e6c9' : currentReview.status === 'FLAGGED' ? '#ffcdd2' : '#e0e0e0'}`,
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <small className="fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px', color: '#666' }}>
                                                        Last Decision
                                                    </small>
                                                    {getStatusBadge(currentReview.status)}
                                                </div>
                                                {currentReview.examinerComment && (
                                                    <p className="mb-1 small" style={{ color: '#555' }}>
                                                        "{currentReview.examinerComment}"
                                                    </p>
                                                )}
                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                    By {currentReview.examinerName} — {currentReview.lastUpdated ? new Date(currentReview.lastUpdated).toLocaleString() : ''}
                                                </small>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>

                                {/* Quick Navigation */}
                                <Card className="border-0 shadow-sm mt-4" style={{ borderRadius: '12px' }}>
                                    <Card.Body className="p-3">
                                        <div className="d-flex justify-content-between">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="rounded-pill fw-semibold"
                                                disabled={selectedStage <= 1}
                                                onClick={() => setSelectedStage(prev => prev - 1)}
                                            >
                                                ← Previous Stage
                                            </Button>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="rounded-pill fw-semibold"
                                                disabled={selectedStage >= REVIEW_STAGES.length}
                                                onClick={() => setSelectedStage(prev => prev + 1)}
                                            >
                                                Next Stage →
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>

            {/* ────── CONFIRM MODAL ────── */}
            <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)} centered>
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="fw-bold" style={{ color: 'var(--rbz-navy)', fontSize: '1.1rem' }}>
                        {approveAction === 'APPROVED' ? '✅ Approve Stage' : '⚠ Flag Stage'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted">
                        {approveAction === 'APPROVED'
                            ? `You are confirming that Stage ${selectedStage} (${currentStage.name}) has been satisfactorily reviewed and meets regulatory requirements.`
                            : `You are flagging Stage ${selectedStage} (${currentStage.name}) for issues that require the applicant's attention.`
                        }
                    </p>
                    {!reviewComment && approveAction === 'FLAGGED' && (
                        <Alert variant="warning" className="border-0 small py-2">
                            <strong>Tip:</strong> Consider adding regulatory comments explaining what issues need to be addressed.
                        </Alert>
                    )}
                    <Form.Group className="mt-3">
                        <Form.Label className="fw-bold small">Regulatory Comments (Optional)</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Add your comments here..."
                            style={{ borderRadius: '8px' }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="border-0 pt-0">
                    <Button variant="secondary" size="sm" className="rounded-pill" onClick={() => setShowApproveModal(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant={approveAction === 'APPROVED' ? 'success' : 'danger'}
                        size="sm"
                        className="rounded-pill fw-bold px-4"
                        onClick={() => handleSaveReview(approveAction)}
                        disabled={saving}
                    >
                        {saving ? <Spinner animation="border" size="sm" /> : approveAction === 'APPROVED' ? 'Confirm Approval' : 'Confirm Flag'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ExaminerInstitutionReview;
