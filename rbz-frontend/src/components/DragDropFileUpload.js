import React, { useRef, useState, useCallback } from 'react';
import './DragDropFileUpload.css';

/**
 * DragDropFileUpload — A reusable, beautiful file upload component.
 *
 * Props:
 *  - file:         The currently selected File object (or null)
 *  - onFileSelect: (file) => void  — called when a new file is selected
 *  - onRemove:     () => void      — called when user clicks "remove"
 *  - status:       'pending' | 'processing' | 'uploaded' | 'failed' | null
 *  - accept:       string          — e.g. ".pdf,.docx,.xlsx"
 *  - maxSizeMB:    number          — max size in MB (default 10)
 *  - label:        string          — primary label inside drop zone
 *  - hint:         string          — secondary hint (accepted formats etc.)
 *  - disabled:     bool
 *  - compact:      bool            — smaller drop zone variant
 *  - id:           string          — unique id for the input (for a11y)
 */
const DragDropFileUpload = ({
    file,
    onFileSelect,
    onRemove,
    status = null,
    accept = '.pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png',
    maxSizeMB = 10,
    label = 'Drag & drop a file here, or click to browse',
    hint,
    disabled = false,
    compact = false,
    id,
}) => {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [sizeError, setSizeError] = useState(null);

    /* ---- Status helpers (declared early so everything can use them) ---- */
    const isUploaded = status === 'uploaded';
    const isProcessing = status === 'processing';

    const processFile = useCallback((f) => {
        if (!f) return;
        if (f.size > maxSizeMB * 1024 * 1024) {
            setSizeError(`File exceeds ${maxSizeMB}MB limit.`);
            return;
        }
        setSizeError(null);
        onFileSelect(f);
    }, [maxSizeMB, onFileSelect]);

    /* ---- Drag handlers ---- */
    const onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && !isUploaded) setDragging(true);
    };
    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    };
    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        if (disabled || isUploaded) return;
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) processFile(dropped);
    };

    /* ---- Click-to-browse: open the hidden input ---- */
    const handleZoneClick = (e) => {
        e.stopPropagation();
        if (!disabled && !isUploaded) {
            inputRef.current?.click();
        }
    };

    const handleInputChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) processFile(selectedFile);
        // Reset so same file can be re-selected after remove
        e.target.value = '';
    };

    const statusConfig = {
        uploaded:   { label: 'Uploaded & Verified', icon: '✅', cls: 'status-uploaded' },
        processing: { label: 'Processing…',          icon: '⏳', cls: 'status-processing' },
        failed:     { label: 'Upload Failed',        icon: '❌', cls: 'status-failed' },
        pending:    { label: 'Awaiting Upload',      icon: '⏸',  cls: 'status-pending' },
    };
    const statusInfo = status ? statusConfig[status] : null;

    /* ---- File type icon ---- */
    const getFileIcon = (f) => {
        if (!f) return '📄';
        const ext = f.name.split('.').pop().toLowerCase();
        const map = { pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', jpg: '🖼', jpeg: '🖼', png: '🖼' };
        return map[ext] || '📄';
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const zoneClasses = [
        'ddfu-zone',
        dragging ? 'ddfu-dragging' : '',
        isUploaded ? 'ddfu-uploaded' : '',
        sizeError ? 'ddfu-error' : '',
    ].filter(Boolean).join(' ');

    return (
        <div className={compact ? 'ddfu-compact' : ''}>
            {/*
              Hidden native input — rendered OUTSIDE the drop zone so it
              doesn't intercept pointer/drag events on the zone.
            */}
            <input
                ref={inputRef}
                id={id}
                type="file"
                className="ddfu-input"
                accept={accept}
                onChange={handleInputChange}
                disabled={disabled || isUploaded}
                tabIndex={-1}
                aria-hidden="true"
            />

            {/* ---- Drop Zone ---- */}
            <div
                className={zoneClasses}
                onClick={handleZoneClick}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
                role="button"
                tabIndex={disabled || isUploaded ? -1 : 0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleZoneClick(e); }}
                aria-label={label}
                style={{ cursor: disabled || isUploaded ? 'default' : 'pointer' }}
            >
                {isUploaded && !isProcessing && (
                    <button
                        type="button"
                        className="ddfu-corner-remove-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        title="Remove uploaded document"
                        aria-label="Remove uploaded document"
                    >
                        x
                    </button>
                )}

                {isUploaded ? (
                    <>
                        <div className="ddfu-icon">✅</div>
                        <div className="ddfu-label"><strong>Document Uploaded</strong></div>
                        <div className="ddfu-hint">Remove below to replace with a new file</div>
                    </>
                ) : (
                    <>
                        <div className="ddfu-icon">{dragging ? '📂' : '☁️'}</div>
                        <div className="ddfu-label">
                            {dragging
                                ? <strong>Release to upload</strong>
                                : <><strong>Drag & drop</strong> your file here<br />or <strong>click to browse</strong></>
                            }
                        </div>
                        {hint && <div className="ddfu-hint">{hint}</div>}
                    </>
                )}
            </div>

            {/* ---- Size error ---- */}
            {sizeError && (
                <div style={{ fontSize: '0.72rem', color: '#c62828', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ⚠️ {sizeError}
                </div>
            )}

            {/* ---- File Preview ---- */}
            {file && (
                <div className="ddfu-preview">
                    <div className="ddfu-file-icon">{getFileIcon(file)}</div>
                    <div className="ddfu-file-info">
                        <span className="ddfu-file-name" title={file.name}>{file.name}</span>
                        <span className="ddfu-file-size">{formatSize(file.size)}</span>
                    </div>
                    {!isProcessing && !isUploaded && (
                        <button
                            className="ddfu-remove-btn"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            title="Remove file"
                            type="button"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {/* ---- Status Bar ---- */}
            {statusInfo && (
                <div className={`ddfu-status-bar ${statusInfo.cls}`}>
                    <div className="ddfu-dot" />
                    <span>{statusInfo.icon} {statusInfo.label}</span>
                    {isProcessing && (
                        <span style={{ marginLeft: 4, fontSize: '0.68rem', opacity: 0.7 }}>
                            This may take a moment…
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default DragDropFileUpload;
