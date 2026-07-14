"""Insights Platform demo backend — single Client Advisor view.

Run:  uvicorn main:app --reload --port 8000
"""
import threading
from pathlib import Path
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from data import (ACTIONS, ADVISOR, CLIENTS, ENGAGEMENT, FINANCIALS, NEWS,
                  OPPORTUNITIES, OPPORTUNITY_STATUSES)

app = FastAPI(title="Insights Platform Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Sync endpoints run in a threadpool — guard shared in-memory data.
DATA_LOCK = threading.Lock()


class ActionUpdate(BaseModel):
    status: Optional[Literal["Open", "Completed"]] = None


class OpportunityUpdate(BaseModel):
    status: Optional[Literal["Open", "In Review", "Closed"]] = None


def client_map():
    return {c["id"]: c for c in CLIENTS}


def with_client(items):
    cm = client_map()
    return [{**i, "client_name": cm[i["client_id"]]["name"]} for i in items]


@app.get("/api/home")
def home():
    open_actions = [a for a in ACTIONS if a["status"] == "Open"]
    completed = [a for a in ACTIONS if a["status"] == "Completed"]
    total = len(ACTIONS)
    return {
        "advisor": ADVISOR,
        "actions": with_client(ACTIONS),
        "action_metrics": {
            "open": len(open_actions),
            "completed": len(completed),
            "completion_rate_pct": round(100 * len(completed) / total) if total else 0,
        },
        "news": with_client(NEWS),
        "kpis": {
            "clients": len(CLIENTS),
            "aum_musd": FINANCIALS["tiles"][0]["value_musd"],
            "open_opportunities": sum(1 for o in OPPORTUNITIES if o["status"] != "Closed"),
            "engagement_score": ENGAGEMENT["tiles"][0]["value"],
        },
    }


@app.get("/api/financials")
def financials():
    return {
        "tiles": FINANCIALS["tiles"],
        "allocation": FINANCIALS["allocation"],
        "liabilities": FINANCIALS["liabilities"],
        "clients": [
            {
                "id": c["id"], "name": c["name"], "segment": c["segment"],
                "aum_musd": c["aum_musd"], "share_of_wallet_pct": c["share_of_wallet_pct"],
                "revenue_ytd_kusd": c["revenue_ytd_kusd"], "nnm_ytd_musd": c["nnm_ytd_musd"],
                "loans_musd": c["liabilities"]["Loans"], "mortgages_musd": c["liabilities"]["Mortgages"],
            }
            for c in CLIENTS
        ],
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/engagement")
def engagement():
    clients = [
        {
            "id": c["id"], "name": c["name"],
            "engagement_score": c["engagement_score"],
            "last_interaction_days": c["last_interaction_days"],
            "needs_attention": c["last_interaction_days"] >= 90,
        }
        for c in sorted(CLIENTS, key=lambda x: -x["last_interaction_days"])
    ]
    return {
        "tiles": ENGAGEMENT["tiles"],
        "clients": clients,
        "interactions": with_client(ENGAGEMENT["interactions"]),
    }


@app.get("/api/opportunities")
def opportunities():
    cm = client_map()
    items = [{**o, "client_name": cm[o["client_id"]]["name"],
              "client_tags": cm[o["client_id"]]["tags"]} for o in OPPORTUNITIES]
    open_items = [o for o in items if o["status"] != "Closed"]
    return {
        "statuses": OPPORTUNITY_STATUSES,
        "opportunities": items,
        "kpis": {
            "open": len(open_items),
            "pipeline_musd": round(sum(o["estimated_value_musd"] for o in open_items), 1),
            "avg_potential": round(sum(o["potential_score"] for o in open_items) / len(open_items), 1) if open_items else 0,
        },
    }


@app.get("/api/clients/{client_id}")
def client_one_pager(client_id: int):
    c = client_map().get(client_id)
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return {
        **c,
        "opportunities": [o for o in OPPORTUNITIES if o["client_id"] == client_id],
        "interactions": [i for i in ENGAGEMENT["interactions"] if i["client_id"] == client_id],
        "news": [n for n in NEWS if n["client_id"] == client_id],
    }


@app.patch("/api/actions/{action_id}")
def update_action(action_id: int, update: ActionUpdate):
    with DATA_LOCK:
        action = next((a for a in ACTIONS if a["id"] == action_id), None)
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        if update.status is not None:
            action["status"] = update.status
        return action


@app.patch("/api/opportunities/{opp_id}")
def update_opportunity(opp_id: int, update: OpportunityUpdate):
    with DATA_LOCK:
        opp = next((o for o in OPPORTUNITIES if o["id"] == opp_id), None)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        if update.status is not None:
            opp["status"] = update.status
        return opp


# Serve the built frontend (frontend/dist) if it exists — single-port deploy.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
