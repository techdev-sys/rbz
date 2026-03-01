import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
// IMPORT uploadCertificate HERE
import { createCompanyProfile, uploadCertificate, getCompanyProfile } from '../services/api';

const CompanyProfile = ({ onComplete, readOnly }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        registrationNumber: '',
        incorporationDate: '',
        applicationDate: new Date().toISOString().split('T')[0], // Auto-fill with today's date
        physicalAddress: '',
        chiefExecutiveOfficer: '',
        contactPersonName: '',
        contactTelephone: '',
        bankers: '',
        lawyers: '',
        auditors: '',
        licenseType: 'Credit-Only'
    });

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // New: Check for existing data on load
    useEffect(() => {
        const loadExistingProfile = async () => {
            const currentId = localStorage.getItem('currentCompanyId');
            if (currentId) {
                try {
                    // Check for invalid mock ID before making request
                    if (currentId.toString().startsWith("MOCK-")) {
                        console.warn("Detected invalid MOCK ID. Clearing session.");
                        localStorage.removeItem('currentCompanyId');
                        return; // Stop execution
                    }

                    setLoading(true);
                    const response = await getCompanyProfile(currentId);
                    if (response.data) {
                        setFormData(prev => ({
                            ...prev,
                            ...response.data, // Pre-fill with existing data
                            applicationDate: response.data.applicationDate || prev.applicationDate
                        }));
                    }
                } catch (err) {
                    console.error("Failed to load existing profile", err);
                    // Don't show error to user, just let them fill it in
                } finally {
                    setLoading(false);
                }
            }
        };
        loadExistingProfile();
    }, []);

    // === THE CHEAT CODE: Robust Date Translator ===
    const formatDateForJava = (inputDate) => {
        if (!inputDate) return null;

        // If it's already YYYY-MM-DD, return it.
        if (inputDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return inputDate;
        }

        // If it's DD/MM/YYYY or DD-MM-YYYY, flip it.
        const parts = inputDate.split(/[-/]/);
        if (parts.length === 3 && parts[2].length === 4) {
            // Return Year-Month-Day (2025-11-18)
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }

        // Fallback: standard JS date conversion
        const d = new Date(inputDate);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }

        return inputDate;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        // 1. Prepare Data with FIXED DATE
        const payload = {
            ...formData,
            incorporationDate: formatDateForJava(formData.incorporationDate),
            applicationDate: formatDateForJava(formData.applicationDate)
        };

        console.log("Sending Payload:", payload);

        try {
            // 2. Save Text Data
            const response = await createCompanyProfile(payload);

            if (response.status === 200 || response.status === 201) {
                const companyId = response.data.id;
                localStorage.setItem("currentCompanyId", companyId);

                // 3. UPLOAD FILE (This was missing in your code!)
                if (file) {
                    console.log("Uploading Certificate...");
                    await uploadCertificate(file, companyId);
                }

                setSuccess(true);

                // Proceed to next stage after 1 second
                setTimeout(() => {
                    if (onComplete) onComplete(response.data);
                }, 1000);
            }
        } catch (err) {
            console.error("Save failed", err);
            // Show readable error
            if (err.response && err.response.data) {
                setError(typeof err.response.data === 'string' ? err.response.data : "Server rejected data. Check Date format.");
            } else {
                setError("Failed to connect to server.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper to render field or read-only text
    const renderField = (name, label, type = "text", as = "input") => (
        <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">{label}</Form.Label>
            {readOnly ? (
                <div className="p-2 bg-light border rounded">
                    {formData[name] || <span className="text-muted fst-italic">Not provided</span>}
                </div>
            ) : (
                <Form.Control
                    as={as}
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    className="premium-input"
                />
            )}
        </Form.Group>
    );

    return (
        <Container className="mt-4">
            <Card className="shadow-sm mb-4">
                <Card.Header as="h4" className="bg-primary text-white">
                    <h4 className="mb-0">📋 Stage 1: Company Profile</h4>
                    {!readOnly && (
                        <Button variant="outline-light" size="sm" onClick={() => setFormData({
                            companyName: 'Sunrise Microfinance (Pvt) Ltd',
                            registrationNumber: '1036589A1',
                            incorporationDate: '2025-12-19',
                            applicationDate: new Date().toISOString().split('T')[0],
                            physicalAddress: '123 Samora Machel Avenue, Harare, Zimbabwe',
                            chiefExecutiveOfficer: 'Tinashe Munyonga',
                            contactPersonName: 'Tinashe Munyonga',
                            contactTelephone: '+263 77 123 4567',
                            bankers: 'CBZ Bank',
                            lawyers: 'Mawere & Sibanda Legal Practitioners',
                            auditors: 'KPMG Zimbabwe',
                            licenseType: 'Credit-Only'
                        })} title="Demo Auto-Fill">⚡ Fill</Button>
                    )}
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">✅ Company Profile Saved! Moving to Stage 2...</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>{renderField('companyName', 'Company Name')}</Col>
                            <Col md={6}>{renderField('registrationNumber', 'Registration Number')}</Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">Date of Incorporation</Form.Label>
                                    {readOnly ? (
                                        <div className="p-2 bg-light border rounded">{formData.incorporationDate}</div>
                                    ) : (
                                        <Form.Control type="date" name="incorporationDate" value={formData.incorporationDate} onChange={handleChange} required />
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">📅 Date of Application</Form.Label>
                                    {readOnly ? (
                                        <div className="p-2 bg-light border rounded">{formData.applicationDate}</div>
                                    ) : (
                                        <Form.Control type="date" name="applicationDate" value={formData.applicationDate} onChange={handleChange} required />
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="fw-bold small">License Type</Form.Label>
                                    {readOnly ? (
                                        <div className="p-2 bg-light border rounded">{formData.licenseType}</div>
                                    ) : (
                                        <Form.Select name="licenseType" value={formData.licenseType} onChange={handleChange}>
                                            <option value="Credit-Only">Credit-Only</option>
                                            <option value="Deposit-Taking">Deposit-Taking</option>
                                        </Form.Select>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={12}>{renderField('physicalAddress', '📍 Physical Address', 'text', 'textarea')}</Col>
                        </Row>

                        <h5 className="text-rbz-navy mt-4 mb-3">👥 Contact Information</h5>
                        <Row>
                            <Col md={4}>{renderField('chiefExecutiveOfficer', 'CEO / Managing Director')}</Col>
                            <Col md={4}>{renderField('contactPersonName', 'Contact Person Name')}</Col>
                            <Col md={4}>{renderField('contactTelephone', '📞 Contact Phone Number', 'tel')}</Col>
                        </Row>

                        {!readOnly && (
                            <div className="d-flex justify-content-end mb-3">
                                <Button
                                    variant="link"
                                    className="text-danger text-decoration-none small"
                                    onClick={() => {
                                        localStorage.removeItem('currentCompanyId');
                                        window.location.reload();
                                    }}
                                >
                                    ⚠️ Reset Session / Clear Form
                                </Button>
                            </div>
                        )}

                        <h5 className="text-rbz-navy mt-4 mb-3">🏦 Professional Services</h5>
                        <Row>
                            <Col md={4}>{renderField('bankers', 'Bankers')}</Col>
                            <Col md={4}>{renderField('lawyers', 'Lawyers')}</Col>
                            {formData.licenseType === 'Deposit-Taking' && (
                                <Col md={4}>{renderField('auditors', 'Auditors')}</Col>
                            )}
                        </Row>

                        <Form.Group className="mb-4 border p-3 rounded bg-light">
                            <Form.Label className="fw-bold">Certificate of Incorporation (Upload)</Form.Label>
                            {readOnly ? (
                                <div>
                                    <span className="text-success me-3">✅ Document Uploaded</span>
                                    <Button size="sm" variant="outline-primary" onClick={() => alert("Download feature coming in next sprint")}>⬇ Download</Button>
                                </div>
                            ) : (
                                <>
                                    <Form.Control type="file" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                                    <Form.Text className="text-muted">The AI will analyze this document to verify the Name and Date.</Form.Text>
                                </>
                            )}
                        </Form.Group>

                        {!readOnly && (
                            <div className="d-flex justify-content-end">
                                <Button variant="primary" type="submit" disabled={loading} size="lg">
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Save & Continue'}
                                </Button>
                            </div>
                        )}
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default CompanyProfile;