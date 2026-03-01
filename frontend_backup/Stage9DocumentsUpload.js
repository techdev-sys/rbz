import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import axios from 'axios';
import { API_URL, submitApplication } from '../services/api';
import '../Premium.css';
import WorkflowStatusPanel from './WorkflowStatusPanel';

const Stage9DocumentsUpload = ({ onComplete }) => {
    const [uploadedDocs, setUploadedDocs] = useState({
        financialStatements: null,
        businessPlan: null,
        creditPolicy: null,
        operationalManual: null,
        portfolioReport: null,
        taxClearance: null,
        insurancePolicy: null
    });

    const [extractionStatus, setExtractionStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const companyId = localStorage.getItem('currentCompanyId');
    const userRole = localStorage.getItem('userRole');

    const documentTypes = [
        {
            key: 'financialStatements',
            name: 'Audited Financial Statements (Last 3 Years)',
            description: 'Required for thorough financial health assessment',
            icon: '📊',
            required: true
        },
        {
            key: 'businessPlan',
            name: 'Strategic Business Plan',
            description: 'Required for growth and feasibility assessment',
            icon: '📈',
            required: true
        },
        {
            key: 'portfolioReport',
            name: 'Loan Portfolio Report',
            description: 'Required for asset quality verification',
            icon: '💼',
            required: true
        },
        {
            key: 'creditPolicy',
            name: 'Credit & Risk Policy Manual',
            description: 'Required for risk management compliance',
            icon: '📋',
            required: true
        },
        {
            key: 'operationalManual',
            name: 'Operational Policy Manual',
            description: 'Standard operating procedures for the institution',
            icon: '📖',
            required: false
        },
        {
            key: 'taxClearance',
            name: 'ZIMRA Tax Clearance Certificate',
            description: 'Proof of regulatory tax compliance',
            icon: '🧾',
            required: true
        },
        {
            key: 'insurancePolicy',
            name: 'Credit Insurance Policy',
            description: 'Valid insurance for credit portfolio (if applicable)',
            icon: '🛡️',
            required: false
        }
    ];

    const handleFileChange = (docType, file) => {
        setUploadedDocs(prev => ({
            ...prev,
            [docType]: file
        }));
    };

    const handleUploadAndProcess = async (docType) => {
        const file = uploadedDocs[docType];
        if (!file) return;

        if (file.size > 7 * 1024 * 1024) {
            setError(`File ${file.name} exceeds the 7MB limit.`);
            return;
        }

        setLoading(true);
        setError(null);
        setExtractionStatus(prev => ({
            ...prev,
            [docType]: 'processing'
        }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('companyId', companyId);
            formData.append('documentType', docType);

            // Using the internal endpoint for processing
            await axios.post(
                `${API_URL}/documents/extract`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setExtractionStatus(prev => ({
                ...prev,
                [docType]: 'completed'
            }));

        } catch (err) {
            console.error('Upload failed', err);
            setExtractionStatus(prev => ({
                ...prev,
                [docType]: 'failed'
            }));
            setError(`Failed to process document: ${err.response?.data || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUploadAll = async () => {
        for (const docType of Object.keys(uploadedDocs)) {
            if (uploadedDocs[docType] && extractionStatus[docType] !== 'completed') {
                await handleUploadAndProcess(docType);
            }
        }
    };

    const handleComplete = async () => {
        if (userRole === 'applicant') {
            if (!window.confirm("FINAL CONFIRMATION: Are you sure you wish to submit this application to the Reserve Bank of Zimbabwe? This action is irreversible.")) {
                return;
            }
            setLoading(true);
            try {
                await submitApplication(companyId);
                alert("Application Successfully Submitted to Central Bank.");
                if (onComplete) onComplete();
            } catch (err) {
                setError("Submission error: " + err.message);
            } finally {
                setLoading(false);
            }
        } else {
            if (onComplete) onComplete();
        }
    };

    const getStatusBadge = (docType) => {
        const status = extractionStatus[docType];
        if (!status) return <Badge bg="light" text="dark" className="border">Awaiting File</Badge>;
        if (status === 'processing') return <Badge bg="info" className="status-badge">Processing...</Badge>;
        if (status === 'completed') return <Badge bg="success" className="status-badge">✅ Verified</Badge>;
        if (status === 'failed') return <Badge bg="danger" className="status-badge">Failed</Badge>;
    };

    const allRequiredUploaded = documentTypes
        .filter(doc => doc.required)
        .every(doc => extractionStatus[doc.key] === 'completed');

    return (
        <Container className="py-4 animate-fade-in">
            <div className="mb-4">
                <h3 className="fw-bold" style={{ color: 'var(--rbz-navy)' }}>Stage 9: Document Repository</h3>
                <p className="text-muted">Finalize your application by uploading all required supporting documentation for system verification.</p>
            </div>

            {error && <Alert variant="danger" className="border-0 shadow-sm mb-4">{error}</Alert>}

            <Card className="premium-card border-0 mb-4 overflow-hidden">
                <div className="p-3" style={{ background: 'var(--rbz-gradient)', color: 'white' }}>
                    <div className="d-flex align-items-center gap-2">
                        <span>📋</span>
                        <span className="fw-bold">Mandatory & Optional Submissions</span>
                    </div>
                </div>
                <Card.Body className="p-4">
                    <Row className="g-4">
                        {documentTypes.map(doc => (
                            <Col md={12} key={doc.key}>
                                <div className="p-3 rounded border bg-white hover-shadow transition">
                                    <Row className="align-items-center">
                                        <Col md={6}>
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="fs-3">{doc.icon}</div>
                                                <div>
                                                    <div className="fw-bold" style={{ color: 'var(--rbz-navy)' }}>
                                                        {doc.name}
                                                        {doc.required && <Badge bg="danger" className="ms-2 small" style={{ fontSize: '0.6rem' }}>REQUIRED</Badge>}
                                                    </div>
                                                    <div className="small text-muted">{doc.description}</div>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col md={3} className="text-center">
                                            {getStatusBadge(doc.key)}
                                        </Col>
                                        <Col md={3} className="text-end">
                                            <div className="d-flex flex-column gap-2">
                                                <Form.Control
                                                    type="file"
                                                    size="sm"
                                                    className="border-0 bg-light"
                                                    onChange={(e) => handleFileChange(doc.key, e.target.files[0])}
                                                    disabled={extractionStatus[doc.key] === 'completed'}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant={extractionStatus[doc.key] === 'completed' ? 'success' : 'primary'}
                                                    className="premium-button-gold border-0"
                                                    onClick={() => handleUploadAndProcess(doc.key)}
                                                    disabled={!uploadedDocs[doc.key] || extractionStatus[doc.key] === 'processing' || extractionStatus[doc.key] === 'completed'}
                                                >
                                                    {extractionStatus[doc.key] === 'completed' ? 'Uploaded' : 'Direct Upload'}
                                                </Button>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center bg-white p-4 rounded shadow-sm border-top border-4 border-warning">
                <Button variant="outline-dark" className="rounded-pill px-4" onClick={() => window.history.back()}>
                    ← Back to Evaluation
                </Button>

                <div className="d-flex gap-3">
                    <Button
                        variant="info"
                        className="rounded-pill px-4"
                        onClick={handleUploadAll}
                        disabled={loading || !Object.values(uploadedDocs).some(doc => doc !== null)}
                    >
                        🚀 Process All Selected
                    </Button>

                    <Button
                        className="premium-button px-5 py-2 shadow"
                        onClick={handleComplete}
                        disabled={!allRequiredUploaded || loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : userRole === 'applicant' ? 'Submit Application →' : 'Proceed to Executive Summary →'}
                    </Button>
                </div>
            </div>

            {/* Workflow Rule Engine Integration - Final Stage Checks before Submission */}
            <div className="mt-4 mb-4 border-top pt-4">
                <WorkflowStatusPanel
                    companyId={companyId}
                    currentStep={6}
                    onStageComplete={() => { }} // Submission handles completion 
                />
            </div>

            <div className="mt-4 text-center">
                <p className="small text-muted">
                    Secure channel encrypted with RBZ Cyber-Security Standards.
                    <br />Your data is processed according to the Data Protection Act [Chapter 11:12].
                </p>
            </div>
        </Container>
    );
};

export default Stage9DocumentsUpload;
