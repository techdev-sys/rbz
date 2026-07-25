import React, { useEffect, useMemo, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { getActivitySummary, getAssignedApplications } from '../services/api';
import './DashboardExaminer.css';

const timeAgo = (dateStr) => {
    if (!dateStr) return 'No recorded activity';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0) return 'Just now';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} days ago`;
    return new Date(dateStr).toLocaleDateString('en-GB');
};

const formatWorkflowStage = (stage) => {
    if (!stage) return 'Document intake';
    return stage.toLowerCase().split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const institutionLabel = (institutionType, licenseType) => {
    if (institutionType === 'COMMERCIAL_BANK') return 'Commercial bank';
    if (institutionType === 'DTMFI') return 'Deposit-taking MFI';
    if (institutionType === 'MFI') return 'Microfinance institution';
    return (licenseType || '').toLowerCase().includes('deposit')
        ? 'Deposit-taking MFI' : 'Microfinance institution';
};

const statusDetails = (status) => {
    switch (status) {
        case 'ASSIGNED': return { className: 'assigned', label: 'Awaiting assessment' };
        case 'UNDER_REVIEW': return { className: 'review', label: 'Under examination' };
        case 'APPROVED': return { className: 'complete', label: 'Approved' };
        case 'REJECTED': return { className: 'declined', label: 'Declined' };
        default: return { className: 'pending', label: status || 'Pending' };
    }
};

const DashboardExaminer = ({ onLogout, onReviewApp }) => {
    const [applications, setApplications] = useState([]);
    const [activity, setActivity] = useState({});
    const [loading, setLoading] = useState(true);
    const [queueFilter, setQueueFilter] = useState('all');
    const examinerName = localStorage.getItem('examinerUsername') || 'Bank Examiner';
    const examinerDesignation = localStorage.getItem('examinerDesignation') || 'Bank Examiner';

    const loadAssignedTasks = async () => {
        setLoading(true);
        try {
            const response = await getAssignedApplications(examinerName);
            const apps = response.data || [];
            setApplications(apps);
            if (apps.length > 0) {
                try {
                    const summaryRes = await getActivitySummary(apps.map((app) => app.id));
                    setActivity(summaryRes.data || {});
                } catch (err) {
                    console.error('Activity summary unavailable', err);
                    setActivity({});
                }
            } else {
                setActivity({});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssignedTasks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const hasNewMessage = (appId) => {
        const summary = activity[appId];
        if (!summary?.lastMessageAt || summary.lastMessageRole !== 'APPLICANT') return false;
        const lastRead = localStorage.getItem(`chatLastRead_examiner_${appId}`);
        return !lastRead || new Date(summary.lastMessageAt) > new Date(lastRead);
    };

    const metrics = useMemo(() => {
        const pending = applications.filter((app) => app.applicationStatus === 'ASSIGNED').length;
        const active = applications.filter((app) => app.applicationStatus === 'UNDER_REVIEW').length;
        const documents = applications.reduce(
            (total, app) => total + (activity[app.id]?.docsAwaitingReview || 0), 0
        );
        const messages = applications.filter((app) => hasNewMessage(app.id)).length;
        return { pending, active, documents, messages };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applications, activity]);

    const filteredApplications = useMemo(() => {
        if (queueFilter === 'pending') {
            return applications.filter((app) => app.applicationStatus === 'ASSIGNED');
        }
        if (queueFilter === 'documents') {
            return applications.filter((app) => (activity[app.id]?.docsAwaitingReview || 0) > 0);
        }
        if (queueFilter === 'messages') {
            return applications.filter((app) => hasNewMessage(app.id));
        }
        return applications;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [applications, activity, queueFilter]);

    const summaryCards = [
        { key: 'all', code: '01', label: 'Assigned cases', value: applications.length, note: `${metrics.active} currently under examination` },
        { key: 'pending', code: '02', label: 'Pending assessment', value: metrics.pending, note: 'Cases requiring initial examiner action' },
        { key: 'documents', code: '03', label: 'Evidence to review', value: metrics.documents, note: 'Applicant documents awaiting a finding' },
        { key: 'messages', code: '04', label: 'Correspondence', value: metrics.messages, note: 'Unread applicant communications' }
    ];

    return (
        <div className="be-workspace">
            <header className="be-header">
                <div className="be-header-inner">
                    <div className="be-header-row">
                        <div className="be-brand">
                            <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="be-logo" />
                            <div>
                                <div className="be-brand-title">Bank Examiner</div>
                                <div className="be-brand-subtitle">Banking Supervision, Surveillance &amp; Financial Stability</div>
                            </div>
                        </div>
                        <div className="be-user-actions">
                            <div className="be-user-card">
                                <div>{examinerName}</div>
                                <small>{examinerDesignation}</small>
                            </div>
                            <button type="button" className="be-signout" onClick={onLogout}>Sign out</button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="be-main">
                <section className="be-page-intro">
                    <div>
                        <span className="be-kicker">Institution licensing supervision</span>
                        <h1>Examination workbench</h1>
                        <p>Assess assigned applications, record evidence-based findings and prepare cases for senior review.</p>
                    </div>
                    <div className="be-asof">
                        <span>Operational status</span>
                        <strong>Active</strong>
                        <small>{new Date().toLocaleDateString('en-GB', {
                            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                        })}</small>
                    </div>
                </section>

                <section className="be-summary-grid" aria-label="Examiner workload summary">
                    {summaryCards.map((card) => (
                        <button key={card.key} type="button"
                            className={`be-summary-card ${queueFilter === card.key ? 'active' : ''}`}
                            onClick={() => setQueueFilter(card.key)}>
                            <span className="be-summary-code">{card.code}</span>
                            <span className="be-summary-label">{card.label}</span>
                            <strong>{card.value}</strong>
                            <small>{card.note}</small>
                        </button>
                    ))}
                </section>

                <section className="be-queue-panel">
                    <div className="be-section-heading">
                        <div>
                            <span>Assigned examination register</span>
                            <h2>{queueFilter === 'all' ? 'Full work queue' : summaryCards.find((card) => card.key === queueFilter)?.label}</h2>
                        </div>
                        <div className="be-heading-actions">
                            {queueFilter !== 'all' && <button type="button" onClick={() => setQueueFilter('all')}>Clear filter</button>}
                            <button type="button" onClick={loadAssignedTasks} disabled={loading}>
                                {loading ? 'Refreshing' : 'Refresh register'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="be-loading-state"><Spinner animation="border" size="sm" /><span>Retrieving assigned cases</span></div>
                    ) : filteredApplications.length === 0 ? (
                        <div className="be-empty-state">
                            <strong>No cases match this register view</strong>
                            <span>{applications.length === 0
                                ? 'No applications are presently assigned. Contact the Senior Bank Examiner if work is expected.'
                                : 'Select another workload category to review the remaining assigned cases.'}</span>
                        </div>
                    ) : (
                        <div className="be-table-wrap">
                            <table className="be-queue-table">
                                <thead><tr>
                                    <th>Reference / institution</th><th>Licence category</th><th>Current stage</th>
                                    <th>Case status</th><th>Outstanding activity</th><th aria-label="Case action" />
                                </tr></thead>
                                <tbody>
                                    {filteredApplications.map((app) => {
                                        const summary = activity[app.id];
                                        const status = statusDetails(app.applicationStatus);
                                        const documents = summary?.docsAwaitingReview || 0;
                                        const newMessage = hasNewMessage(app.id);
                                        return (
                                            <tr key={app.id}>
                                                <td><span className="be-reference">RBZ-{String(app.id).padStart(6, '0')}</span><strong>{app.companyName || 'Institution name pending'}</strong></td>
                                                <td><span className={`be-type-badge ${(app.institutionType || 'MFI').toLowerCase()}`}>{institutionLabel(app.institutionType, app.licenseType)}</span></td>
                                                <td><span className="be-stage">{formatWorkflowStage(app.workflowStage)}</span></td>
                                                <td><span className={`be-status ${status.className}`}>{status.label}</span></td>
                                                <td>
                                                    <div className="be-activity">
                                                        {(documents > 0 || newMessage) ? <>
                                                            {documents > 0 && <span className="be-activity-flag">{documents} document{documents === 1 ? '' : 's'} awaiting review</span>}
                                                            {newMessage && <span className="be-activity-flag urgent">Applicant correspondence received</span>}
                                                        </> : <span className="be-activity-clear">No outstanding alerts</span>}
                                                        <small>{timeAgo(summary?.lastActivityAt)}</small>
                                                    </div>
                                                </td>
                                                <td><button type="button" className="be-open-case" onClick={() => onReviewApp(app)}>Open dossier</button></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="be-lower-grid">
                    <article className="be-guidance-panel">
                        <div className="be-section-heading compact"><div><span>Examination priorities</span><h2>Current workload signals</h2></div></div>
                        <div className="be-signal-list">
                            <button type="button" onClick={() => setQueueFilter('documents')}><span>Evidence requiring a recorded finding</span><strong>{metrics.documents}</strong></button>
                            <button type="button" onClick={() => setQueueFilter('messages')}><span>Applicant correspondence requiring review</span><strong>{metrics.messages}</strong></button>
                            <button type="button" onClick={() => setQueueFilter('pending')}><span>Cases awaiting initial assessment</span><strong>{metrics.pending}</strong></button>
                        </div>
                    </article>

                    <article className="be-guidance-panel">
                        <div className="be-section-heading compact"><div><span>Control standard</span><h2>Required review discipline</h2></div></div>
                        <ol className="be-standard-list">
                            <li><span>01</span><p><strong>Verify submitted particulars</strong>Review the institutional record and supporting evidence as a read-only dossier.</p></li>
                            <li><span>02</span><p><strong>Record findings by stage</strong>Document the basis for every approval, query or rejection decision.</p></li>
                            <li><span>03</span><p><strong>Escalate a complete record</strong>Forward the examiner report only when all material issues have been resolved.</p></li>
                        </ol>
                    </article>
                </section>
            </main>
        </div>
    );
};

export default DashboardExaminer;
