"""Flow endpoints — Phase 2.

GET    /api/flows
GET    /api/flows/:id
POST   /api/flows
PUT    /api/flows/:id
DELETE /api/flows/:id
POST   /api/flows/:id/publish | /pause | /resume
GET    /api/flows/:id/conversation
POST   /api/flows/:id/messages
POST   /api/flows/:id/ai-modify
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from llm.flow_modifier import modify_flow

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/flows", tags=["flows"])

# ── In-memory fallback store (used when MongoDB is unavailable) ──────────────
# Seeded with a few sample flows so the Flows list page renders immediately.
_MEM_FLOWS: dict[str, dict] = {
    "flow_sample1": {
        "id": "flow_sample1", "name": "Cart Recovery", "description": "Re-engage shoppers who left items in cart.",
        "status": "active", "channels": ["whatsapp", "email"],
        "lifecycle_stage": "Conversion", "health": "critical",
        "nodes": [], "edges": [],
        "performance": {"entered": 12430, "completed": 204, "conversion_rate": 1.6, "revenue_inr": 84200},
        "created_at": "2025-01-01T00:00:00+00:00", "updated_at": "2025-05-28T10:00:00+00:00",
    },
    "flow_sample2": {
        "id": "flow_sample2", "name": "Welcome Series", "description": "Onboard new subscribers over 3 days.",
        "status": "active", "channels": ["email", "push"],
        "lifecycle_stage": "Acquisition", "health": "warning",
        "nodes": [], "edges": [],
        "performance": {"entered": 6820, "completed": 490, "conversion_rate": 7.2, "revenue_inr": 41000},
        "created_at": "2025-02-01T00:00:00+00:00", "updated_at": "2025-05-27T08:00:00+00:00",
    },
    "flow_sample3": {
        "id": "flow_sample3", "name": "Checkout Recovery", "description": "Target users who reached checkout but didn't pay.",
        "status": "active", "channels": ["whatsapp", "email"],
        "lifecycle_stage": "Conversion", "health": "healthy",
        "nodes": [], "edges": [],
        "performance": {"entered": 9310, "completed": 310, "conversion_rate": 3.3, "revenue_inr": 184000},
        "created_at": "2025-03-01T00:00:00+00:00", "updated_at": "2025-05-28T12:00:00+00:00",
    },
    "flow_sample4": {
        "id": "flow_sample4", "name": "Re-engagement — 90 Day Lapsed", "description": "Win back customers dormant for 90+ days.",
        "status": "inactive", "channels": ["email", "sms"],
        "lifecycle_stage": "Re-engagement", "health": "healthy",
        "nodes": [], "edges": [],
        "performance": {"entered": 3200, "completed": 44, "conversion_rate": 1.4, "revenue_inr": 18400},
        "created_at": "2025-04-01T00:00:00+00:00", "updated_at": "2025-05-25T09:00:00+00:00",
    },
}


async def _db_list_flows(db) -> list[dict] | None:
    try:
        docs = await db.flows.find({"deleted": {"$ne": True}}, {"_id": 0}).sort("updated_at", -1).to_list(length=200)
        return docs
    except Exception:
        return None


async def _db_get_flow(db, flow_id: str) -> dict | None:
    try:
        return await db.flows.find_one({"id": flow_id}, {"_id": 0})
    except Exception:
        return None


async def _db_insert_flow(db, doc: dict) -> bool:
    try:
        await db.flows.insert_one(doc)
        return True
    except Exception:
        return False


async def _db_update_flow(db, flow_id: str, update: dict) -> dict | None:
    try:
        result = await db.flows.update_one({"id": flow_id}, {"$set": update})
        if result.matched_count == 0:
            return None
        return await db.flows.find_one({"id": flow_id}, {"_id": 0})
    except Exception:
        return None


# --- helpers ---
def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _derive_channels(nodes: list[dict]) -> list[str]:
    seen = []
    for n in nodes or []:
        if n.get("type") == "channel":
            ch = (n.get("data") or {}).get("channel")
            if ch and ch not in seen:
                seen.append(ch)
    return seen


def _summary(doc: dict) -> dict:
    """Strip heavy fields for list view."""
    return {
        "id": doc["id"],
        "name": doc.get("name", ""),
        "description": doc.get("description", ""),
        "status": doc.get("status", "draft"),
        "channels": doc.get("channels") or _derive_channels(doc.get("nodes") or []),
        "audience": doc.get("audience"),
        "performance": doc.get("performance"),
        "updated_at": doc.get("updated_at"),
        "created_at": doc.get("created_at"),
    }


# --- request bodies ---
class CreateFlowBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[list[dict]] = None
    edges: Optional[list[dict]] = None
    audience: Optional[dict] = None
    from_brief_id: Optional[str] = None


class UpdateFlowBody(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["draft", "active", "paused"]] = None
    nodes: Optional[list[dict]] = None
    edges: Optional[list[dict]] = None
    audience: Optional[dict] = None


class AiModifyBody(BaseModel):
    message: str = Field(..., min_length=1)


class FlowMessageBody(BaseModel):
    content: str = Field(..., min_length=1)


# --- list & detail ---
@router.get("")
async def list_flows(request: Request):
    db = request.app.state.db
    docs = await _db_list_flows(db)
    if docs is None:
        # MongoDB unavailable — serve in-memory store
        docs = sorted(_MEM_FLOWS.values(), key=lambda d: d.get("updated_at", ""), reverse=True)
    return [_summary(d) for d in docs]


@router.get("/{flow_id}")
async def get_flow(flow_id: str, request: Request):
    db = request.app.state.db
    doc = await _db_get_flow(db, flow_id)
    if doc is None:
        doc = _MEM_FLOWS.get(flow_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Flow not found")
    return doc


# --- create (from scratch or from a brief) ---
async def _build_from_brief(db, brief_conv_id: str) -> Optional[dict]:
    """Find the most recent flow_brief artefact on a conversation and convert
    it to a builder-ready {nodes, edges, audience, channels, name, description}.
    Returns None if no flow_brief artefact exists on the conversation.
    """
    msg = await db.messages.find_one(
        {
            "conversation_id": brief_conv_id,
            "artefact.type": "flow_brief",
        },
        {"_id": 0},
        sort=[("created_at", -1)],
    )
    if not msg or not msg.get("artefact"):
        return None
    payload = msg["artefact"].get("payload") or {}
    brief_nodes = payload.get("nodes") or []

    # Map brief nodes (lightweight shape) → ReactFlow nodes with positions.
    type_map = {
        "trigger": "trigger",
        "wait": "wait",
        "channel": "channel",
        "condition": "condition",
        "end": "end",
    }
    nodes: list[dict] = []
    for i, bn in enumerate(brief_nodes):
        n_type = type_map.get(bn.get("type"), "channel")
        node_data: dict[str, Any] = {"label": bn.get("label") or n_type.title()}
        ch = bn.get("channel")
        if ch:
            node_data["channel"] = ch
        if n_type == "wait" and bn.get("duration_minutes"):
            node_data["duration_minutes"] = bn["duration_minutes"]
        if n_type == "condition" and bn.get("branches"):
            node_data["branches"] = bn["branches"]
        if bn.get("branch"):
            node_data["branch"] = bn["branch"]
        nodes.append(
            {
                "id": bn.get("id") or f"n{i+1}",
                "type": n_type,
                "position": {"x": 260, "y": 80 + i * 120},
                "data": node_data,
            }
        )

    # Build edges connecting in sequence. Condition nodes spawn 2 edges where
    # the next two siblings are interpreted as yes/no in order.
    edges: list[dict] = []
    for i, n in enumerate(nodes):
        if i + 1 < len(nodes):
            edges.append(
                {
                    "id": f"e{i+1}",
                    "source": n["id"],
                    "target": nodes[i + 1]["id"],
                }
            )

    segment = payload.get("segment") or {}
    audience = {
        "segment_name": segment.get("name"),
        "estimated_users": segment.get("estimated_users"),
    }

    return {
        "name": payload.get("name") or "New flow from brief",
        "description": payload.get("goal") or "",
        "nodes": nodes,
        "edges": edges,
        "audience": audience,
        "channels": payload.get("channels") or _derive_channels(nodes),
    }


@router.post("")
async def create_flow(body: CreateFlowBody, request: Request):
    db = request.app.state.db
    flow_id = f"flow_{uuid.uuid4().hex[:10]}"

    brief_summary: Optional[dict] = None
    if body.from_brief_id:
        brief_summary = await _build_from_brief(db, body.from_brief_id)
        if brief_summary is None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No flow_brief artefact found on the source conversation. "
                    "Generate the artefact first via /generate-artefact."
                ),
            )

    nodes = (brief_summary or {}).get("nodes") if brief_summary else (body.nodes or [])
    edges = (brief_summary or {}).get("edges") if brief_summary else (body.edges or [])
    name = (
        body.name
        or (brief_summary or {}).get("name")
        or "Untitled flow"
    )
    description = (
        body.description
        if body.description is not None
        else (brief_summary or {}).get("description") or ""
    )
    audience = (
        body.audience
        if body.audience is not None
        else (brief_summary or {}).get("audience")
    )

    doc = {
        "id": flow_id,
        "name": name,
        "description": description,
        "status": "draft",
        "channels": _derive_channels(nodes),
        "audience": audience,
        "goal": (brief_summary or {}).get("description"),
        "nodes": nodes,
        "edges": edges,
        "performance": {
            "entered": 0,
            "completed": 0,
            "conversion_rate": 0,
            "revenue_inr": 0,
        },
        "created_at": _iso_now(),
        "updated_at": _iso_now(),
    }
    if body.from_brief_id:
        doc["origin_brief_conversation_id"] = body.from_brief_id

    # Keep a clean copy before insert_one mutates it with _id
    doc_clean = {k: v for k, v in doc.items() if k != "_id"}
    inserted = await _db_insert_flow(db, doc)
    if not inserted:
        _MEM_FLOWS[flow_id] = doc_clean
        return doc_clean

    # If created from a brief, also create a "Completed" task summarising the handoff.
    if body.from_brief_id:
        task_id = f"task-handoff-{uuid.uuid4().hex[:6]}"
        agent_id = "aryan"
        # Try to attribute the task to the brief's primary agent if known
        convo = await db.conversations.find_one(
            {"id": body.from_brief_id}, {"_id": 0}
        )
        if convo and convo.get("pinned_agent"):
            agent_id = convo["pinned_agent"]
        await db.tasks.insert_one(
            {
                "id": task_id,
                "title": f"{agent_id.capitalize()} built {name} — published to drafts",
                "agent_id": agent_id,
                "origin": "agent",
                "status": "completed",
                "summary": f"Flow brief approved and copied to /flows/builder/{flow_id}.",
                "outcome_text": "Created as draft. Review and publish from the builder.",
                "conversation_id": body.from_brief_id,
                "step_progress": [
                    {"id": "s1", "label": "Brief drafted in conversation", "status": "done", "timestamp": _iso_now()},
                    {"id": "s2", "label": "Approved and handed off to builder", "status": "done", "timestamp": _iso_now()},
                ],
                "created_at": _iso_now(),
                "updated_at": _iso_now(),
            }
        )

    return await _db_get_flow(db, flow_id) or _MEM_FLOWS.get(flow_id) or doc_clean


@router.put("/{flow_id}")
async def update_flow(flow_id: str, body: UpdateFlowBody, request: Request):
    db = request.app.state.db
    update: dict[str, Any] = {"updated_at": _iso_now()}
    if body.name is not None:        update["name"] = body.name
    if body.description is not None: update["description"] = body.description
    if body.status is not None:      update["status"] = body.status
    if body.nodes is not None:
        update["nodes"] = body.nodes
        update["channels"] = _derive_channels(body.nodes)
    if body.edges is not None:       update["edges"] = body.edges
    if body.audience is not None:    update["audience"] = body.audience

    updated = await _db_update_flow(db, flow_id, update)
    if updated:
        return updated

    # MongoDB unavailable — update in-memory store
    existing = _MEM_FLOWS.get(flow_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Flow not found")
    existing.update(update)
    return existing


@router.delete("/{flow_id}")
async def delete_flow(flow_id: str, request: Request):
    db = request.app.state.db
    result = await db.flows.update_one(
        {"id": flow_id},
        {"$set": {"deleted": True, "updated_at": _iso_now()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"status": "deleted", "id": flow_id}


# --- lifecycle ---
async def _set_status(db, flow_id: str, status: str, extra: dict | None = None) -> dict:
    update = {"status": status, "updated_at": _iso_now()}
    if extra:
        update.update(extra)
    result = await db.flows.update_one({"id": flow_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return await db.flows.find_one({"id": flow_id}, {"_id": 0})


@router.post("/{flow_id}/publish")
async def publish_flow(flow_id: str, request: Request):
    db = request.app.state.db
    return await _set_status(
        db, flow_id, "active", {"published_at": _iso_now()}
    )


@router.post("/{flow_id}/pause")
async def pause_flow(flow_id: str, request: Request):
    db = request.app.state.db
    return await _set_status(
        db, flow_id, "paused", {"last_paused_at": _iso_now()}
    )


@router.post("/{flow_id}/resume")
async def resume_flow(flow_id: str, request: Request):
    db = request.app.state.db
    return await _set_status(db, flow_id, "active")


# --- Dev side-panel conversation ---
async def _get_or_create_flow_conversation(db, flow_id: str) -> dict:
    convo = await db.conversations.find_one(
        {"flow_id": flow_id}, {"_id": 0}
    )
    if convo:
        return convo
    new_convo = {
        "id": f"conv-flow-{uuid.uuid4()}",
        "title": f"Dev · flow builder ({flow_id})",
        "pinned_agent": "dev",
        "source": "flow_builder",
        "flow_id": flow_id,
        "agents_involved": ["dev"],
        "last_message_preview": None,
        "created_at": _iso_now(),
        "updated_at": _iso_now(),
    }
    await db.conversations.insert_one(new_convo)
    # Seed Dev's greeting
    greeting = {
        "id": f"msg-{uuid.uuid4()}",
        "conversation_id": new_convo["id"],
        "role": "agent",
        "agent_id": "dev",
        "content": (
            "Hi, I'm Dev. Ask me to add steps, change channels, reorder waits, "
            "or split branches and I'll update the canvas."
        ),
        "created_at": _iso_now(),
    }
    await db.messages.insert_one({**greeting})
    return new_convo


@router.get("/{flow_id}/conversation")
async def get_flow_conversation(flow_id: str, request: Request):
    db = request.app.state.db
    flow = await db.flows.find_one({"id": flow_id}, {"_id": 0})
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    convo = await _get_or_create_flow_conversation(db, flow_id)
    msgs = (
        await db.messages.find({"conversation_id": convo["id"]}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(length=200)
    )
    return {"conversation": convo, "messages": msgs}


@router.post("/{flow_id}/messages")
async def send_flow_message(
    flow_id: str, body: FlowMessageBody, request: Request
):
    """Combined endpoint — persists the user message, calls Dev's flow modifier,
    persists the agent reply, optionally rewrites the flow."""
    db = request.app.state.db
    flow = await db.flows.find_one({"id": flow_id}, {"_id": 0})
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")

    convo = await _get_or_create_flow_conversation(db, flow_id)
    content = body.content.strip()

    now = _iso_now()
    user_msg = {
        "id": f"msg-{uuid.uuid4()}",
        "conversation_id": convo["id"],
        "role": "user",
        "content": content,
        "created_at": now,
    }
    await db.messages.insert_one({**user_msg})

    result = await modify_flow(flow=flow, user_message=content)

    agent_msg = {
        "id": f"msg-{uuid.uuid4()}",
        "conversation_id": convo["id"],
        "role": "agent",
        "agent_id": "dev",
        "content": result.get("reply") or "Done.",
        "created_at": _iso_now(),
    }

    modification: Optional[dict] = None
    if result.get("is_modification"):
        new_nodes = result["nodes"]
        new_edges = result["edges"]
        await db.flows.update_one(
            {"id": flow_id},
            {
                "$set": {
                    "nodes": new_nodes,
                    "edges": new_edges,
                    "channels": _derive_channels(new_nodes),
                    "updated_at": _iso_now(),
                }
            },
        )
        agent_msg["flow_modification"] = {
            "nodes": new_nodes,
            "edges": new_edges,
        }
        modification = agent_msg["flow_modification"]

    await db.messages.insert_one({**agent_msg})

    await db.conversations.update_one(
        {"id": convo["id"]},
        {
            "$set": {
                "updated_at": _iso_now(),
                "last_message_preview": (agent_msg["content"] or "")[:140],
            }
        },
    )

    return {
        "user_message": user_msg,
        "agent_message": agent_msg,
        "modification": modification,
    }


@router.post("/{flow_id}/ai-modify")
async def ai_modify(flow_id: str, body: AiModifyBody, request: Request):
    """Direct LLM modification endpoint — bypasses the conversation thread.
    Useful for programmatic edits."""
    db = request.app.state.db
    flow = await db.flows.find_one({"id": flow_id}, {"_id": 0})
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    result = await modify_flow(flow=flow, user_message=body.message)
    if result.get("is_modification"):
        new_nodes = result["nodes"]
        new_edges = result["edges"]
        await db.flows.update_one(
            {"id": flow_id},
            {
                "$set": {
                    "nodes": new_nodes,
                    "edges": new_edges,
                    "channels": _derive_channels(new_nodes),
                    "updated_at": _iso_now(),
                }
            },
        )
    return result
