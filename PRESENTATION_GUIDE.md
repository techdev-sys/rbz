# RBZ Licensing System — Presentation Guide

*A walkthrough script for presenting the system live, from account creation to final licence issuance, with a clear explanation of where the "intelligence" sits.*

---

## 0. The 30-second pitch (open with this)

> "This is a digital licensing platform for the Reserve Bank of Zimbabwe's Bank Supervision Division. It replaces a paper/email-based application process with a guided online wizard, an examiner review workspace, and an AI layer that assists — but never replaces — the human examiner. Every AI verdict, every document review, every approval is written into a tamper-evident audit log, so the system produces a defensible regulatory trail, not just a faster one."

Frame the AI story as: **human-in-the-loop now, every examiner decision logged as labelled training data for tomorrow, full automation later.** This is the safest and most accurate way to describe it to regulators — it does not overclaim autonomy the system doesn't have.

---

## 1. The three roles in the system

| Role | Who | What they do |
|---|---|---|
| **Applicant** | The institution applying for a licence (MFI, DTMFI, or Commercial Bank) | Fills in an 11–15 stage wizard, uploads supporting documents, talks to the AI guide, messages their examiner |
| **Bank Examiner** | RBZ staff assigned to review an application | Reviews each stage, verifies/rejects documents, leaves comments, recommends approve/decline |
| **Senior Bank Examiner (Senior BE)** | RBZ senior staff | Creates examiner accounts, assigns applications to examiners, signs off final reports, issues the licence |

There is a fourth conceptual role — **Registrar** — referenced in the sign-off chain for banks, but it is not a separate login today; the Senior BE's dashboard carries that authority in this build.

---

## 2. Account creation — show this live

### 2.1 Applicant side (self-service, public)

1. Go to the public landing page (`/`) — no login required to browse.
2. Click **Register** → pick a licence category (Credit-Only MFI / Deposit-Taking MFI / Commercial Bank). This determines how many stages the wizard will have (11 / 12 / 15 respectively) and which capital, deposit-protection, and Basel III stages get added later.
3. Fill in: company name, licence type, contact person, email, phone. Submitting **creates a `DRAFT` company profile** — this *is* the account; there's no separate "sign up" step, registering an application and creating an applicant account are the same action.
4. From here they set a password and can log back in at `/login` using their registered email.

**Talking point:** registration and application-start are unified on purpose — an applicant doesn't have an account until they've started a real application, which keeps the system free of orphaned dummy accounts.

### 2.2 Examiner side (invite-only, staff portal)

1. Staff never use the public landing page — there's a separate, visually distinct **staff portal** at `/staff-login` (dark theme, explicit legal warning) with zero links from the applicant-facing site. This separation is deliberate: an applicant should never even discover the staff login exists.
2. A **Senior BE** logs in and creates examiner accounts from their dashboard (`POST /api/examiners`) — full name, username, password, email. The system auto-generates a unique employee ID (`EX-2026-001` style).
3. The very first Senior BE account is seeded automatically on first server startup (`admin` / a strong default password, forced to be rotated in production) — so there's always a way in on day one without a hand-run SQL script.

**Talking point:** examiner accounts are provisioned top-down by a Senior BE, not self-registered — this mirrors how access to a real regulatory review function should be granted.

---

## 3. The applicant journey — demo script

Run this live, one institution type only (Credit-Only MFI is the simplest and cleanest demo path):

1. **Register** → land on the wizard.
2. **Stage 1 – Company Profile**: certificate of incorporation, registered address, ZIMRA tax clearance, key contacts.
3. **Stage 2 – Ownership Structure**: shareholders, percentages, ultimate beneficial owners.
4. **Stage 3 – Directors & Governance**: each director's CV, ID, fit & probity declarations.
5. Continue through Capital Structure, Products & Services, Financial Projections, Growth & Development…
6. **Stage 9 – Documents Upload**: the AI verification pipeline runs here (see §4).
7. **Stage 10/11 – Application Review & Submit** → status flips to `SUBMITTED`.

At any point during the wizard, show:
- **The AI assistant bubble (bottom-right)** — ask it a real regulatory question ("What is the minimum capital for a Credit-Only MFI?") and let it answer *with a citation* back to the actual gazetted PDF, page and section number. This is the single best "wow" moment in the demo — it's not a generic chatbot, it's grounded in RBZ's own source documents.
- **The examiner-messaging bubble (bottom-left)** — a completely separate channel for direct human back-and-forth with the assigned examiner, with unread badges.

After submission, switch to the **Applicant Dashboard** (`/applicant`) to show: progress bar, status pill (Submitted → Under Review → Needs Revision / Approved), examiner feedback modal, and — if a document gets rejected later — a prominent amber action card telling them exactly what to fix and a one-click path back into the wizard.

---

## 4. Where the intelligence actually sits

This is the section people will ask about most. Be specific — vague "AI-powered" claims invite skepticism from a regulator audience; concrete mechanics build trust.

### 4.1 The AI assistant (chat)
- Dual-provider: tries **Google Gemini** first, falls back to **Anthropic Claude** if Gemini times out or errors, then falls back to a static "contact licensing@rbz.zw" message if both are unavailable — so a chat outage never looks like a broken page, it degrades gracefully.
- **Retrieval-grounded**: before answering, it retrieves the most relevant excerpts from a curated library of the actual regulatory source documents (Banking Act, RBZ Act, AML/CFT Guideline, Basel III standards, licensing requirement PDFs, etc.) and is instructed to cite the document, section number and page — and explicitly told **not** to invent a citation or answer beyond what the excerpts support. If nothing relevant is retrieved, it says so and directs the applicant to their examiner rather than guessing.
- Context-aware: it knows which wizard stage the applicant is currently on and tailors its default suggested questions accordingly.

### 4.2 Document verification & structured extraction
- When an applicant uploads a document (financial statements, business plan, tax clearance, insurance policy, etc.), the system:
  1. Extracts text locally (or via Azure Document Intelligence OCR if it's a scanned image).
  2. Sends it to Gemini with a **strict per-document-type JSON schema prompt** — e.g. for financial statements, it extracts capital structure, shareholders' equity, retained earnings, share counts, straight into the same field names the Java backend already uses.
  3. The model is asked to self-report whether the document even matches what was expected (`valid: true/false`, plus a `confidence` score and human-readable `reason`) — so a mismatched or fraudulent-looking upload is flagged, not silently accepted.
- **Critical safety rule, worth stating explicitly to a regulator**: if the AI provider is down, over quota, or the extracted confidence is low, the document is routed to **MANUAL_REVIEW** — it is never silently auto-approved. There is no code path where an AI failure results in a document being treated as verified. This was a deliberate design decision, not an accident.

### 4.3 Risk scoring engine
- Every application gets a computed risk score, with **weights that differ by institution type** — because a Credit-Only MFI and a Commercial Bank are not judged on the same criteria:
  - MFI: capital 30%, directors 25%, documents 20%, ownership 15%, business plan 10%.
  - DTMFI: adds a DIPF (deposit protection) dimension, reweights accordingly.
  - Commercial Bank: adds Capital Adequacy Ratio, Liquidity, and IT/Cyber-readiness dimensions (reflecting Basel III obligations banks alone carry).
- Output band: **LOW / MEDIUM / HIGH / CRITICAL** risk, visible to the examiner as a decision aid — never as an auto-decision.

### 4.4 The workflow rules engine
- Each wizard stage has explicit, codified evaluation rules (e.g. for financial projections: must be submitted, must cover ≥3 distinct years, net income should turn positive by year 3, opening equity must meet the statutory minimum capital for that licence type). Some rules are **hard** (block progression) and some are **soft** (flag but allow).
- This is what stops the system from being "a form that saves to a database" — it's actively checking regulatory compliance rules as the applicant progresses, stage by stage.

### 4.5 The learning loop (the forward-looking pitch)
- **Every examiner decision is captured** — every document verdict (accept/reject + reason), every stage review, every approval — as a structured, timestamped event.
- These events are chained together with **SHA-256 hashes**, each entry referencing the hash of the one before it (a private, application-specific hash chain — the same tamper-evidence principle used in blockchains, applied to a regulatory audit log). Anyone tampering with a historical record breaks the chain, and `GET /api/audit/verify-integrity` will detect and report exactly which entry and where.
- **This is the best live-demo moment for the "intelligence" story**: pull up the audit log, run the integrity check live, show it reporting `INTACT`. Explain that this same log is quietly building the labelled dataset (examiner verdict + the AI's original suggestion) that a future phase will use to make the AI verification progressively more autonomous — with human sign-off, not replacement, as the constant.

---

## 5. The examiner journey — demo script

1. Log in at `/staff-login` as an examiner.
2. Dashboard shows a work queue of assigned applications with an **activity column** — last applicant activity, documents awaiting review, last message.
3. Open an application → **stage-by-stage review workspace**: for documents, a split view (list left, live preview right) shows the AI's verdict, its confidence, and its stated reason, alongside Verify / Reject / Manual-review buttons.
4. Reject a document with a comment → show it flip the applicant's status to `NEEDS_REVISION` and immediately appear on their dashboard.
5. Move to the **Senior BE dashboard**: assign an application to an examiner, and on final decision, walk through the **multi-level approval chain** — this is a good spot to explain that a Commercial Bank application requires more sign-off levels (up to Director and Governor sign-off) than a simple MFI, because the underlying regulatory scrutiny is genuinely higher.
6. On approval, a **licence number is auto-generated** (`MFI/2026/003` style) and stamped onto the record — show the applicant dashboard flip to "Licence Active" with a scannable QR-verifiable digital licence card.

---

## 6. Anticipated questions and honest answers

| Question | Answer |
|---|---|
| "What happens if the AI is wrong?" | It never has final say. Every AI verdict is a recommendation the examiner can override; if the AI fails entirely, the document goes to manual review by default — never auto-approved. |
| "What happens if the AI provider goes down / runs out of credits?" | The chat and document pipeline both have provider fallback chains (Gemini → Claude → static message / manual review), so an outage degrades functionality, it doesn't break the workflow. |
| "Can an applicant fake a document past the AI?" | Every upload is hashed (SHA-256) and version-tracked; magic-byte validation checks the file actually is what its extension claims; and any AI-uncertain document routes to a human either way. |
| "Is this replacing examiner judgement?" | No — it's replacing manual paper-shuffling and giving examiners a faster starting point (extracted data, a risk score, a first-pass document check) so they can spend their judgement on substance, not data entry. |
| "How do you know the audit trail hasn't been tampered with?" | The hash-chain integrity check (`/api/audit/verify-integrity`) recomputes every entry's hash from its content and the previous entry's hash — any edit anywhere in history breaks the chain from that point forward, and the check reports exactly where. |
| "What's next after licensing?" | This is Phase 1 of a broader "Regulatory Intelligence" roadmap — licensed institutions will eventually submit periodic returns through the same platform (Phase 2: Operations, Phase 3: Returns), building toward real-time, cross-department supervisory analysis rather than a point-in-time licensing check. |

---

## 7. Suggested run-of-show (timing for a ~15-minute demo)

1. **0:00–1:00** — The 30-second pitch (§0) + role overview (§1).
2. **1:00–3:00** — Account creation: show applicant self-registration, then flip to the staff portal and show Senior BE creating an examiner account.
3. **3:00–8:00** — Applicant journey: register → wizard → ask the AI chatbot a real question with citation → upload a document and show the verification result → submit.
4. **8:00–12:00** — Examiner journey: review the submitted application, reject a document with a comment, show the applicant-side status flip, approve, show licence auto-issuance.
5. **12:00–14:00** — The intelligence deep-dive: risk score breakdown, then the audit-log integrity check live (§4.5) — this is your strongest closing visual.
6. **14:00–15:00** — Close with the roadmap (§6, last row) — licensing today, supervision-wide intelligence tomorrow.

---

## 8. One-line answers to keep in your back pocket

- **"What model powers this?"** — Google Gemini (primary) with Anthropic Claude as automatic fallback; both are swappable without changing the workflow logic.
- **"Is applicant data secure?"** — JWT-authenticated access scoped per company; applicants can only ever see/upload to their own record; staff access is role-gated; passwords are hashed, not stored in plaintext; every login/logout is tracked and tokens are invalidated on logout.
- **"Why different stage counts per institution type?"** — Because the regulatory scrutiny genuinely differs: a Commercial Bank carries Basel III capital adequacy, liquidity, and cyber-risk obligations an MFI does not, so the wizard and risk model are built around real regulatory asymmetry, not one-size-fits-all.
