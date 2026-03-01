import React, { useState } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DocumentUploadHub = ({ onComplete }) => {
    const [uploadedDocs, setUploadedDocs] = useState({
        financialStatements: null,
        businessPlan: null,
        creditPolicy: null,
        operationalManual: null,
        portfolioReport: null,
        taxClearance: null,
        insurancePolicy: null
    });

    const [extractionStatus, setExtractionStatus] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const companyId = localStorage.getItem('currentCompanyId');
    const userRole = localStorage.getItem('userRole') || 'applicant'; // Default to applicant

    // Logic: Applicants just upload. Examiners use AI to verify.
    const showAIFeatures = userRole !== 'applicant';

    const documentTypes = [
        {
            key: 'financialStatements',
            name: 'Audited Financial Statements (Last 3 Years)',
            description: 'AI will extract: Capital Structure, Financial Performance, Assets, Liabilities',
            icon: '📊',
            required: true,
            extractsData: ['Capital Structure (Stage 4)', 'Financial Performance (Stage 4)']
        },
        {
            key: 'businessPlan',
            name: 'Business Plan',
            description: 'AI will extract: Products, Target Market, Growth Strategies, Financial Projections',
            icon: '📈',
            required: true,
            extractsData: ['Products & Services (Stage 5)', 'Financial Assumptions (Stage 6)', 'Growth Strategies (Stage 8)']
        },
        {
            key: 'portfolioReport',
            name: 'Loan Portfolio Report',
            description: 'AI will extract: Loan Distribution by Purpose, PAR ratios, Client numbers',
            icon: '💼',
            required: true,
            extractsData: ['Loan Distribution (Stage 4)']
        },
        {
            key: 'creditPolicy',
            name: 'Credit Policy Manual',
            description: 'AI will verify: Policy completeness, Client protection measures',
            icon: '📋',
            required: true,
            extractsData: ['Compliance (Stage 7)']
        },
        {
            key: 'operationalManual',
            name: 'Operational Policy Manual',
            description: 'AI will verify: Operational procedures, Code of conduct',
            icon: '📖',
            required: false,
            extractsData: ['Compliance (Stage 7)']
        },
        {
            key: 'taxClearance',
            name: 'Tax Clearance Certificate',
            description: 'AI will extract: Validity dates, Tax compliance status',
            icon: '🧾',
            required: true,
            extractsData: ['Compliance (Stage 7)']
        },
        {
            key: 'insurancePolicy',
            name: 'Credit Insurance Policy',
            description: 'AI will extract: Coverage details, Expiry date, Premium rates',
            icon: '🛡️',
            required: false,
            extractsData: ['Products & Services (Stage 5)']
        }
    ];

    const handleFileChange = (docType, file) => {
        setUploadedDocs(prev => ({
            ...prev,
            [docType]: file
        }));
    };

    const [scanningDoc, setScanningDoc] = useState(null);

    const handleUploadAndExtract = async (docType) => {
        const file = uploadedDocs[docType];
        if (!file) return;

        setLoading(true);
        setError(null);
        setScanningDoc(docType); // Trigger animation
        setExtractionStatus(prev => ({
            ...prev,
            [docType]: 'processing'
        }));

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('companyId', companyId);
            formData.append('documentType', docType);

            // Artificial delay for "Theatricks" if it's too fast
            await new Promise(r => setTimeout(r, 1500));

            const response = await axios.post(
                'http://localhost:8080/api/documents/extract',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setExtractionStatus(prev => ({
                ...prev,
                [docType]: 'completed'
            }));

            // Show success message with extracted data summary
            // alert(`✅ ${docType} processed successfully!\n\nExtracted Data:\n${response.data.summary || 'Data extracted and saved to stages 4-8'}`);
            // Replaced alert with in-UI feedback, much cleaner.

        } catch (err) {
            console.error('Extraction failed', err);
            setExtractionStatus(prev => ({
                ...prev,
                [docType]: 'failed'
            }));
            setError(`Failed to process ${docType}: ${err.response?.data || err.message}`);
        } finally {
            setLoading(false);
            setScanningDoc(null);
        }
    };

    const handleUploadAll = async () => {
        for (const docType of Object.keys(uploadedDocs)) {
            if (uploadedDocs[docType]) {
                await handleUploadAndExtract(docType);
            }
        }
    };

    const getStatusBadge = (docType) => {
        const status = extractionStatus[docType];
        if (!status) return <Badge bg="secondary">Not Uploaded</Badge>;
        if (status === 'processing') return <Badge bg="warning">Processing...</Badge>;
        if (status === 'completed') return <Badge bg="success">✓ Completed</Badge>;
        if (status === 'failed') return <Badge bg="danger">Failed</Badge>;
    };

    const allRequiredUploaded = documentTypes
        .filter(doc => doc.required)
        .every(doc => extractionStatus[doc.key] === 'completed');

    return (
        <Container className="mt-4">
            {/* AI Scanning Overlay - Only for Examiners */}
            {showAIFeatures && scanningDoc && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <Spinner animation="grow" variant="info" style={{ width: '4rem', height: '4rem' }} />
                    <h3 className="mt-4">AI Analysis in Progress...</h3>
                    <p className="text-info">Scanning {documentTypes.find(d => d.key === scanningDoc)?.name}...</p>
                    <small>Extracting Financial Data & Verifying Compliance</small>
                </div>
            )}

            <Card className="shadow-sm">
                <Card.Header as="h4" className={showAIFeatures ? "bg-warning text-dark" : "bg-primary text-white"}>
                    {showAIFeatures ? "🕵️‍♂️ Examiner Verification Portal" : "📄 Document Submission"}
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Alert variant={showAIFeatures ? "info" : "light"}>
                        {showAIFeatures ? (
                            <>
                                <h5>🤖 AI Verification Tools</h5>
                                <p className="mb-0">
                                    Use the AI to <strong>Upload & Verify</strong> the applicant's documents against the submitted data.
                                    The AI will extract figures and flag discrepancies.
                                </p>
                            </>
                        ) : (
                            <>
                                <h5>📤 File Submission</h5>
                                <p className="mb-0">
                                    Please upload clear, legible copies of the required documents.
                                    Supported formats: PDF, Word, Excel. Max size 10MB.
                                </p>
                            </>
                        )}
                    </Alert>

                    <h5 className="mt-4 mb-3">Required Documents</h5>

                    {documentTypes.map(doc => (
                        <Card key={doc.key} className="mb-3">
                            <Card.Body>
                                <Row>
                                    <Col md={8}>
                                        <h6>
                                            {doc.icon} {doc.name}
                                            {doc.required && <Badge bg="danger" className="ms-2">Required</Badge>}
                                        </h6>
                                        <p className="text-muted small mb-2">{doc.description}</p>
                                        <div className="small">
                                            <strong>Auto-fills:</strong>
                                            {doc.extractsData.map((stage, idx) => (
                                                <Badge key={idx} bg="primary" className="ms-1">{stage}</Badge>
                                            ))}
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        {getStatusBadge(doc.key)}
                                    </Col>
                                </Row>

                                <Row className="mt-3">
                                    <Col md={8}>
                                        <Form.Control
                                            type="file"
                                            accept=".pdf,.xlsx,.xls,.docx,.doc"
                                            onChange={(e) => handleFileChange(doc.key, e.target.files[0])}
                                            disabled={extractionStatus[doc.key] === 'completed'}
                                        />
                                        <Form.Text className="text-muted">
                                            Accepted: PDF, Excel, Word
                                        </Form.Text>
                                    </Col>
                                    <Col md={4} className="text-end">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleUploadAndExtract(doc.key)}
                                            disabled={!uploadedDocs[doc.key] || extractionStatus[doc.key] === 'processing' || extractionStatus[doc.key] === 'completed'}
                                        >
                                            {extractionStatus[doc.key] === 'processing' ? (
                                                <>
                                                    <Spinner animation="border" size="sm" /> {showAIFeatures ? 'Analyzing...' : 'Uploading...'}
                                                </>
                                            ) : extractionStatus[doc.key] === 'completed' ? (
                                                showAIFeatures ? '✓ Verified' : '✓ Uploaded'
                                            ) : (
                                                showAIFeatures ? '🤖 Verify & Extract' : '⬆ Upload File'
                                            )}
                                        </Button>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    ))}

                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="secondary" onClick={() => window.history.back()}>
                            ← Back
                        </Button>

                        <div>
                            <Button
                                variant="info"
                                className="me-2"
                                onClick={handleUploadAll}
                                disabled={loading || !Object.values(uploadedDocs).some(doc => doc !== null)}
                            >
                                📤 Upload All Documents
                            </Button>

                            <Button
                                variant="success"
                                onClick={onComplete}
                                disabled={!allRequiredUploaded}
                                size="lg"
                            >
                                {allRequiredUploaded ? (
                                    'Continue to Review Extracted Data →'
                                ) : (
                                    'Upload Required Documents First'
                                )}
                            </Button>
                        </div>
                    </div>

                    {allRequiredUploaded && (
                        <Alert variant="success" className="mt-3">
                            <strong>✅ All required documents uploaded!</strong>
                            <p className="mb-0">
                                You can now proceed to review the AI-extracted data in Stages 4-8.
                                All fields have been pre-filled. You can edit any information if needed.
                            </p>
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default DocumentUploadHub;
