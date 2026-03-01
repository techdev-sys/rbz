import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import './ApplicantLanding.css';

const ApplicantLanding = ({ onLogin }) => {
    const navigate = useNavigate();

    const handleApplicantAuth = () => {
        navigate('/auth');
    };

    const handleStaffPortal = () => {
        navigate('/staff-login');
    };

    return (
        <div className="applicant-landing-container">
            {/* Navigation Bar */}
            <nav className="landing-navbar">
                <div className="landing-logo-section">
                    <img src="/rbz-logo.png" alt="RBZ Logo" className="landing-logo" />
                    <div>
                        <h1 className="landing-title">Reserve Bank of Zimbabwe</h1>
                        <p className="landing-subtitle">Licensing & Supervision Portal</p>
                    </div>
                </div>
                <div className="landing-nav-links d-none d-md-flex">
                    <Button variant="link" className="text-white text-decoration-none" onClick={handleStaffPortal}>Staff Portal</Button>
                    <Button variant="outline-light" className="ms-3 rounded-pill px-4 fw-bold" onClick={handleApplicantAuth}>Log In</Button>
                    <Button variant="warning" className="rounded-pill px-4 fw-bold" style={{ backgroundColor: '#D4AF37', borderColor: '#D4AF37', color: '#003366' }} onClick={handleApplicantAuth}>Create Account</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Secure Your <span>Microfinance</span> License Online
                    </h1>
                    <p className="hero-text">
                        The Reserve Bank of Zimbabwe provides a streamlined, transparent, and digital platform to submit, manage, and track your licensing applications. Start your journey today.
                    </p>
                    <div className="hero-actions flex-wrap">
                        <button className="btn-gold-primary" onClick={handleApplicantAuth}>
                            Create an Account
                        </button>
                        <button className="btn-outline-light-custom" onClick={handleApplicantAuth}>
                            Log In
                        </button>
                    </div>
                </div>

                <div className="hero-graphics">
                    <div className="glass-card">
                        <h4>Application Process Overview</h4>
                        <div className="progress-step-item">
                            <div className="step-circle">1</div>
                            <div>
                                <h6 className="mb-0 fw-bold">Company Profile</h6>
                                <small className="text-light opacity-75">Basic corporate details & structure</small>
                            </div>
                        </div>
                        <div className="progress-step-item">
                            <div className="step-circle">2</div>
                            <div>
                                <h6 className="mb-0 fw-bold">Director Vetting</h6>
                                <small className="text-light opacity-75">Fit & proper assessments (DQ forms)</small>
                            </div>
                        </div>
                        <div className="progress-step-item">
                            <div className="step-circle">3</div>
                            <div>
                                <h6 className="mb-0 fw-bold">Business Plan</h6>
                                <small className="text-light opacity-75">Financial projections & models</small>
                            </div>
                        </div>
                        <div className="progress-step-item">
                            <div className="step-circle">4</div>
                            <div>
                                <h6 className="mb-0 fw-bold">Document Uploads</h6>
                                <small className="text-light opacity-75">Secure enclosures & proofs</small>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Why Use the Digital Portal?</h2>
                    <p>We've modernized our licensing process to ensure efficiency, transparency, and security for all prospective financial institutions.</p>
                </div>

                <div className="feature-cards">
                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h4>Track Status in Real-Time</h4>
                        <p>No more physical follow-ups. View the exact stage of your application and know immediately when examiners require additional details or edits.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h4>Bank-Grade Security</h4>
                        <p>Your sensitive corporate documents and financial projections are encrypted and securely stored following central banking security standards.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💾</div>
                        <h4>Save & Resume</h4>
                        <p>Licensing applications are extensive. Save your progress at any time and return later to complete the required forms without losing your data.</p>
                    </div>
                </div>
            </section>

            {/* Support Section */}
            <section className="support-section py-5 d-flex justify-content-center">
                <div className="text-center bg-white p-5 rounded-4 shadow-sm" style={{ maxWidth: '800px', border: '1px solid #e9ecef' }}>
                    <h3 style={{ color: '#003366', fontWeight: 'bold' }}>Need Assistance?</h3>
                    <p className="text-muted mb-4">Our support team is available during working hours to assist applicants.</p>
                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.5rem' }}>📧</span>
                            <span className="fw-bold">licensing@rbz.zw</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.5rem' }}>📞</span>
                            <span className="fw-bold">+263 242 703000</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>&copy; {new Date().getFullYear()} Reserve Bank of Zimbabwe. Bank Supervision, Surveillance & Financial Stability Division.</p>
                <div className="mt-3">
                    <Button variant="link" className="text-muted text-decoration-none small" onClick={handleStaffPortal}>Authorized Staff Access</Button>
                </div>
            </footer>
        </div>
    );
};

export default ApplicantLanding;
