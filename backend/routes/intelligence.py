"""Intelligence cards + Ask AI suggestions."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request
from mock import ASK_AI_SUGGESTIONS, INTELLIGENCE_CARDS

router = APIRouter(tags=["intelligence"])

_URGENCY_ORDER = {"critical": 0, "opportunity": 1, "insight": 2}


@router.get("/intelligence-cards")
async def list_cards(request: Request):
    try:
        db = request.app.state.db
        cards = await db.intelligence_cards.find({}, {"_id": 0}).to_list(length=20)
        if cards:
            cards.sort(key=lambda c: _URGENCY_ORDER.get(c.get("urgency", "insight"), 9))
            return cards
    except Exception:
        pass
    return sorted(INTELLIGENCE_CARDS, key=lambda c: _URGENCY_ORDER.get(c.get("urgency", "insight"), 9))


@router.post("/intelligence-cards/{card_id}/refresh")
async def refresh_card(card_id: str, request: Request):
    try:
        db = request.app.state.db
        now_iso = datetime.now(timezone.utc).isoformat()
        await db.intelligence_cards.update_one({"id": card_id}, {"$set": {"generated_at": now_iso}})
        card = await db.intelligence_cards.find_one({"id": card_id}, {"_id": 0})
        if card:
            return card
    except Exception:
        pass
    card = next((c for c in INTELLIGENCE_CARDS if c["id"] == card_id), None)
    return card or INTELLIGENCE_CARDS[0]


@router.get("/ask-ai/suggestions")
async def ask_ai_suggestions(request: Request):
    try:
        db = request.app.state.db
        cards = await db.intelligence_cards.find({}, {"_id": 0}).to_list(length=20)
        if cards:
            by_agent = {c["agent_id"]: c for c in cards}
            chips = []
            for aid, label in [
                ("meera", "Who are my highest-intent unconverted users?"),
                ("rishi", "Why did my WhatsApp delivery drop?"),
                ("aryan", "Plan a payday-window campaign"),
                ("dev", "Build a cart-abandonment recovery flow"),
            ]:
                if aid in by_agent:
                    chips.append({"id": f"sug-{aid}", "agent_id": aid, "label": label})
            if chips:
                return chips[:4]
    except Exception:
        pass
    return ASK_AI_SUGGESTIONS
