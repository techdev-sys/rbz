import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Container, Alert, Spinner, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import { generateReport, getReport, submitReport, approveReport } from '../services/api';

const ReportGeneration = () => {
    const [companyId] = useState(localStorage.getItem('currentCompanyId'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reportHTML, setReportHTML] = useState('');
    const [reportData, setReportData] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const user_role = localStorage.getItem('userRole') || 'examiner'; // examiner, senior, principal, registrar

    const [approvalForm, setApprovalForm] = useState({
        preparedBy: '',
        preparedByDesignation: 'Bank Examiner (BE)',
        recommendation: 'APPROVE',
        recommendationJustification: '',
        recommendationConditions: ''
    });

    const loadExistingReport = useCallback(async () => {
        if (!companyId) return;

        try {
            const response = await getReport(companyId);
            if (response.data) {
                setReportData(response.data);
                setReportHTML(response.data.generatedReportHTML || '');

                // Also check if we should pre-fill the form
                if (response.data.preparedBy) {
                    setApprovalForm(prev => ({ ...prev, preparedBy: response.data.preparedBy }));
                }
            }
        } catch (err) {
            console.log('No existing report');
        }
    }, [companyId]);

    // Updated effect to load user details
    useEffect(() => {
        loadExistingReport();
        // Pre-fill examiner name if available (mocked for now or from future proper auth profile)
        if (user_role === 'examiner') {
            // Ideally fetch this from a user profile endpoint. 
            // For now we'll leave it empty to force them to type their name, or use a default if we had one.
            // But let's try to be smart and see if the report has it, if not check company profile assignment
        }
    }, [loadExistingReport, user_role]);


    const handleGenerateReport = async () => {
        if (!companyId) {
            setError('No company selected. Please complete previous stages first.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await generateReport(companyId);
            setReportHTML(response.data);
            setError(null);

            // Reload report data
            await loadExistingReport();
        } catch (err) {
            console.error('Report generation failed', err);
            setError(err.response?.data || 'Failed to generate report. Ensure all stages are completed.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitForApproval = async () => {
        setLoading(true);
        setError(null);

        try {
            await submitReport(companyId, approvalForm);
            setShowApprovalModal(false);
            await loadExistingReport();
            alert('Report submitted successfully!');
        } catch (err) {
            setError(err.response?.data || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (status) => {
        if (!window.confirm(`Are you sure you want to ${status} this report?`)) return;

        setLoading(true);
        try {
            await approveReport(companyId, {
                finalApprovalStatus: status,
                approvedBy: 'P. T. Madamombe',
                approvalComments: 'Processed through RBZ Licensing System'
            });
            await loadExistingReport();
            alert(`Report ${status}!`);
        } catch (err) {
            setError(err.response?.data || 'Failed to approve report');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write(reportHTML);
        printWindow.document.close();
        printWindow.print();
    };

    const handleViewFullScreen = () => {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(reportHTML);
        newWindow.document.close();
    };

    const getWorkflowBadge = (status) => {
        const badges = {
            'DRAFT': <Badge bg="secondary">Draft</Badge>,
            'SUBMITTED': <Badge bg="info">Submitted</Badge>,
            'UNDER_REVIEW': <Badge bg="warning">Under Review</Badge>,
            'PENDING_APPROVAL': <Badge bg="primary">Pending Approval</Badge>,
            'APPROVED': <Badge bg="success">Approved</Badge>,
            'REJECTED': <Badge bg="danger">Rejected</Badge>
        };
        return badges[status] || <Badge bg="secondary">Unknown</Badge>;
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-success text-white">
                    Stage 10: MFI Evaluation Report Generation & Approval
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Alert variant="success">
                        <h5>🎉 Congratulations!</h5>
                        <p>You've completed all data entry stages. You can now generate the complete MFI Evaluation Report.</p>
                    </Alert>

                    {reportData && (
                        <Card className="mb-4">
                            <Card.Body>
                                <h5>Report Status</h5>
                                <Row>
                                    <Col md={6}>
                                        <strong>Workflow Status:</strong> {getWorkflowBadge(reportData.workflowStatus)}
                                    </Col>
                                    <Col md={6}>
                                        <strong>Generated:</strong> {reportData.reportGeneratedDate ? new Date(reportData.reportGeneratedDate).toLocaleString() : 'Not yet generated'}
                                    </Col>
                                </Row>
                                {reportData.preparedBy && (
                                    <div className="mt-2">
                                        <strong>Prepared by:</strong> {reportData.preparedBy} ({reportData.preparedByDesignation})
                                    </div>
                                )}
                                {reportData.recommendation && (
                                    <div className="mt-2">
                                        <strong>Recommendation:</strong> <Badge bg={reportData.recommendation === 'APPROVE' ? 'success' : 'warning'}>{reportData.recommendation}</Badge>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    )}

                    <div className="d-flex gap-2 flex-wrap mb-4">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleGenerateReport}
                            disabled={loading}
                        >
                            {loading ? <Spinner animation="border" size="sm" /> : '📄 Generate Report'}
                        </Button>

                        {reportHTML && (
                            <>
                                <Button variant="info" onClick={handlePrint}>
                                    🖨️ Print Report
                                </Button>

                                <Button variant="secondary" onClick={handleViewFullScreen}>
                                    👁️ View Full Screen
                                </Button>

                                {(!reportData || reportData.workflowStatus === 'DRAFT') && (
                                    <Button variant="warning" onClick={() => setShowApprovalModal(true)}>
                                        📝 Submit for Approval
                                    </Button>
                                )}

                                {reportData && reportData.workflowStatus === 'PENDING_APPROVAL' && user_role === 'registrar' && (
                                    <>
                                        <Button variant="success" onClick={() => handleApprove('APPROVED')}>
                                            ✅ Approve License
                                        </Button>
                                        <Button variant="danger" onClick={() => handleApprove('REJECTED')}>
                                            ❌ Reject Application
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {reportHTML && (
                        <Card>
                            <Card.Header className="bg-light">
                                <h5>Generated Report Preview</h5>
                            </Card.Header>
                            <Card.Body style={{ maxHeight: '600px', overflow: 'auto' }}>
                                <div dangerouslySetInnerHTML={{ __html: reportHTML }} />
                            </Card.Body>
                        </Card>
                    )}

                    {!reportHTML && !loading && (
                        <Alert variant="secondary" className="text-center">
                            <p>Click "Generate Report" to compile all data into the MFI Evaluation Report format.</p>
                            <small>The report will include all 8 required tables and all template sections.</small>
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Approval Modal */}
            <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Submit Report for Approval</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Prepared By (Your Name) *</Form.Label>
                            <Form.Control
                                type="text"
                                value={approvalForm.preparedBy}
                                onChange={(e) => setApprovalForm({ ...approvalForm, preparedBy: e.target.value })}
                                placeholder="Your full name"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Your Designation *</Form.Label>
                            <Form.Select
                                value={approvalForm.preparedByDesignation}
                                onChange={(e) => setApprovalForm({ ...approvalForm, preparedByDesignation: e.target.value })}
                            >
                                <option value="Bank Examiner (BE)">Bank Examiner (BE)</option>
                                <option value="Senior Bank Examiner">Senior Bank Examiner</option>
                                <option value="Principal Bank Examiner">Principal Bank Examiner</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Recommendation *</Form.Label>
                            <Form.Select
                                value={approvalForm.recommendation}
                                onChange={(e) => setApprovalForm({ ...approvalForm, recommendation: e.target.value })}
                            >
                                <option value="APPROVE">APPROVE</option>
                                <option value="APPROVE_WITH_CONDITIONS">APPROVE WITH CONDITIONS</option>
                                <option value="REJECT">REJECT</option>
                            </Form.Select>
                        </Form.Group>

                        {approvalForm.recommendation === 'APPROVE_WITH_CONDITIONS' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Conditions *</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={approvalForm.recommendationConditions}
                                    onChange={(e) => setApprovalForm({ ...approvalForm, recommendationConditions: e.target.value })}
                                    placeholder="List the conditions for approval..."
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Justification *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={4}
                                value={approvalForm.recommendationJustification}
                                onChange={(e) => setApprovalForm({ ...approvalForm, recommendationJustification: e.target.value })}
                                placeholder="Provide justification for your recommendation..."
                                required
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSubmitForApproval} disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" /> : 'Submit for Approval'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ReportGeneration;
