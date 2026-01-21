import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Alert, Spinner } from 'react-bootstrap';
import { extractCR11, saveShareholders, getShareholders } from '../services/api';

const OwnershipStructure = () => {
    const [companyId] = useState(localStorage.getItem('companyId'));
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    const [shareholders, setShareholders] = useState([]);
    const [capitalSummary, setCapitalSummary] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        if (companyId) {
            loadExistingShareholders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const loadExistingShareholders = async () => {
        try {
            const data = await getShareholders(companyId);
            if (data && data.length > 0) {
                setShareholders(data);
            }
        } catch (err) {
            console.error("Failed to load existing shareholders", err);
        }
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await extractCR11(file, companyId);
            // Result structure: { shareholders: [], capital_summary: {}, verification_status: "" }
            
            if (result.shareholders) {
                const mappedShareholders = result.shareholders.map(s => ({
                    companyId: companyId ? parseInt(companyId) : null,
                    fullName: s.name,
                    numberOfShares: s.shares_count,
                    ownershipPercentage: 0.0, // AI might not extract this, usually calculated
                    amountPaid: 0.0, // User to input
                    verifiedNetWorthStatus: "Pending Check"
                }));
                setShareholders(mappedShareholders);
            }
            
            if (result.capital_summary) {
                setCapitalSummary(result.capital_summary);
            }
            
            setVerificationStatus(result.verification_status);
            setSuccess("CR11 Extracted Successfully. Please verify details and input Amount Paid.");

        } catch (err) {
            setError("Failed to extract CR11 data. Please try again.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleShareholderChange = (index, field, value) => {
        const updated = [...shareholders];
        updated[index][field] = value;
        setShareholders(updated);
    };

    const handleSave = async () => {
        if (!companyId) {
            setError("No Company Profile found. Please complete Stage 1 first.");
            return;
        }
        
        setLoading(true);
        try {
            await saveShareholders(shareholders);
            setSuccess("Ownership Structure Saved Successfully!");
        } catch (err) {
            setError("Failed to save data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Total Shares for % calculation if needed, or display
    const totalShares = shareholders.reduce((sum, s) => sum + (parseInt(s.numberOfShares) || 0), 0);

    return (
        <Container className="mt-4">
            <h2 className="mb-4">Stage 3: Ownership & Capital Structure</h2>

            <Row className="mb-4">
                <Col md={12}>
                    <Card>
                        <Card.Header className="bg-primary text-white">Upload Form CR11 (Return of Allotments)</Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Select File</Form.Label>
                                <div className="d-flex gap-2">
                                    <Form.Control type="file" onChange={handleFileChange} accept=".pdf,.jpg,.png" />
                                    <Button onClick={handleUpload} disabled={loading || !file}>
                                        {loading ? <Spinner size="sm" animation="border" /> : 'Analyze with AI'}
                                    </Button>
                                </div>
                            </Form.Group>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {capitalSummary && (
                <Row className="mb-4">
                    <Col md={12}>
                        <Card className="border-info">
                            <Card.Header className="bg-info text-white">Capital Structure Verification</Card.Header>
                            <Card.Body>
                                <Row>
                                    <Col md={4}>
                                        <strong>Nominal Capital:</strong> {capitalSummary.nominal_capital} {capitalSummary.currency}
                                    </Col>
                                    <Col md={4}>
                                        <strong>Total Shares Issued (Extracted):</strong> {totalShares}
                                    </Col>
                                    <Col md={4}>
                                        <strong>Status:</strong> {verificationStatus}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}

            {shareholders.length > 0 && (
                <Row>
                    <Col md={12}>
                        <Card>
                            <Card.Header>Table 1: Shareholding Structure</Card.Header>
                            <Card.Body>
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Shareholder Name</th>
                                            <th>Number of Shares</th>
                                            <th>Ownership %</th>
                                            <th>Amount Paid ($) (Manual Input)</th>
                                            <th>Net Worth Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shareholders.map((s, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Form.Control 
                                                        type="text" 
                                                        value={s.fullName} 
                                                        onChange={(e) => handleShareholderChange(index, 'fullName', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control 
                                                        type="number" 
                                                        value={s.numberOfShares} 
                                                        onChange={(e) => handleShareholderChange(index, 'numberOfShares', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td>
                                                    {totalShares > 0 
                                                        ? ((s.numberOfShares / totalShares) * 100).toFixed(2) + '%' 
                                                        : '0%'}
                                                </td>
                                                <td>
                                                    <Form.Control 
                                                        type="number" 
                                                        value={s.amountPaid} 
                                                        onChange={(e) => handleShareholderChange(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td>
                                                    <span className="text-muted">{s.verifiedNetWorthStatus}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                                <div className="d-flex justify-content-end">
                                    <Button variant="success" size="lg" onClick={handleSave} disabled={loading}>
                                        {loading ? <Spinner size="sm" animation="border" /> : 'Save & Complete Stage 3'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            )}
        </Container>
    );
};

export default OwnershipStructure;
