"""Agents router — system personas + custom user-created agents."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agents", tags=["agents"])

# Default field values for any agent doc that pre-dates the schema extension.
DEFAULTS = {
    "is_system": True,
    "status": "active",
    "tone": "professional",
    "language_style": "casual",
    "emoji_usage": False,
    "brand_voice_sample": "",
    "agent_goal": "recovery",
    "dont_do": "",
    "store_data_access": "orders_customers",
    "success_metric": "revenue_recovered",
    "escalation_enabled": False,
    "escalation_queue": "",
    "custom_instructions": "",
    "visibility": "shown",
    "specialty_tag": "",
}

SYSTEM_LOCKED_FIELDS = {"custom_instructions", "store_data_access", "agent_goal"}


def _fill_defaults(doc: dict) -> dict:
    """Stamp any missing new fields onto a doc returned from Mongo."""
    for k, v in DEFAULTS.items():
        if k not in doc or doc[k] is None:
            doc[k] = v
    # specialty_tag falls back to existing domain.
    if not doc.get("specialty_tag"):
        doc["specialty_tag"] = doc.get("domain", "")
    return doc


class AgentCreateBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    title: Optional[str] = ""
    domain: Optional[str] = ""
    color: Optional[str] = "#8B5CF6"
    avatar_initials: Optional[str] = None
    bio: Optional[str] = ""
    suggested_prompts: Optional[list[str]] = None

    tone: Optional[str] = "professional"
    language_style: Optional[str] = "casual"
    emoji_usage: Optional[bool] = False
    brand_voice_sample: Optional[str] = ""
    agent_goal: Optional[str] = "recovery"
    dont_do: Optional[str] = ""
    store_data_access: Optional[str] = "orders_customers"
    success_metric: Optional[str] = "revenue_recovered"
    escalation_enabled: Optional[bool] = False
    escalation_queue: Optional[str] = ""
    custom_instructions: Optional[str] = ""
    visibility: Optional[str] = "shown"
    specialty_tag: Optional[str] = ""
    status: Optional[str] = "active"


class AgentUpdateBody(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    domain: Optional[str] = None
    color: Optional[str] = None
    avatar_initials: Optional[str] = None
    bio: Optional[str] = None
    suggested_prompts: Optional[list[str]] = None

    tone: Optional[str] = None
    language_style: Optional[str] = None
    emoji_usage: Optional[bool] = None
    brand_voice_sample: Optional[str] = None
    agent_goal: Optional[str] = None
    dont_do: Optional[str] = None
    store_data_access: Optional[str] = None
    success_metric: Optional[str] = None
    escalation_enabled: Optional[bool] = None
    escalation_queue: Optional[str] = None
    custom_instructions: Optional[str] = None
    visibility: Optional[str] = None
    specialty_tag: Optional[str] = None
    status: Optional[str] = None


SYSTEM_ORDER = ["aryan", "zara", "meera", "rishi", "dev", "priya"]


@router.get("")
async def list_agents(request: Request):
    db = request.app.state.db
    cursor = db.agents.find({}, {"_id": 0, "system_prompt": 0})
    agents = await cursor.to_list(length=200)
    agents = [_fill_defaults(a) for a in agents]
    # System agents first (stable order), then custom agents by created_at.
    def sort_key(a):
        if a["id"] in SYSTEM_ORDER:
            return (0, SYSTEM_ORDER.index(a["id"]))
        return (1, a.get("created_at") or "")
    agents.sort(key=sort_key)
    return agents


@router.get("/{agent_id}")
async def get_agent(agent_id: str, request: Request):
    db = request.app.state.db
    doc = await db.agents.find_one({"id": agent_id}, {"_id": 0, "system_prompt": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Agent not found")
    return _fill_defaults(doc)


@router.post("")
async def create_agent(body: AgentCreateBody, request: Request):
    db = request.app.state.db
    agent_id = f"agent_custom_{uuid.uuid4().hex[:8]}"
    initials = body.avatar_initials or (body.name.strip()[:1].upper() or "A")
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": agent_id,
        "is_system": False,
        "name": body.name.strip(),
        "title": body.title or "",
        "domain": body.domain or body.specialty_tag or "Custom",
        "color": body.color or "#8B5CF6",
        "avatar_initials": initials,
        "bio": body.bio or "",
        "suggested_prompts": body.suggested_prompts or [],
        "signals_monitored": [],
        "tone": body.tone or "professional",
        "language_style": body.language_style or "casual",
        "emoji_usage": bool(body.emoji_usage),
        "brand_voice_sample": body.brand_voice_sample or "",
        "agent_goal": body.agent_goal or "recovery",
        "dont_do": body.dont_do or "",
        "store_data_access": body.store_data_access or "orders_customers",
        "success_metric": body.success_metric or "revenue_recovered",
        "escalation_enabled": bool(body.escalation_enabled),
        "escalation_queue": body.escalation_queue or "",
        "custom_instructions": body.custom_instructions or "",
        "visibility": body.visibility or "shown",
        "specialty_tag": body.specialty_tag or body.domain or "Custom",
        "status": body.status or "active",
        "created_at": now,
        "updated_at": now,
    }
    await db.agents.insert_one(doc)
    persisted = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    return _fill_defaults(persisted)


@router.put("/{agent_id}")
async def update_agent(agent_id: str, body: AgentUpdateBody, request: Request):
    db = request.app.state.db
    existing = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Agent not found")

    update = {k: v for k, v in body.model_dump(exclude_none=True).items()}

    # Strip locked fields for system agents.
    if existing.get("is_system", True):
        for f in SYSTEM_LOCKED_FIELDS:
            update.pop(f, None)

    if not update:
        return _fill_defaults(existing)

    from datetime import datetime, timezone
    update["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.agents.update_one({"id": agent_id}, {"$set": update})
    persisted = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    return _fill_defaults(persisted)


@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, request: Request):
    db = request.app.state.db
    existing = await db.agents.find_one({"id": agent_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Agent not found")
    if existing.get("is_system", True):
        raise HTTPException(
            status_code=403,
            detail="System agents cannot be deleted.",
        )
    await db.agents.delete_one({"id": agent_id})
    return {"status": "deleted", "id": agent_id}
