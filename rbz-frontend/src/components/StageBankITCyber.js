import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

const CheckRow = ({ label, value, readOnly, name, onChange }) => (
    <div className="d-flex align-items-center justify-content-between py-2 border-bottom">
        <span className="small fw-bold">{label}</span>
        <div className="d-flex align-items-center gap-3">
            {value !== undefined && !readOnly ? null : (
                <Badge bg={value ? 'success' : 'danger'}>{value ? '✓ Yes' : '✗ No'}</Badge>
            )}
            {!readOnly && (
                <Form.Check type="switch" id={`switch-${name}`} name={name} checked={!!value}
                    onChange={onChange} className="mb-0" />
            )}
        </div>
    </div>
);

export default function StageBankITCyber({ onComplete, readOnly }) {
    const companyId = localStorage.getItem('currentCompanyId');
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        companyId: Number(companyId),
        hasITPolicy: false,
        itPolicyApprovedDate: '',
        itGovernanceModel: '',
        hasCyberIncidentResponsePlan: false,
        cyberResponsePlanDate: '',
        hasDataProtectionPolicy: false,
        hasDisasterRecoveryPlan: false,
        drTestingFrequency: 'QUARTERLY',
        lastDrTestDate: '',
        hasBusinessContinuityPlan: false,
        bcpLastReviewDate: '',
        coreBankingSystemVendor: '',
        cloudStorageUsed: false,
        dataResidencyZimbabwe: true,
        primaryDataCentreLocation: '',
        lastPenetrationTestDate: '',
        penetrationTestingFirm: '',
        penTestOutcome: '',
        hasCyberInsurance: false,
        cyberInsuranceCoverageUsd: '',
        itGovernanceNarrative: '',
    };

    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!companyId) { setLoading(false); return; }
        axios.get(`${API_URL}/it-cyber-risk/${companyId}`, { headers })
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
            await axios.post(`${API_URL}/it-cyber-risk/save`, form, { headers });
            setSaved(true);
        } catch (err) {
            setError(err.response?.data || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    const mandatoryOk = form.hasITPolicy && form.hasCyberIncidentResponsePlan
        && form.hasDisasterRecoveryPlan && form.hasBusinessContinuityPlan;

    if (loading) return <div className="p-5 text-center text-muted">Loading...</div>;

    return (
        <div className="p-4">
            <div className="mb-4">
                <h4 style={{ color: '#003366', fontWeight: 700 }}>IT & Cyber Risk Management</h4>
                <p className="text-muted small mb-0">
                    Commercial Banks must demonstrate robust IT governance and cyber security controls
                    per the <strong>RBZ IT Risk Management Guideline</strong> and the <strong>Zimbabwe Data Protection Act</strong>.
                </p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {saved && <Alert variant="success" dismissible onClose={() => setSaved(false)}>Saved successfully.</Alert>}

            {/* Compliance summary */}
            <Card className="mb-4 border-0 shadow-sm" style={{ background: mandatoryOk ? '#e8f5ec' : '#fce8e8' }}>
                <Card.Body>
                    <div className="d-flex align-items-center gap-3">
                        <span style={{ fontSize: '1.5rem' }}>{mandatoryOk ? '✅' : '⚠️'}</span>
                        <div>
                            <strong>{mandatoryOk ? 'Mandatory IT controls confirmed' : 'Mandatory IT controls incomplete'}</strong>
                            <div className="small text-muted mt-1">
                                IT Policy, Cyber Incident Plan, Disaster Recovery Plan, and Business Continuity Plan are all required.
                            </div>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Mandatory Controls */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#003366', color: 'white', fontWeight: 600 }}>
                    Mandatory IT Governance Controls
                </Card.Header>
                <Card.Body>
                    <CheckRow label="Board-approved IT Policy" value={form.hasITPolicy} name="hasITPolicy" readOnly={readOnly} onChange={handle} />
                    {form.hasITPolicy && (
                        <Row className="mt-2 mb-2">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">IT Policy Approval Date</Form.Label>
                                    <Form.Control type="date" name="itPolicyApprovedDate" value={form.itPolicyApprovedDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">Governance Framework</Form.Label>
                                    <Form.Select name="itGovernanceModel" value={form.itGovernanceModel} onChange={handle} disabled={readOnly}>
                                        <option value="">Select...</option>
                                        <option value="ISO_27001">ISO 27001</option>
                                        <option value="COBIT">COBIT</option>
                                        <option value="NIST">NIST Cybersecurity Framework</option>
                                        <option value="INTERNAL">Internal Framework</option>
                                        <option value="OTHER">Other</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                    <CheckRow label="Cyber Incident Response Plan" value={form.hasCyberIncidentResponsePlan} name="hasCyberIncidentResponsePlan" readOnly={readOnly} onChange={handle} />
                    {form.hasCyberIncidentResponsePlan && (
                        <Row className="mt-2 mb-2">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">Plan Date</Form.Label>
                                    <Form.Control type="date" name="cyberResponsePlanDate" value={form.cyberResponsePlanDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                    <CheckRow label="Zimbabwe Data Protection Act compliance policy" value={form.hasDataProtectionPolicy} name="hasDataProtectionPolicy" readOnly={readOnly} onChange={handle} />
                    <CheckRow label="Disaster Recovery Plan (DRP)" value={form.hasDisasterRecoveryPlan} name="hasDisasterRecoveryPlan" readOnly={readOnly} onChange={handle} />
                    {form.hasDisasterRecoveryPlan && (
                        <Row className="mt-2 mb-2">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">DR Testing Frequency</Form.Label>
                                    <Form.Select name="drTestingFrequency" value={form.drTestingFrequency} onChange={handle} disabled={readOnly}>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly (Recommended)</option>
                                        <option value="SEMI_ANNUAL">Semi-Annual</option>
                                        <option value="ANNUAL">Annual</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">Last DR Test Date</Form.Label>
                                    <Form.Control type="date" name="lastDrTestDate" value={form.lastDrTestDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                    <CheckRow label="Business Continuity Plan (BCP)" value={form.hasBusinessContinuityPlan} name="hasBusinessContinuityPlan" readOnly={readOnly} onChange={handle} />
                    {form.hasBusinessContinuityPlan && (
                        <Row className="mt-2 mb-2">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="small text-muted">BCP Last Review Date</Form.Label>
                                    <Form.Control type="date" name="bcpLastReviewDate" value={form.bcpLastReviewDate} onChange={handle} disabled={readOnly} />
                                </Form.Group>
                            </Col>
                        </Row>
                    )}
                </Card.Body>
            </Card>

            {/* Core Banking System */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#1a4a7a', color: 'white', fontWeight: 600 }}>
                    Core Banking System & Data
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Core Banking System Vendor</Form.Label>
                                <Form.Control name="coreBankingSystemVendor" value={form.coreBankingSystemVendor}
                                    onChange={handle} disabled={readOnly} placeholder="e.g. Temenos T24, Finacle, Oracle FLEXCUBE" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Primary Data Centre Location</Form.Label>
                                <Form.Control name="primaryDataCentreLocation" value={form.primaryDataCentreLocation}
                                    onChange={handle} disabled={readOnly} placeholder="e.g. Harare, Zimbabwe" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Check type="checkbox" id="cloudStorage" label="Cloud storage is used"
                                name="cloudStorageUsed" checked={!!form.cloudStorageUsed}
                                onChange={handle} disabled={readOnly} className="mb-3" />
                        </Col>
                        <Col md={6}>
                            <Form.Check type="checkbox" id="dataZim" label="Core customer data is resident in Zimbabwe"
                                name="dataResidencyZimbabwe" checked={!!form.dataResidencyZimbabwe}
                                onChange={handle} disabled={readOnly} className="mb-3 fw-bold" />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Penetration Testing */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#3d5a3e', color: 'white', fontWeight: 600 }}>
                    Security Testing & Cyber Insurance
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Last Penetration Test Date</Form.Label>
                                <Form.Control type="date" name="lastPenetrationTestDate" value={form.lastPenetrationTestDate} onChange={handle} disabled={readOnly} />
                                <small className="text-muted">RBZ recommends annual pen testing</small>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Penetration Testing Firm</Form.Label>
                                <Form.Control name="penetrationTestingFirm" value={form.penetrationTestingFirm} onChange={handle} disabled={readOnly} placeholder="Independent security firm name" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Outcome</Form.Label>
                                <Form.Select name="penTestOutcome" value={form.penTestOutcome} onChange={handle} disabled={readOnly}>
                                    <option value="">Select...</option>
                                    <option value="PASS">Pass — no critical findings</option>
                                    <option value="PASS_WITH_FINDINGS">Pass with findings — remediated</option>
                                    <option value="FAIL">Fail — open critical findings</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="align-items-center">
                        <Col md={4}>
                            <Form.Check type="checkbox" id="cyberIns" label="Cyber liability insurance in place"
                                name="hasCyberInsurance" checked={!!form.hasCyberInsurance}
                                onChange={handle} disabled={readOnly} className="mb-3" />
                        </Col>
                        {form.hasCyberInsurance && (
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted">Coverage Amount (USD)</Form.Label>
                                    <Form.Control type="number" name="cyberInsuranceCoverageUsd" value={form.cyberInsuranceCoverageUsd} onChange={handle} disabled={readOnly} placeholder="0" />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>
                </Card.Body>
            </Card>

            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Form.Group>
                        <Form.Label className="small fw-bold text-muted">IT Governance Narrative</Form.Label>
                        <Form.Control as="textarea" rows={4} name="itGovernanceNarrative"
                            value={form.itGovernanceNarrative} onChange={handle} disabled={readOnly}
                            placeholder="Describe the bank's overall approach to IT and cyber risk management, board oversight, and key initiatives planned." />
                    </Form.Group>
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
