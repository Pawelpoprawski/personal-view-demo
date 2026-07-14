"""API tests. Run from backend/:  python -m pytest test_api.py -q"""
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_home_shape():
    body = client.get("/api/home").json()
    assert body["advisor"]["name"]
    assert {"open", "completed", "completion_rate_pct"} <= body["action_metrics"].keys()
    assert all("client_name" in a for a in body["actions"])
    assert all("client_name" in n for n in body["news"])


def test_financials_shape():
    body = client.get("/api/financials").json()
    assert len(body["tiles"]) == 5
    assert sum(a["pct"] for a in body["allocation"]) == 100
    assert all("share_of_wallet_pct" in c for c in body["clients"])


def test_engagement_flags_stale_clients():
    body = client.get("/api/engagement").json()
    for c in body["clients"]:
        assert c["needs_attention"] == (c["last_interaction_days"] >= 90)
    # sorted by staleness, most stale first
    days = [c["last_interaction_days"] for c in body["clients"]]
    assert days == sorted(days, reverse=True)


def test_opportunities_kpis_exclude_closed():
    body = client.get("/api/opportunities").json()
    open_items = [o for o in body["opportunities"] if o["status"] != "Closed"]
    assert body["kpis"]["open"] == len(open_items)
    assert body["kpis"]["pipeline_musd"] == round(
        sum(o["estimated_value_musd"] for o in open_items), 1
    )


def test_client_one_pager():
    body = client.get("/api/clients/1").json()
    assert body["name"]
    assert {"opportunities", "interactions", "news"} <= body.keys()
    assert client.get("/api/clients/999").status_code == 404


def test_action_update_roundtrip():
    r = client.patch("/api/actions/1", json={"status": "Completed"})
    assert r.status_code == 200 and r.json()["status"] == "Completed"
    r = client.patch("/api/actions/1", json={"status": "Open"})
    assert r.status_code == 200 and r.json()["status"] == "Open"
    assert client.patch("/api/actions/999", json={"status": "Open"}).status_code == 404
    # invalid status rejected by validation
    assert client.patch("/api/actions/1", json={"status": "Nope"}).status_code == 422


def test_opportunity_update_roundtrip():
    r = client.patch("/api/opportunities/1", json={"status": "In Review"})
    assert r.status_code == 200 and r.json()["status"] == "In Review"
    client.patch("/api/opportunities/1", json={"status": "Open"})
    assert client.patch("/api/opportunities/1", json={"status": "Bad"}).status_code == 422
