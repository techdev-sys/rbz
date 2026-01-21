import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import ApplicantRegistration from './ApplicantRegistration';
import ApplicationChat from './ApplicationChat';
import { getCompanyProfile } from '../services/api';
import '../Premium.css'; // Import Premium Aesthetics

const DashboardApplicant = ({ onLogout, onStartApp }) => {
    const [existingId, setExistingId] = useState(localStorage.getItem('currentCompanyId'));
    const [showRegistration, setShowRegistration] = useState(false);
    const [companyProfile, setCompanyProfile] = useState(null);

    useEffect(() => {
        if (existingId) {
            getCompanyProfile(existingId)
                .then(res => setCompanyProfile(res.data))
                .catch(err => console.error("Failed to load profile for chat name", err));
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
        onStartApp(newId, 'applicant');
    };

    if (showRegistration) {
        return <ApplicantRegistration onRegistered={handleRegistrationComplete} onCancel={() => setShowRegistration(false)} />;
    }

    return (
        <div style={{ background: '#f0f4f8', minHeight: '100vh', paddingBottom: '50px' }}>
            <div className="text-white py-5 mb-5" style={{ background: 'linear-gradient(135deg, #001F3F 0%, #003366 100%)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-4">
                            <img
                                src="/rbz-logo.png"
                                alt="RBZ"
                                style={{ height: '70px', borderRadius: '5px', background: 'white', padding: '5px' }}
                            />
                            <div>
                                <h1 className="fw-bold mb-0">Applicant Portal</h1>
                                <p className="mb-0 text-white-50">Reserve Bank of Zimbabwe | Licensing & Supervision</p>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="mb-2">Welcome, <strong className="text-warning">{companyProfile?.contactPersonName || "Guest"}</strong></div>
                            <Button variant="outline-light" size="sm" onClick={onLogout} className="rounded-pill px-4">Secure Logout</Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="animate-fade-in">
                <Row className="mb-5">
                    <Col md={12}>
                        <div className="dashboard-stats">
                            <div className="stat-item">
                                <div className="stat-label">Application Status</div>
                                <div className="stat-value text-primary">{existingId ? 'IN PROGRESS' : 'NOT STARTED'}</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Security Protocol</div>
                                <div className="stat-value text-success">ENCRYPTED</div>
                            </div>
                            <div className="stat-item">
                                <div className="stat-label">Support Status</div>
                                <div className="stat-value text-info">ACTIVE</div>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col md={6}>
                        <Card className="premium-card h-100 border-0">
                            <Card.Body className="text-center p-5">
                                <div className="mb-4" style={{ fontSize: '4rem' }}>🖋️</div>
                                <h3 className="fw-bold mb-3" style={{ color: '#003366' }}>New License Request</h3>
                                <p className="text-muted mb-4">Launch a new application for a Microfinance Institution license. Ensure you have all corporate documents ready.</p>
                                <Button
                                    className="premium-button w-100"
                                    onClick={handleNewClick}
                                >
                                    Begin New Registration
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6}>
                        <Card className={`premium-card h-100 border-0 ${!existingId ? 'opacity-75' : ''}`}>
                            <Card.Body className="text-center p-5">
                                <div className="mb-4" style={{ fontSize: '4rem' }}>📂</div>
                                <h3 className="fw-bold mb-3" style={{ color: existingId ? '#003366' : '#6c757d' }}>Maintain Draft</h3>
                                <p className="text-muted mb-4">Complete your pending application. Your progress is saved automatically at each stage.</p>
                                <Button
                                    className={existingId ? "premium-button-gold w-100" : "btn btn-secondary w-100"}
                                    onClick={handleContinue}
                                    disabled={!existingId}
                                >
                                    {existingId ? `Resume Case #${existingId}` : 'No Case Found'}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="mt-5 border-0 premium-card">
                    <Card.Body className="p-4">
                        <h5 className="fw-bold mb-3" style={{ color: '#003366' }}>
                            <span className="me-2">ℹ️</span> Essential Submission Guidelines
                        </h5>
                        <Row>
                            <Col md={4}>
                                <div className="p-3 border-start border-4 border-primary bg-light rounded mb-3">
                                    <h6 className="fw-bold">Phase 1: Institutional Data</h6>
                                    <small className="text-muted">Register your body corporate and primary contact details.</small>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 border-start border-4 border-primary bg-light rounded mb-3">
                                    <h6 className="fw-bold">Phase 2: Vetting & Risk</h6>
                                    <small className="text-muted">Submit directors and shareholders for exhaustive background checks.</small>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="p-3 border-start border-4 border-primary bg-light rounded mb-3">
                                    <h6 className="fw-bold">Phase 3: Financial Soundness</h6>
                                    <small className="text-muted">Upload 5-year projections and capital structure proof.</small>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {existingId && (
                    <ApplicationChat
                        companyId={existingId}
                        currentUserRole="applicant"
                        userName={companyProfile?.contactPersonName || "Applicant"}
                    />
                )}
            </Container>
        </div>
    );
};

export default DashboardApplicant;
