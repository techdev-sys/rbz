#!/usr/bin/env bash
# RBZ Production Deployment Script
# Usage: ./deploy.sh [--fresh]
#   --fresh  First-ever deploy to a new DB. Starts with DDL_AUTO=update,
#            waits for tables to be created, then switches to validate.
#            Omit this flag for all subsequent restarts.
#
# Prerequisites: all env vars from deployment.env.example must be exported.

set -euo pipefail

BACKEND_JAR="rbz_backend/target/licensing-system-0.0.1-SNAPSHOT.jar"
AI_SERVICE="rbz_ai/main.py"

check_required_vars() {
    local missing=()
    for var in JWT_SECRET CORS_ORIGINS DB_URL DB_USERNAME DB_PASSWORD PII_ENCRYPTION_KEY; do
        if [ -z "${!var:-}" ]; then
            missing+=("$var")
        fi
    done
    if [ ${#missing[@]} -gt 0 ]; then
        echo "ERROR: Missing required environment variables: ${missing[*]}"
        echo "Copy deployment.env.example, fill in all values, and export them before running."
        exit 1
    fi
}

start_ai() {
    echo "Starting AI service..."
    cd rbz_ai
    pip install -q -r requirements.txt
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 > ../logs/ai.log 2>&1 &
    echo $! > ../logs/ai.pid
    cd ..
    echo "AI service started (pid $(cat logs/ai.pid))"
}

start_backend() {
    local ddl_mode="${1:-validate}"
    echo "Starting backend (DDL_AUTO=$ddl_mode)..."
    mkdir -p logs uploads
    DDL_AUTO="$ddl_mode" java -jar $BACKEND_JAR > logs/backend.log 2>&1 &
    echo $! > logs/backend.pid
    echo "Backend started (pid $(cat logs/backend.pid))"
}

wait_for_backend() {
    echo -n "Waiting for backend to be ready"
    for i in $(seq 1 30); do
        if curl -sf http://localhost:${SERVER_PORT:-8080}/api/health > /dev/null 2>&1; then
            echo " OK"
            return 0
        fi
        echo -n "."
        sleep 3
    done
    echo " TIMEOUT"
    echo "Backend did not start in 90s. Check logs/backend.log."
    exit 1
}

dump_schema() {
    local db_name
    db_name=$(echo "$DB_URL" | grep -oP '(?<=/)[^?]+$')
    echo "Dumping schema to schema.sql..."
    pg_dump --schema-only -h localhost -U "$DB_USERNAME" "$db_name" > schema.sql
    echo "Schema saved to schema.sql — store this securely for future fresh installs."
}

check_required_vars

mkdir -p logs

if [ "${1:-}" = "--fresh" ]; then
    echo "=== PHASE 1: Fresh deploy (DDL_AUTO=update) ==="
    echo "Running email duplicate cleanup first..."
    psql "$DB_URL" -U "$DB_USERNAME" -f rbz_backend/src/main/resources/db/cleanup_duplicate_emails.sql 2>/dev/null || true
    start_ai
    start_backend "update"
    wait_for_backend
    dump_schema
    echo ""
    echo "=== PHASE 1 complete. Restarting backend in validate mode ==="
    kill "$(cat logs/backend.pid)" 2>/dev/null || true
    sleep 3
    start_backend "validate"
    wait_for_backend
    echo ""
    echo "=== Deploy complete. DDL_AUTO is now validate. ==="
else
    echo "=== Standard restart (DDL_AUTO=validate) ==="
    start_ai
    start_backend "validate"
    wait_for_backend
    echo "=== Backend ready ==="
fi
