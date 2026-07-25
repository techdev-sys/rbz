import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert, Card, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = '/api';

const statusBadge = (status) => {
    const map = {
        REGISTERED: { bg: 'success', label: 'Registered' },
        PENDING: { bg: 'warning', label: 'Pending Registration' },
        NOT_REGISTERED: { bg: 'danger', label: 'Not Registered' },
        NOT_APPLICABLE: { bg: 'secondary', label: 'Not Applicable' },
    };
    const cfg = map[status] || { bg: 'secondary', label: status || '—' };
    return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
};

export default function StageDTMFIDepositProtection({ onComplete, readOnly }) {
    const companyId = localStorage.getItem('currentCompanyId');
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    const blank = {
        companyId: Number(companyId),
        dipfRegistrationStatus: 'PENDING',
        dipfRegistrationNumber: '',
        dipfRegistrationDate: '',
        totalDepositLiabilities: '',
        maximumInsuredDepositPerDepositor: '500',
        depositInsurancePremiumPaid: false,
        premiumAmount: '',
        premiumPaymentDate: '',
        premiumPaymentReceiptNumber: '',
        liquidAssets: '',
        liquidityBufferRatio: '',
        depositRunoffProtocol: '',
        depositorProtectionNarrative: '',
    };

    const [form, setForm] = useState(blank);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!companyId) { setLoading(false); return; }
        axios.get(`${API_URL}/deposit-protection/${companyId}`, { headers })
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

    const computeBufferRatio = (assets, deposits) => {
        const a = parseFloat(assets);
        const d = parseFloat(deposits);
        if (!isNaN(a) && !isNaN(d) && d > 0) {
            return ((a / d) * 100).toFixed(2);
        }
        return '';
    };

    const handleAssetChange = (e) => {
        const assets = e.target.value;
        setForm(prev => ({
            ...prev,
            liquidAssets: assets,
            liquidityBufferRatio: computeBufferRatio(assets, prev.totalDepositLiabilities),
        }));
        setSaved(false);
    };

    const handleDepositChange = (e) => {
        const deposits = e.target.value;
        setForm(prev => ({
            ...prev,
            totalDepositLiabilities: deposits,
            liquidityBufferRatio: computeBufferRatio(prev.liquidAssets, deposits),
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true); setError(null);
        try {
            await axios.post(`${API_URL}/deposit-protection/save`, form, { headers });
            setSaved(true);
        } catch (err) {
            setError(err.response?.data || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const bufferOk = parseFloat(form.liquidityBufferRatio) >= 10;
    const dipfRegistered = form.dipfRegistrationStatus === 'REGISTERED';
    const dipfPending = form.dipfRegistrationStatus === 'PENDING';

    if (loading) return <div className="p-5 text-center text-muted">Loading...</div>;

    return (
        <div className="p-4">
            <div className="mb-4">
                <h4 style={{ color: '#003366', fontWeight: 700 }}>Deposit Protection (DIPF)</h4>
                <p className="text-muted small mb-0">
                    Deposit-Taking Microfinance Institutions must be registered with the <strong>Deposit Insurance
                    and Protection Fund (DIPF)</strong> as required by the Microfinance Act [Chapter 24:29].
                </p>
            </div>

            {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
            {saved && <Alert variant="success" dismissible onClose={() => setSaved(false)}>Saved successfully.</Alert>}

            {/* DIPF Registration */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#003366', color: 'white', fontWeight: 600 }}>
                    DIPF Registration Status
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Registration Status *</Form.Label>
                                <Form.Select name="dipfRegistrationStatus" value={form.dipfRegistrationStatus}
                                    onChange={handle} disabled={readOnly}>
                                    <option value="REGISTERED">Registered</option>
                                    <option value="PENDING">Pending Registration</option>
                                    <option value="NOT_REGISTERED">Not Registered</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">DIPF Registration Number</Form.Label>
                                <Form.Control name="dipfRegistrationNumber" value={form.dipfRegistrationNumber}
                                    onChange={handle} disabled={readOnly || !dipfRegistered}
                                    placeholder={dipfRegistered ? 'e.g. DIPF/2025/0042' : 'N/A'} />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Registration Date</Form.Label>
                                <Form.Control type="date" name="dipfRegistrationDate" value={form.dipfRegistrationDate}
                                    onChange={handle} disabled={readOnly || !dipfRegistered} />
                            </Form.Group>
                        </Col>
                    </Row>

                    {!dipfRegistered && !dipfPending && (
                        <Alert variant="danger" className="mb-0">
                            <strong>DIPF registration is mandatory.</strong> DTMFIs cannot accept deposits
                            without DIPF coverage. Registration must be completed before license issuance.
                        </Alert>
                    )}
                    {dipfPending && (
                        <Alert variant="warning" className="mb-0">
                            Registration is pending. The application can proceed, but license issuance requires
                            confirmed DIPF registration.
                        </Alert>
                    )}
                    {dipfRegistered && (
                        <Alert variant="success" className="mb-0">
                            {statusBadge('REGISTERED')} DIPF registration confirmed.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Deposit Insurance Premium */}
            {dipfRegistered && (
                <Card className="mb-4 shadow-sm border-0">
                    <Card.Header style={{ background: '#1a5c2e', color: 'white', fontWeight: 600 }}>
                        Insurance Premium Payment
                    </Card.Header>
                    <Card.Body>
                        <Row className="align-items-center mb-3">
                            <Col md={12}>
                                <Form.Check type="checkbox" id="premiumPaid" label="Deposit insurance premium has been paid to DIPF"
                                    name="depositInsurancePremiumPaid" checked={!!form.depositInsurancePremiumPaid}
                                    onChange={handle} disabled={readOnly} className="fw-bold" />
                            </Col>
                        </Row>
                        {form.depositInsurancePremiumPaid && (
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">Premium Amount (USD)</Form.Label>
                                        <Form.Control type="number" name="premiumAmount" value={form.premiumAmount}
                                            onChange={handle} disabled={readOnly} placeholder="0.00" />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">Payment Date</Form.Label>
                                        <Form.Control type="date" name="premiumPaymentDate" value={form.premiumPaymentDate}
                                            onChange={handle} disabled={readOnly} />
                                    </Form.Group>
                                </Col>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted">Receipt Number</Form.Label>
                                        <Form.Control name="premiumPaymentReceiptNumber" value={form.premiumPaymentReceiptNumber}
                                            onChange={handle} disabled={readOnly} placeholder="e.g. DIPF-REC-2025-001" />
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* Deposit Liabilities & Liquidity Buffer */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#1a4a7a', color: 'white', fontWeight: 600 }}>
                    Deposit Liabilities & Liquidity Buffer
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Total Deposit Liabilities (USD) *</Form.Label>
                                <Form.Control type="number" name="totalDepositLiabilities"
                                    value={form.totalDepositLiabilities} onChange={handleDepositChange}
                                    disabled={readOnly} placeholder="Total deposits held from customers" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Liquid Assets Held (USD) *</Form.Label>
                                <Form.Control type="number" name="liquidAssets"
                                    value={form.liquidAssets} onChange={handleAssetChange}
                                    disabled={readOnly} placeholder="Cash + near-cash held" />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Liquidity Buffer Ratio (%)</Form.Label>
                                <div className="d-flex align-items-center gap-2">
                                    <Form.Control value={form.liquidityBufferRatio || '—'} readOnly
                                        style={{ background: bufferOk ? '#e8f5ec' : form.liquidityBufferRatio ? '#fce8e8' : '#f8f9fa',
                                            fontWeight: 700, color: bufferOk ? '#1a5c2e' : '#8b1a1a' }} />
                                    {form.liquidityBufferRatio && (
                                        <Badge bg={bufferOk ? 'success' : 'danger'}>
                                            {bufferOk ? '≥ 10% ✓' : '< 10% ✗'}
                                        </Badge>
                                    )}
                                </div>
                                <small className="text-muted">Minimum recommended: 10% of deposits</small>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label className="small fw-bold text-muted">Maximum Insured Deposit per Depositor (USD)</Form.Label>
                                <Form.Control type="number" name="maximumInsuredDepositPerDepositor"
                                    value={form.maximumInsuredDepositPerDepositor} onChange={handle}
                                    disabled={readOnly} />
                                <small className="text-muted">Currently USD 500 per depositor per DIPF Act</small>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Deposit Run-off Protocol */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Header style={{ background: '#6b3a00', color: 'white', fontWeight: 600 }}>
                    Deposit Run-off & Depositor Protection
                </Card.Header>
                <Card.Body>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Deposit Run-off Protocol *</Form.Label>
                        <Form.Control as="textarea" rows={4} name="depositRunoffProtocol"
                            value={form.depositRunoffProtocol} onChange={handle} disabled={readOnly}
                            placeholder="Describe how the institution would manage a sudden or large-scale withdrawal request. Include: early warning triggers, communication procedures, liquidity sourcing mechanisms, and regulator notification timeline." />
                        <small className="text-muted">Required for DTMFI compliance — examiner will assess adequacy</small>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label className="small fw-bold text-muted">Additional Depositor Protection Notes</Form.Label>
                        <Form.Control as="textarea" rows={3} name="depositorProtectionNarrative"
                            value={form.depositorProtectionNarrative} onChange={handle} disabled={readOnly}
                            placeholder="Any additional measures taken to protect depositors beyond the DIPF minimum requirements." />
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
