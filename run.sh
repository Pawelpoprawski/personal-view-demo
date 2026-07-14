#!/usr/bin/env bash
# One-command deploy: build frontend, install backend deps, serve everything on port 8000.
set -e
cd "$(dirname "$0")"

echo "== Building frontend =="
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

echo "== Installing backend deps =="
pip install -r backend/requirements.txt

echo "== Starting app on http://0.0.0.0:8000 =="
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
