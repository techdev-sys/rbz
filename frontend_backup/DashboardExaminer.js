import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Row, Col, Alert } from 'react-bootstrap';
import { getAssignedApplications } from '../services/api';
import ApplicationChat from './ApplicationChat';
import '../Premium.css';

const DashboardExaminer = ({ onLogout, onReviewApp }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const examinerName = "P. T. Madamombe"; // Simulation of logged in examiner

    useEffect(() => {
        loadAssignedTasks();
    }, []);

    const loadAssignedTasks = async () => {
        setLoading(true);
        try {
            const response = await getAssignedApplications(examinerName);
            setApplications(response.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ background: '#f4f7f6', minHeight: '100vh', paddingBottom: '50px' }}>
            <div className="py-4 mb-4 text-white" style={{ background: 'var(--rbz-gradient)', borderBottom: '4px solid var(--rbz-gold)' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '60px', background: 'white', padding: '5px', borderRadius: '5px' }} />
                            <div>
                                <h2 className="fw-bold mb-0">Bank Examiner Console</h2>
                                <p className="mb-0 text-white-50 small">Regulatory Assessment & Supervision</p>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className="small mb-1">Examiner: <strong>{examinerName}</strong></div>
                            <Button variant="outline-light" size="sm" onClick={onLogout} className="rounded-pill px-4">Exit System</Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="animate-fade-in">
                <Row className="mb-4">
                    <Col md={8}>
                        <h4 className="fw-bold mb-3" style={{ color: 'var(--rbz-navy)' }}>
                            Active Evaluation Backlog
                            <Badge bg="primary" className="ms-2 status-badge">{applications.length} Assigned</Badge>
                        </h4>

                        <Card className="premium-card border-0 shadow-sm">
                            <Card.Body className="p-0">
                                {loading ? (
                                    <div className="text-center py-5">Decrypting assigned cases...</div>
                                ) : applications.length === 0 ? (
                                    <Alert variant="info" className="m-4 text-center">
                                        <div className="fs-1 mb-3">✅</div>
                                        <h5>Queue Clear</h5>
                                        <p className="mb-0">You have no pending applications for review.</p>
                                    </Alert>
                                ) : (
                                    <Table hover responsive className="mb-0 premium-table align-middle">
                                        <thead className="bg-light">
                                            <tr className="small text-uppercase text-muted">
                                                <th className="ps-4">Institution Name</th>
                                                <th>License Type</th>
                                                <th>Received On</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map(app => (
                                                <tr key={app.id}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold fs-6">{app.companyName}</div>
                                                        <small className="text-muted">ID: {app.id}</small>
                                                    </td>
                                                    <td><Badge bg="secondary" className="status-badge">{app.licenseType}</Badge></td>
                                                    <td className="text-muted small">{app.applicationDate || 'Oct 2025'}</td>
                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            className="premium-button border-0 px-3"
                                                            onClick={() => onReviewApp(app)}
                                                        >
                                                            Conduct Review
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <h4 className="fw-bold mb-3" style={{ color: 'var(--rbz-navy)' }}>Regulatory AI</h4>
                        <Card className="premium-card border-0 bg-white mb-4">
                            <Card.Body>
                                <div className="d-flex align-items-start gap-3 mb-3">
                                    <div className="bg-primary text-white rounded p-2" style={{ fontSize: '1.2rem' }}>🎓</div>
                                    <div>
                                        <h6 className="fw-bold mb-1">Learning in Progress</h6>
                                        <p className="small text-muted mb-0">The system is learning from your assessment patterns to improve future report generations.</p>
                                    </div>
                                </div>
                                <div className="progress mb-2" style={{ height: '8px' }}>
                                    <div className="progress-bar progress-bar-striped progress-bar-animated bg-warning" style={{ width: '65%' }}></div>
                                </div>
                                <div className="d-flex justify-content-between small text-muted">
                                    <span>Model Training</span>
                                    <span>65% Calibrated</span>
                                </div>
                            </Card.Body>
                        </Card>

                        <div className="p-3 bg-light rounded border border-warning">
                            <h6 className="fw-bold text-warning-emphasis mb-2">⚠️ Regulatory Note</h6>
                            <p className="small mb-0">Ensure all documents are downloaded and verified against original KYC protocols before final report generation. Copy/paste is enabled for external documentation.</p>
                        </div>
                    </Col>
                </Row>

                {/* Collaboration Workspace */}
                <h4 className="fw-bold mt-5 mb-3" style={{ color: 'var(--rbz-navy)' }}>Secure Collaboration</h4>
                <Row>
                    <Col md={12}>
                        <Card className="premium-card border-0 bg-white p-4 text-center">
                            <div className="text-muted">
                                <p>Select an application to open the <strong>Secure Chat</strong> with the applicant.</p>
                                {applications.length > 0 && <p className="mb-0">Case <code>{applications[0].companyName}</code> chat is active.</p>}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {applications.length > 0 && (
                    <ApplicationChat
                        companyId={applications[0].id}
                        currentUserRole="examiner"
                        userName={examinerName}
                    />
                )}
            </Container>
        </div>
    );
};

export default DashboardExaminer;
