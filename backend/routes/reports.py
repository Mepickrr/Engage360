"""Reports router."""

from __future__ import annotations

from fastapi import APIRouter, Request
from mock import REPORTS

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(request: Request):
    try:
        db = request.app.state.db
        reports = await db.reports.find({}, {"_id": 0}).to_list(length=20)
        if reports:
            for r in reports:
                r["action_count"] = len(r.get("actions") or [])
            return reports
    except Exception:
        pass
    return REPORTS


@router.get("/{report_id}")
async def get_report(report_id: str, request: Request):
    try:
        db = request.app.state.db
        doc = await db.reports.find_one({"id": report_id}, {"_id": 0})
        if doc:
            doc["action_count"] = len(doc.get("actions") or [])
            return doc
    except Exception:
        pass
    doc = next((r for r in REPORTS if r["id"] == report_id), None)
    return doc or REPORTS[0]
