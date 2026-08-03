import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

const complianceBadge = (ok, label) => (
    <Badge bg={ok ? 'success' : 'danger'} className="ms-2">
        {ok ? '✓ ' : '✗ '}{label}
    </Badge>
);

const MIN_PAID_UP = 30_000_000;   // RBZ 2024: USD 30M
const MIN_CAR = 12;               // RBZ minimum CAR %

export default function StageBankCapitalAdequacy({ onComplete, readOnly }) {
    const companyId = localStorage.getItem('currentCompanyId');
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        companyId: Number(companyId),
        paidUpShareCapital: '',
        retainedEarnings: '',
        otherReserves: '',
        tier1Capital: '',
        generalLoanLossProvisions: '',
        subordinatedDebt: '',
        revaluationReserves: '',
        tier2Capital: '',
        riskWeightedAssets: '',
        offBalanceSheetExposures: '',
        capitalAdequacyRatio: '',
        tier1Ratio: '',
        capitalPlanNarrative: '',
        reportingPeriod: '',
    };

    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    // Derived compliance indicators (client-side preview)
    const t1 = parseFloat(form.tier1Capital) || 0;
    const t2 = parseFloat(form.tier2Capital) || 0;
    const rwa = parseFloat(form.riskWeightedAssets) || 0;
    const paidUp = parseFloat(form.paidUpShareCapital) || 0;
    const car = rwa > 0 ? ((t1 + t2) / rwa) * 100 : 0;
    const t1Ratio = rwa > 0 ? (t1 / rwa) * 100 : 0;
    const meetsPaidUp = paidUp >= MIN_PAID_UP;
    const meetsCAR = car >= MIN_CAR;
    const tier2Ok = t1 > 0 && t2 <= t1;

    // Auto-sum Tier 1
    useEffect(() => {
        const sum =
            (parseFloat(form.paidUpShareCapital) || 0) +
            (parseFloat(form.retainedEarnings) || 0) +
            (parseFloat(form.otherReserves) || 0);
        setForm(f => ({ ...f, tier1Capital: sum > 0 ? sum.toFixed(2) : '' }));
    }, [form.paidUpShareCapital, form.retainedEarnings, form.otherReserves]);

    // Auto-sum Tier 2
    useEffect(() => {
        const sum =
            (parseFloat(form.generalLoanLossProvisions) || 0) +
            (parseFloat(form.subordinatedDebt) || 0) +
            (parseFloat(form.revaluationReserves) || 0);
        setForm(f => ({ ...f, tier2Capital: sum > 0 ? sum.toFixed(2) : '' }));
    }, [form.generalLoanLossProvisions, form.subordinatedDebt, form.revaluationReserves]);

    useEffect(() => {
        if (!companyId) return;
        setLoading(true);
        axios.get(`${API_URL}/capital-adequacy/${companyId}`, { headers })
            .then(r => { if (r.data) setForm({ ...blank, ...r.data }); })
            .catch(() => {})
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await axios.post(`${API_URL}/capital-adequacy/save`, form, { headers });
            setSaved(true);
        } catch (err) {
            setError(err.response?.data || 'Failed to save capital adequacy return.');
        } finally {
            setSaving(false);
        }
    };

    const handleComplete = async () => {
        await handleSave({ preventDefault: () => {} });
        if (onComplete) onComplete();
    };

    const money = (name, label, hint) => (
        <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted mb-1">
                {label} <span className="text-muted fw-normal">(US$)</span>
            </Form.Label>
            {hint && <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>{hint}</div>}
            <Form.Control
                type="number"
                name={name}
                value={form[name]}
                onChange={handleChange}
                disabled={readOnly}
                min="0"
                step="0.01"
                placeholder="0.00"
                style={{ borderColor: '#e2e8f0' }}
            />
        </Form.Group>
    );

    const computed = (label, value, suffix = '') => (
        <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted mb-1">{label}</Form.Label>
            <Form.Control
                readOnly
                value={value ? `${parseFloat(value).toLocaleString('en-US', { maximumFractionDigits: 2 })}${suffix}` : '—'}
                style={{ background: '#f0f4f8', borderColor: '#e2e8f0', color: '#003366', fontWeight: 600 }}
            />
        </Form.Group>
    );

    if (loading) return <div className="p-4 text-center text-muted">Loading capital adequacy data…</div>;

    return (
        <div className="p-4" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="mb-4">
                <h5 className="fw-bold" style={{ color: '#003366' }}>Capital Adequacy Return (Basel III)</h5>
                <p className="text-muted small mb-0">
                    RBZ minimum: paid-up capital ≥ US$30,000,000 · CAR ≥ 12% · Tier 2 ≤ Tier 1
                </p>
            </div>

            {/* Live compliance dashboard */}
            <Card className="mb-4" style={{ borderColor: '#003366', background: '#f8fafd' }}>
                <Card.Body className="py-3">
                    <div className="d-flex flex-wrap gap-3 align-items-center">
                        <span className="fw-bold small" style={{ color: '#003366' }}>Compliance Status:</span>
                        {complianceBadge(meetsPaidUp, `Paid-up ≥ US$${MIN_PAID_UP.toLocaleString()}`)}
                        {complianceBadge(meetsCAR, `CAR ${car.toFixed(2)}% ≥ ${MIN_CAR}%`)}
                        {complianceBadge(tier2Ok, 'Tier 2 ≤ Tier 1')}
                        {car > 0 && (
                            <span className="ms-auto text-muted small">
                                Tier 1 Ratio: <strong>{t1Ratio.toFixed(2)}%</strong>
                            </span>
                        )}
                    </div>
                </Card.Body>
            </Card>

            {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
            {saved && <Alert variant="success" onClose={() => setSaved(false)} dismissible>Capital adequacy return saved.</Alert>}

            <Form onSubmit={handleSave}>

                {/* Reporting period */}
                <Row className="mb-2">
                    <Col md={4}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted mb-1">Reporting Period</Form.Label>
                            <Form.Control
                                name="reportingPeriod"
                                value={form.reportingPeriod}
                                onChange={handleChange}
                                disabled={readOnly}
                                placeholder="e.g. Q4 2025"
                                style={{ borderColor: '#e2e8f0' }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <hr className="my-3" />

                {/* Tier 1 */}
                <h6 className="fw-bold mb-3" style={{ color: '#003366', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                    Tier 1 Capital — Core Capital
                </h6>
                <Row>
                    <Col md={4}>{money('paidUpShareCapital', 'Paid-Up Share Capital', 'Must be ≥ US$30,000,000')}</Col>
                    <Col md={4}>{money('retainedEarnings', 'Retained Earnings')}</Col>
                    <Col md={4}>{money('otherReserves', 'Other Qualifying Reserves')}</Col>
                </Row>
                <Row>
                    <Col md={4}>{computed('Tier 1 Capital (auto-summed)', form.tier1Capital, ' USD')}</Col>
                </Row>

                <hr className="my-3" />

                {/* Tier 2 */}
                <h6 className="fw-bold mb-3" style={{ color: '#003366', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                    Tier 2 Capital — Supplementary Capital
                </h6>
                <Row>
                    <Col md={4}>{money('generalLoanLossProvisions', 'General Loan Loss Provisions')}</Col>
                    <Col md={4}>{money('subordinatedDebt', 'Subordinated Debt')}</Col>
                    <Col md={4}>{money('revaluationReserves', 'Revaluation Reserves')}</Col>
                </Row>
                <Row>
                    <Col md={4}>{computed('Tier 2 Capital (auto-summed)', form.tier2Capital, ' USD')}</Col>
                    <Col md={4} className="d-flex align-items-end pb-3">
                        {t2 > 0 && !tier2Ok && (
                            <Alert variant="warning" className="py-2 px-3 mb-0 small">
                                Tier 2 exceeds Tier 1 — Basel III violation.
                            </Alert>
                        )}
                    </Col>
                </Row>

                <hr className="my-3" />

                {/* RWA */}
                <h6 className="fw-bold mb-3" style={{ color: '#003366', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                    Risk-Weighted Assets
                </h6>
                <Row>
                    <Col md={4}>{money('riskWeightedAssets', 'Risk-Weighted Assets (RWA)')}</Col>
                    <Col md={4}>{money('offBalanceSheetExposures', 'Off-Balance-Sheet Exposures')}</Col>
                </Row>

                <hr className="my-3" />

                {/* Computed ratios */}
                <h6 className="fw-bold mb-3" style={{ color: '#003366', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                    Capital Ratios (auto-computed)
                </h6>
                <Row>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted mb-1">
                                Capital Adequacy Ratio
                            </Form.Label>
                            <Form.Control
                                readOnly
                                value={rwa > 0 ? `${car.toFixed(2)}%` : '—'}
                                style={{
                                    background: meetsCAR ? '#d4edda' : rwa > 0 ? '#f8d7da' : '#f0f4f8',
                                    borderColor: '#e2e8f0',
                                    fontWeight: 700,
                                    color: meetsCAR ? '#155724' : rwa > 0 ? '#721c24' : '#003366'
                                }}
                            />
                            <Form.Text className="text-muted">Min: {MIN_CAR}%</Form.Text>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted mb-1">Tier 1 Ratio</Form.Label>
                            <Form.Control
                                readOnly
                                value={rwa > 0 ? `${t1Ratio.toFixed(2)}%` : '—'}
                                style={{ background: '#f0f4f8', borderColor: '#e2e8f0', fontWeight: 600, color: '#003366' }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mb-3">
                            <Form.Label className="small fw-bold text-muted mb-1">Total Capital (T1 + T2)</Form.Label>
                            <Form.Control
                                readOnly
                                value={t1 + t2 > 0 ? `US$ ${(t1 + t2).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}
                                style={{ background: '#f0f4f8', borderColor: '#e2e8f0', fontWeight: 600, color: '#003366' }}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <hr className="my-3" />

                {/* Capital plan narrative */}
                <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted mb-1">
                        Capital Plan Narrative
                        <span className="text-muted fw-normal ms-2">(strategy for maintaining capital adequacy)</span>
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="capitalPlanNarrative"
                        value={form.capitalPlanNarrative}
                        onChange={handleChange}
                        disabled={readOnly}
                        placeholder="Describe the institution's capital maintenance strategy, stress testing approach, and plans for any capital shortfalls…"
                        style={{ borderColor: '#e2e8f0' }}
                    />
                </Form.Group>

                {!readOnly && (
                    <div className="d-flex gap-2 justify-content-end">
                        <Button
                            variant="outline-secondary"
                            type="submit"
                            disabled={saving}
                            style={{ borderRadius: '8px', fontWeight: 600 }}
                        >
                            {saving ? 'Saving…' : 'Save Draft'}
                        </Button>
                        <Button
                            onClick={handleComplete}
                            disabled={saving || !form.riskWeightedAssets}
                            style={{ background: '#003366', border: 'none', borderRadius: '8px', fontWeight: 600, padding: '8px 24px' }}
                        >
                            Save & Continue →
                        </Button>
                    </div>
                )}
            </Form>
        </div>
    );
}
