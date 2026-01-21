@echo off
echo Creating virtual environment...
python -m venv venv
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Setup complete! You can now run the API with: uvicorn main:app --reload
