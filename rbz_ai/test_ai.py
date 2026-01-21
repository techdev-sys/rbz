
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load env from current directory
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key found: {api_key[:5]}...{api_key[-5:] if api_key else 'None'}")

if not api_key:
    print("❌ No API Key found in .env")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

print("🤖 Testing Gemini Connection...")
try:
    response = model.generate_content("Hello, can you help me extract data from a finance report?")
    print(f"✅ Connection Successful! AI says: {response.text[:50]}...")
except Exception as e:
    print(f"❌ Connection Failed: {e}")
