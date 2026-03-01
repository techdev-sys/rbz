import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Alert, Badge, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

/**
 * Stage 4: Board Committees
 * Manage board committees with member selection and chairperson designation
 */
function Stage4BoardCommittees({ companyId, onComplete }) {
    const [committees, setCommittees] = useState([]);
    const [directors, setDirectors] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCommittee, setEditingCommittee] = useState(null);
    const [formData, setFormData] = useState({
        committeeName: '',
        selectedMembers: [],
        chairpersonId: null,
        termsOfReference: ''
    });
    const [torFile, setTorFile] = useState(null);
    const [alert, setAlert] = useState(null);
    const [loading, setLoading] = useState(false);
    const [committeeMembersMap, setCommitteeMembersMap] = useState({}); // Map<CommitteeId, MemberId[]>

    const committeeTypes = [
        'Board Audit Committee',
        'Credit Committee',
        'Risk Committee',
        'Governance Committee',
        'Remuneration Committee',
        'Other'
    ];

    useEffect(() => {
        if (companyId) {
            fetchCommittees();
            fetchDirectors();
        }
    }, [companyId]);

    const fetchCommittees = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/board-committee/company/${companyId}`);
            const fetchedCommittees = response.data;
            setCommittees(fetchedCommittees);

            // Fetch members for each committee to build the membership map
            const membersMap = {};
            for (const committee of fetchedCommittees) {
                try {
                    const membersRes = await axios.get(`http://localhost:8080/api/board-committee/${committee.id}/members`);
                    membersMap[committee.id] = membersRes.data.map(m => m.directorId);
                } catch (err) {
                    console.error(`Error fetching members for committee ${committee.id}`, err);
                    membersMap[committee.id] = [];
                }
            }
            setCommitteeMembersMap(membersMap);

        } catch (error) {
            console.error('Error fetching committees:', error);
            setAlert({ type: 'danger', message: 'Error fetching committees data' });
        } finally {
            setLoading(false);
        }
    };

    const fetchDirectors = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/director-vetting/company/${companyId}`);
            setDirectors(response.data);
        } catch (error) {
            console.error('Error fetching directors:', error);
        }
    };

    const handleShowModal = (committee = null) => {
        if (committee) {
            setEditingCommittee(committee);
            // Current members for this committee are in committeeMembersMap
            const currentMemberIds = committeeMembersMap[committee.id] || [];

            setFormData({
                committeeName: committee.committeeName,
                selectedMembers: currentMemberIds,
                chairpersonId: committee.chairpersonId,
                termsOfReference: committee.termsOfReference || ''
            });
        } else {
            setEditingCommittee(null);
            setFormData({
                committeeName: '',
                selectedMembers: [],
                chairpersonId: null,
                termsOfReference: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCommittee(null);
        setFormData({
            committeeName: '',
            selectedMembers: [],
            chairpersonId: null,
            termsOfReference: ''
        });
        setAlert(null);
    };

    const handleMemberToggle = (directorId) => {
        const currentMembers = formData.selectedMembers;
        if (currentMembers.includes(directorId)) {
            setFormData({
                ...formData,
                selectedMembers: currentMembers.filter(id => id !== directorId),
                // Clear chairperson if they were removed
                chairpersonId: directorId === formData.chairpersonId ? null : formData.chairpersonId
            });
        } else {
            setFormData({
                ...formData,
                selectedMembers: [...currentMembers, directorId]
            });
        }
    };

    const handleSaveCommittee = async () => {
        setAlert(null);

        // Basic Validation
        if (!formData.committeeName) {
            setAlert({ type: 'warning', message: 'Please provide a committee name.' });
            return;
        }

        // 1. Min 3 members
        if (formData.selectedMembers.length < 3) {
            setAlert({ type: 'warning', message: 'Each committee must have a minimum of 3 members.' });
            return;
        }

        if (!formData.chairpersonId) {
            setAlert({ type: 'warning', message: 'Please select a chairperson.' });
            return;
        }

        if (!formData.termsOfReference || formData.termsOfReference.trim() === '') {
            setAlert({ type: 'warning', message: 'Please provide brief Terms of Reference.' });
            return;
        }

        // 2. Cross-check for duplicate memberships
        // No one can be in two or more committees
        const conflictingMembers = [];

        // Iterate through all other committees
        for (const [commIdStr, memberIds] of Object.entries(committeeMembersMap)) {
            const commId = parseInt(commIdStr);
            // Skip the committee we are currently editing (if any)
            if (editingCommittee && commId === editingCommittee.id) continue;

            // Check if any selected member is already in this other committee
            for (const newMemberId of formData.selectedMembers) {
                if (memberIds.includes(newMemberId)) {
                    const director = directors.find(d => d.id === newMemberId);
                    const committeeName = committees.find(c => c.id === commId)?.committeeName || 'another committee';
                    conflictingMembers.push(`${director?.fullName || 'Unknown'} (already in ${committeeName})`);
                }
            }
        }

        if (conflictingMembers.length > 0) {
            setAlert({
                type: 'danger',
                message: `Membership Conflict: Directors cannot serve on more than one committee. Conflicts: ${conflictingMembers.join(', ')}`
            });
            return;
        }

        try {
            // Create or Update Committee (Upsert ideally, but API is 'create')

            let committeeIdToUse = null;

            if (editingCommittee) {
                // Delete the old one first to avoid duplicates/conflicts
                await axios.delete(`http://localhost:8080/api/board-committee/${editingCommittee.id}`);
                // Note: Ideally we update, but based on current API structure and requirement speed, replace is safer to ensure clean state
            }

            // Create committee
            const committeeResponse = await axios.post(
                `http://localhost:8080/api/board-committee/${companyId}/create`,
                {
                    committeeName: formData.committeeName,
                    termsOfReference: formData.termsOfReference, // Send TOR text
                    companyId: companyId
                }
            );

            const committeeId = committeeResponse.data.id;

            // Add members
            for (const directorId of formData.selectedMembers) {
                const director = directors.find(d => d.id === directorId);
                await axios.post(
                    `http://localhost:8080/api/board-committee/${committeeId}/add-member`,
                    {
                        directorId: directorId,
                        memberName: director.fullName,
                        isChairperson: directorId === formData.chairpersonId
                    }
                );
            }

            // Set chairperson (always set at end)
            const chairperson = directors.find(d => d.id === formData.chairpersonId);
            await axios.put(
                `http://localhost:8080/api/board-committee/${committeeId}/set-chairperson/${formData.chairpersonId}`,
                null,
                { params: { chairpersonName: chairperson.fullName } }
            );

            setAlert({ type: 'success', message: editingCommittee ? 'Committee updated successfully!' : 'Committee created successfully!' });
            handleCloseModal();
            fetchCommittees();
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error saving committee: ' + (error.response?.data?.message || error.message) });
        }
    };

    const handleUploadTOR = async (committeeId) => {
        if (!torFile) {
            setAlert({ type: 'warning', message: 'Please select a file to upload' });
            return;
        }

        const formData = new FormData();
        formData.append('file', torFile);

        try {
            await axios.post(
                `http://localhost:8080/api/board-committee/${committeeId}/upload-tor`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            setAlert({ type: 'success', message: 'Terms of Reference uploaded successfully!' });
            setTorFile(null);
            fetchCommittees();
        } catch (error) {
            setAlert({ type: 'danger', message: 'Error uploading TOR: ' + (error.response?.data?.message || error.message) });
        }
    };

    const handleDeleteCommittee = async (committeeId) => {
        if (window.confirm('Are you sure you want to delete this committee?')) {
            try {
                await axios.delete(`http://localhost:8080/api/board-committee/${committeeId}`);
                setAlert({ type: 'success', message: 'Committee deleted successfully!' });
                fetchCommittees();
            } catch (error) {
                setAlert({ type: 'danger', message: 'Error deleting committee: ' + error.message });
            }
        }
    };

    return (
        <div>
            <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">🏛️ Stage 4: Board Committees</h4>
                        <Button variant="light" size="sm" onClick={() => handleShowModal()}>
                            + Add Committee
                        </Button>
                    </div>
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
                            <li>Create board committees.</li>
                            <li>Each committee must have at least <strong>3 members</strong>.</li>
                            <li>A director <strong>cannot</strong> be a member of more than one committee.</li>
                            <li>Designate a chairperson for each committee.</li>
                            <li>Provide brief Terms of Reference for each.</li>
                        </ul>
                    </Alert>

                    {/* Committees Table */}
                    {loading ? (
                        <div className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 text-muted">Loading committee details...</p>
                        </div>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead className="table-dark">
                                <tr>
                                    <th>Committee Name</th>
                                    <th>Members</th>
                                    <th>Chairperson</th>
                                    <th>Terms of Reference</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {committees.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            No committees created yet. Click "+ Add Committee" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    committees.map((committee) => (
                                        <tr key={committee.id}>
                                            <td>
                                                <strong>{committee.committeeName}</strong>
                                            </td>
                                            <td>
                                                <small>{committee.committeeComposition || 'Loading members...'}</small>
                                            </td>
                                            <td>
                                                {committee.chairpersonName ? (
                                                    <Badge bg="success">🪑 {committee.chairpersonName}</Badge>
                                                ) : (
                                                    <Badge bg="warning">Not Set</Badge>
                                                )}
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '250px', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                                                    {committee.termsOfReference ? (
                                                        <span>{committee.termsOfReference}</span>
                                                    ) : (
                                                        <span className="text-muted fst-italic">No brief terms provided.</span>
                                                    )}
                                                </div>
                                                <hr className="my-1" />
                                                {committee.termsOfReferenceDocumentPath ? (
                                                    <Badge bg="success">✓ Document Uploaded</Badge>
                                                ) : (
                                                    <div>
                                                        <small className="d-block text-muted mb-1">Upload Full TOR:</small>
                                                        <Form.Control
                                                            type="file"
                                                            size="sm"
                                                            accept=".pdf,.doc,.docx"
                                                            onChange={(e) => setTorFile(e.target.files[0])}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="outline-primary"
                                                            className="mt-1 w-100"
                                                            onClick={() => handleUploadTOR(committee.id)}
                                                        >
                                                            Upload
                                                        </Button>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="info"
                                                    className="me-2 text-white"
                                                    onClick={() => handleShowModal(committee)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => handleDeleteCommittee(committee.id)}
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    )}

                    {/* Navigation */}
                    <div className="d-flex justify-content-between mt-4">
                        <Button variant="secondary">← Previous Stage</Button>
                        <Button
                            variant="primary"
                            onClick={onComplete}
                            disabled={committees.length === 0}
                        >
                            Next Stage →
                        </Button>
                    </div>

                    {committees.length === 0 && (
                        <Alert variant="warning" className="mt-3">
                            ⚠️ You must create at least one board committee before proceeding.
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Committee Modal */}
            <Modal show={showModal} onHide={handleCloseModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingCommittee ? 'Edit Committee' : 'Add New Committee'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Alert variant="secondary" className="mb-3 p-2">
                            <small>
                                <strong>Requirement:</strong> Min 3 members per committee. Directors cannot be in multiple committees.
                            </small>
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label>Committee Name</Form.Label>
                            <Form.Select
                                value={committeeTypes.includes(formData.committeeName) ? formData.committeeName : 'Other'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData({
                                        ...formData,
                                        committeeName: val === 'Other' ? '' : val
                                    })
                                }}
                            >
                                <option value="">Select Committee Type...</option>
                                {committeeTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </Form.Select>
                            {(formData.committeeName === '' || !committeeTypes.includes(formData.committeeName)) && (
                                <Form.Control
                                    type="text"
                                    placeholder="Enter custom committee name"
                                    className="mt-2"
                                    value={formData.committeeName}
                                    onChange={(e) => setFormData({ ...formData, committeeName: e.target.value })}
                                />
                            )}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Brief Terms of Reference</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                placeholder="Enter brief terms of reference for this committee..."
                                value={formData.termsOfReference}
                                onChange={(e) => setFormData({ ...formData, termsOfReference: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Select Members (Min 3)</Form.Label>
                            <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {directors.map((director) => {
                                    // Check if director is in another committee
                                    let isInAnotherComp = false;
                                    let otherCommName = '';

                                    for (const [commId, members] of Object.entries(committeeMembersMap)) {
                                        if (editingCommittee && parseInt(commId) === editingCommittee.id) continue;
                                        if (members.includes(director.id)) {
                                            isInAnotherComp = true;
                                            const c = committees.find(cm => cm.id === parseInt(commId));
                                            otherCommName = c ? c.committeeName : 'another committee';
                                            break;
                                        }
                                    }

                                    return (
                                        <Form.Check
                                            key={director.id}
                                            type="checkbox"
                                            id={`director-${director.id}`}
                                            className="mb-2"
                                        >
                                            <Form.Check.Input
                                                type="checkbox"
                                                checked={formData.selectedMembers.includes(director.id)}
                                                onChange={() => handleMemberToggle(director.id)}
                                                disabled={isInAnotherComp && !formData.selectedMembers.includes(director.id)}
                                            />
                                            <Form.Check.Label style={{ opacity: isInAnotherComp ? 0.6 : 1 }}>
                                                {director.fullName} - <small className="text-muted">{director.designation || 'Director'}</small>
                                                {isInAnotherComp && (
                                                    <Badge bg="secondary" className="ms-2">In {otherCommName}</Badge>
                                                )}
                                            </Form.Check.Label>
                                        </Form.Check>
                                    )
                                })}
                            </div>
                            <Form.Text className={formData.selectedMembers.length < 3 ? "text-danger" : "text-success"}>
                                {formData.selectedMembers.length} member(s) selected (Minimum 3 required)
                            </Form.Text>
                        </Form.Group>

                        {formData.selectedMembers.length > 0 && (
                            <Form.Group className="mb-3">
                                <Form.Label>Select Chairperson</Form.Label>
                                <Form.Select
                                    value={formData.chairpersonId || ''}
                                    onChange={(e) => setFormData({ ...formData, chairpersonId: parseInt(e.target.value) })}
                                >
                                    <option value="">Choose a chairperson...</option>
                                    {directors
                                        .filter(d => formData.selectedMembers.includes(d.id))
                                        .map((director) => (
                                            <option key={director.id} value={director.id}>
                                                {director.fullName} - {director.designation || 'Director'}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Form.Group>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSaveCommittee}
                        disabled={!formData.committeeName || formData.selectedMembers.length < 3 || !formData.chairpersonId}
                    >
                        Save Committee
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Stage4BoardCommittees;
