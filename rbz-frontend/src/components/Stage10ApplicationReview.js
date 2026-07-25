import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Badge, Button, Alert, Spinner, ProgressBar, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { API_URL, submitApplication, friendlyError } from '../services/api';

// Maps backend stage names → wizard step numbers
const STAGE_TO_STEP = {
    COMPANY_PROFILE: 1,
    LEGAL_OWNERSHIP_VALIDATION: 2,
    DIRECTOR_VALIDATION: 3,
    BOARD_COMMITTEES: 4,
    CAPITAL_VALIDATION: 5,
    BUSINESS_PLAN_REVIEW: 6,
    FINANCIAL_PROJECTIONS: 7,
    GROWTH_AND_DEVELOPMENT: 8,
    DOCUMENT_INTAKE: 9,
};

const STAGE_LABELS = {
    COMPANY_PROFILE: 'Company Profile',
    LEGAL_OWNERSHIP_VALIDATION: 'Ownership Structure',
    DIRECTOR_VALIDATION: 'Directors & Governance',
    BOARD_COMMITTEES: 'Application Form & Committees',
    CAPITAL_VALIDATION: 'Capital Structure',
    BUSINESS_PLAN_REVIEW: 'Products & Services',
    FINANCIAL_PROJECTIONS: 'Financial Projections',
    GROWTH_AND_DEVELOPMENT: 'Growth & Development',
    DOCUMENT_INTAKE: 'Documents Upload',
};

const STAGE_ICONS = {
    COMPANY_PROFILE: '🏢',
    LEGAL_OWNERSHIP_VALIDATION: '⚖️',
    DIRECTOR_VALIDATION: '👥',
    BOARD_COMMITTEES: '📋',
    CAPITAL_VALIDATION: '💰',
    BUSINESS_PLAN_REVIEW: '📈',
    FINANCIAL_PROJECTIONS: '📊',
    GROWTH_AND_DEVELOPMENT: '🌱',
    DOCUMENT_INTAKE: '📁',
};

const Stage10ApplicationReview = ({ onGoToStage, onSubmit }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const companyId = localStorage.getItem('currentCompanyId');
    const userRole = localStorage.getItem('userRole');
    const isApplicant = userRole === 'applicant';

    const runEvaluation = useCallback(async () => {
        if (!companyId) return;
        setEvaluating(true);
        setError(null);
        try {
            await axios.post(`${API_URL}/workflow/${companyId}/evaluate/all?evaluatedBy=user_session`);
            const res = await axios.get(`${API_URL}/workflow/${companyId}/status`);
            setLogs(res.data.evaluationLogs || []);
        } catch (err) {
            setError('Could not run validation checks. Please ensure the backend is running.');
        } finally {
            setEvaluating(false);
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        // On load, fetch existing logs first; if none, run evaluation
        const init = async () => {
            try {
                const res = await axios.get(`${API_URL}/workflow/${companyId}/status`);
                const existing = res.data.evaluationLogs || [];
                if (existing.length > 0) {
                    setLogs(existing);
                    setLoading(false);
                } else {
                    await runEvaluation();
                }
            } catch {
                await runEvaluation();
            }
        };
        init();
    }, [companyId, runEvaluation]);

    const handleSubmit = async () => {
        if (!window.confirm('FINAL CONFIRMATION: Are you sure you wish to submit this application to the Reserve Bank of Zimbabwe? This action is irreversible.')) return;
        setSubmitting(true);
        try {
            await submitApplication(companyId);
            setSubmitted(true);
            if (onSubmit) onSubmit();
        } catch (err) {
            setError(friendlyError(err, 'Submission failed. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    // Group logs by stage
    const grouped = logs.reduce((acc, log) => {
        if (!acc[log.stage]) acc[log.stage] = [];
        acc[log.stage].push(log);
        return acc;
    }, {});

    // Compute summary stats
    const orderedStages = Object.keys(STAGE_TO_STEP).filter(s => grouped[s]);
    const totalStages = orderedStages.length;
    const passedStages = orderedStages.filter(stage =>
        grouped[stage].every(l => !(l.ruleType === 'HARD' && l.result === 'FAIL'))
    ).length;
    const failedStages = totalStages - passedStages;
    const totalHardFails = logs.filter(l => l.ruleType === 'HARD' && l.result === 'FAIL').length;
    const canSubmit = totalHardFails === 0 && logs.length > 0;
    const progressPct = totalStages > 0 ? Math.round((passedStages / totalStages) * 100) : 0;

    if (submitted) {
        return (
            <Container className="py-5 text-center">
                <div style={{ fontSize: '4rem' }}>✅</div>
                <h3 className="fw-bold mt-3" style={{ color: '#003366' }}>Application Submitted Successfully</h3>
                <p className="text-muted">Your application has been submitted to the Reserve Bank of Zimbabwe. You will be contacted via your registered email with further instructions.</p>
            </Container>
        );
    }

    return (
        <Container fluid className="px-4 pt-4 pb-4">

            {/* Header */}
            <div className="mb-4">
                <h3 className="fw-bold" style={{ color: '#003366' }}>Stage 10: Application Review</h3>
                <p className="text-muted mb-0">Review all validation checks before submitting. Click any failed item to go directly to that stage and fix it.</p>
            </div>

            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {/* Summary Card */}
            {!loading && logs.length > 0 && (
                <Card className="mb-4 border-0 shadow-sm overflow-hidden">
                    <div style={{ background: canSubmit ? 'linear-gradient(135deg, #003366, #1a5276)' : 'linear-gradient(135deg, #7b1d1d, #a93226)', padding: '24px', color: 'white' }}>
                        <Row className="align-items-center">
                            <Col md={8}>
                                <h5 className="fw-bold mb-1">{canSubmit ? '✅ All checks passed — Ready to submit' : `⚠️ ${failedStages} stage(s) require attention`}</h5>
                                <p className="mb-3" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                                    {canSubmit
                                        ? 'Your application has passed all mandatory validation checks.'
                                        : `${totalHardFails} mandatory requirement(s) must be resolved before you can submit.`}
                                </p>
                                <ProgressBar
                                    now={progressPct}
                                    label={`${passedStages}/${totalStages} stages clear`}
                                    style={{ height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.2)' }}
                                    variant={canSubmit ? 'success' : 'warning'}
                                />
                            </Col>
                            <Col md={4} className="text-end">
                                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{progressPct}%</div>
                                <div style={{ opacity: 0.7, fontSize: '0.8rem' }}>Compliance Score</div>
                            </Col>
                        </Row>
                    </div>
                </Card>
            )}

            {/* Re-run button */}
            <div className="d-flex justify-content-end mb-3">
                <Button variant="outline-primary" size="sm" onClick={runEvaluation} disabled={evaluating || loading}>
                    {evaluating ? <><Spinner animation="border" size="sm" className="me-2" />Running checks...</> : '↻ Re-run All Checks'}
                </Button>
            </div>

            {/* Stage Cards */}
            {loading || evaluating ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-muted mt-3">Running validation checks across all stages...</p>
                </div>
            ) : logs.length === 0 ? (
                <Alert variant="info">No validation data found. Click "Re-run All Checks" to evaluate your application.</Alert>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {orderedStages.map(stage => {
                        const stageLogs = grouped[stage];
                        const hardFails = stageLogs.filter(l => l.ruleType === 'HARD' && l.result === 'FAIL');
                        const softFlags = stageLogs.filter(l => l.result === 'FLAG');
                        const passes = stageLogs.filter(l => l.result === 'PASS');
                        const stageOk = hardFails.length === 0;
                        const stepNum = STAGE_TO_STEP[stage];

                        return (
                            <Card key={stage} className="border-0 shadow-sm overflow-hidden"
                                style={{ borderLeft: `5px solid ${stageOk ? '#28a745' : '#dc3545'} !important` }}>

                                {/* Stage Header */}
                                <div
                                    className="d-flex align-items-center justify-content-between px-4 py-3"
                                    style={{
                                        background: stageOk ? '#f0fff4' : '#fff5f5',
                                        borderLeft: `5px solid ${stageOk ? '#28a745' : '#dc3545'}`,
                                        cursor: !stageOk ? 'pointer' : 'default'
                                    }}
                                    onClick={() => !stageOk && onGoToStage && onGoToStage(stepNum)}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <span style={{ fontSize: '1.6rem' }}>{STAGE_ICONS[stage]}</span>
                                        <div>
                                            <div className="fw-bold" style={{ color: '#003366', fontSize: '0.95rem' }}>
                                                Stage {stepNum}: {STAGE_LABELS[stage]}
                                            </div>
                                            <div className="small text-muted">
                                                {passes.length} passed · {hardFails.length} failed · {softFlags.length} flagged
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        {stageOk
                                            ? <Badge bg="success" className="px-3 py-2">PASSED</Badge>
                                            : (
                                                <>
                                                    <Badge bg="danger" className="px-3 py-2">{hardFails.length} ISSUE{hardFails.length > 1 ? 'S' : ''}</Badge>
                                                    {onGoToStage && (
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            className="rounded-pill px-3"
                                                            onClick={(e) => { e.stopPropagation(); onGoToStage(stepNum); }}
                                                        >
                                                            Fix → Stage {stepNum}
                                                        </Button>
                                                    )}
                                                </>
                                            )
                                        }
                                    </div>
                                </div>

                                {/* Failed Items — always visible */}
                                {hardFails.length > 0 && (
                                    <div style={{ background: '#fff', borderLeft: '5px solid #dc3545' }}>
                                        {hardFails.map((log, i) => (
                                            <div
                                                key={i}
                                                className="d-flex align-items-start gap-3 px-4 py-3"
                                                style={{
                                                    borderBottom: i < hardFails.length - 1 ? '1px solid #fce8e8' : 'none',
                                                    cursor: onGoToStage ? 'pointer' : 'default',
                                                    transition: 'background 0.15s'
                                                }}
                                                onClick={() => onGoToStage && onGoToStage(stepNum)}
                                                onMouseEnter={e => e.currentTarget.style.background = '#fef9f9'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ color: '#dc3545', fontSize: '1.1rem', marginTop: '2px', flexShrink: 0 }}>✗</span>
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold small" style={{ color: '#c0392b' }}>
                                                        {log.ruleId} — Required
                                                    </div>
                                                    <div className="small text-muted mt-1">{log.details}</div>
                                                </div>
                                                {onGoToStage && (
                                                    <span className="small" style={{ color: '#aaa', flexShrink: 0, marginTop: '3px' }}>
                                                        Click to fix →
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Soft flags */}
                                {softFlags.length > 0 && (
                                    <div style={{ background: '#fffdf0', borderLeft: '5px solid #ffc107' }}>
                                        {softFlags.map((log, i) => (
                                            <div key={i} className="d-flex align-items-start gap-3 px-4 py-2"
                                                style={{ borderBottom: i < softFlags.length - 1 ? '1px solid #fef3cd' : 'none' }}>
                                                <span style={{ color: '#f0a500', flexShrink: 0 }}>⚑</span>
                                                <div>
                                                    <div className="fw-semibold small" style={{ color: '#856404' }}>{log.ruleId} — Advisory</div>
                                                    <div className="small text-muted">{log.details}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* All passed — collapsed summary */}
                                {stageOk && passes.length > 0 && (
                                    <div className="px-4 py-2" style={{ background: '#f6fff8', borderLeft: '5px solid #28a745' }}>
                                        <div className="d-flex flex-wrap gap-2">
                                            {passes.map((log, i) => (
                                                <span key={i} className="small text-success d-flex align-items-center gap-1">
                                                    <span>✓</span> {log.details}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Footer Actions */}
            <div className="d-flex justify-content-between align-items-center mt-4 p-4 bg-white rounded shadow-sm" style={{ borderTop: '4px solid #C5A236' }}>
                <Button variant="outline-secondary" className="rounded-pill px-4" onClick={() => onGoToStage && onGoToStage(9)}>
                    ← Back to Documents
                </Button>

                {isApplicant && (
                    <Button
                        className="px-5 py-2 fw-bold rounded-pill shadow"
                        variant={canSubmit ? 'success' : 'secondary'}
                        disabled={!canSubmit || submitting || loading || evaluating}
                        onClick={handleSubmit}
                        style={{ fontSize: '1rem', minWidth: '220px' }}
                    >
                        {submitting
                            ? <><Spinner animation="border" size="sm" className="me-2" />Submitting...</>
                            : canSubmit
                                ? '✅ Submit Final Application'
                                : `Fix ${totalHardFails} issue${totalHardFails !== 1 ? 's' : ''} to continue`}
                    </Button>
                )}
            </div>

            <div className="text-center mt-3">
                <p className="small text-muted mb-0">
                    Secure channel encrypted with RBZ Cyber-Security Standards.<br />
                    Your data is processed according to the Data Protection Act [Chapter 11:12].
                </p>
            </div>
        </Container>
    );
};

export default Stage10ApplicationReview;
