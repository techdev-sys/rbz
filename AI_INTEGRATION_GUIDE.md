# RBZ AI & Machine Learning Integration Guide

## Overview
We have implemented an AI-powered Document Intelligence layer using **Python (FastAPI)** and **Google Gemini 2.5**. This system automatically extracts data from uploaded PDF documents and verifies their authenticity.

## Architecture
1.  **Backend (Java Spring Boot)**: Receives file uploads from the frontend.
2.  **AI Service (Python FastAPI)**: Processes the files using OCR and LLMs.
    *   **Port**: 8000
    *   **Endpoints**: `/analyze-document`, `/verify-document`
3.  **Frontend (React)**: Displays the extracted status (e.g., "Verified").

## Features Implemented
*   **Tax Clearance Extraction**: Automatically reads Certificate Number, Expiry Date, and Issue Date.
*   **Affidavit Verification**: Checks for "Commissioner of Oaths" stamps and specific names.
*   **Net Worth Verification**: Checks for Auditor/Accountant certification.
*   **Police Clearance Verification**: Validates Police stamping.

## How to Run the AI Service

1.  **Navigate to the AI directory**:
    ```bash
    cd rbz_ai
    ```

2.  **Install Dependencies** (if not already installed):
    ```bash
    pip install fastapi uvicorn google-generativeai pypdf python-multipart python-dotenv pytesseract
    ```

3.  **Start the Server**:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

4.  **Java Backend Configuration**:
    *   The Java backend is configured to look for the AI service at `http://localhost:8000`.
    *   Ensure the Python service is running *before* you attempt document uploads.

## How it Works (Example: Tax Clearance)
1.  User uploads `TaxClearance.pdf` on the portal.
2.  Java Backend sends the file to Python AI.
3.  Python AI sends the content to Gemini with a prompt: *"Analyze Tax Clearance... Extract Certificate Number..."*.
4.  Gemini returns a JSON object with the data.
5.  Java Backend saves this data into the `ComplianceDocumentation` table.
6.  The **MFI Evaluation Report** will now automatically include this data in the "Compliance" section.
