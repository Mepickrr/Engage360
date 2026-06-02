"""Intelligence cards + Ask AI suggestions."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["intelligence"])


# Cards sorted critical → opportunity → insight
_URGENCY_ORDER = {"critical": 0, "opportunity": 1, "insight": 2}


@router.get("/intelligence-cards")
async def list_cards(request: Request):
    db = request.app.state.db
    cards = await db.intelligence_cards.find({}, {"_id": 0}).to_list(length=20)
    cards.sort(key=lambda c: _URGENCY_ORDER.get(c.get("urgency", "insight"), 9))
    return cards


@router.post("/intelligence-cards/{card_id}/refresh")
async def refresh_card(card_id: str, request: Request):
    db = request.app.state.db
    now_iso = datetime.now(timezone.utc).isoformat()
    result = await db.intelligence_cards.update_one(
        {"id": card_id}, {"$set": {"generated_at": now_iso}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    card = await db.intelligence_cards.find_one({"id": card_id}, {"_id": 0})
    return card


@router.get("/ask-ai/suggestions")
async def ask_ai_suggestions(request: Request):
    """Return 4 contextual ask-AI suggestion chips (Phase 1 — derived from cards)."""
    db = request.app.state.db
    cards = await db.intelligence_cards.find({}, {"_id": 0}).to_list(length=20)
    cards.sort(key=lambda c: _URGENCY_ORDER.get(c.get("urgency", "insight"), 9))

    # Map each agent to a friendly chip phrasing.
    by_agent = {c["agent_id"]: c for c in cards}
    chips = []

    if "meera" in by_agent:
        chips.append({
            "id": "sug-meera",
            "agent_id": "meera",
            "label": "Who are my highest-intent unconverted users?",
        })
    if "rishi" in by_agent:
        chips.append({
            "id": "sug-rishi",
            "agent_id": "rishi",
            "label": "Why did my WhatsApp delivery drop?",
        })
    if "aryan" in by_agent:
        chips.append({
            "id": "sug-aryan",
            "agent_id": "aryan",
            "label": "Plan a payday-window campaign",
        })
    if "dev" in by_agent:
        chips.append({
            "id": "sug-dev",
            "agent_id": "dev",
            "label": "Build a cart-abandonment recovery flow",
        })
    return chips[:4]
