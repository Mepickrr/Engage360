"""Store stats router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["stats"])


@router.get("/store-stats")
async def get_store_stats(request: Request):
    db = request.app.state.db
    doc = await db.store_stats.find_one({}, {"_id": 0, "_key": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Stats not seeded")
    return doc
