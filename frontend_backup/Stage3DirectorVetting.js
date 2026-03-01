import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Alert, ProgressBar, Row, Col } from 'react-bootstrap';
import axios from 'axios';

/**
 * Stage 3: Corporate Governance - Director Vetting
 * Simplified to focus on ID/Passport document upload for directors
 */
function Stage3DirectorVetting({ companyId, onComplete }) {
    const [directors, setDirectors] = useState([]);
    const [selectedDirector, setSelectedDirector] = useState(null);
    const [documentType, setDocumentType] = useState('NATIONAL_ID');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [alert, setAlert] = useState(null);
    const [vettingSummary, setVettingSummary] = useState(null);

    useEffect(() => {
        if (companyId) {
            fetchDirectors();
            fetchVettingSummary();
        }
    }, [companyId]);

    const fetchDirectors = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/director-vetting/company/${companyId}`);
            setDirectors(response.data);
        } catch (error) {
            console.error('Error fetching directors:', error);
            setAlert({ type: 'danger', message: 'Error loading directors' });
        }
    };

    const fetchVettingSummary = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/director-vetting/company/${companyId}/summary`);
            setVettingSummary(response.data);
        } catch (error) {
            console.error('Error fetching vetting summary:', error);
        }
    };

    const handleDocumentUpload = async (directorId) => {
        if (!uploadFile) {
            setAlert({ type: 'warning', message: 'Please select a file to upload' });
            return;
        }

        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('documentType', documentType);

        try {
            setUploadProgress(50);
            const response = await axios.post(
                `http://localhost:8080/api/director-vetting/${directorId}/upload-id`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    params: { documentType }
                }
            );

            setUploadProgress(100);
            setAlert({ type: 'success', message: `Document uploaded successfully for ${response.data.fullName}!` });

            // Reset form
            setUploadFile(null);
            setSelectedDirector(null);

            // Refresh data
            fetchDirectors();
            fetchVettingSummary();

            setTimeout(() => {
                setUploadProgress(0);
                setAlert(null);
            }, 2000);
        } catch (error) {
            setUploadProgress(0);
            setAlert({ type: 'danger', message: 'Error uploading document: ' + (error.response?.data?.message || error.message) });
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'VERIFIED':
                return <Badge bg="success">✓ Verified</Badge>;
            case 'PENDING':
                return <Badge bg="warning">⏳ Pending</Badge>;
            case 'REJECTED':
                return <Badge bg="danger">✗ Rejected</Badge>;
            default:
                return <Badge bg="secondary">Not Uploaded</Badge>;
        }
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">👔 Stage 3: Director Vetting</h4>
                </Card.Header>
                <Card.Body>
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                            {alert.message}
                        </Alert>
                    )}

                    {/* Vetting Summary */}
                    {vettingSummary && (
                        <Alert variant="info" className="mb-4">
                            <Row>
                                <Col md={3}>
                                    <strong>Total Directors:</strong> {vettingSummary.total}
                                </Col>
                                <Col md={3}>
                                    <strong>Verified:</strong> <Badge bg="success">{vettingSummary.verified}</Badge>
                                </Col>
                                <Col md={3}>
                                    <strong>Pending:</strong> <Badge bg="warning">{vettingSummary.pending}</Badge>
                                </Col>
                                <Col md={3}>
                                    <strong>Progress:</strong>
                                    <ProgressBar
                                        now={vettingSummary.percentageComplete}
                                        label={`${Math.round(vettingSummary.percentageComplete)}%`}
                                        className="mt-1"
                                    />
                                </Col>
                            </Row>
                        </Alert>
                    )}

                    <Alert variant="info">
                        <strong>Requirements:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Upload a valid <strong>National ID</strong> or <strong>Passport</strong> for each director</li>
                            <li>Documents must be clear and legible</li>
                            <li>All directors must be vetted before proceeding</li>
                        </ul>
                    </Alert>

                    {/* Directors Table */}
                    <Card>
                        <Card.Header>
                            <h5>Directors List</h5>
                            <small className="text-muted">Upload ID or Passport for vetting</small>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-dark">
                                    <tr>
                                        <th>#</th>
                                        <th>Full Name</th>
                                        <th>Designation</th>
                                        <th>Date of Birth</th>
                                        <th>Nationality</th>
                                        <th>Document Type</th>
                                        <th>Vetting Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {directors.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="text-center text-muted">
                                                No directors found. Please add directors in Stage 1.
                                            </td>
                                        </tr>
                                    ) : (
                                        directors.map((director, index) => (
                                            <tr key={director.id}>
                                                <td>{index + 1}</td>
                                                <td>{director.fullName}</td>
                                                <td>{director.designation || 'N/A'}</td>
                                                <td>{director.dateOfBirth || 'N/A'}</td>
                                                <td>{director.nationality || 'N/A'}</td>
                                                <td>
                                                    {director.idDocumentType ? (
                                                        <Badge bg="info">{director.idDocumentType}</Badge>
                                                    ) : (
                                                        <span className="text-muted">Not specified</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {getStatusBadge(director.idDocumentVerificationStatus)}
                                                </td>
                                                <td>
                                                    {director.idDocumentVerificationStatus !== 'VERIFIED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            onClick={() => setSelectedDirector(director)}
                                                        >
                                                            Upload ID
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Document Upload Form */}
                    {selectedDirector && (
                        <Card className="mt-4 border-primary">
                            <Card.Header className="bg-light">
                                <h5>Upload ID Document for: {selectedDirector.fullName}</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Document Type</Form.Label>
                                                <Form.Select
                                                    value={documentType}
                                                    onChange={(e) => setDocumentType(e.target.value)}
                                                >
                                                    <option value="NATIONAL_ID">National ID</option>
                                                    <option value="PASSPORT">Passport</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Select Document File</Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                    onChange={(e) => setUploadFile(e.target.files[0])}
                                                />
                                                <Form.Text className="text-muted">
                                                    Accepted formats: PDF, JPG, PNG (Max 5MB)
                                                </Form.Text>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    {uploadProgress > 0 && (
                                        <ProgressBar
                                            now={uploadProgress}
                                            label={`${uploadProgress}%`}
                                            className="mb-3"
                                            animated
                                        />
                                    )}

                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="success"
                                            onClick={() => handleDocumentUpload(selectedDirector.id)}
                                            disabled={!uploadFile || uploadProgress > 0}
                                        >
                                            {uploadProgress > 0 ? 'Uploading...' : 'Upload Document'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setSelectedDirector(null);
                                                setUploadFile(null);
                                                setUploadProgress(0);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Navigation Buttons */}
                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="secondary">← Previous Stage</Button>
                        <Button
                            variant="primary"
                            onClick={onComplete}
                            disabled={vettingSummary?.percentageComplete < 100}
                        >
                            Next Stage →
                        </Button>
                    </div>

                    {vettingSummary?.percentageComplete < 100 && (
                        <Alert variant="warning" className="mt-3">
                            ⚠️ You must upload ID documents for all directors before proceeding to the next stage.
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default Stage3DirectorVetting;
