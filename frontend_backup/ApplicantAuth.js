import React, { useState } from 'react';
import { Card, Form, Button, Container, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { authenticateUser } from '../services/api';

const ApplicantAuth = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        companyName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!isLogin && formData.password !== formData.confirmPassword) {
                throw new Error("Passwords do not match");
            }

            // Real backend authentication
            const response = await authenticateUser("applicant", formData.email, formData.password);

            if (response.data && response.data.token) {
                localStorage.setItem('jwtToken', response.data.token);

                // Auto-restore session if the backend found the application
                if (response.data.companyId) {
                    localStorage.setItem('currentCompanyId', response.data.companyId);

                    if (response.data.companyName) {
                        localStorage.setItem('institutionName', response.data.companyName);
                    }
                    if (response.data.contactPersonName) {
                        localStorage.setItem('applicantName', response.data.contactPersonName);
                    }
                } else {
                    const storedName = formData.companyName || formData.email.split('@')[0] || 'Applicant';
                    localStorage.setItem('applicantName', storedName);
                    if (formData.companyName) {
                        localStorage.setItem('institutionName', formData.companyName);
                    }
                }

                if (onLogin) {
                    onLogin('applicant');
                } else {
                    localStorage.setItem('userRole', 'applicant');
                    navigate('/applicant');
                }
            } else {
                throw new Error("Invalid response from server");
            }

        } catch (err) {
            setError(err.response?.data?.message || err.message || "Authentication failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
            <Card className="shadow-lg border-0 shadow-sm border-0 mb-4" style={{ width: '100%', maxWidth: '500px' }}>
                <Card.Header className="text-center bg-white border-0 pt-5 pb-0">
                    <img src="/rbz-logo.png" alt="RBZ Logo" style={{ height: '80px', marginBottom: '15px' }} />
                    <h3 style={{ color: '#003366', fontWeight: 'bold' }}>RBZ Portal</h3>
                    <h6 style={{ color: '#D4AF37' }}>{isLogin ? 'Applicant Login' : 'Register New Account'}</h6>
                </Card.Header>
                <Card.Body className="p-5">
                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <Form.Group className="mb-3">
                                <Form.Label>Company Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="Enter your institution's name"
                                    required
                                />
                            </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@company.com"
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Secure password"
                                required
                            />
                        </Form.Group>

                        {!isLogin && (
                            <Form.Group className="mb-4">
                                <Form.Label>Confirm Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm password"
                                    required
                                />
                            </Form.Group>
                        )}

                        <Button
                            variant="primary"
                            type="submit"
                            className="w-100 mb-3 premium-button"
                            disabled={loading}
                        >
                            {loading ? <Spinner animation="border" size="sm" /> : (isLogin ? 'Log In' : 'Create Account')}
                        </Button>

                        <div className="text-center">
                            <Button
                                variant="link"
                                className="text-muted text-decoration-none p-0"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setError(null);
                                }}
                            >
                                {isLogin ? "Don't have an account? Register here." : "Already have an account? Log in."}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
                <Card.Footer className="text-center text-muted bg-white pb-4 border-0 small">
                    <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>← Back to Home</span>
                </Card.Footer>
            </Card>
        </Container>
    );
};

export default ApplicantAuth;
