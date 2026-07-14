"""Demo backend: no authentication — pick a role, get that role's dashboard.

Run:  uvicorn main:app --reload --port 8000
"""
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from data import ADVISORS, CLIENTS, PROPOSAL_STATUSES, PROPOSALS

app = FastAPI(title="Personal View Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# The Client Advisor view shows this advisor's book.
DEFAULT_ADVISOR_ID = "CA-001"

VIEW_USERS = {
    "Client Advisor": ADVISORS[DEFAULT_ADVISOR_ID],
    "Specialist": "Thomas Green",
    "Management": "Julia Weiss",
}


class ProposalUpdate(BaseModel):
    status: Optional[str] = None
    expected_volume_musd: Optional[float] = None
    comment: Optional[str] = None


def client_by_id(cid: int):
    return next(c for c in CLIENTS if c["id"] == cid)


ROLE_SLUGS = {
    "advisor": "Client Advisor",
    "specialist": "Specialist",
    "management": "Management",
}


@app.get("/api/dashboard")
def dashboard(role: str):
    role = ROLE_SLUGS.get(role, role)
    if role not in VIEW_USERS:
        raise HTTPException(status_code=400, detail="Unknown role")
    name = VIEW_USERS[role]

    if role == "Client Advisor":
        my = [c for c in CLIENTS if c["advisor_id"] == DEFAULT_ADVISOR_ID]
        return {
            "role": role,
            "name": name,
            "clients": my,
            "kpis": {
                "total_clients": len(my),
                "invested_assets_musd": round(sum(c["invested_assets_musd"] for c in my), 1),
                "revenue_ytd_kusd": sum(c["revenue_ytd_kusd"] for c in my),
                "nnm_ytd_musd": round(sum(c["nnm_ytd_musd"] for c in my), 1),
                "reviews_pending": sum(1 for c in my if c["needs_review"]),
            },
        }

    if role == "Management":
        by_advisor = {}
        for c in CLIENTS:
            a = by_advisor.setdefault(c["advisor_id"], {
                "advisor_id": c["advisor_id"], "clients": 0,
                "invested_assets_musd": 0.0, "revenue_ytd_kusd": 0,
                "nnm_ytd_musd": 0.0, "reviews_pending": 0,
            })
            a["clients"] += 1
            a["invested_assets_musd"] = round(a["invested_assets_musd"] + c["invested_assets_musd"], 1)
            a["revenue_ytd_kusd"] += c["revenue_ytd_kusd"]
            a["nnm_ytd_musd"] = round(a["nnm_ytd_musd"] + c["nnm_ytd_musd"], 1)
            a["reviews_pending"] += 1 if c["needs_review"] else 0
        for a in by_advisor.values():
            a["advisor_name"] = ADVISORS.get(a["advisor_id"], a["advisor_id"])

        by_segment = {}
        for c in CLIENTS:
            s = by_segment.setdefault(c["segment"], {"segment": c["segment"], "clients": 0, "invested_assets_musd": 0.0, "revenue_ytd_kusd": 0})
            s["clients"] += 1
            s["invested_assets_musd"] = round(s["invested_assets_musd"] + c["invested_assets_musd"], 1)
            s["revenue_ytd_kusd"] += c["revenue_ytd_kusd"]

        won = [p for p in PROPOSALS if p["status"] == "Won"]
        open_props = [p for p in PROPOSALS if p["status"] in ("New", "In progress", "Proposed")]
        return {
            "role": role,
            "name": name,
            "advisors": list(by_advisor.values()),
            "segments": list(by_segment.values()),
            "kpis": {
                "total_clients": len(CLIENTS),
                "invested_assets_musd": round(sum(c["invested_assets_musd"] for c in CLIENTS), 1),
                "revenue_ytd_kusd": sum(c["revenue_ytd_kusd"] for c in CLIENTS),
                "nnm_ytd_musd": round(sum(c["nnm_ytd_musd"] for c in CLIENTS), 1),
                "reviews_pending": sum(1 for c in CLIENTS if c["needs_review"]),
                "open_proposals": len(open_props),
                "pipeline_musd": round(sum(p["expected_volume_musd"] for p in open_props), 1),
                "won_proposals": len(won),
            },
        }

    # Specialist (Sales)
    props = [{**p, "client_name": client_by_id(p["client_id"])["name"],
              "advisor_id": client_by_id(p["client_id"])["advisor_id"],
              "segment": client_by_id(p["client_id"])["segment"]} for p in PROPOSALS]
    open_props = [p for p in props if p["status"] in ("New", "In progress", "Proposed")]
    return {
        "role": role,
        "name": name,
        "proposals": props,
        "statuses": PROPOSAL_STATUSES,
        "kpis": {
            "open_proposals": len(open_props),
            "pipeline_musd": round(sum(p["expected_volume_musd"] for p in open_props), 1),
            "won": sum(1 for p in props if p["status"] == "Won"),
            "clients_covered": len({p["client_id"] for p in props}),
        },
    }


@app.patch("/api/proposals/{proposal_id}")
def update_proposal(proposal_id: int, update: ProposalUpdate):
    prop = next((p for p in PROPOSALS if p["id"] == proposal_id), None)
    if not prop:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if update.status is not None:
        if update.status not in PROPOSAL_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status")
        prop["status"] = update.status
    if update.expected_volume_musd is not None:
        prop["expected_volume_musd"] = update.expected_volume_musd
    if update.comment is not None:
        prop["comment"] = update.comment
    return prop


# Serve the built frontend (frontend/dist) if it exists — single-port deploy.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
