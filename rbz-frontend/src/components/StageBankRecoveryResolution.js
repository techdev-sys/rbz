import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

export default function StageBankRecoveryResolution({ onComplete, readOnly }) {
    const companyId = localStorage.getItem('currentCompanyId');
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        companyId: Number(companyId),
        hasRecoveryPlan: false,
        recoveryPlanBoardApprovalDate: '',
        recoveryPlanLastReviewDate: '',
        capitalTriggers: '',
        liquidityTriggers: '',
        profitabilityTriggers: '',
        recapitalisationOptions: '',
        assetDisposalOptions: '',
        businessRestructuringOptions: '',
        hasCrisisManagementFramework: false,
        crisisManagementTeamComposition: '',
        communicationPlan: '',
        crossBorderExposureUsd: '',
        hasSignificantForeignSubsidiaries: false,
        systemicRiskAssessment: '',
        resolutionAuthorityNotified: false,
        notificationDate: '',
    };

    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!companyId) { setLoading(false); return; }
        axios.get(`${API_URL}/recovery-resolution/${companyId}`, { headers })
            .then(r => { if (r.data) setForm({ ...blank, ...r.data }); })
            .catch(() => {})
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const handle = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true); setError(null);
        try {
            await axios.post(`${API_URL}/recovery-resolution/save`, form, { headers });
            setSaved(true);
        } catch (err) {
            setError(err.response?.data || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5 text-center text-muted">Loading...</div>;

    const mandatoryOk = form.hasRecoveryPlan && form.hasCrisisManagementFramework;

    return (
        <div className="p-4">
            <div className="mb-4">
                <h4 style={{ color: '#003366', fontWeight: 700 }}>Recovery & Resolution Plan (RRP)</h4>
                <p className="text-muted small mb-0">
                    Commercial Banks must demonstrate they can recover from severe distress without requiring
                    a taxpayer bailout, per <strong>FSB Key Attributes</strong> and RBZ guidelines.
                    Both a <strong>Recovery Plan</strong> and a <strong>Crisis Management Framework</strong> are mandatory.
                </p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {saved && <Alert variant="success" dismissible onClose={() => setSaved(false)}>Saved successfully.</Alert>}

            <Card className="mb-4 border-0 shadow-sm" style={{ background: mandatoryOk ? '#e8f5ec' : '#fce8e8' }}>
                <Card.Body>
                    <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: '1.5rem' }}>{mandatoryOk ? '✅' : '⚠️'}</span>
                        <div>
                            <strong>{mandatoryOk ? 'Mandatory RRP controls confirmed' : 'Recovery Plan and Crisis Management Framework required'}</strong>
                            <div className="small text-muted mt-1">
                                Both are mandatory hard requirements for commercial bank licensing.
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Recovery Plan */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#003366', color: 'white', fontWeight: 600 }}>
                    Recovery Plan
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center mb-3">
                        <Col md={12}>
                            <Form.Check type="checkbox" id="hasRP" label="Board-approved Recovery Plan exists"
                                name="hasRecoveryPlan" checked={!!form.hasRecoveryPlan}
                                onChange={handle} disabled={readOnly} className="fw-bold" />
                        </Col>
                    </Row>
                    {form.hasRecoveryPlan && (
                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Board Approval Date</Form.Label>
                                    <Form.Control type="date" name="recoveryPlanBoardApprovalDate"
                                        value={form.recoveryPlanBoardApprovalDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Last Review Date</Form.Label>
                                    <Form.Control type="date" name="recoveryPlanLastReviewDate"
                                        value={form.recoveryPlanLastReviewDate} onChange={handle} disabled={readOnly} />
                                    <small className="text-muted">Plans should be reviewed annually</small>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Recovery Triggers */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#1a4a7a', color: 'white', fontWeight: 600 }}>
                    Recovery Triggers
                    <small className="ms-2" style={{ fontWeight: 400, opacity: 0.8 }}>Thresholds that activate the recovery plan</small>
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Capital Triggers</Form.Label>
                        <Form.Control as="textarea" rows={2} name="capitalTriggers"
                            value={form.capitalTriggers} onChange={handle} disabled={readOnly}
                            placeholder="e.g. CAR drops below 10% → Early Warning; CAR below 8% → Recovery Plan activation" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Liquidity Triggers</Form.Label>
                        <Form.Control as="textarea" rows={2} name="liquidityTriggers"
                            value={form.liquidityTriggers} onChange={handle} disabled={readOnly}
                            placeholder="e.g. LCR drops below 110% → monitoring; LCR below 100% → contingency plan activation" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Profitability / Asset Quality Triggers</Form.Label>
                        <Form.Control as="textarea" rows={2} name="profitabilityTriggers"
                            value={form.profitabilityTriggers} onChange={handle} disabled={readOnly}
                            placeholder="e.g. NPL ratio exceeds 10%, 3 consecutive quarters of net loss" />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Recovery Options */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#3d5a3e', color: 'white', fontWeight: 600 }}>
                    Recovery Options
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Recapitalisation Options</Form.Label>
                        <Form.Control as="textarea" rows={2} name="recapitalisationOptions"
                            value={form.recapitalisationOptions} onChange={handle} disabled={readOnly}
                            placeholder="e.g. Rights issue, private placement, subordinated debt issuance, shareholder capital injection" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Asset Disposal Options</Form.Label>
                        <Form.Control as="textarea" rows={2} name="assetDisposalOptions"
                            value={form.assetDisposalOptions} onChange={handle} disabled={readOnly}
                            placeholder="e.g. Non-core asset sales, loan portfolio disposal, subsidiary divestiture" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Business Restructuring Options</Form.Label>
                        <Form.Control as="textarea" rows={2} name="businessRestructuringOptions"
                            value={form.businessRestructuringOptions} onChange={handle} disabled={readOnly}
                            placeholder="e.g. Branch closures, product line discontinuation, merger or acquisition" />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Crisis Management Framework */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#6b3a00', color: 'white', fontWeight: 600 }}>
                    Crisis Management Framework
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center mb-3">
                        <Col>
                            <Form.Check type="checkbox" id="hasCMF" label="Crisis Management Framework (CMF) in place"
                                name="hasCrisisManagementFramework" checked={!!form.hasCrisisManagementFramework}
                                onChange={handle} disabled={readOnly} className="fw-bold" />
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Crisis Management Team Composition</Form.Label>
                        <Form.Control as="textarea" rows={2} name="crisisManagementTeamComposition"
                            value={form.crisisManagementTeamComposition} onChange={handle} disabled={readOnly}
                            placeholder="e.g. CEO (Chair), CFO, CRO, Head of Legal, Head of IT — convenes within 4 hours of trigger" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Stakeholder Communication Plan</Form.Label>
                        <Form.Control as="textarea" rows={3} name="communicationPlan"
                            value={form.communicationPlan} onChange={handle} disabled={readOnly}
                            placeholder="Describe communication protocols with: RBZ, major depositors, staff, media, and the public during a crisis." />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Systemic Risk & Cross-border */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#4a3570', color: 'white', fontWeight: 600 }}>
                    Systemic Risk & Cross-border Exposure
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Cross-border Exposure (USD)</Form.Label>
                                <Form.Control type="number" name="crossBorderExposureUsd"
                                    value={form.crossBorderExposureUsd} onChange={handle} disabled={readOnly}
                                    placeholder="Total exposure to foreign counterparties" />
                            </Form.Group>
                        </Col>
                        <Col md={8}>
                            <Form.Check type="checkbox" id="foreignSubs" className="mt-4 mb-3"
                                label="Has significant foreign subsidiaries or affiliates"
                                name="hasSignificantForeignSubsidiaries" checked={!!form.hasSignificantForeignSubsidiaries}
                                onChange={handle} disabled={readOnly} />
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Systemic Risk Assessment</Form.Label>
                        <Form.Control as="textarea" rows={3} name="systemicRiskAssessment"
                            value={form.systemicRiskAssessment} onChange={handle} disabled={readOnly}
                            placeholder="Assess whether this institution is systemically important (too big to fail) and how its failure would affect the broader Zimbabwean financial system." />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* RBZ Notification */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#8b1a1a', color: 'white', fontWeight: 600 }}>
                    RBZ Resolution Authority Notification
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <Form.Check type="checkbox" id="notified" label="RBZ resolution authority has been notified of the Recovery Plan"
                                name="resolutionAuthorityNotified" checked={!!form.resolutionAuthorityNotified}
                                onChange={handle} disabled={readOnly} className="fw-bold mb-3" />
                        </Col>
                        {form.resolutionAuthorityNotified && (
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Notification Date</Form.Label>
                                    <Form.Control type="date" name="notificationDate"
                                        value={form.notificationDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                    {!form.resolutionAuthorityNotified && (
                        <Alert variant="warning" className="mb-0 small">
                            RBZ notification of the Recovery Plan is expected before license issuance for commercial banks.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {!readOnly && (
                <div className="d-flex gap-3">
                    <Button onClick={handleSave} disabled={saving}
                        style={{ background: '#003366', border: 'none', fontWeight: 600, padding: '10px 32px' }}>
                        {saving ? 'Saving...' : 'Save & Continue'}
                    </Button>
                    {saved && (
                        <Button variant="outline-success" onClick={() => onComplete && onComplete()}>
                            Proceed to Next Stage →
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
