import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Spinner, Badge } from 'react-bootstrap';
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, BorderStyle, WidthType, ShadingType,
} from 'docx';
import { saveAs } from 'file-saver';
import {
    getCompanyProfile, getShareholdingStructure, getDirectors,
    getBoardCommittees, getCapitalStructure, getProductsAndServices,
    getFinancialProjections, getFinancialAssumptions, getGrowthAndDevelopment,
} from '../services/api';

// ─────────────────────────────────────────────────────────
//  EDITABLE TEXT — click any highlighted paragraph to edit
// ─────────────────────────────────────────────────────────
const EditableText = ({ value, onChange, placeholder, multiline, style }) => {
    const [editing, setEditing] = useState(false);
    const [localVal, setLocalVal] = useState(value || '');
    const ref = useRef();

    useEffect(() => { setLocalVal(value || ''); }, [value]);

    const commit = () => {
        setEditing(false);
        if (localVal !== value) onChange(localVal);
    };

    if (editing) {
        return multiline
            ? <textarea
                ref={ref}
                autoFocus
                value={localVal}
                onChange={e => setLocalVal(e.target.value)}
                onBlur={commit}
                placeholder={placeholder}
                style={{
                    width: '100%', border: '2px solid #c0a030', borderRadius: '4px',
                    padding: '6px 8px', fontFamily: 'inherit', fontSize: 'inherit',
                    lineHeight: 'inherit', resize: 'vertical', minHeight: '80px',
                    background: '#fffef0', outline: 'none', ...style
                }}
              />
            : <input
                ref={ref}
                autoFocus
                value={localVal}
                onChange={e => setLocalVal(e.target.value)}
                onBlur={commit}
                placeholder={placeholder}
                style={{
                    width: '100%', border: '2px solid #c0a030', borderRadius: '4px',
                    padding: '2px 6px', fontFamily: 'inherit', fontSize: 'inherit',
                    background: '#fffef0', outline: 'none', ...style
                }}
              />;
    }

    return (
        <span
            onClick={() => setEditing(true)}
            title="Click to edit"
            style={{
                cursor: 'text',
                borderBottom: '1px dashed #c0a030',
                display: 'inline-block',
                minWidth: '40px',
                color: localVal ? 'inherit' : '#bbb',
                ...style
            }}
        >
            {localVal || placeholder || '—'}
        </span>
    );
};

// Editable paragraph block
const EditablePara = ({ draftKey, drafts, update, defaultText, placeholder }) => {
    const val = drafts[draftKey] !== undefined ? drafts[draftKey] : (defaultText || '');
    return (
        <p style={{ textAlign: 'justify', lineHeight: '1.8', margin: '8px 0' }}>
            <EditableText
                value={val}
                onChange={v => update(draftKey, v)}
                placeholder={placeholder || 'Click to add text…'}
                multiline
                style={{ display: 'block', width: '100%' }}
            />
        </p>
    );
};

// ─────────────────────────────────────────────────────────
//  TABLE STYLES (matching Word document)
// ─────────────────────────────────────────────────────────
const T = {
    table: { width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: '10.5pt' },
    th: { border: '1px solid #000', padding: '5px 8px', background: '#d9d9d9', fontWeight: 'bold', textAlign: 'left', verticalAlign: 'top' },
    td: { border: '1px solid #000', padding: '5px 8px', textAlign: 'left', verticalAlign: 'top' },
};

const SectionHeading = ({ num, title }) => (
    <div style={{
        fontFamily: 'Times New Roman, serif', fontWeight: 'bold', fontSize: '12pt',
        textTransform: 'uppercase', borderBottom: '1px solid #000',
        paddingBottom: '4px', marginTop: '32px', marginBottom: '10px',
    }}>
        {num && <span style={{ marginRight: '12px' }}>{num}</span>}{title}
    </div>
);

const SubHeading = ({ title }) => (
    <div style={{ fontWeight: 'bold', fontSize: '11pt', marginTop: '16px', marginBottom: '6px', fontFamily: 'Times New Roman, serif' }}>
        {title}
    </div>
);

const CoverRow = ({ label, value }) => (
    <div style={{ marginBottom: '14px' }}>
        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt', fontFamily: 'Times New Roman, serif' }}>{label}</div>
        <div style={{ fontSize: '10.5pt', fontFamily: 'Times New Roman, serif' }}>{value || '—'}</div>
    </div>
);

const fmt = (v, decimals = 2) => {
    if (v == null || v === '') return '—';
    const n = parseFloat(v);
    if (isNaN(n)) return v;
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// ─────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────
const ExaminerReportDraft = ({ companyId, onClose }) => {
    const [loading, setLoading]       = useState(true);
    const [company, setCompany]       = useState(null);
    const [shareholders, setSH]       = useState([]);
    const [directors, setDirs]        = useState([]);
    const [committees, setComms]      = useState([]);
    const [capital, setCapital]       = useState(null);
    const [products, setProducts]     = useState(null);
    const [projections, setProj]      = useState([]);
    const [assumptions, setAssump]    = useState([]);
    const [growth, setGrowth]         = useState(null);
    const [saved, setSaved]           = useState(false);

    // Draft text — persisted per companyId in localStorage
    const draftKey = `rbz_report_draft_${companyId}`;
    const [drafts, setDrafts] = useState(() => {
        try { return JSON.parse(localStorage.getItem(draftKey)) || {}; }
        catch { return {}; }
    });

    const update = useCallback((key, val) => {
        setDrafts(prev => {
            const next = { ...prev, [key]: val };
            localStorage.setItem(draftKey, JSON.stringify(next));
            return next;
        });
        setSaved(false);
    }, [draftKey]);

    const saveDraft = () => {
        localStorage.setItem(draftKey, JSON.stringify(drafts));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    // ── Word document export ──────────────────────────────────
    const downloadAsWord = async () => {
        const D = company?.companyName || 'Institution';
        const licType = company?.licenseType?.toUpperCase().replace(' MICROFINANCE', '') || 'CREDIT-ONLY';
        const totalSHP  = shareholders.reduce((s, sh) => s + (parseFloat(sh.percentageOwnership || sh.ownershipPercentage) || 0), 0);
        const totalAmt2 = shareholders.reduce((s, sh) => s + (parseFloat(sh.amountPaid) || 0), 0);
        const totalShrs2 = shareholders.reduce((s, sh) => s + (parseInt(sh.numberOfShares) || 0), 0);

        const getDraft = (key, def = '') => (drafts[key] !== undefined ? drafts[key] : def);

        // ── docx helpers ──
        const hdrCell = (text) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(text ?? ''), bold: true, size: 20 })] })],
            shading: { fill: 'D9D9D9', type: ShadingType.CLEAR, color: 'auto' },
        });
        const dataCell = (text) => new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: String(text ?? '—'), size: 20 })] })],
        });
        const makeTable = (headers, rows) => new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: headers.map(h => hdrCell(h)) }),
                ...rows.map(row => new TableRow({ children: row.map(c => dataCell(c)) })),
            ],
        });
        const bp = (text, bold = false) => new Paragraph({
            children: [new TextRun({ text: String(text || ''), bold, size: 24 })],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 100 },
        });
        const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });
        const sectionHead = (num, title) => new Paragraph({
            children: [new TextRun({ text: `${num ? num + '   ' : ''}${title}`, bold: true, size: 24, allCaps: true })],
            border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 400, after: 120 },
        });
        const subhead = (title) => new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 22 })],
            spacing: { before: 200, after: 80 },
        });
        const tableLabel = (text) => new Paragraph({
            children: [new TextRun({ text, bold: true, size: 21 })],
            spacing: { after: 80 },
        });
        const coverPairs = (pairs) => pairs.flatMap(([label, value]) => [
            new Paragraph({ children: [new TextRun({ text: label, bold: true, allCaps: true, size: 21 })], spacing: { after: 40 } }),
            new Paragraph({ children: [new TextRun({ text: value || '—', size: 21 })], spacing: { after: 160 } }),
        ]);

        const children = [
            // ── Title ──
            new Paragraph({
                children: [new TextRun({ text: 'MEMORANDUM', bold: true, size: 32 })],
                alignment: AlignmentType.CENTER, spacing: { after: 120 },
            }),
            new Paragraph({
                children: [new TextRun({ text: D.toUpperCase(), bold: true, size: 28 })],
                alignment: AlignmentType.CENTER, spacing: { after: 80 },
            }),
            new Paragraph({
                children: [new TextRun({ text: `APPLICATION FOR A ${licType} MICROFINANCE LICENCE`, bold: true, size: 24 })],
                alignment: AlignmentType.CENTER, spacing: { after: 320 },
            }),

            // ── Cover block ──
            ...coverPairs([
                ['OFFICES', company?.physicalAddress],
                ['BANKERS', company?.bankers],
                ['LAWYERS', company?.lawyers],
            ]),

            // Shareholders mini table
            ...(shareholders.length > 0 ? [
                new Paragraph({ children: [new TextRun({ text: 'SHAREHOLDERS', bold: true, allCaps: true, size: 21 })], spacing: { after: 80 } }),
                new Table({
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [hdrCell("Shareholder's Name"), hdrCell('Ownership (%)')] }),
                        ...shareholders.map(s => new TableRow({ children: [
                            dataCell(s.shareholderName || s.fullName || '—'),
                            dataCell(`${s.percentageOwnership || s.ownershipPercentage || '—'}%`),
                        ]})),
                        new TableRow({ children: [hdrCell('Total'), hdrCell(`${fmt(totalSHP, 0)}%`)] }),
                    ],
                }),
                gap(),
            ] : []),

            ...coverPairs([
                ['CHIEF EXECUTIVE OFFICER', company?.chiefExecutiveOfficer],
                ['COMPANY REGISTRATION NUMBER', company?.registrationNumber],
                ['CONTACT TELEPHONE NUMBERS', company?.contactTelephone],
                ['E-MAIL ADDRESS', company?.emailAddress],
            ]),

            // ── BACKGROUND ──
            sectionHead('', 'BACKGROUND'),
            bp(`${D} was incorporated in terms of the Companies and Other Business Entities Act [Chapter 24:31] on ${getDraft('bg_incorp_date', company?.incorporationDate ? String(company.incorporationDate) : '[incorporation date]')}.`),
            bp(`${D} intends to operate from its head office ${company?.physicalAddress || '[address]'}.`),
            bp(`The institution applied for a ${licType.toLowerCase()} microfinance licence on ${getDraft('bg_app_date', company?.applicationDate ? String(company.applicationDate) : '[application date]')}.${company?.applicationFee ? ` Application fee of US$${company.applicationFee} was paid on ${company?.applicationFeePaymentDate || '[date]'}.` : ''}`),

            // ── 1. OWNERSHIP ──
            sectionHead('1', 'OWNERSHIP'),
            subhead('Shareholding Structure'),
            bp("The institution's shareholding structure is shown in Table 1 as reflected on the Subscribers' Clause of the Memorandum of Association."),
            tableLabel('Table 1: Shareholding Structure'),
            makeTable(
                ["Shareholder's Name", 'Number of Shares', 'Amount Paid (US$)', 'Ownership (%)', 'Net Worth (US$)'],
                [
                    ...shareholders.map(s => [
                        s.shareholderName || s.fullName || '—',
                        s.numberOfShares ? parseInt(s.numberOfShares).toLocaleString() : '—',
                        s.amountPaid ? fmt(s.amountPaid) : '—',
                        s.percentageOwnership || s.ownershipPercentage ? `${s.percentageOwnership || s.ownershipPercentage}%` : '—',
                        s.netWorthAmount ? `$${fmt(s.netWorthAmount)}` : (s.verifiedNetWorthStatus || '—'),
                    ]),
                    ['Total', totalShrs2.toLocaleString(), fmt(totalAmt2), `${fmt(totalSHP, 0)}%`, '—'],
                ]
            ),
            gap(),
            bp(getDraft('own_compliance', `The shareholding structure complies with section 34(1) of the Microfinance Act [Chapter 24:29] as read in conjunction with section 26(1)(b)(ii) of the Microfinance (General) Regulations SI 85/2025, which limits the maximum shareholding per shareholder of a microfinance institution at 50%.`)),
            bp(getDraft('own_fitness', 'Fitness and probity assessment for directors and senior management is pending.')),
            bp(getDraft('own_ubo', `Each shareholder submitted a Shareholders Affidavit declaring the ultimate beneficial ownership (UBOs) and attesting that the sources of funds and wealth were not from money laundering activities, fraud or illicit dealings and that they were complying with AML/CFT/CPF requirements. In addition, the shareholders were screened against the UN Sanctions List and media reporting.`)),
            bp(getDraft('own_capital', `${D} submitted confirmation of respective capital contributions. The submissions are complete and in line with regulatory requirements.`)),

            // ── 2. CAPITAL STRUCTURE ──
            sectionHead('2', 'CAPITAL STRUCTURE'),
            bp(`${D} capital structure is shown in Table 2:`),
            tableLabel('Table 2: Capital Structure'),
            makeTable(
                ['Item', 'Value'],
                [
                    ['Number of Authorized Shares', capital?.numberOfAuthorisedShares ? parseInt(capital.numberOfAuthorisedShares).toLocaleString() : '—'],
                    ['Number of Issued Shares', capital?.totalIssuedShares ? parseInt(capital.totalIssuedShares).toLocaleString() : '—'],
                    ['Par Value per Share', capital?.parValuePerShare ? `$${capital.parValuePerShare}` : '—'],
                    ['Total Issued Share Capital', capital?.issuedShareCapitalAtParValue ? `US$${fmt(capital.issuedShareCapitalAtParValue)}` : '—'],
                    ['Share Premium', capital?.sharePremium ? `$${fmt(capital.sharePremium)}` : '—'],
                    ['Total Issued and Paid-Up Capital', capital?.totalIssuedAndPaidUpCapital ? `US$${fmt(capital.totalIssuedAndPaidUpCapital)}` : '—'],
                    ['Retained Earnings — Current Year', capital?.retainedEarningsCurrentYear ? `$${fmt(capital.retainedEarningsCurrentYear)}` : '—'],
                    ['Retained Earnings — Prior Years', capital?.retainedEarningsPriorYears ? `$${fmt(capital.retainedEarningsPriorYears)}` : '—'],
                    ["Total Shareholders' Equity", capital?.totalShareholdersEquity ? `$${fmt(capital.totalShareholdersEquity)}` : '—'],
                ]
            ),
            gap(),
            bp(getDraft('cap_compliance', `${D} capital was compliant with the minimum capital requirements of US$25,000 for credit-only microfinance institutions.`)),

            // ── 3. CORPORATE GOVERNANCE ──
            sectionHead('3', 'CORPORATE GOVERNANCE'),
            subhead('Board and Senior Management'),
            bp(getDraft('gov_board_intro', `The institution has a ${directors.length}-member board. The qualifications and experience of the board and senior management is shown in Table 3.`)),
            tableLabel('Table 3: Board of Directors and Senior Management'),
            makeTable(
                ['Name', 'Qualifications', 'Experience', 'Other Directorships'],
                directors.length > 0
                    ? directors.map(d => [
                        `${d.fullName}${d.dateOfBirth ? ` (D.O.B: ${d.dateOfBirth})` : ''}${d.designation ? ` — ${d.designation}` : ''}`,
                        d.qualifications || '—',
                        d.experience || '—',
                        d.otherDirectorships || 'None',
                    ])
                    : [['No director records submitted.', '', '', '']]
            ),
            gap(),

            // Committees
            ...(committees.length > 0 ? [
                subhead('Board Committees'),
                bp(getDraft('gov_committees_intro', 'The institution submitted its Board Committees with clear terms of reference which are properly constituted.')),
                tableLabel('Table 4: Board Committees'),
                makeTable(
                    ['Committee', 'Members', 'Terms of Reference'],
                    committees.map(c => [
                        c.committeeName || '—',
                        c.committeeComposition || '—',
                        c.termsOfReference || c.assessmentComments || '—',
                    ])
                ),
                gap(),
                bp(getDraft('gov_committees_assess', "The institution's Board Committees are properly constituted. The terms of reference are in line with the functions assigned to the Committees by section 40 of the Banking Act [Chapter 24:20].")),
            ] : []),

            // ── 4. PROSPECTS OF VIABILITY ──
            sectionHead('4', 'PROSPECTS OF VIABILITY'),
            subhead('Products and Services / Activities'),
            bp(getDraft('pv_products', products?.productsAndServicesDescription || 'The following are the main loan products to be offered by the institution.')),
            ...(products?.targetMarketDescription ? [bp(getDraft('pv_target', `Target Market: ${products.targetMarketDescription}`))] : []),
            subhead('Assumptions and Financial Projections'),

            // Table 5: Assumptions
            ...(assumptions.length > 0 ? [
                bp('The institution submitted assumptions of economic indicators on which financial projections are based.'),
                tableLabel('Table 5: Assumptions'),
                new Table({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [hdrCell('Indicator'), ...assumptions.map((a, i) => hdrCell(a.projectionYear || `Year ${i + 1}`))] }),
                        new TableRow({ children: [dataCell('Inflation Rate (year on year)'), ...assumptions.map(a => dataCell(a.inflationRate != null ? `${a.inflationRate}%` : '—'))] }),
                        new TableRow({ children: [dataCell('GDP Growth Rate'), ...assumptions.map(a => dataCell(a.gdpGrowthRate != null ? `${a.gdpGrowthRate}%` : '—'))] }),
                        ...(assumptions.some(a => a.lendingRate != null) ? [
                            new TableRow({ children: [dataCell('Lending Rate'), ...assumptions.map(a => dataCell(a.lendingRate != null ? `${a.lendingRate}%` : '—'))] }),
                        ] : []),
                    ],
                }),
                gap(),
            ] : []),

            // Table 7: Financial Projections
            ...(projections.length > 0 ? [
                tableLabel(`Table ${assumptions.length > 0 ? '7' : '6'}: Financial Projections`),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        new TableRow({ children: [hdrCell('Indicator'), ...projections.map((p, i) => hdrCell(`(US$) ${p.year || `Year ${i + 1}`}`))] }),
                        ...([
                            ['Total Income',           p => p.totalIncome],
                            ['Total Expenses',         p => p.totalExpenses],
                            ['Tax',                    p => p.tax],
                            ['Net Income',             p => p.netIncome],
                            ['Total Assets',           p => p.totalAssets],
                            ['Total Loans',            p => p.totalLoans],
                            ['Current Liabilities',    p => p.currentLiabilities],
                            ['Total Equity',           p => p.totalEquity],
                            ['Cost/Income Ratio',      p => p.costIncomeRatio != null ? `${p.costIncomeRatio.toFixed(1)}%` : null],
                            ['Return on Assets',       p => p.returnOnAssets != null ? `${p.returnOnAssets.toFixed(1)}%` : null],
                            ['Return on Equity',       p => p.returnOnEquity != null ? `${p.returnOnEquity.toFixed(1)}%` : null],
                        ].map(([label, getter]) => new TableRow({
                            children: [
                                hdrCell(label),
                                ...projections.map(p => {
                                    const v = getter(p);
                                    return dataCell(v != null ? (typeof v === 'string' ? v : fmt(v, 0)) : '—');
                                }),
                            ],
                        }))),
                    ],
                }),
                gap(),
                bp(getDraft('pv_viability_assess', `The institution's operations are expected to be viable with projected net income of USD ${fmt(projections[0]?.netIncome, 0)} in ${projections[0]?.year || 'Year 1'}.`)),
            ] : []),

            // ── 5. MARKETING AND GROWTH STRATEGY ──
            sectionHead('5', 'MARKETING AND GROWTH STRATEGY'),
            bp(getDraft('growth_strategies', growth?.growthStrategies || 'The institution employs the following strategies to gain competitive advantage in the market.')),
            ...(growth?.businessExpansionPlans ? [subhead('Business Expansion Plans'), bp(getDraft('growth_expansion', growth.businessExpansionPlans))] : []),
            ...(growth?.performanceEnhancementStrategies ? [subhead('Performance Enhancement Strategies'), bp(getDraft('growth_performance', growth.performanceEnhancementStrategies))] : []),

            // ── 6. DEVELOPMENTAL VALUE ──
            sectionHead('6', 'DEVELOPMENTAL VALUE'),
            bp(getDraft('dev_value', growth?.developmentalValueSummary || `${D} will play a crucial role towards the developmental value of the Zimbabwean economy.`)),
            ...(growth?.economicBenefits ? [bp(getDraft('dev_economic', growth.economicBenefits))] : []),
            ...(growth?.communityBenefits ? [bp(getDraft('dev_community', growth.communityBenefits))] : []),

            // ── 7. COMPLAINTS HANDLING PROCEDURE ──
            sectionHead('7', 'COMPLAINTS HANDLING PROCEDURE'),
            bp(getDraft('complaints', `${D} submitted a comprehensive Complaints Handling Procedure, which was considered adequate for a credit-only microfinance institution.`)),

            // ── 8. COMPLIANCE ──
            sectionHead('8', 'COMPLIANCE'),
            bp(getDraft('compliance_intro', `The institution submitted a comprehensive Credit Policy which was considered adequate as it incorporates guidance to employees on ensuring compliance with microfinance Core Client Protection Principles (CCPPs). The institution advised that it has put in place the following strategies and systems to ensure compliance with CCPPs.`)),
            tableLabel('Table 8: Core Client Protection Principles Strategies'),
            makeTable(
                ['Core Client Protection Principle', 'Systems and Strategies'],
                [
                    ['Appropriate product design and delivery',    getDraft('ccpp_1', `${D} will ensure its products and delivery channels are designed to avoid harming clients or placing undue financial burden on them.`)],
                    ['Prevention of over-indebtedness',            getDraft('ccpp_2', `${D} will ensure clients repay without becoming over-indebted by carefully assessing their repayment capacity throughout the credit process.`)],
                    ['Transparency',                               getDraft('ccpp_3', `${D} will provide clear, timely, and understandable information to help clients make informed decisions, including details on pricing, terms, and conditions.`)],
                    ['Responsible Pricing',                        getDraft('ccpp_4', `${D} will ensure its pricing, terms, and conditions are fair, reflecting service costs and reasonable margins without exploiting clients.`)],
                    ['Fair and respectful treatment of clients',   getDraft('ccpp_5', `${D} will treat clients fairly and respectfully, without discrimination, with safeguards to prevent aggressive or abusive behaviour.`)],
                    ['Privacy of client data',                     getDraft('ccpp_6', `${D} will respect client data privacy in line with national laws, using personal information only for specified purposes.`)],
                    ['Mechanisms for complaint resolution',        getDraft('ccpp_7', `${D} has timely and effective complaint resolution mechanisms to address client issues and improve its services.`)],
                ]
            ),
            gap(),

            // ── 9. RECOMMENDATIONS ──
            sectionHead('9', 'RECOMMENDATIONS'),
            new Paragraph({
                children: [
                    new TextRun({ text: '9.1   ', bold: true, size: 24 }),
                    new TextRun({ text: `It is recommended that ${D} application for registration as a ${licType.toLowerCase()} microfinance institution be `, size: 24 }),
                    new TextRun({ text: getDraft('rec_outcome', 'approved on condition that they submit the required outstanding information'), size: 24, bold: true }),
                    new TextRun({ text: '.', size: 24 }),
                ],
                alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 },
            }),
            bp(getDraft('rec_justification', '')),
            gap(),

            // Signature blocks
            ...(['Prepared by', 'Reviewed by', 'Recommended by'].map((label, idx) => {
                const key = ['rec_prepared', 'rec_reviewed', 'rec_recommended'][idx];
                return new Paragraph({
                    children: [
                        new TextRun({ text: `${label}:  `, bold: true, size: 22 }),
                        new TextRun({ text: drafts[key] || '___________________________', size: 22 }),
                        new TextRun({ text: '        Signed: _______________', size: 22 }),
                        new TextRun({ text: '        Date: _______________', size: 22 }),
                    ],
                    spacing: { after: 200 },
                });
            })),

            // Approval block
            new Paragraph({
                children: [new TextRun({ text: 'APPROVAL', bold: true, allCaps: true, size: 24 })],
                border: { top: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { before: 320, after: 160 },
            }),
            new Paragraph({ children: [new TextRun({ text: getDraft('approval_decision', 'Approved / Not Approved'), bold: true, size: 24 })], spacing: { after: 280 } }),
            new Paragraph({ children: [new TextRun({ text: getDraft('registrar_name', '________________________'), size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: 'Registrar of Microfinance Institutions', italics: true, size: 20, color: '555555' })], spacing: { after: 120 } }),
            new Paragraph({
                children: [
                    new TextRun({ text: 'Signature: ___________________________', size: 22 }),
                    new TextRun({ text: '        Date: ___________________________', size: 22 }),
                ],
            }),
        ];

        const doc = new Document({
            sections: [{
                properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
                children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const safeName = D.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'MFI';
        saveAs(blob, `${safeName}_MFI_Report.docx`);
    };

    // ── Load all data ──────────────────────────────────
    useEffect(() => {
        if (!companyId) return;
        (async () => {
            setLoading(true);
            const [co, sh, dir, com, cap, prod, proj, assump, gr] = await Promise.allSettled([
                getCompanyProfile(companyId),
                getShareholdingStructure(companyId),
                getDirectors(companyId),
                getBoardCommittees(companyId),
                getCapitalStructure(companyId),
                getProductsAndServices(companyId),
                getFinancialProjections(companyId),
                getFinancialAssumptions(companyId),
                getGrowthAndDevelopment(companyId),
            ]);
            if (co.status === 'fulfilled')     setCompany(co.value.data);
            if (sh.status === 'fulfilled')     setSH(sh.value?.data?.shareholders || sh.value?.data || []);
            if (dir.status === 'fulfilled')    setDirs(dir.value.data || []);
            if (com.status === 'fulfilled')    setComms(com.value.data || []);
            if (cap.status === 'fulfilled')    setCapital(cap.value.data);
            if (prod.status === 'fulfilled')   setProducts(prod.value.data);
            if (proj.status === 'fulfilled')   setProj(proj.value.data || []);
            if (assump.status === 'fulfilled') setAssump(assump.value.data || []);
            if (gr.status === 'fulfilled')     setGrowth(gr.value.data);
            setLoading(false);
        })();
    }, [companyId]);

    const handlePrint = () => {
        const el = document.getElementById('rbz-report-body');
        const win = window.open('', '_blank', 'width=900,height=700');
        win.document.write(`
            <html><head><title>MFI Report — ${company?.companyName || ''}</title>
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 12pt; margin: 60px 80px; color: #000; line-height: 1.8; }
                h1,h2 { text-align: center; text-transform: uppercase; }
                table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10.5pt; }
                th,td { border: 1px solid #000; padding: 5px 8px; text-align: left; vertical-align: top; }
                th { background: #d9d9d9; font-weight: bold; }
                p { margin: 8px 0; text-align: justify; }
                .section-heading { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 32px; margin-bottom: 10px; }
                @media print { body { margin: 20mm; } }
            </style></head><body>`);
        win.document.write(el.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    if (loading) {
        return (
            <div style={overlay}>
                <div style={{ textAlign: 'center', color: '#fff', marginTop: '40vh' }}>
                    <Spinner animation="border" style={{ width: '3rem', height: '3rem' }} />
                    <p className="mt-3 fw-semibold">Loading report data…</p>
                </div>
            </div>
        );
    }

    const licType = company?.licenseType?.toUpperCase().replace(' MICROFINANCE', '') || 'CREDIT-ONLY';
    const totalSH = shareholders.reduce((s, sh) => s + (parseFloat(sh.percentageOwnership || sh.ownershipPercentage) || 0), 0);
    const totalAmt = shareholders.reduce((s, sh) => s + (parseFloat(sh.amountPaid) || 0), 0);
    const totalShrs = shareholders.reduce((s, sh) => s + (parseInt(sh.numberOfShares) || 0), 0);

    return (
        <div style={overlay}>
            {/* ── Top controls ── */}
            <div style={topBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src="/rbz-logo.png" alt="RBZ" style={{ height: '38px', background: 'white', padding: '4px', borderRadius: '4px' }} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Report Draft</div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{company?.companyName} — Editable preview</div>
                    </div>
                    {saved && <Badge bg="success" style={{ fontSize: '0.72rem' }}>✓ Saved</Badge>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={saveDraft} style={btnSecondary}>💾 Save Draft</button>
                    <button onClick={downloadAsWord} style={btnWord}>⬇ Word Doc</button>
                    <button onClick={handlePrint} style={btnPrimary}>🖨 Print / PDF</button>
                    <button onClick={onClose} style={btnClose}>✕ Close</button>
                </div>
            </div>

            {/* ── Tip bar ── */}
            <div style={{ background: '#fffbe6', borderBottom: '1px solid #f0d060', padding: '7px 32px', fontSize: '0.78rem', color: '#7a5800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✏️</span>
                <span>Click any <span style={{ borderBottom: '1px dashed #c0a030', cursor: 'text' }}>underlined text</span> to edit it. Tables and cover details are auto-filled from the application data. Use <strong>Save Draft</strong> to preserve your edits.</span>
            </div>

            {/* ── Report body ── */}
            <div style={bodyWrap}>
                <div id="rbz-report-body" style={reportPage}>

                    {/* MEMORANDUM TITLE */}
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16pt', marginBottom: '6px', fontFamily: 'Times New Roman, serif' }}>MEMORANDUM</div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>
                        {company?.companyName?.toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: '30px', fontFamily: 'Times New Roman, serif' }}>
                        APPLICATION FOR A {licType} MICROFINANCE LICENCE
                    </div>

                    {/* COVER BLOCK */}
                    <CoverRow label="OFFICES" value={company?.physicalAddress} />
                    <CoverRow label="BANKERS" value={company?.bankers} />
                    <CoverRow label="LAWYERS" value={company?.lawyers} />

                    {/* Shareholders mini table */}
                    {shareholders.length > 0 && (
                        <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '10.5pt', fontFamily: 'Times New Roman, serif', marginBottom: '6px' }}>SHAREHOLDERS</div>
                            <table style={{ ...T.table, width: '55%' }}>
                                <thead>
                                    <tr>
                                        <th style={T.th}>Shareholder's Name</th>
                                        <th style={T.th}>Ownership</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shareholders.map((s, i) => (
                                        <tr key={i}>
                                            <td style={T.td}>{s.shareholderName || s.fullName || '—'}</td>
                                            <td style={T.td}>{s.percentageOwnership || s.ownershipPercentage ? `${s.percentageOwnership || s.ownershipPercentage}%` : '—'}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <th style={T.th}>Total</th>
                                        <th style={T.th}>{fmt(totalSH, 0)}%</th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <CoverRow label="CHIEF EXECUTIVE OFFICER" value={company?.chiefExecutiveOfficer} />
                    <CoverRow label="COMPANY REGISTRATION NUMBER" value={company?.registrationNumber} />
                    <CoverRow label="CONTACT TELEPHONE NUMBERS" value={company?.contactTelephone} />
                    <CoverRow label="E-MAIL ADDRESS" value={company?.emailAddress} />

                    {/* ── BACKGROUND ── */}
                    <SectionHeading title="BACKGROUND" />

                    <p style={para}>
                        {company?.companyName} was incorporated in terms of the Companies and Other Business Entities Act [Chapter 24:31] on{' '}
                        <EditableText value={drafts['bg_incorp_date'] || (company?.incorporationDate ? String(company.incorporationDate) : '')} onChange={v => update('bg_incorp_date', v)} placeholder="[incorporation date]" />.
                    </p>
                    <p style={para}>
                        {company?.companyName} intends to operate from its head office{' '}
                        {company?.physicalAddress || '[address]'}.
                    </p>
                    <p style={para}>
                        The institution applied for a {licType.toLowerCase()} microfinance licence on{' '}
                        <EditableText value={drafts['bg_app_date'] || (company?.applicationDate ? String(company.applicationDate) : '')} onChange={v => update('bg_app_date', v)} placeholder="[application date]" />.
                        {company?.applicationFee && <> Application fee of US${company.applicationFee} was paid on {company?.applicationFeePaymentDate || '[date]'}.</>}
                    </p>

                    {/* ── OWNERSHIP ── */}
                    <SectionHeading num="1" title="OWNERSHIP" />
                    <SubHeading title="Shareholding Structure" />
                    <p style={para}>The institution's shareholding structure is shown in Table 1 as reflected on the Subscribers' Clause of the Memorandum of Association.</p>

                    <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 1: Shareholding Structure</div>
                    <table style={T.table}>
                        <thead>
                            <tr>
                                <th style={T.th}>Shareholder's Name</th>
                                <th style={T.th}>Number of Shares</th>
                                <th style={T.th}>Amount Paid (US$)</th>
                                <th style={T.th}>Ownership (%)</th>
                                <th style={T.th}>Net Worth (US$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shareholders.map((s, i) => (
                                <tr key={i}>
                                    <td style={T.td}>{s.shareholderName || s.fullName || '—'}</td>
                                    <td style={T.td}>{s.numberOfShares ? parseInt(s.numberOfShares).toLocaleString() : '—'}</td>
                                    <td style={T.td}>{s.amountPaid ? fmt(s.amountPaid) : '—'}</td>
                                    <td style={T.td}>{s.percentageOwnership || s.ownershipPercentage ? `${s.percentageOwnership || s.ownershipPercentage}%` : '—'}</td>
                                    <td style={T.td}>{s.verifiedNetWorthStatus || s.netWorthAmount ? (s.netWorthAmount ? `$${fmt(s.netWorthAmount)}` : s.verifiedNetWorthStatus) : '—'}</td>
                                </tr>
                            ))}
                            <tr>
                                <th style={T.th}>Total</th>
                                <th style={T.th}>{totalShrs.toLocaleString()}</th>
                                <th style={T.th}>{fmt(totalAmt)}</th>
                                <th style={T.th}>{fmt(totalSH, 0)}%</th>
                                <th style={T.th}>—</th>
                            </tr>
                        </tbody>
                    </table>

                    <EditablePara draftKey="own_compliance" drafts={drafts} update={update}
                        defaultText={`The shareholding structure complies with section 34(1) of the Microfinance Act [Chapter 24:29] as read in conjunction with section 26(1)(b)(ii) of the Microfinance (General) Regulations SI 85/2025, which limits the maximum shareholding per shareholder of a microfinance institution at 50%.`}
                    />
                    <EditablePara draftKey="own_fitness" drafts={drafts} update={update}
                        defaultText="Fitness and probity assessment for directors and senior management is pending."
                    />
                    <EditablePara draftKey="own_ubo" drafts={drafts} update={update}
                        defaultText={`Each shareholder submitted a Shareholders Affidavit declaring the ultimate beneficial ownership (UBOs) and attesting that the sources of funds and wealth were not from money laundering activities, fraud or illicit dealings and that they were complying with AML/CFT/CPF requirements. In addition, the shareholders were screened against the UN Sanctions List and media reporting.`}
                    />
                    <EditablePara draftKey="own_capital" drafts={drafts} update={update}
                        defaultText={`${company?.companyName || 'The institution'} submitted confirmation of respective capital contributions. The submissions are complete and in line with regulatory requirements.`}
                    />

                    {/* ── CAPITAL STRUCTURE ── */}
                    <SectionHeading num="2" title="CAPITAL STRUCTURE" />
                    <p style={para}>{company?.companyName} capital structure is shown in Table 2:</p>

                    <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 2: Capital Structure</div>
                    <table style={{ ...T.table, width: '60%' }}>
                        <tbody>
                            {[
                                ['Number of Authorized Shares', capital?.numberOfAuthorisedShares ? parseInt(capital.numberOfAuthorisedShares).toLocaleString() : '—'],
                                ['Number of Issued Shares', capital?.totalIssuedShares ? parseInt(capital.totalIssuedShares).toLocaleString() : '—'],
                                ['Par Value per Share', capital?.parValuePerShare ? `$${capital.parValuePerShare}` : '—'],
                                ['Total Issued Share Capital', capital?.issuedShareCapitalAtParValue ? `US$${fmt(capital.issuedShareCapitalAtParValue)}` : '—'],
                                ['Share Premium', capital?.sharePremium ? `$${fmt(capital.sharePremium)}` : '—'],
                                ['Total Issued and Paid-Up Capital', capital?.totalIssuedAndPaidUpCapital ? `US$${fmt(capital.totalIssuedAndPaidUpCapital)}` : '—'],
                                ['Retained Earnings — Current Year', capital?.retainedEarningsCurrentYear ? `$${fmt(capital.retainedEarningsCurrentYear)}` : '—'],
                                ['Retained Earnings — Prior Years', capital?.retainedEarningsPriorYears ? `$${fmt(capital.retainedEarningsPriorYears)}` : '—'],
                                ["Total Shareholders' Equity", capital?.totalShareholdersEquity ? `$${fmt(capital.totalShareholdersEquity)}` : '—'],
                            ].map(([lbl, val]) => (
                                <tr key={lbl}>
                                    <th style={{ ...T.td, fontWeight: 'bold', background: '#f5f5f5', width: '60%' }}>{lbl}</th>
                                    <td style={T.td}>{val}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <EditablePara draftKey="cap_compliance" drafts={drafts} update={update}
                        defaultText={`${company?.companyName || 'The institution'} capital was compliant with the minimum capital requirements of US$25,000 for credit-only microfinance institutions.`}
                    />

                    {/* ── CORPORATE GOVERNANCE ── */}
                    <SectionHeading num="3" title="CORPORATE GOVERNANCE" />
                    <SubHeading title="Board and Senior Management" />

                    <EditablePara draftKey="gov_board_intro" drafts={drafts} update={update}
                        defaultText={`The institution has a ${directors.length}-member board. The qualifications and experience of the board and senior management is shown in Table 3.`}
                    />

                    <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 3: Board of Directors and Senior Management</div>
                    <table style={T.table}>
                        <thead>
                            <tr>
                                <th style={{ ...T.th, width: '18%' }}>Name</th>
                                <th style={{ ...T.th, width: '28%' }}>Qualifications</th>
                                <th style={{ ...T.th, width: '34%' }}>Experience</th>
                                <th style={{ ...T.th, width: '20%' }}>Other Directorships</th>
                            </tr>
                        </thead>
                        <tbody>
                            {directors.map((d, i) => (
                                <tr key={i}>
                                    <td style={T.td}>
                                        <strong>{d.fullName}</strong>
                                        {d.dateOfBirth && <div style={{ fontSize: '9pt', color: '#555' }}>(D.O.B: {d.dateOfBirth})</div>}
                                        {d.designation && <div style={{ fontSize: '9pt', fontStyle: 'italic' }}>{d.designation}</div>}
                                    </td>
                                    <td style={{ ...T.td, whiteSpace: 'pre-wrap', fontSize: '9.5pt' }}>{d.qualifications || '—'}</td>
                                    <td style={{ ...T.td, whiteSpace: 'pre-wrap', fontSize: '9.5pt' }}>{d.experience || '—'}</td>
                                    <td style={{ ...T.td, fontSize: '9.5pt' }}>{d.otherDirectorships || 'None'}</td>
                                </tr>
                            ))}
                            {directors.length === 0 && (
                                <tr><td colSpan={4} style={{ ...T.td, color: '#aaa', textAlign: 'center' }}>No director records submitted.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {committees.length > 0 && (
                        <>
                            <SubHeading title="Board Committees" />
                            <EditablePara draftKey="gov_committees_intro" drafts={drafts} update={update}
                                defaultText="The institution submitted its Board Committees with clear terms of reference which are properly constituted."
                            />
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 4: Board Committees</div>
                            <table style={T.table}>
                                <thead>
                                    <tr>
                                        <th style={{ ...T.th, width: '20%' }}>Committee</th>
                                        <th style={{ ...T.th, width: '25%' }}>Members</th>
                                        <th style={{ ...T.th, width: '55%' }}>Terms of Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {committees.map((c, i) => (
                                        <tr key={i}>
                                            <td style={{ ...T.td, fontWeight: 'bold' }}>{c.committeeName}</td>
                                            <td style={{ ...T.td, whiteSpace: 'pre-wrap', fontSize: '9.5pt' }}>{c.committeeComposition || '—'}</td>
                                            <td style={{ ...T.td, whiteSpace: 'pre-wrap', fontSize: '9.5pt' }}>{c.termsOfReference || c.assessmentComments || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <EditablePara draftKey="gov_committees_assess" drafts={drafts} update={update}
                                defaultText="The institution's Board Committees are properly constituted. The terms of reference are in line with the functions assigned to the Committees by section 40 of the Banking Act [Chapter 24:20]."
                            />
                        </>
                    )}

                    {/* ── PROSPECTS OF VIABILITY ── */}
                    <SectionHeading num="4" title="PROSPECTS OF VIABILITY" />
                    <SubHeading title="Products and Services / Activities" />

                    <EditablePara draftKey="pv_products" drafts={drafts} update={update}
                        defaultText={products?.productsAndServicesDescription || 'The following are the main loan products to be offered by the institution.'}
                    />
                    {products?.targetMarketDescription && (
                        <EditablePara draftKey="pv_target" drafts={drafts} update={update}
                            defaultText={`Target Market: ${products.targetMarketDescription}`}
                        />
                    )}

                    <SubHeading title="Assumptions and Financial Projections" />

                    {assumptions.length > 0 && (
                        <>
                            <p style={para}>The institution submitted assumptions of economic indicators on which financial projections are based.</p>
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 5: Assumptions</div>
                            <table style={{ ...T.table, width: '60%' }}>
                                <thead>
                                    <tr>
                                        <th style={T.th}>Indicator</th>
                                        {assumptions.map((a, i) => <th key={i} style={T.th}>{a.projectionYear || `Year ${i + 1}`}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={T.td}>Inflation Rate (year on year)</td>
                                        {assumptions.map((a, i) => <td key={i} style={T.td}>{a.inflationRate != null ? `${a.inflationRate}%` : '—'}</td>)}
                                    </tr>
                                    <tr>
                                        <td style={T.td}>GDP Growth Rate</td>
                                        {assumptions.map((a, i) => <td key={i} style={T.td}>{a.gdpGrowthRate != null ? `${a.gdpGrowthRate}%` : '—'}</td>)}
                                    </tr>
                                    {assumptions.some(a => a.lendingRate != null) && (
                                        <tr>
                                            <td style={T.td}>Lending Rate</td>
                                            {assumptions.map((a, i) => <td key={i} style={T.td}>{a.lendingRate != null ? `${a.lendingRate}%` : '—'}</td>)}
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}

                    {projections.length > 0 && (
                        <>
                            <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', marginTop: '12px', fontFamily: 'Times New Roman, serif' }}>Table {assumptions.length > 0 ? '7' : '6'}: Financial Projections</div>
                            <table style={T.table}>
                                <thead>
                                    <tr>
                                        <th style={T.th}>Indicator</th>
                                        {projections.map((p, i) => <th key={i} style={T.th}>(US$) {p.year || `Year ${i + 1}`}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        ['Total Income', p => p.totalIncome],
                                        ['Total Expenses', p => p.totalExpenses],
                                        ['Tax', p => p.tax],
                                        ['Net Income', p => p.netIncome],
                                        ['Total Assets', p => p.totalAssets],
                                        ['Total Loans', p => p.totalLoans],
                                        ['Current Liabilities (Tax)', p => p.currentLiabilities],
                                        ['Total Equity', p => p.totalEquity],
                                    ].map(([label, getter]) => (
                                        <tr key={label}>
                                            <th style={{ ...T.td, fontWeight: 'bold', background: '#f5f5f5' }}>{label}</th>
                                            {projections.map((p, i) => <td key={i} style={T.td}>{getter(p) != null ? fmt(getter(p), 0) : '—'}</td>)}
                                        </tr>
                                    ))}
                                    <tr>
                                        <th style={{ ...T.td, fontWeight: 'bold', background: '#f5f5f5' }}>Cost/Income Ratio</th>
                                        {projections.map((p, i) => <td key={i} style={T.td}>{p.costIncomeRatio != null ? `${p.costIncomeRatio.toFixed(1)}%` : '—'}</td>)}
                                    </tr>
                                    <tr>
                                        <th style={{ ...T.td, fontWeight: 'bold', background: '#f5f5f5' }}>Return on Assets</th>
                                        {projections.map((p, i) => <td key={i} style={T.td}>{p.returnOnAssets != null ? `${p.returnOnAssets.toFixed(1)}%` : '—'}</td>)}
                                    </tr>
                                    <tr>
                                        <th style={{ ...T.td, fontWeight: 'bold', background: '#f5f5f5' }}>Return on Equity</th>
                                        {projections.map((p, i) => <td key={i} style={T.td}>{p.returnOnEquity != null ? `${p.returnOnEquity.toFixed(1)}%` : '—'}</td>)}
                                    </tr>
                                </tbody>
                            </table>
                            <EditablePara draftKey="pv_viability_assess" drafts={drafts} update={update}
                                defaultText={`The institution's operations are expected to be viable with projected net income of USD ${fmt(projections[0]?.netIncome, 0)} and USD ${fmt(projections[projections.length - 1]?.netIncome, 0)} for ${projections[0]?.year || 'Year 1'} and ${projections[projections.length - 1]?.year || `Year ${projections.length}`} respectively.`}
                            />
                        </>
                    )}

                    {/* ── MARKETING & GROWTH ── */}
                    <SectionHeading num="5" title="MARKETING AND GROWTH STRATEGY" />
                    <EditablePara draftKey="growth_strategies" drafts={drafts} update={update}
                        defaultText={growth?.growthStrategies || 'The institution employs the following strategies to gain competitive advantage in the market.'}
                    />
                    {growth?.businessExpansionPlans && (
                        <>
                            <SubHeading title="Business Expansion Plans" />
                            <EditablePara draftKey="growth_expansion" drafts={drafts} update={update} defaultText={growth.businessExpansionPlans} />
                        </>
                    )}
                    {growth?.performanceEnhancementStrategies && (
                        <>
                            <SubHeading title="Performance Enhancement Strategies" />
                            <EditablePara draftKey="growth_performance" drafts={drafts} update={update} defaultText={growth.performanceEnhancementStrategies} />
                        </>
                    )}

                    {/* ── DEVELOPMENTAL VALUE ── */}
                    <SectionHeading num="6" title="DEVELOPMENTAL VALUE" />
                    <EditablePara draftKey="dev_value" drafts={drafts} update={update}
                        defaultText={growth?.developmentalValueSummary || `${company?.companyName || 'The institution'} will play a crucial role towards the developmental value of the Zimbabwean economy.`}
                    />
                    {growth?.economicBenefits && (
                        <EditablePara draftKey="dev_economic" drafts={drafts} update={update} defaultText={growth.economicBenefits} />
                    )}
                    {growth?.communityBenefits && (
                        <EditablePara draftKey="dev_community" drafts={drafts} update={update} defaultText={growth.communityBenefits} />
                    )}

                    {/* ── COMPLAINTS HANDLING ── */}
                    <SectionHeading num="7" title="COMPLAINTS HANDLING PROCEDURE" />
                    <EditablePara draftKey="complaints" drafts={drafts} update={update}
                        defaultText={`${company?.companyName || 'The institution'} submitted a comprehensive Complaints Handling Procedure, which was considered adequate for a credit-only microfinance institution.`}
                    />

                    {/* ── COMPLIANCE ── */}
                    <SectionHeading num="8" title="COMPLIANCE" />
                    <EditablePara draftKey="compliance_intro" drafts={drafts} update={update}
                        defaultText={`The institution submitted a comprehensive Credit Policy which was considered adequate as it incorporates guidance to employees on ensuring compliance with microfinance Core Client Protection Principles (CCPPs). The institution advised that it has put in place the following strategies and systems to ensure compliance with CCPPs.`}
                    />

                    <div style={{ fontWeight: 'bold', fontSize: '10.5pt', marginBottom: '4px', fontFamily: 'Times New Roman, serif' }}>Table 8: Core Client Protection Principles Strategies</div>
                    <table style={T.table}>
                        <thead>
                            <tr>
                                <th style={{ ...T.th, width: '30%' }}>Core Client Protection Principle</th>
                                <th style={T.th}>Systems and Strategies</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['Appropriate product design and delivery', `ccpp_1`],
                                ['Prevention of over-indebtedness', `ccpp_2`],
                                ['Transparency', `ccpp_3`],
                                ['Responsible Pricing', `ccpp_4`],
                                ['Fair and respectful treatment of clients', `ccpp_5`],
                                ['Privacy of client data', `ccpp_6`],
                                ['Mechanisms for complaint resolution', `ccpp_7`],
                            ].map(([principle, key], i) => {
                                const defaults = [
                                    `${company?.companyName || 'The institution'} will ensure its products and delivery channels are designed to avoid harming clients or placing undue financial burden on them.`,
                                    `${company?.companyName || 'The institution'} will ensure clients repay without becoming over-indebted by carefully assessing their repayment capacity throughout the credit process.`,
                                    `${company?.companyName || 'The institution'} will provide clear, timely, and understandable information to help clients make informed decisions, including details on pricing, terms, and conditions.`,
                                    `${company?.companyName || 'The institution'} will ensure its pricing, terms, and conditions are fair, reflecting service costs and reasonable margins without exploiting clients.`,
                                    `${company?.companyName || 'The institution'} will treat clients fairly and respectfully, without discrimination, with safeguards to prevent aggressive or abusive behaviour.`,
                                    `${company?.companyName || 'The institution'} will respect client data privacy in line with national laws, using personal information only for specified purposes.`,
                                    `${company?.companyName || 'The institution'} has timely and effective complaint resolution mechanisms to address client issues and improve its services.`,
                                ];
                                return (
                                    <tr key={i}>
                                        <td style={{ ...T.td, fontWeight: 'bold' }}>{principle}</td>
                                        <td style={T.td}>
                                            <EditableText
                                                value={drafts[key] !== undefined ? drafts[key] : defaults[i]}
                                                onChange={v => update(key, v)}
                                                placeholder="Click to edit…"
                                                multiline
                                                style={{ display: 'block', width: '100%', fontSize: '10.5pt', fontFamily: 'Times New Roman, serif' }}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* ── RECOMMENDATIONS ── */}
                    <SectionHeading num="9" title="RECOMMENDATIONS" />

                    <p style={para}>
                        <strong>9.1</strong>{' '}It is recommended that {company?.companyName} application for registration as a {licType.toLowerCase()} microfinance institution be{' '}
                        <EditableText value={drafts['rec_outcome'] || 'approved on condition that they submit the required outstanding information'} onChange={v => update('rec_outcome', v)} placeholder="[approved/rejected — add conditions]" />.
                    </p>

                    <EditablePara draftKey="rec_justification" drafts={drafts} update={update}
                        placeholder="Add justification and examiner observations here…"
                    />

                    {/* Signature blocks */}
                    <div style={{ marginTop: '40px' }}>
                        {[
                            ['Prepared by', 'rec_prepared'],
                            ['Reviewed by', 'rec_reviewed'],
                            ['Recommended by', 'rec_recommended'],
                        ].map(([label, key]) => (
                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '18px', fontFamily: 'Times New Roman, serif', fontSize: '11pt' }}>
                                <span style={{ width: '150px' }}>{label}:</span>
                                <EditableText value={drafts[key] || ''} onChange={v => update(key, v)} placeholder="Name & designation" style={{ width: '220px', borderBottom: '1px solid #000' }} />
                                <span style={{ marginLeft: '16px' }}>Signed: _______________</span>
                                <span style={{ marginLeft: '16px' }}>Date: _______________</span>
                            </div>
                        ))}
                    </div>

                    {/* Approval block */}
                    <div style={{ marginTop: '32px', borderTop: '1px solid #000', paddingTop: '16px' }}>
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12pt', marginBottom: '12px', fontFamily: 'Times New Roman, serif' }}>APPROVAL</div>
                        <p style={{ ...para, fontWeight: 'bold' }}>
                            <EditableText value={drafts['approval_decision'] || 'Approved / Not Approved'} onChange={v => update('approval_decision', v)} placeholder="Approved / Not Approved" />
                        </p>
                        <div style={{ marginTop: '30px', fontFamily: 'Times New Roman, serif', fontSize: '11pt' }}>
                            <div><EditableText value={drafts['registrar_name'] || ''} onChange={v => update('registrar_name', v)} placeholder="Registrar's full name" /></div>
                            <div style={{ fontStyle: 'italic', color: '#555', fontSize: '10pt' }}>Registrar of Microfinance Institutions</div>
                            <div style={{ marginTop: '8px', display: 'flex', gap: '32px' }}>
                                <span>Signature: ___________________________</span>
                                <span>Date: ___________________________</span>
                            </div>
                        </div>
                    </div>

                </div>{/* end report page */}
            </div>{/* end body wrap */}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────
const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: '#2a2a2a',
    display: 'flex', flexDirection: 'column',
};
const topBar = {
    background: '#003366', borderBottom: '3px solid #c5a236',
    padding: '10px 24px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    flexShrink: 0,
};
const bodyWrap = {
    flex: 1, overflowY: 'auto',
    padding: '32px',
    display: 'flex', justifyContent: 'center',
};
const reportPage = {
    background: '#fff',
    width: '210mm', minHeight: '297mm',
    padding: '25mm 25mm 30mm 25mm',
    boxShadow: '0 4px 32px rgba(0,0,0,0.35)',
    fontFamily: 'Times New Roman, Times, serif',
    fontSize: '12pt', lineHeight: '1.8', color: '#000',
};
const para = { textAlign: 'justify', lineHeight: '1.8', margin: '8px 0', fontFamily: 'Times New Roman, serif', fontSize: '12pt' };

const btnPrimary = {
    background: '#c5a236', border: 'none', color: '#000',
    padding: '7px 18px', borderRadius: '4px',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
};
const btnWord = {
    background: '#1a6b2e', border: 'none', color: '#fff',
    padding: '7px 18px', borderRadius: '4px',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
};
const btnSecondary = {
    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
    color: '#fff', padding: '7px 18px', borderRadius: '4px',
    fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
};
const btnClose = {
    background: 'rgba(220,53,69,0.8)', border: 'none', color: '#fff',
    padding: '7px 16px', borderRadius: '4px',
    fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
};

export default ExaminerReportDraft;
