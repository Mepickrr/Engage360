# PRD: Delay Node

**Status:** Draft  
**Author:** Meenal Kamalakar  
**Date:** June 2026

---

## Table of Contents

1. [What the Prototype Shows](#0-what-the-prototype-shows)
2. [Feature Brief](#1-feature-brief)
3. [The Job](#2-the-job)
4. [Success Metrics](#3-success-metrics)
5. [Who Uses This and When](#4-who-uses-this-and-when)
6. [User Flows](#5-user-flows)
7. [Functional Specification](#6-functional-specification)
8. [States](#7-states)
9. [Edge Cases](#8-edge-cases)
10. [Non-Functional Requirements](#9-non-functional-requirements)
11. [Analytics & Instrumentation](#10-analytics--instrumentation)
12. [Copy](#11-copy)
13. [Dependencies](#12-dependencies)
14. [Out of Scope](#13-out-of-scope)
15. [Open Questions](#14-open-questions)
16. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

### What's built

- **Three-tab configuration drawer** (`DelayConfig.jsx`) with tabs: Duration, Schedule, Event (Phase 2). Tab strip with icon + label per tab. Phase 2 badge on Event tab.
- **Duration tab**: numeric input + unit select (Minutes / Hours / Days / Weeks). Warning banner at > 30 days. Minimum value enforced at 1.
- **Schedule tab**: two sub-tabs — "Day + Time" and "Exact Date".
  - *Day + Time*: Day dropdown (Anyday, Weekday, Weekend, Monday–Sunday, Start of Month, End of Month) + Time dropdown (06:00–23:30 in 30-minute increments).
  - *Exact Date*: date picker input + time dropdown. Past-date inline warning.
  - Timezone section: "Use customer's local timezone" checkbox; if unchecked, dropdown with 8 hardcoded timezone options.
  - Past-date fallback: two radio options ("Skip delay and continue" / "Skip and exit the branch").
- **Event tab (Phase 2)**: offset value (numeric, min 0) + offset unit (Minutes / Hours / Days) + direction (Before / After). Variable picker — grouped accordion with search, hardcoded `VARIABLE_GROUPS` array. Max wait cap: checkbox + value + unit (Hours / Days). Phase 2 info banner.
- **Canvas label preview** in the drawer footer — live-updates as config changes. Shows resolved label (e.g., "Wait 3 days", "Till Anyday 18:00", "5 hours after event").
- **`resolveDelayLabel()`** in `LogicNode.jsx` — renders a second-line summary beneath the node title on the canvas. Handles both the new three-tab shape and two legacy data shapes (`delayMode: "for"/"till"`, `duration_minutes`).
- **Legacy migration**: `ConfigTab.jsx` patches old `delayMode` shape to the new `delayTab` shape on read.
- **Default node data** (`flowMeta.js`): `{ label: "Wait 1 hour", duration_minutes: 60 }`. Seed flow uses `{ delayTab: "duration", forValue: 1, forUnit: "hours" }`.

### What's incomplete

- **Variable picker is mocked**: `VARIABLE_GROUPS` in `DelayConfig.jsx` is a hardcoded local array (8 groups, ~15 variables). No API call. Variables shown are examples, not the customer's actual data schema.
- **Time options gap**: `TIME_OPTIONS` covers only 06:00–23:30. Times 00:00–05:30 are unreachable via the dropdown — no early-morning scheduling is possible without a free-text input.
- **Max wait cap unit**: Event tab max wait cap offers only Hours and Days. Minutes and Weeks are absent despite being available in the offset unit select.
- **Label field vs. canvas preview**: The drawer shows "CANVAS LABEL PREVIEW" as a read-only section. A separate "LABEL" text input (visible in one wireframe, present in `ConfigTab.jsx`) lets the user rename the node. The relationship between the custom label and the auto-generated preview label is undefined — it is unclear which one the canvas node actually renders.
- **Phase 2 banner is passive**: Event tab renders and saves config despite the Phase 2 flag. The banner says "configure now — it will activate at launch" but there's no enforcement or backend gating.
- **`resolveDelayLabel()` called twice per render**: `LogicNode.jsx` calls `resolveDelayLabel(data)` twice on every render (line 103 and 107). Minor but unnecessary duplication.

### What's absent

- **"Next occurrence" semantics for Day+Time schedule**: No specification for what happens when the scheduled day/time has already passed today. If today is Monday 10:00 and the node is configured "Monday 08:00", does the user wait ~22 hours or ~0?
- **Zero-offset in Event tab**: The offset value field accepts 0 (min=0 in `NumInput`). A 0-offset means "fire at exactly the variable's timestamp" — valid use case, but not labeled or documented.
- **Max wait cap fallback**: The current copy says "user continues through the flow" — but this is not one of the `pastDateFallback` radio options and has no schema field. Ambiguous whether this is always `skip_continue` or a separate configurable fallback.
- **DST (Daylight Saving Time) handling**: No mention of what happens when a scheduled time falls in a DST gap or repeated hour.
- **Re-entry behavior**: No spec for what happens to a user currently parked at a Delay node when the flow is edited, paused, or deactivated.
- **Validation blocking save**: The Event tab has no guard preventing a user from clicking "Finish" or navigating away without selecting a variable — the canvas would then show "Event variable not set" indefinitely.
- **Minute-level granularity for schedule**: The time dropdown steps in 30-minute increments. Campaigns needing e.g. 09:15 cannot be expressed.

---

## 1. Feature Brief

The Delay node pauses a user's journey through a Flow for a configured time before proceeding to the next node. It is the most-used flow control primitive — every cart recovery, post-purchase sequence, and re-engagement campaign depends on it. Without a correctly specified delay, messages fire immediately or at the wrong moment, eroding trust and wasting sends. The Delay node gives marketers three complementary controls: wait a fixed duration from now, wait until a specific calendar point, or wait relative to a date stored on the customer record — each with the precision and guardrails needed to make time-based campaigns correct by construction.

---

## 2. The Job

**Irreducible job:** Let a marketer say "pause this user's journey until the right moment" — and have the system honor that instruction exactly, for every user, across timezones, regardless of when they entered the node.

Three things that, if missing, make it not worth shipping:

1. **Temporal correctness**: The node must fire at the moment the marketer configured, not approximately. A "Wait 1 hour" must not fire at 55 or 65 minutes. "Till Monday 18:00" in IST must not fire at 18:00 UTC.
2. **Predictable past-time behavior**: Mode 2 (exact date) and Mode 3 (event-relative "before") can resolve to a time in the past. Undefined behavior here causes silent drops or infinite parks. The marketer must be able to choose the fallback explicitly.
3. **Canvas readability**: A flow with 5 delay nodes must be readable without opening a single drawer. The canvas label must show the resolved config — not "Wait" or a generic placeholder.

---

## 3. Success Metrics

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| Delay node misconfiguration rate (nodes left in default state, never updated) | Unknown | < 10% of delay nodes in activated flows have default `{ duration_minutes: 60 }` data with no drawer interaction | Node data audit |
| Schedule tab usage rate | Unknown | ≥ 20% of delay nodes use Schedule or Event tab | `delay_configured` event, `tab` property |
| Past-date fallback usage rate | Unknown | ≥ 80% of Exact Date configs have an explicit `pastDateFallback` value | `delay_configured` event |
| Canvas label accuracy | Unknown | 100% of saved delay nodes render a non-default, non-empty label on canvas | Node label audit at flow save |
| Customer timezone adoption rate | Unknown | ≥ 30% of Schedule tab configs use `useCustomerTimezone: true` | `delay_configured` event |

---

## 4. Who Uses This and When

### Persona 1 — Campaign Marketer (primary)

**Goal:** Add a 1-hour delay after a cart abandonment trigger, then send a WhatsApp message.  
**Emotional state:** Focused on the sequence, not the timing details — wants the common case to take < 15 seconds.  
**Success:** Drags in a Delay node, sees Duration tab pre-selected, enters 1 and selects Hours, sees "Wait 1 hour" on the canvas, moves on.  
**Failure:** Opens drawer, sees three tabs and a Phase 2 badge, spends time figuring out which tab to use. Or sets 1 Hour but the canvas still shows "Wait 1 hour" (the default, coincidentally matching) and they can't tell if their edit was saved.

### Persona 2 — CRM / Lifecycle Analyst (secondary)

**Goal:** Send a replenishment reminder exactly 30 days after `customer.last_order_date`.  
**Emotional state:** Detail-oriented, building a precise journey. Needs to express "30 days after an attribute" correctly.  
**Success:** Event tab loads with the variable picker, they find `customer.last_order_date`, set 30 days after, set a 45-day max cap in case the variable is null, click save.  
**Failure:** Variable picker shows a hardcoded list and their actual attribute (`customer.last_replenishment_date`) isn't there. Or they configure the tab but it's marked Phase 2 and they can't tell if it will actually run.

### Persona 3 — Growth PM (secondary)

**Goal:** Schedule a flash sale message to fire at 18:00 IST every Monday, regardless of when the user enters the flow.  
**Emotional state:** Rushing before a campaign launch. Needs confidence that "Monday 18:00 IST" means exactly that for Indian customers.  
**Success:** Schedule tab → Day+Time → Monday + 18:00 → IST selected (or customer timezone if all users are in India) → canvas shows "Till Monday 18:00" → they're done.  
**Failure:** They configure Monday 18:00 but timezone defaults to UTC, so Indian users get the message at 23:30 IST. No warning or confirmation of effective local time shown.

---

## 5. User Flows

### Flow A: Duration delay (happy path)

| Step | User action | System behavior |
|---|---|---|
| 1 | Drags Delay node from palette onto canvas | Node created with `{ label: "Wait 1 hour", delayTab: "duration", forValue: 1, forUnit: "hours" }` |
| 2 | Clicks node to open config drawer | `ConfigTab` renders `DelayConfig`; Duration tab active; pre-populated with defaults |
| 3 | Changes value to 3, unit to Days | `patch({ forValue: 3, forUnit: "days" })` called; canvas preview updates to "Wait 3 days" |
| 4 | (Optional) Changes label | Label input updated; canvas node title updates |
| 5 | Navigates away or closes drawer | Config persisted to node data; canvas node shows "Wait 3 days" subtitle |

### Flow B: Scheduled delay — Day+Time

| Step | User action | System behavior |
|---|---|---|
| 1 | Clicks Delay node → Schedule tab | Sub-tab defaults to "Day + Time"; `tillDay = "anyday"`, `tillTime = "18:00"`, `tillTimezone = "Asia/Kolkata"` |
| 2 | Changes Day to "Monday", Time to "18:00" | `patch({ tillDay: "monday", tillTime: "18:00" })` |
| 3 | Reviews timezone section | Sees "Asia/Kolkata" selected; optionally checks "Use customer's local timezone" |
| 4 | Navigates away | Canvas subtitle: "Till Monday 18:00" |

### Flow C: Scheduled delay — Exact Date (past-date path)

| Step | User action | System behavior |
|---|---|---|
| 1 | Schedule tab → "Exact Date" sub-tab | date and time inputs appear |
| 2 | Enters a past date | Inline warning: "This date is in the past. Choose a fallback below." |
| 3 | Selects fallback | Radio selection: "Skip delay and continue" or "Skip and exit the branch" |
| 4 | Saves | Config persisted with `pastDateFallback` set |

### Flow D: Event-relative delay (Phase 2)

| Step | User action | System behavior |
|---|---|---|
| 1 | Event tab | Phase 2 info banner shown; config fields still interactive |
| 2 | Sets 30 Days After | `patch({ variableOffsetValue: 30, variableOffsetUnit: "days", variableOffsetDir: "after" })` |
| 3 | Clicks "+ Select date/time variable" | `VariablePicker` renders inline below button |
| 4 | Searches "last_order" | Filtered variable list |
| 5 | Selects `customer.last_order_date` | Variable picker closes; chip shows `{{customer.last_order_date}}`; preview: "30 days after event" |
| 6 | Enables max wait cap → 45 Days | `patch({ maxWaitEnabled: true, maxWaitValue: 45, maxWaitUnit: "days" })` |
| 7 | Saves | Config persisted |

### Intermediate state lifecycle (node data)

Delay node config lives in `node.data`. It is:
- **Created** when node is dropped onto canvas, with defaults from `flowMeta.js`.
- **Modified** on every `patch()` call from the config drawer.
- **Persisted** with the flow graph via the 1500ms debounce auto-save in `FlowBuilderV2`.
- **Migrated** transparently on load when legacy fields (`delayMode`, `duration_minutes`) are detected.

---

## 6. Functional Specification

### 6.1 Node Registration

| Field | Value |
|---|---|
| Node type | `"wait"` |
| Renderer | `LogicNode` |
| Config panel | `DelayConfig` |
| Palette entry | "Delay Node" in Flow Control category |
| Default data | `{ label: "Wait 1 hour", delayTab: "duration", forValue: 1, forUnit: "hours" }` |
| Canvas icon | Clock (amber `#F59E0B`) |

### 6.2 Data Shape

```json
{
  "delayTab": "duration | schedule | event",
  "forValue": 1,
  "forUnit": "minutes | hours | days | weeks",
  "scheduleSubTab": "daytime | exact",
  "tillDay": "anyday | weekday | weekend | monday | tuesday | wednesday | thursday | friday | saturday | sunday | start_of_month | end_of_month",
  "tillTime": "HH:MM",
  "exactDate": "YYYY-MM-DD",
  "exactTime": "HH:MM",
  "tillTimezone": "IANA timezone string",
  "useCustomerTimezone": false,
  "pastDateFallback": "skip_continue | skip_exit",
  "variableOffsetValue": 5,
  "variableOffsetUnit": "minutes | hours | days",
  "variableOffsetDir": "before | after",
  "variableEvent": "string | null",
  "maxWaitEnabled": false,
  "maxWaitValue": 48,
  "maxWaitUnit": "hours | days"
}
```

**Legacy fields (read-only, migrated on load):**

| Legacy field | Maps to |
|---|---|
| `duration_minutes` | `forValue` + `forUnit` (convert to nearest unit) |
| `delayMode: "for"` | `delayTab: "duration"` |
| `delayMode: "till"` | `delayTab: "schedule"` |

### 6.3 Duration Tab

| Element | Type | Constraint | Default |
|---|---|---|---|
| `forValue` | Integer input | Min 1; no upper bound in UI (see Edge Cases) | `1` |
| `forUnit` | Select | Minutes / Hours / Days / Weeks | `"hours"` |

**Warning threshold**: If computed duration > 43,200 minutes (30 days), render an amber warning: "This delay is over 30 days. Make sure this is intentional."

**Semantics**: The delay starts counting from the moment the user enters the node. "Wait 1 hour" fires exactly 1 hour after node entry, regardless of time of day or timezone.

### 6.4 Schedule Tab

#### Day + Time sub-tab

| Element | Type | Options | Default |
|---|---|---|---|
| `tillDay` | Select | Anyday, Weekday, Weekend, Monday–Sunday, Start of Month, End of Month | `"anyday"` |
| `tillTime` | Select | 06:00–23:30 in 30-minute increments | `"18:00"` |

**"Next occurrence" semantics (required — currently unspecified):**

| `tillDay` | Resolved behavior |
|---|---|
| `"anyday"` | Wait until the next occurrence of `tillTime`, regardless of day. If `tillTime` has already passed today, wait until `tillTime` tomorrow. |
| Specific weekday (e.g., `"monday"`) | Wait until the next Monday at `tillTime`. If today is Monday and `tillTime` has not passed yet, fire today. If today is Monday and `tillTime` has passed, fire next Monday. |
| `"weekday"` | Wait until the next Monday–Friday at `tillTime`. |
| `"weekend"` | Wait until the next Saturday or Sunday at `tillTime`. |
| `"start_of_month"` | Wait until the 1st of the next month at `tillTime`. If today is the 1st and `tillTime` has not passed, fire today. |
| `"end_of_month"` | Wait until the last day of the current month at `tillTime`. If today is the last day and `tillTime` has passed, fire on the last day of the next month. |

**Time options gap**: The current dropdown covers 06:00–23:30 only. Times 00:00–05:30 are unreachable. Required fix: extend `TIME_OPTIONS` to cover the full 24-hour range (00:00–23:30) or replace with a free-text time input with HH:MM validation.

#### Exact Date sub-tab

| Element | Type | Constraint | Default |
|---|---|---|---|
| `exactDate` | Date input | Required if sub-tab is "exact" | `""` |
| `exactTime` | Select | 06:00–23:30 (same gap issue as above) | `"18:00"` |

**Past-date detection**: If `exactDate` + `exactTime` resolves to a datetime before `now()` in the selected timezone, show inline warning (already implemented).

#### Timezone (applies to both sub-tabs)

| Element | Type | Options | Default |
|---|---|---|---|
| `useCustomerTimezone` | Checkbox | — | `false` |
| `tillTimezone` | Select | Full IANA timezone list (see Dependencies) | `"Asia/Kolkata"` |

When `useCustomerTimezone` is true, the timezone dropdown is hidden. The system uses the timezone stored in the customer's profile. If the customer has no timezone on file, fall back to the flow's default timezone (see Open Questions).

**Current implementation gap**: Only 8 hardcoded timezones. Replace with a searchable full IANA list.

#### Past-date fallback (applies to both sub-tabs)

| Value | Behavior |
|---|---|
| `"skip_continue"` | Delay is skipped; user immediately proceeds to the next node |
| `"skip_exit"` | Delay is skipped; user is removed from this branch of the flow |

Default: `"skip_continue"`.  
**Exposure**: Always shown on Schedule tab — not only when a past date is detected. The past-date condition is detected live but fallback configuration is independent of whether the current date is in the past (future flows need the fallback pre-configured).

### 6.5 Event Tab (Phase 2)

#### Offset configuration

| Element | Type | Constraint | Default |
|---|---|---|---|
| `variableOffsetValue` | Integer input | Min 0 | `5` |
| `variableOffsetUnit` | Select | Minutes / Hours / Days | `"hours"` |
| `variableOffsetDir` | Select | Before / After | `"after"` |

**Zero-offset behavior**: When `variableOffsetValue = 0`, the node fires at exactly the timestamp stored in the variable. Label: "At event time." This is a valid configuration; the UI should handle it gracefully (no "0 hours after event" in the canvas label — render "At {{variable.name}}" instead).

**"Before" direction**: If the computed time is in the past (e.g., "5 minutes before cart.created_at" and the cart was created 10 minutes ago), the same `pastDateFallback` logic applies. The Event tab must expose the past-date fallback select.

#### Variable picker

| Element | Behavior |
|---|---|
| Search | Filters variable names across all groups; case-insensitive |
| Groups | Accordion, collapsed by default; auto-expand group containing search match |
| Selection | Single variable; renders as `{{variable.name}}` chip with trash button |
| Data source | **Currently mocked — must connect to real variable API** |

**Variable types**: Only datetime-typed variables are valid for this picker. The picker must filter to `data_type === "datetime"` or equivalent. Showing non-datetime variables (strings, numbers) and letting the user select them is a misconfiguration vector.

**Required variable groups (from wireframes and mock data):**

- Customer variables (e.g., `customer.created_at`, `customer.birthday`, `customer.last_order_date`)
- Abandoned cart variables
- Add To Cart event variables
- Order variables (e.g., `order.created_at`, `order.estimated_delivery`)
- Local user response variables
- API data response variables
- Store variables
- Helpdesk variables

#### Maximum wait cap

| Element | Type | Constraint | Default |
|---|---|---|---|
| `maxWaitEnabled` | Checkbox | — | `false` |
| `maxWaitValue` | Integer input | Min 1 | `48` |
| `maxWaitUnit` | Select | Hours / Days | `"hours"` |

**Cap fallback behavior**: When the max wait cap expires before the variable resolves, the user continues through the flow (equivalent to `skip_continue`). This must be confirmed as the only behavior, or a second option ("exit branch") must be added for consistency with the Schedule tab's past-date fallback.

**Max wait cap must also cover the case where the variable is null or missing** — not just "hasn't resolved yet." A customer with no `customer.last_order_date` would otherwise park indefinitely. The cap is the only protection.

#### Phase 2 gating

The Event tab is visible and configurable now with a Phase 2 info banner. When Phase 2 launches:
1. Remove the info banner.
2. Remove the "PHASE 2" badge from the tab strip.
3. Ensure the backend activates the event-relative scheduling engine.

The PRD spec is written for the final Phase 2 state. Phase 2 gating is a launch concern, not a behavior concern.

### 6.6 Canvas Label (`resolveDelayLabel`)

The canvas node renders two text lines:
1. **Title** (`data.label`): User-editable; defaults to "Wait 1 hour".
2. **Subtitle** (`resolveDelayLabel(data)`): Auto-generated from config; non-editable on canvas.

| Config state | Subtitle rendered |
|---|---|
| Duration: `forValue=3, forUnit="days"` | `Wait 3 days` |
| Duration: `forValue=1, forUnit="hours"` | `Wait 1 hour` |
| Schedule/daytime: Monday + 18:00 | `Till Monday 18:00` |
| Schedule/daytime: Anyday + 08:00 | `Till Any day 08:00` |
| Schedule/exact: 2026-08-15 + 18:00 | `Till 2026-08-15 18:00` |
| Event: 30 days after `customer.last_order_date` | `30 days after event` |
| Event: 0 offset + variable set | `At event time` |
| Event: variable not set | `Event variable not set` |
| Duration > 30 days | Subtitle + amber triangle indicator on canvas node |

**Label field behavior**: The user-editable "LABEL" field in the drawer sets `data.label` (the title line). This is independent of the auto-generated subtitle. When the user changes the config (e.g., from 1 hour to 3 days), the auto-generated subtitle updates, but the title does not auto-update to match. This is intentional — the title is the user's custom name for the node in their flow. However, the default title "Wait 1 hour" can become stale if the user changes the config without updating the title. Consider: auto-update the title only if it still matches the previous auto-generated value ("Wait 1 hour" → auto-suggest "Wait 3 days") — see Open Questions.

### 6.7 Node Data Defaults on Drop

When a user drags the Delay node from the palette:

```json
{
  "label": "Wait 1 hour",
  "delayTab": "duration",
  "forValue": 1,
  "forUnit": "hours",
  "scheduleSubTab": "daytime",
  "tillDay": "anyday",
  "tillTime": "18:00",
  "tillTimezone": "Asia/Kolkata",
  "useCustomerTimezone": false,
  "pastDateFallback": "skip_continue",
  "variableOffsetValue": 5,
  "variableOffsetUnit": "hours",
  "variableOffsetDir": "after",
  "variableEvent": null,
  "maxWaitEnabled": false,
  "maxWaitValue": 48,
  "maxWaitUnit": "hours"
}
```

Rationale for defaults:
- Duration tab active: the fastest, most common configuration path.
- `forValue: 1, forUnit: "hours"`: the most common delay duration for cart recovery.
- `tillTimezone: "Asia/Kolkata"`: primary market. This should become a flow-level default setting (see Open Questions).
- `pastDateFallback: "skip_continue"`: least destructive fallback; the user will not silently lose users from their flow.

---

## 7. States

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|---|---|---|---|---|---|
| Default (just dropped) | Node dragged from palette | Duration tab, pre-populated with defaults | Open drawer, connect to nodes | Node data initialized | User opens drawer |
| Duration — > 30 days | `forValue × forUnit > 43,200 min` | Amber warning banner in drawer | Reduce value, change unit, dismiss (no dismiss action — warning persists) | No blocking; user can save | User reduces value below threshold |
| Schedule / daytime — no time options before 06:00 | User needs 03:00 | No option visible in time dropdown | Cannot express the time | Silent gap | User notices absence; workaround unknown |
| Schedule / exact — past date | `exactDate + exactTime < now()` | Inline amber warning in drawer | Select fallback radio | No blocking | User changes date or selects fallback |
| Event — variable not set | Event tab active, no variable selected | Dashed "+ Select date/time variable" button | Open variable picker | `variableEvent: null` persisted; canvas shows "Event variable not set" | User selects variable |
| Event — variable picker open | User clicks "+ Select date/time variable" | Inline picker with search and accordion groups | Search, expand groups, select variable | — | Variable selected or user clicks elsewhere |
| Event — variable set | User selects a variable | `{{variable.name}}` chip with trash icon | Remove variable (trash), configure offset | Config updates | User removes variable |
| Event — max cap expired (runtime) | `maxWaitEnabled: true`, cap duration elapsed before variable resolves | *(runtime, not drawer state)* | — | User proceeds through flow (skip_continue) | User clears the node |
| Legacy data shape | Node loaded from saved flow with `duration_minutes` | Duration tab with migrated values | Edit config | Migration runs transparently | User edits and saves |
| Event tab — Phase 2 banner | Event tab active | Blue info banner at top of tab | Read info, configure fields anyway | Fields are live and saved | Phase 2 launch removes banner |

---

## 8. Edge Cases

**Duration — very large value (no UI cap)**  
*Situation:* User enters 1000 in the value field with unit "Weeks" — ~19 years.  
*Wrong behavior:* Node saves; user is permanently parked.  
*Correct behavior:* Add a UI warning at durations > 90 days (in addition to the existing 30-day warning). At durations > 365 days, block save with a hard validation error: "Maximum delay is 365 days."

**Schedule / daytime — "next occurrence" when scheduled time already passed today**  
*Situation:* Today is Monday 20:00. Node is configured "Monday 18:00." The next Monday 18:00 is 6 days away.  
*Wrong behavior:* System fires immediately (treats "Monday" as "any Monday including a past one today") or parks for 7 days.  
*Correct behavior:* Apply "next occurrence" logic as specified in Section 6.4. If today is the configured day but the time has passed, advance to the next occurrence of that day.

**Schedule / daytime — "Anyday" with a time that's 1 minute away**  
*Situation:* User enters flow at 17:59, node is "Anyday 18:00."  
*Correct behavior:* User waits ~1 minute. This is correct and must not be treated as a "past time" edge case.

**Schedule — DST gap (clock spring forward)**  
*Situation:* Flow configured for 02:30 AM EST. That time doesn't exist on the spring forward day (clocks jump from 02:00 to 03:00).  
*Wrong behavior:* Undefined — backend may fire at 01:59 or 03:00 depending on implementation.  
*Correct behavior:* When the target time falls in a DST gap, advance to the next valid time (03:00 in this example). Document this in the timezone help text.

**Schedule — DST overlap (clock fall back)**  
*Situation:* Flow configured for 01:30 AM EST. That time occurs twice on fall-back day.  
*Wrong behavior:* Node fires twice (once for each occurrence of 01:30).  
*Correct behavior:* Fire once, on the first occurrence of the time.

**Event tab — variable resolves to a time in the past with "before" direction**  
*Situation:* `variableOffsetDir = "before"`, `variableOffsetValue = 30`, `variableOffsetUnit = "days"`, `variableEvent = "customer.last_order_date"`. Last order was 45 days ago. Computed time = 45 - 30 = 15 days in the past.  
*Wrong behavior:* User parks indefinitely (variable resolved successfully but to a past time).  
*Correct behavior:* Apply past-date fallback. The Event tab must include the same `pastDateFallback` select as the Schedule tab.

**Event tab — variable is null (customer has no value for the field)**  
*Situation:* `variableEvent = "customer.birthday"`. Customer's birthday is not in their profile.  
*Wrong behavior:* User parks indefinitely. Max wait cap is the only protection — but only if enabled.  
*Correct behavior:* When max wait cap is not enabled, show a warning in the drawer: "If this variable has no value for a customer, they will wait indefinitely. Consider enabling the max wait cap."

**Customer timezone missing (useCustomerTimezone: true)**  
*Situation:* Flow configured to use customer's local timezone. 12% of customers have no timezone on file.  
*Wrong behavior:* Node throws an error or fires at UTC.  
*Correct behavior:* Fall back to the flow's default timezone. If no flow-level timezone is set, fall back to UTC. Surface this in the drawer: "If a customer's timezone is unknown, the flow timezone (or UTC) will be used."

**Legacy node with `duration_minutes: 0`**  
*Situation:* Old flow saved with `duration_minutes: 0` (possibly a system-generated placeholder).  
*Wrong behavior:* Node fires immediately; user proceeds with no delay.  
*Correct behavior:* Migration treats `duration_minutes <= 0` as the minimum 1 minute. Log a migration warning.

**Two Delay nodes connected in sequence**  
*Situation:* Flow has Delay(1 hour) → Delay(Monday 18:00). The first delay parks the user for 1 hour; the second parks until Monday 18:00.  
*Correct behavior:* Each node is evaluated independently from the moment the user arrives at it. This is expected behavior, but the canvas should make chained delays readable — both subtitles must render clearly.

**Event tab — "0 offset, before direction"**  
*Situation:* `variableOffsetValue = 0`, `variableOffsetDir = "before"`. Semantically: "fire 0 minutes before the event" = "fire at the event time."  
*Wrong behavior:* Renders as "0 minutes before event" — confusing.  
*Correct behavior:* When offset = 0, direction is irrelevant. Normalize to "At event time" in both the canvas label and the drawer preview.

---

## 9. Non-Functional Requirements

### Performance

- Config drawer must open and render within 200ms (all data is local — no API call on drawer open).
- Variable picker search must filter results within 50ms. When backed by a real API, results must load within 1.5 seconds; show a loading spinner if > 300ms.
- Canvas label re-render (`resolveDelayLabel`) must not block React reconciliation — the current dual-call issue should be resolved by computing once per render cycle.

### Scale

- Flows can have 50+ Delay nodes. Each renders `resolveDelayLabel` on every canvas re-render. The function is pure and cheap, but avoid redundant calls.
- The variable picker must support 100+ variables without pagination degradation. Implement virtual scrolling if the list exceeds 50 items per group.

### Precision (backend contract)

- Duration delays: must fire within ±30 seconds of the configured duration for durations ≤ 24 hours; within ±5 minutes for durations > 24 hours.
- Schedule delays: must fire within ±1 minute of the configured time.
- Event-relative delays: must fire within ±1 minute of the computed timestamp.

### Reliability

- If the scheduling backend is temporarily unavailable when a Delay node should fire, the delay must be queued and fire when service recovers — not silently dropped.
- A user parked at a Delay node when the flow is paused or deactivated must not lose their position. On flow reactivation, they resume from where they paused.

### Security

- `variableEvent` values come from a dropdown — no free-text injection risk in the picker.
- Variable values (`{{customer.birthday}}` etc.) are treated as datetime data on the backend. Invalid types must be rejected with a clear error logged to the flow's error log.
- The `label` field is user-provided text rendered on the canvas — it must be sanitized before display.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|---|---|---|
| `delay_node_opened` | User clicks a Delay node to open drawer | `flow_id`, `node_id`, `current_tab`, `is_default` (config hasn't been changed from initial defaults) |
| `delay_tab_switched` | User clicks a different tab in the drawer | `flow_id`, `node_id`, `from_tab`, `to_tab` |
| `delay_variable_picker_opened` | User clicks "+ Select date/time variable" | `flow_id`, `node_id` |
| `delay_variable_selected` | User selects a variable from picker | `flow_id`, `node_id`, `variable_name`, `variable_group` |
| `delay_configured` | User navigates away or closes drawer with a changed config | `flow_id`, `node_id`, `tab`, `duration_minutes` (computed), `schedule_subtype`, `uses_customer_tz`, `timezone`, `has_past_date_fallback`, `has_max_wait_cap`, `variable_set` (bool) |
| `delay_past_date_warning_shown` | Exact date detected as past | `flow_id`, `node_id` |

### Metrics

| Metric | Definition | Where it surfaces |
|---|---|---|
| Tab distribution | `delay_configured.tab` counts | Product dashboard |
| Variable picker adoption | `delay_variable_selected` / flows using Event tab | Product dashboard |
| Past-date fallback set rate | `delay_configured` with `has_past_date_fallback = true` / all Schedule tab saves | Product dashboard |
| Default node rate | `delay_configured` where `is_default = true` | Node audit — flag flows with unconfigured delays |

---

## 11. Copy

### Drawer header
> **Delay Node**  
> Pause flow execution

### Duration tab — field label
> WAIT FOR

### Duration tab — 30-day warning
> This delay is over 30 days. Make sure this is intentional.

### Duration tab — 365-day hard limit error
> Maximum delay is 365 days.

### Schedule tab — sub-tab labels
> Day + Time  
> Exact Date

### Schedule tab — day field label
> DAY

### Schedule tab — time field label
> TIME

### Schedule tab — exact date field label
> DATE

### Schedule tab — timezone section label
> TIMEZONE

### Schedule tab — customer timezone checkbox
> Use customer's local timezone

### Schedule tab — customer timezone fallback note
> If a customer's timezone is unknown, the flow timezone will be used.

### Schedule tab — past-date warning
> This date is in the past. Choose a fallback below.

### Schedule tab — past-date fallback section label
> PAST-DATE FALLBACK

### Schedule tab — fallback option labels
> Skip delay and continue  
> Skip delay and exit this branch

### Event tab — Phase 2 banner
> Event-relative delays are a Phase 2 feature. You can configure this now — it will activate at launch.

### Event tab — offset section label
> WAIT

### Event tab — variable section label
> DATE / TIME VARIABLE

### Event tab — variable picker button
> + Select date/time variable

### Event tab — no variable selected (canvas label)
> Event variable not set

### Event tab — zero offset label (canvas)
> At event time

### Event tab — variable null warning
> If this variable has no value for a customer, they will wait indefinitely. Enable the max wait cap to prevent this.

### Event tab — max cap section label
> MAXIMUM WAIT

### Event tab — max cap checkbox
> Set a maximum wait cap

### Event tab — max cap helper text
> If the variable hasn't resolved after this time, the user continues through the flow.

### Canvas label preview section label
> CANVAS LABEL PREVIEW

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Degrades gracefully? |
|---|---|---|---|
| Flow scheduling backend | Timer execution for all three delay modes | Delays don't fire; users park indefinitely | No — critical path |
| Variable API | Real customer and event datetime variables for the Event tab picker | Picker shows empty or stale mock data | Partial — Duration and Schedule tabs are unaffected |
| IANA timezone database | Full timezone list for Schedule tab | Limited to 8 hardcoded options | Partial — most IST users are unaffected; global use cases broken |
| Customer profile store | `customer.timezone` field for "Use customer's local timezone" | Falls back to flow-level timezone | Yes — with explicit fallback behavior |
| Flow-level timezone setting | Default timezone for the flow (see Open Questions) | Must explicitly configure per node | No — missing a sane default degrades UX |

---

## 13. Out of Scope

| Exclusion | Reason | Prerequisite to unlock |
|---|---|---|
| Smart send-time optimization ("send at the best time for this customer") | Requires ML model per customer; separate infrastructure | Send-time optimization model and API |
| Delay node analytics (how many users are currently parked here, median actual wait time) | Requires runtime state query per node | Flow execution analytics layer |
| Custom recurrence (e.g., "every Monday for 4 weeks") | A Delay node is a one-shot pause, not a recurring scheduler | A dedicated Recurring node type |
| Per-user delay value (e.g., "wait for `customer.preferred_response_delay`") | Duration tab only supports static values; dynamic durations require a new subtype | Dynamic duration variable binding |
| Delay node in broadcast flows | Broadcast flows have a fixed send-time; delay nodes in this context have undefined semantics | Define broadcast flow execution model |
| Minute-level time precision for Schedule tab (e.g., 09:15) | Current time dropdown is 30-minute increments; free-text time input requires validation design | Time input UX design and validation |

---

## 14. Open Questions

| # | Question | Why open | Owner | Resolution |
|---|---|---|---|---|
| Q1 | What is the flow-level default timezone? Is there a flow-level setting today? | Schedule tab defaults to `Asia/Kolkata` hardcoded. If the marketer's team is in a different region, every node needs a manual override. | Product | Define flow-level timezone setting; Schedule tab should inherit it as default |
| Q2 | Should the "LABEL" title field auto-suggest an updated value when config changes (e.g., "Wait 1 hour" → user changes to 3 days → auto-suggest "Wait 3 days")? | Current behavior: title is static after initial drop. Canvas shows stale title if user changes config without updating label. | Product + Design | Three options: (a) always keep title in sync with auto-label, (b) prompt user when title matches the previous auto-label, (c) leave as manual — decide and document |
| Q3 | What happens to a user currently parked at a Delay node when the flow is edited and republished? | User is mid-wait. If the delay duration changes from 1 hour to 24 hours while the user is in-flight, does their wait extend? | Engineering + Product | Define re-entry/in-flight behavior: (a) in-flight users complete with the original config, (b) in-flight users adopt the new config from their current wait-start time |
| Q4 | What is the max wait cap fallback on the Event tab — is it always `skip_continue`, or should we add `skip_exit` as an option (for consistency with Schedule tab)? | Event tab max cap always continues; Schedule tab has both options. Inconsistency creates confusion. | Product | Align: either both tabs offer both fallback options, or document the intentional difference |
| Q5 | Should the Event tab's variable picker show a warning when a non-datetime variable is browsed/selected? | Currently the picker shows all variables in the mock groups. Real API may return non-datetime types. | Engineering + Design | Filter picker to datetime-typed variables only, or show type label on each variable and only error on save |
| Q6 | For "Use customer's local timezone" — which field on the customer profile stores timezone? What happens if it's not set? | Timezone fallback chain is undefined. | Engineering | Define customer profile timezone field name; define fallback: customer TZ → flow TZ → UTC |
| Q7 | Should the Schedule tab's past-date fallback be shown always, or only when a past date is detected? | Currently shown always (good for pre-configuration). But the section title "Past-date fallback" implies it's only relevant when there's a past date — which may confuse users who configured a future date. | Design | Rename to "If scheduled time has passed:" or keep as always-visible setting with better framing |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|---|---|---|---|
| Three-tab design (Duration / Schedule / Event) over two-toggle (for / till) | Original design had "Wait for" / "Wait till" toggle | Three tabs scale to three fundamentally different configuration modes; the toggle became ambiguous when adding event-relative delays | Users must discover the tab for their use case; Duration is the obvious default but Schedule and Event require deliberate navigation |
| Event tab shipped as Phase 2 but configurable now | Gate tab entirely behind feature flag; or ship it fully operational | Allows marketers to pre-configure event-relative flows before the backend is ready; avoids re-education at launch | Marketers may configure the tab, not see it run, and lose trust. Requires clear Phase 2 messaging. |
| Duration min = 1 (not 0) | Allow 0-minute delay (immediate continue) | A 0-minute delay is semantically a passthrough, not a delay — it adds noise to the canvas and wastes a node slot | Legitimate use case of "fire immediately after trigger" requires removing the Delay node entirely |
| `pastDateFallback` default = `"skip_continue"` | Default to `"skip_exit"` | Least destructive default — if the marketer hasn't thought about this, losing a user from the flow is harder to recover than an immediate continue | A mis-configured flow may send a message too early (on continue) rather than silently dropping the user (on exit) — but the former is more visible and easier to diagnose |
| Canvas label = auto-generated subtitle, separate from user-editable title | Auto-overwrite title on config change | Preserves the marketer's custom node names (e.g., "Cart recovery 1hr delay") while still making config readable | Canvas title can become stale relative to actual config — addressed by the proposed auto-suggest behavior (Open Question Q2) |
