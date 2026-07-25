from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai  # legacy - used for document analysis
try:
    from google import genai as new_genai  # new SDK for chat
    from google.genai import types as genai_types
    NEW_SDK_AVAILABLE = True
except ImportError:
    NEW_SDK_AVAILABLE = False
import os
import json
from datetime import datetime
import time
from google.api_core.exceptions import ResourceExhausted
import pypdf
import io
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import sys

load_dotenv()

app = FastAPI(title="RBZ AI Service", version="2.0")

@app.get("/")
def read_root():
    return {"status": "online", "service": "RBZ AI Backend"}

@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return {}

# Allow CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure legacy Gemini (for document analysis)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Configure new SDK client (for chat)
_GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if NEW_SDK_AVAILABLE and _GEMINI_API_KEY and _GEMINI_API_KEY != "your_gemini_api_key_here":
    _new_genai_client = new_genai.Client(api_key=_GEMINI_API_KEY)
else:
    _new_genai_client = None
    print("⚠️  WARNING: GEMINI_API_KEY not set or invalid. Chat will use fallback responses.")

# Configure Local Tesseract OCR (Windows path - Linux will ignore if not found)
try:
    pytesseract.pytesseract.tesseract_cmd = r'C:\Users\chinogs\AppData\Local\Programs\Tesseract-OCR\tesseract.exe'
except:
    pass  # On Linux, tesseract is found in PATH automatically

# ============================================================
# RBZ LICENSING SYSTEM PROMPT - AI Assistant Context
# ============================================================
RBZ_SYSTEM_PROMPT = """
You are the official AI Assistant for the Reserve Bank of Zimbabwe (RBZ) Microfinance Licensing Portal.
Your name is "RBZ Licensing Assistant" and you are a knowledgeable, professional, and friendly guide
for applicants seeking a Microfinance Institution license.

Your role is to:
1. Guide applicants through the licensing application process, stage by stage
2. Answer questions about requirements, documents, and procedures
3. Help them understand what each stage requires
4. Clarify RBZ policy and Microfinance Act [Chapter 24:29] requirements
5. Assist when applicants are confused or stuck

STRICT LIMITS ON YOUR ROLE:
- You provide PROCEDURAL GUIDANCE ONLY. You do not make, predict, or promise licensing
  decisions. All licensing decisions rest with the Registrar and the Reserve Bank.
- Never state or imply that an application, document, or applicant "will be approved"
  or "qualifies". Requirements you describe are guidance; the examiner's assessment prevails.
- For legal interpretation, disputes, or case-specific rulings, direct the applicant to
  the application correspondence with their assigned examiner, or to licensing@rbz.zw.
- If you are not certain of a requirement, say so and refer the applicant to their examiner.

=== APPLICATION STAGES OVERVIEW ===
The portal guides applicants through these stages, in order. If the applicant's current
stage name is provided in the message context, always use that — it is authoritative.

Stage 1 - Company Profile:
  - Company name, registration number, incorporation date
  - Physical address, CEO/MD name, contact details
  - License type selection: Credit-Only MFI, Deposit-Taking MFI, or Commercial Bank
  - Bankers, lawyers, and auditors (required for Deposit-Taking)
  - Certificate of Incorporation must be uploaded

Stage 2 - Ownership Structure:
  - Shareholding structure (natural persons and corporate entities)
  - Ultimate beneficial owner declarations
  - CR11 Form (ZIMRA share register)
  - Each shareholder's percentage and number of shares
  - Corporate shareholders must disclose their own member breakdown

Stage 3 - Directors & Governance:
  - Each director/shareholder above 10% must complete a Director Questionnaire (DQ)
  - Required documents per director: Certified ID/Passport, CV/Resume, Affidavit of Net Worth,
    Police Clearance Certificate, Tax Clearance Certificate
  - CVs must follow a standard chronological template with Working History and Education sections
  - Directors must be fit and proper (no fraud, criminal convictions, bankruptcy)
  - Board committees: at least 3 (e.g., Audit, Risk, Credit), minimum 3 members each,
    no director on more than one committee, chairperson designated, Terms of Reference provided
  - Documents are pre-screened automatically; a Bank Examiner makes the final assessment

Stage 4 - Application Form:
  - The formal licence application particulars and declarations
  - Contact person for the application

Stage 5 - Capital Structure:
  - Authorized shares, issued shares, par value
  - Source of capital documentation and proof of capital injection
  - Minimum capital requirements: USD 5,000 (Credit-Only), USD 25,000 (Deposit-Taking)

Stage 6 - Products & Services:
  - Loan products offered (Personal, Business, Agricultural, SME, etc.)
  - Interest rates and all charges must be clearly disclosed (rates are market-determined,
    but must be displayed conspicuously and reflect cost of funds and operations)
  - Target market segments

Stage 7 - Financial Projections:
  - Income statement, balance sheet, and cash flow projections
  - At least 3 distinct years of projections
  - Key assumptions must be stated

Stage 8 - Growth & Development:
  - Growth strategy, branch/rollout plans, market analysis

Stage 9 - Compliance Declaration:
  - Formal declarations of accuracy and regulatory compliance

Stage 10 - Documents Upload:
  - All remaining supporting documents
  - Bank statements (6 months)
  - Audited financial statements
  - Source of funds declarations
  - Each document is automatically pre-screened on upload; wrong or unreadable documents
    are flagged and the applicant is asked to re-upload

Additional stages by institution type:
  - Deposit-Taking MFI: Deposit Protection (DIPF registration, liquidity buffer)
  - Commercial Bank: Capital Adequacy (Basel III), Liquidity Management, IT & Cyber Risk,
    Recovery & Resolution

Final stage - Application Review:
  - The applicant reviews all captured information and submits the application

=== KEY REGULATIONS & REQUIREMENTS ===
- Governed by: Microfinance Act [Chapter 24:29]; banks under the Banking Act [Chapter 24:20]
- Minimum Capital: USD 5,000 (Credit-Only), USD 25,000 (Deposit-Taking)
- Non-executive directors must be the MAJORITY of the board
- All executive directors must reside in Zimbabwe
- No director may serve on more than one board committee
- Tax Clearance must be from ZIMRA and marked as valid/clear
- Police Clearance must be from Zimbabwe Republic Police (ZRP)
- Net Worth Affidavit must be certified by a registered accountant/auditor (CA(Z))
- Affidavit must be witnessed by a Commissioner of Oaths or Police

=== CONTACT & ESCALATION ===
- Email: licensing@rbz.zw
- Phone: +263 242 703000
- Physical: 80 Samora Machel Avenue, Harare, Zimbabwe
- Working hours: Monday-Friday, 8:00 AM - 4:30 PM CAT

Tone: Be professional, precise, and empathetic. Speak plainly - avoid jargon where possible.
If an applicant is frustrated, acknowledge their concern first, then help them.
Always provide actionable guidance, not just descriptions.
Respond only in English.
Keep responses concise but complete (2-5 paragraphs max unless more detail is genuinely needed).

=== RBZ CONSUMER EDUCATION & AWARENESS — MICROFINANCE FAQs ===
(Source: RBZ Consumer Education and Awareness Bulletin – Microfinance Sector)

REGULATORY ARRANGEMENTS:
- Banks and Building Societies: Prudential Supervision by RBZ
- Deposit-Taking Microfinance Institutions (Microfinance Banks): Prudential Supervision by RBZ
- Credit-Only Microfinance Institutions: Non-Prudential Supervision by RBZ
- SACCOs & SEDCO: Ministry of Small and Medium Enterprises and Cooperatives Development

Prudential supervision involves: minimum capital requirements, limits on lending to a single borrower,
restrictions on dividends, liquidity requirements, and standard loan documentation requirements.

Non-prudential supervision involves: registration of lending institutions, enforcing corporate governance
standards, periodic submission of returns, and monitoring to minimize unethical practices.

Q: Why are Microfinance Institutions supervised?
A: To protect depositors, promote fair treatment of customers, ensure interest rates are not excessive,
and prevent abusive debt collection methods.

Q: What are the major differences between Deposit-Taking and Credit-Only microfinance institutions?
A: Deposit-Taking MFIs are authorised to mobilize deposits and are subject to prudential regulation —
the words "Deposit-Taking" appear on their Registration Certificate. Credit-Only MFIs are NOT allowed
to take deposits, are subject to non-prudential regulation, and the words "Credit-Only" appear on their
Registration Certificate.

Q: How do I know that a microfinance institution is properly registered?
A: All MFIs must conspicuously display authenticated copies of their registration certificates at every
place of business. The RBZ publishes the list of registered MFIs and members of the public have the right
to confirm registration status with the Reserve Bank. Deposit taking by institutions NOT legally authorised
to do so is ILLEGAL. Deposits placed in unauthorised institutions are outside regulatory scrutiny and are
NOT protected under the deposit insurance scheme.

Q: What is the role of members of the public in promoting a stable microfinance sector?
A: Members of the public should report to the Reserve Bank or ZRP any MFI contravening laws and
regulations. This enables the RBZ to take immediate corrective action.

Q: Are there set maximum levels of interest rates and charges?
A: Interest rates are market-determined — no specific law caps them. However, MFIs are expected to charge
rates reflecting their cost of funds and operations. By law, all MFIs must display all charges (including
monthly and annual interest rates) conspicuously at every business premise. Customers should compare rates
across institutions to find the best option.

Q: Is it within my rights to know all the terms and conditions of a loan?
A: Yes. MFIs are required by law to explain terms and conditions in a language the customer understands,
and to provide every client with loan documents clearly indicating: the rate of interest, terms of repayment,
collateral required, and all other charges.

Q: Are microfinance institutions allowed to use an asset taken as security for their own purposes?
A: No. Security remains the property of the borrowing customer. MFIs may only hold it as a fallback in
the event of default and must follow legal due process when disposing of pledged security.

Q: If I have a complaint against a microfinance institution what should I do?
A: Step 1 — Lodge the complaint directly with the MFI (they must have internal complaints handling procedures).
Step 2 — If unresolved, escalate to the Registrar of Microfinance Institutions at the Reserve Bank.
Step 3 — Include adequate details and evidence of the MFI's failure to resolve the matter.

Q: What are the risks of investing in pyramid/Ponzi schemes?
A: Pyramid schemes are ILLEGAL. They appear under various names: faith clubs, wealth generation funds,
savings clubs, ponzi schemes, cooperative schemes, rotating clubs. They promise high returns based on
recruiting others. Victims risk losing all their money. Promoters sometimes falsely use names of churches
or famous organizations to appear reputable.

Q: Are there recognised standards for microfinance institutions (Core Client Protection Principles)?
A: Yes. The Microfinance Act [Chapter 24:29] (effective August 2013) includes a code of conduct.
Zimbabwe has adopted the Core Client Protection Principles (CCPPs):
  1. Appropriate Product Design and Delivery: Products must not cause harm to clients.
  2. Prevention of Over-indebtedness: MFIs must assess clients' repayment capacity before lending.
  3. Transparency: MFIs must communicate clear, timely information in a language clients understand.
  4. Responsible Pricing: Pricing must balance affordability for clients and sustainability of the MFI.
  5. Fair and Respectful Treatment of Clients: No discrimination; no abusive staff or agent conduct.
  6. Privacy of Client Data: Client data must be protected per Zimbabwean law.
  7. Mechanisms for Complaint Resolution: MFIs must have timely, responsive complaint resolution systems.
"""

# Conversation history store (in-memory, keyed by session/company ID)
CHAT_SESSIONS = {}

class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    content: str

class ChatRequest(BaseModel):
    message: str
    companyId: Optional[str] = None
    currentStage: Optional[int] = None
    currentStageName: Optional[str] = None
    institutionName: Optional[str] = None
    history: Optional[List[ChatMessage]] = []

class ChatResponse(BaseModel):
    reply: str
    suggestions: Optional[List[str]] = []

@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Interactive AI chatbot for applicants - powered by Gemini"""
    try:
        # Build context prefix for current stage if available. The frontend sends
        # the authoritative stage name; the number alone is only a fallback.
        context_note = ""
        if request.currentStageName:
            context_note = f"[Applicant is on Stage {request.currentStage or '?'}: {request.currentStageName}]"
        elif request.currentStage:
            context_note = f"[Applicant is on Stage {request.currentStage}]"
        if request.institutionName:
            context_note += f" [Institution: {request.institutionName}]"

        final_message = request.message
        if context_note:
            final_message = f"{context_note}\n\nApplicant says: {request.message}"

        reply_text = None

        # --- Try new google-genai SDK ---
        if _new_genai_client:
            try:
                history_contents = []
                for msg in (request.history or []):
                    role = "user" if msg.role == "user" else "model"
                    history_contents.append(
                        genai_types.Content(role=role, parts=[genai_types.Part(text=msg.content)])
                    )
                history_contents.append(
                    genai_types.Content(role="user", parts=[genai_types.Part(text=final_message)])
                )
                response = _new_genai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=history_contents,
                    config=genai_types.GenerateContentConfig(
                        system_instruction=RBZ_SYSTEM_PROMPT,
                        temperature=0.7,
                        max_output_tokens=1024,
                    )
                )
                reply_text = response.text
            except Exception as sdk_err:
                print(f"New SDK error: {sdk_err}")

        # --- Fallback to old SDK ---
        if not reply_text:
            try:
                model = genai.GenerativeModel(
                    model_name="gemini-2.5-flash",
                    system_instruction=RBZ_SYSTEM_PROMPT
                )
                chat_history = [{"role": m.role, "parts": [m.content]} for m in (request.history or [])]
                chat = model.start_chat(history=chat_history)
                resp = generate_content_with_retry(chat, final_message)
                if resp:
                    reply_text = resp.text
            except Exception as legacy_err:
                print(f"Legacy SDK error: {legacy_err}")

        # --- Static fallback ---
        if not reply_text:
            reply_text = get_fallback_response(request.message)

        suggestions = generate_suggestions(request.currentStageName, request.message)
        return ChatResponse(reply=reply_text, suggestions=suggestions)

    except Exception as e:
        print(f"Chat error: {e}")
        fallback = get_fallback_response(request.message)
        return ChatResponse(
            reply=fallback,
            suggestions=["What documents do I need?", "How long does the process take?", "Contact support"]
        )

def generate_suggestions(current_stage_name: Optional[str], user_message: str) -> List[str]:
    """Generate context-aware quick reply suggestions, keyed by wizard stage name."""
    stage_suggestions = {
        "Company Profile": ["What is a Certificate of Incorporation?", "What license type should I choose?", "What address format is required?"],
        "Ownership Structure": ["What is a CR11 form?", "How do I calculate share percentages?", "What is an ultimate beneficial owner?"],
        "Directors & Governance": ["What documents does each director need?", "What format should the CV be in?", "How many board committees are required?"],
        "Application Form": ["Who should be the contact person?", "What declarations are required?", "What happens after I submit?"],
        "Capital Structure": ["What is the minimum capital requirement?", "What is authorized vs issued share capital?", "How do I prove capital injection?"],
        "Products & Services": ["What products can a Credit-Only MFI offer?", "How must interest rates be disclosed?", "What is the target market?"],
        "Financial Projections": ["How many years of projections are needed?", "What financial statements are needed?", "What assumptions should I state?"],
        "Growth & Development": ["What should the growth plan include?", "Do I need a branch rollout plan?", "What market analysis is expected?"],
        "Compliance Declaration": ["What am I declaring here?", "What happens if information is inaccurate?", "Who signs the declaration?"],
        "Documents Upload": ["What bank statements are required?", "Are audited financials required?", "Why was my document flagged?"],
        "Application Review": ["How do I know my application is complete?", "What happens after submission?", "How long does review take?"],
    }

    default_suggestions = [
        "What are the main requirements?",
        "What documents do I need?",
        "How long does this take?"
    ]

    return stage_suggestions.get(current_stage_name or "", default_suggestions)

def generate_content_with_retry(chat_or_model, prompt_or_parts, max_retries=3):
    """Retry wrapper for both chat.send_message and model.generate_content"""
    base_delay = 5
    for attempt in range(max_retries):
        try:
            if hasattr(chat_or_model, 'send_message'):
                return chat_or_model.send_message(prompt_or_parts)
            else:
                return chat_or_model.generate_content(prompt_or_parts)
        except ResourceExhausted:
            if attempt == max_retries - 1:
                raise
            wait_time = base_delay * (attempt + 1)
            print(f"Quota exceeded. Retrying in {wait_time} seconds...")
            time.sleep(wait_time)
    return None

def get_fallback_response(message: str) -> str:
    """Returns a helpful static response when AI is unavailable"""
    message_lower = message.lower()

    if any(w in message_lower for w in ["document", "upload", "file", "certificate"]):
        return "For document uploads, each director requires: a Certified ID/Passport, CV/Resume, Police Clearance Certificate, Tax Clearance Certificate, and an Affidavit of Net Worth certified by an accountant or Commissioner of Oaths. Please ensure all documents are current and clearly legible."

    if any(w in message_lower for w in ["stage", "step", "process", "application"]):
        return "The RBZ licensing process has 9 stages: (1) Company Profile, (2) Ownership Structure, (3) Director Vetting, (4) Board Committees, (5) Products & Services, (6) Business Plan, (7) Financial Projections, (8) Capital Structure, and (9) Document Upload Hub. You must complete each stage in order."

    if any(w in message_lower for w in ["capital", "minimum", "money", "fund"]):
        return "Minimum capital requirements: Credit-Only MFI = USD 5,000. Deposit-Taking MFI = USD 25,000. You will need to provide proof of capital injection through bank statements and a source of funds declaration."

    if any(w in message_lower for w in ["director", "board", "dq"]):
        return "Each Director must complete a Directors Questionnaire (DQ Form). Required supporting documents include: Certified ID/Passport, a CV following the standard chronological template, Police Clearance Certificate, Tax Clearance Certificate, and an Affidavit of Net Worth. Executive directors must reside in Zimbabwe, and non-executive directors must form the majority of the board."

    if any(w in message_lower for w in ["contact", "help", "support", "human", "phone", "email"]):
        return "You can reach the RBZ Bank Supervision Division at: Email: licensing@rbz.zw | Phone: +263 242 703000 | Physical: 80 Samora Machel Avenue, Harare. Working hours are Monday-Friday, 8:00 AM - 4:30 PM CAT."

    return "Thank you for your message. I'm currently experiencing connectivity issues. Our support team is available at licensing@rbz.zw or +263 242 703000 during working hours (Mon-Fri, 8:00 AM - 4:30 PM)."

# (generate_content_with_retry is defined above in the chat section)

class AnalysisResult(BaseModel):
    full_name: str
    date_of_birth: str
    nationality: str
    id_number: str
    qualifications: str
    experience_summary: str
    risk_flag: str

@app.post("/analyze-document", response_model=AnalysisResult)
async def analyze_document(file: UploadFile = File(...)):
    content = await file.read()

    # 1. Extract Text Locally or via Azure
    text = ""
    try:
        pdf_file = io.BytesIO(content)
        reader = pypdf.PdfReader(pdf_file)
        for page in reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
    except Exception:
        pass

    if not text.strip():
        print("--- INFO: No text found in CV. Falling back to Azure Document AI for OCR... ---")
        try:
            from azure.ai.formrecognizer import DocumentAnalysisClient
            from azure.core.credentials import AzureKeyCredential

            ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT", "https://rbzai.cognitiveservices.azure.com/")
            KEY = os.getenv("AZURE_FORM_RECOGNIZER_KEY", "")
            client = DocumentAnalysisClient(ENDPOINT, AzureKeyCredential(KEY))
            poller = client.begin_analyze_document("prebuilt-layout", document=content)
            result = poller.result()

            for page in result.pages:
                for line in page.lines:
                    text += line.content + "\n"
        except Exception as e:
            print(f"--- ERROR: Azure extraction failed for CV: {e} ---")

    text_lower = text.lower()

    # 2. Section Checks (Working History and Education order/presence)
    exp_idx = text_lower.find("experience")
    if exp_idx == -1: exp_idx = text_lower.find("employment")
    if exp_idx == -1: exp_idx = text_lower.find("work history")
    if exp_idx == -1: exp_idx = text_lower.find("working history")

    edu_idx = text_lower.find("education")
    if edu_idx == -1: edu_idx = text_lower.find("qualifications")
    if edu_idx == -1: edu_idx = text_lower.find("academic")

    risk_flag = "False"
    if edu_idx == -1 or exp_idx == -1:
        risk_flag = "True"
        experience_summary = "⚠️ RISK: CV is missing required 'Working History' or 'Education' sections."
        qualifications = "Please ensure the CV follows the standard chronological template with clear sections."
    else:
        # Check order - standard expectation might be Work History then Education or vice versa
        # Extract 600 chars from where 'experience' begins
        qual_end = edu_idx + 400
        exp_end = exp_idx + 800

        qualifications = text[edu_idx:qual_end].replace('\n', ' ').strip() + "..."

        raw_exp = text[exp_idx:exp_end]

        # Try to clean up the raw extracted text into "Year - Position - Company" pseudo lines.
        # We can split by newlines (before replacing them) and filter out short/junk lines.
        # It's an approximation without a heavy NLP model, but looks much cleaner!
        import re
        exp_lines = []
        for line in raw_exp.split('\n'):
            line = line.strip()
            # If line is somewhat substantive (e.g., looks like a job entry or date range)
            if len(line) > 10:
                # Remove repeated whitespaces
                clean_line = re.sub(r'\s+', ' ', line)
                exp_lines.append(f"• {clean_line}")

        if exp_lines:
            experience_summary = "\n".join(exp_lines[:10]) # Keep top 10 lines
        else:
            experience_summary = "Working Experience, Year, Position, Company:\n" + raw_exp.replace('\n', ' ').strip()[:300] + "..."
    fraud_keywords = ["fraud", "convicted", "debarred", "criminal", "insolvent", "bankruptcy"]
    if any(k in text_lower for k in fraud_keywords):
        risk_flag = "True"
        experience_summary = "🚨 FATAL RISK: Detected fraud/criminal related keywords in document! " + experience_summary

    # Fallback to extract basic info
    lines = [L.strip() for L in text.split("\n") if L.strip() and len(L.strip()) > 3]
    full_name = lines[0] if lines else "Unknown Applicant"

    return {
        "full_name": full_name[:100],
        "date_of_birth": "Not automatically extracted",
        "nationality": "Extracted from ID phase",
        "id_number": "Matched against profile",
        "qualifications": qualifications,
        "experience_summary": experience_summary,
        "risk_flag": risk_flag
    }


# ============================================================
# STRUCTURED EXTRACTION VIA GEMINI (per company-document type)
# ============================================================
# Per-doc-type prompt that instructs Gemini to return strict JSON. The schema
# matches the field names used by DocumentExtractionService.parse* on the Java
# side, so the response can be passed straight through with minimal mapping.
EXTRACTION_PROMPTS = {
    "financial_statements": """You are extracting structured data from audited
financial statements for a Microfinance Institution applying for a Reserve Bank
of Zimbabwe (RBZ) licence. The applicant institution is "{entity}".

Return a JSON object EXACTLY matching this shape (use null for missing values):
{{
  "capitalStructure": {{
    "totalIssuedAndPaidUpCapital": number_in_USD_or_null,
    "totalShareholdersEquity": number_in_USD_or_null,
    "retainedEarningsCurrentYear": number_in_USD_or_null,
    "numberOfAuthorisedShares": int_or_null,
    "totalIssuedShares": int_or_null,
    "parValuePerShare": number_or_null
  }},
  "financialPerformance": [
    {{
      "financialYear": int (e.g. 2024),
      "periodType": "ACTUAL",
      "audited": "YES" | "NO",
      "totalIncome": number_or_null,
      "totalCost": number_or_null,
      "profitAfterTax": number_or_null,
      "totalAssets": number_or_null,
      "totalEquity": number_or_null,
      "parRatio": number_or_null,
      "returnOnEquity": number_or_null,
      "returnOnAssets": number_or_null
    }}
  ],
  "valid": true_if_clearly_audited_financial_statements_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",

    "business_plan": """You are extracting structured data from a strategic
business plan for a Microfinance Institution applying for an RBZ licence. The
applicant institution is "{entity}".

Return JSON EXACTLY matching this shape (use null for missing values):
{{
  "products": {{
    "targetMarketDescription": string_or_null,
    "productsAndServicesDescription": string_or_null,
    "minimumLoanSize": number_or_null,
    "maximumLoanSize": number_or_null,
    "interestRatePerMonth": number_or_null
  }},
  "growth": {{
    "growthStrategies": string_or_null,
    "businessExpansionPlans": string_or_null,
    "developmentalValueSummary": string_or_null
  }},
  "assumptions": {{
    "inflationRate": number_or_null,
    "lendingRate": number_or_null,
    "gdpGrowthRate": number_or_null,
    "expectedLoanGrowthRate": number_or_null
  }},
  "valid": true_if_clearly_a_business_plan_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",

    "portfolio_report": """You are extracting a loan portfolio breakdown from a
Microfinance Institution's portfolio report.

Return JSON EXACTLY matching this shape:
{{
  "loanDistribution": [
    {{"purpose": "Retail" | "Consumption" | "Agriculture" | "SME" | "Housing" | "Other",
      "numberOfClients": int_or_null,
      "amount": number_or_null,
      "percentageContribution": number_or_null}}
  ],
  "valid": true_if_recognisable_portfolio_report_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",

    "tax_clearance": """You are extracting fields from a Zimbabwe Revenue
Authority (ZIMRA) tax clearance certificate.

Return JSON EXACTLY matching this shape:
{{
  "extracted_data": {{
    "certificate_number": string_or_null,
    "issue_date": "YYYY-MM-DD" or null,
    "expiry_date": "YYYY-MM-DD" or null,
    "tax_status": "CLEAR" | "OUTSTANDING" | null
  }},
  "valid": true_if_authentic_zimra_tax_clearance_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",

    "policy_verification": """You are checking whether this document is a credit
or operational policy manual for a microfinance institution. Look for sections
on lending criteria, risk management, client protection, complaints handling,
code of conduct.

Return JSON EXACTLY matching this shape:
{{
  "missing_sections": [string],
  "assessment": "short summary, suitable for examiner notes",
  "valid": true_if_recognisable_policy_manual_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",

    "insurance_policy": """You are extracting fields from a credit insurance
policy.

Return JSON EXACTLY matching this shape:
{{
  "coverage": string_or_null,
  "policy_number": string_or_null,
  "expiry_date": "YYYY-MM-DD" or null,
  "premium": number_or_null,
  "valid": true_if_recognisable_credit_insurance_policy_else_false,
  "reason": "short_human_explanation",
  "confidence": 0.0_to_1.0
}}

DOCUMENT TEXT:
\"\"\"{text}\"\"\"
""",
}


def gemini_structured_extract(text: str, doc_type: str, entity_name: str):
    """Send extracted document text to Gemini with a per-doc-type JSON-schema
    prompt. Returns the parsed dict on success, or None on failure (caller
    should route to manual review)."""
    prompt_template = EXTRACTION_PROMPTS.get(doc_type)
    if not prompt_template:
        return None
    if not text or len(text.strip()) < 50:
        # Too little text to extract anything meaningful
        return None

    # Cap input length so we don't blow Gemini's context window on huge PDFs.
    safe_text = text[:60000]
    prompt = prompt_template.format(text=safe_text, entity=entity_name or "the applicant")

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.0,
            ),
        )
        raw = (response.text or "").strip()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Sometimes the model wraps JSON in markdown. Try to recover.
            if raw.startswith("```"):
                raw = raw.strip("`")
                if raw.lower().startswith("json"):
                    raw = raw[4:].strip()
                try:
                    return json.loads(raw)
                except json.JSONDecodeError:
                    return None
            return None
    except Exception as e:
        print(f"--- WARNING: Gemini structured extraction failed for {doc_type}: {e} ---")
        return None


@app.post("/verify-document")
async def verify_document(
    file: UploadFile = File(...),
    doc_type: str = Form(...),
    director_name: str = Form(...)
):
    # Normalize doc_type to handle variations (taxClearance -> tax_clearance, netWorth -> net_worth)
    doc_type = doc_type.lower().replace("clearance", "_clearance").replace("worth", "_worth")
    if "affidavit" in doc_type: doc_type = "affidavit"
    if "cr11" in doc_type: doc_type = "cr11_form"
    if "certified" in doc_type and "id" in doc_type: doc_type = "certifiedId"

    try:
        # 1. Read File
        content = await file.read()

        # CHECK FILE SIZE (must align with backend FileSecurityHelper)
        file_size_mb = len(content) / (1024 * 1024)
        MAX_SIZE_MB = 25  # 25 MB limit

        if file_size_mb > MAX_SIZE_MB:
            print(f"--- WARNING: File too large ({file_size_mb:.2f} MB). Max allowed: {MAX_SIZE_MB} MB ---")
            return {
                "valid": False,
                "reason": f"File size ({file_size_mb:.2f} MB) exceeds {MAX_SIZE_MB} MB limit. Please compress or reduce file size.",
                "detected_name": "Unknown"
            }

        print(f"--- INFO: Processing {doc_type} for '{director_name}' (Size: {file_size_mb:.2f} MB) ---")


        # 2. Extract Text (Local)
        text = ""
        try:
            pdf_file = io.BytesIO(content)
            reader = pypdf.PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            return {"valid": False, "reason": "We could not read this file. Please upload a clear, uncorrupted PDF document.", "detected_name": "Unknown"}

        if not text.strip():
            print("--- INFO: No text found (Scanned Document). Falling back to Azure Document AI for OCR... ---")

            # Re-read file cursor
            await file.seek(0)
            content = await file.read()

            from azure.ai.formrecognizer import DocumentAnalysisClient
            from azure.core.credentials import AzureKeyCredential

            ENDPOINT = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT", "https://rbzai.cognitiveservices.azure.com/")
            KEY = os.getenv("AZURE_FORM_RECOGNIZER_KEY", "")

            try:
                client = DocumentAnalysisClient(ENDPOINT, AzureKeyCredential(KEY))
                poller = client.begin_analyze_document("prebuilt-layout", document=content)
                result = poller.result()

                # Extract text using Azure Layout model
                for page in result.pages:
                    for line in page.lines:
                        text += line.content + " "

                print(f"--- INFO: Azure extracted {len(text)} characters ---")
            except Exception as azure_err:
                 error_msg = str(azure_err)
                 print(f"--- ERROR: Azure extraction failed: {azure_err} ---")

                 # SAFETY: Azure quota/size limit must NOT auto-approve. Route to manual review.
                 if "InvalidContentLength" in error_msg or "ResourceExhausted" in error_msg or "429" in error_msg or "too large" in error_msg.lower():
                     print("--- WARNING: Azure quota/size limit hit. Routing to MANUAL_REVIEW (not auto-verified). ---")
                     return {
                         "valid": False,
                         "needs_manual_review": True,
                         "reason": "AI verification unavailable (Azure quota or size limit). Manual examiner review required.",
                         "detected_name": "Unknown"
                     }

                 return {
                     "valid": False,
                     "needs_manual_review": True,
                     "reason": "The document could not be read automatically. It has been referred to an examiner for manual review.",
                     "detected_name": "Unknown"
                 }

        text_lower = text.lower()
        director_name_lower = director_name.lower()

        print(f"--- DEBUG: Verifying '{director_name}' ---")
        print(f"Extracted Text Length: {len(text)}")
        print(f"Extracted Text Preview: {text[:200]}...")

        # Improved Name Matching: Check if ALL parts of the name appear (e.g. "Brighton" AND "Kativhu")
        name_parts = director_name_lower.split()
        has_name = all(part in text_lower for part in name_parts)

        # 3. Apply Rules

        # Company-document types: route to Gemini structured extraction. The
        # extracted fields land directly on the response so the Java side can
        # populate Stage 4-8 entities. If Gemini fails, we route to manual
        # review (NEVER auto-approve).
        STRUCTURED_DOC_TYPES = {
            "financial_statements", "business_plan", "portfolio_report",
            "tax_clearance", "policy_verification", "insurance_policy",
        }
        if doc_type in STRUCTURED_DOC_TYPES:
            extracted = gemini_structured_extract(text, doc_type, director_name)
            if extracted is None:
                return {
                    "valid": False,
                    "needs_manual_review": True,
                    "reason": "AI structured extraction unavailable. Manual examiner review required.",
                    "detected_name": director_name,
                    "confidence": 0.0,
                }
            # Gemini supplied a JSON object — pass it through with the rest of
            # the standard response envelope so Java can read both the verdict
            # and the structured fields.
            response = {
                "valid": bool(extracted.get("valid", False)),
                "reason": extracted.get("reason") or ("Document structured extraction succeeded."
                                                       if extracted.get("valid") else "Could not validate document."),
                "detected_name": director_name,
                "confidence": float(extracted.get("confidence") or 0.0),
            }
            # If the model produced fields but flagged invalid, send to manual review
            # rather than auto-failing — examiner gets the extracted data to vet by hand.
            if not response["valid"]:
                response["needs_manual_review"] = True
            # Carry per-type extracted fields through unchanged.
            for k in ("capitalStructure", "financialPerformance", "products",
                      "growth", "assumptions", "loanDistribution",
                      "extracted_data", "missing_sections", "assessment",
                      "coverage", "policy_number", "expiry_date", "premium"):
                if k in extracted:
                    response[k] = extracted[k]
            return response

        is_valid = False
        reason = "Validation failed."

        if doc_type == "affidavit":
            # Affidavit logic (using improved has_name)
            has_commissioner = "commissioner of oaths" in text_lower or "police" in text_lower or "commissioner" in text_lower

            if has_name and has_commissioner:
                is_valid = True
                reason = "Valid Affidavit: Name and Commissioner found."
            elif not has_name:
                reason = f"Name '{director_name}' not found. Searched for parts: {name_parts}. Document text start: '{text[:50]}...'"
            else:
                reason = "Missing Commissioner of Oaths stamp/text."

        elif doc_type == "net_worth":
            has_auditor = "public accountant" in text_lower or "auditor" in text_lower or "ca(z)" in text_lower

            if has_name and has_auditor:
                is_valid = True
                reason = "Valid Net Worth: Certified by Accountant."
            else:
                reason = "Missing Accountant/Auditor certification."

        elif doc_type == "police_clearance":
            has_police = "zimbabwe republic police" in text_lower or "cid" in text_lower or "police" in text_lower
            # Simple date check is hard with text matching, assuming valid if authority is found for now
            if has_police:
                is_valid = True
                reason = "Valid Police Clearance found."
            else:
                reason = "Not a valid Police Clearance Certificate."

        elif doc_type == "tax_clearance":
            has_zimra = "zimra" in text_lower or "revenue authority" in text_lower
            has_clear = "clear" in text_lower or "valid" in text_lower

            if has_zimra and has_clear:
                is_valid = True
                reason = "Valid ZIMRA Tax Clearance."
            else:
                reason = "Invalid or unclear Tax Certificate."

        elif doc_type == "cr11_form":
            # For CR11, we return a mock structure if we can't parse complex tables locally
            # This keeps the flow working without complex table extraction
            return {
                "shareholders": [
                    {"name": director_name, "shares_count": 0, "address": "Address Extracted from PDF"}
                ],
                "capital_summary": {
                    "nominal_capital": "UNKNOWN",
                    "currency": "USD"
                },
                "verification_status": "Manual Review Required"
            }

        elif doc_type == "certificate_incorporation":
             has_cert = "certificate" in text_lower or "incorporation" in text_lower

             if has_cert:
                 is_valid = True
                 reason = "Valid Certificate of Incorporation found."
             else:
                 reason = "Not a valid Certificate of Incorporation."

        elif doc_type == "certifiedId":
             # Check for certification stamps/text
             has_certified = "certified" in text_lower or "commissioner" in text_lower or "notary" in text_lower
             has_id_markers = "passport" in text_lower or "national id" in text_lower or "identity" in text_lower or "republic" in text_lower

             if has_certified and has_id_markers:
                 is_valid = True
                 reason = "Valid Certified ID/Passport found."
             elif not has_certified:
                 reason = "Missing certification stamp (Commissioner/Notary required)."
             else:
                 reason = "Document does not appear to be an ID or Passport."


        return {
            "valid": is_valid,
            "reason": reason,
            "detected_name": director_name if is_valid else "Unknown"
        }

    except Exception as e:
        print(f"--- ERROR: Verification Failed: {str(e)} ---")

        # SAFETY: AI quota exhaustion must NOT auto-approve. Route to manual review.
        if "429" in str(e) or "ResourceExhausted" in str(e):
             print("--- WARNING: AI quota exhausted. Routing to MANUAL_REVIEW (not auto-verified). ---")
             return {
                 "valid": False,
                 "needs_manual_review": True,
                 "reason": "AI verification unavailable (quota exhausted). Manual examiner review required.",
                 "detected_name": "Unknown"
             }

        # For other errors, still return failure
        print(f"--- ERROR: verify-document failed: {e} ---")
        return {
            "valid": False,
            "needs_manual_review": True,
            "reason": "The document could not be checked automatically. It has been referred to an examiner for manual review.",
            "detected_name": "Unknown"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)