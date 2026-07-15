#!/usr/bin/env bash
# One-command deploy: build frontend, install backend deps, serve everything on one port.
# Override the port with:  PORT=8888 ./run.sh
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8000}"

echo "== Building frontend =="
cd frontend
npm install --no-audit --no-fund
npm run build
cd ..

echo "== Installing backend deps =="
pip install -r backend/requirements.txt

echo "== Starting app on http://0.0.0.0:$PORT =="
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port "$PORT"
