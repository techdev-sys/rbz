import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Badge, Card, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import ApplicantRegistration from './ApplicantRegistration';
import HowToApply from './HowToApply';
import ApplicationChat from './ApplicationChat';
import { getCompanyProfile, getAllCompanyProfiles } from '../services/api';
import './DashboardApplicant.css';

const DashboardApplicant = ({ onLogout, onStartApp }) => {
    const [existingId, setExistingId] = useState(localStorage.getItem('currentCompanyId'));
    const [showRegistration, setShowRegistration] = useState(false);
    const [showHowTo, setShowHowTo] = useState(false);
    const [applicantName, setApplicantName] = useState(localStorage.getItem('applicantName') || 'Applicant');
    const [institutionName, setInstitutionName] = useState(localStorage.getItem('institutionName') || 'Your Institution');
    const [applicationStatus, setApplicationStatus] = useState('DRAFT');
    const [showRecoverModal, setShowRecoverModal] = useState(false);
    const [recoverSearch, setRecoverSearch] = useState('');
    const [recoverLoading, setRecoverLoading] = useState(false);
    const [recoverError, setRecoverError] = useState(null);

    useEffect(() => {
        if (existingId) {
            getCompanyProfile(existingId)
                .then(res => {
                    if (res.data.contactPersonName) setApplicantName(res.data.contactPersonName);
                    if (res.data.companyName) setInstitutionName(res.data.companyName);
                    if (res.data.applicationStatus) setApplicationStatus(res.data.applicationStatus);
                })
                .catch(err => console.error("Failed to load profile", err));
        }
    }, [existingId]);

    const handleContinue = () => {
        onStartApp(existingId, 'applicant');
    };

    const handleNewClick = () => {
        if (existingId) {
            if (window.confirm("Starting a new application will clear your current local session link to the previous draft. Continue?")) {
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
        // Store institution details so the system "remembers" them everywhere
        if (localStorage.getItem('institutionName')) {
            setInstitutionName(localStorage.getItem('institutionName'));
        }
        if (localStorage.getItem('applicantName')) {
            setApplicantName(localStorage.getItem('applicantName'));
        }
        setShowRegistration(false);
        setShowHowTo(true);
    };

    const handleSkipOrStartHowTo = () => {
        setShowHowTo(false);
        onStartApp(existingId, 'applicant');
    };

    const handleRecoverDraft = async () => {
        if (!recoverSearch.trim()) return;
        setRecoverLoading(true);
        setRecoverError(null);
        try {
            const res = await getAllCompanyProfiles();
            const profiles = res.data;
            let match = null;

            // Try matching by exact ID if it's a number
            if (!isNaN(recoverSearch.trim())) {
                match = profiles.find(p => p.id === parseInt(recoverSearch.trim()));
            }

            // Fallback: search by name
            if (!match) {
                match = profiles.find(p => p.companyName && p.companyName.toLowerCase().includes(recoverSearch.trim().toLowerCase()));
            }

            if (match) {
                setExistingId(match.id);
                localStorage.setItem('currentCompanyId', match.id);

                if (match.companyName) {
                    setInstitutionName(match.companyName);
                    localStorage.setItem('institutionName', match.companyName);
                }

                if (match.contactPersonName) {
                    setApplicantName(match.contactPersonName);
                    localStorage.setItem('applicantName', match.contactPersonName);
                }

                if (match.applicationStatus) {
                    setApplicationStatus(match.applicationStatus);
                }

                setShowRecoverModal(false);
                setRecoverSearch('');
            } else {
                setRecoverError("No application found matching that ID or name.");
            }
        } catch (err) {
            setRecoverError("Error searching for draft. Please try again later.");
            console.error("Recovery error: ", err);
        } finally {
            setRecoverLoading(false);
        }
    };

    if (showRegistration) {
        return <ApplicantRegistration onRegistered={handleRegistrationComplete} onCancel={() => setShowRegistration(false)} />;
    }

    if (showHowTo) {
        return (
            <>
                <HowToApply onSkip={handleSkipOrStartHowTo} onStart={handleSkipOrStartHowTo} />
                <ApplicationChat companyId={existingId} currentUserRole="applicant" userName={applicantName} />
            </>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '50px' }}>
            {/* Clean White Navbar */}
            <div className="bg-white shadow-sm py-3 mb-5">
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '50px' }} />
                            <div>
                                <h5 className="m-0 fw-bold" style={{ color: '#003366' }}>{institutionName}</h5>
                                <small className="text-muted">RBZ Licensing Workspace</small>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="mb-2 text-muted small">
                                Welcome, <strong style={{ color: '#D4AF37' }}>{applicantName}</strong>
                            </div>
                            <Button variant="outline-primary" size="sm" onClick={onLogout} style={{ borderColor: '#003366', color: '#003366', borderRadius: '20px' }} className="px-4">
                                Secure Logout
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="animate-fade-in">
                {/* Header Information */}
                <div className="mb-4">
                    <h3 className="fw-bold" style={{ color: '#003366' }}>Licensing Dashboard</h3>
                    <p className="text-muted">Manage your Microfinance Institution application</p>
                </div>

                {/* Quick Status Bar */}
                <Card className="shadow-sm border-0 mb-4 rounded-3">
                    <Card.Body className="py-3 px-4">
                        <Row className="align-items-center text-center text-md-start">
                            <Col md={4} className="border-end-md mb-3 mb-md-0">
                                <span className="text-muted small d-block mb-1 text-uppercase">Status</span>
                                <span className="px-3 py-2 rounded-pill fw-bold" style={{
                                    display: 'inline-block',
                                    fontSize: '0.8rem',
                                    ...(applicationStatus === 'APPROVED' ? { background: '#e8f5ec', color: '#1a5c2e' } :
                                        applicationStatus === 'REJECTED' ? { background: '#fde8e8', color: '#8b1a1a' } :
                                            applicationStatus === 'ASSIGNED' ? { background: '#e3f0f7', color: '#003366' } :
                                                applicationStatus === 'SUBMITTED' ? { background: '#e8edf2', color: '#003366' } :
                                                    existingId ? { background: '#fef9e7', color: '#6b5900' } :
                                                        { background: '#f0f0f0', color: '#555' })
                                }}>
                                    {applicationStatus === 'APPROVED' ? '✅ License Approved' :
                                        applicationStatus === 'REJECTED' ? '❌ Application Rejected' :
                                            applicationStatus === 'ASSIGNED' ? '🔍 Under Examiner Review' :
                                                applicationStatus === 'SUBMITTED' ? '📋 Submitted for Review' :
                                                    existingId ? 'Application In Progress' : 'Not Started'}
                                </span>
                            </Col>
                            <Col md={4} className="border-end-md mb-3 mb-md-0">
                                <span className="text-muted small d-block mb-1 text-uppercase">Security</span>
                                <span className="fw-bold text-success">
                                    <span className="me-1">🔒</span> Encrypted Session
                                </span>
                            </Col>
                            <Col md={4}>
                                <span className="text-muted small d-block mb-1 text-uppercase">Last Case ID</span>
                                <span className="fw-bold" style={{ color: '#003366' }}>
                                    {existingId ? `#${existingId.toString().padStart(4, '0')}` : 'N/A'}
                                </span>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {applicationStatus === 'APPROVED' && (
                    <Card className="shadow-sm border-0 mb-4 rounded-3 border-start border-5 border-success bg-success bg-opacity-10">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold text-success mb-2">🎉 Congratulations! Your Microfinance License Has Been Approved</h5>
                            <p className="text-muted mb-0">
                                Your application has been reviewed and approved by the Reserve Bank of Zimbabwe.
                                You will receive your official license documentation and next steps via your registered email.
                            </p>
                        </Card.Body>
                    </Card>
                )}

                {applicationStatus === 'REJECTED' && (
                    <Card className="shadow-sm border-0 mb-4 rounded-3 border-start border-5 border-danger bg-danger bg-opacity-10">
                        <Card.Body className="p-4">
                            <h5 className="fw-bold text-danger mb-2">Application Not Approved</h5>
                            <p className="text-muted mb-0">
                                Your application was reviewed but has not been approved at this time.
                                Please contact the Bank Supervision Division for details and guidance on reapplication.
                            </p>
                        </Card.Body>
                    </Card>
                )}

                {/* Compact Action Cards */}
                <Row className="g-4 mb-5">
                    <Col md={6}>
                        <Card className="shadow-sm border-0 h-100 hover-card rounded-4">
                            <Card.Body className="p-4 d-flex flex-column text-center">
                                <div className="mb-3">
                                    <div className="icon-circle mx-auto bg-light text-primary mb-3">
                                        <span style={{ fontSize: '2rem' }}>✨</span>
                                    </div>
                                    <h5 className="fw-bold" style={{ color: '#003366' }}>Start New Application</h5>
                                    <p className="text-muted small mb-4">
                                        Begin a new licensing process. This requires your verified institution credentials.
                                    </p>
                                </div>
                                <Button
                                    className="w-100 mt-auto rounded-pill fw-bold"
                                    style={{ backgroundColor: '#003366', borderColor: '#003366', padding: '10px' }}
                                    onClick={handleNewClick}
                                >
                                    Start Application
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className={`shadow-sm border-0 h-100 hover-card rounded-4 ${!existingId ? 'disabled-card' : ''}`}>
                            <Card.Body className="p-4 d-flex flex-column text-center">
                                <div className="mb-3">
                                    <div className="icon-circle mx-auto bg-light text-warning mb-3">
                                        <span style={{ fontSize: '2rem' }}>📂</span>
                                    </div>
                                    <h5 className="fw-bold" style={{ color: existingId ? '#003366' : '#6c757d' }}>Continue Draft</h5>
                                    <p className="text-muted small mb-4">
                                        Resume your saved application. All previous inputs and documents are preserved.
                                    </p>
                                </div>
                                <Button
                                    className="w-100 mt-auto rounded-pill fw-bold mb-2"
                                    onClick={existingId ? handleContinue : undefined}
                                    disabled={!existingId}
                                    style={existingId ? { backgroundColor: '#D4AF37', borderColor: '#D4AF37', color: '#003366' } : {}}
                                    variant={!existingId ? "secondary" : "primary"}
                                >
                                    {existingId ? 'Resume Application' : 'No Draft Available'}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    className="w-100 rounded-pill mt-auto"
                                    style={{ fontSize: '0.85rem' }}
                                    onClick={() => setShowRecoverModal(true)}
                                >
                                    Recover Lost Draft
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Light Guidelines Section */}
                <Card className="shadow-sm border-0 bg-white rounded-4">
                    <Card.Body className="p-4">
                        <h6 className="fw-bold mb-4" style={{ color: '#003366' }}>
                            <span className="me-2">📋</span> Information Required
                        </h6>
                        <Row className="g-3">
                            <Col md={4}>
                                <div className="p-3 border rounded-3 bg-light h-100">
                                    <h6 className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>1. Institutional Data</h6>
                                    <p className="text-muted small mb-0">Corporate identity, basic details, and compliance registration.</p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 border rounded-3 bg-light h-100">
                                    <h6 className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>2. Risk & Vetting</h6>
                                    <p className="text-muted small mb-0">Declarations for directors and primary shareholders.</p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 border rounded-3 bg-light h-100">
                                    <h6 className="fw-bold mb-1" style={{ fontSize: '0.9rem' }}>3. Financial Soundness</h6>
                                    <p className="text-muted small mb-0">Financial models, capital proof, and product structures.</p>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {existingId && (
                    <ApplicationChat
                        companyId={existingId}
                        currentUserRole="applicant"
                        userName={applicantName}
                    />
                )}
            </Container>

            {/* Recover Draft Modal */}
            <Modal show={showRecoverModal} onHide={() => setShowRecoverModal(false)} centered>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold" style={{ color: '#003366' }}>Recover Lost Draft</Modal.Title>
                </Modal.Header>
                <Modal.Body className="px-4 pb-4">
                    <p className="text-muted small mb-4">
                        If you started an application previously but lost your local session (e.g. after restarting or clearing browser data),
                        you can recover it here by entering your Company Name or your Application Case ID.
                    </p>

                    {recoverError && <Alert variant="danger" className="small">{recoverError}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted text-uppercase">Application ID or Company Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g. 11 or Boost Capital Services"
                            value={recoverSearch}
                            onChange={(e) => setRecoverSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleRecoverDraft()}
                        />
                    </Form.Group>

                    <Button
                        className="w-100 rounded-pill fw-bold"
                        style={{ backgroundColor: '#003366', borderColor: '#003366' }}
                        onClick={handleRecoverDraft}
                        disabled={recoverLoading || !recoverSearch.trim()}
                    >
                        {recoverLoading ? <Spinner size="sm" animation="border" /> : 'Search & Recover'}
                    </Button>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default DashboardApplicant;
