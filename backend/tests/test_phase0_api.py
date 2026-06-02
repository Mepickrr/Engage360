"""
Engage 360 — Phase 0 backend tests.
Covers: /api/health, /api/me, /api/openapi.json, CORS.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # frontend .env is the source of truth for the external URL
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip()
                    break
    except Exception:
        pass

BASE_URL = (BASE_URL or "").rstrip("/")


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- /api/health ---
class TestHealth:
    def test_health_returns_200_and_status_ok(self, session):
        r = session.get(f"{BASE_URL}/api/health", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "ok"


# --- /api/me (hardcoded Phase 0) ---
class TestMe:
    def test_me_returns_200(self, session):
        r = session.get(f"{BASE_URL}/api/me", timeout=15)
        assert r.status_code == 200, r.text

    def test_me_payload_shape_and_values(self, session):
        r = session.get(f"{BASE_URL}/api/me", timeout=15)
        data = r.json()
        # user
        assert data["user"]["name"] == "Himanshu"
        assert data["user"]["initials"] == "HK"
        # tenant
        assert data["tenant"]["id"] == "tspkarix"
        assert data["tenant"]["name"] == "TSPKARIX"
        # wallet
        assert data["wallet"]["balance"] == -1094785.66
        assert data["wallet"]["currency"] == "INR"


# --- /api/openapi.json (must live under /api/* for ingress) ---
class TestOpenAPI:
    def test_openapi_under_api_prefix(self, session):
        r = session.get(f"{BASE_URL}/api/openapi.json", timeout=15)
        assert r.status_code == 200, r.text
        spec = r.json()
        # OpenAPI 3.x
        assert "openapi" in spec
        assert spec["openapi"].startswith("3."), spec["openapi"]
        assert "paths" in spec
        # Our two key endpoints should be present
        assert "/api/health" in spec["paths"]
        assert "/api/me" in spec["paths"]


# --- CORS ---
class TestCORS:
    def test_cors_header_present_on_get(self, session):
        r = session.get(
            f"{BASE_URL}/api/health",
            headers={"Origin": "https://example.com"},
            timeout=15,
        )
        assert r.status_code == 200
        # FastAPI CORSMiddleware echoes the Origin (or sends *).
        acao = r.headers.get("access-control-allow-origin")
        assert acao is not None, f"Missing Access-Control-Allow-Origin. Headers: {dict(r.headers)}"

    def test_cors_preflight(self, session):
        r = session.options(
            f"{BASE_URL}/api/me",
            headers={
                "Origin": "https://example.com",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type",
            },
            timeout=15,
        )
        # Preflight should be 200/204
        assert r.status_code in (200, 204), r.text
        assert r.headers.get("access-control-allow-origin") is not None
