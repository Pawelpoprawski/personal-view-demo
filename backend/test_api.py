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


def test_search():
    body = client.get("/api/search?q=smith").json()
    assert any(c["name"] == "John Smith" for c in body["clients"])
    assert client.get("/api/search?q=a").json() == {"clients": [], "opportunities": []}


def test_talk_answers_about_client():
    body = client.post("/api/talk", json={"question": "Tell me about James Brown"}).json()
    assert "James Brown" in body["answer"] and "AUM" in body["answer"]


def test_home_has_history_and_insights():
    body = client.get("/api/home").json()
    assert len(body["history"]) == 12
    assert len(body["insights"]) >= 1


def test_create_action_and_note():
    r = client.post("/api/actions", json={"title": "Test action", "client_id": 1})
    assert r.status_code == 201
    aid = r.json()["id"]
    n = client.post(f"/api/actions/{aid}/notes", json={"text": "hello"})
    assert n.status_code == 201 and n.json()["text"] == "hello"


def test_create_and_edit_opportunity():
    r = client.post("/api/opportunities", json={
        "client_id": 2, "product": "Global Markets",
        "title": "Test opp", "estimated_value_musd": 3.5, "rationale": "test",
    })
    assert r.status_code == 201
    oid = r.json()["id"]
    e = client.patch(f"/api/opportunities/{oid}", json={
        "title": "Edited opp", "estimated_value_musd": 7.0,
        "potential_score": 9, "assignees": [1, 3],
    })
    body = e.json()
    assert body["title"] == "Edited opp" and body["potential_score"] == 9
    assert {a["id"] for a in body["assignees"]} == {1, 3}
    assert client.patch(f"/api/opportunities/{oid}", json={"potential_score": 11}).status_code == 422


def test_create_interaction_resets_staleness():
    r = client.post("/api/interactions", json={
        "client_id": 3, "type": "Call", "subject": "Test call",
    })
    assert r.status_code == 201
    eng = client.get("/api/engagement").json()
    c3 = next(c for c in eng["clients"] if c["id"] == 3)
    assert c3["last_interaction_days"] == 0 and not c3["needs_attention"]


def test_client_tags_and_notes():
    r = client.patch("/api/clients/1/tags", json={"tags": ["Entrepreneur", "New Tag"]})
    assert r.json()["tags"] == ["Entrepreneur", "New Tag"]
    n = client.post("/api/clients/1/notes", json={"text": "client note"})
    assert n.status_code == 201
    body = client.get("/api/clients/1").json()
    assert any(x["text"] == "client note" for x in body["notes"])
    assert len(body["history"]) == 12
    assert "aum_yoy_pct" in body["yoy"]


def test_home_has_meetings():
    body = client.get("/api/home").json()
    assert len(body["meetings"]) >= 3
    assert all("client_name" in m for m in body["meetings"])


def test_prep_pack():
    body = client.get("/api/clients/3/prep").json()
    assert body["client"]["name"] == "James Brown"
    assert len(body["talking_points"]) >= 1
    assert client.get("/api/clients/999/prep").status_code == 404


def test_notifications_mark_read():
    before = client.get("/api/notifications").json()
    assert before["unread"] >= 0
    client.post("/api/notifications/read")
    after = client.get("/api/notifications").json()
    assert after["unread"] == 0
