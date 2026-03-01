import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Badge, Alert } from 'react-bootstrap';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/review';

const ReviewControlPanel = ({ companyId, stageId, stageName, examinerName }) => {
    const [status, setStatus] = useState('PENDING'); // PENDING, APPROVED, FLAGGED
    const [comment, setComment] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);

    useEffect(() => {
        loadReview();
    }, [companyId, stageId]);

    const loadReview = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/${companyId}`);
            // Filter client-side for simplicity or use specific endpoint
            if (response.data) {
                const stageReview = response.data.find(r => r.stageId === stageId);
                if (stageReview) {
                    setStatus(stageReview.status);
                    setComment(stageReview.examinerComment || '');
                    setLastSaved(stageReview.lastUpdated);
                } else {
                    setStatus('PENDING');
                    setComment('');
                    setLastSaved(null);
                }
            }
        } catch (error) {
            console.error("Error loading review", error);
        }
    };

    const handleSave = async (newStatus) => {
        setSaving(true);
        setStatus(newStatus);

        const payload = {
            companyId: parseInt(companyId),
            stageId,
            stageName,
            status: newStatus,
            examinerComment: comment,
            examinerName
        };

        try {
            await axios.post(`${API_BASE_URL}/save`, payload);
            setLastSaved(new Date().toISOString());
        } catch (error) {
            alert('Failed to save review decision');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="shadow mt-4 mb-5 border-warning" style={{ backgroundColor: '#fffdf5' }}>
            <Card.Header className="bg-warning text-dark fw-bold d-flex justify-content-between align-items-center">
                <span>🛡️ EXAMINER CONTROL: {stageName}</span>
                {lastSaved && <Badge bg="light" text="dark" className="fw-normal">Saved: {new Date(lastSaved).toLocaleTimeString()}</Badge>}
            </Card.Header>
            <Card.Body>
                <div className="d-flex gap-3 mb-3">
                    <Button
                        variant={status === 'APPROVED' ? 'success' : 'outline-success'}
                        className="flex-grow-1 fw-bold"
                        onClick={() => handleSave('APPROVED')}
                        disabled={saving}
                    >
                        {status === 'APPROVED' && '✓'} APPROVE STAGE
                    </Button>
                    <Button
                        variant={status === 'FLAGGED' ? 'danger' : 'outline-danger'}
                        className="flex-grow-1 fw-bold"
                        onClick={() => handleSave('FLAGGED')}
                        disabled={saving}
                    >
                        {status === 'FLAGGED' && '⚠'} FLAG ISSUES
                    </Button>
                </div>

                <Form.Group>
                    <Form.Label className="fw-bold small text-muted">REGULATORY COMMENTS (Visible to Applicant)</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Enter instructions for the applicant or internal notes..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        onBlur={() => handleSave(status)} // Auto-save comment on blur
                    />
                </Form.Group>

                {status === 'FLAGGED' && (
                    <Alert variant="danger" className="mt-3 mb-0 py-2 small">
                        <strong>Action Required:</strong> Applicant will be notified to revise this section based on your comments.
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

export default ReviewControlPanel;
