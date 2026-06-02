"""Tasks router — list, approve/reject/request-changes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix="/tasks", tags=["tasks"])


VALID_STATUSES = {"awaiting", "ongoing", "scheduled", "completed"}

# Friendly aliases accepted on the `status` query param.
_STATUS_ALIASES = {
    "awaiting_approval": "awaiting",
    "awaiting-approval": "awaiting",
}


def _normalise_status(status: str) -> str | None:
    if status in VALID_STATUSES:
        return status
    return _STATUS_ALIASES.get(status)


@router.get("")
async def list_tasks(
    request: Request,
    status: Optional[str] = Query(default=None),
):
    db = request.app.state.db
    query = {}
    if status:
        normalised = _normalise_status(status)
        if normalised is None:
            raise HTTPException(status_code=400, detail="Invalid status")
        query["status"] = normalised
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(length=200)
    # Awaiting first, then by updated_at desc within group.
    status_order = ["awaiting", "ongoing", "scheduled", "completed"]
    tasks.sort(
        key=lambda t: (
            status_order.index(t.get("status", "completed"))
            if t.get("status") in status_order
            else 9,
            t.get("updated_at", ""),
        )
    )
    return tasks


@router.get("/counts")
async def task_counts(request: Request):
    db = request.app.state.db
    counts = {s: 0 for s in VALID_STATUSES}
    cursor = db.tasks.aggregate(
        [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    )
    async for row in cursor:
        if row["_id"] in counts:
            counts[row["_id"]] = row["count"]
    counts["total"] = sum(counts.values())
    return counts


@router.get("/{task_id}")
async def get_task(task_id: str, request: Request):
    db = request.app.state.db
    doc = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Task not found")
    return doc


class ChangeNote(BaseModel):
    note: Optional[str] = None


async def _transition(db, task_id: str, new_status: str, outcome: Optional[str] = None):
    now_iso = datetime.now(timezone.utc).isoformat()
    update_doc = {"status": new_status, "updated_at": now_iso}
    if outcome:
        update_doc["outcome_text"] = outcome
    result = await db.tasks.update_one({"id": task_id}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})


@router.post("/{task_id}/approve")
async def approve_task(task_id: str, request: Request):
    db = request.app.state.db
    return await _transition(db, task_id, "completed", outcome="Approved by Himanshu.")


@router.post("/{task_id}/reject")
async def reject_task(task_id: str, request: Request):
    db = request.app.state.db
    return await _transition(db, task_id, "completed", outcome="Rejected by Himanshu.")


@router.post("/{task_id}/request-changes")
async def request_changes(task_id: str, body: ChangeNote, request: Request):
    db = request.app.state.db
    note = (body.note or "").strip() or "Changes requested."
    now_iso = datetime.now(timezone.utc).isoformat()
    result = await db.tasks.update_one(
        {"id": task_id},
        {
            "$set": {"updated_at": now_iso},
            "$push": {
                "step_progress": {
                    "id": f"note-{int(datetime.now().timestamp())}",
                    "label": f"Changes requested: {note}",
                    "status": "done",
                    "timestamp": now_iso,
                }
            },
        },
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return await db.tasks.find_one({"id": task_id}, {"_id": 0})
