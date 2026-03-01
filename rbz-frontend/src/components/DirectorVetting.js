import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Spinner, Alert, Badge, Modal } from 'react-bootstrap';
import { uploadCV, verifyDocument } from '../services/api';
import WorkflowStatusPanel from './WorkflowStatusPanel';

const DirectorVetting = ({ onComplete }) => {
  const [directors, setDirectors] = useState([]);
  const [formData, setFormData] = useState({
    fullName: '',
    idPassport: '',
    nationality: ''
  });

  const [companyId] = useState(localStorage.getItem('currentCompanyId') || "");
  const [cvLoadingMap, setCvLoadingMap] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, director: null });
  const [expandedDirectorId, setExpandedDirectorId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedDirectorId(expandedDirectorId === id ? null : id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addDirector = () => {
    if (!formData.fullName.trim() || !formData.idPassport.trim()) {
      alert('Please fill in Director Name and ID/Passport Number');
      return;
    }

    const newDirector = {
      id: Date.now(),
      fullName: formData.fullName,
      idPassport: formData.idPassport,
      nationality: formData.nationality || 'Not specified',
      status: 'Pending Verification',
      cvUploaded: false,
      experience: null,
      qualifications: null,
      riskFlag: false,
      files: {
        cv: null,
        affidavit: null,
        netWorth: null,
        policeClearance: null,
        taxClearance: null,
        certifiedId: null,
      },
      verification: {
        affidavit: { loading: false, result: null },
        netWorth: { loading: false, result: null },
        policeClearance: { loading: false, result: null },
        taxClearance: { loading: false, result: null },
        certifiedId: { loading: false, result: null },
      }
    };

    setDirectors([...directors, newDirector]);
    setFormData({ fullName: '', idPassport: '', nationality: '' });
    setExpandedDirectorId(newDirector.id); // Auto-expand the newly added director
  };

  const showDeleteConfirm = (director) => {
    setDeleteModal({ show: true, director });
  };

  const cancelDelete = () => {
    setDeleteModal({ show: false, director: null });
  };

  const confirmDelete = () => {
    if (deleteModal.director) {
      setDirectors(directors.filter(d => d.id !== deleteModal.director.id));
      setDeleteModal({ show: false, director: null });
    }
  };

  const handleFileChange = (directorId, fileType, file) => {
    setDirectors(directors.map(d =>
      d.id === directorId
        ? { ...d, files: { ...d.files, [fileType]: file } }
        : d
    ));
  };

  const handleAnalyzeCV = async (directorId) => {
    const director = directors.find(d => d.id === directorId);
    if (!director || !director.files.cv) return;

    setCvLoadingMap(prev => ({ ...prev, [directorId]: true }));

    try {
      const result = await uploadCV(director.files.cv, companyId);
      const riskFlag = String(result.riskFlag).toLowerCase() === 'true';

      setDirectors(directors.map(d => {
        if (d.id === directorId) {
          return {
            ...d,
            status: riskFlag ? 'Risk Detected' : 'Clean',
            cvUploaded: true,
            experience: result.experience || 'No experience summary available.',
            qualifications: result.qualifications || 'No qualifications listed.',
            riskFlag: riskFlag
          };
        }
        return d;
      }));
    } catch (error) {
      console.error("Failed to analyze CV", error);
      alert("Failed to analyze CV. Please try again.");
    } finally {
      setCvLoadingMap(prev => ({ ...prev, [directorId]: false }));
    }
  };

  const handleVerifyDoc = async (directorId, file, docType) => {
    const director = directors.find(d => d.id === directorId);
    if (!director) return;

    setDirectors(prev => prev.map(d =>
      d.id === directorId
        ? { ...d, verification: { ...d.verification, [docType]: { loading: true, result: null } } }
        : d
    ));

    try {
      const res = await verifyDocument(file, docType, companyId, director.fullName);
      const data = res.data;

      setDirectors(prev => prev.map(d =>
        d.id === directorId
          ? { ...d, verification: { ...d.verification, [docType]: { loading: false, result: data } } }
          : d
      ));

    } catch (err) {
      console.error(err);

      // Provide user-friendly error messages
      let errorMessage = "Server Error";

      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = "Network timeout - file may be too large. Try compressing the PDF or use a smaller file.";
      } else if (err.response) {
        errorMessage = `Server error (${err.response.status}): ${err.response.data || 'Unknown error'}`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setDirectors(prev => prev.map(d =>
        d.id === directorId
          ? { ...d, verification: { ...d.verification, [docType]: { loading: false, result: { valid: false, reason: errorMessage } } } }
          : d
      ));
    }
  };

  const handleUploadAndVerify = (directorId, file, docType) => {
    handleFileChange(directorId, docType, file);
    handleVerifyDoc(directorId, file, docType);
  };

  const verificationDocs = [
    { label: '📄 Affidavit', key: 'affidavit', description: 'Sworn statement of fitness' },
    { label: '💰 Net Worth Certificate', key: 'netWorth', description: 'Financial standing proof' },
    { label: '👮 Police Clearance', key: 'policeClearance', description: 'Criminal record check' },
    { label: '🧾 Tax Clearance', key: 'taxClearance', description: 'Tax compliance certificate' },
    { label: '🪪 Certified ID/Passport', key: 'certifiedId', description: 'Certified copy of ID or Passport' }
  ];

  const getBadgeVariant = (status) => {
    if (status.includes('Clean')) return 'success';
    if (status.includes('Risk')) return 'danger';
    return 'warning';
  };

  return (
    <Container className="mt-4">
      {/* Header with Instructions */}
      <Card className="rbz-card shadow-lg animate-fade-in mb-4">
        <Card.Header>
          <h4 className="mb-0">👥 Stage 2: Directors & Governance Vetting</h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="info" className="mb-0">
            <div className="d-flex align-items-start">
              <span className="fs-4 me-3">💡</span>
              <div>
                <strong>What you need to do:</strong>
                <ul className="mb-0 mt-2">
                  <li>Add each director's full name and ID/Passport number</li>
                  <li>Upload their CV/Resume for character assessment</li>
                  <li>Upload supporting documents (Affidavit, Net Worth, Police Clearance, Tax Clearance, <strong>Certified ID/Passport Copy</strong>)</li>
                  <li>All documents will be automatically verified by our secure verification system</li>
                  <li>You can remove any director if you made a mistake</li>
                </ul>
              </div>
            </div>
          </Alert>
        </Card.Body>
      </Card>

      {/* Add Director Form */}
      <Card className="rbz-card shadow-lg animate-fade-in mb-4">
        <Card.Header>
          <h5 className="mb-0">➕ Add New Director</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col lg={3} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  required
                />
              </Form.Group>
            </Col>
            <Col lg={4} md={6}>
              <Form.Group className="mb-3">
                <Form.Label>ID / Valid Passport <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="idPassport"
                  value={formData.idPassport}
                  onChange={handleInputChange}
                  placeholder="e.g., 63-123456A12"
                  required
                />
                <Form.Text className="text-muted">National ID or Passport Number</Form.Text>
              </Form.Group>
            </Col>
            <Col lg={3} md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Nationality</Form.Label>
                <Form.Select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                >
                  <option value="">Select nationality</option>
                  <option value="Zimbabwean">Zimbabwean</option>
                  <option value="South African">South African</option>
                  <option value="Zambian">Zambian</option>
                  <option value="Mozambican">Mozambican</option>
                  <option value="Botswanan">Botswanan</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col lg={2} md={4} className="d-flex align-items-start">
              <Button
                variant="primary"
                onClick={addDirector}
                className="mt-4 w-100"
                style={{ whiteSpace: 'nowrap' }}
              >
                ➕ Add
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Directors List */}
      {directors.length === 0 ? (
        <Card className="rbz-card text-center p-5">
          <div style={{ fontSize: '64px', opacity: 0.3 }}>👥</div>
          <h5 className="text-muted">No Directors Added Yet</h5>
          <p className="text-muted mb-0">Use the form above to add directors for vetting</p>
        </Card>
      ) : (
        directors.map((director, index) => {
          const isExpanded = expandedDirectorId === director.id;
          return (
            <Card key={director.id} className="rbz-card shadow-lg mb-4 animate-fade-in" style={{ transition: 'all 0.3s ease' }}>
              <Card.Header
                className="d-flex justify-content-between align-items-center"
                style={{ cursor: 'pointer', borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.1)' : 'none' }}
                onClick={() => toggleExpand(director.id)}
              >
                <div>
                  <h5 className="mb-1 d-flex align-items-center">
                    <span className="me-2" style={{ transition: 'transform 0.3s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)' }}>▶</span>
                    {index + 1}. {director.fullName}
                    <Badge bg={getBadgeVariant(director.status)} className="ms-3">
                      {director.status}
                    </Badge>
                  </h5>
                  <small className="text-muted ms-4">
                    ID/Passport: {director.idPassport} | Nationality: {director.nationality}
                  </small>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="me-2 border-0"
                    onClick={() => toggleExpand(director.id)}
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => showDeleteConfirm(director)}
                    title="Remove this director"
                  >
                    🗑️ Remove
                  </Button>
                </div>
              </Card.Header>

              {/* COLLAPSIBLE BODY AREA */}
              {isExpanded && (
                <Card.Body className="p-4 collapse show shadow-inner">
                  <Row className="g-4">
                    {/* CV Upload Section */}
                    <Col lg={4} className="mb-4 mb-lg-0">
                      <Card className="h-100 border-0 shadow-sm overflow-hidden" style={{ borderRadius: '12px' }}>
                        <div className="p-3" style={{ background: 'var(--rbz-gradient)', color: 'white' }}>
                          <h6 className="fw-bold d-flex align-items-center mb-0">
                            <span className="fs-5 me-2">📄</span> Character Assessment
                          </h6>
                        </div>
                        <Card.Body className="d-flex flex-column bg-light p-4">
                          <p className="small text-muted mb-4">
                            Upload the director's CV or Resume for automated system vetting and character assessment.
                          </p>

                          <div className="mb-4">
                            <label className="btn btn-outline-primary w-100 fw-bold border-2 rounded-3 py-2" style={{ borderColor: 'var(--rbz-navy)', color: 'var(--rbz-navy)' }}>
                              {director.files?.cv ? `📁 ${director.files.cv.name}` : 'Choose CV File (PDF/DOC)'}
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                hidden
                                onChange={(e) => handleFileChange(director.id, 'cv', e.target.files[0])}
                              />
                            </label>
                          </div>

                          <Button
                            className="w-100 premium-button border-0 py-2 rounded-3 shadow-sm fw-bold mb-3"
                            onClick={() => handleAnalyzeCV(director.id)}
                            disabled={!director.files?.cv || cvLoadingMap[director.id]}
                          >
                            {cvLoadingMap[director.id] ? (
                              <><Spinner size="sm" animation="border" className="me-2" /> Processing Analysis...</>
                            ) : (
                              '🔎 Run Profile Assessment'
                            )}
                          </Button>

                          {/* AI Analysis Results */}
                          {director.cvUploaded && (
                            <div className="mt-auto p-3 bg-white border rounded shadow-sm">
                              <h6 className="border-bottom pb-2 mb-3 fw-bold text-dark" style={{ fontSize: '0.85rem' }}>System Vetting Report</h6>

                              <div className="mb-3">
                                <Badge bg={director.riskFlag ? 'danger' : 'success'} className="me-2 px-2 py-1">
                                  {director.riskFlag ? '⚠️ RISK DETECTED' : '✅ CLEAN PROFILE'}
                                </Badge>
                              </div>

                              <div className="mb-2">
                                <small className="text-muted d-block fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Experience Summary:</small>
                                <div className="p-2 bg-light border rounded" style={{ fontSize: '0.8rem', maxHeight: '100px', overflowY: 'auto', lineHeight: '1.4' }}>
                                  {director.experience}
                                </div>
                              </div>

                              <div>
                                <small className="text-muted d-block fw-bold mb-1" style={{ fontSize: '0.75rem' }}>Qualifications:</small>
                                <div className="p-2 bg-light border rounded" style={{ fontSize: '0.8rem', maxHeight: '80px', overflowY: 'auto', lineHeight: '1.4' }}>
                                  {director.qualifications}
                                </div>
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>

                    {/* Supporting Documents */}
                    <Col lg={8}>
                      <div className="ps-lg-3 h-100 d-flex flex-column">
                        <h5 className="fw-bold mb-3 d-flex align-items-center pb-2 border-bottom" style={{ color: 'var(--rbz-navy)' }}>
                          <span className="me-2">📋</span> Supporting Verification Documents
                        </h5>
                        <Row className="g-3 flex-grow-1">
                          {verificationDocs.map((doc) => {
                            const vState = director.verification[doc.key];
                            const isVerified = vState.result && vState.result.valid;

                            return (
                              <Col md={6} xl={4} key={doc.key}>
                                <Card className="h-100 border-0 shadow-sm transition hover-shadow" style={{
                                  backgroundColor: isVerified ? '#f0fdf4' : '#fff',
                                  border: isVerified ? '1px solid #198754 !important' : '1px solid #e0e4e8 !important'
                                }}>
                                  <Card.Body className="d-flex flex-column p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="fw-bold mb-0" style={{ color: 'var(--rbz-navy)', fontSize: '0.85rem' }}>{doc.label}</h6>
                                      {isVerified && <Badge bg="success" rounded="circle">✓</Badge>}
                                    </div>
                                    <p className="text-muted small mb-3" style={{ fontSize: '0.75rem', minHeight: '35px', lineHeight: '1.3' }}>
                                      {doc.description}
                                    </p>

                                    <div className="mt-auto">
                                      {!isVerified && !vState.loading && (
                                        <Form.Group className="mb-0">
                                          <label className="btn btn-sm btn-light w-100 border text-dark fw-bold" style={{ fontSize: '0.75rem' }}>
                                            Upload File
                                            <input
                                              type="file"
                                              hidden
                                              accept=".pdf,.jpg,.png"
                                              onChange={(e) => handleUploadAndVerify(director.id, e.target.files[0], doc.key)}
                                            />
                                          </label>
                                        </Form.Group>
                                      )}

                                      {/* Verification Status */}
                                      {vState.loading && (
                                        <div className="text-center py-2 bg-light rounded border">
                                          <Spinner animation="border" size="sm" variant="primary" />
                                          <small className="d-block text-muted mt-1 fw-bold" style={{ fontSize: '0.7rem' }}>Verifying...</small>
                                        </div>
                                      )}

                                      {vState.result && !vState.loading && (
                                        <Alert
                                          variant={vState.result.valid ? 'success' : 'danger'}
                                          className="p-2 mb-0 mt-2 text-center"
                                          style={{ fontSize: '0.75rem' }}
                                        >
                                          <div className="fw-bold mb-1">
                                            {vState.result.valid ? '✅ Verified' : '❌ Rejected'}
                                          </div>
                                          {!vState.result.valid && (
                                            <div style={{ lineHeight: '1.2', fontSize: '0.7rem' }}>
                                              {vState.result.reason}
                                            </div>
                                          )}
                                        </Alert>
                                      )}
                                    </div>
                                  </Card.Body>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              )}
            </Card>
          )
        })
      )}

      {/* Workflow Rule Engine Integration */}
      <div className="mt-4 mb-4">
        <WorkflowStatusPanel
          companyId={companyId}
          currentStep={3}
          onStageComplete={() => onComplete && onComplete()}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        show={deleteModal.show}
        onHide={cancelDelete}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ background: 'var(--rbz-gradient-purple)', borderBottom: '3px solid var(--rbz-gold)' }}>
          <Modal.Title>
            <span style={{ fontSize: '24px', marginRight: '10px' }}>⚠️</span>
            Confirm Removal
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {deleteModal.director && (
            <div>
              <Alert variant="warning" className="mb-3">
                <div className="d-flex align-items-start">
                  <span className="fs-4 me-3">🚨</span>
                  <div>
                    <strong>Warning:</strong> This action cannot be undone. All uploaded documents and verification results for this director will be permanently removed.
                  </div>
                </div>
              </Alert>

              <Card className="bg-light border">
                <Card.Body>
                  <h6 className="text-rbz-navy mb-3">Director Information:</h6>

                  <Row className="mb-2">
                    <Col xs={4}><strong>Full Name:</strong></Col>
                    <Col xs={8}>{deleteModal.director.fullName}</Col>
                  </Row>

                  <Row className="mb-2">
                    <Col xs={4}><strong>ID/Passport:</strong></Col>
                    <Col xs={8}>{deleteModal.director.idPassport}</Col>
                  </Row>

                  <Row className="mb-2">
                    <Col xs={4}><strong>Nationality:</strong></Col>
                    <Col xs={8}>{deleteModal.director.nationality}</Col>
                  </Row>

                  <Row>
                    <Col xs={4}><strong>Status:</strong></Col>
                    <Col xs={8}>
                      <Badge bg={getBadgeVariant(deleteModal.director.status)}>
                        {deleteModal.director.status}
                      </Badge>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <div className="mt-3 text-center text-muted">
                <small>Are you sure you want to remove <strong>{deleteModal.director.fullName}</strong>?</small>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDelete} size="lg">
            ← Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            size="lg"
            style={{ minWidth: '150px' }}
          >
            🗑️ Yes, Remove
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DirectorVetting;