# Personal View Demo

Simple demo app: **React (Vite)** frontend + **Python (FastAPI)** backend.
Pick a view on the start screen — **Client Advisor**, **Specialist (Sales)** or
**Management** — and see a role-specific dashboard. All data is dummy/fictional.
No authentication.

## Structure

```
├── backend/          # FastAPI: dashboard data + editable proposals
│   ├── main.py
│   ├── data.py       # dummy clients and proposals
│   └── requirements.txt
├── frontend/         # React + Vite
│   ├── src/
│   └── package.json
├── run.sh            # one-command deploy (Linux/Mac)
└── run.bat           # one-command deploy (Windows)
```

## Requirements

- Python 3.9+
- Node.js 18+

## Quick start (single port)

```bash
bash run.sh        # Linux/Mac
run.bat            # Windows
```

This builds the frontend, installs backend dependencies and serves everything
on **http://127.0.0.1:8000** (frontend + API on one port, works behind
path-prefix proxies such as Domino).

## Development mode (two terminals)

Terminal 1 — backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Terminal 2 — frontend (hot reload, http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

## What each view shows

- **Client Advisor** — tabs: Overview, Clients, Revenues, Invested Assets.
  KPIs: number of clients, invested assets, revenue YTD, NNM YTD, reviews pending.
- **Specialist (Sales)** — tabs: Proposals (editable fields: status, expected
  volume, comment — Save persists to the backend), Pipeline (summary per status).
- **Management** — tabs: Summary, By Advisor, By Segment — aggregated team
  figures (invested assets, revenues, NNM, sales pipeline).

## Notes

- No login — the role buttons simply switch views (demo only).
- All client names, people and numbers are fictional.
- Proposal edits are kept in memory and reset when the backend restarts.
