# PRD: Flow Start Trigger

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

- **`EventPickerModal`** — Two-column modal with category rail navigation ("All", "Ecommerce", "Post-purchase", "Communication", etc.), search across event names/descriptions, event cards with name, source badge, device tags, and description. Fully functional UI.
- **`StartTriggerWizard`** — Multi-stage wizard shell with two paths: event-triggered (`picker → step1 → step2`) and broadcast (`picker → broadcast`). Handles hydration from `initialConfig` for edit mode. Produces a typed config object passed to `onComplete(config)`.
- **`Step1WhenContent`** — "When" step with up to 5 trigger groups, per-group attribute conditions (`With attribute` block), `advance_evaluate` block for events like cart abandonment, AND/OR combinator between groups, and an `ExitTriggerSection`.
- **`Step2WhoContent`** — "Who" step with include/exclude condition blocks, audience type selector (`All Users` / `Engage Identified` / `Known User`), limit entry frequency, global control group, and flow control group toggles.
- **`BroadcastConfig`** — Schedule-based trigger path (send now / send at date-time), audience kind selector.
- **`TwoPanelDropdown`** — Reusable portal-based two-panel dropdown with search, used in audience condition rows.
- **`UserPropertyConditions`**, **`UserBehaviorConditions`**, **`UserAffinityConditions`** — Three audience condition block types with multi-row AND/OR logic.
- **`eventCatalogue.json`** — Master event catalog (8,364 lines) with 6 top-level categories, event-level flags (`attribute_allowed`, `advance_evaluate`, `audience_qualification_allow`, `time_attribute_allow`).

### What's incomplete

- **`mockedAudienceCount()`** — "Show count" returns a randomized mock number; no real API call.
- **`MOCK_SEGMENTS`** — Custom segment picker (`Step2WhoContent`) pulls from a hardcoded local array, not a real segments API.
- **`SaveAsSegmentButton`** — Saves segment name into the in-memory `MOCK_SEGMENTS` array with `toast.success()`; not persisted to any backend.
- **No validation guard on "Next"** — `Step1WhenContent` allows proceeding without any trigger event selected.
- **Duplicate codebase** — Trigger files exist in both `src/components/flows/builder/trigger/` and `app/frontend/src/components/flows/trigger/`. The `app/frontend` version uses an older audience model (`limit_days` vs `limit_entry` object). Migration appears in progress.
- **Control groups** — `global_control` and `flow_control` checkboxes render but have no documented behavior or backend contract.

### What's absent

- Real-time or near-real-time audience count API integration.
- Segments API (create, list, delete saved segments).
- Re-entry behavior — what happens when a user who is already in the flow fires the trigger event again.
- Conflict resolution — no handling when a user matches both include and exclude conditions simultaneously.
- Trigger node preview card on canvas — `triggerHelpers.js` has `renderConditionLine()` stubs but the canvas-side display of configured trigger criteria is not connected.
- Validation error states for all required fields before Finish.

---

## 1. Feature Brief

The Flow Start Trigger is the entry gate to every automated flow. It lets a marketer define **which event causes a user to enter the flow** (or schedules a broadcast), **which specific event attributes narrow that entry**, and **which users from the triggered pool actually enter** based on behavioral, property, affinity, or segment conditions. Without a configured trigger, a flow cannot be activated. The trigger replaces manual audience selection with a real-time, event-driven rule that routes the right user into the right flow at the moment they take the relevant action.

---

## 2. The Job

**Irreducible job:** Let a marketer express "enter this flow when a user does X, under these conditions, if they also match this profile" — and have the system honor that rule precisely and repeatedly at scale.

Three things that, if missing, make it not worth shipping:

1. **Event fidelity** — The selected event and attribute conditions must match exactly what the data layer fires. If the trigger picks up phantom events or misses valid ones, the flow is broken.
2. **Audience layering** — The "who" step must be meaningfully composable (property AND behavior AND affinity) or the trigger is no more powerful than a simple segment blast.
3. **Re-entry control** — Without a way to prevent or throttle a user from re-entering a flow on repeat event fires, flows become spam vectors.

---

## 3. Success Metrics

| Metric | Baseline | Target | Measurement |
|---|---|---|---|
| Trigger configuration completion rate (new flows) | Unknown | ≥ 80% of flows created are saved with a configured trigger | Flow creation funnel in analytics |
| Median time to configure trigger | Unknown | < 3 minutes from picker open to Finish | Timestamp delta: `trigger_wizard_opened` → `trigger_configured` |
| Audience condition block usage rate | Unknown | ≥ 40% of configured triggers include at least one audience condition block | `trigger_configured` event, `audience.include_all = false` |
| "Show count" engagement | Unknown | ≥ 50% of triggers with audience filtering use Show count before finishing | `trigger_show_count_clicked` |
| Trigger misconfiguration rate (flows paused due to zero entries) | Unknown | < 5% of activated flows show zero entries in first 7 days | Flow analytics |

---

## 4. Who Uses This and When

### Persona 1 — Campaign Marketer (primary)

**Goal:** Set up a cart recovery flow in under 5 minutes, targeting users who abandoned with ≥ ₹500 cart value.  
**Emotional state:** Productive but impatient — they've done this in other tools and want it to just work.  
**Success:** Trigger is configured, count shows a meaningful audience, they can proceed to building the flow steps.  
**Failure:** They land on the event picker and can't find "cart abandoned" quickly. Or they configure audience conditions but get no count feedback and aren't sure they got it right.

### Persona 2 — Growth / Lifecycle Analyst (secondary)

**Goal:** Configure a nuanced trigger: users who placed an order AND have affinity for a product category, excluding users already in a VIP flow.  
**Emotional state:** Methodical, detail-oriented — wants control over every condition.  
**Success:** All three audience block types (property, behavior, affinity) are composable; they can stack them with AND/OR logic; count is accurate.  
**Failure:** Affinity block is present but the attribute picker for the specific event is empty; they can't express the condition they need.

### Persona 3 — Ops / Broadcast Sender (secondary)

**Goal:** Send a one-time broadcast to all identified users now.  
**Emotional state:** In a hurry — they just want to dispatch, not configure a complex rule.  
**Success:** Broadcast path is reached with two clicks (pick Broadcast event → schedule now → Finish).  
**Failure:** They accidentally land on the event trigger path and can't figure out how to get to broadcast scheduling.

---

## 5. User Flows

### Flow A: New event-triggered flow (happy path)

| Step | User action | System behavior | Friction / Resolution |
|---|---|---|---|
| 1 | Opens `/new` flow | `FlowBuilderV2` mounts; `StartTriggerWizard` opens at `picker` stage | — |
| 2 | Browses/searches event list | `EventPickerModal` renders categories in left rail; right pane shows events for selected category | If search returns 0 results, show empty state |
| 3 | Clicks an event card | `onPickEvent(card)` fires; wizard advances to `step1` | If card is Broadcast type, advances to `broadcast` stage instead |
| 4 | (Optional) Adds attribute conditions | Clicks "+ Add condition"; selects property, operator, value from `AttributeConditionRow` | If `attribute_allowed` is false, "With attribute" block is hidden |
| 5 | (Optional) Adds exit trigger | Expands "Exit Trigger" section; picks event + qualifier | Section auto-bootstraps one empty row |
| 6 | Clicks "Next" | Validates Step 1 is complete (trigger event selected); advances to `step2` | If validation fails, block navigation and surface inline error |
| 7 | Configures audience | Selects "Filter users by"; picks audience type; adds include condition blocks | Count is not auto-loaded |
| 8 | (Optional) Checks "Show count" | System queries audience count API; displays "≈ N users will enter" | Shows spinner during load; shows error if API fails |
| 9 | Clicks "Finish" | `handleFinish()` builds config; calls `onComplete(config)`; wizard closes; trigger node placed on canvas | Toast confirms: "Trigger configured" |
| 10 | Canvas | `TriggerNode` displays a summary card of the configured trigger | — |

### Flow B: Broadcast trigger

| Step | User action | System behavior |
|---|---|---|
| 1–3 | Same as Flow A steps 1–3 | Card with `header === "Broadcast"` routes wizard to `broadcast` stage |
| 4 | Selects schedule: "Send now" or specific date/time | `BroadcastConfig` updates `schedule_kind` |
| 5 | Selects audience kind | `audience_kind` pill updates |
| 6 | Clicks "Finish" | Config `{ kind: "broadcast", triggerGroups, broadcast }` emitted; wizard closes |

### Flow C: Edit existing trigger

| Step | User action | System behavior |
|---|---|---|
| 1 | Clicks TriggerNode on canvas | `FlowBuilderV2` opens `StartTriggerWizard` with `initialConfig` |
| 2 | Wizard hydrates from `initialConfig` | Broadcasts skip to `broadcast` stage; events skip to `step1` |
| 3 | User edits any part | State updates locally; previous config is not saved until Finish |
| 4 | Clicks "Finish" | New config replaces old; trigger node re-renders with updated summary |
| Abandon | Closes wizard mid-edit | Previous config is preserved; no changes are applied |

### Flow D: User closes without configuring (new flow)

| Step | System behavior |
|---|---|
| User clicks X on picker stage | `FlowBuilderV2` detects `triggerConfigured` ref is false; navigates back (`-1`) |
| User clicks Cancel on step1/step2 | Same — navigates back if this is a new flow with no prior config |

### Intermediate state lifecycle (trigger config)

The `triggerConfig` object lives in `FlowBuilderV2` state and is auto-saved to the backend via a 1500ms debounce on any node/edge/meta change. It is:
- **Created** when `onComplete(config)` fires for the first time on a new flow.
- **Modified** when the user reopens and reconfigures the trigger.
- **Cleared** only if the user deletes the TriggerNode from canvas (behavior to be confirmed — see Open Questions).
- **Persisted** as part of the flow's node graph on the backend.

---

## 6. Functional Specification

### 6.1 Event Picker (`EventPickerModal`)

| Element | Type | Required | Behavior |
|---|---|---|---|
| Category rail | Navigation list | — | First item is "All" (shows all events); remaining items are non-canonical catalogue headers |
| Search input | Text | Optional | Filters across `name` and `description` fields; case-insensitive; clears on category change |
| Event card | Selectable card | — | Displays `name`, `description`, `source` (green badge), `device_tag` (gray badges) |
| Event selection | Click | — | Fires `onPick(card)` immediately; no confirmation step |

**Event filtering:** The picker shows all catalogue events without restriction. Events with `audience_qualification_allow === false` are shown here but will be excluded from audience block event pickers (Step 2).

### 6.2 Trigger Groups (Step 1 — `Step1WhenContent`)

| Element | Type | Constraint | Default |
|---|---|---|---|
| Trigger group | Object | Min 1, Max 5 | One group auto-created from picker selection |
| `event` | String (event name) | Required | Set from picker |
| `conditions` | Array | Optional | `[]` |
| `evaluate` | Array | Optional | `[]`; only shown if `advance_evaluate === true` on the event card |
| `combinator` | `"AND"` \| `"OR"` | Per-group | `"AND"` |
| `groupsCombinator` | `"AND"` \| `"OR"` | Global, between groups | `"AND"` |

**Add trigger event:** Shown if `triggerGroups.length < 5`. Opens picker at the next group index.  
**Remove trigger group:** Available only when > 1 group exists.  
**`With attribute` block:** Shown only if `ev.attribute_allowed === true`. Attribute pool comes from `catalogueData.attributes_by_event[eventName]`, falling back to `triggerEventProperties.js`.  
**`Evaluate` block:** Shown only if `ev.advance_evaluate === true` and `evalPool.length > 0`. Used for abandonment events (e.g., cart abandoned — evaluate what was in the cart at time of abandonment vs. now).

### 6.3 Attribute Condition Row (`AttributeConditionRow`)

| Field | Source | Operators | Value |
|---|---|---|---|
| Property | `attrPool` filtered to `is_evaluate === false` | From `attribute.operators[]` | Type-appropriate input |
| Combinator | Per-group `combinator` | `AND` / `OR` | Toggleable pill |

### 6.4 Exit Trigger (`ExitTriggerSection`)

| Element | Behavior |
|---|---|
| Toggle | Collapsed by default; "+Add Exit Trigger" label when closed |
| Event rows | One row auto-created on open; minimum 1 while open |
| Qualifier | `"Has Done"` / `"Has Not Done"` per row |
| Event picker | `TwoPanelDropdown`; shows all events except `ALL`/`All` canonical buckets |
| Add condition | Appends a new `emptyEventAction()` row |
| Clear exit trigger | Removes all rows; collapses section |

**Semantics:** When any exit trigger condition is met, the user is immediately removed from the flow regardless of their current node position.

### 6.5 Audience — "Who" Step (`Step2WhoContent`)

#### Top-level mode

| Mode | `include_all` value | Behavior |
|---|---|---|
| All users who match start trigger | `true` | Step 2 condition blocks hidden; audience kind hidden |
| Filter users by | `false` | Reveals audience type, include blocks, exclude section |

#### Audience Kind (`audience_kind`)

| Value | Label | Meaning |
|---|---|---|
| `"all"` | All Users | No identity filter applied |
| `"identified"` | Engage Identified | Users known to Engage identity graph |
| `"known"` | Known User | Users with a resolved customer ID |

Default: `"all"`.

#### Condition Block Types

| Type | Label | Component | Supported operators |
|---|---|---|---|
| `"property"` | User property | `UserPropertyConditions` | Per attribute data type (string, numeric, date, boolean, enum) |
| `"behavior"` | User behavior | `UserBehaviorConditions` | `at_least`, `exactly`, `at_most`, `between` occurrences in time range |
| `"affinity"` | User affinity | `UserAffinityConditions` | Predominantly, For minimum of, Most no. of times, Least no. of times |
| `"segment"` | Custom segment | `SegmentList` (dropdown) | Segment membership |

**Block list:** Multiple blocks combinable with global `blocksCombinator` (AND/OR).  
**Within-block conditions:** Each block has its own `combinator` (AND/OR) between rows.  
**Changing block type:** Resets all conditions within the block to empty.

#### Exclude Users

Toggled by checkbox (`exclude_enabled`). When enabled, shows a full `ConditionBlockList` (same types as include). Users matching both include and exclude: see Edge Cases.

#### Limit Entry Frequency

| Field | Type | Default | Constraint |
|---|---|---|---|
| `limit_enabled` | Checkbox | `false` | — |
| `count` | Integer | `1` | Min 1 |
| `window` | Integer | `1` | Min 1 |
| `unit` | Select | `"days"` | `days` / `weeks` / `months` |

Meaning: a user can enter this flow at most `count` time(s) within any rolling `window` `unit` period.

#### Control Groups

| Field | Type | Default | Behavior |
|---|---|---|---|
| `global_control` | Checkbox | `false` | See Open Questions |
| `flow_control` | Checkbox | `false` | See Open Questions |

#### Audience Count

"Show count" button triggers an API call to estimate how many users match the current configuration. Result displayed as "≈ N users will enter". Count is not live-updated; user must re-click after modifying conditions.

### 6.6 Save as Segment

Visible when at least one include condition block has a non-empty condition. Allows user to name and save the current include block set as a reusable segment. Requires real segments API (currently mocked).

### 6.7 Broadcast Config (`BroadcastConfig`)

| Field | Type | Options | Default |
|---|---|---|---|
| `schedule_kind` | Select / radio | `"now"` / `"scheduled"` | `"now"` |
| Schedule date/time | Datetime input | Only shown if `schedule_kind === "scheduled"` | — |
| `audience_kind` | Pills | `all` / `identified` / `known` / saved segment | `"all"` |

### 6.8 Config Output Shape

**Event trigger:**
```json
{
  "kind": "event",
  "triggerGroups": [
    {
      "event": "cart_abandoned",
      "conditions": [{ "property": "cart_value", "operator": "gte", "value": "500" }],
      "evaluate": [],
      "combinator": "AND"
    }
  ],
  "groupsCombinator": "AND",
  "exitTrigger": { "open": true, "events": [{ "qualifier": "has_done", "event": "order_placed" }] },
  "audience": {
    "include_all": false,
    "audience_kind": "identified",
    "include": { "blocks": [...], "blocksCombinator": "AND" },
    "exclude_enabled": false,
    "exclude": { "blocks": [...], "blocksCombinator": "AND" },
    "limit_enabled": true,
    "limit_entry": { "count": 1, "window": 7, "unit": "days" },
    "global_control": false,
    "flow_control": false
  }
}
```

**Broadcast trigger:**
```json
{
  "kind": "broadcast",
  "triggerGroups": [{ "event": "broadcast_send", ... }],
  "broadcast": { "schedule_kind": "now", "audience_kind": "all" }
}
```

When `skipStep2` is true (event card has `audience_qualification_allow === false`), `audience` is `null` in the output.

---

## 7. States

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|---|---|---|---|---|---|
| Picker — empty search | User types with no results | Empty state in right column | Clear search | Filter returns empty array | User clears input |
| Picker — category selected | User clicks category | Right column updates to show that category's events | Pick event, search, navigate | Filters from catalogue | Next category click or "All" |
| Step 1 — no conditions | Default after event pick | Trigger group shows event button, no condition rows | Add condition, change event, add trigger group | — | User adds a condition |
| Step 1 — validation error | User clicks Next with no event in a group | Inline error on the incomplete group | Fix error | Navigation blocked | User selects an event |
| Step 2 — all users | `include_all = true` | Simplified view, no condition blocks | Toggle to "Filter users by" | — | User switches radio |
| Step 2 — count loading | User clicks "Show count" | Spinner on button | Wait | API call in flight | Response returns |
| Step 2 — count loaded | API response | "≈ N users will enter" | Modify conditions, re-fetch | Count displayed | User modifies conditions (count stales) |
| Step 2 — count error | API call fails | Error message near button | Retry | — | User retries |
| Broadcast — scheduled | `schedule_kind = "scheduled"` | Date/time picker visible | Select date/time | — | User changes to "now" |
| Edit mode — hydrated | `initialConfig` present on open | Wizard opens at step1 (or broadcast) pre-populated | Modify, Finish, Cancel | Previous config not overwritten until Finish | Finish or Cancel |
| Wizard — abandoned (new flow) | User closes on picker or step1/step2 | Wizard closes | — | `FlowBuilderV2` navigates back (-1) | N/A |
| Wizard — abandoned (edit) | User closes mid-edit | Wizard closes | — | Previous config preserved unchanged | N/A |

---

## 8. Edge Cases

**Multiple trigger groups — one group has no event selected**  
*Wrong behavior:* User clicks "Add another trigger event" but dismisses the picker; an empty group remains in state.  
*Correct behavior:* If picker is dismissed without a selection, the pending group slot is not added to `triggerGroups`.

**Attribute pool is empty for a selected event**  
*Wrong behavior:* "With attribute" block shows no properties; user sees an empty dropdown.  
*Correct behavior:* If `attrPool` is empty and `attribute_allowed` is true, show a message: "No attributes available for this event." Hide the "+ Add condition" button.

**User switches block type mid-configuration**  
*Wrong behavior:* Previous conditions survive in state under the new type, causing schema mismatches.  
*Correct behavior:* Block type change resets `conditions` to `[]` (already implemented — verify conditions are also cleared from `evaluate`).

**Include and exclude conditions overlap**  
*Wrong behavior:* User matches both include (behavior: placed order) and exclude (property: VIP segment). System enters them into the flow anyway.  
*Correct behavior:* Exclude takes precedence. A user matching any exclude condition does not enter the flow.

**Limit entry frequency — user re-enters before window expires**  
*Wrong behavior:* Flow silently drops the entry with no visibility.  
*Correct behavior:* Entry is suppressed. Analytics attribute the suppressed entry to "frequency cap" so the marketer can distinguish cap-suppressed from no-event.

**User in the flow fires the trigger event again**  
*Wrong behavior:* Duplicate flow instance created, or second instance silently dropped.  
*Correct behavior:* Behavior must be explicitly configured. Three valid options: re-enter from the start, re-enter only if not currently active, suppress. Requires a re-entry mode selector (currently absent — see Open Questions).

**Exit trigger fires before user reaches the first node**  
*Wrong behavior:* User enters flow and immediately exits; next message sends anyway due to race condition.  
*Correct behavior:* Exit trigger evaluation runs before any action node executes. If exit condition is met at entry, user is dropped without processing any nodes.

**eventCatalogue.json event removed or renamed**  
*Wrong behavior:* `initialConfig.triggerGroups[0].event` no longer matches any catalogue entry; `findEvent()` returns null; wizard renders broken group.  
*Correct behavior:* If event not found in catalogue, show the raw event name with a warning badge: "Event not found in catalogue — may have been removed." Allow user to re-select.

**Segment list is empty (real API)**  
*Wrong behavior:* Segment block type shows empty dropdown with no action.  
*Correct behavior:* Show "No saved segments. Create one using 'Save as segment'." with a pointer to the SaveAsSegmentButton.

**Broadcast trigger — schedule time is in the past**  
*Wrong behavior:* User selects a past date/time and clicks Finish; broadcast is queued with an invalid schedule.  
*Correct behavior:* Validate on Finish: if `schedule_kind === "scheduled"` and the datetime is in the past, block Finish with an inline error.

**Closing the wizard during "Show count" in flight**  
*Wrong behavior:* API callback resolves after wizard is closed; state update on unmounted component.  
*Correct behavior:* Cancel in-flight request on wizard close (cleanup in `useEffect` return).

**`app/frontend` vs `src` duplication**  
*Wrong behavior:* A bug fix applied to one version is not reflected in the other; both ship to production.  
*Correct behavior:* One canonical source path. The `app/frontend` version (older audience model) should be deprecated and removed after migration is complete.

---

## 9. Non-Functional Requirements

### Performance

- Event picker search must return filtered results within 50ms (all filtering is client-side against `eventCatalogue.json`; acceptable at current catalog size of ~500 events).
- "Show count" API must respond within 3 seconds. If > 3 seconds, show a timeout state with retry.
- Wizard open-to-interactive time < 300ms (no async data fetching on open except count).

### Scale

- `eventCatalogue.json` at 8,364 lines is currently manageable client-side. At 2× growth, search filtering should move to a web worker or the catalogue should be paginated from API.
- Audience count queries must handle large user bases (10M+ users) — backend should return an estimate, not an exact count, to avoid query timeouts.

### Security

- Event names and attribute values from `eventCatalogue.json` are trusted data; no user-entered HTML in event metadata is rendered as HTML.
- Segment names entered via "Save as segment" must be sanitized before persisting (prevent XSS if names are rendered in other contexts).
- Audience condition values (free-text inputs) must be treated as user data and sanitized before any backend query.

### Reliability

- The wizard must be fully functional offline for editing (all data is client-side catalogue). Only "Show count" requires network; it must fail gracefully.
- If the backend `onComplete` save fails, the wizard must not close — retain state and show error, allow retry.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|---|---|---|
| `trigger_wizard_opened` | `StartTriggerWizard` mounts with `open=true` | `flow_id`, `is_edit` (bool), `initial_kind` (event/broadcast/null) |
| `trigger_event_picked` | User selects event in `EventPickerModal` | `flow_id`, `event_name`, `event_header`, `event_section` |
| `trigger_step1_next` | User clicks "Next" to Step 2 | `flow_id`, `group_count`, `has_conditions` (bool), `has_exit_trigger` (bool) |
| `trigger_show_count_clicked` | User clicks "Show count" | `flow_id`, `audience_block_count`, `has_exclude` (bool) |
| `trigger_show_count_returned` | API responds | `flow_id`, `count`, `latency_ms` |
| `trigger_configured` | `handleFinish()` completes | `flow_id`, `kind`, `group_count`, `include_all`, `audience_block_types[]`, `has_limit`, `has_exit_trigger`, `has_exclude` |
| `trigger_wizard_abandoned` | Wizard closed without Finish | `flow_id`, `stage_at_close` (picker/step1/step2/broadcast), `is_edit` |
| `trigger_segment_saved` | User saves a segment via "Save as segment" | `flow_id`, `segment_name` |

### Metrics

| Metric | Definition | Where it surfaces |
|---|---|---|
| Wizard completion rate | `trigger_configured` / `trigger_wizard_opened` | Product dashboard |
| Step drop-off rate | `trigger_wizard_abandoned` by `stage_at_close` | Funnel analysis |
| Audience filter adoption | `trigger_configured` where `include_all = false` / all `trigger_configured` | Product dashboard |
| Median audience count | Median value in `trigger_show_count_returned.count` | Data team |
| Event category distribution | `trigger_event_picked.event_header` counts | Product dashboard |

---

## 11. Copy

### Wizard header
> Configure trigger

### Step indicator (non-broadcast)
> 1. When will users enter the flow → 2. Who will enter the flow

### Step 1 — trigger group header
> Create trigger based on {event header}

### Step 1 — event prompt
> Whenever user performs **{event name}**

### Step 1 — no event selected (validation error)
> Select a trigger event to continue.

### Step 1 — attribute section header
> With attribute

### Step 1 — evaluate section header
> Evaluate

### Exit trigger — collapsed
> + Add Exit Trigger

### Exit trigger — expanded header
> Exit Trigger

### Exit trigger — section label
> Exit when

### Step 2 — radio labels
> All users who match the start trigger  
> Filter users by

### Step 2 — audience type section
> Audience Type

### Step 2 — exclude section
> Exclude Users

### Step 2 — limit frequency label
> Limit entry frequency

### Step 2 — limit frequency inline copy
> Limit to **{count}** time(s) within **{window}** **{unit}**

### Step 2 — control group labels
> Global control group  
> Flow control group

### Show count — loading
> Calculating…

### Show count — result
> ≈ **{N}** users will enter

### Show count — error
> Couldn't estimate audience size. Check your connection and try again.

### Broadcast — schedule now
> Send now

### Broadcast — schedule later
> Schedule for a specific date and time

### Broadcast — past date error
> The scheduled time is in the past. Choose a future date and time.

### Trigger configured toast
> Trigger configured

### Abandon confirmation (new flow)
> *(no modal shown — wizard closes and navigates back)*

### Event not found in catalogue (edit mode)
> Event "{event_name}" not found in catalogue. It may have been removed. Select a new event.

### Save as segment — input placeholder
> Segment name…

### Save as segment — success toast
> Segment "{name}" saved

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Degrades gracefully? |
|---|---|---|---|
| `eventCatalogue.json` | Full event catalog, attribute pools, event flags | Picker is empty; no trigger can be configured | No — blocking |
| Audience count API | Real-time user count matching trigger + audience config | "Show count" fails; shows error state | Yes — counting is optional |
| Segments API | List of saved segments for "Custom segment" block; create endpoint for "Save as segment" | Segment block shows empty list; "Save as segment" fails | Partial — segment block is unusable but other block types function |
| `triggerEventProperties.js` | Fallback attribute pool for events not in `attributes_by_event` | Events without catalogue attributes show no attribute conditions | Partial — feature degrades silently for those events |
| Flow backend save | Persisting configured trigger with flow node graph | `onComplete` config is lost on refresh | No — trigger must be persisted |

---

## 13. Out of Scope

| Exclusion | Reason | Prerequisite to unlock |
|---|---|---|
| Re-entry mode selector | Behavior when a user re-fires the trigger while already in the flow is undefined; requires product decision and backend support | Product decision on re-entry semantics; backend queuing model |
| Control group behavior (`global_control`, `flow_control`) | Checkboxes exist but semantics, holdout percentage, and reporting are not specified | Experimentation framework design |
| Real-time audience count (auto-refreshes) | Performance risk without debounce + caching strategy | Count API with caching layer |
| Trigger simulation / test-fire | Let the marketer fire a test event to verify trigger fires correctly | Event simulation infrastructure |
| Multi-event exit triggers with AND logic | Current exit trigger uses implicit OR between rows; AND logic would require nested condition support | UI and backend support for nested exit trigger conditions |
| Frequency cap analytics (why a user was blocked from entering) | Requires entry-attempt logging separate from entry logging | Backend entry-attempt event schema |

---

## 14. Open Questions

| # | Question | Why open | Owner | Resolution |
|---|---|---|---|---|
| Q1 | What happens when the user deletes the TriggerNode from the canvas? Is the `triggerConfig` cleared? Can a flow have zero trigger nodes? | Deleting the trigger node would leave the flow in an unactivatable state, but the behavior is unspecified. | Engineering + Product | Define: either disallow deletion of TriggerNode, or re-open the wizard on deletion |
| Q2 | What is the re-entry behavior when a user fires the trigger event again while already active in the flow? | Critical for correctness — without this, flows can create duplicate journeys or silently suppress entries. | Product | Choose one: block re-entry, restart from top, restart only if inactive |
| Q3 | What do `global_control` and `flow_control` checkboxes do? What percentage is held out, how is it assigned, and how is it reported? | Checkboxes render but no behavior is documented or implemented. | Product | Define holdout percentage, randomization strategy, and reporting surface before enabling |
| Q4 | Should the "Next" button on Step 1 be disabled (vs. showing a validation error) when no trigger event is selected? | Both patterns are common; need a consistent validation UX decision. | Design | Pick one and apply consistently across all wizard steps |
| Q5 | What is the migration plan for `app/frontend/src/components/flows/trigger/` vs `src/components/flows/builder/trigger/`? | Two live versions with divergent audience models will cause bugs when features land in one but not the other. | Engineering | Set a deadline; deprecate `app/frontend` version |
| Q6 | Is the audience count API synchronous or async (polling)? What is the expected p95 response time? | Needed to design the count loading UX (spinner vs. progress bar vs. background estimation). | Engineering | Define SLA and response pattern |
| Q7 | Should "Save as segment" be available from the exclude block, or only the include block? | Include and exclude both have `ConditionBlockList` but only include's SaveAsSegmentButton is wired. | Product | Decide and update spec |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|---|---|---|---|
| Two-step wizard (When → Who) vs. single form | Single-page form with all trigger options | Reduces cognitive load; event selection dictates which audience features are relevant (e.g., `skipStep2` for events where audience qualification isn't applicable) | Users editing only the audience must click through Step 1 even if unchanged |
| Broadcast as a separate stage vs. a trigger type within Step 1 | Broadcast as an option inside the same event-triggered wizard | Broadcast has fundamentally different configuration (schedule, not condition) — merging would add conditional complexity to both paths | Picker must correctly route to broadcast vs. event path; a mis-classified event card would send users down the wrong path |
| Client-side event catalog (JSON) vs. API-fetched | API fetch on wizard open | Zero-latency picker open; no spinner on catalog load; acceptable given current catalog size | Catalog updates require a frontend deploy; large catalog growth would bloat bundle |
| Max 5 trigger groups | No limit / lower limit | Arbitrary but defensible; 5 OR'd trigger events is already complex to reason about; above 5, the audience definition becomes ambiguous | Users with genuinely complex multi-event triggers cannot express them in a single flow trigger |
| Audience count as manual ("Show count" button) vs. auto-refresh | Auto-refresh on condition change | Auto-refresh would fire an API call on every keystroke; without debounce + caching this would be expensive and distracting | User must remember to re-check count after modifying conditions; stale counts are possible |
