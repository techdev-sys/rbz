import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Alert, Badge, Row, Col, ProgressBar, InputGroup } from 'react-bootstrap';
import {
    getShareholdingStructure,
    addShareholderManual,
    validateOwnershipCompliance,
    uploadShareholderDocument,
    uploadCompanyOwnershipDocument,
    deleteShareholder
} from '../services/api';
import WorkflowStatusPanel from './WorkflowStatusPanel';

/**
 * Stage 2: Ownership - Shareholding Structure and Document Upload
 * Allows manual entry of shareholding table and uploading ownership documents
 */
function Stage2Ownership({ companyId, onComplete }) {
    const [shareholders, setShareholders] = useState([]);
    const [newShareholder, setNewShareholder] = useState({
        fullName: '',
        numberOfShares: '',
        amountPaid: '',
        ownershipPercentage: '',
        netWorthStatus: ''
    });
    const [editIndex, setEditIndex] = useState(null);
    const [editShareholder, setEditShareholder] = useState({});
    const [compliance, setCompliance] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});
    const [alert, setAlert] = useState(null);

    // Fetch existing shareholding structure
    useEffect(() => {
        if (companyId) {
            fetchShareholdingStructure();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [companyId]);

    const fetchShareholdingStructure = async () => {
        try {
            const response = await getShareholdingStructure(companyId);
            setShareholders(response.data);
            validateCompliance();
        } catch (error) {
            console.error('Error fetching shareholding structure:', error);
        }
    };

    const validateCompliance = async () => {
        try {
            const response = await validateOwnershipCompliance(companyId);
            setCompliance(response.data);
        } catch (error) {
            console.error('Error validating compliance:', error);
        }
    };

    // Add shareholder to table
    const handleAddShareholder = async () => {
        const ownership = parseFloat(newShareholder.ownershipPercentage);

        // Validate 50% max rule
        if (ownership > 50) {
            setAlert({ type: 'danger', message: `Ownership of ${ownership}% exceeds the 50% maximum shareholding limit per shareholder.` });
            return;
        }

        try {
            const response = await addShareholderManual(companyId, { ...newShareholder, companyId });

            setShareholders([...shareholders, response.data]);
            setNewShareholder({
                fullName: '',
                numberOfShares: '',
                amountPaid: '',
                ownershipPercentage: '',
                netWorthStatus: ''
            });
            setAlert({ type: 'success', message: 'Shareholder added successfully!' });
            validateCompliance();
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error adding shareholder: ' + error.message });
        }
    };

    // Edit shareholder logic
    const handleEditClick = (index, sh) => {
        setEditIndex(index);
        setEditShareholder({ ...sh });
    };

    const handleCancelEdit = () => {
        setEditIndex(null);
        setEditShareholder({});
    };

    const handleSaveEdit = async () => {
        const ownership = parseFloat(editShareholder.ownershipPercentage);

        // Validate 50% max rule
        if (ownership > 50) {
            setAlert({ type: 'danger', message: `Ownership of ${ownership}% exceeds the 50% maximum shareholding limit per shareholder.` });
            return;
        }

        try {
            const response = await addShareholderManual(companyId, { ...editShareholder, companyId });

            const updated = [...shareholders];
            updated[editIndex] = response.data;
            setShareholders(updated);

            setEditIndex(null);
            setEditShareholder({});
            setAlert({ type: 'success', message: 'Shareholder updated successfully!' });
            validateCompliance();
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error updating shareholder: ' + error.message });
        }
    };

    // Remove shareholder
    const handleRemoveShareholder = async (index, shareholderId) => {
        try {
            if (shareholderId) {
                await deleteShareholder(shareholderId);
            }
            const updated = shareholders.filter((_, i) => i !== index);
            setShareholders(updated);
            setAlert({ type: 'success', message: 'Shareholder removed successfully!' });
            validateCompliance();
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error removing shareholder: ' + error.message });
        }
    };

    // Handle document upload
    const handleDocumentUpload = async (shareholderId, documentType, file) => {
        const key = documentType + shareholderId;
        try {
            setUploadProgress(prev => ({ ...prev, [key]: 50 }));
            await uploadShareholderDocument(shareholderId, documentType, file);
            setUploadProgress(prev => ({ ...prev, [key]: 100 }));
            setAlert({ type: 'success', message: `${documentType} uploaded successfully!` });
            validateCompliance();
        } catch (error) {
            setAlert({ type: 'danger', message: `Error uploading ${documentType}: ` + error.message });
            setUploadProgress(prev => {
                const updated = { ...prev };
                delete updated[key];
                return updated;
            });
        }
    };

    // Upload company-level documents
    const handleCompanyDocumentUpload = async (documentType, file) => {
        try {
            setUploadProgress(prev => ({ ...prev, [documentType]: 50 }));
            await uploadCompanyOwnershipDocument(companyId, documentType, file);
            setUploadProgress(prev => ({ ...prev, [documentType]: 100 }));
            setAlert({ type: 'success', message: `${documentType} uploaded successfully!` });
        } catch (error) {
            setAlert({ type: 'danger', message: `Error uploading ${documentType}: ` + error.message });
            setUploadProgress(prev => {
                const updated = { ...prev };
                delete updated[documentType];
                return updated;
            });
        }
    };

    const totalOwnership = shareholders.reduce((sum, sh) => sum + parseFloat(sh.ownershipPercentage || 0), 0);

    const renderFileUploadCard = (title, docType, isCompany = true, id = null) => {
        const progress = isCompany ? uploadProgress[docType] : uploadProgress[docType + id];
        const isUploaded = progress === 100;

        return (
            <Col md={3} sm={6} className="mb-4" key={isCompany ? docType : docType + id}>
                <Card className="h-100 shadow-sm border-0" style={{ backgroundColor: isUploaded ? '#f0fdf4' : '#f8f9fa', border: isUploaded ? '1px solid #198754 !important' : '1px solid #e0e4e8 !important', transition: '0.3s' }}>
                    <Card.Body className="d-flex flex-column text-center justify-content-center p-4">
                        <div className="mb-3">
                            {isUploaded ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#198754" viewBox="0 0 16 16">
                                    <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="#003366" viewBox="0 0 16 16">
                                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z" />
                                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z" />
                                </svg>
                            )}
                        </div>
                        <h6 className="fw-bold mb-3" style={{ fontSize: '0.85rem', color: '#003366', height: '35px' }}>{title}</h6>

                        {!isUploaded && (
                            <div className="mt-auto">
                                <label className="btn btn-outline-primary btn-sm w-100 rounded-pill fw-bold" style={{ cursor: 'pointer' }}>
                                    Choose File
                                    <input
                                        type="file"
                                        hidden
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                isCompany
                                                    ? handleCompanyDocumentUpload(docType, e.target.files[0])
                                                    : handleDocumentUpload(id, docType, e.target.files[0]);
                                            }
                                        }}
                                        accept=".pdf,.jpg,.png"
                                    />
                                </label>
                            </div>
                        )}

                        {progress > 0 && progress < 100 && (
                            <ProgressBar animated now={progress} style={{ height: '6px' }} className="mt-3 w-100" />
                        )}

                        {isUploaded && (
                            <div className="mt-auto w-100 d-flex gap-2">
                                <Badge bg="success" className="py-2 flex-grow-1 rounded-pill d-flex align-items-center justify-content-center">
                                    <span className="me-1">✓</span> Uploaded
                                </Badge>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="rounded-circle px-2"
                                    onClick={() => {
                                        setUploadProgress(prev => {
                                            const updated = { ...prev };
                                            delete updated[isCompany ? docType : docType + id];
                                            return updated;
                                        });
                                    }}
                                    title="Remove Document"
                                >
                                    ✕
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        );
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <h4 className="mb-0">📊 Stage 2: Ownership Structure</h4>
                </Card.Header>
                <Card.Body>
                    {alert && (
                        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
                            {alert.message}
                        </Alert>
                    )}

                    <Alert variant="info">
                        <strong>Requirements:</strong>
                        <ul className="mb-0 mt-2">
                            <li>Maximum shareholding per shareholder: <strong>50%</strong></li>
                            <li>Total ownership must equal: <strong>100%</strong></li>
                            <li>Upload all required documents for each shareholder</li>
                        </ul>
                    </Alert>

                    {/* Shareholding Structure Table */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5>Shareholding Structure (Table 1)</h5>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-dark">
                                    <tr>
                                        <th>Shareholder's Name</th>
                                        <th>Number of Shares</th>
                                        <th>Amount Paid (US$)</th>
                                        <th>Ownership %</th>
                                        <th>Net Worth (US$)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shareholders.map((sh, index) => (
                                        <tr key={index}>
                                            {editIndex === index ? (
                                                <>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            value={editShareholder.fullName}
                                                            onChange={(e) => setEditShareholder({ ...editShareholder, fullName: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            value={editShareholder.numberOfShares}
                                                            onChange={(e) => setEditShareholder({ ...editShareholder, numberOfShares: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            step="0.01"
                                                            value={editShareholder.amountPaid}
                                                            onChange={(e) => setEditShareholder({ ...editShareholder, amountPaid: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Form.Control
                                                            size="sm"
                                                            type="number"
                                                            step="0.01"
                                                            value={editShareholder.ownershipPercentage}
                                                            onChange={(e) => setEditShareholder({ ...editShareholder, ownershipPercentage: e.target.value })}
                                                        />
                                                    </td>
                                                    <td>
                                                        <InputGroup size="sm">
                                                            <InputGroup.Text>$</InputGroup.Text>
                                                            <Form.Control
                                                                type="number"
                                                                step="0.01"
                                                                value={editShareholder.netWorthStatus}
                                                                onChange={(e) => setEditShareholder({ ...editShareholder, netWorthStatus: e.target.value })}
                                                            />
                                                        </InputGroup>
                                                    </td>
                                                    <td>
                                                        <Button size="sm" variant="success" className="me-2" onClick={handleSaveEdit}>
                                                            Save
                                                        </Button>
                                                        <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                                                            Cancel
                                                        </Button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="d-flex align-items-center">
                                                        <span
                                                            style={{ cursor: 'pointer', marginRight: '8px', display: 'inline-flex', alignItems: 'center' }}
                                                            onClick={() => handleEditClick(index, sh)}
                                                            title="Edit Shareholder Details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#003366" viewBox="0 0 16 16">
                                                                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                            </svg>
                                                        </span>
                                                        {sh.fullName}
                                                    </td>
                                                    <td>{sh.numberOfShares}</td>
                                                    <td>{parseFloat(sh.amountPaid || 0).toFixed(2)}</td>
                                                    <td>
                                                        <Badge bg={sh.ownershipPercentage > 50 ? 'danger' : 'success'}>
                                                            {sh.ownershipPercentage}%
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {sh.netWorthStatus && sh.netWorthStatus !== ''
                                                            ? `$${parseFloat(sh.netWorthStatus).toFixed(2)}`
                                                            : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => handleRemoveShareholder(index, sh.id)}
                                                        >
                                                            Remove
                                                        </Button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {/* Add New Shareholder Row */}
                                    <tr className="table-active">
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                placeholder="Full Name"
                                                value={newShareholder.fullName}
                                                onChange={(e) => setNewShareholder({ ...newShareholder, fullName: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                placeholder="Shares"
                                                value={newShareholder.numberOfShares}
                                                onChange={(e) => setNewShareholder({ ...newShareholder, numberOfShares: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                step="0.01"
                                                placeholder="Amount"
                                                value={newShareholder.amountPaid}
                                                onChange={(e) => setNewShareholder({ ...newShareholder, amountPaid: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                step="0.01"
                                                placeholder="%"
                                                value={newShareholder.ownershipPercentage}
                                                onChange={(e) => setNewShareholder({ ...newShareholder, ownershipPercentage: e.target.value })}
                                            />
                                        </td>
                                        <td>
                                            <InputGroup size="sm">
                                                <InputGroup.Text>$</InputGroup.Text>
                                                <Form.Control
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="Net Worth"
                                                    value={newShareholder.netWorthStatus}
                                                    onChange={(e) => setNewShareholder({ ...newShareholder, netWorthStatus: e.target.value })}
                                                />
                                            </InputGroup>
                                        </td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant="success"
                                                onClick={handleAddShareholder}
                                                disabled={!newShareholder.fullName || !newShareholder.ownershipPercentage}
                                            >
                                                Add
                                            </Button>
                                        </td>
                                    </tr>
                                    {/* Totals Row */}
                                    <tr className="table-info fw-bold">
                                        <td>TOTAL</td>
                                        <td>{shareholders.reduce((sum, sh) => sum + parseInt(sh.numberOfShares || 0), 0)}</td>
                                        <td>{shareholders.reduce((sum, sh) => sum + parseFloat(sh.amountPaid || 0), 0).toFixed(2)}</td>
                                        <td>
                                            <Badge bg={totalOwnership === 100 ? 'success' : 'warning'}>
                                                {totalOwnership.toFixed(2)}%
                                            </Badge>
                                        </td>
                                        <td>
                                            ${shareholders.reduce((sum, sh) => sum + parseFloat(sh.netWorthStatus || 0), 0).toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </Table>

                            {compliance && (
                                <Alert variant={compliance.compliant ? 'success' : 'danger'}>
                                    <strong>Compliance Check:</strong>
                                    {compliance.compliant ? (
                                        <p className="mb-0">✅ Shareholding structure complies with regulatory requirements.</p>
                                    ) : (
                                        <div>
                                            <p className="mb-2">❌ Compliance Issues Found:</p>
                                            <p className="mb-0">{compliance.violations}</p>
                                        </div>
                                    )}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Document Uploads */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5>Required Company Documents</h5>
                        </Card.Header>
                        <Card.Body>
                            <Row>
                                {renderFileUploadCard("Application Letter", "application-letter")}
                                {renderFileUploadCard("Board Resolution", "board-resolution")}
                                {renderFileUploadCard("Certificate of Incorporation", "certificate-of-incorporation")}
                                {renderFileUploadCard("Share of Capital Clause", "share-of-capital-clause")}
                                {renderFileUploadCard("CR6", "cr6")}
                                {renderFileUploadCard("CR9", "cr9")}
                                {renderFileUploadCard("Company Tax Clearance", "company-tax-clearance")}
                            </Row>
                        </Card.Body>
                    </Card>

                    {/* Shareholder-Specific Documents */}
                    {shareholders.length > 0 && (
                        <Card className="mb-4">
                            <Card.Header>
                                <h5>Directors Questionnaires</h5>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="info" className="mb-4">
                                    <small>Please upload a completed Questionnaire for each added director below.</small>
                                </Alert>
                                <Row>
                                    {shareholders.map((sh, index) => (
                                        renderFileUploadCard(`Questionnaire: ${sh.fullName.split(' ')[0]}`, "directors-questionnaire", false, sh.id)
                                    ))}
                                </Row>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Replaced old Next button with Workflow Engine Sign Off */}
                    <div className="mt-4">
                        <WorkflowStatusPanel
                            companyId={companyId}
                            currentStep={2}
                            onStageComplete={onComplete}
                        />
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default Stage2Ownership;
