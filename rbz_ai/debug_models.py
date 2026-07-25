import google.generativeai as genai
import os

with open("models_output.txt", "w") as f:
    f.write("Script starting...\n")
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    genai.configure(api_key=api_key)

    f.write("Listing models...\n")
    try:
        for m in genai.list_models():
            f.write(f"Model: {m.name}\n")
    except Exception as e:
        f.write(f"Error: {e}\n")
    f.write("Script finished.\n")
