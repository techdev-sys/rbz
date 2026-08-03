import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Container, Row, Col, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import DragDropFileUpload from './DragDropFileUpload';
import {
    API_URL,
    MAX_UPLOAD_BYTES,
    uploadCompanyDocument,
    getCompanyDocuments,
} from '../services/api';
import '../Premium.css';

const getDocumentTypes = (institutionType) => {
    const base = [
        { key: 'financialStatements', name: 'Audited Financial Statements (Last 3 Years)', description: 'Required for thorough financial health assessment.', required: true },
        { key: 'businessPlan', name: 'Strategic Business Plan', description: 'Required for growth and feasibility assessment.', required: true },
        { key: 'portfolioReport', name: 'Loan Portfolio Report', description: 'Required for asset quality verification.', required: true },
        { key: 'creditPolicy', name: 'Credit & Risk Policy Manual', description: 'Required for risk management compliance.', required: true },
        { key: 'operationalManual', name: 'Operational Policy Manual', description: 'Standard operating procedures for the institution.', required: false },
        { key: 'taxClearance', name: 'ZIMRA Tax Clearance Certificate', description: 'Proof of regulatory tax compliance.', required: true },
        { key: 'insurancePolicy', name: 'Credit Insurance Policy', description: 'Valid insurance for credit portfolio (if applicable).', required: false },
    ];
    if (institutionType === 'DTMFI' || institutionType === 'COMMERCIAL_BANK') {
        base.push({ key: 'amlCftPolicy', name: 'AML/CFT Compliance Programme', description: 'Anti-Money Laundering / Combating Financing of Terrorism policy (mandatory for deposit-taking institutions).', required: true });
    }
    if (institutionType === 'COMMERCIAL_BANK') {
        base.push({ key: 'riskFramework', name: 'Enterprise Risk Management Framework', description: 'Board-approved ERM covering credit, market, liquidity and operational risk (mandatory for banks).', required: true });
        base.push({ key: 'technologyPolicy', name: 'IT & Technology Risk Policy', description: 'Information technology and cybersecurity risk policy (recommended for commercial banks).', required: false });
    }
    return base;
};

const blankSlot = () => ({
    file: null,
    progress: 0,
    uploading: false,
    server: null, // { documentId, verificationStatus, aiReason, sha256, version, fileName }
    error: null,
});

const Stage9DocumentsUpload = ({ onComplete, readOnly = false }) => {
    const companyId = localStorage.getItem('currentCompanyId');
    const institutionType = localStorage.getItem('institutionType') || 'MFI';
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const DOCUMENT_TYPES = useMemo(() => getDocumentTypes(institutionType), [institutionType]);

    const [slots, setSlots] = useState(
        () => Object.fromEntries(DOCUMENT_TYPES.map((d) => [d.key, blankSlot()]))
    );
    const [bulkRunning, setBulkRunning] = useState(false);
    const [topError, setTopError] = useState(null);

    /** On mount, hydrate slot state from any documents already on file. */
    useEffect(() => {
        if (!companyId) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getCompanyDocuments(companyId);
                if (cancelled) return;
                const latestByType = new Map();
                for (const doc of res.data || []) {
                    const existing = latestByType.get(doc.documentType);
                    const docVer = doc.version ?? 1;
                    const existingVer = existing?.version ?? 0;
                    if (!existing || docVer > existingVer) {
                        latestByType.set(doc.documentType, doc);
                    }
                }
                setSlots((prev) => {
                    const next = { ...prev };
                    for (const def of DOCUMENT_TYPES) {
                        const doc = latestByType.get(def.key);
                        if (doc) {
                            next[def.key] = {
                                ...blankSlot(),
                                server: {
                                    documentId: doc.id,
                                    // Pre-Phase-1 rows have no verificationStatus on file.
                                    // Surface them as UNVERIFIED rather than coercing to PENDING,
                                    // so legacy uploads are visually distinct from active scans.
                                    verificationStatus: doc.verificationStatus || 'UNVERIFIED',
                                    aiReason: doc.aiReason,
                                    examinerComment: doc.examinerComment,
                                    sha256: doc.sha256,
                                    version: doc.version,
                                    fileName: doc.fileName,
                                },
                            };
                        }
                    }
                    return next;
                });
            } catch (err) {
            }
        })();
        return () => { cancelled = true; };
    }, [companyId, DOCUMENT_TYPES]);

    const setSlot = (key, updater) => {
        setSlots((prev) => ({
            ...prev,
            [key]: typeof updater === 'function' ? updater(prev[key]) : { ...prev[key], ...updater },
        }));
    };

    const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xlsx', 'xls', 'png', 'jpg', 'jpeg'];

    const onFileSelect = (key, file) => {
        if (readOnly) return;
        if (file) {
            const ext = (file.name.split('.').pop() || '').toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                setSlot(key, { error: `".${ext}" files are not accepted. Please upload PDF, DOCX, XLSX, PNG or JPG.` });
                return;
            }
            if (file.size > MAX_UPLOAD_BYTES) {
                setSlot(key, { error: `File exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit.` });
                return;
            }
        }
        setSlot(key, { file, error: null });
    };

    const onRemove = (key) => setSlot(key, blankSlot());

    const uploadOne = async (key) => {
        const slot = slots[key];
        if (!slot.file || !companyId) return;
        setSlot(key, { uploading: true, progress: 0, error: null });
        try {
            const data = await uploadCompanyDocument(
                slot.file,
                companyId,
                key,
                (pct) => setSlot(key, (s) => ({ ...s, progress: pct }))
            );
            setSlot(key, {
                file: null,
                uploading: false,
                progress: 100,
                error: null,
                server: {
                    documentId: data.documentId,
                    verificationStatus: data.verificationStatus,
                    aiReason: data.aiReason,
                    sha256: data.sha256,
                    version: data.version,
                    fileName: slot.file.name,
                },
            });
        } catch (err) {
            const msg = err?.response?.data?.error
                || err?.response?.data
                || err?.message
                || 'Upload failed';
            setSlot(key, { uploading: false, progress: 0, error: typeof msg === 'string' ? msg : 'Upload failed' });
        }
    };

    const uploadAllSelected = async () => {
        setBulkRunning(true);
        setTopError(null);
        for (const def of DOCUMENT_TYPES) {
            const s = slots[def.key];
            if (s.file && !s.uploading) {
                // sequential upload to avoid swamping the AI service
                await uploadOne(def.key);
            }
        }
        setBulkRunning(false);
    };

    const isAcceptedStatus = (status) =>
        // A required doc is accepted if it is on file in any non-FAILED, non-REJECTED state.
        // EXAMINER_VERIFIED counts — the examiner cleared it by hand.
        // Legacy rows (UNVERIFIED) count too — the examiner will verify them by hand.
        status === 'VERIFIED'
        || status === 'EXAMINER_VERIFIED'
        || status === 'MANUAL_REVIEW'
        || status === 'PENDING'
        || status === 'UNVERIFIED';

    const requiredDefs = useMemo(() => DOCUMENT_TYPES.filter((d) => d.required), [DOCUMENT_TYPES]);
    const acceptedRequiredCount = useMemo(
        () => requiredDefs.filter((d) => isAcceptedStatus(slots[d.key]?.server?.verificationStatus)).length,
        [slots, requiredDefs]
    );
    const allRequiredAccepted = acceptedRequiredCount === requiredDefs.length;

    const handleProceed = () => onComplete && onComplete();

    return (
        <Container fluid className="px-4 pt-4 pb-4 animate-fade-in">
            {!companyId && (
                <Alert variant="warning" className="border-0 shadow-sm mb-4">
                    No application context found. Please return to the dashboard and resume your application.
                </Alert>
            )}
            {topError && (
                <Alert variant="danger" className="border-0 shadow-sm mb-4" dismissible onClose={() => setTopError(null)}>
                    {topError}
                </Alert>
            )}

            <Card className="premium-card border-0 mb-4 overflow-hidden">
                <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">Stage 10: Supporting Documents</h5>
                    <small style={{ opacity: 0.85 }}>
                        Upload the required documents below. Each file is encrypted in transit, hashed for tamper-detection,
                        and verified before reaching an examiner.
                    </small>
                </Card.Header>
                <div className="p-3" style={{ background: '#f8f9fa', borderBottom: '1px solid #e8ecf0' }}>
                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Badge bg="dark" pill style={{ fontSize: '0.70rem' }}>PDF · DOCX · XLSX · PNG · JPG</Badge>
                            <Badge bg="secondary" pill style={{ fontSize: '0.70rem' }}>Max 25 MB per file</Badge>
                            <Badge bg="success" pill style={{ fontSize: '0.70rem' }}>Encrypted upload · SHA-256 verified</Badge>
                            <Badge bg="info" pill style={{ fontSize: '0.70rem' }}>Systematic checks before examiner review</Badge>
                        </div>
                        <div style={{ minWidth: 220 }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="small fw-bold" style={{ color: 'var(--rbz-navy, #003366)' }}>
                                    Required documents
                                </span>
                                <span className="small text-muted">
                                    {acceptedRequiredCount} of {requiredDefs.length} accepted
                                </span>
                            </div>
                            <ProgressBar
                                now={requiredDefs.length ? (acceptedRequiredCount / requiredDefs.length) * 100 : 0}
                                variant={allRequiredAccepted ? 'success' : 'warning'}
                                style={{ height: 8, borderRadius: 4 }}
                            />
                        </div>
                    </div>
                </div>
                <Card.Body className="p-4">
                    <Row className="g-3">
                        {DOCUMENT_TYPES.map((doc) => (
                            <Col md={12} key={doc.key}>
                                <DocumentSlotCard
                                    def={doc}
                                    slot={slots[doc.key]}
                                    readOnly={readOnly}
                                    onFileSelect={(f) => onFileSelect(doc.key, f)}
                                    onRemove={() => onRemove(doc.key)}
                                    onUpload={() => uploadOne(doc.key)}
                                    onReplace={() => onRemove(doc.key)}
                                />
                            </Col>
                        ))}
                    </Row>
                </Card.Body>
            </Card>

            <div className="d-flex justify-content-between align-items-center bg-white p-4 rounded shadow-sm border-top border-4 border-warning">
                <Button variant="outline-dark" className="rounded-pill px-4" onClick={() => window.history.back()}>
                    ← Previous Stages
                </Button>

                <div className="d-flex gap-3 align-items-center">
                    <Button
                        variant="outline-primary"
                        className="rounded-pill px-4"
                        onClick={uploadAllSelected}
                        disabled={bulkRunning || readOnly || !Object.values(slots).some((s) => s.file)}
                    >
                        {bulkRunning ? <><Spinner animation="border" size="sm" /> Uploading…</> : 'Upload All Selected'}
                    </Button>

                    <Button
                        className="premium-button px-5 py-2 shadow"
                        onClick={handleProceed}
                        disabled={!allRequiredAccepted || bulkRunning}
                        variant="primary"
                    >
                        Proceed to Review →
                    </Button>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p className="small text-muted mb-0">
                    Documents are transmitted over TLS, hashed (SHA-256), and validated against magic-byte signatures.
                    <br />
                    Processing follows the Data Protection Act [Chapter 11:12] and RBZ Bank Supervision standards.
                </p>
            </div>
        </Container>
    );
};

/** Fetch-based download so the JWT header is honoured (a plain anchor gets a 401). */
const downloadWithAuth = async (documentId, fileName, onError) => {
    const token = localStorage.getItem('jwtToken');
    try {
        const res = await fetch(`${API_URL}/documents/download/${documentId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
            onError(`Could not open the document (${res.status}). Please try again.`);
            return;
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = fileName || 'document';
        window.document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch {
        onError('Could not open the document. Please check your connection and try again.');
    }
};

/** Single document upload card with status banner. */
const DocumentSlotCard = ({ def, slot, readOnly, onFileSelect, onRemove, onUpload, onReplace }) => {
    const server = slot.server;
    const isUploaded = !!server;
    const status = server?.verificationStatus;
    const isRejected = status === 'REJECTED';
    const [downloadError, setDownloadError] = React.useState(null);

    const ddfuStatus = slot.uploading
        ? 'processing'
        : isUploaded
            ? 'uploaded'
            : slot.error
                ? 'failed'
                : null;

    return (
        <div
            className="p-3 rounded border bg-white"
            style={isRejected ? { borderColor: '#dc3545', borderWidth: 2, background: '#fffafa' } : undefined}
        >
            <Row className="align-items-start g-3">
                <Col md={4}>
                    <div>
                        <div className="fw-bold" style={{ color: 'var(--rbz-navy, #003366)' }}>
                            {def.name}
                            {def.required && (
                                <Badge bg="danger" className="ms-2 small" style={{ fontSize: '0.6rem' }}>
                                    REQUIRED
                                </Badge>
                            )}
                            {!def.required && (
                                <Badge bg="secondary" className="ms-2 small" style={{ fontSize: '0.6rem' }}>
                                    OPTIONAL
                                </Badge>
                            )}
                        </div>
                        <div className="small text-muted">{def.description}</div>
                        {server?.version > 1 && (
                            <div className="small text-muted mt-1">Version {server.version} on file</div>
                        )}
                    </div>
                </Col>

                <Col md={5}>
                    {!isUploaded && (
                        <DragDropFileUpload
                            id={`upload-${def.key}`}
                            file={slot.file}
                            onFileSelect={onFileSelect}
                            onRemove={onRemove}
                            status={ddfuStatus}
                            accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
                            maxSizeMB={25}
                            disabled={readOnly || slot.uploading}
                            compact
                            label={`Upload ${def.name}`}
                            hint="PDF, DOCX, XLSX, PNG, or JPG · up to 25 MB"
                        />
                    )}

                    {isUploaded && (
                        <div className="d-flex flex-column gap-1">
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-bold" style={{ color: 'var(--rbz-navy, #003366)' }}>
                                    {server.fileName || 'Document on file'}
                                </span>
                            </div>
                            <div className="small text-muted text-truncate" title={server.sha256}>
                                SHA-256: {server.sha256?.slice(0, 16)}…
                            </div>
                            {isRejected && (
                                <Alert variant="danger" className="mt-2 mb-0 py-2 small">
                                    <strong>This document was rejected by the examiner — please upload a replacement.</strong>
                                    {server.examinerComment && (
                                        <div className="mt-1">Examiner note: {server.examinerComment}</div>
                                    )}
                                </Alert>
                            )}
                            {downloadError && (
                                <Alert variant="warning" className="mt-2 mb-0 py-1 small" dismissible onClose={() => setDownloadError(null)}>
                                    {downloadError}
                                </Alert>
                            )}
                        </div>
                    )}

                    {slot.uploading && (
                        <div className="mt-2">
                            <ProgressBar
                                now={slot.progress}
                                label={`${slot.progress}%`}
                                animated
                                striped
                                variant={slot.progress >= 100 ? 'info' : 'primary'}
                            />
                            <div className="small text-muted mt-1">
                                {slot.progress < 100
                                    ? 'Uploading…'
                                    : 'Upload complete ✓ — verifying document contents. This can take a moment…'}
                            </div>
                        </div>
                    )}

                    {slot.error && !slot.uploading && (
                        <Alert variant="danger" className="mt-2 mb-0 py-2 small">
                            {slot.error}
                        </Alert>
                    )}
                </Col>

                <Col md={3} className="text-end">
                    <StatusBanner status={status} reason={server?.aiReason} />

                    <div className="d-flex flex-column gap-2 mt-2 align-items-end">
                        {!isUploaded && (
                            <Button
                                size="sm"
                                variant="primary"
                                onClick={onUpload}
                                disabled={!slot.file || slot.uploading || readOnly}
                            >
                                {slot.uploading ? 'Uploading…' : 'Upload & Verify'}
                            </Button>
                        )}
                        {isUploaded && server.documentId && (
                            <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => downloadWithAuth(server.documentId, server.fileName, setDownloadError)}
                            >
                                View
                            </Button>
                        )}
                        {isUploaded && !readOnly && (
                            <Button size="sm" variant={isRejected ? 'danger' : 'outline-warning'} onClick={onReplace}>
                                {isRejected ? 'Upload replacement' : 'Replace'}
                            </Button>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
};

const StatusBanner = ({ status, reason }) => {
    if (!status) {
        return (
            <Badge bg="light" text="dark" className="border" style={{ fontSize: '0.70rem' }}>
                Awaiting upload
            </Badge>
        );
    }
    const config = {
        VERIFIED: { bg: 'success', label: 'Verified', icon: '✓' },
        EXAMINER_VERIFIED: { bg: 'success', label: 'Cleared by examiner', icon: '✓' },
        MANUAL_REVIEW: { bg: 'warning', label: 'Manual review', icon: 'ⓘ' },
        PENDING: { bg: 'info', label: 'Processing', icon: '…' },
        FAILED: { bg: 'danger', label: 'Verification failed', icon: '✗' },
        REJECTED: { bg: 'danger', label: 'Rejected — re-upload required', icon: '✗' },
        UNVERIFIED: { bg: 'secondary', label: 'Unverified (legacy)', icon: '·' },
    }[status] || { bg: 'secondary', label: status, icon: '·' };

    return (
        <div>
            <Badge bg={config.bg} style={{ fontSize: '0.72rem' }}>
                {config.icon} {config.label}
            </Badge>
            {reason && (
                <div className="small text-muted mt-1" style={{ maxWidth: 240, marginLeft: 'auto', textAlign: 'right' }}>
                    {reason}
                </div>
            )}
        </div>
    );
};

export default Stage9DocumentsUpload;
