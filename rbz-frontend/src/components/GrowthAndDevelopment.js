import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Alert, Spinner } from 'react-bootstrap';
import { saveGrowthAndDevelopment, getGrowthAndDevelopment } from '../services/api';

const GrowthAndDevelopment = ({ onComplete }) => {
    const [formData, setFormData] = useState({
        companyId: localStorage.getItem('currentCompanyId'),
        growthStrategies: '',
        businessExpansionPlans: '',
        performanceEnhancementStrategies: '',
        economicBenefits: '',
        communityBenefits: '',
        developmentalValueSummary: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadExistingData();
    }, []);

    const loadExistingData = async () => {
        const companyId = localStorage.getItem('currentCompanyId');
        if (!companyId) return;

        try {
            const response = await getGrowthAndDevelopment(companyId);
            if (response.data) {
                setFormData(response.data);
            }
        } catch (err) {
            console.log('No existing growth data');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await saveGrowthAndDevelopment(formData);
            setSuccess(true);

            setTimeout(() => {
                if (onComplete) onComplete();
            }, 1500);
        } catch (err) {
            console.error('Save failed', err);
            setError(err.response?.data || 'Failed to save growth and development information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Card className="shadow-sm">
                <Card.Header as="h4" className="bg-primary text-white">
                    Stage 8: Growth Strategies & Developmental Value
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">Growth & Development Information Saved! Moving to final stage...</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Alert variant="warning" className="mb-4">
                            <strong>Note:</strong> Please provide your responses in point form for clarity.
                        </Alert>

                        <h5 className="mt-3 mb-3">Growth Strategies</h5>

                        <Form.Group className="mb-3">
                            <Form.Label>Growth Strategies & Business Expansion *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                name="growthStrategies"
                                value={formData.growthStrategies}
                                onChange={handleChange}
                                placeholder="• Highlight strategies the institution intends to use to grow business&#10;• Describe expansion plans..."
                                required
                            />
                            <Form.Text className="text-muted">
                                List your strategies for business growth and expansion in point form.
                            </Form.Text>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Performance Enhancement Strategies *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                name="performanceEnhancementStrategies"
                                value={formData.performanceEnhancementStrategies}
                                onChange={handleChange}
                                placeholder="• Efficiency improvements&#10;• Technology adoption..."
                                required
                            />
                            <Form.Text className="text-muted">
                                List strategies to enhance business performance (efficiency, technology, etc.).
                            </Form.Text>
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Developmental Value</h5>
                        <Alert variant="success">
                            Indicate what the economy/community will benefit should the licence be approved/renewed.
                        </Alert>

                        <Form.Group className="mb-3">
                            <Form.Label>Developmental Value Summary *</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={6}
                                name="developmentalValueSummary"
                                value={formData.developmentalValueSummary}
                                onChange={handleChange}
                                placeholder="• Economic benefits (jobs, GDP contribution)&#10;• Community benefits (financial inclusion)..."
                                required
                            />
                            <Form.Text className="text-muted">
                                Provide a summary of the developmental value proposition (economic and social benefits) in point form.
                            </Form.Text>
                        </Form.Group>

                        <div className="d-flex justify-content-between mt-4">

                            <Button variant="secondary" onClick={() => window.history.back()}>
                                ← Previous Stage
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading} size="lg">
                                {loading ? <Spinner animation="border" size="sm" /> : 'Save & Continue to Documents Upload →'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card >
        </Container >
    );
};

export default GrowthAndDevelopment;
