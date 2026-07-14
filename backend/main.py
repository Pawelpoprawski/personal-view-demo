"""Insights Platform demo backend — single Client Advisor view.

Run:  uvicorn main:app --reload --port 8000
"""
import itertools
import threading
from pathlib import Path
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from data import (ACTION_NOTES, ACTIONS, ADVISOR, CLIENT_HISTORY, CLIENT_NOTES,
                  CLIENT_YOY, CLIENTS, ENGAGEMENT, FINANCIALS, HISTORY,
                  MEETINGS, NEWS, NOTIFICATIONS, OPPORTUNITIES,
                  OPPORTUNITY_ASSIGNEES, OPPORTUNITY_STATUSES, TEAM)

app = FastAPI(title="Insights Platform Demo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sync endpoints run in a threadpool — guard shared in-memory data.
DATA_LOCK = threading.Lock()
_ids = itertools.count(1000)

TODAY = "2026-07-14"  # demo clock, keeps data deterministic

PRODUCTS = ["Global Markets", "Global Banking", "Global Lending",
            "Global Alternatives", "Prime Brokerage"]
INTERACTION_TYPES = ["Meeting", "Call", "Email"]


class ActionUpdate(BaseModel):
    status: Optional[Literal["Open", "Completed"]] = None


class ActionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    client_id: int
    detail: str = ""
    due: str = ""
    priority: Literal["high", "medium", "low"] = "medium"


class OpportunityUpdate(BaseModel):
    status: Optional[Literal["Open", "In Review", "Closed"]] = None
    assignees: Optional[List[int]] = None
    title: Optional[str] = Field(default=None, min_length=3, max_length=120)
    product: Optional[Literal["Global Markets", "Global Banking", "Global Lending",
                              "Global Alternatives", "Prime Brokerage"]] = None
    estimated_value_musd: Optional[float] = Field(default=None, ge=0)
    potential_score: Optional[int] = Field(default=None, ge=1, le=10)
    rationale: Optional[str] = Field(default=None, max_length=500)


class OpportunityCreate(BaseModel):
    client_id: int
    product: Literal["Global Markets", "Global Banking", "Global Lending",
                     "Global Alternatives", "Prime Brokerage"]
    title: str = Field(min_length=3, max_length=120)
    estimated_value_musd: float = Field(ge=0)
    rationale: str = ""


class InteractionCreate(BaseModel):
    client_id: int
    type: Literal["Meeting", "Call", "Email"]
    subject: str = Field(min_length=3, max_length=160)
    with_specialist: bool = False


class NoteCreate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class TagsUpdate(BaseModel):
    tags: List[str]


class TalkRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)


def client_map():
    return {c["id"]: c for c in CLIENTS}


def require_client(client_id: int):
    c = client_map().get(client_id)
    if not c:
        raise HTTPException(status_code=404, detail="Client not found")
    return c


def with_client(items):
    cm = client_map()
    return [{**i, "client_name": cm[i["client_id"]]["name"]} for i in items]


def assignees_of(opp_id: int):
    tm = {t["id"]: t for t in TEAM}
    return [tm[i] for i in OPPORTUNITY_ASSIGNEES.get(opp_id, []) if i in tm]


def build_insights():
    """Rule-based 'AI' insights derived from the data (Talk2GFIW)."""
    insights = []
    for c in CLIENTS:
        if c["last_interaction_days"] >= 90:
            insights.append({
                "client_id": c["id"], "client_name": c["name"],
                "text": f"{c['name']}: no contact in {c['last_interaction_days']} days. "
                        "Consider scheduling a touch-point this week.",
            })
        cash_pct = c["allocation"].get("Cash", 0)
        if cash_pct >= 25:
            insights.append({
                "client_id": c["id"], "client_name": c["name"],
                "text": f"{c['name']}: {cash_pct}% of the portfolio sits in cash. "
                        "A deployment proposal could capture the drag.",
            })
        if c["nnm_ytd_musd"] < 0:
            insights.append({
                "client_id": c["id"], "client_name": c["name"],
                "text": f"{c['name']}: net outflows of ${abs(c['nnm_ytd_musd'])}M YTD. "
                        "Worth a retention conversation.",
            })
    open_opps = [o for o in OPPORTUNITIES if o["status"] == "Open"]
    if open_opps:
        top = max(open_opps, key=lambda o: o["potential_score"])
        cm = client_map()
        insights.append({
            "client_id": top["client_id"], "client_name": cm[top["client_id"]]["name"],
            "text": f"Highest-potential open opportunity: '{top['title']}' for "
                    f"{cm[top['client_id']]['name']} (score {top['potential_score']}/10, "
                    f"${top['estimated_value_musd']}M).",
        })
    return insights


def answer_question(q: str) -> str:
    """Canned, data-grounded answers for the Talk2GFIW box."""
    ql = q.lower()
    cm = client_map()
    for c in CLIENTS:
        if c["name"].lower() in ql or c["name"].split()[0].lower() in ql:
            opps = [o for o in OPPORTUNITIES if o["client_id"] == c["id"] and o["status"] != "Closed"]
            opp_txt = (" Open opportunities: "
                       + "; ".join(f"{o['title']} (${o['estimated_value_musd']}M)" for o in opps)
                       + ".") if opps else " No open opportunities."
            return (f"{c['name']} ({c['segment']}, booked in {c['booking_location']}): "
                    f"AUM ${c['aum_musd']}M, share of wallet {c['share_of_wallet_pct']}%, "
                    f"NNM YTD ${c['nnm_ytd_musd']}M, engagement {c['engagement_score']}/10, "
                    f"last contact {c['last_interaction_days']} days ago.{opp_txt}")
    if "aum" in ql or "assets" in ql:
        return (f"Book AUM is ${FINANCIALS['tiles'][0]['value_musd']}M across {len(CLIENTS)} clients, "
                f"up ${FINANCIALS['tiles'][0]['delta_musd']}M vs. last quarter.")
    if "opportunit" in ql or "pipeline" in ql:
        open_opps = [o for o in OPPORTUNITIES if o["status"] != "Closed"]
        return (f"You have {len(open_opps)} open opportunities worth "
                f"${round(sum(o['estimated_value_musd'] for o in open_opps), 1)}M. "
                f"Highest potential: "
                f"{max(open_opps, key=lambda o: o['potential_score'])['title']}.")
    if "engag" in ql or "contact" in ql:
        stale = [c["name"] for c in CLIENTS if c["last_interaction_days"] >= 90]
        return ("Clients without contact for 90+ days: " + ", ".join(stale) + ".") if stale \
            else "All clients have been contacted within the last 90 days."
    return ("I can answer questions about your clients, AUM, pipeline and engagement. "
            "Try asking about a specific client by name.")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/home")
def home():
    open_actions = [a for a in ACTIONS if a["status"] == "Open"]
    completed = [a for a in ACTIONS if a["status"] == "Completed"]
    total = len(ACTIONS)
    return {
        "advisor": ADVISOR,
        "actions": [{**a, "notes": ACTION_NOTES.get(a["id"], [])} for a in with_client(ACTIONS)],
        "action_metrics": {
            "open": len(open_actions),
            "completed": len(completed),
            "completion_rate_pct": round(100 * len(completed) / total) if total else 0,
        },
        "news": with_client(NEWS),
        "meetings": with_client(MEETINGS),
        "history": HISTORY,
        "insights": build_insights(),
        "clients": [{"id": c["id"], "name": c["name"]} for c in CLIENTS],
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
        "history": HISTORY,
        "clients": [
            {
                "id": c["id"], "name": c["name"], "segment": c["segment"],
                "booking_location": c["booking_location"],
                "aum_musd": c["aum_musd"], "share_of_wallet_pct": c["share_of_wallet_pct"],
                "revenue_ytd_kusd": c["revenue_ytd_kusd"], "nnm_ytd_musd": c["nnm_ytd_musd"],
                "loans_musd": c["liabilities"]["Loans"], "mortgages_musd": c["liabilities"]["Mortgages"],
            }
            for c in CLIENTS
        ],
    }


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
    interactions = sorted(ENGAGEMENT["interactions"], key=lambda i: i["date"], reverse=True)
    return {
        "tiles": ENGAGEMENT["tiles"],
        "clients": clients,
        "interactions": with_client(interactions),
        "interaction_types": INTERACTION_TYPES,
        "client_options": [{"id": c["id"], "name": c["name"]} for c in CLIENTS],
    }


@app.post("/api/interactions", status_code=201)
def create_interaction(body: InteractionCreate):
    client = require_client(body.client_id)
    with DATA_LOCK:
        item = {
            "client_id": body.client_id, "type": body.type,
            "subject": body.subject, "date": TODAY,
            "with_specialist": body.with_specialist,
        }
        ENGAGEMENT["interactions"].insert(0, item)
        client["last_interaction_days"] = 0
    return {**item, "client_name": client["name"]}


@app.get("/api/opportunities")
def opportunities():
    cm = client_map()
    items = [{**o, "client_name": cm[o["client_id"]]["name"],
              "client_tags": cm[o["client_id"]]["tags"],
              "assignees": assignees_of(o["id"])} for o in OPPORTUNITIES]
    open_items = [o for o in items if o["status"] != "Closed"]
    return {
        "statuses": OPPORTUNITY_STATUSES,
        "products": PRODUCTS,
        "team": TEAM,
        "client_options": [{"id": c["id"], "name": c["name"]} for c in CLIENTS],
        "opportunities": items,
        "kpis": {
            "open": len(open_items),
            "pipeline_musd": round(sum(o["estimated_value_musd"] for o in open_items), 1),
            "avg_potential": round(sum(o["potential_score"] for o in open_items) / len(open_items), 1) if open_items else 0,
        },
    }


@app.post("/api/opportunities", status_code=201)
def create_opportunity(body: OpportunityCreate):
    client = require_client(body.client_id)
    with DATA_LOCK:
        opp = {
            "id": next(_ids), "client_id": body.client_id,
            "product": body.product, "title": body.title,
            "estimated_value_musd": body.estimated_value_musd,
            "potential_score": 5, "status": "Open",
            "lead": ADVISOR["full_name"], "updated": TODAY,
            "rationale": body.rationale or "Added manually.",
        }
        OPPORTUNITIES.append(opp)
    return {**opp, "client_name": client["name"], "client_tags": client["tags"], "assignees": []}


@app.patch("/api/opportunities/{opp_id}")
def update_opportunity(opp_id: int, update: OpportunityUpdate):
    with DATA_LOCK:
        opp = next((o for o in OPPORTUNITIES if o["id"] == opp_id), None)
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        changed = False
        for field in ("status", "title", "product", "estimated_value_musd",
                      "potential_score", "rationale"):
            value = getattr(update, field)
            if value is not None:
                opp[field] = value
                changed = True
        if update.assignees is not None:
            valid = {t["id"] for t in TEAM}
            OPPORTUNITY_ASSIGNEES[opp_id] = [i for i in update.assignees if i in valid]
            changed = True
        if changed:
            opp["updated"] = TODAY
        return {**opp, "assignees": assignees_of(opp_id)}


@app.get("/api/clients/{client_id}")
def client_one_pager(client_id: int):
    c = require_client(client_id)
    return {
        **c,
        "notes": CLIENT_NOTES.get(client_id, []),
        "history": CLIENT_HISTORY.get(client_id, []),
        "yoy": CLIENT_YOY.get(client_id, {}),
        "opportunities": [o for o in OPPORTUNITIES if o["client_id"] == client_id],
        "interactions": [i for i in ENGAGEMENT["interactions"] if i["client_id"] == client_id],
        "news": [n for n in NEWS if n["client_id"] == client_id],
    }


@app.patch("/api/clients/{client_id}/tags")
def update_tags(client_id: int, body: TagsUpdate):
    c = require_client(client_id)
    with DATA_LOCK:
        c["tags"] = [t.strip() for t in body.tags if t.strip()][:10]
        return {"tags": c["tags"]}


@app.post("/api/clients/{client_id}/notes", status_code=201)
def add_client_note(client_id: int, body: NoteCreate):
    require_client(client_id)
    with DATA_LOCK:
        note = {"id": next(_ids), "text": body.text, "created": TODAY}
        CLIENT_NOTES.setdefault(client_id, []).insert(0, note)
    return note


@app.post("/api/actions", status_code=201)
def create_action(body: ActionCreate):
    client = require_client(body.client_id)
    with DATA_LOCK:
        action = {
            "id": next(_ids), "title": body.title, "client_id": body.client_id,
            "note": "Added manually.", "detail": body.detail,
            "due": body.due or TODAY, "status": "Open", "priority": body.priority,
        }
        ACTIONS.append(action)
    return {**action, "client_name": client["name"], "notes": []}


@app.patch("/api/actions/{action_id}")
def update_action(action_id: int, update: ActionUpdate):
    with DATA_LOCK:
        action = next((a for a in ACTIONS if a["id"] == action_id), None)
        if not action:
            raise HTTPException(status_code=404, detail="Action not found")
        if update.status is not None:
            action["status"] = update.status
        return action


@app.post("/api/actions/{action_id}/notes", status_code=201)
def add_action_note(action_id: int, body: NoteCreate):
    if not any(a["id"] == action_id for a in ACTIONS):
        raise HTTPException(status_code=404, detail="Action not found")
    with DATA_LOCK:
        note = {"id": next(_ids), "text": body.text, "created": TODAY}
        ACTION_NOTES.setdefault(action_id, []).insert(0, note)
    return note


@app.get("/api/clients/{client_id}/prep")
def meeting_prep(client_id: int):
    """Meeting Prep Pack — everything a CA needs before walking into the room."""
    c = require_client(client_id)
    open_opps = [o for o in OPPORTUNITIES if o["client_id"] == client_id and o["status"] != "Closed"]
    insights = [i for i in build_insights() if i["client_id"] == client_id]

    talking_points = []
    if c["last_interaction_days"] >= 90:
        talking_points.append("Re-establish contact — acknowledge the gap since the last touch-point.")
    cash_pct = c["allocation"].get("Cash", 0)
    if cash_pct >= 15:
        talking_points.append(f"Discuss deploying the {cash_pct}% cash position.")
    if c["nnm_ytd_musd"] < 0:
        talking_points.append("Address YTD outflows and confirm the client's plans.")
    for o in open_opps:
        talking_points.append(f"Advance '{o['title']}' ({o['product']}, ${o['estimated_value_musd']}M).")
    if c["share_of_wallet_pct"] < 30:
        talking_points.append(f"Share of wallet is {c['share_of_wallet_pct']}% — explore consolidating external assets.")
    if not talking_points:
        talking_points.append("Standard relationship review — performance, goals, upcoming needs.")

    return {
        "client": {k: c[k] for k in ("id", "name", "segment", "booking_location", "domicile",
                                     "aum_musd", "share_of_wallet_pct", "engagement_score",
                                     "last_interaction_days", "tags")},
        "talking_points": talking_points,
        "open_opportunities": open_opps,
        "recent_interactions": [i for i in ENGAGEMENT["interactions"] if i["client_id"] == client_id][:5],
        "news": [n for n in NEWS if n["client_id"] == client_id],
        "notes": CLIENT_NOTES.get(client_id, [])[:5],
        "insights": insights,
    }


@app.get("/api/notifications")
def notifications():
    return {
        "items": NOTIFICATIONS,
        "unread": sum(1 for n in NOTIFICATIONS if not n["read"]),
    }


@app.post("/api/notifications/read")
def mark_notifications_read():
    with DATA_LOCK:
        for n in NOTIFICATIONS:
            n["read"] = True
    return {"unread": 0}


@app.get("/api/search")
def search(q: str = ""):
    ql = q.strip().lower()
    if len(ql) < 2:
        return {"clients": [], "opportunities": []}
    cm = client_map()
    clients = [
        {"id": c["id"], "name": c["name"], "segment": c["segment"], "aum_musd": c["aum_musd"]}
        for c in CLIENTS
        if ql in c["name"].lower() or any(ql in t.lower() for t in c["tags"])
    ]
    opps = [
        {"id": o["id"], "title": o["title"], "product": o["product"],
         "status": o["status"], "client_id": o["client_id"],
         "client_name": cm[o["client_id"]]["name"]}
        for o in OPPORTUNITIES
        if ql in o["title"].lower() or ql in o["product"].lower()
        or ql in cm[o["client_id"]]["name"].lower()
    ]
    return {"clients": clients[:5], "opportunities": opps[:5]}


@app.post("/api/talk")
def talk(body: TalkRequest):
    return {"answer": answer_question(body.question)}


# Serve the built frontend (frontend/dist) if it exists — single-port deploy.
DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if DIST.is_dir():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="frontend")
