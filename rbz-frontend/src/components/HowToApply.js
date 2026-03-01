import React from 'react';
import { Card, Button, Container, Row, Col } from 'react-bootstrap';
import './HowToApply.css';

const HowToApply = ({ onSkip, onStart }) => {
    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
            <Card className="shadow-lg border-0 how-to-card" style={{ width: '100%', maxWidth: '800px', borderRadius: '15px' }}>
                <Card.Header className="bg-white border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <img src="/rbz-logo.png" alt="RBZ Logo" style={{ height: '50px' }} />
                        <div>
                            <h4 style={{ color: '#003366', fontWeight: 'bold', margin: 0 }}>How to Apply</h4>
                            <small className="text-muted">Microfinance Licensing Process Guide</small>
                        </div>
                    </div>
                </Card.Header>

                <Card.Body className="p-4 p-md-5">
                    <Row className="mb-4">
                        <Col>
                            <p className="lead" style={{ color: '#444' }}>
                                Welcome to the RBZ Digital Licensing Portal. A complete application requires accurate corporate
                                and financial disclosures. Please review the steps below before proceeding.
                            </p>
                            <div className="alert alert-info border-0" style={{ backgroundColor: '#e8f4fd', color: '#003366' }}>
                                <strong>💡 Need Help?</strong> Use the floating RBZ Chatbot in the bottom right corner for immediate answers regarding rules, regulations, and required documents.
                            </div>
                        </Col>
                    </Row>

                    <Row className="g-4 mb-5">
                        <Col md={6}>
                            <div className="step-box h-100 p-4 border rounded" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #003366 !important' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px', fontWeight: 'bold', backgroundColor: '#003366 !important' }}>1</div>
                                    <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Company & Ownership</h5>
                                </div>
                                <p className="text-muted small mb-0">Prepare your Certificate of Incorporation, CR14, and CR6. You will need to map out your entire shareholding structure.</p>
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className="step-box h-100 p-4 border rounded" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #D4AF37 !important' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="step-number bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px', fontWeight: 'bold' }}>2</div>
                                    <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Vetting & Governance</h5>
                                </div>
                                <p className="text-muted small mb-0">Every director must submit personal declarations, CVs, and police clearance certificates for fit & proper assessments.</p>
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className="step-box h-100 p-4 border rounded" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #003366 !important' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="step-number bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px', fontWeight: 'bold', backgroundColor: '#003366 !important' }}>3</div>
                                    <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Financial Soundness</h5>
                                </div>
                                <p className="text-muted small mb-0">Proof of minimum capital ($25k for Credit-Only) and detailed 5-year financial projections must be uploaded.</p>
                            </div>
                        </Col>

                        <Col md={6}>
                            <div className="step-box h-100 p-4 border rounded" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #D4AF37 !important' }}>
                                <div className="d-flex align-items-center mb-3">
                                    <div className="step-number bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '35px', height: '35px', fontWeight: 'bold' }}>4</div>
                                    <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Final Submission</h5>
                                </div>
                                <p className="text-muted small mb-0">Review all data via the workflow checker. Once submitted, your application locks and enters the Examiner Review queue.</p>
                            </div>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-between align-items-center">
                        <Button variant="link" onClick={onSkip} className="text-muted fw-bold text-decoration-none">
                            Skip Guide
                        </Button>
                        <Button
                            variant="primary"
                            onClick={onStart}
                            className="fw-bold px-4 py-2"
                            style={{ backgroundColor: '#003366', borderColor: '#003366', borderRadius: '8px' }}
                        >
                            Start Application Workflow →
                        </Button>
                    </div>
                </Card.Body>
            </Card>

            {/* Float the existing Chatbot module here so they can ask questions before starting */}
            <div className="d-none"></div>

        </Container>
    );
};

export default HowToApply;
