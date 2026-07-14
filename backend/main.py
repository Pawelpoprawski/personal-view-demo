"""Simple demo backend: role-based login + dashboards + editable proposals.

Run:  uvicorn main:app --reload --port 8000
"""
import secrets
from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from data import CLIENTS, PROPOSAL_STATUSES, PROPOSALS, ROLE_DEFAULT_USER, USERS

app = FastAPI(title="Personal View Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# token -> username (in-memory, resets on restart)
SESSIONS: dict[str, str] = {}


class RoleLoginRequest(BaseModel):
    role: str


class ProposalUpdate(BaseModel):
    status: str | None = None
    expected_volume_musd: float | None = None
    comment: str | None = None


def get_current_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    username = SESSIONS.get(authorization.removeprefix("Bearer "))
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"username": username, **USERS[username]}


def client_by_id(cid: int):
    return next(c for c in CLIENTS if c["id"] == cid)


@app.post("/api/login-role")
def login_role(req: RoleLoginRequest):
    username = ROLE_DEFAULT_USER.get(req.role)
    if not username:
        raise HTTPException(status_code=400, detail="Unknown role")
    user = USERS[username]
    token = secrets.token_hex(16)
    SESSIONS[token] = username
    return {"token": token, "name": user["name"], "role": user["role"]}


@app.post("/api/logout")
def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        SESSIONS.pop(authorization.removeprefix("Bearer "), None)
    return {"ok": True}


@app.get("/api/dashboard")
def dashboard(authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    role = user["role"]

    if role == "Client Advisor":
        my = [c for c in CLIENTS if c["advisor_id"] == user["advisor_id"]]
        return {
            "role": role,
            "name": user["name"],
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
        advisor_names = {u["advisor_id"]: u["name"] for u in USERS.values() if u["advisor_id"]}
        for a in by_advisor.values():
            a["advisor_name"] = advisor_names.get(a["advisor_id"], a["advisor_id"])

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
            "name": user["name"],
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
        "name": user["name"],
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
def update_proposal(proposal_id: int, update: ProposalUpdate,
                    authorization: str | None = Header(default=None)):
    user = get_current_user(authorization)
    if user["role"] != "Specialist":
        raise HTTPException(status_code=403, detail="Only Specialists can edit proposals")
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
