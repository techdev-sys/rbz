import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ApplicantLanding.css';
import './LicenseTypeDetail.css';

const COMMON_DOCUMENTS = [
    { name: 'Audited Financial Statements (Last 3 Years)', note: 'Financial health assessment' },
    { name: 'Strategic Business Plan', note: 'Growth and feasibility assessment' },
    { name: 'Loan Portfolio Report', note: 'Asset quality verification' },
    { name: 'Credit & Risk Policy Manual', note: 'Risk management compliance' },
    { name: 'ZIMRA Tax Clearance Certificate', note: 'Proof of regulatory tax compliance' },
    { name: 'Operational Policy Manual', note: 'Standard operating procedures (recommended)' },
    { name: 'Affidavit of Fitness and Probity (Appendix A)', note: 'Per director / senior officer' },
    { name: 'Shareholder AML & Source of Wealth Affidavits (Appendix B / C)', note: 'Per corporate or individual shareholder' },
];

const CORE_STAGES = [
    { name: 'Company Profile', detail: 'Institution details, registration, incorporation, physical address and key contacts.' },
    { name: 'Ownership Structure', detail: 'Shareholders, beneficial ownership and source-of-funds declarations.' },
    { name: 'Directors & Governance', detail: 'Fitness and probity vetting for directors and senior management.' },
    { name: 'Application Form', detail: 'The formal statutory application record for the licence sought.' },
    { name: 'Capital Structure', detail: 'Paid-up capital, funding sources and shareholder contributions.' },
    { name: 'Products & Services', detail: 'The lending, savings or banking products the institution intends to offer.' },
    { name: 'Financial Projections', detail: 'Three-to-five year financial and portfolio projections.' },
    { name: 'Growth & Development', detail: 'Branch network, staffing and market development plans.' },
    { name: 'Compliance Declaration', detail: 'AML/CFT and regulatory compliance undertakings.' },
    { name: 'Documents Upload', detail: 'Upload of all supporting statutory and policy documents.' },
];

const LICENCE_TYPES = {
    mfi: {
        id: 'mfi',
        abbr: 'MFI',
        tag: 'CREDIT-ONLY MFI',
        title: 'Credit-Only Microfinance Institution',
        subtitle: 'Credit-only lending to individuals and small & medium enterprises',
        capital: 'USD 25,000 equivalent',
        act: 'Microfinance Act [Chapter 24:29]',
        requirementsDoc: 'Minimum Licensing Requirements for Credit-Only MFIs (June 2025)',
        overview: 'A Credit-Only Microfinance Institution licence permits an institution to extend loans and credit facilities to individuals, small businesses and agricultural borrowers. Credit-only institutions do not take deposits from the public and are therefore not subject to deposit-protection or liquidity requirements, making this the most direct entry pathway into regulated microfinance lending in Zimbabwe.',
        products: ['Personal Loans', 'Business Loans', 'Agricultural Loans', 'Group Lending'],
        extraStages: [],
        extraDocuments: [],
        licenceTypeValue: 'Credit-Only',
    },
    dtmfi: {
        id: 'dtmfi',
        abbr: 'DTMFI',
        tag: 'DEPOSIT-TAKING MFI',
        title: 'Deposit-Taking Microfinance Institution',
        subtitle: 'Micro-savings and lending under full RBZ prudential supervision',
        capital: 'USD 5,000,000 equivalent',
        act: 'Microfinance Act [Chapter 24:29]',
        requirementsDoc: 'Minimum Licensing Requirements for Deposit-Taking MFIs (June 2025)',
        overview: 'A Deposit-Taking Microfinance Institution (DTMFI) licence permits an institution to mobilise savings and term deposits from the public in addition to lending. Because DTMFIs hold depositor funds, the application requires additional evidence of deposit protection arrangements (DIPF registration), liquidity management and a materially higher minimum capital than a credit-only licence.',
        products: ['Micro-Savings', 'Term Deposits', 'Consumer Loans', 'DIPF Registration'],
        extraStages: [
            { name: 'Deposit Protection (DIPF)', detail: 'Evidence of registration with the Deposit Protection Corporation and depositor-protection arrangements.' },
        ],
        extraDocuments: [
            { name: 'AML/CFT Compliance Programme', note: 'Mandatory for deposit-taking institutions' },
        ],
        licenceTypeValue: 'Deposit-Taking',
    },
    bank: {
        id: 'bank',
        abbr: 'BANK',
        tag: 'COMMERCIAL BANK',
        title: 'Commercial Bank',
        subtitle: 'Full-service banking under the Basel III prudential framework',
        capital: 'USD 30,000,000',
        act: 'Banking Act [Chapter 24:20]',
        requirementsDoc: 'Minimum Licensing Requirements for Banking Institutions (June 2025)',
        overview: 'A Commercial Bank licence permits full-service banking, including current and savings accounts, trade finance and the full suite of deposit and credit products. Applicants must demonstrate capital adequacy under Basel III, sound liquidity management, IT and cyber-risk resilience, and a documented recovery and resolution plan, in addition to the standard governance and ownership requirements applicable to all institutions.',
        products: ['Current & Savings Accounts', 'Trade Finance', 'Basel III Compliance', 'IT & Cyber Risk Assessment'],
        extraStages: [
            { name: 'Capital Adequacy (Basel III)', detail: 'Risk-weighted capital adequacy computation and capital conservation buffers.' },
            { name: 'Liquidity Management', detail: 'Liquidity Coverage Ratio and funding concentration analysis.' },
            { name: 'IT & Cyber Risk', detail: 'Technology infrastructure, cybersecurity controls and business continuity readiness.' },
            { name: 'Recovery & Resolution', detail: 'Board-approved recovery and resolution planning documentation.' },
        ],
        extraDocuments: [
            { name: 'AML/CFT Compliance Programme', note: 'Mandatory for deposit-taking institutions' },
            { name: 'Enterprise Risk Management Framework', note: 'Board-approved, covering credit, market, liquidity and operational risk' },
            { name: 'IT & Technology Risk Policy', note: 'Information technology and cybersecurity risk policy' },
        ],
        licenceTypeValue: 'Commercial-Bank',
    },
};

const WORKFLOW_STEPS = [
    {
        title: 'Register and complete every application stage',
        body: 'Create a secure applicant account and work through each guided stage below. Progress saves automatically — you may pause and resume at any time until every stage is complete.',
    },
    {
        title: 'Submit your application',
        body: 'Once all stages are complete, you submit the application. A submitted application is locked from further edits and enters the Reserve Bank’s allocation queue.',
    },
    {
        title: 'Senior Bank Examiner allocation',
        body: 'Only submitted applications are visible for allocation. A Senior Bank Examiner reviews the queue and assigns your application to a Bank Examiner for detailed evaluation.',
    },
    {
        title: 'Bank Examiner review',
        body: 'The assigned Bank Examiner reviews every stage of your submission, opens and downloads your supporting documents, and evaluates the system-generated compliance report against the applicable regulatory checklist.',
    },
    {
        title: 'Requests for additional information',
        body: 'If the examiner needs clarification or a corrected document, they will message you directly within the portal and your status will show as “Revisions Required.” You respond and resubmit the affected items in-app — no separate correspondence required.',
    },
    {
        title: 'Examiner determination',
        body: 'Once the examiner is satisfied that all requirements are met, the application moves to “Approved” and is forwarded for final quality-assurance sign-off.',
    },
    {
        title: 'Senior Bank Examiner quality assurance',
        body: 'A Senior Bank Examiner performs a final quality-assurance review of the examiner’s recommendation before the licence is issued.',
    },
    {
        title: 'Licence issued',
        body: 'On final approval, a licence code is generated and your institution is entered into the RBZ licence registry, with ongoing renewal and compliance tracking through the portal.',
    },
];

const LicenseTypeDetail = () => {
    const { typeId } = useParams();
    const navigate = useNavigate();
    const type = LICENCE_TYPES[typeId];

    if (!type) {
        return (
            <div className="ltd-notfound">
                <h2>Licence type not found</h2>
                <button className="btn-primary-gold" onClick={() => navigate('/')}>Back to home</button>
            </div>
        );
    }

    const stageList = [...CORE_STAGES, ...type.extraStages, { name: 'Application Review', detail: 'Final self-review of every stage before submission to the Reserve Bank.' }];
    const documentList = [...COMMON_DOCUMENTS, ...type.extraDocuments];

    const startApplication = () => {
        localStorage.setItem('preselectedLicenseType', type.licenceTypeValue);
        navigate('/register');
    };

    return (
        <div className="ltd-container">
            <header className="landing-topbar ltd-topbar">
                <div className="landing-topbar-inner ltd-topbar-inner">
                    <div className="landing-brand">
                        <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="landing-logo" />
                        <div className="landing-brand-copy">
                            <div className="landing-brand-title">Reserve Bank of Zimbabwe</div>
                            <div className="landing-brand-sub">Banking Supervision, Surveillance &amp; Financial Stability</div>
                        </div>
                    </div>
                    <nav className="landing-nav">
                        <button className="btn-secondary-light" onClick={() => navigate('/')}>&larr; All licence types</button>
                        <button className="btn-secondary-light" onClick={() => navigate('/login')}>Sign In</button>
                        <button className="btn-primary-gold" onClick={startApplication}>Start Application</button>
                    </nav>
                </div>
            </header>

            <section className="ltd-hero">
                <div className="ltd-hero-inner">
                    <span className="ltd-breadcrumb">Licence Types / {type.abbr}</span>
                    <span className="ltd-tag">{type.tag}</span>
                    <h1>{type.title}</h1>
                    <p className="ltd-subtitle">{type.subtitle}</p>
                    <div className="ltd-hero-actions">
                        <button className="btn-primary-gold btn-lg" onClick={startApplication}>Start Application</button>
                        <span className="ltd-hero-note">Registration takes about 2 minutes &middot; save &amp; resume anytime</span>
                    </div>
                </div>
            </section>

            <div className="ltd-body">
                <main className="ltd-main">
                    <section className="ltd-section">
                        <h2>About this licence</h2>
                        <p>{type.overview}</p>
                    </section>

                    <section className="ltd-section">
                        <h2>Governing legislation</h2>
                        <div className="ltd-legal-card">
                            <div>
                                <div className="ltd-legal-label">Primary Act</div>
                                <div className="ltd-legal-value">{type.act}</div>
                            </div>
                            <div>
                                <div className="ltd-legal-label">Applicable licensing requirements</div>
                                <div className="ltd-legal-value">{type.requirementsDoc}</div>
                            </div>
                        </div>
                        <p className="ltd-legal-footnote">Only Act and policy references relevant to a {type.abbr} application are shown while completing the application — you will not be asked to review requirements from an Act that does not apply to your licence type.</p>
                    </section>

                    <section className="ltd-section">
                        <h2>Application steps ({stageList.length} stages)</h2>
                        <ol className="ltd-steps">
                            {stageList.map((s, i) => (
                                <li key={s.name} className="ltd-step">
                                    <span className="ltd-step-number">{String(i + 1).padStart(2, '0')}</span>
                                    <div>
                                        <div className="ltd-step-title">{s.name}</div>
                                        <div className="ltd-step-detail">{s.detail}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section className="ltd-section">
                        <h2>Documents you will need</h2>
                        <p className="ltd-section-lead">Common documents are required for every licence type. Additional documents are required specifically for a {type.abbr} application.</p>
                        <div className="ltd-doc-grid">
                            {documentList.map((d) => (
                                <div className="ltd-doc-item" key={d.name}>
                                    <span className="ltd-doc-check">&#10003;</span>
                                    <div>
                                        <div className="ltd-doc-name">{d.name}</div>
                                        <div className="ltd-doc-note">{d.note}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="ltd-section">
                        <h2>How your application will be reviewed</h2>
                        <p className="ltd-section-lead">The portal manages the full determination process end to end, from submission to licence issuance.</p>
                        <ol className="ltd-workflow">
                            {WORKFLOW_STEPS.map((w, i) => (
                                <li key={w.title} className="ltd-workflow-step">
                                    <span className="ltd-workflow-number">{i + 1}</span>
                                    <div>
                                        <div className="ltd-workflow-title">{w.title}</div>
                                        <div className="ltd-workflow-body">{w.body}</div>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                </main>

                <aside className="ltd-sidebar">
                    <div className="ltd-sidebar-card">
                        <div className="ltd-sidebar-title">Key facts</div>
                        <dl className="ltd-facts">
                            <dt>Minimum capital</dt>
                            <dd>{type.capital}</dd>
                            <dt>Application stages</dt>
                            <dd>{stageList.length}</dd>
                            <dt>Governing Act</dt>
                            <dd>{type.act}</dd>
                            <dt>Regulator</dt>
                            <dd>Reserve Bank of Zimbabwe &mdash; Bank Supervision</dd>
                        </dl>
                        <div className="ltd-sidebar-products">
                            <div className="ltd-sidebar-subtitle">Typical products</div>
                            <ul>
                                {type.products.map(p => <li key={p}>{p}</li>)}
                            </ul>
                        </div>
                        <button className="btn-primary-gold ltd-sidebar-cta" onClick={startApplication}>Start Application</button>
                        <button className="ltd-sidebar-secondary" onClick={() => navigate('/login')}>I already have an application</button>
                    </div>
                </aside>
            </div>

            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div>
                        <div className="footer-brand">Reserve Bank of Zimbabwe</div>
                        <div className="footer-sub">Bank Supervision, Surveillance &amp; Financial Stability Division</div>
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

export default LicenseTypeDetail;
