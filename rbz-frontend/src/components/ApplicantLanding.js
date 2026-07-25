import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ApplicantLanding.css';

const INSTITUTION_TYPES = [
    {
        id: 'mfi',
        tag: 'CREDIT-ONLY MFI',
        abbr: 'MFI',
        title: 'Microfinance Institution',
        subtitle: 'Credit-only lending to individuals & SMEs',
        capital: 'USD 25,000',
        stages: '10',
        products: ['Personal Loans', 'Business Loans', 'Agricultural Loans', 'Group Lending'],
    },
    {
        id: 'dtmfi',
        tag: 'DEPOSIT-TAKING MFI',
        abbr: 'DTMFI',
        title: 'Deposit-Taking MFI',
        subtitle: 'Micro-deposits and lending under RBZ supervision',
        capital: 'USD 25,000',
        stages: '11',
        products: ['Micro-Savings', 'Term Deposits', 'Consumer Loans', 'DIPF Registration'],
    },
    {
        id: 'bank',
        tag: 'COMMERCIAL BANK',
        abbr: 'BANK',
        title: 'Commercial Bank',
        subtitle: 'Full-service banking under the Basel III framework',
        capital: 'USD 30,000,000',
        stages: '14',
        products: ['Current & Savings Accounts', 'Trade Finance', 'Basel III Compliance', 'IT & Cyber Risk Assessment'],
    },
];

const ApplicantLanding = () => {
    const navigate = useNavigate();
    const heroRef = useRef(null);
    const [isHeaderCompact, setIsHeaderCompact] = useState(false);

    const goLogin = () => navigate('/login');
    const goRegister = () => navigate('/register');

    useEffect(() => {
        const hero = heroRef.current;
        if (!hero) return undefined;

        const observer = new IntersectionObserver(([entry]) => {
            const hasScrolledPastHero = !entry.isIntersecting && entry.boundingClientRect.top < 0;
            setIsHeaderCompact(hasScrolledPastHero);
        }, {
            rootMargin: '-78px 0px 0px 0px',
            threshold: 0,
        });

        observer.observe(hero);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="applicant-landing-container">

            {/* ============== TOP BAR ============== */}
            <header className={isHeaderCompact ? 'landing-topbar landing-topbar-compact' : 'landing-topbar'}>
                <div className="landing-topbar-inner">
                    <div className="landing-brand">
                        <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="landing-logo" />
                        <div className="landing-brand-copy">
                            <div className="landing-brand-title">Reserve Bank of Zimbabwe</div>
                            <div className="landing-brand-sub">Banking Supervision, Surveillance &amp; Financial Stability</div>
                        </div>
                    </div>
                    <nav className="landing-nav">
                        <button className="landing-nav-link" onClick={() => document.getElementById('licence-types')?.scrollIntoView({ behavior: 'smooth' })}>
                            Licence Types
                        </button>
                        <button className="landing-nav-link" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                            How It Works
                        </button>
                        <button className="landing-nav-link" onClick={() => document.getElementById('support')?.scrollIntoView({ behavior: 'smooth' })}>
                            Contact
                        </button>
                        <button className="btn-secondary-light" onClick={goLogin}>Sign In</button>
                        <button className="btn-primary-gold" onClick={goRegister}>Apply Now</button>
                    </nav>
                </div>
            </header>

            {/* ============== HERO ============== */}
            <section className="hero-section" ref={heroRef}>
                <div className="hero-grid">
                    <div className="hero-content">
                        <span className="hero-eyebrow">Bank Supervision &middot; Licensing Division</span>
                        <h1 className="hero-title">
                            Financial Institution<br />
                            <span>Licensing Portal</span>
                        </h1>
                        <p className="hero-text">
                            The official Reserve Bank of Zimbabwe portal for submitting and managing
                            financial institution licensing applications. Three regulated pathways —
                            Credit-Only MFI, Deposit-Taking MFI, and Commercial Bank — each guided
                            through every compliance stage with full examiner oversight.
                        </p>
                        <div className="hero-actions">
                            <button className="btn-primary-gold btn-lg" onClick={goRegister}>
                                Submit an Application
                            </button>
                            <button className="btn-ghost-light btn-lg" onClick={goLogin}>
                                Continue Existing Application
                            </button>
                        </div>
                        <div className="hero-trust">
                            <div className="trust-item">
                                <div className="trust-number">3</div>
                                <div className="trust-label">Licence categories</div>
                            </div>
                            <div className="trust-divider" />
                            <div className="trust-item">
                                <div className="trust-number">14</div>
                                <div className="trust-label">Guided stages</div>
                            </div>
                            <div className="trust-divider" />
                            <div className="trust-item">
                                <div className="trust-number">49+</div>
                                <div className="trust-label">Compliance checks</div>
                            </div>
                            <div className="trust-divider" />
                            <div className="trust-item">
                                <div className="trust-number">24/7</div>
                                <div className="trust-label">Save &amp; resume</div>
                            </div>
                        </div>
                    </div>

                    {/* Formal licensing overview panel */}
                    <div className="hero-overview-panel">
                        <div className="hop-header">
                            <div className="hop-label">Regulatory Licensing Pathways</div>
                            <div className="hop-sub">Reserve Bank of Zimbabwe Act [Chapter 22:15]</div>
                        </div>
                        <div className="hop-table">
                            <div className="hop-table-head">
                                <span>Institution Type</span>
                                <span>Min. Capital</span>
                                <span>Stages</span>
                            </div>
                            {INSTITUTION_TYPES.map((t, i) => (
                                <div className="hop-table-row" key={t.id}>
                                    <div className="hop-row-main">
                                        <span className="hop-abbr">{t.abbr}</span>
                                        <span className="hop-row-title">{t.title}</span>
                                    </div>
                                    <div className="hop-row-capital">{t.capital}</div>
                                    <div className="hop-row-stages">{t.stages}</div>
                                </div>
                            ))}
                        </div>
                        <div className="hop-footer">
                            <div className="hop-footer-item">
                                <span className="hop-footer-dot hop-dot-green" />
                                49+ automated compliance checks per submission
                            </div>
                            <div className="hop-footer-item">
                                <span className="hop-footer-dot hop-dot-gold" />
                                Full examiner review with real-time status tracking
                            </div>
                            <div className="hop-footer-item">
                                <span className="hop-footer-dot hop-dot-blue" />
                                Encrypted data &middot; JWT authentication &middot; Audit logs
                            </div>
                        </div>
                        <button className="hop-cta" onClick={goRegister}>
                            Begin Licence Application
                            <span className="hop-cta-arrow">&#8594;</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* ============== LICENCE TYPE CARDS ============== */}
            <section className="licence-section" id="licence-types">
                <div className="section-header">
                    <span className="section-eyebrow">Licence categories</span>
                    <h2>Select your institution type to begin</h2>
                    <p>The portal automatically configures application stages, document requirements, and compliance rules based on your selected institution type.</p>
                </div>

                <div className="licence-cards">
                    {INSTITUTION_TYPES.map((type) => (
                        <div className={`licence-card licence-card-${type.id}`} key={type.id}>
                            <div className="lc-header">
                                <span className="lc-abbr-tag">{type.abbr}</span>
                                <span className="lc-stages-count">{type.stages} stages</span>
                            </div>

                            <div className="lc-tag">{type.tag}</div>
                            <h3 className="lc-title">{type.title}</h3>
                            <p className="lc-subtitle">{type.subtitle}</p>

                            <div className="lc-capital">
                                <span className="lc-capital-label">Minimum capital requirement</span>
                                <span className="lc-capital-value">{type.capital}</span>
                            </div>

                            <ul className="lc-features">
                                {type.products.map(p => (
                                    <li key={p}>
                                        <span className="lc-check">&#10003;</span>
                                        {p}
                                    </li>
                                ))}
                            </ul>

                            <button className="lc-apply-btn" onClick={goRegister}>
                                Apply for this licence
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============== HOW IT WORKS ============== */}
            <section className="how-section" id="how-it-works">
                <div className="section-header">
                    <span className="section-eyebrow">How it works</span>
                    <h2>From registration to a licence — entirely online</h2>
                    <p>The portal mirrors the official RBZ checklist and adapts the application journey to your institution type automatically.</p>
                </div>
                <div className="how-steps">
                    <div className="how-step">
                        <div className="how-step-number">01</div>
                        <h4>Register &amp; select licence type</h4>
                        <p>Create a secure account, choose between Credit-Only MFI, DTMFI, or Commercial Bank, and the system configures your stages accordingly.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">02</div>
                        <h4>Complete all application stages</h4>
                        <p>Work through guided stages — ownership, directors, capital structure, business plan, projections, compliance, and document upload. Save and resume any time.</p>
                    </div>
                    <div className="how-step">
                        <div className="how-step-number">03</div>
                        <h4>Examiner review &amp; determination</h4>
                        <p>Your submission is reviewed by RBZ examiners against 49+ regulatory criteria. Track progress in real time and respond to feedback within the portal.</p>
                    </div>
                </div>
            </section>

            {/* ============== FEATURES ============== */}
            <section className="features-section" id="features">
                <div className="section-header">
                    <span className="section-eyebrow">Portal capabilities</span>
                    <h2>Built for transparency, security, and regulatory rigour</h2>
                </div>
                <div className="feature-cards">
                    <div className="feature-card">
                        <div className="feature-label">Compliance Review</div>
                        <h4>Systematic regulatory checks</h4>
                        <p>49+ rule checks evaluate every submission — capital adequacy, director vetting, ownership compliance — before it reaches an examiner.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-label">Data Security</div>
                        <h4>Bank-grade security controls</h4>
                        <p>Encrypted data in transit and at rest, role-based access controls, JWT session management, and full audit trails of every action on your file.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-label">Status Tracking</div>
                        <h4>Real-time application visibility</h4>
                        <p>Know exactly which stage your application is at, who is reviewing it, which rules passed or failed, and what is required to proceed.</p>
                    </div>
                </div>
            </section>

            {/* ============== SUPPORT ============== */}
            <section className="support-section" id="support">
                <div className="support-card">
                    <div>
                        <div className="section-eyebrow centered">Need assistance?</div>
                        <h3>Our licensing team is here to help</h3>
                        <p>Working-hours support for institutions navigating the Credit-Only MFI, DTMFI, or Commercial Bank licensing process.</p>
                    </div>
                    <div className="support-contact-grid">
                        <div className="support-contact-item">
                            <div className="support-contact-label">Email</div>
                            <a href="mailto:licensing@rbz.zw" className="support-contact-value">licensing@rbz.zw</a>
                        </div>
                        <div className="support-contact-item">
                            <div className="support-contact-label">Telephone</div>
                            <a href="tel:+263242703000" className="support-contact-value">+263 242 703 000</a>
                        </div>
                        <div className="support-contact-item">
                            <div className="support-contact-label">Address</div>
                            <div className="support-contact-value-static">80 Samora Machel Avenue, Harare</div>
                        </div>
                        <div className="support-contact-item">
                            <div className="support-contact-label">Office Hours</div>
                            <div className="support-contact-value-static">Mon – Fri, 08:00 – 16:30</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============== FOOTER ============== */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div>
                        <div className="footer-brand">Reserve Bank of Zimbabwe</div>
                        <div className="footer-sub">Bank Supervision, Surveillance &amp; Financial Stability Division</div>
                    </div>
                    <div className="footer-licence-types">
                        <span>Credit-Only MFI</span>
                        <span className="footer-dot">&middot;</span>
                        <span>Deposit-Taking MFI</span>
                        <span className="footer-dot">&middot;</span>
                        <span>Commercial Bank</span>
                    </div>
                    <div className="footer-meta">
                        <div>&copy; {new Date().getFullYear()} Reserve Bank of Zimbabwe. All rights reserved.</div>
                        <div className="footer-tiny">For technical assistance: licensing@rbz.zw &middot; +263 242 703 000</div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ApplicantLanding;
