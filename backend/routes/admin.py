"""Admin reseed endpoint — drops + re-seeds demo collections.

Phase 1 is single-tenant and auth-free, so no auth guard here. Useful for
demos and for restoring task state after running through the approve/reject
flow.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request

from seed import seed_all

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reseed")
async def reseed(request: Request):
    db = request.app.state.db

    # Drop the demo collections (preserve conversations / messages so live
    # threads aren't lost mid-demo).
    collections_to_drop = [
        "agents",
        "store_stats",
        "intelligence_cards",
        "reports",
        "tasks",
        "flows",
    ]
    for name in collections_to_drop:
        await db[name].delete_many({})

    await seed_all(db)

    # Report final counts so the caller can confirm.
    counts = {}
    for name in collections_to_drop:
        counts[name] = await db[name].count_documents({})

    task_breakdown: dict[str, int] = {}
    async for row in db.tasks.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    ):
        task_breakdown[row["_id"]] = row["count"]

    logger.info("Reseed complete: %s", counts)
    return {
        "status": "ok",
        "counts": counts,
        "task_breakdown": task_breakdown,
    }
