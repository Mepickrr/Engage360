"""Agents router — exposes the 6 seeded personas."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from mock import AGENTS

router = APIRouter(prefix="/agents", tags=["agents"])

_ORDER = ["aryan", "zara", "meera", "rishi", "dev", "priya"]


async def _list_from_db(db) -> list[dict]:
    try:
        cursor = db.agents.find({}, {"_id": 0, "system_prompt": 0})
        agents = await cursor.to_list(length=20)
        return agents or []
    except Exception:
        return []


@router.get("")
async def list_agents(request: Request):
    agents = await _list_from_db(request.app.state.db)
    if not agents:
        agents = AGENTS
    agents.sort(key=lambda a: _ORDER.index(a["id"]) if a["id"] in _ORDER else 99)
    return agents


@router.get("/{agent_id}")
async def get_agent(agent_id: str, request: Request):
    agents = await _list_from_db(request.app.state.db)
    if agents:
        doc = next((a for a in agents if a["id"] == agent_id), None)
        if doc:
            return doc
    doc = next((a for a in AGENTS if a["id"] == agent_id), None)
    if not doc:
        raise HTTPException(status_code=404, detail="Agent not found")
    return doc
