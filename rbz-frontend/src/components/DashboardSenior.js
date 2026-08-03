import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Row, Col, Spinner } from 'react-bootstrap';
import { getApplicationsByStatus, assignApplication, getPendingReviewReports, reviewReport, recommendReport, approveReport, directorSignReport, governorSignReport, getCompanyProfile, getExaminers, createExaminer, deleteExaminer, updateExaminer, generateLicenseCode, getLicenseLifecycleDashboard, renewLicense, verifyAuditIntegrity, friendlyError } from '../services/api';
import './DashboardSenior.css';

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
    const [activeTab, setActiveTab] = useState('overview');
    const [pipelineFilter, setPipelineFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

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

    // License lifecycle state
    const [lifecycleDashboard, setLifecycleDashboard] = useState(null);
    const [lifecycleLoading, setLifecycleLoading] = useState(false);
    const [renewingId, setRenewingId] = useState(null);

    // Audit integrity state
    const [auditResult, setAuditResult] = useState(null);
    const [auditLoading, setAuditLoading] = useState(false);

    // Confirmation modal state (for deactivate/reactivate)
    const [confirmModal, setConfirmModal] = useState({ show: false, action: null, examiner: null, loading: false, result: null });

    useEffect(() => {
        loadApplications();
        loadPendingReports();
        loadExaminers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadLifecycleDashboard = async () => {
        setLifecycleLoading(true);
        try {
            const res = await getLicenseLifecycleDashboard();
            setLifecycleDashboard(res.data);
        } catch (err) {
            console.error('Failed to load lifecycle dashboard', err);
        } finally {
            setLifecycleLoading(false);
        }
    };

    const handleRenewLicense = async (companyId) => {
        setRenewingId(companyId);
        try {
            await renewLicense(companyId, seniorName);
            await loadLifecycleDashboard();
        } catch (err) {
            alert(friendlyError(err, 'Renewal failed. Please try again.'));
        } finally {
            setRenewingId(null);
        }
    };

    const handleVerifyAudit = async () => {
        setAuditLoading(true);
        try {
            const res = await verifyAuditIntegrity();
            setAuditResult(res.data);
        } catch (err) {
            console.error('Audit verification failed', err);
        } finally {
            setAuditLoading(false);
        }
    };

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
            alert(friendlyError(err, 'Failed to assign the application. Please try again.'));
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

    const approvalChainLabel = (report) => {
        const levels = report?.approvalLevelsRequired;
        if (levels === 5) return 'Bank (5-level: Examiner → Senior → Recommend → Director → Governor → Registrar)';
        if (levels === 4) return 'DTMFI (4-level: Examiner → Senior → Recommend → Director → Registrar)';
        return 'MFI (3-level: Examiner → Senior → Recommend → Registrar)';
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
                const nextMsg = (selectedReport.approvalLevelsRequired || 3) <= 3
                    ? 'Report recommended — ready for Registrar approval.'
                    : 'Report recommended — awaiting Director sign-off.';
                alert(nextMsg);
            } else if (action === 'DIRECTOR_SIGN') {
                await directorSignReport(selectedReport.companyId, {
                    directorSignedBy: seniorName,
                    directorSignedByDesignation: 'Director - Bank Supervision',
                    directorComments: approvalComments || 'Reviewed and signed'
                });
                const nextMsg = (selectedReport.approvalLevelsRequired || 4) >= 5
                    ? 'Director sign-off recorded — awaiting Governor approval.'
                    : 'Director sign-off recorded — ready for Registrar approval.';
                alert(nextMsg);
            } else if (action === 'GOVERNOR_SIGN') {
                await governorSignReport(selectedReport.companyId, {
                    governorSignedBy: seniorName,
                    governorSignedByDesignation: 'Deputy Governor - Financial Stability',
                    governorComments: approvalComments || 'Reviewed and signed by Governor'
                });
                alert('Governor sign-off recorded — ready for Registrar final approval.');
            } else if (action === 'APPROVE') {
                await approveReport(selectedReport.companyId, {
                    finalApprovalStatus: 'APPROVED',
                    approvedBy: seniorName,
                    approvedByDesignation: 'Registrar of Banks and Financial Institutions',
                    approvalComments: approvalComments || 'Approved'
                });
                alert('Application approved. License number generated.');
            } else if (action === 'REJECT') {
                if (!approvalComments.trim()) {
                    alert('Please provide a reason for rejection.');
                    setActionLoading(false);
                    return;
                }
                await approveReport(selectedReport.companyId, {
                    finalApprovalStatus: 'REJECTED',
                    approvedBy: seniorName,
                    approvedByDesignation: 'Registrar of Banks and Financial Institutions',
                    approvalComments: approvalComments
                });
                alert('Application rejected.');
            }
            setShowReportModal(false);
            loadPendingReports();
            loadApplications();
        } catch (err) {
            alert(friendlyError(err, 'The action could not be completed. Please try again.'));
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
            setCreateError(friendlyError(err, 'Failed to create the examiner account. Please try again.'));
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
                result: { success: false, message: friendlyError(err, `Failed to ${action}. Please try again.`) }
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
            alert(friendlyError(err, 'Failed to generate the licence number. Please try again.'));
        } finally {
            setLicenseLoading(prev => ({ ...prev, [app.id]: false }));
        }
    };

    const INST_BADGE = {
        COMMERCIAL_BANK: { label: 'Commercial Bank', bg: '#c5a236', color: '#fff' },
        DTMFI: { label: 'DTMFI', bg: '#1a6b8a', color: '#fff' },
        MFI: { label: 'MFI', bg: '#4a7a4e', color: '#fff' },
    };
    const instBadge = (institutionType, licenseType) => {
        let type = institutionType;
        if (!type) type = (licenseType || '').toLowerCase().includes('deposit') ? 'DTMFI' : 'MFI';
        const cfg = INST_BADGE[type] || INST_BADGE.MFI;
        return (
            <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 700, background: cfg.bg, color: cfg.color, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                {cfg.label}
            </span>
        );
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
    const submittedApps = applications.filter(a => a.applicationStatus === 'SUBMITTED');
    const assignedApps = applications.filter(a => a.applicationStatus === 'ASSIGNED');
    const unassignedApps = submittedApps.filter(a => !a.assignedExaminer);
    const activeExaminers = examiners.filter(e => e.status === 'ACTIVE' && e.role !== 'SENIOR_BE' && e.role !== 'SENIOR_EXAMINER');
    const totalWorkload = activeExaminers.reduce((sum, examiner) => sum + Number(examiner.workload || 0), 0);
    const averageWorkload = activeExaminers.length ? (totalWorkload / activeExaminers.length).toFixed(1) : '0.0';
    const priorityApplications = [...submittedApps, ...assignedApps].slice(0, 6);

    return (
        <div className="sbe-workspace">
            {/* HEADER */}
            <header className="sbe-header">
                <div className="sbe-header-inner">
                    <div className="sbe-header-row">
                        <div className="sbe-brand">
                            <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="sbe-logo" />
                            <div>
                                <div className="sbe-brand-title">Senior Bank Examiner</div>
                                <div className="sbe-brand-subtitle">Banking Supervision, Surveillance &amp; Financial Stability</div>
                            </div>
                        </div>
                        <div className="sbe-user-actions">
                            <div className="sbe-user-card">
                                <div>{seniorName}</div>
                                <small>Senior supervisory authority</small>
                            </div>
                            <button className="sbe-signout" onClick={onLogout}>Sign Out</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="sbe-main">
                <div className="sbe-page-intro">
                    <div>
                        <div className="sbe-kicker">Supervisory control centre</div>
                        <h1>Institution licensing oversight</h1>
                        <p>Portfolio supervision, examiner allocation and decision governance.</p>
                    </div>
                    <div className="sbe-asof"><span>Operational status</span><strong>{loading ? 'Synchronising' : 'Current'}</strong><small>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</small></div>
                </div>

                {/* Summary counters — clickable, navigate to relevant tab/filter */}
                <div className="sbe-summary-grid">
                    {[
                        { code: '01', label: 'Unassigned cases', value: unassignedApps.length, note: 'Require examiner allocation', tab: 'pipeline', filter: 'pending' },
                        { code: '02', label: 'Active examinations', value: assignedApps.length, note: 'Currently under assessment', tab: 'pipeline', filter: 'assigned' },
                        { code: '03', label: 'Decision queue', value: pendingReports.length, note: 'Reports awaiting authority', tab: 'reports', filter: null },
                        { code: '04', label: 'Licences issued', value: approvedApps.length, note: 'Approved institutional files', tab: 'licenses', filter: null }
                    ].map((stat, i) => {
                        const isActive = activeTab === stat.tab && (stat.filter === null || pipelineFilter === stat.filter);
                        return (
                            <button
                                key={i}
                                className={`sbe-summary-card${isActive ? ' active' : ''}`}
                                onClick={() => { setActiveTab(stat.tab); if (stat.filter) setPipelineFilter(stat.filter); }}
                            >
                                <span className="sbe-summary-code">{stat.code}</span>
                                <span className="sbe-summary-label">{stat.label}</span>
                                <strong>{stat.value}</strong>
                                <small>{stat.note}</small>
                            </button>
                        );
                    })}
                </div>

                {/* Tabs */}
                <Card className="sbe-console">
                    <div className="sbe-tabs">
                        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
                        <button style={tabStyle('pipeline')} onClick={() => setActiveTab('pipeline')}>Applications</button>
                        <button style={tabStyle('reports')} onClick={() => setActiveTab('reports')}>
                            Reports {pendingReports.length > 0 && <span style={{ background: '#c53030', color: 'white', borderRadius: '8px', padding: '1px 6px', fontSize: '0.65rem', marginLeft: '6px' }}>{pendingReports.length}</span>}
                        </button>
                        <button style={tabStyle('staff')} onClick={() => setActiveTab('staff')}>Examiners</button>
                        <button style={tabStyle('licenses')} onClick={() => setActiveTab('licenses')}>License Codes</button>
                        <button style={tabStyle('lifecycle')} onClick={() => { setActiveTab('lifecycle'); if (!lifecycleDashboard) loadLifecycleDashboard(); }}>License Lifecycle</button>
                        <button style={tabStyle('audit')} onClick={() => setActiveTab('audit')}>Audit Log</button>
                    </div>

                    <div className="sbe-console-body">
                        {activeTab === 'overview' && (
                            <div className="sbe-overview">
                                <section className="sbe-priority-panel">
                                    <div className="sbe-section-heading">
                                        <div><span>Priority register</span><h2>Cases requiring supervisory attention</h2></div>
                                        <button onClick={() => { setActiveTab('pipeline'); setPipelineFilter('pending'); }}>Open application register</button>
                                    </div>
                                    {priorityApplications.length === 0 ? (
                                        <div className="sbe-empty-state"><strong>No immediate case actions</strong><span>New submissions and assigned examinations will appear here.</span></div>
                                    ) : (
                                        <div className="sbe-case-list">
                                            {priorityApplications.map(app => {
                                                const status = getStatusStyle(app.applicationStatus);
                                                return (
                                                    <div className="sbe-case-row" key={app.id}>
                                                        <div className="sbe-case-reference">RBZ-{String(app.id).padStart(6, '0')}</div>
                                                        <div className="sbe-case-name"><strong>{app.companyName || 'Unnamed institution'}</strong><span>{app.assignedExaminer || 'Examiner not assigned'}</span></div>
                                                        <div>{instBadge(app.institutionType, app.licenseType)}</div>
                                                        <span className="sbe-case-status" style={{ color: status.color, background: status.bg }}>{status.label}</span>
                                                        <button onClick={() => app.applicationStatus === 'SUBMITTED' ? handleAssignClick(app) : onReviewApp?.(app)}>{app.applicationStatus === 'SUBMITTED' ? 'Allocate' : 'Open'}</button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                <div className="sbe-overview-lower">
                                    <section className="sbe-capacity-panel">
                                        <div className="sbe-section-heading compact"><div><span>Examiner capacity</span><h2>Supervisory team allocation</h2></div><button onClick={() => setActiveTab('staff')}>Manage staff</button></div>
                                        <div className="sbe-capacity-summary"><div><span>Active examiners</span><strong>{activeExaminers.length}</strong></div><div><span>Average caseload</span><strong>{averageWorkload}</strong></div></div>
                                        <div className="sbe-capacity-list">
                                            {activeExaminers.slice(0, 5).map(examiner => {
                                                const workload = Number(examiner.workload || 0);
                                                return <div key={examiner.id}><p><strong>{examiner.fullName}</strong><span>{workload} active case{workload === 1 ? '' : 's'}</span></p><div><i style={{ width: `${Math.min(100, workload * 20)}%` }} /></div></div>;
                                            })}
                                            {activeExaminers.length === 0 && <div className="sbe-inline-empty">No active bank examiners are provisioned.</div>}
                                        </div>
                                    </section>

                                    <section className="sbe-governance-panel">
                                        <div className="sbe-section-heading compact"><div><span>Control assurance</span><h2>Governance and decisions</h2></div></div>
                                        <div className="sbe-governance-item"><span>Reports awaiting authority</span><strong>{pendingReports.length}</strong><button onClick={() => setActiveTab('reports')}>Review queue</button></div>
                                        <div className="sbe-governance-item"><span>Audit trail integrity</span><strong className={auditResult?.valid === true ? 'ok' : ''}>{auditResult?.valid === true ? 'Verified' : 'Not checked'}</strong><button onClick={handleVerifyAudit} disabled={auditLoading}>{auditLoading ? 'Checking…' : 'Verify now'}</button></div>
                                        <div className="sbe-governance-note">Senior actions are recorded in the regulatory audit trail and remain attributable to the authenticated officer.</div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* ========== PIPELINE TAB ========== */}
                        {activeTab === 'pipeline' && (
                            <div>
                                {/* Filter pills */}
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid #e0e4e8', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                                    <div style={{ width: '1px', height: '18px', background: '#ddd', margin: '0 4px' }} />
                                    {[
                                        { key: 'all', label: 'All Types' },
                                        { key: 'COMMERCIAL_BANK', label: 'Banks' },
                                        { key: 'DTMFI', label: 'DTMFI' },
                                        { key: 'MFI', label: 'MFI' },
                                    ].map(f => (
                                        <button
                                            key={'t-' + f.key}
                                            onClick={() => setTypeFilter(f.key)}
                                            style={{
                                                padding: '4px 14px',
                                                borderRadius: '14px',
                                                border: typeFilter === f.key ? '1px solid #c5a236' : '1px solid #ddd',
                                                background: typeFilter === f.key ? '#c5a236' : 'transparent',
                                                color: typeFilter === f.key ? 'white' : '#666',
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
                                    let filtered = pipelineFilter === 'all' ? applications
                                        : pipelineFilter === 'pending' ? applications.filter(a => a.applicationStatus === 'SUBMITTED')
                                            : pipelineFilter === 'assigned' ? applications.filter(a => a.applicationStatus === 'ASSIGNED')
                                                : pipelineFilter === 'draft' ? applications.filter(a => a.applicationStatus === 'DRAFT')
                                                    : applications;
                                    if (typeFilter !== 'all') {
                                        filtered = filtered.filter(a => {
                                            const t = a.institutionType || ((a.licenseType || '').toLowerCase().includes('deposit') ? 'DTMFI' : 'MFI');
                                            return t === typeFilter;
                                        });
                                    }
                                    return filtered.length === 0 ? (
                                        <div className="text-center py-5" style={{ color: '#888' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>No {pipelineFilter} applications</div>
                                        </div>
                                    ) : (
                                        <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ background: '#fafbfc', borderBottom: '1px solid #e0e4e8' }}>
                                                    {['Institution', 'Type', 'Status', 'Assigned To', ''].map(h => (
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
                                                            <td style={{ padding: '12px 16px' }}>{instBadge(app.institutionType, app.licenseType)}</td>
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

                        {/* ========== LICENSE LIFECYCLE TAB ========== */}
                        {activeTab === 'lifecycle' && (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>License Lifecycle Management</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Monitor expiry dates, renewals, and overdue licenses</div>
                                    </div>
                                    <Button size="sm" onClick={loadLifecycleDashboard} disabled={lifecycleLoading}
                                        style={{ background: '#003366', border: 'none', fontSize: '0.75rem', borderRadius: '4px', padding: '6px 14px' }}>
                                        {lifecycleLoading ? <Spinner size="sm" animation="border" /> : 'Refresh'}
                                    </Button>
                                </div>

                                {!lifecycleDashboard && !lifecycleLoading && (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem' }}>Click Refresh to load license expiry data</div>
                                    </div>
                                )}

                                {lifecycleDashboard && (
                                    <>
                                        <Row className="mb-3 g-3">
                                            {[
                                                { label: 'Critical (< 30 days)', count: lifecycleDashboard.criticalExpiry?.length || 0, color: '#8b1a1a', bg: '#fde8e8' },
                                                { label: 'Expiring Soon (< 60 days)', count: lifecycleDashboard.upcomingExpiry?.length || 0, color: '#b8860b', bg: '#fef9e7' },
                                                { label: 'Overdue / Expired', count: lifecycleDashboard.overdue?.length || 0, color: '#5a0000', bg: '#f8d7da' },
                                                { label: 'Total Alerts', count: lifecycleDashboard.totalAlerts || 0, color: '#003366', bg: '#e8edf2' },
                                            ].map((s, i) => (
                                                <Col md={3} key={i}>
                                                    <div style={{ padding: '14px 18px', background: s.bg, borderRadius: '6px', border: `1px solid ${s.color}22` }}>
                                                        <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: s.color, fontWeight: 600, letterSpacing: '0.5px' }}>{s.label}</div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: s.color }}>{s.count}</div>
                                                    </div>
                                                </Col>
                                            ))}
                                        </Row>

                                        {[
                                            { key: 'overdue', label: 'Overdue / Expired Licenses', color: '#5a0000' },
                                            { key: 'criticalExpiry', label: 'Critical — Expiring Within 30 Days', color: '#8b1a1a' },
                                            { key: 'upcomingExpiry', label: 'Upcoming — Expiring Within 60 Days', color: '#b8860b' },
                                        ].map(group => lifecycleDashboard[group.key]?.length > 0 && (
                                            <div key={group.key} className="mb-4">
                                                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 600, color: group.color, letterSpacing: '0.5px', marginBottom: '8px' }}>
                                                    {group.label}
                                                </div>
                                                <Table hover responsive className="mb-0 align-middle" style={{ fontSize: '0.83rem' }}>
                                                    <thead>
                                                        <tr style={{ background: '#fafbfc' }}>
                                                            {['Institution', 'License Type', 'License No.', 'Expiry Date', 'Status', ''].map(h => (
                                                                <th key={h} style={{ fontWeight: 600, color: '#666', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 14px' }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {lifecycleDashboard[group.key].map(item => (
                                                            <tr key={item.companyId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.companyName}</td>
                                                                <td style={{ padding: '10px 14px', color: '#555' }}>{item.licenseType || '—'}</td>
                                                                <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#003366' }}>{item.licenseNumber || '—'}</td>
                                                                <td style={{ padding: '10px 14px', color: group.key === 'overdue' ? '#8b1a1a' : '#b8860b', fontWeight: 600 }}>
                                                                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
                                                                </td>
                                                                <td style={{ padding: '10px 14px' }}>
                                                                    <span style={{
                                                                        padding: '2px 8px', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 600,
                                                                        color: item.renewalStatus === 'OVERDUE' ? '#5a0000' : item.renewalStatus === 'DUE_SOON' ? '#7a4800' : '#1a5c2e',
                                                                        background: item.renewalStatus === 'OVERDUE' ? '#f8d7da' : item.renewalStatus === 'DUE_SOON' ? '#fef9e7' : '#e8f5ec'
                                                                    }}>
                                                                        {item.renewalStatus || 'CURRENT'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                                                                    <Button size="sm" onClick={() => handleRenewLicense(item.companyId)} disabled={renewingId === item.companyId}
                                                                        style={{ background: '#1a5c2e', border: 'none', fontSize: '0.72rem', fontWeight: 500, padding: '3px 12px', borderRadius: '4px' }}>
                                                                        {renewingId === item.companyId ? <Spinner size="sm" animation="border" /> : 'Renew'}
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            </div>
                                        ))}

                                        {lifecycleDashboard.totalAlerts === 0 && (
                                            <div className="text-center py-4" style={{ color: '#1a5c2e', fontWeight: 500 }}>
                                                All licenses are current — no renewals required at this time.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* ========== AUDIT LOG TAB ========== */}
                        {activeTab === 'audit' && (
                            <div className="p-4">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1a1a1a' }}>Audit Log — Hash Chain Integrity</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888' }}>Verify tamper-evidence of the immutable system activity log</div>
                                    </div>
                                    <Button size="sm" onClick={handleVerifyAudit} disabled={auditLoading}
                                        style={{ background: '#003366', border: 'none', fontSize: '0.75rem', borderRadius: '4px', padding: '6px 14px' }}>
                                        {auditLoading ? <Spinner size="sm" animation="border" /> : 'Verify Integrity'}
                                    </Button>
                                </div>

                                {auditResult && (
                                    <div style={{
                                        padding: '14px 20px', borderRadius: '8px', marginBottom: '20px',
                                        background: auditResult.integrityStatus === 'INTACT' ? '#e8f5ec' : '#fde8e8',
                                        border: `1px solid ${auditResult.integrityStatus === 'INTACT' ? '#1a5c2e' : '#8b1a1a'}`,
                                    }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: auditResult.integrityStatus === 'INTACT' ? '#1a5c2e' : '#8b1a1a' }}>
                                            {auditResult.integrityStatus === 'INTACT' ? '✓ Audit Log Integrity: INTACT' : '⚠ Audit Log Integrity: COMPROMISED'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '4px' }}>
                                            {auditResult.totalEntries} total entries — {auditResult.corruptedEntries} with violations
                                        </div>
                                        {auditResult.violations?.length > 0 && (
                                            <div style={{ marginTop: '10px' }}>
                                                {auditResult.violations.map((v, i) => (
                                                    <div key={i} style={{ fontSize: '0.75rem', color: '#8b1a1a', background: '#fff', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                                                        Entry #{v.entryId} — {v.issue || 'hash mismatch'} — {v.activityType || ''} at {v.timestamp ? new Date(v.timestamp).toLocaleString() : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!auditResult && (
                                    <div className="text-center py-5" style={{ color: '#888' }}>
                                        <div style={{ fontSize: '0.9rem' }}>Click "Verify Integrity" to check the audit log hash chain</div>
                                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '4px' }}>This replays SHA-256 hashes from genesis to confirm no entries have been tampered with</div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </Card>
            </main>

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
                                <Form.Control type="text" placeholder="Examiner's full name" value={newExaminer.fullName}
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

                            {/* Approval chain indicator */}
                            <div style={{ background: '#f0f4f8', borderRadius: '6px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.78rem', color: '#555' }}>
                                <strong>Approval chain:</strong> {approvalChainLabel(selectedReport)}
                                {selectedReport.currentApprovalLevel != null && (
                                    <span className="ms-2" style={{ color: '#003366', fontWeight: 600 }}>
                                        (Level {selectedReport.currentApprovalLevel} of {selectedReport.approvalLevelsRequired})
                                    </span>
                                )}
                            </div>

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
                                    {/* Level 4: Director sign-off (DTMFI + Bank) */}
                                    {selectedReport.workflowStatus === 'PENDING_DIRECTOR' && (
                                        <Button size="sm" onClick={() => handleReportAction('DIRECTOR_SIGN')} disabled={actionLoading}
                                            style={{ background: '#1a4a7a', border: 'none', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Director Sign-off'}
                                        </Button>
                                    )}
                                    {/* Level 5: Governor sign-off (Bank only) */}
                                    {selectedReport.workflowStatus === 'PENDING_GOVERNOR' && (
                                        <Button size="sm" onClick={() => handleReportAction('GOVERNOR_SIGN')} disabled={actionLoading}
                                            style={{ background: '#4a3570', border: 'none', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Governor Sign-off'}
                                        </Button>
                                    )}
                                    {/* Final approval — only when chain is complete */}
                                    {selectedReport.workflowStatus === 'PENDING_APPROVAL' && (
                                        <Button size="sm" onClick={() => handleReportAction('APPROVE')} disabled={actionLoading}
                                            style={{ background: '#1a5c2e', border: 'none', fontSize: '0.78rem', fontWeight: 500, padding: '5px 14px', borderRadius: '4px' }}>
                                            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Final Approval (Registrar)'}
                                        </Button>
                                    )}
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
