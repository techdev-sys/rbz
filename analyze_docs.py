import os

from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

# Configure credentials in the deployment environment; never commit them.
ENDPOINT = os.environ.get("AZURE_FORM_RECOGNIZER_ENDPOINT", "https://rbzai.cognitiveservices.azure.com/")
KEY = os.environ.get("AZURE_FORM_RECOGNIZER_KEY")

def check_rbz_document(file_path):
    if not KEY:
        raise RuntimeError("AZURE_FORM_RECOGNIZER_KEY is not configured")

    # Initialize the client
    client = DocumentAnalysisClient(ENDPOINT, AzureKeyCredential(KEY))

    print(f"--- Analyzing: {file_path} ---")

    # Start the analysis using the 'Layout' model
    with open(file_path, "rb") as f:
        poller = client.begin_analyze_document("prebuilt-layout", document=f)

    result = poller.result()

    # 2. EXTRACT TEXT: Look for specific RBZ keywords
    print("\n[Extracted Text Highlights]")
    found_keywords = []
    target_words = ["Reserve Bank", "License", "Exchange Control", "Registration"]

    for page in result.pages:
        for line in page.lines:
            content = line.content
            if any(word.lower() in content.lower() for word in target_words):
                print(f"✅ Found: {content}")

    # 3. EXTRACT TABLES: Perfect for financial returns
    print("\n[Tables Found]")
    for table_idx, table in enumerate(result.tables):
        print(f"Table # {table_idx} has {table.row_count} rows and {table.column_count} columns.")
        # Optional: Print the first row of each table to see headers
        for cell in table.cells:
            if cell.row_index == 0:
                print(f"  Header: {cell.content}")

# To run it, uncomment the line below with your file name:
# check_rbz_document("test_return.pdf")
