import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Table, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../services/api';

const STAGE_MAPPING = {
    1: 'COMPANY_PROFILE',
    2: 'LEGAL_OWNERSHIP_VALIDATION',
    3: 'DIRECTOR_VALIDATION',
    4: 'BOARD_COMMITTEES',
    5: 'CAPITAL_VALIDATION',
    6: 'BUSINESS_PLAN_REVIEW',
    7: 'FINANCIAL_PROJECTIONS',
    8: 'GROWTH_AND_DEVELOPMENT',
    9: 'DOCUMENT_INTAKE',
    10: 'FINAL_RECOMMENDATION',
    // DTMFI stage 10 / Bank stage 10 aliases resolved server-side; these cover
    // the institution-specific enum values used by WorkflowEngineService
    11: 'DEPOSIT_PROTECTION',
    12: 'LIQUIDITY_MANAGEMENT',
    13: 'IT_CYBER_RISK',
    14: 'RECOVERY_RESOLUTION',
};

function WorkflowStatusPanel({ companyId, currentStep, showAll = false, onStageComplete, onValidationChange }) {
    const [workflowData, setWorkflowData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [error, setError] = useState('');

    const userRole = localStorage.getItem('userRole') || 'applicant';
    const isApplicant = userRole === 'applicant';

    const fetchStatus = useCallback(async () => {
        if (!companyId) return;
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/workflow/${companyId}/status`);
            setWorkflowData(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch evaluation status.');
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        if (workflowData && onValidationChange) {
            const logs = showAll ? (workflowData.evaluationLogs || []) : (workflowData.evaluationLogs || []).filter(log => log.stage === STAGE_MAPPING[currentStep]);
            const hasFailure = logs.some(log => log.ruleType === 'HARD' && log.result === 'FAIL');
            const hasPassedAny = logs.length > 0;
            onValidationChange(!hasFailure && hasPassedAny);
        }
    }, [workflowData, showAll, currentStep, onValidationChange]);

    const handleEvaluate = async () => {
        try {
            setEvaluating(true);
            const endpoint = showAll ? `${API_URL}/workflow/${companyId}/evaluate/all` : `${API_URL}/workflow/${companyId}/evaluate/${STAGE_MAPPING[currentStep]}`;
            await axios.post(`${endpoint}?evaluatedBy=user_session`);
            await fetchStatus();
        } catch (err) {
            setError('Evaluation failed.');
        } finally {
            setEvaluating(false);
        }
    };

    const handleAdvance = async () => {
        try {
            setEvaluating(true);
            await axios.post(`${API_URL}/workflow/${companyId}/advance/${STAGE_MAPPING[currentStep]}?user=user_session`);
            await fetchStatus();
            if (onStageComplete) onStageComplete();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to advance stage.');
        } finally {
            setEvaluating(false);
        }
    };

    if (!companyId) return null;

    const allLogs = workflowData?.evaluationLogs || [];
    const currentLogs = showAll ? allLogs : allLogs.filter(log => log.stage === STAGE_MAPPING[currentStep]);

    const hasHardFailure = currentLogs.some(log => log.ruleType === 'HARD' && log.result === 'FAIL');

    // Group logs by stage for "showAll" view
    const groupedLogs = showAll ? currentLogs.reduce((acc, log) => {
        if (!acc[log.stage]) acc[log.stage] = [];
        acc[log.stage].push(log);
        return acc;
    }, {}) : { [STAGE_MAPPING[currentStep]]: currentLogs };

    return (
        <Card className="mb-4 shadow-sm border-0 border-top border-4 border-warning">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 text-primary fw-bold">
                    <i className="bi bi-shield-check me-2"></i>
                    {showAll ? 'Final Application Validation' : `Validation: ${STAGE_MAPPING[currentStep]?.replace(/_/g, ' ')}`}
                </h5>
                <div className="d-flex gap-2">
                    <Badge bg={hasHardFailure ? 'danger' : 'success'} className="px-3 py-2">
                        {hasHardFailure ? 'Issues Found' : 'Ready'}
                    </Badge>
                </div>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center p-3"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <>
                        {Object.entries(groupedLogs).map(([stage, logs]) => (
                            <div key={stage} className="mb-4">
                                {showAll && <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">{stage.replace(/_/g, ' ')}</h6>}
                                <Table responsive hover size="sm" className="align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Requirement</th>
                                            <th>Status</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center text-muted small">No rules evaluated yet.</td></tr>
                                        ) : (
                                            logs.map(log => (
                                                <tr key={log.id}>
                                                    <td className="fw-bold small">{log.ruleId}</td>
                                                    <td>
                                                        {log.result === 'PASS' && <Badge bg="success">PASS</Badge>}
                                                        {log.result === 'FAIL' && <Badge bg="danger">FAIL</Badge>}
                                                        {log.result === 'FLAG' && <Badge bg="warning" text="dark">FLAG</Badge>}
                                                    </td>
                                                    <td className="small text-muted" style={{ fontSize: '0.75rem' }}>{log.details}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        ))}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="outline-primary" onClick={handleEvaluate} disabled={evaluating}>
                                {evaluating ? 'Running Checks...' : 'Run Validation Checks'}
                            </Button>
                            {!isApplicant && (
                                <Button
                                    variant={hasHardFailure ? 'secondary' : 'success'}
                                    onClick={handleAdvance}
                                    disabled={evaluating || hasHardFailure || currentLogs.length === 0}
                                >
                                    Sign Off & Complete Stage
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default WorkflowStatusPanel;
