"""Phase 2 — Flows backend test suite."""
from __future__ import annotations

import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Try to read frontend/.env directly (testing agent runs in same container)
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def reseed_at_start(session):
    """Make sure we start every run with a clean seed."""
    r = session.post(f"{API}/admin/reseed", timeout=60)
    assert r.status_code == 200, r.text
    yield


# --- LIST / DETAIL ---
class TestFlowList:
    def test_list_returns_4_flows(self, session):
        r = session.get(f"{API}/flows", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = sorted([f["id"] for f in data])
        expected = sorted([
            "flow_cart_recovery_01",
            "flow_welcome_01",
            "flow_vip_reengage_01",
            "flow_review_req_01",
        ])
        assert ids == expected, f"Got {ids}"
        # Each flow shape
        by_id = {f["id"]: f for f in data}
        assert by_id["flow_cart_recovery_01"]["status"] == "active"
        assert by_id["flow_welcome_01"]["status"] == "active"
        assert by_id["flow_vip_reengage_01"]["status"] == "paused"
        assert by_id["flow_review_req_01"]["status"] == "draft"
        for fid, f in by_id.items():
            for k in ("id", "name", "status", "channels", "audience", "performance", "updated_at"):
                assert k in f, f"{fid} missing {k}"
            perf = f["performance"]
            for pk in ("entered", "completed", "conversion_rate", "revenue_inr"):
                assert pk in perf

    def test_cart_recovery_detail(self, session):
        r = session.get(f"{API}/flows/flow_cart_recovery_01", timeout=30)
        assert r.status_code == 200
        doc = r.json()
        assert len(doc["nodes"]) == 7
        assert len(doc["edges"]) == 6
        # verify node types
        types = [n["type"] for n in doc["nodes"]]
        assert types[0] == "trigger"
        assert "condition" in types
        # condition branches labeled yes/no
        labels = sorted([e.get("label") for e in doc["edges"] if e.get("label")])
        assert labels == ["no", "yes"]

    def test_get_nonexistent_returns_404(self, session):
        r = session.get(f"{API}/flows/flow_does_not_exist", timeout=30)
        assert r.status_code == 404


# --- CREATE / UPDATE / DELETE / LIFECYCLE ---
class TestFlowCRUDLifecycle:
    def test_full_lifecycle(self, session):
        # CREATE
        r = session.post(f"{API}/flows", json={"name": "Test new flow", "nodes": [], "edges": []}, timeout=30)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["id"].startswith("flow_")
        assert created["status"] == "draft"
        assert created["name"] == "Test new flow"
        new_id = created["id"]

        # PUBLISH
        r = session.post(f"{API}/flows/{new_id}/publish", timeout=30)
        assert r.status_code == 200
        pub = r.json()
        assert pub["status"] == "active"
        assert "published_at" in pub

        # PAUSE
        r = session.post(f"{API}/flows/{new_id}/pause", timeout=30)
        assert r.status_code == 200
        paused = r.json()
        assert paused["status"] == "paused"
        assert "last_paused_at" in paused

        # RESUME
        r = session.post(f"{API}/flows/{new_id}/resume", timeout=30)
        assert r.status_code == 200
        resumed = r.json()
        assert resumed["status"] == "active"

        # DELETE (soft)
        r = session.delete(f"{API}/flows/{new_id}", timeout=30)
        assert r.status_code == 200

        # Verify excluded from list
        r = session.get(f"{API}/flows", timeout=30)
        ids = [f["id"] for f in r.json()]
        assert new_id not in ids

    def test_update_review_req(self, session):
        r = session.put(f"{API}/flows/flow_review_req_01", json={"name": "Review request v2"}, timeout=30)
        assert r.status_code == 200
        # GET confirms
        r = session.get(f"{API}/flows/flow_review_req_01", timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "Review request v2"

    def test_reseed_restores_4(self, session):
        r = session.post(f"{API}/admin/reseed", timeout=60)
        assert r.status_code == 200
        r = session.get(f"{API}/flows", timeout=30)
        ids = sorted([f["id"] for f in r.json()])
        assert ids == sorted([
            "flow_cart_recovery_01",
            "flow_welcome_01",
            "flow_vip_reengage_01",
            "flow_review_req_01",
        ])


# --- LLM modification ---
class TestFlowLLM:
    def test_conversation_autocreate(self, session):
        r = session.get(f"{API}/flows/flow_cart_recovery_01/conversation", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "conversation" in data and "messages" in data
        assert data["conversation"]["pinned_agent"] == "dev"
        assert len(data["messages"]) >= 1
        first = data["messages"][0]
        assert first["role"] == "agent"

    def test_send_flow_message_adds_node(self, session):
        # Get baseline node count
        r = session.get(f"{API}/flows/flow_review_req_01", timeout=30)
        baseline = len(r.json()["nodes"])
        assert baseline == 4

        r = session.post(
            f"{API}/flows/flow_review_req_01/messages",
            json={"content": "Add a 24h wait after the WhatsApp message"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "user_message" in data
        assert "agent_message" in data
        assert data["agent_message"].get("content")
        mod = data.get("modification")
        if mod:
            assert "nodes" in mod and "edges" in mod
            assert len(mod["nodes"]) >= 5, f"expected >=5 nodes, got {len(mod['nodes'])}"
        else:
            pytest.skip("LLM did not return a modification — flaky LLM behaviour")

        # Reseed after
        session.post(f"{API}/admin/reseed", timeout=60)

    def test_ai_modify_endpoint(self, session):
        r = session.post(
            f"{API}/flows/flow_review_req_01/ai-modify",
            json={"message": "add email fallback"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        # Response can include reply + optionally is_modification/nodes/edges
        body = r.json()
        assert "reply" in body or "is_modification" in body or "nodes" in body
        session.post(f"{API}/admin/reseed", timeout=60)


# --- from_brief_id handoff ---
class TestFromBriefHandoff:
    def test_create_from_brief_id(self, session):
        # 1. Create a Phase 1 conversation pinned to Dev to trigger flow_brief artefact
        r = session.post(
            f"{API}/conversations",
            json={
                "seed_message": "Build a cart abandonment recovery flow",
                "pinned_agent": "dev",
            },
            timeout=120,
        )
        assert r.status_code == 200, r.text
        convo = r.json()
        # Body may be {conversation, messages} or just conversation — handle both
        conv_id = convo.get("id") or (convo.get("conversation") or {}).get("id")
        assert conv_id, f"no conv id in {convo}"

        # 2. Find the agent message with pending_artefact_type=flow_brief and trigger generation
        mr = session.get(f"{API}/conversations/{conv_id}", timeout=30)
        assert mr.status_code == 200
        msgs = mr.json().get("messages") or []
        agent_msg = next((m for m in msgs if m.get("role") == "agent" and m.get("pending_artefact_type") == "flow_brief"), None)
        assert agent_msg, f"No agent msg with pending_artefact_type=flow_brief — orchestrator hardening failed: {[(m.get('role'), m.get('pending_artefact_type')) for m in msgs]}"
        gr = session.post(
            f"{API}/conversations/{conv_id}/messages/{agent_msg['id']}/generate-artefact",
            timeout=120,
        )
        assert gr.status_code == 200, gr.text
        art = (gr.json() or {}).get("artefact") or {}
        assert art.get("type") == "flow_brief"
        assert len((art.get("payload") or {}).get("nodes", [])) > 0

        # 3. POST /api/flows with from_brief_id
        r = session.post(f"{API}/flows", json={"from_brief_id": conv_id}, timeout=60)
        assert r.status_code == 200, r.text
        flow = r.json()
        assert flow["id"].startswith("flow_")
        assert flow["status"] == "draft"
        assert len(flow.get("nodes") or []) > 0

        # 4. Verify a completed task with 'built' in title
        tr = session.get(f"{API}/tasks", timeout=30)
        assert tr.status_code == 200
        tasks = tr.json() if isinstance(tr.json(), list) else tr.json().get("tasks", [])
        completed_built = [t for t in tasks if t.get("status") == "completed" and "built" in (t.get("title") or "").lower()]
        assert completed_built, "no completed task with 'built' in title"

        # Cleanup
        session.delete(f"{API}/flows/{flow['id']}", timeout=30)

    def test_from_brief_id_400_when_no_artefact(self, session):
        # Fresh conversation with no seed_message → no agent reply → no artefact
        r = session.post(f"{API}/conversations", json={}, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        conv_id = body.get("id") or (body.get("conversation") or {}).get("id")
        assert conv_id

        # POST /api/flows with from_brief_id pointing at the empty conv
        r = session.post(f"{API}/flows", json={"from_brief_id": conv_id}, timeout=30)
        assert r.status_code == 400, r.text
        detail = (r.json() or {}).get("detail") or ""
        assert "No flow_brief artefact found" in detail, detail


# --- OpenAPI ---
class TestOpenAPI:
    def test_endpoints_listed(self, session):
        r = session.get(f"{API}/openapi.json", timeout=30)
        assert r.status_code == 200
        paths = r.json().get("paths", {})
        required = [
            "/api/flows",
            "/api/flows/{flow_id}",
            "/api/flows/{flow_id}/publish",
            "/api/flows/{flow_id}/pause",
            "/api/flows/{flow_id}/resume",
            "/api/flows/{flow_id}/messages",
            "/api/flows/{flow_id}/conversation",
            "/api/flows/{flow_id}/ai-modify",
            "/api/admin/reseed",
        ]
        missing = [p for p in required if p not in paths]
        assert not missing, f"missing endpoints: {missing}"
