# Insights Platform Demo

Demo of a client-advisor workbench: **React (Vite)** frontend + **Python (FastAPI)**
backend. Single Client Advisor view with a landing page and three sections:
**My Financials**, **My Engagement**, **My Opportunities**. All people, clients
and numbers are fictional. No authentication.

## Pages

- **Home** — "Welcome back" landing: KPI tiles (AUM, open opportunities,
  engagement score, clients), **My Actions** panel (action cards with notes,
  mark done / reopen, completion rate) and **Client News**.
- **My Financials** — tiles with quarter deltas (AUM, Net New Money, Net New
  Loans, Net New Fee Gen Assets, Overall Revenue), asset-allocation donut,
  liabilities table and a per-client financial table (AUM, share of wallet,
  revenue, NNM, loans, mortgages).
- **My Engagement** — engagement score tiles (Client Engagement Score,
  Interactions per Client, Specialist Engagement), per-client scores with
  "no contact 90+ days" flags, recent interactions list.
- **My Opportunities** — pipeline tiles, status filters, opportunity panels
  (client, product, estimated value, potential score, lead, rationale, client
  tags) with status actions (move to review / close).

## Structure

```
├── backend/          # FastAPI: dummy data + API
│   ├── main.py
│   ├── data.py
│   └── requirements.txt
├── frontend/         # React + Vite
│   └── src/pages/    # Home, Financials, Engagement, Opportunities
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

Builds the frontend, installs backend dependencies and serves everything on
**http://127.0.0.1:8000** (frontend + API on one port; works behind
path-prefix proxies).

## Development mode (two terminals)

```bash
# terminal 1
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
# terminal 2
cd frontend && npm install && npm run dev
```

## Notes

- Edits (actions, opportunity statuses) are kept in memory and reset when the
  backend restarts.
- All names, companies, news headlines and figures are fictional.
