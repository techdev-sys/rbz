import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
// IMPORT uploadCertificate HERE
import { createCompanyProfile, uploadCertificate, getCompanyProfile } from '../services/api';
import WorkflowStatusPanel from './WorkflowStatusPanel';

const CompanyProfile = ({ onComplete, readOnly }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        registrationNumber: '',
        incorporationDate: '',
        applicationDate: new Date().toISOString().split('T')[0],
        physicalAddress: '',
        chiefExecutiveOfficer: '',
        contactPersonName: '',
        contactTelephone: '',
        emailAddress: '',
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

    // --- NEW: Auto-Save functionality ---
    useEffect(() => {
        // Skip auto-save if we are still loading, if it's readOnly, or if we don't have basic required fields
        if (readOnly || loading || !formData.companyName) return;

        const timer = setTimeout(async () => {
            try {
                const payload = {
                    ...formData,
                    incorporationDate: formatDateForJava(formData.incorporationDate),
                    applicationDate: formatDateForJava(formData.applicationDate)
                };

                const currentId = localStorage.getItem('currentCompanyId');
                if (currentId && !currentId.toString().startsWith("MOCK-")) {
                    // Update existing
                    await createCompanyProfile(payload); // API performs upsert if ID exists or relies on DB
                    console.log("Auto-save successful.");
                }
            } catch (err) {
                console.warn("Auto-save failed in background", err);
            }
        }, 1500); // 1.5 seconds debounce

        return () => clearTimeout(timer);
    }, [formData, readOnly, loading]);

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

                // 3. UPLOAD FILE
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

    const renderField = (name, label, type = "text", as = "input") => (
        <Form.Group className="mb-3">
            <Form.Label className="small fw-bold text-muted mb-1">{label}</Form.Label>
            {readOnly ? (
                <div className="p-2 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                    {formData[name] || <span className="text-muted fst-italic">Not provided</span>}
                </div>
            ) : (
                <Form.Control
                    as={as}
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    style={{ borderColor: '#e2e8f0', boxShadow: 'none' }}
                />
            )}
        </Form.Group>
    );

    return (
        <Container fluid className="px-md-4 py-4">
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-bold" style={{ color: '#003366' }}>Stage 1 Details</h5>
                    {!readOnly && (
                        <Button variant="outline-primary" size="sm" onClick={() => setFormData({
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
                        })} title="Demo Auto-Fill" style={{ borderColor: '#003366', color: '#003366' }}>Auto-Fill Form</Button>
                    )}
                </Card.Header>
                <Card.Body className="p-4 p-md-5">
                    {error && <Alert variant="danger" className="border-0 small">{error}</Alert>}
                    {success && <Alert variant="success" className="border-0 small">✅ Company Profile Saved! Moving to Stage 2...</Alert>}

                    {!readOnly && formData.companyName && !success && !error && (
                        <div style={{ padding: '10px 16px', background: '#e8f5ec', borderRadius: '6px', marginBottom: '20px', borderLeft: '3px solid #1a5c2e', fontSize: '0.82rem', color: '#1a5c2e' }}>
                            <strong>Pre-filled from registration:</strong> Some fields have been populated from your account registration. Please review and complete the remaining details.
                        </div>
                    )}

                    {readOnly ? (
                        <div className="memo-report-view p-5" style={{ backgroundColor: 'white', border: '1px solid #e0e4e8', borderRadius: '8px', fontFamily: '"Times New Roman", Times, serif', fontSize: '12pt', color: 'black' }}>
                            <h2 className="text-center fw-bold mb-4" style={{ letterSpacing: '1px' }}>MEMORANDUM</h2>

                            <h4 className="text-center fw-bold mb-2 text-uppercase">{formData.companyName}</h4>
                            <h5 className="text-center fw-bold mb-5 text-uppercase">APPLICATION FOR A {formData.licenseType ? formData.licenseType.replace(" Microfinance", "").replace("Deposit-Taking", "DEPOSIT-TAKING").replace("Credit-Only", "CREDIT-ONLY") : ""} MICROFINANCE LICENCE</h5>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">OFFICES</strong>
                                <div style={{ whiteSpace: 'pre-line' }}>{formData.physicalAddress || "-"}</div>
                            </div>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">BANKERS</strong>
                                <div>{formData.bankers || "-"}</div>
                            </div>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">LAWYERS</strong>
                                <div>{formData.lawyers || "-"}</div>
                            </div>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">CHIEF EXECUTIVE OFFICER</strong>
                                <div>{formData.chiefExecutiveOfficer || "-"}</div>
                            </div>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">COMPANY REGISTRATION NUMBER</strong>
                                <div>{formData.registrationNumber || "-"}</div>
                            </div>

                            <div className="mb-4">
                                <strong className="d-block mb-1 text-uppercase">CONTACT TELEPHONE NUMBERS</strong>
                                <div>{formData.contactTelephone || "-"}</div>
                            </div>

                            <div className="mb-5">
                                <strong className="d-block mb-1 text-uppercase">E-MAIL ADDRESS</strong>
                                <div>{formData.emailAddress || "-"}</div>
                            </div>

                            <div style={{ textAlign: 'justify', lineHeight: '1.8' }}>
                                <p><strong>{formData.companyName}</strong> was incorporated in terms of the Companies and Other Business Entities Act [Chapter 24:31] on {formData.incorporationDate || "[Date]"}.</p>
                                <p><strong>{formData.companyName}</strong> intends to operate from its head office Stand Number {formData.physicalAddress ? formData.physicalAddress.replace(/\n/g, ", ") : "[Address]"}.</p>
                                <p>The institution applied for a {formData.licenseType ? formData.licenseType.toLowerCase().replace(" microfinance", "") : "credit-only"} microfinance licence on {formData.applicationDate || "[Date]"}.</p>
                            </div>

                            <hr className="my-5" />
                            <div className="border p-4 rounded bg-light">
                                <strong className="d-block mb-2" style={{ color: '#003366' }}>ATTACHED DOCUMENTATION</strong>
                                <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-white mt-2">
                                    <span className="text-success fw-bold">✓ Certificate of Incorporation (Verified)</span>
                                    <Button size="sm" variant="outline-primary" onClick={() => alert("Downloading document...")}>View Document</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>{renderField('companyName', 'Company Name')}</Col>
                                <Col md={6}>{renderField('registrationNumber', 'Registration Number')}</Col>
                            </Row>

                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted mb-1">Date of Incorporation</Form.Label>
                                        <Form.Control type="date" name="incorporationDate" value={formData.incorporationDate} onChange={handleChange} required style={{ borderColor: '#e2e8f0', boxShadow: 'none' }} />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="small fw-bold text-muted mb-1">License Type</Form.Label>
                                        <Form.Select name="licenseType" value={formData.licenseType} onChange={handleChange} style={{ borderColor: '#e2e8f0', boxShadow: 'none' }}>
                                            <option value="Credit-Only">Credit-Only</option>
                                            <option value="Deposit-Taking">Deposit-Taking</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Row>
                                <Col md={12}>{renderField('physicalAddress', 'Physical Address', 'text', 'textarea')}</Col>
                            </Row>

                            <hr className="my-4 text-muted" />
                            <h6 className="fw-bold mb-4" style={{ color: '#003366', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Information</h6>
                            <Row>
                                <Col md={3}>{renderField('chiefExecutiveOfficer', 'CEO / Managing Director')}</Col>
                                <Col md={3}>{renderField('contactPersonName', 'Contact Person Name')}</Col>
                                <Col md={3}>{renderField('emailAddress', 'Email Address')}</Col>
                                <Col md={3}>{renderField('contactTelephone', 'Contact Phone Number', 'tel')}</Col>
                            </Row>

                            <div className="d-flex justify-content-end mb-3">
                                <Button
                                    variant="link"
                                    className="text-danger text-decoration-none small"
                                    onClick={() => {
                                        localStorage.removeItem('currentCompanyId');
                                        window.location.reload();
                                    }}
                                >
                                    Clear Active Draft Session
                                </Button>
                            </div>

                            <hr className="my-4 text-muted" />
                            <h6 className="fw-bold mb-4" style={{ color: '#003366', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Professional Services</h6>
                            <Row>
                                <Col md={4}>{renderField('bankers', 'Bankers')}</Col>
                                <Col md={4}>{renderField('lawyers', 'Lawyers')}</Col>
                                {formData.licenseType === 'Deposit-Taking' && (
                                    <Col md={4}>{renderField('auditors', 'Auditors')}</Col>
                                )}
                            </Row>

                            {/* Certificate of Incorporation moved to Stage 2 */}

                            <div className="d-flex justify-content-end mt-4">
                                <Button
                                    variant="primary"
                                    type="submit"
                                    disabled={loading}
                                    className="px-5 py-2 fw-bold"
                                    style={{ backgroundColor: '#003366', borderColor: '#003366', borderRadius: '8px' }}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'Save & Continue'}
                                </Button>
                            </div>
                        </Form>
                    )}
                </Card.Body>
            </Card>

            {/* Workflow Rule Engine Integration */}
            {!readOnly && (
                <div className="mt-4">
                    <WorkflowStatusPanel
                        companyId={localStorage.getItem('currentCompanyId')}
                        currentStep={1}
                        onStageComplete={() => onComplete && onComplete(formData)}
                    />
                </div>
            )}
        </Container>
    );
};

export default CompanyProfile;