import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { saveCapitalStructure, getCapitalStructure } from '../services/api';

const CapitalStructure = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        companyId: localStorage.getItem('currentCompanyId'),
        numberOfAuthorisedShares: '',
        totalIssuedShares: '',
        parValuePerShare: '',
        issuedShareCapitalAtParValue: '',
        sharePremium: '',
        totalIssuedAndPaidUpCapital: '',
        retainedEarningsCurrentYear: '',
        retainedEarningsPriorYears: '',
        totalShareholdersEquity: '',
        capitalStructureDate: new Date().toISOString().split('T')[0],
        meetsMinimumCapitalRequirement: 'YES',
        capitalInjectionsDetails: '',
        sourceOfCapitalDocumentation: '',
        donatedEquity: '0',
        donorDetails: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Track which fields are marked as N/A
    const [naFields, setNaFields] = useState({
        retainedEarningsCurrentYear: false,
        retainedEarningsPriorYears: false,
        capitalInjectionsDetails: false,
        sourceOfCapitalDocumentation: false,
        donatedEquity: false,
        donorDetails: false
    });

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        const companyId = localStorage.getItem('currentCompanyId');
        if (!companyId) return;

        try {
            const response = await getCapitalStructure(companyId);
            if (response.data) {
                setFormData(response.data);
            }
        } catch (err) {
            // No existing data, that's okay
            console.log('No existing capital structure data');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-calculate fields
        if (name === 'totalIssuedShares' || name === 'parValuePerShare') {
            const shares = name === 'totalIssuedShares' ? parseFloat(value) : parseFloat(formData.totalIssuedShares);
            const parValue = name === 'parValuePerShare' ? parseFloat(value) : parseFloat(formData.parValuePerShare);
            if (shares && parValue) {
                setFormData(prev => ({
                    ...prev,
                    issuedShareCapitalAtParValue: (shares * parValue).toFixed(2)
                }));
            }
        }

        // Auto-calculate total paid-up capital
        if (name === 'issuedShareCapitalAtParValue' || name === 'sharePremium') {
            const capital = name === 'issuedShareCapitalAtParValue' ? parseFloat(value) : parseFloat(formData.issuedShareCapitalAtParValue);
            const premium = name === 'sharePremium' ? parseFloat(value) : parseFloat(formData.sharePremium);
            if (capital || premium) {
                setFormData(prev => ({
                    ...prev,
                    totalIssuedAndPaidUpCapital: ((capital || 0) + (premium || 0)).toFixed(2)
                }));
            }
        }

        // Auto-calculate total equity
        if (['totalIssuedAndPaidUpCapital', 'retainedEarningsCurrentYear', 'retainedEarningsPriorYears'].includes(name)) {
            const paidUp = name === 'totalIssuedAndPaidUpCapital' ? parseFloat(value) : parseFloat(formData.totalIssuedAndPaidUpCapital);
            const currentRetained = name === 'retainedEarningsCurrentYear' ? parseFloat(value) : parseFloat(formData.retainedEarningsCurrentYear);
            const priorRetained = name === 'retainedEarningsPriorYears' ? parseFloat(value) : parseFloat(formData.retainedEarningsPriorYears);

            setFormData(prev => ({
                ...prev,
                totalShareholdersEquity: ((paidUp || 0) + (currentRetained || 0) + (priorRetained || 0)).toFixed(2)
            }));
        }
    };

    const handleNaToggle = (fieldName) => {
        const isNa = !naFields[fieldName];

        setNaFields(prev => ({
            ...prev,
            [fieldName]: isNa
        }));

        // If marking as N/A, set value to "N/A", otherwise clear it
        setFormData(prev => ({
            ...prev,
            [fieldName]: isNa ? 'N/A' : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await saveCapitalStructure(formData);
            setSuccess(true);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 1500);
        } catch (err) {
            console.error('Save failed', err);
            setError(err.response?.data || 'Failed to save capital structure');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-primary text-white">
                    Stage 5: Detailed Capital Structure & Financial Breakdown
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Capital Structure Saved! Moving to next stage...</Alert>}

                    <Alert variant="info">
                        <strong>Template Reference:</strong> This form captures the <strong>detailed financial breakdown</strong> for <strong>Table 2: Capital Structure</strong> in the MFI Evaluation Report.
                        Basic share capital data was already collected in Stage 3.
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        <Alert variant="info" className="mb-4">
                            <strong>ℹ️ Note:</strong> Basic share capital information was collected in Stage 3 (Application Form).
                            This stage captures the <strong>detailed financial breakdown</strong> for Table 2 of the MFI Evaluation Report.
                        </Alert>

                        <h5 className="mt-3 mb-3">Detailed Share Capital Breakdown</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Par Value per Share ($) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="parValuePerShare"
                                        value={formData.parValuePerShare}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Form.Text className="text-muted">
                                        Nominal/face value of each share
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Issued Share Capital at Par Value ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="issuedShareCapitalAtParValue"
                                        value={formData.issuedShareCapitalAtParValue}
                                        onChange={handleChange}
                                        readOnly
                                    />
                                    <Form.Text className="text-muted">Auto-calculated: Total Issued Shares × Par Value</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Total Issued and Paid-Up Capital ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="totalIssuedAndPaidUpCapital"
                                        value={formData.totalIssuedAndPaidUpCapital}
                                        onChange={handleChange}
                                        readOnly
                                    />
                                    <Form.Text className="text-muted">Auto-calculated: Issued Capital + Share Premium</Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mt-4 mb-3">Retained Earnings</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Retained Earnings - Current Year ($)</Form.Label>
                                    <Form.Control
                                        type={naFields.retainedEarningsCurrentYear ? "text" : "number"}
                                        step="0.01"
                                        name="retainedEarningsCurrentYear"
                                        value={formData.retainedEarningsCurrentYear}
                                        onChange={handleChange}
                                        disabled={naFields.retainedEarningsCurrentYear}
                                        className={naFields.retainedEarningsCurrentYear ? 'bg-light' : ''}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label="Mark as N/A (Not Applicable)"
                                        checked={naFields.retainedEarningsCurrentYear}
                                        onChange={() => handleNaToggle('retainedEarningsCurrentYear')}
                                        className="mt-2 text-muted"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Retained Earnings - Prior Years ($)</Form.Label>
                                    <Form.Control
                                        type={naFields.retainedEarningsPriorYears ? "text" : "number"}
                                        step="0.01"
                                        name="retainedEarningsPriorYears"
                                        value={formData.retainedEarningsPriorYears}
                                        onChange={handleChange}
                                        disabled={naFields.retainedEarningsPriorYears}
                                        className={naFields.retainedEarningsPriorYears ? 'bg-light' : ''}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label="Mark as N/A (Not Applicable)"
                                        checked={naFields.retainedEarningsPriorYears}
                                        onChange={() => handleNaToggle('retainedEarningsPriorYears')}
                                        className="mt-2 text-muted"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold">Total Shareholders' Equity ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="totalShareholdersEquity"
                                        value={formData.totalShareholdersEquity}
                                        onChange={handleChange}
                                        readOnly
                                        className="fw-bold"
                                    />
                                    <Form.Text className="text-muted">Auto-calculated</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Capital Structure Date *</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="capitalStructureDate"
                                        value={formData.capitalStructureDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>



                        <h5 className="mt-4 mb-3">Additional Information</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>Capital Injections Details</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="capitalInjectionsDetails"
                                value={formData.capitalInjectionsDetails}
                                onChange={handleChange}
                                placeholder="Provide details of any capital injections including dates and amounts..."
                                disabled={naFields.capitalInjectionsDetails}
                                className={naFields.capitalInjectionsDetails ? 'bg-light' : ''}
                            />
                            <Form.Check
                                type="checkbox"
                                label="Mark as N/A (Not Applicable)"
                                checked={naFields.capitalInjectionsDetails}
                                onChange={() => handleNaToggle('capitalInjectionsDetails')}
                                className="mt-2 text-muted"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Source of Capital Documentation</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="sourceOfCapitalDocumentation"
                                value={formData.sourceOfCapitalDocumentation}
                                onChange={handleChange}
                                placeholder="List documentation submitted as proof of sources of capital..."
                                disabled={naFields.sourceOfCapitalDocumentation}
                                className={naFields.sourceOfCapitalDocumentation ? 'bg-light' : ''}
                            />
                            <Form.Check
                                type="checkbox"
                                label="Mark as N/A (Not Applicable)"
                                checked={naFields.sourceOfCapitalDocumentation}
                                onChange={() => handleNaToggle('sourceOfCapitalDocumentation')}
                                className="mt-2 text-muted"
                            />
                        </Form.Group>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Donated Equity ($)</Form.Label>
                                    <Form.Control
                                        type={naFields.donatedEquity ? "text" : "number"}
                                        step="0.01"
                                        name="donatedEquity"
                                        value={formData.donatedEquity}
                                        onChange={handleChange}
                                        disabled={naFields.donatedEquity}
                                        className={naFields.donatedEquity ? 'bg-light' : ''}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label="Mark as N/A (Not Applicable)"
                                        checked={naFields.donatedEquity}
                                        onChange={() => handleNaToggle('donatedEquity')}
                                        className="mt-2 text-muted"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Donor Details</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="donorDetails"
                                        value={formData.donorDetails}
                                        onChange={handleChange}
                                        placeholder="If applicable, provide donor information"
                                        disabled={naFields.donorDetails}
                                        className={naFields.donorDetails ? 'bg-light' : ''}
                                    />
                                    <Form.Check
                                        type="checkbox"
                                        label="Mark as N/A (Not Applicable)"
                                        checked={naFields.donorDetails}
                                        onChange={() => handleNaToggle('donorDetails')}
                                        className="mt-2 text-muted"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <div className="d-flex justify-content-between mt-4">
                            <Button variant="secondary" onClick={() => window.history.back()}>
                                ← Previous Stage
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading} size="lg">
                                {loading ? <Spinner animation="border" size="sm" /> : 'Save & Continue →'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CapitalStructure;
