import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { saveProductsAndServices, getProductsAndServices } from '../services/api';

const ProductsAndServices = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        companyId: localStorage.getItem('currentCompanyId'),
        targetMarketDescription: '',
        productsAndServicesDescription: '',
        minimumLoanSize: '',
        maximumLoanSize: '',
        minimumTenure: '',
        maximumTenure: '',
        interestRatePerMonth: '',
        allChargesBreakdown: '',
        allChargesBreakdown: '',
        chargesJustification: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        const companyId = localStorage.getItem('currentCompanyId');
        if (!companyId) return;

        try {
            const response = await getProductsAndServices(companyId);
            if (response.data) {
                setFormData(response.data);
            }
        } catch (err) {
            console.log('No existing products data');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();



        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await saveProductsAndServices(formData);
            setSuccess(true);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 1500);
        } catch (err) {
            console.error('Save failed', err);
            setError(err.response?.data || 'Failed to save products and services');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-primary text-white">
                    Stage 6: Products, Services & Charges
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Products & Services Saved! Moving to next stage...</Alert>}

                    <Alert variant="info">
                        <strong>Template Reference:</strong> This captures <strong>Products/Activities</strong> and <strong>Charges</strong> sections of the MFI Evaluation Report.
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        <h5 className="mt-3 mb-3">Target Market & Products</h5>

                        <Form.Group className="mb-3">
                            <Form.Label>Target Market Description *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="targetMarketDescription"
                                value={formData.targetMarketDescription}
                                onChange={handleChange}
                                placeholder="Describe the institution's proposed target market..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Who are your clients? (e.g., SMEs, women entrepreneurs, rural communities, etc.)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Products and Services Description *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="productsAndServicesDescription"
                                value={formData.productsAndServicesDescription}
                                onChange={handleChange}
                                placeholder="Provide detailed description of products and services offered..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Describe all loan products, savings products, and other services
                            </Form.Text>
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Loan Parameters</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Loan Size ($) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="minimumLoanSize"
                                        value={formData.minimumLoanSize}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Loan Size ($) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="maximumLoanSize"
                                        value={formData.maximumLoanSize}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Minimum Tenure *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="minimumTenure"
                                        value={formData.minimumTenure}
                                        onChange={handleChange}
                                        placeholder="e.g., 1 month"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Maximum Tenure *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="maximumTenure"
                                        value={formData.maximumTenure}
                                        onChange={handleChange}
                                        placeholder="e.g., 24 months"
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mt-4 mb-3">Charges</h5>

                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Interest Rate per Month (%) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="interestRatePerMonth"
                                        value={formData.interestRatePerMonth}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>All Charges Breakdown (with frequency) *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="allChargesBreakdown"
                                value={formData.allChargesBreakdown}
                                onChange={handleChange}
                                placeholder="List ALL charges with their frequency, e.g.:&#10;- Application Fee: $50 (once-off)&#10;- Monthly Service Fee: $10 (per month)"
                                required
                            />
                            <Form.Text className="text-muted">
                                Indicate frequency for each charge (per month or once off)
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Charges Justification *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="chargesJustification"
                                value={formData.chargesJustification}
                                onChange={handleChange}
                                placeholder="Provide justification for the charges levied..."
                                required
                            />
                        </Form.Group>

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

export default ProductsAndServices;
