"""Smart mock conversation system — no LLM required.

Provides per-agent scripted responses with pattern matching so the
Conversation Panel feels real without needing an API key or MongoDB.

In-memory conversation store keeps the session alive across calls within
a single server process.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Optional

# ---------------------------------------------------------------------------
# In-memory store
# ---------------------------------------------------------------------------

_conversations: dict[str, dict] = {}
_messages: dict[str, list[dict]] = {}


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"


# ---------------------------------------------------------------------------
# Agent routing
# ---------------------------------------------------------------------------

_ROUTE_PATTERNS: list[tuple[list[str], str]] = [
    # Dev — build/flow intent
    (["build", "flow", "journey", "automation", "sequence", "create flow", "set up flow"], "dev"),
    # Meera — audience/segment intent
    (["segment", "audience", "cohort", "users who", "high-intent", "who are my"], "meera"),
    # Rishi — analytics/performance intent
    (["performance", "analytics", "why did", "drop", "declined", "report", "conversion rate",
      "delivery", "ctr", "open rate", "benchmark", "compare", "known vs", "e360"], "rishi"),
    # Zara — creative intent
    (["write", "draft", "copy", "message", "subject line", "template", "creative",
      "whatsapp message", "email"], "zara"),
    # Priya — support intent
    (["help", "how do i", "how to", "dlt", "template id", "billing", "wallet", "rejected",
      "issue", "ticket", "support", "setup", "connect", "integrate"], "priya"),
    # Aryan — growth/revenue intent (also default)
    (["revenue", "rupee", "recovery", "remarketing", "campaign", "payday", "lapsed",
      "checkout", "abandoned", "cart", "opportunity", "missing"], "aryan"),
]

_DEFAULT_AGENT = "aryan"


def _route(message: str, pinned_agent: Optional[str]) -> str:
    if pinned_agent:
        return pinned_agent
    lower = message.lower()
    for keywords, agent_id in _ROUTE_PATTERNS:
        if any(k in lower for k in keywords):
            return agent_id
    return _DEFAULT_AGENT


# ---------------------------------------------------------------------------
# Artefact detection — which messages should trigger a Build Mode artefact
# ---------------------------------------------------------------------------

def _detect_artefact_type(message: str, agent_id: str) -> Optional[str]:
    lower = message.lower()
    if agent_id == "dev" and any(k in lower for k in ["build", "flow", "journey", "automation"]):
        return "flow_brief"
    if agent_id == "meera" and any(k in lower for k in ["build", "create", "save", "define"]):
        return "segment_preview"
    if agent_id == "zara" and any(k in lower for k in ["write", "draft", "generate", "create"]):
        return "creative_preview"
    return None


# ---------------------------------------------------------------------------
# Mock artefact payloads
# ---------------------------------------------------------------------------

def _make_flow_brief(user_message: str) -> dict:
    lower = user_message.lower()
    if "checkout" in lower or "recovery" in lower or "abandoned" in lower:
        return {
            "name": "Checkout Recovery Flow",
            "goal": "Recover users who abandoned checkout in the last 7 days",
            "segment": {"name": "Checkout Abandoners (7d)", "estimated_users": 340},
            "channels": ["whatsapp", "email"],
            "estimated_revenue_impact": 320000,
            "estimated_revenue_currency": "INR",
            "nodes": [
                {"id": "n1", "type": "trigger", "label": "Checkout Abandoned", "channel": None},
                {"id": "n2", "type": "wait", "label": "Wait 1 hour", "duration_minutes": 60},
                {"id": "n3", "type": "channel", "label": "WhatsApp: Hey {{first_name}}, you left something behind 👀", "channel": "whatsapp"},
                {"id": "n4", "type": "condition", "label": "Opened WhatsApp?", "branch": "yes/no"},
                {"id": "n5", "type": "wait", "label": "Wait 24 hours", "duration_minutes": 1440},
                {"id": "n6", "type": "channel", "label": "Email: Still thinking? Here's 5% off", "channel": "email"},
                {"id": "n7", "type": "end", "label": "Exit flow"},
            ],
        }
    if "payday" in lower or "campaign" in lower:
        return {
            "name": "Payday Campaign Flow",
            "goal": "Reach high-value buyers during the payday window (1st–5th)",
            "segment": {"name": "Top Buyers — Last 90 Days", "estimated_users": 2300},
            "channels": ["whatsapp", "email"],
            "estimated_revenue_impact": 180000,
            "estimated_revenue_currency": "INR",
            "nodes": [
                {"id": "n1", "type": "trigger", "label": "Payday Campaign Launch", "channel": None},
                {"id": "n2", "type": "channel", "label": "WhatsApp: Payday Sale is live — shop now 🛍️", "channel": "whatsapp"},
                {"id": "n3", "type": "condition", "label": "Clicked?", "branch": "yes/no"},
                {"id": "n4", "type": "wait", "label": "Wait 48 hours", "duration_minutes": 2880},
                {"id": "n5", "type": "channel", "label": "Email: Last chance — sale ends tonight", "channel": "email"},
                {"id": "n6", "type": "end", "label": "Exit flow"},
            ],
        }
    if "lapsed" in lower or "re-engagement" in lower or "re engagement" in lower:
        return {
            "name": "Lapsed User Re-engagement Flow",
            "goal": "Win back users who haven't purchased in 60+ days",
            "segment": {"name": "Lapsed Buyers (60d+)", "estimated_users": 1840},
            "channels": ["whatsapp", "email", "push"],
            "estimated_revenue_impact": 140000,
            "estimated_revenue_currency": "INR",
            "nodes": [
                {"id": "n1", "type": "trigger", "label": "User inactive 60 days", "channel": None},
                {"id": "n2", "type": "channel", "label": "Push: We miss you, {{first_name}}! ✨", "channel": "push"},
                {"id": "n3", "type": "wait", "label": "Wait 3 days", "duration_minutes": 4320},
                {"id": "n4", "type": "condition", "label": "Re-engaged?", "branch": "yes/no"},
                {"id": "n5", "type": "channel", "label": "WhatsApp: Here's 10% off, just for you", "channel": "whatsapp"},
                {"id": "n6", "type": "wait", "label": "Wait 7 days", "duration_minutes": 10080},
                {"id": "n7", "type": "channel", "label": "Email: Your exclusive offer expires soon", "channel": "email"},
                {"id": "n8", "type": "end", "label": "Exit flow"},
            ],
        }
    # Generic
    return {
        "name": "Custom Automation Flow",
        "goal": "Engage your audience at the right moment",
        "segment": {"name": "All Active Users", "estimated_users": 8923},
        "channels": ["whatsapp", "email"],
        "estimated_revenue_impact": 95000,
        "estimated_revenue_currency": "INR",
        "nodes": [
            {"id": "n1", "type": "trigger", "label": "Entry trigger", "channel": None},
            {"id": "n2", "type": "wait", "label": "Wait 2 hours", "duration_minutes": 120},
            {"id": "n3", "type": "channel", "label": "WhatsApp message", "channel": "whatsapp"},
            {"id": "n4", "type": "condition", "label": "Converted?", "branch": "yes/no"},
            {"id": "n5", "type": "channel", "label": "Email follow-up", "channel": "email"},
            {"id": "n6", "type": "end", "label": "Exit flow"},
        ],
    }


def _make_segment_preview(user_message: str) -> dict:
    lower = user_message.lower()
    if "high-intent" in lower or "unconverted" in lower or "browse" in lower:
        return {
            "name": "High-Intent Browsers — Unconverted",
            "conditions": [
                {"field": "viewed_products_count", "operator": ">=", "value": 3, "period_days": 14},
                {"field": "added_to_cart", "operator": "=", "value": False},
                {"field": "orders_count", "operator": "=", "value": 0},
            ],
            "estimated_users": 1840,
            "data_freshness": "Updated 2h ago",
        }
    if "lapsed" in lower:
        return {
            "name": "Lapsed Buyers (60d+)",
            "conditions": [
                {"field": "last_order_days_ago", "operator": ">", "value": 60},
                {"field": "orders_count", "operator": ">=", "value": 1},
            ],
            "estimated_users": 2300,
            "data_freshness": "Updated 4h ago",
        }
    return {
        "name": "Custom Audience Segment",
        "conditions": [
            {"field": "last_seen_days_ago", "operator": "<=", "value": 30},
            {"field": "orders_count", "operator": ">=", "value": 1},
        ],
        "estimated_users": 4200,
        "data_freshness": "Updated 1h ago",
    }


def _make_creative_preview(user_message: str) -> dict:
    lower = user_message.lower()
    channel = "email"
    if "whatsapp" in lower:
        channel = "whatsapp"
    elif "sms" in lower:
        channel = "sms"
    elif "push" in lower:
        channel = "push"

    if channel == "whatsapp":
        return {
            "channel": "whatsapp",
            "variants": [
                {
                    "id": "v1",
                    "body": "Hey {{first_name}} 👋 Your cart is getting lonely! Complete your order now and get FREE delivery. Tap here 👇",
                    "cta": "Shop Now",
                    "rationale": "Emoji-forward, personal, urgency without discounting",
                },
                {
                    "id": "v2",
                    "body": "Hi {{first_name}}, you left something behind! ✨ Your items are still saved. Use code COMEBACK5 for 5% off — valid for 24hrs only.",
                    "cta": "Claim Offer",
                    "rationale": "Adds a time-limited coupon; better for price-sensitive segments",
                },
                {
                    "id": "v3",
                    "body": "{{first_name}}, your {{product_name}} is almost sold out! 🔥 Grab it before it's gone — just 3 left in stock.",
                    "cta": "Buy Now",
                    "rationale": "Scarcity-driven — works best for limited inventory SKUs",
                },
            ],
        }
    # Email default
    return {
        "channel": "email",
        "variants": [
            {
                "id": "v1",
                "subject": "You left something behind, {{first_name}} 👀",
                "body": "Hi {{first_name}},\n\nYour cart is still waiting! We've saved your items, but they won't last forever.\n\nComplete your order now and enjoy FREE delivery on orders above ₹499.",
                "cta": "Complete My Order",
                "rationale": "Warm, no pressure, lead with free delivery benefit",
            },
            {
                "id": "v2",
                "subject": "{{first_name}}, your 5% off expires in 24 hours ⏰",
                "body": "Hi {{first_name}},\n\nWe noticed you didn't complete your order. Here's a one-time 5% off code just for you: SAVE5\n\nValid for 24 hours only.",
                "cta": "Apply Discount",
                "rationale": "Discount-led with urgency — highest conversion variant historically",
            },
        ],
    }


# ---------------------------------------------------------------------------
# Per-agent scripted responses
# ---------------------------------------------------------------------------

def _aryan_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["checkout", "recovery", "abandoned cart"]):
        return (
            "Your checkout recovery has **₹3.2L in recoverable drops** from the last 7 days — "
            "340 users started checkout and didn't complete it.\n\n"
            "**Breakdown:**\n"
            "- 218 users dropped at the payment step\n"
            "- 78 dropped at address entry\n"
            "- 44 dropped at cart review\n\n"
            "My recommendation: a 3-message WhatsApp sequence starting 1 hour after drop, with a "
            "5% coupon offer in message 3. Based on your past recovery flows, this sequence recovers "
            "22–28% of drops — that's **₹70–90K recoverable this week**.\n\n"
            "Want me to get Dev to build the flow?"
        )
    if any(k in lower for k in ["payday", "weekend", "campaign", "sale"]):
        return (
            "Payday weekend starts in **3 days**. Your last payday campaign drove **₹1.8L** — "
            "your top-performing month by far.\n\n"
            "**Opportunity:** Your top-buyers segment (2,300 users) hasn't received a campaign in "
            "21 days. They're warm and due.\n\n"
            "**My recommended plan:**\n"
            "- Day 1 (1st): WhatsApp blast to top 2,300 buyers — early access message\n"
            "- Day 2 (2nd): Email follow-up with product showcase\n"
            "- Day 4 (4th): WhatsApp reminder — 'last 24 hours'\n\n"
            "Estimated impact: **₹1.4–1.8L** based on prior payday performance. "
            "Zara can draft the messages, Dev can wire the flow. Ready to kick it off?"
        )
    if any(k in lower for k in ["lapsed", "re-engagement", "inactive", "haven't bought"]):
        return (
            "Your lapsed segment — users who haven't purchased in 60+ days — sits at **2,300 users** "
            "right now. That's a significant pool.\n\n"
            "**What I'm seeing:**\n"
            "- 800 of them were once high-value (3+ orders)\n"
            "- 1,200 made a single purchase and went quiet\n"
            "- 300 are email-only (WhatsApp not mapped)\n\n"
            "Best play: a 3-step re-engagement sequence. WhatsApp first (for the 2,000 with WA mapped), "
            "then email for the holdouts. Offer a 10% 'welcome back' discount for high-value users only.\n\n"
            "Estimated recovery: **₹1.2–1.5L** if we hit 8% conversion. Dev can build this today."
        )
    if any(k in lower for k in ["revenue", "missing", "opportunity", "what am i"]):
        return (
            "Looking at this week, I see **three revenue opportunities** you haven't acted on:\n\n"
            "**1. ₹3.2L — Checkout drops (7 days)**\n"
            "340 users didn't complete checkout. No recovery flow is running.\n\n"
            "**2. ₹1.8L — Payday window (3 days away)**\n"
            "2,300 high-value buyers, no payday campaign scheduled.\n\n"
            "**3. ₹1.2L — Lapsed VIP re-engagement**\n"
            "800 once-loyal buyers have been silent for 90+ days.\n\n"
            "Total addressable this week: **₹6.2L**. Which do you want to tackle first?"
        )
    # Default Aryan
    return (
        "Here's what the data shows for TSPKARIX this week:\n\n"
        "**Revenue:** ₹8.43L last 30 days (+12.4% vs prior period)\n"
        "**Active flows:** 7 running, 1 draft waiting to publish\n"
        "**Biggest gap:** Checkout drops — 340 users, ₹3.2L sitting unrecovered\n\n"
        "My top recommendation for today: launch a checkout recovery flow. "
        "Your WhatsApp delivery was healthy until Tuesday's dip (Rishi is diagnosing). "
        "Meanwhile, I'd use Email as the primary channel and WhatsApp as fallback.\n\n"
        "Want me to put together a full brief?"
    )


def _zara_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["payday", "sale", "weekend"]):
        return (
            "Here are **3 WhatsApp variants** for the Payday Sale. My pick is **Version B** — "
            "the urgency is built-in and it's under 45 characters on the first line.\n\n"
            "**Version A — Benefit-led:**\n"
            "_\"Payday treat alert 🎉 Your favourites are on sale! Shop your wishlist now — "
            "free delivery on all orders.\"_\n\n"
            "**Version B — Urgency (recommended):**\n"
            "_\"{{first_name}}, your Payday Sale is LIVE 🔥 48 hours only. Don't miss out →\"_\n\n"
            "**Version C — Personal:**\n"
            "_\"Hi {{first_name}} 👋 We picked your top-rated products for the Payday Sale. "
            "Grab them before they sell out!\"_\n\n"
            "Want me to adapt these for Email too? I'd write tighter subject lines and a "
            "two-section email body for each variant."
        )
    if any(k in lower for k in ["checkout", "recovery", "abandoned"]):
        return (
            "For checkout recovery, tone matters a lot. I wouldn't open with the discount — "
            "save it for message 3 when the user hasn't responded.\n\n"
            "**Message 1 — Warm nudge (1h after drop):**\n"
            "_\"Hey {{first_name}} 👀 You left something in your cart! Your items are saved — "
            "pick up where you left off.\"_\n\n"
            "**Message 2 — Social proof (24h):**\n"
            "_\"Others are eyeing your picks, {{first_name}}. Complete your order before "
            "they're gone 🛒\"_\n\n"
            "**Message 3 — Incentive (48h):**\n"
            "_\"Still thinking? Here's 5% off — use code CART5. Valid 24 hours only ⏰\"_\n\n"
            "This 3-step sequence has a 22% recovery rate for your category. "
            "Want me to adapt these for Email as well?"
        )
    if any(k in lower for k in ["subject line", "email subject", "subject"]):
        return (
            "Here are **5 subject line variants** — ranked by predicted open rate based on "
            "your audience's past behaviour:\n\n"
            "1. _\"{{first_name}}, your order is waiting\"_ — personal + action verb (🥇 recommended)\n"
            "2. _\"Last chance: your cart expires tonight ⏰\"_ — urgency-led\n"
            "3. _\"Free delivery, just for you\"_ — benefit-first, works for mobile\n"
            "4. _\"We saved your items (but not for long)\"_ — curiosity hook\n"
            "5. _\"5% off if you come back today\"_ — discount anchor\n\n"
            "Your audience has historically responded best to personalised subjects with "
            "action verbs — Option 1 is my lead. Want me to write the email body to match?"
        )
    # Default Zara
    return (
        "I can generate multi-channel creative for you. Tell me:\n\n"
        "1. **What's the campaign goal?** (recovery, promotion, announcement, re-engagement)\n"
        "2. **Which channel should lead?** (WhatsApp, Email, SMS, Push)\n"
        "3. **Who's the audience?** (lapsed users, VIP buyers, first-time purchasers?)\n\n"
        "Once I have those three, I'll give you 2–3 variants per channel with a recommendation "
        "on which to lead with and why."
    )


def _meera_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["high-intent", "unconverted", "browsed", "haven't converted"]):
        return (
            "Your highest-intent unconverted cohort right now: **1,840 users** who have:\n\n"
            "- Viewed 3+ products in the last 14 days\n"
            "- Never added to cart\n"
            "- Zero purchase history\n\n"
            "These are genuinely interested buyers — they're researching, not browsing casually. "
            "The fact that no flow is targeting them is a gap.\n\n"
            "**What I'd recommend:**\n"
            "A browse-based re-engagement flow with WhatsApp as primary. "
            "Estimated reach: 1,840 users. Est. revenue if 5% convert: **₹2.1L**.\n\n"
            "Want me to define the segment formally so Dev can build the flow?"
        )
    if any(k in lower for k in ["segment", "attention", "stale", "overlap"]):
        return (
            "Your segment library has **3 items needing attention**:\n\n"
            "**1. 'New Users' segment — 62 days stale**\n"
            "Hasn't been refreshed since March. Current user count may be significantly off.\n\n"
            "**2. VIP × Returning Buyers — 38% overlap**\n"
            "These two segments are largely targeting the same people. "
            "Consider merging or exclusion logic to avoid double-messaging.\n\n"
            "**3. High-intent browsers — not targeted by any flow**\n"
            "1,840 qualified users with no automation pointed at them.\n\n"
            "I can fix all three. Which would you like me to tackle first?"
        )
    if any(k in lower for k in ["lapsed", "inactive", "60 days", "haven't ordered"]):
        return (
            "Your lapsed segment — no purchase in 60+ days — currently has **2,300 users**.\n\n"
            "**Breakdown by value tier:**\n"
            "- High-value (3+ past orders): 820 users\n"
            "- Mid-tier (1–2 orders): 1,180 users\n"
            "- Single purchasers: 300 users\n\n"
            "I'd recommend targeting high-value and mid-tier separately — "
            "they respond to different incentive structures. "
            "High-value: personalised win-back with brand story. "
            "Mid-tier: discount-driven offer.\n\n"
            "Want me to build both segments? I'll add conditions for WhatsApp mapping "
            "so Dev can wire up the right channels."
        )
    if any(k in lower for k in ["vip", "top buyer", "best customer"]):
        return (
            "Your VIP buyers — top 10% by LTV — total **480 users** right now.\n\n"
            "**Profile:**\n"
            "- Average order value: ₹2,100 (vs ₹850 store average)\n"
            "- Average orders: 5.2 per user\n"
            "- Last purchase: mostly within 30 days\n"
            "- Channel: 78% have WhatsApp mapped\n\n"
            "This cohort is your most responsive — they open WhatsApp messages at 2.3× "
            "the rate of general users. They should always get early access to campaigns.\n\n"
            "Want me to formalise this as a saved segment with auto-refresh?"
        )
    # Default Meera
    return (
        "I'm looking at your segment library. Here's the current state:\n\n"
        "**Healthy segments:** Cart abandoners (340 users), Post-purchase 30D (1,200 users), "
        "New subscribers this week (89 users)\n\n"
        "**Needs attention:** New Users segment (62 days stale), High-intent browsers "
        "(1,840 users, no flow targeting them)\n\n"
        "**Opportunities I've identified:** A high-intent unconverted cohort (1,840 users), "
        "a lapsed VIP re-engagement pool (820 users), and a browse-but-no-cart segment (2,400 users).\n\n"
        "Which of these would you like me to define properly?"
    )


def _rishi_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["delivery", "whatsapp drop", "delivery drop", "failed", "decline"]):
        return (
            "The WhatsApp delivery drop is **not a content issue**. Here's what happened:\n\n"
            "**Root cause:** A DLT template update pushed on Tuesday changed the registered "
            "header format. The carrier rejected messages using the old header — "
            "that's your 412 failed deliveries.\n\n"
            "**Timeline:**\n"
            "- Mon: 98.2% delivery rate (normal)\n"
            "- Tue 14:00: Template change triggered\n"
            "- Tue 16:00: Delivery rate dropped to 61%\n"
            "- Wed–Thu: 62.3% average (still failing)\n\n"
            "**Fix:** Re-register the template header through Priya — she can walk you through "
            "the DLT re-approval in about 20 minutes. Once that's done, delivery should "
            "recover to >95% within 2 hours.\n\n"
            "Priya is the right person for this — want me to pull her in?"
        )
    if any(k in lower for k in ["best performing", "top flow", "highest converting"]):
        return (
            "Your best-performing flow this month is the **Post-purchase review request**:\n\n"
            "| Metric | Value |\n"
            "|--------|-------|\n"
            "| Trigger rate | 1,247 entries |\n"
            "| WhatsApp open rate | 68% |\n"
            "| Click-to-review | 31% |\n"
            "| Attribution | ₹0 (review flow, no revenue goal) |\n\n"
            "**Runner-up by revenue:** Cart abandonment recovery — ₹42,000 attributed, "
            "234 users, 18.8% recovery rate.\n\n"
            "The post-purchase flow outperforms because timing is perfect — "
            "the message goes out 3 days after delivery when satisfaction is highest. "
            "Aryan has suggested extending this pattern to your new product line."
        )
    if any(k in lower for k in ["known vs", "e360 identified", "compare", "attribution"]):
        return (
            "Comparing **Known vs E360 Identified** users for the last 30 days:\n\n"
            "| Cohort | Users | Revenue | Conversion Rate |\n"
            "|--------|-------|---------|----------------|\n"
            "| Known users | 3,200 | ₹5.1L | 3.9% |\n"
            "| E360 Identified | 1,847 | ₹2.3L | 6.1% |\n"
            "| Unidentified | 3,876 | ₹1.0L | 0.8% |\n\n"
            "**Key insight:** E360 Identified users convert at **2.1×** the rate of known users. "
            "This is because E360 identification catches high-intent sessions that CRM "
            "attribution misses — users who browse logged-out or on a different device.\n\n"
            "I'd recommend making E360 Identified the primary source for your "
            "retargeting flows. Currently only 2 of your 7 flows use it."
        )
    if any(k in lower for k in ["weekly", "report", "brief", "summary", "this week"]):
        return (
            "**Weekly Performance Brief — TSPKARIX**\n\n"
            "**Revenue:** ₹8.43L (+12.4% vs last week)\n"
            "**Orders:** 1,247 (+8.1%)\n"
            "**Unique users:** 8,923 (+5.7%)\n\n"
            "**Top findings:**\n"
            "1. Checkout flow conversion up 6% WoW — the WhatsApp timing fix last Thursday worked\n"
            "2. WhatsApp CTR declining on Tuesdays — I suspect a send-window issue. "
            "Moving the Tuesday batch to Wednesday 10 AM could recover 18–22% CTR\n"
            "3. Email opens spiking on weekends (+31% vs weekdays) — "
            "your Saturday sends are significantly underused\n\n"
            "**3 actions I'd recommend:**\n"
            "1. Shift Tuesday WhatsApp sends to Wednesday 10 AM\n"
            "2. Add a Saturday email send to your payday campaign\n"
            "3. Investigate the DLT template rejection on Checkout Recovery v2"
        )
    # Default Rishi
    return (
        "I'll pull the numbers on that. Give me the specific metric you want to diagnose — "
        "which flow, channel, or time window?\n\n"
        "**Current snapshot (last 7 days):**\n"
        "- WhatsApp delivery rate: 62.3% (down from 98% — active issue)\n"
        "- Email open rate: 24.1% (stable)\n"
        "- SMS delivery: 97.8% (healthy)\n"
        "- Best converting flow: Post-purchase review (31% click-to-review)\n\n"
        "Ask me about any specific flow, channel, or period and I'll give you "
        "the breakdown with the why, not just the what."
    )


def _dev_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["checkout", "recovery", "abandoned"]):
        return (
            "Brief received. Here's what I'm building:\n\n"
            "**Checkout Recovery Flow — v2**\n"
            "Target: 340 users who dropped in the last 7 days\n\n"
            "**Sequence:**\n"
            "1. Trigger: Checkout abandoned\n"
            "2. Wait: 1 hour\n"
            "3. WhatsApp: Warm nudge (Zara's Version A)\n"
            "4. Condition: Opened message?\n"
            "5. Wait: 24 hours (if no open)\n"
            "6. Email: Incentive with 5% coupon\n"
            "7. End\n\n"
            "I've pre-configured the trigger, channel sequence, and timing based on "
            "your past flow performance. The segment is already set to Checkout Abandoners (7d).\n\n"
            "Review the flow preview on the right and click **Approve and build** to publish."
        )
    if any(k in lower for k in ["payday", "campaign"]):
        return (
            "On it. Payday Campaign Flow — configured and ready for review.\n\n"
            "**What I've built:**\n"
            "- Entry: Payday campaign launch (manual trigger — you control the start date)\n"
            "- Message 1: WhatsApp to 2,300 users (Zara's urgency variant)\n"
            "- Condition: Clicked? → branch into converters vs non-clickers\n"
            "- Message 2 (non-clickers, 48h): Email last-chance push\n"
            "- End: 5 days post-launch\n\n"
            "This mirrors the structure of your best payday campaign from 3 months ago. "
            "I've kept the timing identical — that one drove ₹1.8L.\n\n"
            "Review the flow preview and approve when ready."
        )
    if any(k in lower for k in ["lapsed", "re-engagement", "win back", "inactive"]):
        return (
            "Re-engagement flow configured. Three-step sequence targeting lapsed users.\n\n"
            "**What I've built:**\n"
            "- Trigger: User inactive 60+ days\n"
            "- Push notification: Day 1 (for 1,840 users with push enabled)\n"
            "- Condition: Re-engaged? Branch on click\n"
            "- WhatsApp: Day 4 with 10% offer for non-clickers\n"
            "- Email: Day 11 final touchpoint\n"
            "- End: Day 14\n\n"
            "This is a 14-day window — aggressive enough to recover intent, "
            "not so long it annoys. Based on your category, expect 6–9% re-engagement rate.\n\n"
            "Ready for your review on the right."
        )
    if any(k in lower for k in ["draft", "publish", "today", "what flows"]):
        return (
            "You have **1 draft flow** ready to publish right now:\n\n"
            "**Post-delivery review request**\n"
            "- Trigger: Order delivered\n"
            "- Wait: 3 days\n"
            "- WhatsApp: Review request with product image\n"
            "- Condition: Reviewed? If no → Email follow-up (Day 7)\n"
            "- Audience: All orders (triggers on each new delivery)\n\n"
            "This flow has been sitting in draft for 11 days. "
            "Your existing post-purchase flow (the one running) gets 31% click-to-review — "
            "this one has a slightly better template based on Zara's last revision.\n\n"
            "I can publish this now — just say the word."
        )
    # Default Dev
    return (
        "Give me the brief and I'll build it. What I need:\n\n"
        "1. **Trigger** — what event starts this flow? "
        "(checkout drop, purchase, inactivity, manual launch)\n"
        "2. **Audience** — which segment? "
        "(I can work with Meera's definitions or a custom condition)\n"
        "3. **Channels** — WhatsApp, Email, SMS, Push, or a mix?\n\n"
        "Once I have those three, I can have the flow configured and ready for your review in minutes."
    )


def _priya_response(message: str, history: list[dict]) -> str:
    lower = message.lower()
    if any(k in lower for k in ["dlt", "template id", "dlt template"]):
        return (
            "For your DLT Template ID on Shopify:\n\n"
            "**Step 1:** Go to your Engage 360 Settings → WhatsApp → Templates\n"
            "**Step 2:** Click on the template you want the ID for\n"
            "**Step 3:** The Template ID appears in the URL and also in the template detail panel "
            "on the right under 'Template metadata'\n\n"
            "If the template was registered through your telecom provider's portal "
            "(TRAI DLT portal), the ID is also visible at:\n"
            "**Provider Portal → My Templates → [Template Name] → DLT Header ID**\n\n"
            "If you're seeing a mismatch between what's registered on DLT and what's in "
            "Engage 360, that's likely what caused the delivery drop Rishi flagged. "
            "I can raise a sync request with the tech team — do you want me to do that?"
        )
    if any(k in lower for k in ["rejected", "template rejected", "whatsapp rejected"]):
        return (
            "WhatsApp template rejections usually fall into 3 buckets. Let me check yours:\n\n"
            "**Common rejection reasons:**\n"
            "1. **Prohibited content** — promotional language without an opt-in header. "
            "Phrases like 'limited offer' or 'click now' without proper opt-in disclosure.\n"
            "2. **Variable formatting** — {{variables}} not in the correct format or "
            "exceeding Meta's 60-character variable limit.\n"
            "3. **Category mismatch** — template filed under 'TRANSACTIONAL' but contains "
            "promotional content (or vice versa).\n\n"
            "Could you share the template name or the rejection notice text? "
            "I can give you the exact fix once I see the reason code. "
            "Most rejections are resubmittable with minor edits — turnaround is 24–48 hours."
        )
    if any(k in lower for k in ["billing", "wallet", "recharge", "balance"]):
        return (
            "Your current wallet balance is **-₹10,94,785.66** — you're in the negative, "
            "which means your account is operating on credit limit extended by your plan.\n\n"
            "**To recharge:**\n"
            "1. Click **Recharge Now** in the top navigation bar\n"
            "2. Select a recharge amount (minimum ₹5,000)\n"
            "3. Payment via NEFT/RTGS, UPI, or credit card — all are instant except NEFT\n\n"
            "Your send limits won't be affected until the balance crosses the credit threshold "
            "defined in your plan. If you're worried about flows being paused, I can check "
            "your current credit ceiling — just ask."
        )
    if any(k in lower for k in ["ticket", "support", "escalate", "issue", "problem", "broken"]):
        return (
            "I'll raise a support ticket for you. To make sure it gets to the right team fast, "
            "give me:\n\n"
            "1. **What's the issue?** (WhatsApp delivery, template, billing, flow not triggering, etc.)\n"
            "2. **Since when?** (Started today, been ongoing for X days)\n"
            "3. **Impact?** (Number of users affected, estimated revenue impact)\n\n"
            "I'll attach your account context (TSPKARIX) and the relevant flow/template IDs "
            "automatically — you won't need to dig those up.\n\n"
            "Priority tickets (delivery failures affecting live flows) get a response within 2 hours."
        )
    if any(k in lower for k in ["how", "setup", "connect", "shopify", "integrate"]):
        return (
            "Happy to walk you through that. Which integration or setup are you working on?\n\n"
            "**Most common setups I handle:**\n"
            "- Shopify event mapping (checkout, purchase, NDR triggers)\n"
            "- WhatsApp Business Account connection and OBA verification\n"
            "- DLT template registration and approval\n"
            "- Custom event tracking setup\n"
            "- Team member access and permissions\n\n"
            "Point me to the specific one and I'll give you step-by-step instructions "
            "tailored to your account's current state."
        )
    # Default Priya
    return (
        "I'm here to help with anything setup, configuration, or support-related. "
        "Here's what I can assist with right now:\n\n"
        "- **WhatsApp:** DLT template issues, approval status, delivery troubleshooting\n"
        "- **Integrations:** Shopify event mapping, OBA connection, custom events\n"
        "- **Billing:** Wallet recharge, credit limits, invoice requests\n"
        "- **Account:** Team access, permissions, notification settings\n"
        "- **Escalations:** I'll raise a priority ticket with full account context attached\n\n"
        "What do you need?"
    )


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------

_AGENT_HANDLERS = {
    "aryan": _aryan_response,
    "zara": _zara_response,
    "meera": _meera_response,
    "rishi": _rishi_response,
    "dev": _dev_response,
    "priya": _priya_response,
}

_AGENT_NAMES = {
    "aryan": "Aryan",
    "zara": "Zara",
    "meera": "Meera",
    "rishi": "Rishi",
    "dev": "Dev",
    "priya": "Priya",
}


def generate_reply(
    message: str,
    pinned_agent: Optional[str],
    history: list[dict],
) -> tuple[str, str, Optional[str]]:
    """Return (agent_id, response_text, artefact_type_or_None)."""
    agent_id = _route(message, pinned_agent)
    handler = _AGENT_HANDLERS.get(agent_id, _aryan_response)
    text = handler(message, history)
    artefact_type = _detect_artefact_type(message, agent_id)
    return agent_id, text, artefact_type


def generate_artefact_payload(
    artefact_type: str,
    user_message: str,
) -> Optional[dict]:
    if artefact_type == "flow_brief":
        return _make_flow_brief(user_message)
    if artefact_type == "segment_preview":
        return _make_segment_preview(user_message)
    if artefact_type == "creative_preview":
        return _make_creative_preview(user_message)
    return None


# ---------------------------------------------------------------------------
# In-memory conversation store helpers
# ---------------------------------------------------------------------------

def create_conversation(
    seed_message: Optional[str],
    pinned_agent: Optional[str],
    source: str,
) -> dict:
    conv_id = _new_id("conv-")
    title = _short_title(seed_message or "New conversation")
    now = _iso_now()

    conversation = {
        "id": conv_id,
        "title": title,
        "source": source,
        "pinned_agent": pinned_agent,
        "created_at": now,
        "updated_at": now,
        "preview": "",
        "agents_involved": [],
    }
    _conversations[conv_id] = conversation
    _messages[conv_id] = []

    messages_out: list[dict] = []

    if seed_message:
        user_msg = _make_user_message(conv_id, seed_message)
        messages_out.append(user_msg)
        _messages[conv_id].append(user_msg)

        agent_id, text, artefact_type = generate_reply(
            seed_message, pinned_agent, []
        )
        agent_msg = _make_agent_message(conv_id, agent_id, text, artefact_type)
        messages_out.append(agent_msg)
        _messages[conv_id].append(agent_msg)

        _conversations[conv_id]["preview"] = _truncate(text)
        _conversations[conv_id]["agents_involved"] = [agent_id]

    return {"conversation": conversation, "messages": messages_out}


def send_message(
    conversation_id: str,
    content: str,
    pinned_agent: Optional[str],
) -> dict:
    if conversation_id not in _conversations:
        # Gracefully create on first call if conversation was never stored
        create_conversation(None, pinned_agent, "ask_ai")
        if conversation_id not in _conversations:
            _conversations[conversation_id] = {
                "id": conversation_id,
                "title": "Conversation",
                "created_at": _iso_now(),
                "updated_at": _iso_now(),
                "agents_involved": [],
            }
            _messages[conversation_id] = []

    history = _messages.get(conversation_id, [])

    user_msg = _make_user_message(conversation_id, content)
    _messages.setdefault(conversation_id, []).append(user_msg)

    agent_id, text, artefact_type = generate_reply(content, pinned_agent, history)
    agent_msg = _make_agent_message(conversation_id, agent_id, text, artefact_type)
    _messages[conversation_id].append(agent_msg)

    _conversations[conversation_id]["updated_at"] = _iso_now()
    _conversations[conversation_id]["preview"] = _truncate(text)
    _conversations[conversation_id].setdefault("agents_involved", [])
    if agent_id not in _conversations[conversation_id]["agents_involved"]:
        _conversations[conversation_id]["agents_involved"].append(agent_id)

    return {"messages": [user_msg, agent_msg]}


def get_conversation(conversation_id: str) -> Optional[dict]:
    conv = _conversations.get(conversation_id)
    if not conv:
        return None
    msgs = _messages.get(conversation_id, [])
    return {**conv, "messages": msgs}


def list_conversations() -> list[dict]:
    return [
        {**c, "messages": _messages.get(c["id"], [])}
        for c in sorted(_conversations.values(), key=lambda x: x["updated_at"], reverse=True)
    ]


def attach_artefact(conversation_id: str, message_id: str, artefact_type: str, user_message: str) -> Optional[dict]:
    msgs = _messages.get(conversation_id, [])
    for msg in msgs:
        if msg["id"] == message_id:
            payload = generate_artefact_payload(artefact_type, user_message)
            if payload:
                msg["artefact"] = {"type": artefact_type, "payload": payload}
                msg.pop("pending_artefact_type", None)
                return msg
    return None


# ---------------------------------------------------------------------------
# Message constructors
# ---------------------------------------------------------------------------

def _make_user_message(conv_id: str, content: str) -> dict:
    return {
        "id": _new_id("msg-u-"),
        "conversation_id": conv_id,
        "role": "user",
        "content": content,
        "created_at": _iso_now(),
    }


def _make_agent_message(
    conv_id: str,
    agent_id: str,
    content: str,
    artefact_type: Optional[str],
) -> dict:
    msg: dict = {
        "id": _new_id("msg-a-"),
        "conversation_id": conv_id,
        "role": "agent",
        "agent_id": agent_id,
        "content": content,
        "created_at": _iso_now(),
    }
    if artefact_type:
        msg["pending_artefact_type"] = artefact_type
    return msg


def _short_title(text: str) -> str:
    t = (text or "").strip().split("\n", 1)[0]
    return (t[:80] + "...") if len(t) > 80 else (t or "New conversation")


def _truncate(text: str, limit: int = 140) -> str:
    text = (text or "").strip().replace("\n", " ")
    return (text[:limit].rstrip() + "...") if len(text) > limit else text
