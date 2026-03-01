import React, { useState, useEffect } from 'react';
import { Card, Badge, Table, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';

const STAGE_MAPPING = {
    1: 'DOCUMENT_INTAKE',              // Wizard Step 1: Company Profile → checks document uploads
    2: 'LEGAL_OWNERSHIP_VALIDATION',   // Wizard Step 2: Ownership Structure → checks shareholders
    3: 'DIRECTOR_VALIDATION',          // Wizard Step 3: Directors & Governance → checks director clearance
    4: null,                           // Wizard Step 4: Application Form → no specific rule stage
    5: 'CAPITAL_VALIDATION',           // Wizard Step 5: Capital Structure → checks minimum capital
    6: 'BUSINESS_PLAN_REVIEW',         // Wizard Step 6: Products & Services → AI review
    7: null,                           // Wizard Step 7: Financial Projections → no specific rule stage
    8: null,                           // Wizard Step 8: Growth & Development → no specific rule stage
    9: null,                           // Wizard Step 9: Documents Upload → no specific rule stage
    10: 'FINAL_RECOMMENDATION'         // Wizard Step 10: Report Generation → final check
};

function WorkflowStatusPanel({ companyId, currentStep, onStageComplete }) {
    const [workflowData, setWorkflowData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [error, setError] = useState('');

    const currentStageEnum = STAGE_MAPPING[currentStep];

    const fetchStatus = async () => {
        if (!companyId || !currentStageEnum) return;
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8080/api/workflow/${companyId}/status`);
            setWorkflowData(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch workflow status.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId, currentStep]);

    const handleEvaluate = async () => {
        try {
            setEvaluating(true);
            await axios.post(`http://localhost:8080/api/workflow/${companyId}/evaluate/${currentStageEnum}?evaluatedBy=user_session`);
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
            await axios.post(`http://localhost:8080/api/workflow/${companyId}/advance/${currentStageEnum}?user=user_session`);
            await fetchStatus();
            if (onStageComplete) onStageComplete();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to advance stage. Check for HARD rule failures.');
        } finally {
            setEvaluating(false);
        }
    };

    if (!companyId || !currentStageEnum) return null;

    const currentLogs = workflowData?.evaluationLogs?.filter(log => log.stage === currentStageEnum) || [];
    const hasHardFailure = currentLogs.some(log => log.ruleType === 'HARD' && log.result === 'FAIL');
    const isComplete = workflowData?.currentStage === currentStageEnum && workflowData?.stageStatus === 'COMPLETE';

    return (
        <Card className="mb-4 shadow-sm border-0 border-top border-4 border-warning">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 text-primary">
                    <i className="bi bi-shield-check me-2"></i>
                    Regulatory Rule Engine: {currentStageEnum.replace(/_/g, ' ')}
                </h5>
                <Badge bg={workflowData?.stageStatus === 'COMPLETE' ? 'success' : 'secondary'} className="px-3 py-2">
                    {workflowData?.stageStatus || 'UNKNOWN'}
                </Badge>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center p-3"><Spinner animation="border" variant="primary" /></div>
                ) : (
                    <>
                        <Table responsive hover className="align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Rule ID</th>
                                    <th>Type</th>
                                    <th>Result</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLogs.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center text-muted">No rules evaluated yet. Click 'Run Evaluation'.</td></tr>
                                ) : (
                                    currentLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="fw-bold">{log.ruleId}</td>
                                            <td>
                                                <Badge bg={log.ruleType === 'HARD' ? 'danger' : 'warning'} text={log.ruleType === 'SOFT' ? 'dark' : ''}>
                                                    {log.ruleType}
                                                </Badge>
                                            </td>
                                            <td>
                                                {log.result === 'PASS' && <Badge bg="success">PASS</Badge>}
                                                {log.result === 'FAIL' && <Badge bg="danger">FAIL</Badge>}
                                                {log.result === 'FLAG' && <Badge bg="warning" text="dark">FLAG</Badge>}
                                            </td>
                                            <td className="small text-muted">{log.details}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button variant="outline-primary" onClick={handleEvaluate} disabled={evaluating || isComplete}>
                                {evaluating ? 'Running...' : 'Run Evaluation'}
                            </Button>
                            <Button
                                variant={hasHardFailure ? 'secondary' : 'success'}
                                onClick={handleAdvance}
                                disabled={evaluating || isComplete || hasHardFailure || currentLogs.length === 0}
                            >
                                {isComplete ? 'Stage Completed' : 'Sign Off & Complete Stage'}
                            </Button>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
}

export default WorkflowStatusPanel;
