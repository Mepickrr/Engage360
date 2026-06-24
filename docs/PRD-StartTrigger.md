# PRD: Flow Start Trigger

**Status:** Draft  
**Author:** Meenal Kamalakar  
**Date:** June 2026

---

## Table of Contents

1. [Background](#1-background)
2. [Feature Brief](#2-feature-brief)
3. [The Job](#3-the-job)
4. [Success Metrics](#4-success-metrics)
5. [Who Uses This and When](#5-who-uses-this-and-when)
6. [User Journeys](#6-user-journeys)
7. [Functional Requirements](#7-functional-requirements)
8. [States & System Behaviors](#8-states--system-behaviors)
9. [Edge Cases](#9-edge-cases)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Analytics & Instrumentation](#11-analytics--instrumentation)
12. [Copy](#12-copy)
13. [Dependencies](#13-dependencies)
14. [Out of Scope](#14-out-of-scope)
15. [Open Questions](#15-open-questions)
16. [Decision Log](#16-decision-log)

---

## 1. Background

Marketers on Engage build automated flows — sequences of messages and actions designed to reach a user at a specific moment in their journey. But a flow is inert without an answer to the first question: **who enters it, and when?**

Today, the two most common approaches both fail the marketer:

**The batch approach:** The marketer exports a segment — users who abandoned a cart in the last 24 hours — and sends a one-time campaign. By the time it runs, some users have already purchased. Others abandoned again since. The window closed. The message arrives too late or to the wrong person.

**The engineering-dependent approach:** The marketer describes what they want to a developer — "trigger a message when someone abandons a cart with more than ₹500 in it." The developer writes a listener, wires it to the flow, and deploys it. This takes days. When the rule needs adjusting — maybe ₹500 was too low — the cycle repeats. The marketer cannot iterate without engineering.

The Start Trigger removes both problems. It gives the marketer a self-serve way to define: **which user action starts the flow, under what conditions, for which users.** Once configured, the rule runs continuously. Every user who matches, at any hour, enters the flow at the exact right moment — without the marketer having to do anything again.

---

## 2. Feature Brief

The Start Trigger is the entry gate to every automated flow. Without it, the flow cannot be activated.

It lets a marketer answer three questions before a flow goes live:

1. **What event starts the flow?** — A user performs a specific action (places an order, abandons a cart, views a product page, opens an email) and that action is the signal to begin.
2. **Under what conditions?** — The event must also carry specific properties for it to count. Not every cart abandonment — only those with a cart value above ₹500. Not every product view — only views of a specific category.
3. **For which users?** — From all users who fire that event, only those who also meet a broader profile enter: users who have purchased before, users who are identified in the system, users who are not already in another flow.

The trigger also supports a **broadcast mode** — a one-time send to an audience at a scheduled time, for marketers who need a non-event-driven dispatch.

---

## 3. The Job

**Irreducible job:** Let a marketer express "enter this flow when a user does X, under these conditions, if they also match this profile" — and have the system honor that rule precisely and repeatedly at scale.

Three things that, if missing, make this not worth shipping:

1. **Event fidelity.** The event the marketer selects must be the same event the user's actions actually produce. If the system shows a "cart abandoned" option but it doesn't correspond to the event the data layer fires, no one enters the flow. The marketer will not know. The flow will look live but be silent. This is a trust-destroying failure.

2. **Meaningful audience layering.** The "who" step must allow composable conditions — property, behavior, and affinity rules stacked together. If the marketer can only use a single condition, the trigger is no more powerful than a basic segment filter. The value of event-triggered flows is precision: reaching exactly the right person at exactly the right moment. A trigger that can't narrow by audience doesn't deliver that.

3. **Re-entry control.** A user who fires the trigger event twice should not silently receive the flow twice, or be silently dropped. The marketer must be able to choose: block re-entry, allow it always, or allow it only when the user is no longer active in the flow. Without this, flows become spam vectors or black boxes.

---

## 4. Success Metrics

| Metric | Baseline | Target | How to measure |
|---|---|---|---|
| Trigger configuration completion rate | Unknown — establish at launch | ≥ 80% of new flows are saved with a configured trigger | Flow creation funnel |
| Median time to configure | Unknown | < 3 minutes from trigger setup open to save | Timestamp delta: wizard opened → trigger saved |
| Audience condition usage rate | Unknown | ≥ 40% of configured triggers include at least one audience condition | Trigger save event properties |
| Audience count check rate | Unknown | ≥ 50% of triggers with audience filters use "Show count" before saving | Audience count interactions |
| Zero-entry rate post-activation | Unknown | < 5% of activated flows show zero entries in first 7 days | Flow entry analytics |

**Why these metrics matter:**
- Completion rate below 80% means marketers are starting trigger setup and abandoning — a usability or complexity problem.
- Zero-entry rate above 5% means misconfiguration is common — likely a mismatch between catalogue events and actual data layer events, or no audience count feedback.
- Low audience condition usage means marketers are not using the "who" step — may indicate it's too complex, or they don't understand its value.

---

## 5. Who Uses This and When

### Persona 1 — Campaign Marketer (primary)

**Context:** They manage retention campaigns. They've been running one-off sends — manually exporting segments, uploading to a send tool. They know this misses the moment and want automation.

**Goal:** Set up a cart recovery flow targeting users who abandoned with ≥ ₹500 in their cart. Do it in one session, under 10 minutes, without involving engineering.

**Emotional state:** Motivated but impatient. They've done something like this in Klaviyo or MoEngage. They have expectations. If they can't find "cart abandoned" in the event list quickly, or if they set up audience conditions and don't know if they worked, they'll lose confidence.

**What success looks like:** Trigger is configured. Audience count shows a meaningful number. They proceed to building the flow steps feeling certain the right people will enter.

**What failure looks like:** They configure the trigger, activate the flow, and three days later it shows zero entries. They don't know if it's the trigger or the messages. They lose trust in the product.

---

### Persona 2 — Growth / Lifecycle Analyst (secondary)

**Context:** They design complex lifecycle sequences. They need granular control — not just event selection, but event properties, behavioral history, and affinity signals layered together.

**Goal:** Configure a trigger for users who placed their first order AND have shown affinity for a product category, excluding users already in the VIP retention flow.

**Emotional state:** Methodical. They will explore every condition type. They will test edge cases. They expect the system to behave consistently when conditions are stacked.

**What success looks like:** They can express the full condition — property, behavior, affinity, and exclusion — in a single trigger. The audience count reflects the intersection correctly.

**What failure looks like:** The affinity condition block exists but has no options. Or the exclude block doesn't work as expected. They submit a bug report and lose a sprint.

---

### Persona 3 — Ops / Broadcast Sender (secondary)

**Context:** They send operational and time-sensitive communications — announcements, sale launches, policy updates. They don't need event-triggered logic. They need to dispatch to an audience at a specific time.

**Goal:** Send a broadcast to all identified users immediately, or at a scheduled date and time.

**Emotional state:** In a hurry. They're not interested in conditions. They just want to get from "configure" to "sent."

**What success looks like:** They reach the broadcast path in two steps, set the time, and finish. The flow dispatches as expected.

**What failure looks like:** The entry point for broadcast is buried inside the event trigger path. They spend five minutes trying to figure out where to go. They message support.

---

## 6. User Journeys

### Journey A: Setting up an event-triggered flow (primary path)

**Situation:** A marketer is creating a new flow and has landed on the trigger configuration step.

| Step | What the marketer does | What the system does | Potential friction |
|---|---|---|---|
| 1 | Opens trigger configuration | System shows an event catalog organized by categories (Ecommerce, Communication, Post-purchase, etc.) with a search bar | — |
| 2 | Searches or browses to find the event | Events display with their name, source system, and a short description | If search returns no results, they may not know whether the event doesn't exist or has a different name |
| 3 | Selects an event | System moves to the "When" step, showing the selected event as the trigger | If the event is of broadcast type, system routes to the broadcast path instead |
| 4 | (Optional) Narrows by event attribute | Marketer adds conditions on event properties — e.g. "cart value is greater than 500" | If no attributes are available for the event, this step shows nothing — needs a clear message |
| 5 | (Optional) Adds an exit condition | Marketer specifies: if the user does X before finishing the flow, remove them immediately | — |
| 6 | Advances to the "Who" step | System checks that the trigger event is selected; blocks advancement if not | No validation = marketer advances with an empty trigger and notices only when the flow shows zero entries |
| 7 | Chooses who enters | Marketer picks: all users who fire the event, or a filtered subset | If "filter users by" is selected, reveals audience condition options |
| 8 | Adds audience conditions | Marketer adds property, behavior, or affinity conditions with AND/OR logic | — |
| 9 | Checks "Show count" | System estimates how many users currently match the full rule | Magic moment — when the number appears, the trigger becomes real. If it's 0 or unexpectedly low, the marketer knows to reconfigure before wasting the flow |
| 10 | Saves the trigger | System confirms, closes configuration, and places a trigger summary on the canvas | Marketer can now see at a glance what the trigger does, without re-opening it |

---

### Journey B: Setting up a broadcast trigger

**Situation:** Marketer needs to send a one-time communication to all identified users.

| Step | What the marketer does | What the system does |
|---|---|---|
| 1 | Opens trigger configuration | Same entry point as Journey A |
| 2 | Selects the broadcast event from the catalog | System detects broadcast type; routes directly to broadcast configuration, skipping the event condition steps |
| 3 | Chooses "Send now" or a specific date/time | System shows or hides the date/time picker accordingly |
| 4 | Selects audience kind (all users, identified only, known only) | System updates audience selection |
| 5 | Saves the trigger | System confirms; trigger summary shows on canvas |

---

### Journey C: Editing an existing trigger

**Situation:** A flow is already configured. The marketer wants to adjust the audience conditions — maybe the original threshold was too aggressive and the flow is reaching too few users.

| Step | What the marketer does | What the system does |
|---|---|---|
| 1 | Opens the trigger from the canvas | System re-opens trigger configuration, pre-populated with the current settings |
| 2 | Adjusts conditions | Changes persist locally; the live flow is not affected until the marketer saves |
| 3 | Rechecks audience count | Verifies the new audience size before committing |
| 4 | Saves | New configuration replaces the old; canvas summary updates |
| Abandon | Closes without saving | All edits are discarded; original configuration is preserved |

---

### Journey D: Abandoning setup on a new flow

**Situation:** The marketer opens trigger configuration but realizes they're not ready to configure it yet.

| Step | System behavior |
|---|---|
| Marketer closes the configuration at the event selection step | System detects that no trigger was configured; navigates back to the previous screen without saving a partial state |
| Marketer closes mid-configuration (conditions entered) | Same — no partial trigger is saved on a new flow |

---

## 7. Functional Requirements

### 7.1 Event Selection

The marketer must be able to find and select the event that starts the flow.

**What the system must support:**

- **A browsable event catalog** organized by business domain categories (e.g., Ecommerce, Post-purchase, Communication). Marketers think in domains, not event names.
- **Search across event names and descriptions.** The marketer should be able to type "cart" and see all cart-related events regardless of category.
- **Each event in the catalog must clearly show:**
  - Its name (how the marketer will refer to it)
  - Its source system (which integration or channel fires it)
  - A description (what user action triggers it)
  - Which devices it applies to (web, mobile, or both)
- **Event selection is immediate** — clicking an event advances configuration. No confirmation step.
- If the selected event is of broadcast type, the system routes to broadcast configuration. All other events go to the event-triggered path.

---

### 7.2 Event Conditions (When Step)

After selecting an event, the marketer can narrow which occurrences of that event count.

**Trigger groups:**
- The marketer can define up to 5 trigger conditions. Each condition is an instance of "user performed event X, with these attributes."
- Multiple groups are combined with AND or OR logic — "cart abandoned with value > ₹500 OR cart abandoned with 5+ items."
- The marketer can add or remove groups at any time.

**Attribute conditions (within a group):**
- Available only when the selected event has properties attached to it. If an event has no properties, this section is hidden.
- The marketer selects a property, chooses an operator (equals, greater than, contains, etc.), and enters a value.
- Multiple attribute conditions within a group are combined with AND or OR logic.

**Advance evaluate:**
- For events that capture a state at a point in time (e.g., cart abandonment captures cart contents), the marketer can define conditions on that captured state. Available only for events that support it.

**Exit conditions:**
- The marketer can optionally define: if a user performs event Y before completing the flow, remove them immediately.
- Multiple exit conditions combine with OR logic — any one being met triggers removal.
- Exit evaluation happens before any flow action executes. A user who meets an exit condition at the moment of entry is not processed.

**Validation:**
- The marketer cannot advance to the "Who" step without at least one trigger event selected in each group.

---

### 7.3 Audience Conditions (Who Step)

After defining when, the marketer defines who from the triggered pool actually enters.

**Top-level choice:**
- **All users who match the trigger** — no further filtering. Every user who fires the event (and meets event conditions) enters.
- **Filter users by** — reveals audience condition configuration.

**Audience type:**
When filtering, the marketer must specify which users are eligible:
- All users (no identity restriction)
- Identified users only (users the platform has a resolved identity for)
- Known users only (users with a confirmed customer ID)

**Condition blocks:**
The marketer can combine multiple condition blocks. Each block is one of four types:

| Block type | What it filters on |
|---|---|
| User property | Attributes of the user's profile — e.g., city, plan tier, registration date |
| User behavior | What the user has done historically — e.g., placed at least 3 orders in the last 30 days |
| User affinity | What the user tends toward — e.g., predominantly browses Electronics category |
| Saved segment | Membership in a pre-built named segment |

- Multiple blocks combine with AND or OR logic at the top level.
- Within each block, multiple conditions combine with their own AND or OR logic.
- Switching a block's type resets its conditions — the marketer is explicitly changing what dimension they're filtering on.

**Exclude users:**
- The marketer can define a separate set of conditions to exclude matching users. Users who match both include and exclude conditions are excluded. Exclude always takes precedence.

**Limit entry frequency:**
- The marketer can cap how many times a single user can enter this flow within a rolling time window. Example: at most once in any 7-day period.
- When a user is blocked by the frequency cap, the entry is suppressed silently on the user's side, but logged in analytics so the marketer can distinguish "no event fired" from "event fired but capped."

**Audience count:**
- A "Show count" action estimates how many users currently match the full trigger + audience rule.
- Count is not live-updated — the marketer triggers it manually and re-triggers after changes.
- Count returns an approximation, not an exact number, to support large user bases without timeout.
- If the API is unreachable, an error is shown with a retry option. This is a non-blocking failure — the marketer can still save without checking count.

---

### 7.4 Broadcast Configuration

When the broadcast path is selected:

- **Schedule:** Send immediately, or at a specific future date and time. Past dates are blocked on save.
- **Audience:** All users, identified only, known only, or a saved segment.
- No event condition step — broadcast does not filter by user action.

---

### 7.5 Trigger Summary on Canvas

After saving, the flow canvas must show a human-readable summary of the configured trigger — the event name, key conditions, and audience type. The marketer should be able to understand the trigger at a glance without re-opening configuration.

---

## 8. States & System Behaviors

| State | What triggers it | What the marketer sees | What they can do | How it ends |
|---|---|---|---|---|
| Event catalog — browsing | Trigger configuration opens | Full catalog, "All" category selected | Browse categories, search | Select an event |
| Event catalog — search, no results | Marketer types a term with no matches | Empty state in results area | Clear the search term | Clear search or type something new |
| When step — no conditions | Default after event selection | Trigger group with selected event, no attribute rows | Add conditions, change event, add another trigger group | Add a condition or advance to Who step |
| When step — validation error | Marketer tries to advance with an incomplete group | Inline error on the group without an event | Fix the group | Select an event for the group |
| Who step — all users | `include_all` is on | Simplified view, no condition blocks visible | Switch to "Filter users by" | Toggle the radio |
| Who step — count loading | Marketer clicks "Show count" | Spinner on the count area | Wait | API responds |
| Who step — count loaded | API returns | "≈ N users will enter" shown | Modify conditions, re-trigger count | Marketer changes conditions (count becomes stale) |
| Who step — count error | API fails | Error message with retry | Retry | Marketer retries or proceeds without count |
| Broadcast — scheduled | Marketer picks "specific date and time" | Date/time picker visible | Select future date/time | Switch to "Send now" or save |
| Edit mode | Marketer re-opens a saved trigger | Configuration pre-filled with saved values | Modify any step | Save (applies new config) or abandon (preserves old) |
| Abandoned — new flow | Marketer closes without saving on a new flow | Configuration closes | — | System navigates back; no partial state saved |
| Abandoned — edit | Marketer closes without saving on an existing flow | Configuration closes | — | Original configuration preserved unchanged |

---

## 9. Edge Cases

**Marketer adds a trigger group but closes the event picker without selecting**  
*Wrong behavior:* An empty group slot persists in the configuration.  
*Correct behavior:* If the picker is closed without a selection, no new group is added. The group list is unchanged.

**Selected event has no attributes**  
*Wrong behavior:* The "Add condition" area appears but shows an empty dropdown.  
*Correct behavior:* If the event has no properties, the attribute condition section is not shown. The marketer is not offered a capability that doesn't exist for this event.

**Marketer switches an audience block type mid-configuration**  
*Wrong behavior:* Conditions from the previous block type persist under the new type, producing invalid rules.  
*Correct behavior:* Switching block type resets all conditions within that block to empty.

**Include and exclude conditions both match the same user**  
*Wrong behavior:* User enters the flow because they matched the include conditions.  
*Correct behavior:* Exclude takes precedence. Any user matching an exclude condition does not enter the flow, regardless of include matches.

**User fires the trigger event again while already active in the flow**  
*Wrong behavior:* A duplicate flow instance is created silently, or the second entry is dropped with no visibility.  
*Correct behavior:* Behavior is explicitly defined per the re-entry setting. Options: always block re-entry, allow re-entry only when not currently active, always allow re-entry. If no re-entry setting is configured, default to blocking. See Open Questions.

**Frequency cap blocks an entry**  
*Wrong behavior:* Blocked entry looks identical to "no event fired" in analytics.  
*Correct behavior:* Suppressed entries are logged with a "frequency cap" reason so the marketer can distinguish cap-suppressed from no-event in flow analytics.

**Exit condition fires before the user reaches the first flow action**  
*Wrong behavior:* The user enters the flow and a message sends before the exit condition is evaluated.  
*Correct behavior:* Exit condition is checked at entry. If met, the user is not processed through any flow step.

**A previously saved trigger references an event that no longer exists in the catalog**  
*Wrong behavior:* The trigger silently stops working because the event reference is broken.  
*Correct behavior:* When the marketer re-opens the trigger, the missing event is shown with a warning — "This event is no longer available. Please select a replacement." The flow cannot be activated until the trigger is updated.

**Broadcast schedule time is in the past**  
*Wrong behavior:* Marketer saves with a past date and the broadcast is queued with an invalid schedule.  
*Correct behavior:* Save is blocked with an inline error: "The scheduled time is in the past. Choose a future date and time."

**Audience count request is in-flight when the marketer closes configuration**  
*Wrong behavior:* The count response tries to update the UI after it has closed, causing an invisible error.  
*Correct behavior:* Any in-flight count request is cancelled when configuration closes.

---

## 10. Non-Functional Requirements

### Performance

- The event catalog must be browsable and searchable without a loading state — all filtering happens immediately on the client without a server round trip.
- Audience count must return within 3 seconds. If the request exceeds 3 seconds, show a timeout state with a retry option.
- Trigger configuration must open to an interactive state in under 300 milliseconds.

### Scale

- Audience count must support user bases of 10 million+ and return an approximation rather than an exact count, to avoid server-side query timeouts.
- The event catalog must remain performant as the number of tracked events grows. If the catalog exceeds a point where client-side filtering degrades, catalog delivery should move to a server-side search endpoint.

### Reliability

- Audience count is the only operation that requires a network connection. All other configuration steps must work offline or with no API dependency.
- If the trigger save fails, the configuration dialog must not close. The marketer's work is retained and an error is shown with a retry option. Silent data loss is not acceptable.

### Security

- Audience condition values entered by marketers (free text inputs) must be sanitized before being sent to any backend query. These are user inputs, not trusted data.
- Segment names created via "Save as segment" must be sanitized before persistence, since segment names may be rendered in other parts of the product.

---

## 11. Analytics & Instrumentation

### Events to track

| Event | When it fires | Key properties |
|---|---|---|
| `trigger_setup_opened` | Marketer opens trigger configuration | `flow_id`, `is_edit` (was an existing trigger being edited?), `existing_kind` (event / broadcast / none) |
| `trigger_event_selected` | Marketer selects an event from the catalog | `flow_id`, `event_name`, `event_category`, `event_source` |
| `trigger_when_advanced` | Marketer advances from the "When" step to the "Who" step | `flow_id`, `group_count`, `has_attribute_conditions`, `has_exit_trigger` |
| `trigger_audience_count_requested` | Marketer clicks "Show count" | `flow_id`, `condition_block_count`, `has_exclude` |
| `trigger_audience_count_returned` | Count API responds | `flow_id`, `approximate_count`, `response_time_ms` |
| `trigger_saved` | Marketer completes configuration | `flow_id`, `kind` (event / broadcast), `group_count`, `include_all`, `condition_block_types`, `has_frequency_limit`, `has_exit_trigger`, `has_exclude` |
| `trigger_setup_abandoned` | Configuration closed without saving | `flow_id`, `step_at_close` (event_picker / when / who / broadcast), `is_edit` |

### Product metrics derived from these events

| Metric | Signal |
|---|---|
| Configuration completion rate | `trigger_saved` / `trigger_setup_opened` |
| Step-level abandonment | `trigger_setup_abandoned.step_at_close` distribution |
| Audience filter adoption | % of `trigger_saved` where `include_all = false` |
| Count check engagement | % of filtered triggers where `trigger_audience_count_requested` fired before `trigger_saved` |
| Event category distribution | `trigger_event_selected.event_category` breakdown — shows which event types marketers care most about |

---

## 12. Copy

### Configuration entry
> Configure trigger

### Step indicator (event path, two steps)
> 1. When will users enter the flow → 2. Who will enter the flow

### Step 1 header
> Whenever a user performs [event name]

### No event selected — validation error
> Select a trigger event to continue.

### Attribute section header
> With attribute

### Add another trigger condition
> + Add another trigger event

### Exit trigger — collapsed label
> + Add Exit Trigger

### Exit trigger — expanded header
> Exit Trigger

### Exit trigger — row label
> Exit when user

### Step 2 — top-level choice labels
> All users who match the start trigger  
> Filter users by

### Audience type section
> Audience Type

### Exclude section
> Exclude Users

### Frequency limit label
> Limit entry frequency

### Frequency limit inline copy
> At most [count] time(s) within any rolling [window] [unit] period

### Show count — loading
> Calculating…

### Show count — result
> ≈ [N] users will enter

### Show count — error
> Couldn't estimate audience size. Try again.

### Broadcast — send now
> Send now

### Broadcast — schedule
> Schedule for a specific date and time

### Broadcast — past date error
> The scheduled time is in the past. Choose a future date and time.

### Save confirmation
> Trigger configured

### Event no longer in catalog — warning (edit mode)
> "[event_name]" is no longer available. Select a replacement event before activating.

### No attributes available for event
> No attributes are available for this event.

---

## 13. Dependencies

| Dependency | What the feature needs | If unavailable | Can it launch without it? |
|---|---|---|---|
| Event catalog | The list of trackable events, their properties, and metadata flags | No events can be selected; feature cannot function | No — hard blocker |
| Audience count API | An endpoint that estimates how many users match the current trigger + audience rule | "Show count" shows an error; marketer cannot validate audience size before saving | Yes — count is informational, not required to save |
| Segments service | List of saved segments for the "Saved segment" condition block type | The segment block type shows an empty list; "Save as segment" is unavailable | Partial — segment block is disabled but other condition types function |
| Flow backend persistence | An API to save the trigger configuration as part of the flow | Configuration is lost on refresh | No — hard blocker |
| Re-entry behavior backend contract | Backend support for per-flow re-entry rules | Re-entry defaulting to "block" is acceptable for v1, but cannot support configurable re-entry without this | Partial — v1 can ship with a default block; configurable re-entry requires this |

---

## 14. Out of Scope

| Item | Why excluded | What would unlock it |
|---|---|---|
| Configurable re-entry behavior (always allow, allow if inactive) | Requires product decision on the three modes and backend support for per-flow re-entry queuing | Product decision + backend queuing model; see Open Questions |
| Control groups (global and flow-level holdouts) | No defined semantics, no holdout percentage, no reporting surface designed | Requires experimentation framework design |
| Real-time audience count (auto-updates as conditions change) | Every condition change would trigger an API call; creates a noisy, expensive experience without debounce + caching infrastructure | Caching layer with debounce on the count endpoint |
| Test-fire trigger | Simulate a trigger event to verify the flow responds correctly before go-live | Event simulation infrastructure |
| Exit trigger with AND logic (user must meet multiple exit conditions simultaneously) | Current design uses OR — any single exit condition triggers removal | UI redesign + backend support for nested exit trigger conditions |
| Frequency cap reporting (why a specific user was blocked from entering) | Requires an entry-attempt log separate from the entry log | Backend entry-attempt event schema |
| Saving audience conditions as a reusable named segment | Requires a full segments API (create, list, delete) | Segments service — out of scope for this PRD but a natural next step |

---

## 15. Open Questions

| # | Question | Why it matters | Owner |
|---|---|---|---|
| Q1 | What is the default re-entry behavior when a user fires the trigger event again while already active in the flow? | Without a defined default, the system either creates duplicate journeys or silently suppresses entries. Either outcome damages marketer trust. | Product |
| Q2 | Can the TriggerNode be deleted from the canvas? If so, what happens to the flow? | If deletion is allowed, the flow enters an unactivatable state. Either disallow TriggerNode deletion, or re-open trigger configuration when deletion is attempted. | Engineering + Product |
| Q3 | Is the audience count API synchronous (returns a number) or asynchronous (the marketer polls for a result)? What is the acceptable response time? | The loading UX design depends on this. Synchronous → spinner. Async polling → progress state. | Engineering |
| Q4 | Should "Show count" be available before the marketer adds any audience conditions, or only once filtering is active? | If shown before filtering, it will always return the full universe of users who recently fired the event — which may be useful but also confusing if no filter is applied. | Product |
| Q5 | When a marketer activates a live flow and then edits the trigger, do in-progress users continue under the old trigger or are they re-evaluated against the new one? | This affects the mental model the marketer has about what a trigger edit does mid-flight. | Engineering + Product |

---

## 16. Decision Log

| Decision | What else was considered | Why this was chosen | Tradeoff accepted |
|---|---|---|---|
| Two-step configuration (When → Who) instead of a single form | Single scrollable form with all trigger options visible at once | Event selection determines which audience options are relevant (some events skip the "Who" step entirely). Separating the steps reduces the apparent complexity and prevents marketers from feeling overwhelmed by all options at once. | Marketers editing only the audience step must click through the "When" step even if unchanged. |
| Broadcast as a separate path, not a trigger type inside the event-triggered flow | A "Send Now" toggle inside the same event configuration | Broadcast has fundamentally different configuration logic — it's schedule-based, not condition-based. Merging the paths adds conditional complexity to both. Separate paths keep each clean. | The catalog entry point must correctly identify broadcast vs. event cards and route accordingly. A misclassified event card would send a marketer down the wrong path. |
| Audience count as a manual "Show count" action rather than live-updating | Auto-update count on every condition change | Auto-updating would fire an API call on every keystroke or condition toggle. Without debounce and caching, this creates noisy server load and a distracting count that flickers constantly. Manual fetch puts the marketer in control of when they need the number. | Marketers must remember to re-check count after modifying conditions. A stale count after editing is not flagged automatically. |
| Maximum of 5 trigger groups | No limit; lower limit of 3 | Above 5 OR'd trigger conditions, the audience definition becomes ambiguous to reason about and hard to debug when a flow underperforms. 5 is defensible as a practical upper bound for meaningful event combinations. | Marketers with more than 5 distinct trigger events cannot express them in a single flow trigger. They must create multiple flows. |
| Exclude always takes precedence over include | Include takes precedence; OR logic between include and exclude | Marketers configure exclusions specifically to prevent certain users from entering — suppressing VIPs, users in other flows, or recently contacted users. Allowing an include match to override an explicit exclusion would violate that intent. | Marketers cannot create a rule that "includes VIPs despite other exclusions" — include + exclude always resolves to excluded. |
