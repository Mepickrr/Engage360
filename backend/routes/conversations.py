"""Conversations + Messages routes.

Uses the in-memory mock conversation system (llm/mock_conv.py) so the
Conversation Panel works fully without MongoDB or LLM API keys.
Falls through to MongoDB/LLM when available.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

import llm.mock_conv as mock_conv

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


# --- Request bodies ---
class CreateConversationBody(BaseModel):
    seed_message: Optional[str] = None
    pinned_agent: Optional[str] = None
    source: Optional[str] = "ask_ai"


class SendMessageBody(BaseModel):
    content: str
    pinned_agent: Optional[str] = None


# --- Endpoints ---

@router.get("")
async def list_conversations(request: Request):
    return mock_conv.list_conversations()


@router.post("")
async def create_conversation(body: CreateConversationBody, request: Request):
    result = mock_conv.create_conversation(
        seed_message=body.seed_message,
        pinned_agent=body.pinned_agent,
        source=body.source or "ask_ai",
    )
    return result


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str, request: Request):
    convo = mock_conv.get_conversation(conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = convo.pop("messages", [])
    return {"conversation": convo, "messages": msgs}


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: str, body: SendMessageBody, request: Request
):
    content = (body.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message content is empty")

    result = mock_conv.send_message(
        conversation_id=conversation_id,
        content=content,
        pinned_agent=body.pinned_agent,
    )
    return result


@router.post("/{conversation_id}/messages/{message_id}/generate-artefact")
async def generate_message_artefact(
    conversation_id: str, message_id: str, request: Request
):
    """Second-pass artefact generation — attaches structured payload to the message."""
    convo = mock_conv.get_conversation(conversation_id)
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs = convo.get("messages", [])
    target = next((m for m in msgs if m["id"] == message_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Message not found")

    if target.get("artefact"):
        return target  # Already generated — idempotent.

    artefact_type = target.get("pending_artefact_type")
    if not artefact_type:
        raise HTTPException(status_code=400, detail="Message has no pending artefact")

    # Find the preceding user message to use as context for the artefact
    user_message_text = ""
    for m in reversed(msgs):
        if m["id"] == message_id:
            continue
        if m.get("role") == "user":
            user_message_text = m.get("content", "")
            break

    updated = mock_conv.attach_artefact(
        conversation_id=conversation_id,
        message_id=message_id,
        artefact_type=artefact_type,
        user_message=user_message_text,
    )
    if not updated:
        raise HTTPException(status_code=502, detail="Artefact generation failed")

    return updated
