import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Spinner, Modal, Form, Row, Col } from 'react-bootstrap';
import { getAssignedApplications } from '../services/api';

const DashboardExaminer = ({ onLogout, onReviewApp }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const examinerName = localStorage.getItem('examinerUsername') || 'Examiner';
    const examinerDesignation = localStorage.getItem('examinerDesignation') || 'Bank Examiner';

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

    const getStatusStyle = (status) => {
        switch (status) {
            case 'ASSIGNED': return { color: '#003366', bg: '#e8edf2', label: 'Assigned' };
            case 'UNDER_REVIEW': return { color: '#6b5900', bg: '#fef9e7', label: 'Under Review' };
            case 'APPROVED': return { color: '#1a5c2e', bg: '#e8f5ec', label: 'Approved' };
            case 'REJECTED': return { color: '#8b1a1a', bg: '#fde8e8', label: 'Rejected' };
            default: return { color: '#555', bg: '#f0f0f0', label: status || 'Pending' };
        }
    };

    return (
        <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
            {/* HEADER — clean, flat, institutional */}
            <div style={{ background: '#003366', borderBottom: '3px solid #c5a236' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '44px', background: 'white', padding: '4px', borderRadius: '4px' }} />
                            <div className="text-white">
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.3px' }}>Bank Examiner Dashboard</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Microfinance Licensing — Reserve Bank of Zimbabwe</div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-4">
                            <div className="text-white text-end">
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{examinerName}</div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{examinerDesignation}</div>
                            </div>
                            <Button
                                size="sm"
                                variant="link"
                                onClick={onLogout}
                                style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.8rem' }}
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="py-4" style={{ maxWidth: '1100px' }}>
                {/* Summary strip */}
                <div className="d-flex gap-4 mb-4">
                    <div style={{ padding: '16px 24px', background: 'white', borderRadius: '6px', border: '1px solid #e0e4e8', flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: 600 }}>Assigned to You</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#003366' }}>{applications.length}</div>
                    </div>
                    <div style={{ padding: '16px 24px', background: 'white', borderRadius: '6px', border: '1px solid #e0e4e8', flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: 600 }}>Pending Review</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#003366' }}>
                            {applications.filter(a => a.applicationStatus === 'ASSIGNED').length}
                        </div>
                    </div>
                    <div style={{ padding: '16px 24px', background: 'white', borderRadius: '6px', border: '1px solid #e0e4e8', flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: 600 }}>Completed</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#003366' }}>
                            {applications.filter(a => a.applicationStatus === 'APPROVED' || a.applicationStatus === 'REJECTED').length}
                        </div>
                    </div>
                </div>

                {/* Main work queue */}
                <Card style={{ border: '1px solid #e0e4e8', borderRadius: '6px', overflow: 'hidden' }}>
                    <Card.Header style={{ background: 'white', borderBottom: '1px solid #e0e4e8', padding: '16px 20px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>Assigned Applications</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>Applications delegated to you for evaluation</div>
                            </div>
                            <Button
                                size="sm"
                                variant="link"
                                onClick={loadAssignedTasks}
                                disabled={loading}
                                style={{ color: '#003366', textDecoration: 'none', fontSize: '0.8rem' }}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                            </Button>
                        </div>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" size="sm" style={{ color: '#003366' }} />
                                <div className="mt-2" style={{ fontSize: '0.8rem', color: '#888' }}>Loading assignments...</div>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="text-center py-5">
                                <div style={{ fontSize: '0.9rem', color: '#888', fontWeight: 500 }}>No applications assigned</div>
                                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Check back later or contact the Senior Examiner</div>
                            </div>
                        ) : (
                            <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                        <th style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 20px' }}>Institution</th>
                                        <th style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>License Type</th>
                                        <th style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>Stage</th>
                                        <th style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>Status</th>
                                        <th style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px', textAlign: 'right' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => {
                                        const statusStyle = getStatusStyle(app.applicationStatus);
                                        return (
                                            <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '14px 20px' }}>
                                                    <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{app.companyName}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#999' }}>Ref: {app.id}</div>
                                                </td>
                                                <td style={{ padding: '14px 16px', color: '#555' }}>{app.licenseType || '—'}</td>
                                                <td style={{ padding: '14px 16px', color: '#555' }}>
                                                    {app.workflowStage || 'Document Intake'}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '3px 10px',
                                                        borderRadius: '3px',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 600,
                                                        color: statusStyle.color,
                                                        background: statusStyle.bg
                                                    }}>
                                                        {statusStyle.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onReviewApp(app)}
                                                        style={{
                                                            background: '#003366',
                                                            border: 'none',
                                                            fontSize: '0.78rem',
                                                            fontWeight: 500,
                                                            padding: '5px 16px',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default DashboardExaminer;
