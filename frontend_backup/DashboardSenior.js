import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Modal } from 'react-bootstrap';
import { getApplicationsByStatus, assignApplication } from '../services/api';
import '../Premium.css'; // Import Premium Aesthetics

const DashboardSenior = ({ onLogout }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [examinerName, setExaminerName] = useState('P. T. Madamombe'); // Default for demo

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const submitted = await getApplicationsByStatus('SUBMITTED');
            const assigned = await getApplicationsByStatus('ASSIGNED');
            const draft = await getApplicationsByStatus('DRAFT');

            const all = [
                ...(submitted.data || []),
                ...(assigned.data || []),
                ...(draft.data || [])
            ];

            all.sort((a, b) => new Date(b.id) - new Date(a.id));
            setApplications(all);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignClick = (app) => {
        setSelectedApp(app);
        setShowAssignModal(true);
    };

    const performAssignment = async () => {
        if (!selectedApp) return;
        try {
            await assignApplication(selectedApp.id, examinerName);
            alert(`Application delegated to ${examinerName}`);
            setShowAssignModal(false);
            loadApplications();
        } catch (err) {
            alert('Failed to assign: ' + err.message);
        }
    };

    const [activeTab, setActiveTab] = useState('pipeline');
    const [examiners, setExaminers] = useState([
        { id: 'EX-2026-001', name: 'P. T. Madamombe', role: 'Principal Examiner', status: 'Active', workload: 4 },
        { id: 'EX-2026-002', name: 'S. K. Moyo', role: 'Senior Examiner', status: 'Active', workload: 2 },
        { id: 'EX-2026-003', name: 'R. J. Smith', role: 'Analyst', status: 'On Leave', workload: 0 }
    ]);
    const [newExaminerName, setNewExaminerName] = useState('');

    const handleCreateExaminer = () => {
        if (!newExaminerName) return;
        const newId = `EX-2026-${String(examiners.length + 1).padStart(3, '0')}`;
        const newExaminer = {
            id: newId,
            name: newExaminerName,
            role: 'Senior Examiner',
            status: 'Active',
            workload: 0
        };
        setExaminers([...examiners, newExaminer]);
        setNewExaminerName('');
    };

    return (
        <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '50px' }}>
            <div className="py-4 mb-4 text-white" style={{ background: 'var(--rbz-gradient)', borderBottom: '4px solid var(--rbz-gold)' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '60px', background: 'white', padding: '5px', borderRadius: '5px' }} />
                            <div>
                                <h2 className="fw-bold mb-0">Senior Bank Examiner Control</h2>
                                <p className="mb-0 text-white-50 small">Surveillance & Financial Stability Division</p>
                            </div>
                        </div>
                        <div className="text-end">
                            <Badge bg="warning" text="dark" className="mb-2">OFFICIAL USE ONLY</Badge>
                            <div><Button variant="outline-light" size="sm" onClick={onLogout}>Logout System</Button></div>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="animate-fade-in">
                <div className="dashboard-stats mb-4">
                    <div className="stat-item premium-card border-0">
                        <div className="stat-label">Pending Review</div>
                        <div className="stat-value text-primary">{applications.filter(a => a.applicationStatus === 'SUBMITTED').length}</div>
                        <small className="text-muted">Awaiting Delegation</small>
                    </div>
                    <div className="stat-item premium-card border-0">
                        <div className="stat-label">Currently Assigned</div>
                        <div className="stat-value text-info">{applications.filter(a => a.applicationStatus === 'ASSIGNED').length}</div>
                        <small className="text-muted">In Assessment</small>
                    </div>
                    <div className="stat-item premium-card border-0">
                        <div className="stat-label">System Performance</div>
                        <div className="stat-value text-success">98%</div>
                        <small className="text-muted">SLA Compliance</small>
                    </div>
                    <div className="stat-item premium-card border-0">
                        <div className="stat-label">AI Learning Status</div>
                        <div className="stat-value text-warning">ACTIVE</div>
                        <small className="text-muted">Observing Trends</small>
                    </div>
                </div>

                <Card className="premium-card border-0 shadow-sm overflow-hidden">
                    <Card.Header className="p-0 border-0">
                        <div className="d-flex border-bottom">
                            <button
                                className={`px-4 py-3 border-0 bg-transparent fw-bold ${activeTab === 'pipeline' ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'}`}
                                onClick={() => setActiveTab('pipeline')}
                            >
                                📑 Application Pipeline
                            </button>
                            <button
                                className={`px-4 py-3 border-0 bg-transparent fw-bold ${activeTab === 'staff' ? 'text-primary border-bottom border-3 border-primary' : 'text-muted'}`}
                                onClick={() => setActiveTab('staff')}
                            >
                                👥 Staff Resources
                            </button>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-4">
                        {loading ? <div className="text-center py-5">Syncing with Central Database...</div> : (
                            activeTab === 'pipeline' ? (
                                <Table hover responsive className="align-middle premium-table">
                                    <thead>
                                        <tr className="text-muted small">
                                            <th>INSTITUTION</th>
                                            <th>LICENSE TYPE</th>
                                            <th>SUBMISSION DATE</th>
                                            <th className="text-center">STATUS</th>
                                            <th>ASSIGNEE</th>
                                            <th className="text-end">ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map(app => (
                                            <tr key={app.id}>
                                                <td className="fw-bold fs-5" style={{ color: 'var(--rbz-navy)' }}>{app.companyName}</td>
                                                <td><Badge bg="light" text="dark" className="border">{app.licenseType}</Badge></td>
                                                <td><small className="text-muted">{app.applicationDate || 'TBD'}</small></td>
                                                <td className="text-center">
                                                    <Badge className={`status-badge ${app.applicationStatus === 'SUBMITTED' ? 'bg-primary' : app.applicationStatus === 'ASSIGNED' ? 'bg-info' : 'bg-secondary'}`}>
                                                        {app.applicationStatus}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    {app.assignedExaminer ? (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                                            {app.assignedExaminer}
                                                        </div>
                                                    ) : <span className="text-muted fst-italic">Unassigned</span>}
                                                </td>
                                                <td className="text-end">
                                                    <Button size="sm" className="premium-button-gold px-3" onClick={() => handleAssignClick(app)}>
                                                        {app.applicationStatus === 'SUBMITTED' ? 'Delegate' : 'Re-assign'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h5 className="fw-bold mb-0">Bank Examiner Directory</h5>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                placeholder="Enter examiner name..."
                                                value={newExaminerName}
                                                onChange={(e) => setNewExaminerName(e.target.value)}
                                                style={{ width: '250px' }}
                                            />
                                            <Button variant="success" onClick={handleCreateExaminer}>+ Provision Access</Button>
                                        </div>
                                    </div>
                                    <Table bordered hover className="premium-table">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>EX-ID</th>
                                                <th>NAME / RANK</th>
                                                <th>STATUS</th>
                                                <th>UTILIZATION</th>
                                                <th>ACTIONS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examiners.map(ex => (
                                                <tr key={ex.id}>
                                                    <td><code>{ex.id}</code></td>
                                                    <td><strong>{ex.name}</strong><br /><small>{ex.role}</small></td>
                                                    <td><Badge bg={ex.status === 'Active' ? 'success' : 'secondary'}>{ex.status}</Badge></td>
                                                    <td style={{ width: '200px' }}>
                                                        <div className="p-1">
                                                            <div className="small mb-1">Load: {ex.workload}/6</div>
                                                            <div className="progress" style={{ height: '5px' }}>
                                                                <div className="progress-bar" style={{ width: `${(ex.workload / 6) * 100}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td><Button size="sm" variant="outline-dark">Reports</Button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            )
                        )}
                    </Card.Body>
                </Card>
            </Container>

            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered size="md">
                <Modal.Header closeButton style={{ background: 'var(--rbz-gradient)', color: 'white' }}>
                    <Modal.Title>Workflow Delegation</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p>Assign case <strong>{selectedApp?.companyName}</strong> to an examiner for comprehensive regulatory assessment.</p>
                    <Form.Group>
                        <Form.Label className="fw-bold small text-uppercase">Select Authorized Examiner</Form.Label>
                        <Form.Select
                            value={examinerName}
                            onChange={(e) => setExaminerName(e.target.value)}
                            className="form-control-lg border-2"
                        >
                            {examiners.map(ex => (
                                <option key={ex.id} value={ex.name}>{ex.name} (Active Load: {ex.workload})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <div className="mt-4 p-3 bg-light rounded small">
                        <strong>Note:</strong> Assignment will notify the examiner immediately and enable AI collaboration tools for their assessment.
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0 p-4">
                    <Button variant="light" onClick={() => setShowAssignModal(false)} className="px-4">Cancel</Button>
                    <Button className="premium-button px-5" onClick={performAssignment}>Confirm Delegation</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DashboardSenior;
