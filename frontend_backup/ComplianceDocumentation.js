import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Table } from 'react-bootstrap';
import { saveCompliance, getCompliance } from '../services/api';

const ComplianceDocumentation = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        companyId: localStorage.getItem('currentCompanyId'),
        hasCreditPolicyManual: 'NO',
        hasOperationalPolicyManual: 'NO',
        policyManualAssessment: '',
        clientProtectionMeasures: '',
        incorporatesClientProtection: 'NO',
        incorporatesCodeOfConduct: 'NO',
        hasLoanAgreementTemplate: 'NO',
        loanAgreementCompliant: 'NO',
        loanAgreementAssessment: '',
        disclosesInterestRates: 'NO',
        disclosesOtherCharges: 'NO',
        disclosesRepaymentSchedule: 'NO',
        disclosesPrepaymentTerms: 'NO',
        disclosesDefaultCharges: 'NO',
        hasTaxClearanceCertificate: 'NO',
        taxClearanceExpiryDate: '',
        hasRemittedCorporateTax: 'NO',
        corporateTaxAmountPaid: '0',
        consistentlySubmitsMFIReturns: 'NO',
        returnsConsistencyNotes: '',
        discrepanciesWithFinancials: '',
        otherComplianceIssues: ''
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
            const response = await getCompliance(companyId);
            if (response.data) {
                setFormData(response.data);
            }
        } catch (err) {
            console.log('No existing compliance data');
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
            await saveCompliance(formData);
            setSuccess(true);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 1500);
        } catch (err) {
            console.error('Save failed', err);
            setError(err.response?.data || 'Failed to save compliance documentation');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-primary text-white">
                    Stage 8: Compliance & Documentation
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Compliance Information Saved! Moving to next stage...</Alert>}

                    <Alert variant="info">
                        <strong>Template Reference:</strong> This captures the <strong>COMPLIANCE</strong> section of the MFI Evaluation Report.
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        <h5 className="mt-3 mb-3">Policy Manuals</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Has Credit Policy Manual? *</Form.Label>
                                    <Form.Select
                                        name="hasCreditPolicyManual"
                                        value={formData.hasCreditPolicyManual}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Has Operational Policy Manual? *</Form.Label>
                                    <Form.Select
                                        name="hasOperationalPolicyManual"
                                        value={formData.hasOperationalPolicyManual}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Policy Manual Assessment</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="policyManualAssessment"
                                value={formData.policyManualAssessment}
                                onChange={handleChange}
                                placeholder="Comment on the adequacy of the policy manuals in guiding employees on credit granting, administration and monitoring..."
                            />
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Client Protection Principles</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Incorporates Client Protection Principles? *</Form.Label>
                                    <Form.Select
                                        name="incorporatesClientProtection"
                                        value={formData.incorporatesClientProtection}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Incorporates Code of Conduct? *</Form.Label>
                                    <Form.Select
                                        name="incorporatesCodeOfConduct"
                                        value={formData.incorporatesCodeOfConduct}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Client Protection Measures/Strategies</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                name="clientProtectionMeasures"
                                value={formData.clientProtectionMeasures}
                                onChange={handleChange}
                                placeholder="Outline measures/strategies the institution has put in place to ensure compliance with microfinance Core Client Protection Principles and Code of Conduct..."
                            />
                            <Form.Text className="text-muted">
                                This should be presented in tabular form in the final report
                            </Form.Text>
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Loan Agreement Template</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Has Loan Agreement Template? *</Form.Label>
                                    <Form.Select
                                        name="hasLoanAgreementTemplate"
                                        value={formData.hasLoanAgreementTemplate}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loan Agreement Compliant? *</Form.Label>
                                    <Form.Select
                                        name="loanAgreementCompliant"
                                        value={formData.loanAgreementCompliant}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-3">
                            <Form.Label>Loan Agreement Assessment</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="loanAgreementAssessment"
                                value={formData.loanAgreementAssessment}
                                onChange={handleChange}
                                placeholder="Comment on whether the loan agreement is compliant with provisions of the Microfinance Act..."
                            />
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Full Disclosure Requirements</h5>
                        <Alert variant="secondary">
                            The loan agreement template must facilitate full disclosure of all terms and conditions:
                        </Alert>

                        <Table bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Disclosure Item</th>
                                    <th>Disclosed?</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Interest Rates</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            name="disclosesInterestRates"
                                            value={formData.disclosesInterestRates}
                                            onChange={handleChange}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Other Charges</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            name="disclosesOtherCharges"
                                            value={formData.disclosesOtherCharges}
                                            onChange={handleChange}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Repayment Schedule</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            name="disclosesRepaymentSchedule"
                                            value={formData.disclosesRepaymentSchedule}
                                            onChange={handleChange}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Prepayment Terms</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            name="disclosesPrepaymentTerms"
                                            value={formData.disclosesPrepaymentTerms}
                                            onChange={handleChange}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Default Charges</td>
                                    <td>
                                        <Form.Select
                                            size="sm"
                                            name="disclosesDefaultCharges"
                                            value={formData.disclosesDefaultCharges}
                                            onChange={handleChange}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>

                        <h5 className="mt-4 mb-3">Tax Compliance</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Has Tax Clearance Certificate? *</Form.Label>
                                    <Form.Select
                                        name="hasTaxClearanceCertificate"
                                        value={formData.hasTaxClearanceCertificate}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tax Clearance Expiry Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="taxClearanceExpiryDate"
                                        value={formData.taxClearanceExpiryDate}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Has Remitted Corporate Tax? *</Form.Label>
                                    <Form.Select
                                        name="hasRemittedCorporateTax"
                                        value={formData.hasRemittedCorporateTax}
                                        onChange={handleChange}
                                    >
                                        <option value="NO">NO</option>
                                        <option value="YES">YES</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Corporate Tax Amount Paid ($)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        name="corporateTaxAmountPaid"
                                        value={formData.corporateTaxAmountPaid}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h5 className="mt-4 mb-3">MFI Returns Submission</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>Consistently Submits MFI Returns? *</Form.Label>
                            <Form.Select
                                name="consistentlySubmitsMFIReturns"
                                value={formData.consistentlySubmitsMFIReturns}
                                onChange={handleChange}
                            >
                                <option value="NO">NO</option>
                                <option value="YES">YES</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Returns Consistency Notes</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="returnsConsistencyNotes"
                                value={formData.returnsConsistencyNotes}
                                onChange={handleChange}
                                placeholder="Comment on submission history..."
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Discrepancies with Financials</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                name="discrepanciesWithFinancials"
                                value={formData.discrepanciesWithFinancials}
                                onChange={handleChange}
                                placeholder="Note any discrepancies between MFI Returns and submitted financials..."
                            />
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Other Compliance Issues</h5>
                        <Form.Group className="mb-3">
                            <Form.Label>Other Compliance Issues</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="otherComplianceIssues"
                                value={formData.otherComplianceIssues}
                                onChange={handleChange}
                                placeholder="Indicate any other compliance issues..."
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

export default ComplianceDocumentation;
