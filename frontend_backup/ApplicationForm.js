import React, { useState, useEffect } from 'react';
import { Button, Card, Col, Container, Form, Row, Alert, Table, Modal, Badge } from 'react-bootstrap';
import { saveApplicationForm, getApplicationFormByCompany } from '../services/api';

const ApplicationForm = ({ onComplete }) => {
    const [companyId] = useState(localStorage.getItem('currentCompanyId') || "");

    const [formData, setFormData] = useState({
        companyId: companyId,

        // Basic Information (Questions 1-7)
        nameOfApplicant: '',
        categoryOfLicense: 'Credit-Only Microfinance Institution',
        physicalAddressHeadOffice: '',
        branches: [{ address: '' }],
        landLineNumber: '',
        cellNumbers: '',
        emailAddress: '',
        contactPersonName: '',
        contactPersonAddress: '',
        contactPersonEmail: '',
        contactPersonTelephone: '',

        // Professional Services (Questions 8-10)
        bankersDetails: '',
        externalAuditorsDetails: '',
        lawyersDetails: '',

        // Board of Directors (Question 11)
        directors: [],

        // Board Committees (Question 12)
        boardCommittees: '',

        // Share Capital Structure (Question 13)
        numberOfAuthorizedShares: '',
        numberOfIssuedShares: '',
        parValuePerShare: '',
        amountOfIssuedShareCapital: '',
        sharePremium: '',
        totalShareholdersFunds: '',
        sourceOfCapital: '',

        // Shareholders (Question 14)
        shareholders: [],
        naturalPersonShareholders: [],
        corporateShareholders: [],
        ultimateBeneficialOwners: [],

        // Director's Business Interests (Question 15)
        directorsBusinessInterests: [],
        familyMembersBusinessInterests: [],

        // Certification
        chairpersonName: '',
        chairpersonSignatureDate: new Date().toISOString().split('T')[0],
        ceoName: '',
        ceoSignatureDate: new Date().toISOString().split('T')[0],
    });

    // Board Committees Logic State
    const [committees, setCommittees] = useState([]);
    const [showCommitteeModal, setShowCommitteeModal] = useState(false);
    const [committeeAlert, setCommitteeAlert] = useState(null);
    const [currentCommittee, setCurrentCommittee] = useState({
        id: null,
        name: '',
        members: [], // Array of director IDs or indices? Let's store Names for simplicity within this form or index references if names change.
        // Actually names are safer if reordering happens, but names editing breaks it.
        // Let's store objects { name, designation } matching directors list.
        chairperson: '',
        tor: ''
    });

    // Sync formData.boardCommittees (JSON/String) <-> committees (Array)
    useEffect(() => {
        if (formData.boardCommittees && typeof formData.boardCommittees === 'string' && formData.boardCommittees.trim() !== '') {
            try {
                // Check if it's JSON
                if (formData.boardCommittees.startsWith('[')) {
                    setCommittees(JSON.parse(formData.boardCommittees));
                } else {
                    // Legacy text support - do nothing or maybe put it in a "Other" committee?
                    // For now, if it's not JSON, we ignore or user can overwrite.
                    console.warn("Board committees is not JSON:", formData.boardCommittees);
                }
            } catch (e) {
                console.error("Failed to parse board committees JSON", e);
            }
        }
    }, [formData.boardCommittees]);

    // Update formData when committees change
    useEffect(() => {
        if (committees.length > 0) {
            setFormData(prev => ({
                ...prev,
                boardCommittees: JSON.stringify(committees)
            }));
        }
    }, [committees]);

    // --- Committee Handlers ---

    const handleOpenCommitteeModal = (committee = null) => {
        setCommitteeAlert(null);
        if (committee) {
            setCurrentCommittee(committee);
        } else {
            setCurrentCommittee({
                id: Date.now(), // temp ID
                name: '',
                members: [],
                chairperson: '',
                tor: ''
            });
        }
        setShowCommitteeModal(true);
    };

    const handleCloseCommitteeModal = () => {
        setShowCommitteeModal(false);
        setCurrentCommittee(null);
    };

    const toggleCommitteeMember = (directorName) => {
        const currentMembers = currentCommittee.members || [];
        if (currentMembers.includes(directorName)) {
            setCurrentCommittee({
                ...currentCommittee,
                members: currentMembers.filter(m => m !== directorName),
                chairperson: currentCommittee.chairperson === directorName ? '' : currentCommittee.chairperson
            });
        } else {
            setCurrentCommittee({
                ...currentCommittee,
                members: [...currentMembers, directorName]
            });
        }
    };

    const saveCommittee = () => {
        // Validation
        if (!currentCommittee.name) {
            setCommitteeAlert('Committee name is required.');
            return;
        }
        if (currentCommittee.members.length < 3) {
            setCommitteeAlert('A committee must have at least 3 members.');
            return;
        }
        if (!currentCommittee.chairperson) {
            setCommitteeAlert('A chairperson must be selected.');
            return;
        }
        if (!currentCommittee.tor) {
            setCommitteeAlert('Terms of Reference are required.');
            return;
        }

        // Exclusive Membership Check
        // Check if any selected member is ALREADY in another committee
        for (const member of currentCommittee.members) {
            for (const otherComm of committees) {
                if (otherComm.id !== currentCommittee.id) {
                    if (otherComm.members.includes(member)) {
                        setCommitteeAlert(`Director '${member}' is already in the '${otherComm.name}'. No director is supposed to be in two or more committees.`);
                        return;
                    }
                }
            }
        }

        setCommittees(prev => {
            const index = prev.findIndex(c => c.id === currentCommittee.id);
            if (index >= 0) {
                const newCommittees = [...prev];
                newCommittees[index] = currentCommittee;
                return newCommittees;
            } else {
                return [...prev, currentCommittee];
            }
        });
        handleCloseCommitteeModal();
    };

    const deleteCommittee = (id) => {
        if (window.confirm("Are you sure you want to remove this committee?")) {
            setCommittees(prev => prev.filter(c => c.id !== id));
        }
    };

    useEffect(() => {
        const loadApplicationForm = async () => {
            try {
                const response = await getApplicationFormByCompany(companyId);
                if (response.data && response.data.id) {
                    const loadedData = response.data;
                    setFormData(loadedData);

                    // Parse Board Committees
                    if (loadedData.boardCommittees && loadedData.boardCommittees.trim().startsWith('[')) {
                        try {
                            setCommittees(JSON.parse(loadedData.boardCommittees));
                        } catch (e) { console.error("Error parsing committees", e); }
                    }

                    // Parse Shareholding Structure (14a)
                    // If loadedData has 'shareholdingStructure' (JSON) we prefer it over existing formData.shareholders.
                    // If not, we fall back to what might have been passed or empty.
                    // Note: original formData.shareholders was empty array initially.
                    if (loadedData.shareholdingStructure && loadedData.shareholdingStructure.trim().startsWith('[')) {
                        try {
                            // We don't have a separate state for 'shareholders' like 'committees', it's directly in formData.shareholders
                            // So we just ensure formData.shareholders gets this value. 
                            // Wait, setFormData(loadedData) already does this IF loadedData had 'shareholders' property.
                            // But our BACKEND field is 'shareholdingStructure', so we need to map it to 'shareholders' UI state.
                            setFormData(prev => ({
                                ...prev,
                                shareholders: JSON.parse(loadedData.shareholdingStructure)
                            }));
                        } catch (e) { console.error("Error parsing shareholdingStructure", e); }
                    }

                    // Parse Corporate Shareholders (14b)
                    if (loadedData.corporateShareholders && loadedData.corporateShareholders.trim().startsWith('[')) {
                        try {
                            setFormData(prev => ({
                                ...prev,
                                corporateShareholdersBreakdown: JSON.parse(loadedData.corporateShareholders)
                            }));
                        } catch (e) { console.error("Error parsing corporateShareholders", e); }
                    } else {
                        // Init empty if null
                        setFormData(prev => ({
                            ...prev,
                            corporateShareholdersBreakdown: []
                        }));
                    }
                }
            } catch (error) {
                console.error('Error loading application form:', error);
            }
        };

        if (companyId) {
            loadApplicationForm();
        }
    }, [companyId]);

    // Update JSON string fields whenever relevant state changes
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            // Sync Shareholders -> shareholdingStructure (JSON)
            shareholdingStructure: JSON.stringify(prev.shareholders || []),
            // Sync Corporate Breakdown -> corporateShareholders (JSON)
            corporateShareholders: JSON.stringify(prev.corporateShareholdersBreakdown || [])
        }));
    }, [formData.shareholders, formData.corporateShareholdersBreakdown]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addBranch = () => {
        setFormData(prev => ({
            ...prev,
            branches: [...prev.branches, { address: '' }]
        }));
    };

    const removeBranch = (index) => {
        setFormData(prev => ({
            ...prev,
            branches: prev.branches.filter((_, i) => i !== index)
        }));
    };

    const handleBranchChange = (index, value) => {
        const newBranches = [...formData.branches];
        newBranches[index] = { address: value };
        setFormData(prev => ({ ...prev, branches: newBranches }));
    };

    const addDirector = () => {
        setFormData(prev => ({
            ...prev,
            directors: [...prev.directors, { name: '', nationality: '', residentialStatus: '', designation: '' }]
        }));
    };

    const removeDirector = (index) => {
        setFormData(prev => ({
            ...prev,
            directors: prev.directors.filter((_, i) => i !== index)
        }));
    };

    const handleDirectorChange = (index, field, value) => {
        const newDirectors = [...formData.directors];
        newDirectors[index][field] = value;
        setFormData(prev => ({ ...prev, directors: newDirectors }));
    };

    const addShareholder = () => {
        setFormData(prev => ({
            ...prev,
            shareholders: [...prev.shareholders, { name: '', numberOfShares: '', percentageOfTotalShares: '' }]
        }));
    };

    const removeShareholder = (index) => {
        setFormData(prev => ({
            ...prev,
            shareholders: prev.shareholders.filter((_, i) => i !== index)
        }));
    };

    const handleShareholderChange = (index, field, value) => {
        const newShareholders = [...formData.shareholders];
        newShareholders[index][field] = value;
        setFormData(prev => ({ ...prev, shareholders: newShareholders }));
    };

    // --- 14(b) Corporate Shareholders Handlers ---
    const addCorporateShareholder = () => {
        setFormData(prev => ({
            ...prev,
            corporateShareholdersBreakdown: [
                ...(prev.corporateShareholdersBreakdown || []),
                { companyName: '', members: [] }
            ]
        }));
    };

    const removeCorporateShareholder = (index) => {
        setFormData(prev => ({
            ...prev,
            corporateShareholdersBreakdown: prev.corporateShareholdersBreakdown.filter((_, i) => i !== index)
        }));
    };

    const updateCorporateName = (index, value) => {
        const updated = [...(formData.corporateShareholdersBreakdown || [])];
        updated[index].companyName = value;
        setFormData(prev => ({ ...prev, corporateShareholdersBreakdown: updated }));
    };

    const addCorporateMember = (corpIndex) => {
        const updated = [...(formData.corporateShareholdersBreakdown || [])];
        updated[corpIndex].members.push({ name: '', percentage: '' });
        setFormData(prev => ({ ...prev, corporateShareholdersBreakdown: updated }));
    };

    const removeCorporateMember = (corpIndex, memberIndex) => {
        const updated = [...(formData.corporateShareholdersBreakdown || [])];
        updated[corpIndex].members = updated[corpIndex].members.filter((_, i) => i !== memberIndex);
        setFormData(prev => ({ ...prev, corporateShareholdersBreakdown: updated }));
    };

    const updateCorporateMember = (corpIndex, memberIndex, field, value) => {
        const updated = [...(formData.corporateShareholdersBreakdown || [])];
        updated[corpIndex].members[memberIndex][field] = value;
        setFormData(prev => ({ ...prev, corporateShareholdersBreakdown: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await saveApplicationForm(formData);
            console.log('Application Form Saved:', response.data);
            alert('✅ Application Form submitted successfully!');
            if (onComplete) onComplete(response.data);
        } catch (error) {
            console.error('Error saving application form:', error);
            alert('❌ Failed to save application form. Please try again.');
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm mb-4">
                <Card.Header as="h4" className="bg-primary text-white">
                    <h4 className="mb-0">📋 APPLICATION FORM FOR REGISTRATION AS A CREDIT-ONLY MICROFINANCE INSTITUTION</h4>
                    <small>In terms of the Microfinance Act [Chapter 24:30]</small>
                </Card.Header>
                <Card.Body>
                    {/* Instructions */}
                    <Alert variant="warning">
                        <h6 className="mb-3"><strong>Instructions on how to complete this form:</strong></h6>
                        <ul className="mb-0">
                            <li>Please read the entire form before completing in block letters</li>
                            <li>Attach annexures wherever necessary to provide additional information or explanation</li>
                            <li>All sections of the application form must be completed and where it is not applicable indicate <strong>N/A</strong></li>
                            <li>Completed application forms together with proof of payment of the applicable application fees must be submitted to: <strong>The Registrar of Microfinance Institutions, Bank Supervision Division, Reserve Bank of Zimbabwe, 80 Samora Machel Avenue, HARARE</strong></li>
                        </ul>
                    </Alert>

                    <Form onSubmit={handleSubmit}>
                        {/* Section: Basic Information */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Basic Information</h5>
                            </Card.Header>
                            <Card.Body>
                                {/* Question 1 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>1. Name of Applicant Institution</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="nameOfApplicant"
                                        value={formData.nameOfApplicant}
                                        onChange={handleChange}
                                        placeholder="Enter institution name"
                                        required
                                    />
                                </Form.Group>

                                {/* Question 2 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>2. Category of Licence Applied for</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="categoryOfLicense"
                                        value={formData.categoryOfLicense}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="Credit-Only Microfinance Institution">Credit-Only Microfinance Institution</option>
                                        <option value="Deposit-Taking Microfinance Institution">Deposit-Taking Microfinance Institution</option>
                                    </Form.Select>
                                </Form.Group>

                                {/* Question 3 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>3. Physical Address of the Applicant's Head Office</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        name="physicalAddressHeadOffice"
                                        value={formData.physicalAddressHeadOffice}
                                        onChange={handleChange}
                                        placeholder="Enter complete physical address"
                                        required
                                    />
                                </Form.Group>

                                {/* Question 4 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>4. Physical Address of the Applicant's Branches - Please disclose all the branches</strong></Form.Label>
                                    <small className="text-muted d-block mb-2">(Or attach a schedule of branches and their addresses)</small>

                                    {formData.branches.map((branch, index) => (
                                        <div key={index} className="d-flex mb-2">
                                            <Form.Control
                                                type="text"
                                                value={branch.address}
                                                onChange={(e) => handleBranchChange(index, e.target.value)}
                                                placeholder={`Branch ${index + 1} address`}
                                                className="me-2"
                                            />
                                            {formData.branches.length > 1 && (
                                                <Button variant="danger" size="sm" onClick={() => removeBranch(index)}>
                                                    🗑️
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    <Button variant="outline-primary" size="sm" onClick={addBranch}>
                                        ➕ Add Branch
                                    </Button>
                                </Form.Group>

                                {/* Question 5 */}
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>5. Applicant's Contact Telephone Number(s)</strong></Form.Label>
                                            <Form.Label className="d-block">Land Line</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="landLineNumber"
                                                value={formData.landLineNumber}
                                                onChange={handleChange}
                                                placeholder="Land line number"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>&nbsp;</Form.Label>
                                            <Form.Label className="d-block">Cell Numbers</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="cellNumbers"
                                                value={formData.cellNumbers}
                                                onChange={handleChange}
                                                placeholder="Cell numbers (separate with commas)"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Question 6 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>6. Applicant's E-mail Address</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="emailAddress"
                                        value={formData.emailAddress}
                                        onChange={handleChange}
                                        placeholder="email@example.com"
                                        required
                                    />
                                </Form.Group>

                                {/* Question 7 */}
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <strong>7. State the name, address, email addresses and telephone number of the person(s) who may be contacted
                                            regarding any question in respect of this application</strong> <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Label className="small">Contact Person Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="contactPersonName"
                                                value={formData.contactPersonName}
                                                onChange={handleChange}
                                                placeholder="Full name"
                                                required
                                                className="mb-2"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small">Telephone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="contactPersonTelephone"
                                                value={formData.contactPersonTelephone}
                                                onChange={handleChange}
                                                placeholder="Phone number"
                                                className="mb-2"
                                            />
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Label className="small">Email Address</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="contactPersonEmail"
                                                value={formData.contactPersonEmail}
                                                onChange={handleChange}
                                                placeholder="email@example.com"
                                                className="mb-2"
                                            />
                                        </Col>
                                        <Col md={6}>
                                            <Form.Label className="small">Address</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="contactPersonAddress"
                                                value={formData.contactPersonAddress}
                                                onChange={handleChange}
                                                placeholder="Physical address"
                                            />
                                        </Col>
                                    </Row>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Section: Professional Services */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Professional Services</h5>
                            </Card.Header>
                            <Card.Body>
                                {/* Question 8 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>8. Details of the institution's bankers</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="bankersDetails"
                                        value={formData.bankersDetails}
                                        onChange={handleChange}
                                        placeholder="Bank name, branch, account details"
                                        required
                                    />
                                </Form.Group>

                                {/* Question 9 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>9. Details of the institution's external auditors</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="externalAuditorsDetails"
                                        value={formData.externalAuditorsDetails}
                                        onChange={handleChange}
                                        placeholder="Firm name, address, contact details"
                                        required
                                    />
                                </Form.Group>

                                {/* Question 10 */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>10. Details of the institution's lawyers</strong> <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="lawyersDetails"
                                        value={formData.lawyersDetails}
                                        onChange={handleChange}
                                        placeholder="Law firm name, address, contact details"
                                        required
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Section: Board of Directors */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Board of Directors</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Label>
                                    <strong>11. Details of board of directors</strong> <span className="text-danger">*</span>
                                </Form.Label>
                                <Alert variant="info" className="mb-3">
                                    <small>
                                        <strong>Note:</strong> State Name, Nationality, and residential status. Non-executive directors must be the majority
                                        and all executive directors must be residing within the Republic of Zimbabwe.
                                        <br />
                                        <strong>*Every Director should complete a Directors Questionnaire (separate form)</strong>
                                    </small>
                                </Alert>

                                <Table bordered hover responsive className="mb-3">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Nationality</th>
                                            <th>Resident/Non-resident</th>
                                            <th>Designation</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.directors.map((director, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        value={director.name}
                                                        onChange={(e) => handleDirectorChange(index, 'name', e.target.value)}
                                                        placeholder="Full name"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        value={director.nationality}
                                                        onChange={(e) => handleDirectorChange(index, 'nationality', e.target.value)}
                                                        placeholder="Nationality"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Select
                                                        size="sm"
                                                        value={director.residentialStatus}
                                                        onChange={(e) => handleDirectorChange(index, 'residentialStatus', e.target.value)}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="Resident">Resident</option>
                                                        <option value="Non-resident">Non-resident</option>
                                                    </Form.Select>
                                                </td>
                                                <td>
                                                    <Form.Select
                                                        size="sm"
                                                        value={director.designation}
                                                        onChange={(e) => handleDirectorChange(index, 'designation', e.target.value)}
                                                    >
                                                        <option value="">Select...</option>
                                                        <option value="Executive Director">Executive Director</option>
                                                        <option value="Non-Executive Director">Non-Executive Director</option>
                                                        <option value="Chairperson">Chairperson</option>
                                                        <option value="CEO">CEO</option>
                                                    </Form.Select>
                                                </td>
                                                <td>
                                                    <Button variant="danger" size="sm" onClick={() => removeDirector(index)}>
                                                        🗑️
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                <Button variant="primary" size="sm" onClick={addDirector}>
                                    ➕ Add Director
                                </Button>
                            </Card.Body>
                        </Card>

                        {/* Section: Board Committees */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Board Committees</h5>
                            </Card.Header>
                            <Card.Body>
                                {/* Question 12: Board Committees */}
                                <Form.Group className="mb-3">
                                    <Form.Label><strong>12. Name and composition of board committees</strong></Form.Label>

                                    <Alert variant="secondary" className="p-2 mb-2">
                                        <small>
                                            <strong>Requirements:</strong> Each committee must have a minimum of 3 members.
                                            No director may sit on more than one committee.
                                        </small>
                                    </Alert>

                                    <Table striped bordered size="sm">
                                        <thead>
                                            <tr>
                                                <th>Committee Name</th>
                                                <th>Chairperson</th>
                                                <th>Members</th>
                                                <th>Terms of Reference</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {committees.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center text-muted py-3">
                                                        No committees added. Please add at least one committee.
                                                    </td>
                                                </tr>
                                            ) : (
                                                committees.map((c, idx) => (
                                                    <tr key={c.id || idx}>
                                                        <td>{c.name}</td>
                                                        <td>
                                                            <Badge bg="success">{c.chairperson}</Badge>
                                                        </td>
                                                        <td>
                                                            {c.members.join(', ')} <br />
                                                            <small className="text-muted">({c.members.length} members)</small>
                                                        </td>
                                                        <td><small>{c.tor}</small></td>
                                                        <td>
                                                            <Button variant="outline-primary" size="sm" className="me-1" onClick={() => handleOpenCommitteeModal(c)}>
                                                                Edit
                                                            </Button>
                                                            <Button variant="outline-danger" size="sm" onClick={() => deleteCommittee(c.id)}>
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </Table>

                                    <div className="d-block">
                                        <Button variant="primary" size="sm" onClick={() => handleOpenCommitteeModal()}>
                                            + Add Committee
                                        </Button>
                                    </div>
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Section: Share Capital Structure */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Share Capital Structure</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Label><strong>13. The share capital structure of the applicant institution</strong> <span className="text-danger">*</span></Form.Label>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Number of Authorized Shares</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="numberOfAuthorizedShares"
                                                value={formData.numberOfAuthorizedShares}
                                                onChange={handleChange}
                                                placeholder="e.g., 1000000"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Number of Issued Shares</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="numberOfIssuedShares"
                                                value={formData.numberOfIssuedShares}
                                                onChange={handleChange}
                                                placeholder="e.g., 500000"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Par Value per Share (USD)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="parValuePerShare"
                                                value={formData.parValuePerShare}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Amount of Issued Share Capital (USD)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="amountOfIssuedShareCapital"
                                                value={formData.amountOfIssuedShareCapital}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Share Premium (if any)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="sharePremium"
                                                value={formData.sharePremium}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Total Shareholders' Funds (USD)</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                name="totalShareholdersFunds"
                                                value={formData.totalShareholdersFunds}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Source of Capital <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="sourceOfCapital"
                                                value={formData.sourceOfCapital}
                                                onChange={handleChange}
                                                placeholder="E.g., Shareholder equity, loans, etc."
                                                required
                                            />
                                            <Form.Text className="text-muted">*Attach documentary evidence</Form.Text>
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Section: Shareholders */}
                        <Card className="mb-4">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-rbz-navy">Shareholders</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form.Label><strong>14. (a) Shareholders of the institution</strong> <span className="text-danger">*</span></Form.Label>

                                <Table bordered hover responsive className="mb-3">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Number of Shares</th>
                                            <th>% of Total Shares</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.shareholders.map((shareholder, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="text"
                                                        value={shareholder.name}
                                                        onChange={(e) => handleShareholderChange(index, 'name', e.target.value)}
                                                        placeholder="Shareholder name"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        value={shareholder.numberOfShares}
                                                        onChange={(e) => handleShareholderChange(index, 'numberOfShares', e.target.value)}
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        size="sm"
                                                        type="number"
                                                        step="0.01"
                                                        value={shareholder.percentageOfTotalShares}
                                                        onChange={(e) => handleShareholderChange(index, 'percentageOfTotalShares', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </td>
                                                <td>
                                                    <Button variant="danger" size="sm" onClick={() => removeShareholder(index)}>
                                                        🗑️
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>

                                <Button variant="primary" size="sm" onClick={addShareholder} className="mb-3">
                                    ➕ Add Shareholder
                                </Button>

                                <Alert variant="info">
                                    <small>
                                        <strong>Note:</strong> For detailed shareholder information (Natural Persons, Corporate Bodies, Ultimate Beneficial Owners),
                                        please provide additional documentation as per the form requirements.
                                    </small>
                                </Alert>

                                <hr className="my-4" />

                                <Form.Label><strong>14. (b) Corporate Shareholders (if any)</strong></Form.Label>
                                <Alert variant="secondary" className="p-2 mb-3">
                                    <small>
                                        If a shareholder is a company/corporate body, please list the company name and then list the individual shareholders within that company.
                                    </small>
                                </Alert>

                                {formData.corporateShareholdersBreakdown && formData.corporateShareholdersBreakdown.map((corp, corpIndex) => (
                                    <Card key={corpIndex} className="mb-3 border-secondary">
                                        <Card.Header className="py-2 bg-light d-flex justify-content-between align-items-center">
                                            <span className="fw-bold">Corporate Shareholder #{corpIndex + 1}</span>
                                            <Button variant="outline-danger" size="sm" onClick={() => removeCorporateShareholder(corpIndex)}>Remove Company</Button>
                                        </Card.Header>
                                        <Card.Body>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Company Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Enter name of the corporate shareholder company"
                                                    value={corp.companyName}
                                                    onChange={(e) => updateCorporateName(corpIndex, e.target.value)}
                                                />
                                            </Form.Group>

                                            <h6 className="text-muted mt-3 mb-2 small text-uppercase fw-bold">Shareholders of {corp.companyName || 'this company'}</h6>
                                            <Table bordered size="sm">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Individual Name</th>
                                                        <th style={{ width: '150px' }}>% Holding</th>
                                                        <th style={{ width: '80px' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {corp.members.map((member, memIndex) => (
                                                        <tr key={memIndex}>
                                                            <td>
                                                                <Form.Control
                                                                    size="sm"
                                                                    type="text"
                                                                    placeholder="Name"
                                                                    value={member.name}
                                                                    onChange={(e) => updateCorporateMember(corpIndex, memIndex, 'name', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Form.Control
                                                                    size="sm"
                                                                    type="text"
                                                                    placeholder="%"
                                                                    value={member.percentage}
                                                                    onChange={(e) => updateCorporateMember(corpIndex, memIndex, 'percentage', e.target.value)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Button variant="ghost-danger" size="sm" className="text-danger p-0" onClick={() => removeCorporateMember(corpIndex, memIndex)}>
                                                                    🗑️
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {corp.members.length === 0 && (
                                                        <tr>
                                                            <td colSpan="3" className="text-center text-muted small">No shareholders added yet.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                            <Button variant="outline-primary" size="sm" onClick={() => addCorporateMember(corpIndex)}>
                                                + Add Individual
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ))}

                                <Button variant="secondary" size="sm" onClick={addCorporateShareholder}>
                                    + Add Corporate Shareholder
                                </Button>
                            </Card.Body>
                        </Card>

                        {/* Section: Certification */}
                        <Card className="mb-4 border-danger">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0 text-danger">Certification</h5>
                            </Card.Header>
                            <Card.Body>
                                <Alert variant="warning">
                                    <strong>16. WE HEREBY CERTIFY TO THE BEST OF OUR KNOWLEDGE AND BELIEF THAT THE INFORMATION GIVEN ABOVE IS CORRECT AND TRUE</strong>
                                </Alert>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>CHAIRPERSON</strong> <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="chairpersonName"
                                                value={formData.chairpersonName}
                                                onChange={handleChange}
                                                placeholder="Full names"
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="chairpersonSignatureDate"
                                                value={formData.chairpersonSignatureDate}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label><strong>CHIEF EXECUTIVE OFFICER</strong> <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ceoName"
                                                value={formData.ceoName}
                                                onChange={handleChange}
                                                placeholder="Full names"
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                name="ceoSignatureDate"
                                                value={formData.ceoSignatureDate}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>

                        {/* Submit Button */}
                        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
                            <div className="text-muted">
                                <small>All fields marked with <span className="text-danger">*</span> are required</small>
                            </div>
                            <Button variant="primary" type="submit" size="lg">
                                Submit Application Form →
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            {/* Additional Requirements Note */}
            <Alert variant="info">
                <h6><strong>📎 Additional Requirements (to be submitted separately):</strong></h6>
                <ul className="mb-0">
                    <li>Directors' Questionnaire for each director</li>
                    <li>Police Clearance Certificates</li>
                    <li>Tax Clearance Certificates</li>
                    <li>Certified copies of CVs</li>
                    <li>Net Worth Statements</li>
                    <li>Affidavits (Annexure A)</li>
                    <li>Certificate of Incorporation</li>
                    <li>Memorandum and Articles of Association</li>
                    <li>Business Plan</li>
                    <li>Credit Policy and Procedure Manual</li>
                </ul>
            </Alert>
            {/* Board Committee Modal */}
            <Modal show={showCommitteeModal} onHide={handleCloseCommitteeModal} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{currentCommittee && currentCommittee.id ? 'Edit Committee' : 'Add Committee'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {committeeAlert && (
                        <Alert variant="danger" onClose={() => setCommitteeAlert(null)} dismissible>
                            {committeeAlert}
                        </Alert>
                    )}
                    {currentCommittee && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Committee Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g. Audit Committee"
                                    value={currentCommittee.name}
                                    onChange={(e) => setCurrentCommittee({ ...currentCommittee, name: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Select Members (Min 3)</Form.Label>
                                <div className="border p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {formData.directors.length > 0 ? formData.directors.map((director, i) => {
                                        const dirName = director.name || `Director ${i + 1}`;

                                        // Check conflict for display
                                        let conflict = null;
                                        for (const c of committees) {
                                            if (c.id !== currentCommittee.id && c.members.includes(dirName)) {
                                                conflict = c.name;
                                            }
                                        }

                                        return (
                                            <div key={i} className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={currentCommittee.members.includes(dirName)}
                                                    onChange={() => toggleCommitteeMember(dirName)}
                                                    disabled={!!conflict && !currentCommittee.members.includes(dirName)}
                                                    id={`dir-check-${i}`}
                                                />
                                                <label className="form-check-label" htmlFor={`dir-check-${i}`}>
                                                    {dirName}
                                                    <span className="text-muted ms-1">({director.designation || 'Director'})</span>
                                                    {conflict && <Badge bg="secondary" className="ms-2">In {conflict}</Badge>}
                                                </label>
                                            </div>
                                        )
                                    }) : <div className="text-muted">No directors added in Section 11 yet. Please add directors first.</div>}
                                </div>
                                <Form.Text className={currentCommittee.members.length < 3 ? "text-danger" : "text-success"}>
                                    {currentCommittee.members.length} member(s) selected
                                </Form.Text>
                            </Form.Group>

                            {currentCommittee.members.length > 0 && (
                                <Form.Group className="mb-3">
                                    <Form.Label>Chairperson</Form.Label>
                                    <Form.Select
                                        value={currentCommittee.chairperson}
                                        onChange={(e) => setCurrentCommittee({ ...currentCommittee, chairperson: e.target.value })}
                                    >
                                        <option value="">Select Chairperson...</option>
                                        {currentCommittee.members.map((m, i) => (
                                            <option key={i} value={m}>{m}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Terms of Reference (Brief Sentences)</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    placeholder="Briefly describe the committee's mandate..."
                                    value={currentCommittee.tor}
                                    onChange={(e) => setCurrentCommittee({ ...currentCommittee, tor: e.target.value })}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCommitteeModal}>Cancel</Button>
                    <Button variant="primary" onClick={saveCommittee}>Save Committee</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default ApplicationForm;
