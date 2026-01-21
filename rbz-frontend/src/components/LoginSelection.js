import React from 'react';
import { Card, Container, Row, Col, Button, Badge } from 'react-bootstrap';

const LoginSelection = ({ onSelectRole }) => {
    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#e9ecef' }}>
            <Card className="shadow-lg animate-fade-in border-0" style={{ width: '100%', maxWidth: '900px' }}>
                <Card.Header className="text-center bg-white border-0 pt-5 pb-0">
                    <img src="/rbz-logo.png" alt="RBZ Logo" style={{ height: '100px', marginBottom: '15px' }} />
                    <h2 style={{ color: '#003366', fontWeight: 'bold' }}>Reserve Bank of Zimbabwe</h2>
                    <h5 style={{ color: '#D4AF37' }}>Bank Supervision ,Surveillance and Financial Stability Division</h5>
                    <hr className="w-50 mx-auto mt-4" style={{ borderColor: '#003366' }} />
                </Card.Header>
                <Card.Body className="p-5">
                    <div className="text-center mb-5">
                        <h4 className="mb-2 text-muted">Licensing & Supervision Portal</h4>
                        <p className="text-muted small">Select your secure access portal below</p>
                    </div>

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => onSelectRole('applicant')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                                <Card.Body className="d-flex flex-column align-items-center p-4">
                                    <div className="rounded-circle p-4 mb-3" style={{ backgroundColor: '#eef2f5' }}>
                                        <span style={{ fontSize: '2.5rem' }}>🏢</span>
                                    </div>
                                    <h5 style={{ color: '#003366' }}>Applicant Portal</h5>
                                    <p className="small text-muted mb-4">
                                        Submit new license applications, track status, and upload required documents.
                                    </p>
                                    <Button variant="outline-primary" className="w-100 mt-auto" style={{ borderColor: '#003366', color: '#003366' }}>Login as Applicant</Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => onSelectRole('senior_be')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                                <Card.Body className="d-flex flex-column align-items-center p-4">
                                    <div className="rounded-circle p-4 mb-3" style={{ backgroundColor: '#fff8e1' }}>
                                        <span style={{ fontSize: '2.5rem' }}>👔</span>
                                    </div>
                                    <h5 style={{ color: '#003366' }}>Senior Examiner</h5>
                                    <p className="small text-muted mb-4">
                                        Oversee application pipeline, delegate tasks, and monitor examiner workloads.
                                    </p>
                                    <Button variant="outline-warning" className="w-100 mt-auto" style={{ borderColor: '#D4AF37', color: '#856404' }}>Login as Senior BE</Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => onSelectRole('examiner')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                                <Card.Body className="d-flex flex-column align-items-center p-4">
                                    <div className="rounded-circle p-4 mb-3" style={{ backgroundColor: '#e8f5e9' }}>
                                        <span style={{ fontSize: '2.5rem' }}>🕵️‍♂️</span>
                                    </div>
                                    <h5 style={{ color: '#003366' }}>Bank Examiner</h5>
                                    <p className="small text-muted mb-4">
                                        Perform detailed evaluations, conduct due diligence, and generate reports.
                                    </p>
                                    <Button variant="outline-success" className="w-100 mt-auto" style={{ borderColor: '#28a745', color: '#28a745' }}>Login as Examiner</Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="text-center text-white py-3" style={{ backgroundColor: '#003366' }}>
                    <small>&copy; 2026 Reserve Bank of Zimbabwe. Unauthorized access is prohibited.</small>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default LoginSelection;
