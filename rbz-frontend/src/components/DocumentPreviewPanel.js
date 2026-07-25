import React, { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { API_URL, getFileDownloadUrl, reviewDocument, friendlyError } from '../services/api';

/** Infer a content type from the file name when the record does not carry one
 *  (path-based files from the ownership/director stages). */
const inferContentType = (fileName) => {
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    return '';
};

/**
 * DocumentPreviewPanel — examiner-side inline preview + verdict surface.
 * PDFs and images render inline via authenticated blob URLs; Office formats
 * fall back to a download link.
 *
 * Props:
 *  - document:  a CompanyDocument record (has `id` → full verdict surface), or a
 *               path-based file `{ filePath, fileName }` from the ownership/director
 *               stages (preview-only), or null for the empty state
 *  - onUpdated: callback invoked with the updated CompanyDocument after save
 */
const DocumentPreviewPanel = ({ document, onUpdated }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [comment, setComment] = useState(document?.examinerComment || '');
    const [saving, setSaving] = useState(null); // 'verify' | 'reject' | 'reset' | null
    const [saveError, setSaveError] = useState(null);

    const reviewable = !!document?.id;
    const fileKey = document?.id || document?.filePath || null;
    const contentType = document?.contentType || inferContentType(document?.fileName || document?.filePath);
    const isPdf = contentType.includes('pdf');
    const isImage = contentType.startsWith('image/');
    const previewable = isPdf || isImage;

    /** Fetch the file as a blob (so the JWT header is honoured) and build an
     *  object-URL the iframe / img can render. Cleanup the URL on unmount. */
    useEffect(() => {
        setPreviewUrl(null);
        setPreviewError(null);
        if (!fileKey || !previewable) return;

        let cancelled = false;
        let createdUrl = null;
        const token = localStorage.getItem('jwtToken');
        setLoadingPreview(true);

        const url = document?.id
            ? `${API_URL}/documents/download/${document.id}`
            : getFileDownloadUrl(document.filePath, document.fileName);

        fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(text || `Preview failed (${res.status})`);
                }
                return res.blob();
            })
            .then((blob) => {
                if (cancelled) return;
                createdUrl = URL.createObjectURL(blob);
                setPreviewUrl(createdUrl);
            })
            .catch((err) => {
                if (!cancelled) setPreviewError(friendlyError(err, 'The preview could not be loaded.'));
            })
            .finally(() => {
                if (!cancelled) setLoadingPreview(false);
            });

        return () => {
            cancelled = true;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileKey, previewable]);

    // Reset comment when a new document is selected
    useEffect(() => {
        setComment(document?.examinerComment || '');
        setSaveError(null);
    }, [fileKey, document?.examinerComment]);

    const statusBadge = useMemo(() => {
        const status = document?.verificationStatus;
        const map = {
            VERIFIED: { bg: 'success', label: 'Verified' },
            EXAMINER_VERIFIED: { bg: 'success', label: 'Examiner cleared' },
            MANUAL_REVIEW: { bg: 'warning', label: 'Manual review' },
            PENDING: { bg: 'info', label: 'Processing' },
            FAILED: { bg: 'danger', label: 'Verification failed' },
            REJECTED: { bg: 'danger', label: 'Rejected — re-upload required' },
            UNVERIFIED: { bg: 'secondary', label: 'Unverified (legacy)' },
        };
        const cfg = map[status] || { bg: 'secondary', label: status || 'Unknown' };
        return <Badge bg={cfg.bg}>{cfg.label}</Badge>;
    }, [document?.verificationStatus]);

    if (!document) {
        return (
            <div className="text-center text-muted p-4 border rounded bg-white">
                <div style={{ fontSize: '1.6rem', opacity: 0.4 }}>📑</div>
                <p className="mb-0 small mt-2">Select a document on the left to preview and review it here.</p>
            </div>
        );
    }

    const handleSave = async (status) => {
        setSaving(status === 'EXAMINER_VERIFIED' ? 'verify' : status === 'REJECTED' ? 'reject' : 'reset');
        setSaveError(null);
        try {
            const res = await reviewDocument(document.id, status, comment);
            if (onUpdated && res.data) onUpdated(res.data);
        } catch (err) {
            setSaveError(friendlyError(err, 'Could not save the review. Please try again.'));
        } finally {
            setSaving(null);
        }
    };

    return (
        <div className="border rounded bg-white" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom" style={{ background: '#f4f7f6' }}>
                <div style={{ minWidth: 0 }}>
                    <div className="fw-bold text-truncate" title={document.fileName} style={{ color: '#003366' }}>
                        {document.fileName}
                    </div>
                    <div className="small text-muted">
                        {document.documentType}
                        {document.version > 1 && <> · v{document.version}</>}
                        {document.sha256 && <> · sha {document.sha256.slice(0, 8)}…</>}
                    </div>
                </div>
                <div>{reviewable ? statusBadge : <Badge bg="secondary">File preview</Badge>}</div>
            </div>

            {/* Preview area */}
            <div style={{ minHeight: '380px', maxHeight: '60vh', overflow: 'auto', background: '#fafbfc' }}>
                {loadingPreview && (
                    <div className="d-flex flex-column align-items-center justify-content-center text-muted p-4" style={{ height: '380px' }}>
                        <Spinner animation="border" size="sm" /> <span className="mt-2 small">Loading preview…</span>
                    </div>
                )}
                {previewError && !loadingPreview && (
                    <Alert variant="warning" className="m-3 small mb-0">
                        Preview unavailable: {previewError}
                    </Alert>
                )}
                {!loadingPreview && !previewError && previewUrl && isPdf && (
                    <iframe
                        title={`Preview of ${document.fileName}`}
                        src={previewUrl}
                        style={{ width: '100%', height: '60vh', border: 'none', display: 'block' }}
                    />
                )}
                {!loadingPreview && !previewError && previewUrl && isImage && (
                    <div className="p-3 text-center">
                        <img
                            src={previewUrl}
                            alt={document.fileName}
                            style={{ maxWidth: '100%', maxHeight: '55vh' }}
                        />
                    </div>
                )}
                {!loadingPreview && !previewable && (
                    <div className="p-4 text-center text-muted">
                        <div style={{ fontSize: '1.4rem', opacity: 0.5 }}>📎</div>
                        <p className="small mt-2 mb-2">
                            Inline preview is only available for PDF and image files. Download to open this document.
                        </p>
                    </div>
                )}
            </div>

            {/* Path-based files (ownership/director uploads) are preview-only */}
            {!reviewable && (
                <div className="p-2 border-top small text-muted text-center">
                    Preview only — use the stage decision panel to flag issues with this file.
                </div>
            )}

            {/* AI / examiner trail */}
            {reviewable && (
            <div className="p-3 border-top">
                {document.aiReason && (
                    <div className="mb-2">
                        <div className="small text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Review note</div>
                        <div className="small" style={{ color: '#333' }}>{document.aiReason}</div>
                    </div>
                )}
                {document.verifiedBy && (
                    <div className="small text-muted mb-2">
                        Last verified by <strong>{document.verifiedBy}</strong>
                        {document.verifiedAt && <> on {new Date(document.verifiedAt).toLocaleString()}</>}
                    </div>
                )}

                <Form.Group>
                    <Form.Label className="small text-muted text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>
                        Examiner comment (visible to applicant)
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Optional note explaining your decision…"
                        maxLength={2000}
                    />
                </Form.Group>

                {saveError && (
                    <Alert variant="danger" className="small mt-2 mb-0 py-2">
                        {typeof saveError === 'string' ? saveError : 'Save failed'}
                    </Alert>
                )}

                <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
                    <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => handleSave('MANUAL_REVIEW')}
                        disabled={!!saving}
                    >
                        {saving === 'reset' ? 'Saving…' : 'Send back to manual review'}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleSave('REJECTED')}
                        disabled={!!saving}
                    >
                        {saving === 'reject' ? 'Saving…' : 'Reject — request re-upload'}
                    </Button>
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleSave('EXAMINER_VERIFIED')}
                        disabled={!!saving}
                    >
                        {saving === 'verify' ? 'Saving…' : 'Verify document'}
                    </Button>
                </div>
            </div>
            )}
        </div>
    );
};

export default DocumentPreviewPanel;
