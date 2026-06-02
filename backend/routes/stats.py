"""Store stats router."""

from __future__ import annotations

from fastapi import APIRouter, Request
from mock import STORE_STATS

router = APIRouter(tags=["stats"])


@router.get("/store-stats")
async def get_store_stats(request: Request):
    try:
        db = request.app.state.db
        doc = await db.store_stats.find_one({}, {"_id": 0, "_key": 0})
        if doc:
            return doc
    except Exception:
        pass
    return STORE_STATS
