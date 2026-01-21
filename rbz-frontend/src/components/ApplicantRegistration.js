import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { createCompanyProfile } from '../services/api';

const ApplicantRegistration = ({ onRegistered, onCancel }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        licenseType: 'Credit-Only Microfinance',
        contactPersonName: '',
        emailAddress: '',
        contactTelephone: '',
        applicationDate: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const demoFill = () => {
        setFormData({
            companyName: 'Sunrise Microfinance (Pvt) Ltd',
            licenseType: 'Credit-Only Microfinance',
            contactPersonName: 'Tinashe Munyonga',
            emailAddress: 'tinashe@sunrise.co.zw',
            contactTelephone: '+263 77 123 4567',
            applicationDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Create the initial profile in DRAFT mode
            // This 'registers' them in the system so Senior BE *could* see them if we filtered by DRAFT
            const response = await createCompanyProfile({
                ...formData,
                stageStatus: 'PENDING',
                applicationStatus: 'DRAFT'
            });

            // Pass the new ID back to parent to start the wizard
            onRegistered(response.data.id);
        } catch (err) {
            console.error(err);
            setError("Registration failed. Please check your connection or contact support. Error: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5">
            <div className="text-center mb-4">
                <img
                    src="/rbz-logo.png"
                    alt="Reserve Bank of Zimbabwe"
                    style={{ height: '100px', marginBottom: '15px' }}
                />
                <h2 style={{ color: '#003366', fontWeight: 'bold' }}>Reserve Bank of Zimbabwe</h2>
                <h4 style={{ color: '#666' }}>Bank Supervision ,Surveillance and Financial Stability Division</h4>
            </div>

            <Card className="shadow-lg border-0">
                <Card.Header className="text-white text-center py-3" style={{ backgroundColor: '#003366', borderBottom: '4px solid #D4AF37' }}>
                    <div className="d-flex justify-content-between align-items-center px-4">
                        <Button variant="outline-light" size="sm" onClick={demoFill} style={{ opacity: 0.5 }} title="Demo Auto-Fill">⚡</Button>
                        <div>
                            <h3 className="mb-1">New License Application</h3>
                            <p className="mb-0 small" style={{ color: '#D4AF37' }}>DIGITAL LICENSING PORTAL</p>
                        </div>
                        <div style={{ width: '30px' }}></div> {/* Spacer for centering */}
                    </div>
                </Card.Header>
                <Card.Body className="p-5">

                    <Row>
                        <Col md={6} className="border-end pe-4" style={{ borderColor: '#e9ecef' }}>
                            <h5 style={{ color: '#003366' }} className="mb-3">Minimum Requirements Checklist</h5>
                            <p className="text-muted small">
                                Before commencing your application, please ensure you are in possession of the following documents as per the <strong>Microfinance Act [Chapter 24:30]</strong>.
                            </p>

                            <div className="bg-light p-3 rounded mb-4" style={{ borderLeft: '4px solid #D4AF37' }}>
                                <ul className="list-unstyled mb-0 small">
                                    <li className="mb-2">✓ <strong>Corporate Documents:</strong> Certificate of Incorporation, CR14, CR6.</li>
                                    <li className="mb-2">✓ <strong>Shareholders:</strong> IDs, Proof of Residence, Source of Funds.</li>
                                    <li className="mb-2">✓ <strong>Directors:</strong> CVs, Police Clearance, Assets/Liabilities.</li>
                                    <li className="mb-2">✓ <strong>Capital:</strong> Proof of $25,000 USD Minimum Capital (Credit-Only).</li>
                                    <li className="mb-2">✓ <strong>Policies:</strong> Credit Policy, Operations Manual, Consumer Protection.</li>
                                </ul>
                            </div>

                            <Alert variant="warning">
                                <small>
                                    <strong>Note:</strong> Giving false information to the Reserve Bank is a criminal offense. Ensure all details provided are accurate and verifiable.
                                </small>
                            </Alert>
                        </Col>

                        <Col md={6} className="ps-4">
                            <h5 style={{ color: '#003366' }} className="mb-3">Institution Registration</h5>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Proposed Institution Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="e.g. Acme Microfinance (Pvt) Ltd"
                                        required
                                        style={{ borderLeft: '3px solid #003366' }}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>License Type</Form.Label>
                                    <Form.Select
                                        name="licenseType"
                                        value={formData.licenseType}
                                        onChange={handleChange}
                                        style={{ borderLeft: '3px solid #003366' }}
                                    >
                                        <option value="Credit-Only Microfinance">Credit-Only Microfinance (Non-Deposit Taking)</option>
                                        <option value="Deposit-Taking Microfinance">Deposit-Taking Microfinance</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Principal Officer / CEO Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contactPersonName"
                                        value={formData.contactPersonName}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>

                                <Row>
                                    <Col>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Official Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="emailAddress"
                                                value={formData.emailAddress}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Contact Number</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="contactTelephone"
                                                value={formData.contactTelephone}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <div className="d-grid gap-2 mt-4">
                                    <Button
                                        size="lg"
                                        type="submit"
                                        disabled={loading}
                                        style={{ backgroundColor: '#003366', borderColor: '#003366' }}
                                    >
                                        {loading ? <Spinner animation="border" size="sm" /> : 'Register & Proceed to Stage 1'}
                                    </Button>
                                    <Button variant="link" onClick={onCancel} style={{ color: '#666' }}>
                                        Cancel Registration
                                    </Button>
                                </div>
                            </Form>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="text-center text-muted small py-3" style={{ backgroundColor: '#f8f9fa' }}>
                    &copy; 2025 Reserve Bank of Zimbabwe. All Rights Reserved.
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default ApplicantRegistration;
