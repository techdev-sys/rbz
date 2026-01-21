# Document Analysis API

A FastAPI service for extracting text from documents using OCR (Optical Character Recognition).

## Prerequisites

- Python 3.8+
- Tesseract OCR installed on your system
  - Windows: Download and install from https://github.com/UB-Mannheim/tesseract/wiki
  - Make sure Tesseract is installed at `C:\Program Files\Tesseract-OCR\tesseract.exe`

## Setup

1. Run the setup script to create a virtual environment and install dependencies:

```
setup_venv.bat
```

2. Activate the virtual environment (if not already activated):

```
venv\Scripts\activate
```

## Running the API

Start the API server:

```
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

## API Endpoints

- `GET /`: Health check endpoint
- `POST /read-doc`: Upload an image file to extract text using OCR

## API Documentation

Once the server is running, you can access the interactive API documentation:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Example Usage

Using curl:

```
curl -X POST -F "file=@your_image.png" http://localhost:8000/read-doc
```

Response:

```json
{
  "filename": "your_image.png",
  "text": "Extracted text from the image..."
}
```
