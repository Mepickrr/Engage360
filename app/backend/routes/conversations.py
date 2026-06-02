"""Conversations + Messages routes — the heart of Phase 1.

POST /api/conversations
POST /api/conversations/:id/messages   (triggers orchestrator + LLM)
GET  /api/conversations
GET  /api/conversations/:id
"""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from llm.artefacts import generate_artefact
from llm.client import chat
from llm.orchestrator import route as orchestrator_route
from llm.personas import PERSONA_BY_ID

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations", tags=["conversations"])

GENERIC_ERROR = "We hit a snag generating that response. Try again or rephrase."


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _short_title(text: str, fallback: str = "New conversation") -> str:
    text = (text or "").strip()
    if not text:
        return fallback
    short = text.split("\n", 1)[0]
    return short[:80] + ("..." if len(short) > 80 else "")


def _truncate(text: str, limit: int = 140) -> str:
    text = (text or "").strip().replace("\n", " ")
    if len(text) <= limit:
        return text
    return text[:limit].rstrip() + "..."


# --- Request bodies ---
class CreateConversationBody(BaseModel):
    seed_message: Optional[str] = None
    pinned_agent: Optional[str] = None
    source: Optional[str] = "ask_ai"


class SendMessageBody(BaseModel):
    content: str
    pinned_agent: Optional[str] = None


# --- Helpers ---
async def _load_history(db, conversation_id: str, limit: int = 30) -> list[dict]:
    msgs = (
        await db.messages.find({"conversation_id": conversation_id}, {"_id": 0})
        .sort("created_at", 1)
        .to_list(length=limit)
    )
    return msgs


def _history_for_llm(messages: list[dict], agent_id: str) -> list[dict]:
    """Convert stored messages to OpenAI-style messages for the agent persona."""
    persona = PERSONA_BY_ID.get(agent_id) or PERSONA_BY_ID["aryan"]
    out: list[dict] = [{"role": "system", "content": persona["system_prompt"]}]
    for m in messages:
        if m.get("role") == "user":
            out.append({"role": "user", "content": m.get("content", "")})
        elif m.get("role") == "agent":
            out.append({"role": "assistant", "content": m.get("content", "")})
    return out


async def _persist_messages(db, conversation_id: str, msgs: list[dict]) -> None:
    if msgs:
        # insert_many mutates docs by appending _id (ObjectId). Insert a deep copy
        # so callers can serialise the originals safely.
        from copy import deepcopy

        await db.messages.insert_many([deepcopy(m) for m in msgs])


async def _update_conversation_meta(
    db,
    conversation_id: str,
    last_preview: str,
    agents_involved: list[str],
) -> None:
    await db.conversations.update_one(
        {"id": conversation_id},
        {
            "$set": {
                "last_message_preview": _truncate(last_preview),
                "updated_at": _iso_now(),
            },
            "$addToSet": {"agents_involved": {"$each": agents_involved}},
        },
    )


async def _handle_user_turn(
    db,
    conversation_id: str,
    content: str,
    pinned_agent: Optional[str],
) -> dict:
    """Persist user msg, route, get agent reply, optionally generate artefact."""
    now = _iso_now()
    user_msg = {
        "id": f"msg-{uuid.uuid4()}",
        "conversation_id": conversation_id,
        "role": "user",
        "content": content,
        "created_at": now,
    }

    # Persist user message immediately so the UI thread can show it.
    await _persist_messages(db, conversation_id, [user_msg])

    # Load history for routing + agent reply (excluding the just-added user msg's persistence ordering)
    history = await _load_history(db, conversation_id)

    history_for_routing = [
        {"role": "user" if m["role"] == "user" else "assistant", "content": m["content"]}
        for m in history
    ]

    routing = await orchestrator_route(
        user_message=content,
        conversation_history=history_for_routing,
        pinned_agent=pinned_agent,
    )

    primary_agent = routing["primary_agent"]
    supporting = routing.get("supporting_agents") or []

    collab_block = ""
    if supporting:
        names = [PERSONA_BY_ID[a]["name"] for a in supporting if a in PERSONA_BY_ID]
        if names:
            collab_block = (
                "\n\nCOLLABORATION CONTEXT:\n"
                f"You are responding with input from {', '.join(names)}. "
                "Open with a one-line note like 'Working with " + ", ".join(names) + ".'"
            )

    llm_messages = _history_for_llm(history, primary_agent)
    if collab_block:
        # Augment system message with collaboration hint
        llm_messages[0]["content"] = llm_messages[0]["content"] + collab_block

    new_messages: list[dict] = []
    try:
        result = await chat(messages=llm_messages, session_id=conversation_id)
        agent_text = (result.get("content") or "").strip() or GENERIC_ERROR
    except Exception:
        logger.exception("Primary agent chat failed")
        agent_text = GENERIC_ERROR

    agent_msg = {
        "id": f"msg-{uuid.uuid4()}",
        "conversation_id": conversation_id,
        "role": "agent",
        "agent_id": primary_agent,
        "content": agent_text,
        "created_at": _iso_now(),
    }
    if supporting:
        agent_msg["collaboration"] = {"agents": [primary_agent, *supporting]}

    # Defer artefact to a separate /generate-artefact endpoint — this keeps the
    # chat reply snappy. The frontend reads `pending_artefact_type` and triggers
    # the second pass when it wants to enter Build Mode.
    artefact_type = routing.get("artefact_type")
    if artefact_type and agent_text != GENERIC_ERROR:
        agent_msg["pending_artefact_type"] = artefact_type

    new_messages.append(agent_msg)

    await _persist_messages(db, conversation_id, new_messages)

    involved = [primary_agent, *supporting]
    await _update_conversation_meta(
        db,
        conversation_id,
        last_preview=agent_text,
        agents_involved=involved,
    )

    # Title from first user message if still default
    convo = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if convo and convo.get("title", "").startswith("New conversation"):
        await db.conversations.update_one(
            {"id": conversation_id},
            {"$set": {"title": _short_title(content)}},
        )

    return {
        "messages": [user_msg, *new_messages],
        "routing": routing,
    }


# --- Endpoints ---
@router.get("")
async def list_conversations(request: Request):
    db = request.app.state.db
    convos = (
        await db.conversations.find({}, {"_id": 0})
        .sort("updated_at", -1)
        .to_list(length=50)
    )
    return convos


@router.post("")
async def create_conversation(body: CreateConversationBody, request: Request):
    db = request.app.state.db
    convo_id = f"conv-{uuid.uuid4()}"
    title = _short_title(body.seed_message or "", fallback="New conversation")
    doc = {
        "id": convo_id,
        "title": title,
        "pinned_agent": body.pinned_agent,
        "source": body.source or "ask_ai",
        "agents_involved": [body.pinned_agent] if body.pinned_agent else [],
        "last_message_preview": None,
        "created_at": _iso_now(),
        "updated_at": _iso_now(),
    }
    await db.conversations.insert_one(doc)

    response = {"conversation": doc, "messages": [], "routing": None}

    # If a seed message was provided, run a user turn immediately.
    if body.seed_message and body.seed_message.strip():
        try:
            turn = await asyncio.wait_for(
                _handle_user_turn(
                    db=db,
                    conversation_id=convo_id,
                    content=body.seed_message.strip(),
                    pinned_agent=body.pinned_agent,
                ),
                timeout=120.0,
            )
            response["messages"] = turn["messages"]
            response["routing"] = turn["routing"]
        except asyncio.TimeoutError:
            logger.warning("Seed-message turn timed out for %s", convo_id)
            error_msg = {
                "id": f"msg-{uuid.uuid4()}",
                "conversation_id": convo_id,
                "role": "system",
                "content": GENERIC_ERROR,
                "created_at": _iso_now(),
            }
            await _persist_messages(db, convo_id, [error_msg])
            response["messages"] = [error_msg]
        except Exception:
            logger.exception("Seed-message turn failed for %s", convo_id)
            error_msg = {
                "id": f"msg-{uuid.uuid4()}",
                "conversation_id": convo_id,
                "role": "system",
                "content": GENERIC_ERROR,
                "created_at": _iso_now(),
            }
            await _persist_messages(db, convo_id, [error_msg])
            response["messages"] = [error_msg]

    # Re-read convo so caller has latest title / preview
    response["conversation"] = await db.conversations.find_one(
        {"id": convo_id}, {"_id": 0}
    )
    return response


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, request: Request):
    db = request.app.state.db
    convo = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = await _load_history(db, conversation_id, limit=200)
    return {"conversation": convo, "messages": msgs}


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str, body: SendMessageBody, request: Request
):
    db = request.app.state.db
    convo = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    content = (body.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content is empty")

    try:
        turn = await asyncio.wait_for(
            _handle_user_turn(
                db=db,
                conversation_id=conversation_id,
                content=content,
                # Use the body's pin only — don't sticky-route to the conversation's
                # original pinned_agent. The frontend always sends the current
                # store value (null when the user toggles back to Auto), so the
                # orchestrator can re-route to a different agent when the user's
                # intent clearly shifts domain.
                pinned_agent=body.pinned_agent,
            ),
            timeout=120.0,
        )
        return turn
    except asyncio.TimeoutError:
        logger.warning("User turn timed out for %s", conversation_id)
        error_msg = {
            "id": f"msg-{uuid.uuid4()}",
            "conversation_id": conversation_id,
            "role": "system",
            "content": GENERIC_ERROR,
            "created_at": _iso_now(),
        }
        await _persist_messages(db, conversation_id, [error_msg])
        return {"messages": [error_msg], "routing": None}


@router.post("/{conversation_id}/messages/{message_id}/generate-artefact")
async def generate_message_artefact(
    conversation_id: str, message_id: str, request: Request
):
    """Second-pass artefact generation — called by the frontend when entering Build Mode."""
    db = request.app.state.db
    msg = await db.messages.find_one(
        {"id": message_id, "conversation_id": conversation_id}, {"_id": 0}
    )
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if msg.get("artefact"):
        return msg  # Already generated — idempotent.

    artefact_type = msg.get("pending_artefact_type")
    if not artefact_type:
        raise HTTPException(status_code=400, detail="Message has no pending artefact")

    # Find the matching user message just before this agent message
    history = await _load_history(db, conversation_id, limit=200)
    user_message_text = ""
    for prior in reversed(history):
        if prior["id"] == message_id:
            continue
        if prior.get("role") == "user":
            user_message_text = prior.get("content", "")
            break

    artefact_model = os.environ.get("ARTEFACT_LLM_MODEL") or "openai/gpt-5-mini"

    try:
        payload = await asyncio.wait_for(
            generate_artefact(
                artefact_type=artefact_type,
                user_message=user_message_text,
                agent_id=msg.get("agent_id") or "aryan",
                agent_chat_reply=msg.get("content", ""),
                model=artefact_model,
            ),
            timeout=90.0,
        )
    except asyncio.TimeoutError:
        logger.warning("Artefact gen timed out for %s", message_id)
        payload = None
    except Exception:
        logger.exception("Artefact gen failed for %s", message_id)
        payload = None

    if not payload:
        raise HTTPException(status_code=502, detail="Artefact generation failed")

    await db.messages.update_one(
        {"id": message_id},
        {
            "$set": {"artefact": {"type": artefact_type, "payload": payload}},
            "$unset": {"pending_artefact_type": ""},
        },
    )
    return await db.messages.find_one(
        {"id": message_id, "conversation_id": conversation_id}, {"_id": 0}
    )
