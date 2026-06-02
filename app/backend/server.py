"""Engage 360 backend — Phase 1.

Wires:
  * /api/health  /api/me  (Phase 0)
  * /api/agents, /api/store-stats, /api/intelligence-cards, /api/reports,
    /api/tasks, /api/conversations, /api/ask-ai/suggestions, /api/llm/*
  * Idempotent startup seed.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict
from starlette.middleware.cors import CORSMiddleware

from routes import agents as agents_routes
from routes import admin as admin_routes
from routes import conversations as conversations_routes
from routes import flows as flows_routes
from routes import intelligence as intelligence_routes
from routes import llm_admin as llm_admin_routes
from routes import reports as reports_routes
from routes import stats as stats_routes
from routes import tasks as tasks_routes
from seed import seed_all

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# --- MongoDB ---
mongo_url = os.environ["MONGO_URL"]
db_name = os.environ.get("DB_NAME", "engage360")
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# --- FastAPI app ---
app = FastAPI(
    title="Engage 360 API",
    description="Engage 360 — Customer Engagement Platform backend (Phase 1).",
    version="0.2.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.db = db


# --- Phase 0 models / endpoints retained ---
class HealthResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    status: str


class UserInfo(BaseModel):
    name: str
    initials: str


class TenantInfo(BaseModel):
    id: str
    name: str


class WalletInfo(BaseModel):
    balance: float
    currency: str


class MeResponse(BaseModel):
    user: UserInfo
    tenant: TenantInfo
    wallet: WalletInfo
    role: Optional[str] = "SSO User"


api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Engage 360 API — Phase 1"}


@api_router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse(status="ok")


@api_router.get("/me", response_model=MeResponse)
async def me():
    return MeResponse(
        user=UserInfo(name="Himanshu", initials="HK"),
        tenant=TenantInfo(id="tspkarix", name="TSPKARIX"),
        wallet=WalletInfo(balance=-1094785.66, currency="INR"),
        role="SSO User",
    )


# --- Phase 1 sub-routers mounted under /api ---
api_router.include_router(agents_routes.router)
api_router.include_router(stats_routes.router)
api_router.include_router(intelligence_routes.router)
api_router.include_router(reports_routes.router)
api_router.include_router(tasks_routes.router)
api_router.include_router(conversations_routes.router)
api_router.include_router(flows_routes.router)
api_router.include_router(llm_admin_routes.router)
api_router.include_router(admin_routes.router)

app.include_router(api_router)


# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Startup / shutdown ---
@app.on_event("startup")
async def on_startup():
    try:
        await seed_all(db)
    except Exception:
        logger.exception("Seed failed — continuing with partial state")


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
