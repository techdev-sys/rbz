import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Button, Table, Alert, Spinner, Row, Col, Tabs, Tab, Badge } from 'react-bootstrap';
import { saveAllFinancialProjections, getFinancialProjections, uploadProjectionsDocument } from '../services/api';

const FinancialProjections = ({ onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [companyId, setCompanyId] = useState(null);
    const [activeTab, setActiveTab] = useState('manual');
    const [uploadedFile, setUploadedFile] = useState(null);

    // Store projections for 2026 and 2027
    const [projections, setProjections] = useState({
        2026: {
            year: 2026,
            totalIncome: '',
            totalExpenses: '',
            tax: '',
            netIncome: '',
            totalAssets: '',
            totalLoans: '',
            currentLiabilities: '',
            totalEquity: '',
            costIncomeRatio: '',
            returnOnAssets: '',
            returnOnEquity: '',
            notes: ''
        },
        2027: {
            year: 2027,
            totalIncome: '',
            totalExpenses: '',
            tax: '',
            netIncome: '',
            totalAssets: '',
            totalLoans: '',
            currentLiabilities: '',
            totalEquity: '',
            costIncomeRatio: '',
            returnOnAssets: '',
            returnOnEquity: '',
            notes: ''
        }
    });

    const loadExistingProjections = useCallback(async (compId) => {
        try {
            const response = await getFinancialProjections(compId);
            if (response.data && response.data.length > 0) {
                const updatedProjections = {
                    2026: { year: 2026, totalIncome: '', totalExpenses: '', tax: '', netIncome: '', totalAssets: '', totalLoans: '', currentLiabilities: '', totalEquity: '', costIncomeRatio: '', returnOnAssets: '', returnOnEquity: '', notes: '' },
                    2027: { year: 2027, totalIncome: '', totalExpenses: '', tax: '', netIncome: '', totalAssets: '', totalLoans: '', currentLiabilities: '', totalEquity: '', costIncomeRatio: '', returnOnAssets: '', returnOnEquity: '', notes: '' }
                };
                response.data.forEach(proj => {
                    if (proj.year === 2026 || proj.year === 2027) {
                        updatedProjections[proj.year] = proj;
                    }
                });
                setProjections(updatedProjections);
            }
        } catch (error) {
            console.error('Error loading financial projections:', error);
        }
    }, []);

    useEffect(() => {
        const storedCompanyId = localStorage.getItem('currentCompanyId');
        if (storedCompanyId) {
            setCompanyId(parseInt(storedCompanyId));
            loadExistingProjections(parseInt(storedCompanyId));
        } else {
            setMessage({ type: 'danger', text: 'Company profile not found. Please complete Stage 1 first.' });
        }
    }, [loadExistingProjections]);

    const handleInputChange = (year, field, value) => {
        setProjections(prev => ({
            ...prev,
            [year]: {
                ...prev[year],
                [field]: value,
                companyId: companyId
            }
        }));

        // Auto-calculate ratios if applicable
        calculateRatios(year, field, value);
    };

    const calculateRatios = (year, field, value) => {
        // We need the latest state, effectively. 
        // Since state updates are async, we construct a 'next state' simulation for calculation.
        // However, 'projections' from closure is old. Use functional setProjections for atomic updates? 
        // No, we need to calculate derived values based on the *current change* and *existing state*.

        setProjections(prev => {
            const nextProjections = { ...prev };
            const currentYearProj = { ...nextProjections[year], [field]: value };

            // 1. Calculate Net Income (Income - Expenses - Tax)
            if (['totalIncome', 'totalExpenses', 'tax'].includes(field)) {
                const income = parseFloat(currentYearProj.totalIncome || 0);
                const expenses = parseFloat(currentYearProj.totalExpenses || 0);
                const tax = parseFloat(currentYearProj.tax || 0);
                if (currentYearProj.totalIncome && currentYearProj.totalExpenses && currentYearProj.tax) {
                    currentYearProj.netIncome = (income - expenses - tax).toFixed(2);
                }
            }

            // 2. YEAR 2 AUTO-CONFIGURATION: Equity
            // User Rule: "total equity of the year [1] plus net income of that year [1] should equal to total equity of the second year"
            // So: Equity(2027) = Equity(2026) + NetIncome(2026)

            // We need to verify if this change affects Year 2 Equity
            // Triggers: Change in 2026 Equity OR Change in 2026 Net Income
            let year1Equity = parseFloat(nextProjections[2026].totalEquity || 0);
            let year1NetIncome = parseFloat(nextProjections[2026].netIncome || 0);

            // Update local variables if the current change affects them
            if (year === 2026) {
                if (field === 'totalEquity') year1Equity = parseFloat(value || 0);
                if (currentYearProj.netIncome) year1NetIncome = parseFloat(currentYearProj.netIncome || 0);
            }

            // Apply formula to 2027 if we have the data
            if (year === 2026 && (field === 'totalEquity' || ['totalIncome', 'totalExpenses', 'tax'].includes(field))) {
                const derivedEquity2027 = (year1Equity + year1NetIncome).toFixed(2);
                nextProjections[2027] = {
                    ...nextProjections[2027],
                    totalEquity: derivedEquity2027
                };
            }

            // 3. AUTO-CONFIGURATION: Total Assets
            if (['totalEquity', 'currentLiabilities'].includes(field) || (year === 2026 && field === 'netIncome')) {
                // For 2026, simplecalc
                // For 2027, Equity might have just been updated in Step 2 above
            }

            // Let's do a rigorous pass for BOTH years to ensure consistency after any change
            const p2026 = year === 2026 ? currentYearProj : nextProjections[2026];
            const p2027 = year === 2027 ? currentYearProj : nextProjections[2027];

            // A. Recalculate 2026 Assets
            const eq2026 = parseFloat(p2026.totalEquity || 0);
            const liab2026 = parseFloat(p2026.currentLiabilities || 0);
            if (p2026.totalEquity && p2026.currentLiabilities) {
                p2026.totalAssets = (eq2026 + liab2026).toFixed(2);
            }

            // B. Recalculate 2027 Equity (if 2026 changed)
            // Rule: Equity(2027) = Equity(2026) + NetIncome(2026)
            const ni2026 = parseFloat(p2026.netIncome || 0);
            if (p2026.totalEquity && p2026.netIncome) {
                p2027.totalEquity = (eq2026 + ni2026).toFixed(2);
            }

            // C. Recalculate 2027 Assets
            const eq2027 = parseFloat(p2027.totalEquity || 0);
            const liab2027 = parseFloat(p2027.currentLiabilities || 0);
            if (p2027.currentLiabilities) { // Equity is derived, so just need liabilities
                p2027.totalAssets = (eq2027 + liab2027).toFixed(2);
            }

            // 4. Update Ratios (Cost/Income, ROA, ROE) for BOTH years
            [p2026, p2027].forEach(p => {
                const inc = parseFloat(p.totalIncome || 0);
                const exp = parseFloat(p.totalExpenses || 0);
                const ni = parseFloat(p.netIncome || 0);
                const ast = parseFloat(p.totalAssets || 0);
                const eq = parseFloat(p.totalEquity || 0);

                if (inc > 0) p.costIncomeRatio = ((exp / inc) * 100).toFixed(1);
                if (ast > 0) p.returnOnAssets = ((ni / ast) * 100).toFixed(1);
                if (eq > 0) p.returnOnEquity = ((ni / eq) * 100).toFixed(1);
            });

            // Update state with modified objects
            return {
                ...prev,
                2026: p2026,
                2027: p2027
            };
        });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadedFile(file);
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await uploadProjectionsDocument(file, companyId);
            setMessage({
                type: 'info',
                text: `📄 File "${file.name}" uploaded. Automatic extraction feature coming soon. Please fill the form manually for now.`
            });
            // TODO: When AI extraction is implemented, auto-fill the projections here
        } catch (error) {
            console.error('Error uploading document:', error);
            setMessage({
                type: 'warning',
                text: 'Document uploaded but extraction is not yet implemented. Please fill the form manually.'
            });
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: Auto-Save Functionality ---
    useEffect(() => {
        // Only run auto-save if we have a valid companyId
        if (!companyId || companyId.toString().startsWith("MOCK-")) return;

        const timer = setTimeout(async () => {
            try {
                // Convert projections object to array
                const projectionsArray = [
                    { ...projections[2026], companyId },
                    { ...projections[2027], companyId }
                ];
                await saveAllFinancialProjections(projectionsArray);
                console.log("Auto-save FinancialProjections successful.");
            } catch (error) {
                console.warn("Auto-save FinancialProjections failed:", error);
            }
        }, 1500); // 1.5 second debounce

        return () => clearTimeout(timer);
    }, [projections, companyId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!companyId) {
            setMessage({ type: 'danger', text: 'Company ID not found. Please complete Stage 1 first.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Convert projections object to array
            const projectionsArray = [
                { ...projections[2026], companyId },
                { ...projections[2027], companyId }
            ];

            await saveAllFinancialProjections(projectionsArray);
            setMessage({ type: 'success', text: '✅ Financial projections saved successfully!' });

            // Auto-advance after 1.5 seconds
            setTimeout(() => {
                if (onComplete) onComplete();
            }, 1500);

        } catch (error) {
            console.error('Error saving financial projections:', error);
            setMessage({
                type: 'danger',
                text: `❌ Error saving financial projections: ${error.response?.data || error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (onComplete) onComplete();
    };

    if (companyId === null) {
        return null; // Still loading, don't show anything yet
    }

    return (
        <div className="animate-fade-in">
            {message.text && (
                <Alert variant={message.type} className="mb-4" dismissible onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Card className="rbz-card mb-4">
                <Card.Header className="bg-rbz-navy text-white">
                    <h4 className="mb-0">💰 Stage 7: Financial Projections (2-Year)</h4>
                    <p className="mb-0 mt-2" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Provide financial projections for 2026 and 2027 (in ZiG)
                    </p>
                </Card.Header>
                <Card.Body>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                        <Tab eventKey="manual" title="📝 Manual Entry">
                            <Form onSubmit={handleSubmit}>
                                <Alert variant="info" className="mb-4">
                                    <strong>💡 Tip:</strong> Enter your financial data below. Ratios will be calculated automatically.
                                </Alert>

                                {/* Projections Table */}
                                <div className="table-responsive">
                                    <Table bordered hover>
                                        <thead className="bg-light">
                                            <tr>
                                                <th style={{ width: '40%' }}>Indicator</th>
                                                <th className="text-center" style={{ width: '30%' }}>(ZiG) 2026</th>
                                                <th className="text-center" style={{ width: '30%' }}>(ZiG) 2027</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Income & Expenses */}
                                            <tr className="table-secondary">
                                                <td colSpan="3"><strong>Income & Expenses</strong></td>
                                            </tr>
                                            <tr>
                                                <td>Total Income</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].totalIncome}
                                                        onChange={(e) => handleInputChange(2026, 'totalIncome', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].totalIncome}
                                                        onChange={(e) => handleInputChange(2027, 'totalIncome', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Total Expenses</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].totalExpenses}
                                                        onChange={(e) => handleInputChange(2026, 'totalExpenses', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].totalExpenses}
                                                        onChange={(e) => handleInputChange(2027, 'totalExpenses', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Tax</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].tax}
                                                        onChange={(e) => handleInputChange(2026, 'tax', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].tax}
                                                        onChange={(e) => handleInputChange(2027, 'tax', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr className="table-primary">
                                                <td><strong>Net Income</strong></td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Auto-calculated"
                                                        value={projections[2026].netIncome}
                                                        onChange={(e) => handleInputChange(2026, 'netIncome', e.target.value)}
                                                        className="fw-bold"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Auto-calculated"
                                                        value={projections[2027].netIncome}
                                                        onChange={(e) => handleInputChange(2027, 'netIncome', e.target.value)}
                                                        className="fw-bold"
                                                    />
                                                </td>
                                            </tr>

                                            {/* Assets & Liabilities */}
                                            <tr className="table-secondary">
                                                <td colSpan="3"><strong>Assets & Liabilities</strong></td>
                                            </tr>
                                            <tr>
                                                <td>Total Assets</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].totalAssets}
                                                        onChange={(e) => handleInputChange(2026, 'totalAssets', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].totalAssets}
                                                        onChange={(e) => handleInputChange(2027, 'totalAssets', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Total Loans</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].totalLoans}
                                                        onChange={(e) => handleInputChange(2026, 'totalLoans', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].totalLoans}
                                                        onChange={(e) => handleInputChange(2027, 'totalLoans', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Current Liabilities (Tax)</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].currentLiabilities}
                                                        onChange={(e) => handleInputChange(2026, 'currentLiabilities', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].currentLiabilities}
                                                        onChange={(e) => handleInputChange(2027, 'currentLiabilities', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Total Equity</td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2026].totalEquity}
                                                        onChange={(e) => handleInputChange(2026, 'totalEquity', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={projections[2027].totalEquity}
                                                        onChange={(e) => handleInputChange(2027, 'totalEquity', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>

                                            {/* Ratios */}
                                            <tr className="table-secondary">
                                                <td colSpan="3"><strong>Key Ratios (Auto-Calculated)</strong></td>
                                            </tr>
                                            <tr>
                                                <td>Cost/Income Ratio (%)</td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2026].costIncomeRatio ? projections[2026].costIncomeRatio + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2027].costIncomeRatio ? projections[2027].costIncomeRatio + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Return on Assets (%)</td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2026].returnOnAssets ? projections[2026].returnOnAssets + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2027].returnOnAssets ? projections[2027].returnOnAssets + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Return on Equity (%)</td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2026].returnOnEquity ? projections[2026].returnOnEquity + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                                <td>
                                                    <Form.Control
                                                        type="text"
                                                        value={projections[2027].returnOnEquity ? projections[2027].returnOnEquity + '%' : ''}
                                                        readOnly
                                                        className="bg-light"
                                                    />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </Table>
                                </div>

                                {/* Additional Notes */}
                                <Row className="mt-4">
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Additional Notes for 2026</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Any additional context or assumptions for 2026..."
                                                value={projections[2026].notes}
                                                onChange={(e) => handleInputChange(2026, 'notes', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group>
                                            <Form.Label>Additional Notes for 2027</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Any additional context or assumptions for 2027..."
                                                value={projections[2027].notes}
                                                onChange={(e) => handleInputChange(2027, 'notes', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {/* Action Buttons */}
                                <div className="d-flex justify-content-between mt-4">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleSkip}
                                        disabled={loading}
                                    >
                                        Skip for Now
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={loading}
                                        className="px-5"
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save & Continue →'
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Tab>

                        <Tab eventKey="upload" title="📤 Upload Document">
                            <Alert variant="info">
                                <strong>📄 Document Upload</strong>
                                <p className="mb-0 mt-2">
                                    Upload your financial projections document (Excel, PDF, etc.) and we'll attempt to extract the data automatically.
                                </p>
                            </Alert>

                            <Card className="border-dashed p-4 text-center bg-light">
                                <Form.Group>
                                    <Form.Label className="d-block mb-3">
                                        <div className="mb-2" style={{ fontSize: '3rem' }}>📊</div>
                                        <strong>Select your financial projections document</strong>
                                    </Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept=".pdf,.xlsx,.xls,.doc,.docx"
                                        onChange={handleFileUpload}
                                        disabled={loading}
                                    />
                                    {uploadedFile && (
                                        <div className="mt-3">
                                            <Badge bg="success">✓ {uploadedFile.name}</Badge>
                                        </div>
                                    )}
                                </Form.Group>
                            </Card>

                            <Alert variant="warning" className="mt-4">
                                <strong>⚠️ Note:</strong> Automatic extraction is currently being developed.
                                For now, please use the "Manual Entry" tab to input your projections.
                            </Alert>

                            <div className="d-flex justify-content-between mt-4">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setActiveTab('manual')}
                                >
                                    ← Back to Manual Entry
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleSkip}
                                >
                                    Skip for Now
                                </Button>
                            </div>
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>

            {/* Information Card */}
            <Card className="rbz-card border-info">
                <Card.Body>
                    <h6 className="text-info mb-3">📊 About Financial Projections</h6>
                    <ul className="mb-0">
                        <li>Provide realistic 2-year projections (2026-2027) in ZiG based on your business plan</li>
                        <li>Key ratios are calculated automatically as you enter data</li>
                        <li>Ensure projections align with your capital structure and growth plans</li>
                        <li>You can either fill the form manually or upload a document (extraction coming soon)</li>
                    </ul>
                </Card.Body>
            </Card>
        </div>
    );
};

export default FinancialProjections;
