"""Static mock data for all Engage 360 routes.

Used as a fallback when MongoDB is unavailable (no connection / startup seed
not yet run). Mirrors the exact shapes expected by the frontend.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _hours_ago(h: int) -> str:
    return _iso(datetime.now(timezone.utc) - timedelta(hours=h))


def _days_ago(d: int) -> str:
    return _iso(datetime.now(timezone.utc) - timedelta(days=d))


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------

AGENTS = [
    {
        "id": "aryan",
        "name": "Aryan",
        "title": "Growth Strategist",
        "domain": "Recovery · Remarketing",
        "color": "#22C55E",
        "avatar_initials": "A",
        "bio": (
            "Aryan monitors your revenue pipeline 24/7. He spots missed recovery "
            "opportunities, surfaces high-ROI campaign ideas, and always speaks in "
            "rupees — not recommendations. If there's money being left on the table, he'll find it."
        ),
        "suggested_prompts": [
            "What revenue am I missing this week?",
            "Suggest a campaign for this weekend",
            "Which flows should I build next?",
        ],
        "signals_monitored": [
            "Checkout abandonment pools",
            "Payday calendar windows",
            "Lapsed high-value segments",
        ],
    },
    {
        "id": "zara",
        "name": "Zara",
        "title": "Creative Lead",
        "domain": "Copy · Creative",
        "color": "#EC4899",
        "avatar_initials": "Z",
        "bio": (
            "Zara generates on-brand copy, multi-channel creative variations, and layout "
            "suggestions grounded in your past performance. She knows what your audience "
            "responds to and has an opinion on everything — especially your subject lines."
        ),
        "suggested_prompts": [
            "Write a WhatsApp message for Payday Sale",
            "Generate 5 email subject line variations",
            "Rewrite my checkout recovery template",
        ],
        "signals_monitored": [
            "Creative performance by channel",
            "Open/click rates by copy variant",
            "Brand voice consistency",
        ],
    },
    {
        "id": "meera",
        "name": "Meera",
        "title": "Audience Architect",
        "domain": "Segments · Audience",
        "color": "#8B5CF6",
        "avatar_initials": "M",
        "bio": (
            "Meera understands your customers better than anyone. She identifies "
            "high-value cohorts hiding in your data, flags stale or conflicting segments, "
            "and makes sure every flow targets exactly the right people."
        ),
        "suggested_prompts": [
            "Which segments need my attention?",
            "Who are my highest-intent unconverted users?",
            "Show me audience overlap between my top flows",
        ],
        "signals_monitored": [
            "Segment age and drift",
            "Cross-segment overlap",
            "Untargeted high-intent cohorts",
        ],
    },
    {
        "id": "rishi",
        "name": "Rishi",
        "title": "Performance Analyst",
        "domain": "Analytics · Reports",
        "color": "#3B82F6",
        "avatar_initials": "R",
        "bio": (
            "Rishi turns your data into decisions. He diagnoses underperforming flows, "
            "delivers weekly performance briefs, and always goes beyond 'what happened' "
            "to explain why. Ask him anything about your numbers — he will not give you a vague answer."
        ),
        "suggested_prompts": [
            "What's my best performing flow this month?",
            "Why did my WhatsApp conversions drop?",
            "Compare Known vs E360 Identified revenue",
        ],
        "signals_monitored": [
            "Flow conversion rates",
            "Channel delivery anomalies",
            "Week-over-week revenue attribution",
        ],
    },
    {
        "id": "dev",
        "name": "Dev",
        "title": "Flow Builder",
        "domain": "Flows · Automation",
        "color": "#64748B",
        "avatar_initials": "D",
        "bio": (
            "Dev takes a brief and turns it into a live automation. He handles flow "
            "configuration, channel sequencing, timing recommendations, and the launch "
            "checklist. He does not talk much — he just builds things that work."
        ),
        "suggested_prompts": [
            "Build a checkout recovery flow",
            "Set up a post-purchase review request",
            "What flows should I publish today?",
        ],
        "signals_monitored": [
            "Active flow health",
            "Draft flows awaiting publish",
            "Configuration errors",
        ],
    },
    {
        "id": "priya",
        "name": "Priya",
        "title": "Support Lead",
        "domain": "Setup · Integrations",
        "color": "#F59E0B",
        "avatar_initials": "P",
        "bio": (
            "Priya helps you get things done without friction. Whether it's a how-to "
            "question, a DLT template issue, or something broken that needs escalating "
            "— she answers in the context of your account, not a generic knowledge base."
        ),
        "suggested_prompts": [
            "How do I get a DLT Template ID?",
            "Why is my WhatsApp template rejected?",
            "Raise a support ticket",
        ],
        "signals_monitored": [
            "Template approval status",
            "Open support tickets",
            "Integration health",
        ],
    },
]

# ---------------------------------------------------------------------------
# Store stats
# ---------------------------------------------------------------------------

STORE_STATS = {
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
        "delta_pct": 0.0,
        "period": "Currently running",
    },
}

# ---------------------------------------------------------------------------
# Intelligence cards
# ---------------------------------------------------------------------------

INTELLIGENCE_CARDS = [
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
        "generated_at": _hours_ago(5),
    },
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
        "generated_at": _hours_ago(6),
        "collab_agents": [],
    },
    {
        "id": "card-aryan-1",
        "agent_id": "aryan",
        "urgency": "opportunity",
        "headline": (
            "Payday window starts in 3 days. Your top buyers segment (2,300 users) "
            "hasn't received a campaign in 21 days. Est. ₹1.8L recoverable."
        ),
        "stats": [
            {"label": "Audience", "value": "2,300 users"},
            {"label": "Window", "value": "1st–5th"},
        ],
        "cta_primary": "Build this",
        "cta_secondary": "Tell me more",
        "generated_at": _hours_ago(8),
        "collab_agents": ["meera"],
    },
    {
        "id": "card-dev-1",
        "agent_id": "dev",
        "urgency": "insight",
        "headline": (
            "All 7 active flows healthy. 1 draft flow ready to publish: 'Post-delivery review'."
        ),
        "stats": [
            {"label": "Active", "value": "7"},
            {"label": "Drafts", "value": "1"},
        ],
        "cta_primary": "Review drafts",
        "cta_secondary": "View all flows",
        "generated_at": _hours_ago(10),
        "status_bar": "green",
    },
]

# ---------------------------------------------------------------------------
# Scheduled reports
# ---------------------------------------------------------------------------

REPORTS = [
    {
        "id": "report-rishi-weekly",
        "agent_id": "rishi",
        "title": "Weekly Performance Brief",
        "cadence": "weekly",
        "findings": [
            "Checkout flow conversion up 6% week-over-week.",
            "WhatsApp CTR declining on Tuesdays — investigate send-window.",
            "Email opens spiking on weekends — repurpose for Saturday campaigns.",
        ],
        "action_count": 3,
        "generated_at": _days_ago(1),
    },
    {
        "id": "report-meera-weekly",
        "agent_id": "meera",
        "title": "Segment Health Report",
        "cadence": "weekly",
        "findings": [
            "2 high-value cohorts identified — 'Skincare repeat' and 'Wellness explorers'.",
            "'New Users' segment is 60+ days stale — refresh recommended.",
            "Cross-segment overlap detected between VIP and Returning Buyers (~38%).",
        ],
        "action_count": 3,
        "generated_at": _days_ago(1),
    },
]

# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

TASKS = [
    {
        "id": "task-001",
        "title": "Approve new VIP segment definition",
        "status": "awaiting",
        "origin": "agent",
        "suggested_by": "meera",
        "impact": "480 users",
        "created_at": _hours_ago(10),
        "updated_at": _hours_ago(10),
    },
    {
        "id": "task-002",
        "title": "Approve creative variations for Payday campaign",
        "status": "awaiting",
        "origin": "agent",
        "suggested_by": "zara",
        "impact": "2,300 users",
        "created_at": _hours_ago(12),
        "updated_at": _hours_ago(12),
    },
    {
        "id": "task-003",
        "title": "Re-engagement flow for lapsed users ready to publish",
        "status": "awaiting",
        "origin": "agent",
        "suggested_by": "dev",
        "impact": "Est. ₹1.4L",
        "created_at": _hours_ago(14),
        "updated_at": _hours_ago(14),
    },
    {
        "id": "task-004",
        "title": "Rishi is running weekly flow performance analysis",
        "status": "ongoing",
        "origin": "instruction",
        "suggested_by": "rishi",
        "impact": None,
        "created_at": _hours_ago(1),
        "updated_at": _hours_ago(0),
    },
    {
        "id": "task-005",
        "title": "Checkout recovery flow diagnosis in progress",
        "status": "ongoing",
        "origin": "agent",
        "suggested_by": "rishi",
        "impact": "412 failed sends",
        "created_at": _hours_ago(2),
        "updated_at": _hours_ago(0),
    },
    {
        "id": "task-006",
        "title": "Meera to refresh New Users segment",
        "status": "ongoing",
        "origin": "agent",
        "suggested_by": "meera",
        "impact": None,
        "created_at": _hours_ago(3),
        "updated_at": _hours_ago(1),
    },
    {
        "id": "task-007",
        "title": "Weekly Performance Brief — Rishi",
        "status": "scheduled",
        "origin": "instruction",
        "suggested_by": "rishi",
        "impact": None,
        "trigger": "Every Monday 9:00 AM",
        "created_at": _days_ago(7),
        "updated_at": _days_ago(7),
    },
    {
        "id": "task-008",
        "title": "Segment Health Report — Meera",
        "status": "scheduled",
        "origin": "instruction",
        "suggested_by": "meera",
        "impact": None,
        "trigger": "Every Monday 9:00 AM",
        "created_at": _days_ago(7),
        "updated_at": _days_ago(7),
    },
    {
        "id": "task-009",
        "title": "Checkout Recovery v1 — launched and running",
        "status": "completed",
        "origin": "agent",
        "suggested_by": "dev",
        "impact": "234 users entered · ₹42,000 attributed",
        "created_at": _days_ago(5),
        "updated_at": _days_ago(3),
    },
    {
        "id": "task-010",
        "title": "VIP Payday campaign sent",
        "status": "completed",
        "origin": "agent",
        "suggested_by": "aryan",
        "impact": "1,840 users reached · ₹1.2L attributed",
        "created_at": _days_ago(8),
        "updated_at": _days_ago(7),
    },
]

TASK_COUNTS = {
    "awaiting": sum(1 for t in TASKS if t["status"] == "awaiting"),
    "ongoing": sum(1 for t in TASKS if t["status"] == "ongoing"),
    "scheduled": sum(1 for t in TASKS if t["status"] == "scheduled"),
    "completed": sum(1 for t in TASKS if t["status"] == "completed"),
}

# ---------------------------------------------------------------------------
# Ask AI suggestion chips
# ---------------------------------------------------------------------------

ASK_AI_SUGGESTIONS = [
    {"id": "sug-1", "agent_id": "rishi", "label": "Why did my WhatsApp delivery drop?"},
    {"id": "sug-2", "agent_id": "meera", "label": "Who are my highest-intent unconverted users?"},
    {"id": "sug-3", "agent_id": "aryan", "label": "Plan a payday-window campaign"},
    {"id": "sug-4", "agent_id": "dev", "label": "Build a cart-abandonment recovery flow"},
]
