"""Flow modification LLM call.

Given a current flow (nodes + edges) and a user message, this module produces:
  * a one-sentence chat reply
  * is_modification flag
  * (if modification) new nodes + edges arrays that replace the current state

It uses prompt-based structured output via llm.client.chat().
"""

from __future__ import annotations

import logging
from typing import Any

from .client import chat

logger = logging.getLogger(__name__)


FLOW_MOD_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["reply", "is_modification"],
    "properties": {
        "reply": {
            "type": "string",
            "description": "ONE sentence summary of the change (if modification) or the answer (if question).",
        },
        "is_modification": {"type": "boolean"},
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "type", "position", "data"],
                "properties": {
                    "id": {"type": "string"},
                    "type": {
                        "type": "string",
                        "enum": [
                            "trigger",
                            "channel",
                            "wait",
                            "condition",
                            "split",
                            "wait_until",
                            "end",
                            "goal",
                        ],
                    },
                    "position": {
                        "type": "object",
                        "required": ["x", "y"],
                        "properties": {
                            "x": {"type": "number"},
                            "y": {"type": "number"},
                        },
                    },
                    "data": {"type": "object"},
                },
            },
        },
        "edges": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "source", "target"],
                "properties": {
                    "id": {"type": "string"},
                    "source": {"type": "string"},
                    "target": {"type": "string"},
                    "label": {"type": "string"},
                },
            },
        },
    },
}


SYSTEM_PROMPT = """\
You are Dev, the Builder agent at Engage 360. You modify customer engagement
flows on a visual canvas (think of a state machine).

You receive:
  (1) the CURRENT flow as JSON (nodes + edges), and
  (2) a USER MESSAGE.

Decide if the user wants a modification or has a question:
  - MODIFICATION (add/remove/change/swap/reorder/move/replace): set
    is_modification=true. Return the FULL new nodes array and FULL new edges
    array (not a diff). Reply is ONE SHORT SENTENCE summarising the change.
  - QUESTION (what does X do, how long is the wait, etc.): set
    is_modification=false. Reply with a 1-3 sentence answer in plain text.
    Omit nodes/edges or send them empty.

Node schema:
  {id: string, type: one of
    [trigger, channel, wait, condition, split, wait_until, end, goal],
   position: {x: number, y: number},
   data: {label: string, ...type-specific fields}}

Edge schema:
  {id: string, source: source_node_id, target: target_node_id, label?: string}

Rules:
  * Preserve existing node IDs whenever possible. Only re-assign when adding
    new nodes or replacing a node entirely.
  * Auto-layout vertically: position.x ≈ 250, position.y = index * 120 for the
    main sequence. Side branches (condition yes/no, split A/B) can offset
    horizontally by ±200.
  * Always wire edges so the graph stays connected from the trigger.
  * Use realistic data fields:
      trigger:   {trigger_type: "event"|"segment"|"schedule"|"webhook",
                  event_name?: string}
      channel:   {channel: "whatsapp"|"email"|"sms"|"push"|"inapp"|"rcs",
                  body?: string, subject?: string, template_id?: string|null}
      wait:      {duration_minutes: int}
      condition: {field: string, operator: string, value: any}
      split:     {variants: ["A","B"], split_pct: [50,50]}
      wait_until:{event_name: string, timeout_hours?: int}
      end / goal:{}
  * Condition / split nodes MUST have 2 outgoing edges. Label them
    "yes"/"no" (condition) or "A"/"B" (split).

Output STRICT JSON conforming to the schema. No prose, no markdown.
"""


async def modify_flow(
    *,
    flow: dict,
    user_message: str,
    model: str | None = None,
) -> dict:
    """Run a flow-modification LLM call. Always returns a usable dict."""
    nodes = flow.get("nodes") or []
    edges = flow.get("edges") or []
    flow_payload = {
        "name": flow.get("name"),
        "description": flow.get("description"),
        "nodes": nodes,
        "edges": edges,
    }

    user_text = (
        "CURRENT FLOW JSON:\n"
        f"{flow_payload}\n\n"
        f"USER MESSAGE:\n{user_message}\n\n"
        "Return the structured JSON now."
    )

    try:
        result = await chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text},
            ],
            model=model,
            json_schema=FLOW_MOD_SCHEMA,
        )
        parsed = result.get("json") or {}
    except Exception:
        logger.exception("modify_flow LLM call failed")
        return {
            "reply": "I hit a snag making that change. Try rephrasing the request.",
            "is_modification": False,
        }

    # Coerce to schema-compatible shape.
    out = {
        "reply": str(parsed.get("reply") or "Done."),
        "is_modification": bool(parsed.get("is_modification")),
    }
    if out["is_modification"]:
        new_nodes = parsed.get("nodes")
        new_edges = parsed.get("edges")
        # Sanity-check: must be lists; otherwise treat as a soft failure.
        if isinstance(new_nodes, list) and isinstance(new_edges, list) and new_nodes:
            out["nodes"] = new_nodes
            out["edges"] = new_edges
        else:
            out["is_modification"] = False
            out["reply"] = (
                "I drafted the change but the response wasn't well-formed. "
                "Try a simpler instruction."
            )
    return out
