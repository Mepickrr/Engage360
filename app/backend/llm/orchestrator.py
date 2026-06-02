"""Routing orchestrator — decides which agent(s) should respond.

A small fast LLM call returns structured JSON describing:
  * primary_agent
  * supporting_agents (optional)
  * artefact_type (flow_brief | segment_preview | creative_preview | null)
  * intent (build | analyze | question | creative | support | ambiguous)

When `pinned_agent` is provided we force `primary_agent` to that value, but we
still let the orchestrator pick supporting agents and detect artefact intent.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from .client import chat
from .personas import PERSONA_BY_ID

logger = logging.getLogger(__name__)


VALID_AGENTS = list(PERSONA_BY_ID.keys())
VALID_ARTEFACTS = ["flow_brief", "segment_preview", "creative_preview"]
VALID_INTENTS = ["build", "analyze", "question", "creative", "support", "ambiguous"]


ROUTING_SYSTEM_PROMPT = f"""\
You are the routing brain for Engage 360's 6-agent AI team. Decide which agent
should answer the user's message and whether the response needs a structured
artefact.

The 6 agents and their domains:
  - aryan  — Growth Strategist: revenue, recovery, remarketing, payday campaigns
  - zara   — Creative Lead: copy, subject lines, multi-channel messaging variants
  - meera  — Audience Architect: segments, cohorts, audience quality
  - rishi  — Analyst: performance diagnosis, weekly reports, channel comparisons
  - dev    — Builder: flows, journeys, automation sequences
  - priya  — Support Lead: DLT, channel setup, integrations, billing, escalations

Routing rules:
  - Default to `aryan` for ambiguous commercial intents (where is revenue going,
    how do I grow, etc.).
  - Default to `priya` for support / how-to / integration / billing questions.
  - "build me a flow / journey / campaign" → primary=`dev`,
    artefact_type=`flow_brief`, supporting can include aryan or meera.
  - "who are my X users / segment / cohort" → primary=`meera`. If user says
    "build" / "save" the segment, artefact_type=`segment_preview`.
  - "draft / write / generate copy / message / subject" → primary=`zara`,
    artefact_type=`creative_preview`.
  - "why is X dropping / performance / analyze" → primary=`rishi`.
  - If you cannot map clearly, return intent=`ambiguous`, no artefact, and pick
    the best-fit primary (default aryan) so they can ask a clarifying question.

Always return STRICT JSON conforming to the schema you are given. No prose,
no markdown, no commentary — only the JSON object. Use only these agent ids:
{VALID_AGENTS}. Use only these artefact types or null: {VALID_ARTEFACTS}.
"""


ROUTING_SCHEMA = {
    "type": "object",
    "required": ["primary_agent", "supporting_agents", "artefact_type", "intent", "reason"],
    "properties": {
        "primary_agent": {"type": "string", "enum": VALID_AGENTS},
        "supporting_agents": {
            "type": "array",
            "items": {"type": "string", "enum": VALID_AGENTS},
            "maxItems": 2,
        },
        "artefact_type": {
            "anyOf": [
                {"type": "string", "enum": VALID_ARTEFACTS},
                {"type": "null"},
            ],
        },
        "intent": {"type": "string", "enum": VALID_INTENTS},
        "reason": {"type": "string", "description": "One short sentence on why."},
    },
}


def _fallback_route(user_message: str, pinned_agent: str | None) -> dict[str, Any]:
    """Heuristic backup so we never crash the chat if the orchestrator LLM fails."""
    msg = (user_message or "").lower()
    primary = pinned_agent or "aryan"
    artefact = None
    intent = "ambiguous"
    if any(k in msg for k in ["build", "flow", "journey", "automation", "sequence"]):
        primary = pinned_agent or "dev"
        artefact = "flow_brief"
        intent = "build"
    elif any(k in msg for k in ["segment", "cohort", "audience", "users who", "who are"]):
        primary = pinned_agent or "meera"
        artefact = "segment_preview" if "build" in msg or "save" in msg else None
        intent = "analyze"
    elif any(k in msg for k in ["copy", "subject", "draft", "write", "message", "headline"]):
        primary = pinned_agent or "zara"
        artefact = "creative_preview"
        intent = "creative"
    elif any(k in msg for k in ["why", "drop", "decline", "performance", "report", "compare"]):
        primary = pinned_agent or "rishi"
        intent = "analyze"
    elif any(k in msg for k in ["dlt", "setup", "integrate", "support", "fail", "error", "billing"]):
        primary = pinned_agent or "priya"
        intent = "support"

    return {
        "primary_agent": primary,
        "supporting_agents": [],
        "artefact_type": artefact,
        "intent": intent,
        "reason": "fallback heuristic",
    }


def _coerce_route(raw: dict[str, Any], pinned_agent: str | None, user_message: str) -> dict[str, Any]:
    """Validate / normalise an LLM routing output. Always returns a usable dict."""
    if not isinstance(raw, dict):
        return _fallback_route(user_message, pinned_agent)

    primary = raw.get("primary_agent")
    if primary not in VALID_AGENTS:
        primary = pinned_agent if pinned_agent in VALID_AGENTS else "aryan"

    supporting = raw.get("supporting_agents") or []
    if not isinstance(supporting, list):
        supporting = []
    supporting = [a for a in supporting if a in VALID_AGENTS and a != primary][:2]

    artefact = raw.get("artefact_type")
    if artefact not in VALID_ARTEFACTS:
        artefact = None

    intent = raw.get("intent") if raw.get("intent") in VALID_INTENTS else "ambiguous"

    if pinned_agent in VALID_AGENTS:
        primary = pinned_agent

    return {
        "primary_agent": primary,
        "supporting_agents": supporting,
        "artefact_type": artefact,
        "intent": intent,
        "reason": str(raw.get("reason") or ""),
    }


# Verbs / phrases that strongly signal each artefact type.
_BUILD_VERBS = ("build", "create", "make", "design", "set up", "set-up", "draft a flow", "draft a journey", "automate")
_FLOW_NOUNS = ("flow", "journey", "automation", "sequence", "drip", "nurture", "campaign")
_SEGMENT_VERBS = ("save segment", "build segment", "save this segment", "create segment", "save the segment")
_CREATIVE_VERBS = ("write", "draft copy", "draft a message", "write copy", "subject line", "subject lines", "rewrite")


def _harden_artefact(routing: dict[str, Any], user_message: str, pinned_agent: str | None) -> dict[str, Any]:
    """Override LLM artefact_type when the user intent is unambiguous.

    The orchestrator (gpt-5-mini, JSON mode) occasionally picks the wrong artefact
    type — e.g. classifying Aryan's payday-window prompt as creative_preview when
    the user clearly wants a flow. This post-step enforces deterministic
    artefact selection for the small set of obvious cases.
    """
    msg = (user_message or "").lower()

    # Flow brief: pinned_agent=dev, OR a build verb + flow noun combo.
    has_build = any(v in msg for v in _BUILD_VERBS)
    has_flow_noun = any(n in msg for n in _FLOW_NOUNS)
    if pinned_agent == "dev" and (has_build or has_flow_noun):
        routing["primary_agent"] = "dev"
        routing["artefact_type"] = "flow_brief"
        return routing
    if has_build and has_flow_noun:
        routing["artefact_type"] = "flow_brief"
        if routing.get("primary_agent") not in ("dev", "aryan"):
            routing["primary_agent"] = "dev"
        return routing

    # Segment preview: explicit save/build segment ask.
    if any(v in msg for v in _SEGMENT_VERBS):
        routing["artefact_type"] = "segment_preview"
        routing["primary_agent"] = "meera"
        return routing

    # Creative preview: a creative verb when pinned to Zara, or a write/copy/draft ask.
    if pinned_agent == "zara" and any(v in msg for v in _CREATIVE_VERBS):
        routing["artefact_type"] = "creative_preview"
        routing["primary_agent"] = "zara"
        return routing

    return routing


async def route(
    user_message: str,
    conversation_history: list[dict[str, str]] | None = None,
    pinned_agent: str | None = None,
) -> dict[str, Any]:
    history = conversation_history or []
    # Pass last 6 turns max — keeps the routing call snappy.
    history_excerpt = history[-6:]

    history_lines = []
    for m in history_excerpt:
        role = m.get("role", "user")
        content = (m.get("content") or "")[:240]
        history_lines.append(f"{role}: {content}")
    history_block = "\n".join(history_lines) if history_lines else "(no prior turns)"

    pinned_hint = (
        f"\nThe user pinned agent `{pinned_agent}`. You MUST set primary_agent to `{pinned_agent}` "
        "but you may still pick supporting agents and an artefact_type."
        if pinned_agent in VALID_AGENTS
        else ""
    )

    user_text = (
        f"Recent conversation:\n{history_block}\n\n"
        f"New user message: \"{user_message}\"\n"
        f"{pinned_hint}\n\n"
        "Return the routing JSON now."
    )

    messages = [
        {"role": "system", "content": ROUTING_SYSTEM_PROMPT},
        {"role": "user", "content": user_text},
    ]

    orchestrator_model = os.environ.get("ORCHESTRATOR_MODEL") or "openai/gpt-5-mini"

    try:
        result = await chat(
            messages=messages,
            model=orchestrator_model,
            json_schema=ROUTING_SCHEMA,
        )
        raw_json = result.get("json") or {}
        routing = _coerce_route(raw_json, pinned_agent, user_message)
        return _harden_artefact(routing, user_message, pinned_agent)
    except Exception:
        logger.exception("Orchestrator LLM call failed — using heuristic fallback")
        fallback = _fallback_route(user_message, pinned_agent)
        return _harden_artefact(fallback, user_message, pinned_agent)
