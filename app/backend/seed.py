"""Idempotent startup seed for Engage 360 Phase 1."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from llm.personas import PERSONAS

logger = logging.getLogger(__name__)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _hours_ago(h: int) -> str:
    return _iso(datetime.now(timezone.utc) - timedelta(hours=h))


def _days_ago(d: int) -> str:
    return _iso(datetime.now(timezone.utc) - timedelta(days=d))


async def seed_all(db: AsyncIOMotorDatabase) -> None:
    await _seed_agents(db)
    await _seed_store_stats(db)
    await _seed_intelligence_cards(db)
    await _seed_reports(db)
    await _seed_tasks(db)
    await _seed_flows(db)
    logger.info("Engage 360 seed complete")


async def _seed_agents(db: AsyncIOMotorDatabase) -> None:
    count = await db.agents.count_documents({})
    if count >= len(PERSONAS):
        # Already seeded — make sure existing docs have the new schema fields.
        await _migrate_agent_fields(db)
        return
    await db.agents.delete_many({})
    docs = []
    for p in PERSONAS:
        docs.append(
            {
                "id": p["id"],
                "name": p["name"],
                "title": p["title"],
                "domain": p["domain"],
                "color": p["color"],
                "avatar_initials": p["avatar_initials"],
                "bio": p["bio"],
                "suggested_prompts": list(p["suggested_prompts"]),
                "signals_monitored": list(p["signals_monitored"]),
                # Extended schema for Meet-Your-Team v2.
                "is_system": True,
                "status": "active",
                "tone": "professional",
                "language_style": "casual",
                "emoji_usage": False,
                "brand_voice_sample": "",
                "agent_goal": "recovery",
                "dont_do": "",
                "store_data_access": "orders_customers",
                "success_metric": "revenue_recovered",
                "escalation_enabled": False,
                "escalation_queue": "",
                "custom_instructions": "",
                "visibility": "shown",
                "specialty_tag": p["domain"],
            }
        )
    await db.agents.insert_many(docs)
    logger.info("Seeded %s agents", len(docs))


async def _migrate_agent_fields(db: AsyncIOMotorDatabase) -> None:
    """Stamp missing v2 fields onto already-seeded agents. Idempotent."""
    cursor = db.agents.find({"is_system": {"$exists": False}}, {"id": 1})
    ids = [d["id"] async for d in cursor]
    if not ids:
        return
    await db.agents.update_many(
        {"id": {"$in": ids}},
        {
            "$set": {
                "is_system": True,
                "status": "active",
                "tone": "professional",
                "language_style": "casual",
                "emoji_usage": False,
                "brand_voice_sample": "",
                "agent_goal": "recovery",
                "dont_do": "",
                "store_data_access": "orders_customers",
                "success_metric": "revenue_recovered",
                "escalation_enabled": False,
                "escalation_queue": "",
                "custom_instructions": "",
                "visibility": "shown",
            }
        },
    )
    logger.info("Migrated %s agents with v2 fields", len(ids))


async def _seed_store_stats(db: AsyncIOMotorDatabase) -> None:
    if await db.store_stats.count_documents({}) > 0:
        return
    doc = {
        "_key": "default",
        "revenue": {
            "value": 843200,
            "currency": "INR",
            "delta_pct": 12.4,
            "period": "Last 30 days",
        },
        "total_orders": {
            "value": 1247,
            "delta_pct": 8.1,
            "period": "Last 30 days",
        },
        "unique_users": {
            "value": 8923,
            "delta_pct": 5.7,
            "period": "Last 30 days",
        },
        "active_flows": {
            "value": 7,
            "delta_pct": 0,
            "period": "Currently running",
        },
    }
    await db.store_stats.insert_one(doc)
    logger.info("Seeded store_stats")


async def _seed_intelligence_cards(db: AsyncIOMotorDatabase) -> None:
    if await db.intelligence_cards.count_documents({}) > 0:
        return
    cards = [
        {
            "id": "card-meera-1",
            "agent_id": "meera",
            "urgency": "opportunity",
            "headline": (
                "1,840 high-intent browsers haven't converted in 14 days. "
                "They viewed 3+ products but never added to cart."
            ),
            "stats": [
                {"label": "Potential reach", "value": "1,840 users"},
                {"label": "Est. revenue", "value": "₹2.1L"},
            ],
            "cta_primary": "Build this segment",
            "cta_secondary": "Know more",
            "generated_at": _hours_ago(2),
        },
        {
            "id": "card-rishi-1",
            "agent_id": "rishi",
            "urgency": "critical",
            "headline": (
                "Checkout recovery WhatsApp flow delivery dropped 38% in the last 24h. "
                "412 messages failed delivery."
            ),
            "stats": [
                {"label": "Affected flow", "value": "Checkout Recovery v2"},
                {"label": "Failed sends", "value": "412"},
            ],
            "cta_primary": "Update flow",
            "cta_secondary": "Know more",
            "generated_at": _hours_ago(1),
        },
        {
            "id": "card-aryan-1",
            "agent_id": "aryan",
            "urgency": "opportunity",
            "headline": (
                "Payday window starts in 3 days. Your top buyers segment (2,300 users) "
                "hasn't received a campaign in 21 days. Est. ₹1.8L upside."
            ),
            "stats": [
                {"label": "Audience", "value": "2,300 users"},
                {"label": "Window", "value": "1st–5th"},
            ],
            "cta_primary": "Build this",
            "cta_secondary": "Tell me more",
            "generated_at": _hours_ago(4),
            "collaboration_badge": "Meera + Aryan",
        },
        {
            "id": "card-dev-1",
            "agent_id": "dev",
            "urgency": "insight",
            "headline": (
                "All 7 active flows healthy. 1 draft flow ready to publish: "
                "'Post-delivery review'."
            ),
            "stats": [
                {"label": "Active", "value": "7"},
                {"label": "Drafts", "value": "1"},
            ],
            "cta_primary": "Review drafts",
            "cta_secondary": "View all flows",
            "generated_at": _hours_ago(6),
            "status_bar": "green",
        },
    ]
    await db.intelligence_cards.insert_many(cards)
    logger.info("Seeded %s intelligence cards", len(cards))


async def _seed_reports(db: AsyncIOMotorDatabase) -> None:
    if await db.reports.count_documents({}) > 0:
        return
    reports = [
        {
            "id": "report-weekly-perf",
            "title": "Weekly Performance Brief",
            "agent_id": "rishi",
            "findings": [
                "Checkout flow conversion up 6% week-over-week.",
                "WhatsApp CTR declining on Tuesdays — investigate send-window.",
                "Email opens spiking on weekends — repurpose for Saturday campaigns.",
            ],
            "actions": [
                "Shift WhatsApp Tuesday sends to Wednesday morning.",
                "Add a Saturday newsletter slot.",
                "A/B test new checkout CTA on lapsed buyers.",
            ],
            "last_generated_at": _hours_ago(20),
            "cadence": "weekly",
        },
        {
            "id": "report-segment-health",
            "title": "Segment Health Report",
            "agent_id": "meera",
            "findings": [
                "2 high-value cohorts identified — 'Skincare repeat' and 'Wellness explorers'.",
                "'New Users' segment is 60+ days stale — refresh recommended.",
                "Cross-segment overlap detected between VIP and Returning Buyers (~38%).",
            ],
            "actions": [
                "Promote 'Skincare repeat' to a saved segment.",
                "Refresh 'New Users' definition with last_seen <= 30d.",
                "De-duplicate VIP and Returning Buyers in upcoming campaign.",
            ],
            "last_generated_at": _hours_ago(48),
            "cadence": "weekly",
        },
    ]
    await db.reports.insert_many(reports)
    logger.info("Seeded %s reports", len(reports))


EXPECTED_TASK_DISTRIBUTION = {"awaiting": 3, "ongoing": 3, "scheduled": 2, "completed": 2}


async def _seed_tasks(db: AsyncIOMotorDatabase, *, force: bool = False) -> None:
    """Seed tasks. Re-seeds if the on-disk distribution doesn't match the
    expected 3/3/2/2 split (e.g. after approve/reject demos)."""
    if not force:
        cursor = db.tasks.aggregate(
            [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
        )
        actual = {row["_id"]: row["count"] async for row in cursor}
        if (
            actual.get("awaiting", 0) == EXPECTED_TASK_DISTRIBUTION["awaiting"]
            and actual.get("ongoing", 0) == EXPECTED_TASK_DISTRIBUTION["ongoing"]
            and actual.get("scheduled", 0) == EXPECTED_TASK_DISTRIBUTION["scheduled"]
            and actual.get("completed", 0) == EXPECTED_TASK_DISTRIBUTION["completed"]
        ):
            return

    # Distribution mismatch (or force=True) — drop and reseed.
    await db.tasks.delete_many({})
    tasks = [
        # --- Awaiting Approval ---
        {
            "id": "task-awaiting-1",
            "title": "Re-engagement flow for lapsed users ready to publish",
            "agent_id": "dev",
            "origin": "agent",
            "status": "awaiting",
            "summary": (
                "Dev built a 4-step re-engagement flow targeting lapsed buyers (60+ days). "
                "Includes WhatsApp + email + a discount fallback."
            ),
            "impact_meta": {
                "estimated_reach": 1840,
                "estimated_revenue": 210000,
                "estimated_revenue_currency": "INR",
            },
            "step_progress": [
                {"id": "s1", "label": "Drafted by Dev", "status": "done", "timestamp": _hours_ago(3)},
                {"id": "s2", "label": "Awaiting your approval", "status": "active"},
                {"id": "s3", "label": "Publish", "status": "pending"},
            ],
            "created_at": _hours_ago(3),
            "updated_at": _hours_ago(3),
        },
        {
            "id": "task-awaiting-2",
            "title": "Approve creative variations for Payday campaign",
            "agent_id": "zara",
            "origin": "agent",
            "status": "awaiting",
            "summary": "Zara generated 3 WhatsApp variants for the upcoming payday-window push.",
            "impact_meta": {"estimated_reach": 2300},
            "step_progress": [
                {"id": "s1", "label": "Variants drafted", "status": "done", "timestamp": _hours_ago(5)},
                {"id": "s2", "label": "Awaiting your approval", "status": "active"},
                {"id": "s3", "label": "Schedule send", "status": "pending"},
            ],
            "created_at": _hours_ago(5),
            "updated_at": _hours_ago(5),
        },
        {
            "id": "task-awaiting-3",
            "title": "Approve new VIP segment definition",
            "agent_id": "meera",
            "origin": "agent",
            "status": "awaiting",
            "summary": "Meera proposed a refined VIP segment: 90-day spenders > ₹5,000 with 3+ orders.",
            "impact_meta": {"estimated_reach": 480},
            "step_progress": [
                {"id": "s1", "label": "Segment proposed", "status": "done", "timestamp": _hours_ago(8)},
                {"id": "s2", "label": "Awaiting your approval", "status": "active"},
                {"id": "s3", "label": "Activate", "status": "pending"},
            ],
            "created_at": _hours_ago(8),
            "updated_at": _hours_ago(8),
        },
        # --- Ongoing ---
        {
            "id": "task-ongoing-1",
            "title": "Rishi is analysing your WhatsApp delivery drop",
            "agent_id": "rishi",
            "origin": "agent",
            "status": "ongoing",
            "summary": "Diagnosing the 38% drop in Checkout Recovery v2 over the last 24h.",
            "progress_pct": 60,
            "progress_label": "Analysing carrier-level failures",
            "step_progress": [
                {"id": "s1", "label": "Fetched delivery logs", "status": "done", "timestamp": _hours_ago(2)},
                {"id": "s2", "label": "Cross-checking with BSP status", "status": "active"},
                {"id": "s3", "label": "Draft remediation plan", "status": "pending"},
            ],
            "created_at": _hours_ago(2),
            "updated_at": _hours_ago(1),
        },
        {
            "id": "task-ongoing-2",
            "title": "Dev is building checkout recovery v3",
            "agent_id": "dev",
            "origin": "seller",
            "status": "ongoing",
            "summary": "Adding email fallback + a 24h re-trigger to the current checkout recovery flow.",
            "progress_pct": 40,
            "progress_label": "Wiring up email fallback",
            "step_progress": [
                {"id": "s1", "label": "Flow outline complete", "status": "done", "timestamp": _days_ago(1)},
                {"id": "s2", "label": "Wiring email fallback", "status": "active"},
                {"id": "s3", "label": "Test send", "status": "pending"},
                {"id": "s4", "label": "Publish", "status": "pending"},
            ],
            "created_at": _days_ago(1),
            "updated_at": _hours_ago(4),
        },
        {
            "id": "task-ongoing-3",
            "title": "Aryan is drafting Diwali campaign brief",
            "agent_id": "aryan",
            "origin": "agent",
            "status": "ongoing",
            "summary": "Drafting a 3-channel Diwali revenue plan with Meera and Zara.",
            "progress_pct": 20,
            "progress_label": "Mapping target segments with Meera",
            "step_progress": [
                {"id": "s1", "label": "Goal + budget drafted", "status": "done", "timestamp": _hours_ago(7)},
                {"id": "s2", "label": "Segment mapping", "status": "active"},
                {"id": "s3", "label": "Creative brief", "status": "pending"},
                {"id": "s4", "label": "Approval", "status": "pending"},
            ],
            "created_at": _hours_ago(7),
            "updated_at": _hours_ago(2),
        },
        # --- Scheduled ---
        {
            "id": "task-scheduled-1",
            "title": "Weekly Performance Brief generation",
            "agent_id": "rishi",
            "origin": "instruction",
            "status": "scheduled",
            "summary": "Runs every Monday at 9:00 AM IST.",
            "schedule": "Every Monday · 9:00 AM",
            "step_progress": [],
            "created_at": _days_ago(7),
            "updated_at": _days_ago(7),
        },
        {
            "id": "task-scheduled-2",
            "title": "Refresh stale segments",
            "agent_id": "meera",
            "origin": "instruction",
            "status": "scheduled",
            "summary": "Refreshes definitions for any segment older than 30 days.",
            "schedule": "Every Sunday · 11:00 PM",
            "step_progress": [],
            "created_at": _days_ago(7),
            "updated_at": _days_ago(7),
        },
        # --- Completed ---
        {
            "id": "task-completed-1",
            "title": "Aryan built checkout recovery flow — published, est ₹3.2L recovery",
            "agent_id": "aryan",
            "origin": "agent",
            "status": "completed",
            "summary": "Shipped Checkout Recovery v2 with a 24h re-trigger and WhatsApp lead-with.",
            "outcome_text": "Published 6 days ago. Estimated recovered revenue: ₹3.2L.",
            "impact_meta": {"estimated_revenue": 320000, "estimated_revenue_currency": "INR"},
            "step_progress": [
                {"id": "s1", "label": "Built", "status": "done", "timestamp": _days_ago(7)},
                {"id": "s2", "label": "Approved", "status": "done", "timestamp": _days_ago(7)},
                {"id": "s3", "label": "Published", "status": "done", "timestamp": _days_ago(6)},
            ],
            "created_at": _days_ago(7),
            "updated_at": _days_ago(6),
        },
        {
            "id": "task-completed-2",
            "title": "Meera refreshed VIP segment — added 234 users",
            "agent_id": "meera",
            "origin": "agent",
            "status": "completed",
            "summary": "Refreshed VIP definition to include last-90-day spenders. 234 new users added.",
            "outcome_text": "Completed 3 days ago. New VIP cohort size: 480 users.",
            "impact_meta": {"estimated_reach": 234},
            "step_progress": [
                {"id": "s1", "label": "Definition updated", "status": "done", "timestamp": _days_ago(3)},
                {"id": "s2", "label": "Audience refreshed", "status": "done", "timestamp": _days_ago(3)},
            ],
            "created_at": _days_ago(3),
            "updated_at": _days_ago(3),
        },
    ]
    await db.tasks.insert_many(tasks)
    logger.info("Seeded %s tasks", len(tasks))



EXPECTED_FLOW_COUNT = 12


def _node(node_id: str, n_type: str, y: int, data: dict, x: int = 260) -> dict:
    return {
        "id": node_id,
        "type": n_type,
        "position": {"x": x, "y": y},
        "data": data,
    }


def _edge(eid: str, source: str, target: str, label: str | None = None) -> dict:
    e = {"id": eid, "source": source, "target": target}
    if label:
        e["label"] = label
    return e


async def _seed_flows(db: AsyncIOMotorDatabase) -> None:
    count = await db.flows.count_documents({"deleted": {"$ne": True}})
    if count == EXPECTED_FLOW_COUNT:
        return
    await db.flows.delete_many({})

    flows = [
        # ---------- 1) Cart Abandonment Recovery (active) ----------
        {
            "id": "flow_cart_recovery_01",
            "name": "Cart Abandonment Recovery",
            "description": "Recover users who abandoned cart in last 7 days",
            "status": "active",
            "channels": ["whatsapp", "email"],
            "audience": {"segment_name": "Cart abandoners (7d)", "estimated_users": 340},
            "goal": "Recover abandoned checkouts",
            "nodes": [
                _node("n1", "trigger", 60, {"label": "Cart abandoned", "trigger_type": "event", "event_name": "cart_abandoned"}),
                _node("n2", "wait", 180, {"label": "Wait 30 min", "duration_minutes": 30}),
                _node("n3", "channel", 300, {
                    "label": "Send WhatsApp reminder",
                    "channel": "whatsapp",
                    "body": "Hey {{first_name}}, you left something in your cart. Tap below to complete checkout.",
                }),
                _node("n4", "wait", 420, {"label": "Wait 24 hours", "duration_minutes": 1440}),
                _node("n5", "condition", 540, {
                    "label": "Purchased in 24h?",
                    "field": "purchased_within",
                    "operator": "<=",
                    "value": 24,
                }),
                _node("n6", "channel", 660, {
                    "label": "Send 10% off email",
                    "channel": "email",
                    "subject": "10% off — your cart is waiting",
                    "body": "Here's 10% off if you complete your order today.",
                }, x=60),
                _node("n7", "end", 660, {"label": "Goal reached — purchase made"}, x=460),
            ],
            "edges": [
                _edge("e1", "n1", "n2"),
                _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"),
                _edge("e4", "n4", "n5"),
                _edge("e5y", "n5", "n7", "yes"),
                _edge("e5n", "n5", "n6", "no"),
            ],
            "performance": {
                "entered": 1240,
                "completed": 287,
                "conversion_rate": 23.1,
                "revenue_inr": 245000,
            },
            "created_at": _days_ago(7),
            "updated_at": _hours_ago(6),
            "published_at": _days_ago(7),
        },
        # ---------- 2) Welcome Series for New Users (active) ----------
        {
            "id": "flow_welcome_01",
            "name": "Welcome Series for New Users",
            "description": "Greet new signups and introduce them to the brand",
            "status": "active",
            "channels": ["email", "whatsapp"],
            "audience": {"segment_name": "New signups (7d)", "estimated_users": 890},
            "goal": "Activate new users",
            "nodes": [
                _node("n1", "trigger", 60, {"label": "User signed up", "trigger_type": "event", "event_name": "user_signup"}),
                _node("n2", "channel", 180, {
                    "label": "Send welcome email",
                    "channel": "email",
                    "subject": "Welcome to TSPKARIX 🌿",
                    "body": "Hey {{first_name}}, glad you're here. Here's what to try first.",
                }),
                _node("n3", "wait", 300, {"label": "Wait 2 days", "duration_minutes": 2880}),
                _node("n4", "channel", 420, {
                    "label": "Send WhatsApp tip",
                    "channel": "whatsapp",
                    "body": "Tip: our most-loved skincare bundles are here — {{deep_link}}",
                }),
                _node("n5", "end", 540, {"label": "End"}),
            ],
            "edges": [
                _edge("e1", "n1", "n2"),
                _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"),
                _edge("e4", "n4", "n5"),
            ],
            "performance": {
                "entered": 890,
                "completed": 612,
                "conversion_rate": 68.8,
                "revenue_inr": 0,
            },
            "created_at": _days_ago(30),
            "updated_at": _days_ago(2),
            "published_at": _days_ago(30),
        },
        # ---------- 3) VIP Re-engagement (paused) ----------
        {
            "id": "flow_vip_reengage_01",
            "name": "VIP Re-engagement",
            "description": "Win back high-value buyers who lapsed 30+ days",
            "status": "paused",
            "channels": ["whatsapp", "sms", "push"],
            "audience": {"segment_name": "VIP lapsed (30d)", "estimated_users": 450},
            "goal": "Reactivate VIP buyers",
            "nodes": [
                _node("n1", "trigger", 60, {"label": "VIP no order in 30d", "trigger_type": "segment", "event_name": "segment_entry"}),
                _node("n2", "channel", 180, {
                    "label": "Send WhatsApp 'we miss you'",
                    "channel": "whatsapp",
                    "body": "Hi {{first_name}}, we miss you. Here's 15% off your next order.",
                }),
                _node("n3", "wait", 300, {"label": "Wait 3 days", "duration_minutes": 4320}),
                _node("n4", "condition", 420, {
                    "label": "Opened message?",
                    "field": "message_opened",
                    "operator": "=",
                    "value": True,
                }),
                _node("n5", "channel", 540, {
                    "label": "Send Push reminder",
                    "channel": "push",
                    "body": "Your 15% off expires tonight. Tap to shop.",
                }, x=60),
                _node("n6", "channel", 540, {
                    "label": "Send SMS reminder",
                    "channel": "sms",
                    "body": "Your 15% off code: VIP15 — expires tonight.",
                }, x=460),
                _node("n7", "end", 660, {"label": "End"}),
            ],
            "edges": [
                _edge("e1", "n1", "n2"),
                _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"),
                _edge("e4y", "n4", "n5", "yes"),
                _edge("e4n", "n4", "n6", "no"),
                _edge("e5", "n5", "n7"),
                _edge("e6", "n6", "n7"),
            ],
            "performance": {
                "entered": 450,
                "completed": 38,
                "conversion_rate": 8.4,
                "revenue_inr": 89000,
            },
            "created_at": _days_ago(45),
            "updated_at": _days_ago(10),
            "last_paused_at": _days_ago(10),
            "published_at": _days_ago(45),
        },
        # ---------- 4) Post-delivery Review Request (draft) ----------
        {
            "id": "flow_review_req_01",
            "name": "Post-delivery Review Request",
            "description": "Ask buyers for a review 3 days after delivery",
            "status": "draft",
            "channels": ["whatsapp", "email"],
            "audience": {"segment_name": "Delivered orders (3d ago)", "estimated_users": 0},
            "goal": "Collect reviews",
            "nodes": [
                _node("n1", "trigger", 60, {"label": "Order delivered", "trigger_type": "event", "event_name": "order_delivered"}),
                _node("n2", "wait", 180, {"label": "Wait 3 days", "duration_minutes": 4320}),
                _node("n3", "channel", 300, {
                    "label": "Send WhatsApp review ask",
                    "channel": "whatsapp",
                    "body": "Hey {{first_name}}, how's your recent order? Share a quick review 🙏",
                }),
                _node("n4", "end", 420, {"label": "End"}),
            ],
            "edges": [
                _edge("e1", "n1", "n2"),
                _edge("e2", "n2", "n3"),
                _edge("e3", "n3", "n4"),
            ],
            "performance": {
                "entered": 0,
                "completed": 0,
                "conversion_rate": 0,
                "revenue_inr": 0,
            },
            "created_at": _hours_ago(20),
            "updated_at": _hours_ago(20),
        },
    ]

    # Enrich the 4 detailed flows with the new metric fields the redesigned
    # /flows list page expects.
    metrics_overlay = {
        "flow_cart_recovery_01": {
            "audience_type": "identified",
            "health": "warning",
            "sent": 2400,
            "delivered": 2280,
            "opened": 950,
            "clicked": 312,
            "orders": 47,
            "revenue_inr": 84200,
            "spent_inr": 3420,
        },
        "flow_welcome_01": {
            "audience_type": "known",
            "health": "healthy",
            "sent": 1850,
            "delivered": 1810,
            "opened": 1240,
            "clicked": 480,
            "orders": 0,
            "revenue_inr": 0,
            "spent_inr": 1100,
        },
        "flow_vip_reengage_01": {
            "audience_type": "identified",
            "health": "healthy",
            "sent": 450,
            "delivered": 442,
            "opened": 198,
            "clicked": 64,
            "orders": 12,
            "revenue_inr": 89000,
            "spent_inr": 2200,
        },
        "flow_review_req_01": {
            "audience_type": "known",
            "health": "healthy",
            "sent": 0,
            "delivered": 0,
            "opened": 0,
            "clicked": 0,
            "orders": 0,
            "revenue_inr": 0,
            "spent_inr": 0,
        },
    }
    for f in flows:
        f.update(metrics_overlay.get(f["id"], {}))

    # 8 additional lighter flows so the list page reads as a realistic
    # production workspace. These don't need full graph nodes — the builder
    # is keyed by id and will just open with whatever's persisted.
    extra_flows = [
        {
            "id": "flow_winback_60d_02",
            "name": "Win-back Lapsed Customers (60d)",
            "description": "Re-engage buyers who haven't shopped in 60+ days.",
            "status": "active",
            "channels": ["email", "whatsapp"],
            "audience": {"segment_name": "Lapsed buyers (60d)", "estimated_users": 1240},
            "audience_type": "identified",
            "health": "healthy",
            "sent": 4120,
            "delivered": 3980,
            "opened": 1820,
            "clicked": 540,
            "orders": 62,
            "revenue_inr": 240000,
            "spent_inr": 5800,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 1240, "completed": 320, "conversion_rate": 25.8, "revenue_inr": 240000},
            "created_at": _days_ago(22),
            "updated_at": _hours_ago(12),
            "published_at": _days_ago(22),
        },
        {
            "id": "flow_birthday_03",
            "name": "Birthday Wishes + Coupon",
            "description": "Auto-send a birthday discount to identified users.",
            "status": "active",
            "channels": ["email", "sms"],
            "audience": {"segment_name": "Users with DOB on file", "estimated_users": 540},
            "audience_type": "known",
            "health": "healthy",
            "sent": 540,
            "delivered": 528,
            "opened": 410,
            "clicked": 184,
            "orders": 36,
            "revenue_inr": 124000,
            "spent_inr": 980,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 540, "completed": 184, "conversion_rate": 34.1, "revenue_inr": 124000},
            "created_at": _days_ago(60),
            "updated_at": _days_ago(3),
            "published_at": _days_ago(60),
        },
        {
            "id": "flow_browse_abandon_04",
            "name": "Browse Abandonment — Skincare",
            "description": "Nudge users who viewed 3+ skincare products without adding to cart.",
            "status": "active",
            "channels": ["whatsapp"],
            "audience": {"segment_name": "Skincare browsers (24h)", "estimated_users": 820},
            "audience_type": "identified",
            "health": "warning",
            "sent": 820,
            "delivered": 770,
            "opened": 290,
            "clicked": 88,
            "orders": 9,
            "revenue_inr": 21400,
            "spent_inr": 1240,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 820, "completed": 88, "conversion_rate": 10.7, "revenue_inr": 21400},
            "created_at": _days_ago(14),
            "updated_at": _hours_ago(36),
            "published_at": _days_ago(14),
        },
        {
            "id": "flow_payday_topbuyers_05",
            "name": "Payday Window — Top Buyers",
            "description": "Push promo to top spenders between the 1st and 5th.",
            "status": "paused",
            "channels": ["sms", "whatsapp"],
            "audience": {"segment_name": "Top buyers", "estimated_users": 2300},
            "audience_type": "identified",
            "health": "healthy",
            "sent": 2300,
            "delivered": 2280,
            "opened": 1340,
            "clicked": 620,
            "orders": 188,
            "revenue_inr": 482000,
            "spent_inr": 8400,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 2300, "completed": 620, "conversion_rate": 27.0, "revenue_inr": 482000},
            "created_at": _days_ago(90),
            "updated_at": _days_ago(5),
            "published_at": _days_ago(90),
            "last_paused_at": _days_ago(5),
        },
        {
            "id": "flow_cod_confirm_06",
            "name": "COD Confirmation Call (AI)",
            "description": "AI-driven verification for high-risk COD orders.",
            "status": "active",
            "channels": ["whatsapp", "voice"],
            "audience": {"segment_name": "COD orders ≥ ₹1,500", "estimated_users": 380},
            "audience_type": "known",
            "health": "healthy",
            "sent": 380,
            "delivered": 378,
            "opened": 350,
            "clicked": 312,
            "orders": 290,
            "revenue_inr": 612000,
            "spent_inr": 4100,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 380, "completed": 312, "conversion_rate": 82.1, "revenue_inr": 612000},
            "created_at": _days_ago(40),
            "updated_at": _hours_ago(8),
            "published_at": _days_ago(40),
        },
        {
            "id": "flow_post_purchase_07",
            "name": "Post-purchase Upsell — Bundles",
            "description": "Suggest complementary bundles 7 days after purchase.",
            "status": "draft",
            "channels": ["email"],
            "audience": {"segment_name": "Recent buyers (7d)", "estimated_users": 0},
            "audience_type": "known",
            "health": "healthy",
            "sent": 0,
            "delivered": 0,
            "opened": 0,
            "clicked": 0,
            "orders": 0,
            "revenue_inr": 0,
            "spent_inr": 0,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 0, "completed": 0, "conversion_rate": 0, "revenue_inr": 0},
            "created_at": _hours_ago(48),
            "updated_at": _hours_ago(48),
        },
        {
            "id": "flow_review_collect_08",
            "name": "Review Collection — 30d Drip",
            "description": "Quietly nudge for reviews on delivered orders.",
            "status": "active",
            "channels": ["email", "whatsapp"],
            "audience": {"segment_name": "Delivered orders (30d)", "estimated_users": 3200},
            "audience_type": "identified",
            "health": "healthy",
            "sent": 3200,
            "delivered": 3140,
            "opened": 1810,
            "clicked": 540,
            "orders": 0,
            "revenue_inr": 0,
            "spent_inr": 2100,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 3200, "completed": 1810, "conversion_rate": 56.6, "revenue_inr": 0},
            "created_at": _days_ago(120),
            "updated_at": _days_ago(1),
            "published_at": _days_ago(120),
        },
        {
            "id": "flow_first_purchase_09",
            "name": "First Purchase Nudge — New Signups",
            "description": "Convert sign-ups to first order within 14 days.",
            "status": "active",
            "channels": ["email", "push"],
            "audience": {"segment_name": "Signups (14d, no order)", "estimated_users": 1450},
            "audience_type": "known",
            "health": "warning",
            "sent": 1450,
            "delivered": 1340,
            "opened": 720,
            "clicked": 240,
            "orders": 88,
            "revenue_inr": 198000,
            "spent_inr": 3120,
            "nodes": [],
            "edges": [],
            "performance": {"entered": 1450, "completed": 240, "conversion_rate": 16.5, "revenue_inr": 198000},
            "created_at": _days_ago(28),
            "updated_at": _hours_ago(20),
            "published_at": _days_ago(28),
        },
    ]
    flows.extend(extra_flows)

    await db.flows.insert_many(flows)
    logger.info("Seeded %s flows", len(flows))
