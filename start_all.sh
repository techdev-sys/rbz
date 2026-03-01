#!/bin/bash

echo "🐘 Ensuring PostgreSQL database is running..."
sudo systemctl start postgresql

echo "==============================================="
echo "🚀 Starting all RBZ project services..."
echo "==============================================="

# Function to clean up background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $BACKEND_PID $AI_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C (SIGINT) and kill signals to ensure all child processes stop
trap cleanup SIGINT SIGTERM

echo "☕ Starting Java Backend (port 8080)..."
cd /home/takilaa/rbz/rbz_backend
# Run Maven Spring Boot app in the background
mvn spring-boot:run &
BACKEND_PID=$!

echo "🧠 Starting AI Python Backend (port 8000)..."
cd /home/takilaa/rbz/rbz_ai
# Create virtual environment and install dependencies if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Setting up Python virtual environment..."
    python3 -m venv venv
    venv/bin/pip install -r requirements.txt
fi
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
AI_PID=$!
deactivate

echo "⚛️ Starting React Frontend (port 3000)..."
cd /home/takilaa/rbz/rbz-frontend
npm start &
FRONTEND_PID=$!

echo "==============================================="
echo "✅ All services are now launching!"
echo "   - Frontend:    http://localhost:3000"
echo "   - Backend API: http://localhost:8080"
echo "   - AI API:      http://localhost:8000"
echo ""
echo "Press [Ctrl+C] to stop everything and exit."
echo "==============================================="

# Keep the script running, waiting for user to quit
wait
