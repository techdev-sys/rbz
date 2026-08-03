import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

const RatioBadge = ({ value, min, label }) => {
    if (value === '' || value === null || value === undefined) return null;
    const num = parseFloat(value);
    const ok = !isNaN(num) && num >= min;
    return <Badge bg={ok ? 'success' : 'danger'} className="ms-2">{ok ? '✓' : '✗'} {label}</Badge>;
};

export default function StageBankLiquidity({ onComplete, readOnly }) {
    const companyId = localStorage.getItem('currentCompanyId');
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        companyId: Number(companyId),
        reportingPeriod: '',
        hqlaLevel1: '', hqlaLevel2A: '', hqlaLevel2B: '',
        totalHqla: '',
        totalNetCashOutflows30Days: '',
        liquidityCoverageRatio: '',
        availableStableFunding: '',
        requiredStableFunding: '',
        netStableFundingRatio: '',
        liquidAssets: '',
        totalDeposits: '',
        liquidityRatio: '',
        hasStressTestingFramework: false,
        stressTestFrequency: 'QUARTERLY',
        liquidityContingencyPlan: '',
        liquidityRiskNarrative: '',
    };

    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!companyId) { setLoading(false); return; }
        axios.get(`${API_URL}/liquidity/${companyId}`, { headers })
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
            const res = await axios.post(`${API_URL}/liquidity/save`, form, { headers });
            setForm(prev => ({ ...prev, ...res.data }));
            setSaved(true);
        } catch (err) {
            setError(err.response?.data || 'Failed to save.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-5 text-center text-muted">Loading...</div>;

    const lcr = parseFloat(form.liquidityCoverageRatio);
    const nsfr = parseFloat(form.netStableFundingRatio);
    const liqRatio = parseFloat(form.liquidityRatio);

    return (
        <div className="p-4">
            <div className="mb-4">
                <h4 style={{ color: '#003366', fontWeight: 700 }}>Liquidity Management (Basel III)</h4>
                <p className="text-muted small mb-0">
                    Commercial Banks must maintain adequate liquidity per RBZ and Basel III requirements.
                    Minimum: <strong>LCR ≥ 100%</strong> and <strong>NSFR ≥ 100%</strong>.
                </p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {saved && <Alert variant="success" dismissible onClose={() => setSaved(false)}>Saved. Ratios computed by the server.</Alert>}

            {/* Compliance Summary */}
            {(form.liquidityCoverageRatio || form.netStableFundingRatio) && (
                <Card className="mb-4 border-0 shadow-sm" style={{ background: '#f0f4f8' }}>
                    <Card.Body>
                        <div className="d-flex gap-4 flex-wrap">
                            <div>
                                <small className="text-muted fw-bold d-block">LCR</small>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: !isNaN(lcr) && lcr >= 100 ? '#1a5c2e' : '#8b1a1a' }}>
                                    {form.liquidityCoverageRatio ? `${form.liquidityCoverageRatio}%` : '—'}
                                </span>
                                <RatioBadge value={form.liquidityCoverageRatio} min={100} label="≥ 100%" />
                            </div>
                            <div>
                                <small className="text-muted fw-bold d-block">NSFR</small>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: !isNaN(nsfr) && nsfr >= 100 ? '#1a5c2e' : '#8b1a1a' }}>
                                    {form.netStableFundingRatio ? `${form.netStableFundingRatio}%` : '—'}
                                </span>
                                <RatioBadge value={form.netStableFundingRatio} min={100} label="≥ 100%" />
                            </div>
                            <div>
                                <small className="text-muted fw-bold d-block">Liquidity Ratio</small>
                                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: !isNaN(liqRatio) && liqRatio >= 25 ? '#1a5c2e' : '#8b6b00' }}>
                                    {form.liquidityRatio ? `${form.liquidityRatio}%` : '—'}
                                </span>
                                <RatioBadge value={form.liquidityRatio} min={25} label="≥ 25%" />
                            </div>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* LCR — Liquidity Coverage Ratio */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#003366', color: 'white', fontWeight: 600 }}>
                    Liquidity Coverage Ratio (LCR)
                    <small className="ms-2" style={{ fontWeight: 400, opacity: 0.8 }}>LCR = HQLA / Net 30-day Cash Outflows ≥ 100%</small>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Level 1 HQLA — USD (cash, gov bonds)</Form.Label>
                                <Form.Control type="number" name="hqlaLevel1" value={form.hqlaLevel1} onChange={handle} disabled={readOnly} placeholder="0" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Level 2A HQLA — USD (agency bonds, 15% haircut)</Form.Label>
                                <Form.Control type="number" name="hqlaLevel2A" value={form.hqlaLevel2A} onChange={handle} disabled={readOnly} placeholder="0" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Level 2B HQLA — USD (corp bonds, 50% haircut)</Form.Label>
                                <Form.Control type="number" name="hqlaLevel2B" value={form.hqlaLevel2B} onChange={handle} disabled={readOnly} placeholder="0" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Total Net Cash Outflows — 30-day stress (USD)</Form.Label>
                                <Form.Control type="number" name="totalNetCashOutflows30Days" value={form.totalNetCashOutflows30Days} onChange={handle} disabled={readOnly} placeholder="0" />
                                <small className="text-muted">Stressed outflows under a 30-day liquidity crisis scenario</small>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Computed LCR (%)</Form.Label>
                                <Form.Control value={form.liquidityCoverageRatio || 'Computed after save'} readOnly
                                    style={{ background: '#f8f9fa', fontWeight: 600 }} />
                                <small className="text-muted">Auto-computed on save: (L1 + 0.85×L2A + 0.5×L2B) / Net Outflows × 100</small>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* NSFR */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#1a4a7a', color: 'white', fontWeight: 600 }}>
                    Net Stable Funding Ratio (NSFR)
                    <small className="ms-2" style={{ fontWeight: 400, opacity: 0.8 }}>NSFR = ASF / RSF ≥ 100%</small>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Available Stable Funding (ASF) — USD</Form.Label>
                                <Form.Control type="number" name="availableStableFunding" value={form.availableStableFunding} onChange={handle} disabled={readOnly} placeholder="Long-term liabilities + equity" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Required Stable Funding (RSF) — USD</Form.Label>
                                <Form.Control type="number" name="requiredStableFunding" value={form.requiredStableFunding} onChange={handle} disabled={readOnly} placeholder="Illiquid assets requiring stable funding" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Computed NSFR (%)</Form.Label>
                                <Form.Control value={form.netStableFundingRatio || 'Computed after save'} readOnly style={{ background: '#f8f9fa', fontWeight: 600 }} />
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Traditional Liquidity Ratio */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#3d5a3e', color: 'white', fontWeight: 600 }}>
                    Traditional Liquidity Ratio
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Liquid Assets — USD</Form.Label>
                                <Form.Control type="number" name="liquidAssets" value={form.liquidAssets} onChange={handle} disabled={readOnly} placeholder="Cash + near-cash assets" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Total Deposits — USD</Form.Label>
                                <Form.Control type="number" name="totalDeposits" value={form.totalDeposits} onChange={handle} disabled={readOnly} placeholder="Total customer deposits" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Liquidity Ratio (%)</Form.Label>
                                <Form.Control value={form.liquidityRatio || 'Computed after save'} readOnly style={{ background: '#f8f9fa', fontWeight: 600 }} />
                                <small className="text-muted">Recommended ≥ 25%</small>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Stress Testing & Contingency */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#6b3a00', color: 'white', fontWeight: 600 }}>
                    Stress Testing & Contingency Planning
                </Card.Header>
                <Card.Body>
                    <Row className="align-items-center mb-3">
                        <Col md={6}>
                            <Form.Check id="stressFramework" type="checkbox" label="Liquidity stress testing framework in place"
                                name="hasStressTestingFramework" checked={!!form.hasStressTestingFramework}
                                onChange={handle} disabled={readOnly} className="fw-bold" />
                        </Col>
                        {form.hasStressTestingFramework && (
                            <Col md={4}>
                                <Form.Select name="stressTestFrequency" value={form.stressTestFrequency} onChange={handle} disabled={readOnly}>
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="QUARTERLY">Quarterly</option>
                                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                                    <option value="ANNUAL">Annual</option>
                                </Form.Select>
                            </Col>
                        )}
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Liquidity Contingency Plan *</Form.Label>
                        <Form.Control as="textarea" rows={4} name="liquidityContingencyPlan"
                            value={form.liquidityContingencyPlan} onChange={handle} disabled={readOnly}
                            placeholder="Describe the bank's plan for managing a liquidity crisis. Include: early warning indicators, escalation procedures, emergency liquidity sources (e.g. RBZ lender of last resort), and timeline for resolution." />
                        <small className="text-muted">Mandatory for commercial banks</small>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Liquidity Risk Management Narrative</Form.Label>
                        <Form.Control as="textarea" rows={3} name="liquidityRiskNarrative"
                            value={form.liquidityRiskNarrative} onChange={handle} disabled={readOnly}
                            placeholder="Describe the bank's overall approach to liquidity risk management, governance, and monitoring." />
                    </Form.Group>
                </Card.Body>
            </Card>

            {!readOnly && (
                <div className="d-flex gap-3">
                    <Button onClick={handleSave} disabled={saving}
                        style={{ background: '#003366', border: 'none', fontWeight: 600, padding: '10px 32px' }}>
                        {saving ? 'Saving...' : 'Save & Compute Ratios'}
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
