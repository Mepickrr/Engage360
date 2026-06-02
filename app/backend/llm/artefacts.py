"""Artefact generation — second-pass LLM call to produce structured payloads.

For each artefact type we define the JSON schema we want the LLM to fill in,
and a tight prompt that describes the expected shape. The result lives on the
agent message under `message.artefact = {"type": ..., "payload": ...}`.
"""

from __future__ import annotations

import logging
from typing import Any

from .client import chat
from .personas import PERSONA_BY_ID

logger = logging.getLogger(__name__)


FLOW_BRIEF_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": [
        "name",
        "goal",
        "segment",
        "channels",
        "nodes",
        "estimated_revenue_impact",
        "estimated_revenue_currency",
    ],
    "properties": {
        "name": {"type": "string"},
        "goal": {"type": "string"},
        "segment": {
            "type": "object",
            "required": ["name", "estimated_users"],
            "properties": {
                "name": {"type": "string"},
                "estimated_users": {"type": "integer"},
            },
        },
        "channels": {
            "type": "array",
            "items": {"type": "string", "enum": ["whatsapp", "email", "sms", "push"]},
        },
        "nodes": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["id", "type", "label"],
                "properties": {
                    "id": {"type": "string"},
                    "type": {
                        "type": "string",
                        "enum": ["trigger", "wait", "channel", "condition", "end"],
                    },
                    "label": {"type": "string"},
                    "channel": {
                        "anyOf": [
                            {"type": "string", "enum": ["whatsapp", "email", "sms", "push"]},
                            {"type": "null"},
                        ],
                    },
                    "duration_minutes": {"type": "integer"},
                    "branches": {"type": "array", "items": {"type": "string"}},
                    "branch": {"type": "string"},
                },
            },
        },
        "estimated_revenue_impact": {"type": "integer"},
        "estimated_revenue_currency": {"type": "string", "enum": ["INR"]},
    },
}


SEGMENT_PREVIEW_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["name", "conditions", "estimated_users", "data_freshness"],
    "properties": {
        "name": {"type": "string"},
        "conditions": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["field", "operator", "value"],
                "properties": {
                    "field": {"type": "string"},
                    "operator": {"type": "string"},
                    "value": {},
                    "period_days": {"type": "integer"},
                },
            },
        },
        "estimated_users": {"type": "integer"},
        "data_freshness": {"type": "string"},
    },
}


CREATIVE_PREVIEW_SCHEMA: dict[str, Any] = {
    "type": "object",
    "required": ["channel", "variants"],
    "properties": {
        "channel": {"type": "string", "enum": ["whatsapp", "email", "sms", "push"]},
        "variants": {
            "type": "array",
            "minItems": 2,
            "items": {
                "type": "object",
                "required": ["id", "body", "cta"],
                "properties": {
                    "id": {"type": "string"},
                    "body": {"type": "string"},
                    "cta": {"type": "string"},
                    "subject": {"type": "string"},
                    "rationale": {"type": "string"},
                },
            },
        },
    },
}


SCHEMAS = {
    "flow_brief": FLOW_BRIEF_SCHEMA,
    "segment_preview": SEGMENT_PREVIEW_SCHEMA,
    "creative_preview": CREATIVE_PREVIEW_SCHEMA,
}


ARTEFACT_INSTRUCTIONS = {
    "flow_brief": (
        "Generate a complete flow_brief artefact for the user's intent. Include a "
        "5-7 node sequence (trigger → wait → channel → wait → condition → channel → end). "
        "Make the segment name and estimated_users realistic for a 45k user D2C store. "
        "estimated_revenue_impact should be in rupees as an integer."
    ),
    "segment_preview": (
        "Generate a segment_preview artefact. Use 2-4 conditions with realistic field "
        "names like `viewed_products_count`, `added_to_cart`, `last_seen_days_ago`, "
        "`orders_count`, `total_spent`. estimated_users should be a plausible integer "
        "for a 45k base. data_freshness like 'Updated 2h ago'."
    ),
    "creative_preview": (
        "Generate a creative_preview artefact with 2 or 3 variants. Each variant has "
        "id (v1, v2...), a body that uses placeholders like {{first_name}} when natural, "
        "a CTA, and a one-line rationale. For email channel include a subject. "
        "Match the tone to the channel — WhatsApp is friendlier, Email more structured."
    ),
}


async def generate_artefact(
    artefact_type: str,
    user_message: str,
    agent_id: str,
    agent_chat_reply: str,
    model: str | None = None,
) -> dict | None:
    """Second-pass LLM call producing a structured payload.

    Returns the payload dict (matching the schema for `artefact_type`) or None
    on failure. Callers should attach this to the message record as:
        {"type": artefact_type, "payload": payload}
    """
    if artefact_type not in SCHEMAS:
        return None

    persona = PERSONA_BY_ID.get(agent_id) or PERSONA_BY_ID["aryan"]
    instruction = ARTEFACT_INSTRUCTIONS[artefact_type]
    schema = SCHEMAS[artefact_type]

    system_prompt = (
        f"You are {persona['name']}, the {persona['title']}. You are producing a "
        f"structured {artefact_type} artefact for a Shopify D2C store on Engage 360.\n"
        f"{instruction}\n"
        "Use realistic data — never invent crazy numbers. Output JSON only."
    )

    user_text = (
        f"User asked: {user_message}\n\n"
        f"Your earlier chat reply was:\n{agent_chat_reply}\n\n"
        f"Now produce the {artefact_type} JSON object based on the user's intent."
    )

    try:
        result = await chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            model=model,
            json_schema=schema,
        )
        return result.get("json")
    except Exception:
        logger.exception("Artefact generation failed (type=%s)", artefact_type)
        return None
