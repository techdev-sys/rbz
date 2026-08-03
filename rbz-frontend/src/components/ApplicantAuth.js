import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { authenticateUser, registerApplicant, friendlyError } from '../services/api';
import './ApplicantAuth.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

const ApplicantAuth = ({ onLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isRegister = location.pathname === '/register';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        contactPersonName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validate = () => {
        if (!EMAIL_REGEX.test(formData.email.trim())) {
            return 'Please enter a valid email address.';
        }
        if (!formData.password) {
            return 'Password is required.';
        }
        if (isRegister) {
            if (!formData.companyName.trim()) {
                return 'Institution name is required.';
            }
            if (!formData.contactPersonName.trim()) {
                return 'Contact person name is required.';
            }
            if (formData.password.length < MIN_PASSWORD_LENGTH) {
                return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
            }
            if (formData.password !== formData.confirmPassword) {
                return 'Passwords do not match.';
            }
        }
        return null;
    };

    const persistApplicantSession = (data, fallbackName) => {
        localStorage.setItem('jwtToken', data.token);
        localStorage.setItem('userRole', 'applicant');
        localStorage.setItem('institutionType', data.institutionType || 'MFI');
        if (data.companyId) {
            localStorage.setItem('currentCompanyId', data.companyId);
        }
        if (data.companyName) {
            localStorage.setItem('institutionName', data.companyName);
        } else if (formData.companyName) {
            localStorage.setItem('institutionName', formData.companyName);
        }
        if (data.contactPersonName) {
            localStorage.setItem('applicantName', data.contactPersonName);
        } else if (fallbackName) {
            localStorage.setItem('applicantName', fallbackName);
        }
        localStorage.setItem('applicantEmail', formData.email.trim());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = isRegister
                ? await registerApplicant(
                    formData.email.trim(),
                    formData.password,
                    formData.companyName.trim(),
                    formData.contactPersonName.trim()
                )
                : await authenticateUser(
                    'applicant',
                    formData.email.trim(),
                    formData.password
                );
            const data = response.data;

            if (!data?.token) {
                throw new Error('Authentication failed. Please try again.');
            }

            const fallbackName = formData.contactPersonName.trim() || formData.email.split('@')[0];
            persistApplicantSession(data, fallbackName);

            if (onLogin) {
                onLogin('applicant');
            } else {
                navigate('/applicant');
            }
        } catch (err) {
            setError(friendlyError(err, 'Sign in failed. Please check your details and try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="applicant-auth-shell">
            <div className="applicant-auth-brand-side">
                <div className="brand-topbar">
                    <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="brand-logo" />
                    <div className="brand-topbar-copy">
                        <div className="brand-topbar-title">Reserve Bank of Zimbabwe</div>
                        <div className="brand-topbar-sub">Banking Supervision, Surveillance &amp; Financial Stability</div>
                    </div>
                </div>
                <div className="brand-content">
                    <h1>Licensing Portal</h1>
                    <ul className="brand-points">
                        <li>
                            <span className="brand-bullet" />
                            <span>End-to-end digital licensing for microfinance institutions</span>
                        </li>
                        <li>
                            <span className="brand-bullet" />
                            <span>Bank-grade security for sensitive corporate documents</span>
                        </li>
                        <li>
                            <span className="brand-bullet" />
                            <span>Real-time status tracking from submission to approval</span>
                        </li>
                    </ul>
                    <div className="brand-footer">
                        Bank Supervision, Surveillance &amp; Financial Stability Division
                    </div>
                </div>
            </div>

            <div className="applicant-auth-form-side">
                <div className="auth-form-container">
                    <button
                        type="button"
                        className="auth-back-link"
                        onClick={() => navigate('/')}
                    >
                        ← Back to home
                    </button>

                    <div className="auth-tab-switch" role="tablist">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={!isRegister}
                            className={!isRegister ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => navigate('/login')}
                        >
                            Sign in
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={isRegister}
                            className={isRegister ? 'auth-tab active' : 'auth-tab'}
                            onClick={() => navigate('/register')}
                        >
                            Create account
                        </button>
                    </div>

                    <div className="auth-headline">
                        <h2>{isRegister ? 'Register your institution' : 'Sign in to your portal'}</h2>
                        <p>
                            {isRegister
                                ? 'Begin your microfinance licensing application. You will be guided through each stage.'
                                : 'Continue your application or check examiner feedback on your submission.'}
                        </p>
                    </div>

                    {error && (
                        <Alert variant="danger" className="auth-alert" onClose={() => setError(null)} dismissible>
                            {error}
                        </Alert>
                    )}

                    <Form onSubmit={handleSubmit} noValidate>
                        {isRegister && (
                            <>
                                <Form.Group className="auth-field">
                                    <Form.Label>Institution name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="e.g. Sunrise Microfinance (Pvt) Ltd"
                                        autoComplete="organization"
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="auth-field">
                                    <Form.Label>Contact person</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="contactPersonName"
                                        value={formData.contactPersonName}
                                        onChange={handleChange}
                                        placeholder="Full name of authorised representative"
                                        autoComplete="name"
                                        required
                                    />
                                </Form.Group>
                            </>
                        )}

                        <Form.Group className="auth-field">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="name@institution.co.zw"
                                autoComplete="email"
                                autoFocus={!isRegister}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="auth-field">
                            <Form.Label>Password</Form.Label>
                            <div className="auth-password-wrap">
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={isRegister ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
                                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-show-toggle"
                                    onClick={() => setShowPassword(p => !p)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </Form.Group>

                        {isRegister && (
                            <Form.Group className="auth-field">
                                <Form.Label>Confirm password</Form.Label>
                                <Form.Control
                                    type={showPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Re-enter password"
                                    autoComplete="new-password"
                                    required
                                />
                            </Form.Group>
                        )}

                        <Button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading
                                ? <Spinner animation="border" size="sm" />
                                : (isRegister ? 'Create account' : 'Sign in')}
                        </Button>

                        <div className="auth-form-footnote">
                            {isRegister
                                ? <>Already registered? <button type="button" className="auth-inline-link" onClick={() => navigate('/login')}>Sign in instead</button></>
                                : <>New to the portal? <button type="button" className="auth-inline-link" onClick={() => navigate('/register')}>Register your institution</button></>
                            }
                        </div>
                    </Form>

                    <div className="auth-security-note">
                        <span className="auth-security-icon" aria-hidden="true">🔒</span>
                        <div>
                            Your session is encrypted in transit. Never share your password with anyone, including RBZ staff.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantAuth;
