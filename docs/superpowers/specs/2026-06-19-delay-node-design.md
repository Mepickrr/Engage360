# PRD: Delay Node

**Status:** Draft  
**Author:** Meenal Kamalakar  
**Date:** June 2026

---

## Table of Contents

1. [Background](#1-background)
2. [Feature Brief](#2-feature-brief)
3. [The Job](#3-the-job)
4. [Success Metrics](#4-success-metrics)
5. [Why Timing is the Hardest Part of D2C Automation](#5-why-timing-is-the-hardest-part-of-d2c-automation)
6. [Who Uses This and When](#6-who-uses-this-and-when)
7. [The Three Delay Patterns](#7-the-three-delay-patterns)
8. [Future Patterns](#8-future-patterns)
9. [Seller Journey Archetypes](#9-seller-journey-archetypes)
10. [Functional Requirements](#10-functional-requirements)
11. [How the Delay Node Executes](#11-how-the-delay-node-executes)
12. [States](#12-states)
13. [Edge Cases](#13-edge-cases)
14. [Non-Functional Requirements](#14-non-functional-requirements)
15. [Analytics & Instrumentation](#15-analytics--instrumentation)
16. [Dependencies](#16-dependencies)
17. [Out of Scope](#17-out-of-scope)
18. [Open Questions](#18-open-questions)
19. [Decision Log](#19-decision-log)

---

## 1. Background

D2C brands running automated flows face a fundamental tension: the moment a user does something is almost never the right moment to respond. A customer who just abandoned a cart does not need a message in 30 seconds — that feels like surveillance. They do not need one in 48 hours either — by then they have either purchased or moved on. They need it in the window where it is still relevant: roughly an hour later, after they have had time to leave without forgetting.

This pattern repeats across the entire customer lifecycle. The right follow-up to an order placement is not immediate — it is three days later, when the product is in transit. The right re-engagement attempt is not today — it is at the point where the product the customer last bought is likely running out. The right flash sale notification is not whenever the user happens to be in the flow — it is the exact moment the sale goes live, for every user simultaneously.

Without a delay primitive, every triggered flow fires all its actions at once. The Start Trigger gets the right user into the flow. The Delay node gets them to the right step at the right time.

---

## 2. Feature Brief

The Delay node is a pause gate in the flow execution engine. It receives a user from the previous node, holds them for a configured duration or until a configured time, then passes them to the next node. It does not send messages, evaluate conditions, or modify user state. Its only function is temporal: controlling when the user moves forward.

Three distinct seller problems map to three delay modes:

- **Wait for** a duration from the moment of entry — cart recovery, post-purchase follow-up, onboarding sequences.
- **Wait till** a specific calendar moment — flash sales, editorial campaigns, coordinated sends where all users must receive the message at the same wall-clock time regardless of when they entered the flow.
- **Wait till** a time derived from a date stored on the customer's profile — replenishment reminders, birthday campaigns, subscription renewals.

---

## 3. The Job

**Irreducible job:** Let a marketer say "pause this user's journey until the right moment" — and have the system honor that exactly, for every user, at scale, across timezones.

Three things that, if missing, make this not worth shipping:

1. **Temporal precision.** "Wait 1 hour" must fire in 1 hour, not 55 or 65 minutes. "Till Monday 18:00 IST" must not fire at 18:00 UTC. A delay node that fires approximately trains marketers not to trust the system, and an untrusted scheduler is abandoned.

2. **Deterministic behavior on past-time configurations.** Schedule mode and event-relative mode can both produce a target time that is already in the past when the user enters the node. Undefined behavior here causes users to park indefinitely or proceed unexpectedly. The marketer must be in explicit control of the fallback.

3. **Scheduler durability.** A delay node holding 50,000 users for 24 hours is a set of 50,000 scheduled jobs. If those jobs are lost during a deployment, restart, or infrastructure event, those users are silently dropped from the flow with no error surfaced. Scheduled state must be durable, recoverable, and auditable.

---

## 4. Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| % of activated flows containing at least one delay node | Unknown | ≥ 70% | Flow graph audit at activation |
| Schedule mode adoption | Unknown | ≥ 15% of delay nodes use schedule mode | `delay_configured` event, `mode` property |
| Event-relative mode adoption | Unknown | ≥ 10% of delay nodes (after Phase 2 launch) | `delay_configured` event |
| Past-time fallback configuration rate | Unknown | ≥ 90% of schedule and event-relative nodes have explicit fallback set before activation | Node validation at flow activation |
| Scheduler miss rate | Unknown | < 0.1% of all delay firings exceed NFR tolerance | `delay_sla_violated` events |
| Null variable rate per node | Unknown | < 20% of event-relative node entries result in null variable | `delay_variable_null` events — high rate signals a misconfigured variable reference |

---

## 5. Why Timing is the Hardest Part of D2C Automation

When a brand first starts automating, they build flows that fire immediately: trigger fires, message sends. This works for transactional confirmations (order placed → order confirmed). It breaks for almost everything else.

**The spam failure mode.** Without delay, every re-engagement flow becomes a burst. A user who browses without buying gets an email, a WhatsApp, and a push notification in the same minute they leave the site. None of these feel like helpful follow-ups. They feel like being tracked in real time. The user unsubscribes. The brand burns a contact that cost ₹40 to acquire.

Delay is not just a timing control — it is the mechanism that separates automation from spam. A 1-hour gap after cart abandonment turns an aggressive tracker into a helpful reminder. A 7-day gap after purchase turns a cross-sell into a considered recommendation. Every well-designed retention flow has spacing between its steps, and that spacing is expressed entirely through delay nodes.

**The calendar coordination problem.** Not all brand communication is reactive. Some of it is editorial: a sale goes live Monday at 18:00, and every user in the pre-sale waitlist flow should receive the "it's live" notification at exactly that moment — not staggered based on when they individually entered the flow. Duration-based delay cannot express this. A user who joined the waitlist on Saturday and a user who joined on Monday morning would receive the notification at different times if duration were used. You need a mode that says "park here until a specific calendar moment, regardless of when you arrived."

**The lifecycle timing problem.** The most valuable retention communication is timed to each customer's individual rhythm, not the brand's calendar. A customer who bought a 30-day face wash should get a replenishment message at day 25, not day 30 (likely out of stock) and not day 45 (already bought from a competitor). This timing is personal — it is a function of when they ordered and what they ordered, data the brand already has. Duration and calendar modes cannot express this. You need a mode that derives the target time from a field on the customer's own profile.

These three problems — the reaction gap, the coordinated calendar moment, and the personal lifecycle timing — are why one delay mode is not enough, and why each mode exists.

---

## 6. Who Uses This and When

### Campaign Marketer (primary)

Runs cart recovery, welcome series, and post-purchase flows. Uses duration mode almost exclusively — gaps of 1 to 48 hours between messages. Needs the common case to take under 15 seconds to configure. Does not think about timezones because their audience is primarily domestic. Success is: configure a delay, see a meaningful label on the canvas, move on.

### CRM / Lifecycle Analyst (secondary)

Builds replenishment, win-back, and subscription renewal sequences. Needs event-relative mode to anchor timing to customer profile data. Detail-oriented — will configure max wait caps, fallbacks, and inspect variable groups carefully. Failure mode: the variable they need (`customer.last_replenishment_date`) is not in the available variable list.

### Growth Manager (secondary)

Runs time-sensitive campaigns tied to the brand calendar. Needs schedule mode to coordinate sends across a user cohort — flash sales, product drops, seasonal pushes. Cares deeply about timezone correctness. Failure mode: configured IST but the system defaulted to UTC; thousands of users received the flash sale notification at 00:30 instead of 18:00.

---

## 7. The Three Delay Patterns

### Pattern 1 — Wait For: Duration from Entry

**What it expresses:** Hold this user for X time from the moment they arrive at this node.

**The seller problem it solves:** A user just did something. The brand wants to respond, but not immediately. The right window is typically 1–48 hours for most D2C use cases. The marketer does not care what day of the week or time of day this resolves to — they just need a gap between actions.

**Seller use cases:**
- Cart abandonment: 1-hour gap before first nudge; 23-hour gap before second touch
- Post-purchase: 3 days before asking for a review; 7 days before checking on delivery
- Onboarding: Day 1, Day 3, Day 7 sends expressed as chained 2-day delays
- Win-back: 30-day gap between re-engagement touches

**How fire time is computed:** `fire_at = entry_time + duration`. No timezone conversion required. The delay is relative to a moment in time, not a position on a clock face.

---

### Pattern 2 — Wait Till: Specific Calendar Moment

**What it expresses:** Hold this user until a specific day and time, or an exact date, regardless of when they arrived.

**The seller problem it solves:** Some brand communication is editorial, not reactive. A flash sale goes live at Monday 18:00. The brand wants every user in the pre-sale flow to receive the notification at that exact moment — not staggered. Duration mode fails here: users who entered the flow at different times would fire at different wall-clock times. Calendar mode guarantees coordination.

**Two sub-modes:**

*Day + Time (recurring):* Resolves to the next valid occurrence of the configured day and time from the user's entry moment. "Monday 18:00" fires on the next Monday at 18:00, whether that is today (if 18:00 has not passed) or next week. Useful for recurring cadences: weekly digests, payday-aligned sends, end-of-month campaigns.

*Exact Date + Time (one-shot):* Fires at a specific fixed datetime. Useful for product launches, sale start dates, and event-specific sends. If the configured date is in the past when a user enters the node, the past-time fallback applies immediately.

**Timezone:** All calendar-mode delays must resolve in a defined timezone. Two options: a fixed timezone (all users fire at the same wall-clock time, useful for domestic campaigns) or the customer's profile timezone (each user fires at the configured time in their own timezone, useful for international brands). If a customer has no timezone on their profile, the fallback chain is: customer timezone → flow-level default timezone → UTC.

**Seller use cases:**
- Flash sale go-live: all waitlisted users notified simultaneously at launch moment
- Weekly re-engagement: every user in the flow receives the message Monday morning
- Seasonal deadline: "last chance" message sent to everyone on the final night of a sale
- Payday targeting: 1st-of-month send regardless of when users entered the flow

**How fire time is computed:** `fire_at = next_occurrence(day, time, timezone, from=entry_time)`. For exact date: `fire_at = configured_datetime` converted to UTC. If `fire_at < entry_time`, apply fallback immediately without creating a scheduled job.

---

### Pattern 3 — Wait Till: Event-Relative (Variable-Based)

**What it expresses:** Hold this user until X time before or after a date stored on their customer profile.

**The seller problem it solves:** The most precise retention communication is timed to each customer's individual lifecycle. Replenishment timing depends on when the customer last ordered and what they ordered — data the brand already has in their customer profile. A fixed duration from flow entry is insufficient because the trigger event is often not the same as the lifecycle marker. A customer who bought 2 months ago and is being re-targeted via a win-back flow needs the system to read `customer.last_order_date`, not "when did this user enter the flow."

**Seller use cases:**
- Replenishment: 25 days after `customer.last_order_date` for a 30-day product
- Birthday campaign: 7 days before `customer.birthday`
- Subscription renewal: 3 days before `customer.subscription_expiry`
- Post-delivery follow-up: 1 day after `order.estimated_delivery_date`

**How fire time is computed:** At node entry, the system reads the configured variable from the customer's profile. `fire_at = variable_value + offset` (after direction) or `fire_at = variable_value - offset` (before direction). If offset is 0, direction is irrelevant — `fire_at = variable_value` exactly.

**Null variable handling:** If the variable is null at node entry, the user parks. The system polls for the variable to be populated. If a max wait cap is configured, a parallel cap job runs; whichever resolves first (variable populated or cap expired) advances the user. If no cap is configured, the user parks until the variable is populated or the system-level safety cap (90 days) is reached.

**Past-time handling:** If the computed `fire_at` is in the past (e.g., "25 days after last order date" but the last order was 40 days ago), the past-time fallback applies immediately.

---

## 8. Future Patterns

The three modes cover the majority of D2C timing use cases. What they do not cover:

**Smart send-time optimization.** Fire the delay when the system predicts this specific user is most likely to engage, based on their historical open/click behavior. Not a fixed offset — personalized per user. Requires a per-user ML model and a prediction API.

**Dynamic duration.** The duration itself is a customer attribute — "wait for `customer.preferred_response_delay`." Requires a new variable-bound duration sub-mode.

**Condition-reactive delay ("wait until X happens").** Hold the user until they perform a specific action, or for a maximum of Y days. Semantically distinct from a pause — this is closer to a Wait/Until node type that holds an event listener, not a scheduler.

**Cohort-coordinated delay.** Hold users until a threshold of the cohort has passed this node — for paced rollouts or A/B test sequencing. Requires cohort state tracking.

These are natural extensions of the delay primitive but are out of scope for this version.

---

## 9. Seller Journey Archetypes

Four journeys illustrate how delay nodes compose in practice.

### Journey 1: Cart Recovery Sequence

**Trigger:** Cart abandoned, cart value > ₹500

| Step | Node | Delay Config | Why this timing |
|------|------|-------------|-----------------|
| 1 | Delay | Wait 1 hour | User needs time to decide on their own. A message in seconds feels like tracking. |
| 2 | WhatsApp | "You left something behind" | First nudge, no discount — just a reminder |
| 3 | Delay | Wait 23 hours | Let the first message breathe. Do not double-tap within the same day. |
| 4 | Condition | Did user purchase? | Exit if converted — no further messages needed |
| 5 | Email | "Still thinking about it?" | Second touch, different channel |
| 6 | Delay | Wait 24 hours | Final gap before last attempt |
| 7 | WhatsApp | "10% off, today only" | Last resort — discount only at final step |

Without the 1-hour initial gap, the first message fires while the user may still be on the checkout page. That is not recovery — that is interruption.

---

### Journey 2: Post-Purchase Experience

**Trigger:** Order placed

| Step | Node | Delay Config | Why this timing |
|------|------|-------------|-----------------|
| 1 | WhatsApp | Order confirmation | Immediate — no delay needed here |
| 2 | Delay | Wait 3 days | Let shipping begin before checking in |
| 3 | WhatsApp | "Your order is on its way — here's how to get the most out of it" | Onboarding content while product is in transit |
| 4 | Delay | Wait 7 days | Likely delivered by now |
| 5 | Email | "How are you finding it? Leave a review" | Review ask after delivery |
| 6 | Delay | 25 days after `order.created_at` (event-relative) | Near end-of-product lifecycle |
| 7 | WhatsApp | "Running low? Reorder in one tap" | Replenishment |

Step 6 uses event-relative delay, not duration, because the replenishment timing must be anchored to the order date — not to when this particular flow instance started. If the brand runs a win-back campaign 2 months after purchase and routes those users into this same post-purchase flow, duration mode would fire the replenishment message 25 days after win-back entry — which is wrong. Event-relative mode reads `order.created_at` and fires 25 days after the actual order, regardless of when the user entered the flow.

---

### Journey 3: Flash Sale Launch

**Trigger:** User joined sale waitlist (custom event)

| Step | Node | Delay Config | Why this timing |
|------|------|-------------|-----------------|
| 1 | Delay | Wait till Friday 23:59 IST | Build anticipation — let the week end before teasing |
| 2 | Push | "Sale starts tomorrow morning!" | Teaser — sets expectation |
| 3 | Delay | Wait till Saturday 10:00 IST | All users notified at the exact launch moment |
| 4 | WhatsApp | "Sale is live — shop now" | Launch notification |
| 5 | Delay | Wait 4 hours (duration) | Urgency window |
| 6 | WhatsApp | "Top picks selling fast" | FOMO reinforcement |

Step 3's schedule mode ensures the launch notification fires simultaneously for all users — a user who joined the waitlist on Monday and one who joined on Friday both receive it at Saturday 10:00 IST. Duration mode would scatter sends across the day based on join time, defeating the coordination that creates launch-moment energy.

---

### Journey 4: Subscription Renewal

**Trigger:** Segment — active subscribers

| Step | Node | Delay Config | Why this timing |
|------|------|-------------|-----------------|
| 1 | Delay | 7 days before `customer.subscription_expiry` | Early heads-up while still frictionless |
| 2 | Email | "Your plan renews in 7 days — review your options" | Non-urgent nudge |
| 3 | Delay | 3 days before `customer.subscription_expiry` | Second window — moderate urgency |
| 4 | WhatsApp | "Renew now and lock in your rate" | Incentivized renewal |
| 5 | Delay | 1 day before `customer.subscription_expiry` | Final reminder |
| 6 | WhatsApp | "Last chance to renew before your plan ends" | Hard deadline copy |

All three delays are anchored to the same variable (`customer.subscription_expiry`) with different before-offsets. The sequence stays synchronized to each customer's actual renewal date regardless of when they entered the flow — a customer whose plan expires August 1st and a customer whose plan expires October 15th both receive the sequence correctly timed to their own dates.

---

## 10. Functional Requirements

Requirements describe what the system must do — not how it is presented or configured.

### 10.1 Duration Mode

- Accept a positive integer duration and a unit: minutes, hours, days, or weeks.
- Minimum configurable duration: 1 minute. Configurations of 0 or below must be rejected.
- Maximum configurable duration: 365 days. Configurations above 365 days must be rejected at save time with an explicit error.
- Non-blocking warning when configured duration exceeds 30 days.
- Fire time is computed as: `fire_at = entry_time + duration`. No timezone conversion. No rounding to time boundaries.

### 10.2 Schedule Mode — Day + Time

- Accept a day specifier: Anyday, Weekday, Weekend, Monday through Sunday, Start of Month, End of Month.
- Accept a wall-clock time with 30-minute resolution across the full 24-hour range (00:00 through 23:30).
- Resolve to the **next valid occurrence** of the configured day and time from the user's entry moment:

| Day specifier | Resolution rule |
|--------------|----------------|
| Anyday | Next occurrence of the configured time, today if not yet passed, otherwise tomorrow |
| Monday–Sunday | Next occurrence of that specific weekday at the configured time. If today is that day and the time has not passed, fire today. |
| Weekday | Next Monday–Friday at the configured time |
| Weekend | Next Saturday or Sunday at the configured time |
| Start of Month | The 1st of the current month at the configured time, if not yet passed. Otherwise the 1st of next month. |
| End of Month | The last day of the current month at the configured time, if not yet passed. Otherwise the last day of next month. |

- **All day and month boundary evaluations ("today", "current month", "last day of the month") are computed in the configured timezone, not UTC.** A user entering at 23:30 UTC on January 31st who is in IST (UTC+5:30) is evaluated as entering at 05:00 IST on February 1st. "Current month" for this user is February.
- Resolution is computed in the configured timezone, not UTC.
- Timezone: full IANA timezone list. Default: `Asia/Kolkata`. Alternative: use customer profile timezone with fallback chain (see 10.4).

### 10.3 Schedule Mode — Exact Date + Time

- Accept a specific calendar date and a wall-clock time.
- If the configured date + time resolves to a moment in the past at node entry, apply the past-time fallback immediately. Do not create a scheduled job.
- Past-time fallback must be configured before flow activation. A node with no fallback set must block flow activation.

### 10.4 Timezone Resolution

When a delay node is configured to use the customer's local timezone:

1. Read the timezone field from the customer's profile.
2. If the field is absent or invalid: use the flow-level default timezone.
3. If no flow-level default is configured: use UTC.

This fallback chain must be consistent across all schedule-mode delay nodes in a flow. The chain must be documented and surfaced to the marketer at flow configuration time.

### 10.5 Event-Relative Mode

- Accept: a datetime variable reference, a non-negative integer offset, an offset unit (minutes, hours, days), and a direction (before or after).
- At node entry, read the variable value from the customer's profile.
- Compute fire time: `variable_value + offset` (after) or `variable_value - offset` (before).
- If offset equals 0, direction is ignored. Fire time equals the variable value exactly.
- If the computed fire time is in the past, apply the past-time fallback immediately.
- If the variable is null at node entry: park the user and begin variable polling (see 11.4). Apply max wait cap if configured.
- Variable types: only datetime-typed variables are valid inputs. Non-datetime variable references must be rejected at configuration time, not at runtime.
- Max wait cap: optional. When enabled, a parallel cap job runs for the configured cap duration. Cap duration accepts a positive integer and a unit (hours or days). Whichever resolves first (variable populates or cap expires) advances the user; the other job is discarded.

### 10.6 Past-Time Fallback

Applies to Schedule (Exact Date) and Event-Relative modes.

| Fallback setting | System behavior |
|-----------------|----------------|
| Continue | User bypasses the delay and advances to the next node immediately |
| Exit branch | User is removed from this branch of the flow. No further nodes in this branch execute for this user. |

**The fallback has no system default — it must be explicitly configured.** A flow containing a Schedule (Exact Date) or Event-Relative delay node where past-time fallback is not set must be blocked from activation with an explicit validation error. This forces the marketer to make a conscious choice rather than inheriting a silent behavior.

If the next node does not exist when Continue fallback fires (the node was deleted after the flow was configured), the user is treated as Exit Branch — there is nowhere to continue to.

---

## 11. How the Delay Node Executes

This section describes the system-level execution model.

### 11.1 Node Entry

When the flow execution engine routes a user to a delay node:

1. The engine writes a **delay instance** to the delay store:
   ```
   {
     instance_id,          // globally unique
     flow_id,
     flow_instance_id,     // this user's run of this flow
     user_id,
     node_id,
     entry_time,           // UTC timestamp
     config_snapshot,      // full copy of node config at this moment
     fire_at,              // UTC timestamp (null if variable is not yet resolved)
     resolved_at,          // null until the delay completes
     resolved_by,          // null until resolved: "timer" | "cap" | "past_time_fallback" | "voided"
     status                // "parked" | "resolved" | "voided"
   }
   ```
   `config_snapshot` is a copy, not a reference — in-flight users are insulated from subsequent config edits.

2. Compute `fire_at`:
   - Duration: `fire_at = entry_time + duration`
   - Schedule/Day+Time: `fire_at = next_occurrence(day, time, timezone, from=entry_time)` converted to UTC
   - Schedule/Exact: `fire_at = configured_datetime` converted to UTC. If `fire_at < entry_time`, apply fallback immediately (no job created).
   - Event-relative: read variable. If found: compute `fire_at`. If null: `fire_at = null`, begin polling, create cap job if configured.

3. Create a scheduled job targeting `fire_at`, carrying `instance_id` as the idempotency key.

4. Mark the user as **parked** at this node in the flow state. Execution halts. No further nodes execute until the job fires.

### 11.2 Scheduled Job Execution

When the scheduled job fires:

1. Load the delay instance by `instance_id`.
2. Validity checks (in order):
   - Is `status` still `"parked"`? If `"resolved"` or `"voided"`, discard — this is a duplicate fire. Do nothing.
   - Does the user still exist? If deleted (GDPR erasure), mark instance as `"voided"`, log, discard.
   - Does the flow still exist? If the flow was deleted after the job was created, mark instance as `"voided"`, log, discard.
   - Is the flow still active? If deactivated, mark instance as `"voided"`, log, discard. If paused, do not discard — hold the user in `"ready_to_advance"` state (see 11.3).
   - Does the exit edge target node still exist? If the next node was deleted, apply Exit Branch fallback regardless of configured past-time fallback.
3. Atomically set `resolved_at = now`, `resolved_by = "timer"`, `status = "resolved"`.
4. Call the flow execution engine: advance the user from this node along the exit edge.
5. If the exit edge target node no longer exists (deleted after delay was created): apply Exit Branch fallback.

### 11.3 Flow State Changes While Users Are Parked

| Flow event | Parked users' behavior |
|------------|----------------------|
| Flow paused | Scheduled jobs continue to fire on time. When a job fires and the flow is paused, the user is placed in a `"ready_to_advance"` state instead of immediately advancing. When the flow resumes, all `"ready_to_advance"` users are advanced in the order their jobs originally fired. Timer does not pause — only advancement is gated. |
| Flow deactivated | Scheduled jobs continue to fire. On fire, the execution engine finds the flow deactivated and voids the instance. The user does not advance. All active parked instances for this flow are also bulk-voided immediately on deactivation. |
| Flow config edited and republished | In-flight users complete with their own `config_snapshot`. New entrants use the updated config. Config edits do not affect parked users. No re-queuing occurs. |
| Flow deleted | All delay instances for this flow are voided immediately. Any queued jobs that fire afterward find the flow deleted and discard. |
| Node deleted from canvas | If active instances exist for this node: the system must warn before allowing deletion ("X users are currently parked here"). If the node is force-deleted, all active instances for it are voided and users are treated as "exit branch." |

### 11.4 Variable Polling (Event-Relative, Null Variable)

When a user enters an event-relative delay node and the variable is null:

1. A **polling record** is created: `{ instance_id, variable_ref, poll_interval_minutes: 15, next_poll_at }`.
2. A polling worker runs every 15 minutes and checks all active polling records whose `next_poll_at` has passed.
3. On each check: read the variable from the customer profile.
   - If now non-null: compute `fire_at`. **Before creating a job, run the past-time check: if `fire_at < now`, apply the past-time fallback immediately and delete the polling record — do not create a scheduled job.** If `fire_at >= now`, create the scheduled job and delete the polling record.
   - If still null: update `next_poll_at = now + poll_interval`.
4. If a max wait cap job fires before the variable resolves: the cap job sets `resolved_by = "cap"`, marks the instance resolved, and the polling record is deleted. Subsequent poll results are discarded.

### 11.5 Two-Tier Job Storage

Most job queue systems are unsuitable for delays spanning days or weeks due to memory constraints, TTL limits, and restart volatility. The system uses a two-tier architecture:

**Near-term queue (≤ 24 hours from now):** Jobs are enqueued directly in the real-time job queue (e.g., BullMQ backed by Redis). These fire with second-level precision.

**Long-term store (> 24 hours from now):** Instances remain in the `delay_instances` database table. They are not in the queue. A promotion worker runs every 60 seconds and finds all instances where:
- `status = "parked"`
- `fire_at <= now + 24 hours`
- `queued_at IS NULL`

It enqueues these instances in the near-term queue and sets `queued_at = now`.

If the promotion worker runs late (e.g., at 23.5 hours instead of 24), the job is created in the queue with the original `fire_at`. The queue fires at the exact `fire_at` regardless of when the job was enqueued.

### 11.6 Max Wait Cap Race Resolution

When max wait cap is enabled, two jobs exist for the same delay instance:

1. Variable resolution job (fires when variable populates)
2. Cap expiry job (fires at `entry_time + cap_duration`)

Both carry `instance_id`. Whichever fires first attempts an atomic write:

```
UPDATE delay_instances
SET resolved_at = now, resolved_by = $reason, status = "resolved"
WHERE instance_id = $id AND status = "parked"
```

If the write succeeds (rows affected = 1): this job won. Advance the user.  
If the write fails (rows affected = 0): the other job already won. This job discards silently.

No explicit job cancellation is required. Both jobs may fire; only one can win the atomic write.

---

## 12. States

| State | What caused it | System behavior | Exit condition |
|-------|---------------|-----------------|----------------|
| Parked — duration | User entered duration node | Scheduled job exists at `fire_at` | Job fires |
| Parked — schedule | User entered schedule node | Scheduled job exists at `next_occurrence` | Job fires |
| Parked — awaiting variable | Event-relative node, variable null at entry | Polling active; cap job exists if cap enabled | Variable populates or cap fires |
| Ready to advance | Job fired while flow was paused | User held, no advancement yet | Flow resumes |
| Bypassed — past-time | fire_at was in the past at entry | No job created; user advanced per fallback immediately | Immediate (at entry) |
| Resolved — timer | Job fired, user advanced normally | Instance closed, `resolved_by = "timer"` | Terminal |
| Resolved — cap | Cap job fired before variable resolved | Instance closed, `resolved_by = "cap"` | Terminal |
| Resolved — past-time fallback | Past-time detected at entry | Instance closed, `resolved_by = "past_time_fallback"` | Terminal |
| Voided | Flow deactivated / user deleted / node deleted | Instance closed, `resolved_by = "voided"` | Terminal |

---

## 13. Edge Cases

### E1: Scheduler downtime at fire_at

**Scenario:** The scheduler is unavailable for 8 minutes. Several thousand delay jobs were scheduled to fire in that window.  
**Wrong behavior:** Jobs are lost. Users park indefinitely with no recovery.  
**Correct behavior:** The job queue must use durable persistence (not in-memory). On recovery, the queue processes missed jobs immediately. A job firing 8 minutes late is within NFR tolerance for long-duration delays. All late firings are logged with `actual_fire_at` and `scheduled_fire_at` for SLA monitoring. The two-tier store ensures that even a full queue restart does not lose instances — the promotion worker re-enqueues from the database on restart.

---

### E2: Duplicate job fires (at-least-once delivery)

**Scenario:** A network retry or queue bug causes the same delay job to fire twice for the same user and node.  
**Wrong behavior:** User advances through the next node twice, triggering duplicate messages.  
**Correct behavior:** The atomic `resolved_at` write in 11.2 step 3 acts as the idempotency guard. The second fire finds `status = "resolved"` and discards without advancing the user. `instance_id` is the idempotency key. All job processors must implement this check as a precondition before taking any action.

---

### E3: Config edited while users are parked

**Scenario:** A marketer changes a delay from "Wait 1 hour" to "Wait 24 hours" while 500 users are currently parked there.  
**Wrong behavior:** Existing parked users have their `fire_at` recomputed to 24 hours from their original entry time.  
**Correct behavior:** `config_snapshot` is stored at entry time and is immutable. The 500 parked users complete with their original 1-hour config. Users who enter the node after the edit use the 24-hour config. The flow canvas should surface a warning to the marketer: "X users are currently in this node and will complete with the previous configuration."

---

### E4: User deleted (GDPR erasure) while parked

**Scenario:** A user requests data deletion. They have a delay job scheduled to fire in 6 hours.  
**Wrong behavior:** Job fires, execution engine reads the user profile, throws a not-found error, job is marked failed and retried in a loop.  
**Correct behavior:** The GDPR erasure process must query `delay_instances` for all active instances (`status = "parked"`) for this user and set them to `status = "voided"` as part of the erasure transaction. When the job fires, step 2 of 11.2 detects the deleted user and discards. No message is sent. No error is raised. The erasure is logged.

---

### E5: DST spring forward (clock gap)

**Scenario:** A schedule node is configured for 02:30 AM in a timezone that observes DST. On the spring-forward day, clocks jump from 02:00 to 03:00 — 02:30 does not exist.  
**Wrong behavior:** `next_occurrence()` throws an error or returns an ambiguous UTC timestamp.  
**Correct behavior:** Use an IANA-aware datetime library (Luxon, Temporal API, or equivalent — not raw Date arithmetic). When the computed wall-clock time falls in a DST gap, advance to the next valid time after the gap (03:00 in this case). Log the adjustment in the delay instance. Document this behavior.

---

### E6: DST fall back (clock overlap)

**Scenario:** A schedule node is configured for 01:30 AM in a timezone that observes DST. On the fall-back day, 01:30 AM occurs twice.  
**Wrong behavior:** The UTC timestamp is ambiguous; the job fires twice or at the wrong occurrence.  
**Correct behavior:** `next_occurrence()` must convert to UTC at computation time. When an ambiguous wall-clock time is encountered, always use the first occurrence (before the clock falls back — the standard time interpretation). The stored `fire_at` is an unambiguous UTC timestamp. Ambiguity exists only in wall-clock representation; the scheduler operates on UTC exclusively.

---

### E7: Variable value changes after fire_at is computed

**Scenario:** User enters an event-relative delay. `customer.last_order_date` is read as 5 days ago. `fire_at` is computed as 25 days from now (30 days after last order). Three days later, the customer places a new order, updating `customer.last_order_date` to today.  
**Wrong behavior:** The system detects the variable change and recomputes `fire_at` to 30 days from today, rescheduling the job.  
**Correct behavior:** `fire_at` is immutable once written. The variable is read once at entry. Subsequent updates to the variable do not affect this delay instance. Recomputing would create unpredictable behavior (cascading reschedules, undefined convergence) and would be invisible to the marketer. This is intentional and must be documented.

---

### E8: Event-relative — "before" direction resolves to past time

**Scenario:** Node is configured "7 days before `customer.subscription_expiry`." The customer's subscription expired 3 days ago. Computed `fire_at` = 10 days in the past.  
**Wrong behavior:** User parks indefinitely because the system treats past-time as a scheduling problem rather than an immediate fallback case.  
**Correct behavior:** Past-time detection runs at entry, not at job execution. At node entry, compute `fire_at`. If `fire_at < entry_time`, apply the past-time fallback immediately and do not create a scheduled job. The past-time check is a precondition of job creation, not an error condition handled by the scheduler.

---

### E9: Null variable with no max wait cap

**Scenario:** Node is configured to wait relative to `customer.birthday`. A large portion of the brand's customer base has never provided their birthday. The variable is null. No max wait cap is configured.  
**Wrong behavior:** Users park indefinitely, filling the delay instance store with unresolvable records.  
**Correct behavior:** A system-level safety cap of 90 days applies to all event-relative delays, regardless of whether the marketer configured a max wait cap. At 90 days, if the variable is still null, the instance is resolved with `resolved_by = "system_cap"` and the user continues through the flow (Continue fallback). This must be logged and surfaced in operational metrics (see Section 15) because a high system-cap rate signals a systematically misconfigured variable reference that the marketer should fix.

---

### E10: Two max-cap jobs racing to the same write

**Scenario:** The variable populates and the cap timer expires within the same database transaction window.  
**Wrong behavior:** Both jobs succeed in advancing the user. Two flow instances continue from the next node.  
**Correct behavior:** The atomic write in 11.6 ensures exactly one job can win. The second finds `status != "parked"` and discards. This is not a retry scenario — the second job should not retry. It should log a `"lost_race"` event and exit cleanly. Engineers must ensure the job processor does not treat a rows-affected = 0 result as an error to retry.

---

### E11: Flash sale — coordinated fire for 200,000 users

**Scenario:** A schedule node is set to "Saturday 10:00 IST." 200,000 users are parked there. At exactly 10:00 IST, all 200,000 jobs fire simultaneously.  
**Wrong behavior:** The job queue is overwhelmed. Jobs are dropped or delayed by minutes. The next node (WhatsApp send) receives 200,000 simultaneous execution requests and either crashes or rate-limits silently.  
**Correct behavior:** The flow execution engine must rate-limit downstream node invocations. Sends must be queued, not executed synchronously. The scheduler must support fan-out at this scale. If a coordinated send to more than 100,000 users is expected at a single timestamp, the engineering team should evaluate whether a broadcast send mechanism (outside the per-user flow engine) is more appropriate.

---

### E12: Flow paused — timer fires while paused; flow unpaused hours later

**Scenario:** User enters "Wait 1 hour." Flow is paused at T=30 min. The delay job fires at T=1hr. Flow is unpaused at T=5hr.  
**Wrong behavior (timer-pause model):** Remaining 30 minutes resume on unpause. User advances at T=5.5hr. Requires recomputing `fire_at` and re-queuing — complex and error-prone.  
**Correct behavior (timer-continues model):** Job fires at T=1hr. User is placed in `"ready_to_advance"` state because flow is paused. At T=5hr (unpause), user advances immediately. Total actual wait: 5 hours wall-clock, 1 hour of active delay. This is the correct behavior. Pausing a flow gates advancement — it does not pause individual timers. Marketers must understand this distinction: pausing a flow does not freeze a user's journey mid-timer.

---

### E13: Chained delays — second delay's next occurrence computed from first delay's exit time

**Scenario:** Flow: Delay(1hr) → Delay("Monday 18:00 IST"). User enters at Saturday 10:00 IST. First delay exits at Saturday 11:00 IST.  
**Correct behavior:** Second delay's `next_occurrence` is computed from Saturday 11:00 IST (the user's entry time to the second node), not from Saturday 10:00 IST (the flow entry time). Result: Monday 18:00 IST. Each delay node computes `next_occurrence` independently from the user's entry time to that node. There is no shared state between chained delays, no "original trigger time" concept passed between nodes.

---

### E14: User re-enters a delay node via a loop branch

**Scenario:** Flow contains a loop: node A → Delay(1hr) → Condition → [back to A if condition false]. User cycles through the delay node multiple times.  
**Wrong behavior:** Multiple active delay instances exist simultaneously for the same user and node. An old instance's job fires and advances the user unexpectedly.  
**Correct behavior:** Each pass through the delay node creates a new `instance_id`. When the user re-enters the delay node from the loop, the previous instance for this user+node is voided before the new instance is created. The new instance gets a fresh `fire_at` from the new entry time. On job fire, the check is: does `instance_id` match the current active instance for this user+node? If superseded, discard.

---

### E15: "Start of Month" — 10-minute entry window determines 30-day wait difference

**Scenario:** A "Start of Month 10:00 IST" delay. Two users enter: User A at 09:58 IST on June 1st; User B at 10:02 IST on June 1st.  
**User A:** next occurrence is today, June 1st 10:00. Wait: 2 minutes.  
**User B:** next occurrence is July 1st 10:00. Wait: ~30 days.  
**This is correct by definition.** However, this is a known sharp edge. Engineers must ensure `next_occurrence()` handles the boundary precisely (not approximately). The marketer should be warned in the configuration surface: when a schedule-mode delay is configured with "Start of Month" or "End of Month," users entering within a few hours of the boundary will have dramatically different wait times. This should not be silently absorbed.

---

### E16: Exact date configured in the past at flow activation time

**Scenario:** A marketer builds a flow with an exact-date delay set to "July 4, 2026 18:00 IST" and publishes the flow on July 6th. The configured date is already in the past at activation time.  
**Wrong behavior:** The flow activates silently. Every user who enters applies the past-time fallback immediately, making the delay node a transparent passthrough. The marketer may not notice.  
**Correct behavior:** Flow activation validation must scan all Schedule (Exact Date) delay nodes and warn if any configured `exact_datetime` is in the past at the time of activation. This should be a blocking error, not just a warning — the marketer must explicitly update or remove the node before the flow can go live. This check is separate from the per-user entry check (Section 10.3); both must exist.

---

### E17: DST transition for Day+Time mode, not just Exact Time

**Scenario:** A Day+Time delay is configured for "Anyday 02:30 AM" in a DST-observing timezone. The promotion worker promotes this instance 3 weeks from now. When `next_occurrence()` computes the target date, it lands on the DST spring-forward night — 02:30 AM does not exist.  
**Wrong behavior:** The edge case is only handled for exact-time schedule nodes (E5). `next_occurrence()` for Day+Time mode hits the same DST gap without protection.  
**Correct behavior:** `next_occurrence()` is a single function used by both Day+Time and Exact Date modes. DST gap and overlap handling (advance to post-gap time; use first occurrence on overlap) must be implemented inside `next_occurrence()` itself, not as a post-processing step applied only to one mode. Both modes benefit automatically.

---

### E18: Flow deactivated mid-write of a new delay instance

**Scenario:** A user enters a delay node. The delay instance write begins. Simultaneously, a marketer deactivates the flow. The bulk-void operation completes before the new instance write commits.  
**Wrong behavior:** The new instance is written after the bulk-void ran. It is never voided. Its job fires on a deactivated flow; the job-fire path (11.2) catches it and voids at fire time — but the user may have continued in the flow for the delay duration before being voided.  
**Correct behavior:** The delay instance write and the job-fire validity check both check flow status. The job-fire check (11.2) handles the race correctly regardless of write timing — deactivated flow → void on fire. The remaining risk is if the execution engine checks flow status before writing the instance and passes, then the flow deactivates, then the instance is written. This window is milliseconds wide but must be acknowledged: the job-fire validity check is the final safety gate, and it is sufficient. There is no need to add a write-time lock; the job-fire check handles the race.

---

### E19: Max wait cap shorter than poll interval

**Scenario:** Event-relative delay with max wait cap set to 5 minutes. Variable is null at entry. Poll interval is 15 minutes. The cap job fires at T+5min. The first poll has not yet run.  
**Wrong behavior:** The polling record continues to exist after the cap fires. At T+15min the poll runs, finds the variable populated (it was populated at T+8min), and attempts to create a scheduled job or advance the user — who has already been advanced by the cap.  
**Correct behavior:** When the cap job fires and wins the atomic write (11.6), it must also delete the polling record as part of the same transaction. The poll at T+15min finds no polling record for this instance and exits cleanly. Engineers must ensure the polling record deletion and the instance status update are atomic (same DB transaction), not two separate writes.

---

### E20: Variable resolves to a structurally valid but semantically nonsensical datetime

**Scenario:** `customer.last_order_date` is set to `1970-01-01T00:00:00Z` (epoch zero — a common sentinel value used by some systems to represent "not set"). The node computes `fire_at = 1970-01-01 + 25 days = 1970-01-26`. This is in the past.  
**Wrong behavior:** System applies past-time fallback immediately and advances the user, silently — no signal that the variable held a bad value.  
**Correct behavior:** The past-time fallback fires correctly in terms of behavior. However, the `delay_node_resolved` event should log `resolved_by = "past_time_fallback"` with the computed `fire_at` value. Operationally, a high rate of past-time fallback on an event-relative node is a signal that the variable reference is misconfigured or that the variable store has bad defaults. The operational alert in Section 15 for null variable rate should be complemented with an alert on past-time fallback rate for event-relative nodes (> 30% suggests a bad default value problem distinct from a null value problem).

---

### E22: Legacy node with duration_minutes = 0

**Scenario:** A flow saved before the minimum-1-minute constraint was introduced has `duration_minutes: 0`.  
**Wrong behavior:** Node creates a job with `fire_at = entry_time`. Job fires immediately. User passes through with zero wait — semantically a passthrough, not a delay.  
**Correct behavior:** Migration maps `duration_minutes <= 0` to 1 minute minimum. Log the correction with `{ node_id, original_value, migrated_to }`. A 0-duration delay has no semantic value and could indicate a data corruption or initialization error.

---

## 14. Non-Functional Requirements

### Precision

| Delay duration | Maximum acceptable lateness |
|---------------|---------------------------|
| ≤ 1 hour | ± 30 seconds |
| 1–24 hours | ± 2 minutes |
| > 24 hours | ± 5 minutes |
| Schedule mode (any) | ± 1 minute from configured wall-clock time in the configured timezone |

These are upper bounds, not targets. Every firing beyond tolerance is logged as a `delay_sla_violated` event and contributes to the scheduler miss rate metric.

### Scale

- The system must support 1 million concurrent parked delay instances without query degradation.
- The `delay_instances` table must be indexed on `(status, fire_at)` for promotion worker efficiency.
- The promotion worker must promote up to 500,000 instances per run without exceeding 60 seconds of wall-clock time.
- Coordinated fire events (many instances sharing a `fire_at`) must not create thundering-herd failures. The flow execution engine must implement a downstream rate limiter for next-node invocations.

### Durability

- Every delay instance must be written to the database before the node entry is acknowledged to the flow engine. Acknowledge-then-write is not acceptable.
- RPO: 0 — no instance may be created without being immediately durable.
- RTO: < 2 minutes — on scheduler restart, the promotion worker must re-enqueue all near-term missed instances within 2 minutes of coming online.
- The near-term queue must use durable persistence (Redis AOF or equivalent). An in-memory-only queue is not acceptable.

### Monotonic Time and UTC

- All `fire_at` values are stored as UTC timestamps.
- All `next_occurrence()` computations convert to UTC before writing to the database.
- The scheduler never receives or operates on wall-clock times directly.
- All datetime arithmetic uses an IANA-aware library. Raw JS `Date` arithmetic, moment.js without timezone, or any library that does not model DST transitions is not acceptable.

---

## 15. Analytics & Instrumentation

### Runtime Events

| Event | When it fires | Key properties |
|-------|--------------|----------------|
| `delay_node_entered` | User enters the delay node | `flow_id`, `node_id`, `user_id`, `instance_id`, `mode` (duration / schedule / event_relative), `fire_at` (UTC), `entry_time` |
| `delay_node_resolved` | User advances from the delay node | `flow_id`, `node_id`, `user_id`, `instance_id`, `resolved_by`, `lateness_ms` (actual minus scheduled fire time) |
| `delay_node_voided` | Instance voided | `flow_id`, `node_id`, `user_id`, `instance_id`, `void_reason` (flow_deactivated / user_deleted / node_deleted / superseded_by_reentry) |
| `delay_past_time_fallback_applied` | Past-time detected at entry, fallback applied immediately | `flow_id`, `node_id`, `user_id`, `fallback_type` (continue / exit), `mode` |
| `delay_cap_fired` | Max wait cap expired before variable resolved | `flow_id`, `node_id`, `user_id`, `instance_id`, `cap_duration_ms` |
| `delay_variable_null` | Event-relative node entered, variable was null | `flow_id`, `node_id`, `user_id`, `variable_ref` |
| `delay_variable_resolved_via_poll` | Variable was null at entry but populated before cap | `flow_id`, `node_id`, `user_id`, `poll_attempts`, `time_to_resolution_ms` |
| `delay_sla_violated` | Job fired beyond NFR tolerance for its duration bracket | `flow_id`, `node_id`, `instance_id`, `mode`, `lateness_ms`, `scheduled_fire_at`, `actual_fire_at` |
| `delay_system_cap_applied` | 90-day system safety cap fired for a null-variable instance | `flow_id`, `node_id`, `user_id`, `instance_id`, `variable_ref` |

### Operational Metrics and Alerts

| Metric | Derivation | Alert condition |
|--------|-----------|----------------|
| Active parked instances | Count of `status = "parked"` in `delay_instances` | Informational — track for capacity planning |
| Scheduler miss rate | `delay_sla_violated` events / total `delay_node_resolved` events | Alert if > 0.1% in any 5-minute window |
| Null variable rate per node | `delay_variable_null` / `delay_node_entered` for event-relative nodes | Alert if > 20% — likely a misconfigured variable reference |
| Cap fire rate per node | `delay_cap_fired` / `delay_node_entered` for event-relative nodes | Alert if > 30% — variable is often missing; marketer may be unaware |
| System cap rate | `delay_system_cap_applied` count | Alert if any — these should be operationally zero in a well-configured flow |
| Past-time fallback rate on event-relative nodes | `delay_past_time_fallback_applied` where `mode = event_relative` / `delay_node_entered` for same mode | Alert if > 30% per node — indicates variable holds bad default values (e.g., epoch-zero) rather than true null, distinct from null-variable rate |
| Promotion worker lag | Age of oldest `status = "parked"` instance that should have been promoted | Alert if any instance is > 2 minutes past its promotion window |

---

## 16. Dependencies

| Dependency | What is needed | If unavailable | Degrades gracefully? |
|------------|---------------|----------------|----------------------|
| Durable job queue | Scheduled job execution with at-least-once delivery and durable persistence | All three delay modes fail to fire | No — hard blocker |
| Delay instance store (DB table) | Persistent record of all active instances; source of truth for two-tier scheduler | Two-tier promotion fails; long delays not recoverable after restart | No — hard blocker |
| IANA timezone database | Accurate DST-aware timezone conversion for schedule mode | Schedule mode fires at wrong wall-clock times for non-UTC users | No — critical for temporal correctness |
| Customer profile store | Variable values for event-relative mode; customer timezone field | Event-relative mode: variable always null. Customer-timezone mode: falls back to flow/UTC | Partial — duration and schedule modes unaffected |
| Flow execution engine | Advancing the user to the next node when the job fires | Jobs fire but cannot advance users — delay completes but journey stalls | No — the delay node is a gate; advancement requires the engine |
| Variable polling infrastructure | Re-checking null variables at 15-minute intervals | Users with null variables park until cap; resolution delay increases from seconds to cap duration | Partial — max cap fallback still works; variable resolution latency increases |

---

## 17. Out of Scope

| Item | Why excluded | What would unlock it |
|------|-------------|---------------------|
| Smart send-time optimization | Requires per-user ML prediction model and a separate inference API | Prediction model, per-user historical engagement data, inference endpoint |
| Dynamic duration (duration from a variable) | Duration tab accepts only static values; variable-bound durations require a new sub-mode with its own scheduling semantics | Design and spec of the variable-duration sub-mode |
| Condition-reactive delay ("wait until user does X, or Y days max") | Semantically a Wait/Until node, not a pause node — requires an event listener held open, not a point-in-time scheduler | Separate node type design |
| Per-node live analytics (how many users are parked here right now, median actual wait time) | Requires a runtime state dashboard surface separate from flow configuration | Flow execution analytics layer and dashboard |
| Delay in broadcast flows | Broadcast is a one-shot send; per-user delay within a broadcast has undefined semantics | Define and spec broadcast execution model |
| Minute-level precision for schedule mode (e.g., 09:15, not just 09:00 or 09:30) | Requires a free-text time input with HH:MM validation; current 30-minute increment model is a simplification | Time input redesign + free-text input validation spec |
| Cohort-coordinated delay | Requires tracking and querying cohort-level state across all users in a flow | Cohort execution model — significant backend investment |

---

## 18. Open Questions

| # | Question | Why it matters | Owner |
|---|----------|---------------|-------|
| Q1 | When a flow is paused and users accumulate in `"ready_to_advance"` state, in what order do they advance on unpause — FIFO by `fire_at`, batch-simultaneous, or rate-limited? | Simultaneous advancement of thousands of users can overwhelm downstream nodes. FIFO is safer but adds sequencing complexity at resume time. | Engineering |
| Q2 | Should node deletion be blocked when active delay instances exist, or allowed with bulk-void? | Blocking is safer but creates UX friction. Bulk-void is permissive but silently removes users from the flow. Either way, this must be explicit — no silent behavior. | Product + Engineering |
| Q3 | What is the confirmed fallback chain for customer-local timezone? Customer profile field name, flow-level default field, UTC fallback — are all three tiers confirmed and implemented? | Without a confirmed chain, timezone resolution is inconsistent across nodes in the same flow. | Engineering |
| Q4 | Should null-variable polling be push-based (a profile write event triggers a re-check) or pull-based (periodic 15-minute poll)? | Push-based reduces latency to seconds and removes the poller overhead but requires event integration. Pull is simpler but adds up to 15 minutes of variable resolution latency. | Engineering |
| Q5 | What is the system-level safety cap duration for event-relative delays with no user-configured max wait cap? 90 days is recommended — is this the right value for the current customer base? | Too short voids legitimate long-horizon delays (e.g., annual subscription renewals). Too long allows silent indefinite parking on misconfigured flows. | Product |
| Q6 | When a user re-enters a flow (per Start Trigger re-entry policy) and reaches a delay node from a previous run: should the old instance for this user+node be voided automatically, or should both instances run in parallel (because re-entry creates a distinct `flow_instance_id`)? | If both instances run in parallel, the user may receive messages from both flow instances simultaneously. If the old instance is voided, the user loses their previous journey state. The correct answer depends on what re-entry semantically means for this product. | Product + Engineering |

---

## 19. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|----------|------------------------|-----------|-------------------|
| `config_snapshot` stored at entry, not referenced live | Reference the live node config; recompute `fire_at` from current config on job fire | In-flight users must not be affected by config edits mid-journey. A marketer who edits a delay while a campaign is running should not silently change the experience for users already inside. Determinism and predictability outweigh real-time config propagation. | A critical config fix takes effect only for new entrants. Users already parked continue with the original config. Marketers must understand this and re-enter affected users manually if needed. |
| Two-tier scheduler (DB + queue) over single queue | A single Redis-backed queue for all delay durations | Delays range from 1 minute to 365 days. In-memory queues are not reliable for durations beyond hours — restarts, evictions, and TTL limits make them unsuitable. The two-tier approach uses the right tool for each range: real-time queue for near-term, durable DB for long-term. | Adds operational complexity: two systems to monitor, a promotion worker to maintain and deploy. The promotion worker is itself a single-point-of-failure for long-term delays and must be monitored. |
| `fire_at` is immutable after computation | Recompute `fire_at` when the underlying variable changes | Mutable `fire_at` creates a requeuing loop with undefined convergence behavior — variables can change multiple times, each triggering a reschedule. Immutability is predictable, debuggable, and avoids a class of cascading job-management bugs. | When a customer's variable changes mid-delay, their timing is based on the value at entry. If the variable changed significantly (e.g., a new order was placed), the timing may no longer be ideal. Acceptable for v1; dynamic re-anchoring is a future enhancement. |
| Past-time fallback has no system default; must be explicitly configured at flow activation | Set a silent system default of Continue or Exit Branch | Forcing an explicit choice means the marketer must think about this behavior before going live. A silent default either advances users prematurely (Continue) or drops them (Exit Branch) without the marketer knowing. Blocking activation on an unconfigured fallback makes the risk visible and deliberate. | Marketers must configure this field even when it feels irrelevant to them (e.g., they are confident the date is in the future). Activation validation must clearly identify which node is missing the configuration. |
| Timer continues when flow is paused; advancement is gated | Pause the timer on flow pause; remaining duration resumes on unpause | Timer-pause requires recomputing `fire_at` and re-queuing on resume — complex, error-prone, and difficult to reason about when multiple nodes are paused simultaneously. Timer-continues is simple: the job fires on schedule; the execution engine checks flow state and holds advancement. The scheduler never needs to know about flow state. | Users who are parked at a delay during a long flow pause will have waited longer wall-clock time than their configured delay when they eventually advance. Marketers must understand that pausing a flow does not freeze individual user timers. |
| Duration minimum of 1 minute | Allow 0-minute delays | A 0-minute delay is semantically a passthrough — it advances the user immediately without any temporal effect. It adds visual noise to the canvas, misleads readers of the flow, and could indicate a data initialization error rather than intentional configuration. If a flow needs an immediate action after a trigger, it should not use a delay node. | Use cases requiring sub-minute delays (e.g., a 30-second gap) cannot use this node. 1 minute is the floor. |
