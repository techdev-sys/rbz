import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Form, Modal, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { getApplicationsByStatus, assignApplication, getPendingReviewReports, reviewReport, recommendReport, approveReport, getCompanyProfile, getExaminers, createExaminer, deleteExaminer, updateExaminer, generateLicenseCode } from '../services/api';

const DashboardSenior = ({ onLogout, onReviewApp }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [examinerName, setExaminerName] = useState('');

    // Report review state
    const [pendingReports, setPendingReports] = useState([]);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [selectedReportCompany, setSelectedReportCompany] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const seniorName = localStorage.getItem('examinerUsername') || 'Deputy Director';

    // Tab state
    const [activeTab, setActiveTab] = useState('pipeline');
    const [pipelineFilter, setPipelineFilter] = useState('all');

    // Examiner management state
    const [examiners, setExaminers] = useState([]);
    const [examinersLoading, setExaminersLoading] = useState(false);
    const [showCreateExaminer, setShowCreateExaminer] = useState(false);
    const [newExaminer, setNewExaminer] = useState({
        fullName: '', username: '', password: '', email: '', role: 'EXAMINER'
    });
    const [createLoading, setCreateLoading] = useState(false);
    const [createSuccess, setCreateSuccess] = useState(null);
    const [createError, setCreateError] = useState(null);

    // License code state
    const [licenseLoading, setLicenseLoading] = useState({});

    // Confirmation modal state (for deactivate/reactivate)
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null, examiner: null, loading: false, result: null });

    useEffect(() => {
        loadApplications();
        loadPendingReports();
        loadExaminers();
    }, []);

    const loadApplications = async () => {
        setLoading(true);
        try {
            const submitted = await getApplicationsByStatus('SUBMITTED');
            const assigned = await getApplicationsByStatus('ASSIGNED');
            const draft = await getApplicationsByStatus('DRAFT');
            const approved = await getApplicationsByStatus('APPROVED');
            const rejected = await getApplicationsByStatus('REJECTED');
            const all = [
                ...(submitted.data || []),
                ...(assigned.data || []),
                ...(draft.data || []),
                ...(approved.data || []),
                ...(rejected.data || [])
            ];
            all.sort((a, b) => b.id - a.id);
            setApplications(all);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPendingReports = async () => {
        setReportsLoading(true);
        try {
            const response = await getPendingReviewReports();
            setPendingReports(response.data || []);
        } catch (err) {
            console.error('Failed to load pending reports', err);
        } finally {
            setReportsLoading(false);
        }
    };

    const loadExaminers = async () => {
        setExaminersLoading(true);
        try {
            const response = await getExaminers();
            setExaminers(response.data || []);
            if (response.data && response.data.length > 0 && !examinerName) {
                setExaminerName(response.data[0].fullName);
            }
        } catch (err) {
            console.error('Failed to load examiners', err);
        } finally {
            setExaminersLoading(false);
        }
    };

    const handleAssignClick = (app) => {
        setSelectedApp(app);
        setShowAssignModal(true);
    };

    const performAssignment = async () => {
        if (!selectedApp || !examinerName) return;
        try {
            await assignApplication(selectedApp.id, examinerName);
            alert(`Application delegated to ${examinerName}`);
            setShowAssignModal(false);
            loadApplications();
            loadExaminers();
        } catch (err) {
            alert('Failed to assign: ' + err.message);
        }
    };

    const handleViewReport = async (report) => {
        setSelectedReport(report);
        setApprovalComments('');
        try {
            const companyRes = await getCompanyProfile(report.companyId);
            setSelectedReportCompany(companyRes.data);
        } catch (err) {
            setSelectedReportCompany(null);
        }
        setShowReportModal(true);
    };

    const handleReportAction = async (action) => {
        if (!selectedReport) return;
        setActionLoading(true);
        try {
            if (action === 'REVIEW') {
                await reviewReport(selectedReport.companyId, {
                    reviewedBy: seniorName,
                    reviewedByDesignation: 'Deputy Director - Bank Supervision'
                });
                alert('Report marked as reviewed.');
            } else if (action === 'RECOMMEND') {
                await recommendReport(selectedReport.companyId, {
                    recommendedBy: seniorName,
                    recommendedByDesignation: 'Deputy Director - Bank Supervision'
                });
                alert('Report recommended for approval.');
            } else if (action === 'APPROVE') {
                await approveReport(selectedReport.companyId, {
                    finalApprovalStatus: 'APPROVED',
                    approvedBy: seniorName,
                    approvalComments: approvalComments || 'Approved'
                });
                alert('Application approved.');
            } else if (action === 'REJECT') {
                if (!approvalComments.trim()) {
                    alert('Please provide a reason for rejection.');
                    setActionLoading(false);
                    return;
                }
                await approveReport(selectedReport.companyId, {
                    finalApprovalStatus: 'REJECTED',
                    approvedBy: seniorName,
                    approvalComments: approvalComments
                });
                alert('Application rejected.');
            }
            setShowReportModal(false);
            loadPendingReports();
            loadApplications();
        } catch (err) {
            alert('Action failed: ' + (err.response?.data || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateExaminer = async () => {
        if (!newExaminer.fullName || !newExaminer.username || !newExaminer.password || !newExaminer.email) {
            setCreateError('Full name, username, password, and email are required');
            return;
        }
        setCreateLoading(true);
        setCreateError(null);
        setCreateSuccess(null);
        try {
            const response = await createExaminer({ ...newExaminer, createdBy: seniorName });
            const data = response.data;
            setCreateSuccess({
                message: `Examiner "${data.fullName}" created successfully.`,
                credentials: data.generatedCredentials,
                employeeId: data.employeeId
            });
            setNewExaminer({ fullName: '', username: '', password: '', email: '', role: 'EXAMINER' });
            loadExaminers();
        } catch (err) {
            setCreateError(err.response?.data || err.message || 'Failed to create examiner');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleDeactivateExaminer = (id, name) => {
        setConfirmModal({ show: true, action: 'deactivate', examiner: { id, name }, loading: false, result: null });
    };

    const handleReactivateExaminer = (id, name) => {
        setConfirmModal({ show: true, action: 'reactivate', examiner: { id, name }, loading: false, result: null });
    };

    const executeConfirmAction = async () => {
        const { action, examiner } = confirmModal;
        setConfirmModal(prev => ({ ...prev, loading: true }));
        try {
            if (action === 'deactivate') {
                await deleteExaminer(examiner.id);
            } else {
                await updateExaminer(examiner.id, { status: 'ACTIVE' });
            }
            setConfirmModal(prev => ({
                ...prev,
                loading: false,
                result: { success: true, message: `${examiner.name} has been ${action === 'deactivate' ? 'deactivated' : 'reactivated'} successfully.` }
            }));
            loadExaminers();
        } catch (err) {
            setConfirmModal(prev => ({
                ...prev,
                loading: false,
                result: { success: false, message: `Failed to ${action}: ${err.response?.data || err.message}` }
            }));
        }
    };

    const handleGenerateLicenseCode = async (app) => {
        setLicenseLoading(prev => ({ ...prev, [app.id]: true }));
        try {
            const response = await generateLicenseCode(app.id);
            const data = response.data;
            if (data.alreadyGenerated) {
                alert(`License already exists: ${data.licenseCode}`);
            } else {
                alert(`License generated: ${data.licenseCode}`);
            }
            loadApplications();
        } catch (err) {
            alert('Failed to generate license: ' + (err.response?.data || err.message));
        } finally {
            setLicenseLoading(prev => ({ ...prev, [app.id]: false }));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'DRAFT': return { color: '#666', bg: '#f0f0f0', label: 'Draft' };
            case 'SUBMITTED': return { color: '#003366', bg: '#e8edf2', label: 'Submitted' };
            case 'ASSIGNED': return { color: '#4a6f8a', bg: '#e3f0f7', label: 'Assigned' };
            case 'APPROVED': return { color: '#1a5c2e', bg: '#e8f5ec', label: 'Approved' };
            case 'REJECTED': return { color: '#8b1a1a', bg: '#fde8e8', label: 'Rejected' };
            default: return { color: '#555', bg: '#f0f0f0', label: status };
        }
    };

    const tabStyle = (tab) => ({
        padding: '10px 22px',
        border: 'none',
        background: activeTab === tab ? '#003366' : 'transparent',
        fontWeight: 600,
        fontSize: '0.82rem',
        color: activeTab === tab ? 'white' : '#555',
        borderRadius: activeTab === tab ? '4px 4px 0 0' : '0',
        cursor: 'pointer',
        transition: 'all 0.15s',
        letterSpacing: '0.2px'
    });

    const approvedApps = applications.filter(a => a.applicationStatus === 'APPROVED');

    return (
        <div style={{ background: '#f5f6f8', minHeight: '100vh' }}>
            {/* HEADER */}
            <div style={{ background: '#003366', borderBottom: '3px solid #c5a236' }}>
                <Container>
                    <div className="d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center gap-3">
                            <img src="/rbz-logo.png" alt="RBZ" style={{ height: '44px', background: 'white', padding: '4px', borderRadius: '4px' }} />
                            <div className="text-white">
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.3px' }}>Senior Examiner Dashboard</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Bank Supervision Division — Reserve Bank of Zimbabwe</div>
                            </div>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '6px', padding: '8px 16px', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>{seniorName}</div>
                                <div style={{ fontSize: '0.72rem', color: '#c5a236', fontWeight: 500 }}>Deputy Director — Bank Supervision</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>
                            <Button size="sm" variant="link" onClick={onLogout} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 500 }}>
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="py-4" style={{ maxWidth: '1100px' }}>
                {/* Summary counters — clickable, navigate to relevant tab/filter */}
                <div className="d-flex gap-4 mb-4">
                    {[
                        { label: 'Pending Review', value: applications.filter(a => a.applicationStatus === 'SUBMITTED').length, tab: 'pipeline', filter: 'pending' },
                        { label: 'Assigned', value: applications.filter(a => a.applicationStatus === 'ASSIGNED').length, tab: 'pipeline', filter: 'assigned' },
                        { label: 'Reports Awaiting', value: pendingReports.length, tab: 'reports', filter: null },
                        { label: 'Licenses Issued', value: applications.filter(a => a.applicationStatus === 'APPROVED').length, tab: 'licenses', filter: null }
                    ].map((stat, i) => {
                        const isActive = activeTab === stat.tab && (stat.filter === null || pipelineFilter === stat.filter);
                        return (
                            <div
                                key={i}
                                onClick={() => { setActiveTab(stat.tab); if (stat.filter) setPipelineFilter(stat.filter); }}
                                style={{
                                    padding: '16px 24px',
                                    background: isActive ? '#f0f4f8' : 'white',
                                    borderRadius: '6px',
                                    border: isActive ? '1px solid #003366' : '1px solid #e0e4e8',
                                    flex: 1,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#003366'; e.currentTarget.style.background = '#f0f4f8'; }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.borderColor = '#e0e4e8';
                                        e.currentTarget.style.background = 'white';
                                    }
                                }}
                            >
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: 600 }}>{stat.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#003366' }}>{stat.value}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Tabs */}
                <Card style={{ border: '1px solid #e0e4e8', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ borderBottom: '1px solid #e0e4e8', background: 'white', display: 'flex' }}>
                        <button style={tabStyle('pipeline')} onClick={() => setActiveTab('pipeline')}>Applications</button>
                        <button style={tabStyle('reports')} onClick={() => setActiveTab('reports')}>
                            Reports {pendingReports.length > 0 && <span style={{ background: '#c53030', color: 'white', borderRadius: '8px', padding: '1px 6px', fontSize: '0.65rem', marginLeft: '6px' }}>{pendingReports.length}</span>}
                        </button>
                        <button style={tabStyle('staff')} onClick={() => setActiveTab('staff')}>Examiners</button>
                        <button style={tabStyle('licenses')} onClick={() => setActiveTab('licenses')}>License Codes</button>
                    </div>

                    <div style={{ background: 'white' }}>
                        {/* ========== PIPELINE TAB ========== */}
                        {activeTab === 'pipeline' && (
                            <div>
                                {/* Filter pills */}
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e4e8', display: 'flex', gap: '8px' }}>
                                    {[
                                        { key: 'all', label: 'All' },
                                        { key: 'pending', label: 'Pending Review' },
                                        { key: 'assigned', label: 'Assigned' },
                                        { key: 'draft', label: 'Draft' }
                                    ].map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setPipelineFilter(f.key)}
                                            style={{
                                                padding: '4px 14px',
                                                borderRadius: '14px',
                                                border: pipelineFilter === f.key ? '1px solid #003366' : '1px solid #ddd',
                                                background: pipelineFilter === f.key ? '#003366' : 'transparent',
                                                color: pipelineFilter === f.key ? 'white' : '#666',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                {loading ? (
                                    <div className="text-center py-5">
                                        <Spinner animation="border" size="sm" style={{ color: '#003366' }} />
                                        <div className="mt-2" style={{ fontSize: '0.8rem', color: '#888' }}>Loading applications...</div>
                                    </div>
                                ) : applications.length === 0 ? (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No applications found</div>
                                    </div>
                                ) : (() => {
                                    const filtered = pipelineFilter === 'all' ? applications
                                        : pipelineFilter === 'pending' ? applications.filter(a => a.applicationStatus === 'SUBMITTED')
                                            : pipelineFilter === 'assigned' ? applications.filter(a => a.applicationStatus === 'ASSIGNED')
                                                : pipelineFilter === 'draft' ? applications.filter(a => a.applicationStatus === 'DRAFT')
                                                    : applications;
                                    return filtered.length === 0 ? (
                                        <div className="text-center py-5" style={{ color: '#888' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No {pipelineFilter} applications</div>
                                        </div>
                                    ) : (
                                        <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                                    {['Institution', 'License Type', 'Status', 'Assigned To', ''].map(h => (
                                                        <th key={h} style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filtered.map(app => {
                                                    const s = getStatusStyle(app.applicationStatus);
                                                    return (
                                                        <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{app.companyName}</div>
                                                                <div style={{ fontSize: '0.72rem', color: '#999' }}>Ref: {app.id}</div>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#555' }}>{app.licenseType || '—'}</td>
                                                            <td style={{ padding: '12px 16px' }}>
                                                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, color: s.color, background: s.bg }}>
                                                                    {s.label}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px 16px', color: '#555' }}>
                                                                {app.assignedExaminer || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Unassigned</span>}
                                                            </td>
                                                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                                <div className="d-flex gap-2 justify-content-end">
                                                                    {app.applicationStatus !== 'APPROVED' && app.applicationStatus !== 'REJECTED' && (
                                                                        <Button size="sm" onClick={() => handleAssignClick(app)}
                                                                            style={{ background: 'transparent', border: '1px solid #003366', color: '#003366', fontSize: '0.75rem', fontWeight: 500, padding: '4px 12px', borderRadius: '4px' }}>
                                                                            {app.assignedExaminer ? 'Re-assign' : 'Assign'}
                                                                        </Button>
                                                                    )}
                                                                    {onReviewApp && (
                                                                        <Button size="sm" onClick={() => onReviewApp(app)}
                                                                            style={{ background: '#003366', border: 'none', fontSize: '0.75rem', fontWeight: 500, padding: '4px 12px', borderRadius: '4px' }}>
                                                                            View
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </Table>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ========== REPORTS TAB ========== */}
                        {activeTab === 'reports' && (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>Evaluation Reports</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Reports submitted by examiners requiring your review</div>
                                    </div>
                                    <Button size="sm" variant="link" onClick={loadPendingReports} disabled={reportsLoading}
                                        style={{ color: '#003366', textDecoration: 'none', fontSize: '0.8rem' }}>
                                        {reportsLoading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                                    </Button>
                                </div>

                                {pendingReports.length === 0 ? (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No reports pending review</div>
                                    </div>
                                ) : (
                                    <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                                {['Company', 'Prepared By', 'Recommendation', 'Status', ''].map(h => (
                                                    <th key={h} style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingReports.map(report => (
                                                <tr key={report.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a1a' }}>#{report.companyId}</td>
                                                    <td style={{ padding: '12px 16px', color: '#555' }}>{report.preparedBy || 'N/A'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600,
                                                            color: report.recommendation === 'APPROVE' ? '#1a5c2e' : '#8b5e00',
                                                            background: report.recommendation === 'APPROVE' ? '#e8f5ec' : '#fef9e7'
                                                        }}>
                                                            {report.recommendation || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#555', fontSize: '0.8rem' }}>{report.workflowStatus}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        <Button size="sm" onClick={() => handleViewReport(report)}
                                                            style={{ background: '#003366', border: 'none', fontSize: '0.75rem', fontWeight: 500, padding: '4px 14px', borderRadius: '4px' }}>
                                                            Review
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </div>
                        )}

                        {/* ========== STAFF TAB ========== */}
                        {activeTab === 'staff' && (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>Bank Examiners</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Manage examiner accounts and credentials</div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button size="sm" variant="link" onClick={loadExaminers} disabled={examinersLoading}
                                            style={{ color: '#003366', textDecoration: 'none', fontSize: '0.8rem' }}>
                                            {examinersLoading ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                                        </Button>
                                        <Button size="sm" onClick={() => { setShowCreateExaminer(true); setCreateSuccess(null); setCreateError(null); }}
                                            style={{ background: '#003366', border: 'none', fontSize: '0.8rem', fontWeight: 500, padding: '5px 16px', borderRadius: '4px' }}>
                                            Create Examiner
                                        </Button>
                                    </div>
                                </div>

                                {examiners.length === 0 ? (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No examiners created yet</div>
                                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>Click "Create Examiner" to provision a new account</div>
                                    </div>
                                ) : (
                                    <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                                {['Employee ID', 'Name', 'Username', 'Email', 'Status', 'Workload', ''].map(h => (
                                                    <th key={h} style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {examiners.map(ex => (
                                                <tr key={ex.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#003366' }}>{ex.employeeId}</td>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a1a' }}>{ex.fullName}</td>
                                                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#555' }}>{ex.username}</td>
                                                    <td style={{ padding: '12px 16px', color: '#555', fontSize: '0.8rem' }}>{ex.email || '—'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '3px 10px', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600,
                                                            color: ex.status === 'ACTIVE' ? '#1a5c2e' : '#8b1a1a',
                                                            background: ex.status === 'ACTIVE' ? '#e8f5ec' : '#fde8e8'
                                                        }}>
                                                            {ex.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#555' }}>{ex.workload || 0}</td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        {ex.status === 'ACTIVE' ? (
                                                            <Button size="sm" variant="link" onClick={() => handleDeactivateExaminer(ex.id, ex.fullName)}
                                                                style={{ color: '#8b1a1a', textDecoration: 'none', fontSize: '0.75rem' }}>
                                                                Deactivate
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="link" onClick={() => handleReactivateExaminer(ex.id, ex.fullName)}
                                                                style={{ color: '#1a5c2e', textDecoration: 'none', fontSize: '0.75rem' }}>
                                                                Reactivate
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </div>
                        )}

                        {/* ========== LICENSES TAB ========== */}
                        {activeTab === 'licenses' && (
                            <div className="p-4">
                                <div className="mb-3">
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>License Codes</div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Generate and track license codes for approved applications</div>
                                </div>

                                {approvedApps.length === 0 ? (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No approved applications</div>
                                        <div style={{ fontSize: '0.75rem', color: '#aaa' }}>License codes can only be generated after approval</div>
                                    </div>
                                ) : (
                                    <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                                {['Institution', 'License Type', 'License Code', 'Granted', ''].map(h => (
                                                    <th key={h} style={{ fontWeight: 600, color: '#666', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '10px 16px' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {approvedApps.map(app => (
                                                <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1a1a1a' }}>{app.companyName}</td>
                                                    <td style={{ padding: '12px 16px', color: '#555' }}>{app.licenseType || '—'}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        {app.licenseNumber ? (
                                                            <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#003366', fontSize: '0.9rem' }}>{app.licenseNumber}</span>
                                                        ) : (
                                                            <span style={{ color: '#bbb', fontStyle: 'italic' }}>Not generated</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', color: '#555', fontSize: '0.8rem' }}>
                                                        {app.licenseGrantedDate ? new Date(app.licenseGrantedDate).toLocaleDateString() : '—'}
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        {!app.licenseNumber ? (
                                                            <Button size="sm" onClick={() => handleGenerateLicenseCode(app)} disabled={licenseLoading[app.id]}
                                                                style={{ background: '#003366', border: 'none', fontSize: '0.75rem', fontWeight: 500, padding: '4px 14px', borderRadius: '4px' }}>
                                                                {licenseLoading[app.id] ? <Spinner animation="border" size="sm" /> : 'Generate'}
                                                            </Button>
                                                        ) : (
                                                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1a5c2e', background: '#e8f5ec', padding: '3px 10px', borderRadius: '3px' }}>Issued</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                )}
                            </div>
                        )}
                    </div>
                </Card>
            </Container>

            {/* ASSIGN MODAL */}
            <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
                <Modal.Header closeButton style={{ background: '#003366', color: 'white', borderRadius: 0 }}>
                    <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Assign Application</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    <p style={{ fontSize: '0.85rem', color: '#555' }}>
                        Assign <strong>{selectedApp?.companyName}</strong> to an examiner for evaluation.
                    </p>
                    <Form.Group>
                        <Form.Label style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Select Examiner</Form.Label>
                        {examiners.filter(e => e.status === 'ACTIVE').length === 0 ? (
                            <div style={{ padding: '12px', background: '#fef9e7', border: '1px solid #f0e1a0', borderRadius: '4px', fontSize: '0.8rem', color: '#8b5e00' }}>
                                No active examiners. Create one in the Examiners tab first.
                            </div>
                        ) : (
                            <Form.Select value={examinerName} onChange={(e) => setExaminerName(e.target.value)} style={{ fontSize: '0.85rem' }}>
                                {examiners.filter(e => e.status === 'ACTIVE').map(ex => (
                                    <option key={ex.id} value={ex.fullName}>{ex.fullName} (Load: {ex.workload || 0})</option>
                                ))}
                            </Form.Select>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #e0e4e8' }}>
                    <Button variant="link" onClick={() => setShowAssignModal(false)} style={{ color: '#666', textDecoration: 'none' }}>Cancel</Button>
                    <Button onClick={performAssignment} disabled={!examinerName || examiners.filter(e => e.status === 'ACTIVE').length === 0}
                        style={{ background: '#003366', border: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        Confirm
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* CREATE EXAMINER MODAL */}
            <Modal show={showCreateExaminer} onHide={() => setShowCreateExaminer(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: '#003366', color: 'white', borderRadius: 0 }}>
                    <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Create Bank Examiner</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {createError && (
                        <div style={{ padding: '10px 14px', background: '#fde8e8', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '0.8rem', color: '#8b1a1a', marginBottom: '16px' }}>
                            {typeof createError === 'string' ? createError : JSON.stringify(createError)}
                        </div>
                    )}
                    {createSuccess && (
                        <div style={{ padding: '14px', background: '#e8f5ec', border: '1px solid #c3e6cb', borderRadius: '4px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a5c2e', marginBottom: '8px' }}>{createSuccess.message}</div>
                            <div style={{ padding: '10px', background: 'white', borderRadius: '4px', border: '1px solid #e0e4e8' }}>
                                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '6px' }}>Credentials — share with examiner</div>
                                <div style={{ fontSize: '0.8rem' }}>
                                    <span style={{ color: '#888' }}>ID:</span> <strong>{createSuccess.employeeId}</strong>
                                    <span style={{ color: '#888', marginLeft: '16px' }}>Username:</span> <strong>{createSuccess.credentials?.username}</strong>
                                    <span style={{ color: '#888', marginLeft: '16px' }}>Password:</span> <strong>{createSuccess.credentials?.password}</strong>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#888', marginTop: '6px' }}>The password will not be shown again.</div>
                        </div>
                    )}

                    <Row className="g-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Full Name *</Form.Label>
                                <Form.Control type="text" placeholder="e.g. P. T. Madamombe" value={newExaminer.fullName}
                                    onChange={(e) => setNewExaminer({ ...newExaminer, fullName: e.target.value })} style={{ fontSize: '0.85rem' }} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Username *</Form.Label>
                                <Form.Control type="text" placeholder="e.g. pmadamombe" value={newExaminer.username}
                                    onChange={(e) => setNewExaminer({ ...newExaminer, username: e.target.value })} style={{ fontSize: '0.85rem' }} />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Password *</Form.Label>
                                <Form.Control type="text" placeholder="Create a password" value={newExaminer.password}
                                    onChange={(e) => setNewExaminer({ ...newExaminer, password: e.target.value })} style={{ fontSize: '0.85rem' }} />
                                <Form.Text style={{ color: '#999', fontSize: '0.72rem' }}>Will be encrypted. Share the password with the examiner.</Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', color: '#666' }}>Email *</Form.Label>
                                <Form.Control type="email" placeholder="e.g. pmadamombe@rbz.co.zw" value={newExaminer.email}
                                    onChange={(e) => setNewExaminer({ ...newExaminer, email: e.target.value })} style={{ fontSize: '0.85rem' }} />
                                <Form.Text style={{ color: '#999', fontSize: '0.72rem' }}>Credentials and assignments will be sent to this email.</Form.Text>
                            </Form.Group>
                        </Col>
                    </Row>
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #e0e4e8' }}>
                    <Button variant="link" onClick={() => setShowCreateExaminer(false)} style={{ color: '#666', textDecoration: 'none' }}>Cancel</Button>
                    <Button onClick={handleCreateExaminer} disabled={createLoading}
                        style={{ background: '#003366', border: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        {createLoading ? <Spinner animation="border" size="sm" /> : 'Create Account'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* REPORT REVIEW MODAL */}
            <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" centered>
                <Modal.Header closeButton style={{ background: '#003366', color: 'white', borderRadius: 0 }}>
                    <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
                        Report Review {selectedReportCompany && <span style={{ opacity: 0.6, fontWeight: 400 }}>— {selectedReportCompany.companyName}</span>}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedReport && (
                        <>
                            <div style={{ background: '#fafbfc', border: '1px solid #e0e4e8', borderRadius: '6px', padding: '16px', marginBottom: '20px' }}>
                                <Row>
                                    <Col md={3}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Company</div>
                                        <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{selectedReportCompany?.companyName || `ID: ${selectedReport.companyId}`}</div>
                                    </Col>
                                    <Col md={3}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Prepared By</div>
                                        <div style={{ color: '#555' }}>{selectedReport.preparedBy || 'N/A'}</div>
                                    </Col>
                                    <Col md={3}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Recommendation</div>
                                        <div style={{ fontWeight: 600, color: selectedReport.recommendation === 'APPROVE' ? '#1a5c2e' : '#8b5e00' }}>
                                            {selectedReport.recommendation || 'Pending'}
                                        </div>
                                    </Col>
                                    <Col md={3}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600 }}>Status</div>
                                        <div style={{ color: '#555' }}>{selectedReport.workflowStatus}</div>
                                    </Col>
                                </Row>
                                {selectedReport.recommendationJustification && (
                                    <div style={{ marginTop: '12px', padding: '10px', background: 'white', borderRadius: '4px', border: '1px solid #e0e4e8' }}>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#888', fontWeight: 600, marginBottom: '4px' }}>Justification</div>
                                        <p className="mb-0" style={{ fontSize: '0.85rem', color: '#333' }}>{selectedReport.recommendationJustification}</p>
                                    </div>
                                )}
                            </div>

                            {selectedReport.generatedReportHTML && (
                                <div style={{ border: '1px solid #e0e4e8', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                                    <div style={{ padding: '10px 16px', background: '#fafbfc', borderBottom: '1px solid #e0e4e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a' }}>Report Preview</span>
                                        <Button size="sm" variant="link" style={{ color: '#003366', textDecoration: 'none', fontSize: '0.75rem' }}
                                            onClick={() => { const w = window.open('', '_blank'); w.document.write(selectedReport.generatedReportHTML); w.document.close(); }}>
                                            Open Full Screen
                                        </Button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflow: 'auto', padding: '16px' }}>
                                        <div dangerouslySetInnerHTML={{ __html: selectedReport.generatedReportHTML }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ border: '1px solid #e0e4e8', borderRadius: '6px', padding: '16px' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '12px' }}>Decision</div>
                                <Form.Group className="mb-3">
                                    <Form.Control as="textarea" rows={2} value={approvalComments}
                                        onChange={(e) => setApprovalComments(e.target.value)}
                                        placeholder="Comments or reason for decision..." style={{ fontSize: '0.85rem' }} />
                                </Form.Group>
                                <div className="d-flex gap-2 flex-wrap">
                                    {selectedReport.workflowStatus === 'SUBMITTED' && (
                                        <Button size="sm" onClick={() => handleReportAction('REVIEW')} disabled={actionLoading}
                                            style={{ background: 'transparent', border: '1px solid #003366', color: '#003366', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Mark Reviewed'}
                                        </Button>
                                    )}
                                    {(selectedReport.workflowStatus === 'SUBMITTED' || selectedReport.workflowStatus === 'UNDER_REVIEW') && (
                                        <Button size="sm" onClick={() => handleReportAction('RECOMMEND')} disabled={actionLoading}
                                            style={{ background: 'transparent', border: '1px solid #003366', color: '#003366', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Recommend'}
                                        </Button>
                                    )}
                                    <Button size="sm" onClick={() => handleReportAction('APPROVE')} disabled={actionLoading}
                                        style={{ background: '#1a5c2e', border: 'none', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                        {actionLoading ? <Spinner animation="border" size="sm" /> : 'Approve'}
                                    </Button>
                                    <Button size="sm" onClick={() => handleReportAction('REJECT')} disabled={actionLoading}
                                        style={{ background: '#8b1a1a', border: 'none', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                        {actionLoading ? <Spinner animation="border" size="sm" /> : 'Reject'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* DEACTIVATE / REACTIVATE CONFIRMATION MODAL */}
            <Modal show={confirmModal.show} onHide={() => setConfirmModal({ show: false, action: null, examiner: null, loading: false, result: null })} centered>
                <Modal.Header closeButton style={{ background: '#003366', color: 'white', borderRadius: 0 }}>
                    <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {confirmModal.action === 'deactivate' ? 'Deactivate Examiner' : 'Reactivate Examiner'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {confirmModal.result ? (
                        <div style={{
                            padding: '16px',
                            borderRadius: '6px',
                            background: confirmModal.result.success ? '#e8f5ec' : '#fde8e8',
                            border: `1px solid ${confirmModal.result.success ? '#c3e6cb' : '#f5c6c6'}`,
                            color: confirmModal.result.success ? '#1a5c2e' : '#8b1a1a'
                        }}>
                            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>
                                {confirmModal.result.success ? 'Success' : 'Error'}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>{confirmModal.result.message}</div>
                        </div>
                    ) : (
                        <div>
                            <p style={{ fontSize: '0.9rem', color: '#333' }}>
                                Are you sure you want to <strong>{confirmModal.action}</strong> examiner{' '}
                                <strong>{confirmModal.examiner?.name}</strong>?
                            </p>
                            {confirmModal.action === 'deactivate' && (
                                <div style={{ padding: '10px 14px', background: '#fef9e7', border: '1px solid #f0e1a0', borderRadius: '4px', fontSize: '0.8rem', color: '#8b5e00' }}>
                                    This examiner will no longer be able to log in or receive new assignments.
                                </div>
                            )}
                            {confirmModal.action === 'reactivate' && (
                                <div style={{ padding: '10px 14px', background: '#e8f5ec', border: '1px solid #c3e6cb', borderRadius: '4px', fontSize: '0.8rem', color: '#1a5c2e' }}>
                                    This examiner will be able to log in and receive assignments again.
                                </div>
                            )}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ borderTop: '1px solid #e0e4e8' }}>
                    {confirmModal.result ? (
                        <Button onClick={() => setConfirmModal({ show: false, action: null, examiner: null, loading: false, result: null })}
                            style={{ background: '#003366', border: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                            Close
                        </Button>
                    ) : (
                        <>
                            <Button variant="link" onClick={() => setConfirmModal({ show: false, action: null, examiner: null, loading: false, result: null })}
                                style={{ color: '#666', textDecoration: 'none' }}>
                                Cancel
                            </Button>
                            <Button onClick={executeConfirmAction} disabled={confirmModal.loading}
                                style={{
                                    background: confirmModal.action === 'deactivate' ? '#8b1a1a' : '#1a5c2e',
                                    border: 'none', fontSize: '0.85rem', fontWeight: 500
                                }}>
                                {confirmModal.loading ? <Spinner animation="border" size="sm" /> :
                                    confirmModal.action === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Reactivation'}
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default DashboardSenior;
