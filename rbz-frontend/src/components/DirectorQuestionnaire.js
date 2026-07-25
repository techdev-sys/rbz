import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap';
import { saveDirectorQuestionnaire, getDirectorQuestionnaire } from '../services/api';

const QUESTIONS = [
    { key: 'hasCriminalConvictions', detailKey: 'criminalConvictionsDetails', label: 'Have you ever been convicted of any criminal offence (including fraud, theft, money laundering, or financial misconduct)?', placeholder: 'Provide case details, jurisdiction, and date of conviction...' },
    { key: 'hasBeenDirectorOfFailedInstitution', detailKey: 'failedInstitutionDetails', label: 'Have you ever been a director, officer, or significant shareholder of any financial institution that was placed under curatorship, liquidation, or had its licence revoked?', placeholder: 'Provide institution name, jurisdiction, and circumstances...' },
    { key: 'hasRegulatoryProceedings', detailKey: 'regulatoryProceedingsDetails', label: 'Are you currently subject to, or have you been subject to, any regulatory, disciplinary, or legal proceedings by a financial regulator?', placeholder: 'Provide regulator name, nature of proceedings, and current status...' },
    { key: 'hasBeenBankrupt', detailKey: 'bankruptcyDetails', label: 'Have you ever been declared bankrupt or entered into any arrangement with creditors?', placeholder: 'Provide jurisdiction, date, and outcome...' },
    { key: 'hasOutstandingDebts', detailKey: 'outstandingDebtsDetails', label: 'Do you have any outstanding non-performing loans or debts owed to any financial institution?', placeholder: 'Provide institution name, outstanding amount, and status...' },
    { key: 'hasConflictOfInterest', detailKey: 'conflictOfInterestDetails', label: 'Do you have any business interests, relationships, or obligations that may constitute a conflict of interest with your role in this institution?', placeholder: 'Describe the nature and extent of the conflict...' },
    { key: 'hasProfessionalSanctions', detailKey: 'professionalSanctionsDetails', label: 'Have you ever been disqualified from acting as a director, or had any professional licence suspended, revoked, or refused?', placeholder: 'Provide the relevant professional body, reasons, and dates...' },
];

const DirectorQuestionnaire = ({ show, onHide, director, companyId, readOnly = false }) => {
    const [formData, setFormData] = useState({
        directorId: director?.id,
        companyId,
        directorName: director?.fullName || '',
        hasCriminalConvictions: 'NO',
        criminalConvictionsDetails: '',
        hasBeenDirectorOfFailedInstitution: 'NO',
        failedInstitutionDetails: '',
        hasRegulatoryProceedings: 'NO',
        regulatoryProceedingsDetails: '',
        hasBeenBankrupt: 'NO',
        bankruptcyDetails: '',
        hasOutstandingDebts: 'NO',
        outstandingDebtsDetails: '',
        hasConflictOfInterest: 'NO',
        conflictOfInterestDetails: '',
        hasProfessionalSanctions: 'NO',
        professionalSanctionsDetails: '',
        declarationSigned: false,
        completionStatus: 'PENDING',
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (show && director?.id) {
            setLoading(true);
            setError(null);
            setSuccess(false);
            getDirectorQuestionnaire(director.id)
                .then(res => {
                    if (res.data) {
                        setFormData(prev => ({ ...prev, ...res.data }));
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            directorId: director.id,
                            companyId,
                            directorName: director.fullName || '',
                        }));
                    }
                })
                .catch(() => {
                    setFormData(prev => ({
                        ...prev,
                        directorId: director.id,
                        companyId,
                        directorName: director.fullName || '',
                    }));
                })
                .finally(() => setLoading(false));
        }
    }, [show, director, companyId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSave = async () => {
        if (!formData.declarationSigned) {
            setError('You must sign the declaration before submitting.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await saveDirectorQuestionnaire({ ...formData, directorId: director.id, companyId });
            setSuccess(true);
            setTimeout(() => { setSuccess(false); onHide(true); }, 1200);
        } catch (err) {
            setError(err.response?.data || 'Failed to save questionnaire.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal show={show} onHide={() => onHide(false)} size="lg" centered scrollable>
            <Modal.Header closeButton style={{ background: '#003366', color: 'white', borderRadius: 0 }}>
                <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
                    Fit & Proper Questionnaire — {director?.fullName}
                    {formData.completionStatus === 'COMPLETED' && (
                        <Badge bg="success" className="ms-2" style={{ fontSize: '0.7rem' }}>Completed</Badge>
                    )}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '24px' }}>
                {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" size="sm" style={{ color: '#003366' }} /></div>
                ) : (
                    <>
                        {error && <Alert variant="danger" className="small">{error}</Alert>}
                        {success && <Alert variant="success" className="small">Questionnaire saved successfully.</Alert>}

                        <Alert variant="info" style={{ fontSize: '0.82rem' }}>
                            This questionnaire is required by the Reserve Bank of Zimbabwe under the Microfinance Act.
                            All directors must complete and sign this declaration. False or misleading answers may result
                            in disqualification and prosecution.
                        </Alert>

                        {QUESTIONS.map((q, idx) => (
                            <div key={q.key} style={{ border: '1px solid #e0e4e8', borderRadius: '6px', padding: '16px', marginBottom: '12px' }}>
                                <Form.Label style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: '10px' }}>
                                    {idx + 1}. {q.label}
                                </Form.Label>
                                <Row>
                                    <Col md={3}>
                                        <Form.Select
                                            name={q.key}
                                            value={formData[q.key]}
                                            onChange={handleChange}
                                            disabled={readOnly}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            <option value="NO">NO</option>
                                            <option value="YES">YES</option>
                                        </Form.Select>
                                    </Col>
                                    {formData[q.key] === 'YES' && (
                                        <Col md={9}>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                name={q.detailKey}
                                                value={formData[q.detailKey] || ''}
                                                onChange={handleChange}
                                                disabled={readOnly}
                                                placeholder={q.placeholder}
                                                style={{ fontSize: '0.82rem' }}
                                            />
                                        </Col>
                                    )}
                                </Row>
                            </div>
                        ))}

                        <div style={{ border: '2px solid #003366', borderRadius: '6px', padding: '16px', marginTop: '16px', background: '#f8fafc' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#003366', marginBottom: '8px' }}>Declaration</div>
                            <p style={{ fontSize: '0.82rem', color: '#333' }}>
                                I, <strong>{director?.fullName}</strong>, hereby declare that the information provided in this questionnaire
                                is true, complete, and accurate to the best of my knowledge. I understand that providing
                                false or misleading information constitutes a criminal offence and may result in the
                                disqualification of this application and legal proceedings against me.
                            </p>
                            <Form.Check
                                type="checkbox"
                                name="declarationSigned"
                                id="declaration-signed"
                                label="I confirm that the above declaration is true and I sign this questionnaire electronically."
                                checked={formData.declarationSigned}
                                onChange={handleChange}
                                disabled={readOnly}
                                style={{ fontSize: '0.85rem', fontWeight: 600 }}
                            />
                        </div>
                    </>
                )}
            </Modal.Body>
            {!readOnly && (
                <Modal.Footer style={{ borderTop: '1px solid #e0e4e8' }}>
                    <Button variant="link" onClick={() => onHide(false)} style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || loading}
                        style={{ background: '#003366', border: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        {saving ? <Spinner animation="border" size="sm" /> : 'Save & Submit Declaration'}
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    );
};

export default DirectorQuestionnaire;
