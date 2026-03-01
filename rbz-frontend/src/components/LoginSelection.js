import React, { useState } from 'react';
import { Card, Container, Row, Col, Button, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import { authenticateUser } from '../services/api';

const LoginSelection = ({ onSelectRole }) => {
    const [loadingRole, setLoadingRole] = useState(null);
    const [error, setError] = useState(null);
    const [showExaminerLogin, setShowExaminerLogin] = useState(false);
    const [examinerUsername, setExaminerUsername] = useState('');
    const [examinerPassword, setExaminerPassword] = useState('');
    const [examinerLoading, setExaminerLoading] = useState(false);
    const [examinerError, setExaminerError] = useState(null);

    const handleRoleClick = async (role) => {
        if (role === 'examiner') {
            setShowExaminerLogin(true);
            setExaminerError(null);
            return;
        }

        setLoadingRole(role);
        setError(null);
        try {
            const response = await authenticateUser(role);
            if (response.data && response.data.token) {
                localStorage.setItem('jwtToken', response.data.token);
                const defaultNames = {
                    'applicant': 'Applicant',
                    'senior_be': 'Deputy Director - Bank Supervision'
                };
                localStorage.setItem('examinerUsername', defaultNames[role] || role);
                onSelectRole(role);
            } else {
                setError("Invalid authentication response.");
            }
        } catch (err) {
            setError(err.response?.data || err.message || "Failed to authenticate.");
        } finally {
            setLoadingRole(null);
        }
    };

    const handleExaminerLogin = async (e) => {
        e.preventDefault();
        if (!examinerUsername || !examinerPassword) {
            setExaminerError('Please enter both username and password');
            return;
        }

        setExaminerLoading(true);
        setExaminerError(null);
        try {
            const response = await authenticateUser('examiner', examinerUsername, examinerPassword);
            if (response.data && response.data.token) {
                localStorage.setItem('jwtToken', response.data.token);
                localStorage.setItem('examinerUsername', response.data.fullName || examinerUsername);
                if (response.data.employeeId) {
                    localStorage.setItem('examinerEmployeeId', response.data.employeeId);
                }
                if (response.data.designation) {
                    localStorage.setItem('examinerDesignation', response.data.designation);
                }
                setShowExaminerLogin(false);
                onSelectRole('examiner');
            } else {
                setExaminerError("Invalid authentication response.");
            }
        } catch (err) {
            const msg = err.response?.data || err.message || "Failed to authenticate.";
            setExaminerError(typeof msg === 'string' ? msg : JSON.stringify(msg));
        } finally {
            setExaminerLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#e9ecef' }}>
            <Card className="shadow-lg animate-fade-in border-0" style={{ width: '100%', maxWidth: '900px' }}>
                <Card.Header className="text-center bg-white border-0 pt-5 pb-0">
                    <img src="/rbz-logo.png" alt="RBZ Logo" style={{ height: '100px', marginBottom: '15px' }} />
                    <h2 style={{ color: '#003366', fontWeight: 'bold' }}>Reserve Bank of Zimbabwe</h2>
                    <h5 style={{ color: '#D4AF37' }}>Bank Supervision ,Surveillance and Financial Stability Division</h5>
                    <hr className="w-50 mx-auto mt-4" style={{ borderColor: '#003366' }} />
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                </Card.Header>
                <Card.Body className="p-5">
                    <div className="text-center mb-5">
                        <h4 className="mb-2 text-muted">Licensing & Supervision Portal</h4>
                        <p className="text-muted small">Select your secure access portal below</p>
                    </div>

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => handleRoleClick('applicant')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                                <Card.Body className="d-flex flex-column align-items-center p-4">
                                    <div className="rounded-circle p-4 mb-3" style={{ backgroundColor: '#eef2f5' }}>
                                        <span style={{ fontSize: '2.5rem' }}>🏢</span>
                                    </div>
                                    <h5 style={{ color: '#003366' }}>Applicant Portal</h5>
                                    <p className="small text-muted mb-4">
                                        Submit new license applications, track status, and upload required documents.
                                    </p>
                                    <Button variant="outline-primary" className="w-100 mt-auto" style={{ borderColor: '#003366', color: '#003366' }}>
                                        {loadingRole === 'applicant' ? <Spinner animation="border" size="sm" /> : 'Login as Applicant'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => handleRoleClick('senior_be')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
                                <Card.Body className="d-flex flex-column align-items-center p-4">
                                    <div className="rounded-circle p-4 mb-3" style={{ backgroundColor: '#fff8e1' }}>
                                        <span style={{ fontSize: '2.5rem' }}>👔</span>
                                    </div>
                                    <h5 style={{ color: '#003366' }}>Senior Examiner</h5>
                                    <p className="small text-muted mb-4">
                                        Oversee application pipeline, delegate tasks, and monitor examiner workloads.
                                    </p>
                                    <Button variant="outline-warning" className="w-100 mt-auto" style={{ borderColor: '#D4AF37', color: '#856404' }}>
                                        {loadingRole === 'senior_be' ? <Spinner animation="border" size="sm" /> : 'Login as Senior BE'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col md={4}>
                            <Card className="h-100 text-center border-0 shadow-sm grow-hover" onClick={() => handleRoleClick('examiner')} style={{ cursor: 'pointer', transition: 'all 0.3s' }}>
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

            {/* Examiner Login Modal */}
            <Modal show={showExaminerLogin} onHide={() => setShowExaminerLogin(false)} centered>
                <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #003366 0%, #004488 100%)', color: 'white' }}>
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <span>🕵️‍♂️</span> Bank Examiner Login
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {examinerError && <Alert variant="danger" className="mb-3">{examinerError}</Alert>}
                    <p className="text-muted small mb-3">
                        Enter the credentials provided by the Senior Bank Examiner.
                    </p>
                    <Form onSubmit={handleExaminerLogin}>
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small text-uppercase">Username</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your username"
                                value={examinerUsername}
                                onChange={(e) => setExaminerUsername(e.target.value)}
                                autoFocus
                                className="border-2"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold small text-uppercase">Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter your password"
                                value={examinerPassword}
                                onChange={(e) => setExaminerPassword(e.target.value)}
                                className="border-2"
                            />
                        </Form.Group>
                        <Button type="submit" className="w-100 fw-bold py-2" style={{ backgroundColor: '#28a745', border: 'none' }} disabled={examinerLoading}>
                            {examinerLoading ? <Spinner animation="border" size="sm" /> : '🔐 Sign In'}
                        </Button>
                    </Form>
                    <div className="mt-3 p-3 bg-light rounded small text-muted">
                        <strong>Note:</strong> Login credentials are created by the Senior Bank Examiner. Contact your supervisor if you don't have an account.
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default LoginSelection;
