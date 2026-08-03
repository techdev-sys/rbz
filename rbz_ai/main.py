from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import requests
import os
import json
import asyncio
import pypdf
import io
from dotenv import load_dotenv
import pytesseract
from PIL import Image
import sys
import re
from collections import Counter
from pathlib import Path

load_dotenv()

app = FastAPI(title="RBZ AI Service", version="2.0")

REFERENCE_DOCUMENT_ROOT = Path(__file__).resolve().parent / "Reference Documents"
REGULATORY_DOCUMENTS = [
    {"id": "rbz-act", "title": "Reserve Bank of Zimbabwe Act", "category": "Acts and policy", "path": "01_Acts_and_Policy/rbz-act.pdf", "stages": ["Company Profile", "Application Review"]},
    {"id": "banking-act", "title": "Banking Act [Chapter 24:20]", "category": "Acts and policy", "path": "01_Acts_and_Policy/ZIMBABWE_Banking_Act_2023_updated.pdf", "stages": ["Company Profile", "Application Form", "Capital Adequacy (Basel III)", "Liquidity Management", "IT & Cyber Risk", "Recovery & Resolution", "Application Review"]},
    {"id": "bank-use-act", "title": "Bank Use Promotion and Suppression of Money Laundering Act", "category": "Acts and policy", "path": "01_Acts_and_Policy/bankuse_promotion.pdf", "stages": ["Compliance Declaration", "Documents Upload", "Application Review"]},
    {"id": "monetary-policy-statement", "title": "Monetary Policy Statement", "category": "Acts and policy", "path": "01_Acts_and_Policy/MPS_FINAL_-_FULL.pdf", "stages": ["Capital Structure", "Financial Projections", "Capital Adequacy (Basel III)"]},
    {"id": "banking-licensing-2025", "title": "Minimum Licensing Requirements for Banking Institutions (June 2025)", "category": "Licensing requirements", "path": "02_Licensing_Requirements/BANKING_INSTITUTIONS_-_MINIMUM_LICENSING_REQUIREMENTS_2025.pdf", "stages": ["Company Profile", "Application Form", "Capital Structure", "Directors & Governance", "Financial Projections", "Documents Upload"]},
    {"id": "credit-only-licensing-2025", "title": "Minimum Licensing Requirements for Credit-Only MFIs (June 2025)", "category": "Licensing requirements", "path": "02_Licensing_Requirements/Credit_only_Microfinance_Institutions_-_Minimum_Licensing_Requirements_2025.pdf", "stages": ["Company Profile", "Ownership Structure", "Directors & Governance", "Application Form", "Capital Structure", "Products & Services", "Financial Projections", "Growth & Development", "Compliance Declaration", "Documents Upload", "Application Review"]},
    {"id": "dtmfi-licensing-2025", "title": "Minimum Licensing Requirements for Deposit-Taking MFIs (June 2025)", "category": "Licensing requirements", "path": "02_Licensing_Requirements/Deposit-taking_Microfinance_Institutions_-_Minimum_Licensing_Requirements_2025.pdf", "stages": ["Company Profile", "Ownership Structure", "Directors & Governance", "Application Form", "Capital Structure", "Products & Services", "Financial Projections", "Growth & Development", "Compliance Declaration", "Documents Upload", "Deposit Protection (DIPF)", "Application Review"]},
    {"id": "aml-cft-cpf-2025", "title": "AML/CFT/CPF Guideline (June 2025)", "category": "Prudential standards", "path": "03_Prudential_Standards/AML_CFT_CPF_GUIDELINE_-_June_2025.pdf", "stages": ["Ownership Structure", "Directors & Governance", "Compliance Declaration", "Documents Upload", "Application Review"]},
    {"id": "fitness-probity", "title": "Prudential Standard No. 07-2014/BSD: Fitness and Probity Assessment Criteria", "category": "Prudential standards", "path": "03_Prudential_Standards/fitnesss_probity_prudential_standards2.pdf", "stages": ["Ownership Structure", "Directors & Governance", "Documents Upload"]},
    {"id": "director-evaluation", "title": "Board and Director Evaluation Framework for Financial Institutions", "category": "Prudential standards", "path": "03_Prudential_Standards/board---director-evaluation-framework---revised.pdf", "stages": ["Directors & Governance", "Application Review"]},
    {"id": "risk-management-2024", "title": "Prudential Standard No. 01-2024/BSD: Risk Management", "category": "Prudential standards", "path": "03_Prudential_Standards/Risk_Mgt_Prudential_Standard_No._1-2024_Final.pdf", "stages": ["Products & Services", "Financial Projections", "Growth & Development", "Compliance Declaration", "IT & Cyber Risk"]},
    {"id": "model-risk-2023", "title": "Prudential Standard No. 02-2023/BSD: Model Risk Management", "category": "Prudential standards", "path": "03_Prudential_Standards/Model_Risk_Management_Prudential_Standard_Final_June_2023.pdf", "stages": ["Financial Projections", "IT & Cyber Risk"]},
    {"id": "lcr-2022", "title": "Prudential Standard No. 02-2022/BSD: Liquidity Coverage Ratio", "category": "Prudential standards", "path": "03_Prudential_Standards/Prudential_Standard_No02-2022_BSD_LCR.pdf", "stages": ["Liquidity Management", "Deposit Protection (DIPF)"]},
    {"id": "dsib-2020", "title": "Prudential Standard No. 01-2020/BSD: Domestic Systemically Important Banking Institutions", "category": "Prudential standards", "path": "03_Prudential_Standards/Prudential-Standard-No.-01-2020-BSD.pdf", "stages": ["Capital Adequacy (Basel III)", "Recovery & Resolution"]},
    {"id": "dtmfi-operational-guidelines", "title": "Prudential Standard No. 02-2016/BSD: Deposit-Taking Microfinance Institutions", "category": "Prudential standards", "path": "03_Prudential_Standards/operational-guidelines-for-deposit-taking-microfinance-institutions.pdf", "stages": ["Products & Services", "Deposit Protection (DIPF)", "Documents Upload"]},
    {"id": "fitness-probity-affidavit", "title": "Appendix A: Affidavit of Fitness and Probity", "category": "Application templates", "path": "04_Application_Templates/APPENDIX_A_-_AFFIDAVIT_OF_FITNESS_AND_PROBITY.pdf", "stages": ["Directors & Governance", "Documents Upload"]},
    {"id": "corporate-shareholder-affidavit", "title": "Appendix B: Corporate Shareholder AML and Source of Wealth Affidavit", "category": "Application templates", "path": "04_Application_Templates/Appendix_B_-_Corporate_Shareholders_Affidavit_on_AML_Requirements__Source_of_Wealth.pdf", "stages": ["Ownership Structure", "Documents Upload"]},
    {"id": "individual-shareholder-affidavit", "title": "Appendix C: Individual Shareholder AML and Source of Wealth Affidavit", "category": "Application templates", "path": "04_Application_Templates/Appendix_C_-_Individual_Shareholders_Affidavit_on_AML_Requirements__Source_of_Wealth.pdf", "stages": ["Ownership Structure", "Documents Upload"]},
    {"id": "mfi-forex-lending", "title": "Microfinance Institutions Lending in Foreign Currency Guideline", "category": "Lending guidelines", "path": "05_Lending_Guidelines/Forex_Lending_Guidelines_to_Microfinance_Institutions_2022.pdf", "stages": ["Products & Services", "Compliance Declaration"]},
]
REGULATORY_DOCUMENTS_BY_ID = {document["id"]: document for document in REGULATORY_DOCUMENTS}
TOKEN_PATTERN = re.compile(r"[a-z0-9]{3,}")
# These prudential standards / licensing documents number their paragraphs
# "4.2", "1.11" etc. at the start of a line — detected here so citations can
# say "Section 4.2" rather than just a page number.
CLAUSE_PATTERN = re.compile(r"(?m)^\s*(\d{1,2}\.\d{1,3}(?:\.\d{1,3})?)\b")
MAX_CHUNK_CHARS = 1300

class RegulatoryCitation(BaseModel):
    documentId: str
    title: str
    page: int
    section: Optional[str] = None
    quote: str
    documentUrl: str


def _ocr_pdf_bytes_with_tesseract(content: bytes, dpi: int = 200) -> str:
    """Local, offline OCR fallback for scanned PDFs: rasterize each page with
    PyMuPDF and run it through Tesseract. Used ahead of Azure Document
    Intelligence so document verification keeps working even when no Azure
    key is configured (the common case for on-prem RBZ deployments)."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=content, filetype="pdf")
        text_parts = []
        for page in doc:
            pix = page.get_pixmap(dpi=dpi)
            image = Image.open(io.BytesIO(pix.tobytes("png")))
            text_parts.append(pytesseract.image_to_string(image))
        doc.close()
        return "\n".join(text_parts)
    except Exception as error:
        print(f"--- WARNING: local Tesseract OCR failed: {error} ---")
        return ""


AZURE_OCR_CACHE_SUFFIX = ".ocr.json"


def _ocr_cache_path(document_path: Path) -> Path:
    return document_path.with_suffix(AZURE_OCR_CACHE_SUFFIX)


OCR_CHUNK_PAGES = 10  # pages per Azure call; keeps each upload well under the ~4MB free-tier cap


def _ocr_pages_with_tesseract(document_path: Path, page_numbers: List[int]) -> Dict[int, str]:
    """Local, offline OCR for specific 1-indexed pages of a PDF using
    PyMuPDF + Tesseract. Tried before Azure Document Intelligence so the
    reference-document knowledge base still picks up scanned pages when no
    Azure key is configured."""
    if not page_numbers:
        return {}
    try:
        import fitz  # PyMuPDF

        src = fitz.open(str(document_path))
        pages: Dict[int, str] = {}
        for page_number in page_numbers:
            pix = src[page_number - 1].get_pixmap(dpi=200)
            image = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(image)
            if text.strip():
                pages[page_number] = text
        src.close()
        return pages
    except Exception as error:
        print(f"--- WARNING: local Tesseract OCR failed for {document_path.name}: {error} ---")
        return {}


def _ocr_pages_with_azure(document_path: Path, page_numbers: List[int]) -> Dict[int, str]:
    """Run Azure Document Intelligence on specific 1-indexed pages of a PDF,
    returning {page_number: text}. Only called for pages pypdf couldn't
    extract text from (image-only scans) — most pages in these reference
    PDFs have native text, so OCR is scoped to exactly the pages that need
    it rather than the whole document.

    The source PDFs here are scan-to-PDF exports whose /Resources dictionary
    is inherited from a shared ancestor node, so every page (even a lone
    single-page extract via pypdf.PdfWriter) drags in every embedded image
    in the document and blows past Azure's free-tier upload size limit. To
    avoid that, each target page is rendered to a flat JPEG with PyMuPDF and
    a fresh, minimal multi-page PDF is built purely from those images — small
    enough to batch several pages per Azure call instead of one call per page.
    """
    if not page_numbers:
        return {}
    endpoint = os.getenv("AZURE_FORM_RECOGNIZER_ENDPOINT", "https://rbzai.cognitiveservices.azure.com/")
    key = os.getenv("AZURE_FORM_RECOGNIZER_KEY", "")
    if not key:
        return {}
    try:
        import fitz  # PyMuPDF
        from azure.ai.formrecognizer import DocumentAnalysisClient
        from azure.core.credentials import AzureKeyCredential

        client = DocumentAnalysisClient(endpoint, AzureKeyCredential(key))
        src = fitz.open(str(document_path))
        pages: Dict[int, str] = {}
        targets = sorted(page_numbers)

        for chunk_start in range(0, len(targets), OCR_CHUNK_PAGES):
            chunk_targets = targets[chunk_start:chunk_start + OCR_CHUNK_PAGES]
            chunk_doc = fitz.open()
            for page_number in chunk_targets:
                pix = src[page_number - 1].get_pixmap(dpi=150)
                img_bytes = pix.tobytes("jpeg", jpg_quality=75)
                img_rect = fitz.open("jpg", img_bytes)[0].rect
                chunk_page = chunk_doc.new_page(width=img_rect.width, height=img_rect.height)
                chunk_page.insert_image(img_rect, stream=img_bytes)
            chunk_bytes = chunk_doc.tobytes(deflate=True)
            chunk_doc.close()

            poller = client.begin_analyze_document("prebuilt-layout", document=io.BytesIO(chunk_bytes))
            result = poller.result()
            for result_page in result.pages:
                # result_page.page_number is 1-indexed within this chunk;
                # map it back to the original document's page number.
                original_page = chunk_targets[result_page.page_number - 1]
                pages[original_page] = "\n".join(line.content for line in result_page.lines)
            print(f"--- INFO: OCR'd pages {chunk_targets} of {document_path.name} ---")

        src.close()
        return pages
    except Exception as error:
        print(f"--- WARNING: Azure OCR failed for {document_path.name}: {error} ---")
        return {}


def _get_ocr_text_for_pages(document_path: Path, page_numbers: List[int]) -> Dict[int, str]:
    """Cached OCR lookup, scoped to only the pages actually missing text.
    Reads whatever's already cached on disk, OCRs just the pages still
    missing, and persists the merged result so repeated server starts (and
    other scanned pages found later in the same document) never re-OCR a
    page that's already been recovered."""
    cache_path = _ocr_cache_path(document_path)
    cached: Dict[int, str] = {}
    if cache_path.is_file():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                cached = {int(k): v for k, v in json.load(f).items()}
        except Exception as error:
            print(f"--- WARNING: could not read OCR cache {cache_path.name}: {error} ---")

    missing = [p for p in page_numbers if p not in cached]
    if missing:
        print(f"--- INFO: {document_path.name} pages {missing} have no extractable text — running local Tesseract OCR (one-time, cached) ---")
        newly_ocred = _ocr_pages_with_tesseract(document_path, missing)
        still_missing = [p for p in missing if p not in newly_ocred]
        if still_missing:
            print(f"--- INFO: {document_path.name} pages {still_missing} unreadable by Tesseract — trying Azure OCR ---")
            newly_ocred.update(_ocr_pages_with_azure(document_path, still_missing))
        if newly_ocred:
            cached.update(newly_ocred)
            try:
                with open(cache_path, "w", encoding="utf-8") as f:
                    json.dump({str(k): v for k, v in cached.items()}, f, ensure_ascii=False)
            except Exception as error:
                print(f"--- WARNING: could not write OCR cache {cache_path.name}: {error} ---")

    return cached


class RegulatoryKnowledgeBase:
    def __init__(self):
        self._loaded = False
        self._chunks: List[Dict[str, object]] = []

    @staticmethod
    def _split_page(raw_text: str) -> List[str]:
        """Split a page's raw (newline-preserving) text into citation-sized
        excerpts, breaking on clause boundaries where present so a chunk never
        straddles two unrelated numbered paragraphs."""
        if len(raw_text) <= MAX_CHUNK_CHARS:
            return [raw_text]
        matches = list(CLAUSE_PATTERN.finditer(raw_text))
        if len(matches) < 2:
            return [raw_text[i:i + MAX_CHUNK_CHARS] for i in range(0, len(raw_text), MAX_CHUNK_CHARS)]
        parts = []
        for i, m in enumerate(matches):
            start = m.start()
            end = matches[i + 1].start() if i + 1 < len(matches) else len(raw_text)
            parts.append(raw_text[start:end])
        merged, buf = [], ""
        for p in parts:
            if len(buf) + len(p) <= MAX_CHUNK_CHARS:
                buf += p
            else:
                if buf:
                    merged.append(buf)
                buf = p
        if buf:
            merged.append(buf)
        return merged

    def _load(self) -> None:
        if self._loaded:
            return
        for document in REGULATORY_DOCUMENTS:
            document_path = REFERENCE_DOCUMENT_ROOT / document["path"]
            if not document_path.is_file():
                continue
            try:
                reader = pypdf.PdfReader(str(document_path))
            except Exception as error:
                print(f"Reference document unavailable: {document['id']}: {error}")
                continue
            raw_pages: Dict[int, str] = {}
            empty_page_numbers = []
            for page_number, page in enumerate(reader.pages, start=1):
                try:
                    raw = page.extract_text() or ""
                except Exception:
                    raw = ""
                raw_pages[page_number] = raw
                if not raw.strip():
                    empty_page_numbers.append(page_number)

            if empty_page_numbers:
                ocr_pages = _get_ocr_text_for_pages(document_path, empty_page_numbers)
                for page_number in empty_page_numbers:
                    raw_pages[page_number] = ocr_pages.get(page_number, "")

            for page_number, raw in raw_pages.items():
                # Collapse horizontal whitespace only — keep line breaks so
                # CLAUSE_PATTERN can find numbered paragraphs at line starts.
                raw = re.sub(r"[ \t]+", " ", raw)
                raw = re.sub(r"\n{2,}", "\n", raw).strip()
                if len(raw) < 40:
                    continue
                for excerpt in self._split_page(raw):
                    clause_match = CLAUSE_PATTERN.search(excerpt)
                    excerpt = re.sub(r"\s+", " ", excerpt).strip()
                    if not excerpt:
                        continue
                    self._chunks.append({
                        "document": document,
                        "page": page_number,
                        "section": clause_match.group(1) if clause_match else None,
                        "text": excerpt,
                    })
        self._loaded = True

    @staticmethod
    def _tokens(value: str) -> List[str]:
        return TOKEN_PATTERN.findall(value.lower())

    def retrieve(self, question: str, stage_name: Optional[str], limit: int = 3) -> List[Dict[str, object]]:
        self._load()
        query_counts = Counter(self._tokens(question))
        if not query_counts:
            return []
        matches = []
        for chunk in self._chunks:
            document = chunk["document"]
            text = str(chunk["text"])
            token_counts = Counter(self._tokens(text))
            overlap = sum(min(count, token_counts[token]) for token, count in query_counts.items())
            title_tokens = set(self._tokens(str(document["title"])))
            title_overlap = sum(count for token, count in query_counts.items() if token in title_tokens)
            stage_bonus = 2 if stage_name and stage_name in document["stages"] else 0
            score = overlap + (title_overlap * 2) + stage_bonus
            if score:
                matches.append((score, chunk))
        matches.sort(key=lambda item: item[0], reverse=True)
        selected = []
        selected_documents = set()
        for _, chunk in matches:
            document = chunk["document"]
            if document["id"] in selected_documents:
                continue
            selected.append(chunk)
            selected_documents.add(document["id"])
            if len(selected) == limit:
                break
        return selected

    def citation(self, chunk: Dict[str, object], question: str) -> RegulatoryCitation:
        document = chunk["document"]
        question_tokens = set(self._tokens(question))
        sentences = re.split(r"(?<=[.!?])\s+", str(chunk["text"]))
        quote = max(sentences, key=lambda sentence: len(question_tokens.intersection(self._tokens(sentence))), default=str(chunk["text"]))
        quote = re.sub(r"\s+", " ", quote).strip()[:360]
        return RegulatoryCitation(
            documentId=str(document["id"]),
            title=str(document["title"]),
            page=int(chunk["page"]),
            section=chunk.get("section"),
            quote=quote,
            documentUrl=f"/reference-documents/{document['id']}/file",
        )


REGULATORY_KNOWLEDGE = RegulatoryKnowledgeBase()


def document_payload(document: Dict[str, object]) -> Dict[str, object]:
    return {
        "id": document["id"],
        "title": document["title"],
        "category": document["category"],
        "stages": document["stages"],
        "documentUrl": f"/reference-documents/{document['id']}/file",
    }


@app.get("/reference-documents")
def list_reference_documents(stage_name: Optional[str] = None):
    documents = [
        document_payload(document)
        for document in REGULATORY_DOCUMENTS
        if not stage_name or stage_name in document["stages"]
    ]
    return {"documents": documents}


@app.get("/reference-documents/{document_id}/file")
def get_reference_document(document_id: str):
    document = REGULATORY_DOCUMENTS_BY_ID.get(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Reference document not found.")
    document_path = REFERENCE_DOCUMENT_ROOT / document["path"]
    if not document_path.is_file():
        raise HTTPException(status_code=404, detail="Reference document file is unavailable.")
    return FileResponse(
        document_path,
        media_type="application/pdf",
        filename=document_path.name,
        headers={"Content-Disposition": "inline"},
    )


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

# All AI inference runs locally via Ollama — no application data leaves this
# server. Point OLLAMA_HOST at a remote Ollama instance only if that instance
# is itself on RBZ-controlled infrastructure.
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
AI_PROVIDER_TIMEOUT_SECONDS = 60

# Local Tesseract OCR — resolved via PATH (installed as the `tesseract-ocr`
# system package). Override only if it's installed somewhere non-standard.
_TESSERACT_CMD_OVERRIDE = os.getenv("TESSERACT_CMD")
if _TESSERACT_CMD_OVERRIDE:
    pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD_OVERRIDE

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
  - Minimum capital requirements: local-currency equivalent of USD 25,000 (Credit-Only), USD 5,000,000 or local-currency equivalent (Deposit-Taking)

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
- Minimum Capital: local-currency equivalent of USD 25,000 (Credit-Only), USD 5,000,000 or local-currency equivalent (Deposit-Taking)
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
    citations: List[RegulatoryCitation] = []

def _ollama_chat_call(history: List[ChatMessage], final_message: str, system_prompt: str) -> str:
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": "user" if m.role == "user" else "assistant", "content": m.content} for m in history]
    messages.append({"role": "user", "content": final_message})
    response = requests.post(
        f"{OLLAMA_HOST}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.7, "num_predict": 1024},
        },
        timeout=AI_PROVIDER_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()["message"]["content"]


@app.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """Interactive AI chatbot for applicants - powered by a local Ollama model"""
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

        source_matches = REGULATORY_KNOWLEDGE.retrieve(request.message, request.currentStageName)
        citations = [REGULATORY_KNOWLEDGE.citation(match, request.message) for match in source_matches]

        def _source_header(index: int, match: Dict[str, object]) -> str:
            header = f"[Source {index}] {match['document']['title']} — page {match['page']}"
            if match.get("section"):
                header += f", Section {match['section']}"
            return header

        source_context = "\n\n".join(
            f"{_source_header(index, match)}\n{match['text']}"
            for index, match in enumerate(source_matches, start=1)
        )
        source_instruction = (
            "\n\n=== AUTHORITATIVE REFERENCE EXCERPTS ===\n"
            + (source_context or "No relevant excerpt was retrieved from the curated source library.")
            + "\n\nUse the excerpts above as the source of truth for legal or regulatory statements. "
            "Do not invent requirements or cite a document that is not in the excerpts. "
            "Be citation-first: when an excerpt supports a factual claim, name the document, its section/clause "
            "number (if one is given in the source header), and the page, then give a short supporting quote "
            "(no more than ~25 words) — e.g. [Source 1] Prudential Standard No. 01-2024/BSD, Section 1.11, p.5: "
            "\"...applies to all regulated banking and non-bank financial institutions...\". "
            "If the excerpts do not resolve the question, explain that the requirement cannot be confirmed from "
            "the available source material and direct the applicant to the assigned examiner — never fabricate "
            "a section number, page, or document that isn't in the excerpts above."
        )

        reply_text = None
        system_prompt = RBZ_SYSTEM_PROMPT + source_instruction

        try:
            reply_text = await asyncio.wait_for(
                asyncio.to_thread(_ollama_chat_call, request.history or [], final_message, system_prompt),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
        except asyncio.TimeoutError:
            print(f"ollama timed out after {AI_PROVIDER_TIMEOUT_SECONDS}s")
        except Exception as provider_err:
            print(f"ollama error: {provider_err}")

        # --- Static fallback ---
        if not reply_text:
            reply_text = get_source_backed_fallback(citations) if citations else get_fallback_response(request.message)

        suggestions = generate_suggestions(request.currentStageName, request.message)
        return ChatResponse(reply=reply_text, suggestions=suggestions, citations=citations)

    except Exception as e:
        print(f"Chat error: {e}")
        fallback = get_fallback_response(request.message)
        return ChatResponse(
            reply=fallback,
            suggestions=["What documents do I need?", "How long does the process take?", "Contact support"],
            citations=[]
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

def get_source_backed_fallback(citations: List[RegulatoryCitation]) -> str:
    primary = citations[0]
    locator = f"{primary.title}"
    if primary.section:
        locator += f", Section {primary.section}"
    locator += f", p.{primary.page}"
    return (
        f"The following official source ({locator}) is relevant to your question:\n\n"
        f"\"{primary.quote}\" [Source 1]\n\n"
        "Please review the cited document below. If you need a case-specific interpretation, contact your assigned examiner."
    )


def get_fallback_response(message: str) -> str:
    """Returns a helpful static response when AI is unavailable"""
    message_lower = message.lower()

    if any(w in message_lower for w in ["document", "upload", "file", "certificate"]):
        return "For document uploads, each director requires: a Certified ID/Passport, CV/Resume, Police Clearance Certificate, Tax Clearance Certificate, and an Affidavit of Net Worth certified by an accountant or Commissioner of Oaths. Please ensure all documents are current and clearly legible."

    if any(w in message_lower for w in ["stage", "step", "process", "application"]):
        return "The RBZ licensing process has 9 stages: (1) Company Profile, (2) Ownership Structure, (3) Director Vetting, (4) Board Committees, (5) Products & Services, (6) Business Plan, (7) Financial Projections, (8) Capital Structure, and (9) Document Upload Hub. You must complete each stage in order."

    if any(w in message_lower for w in ["capital", "minimum", "money", "fund"]):
        return "Minimum capital requirements: Credit-Only MFI = local-currency equivalent of USD 25,000. Deposit-Taking MFI = USD 5,000,000 or local-currency equivalent. You will need to provide proof of capital injection through bank statements and a source of funds declaration."

    if any(w in message_lower for w in ["director", "board", "dq"]):
        return "Each Director must complete a Directors Questionnaire (DQ Form). Required supporting documents include: Certified ID/Passport, a CV following the standard chronological template, Police Clearance Certificate, Tax Clearance Certificate, and an Affidavit of Net Worth. Executive directors must reside in Zimbabwe, and non-executive directors must form the majority of the board."

    if any(w in message_lower for w in ["contact", "help", "support", "human", "phone", "email"]):
        return "You can reach the RBZ Bank Supervision Division at: Email: licensing@rbz.zw | Phone: +263 242 703000 | Physical: 80 Samora Machel Avenue, Harare. Working hours are Monday-Friday, 8:00 AM - 4:30 PM CAT."

    return "Thank you for your message. I'm currently experiencing connectivity issues. Our support team is available at licensing@rbz.zw or +263 242 703000 during working hours (Mon-Fri, 8:00 AM - 4:30 PM)."

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
        print("--- INFO: No text found in CV. Falling back to local Tesseract OCR... ---")
        text = _ocr_pdf_bytes_with_tesseract(content)

    if not text.strip() and os.getenv("AZURE_FORM_RECOGNIZER_KEY"):
        print("--- INFO: Tesseract found no text. Falling back to Azure Document AI for OCR... ---")
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
# STRUCTURED EXTRACTION VIA OLLAMA (per company-document type)
# ============================================================
# Per-doc-type prompt that instructs the model to return strict JSON. The
# schema matches the field names used by DocumentExtractionService.parse* on
# the Java side, so the response can be passed straight through with minimal
# mapping.
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


def ollama_structured_extract(text: str, doc_type: str, entity_name: str):
    """Send extracted document text to the local Ollama model with a
    per-doc-type JSON-schema prompt. Returns the parsed dict on success, or
    None on failure (caller should route to manual review)."""
    prompt_template = EXTRACTION_PROMPTS.get(doc_type)
    if not prompt_template:
        return None
    if not text or len(text.strip()) < 50:
        # Too little text to extract anything meaningful
        return None

    # Cap input length so we don't blow the model's context window on huge PDFs.
    safe_text = text[:60000]
    prompt = prompt_template.format(text=safe_text, entity=entity_name or "the applicant")

    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "format": "json",
                "stream": False,
                "options": {"temperature": 0.0},
            },
            timeout=AI_PROVIDER_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        raw = (response.json()["message"]["content"] or "").strip()
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Some models wrap JSON in markdown fences despite format=json. Try to recover.
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
        print(f"--- WARNING: Ollama structured extraction failed for {doc_type}: {e} ---")
        return None


async def structured_extract_with_fallback(text: str, doc_type: str, entity_name: str):
    """Bounded by AI_PROVIDER_TIMEOUT_SECONDS so a hung local model doesn't
    block the request indefinitely."""
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(ollama_structured_extract, text, doc_type, entity_name),
            timeout=AI_PROVIDER_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        print(f"ollama structured extraction timed out after {AI_PROVIDER_TIMEOUT_SECONDS}s")
        return None
    except Exception as e:
        print(f"ollama structured extraction error: {e}")
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
            print("--- INFO: No text found (Scanned Document). Falling back to local Tesseract OCR... ---")
            text = _ocr_pdf_bytes_with_tesseract(content)
            if text.strip():
                print(f"--- INFO: Tesseract extracted {len(text)} characters ---")

        if not text.strip() and os.getenv("AZURE_FORM_RECOGNIZER_KEY"):
            print("--- INFO: Tesseract found no text. Falling back to Azure Document AI for OCR... ---")

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

        if not text.strip():
            return {
                "valid": False,
                "needs_manual_review": True,
                "reason": "The document could not be read automatically (no OCR text found). It has been referred to an examiner for manual review.",
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

        # Company-document types: route to Ollama structured extraction. The
        # extracted fields land directly on the response so the Java side can
        # populate Stage 4-8 entities. If Ollama fails, we route to manual
        # review (NEVER auto-approve).
        STRUCTURED_DOC_TYPES = {
            "financial_statements", "business_plan", "portfolio_report",
            "tax_clearance", "policy_verification", "insurance_policy",
        }
        if doc_type in STRUCTURED_DOC_TYPES:
            extracted = await structured_extract_with_fallback(text, doc_type, director_name)
            if extracted is None:
                return {
                    "valid": False,
                    "needs_manual_review": True,
                    "reason": "AI structured extraction unavailable. Manual examiner review required.",
                    "detected_name": director_name,
                    "confidence": 0.0,
                }
            # Ollama supplied a JSON object — pass it through with the rest of
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