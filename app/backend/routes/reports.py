"""Reports router."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(request: Request):
    db = request.app.state.db
    reports = await db.reports.find({}, {"_id": 0}).to_list(length=20)
    # Include a small derived `action_count`
    for r in reports:
        r["action_count"] = len(r.get("actions") or [])
    return reports


@router.get("/{report_id}")
async def get_report(report_id: str, request: Request):
    db = request.app.state.db
    doc = await db.reports.find_one({"id": report_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    doc["action_count"] = len(doc.get("actions") or [])
    return doc
