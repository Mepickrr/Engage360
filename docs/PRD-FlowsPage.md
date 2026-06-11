# Flows Page — Product Requirements Document

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

Two files exist for this page: `Flows.jsx` (V1) and `FlowsV2.jsx` (V2). V2 is the canonical version going forward. V1 is being deprecated.

**What's built and functional in V2:**
- Page header with "Create Flow" CTA navigating to `/flows-v2/create`
- Stats row with 6 summary tiles (Active Flows, Revenue Attributed, Deliverability, Users in Flows, AI Sessions, Conv. Rate) and a date range selector
- Flows table with search, Status filter, Lifecycle Stage filter, % View toggle, Export CSV button, per-row actions
- Table columns: Journey Name (with health dot, audience type chip, last update), Channels, Sent, Delivered, Opened, Clicked, Orders, Revenue, Spent, Status (toggle + label), Actions
- Per-row actions: inline Edit and Analytics buttons + overflow menu (Edit, View Analytics, Duplicate, Rename, Archive, Delete, Test, View All Chat)
- Inline status toggle that activates/pauses a flow
- Pagination row count selector (10 / 25 / 50)

**What's defined but not rendered in V2's current main component:**
`AIFlowAssist`, `PerformanceContextStrip`, `AIAnalyticsZone`, and `GrowthEngine` are all fully implemented components in V2 but are not included in the current page render. V1 renders all four. These are intentionally deferred, not deleted — they need a decision.

**What's incomplete (stubs):**
- Export CSV, Duplicate, Rename, Archive, Test, View All Chat, View Full Analytics all show `toast.info(…)` with no actual implementation
- Status toggle in the table uses local React state only — no API call to `pauseFlow` / `resumeFlow` from the list view
- Pagination (10/25/50 per page) is UI-only — no actual page-size behavior wired
- Stats tiles show hardcoded values — not connected to a real API
- `orders` is always 0 — not hooked to real data
- `delivered`, `opened`, `clicked` are derived as estimated percentages (82%, 35%, 10% of `entered`) — not real delivery data

**What's absent:**
- Sorting on table columns (no sort behavior implemented)
- Bulk selection or bulk actions
- Real-time refresh for "Users in Flows" live tile
- Any confirmation dialog before Delete

---

## 1. Feature Brief

The Flows page is the operational home for a marketer managing automated journeys. It gives them a single view of every flow in their store — what is running, how it is performing, and what needs attention — without having to open each flow individually. The page also surfaces proactive opportunities (new flows worth building) and health alerts (flows silently failing) so a marketer can act before a problem compounds.

---

## 2. The Job

Give marketers a live command centre for all their automated flows so they can monitor, act, and grow without opening the builder.

Three things that, if missing, make it not worth shipping:

1. **Flow health is visible at a glance.** A marketer must know which flows are failing before they have to ask. A list of names and statuses is not enough.
2. **Activate and pause work directly from the list.** Requiring a builder open to toggle a flow is friction that causes delays when something needs to be stopped urgently.
3. **Performance data is per-flow, not just aggregate.** The stats tiles at the top are not enough. Each row must show the metrics that matter for that flow so a marketer can triage in one pass.

---

## 3. Success Metrics

| Metric | Baseline | Target (90 days) |
|--------|----------|-----------------|
| % of marketers who activate/pause a flow from the list (not the builder) | 0% (not wired to API) | > 40% of toggle events |
| Time to identify a failing flow (health = critical) | Requires opening builder / analytics | < 30 seconds from page load |
| Flows page as entry point for builder navigation | Unknown | > 60% of builder sessions start here |
| Export CSV used per week | 0 (stub) | > 5 exports/week per active store |
| "Create Flow" CTA click-through from Flows page | — | > 70% of flow creation starts here |

---

## 4. Who Uses This and When

**Persona 1 — Campaign Marketer doing a morning check**

Goal: Confirm that all active flows are running and nothing has broken overnight.
Emotional state: Routine; will become stressed immediately if something is failing.
Success: Loads page, scans health dots and status column, sees no red indicators, moves on in under 60 seconds.
Failure: Health dot is red but there's no context — marketer opens the builder to find out what's wrong, adds 5 minutes to a routine check.

---

**Persona 2 — CRM Manager responding to a delivery incident**

Goal: Find the specific flow that's under-delivering, understand the impact (revenue at risk), and either pause it or fix it.
Emotional state: Reactive, time-pressured. A stakeholder has already asked about it.
Success: Sorts or scans by health indicator, identifies the failing flow, reads the revenue column, opens analytics from the row action — all without touching the builder.
Failure: Can't filter by health status; has to open each flow individually to check delivery numbers.

---

**Persona 3 — Growth Marketer evaluating coverage gaps**

Goal: Understand which lifecycle stages have no active flows, and identify the highest-impact one to build next.
Emotional state: Strategic, unhurried. Planning next week's work.
Success: Filters by Lifecycle Stage, sees which stages have zero active flows, reads the Growth Engine recommendations, starts a new flow with context already pre-loaded.
Failure: Growth recommendations are generic and don't reference the store's own data; marketer ignores them.

---

## 5. User Flows

### Flow 1: Morning health check

1. Marketer navigates to `/flows-v2` from the sidebar.
2. Page loads. Stats tiles show aggregate numbers for the default date range (Last 30 Days). The Rishi alert strip appears if any flow has `health: critical` or `health: warning`.
3. Marketer scans the flows table. Each row has a health dot (green/amber/red) as the leftmost visual signal.
4. Marketer sees a red dot on "Cart Recovery". They click the Edit action on that row to open the builder, or the Analytics action to see delivery breakdown.
5. If no issues: marketer reads stats tiles, confirms "Users in Flows" is live-updating, closes the tab.

---

### Flow 2: Pause a failing flow from the list

1. Marketer identifies a flow with critical health in the table.
2. Marketer clicks the status toggle in the row. Toggle flips from active to paused.
3. A confirmation dialog appears: "Pause [Flow Name]? No new users will enter this flow. Users currently in-journey will complete their current step." with Cancel and Pause buttons.
4. On confirm: API call to `pauseFlow`. Row status label updates to "In Progress" (paused). Toggle reflects the new state.
5. On failure: Toggle reverts to previous state. Inline error: "Failed to pause — try again."

---

### Flow 3: Create a new flow

1. Marketer clicks "Create Flow" in the page header.
2. Navigates to `/flows-v2/create` (the Create page — separate PRD).

---

### Flow 4: Filter and find a specific flow

1. Marketer types in the search input. Table filters in real time against flow name. Case-insensitive.
2. Marketer selects "Conversion" from the Lifecycle Stage dropdown. Table re-filters. Active filters stack (search + stage filter can be combined).
3. Marketer selects "Live" from the Status dropdown. Table filters further.
4. If zero results: empty state shown with "No flows match your filters" and a "Clear filters" link.
5. Marketer clicks a flow name to navigate to the builder.

---

### Flow 5: Act from the Growth Engine

1. Marketer reads a Growth Engine recommendation card (e.g. "Cart Recovery — WhatsApp + Email").
2. Marketer clicks the CTA ("Build with Aryan"). The AI conversation panel opens with a pre-seeded message describing the opportunity.
3. Marketer iterates with the AI agent and navigates to the builder when ready.

---

### Flow 6: Dismiss the Rishi alert strip

1. Rishi alert strip is visible on page load (when at least one flow has a delivery health issue).
2. Marketer clicks "Fix now" → opens the AI conversation panel pinned to Rishi with the specific flow context.
3. Marketer clicks "View analytics" → navigates to that flow's analytics page.
4. Marketer clicks X → strip is dismissed for the session. It reappears on the next page load if the issue persists.

---

## 6. Functional Specification

### 6.1 Page Header

| Element | Behavior |
|---------|---------|
| Page title | "Flows" — static |
| Subtitle | Static descriptor copy |
| Create Flow button | Navigates to `/flows-v2/create` |

---

### 6.2 Rishi Alert Strip

Appears above the stats row when one or more flows have `health: critical` or `health: warning`. Dismissable per session (not persisted to the backend — reappears on reload if the issue still exists).

| Element | Content |
|---------|---------|
| Agent avatar | Rishi (blue) |
| Body | Names the specific flows with issues and the nature of the problem (delivery failure %, no conversions in N days) |
| "Fix now" | Opens AI panel pinned to Rishi with the flow context pre-seeded |
| "Review" | Scrolls the table to the relevant row and highlights it |
| Dismiss (X) | Hides the strip for the session |

If there are no flows with critical or warning health, the strip does not render. It does not show a "all clear" state.

---

### 6.3 Stats Row

Six tiles. Date range applies to all tiles. Default: Last 30 Days.

| Tile | Definition | Format |
|------|-----------|--------|
| Active Flows | Count of flows with `status: active` | Integer |
| Revenue Attributed | Sum of `revenue_inr` across all flows in the date range | ₹X or ₹X.XXL |
| Deliverability | (Total delivered / Total sent) across all active flows | Percentage |
| Users in Flows | Count of users currently mid-journey (live, not a range metric) | Integer with live pulse indicator |
| AI Sessions | Count of AI Chatbot + AI Calling sessions in date range | Integer |
| Conv. Rate | (Total orders / Total users entered) across all active flows | Percentage |

**Date range options:** Today, Last 7 Days, Last 30 Days, This Month, All Time.

Each tile shows a delta vs the previous equivalent period (↑ green, ↓ red). "Users in Flows" shows a live pulse indicator instead of a delta — it updates without page refresh.

If a tile's data fails to load, it shows "—" with a retry icon. Tile failures are independent — a failed tile does not block other tiles or the table.

---

### 6.4 AI Flow Assist

A text input with quick-start chips. Marketer describes a flow in natural language; submission opens the AI conversation panel with the prompt pre-seeded.

| Element | Behavior |
|---------|---------|
| Textarea | 2 rows. Enter (without Shift) submits. |
| "Build →" button | Appears only when there is non-empty input. Submits the prompt. |
| Quick-start chips | 7 pre-defined prompts. Clicking a chip populates the textarea (does not auto-submit). |

After submission, the textarea clears. The conversation panel opens as a side panel — the Flows page stays visible behind it.

---

### 6.5 AI Analytics Zone (Rishi)

A dismissible alert card surfaced when Rishi detects a critical delivery failure worth escalating. Contains:

- Flow name + failure metric (e.g. "44% of sends failed")
- Revenue at risk (formatted as ₹X,XXX)
- Timestamp of last successful trigger
- "Fix now" → opens AI panel pinned to Rishi with context
- "View analytics" → navigates to that flow's analytics page
- Dismiss (X) — hides for the session

Only one alert shows at a time (the most critical). If there are multiple critical flows, the most severe is shown.

---

### 6.6 Growth Engine (Aryan)

Three recommendation cards, each with a tier badge (START / IMPROVE / SCALE). Cards are store-specific — body copy references the store's actual user counts and performance patterns.

| Element | Content |
|---------|---------|
| Tier badge | START (blue), IMPROVE (amber), SCALE (purple) |
| Title | Flow name / opportunity |
| Body | Why this matters now — references real store data |
| Channel icons | Which channels this flow uses |
| CTA | "Build/Improve/Scale with Aryan" — opens AI panel with full brief pre-seeded |
| "See all opportunities →" | Opens AI panel pinned to Aryan |

Cards are ordered: START first, IMPROVE second, SCALE third — lower barrier opportunities are shown first.

---

### 6.7 Flows Table

#### Controls

| Control | Behavior |
|---------|---------|
| Search | Real-time filter on flow name. Case-insensitive. |
| Status filter | All / Live / Draft / Completed / In Progress. Single-select. |
| Lifecycle Stage filter | All / Acquisition / Engagement / Conversion / Retention / Re-engagement. Single-select. |
| % View toggle | Switches Delivered, Opened, Clicked columns between absolute numbers and percentage of Sent. Sent always stays absolute. |
| Export CSV | Downloads all rows matching the current filter as a CSV. Includes all table columns. File name: `flows-export-YYYY-MM-DD.csv`. |

Filters stack — search + status + stage can all be active simultaneously. Changing any filter does not reset the others. A "Clear all filters" link appears when any filter is non-default.

#### Columns

| Column | Content | Notes |
|--------|---------|-------|
| Journey Name | Flow name (link to builder) + health dot + audience type chip + last updated timestamp | Health dot: green (healthy), amber (warning), red (critical). Clicking the name navigates to `/flows-v2/builder/:id`. |
| Channels | Up to 4 channel icon chips. "+N more" if > 4. | Channels: WhatsApp, Email, SMS, Push, AI Calling, AI Chatbot, RCS |
| Sent | Total users who entered the flow | Absolute only |
| Delivered | Messages delivered | Absolute or % of Sent |
| Opened | Messages opened | Absolute or % of Sent |
| Clicked | Link clicks | Absolute or % of Sent |
| Orders | Orders attributed to this flow | Absolute only |
| Revenue | Revenue attributed (₹) | Formatted ₹X or ₹X.XXL |
| Spent | Cost of messages sent | Formatted ₹X or ₹X.XXL |
| Status | Toggle (active/paused) + status label badge | Toggle calls API. States: Live (green), Draft (slate), In Progress / Paused (amber), Completed (blue), Inactive (grey) |
| Actions | Edit icon, Analytics icon, overflow menu (⋮) | |

#### Row overflow menu

Edit · View Analytics · Duplicate · Rename · Archive · Delete · *(separator)* · Test · View All Chat

- **Edit:** navigates to builder
- **View Analytics:** navigates to `/flows-v2/builder/:id/analytics`
- **Duplicate:** creates a copy of the flow in Draft status. New name: "[Flow Name] (copy)". Confirms with toast.
- **Rename:** opens an inline input in the name cell. Enter to confirm, Escape to cancel.
- **Archive:** moves flow to Archived status. Archived flows do not appear in the default list view. Confirms with toast.
- **Delete:** shows confirmation dialog. On confirm: deletes permanently. Cannot be undone.
- **Test:** opens the builder with the flow in test mode.
- **View All Chat:** navigates to the conversation history for AI Chatbot flows.

#### Pagination

Default: 25 rows per page. Page size options: 10, 25, 50. Shows "Showing X–Y of Z flows". Cursor-based pagination (no page number selector).

---

## 7. States

### Page

| State | Trigger | What the user sees | How it exits |
|-------|---------|--------------------|--------------|
| Loading | Initial page load | Skeleton stats tiles + skeleton table rows | Data arrives → Populated |
| Populated | Data loaded | Full page | — |
| Error | API fetch fails | Error banner with retry | Retry → Loading |

### Stats Tiles

| State | What the user sees |
|-------|--------------------|
| Loading | Animated skeleton per tile |
| Populated | Value + delta |
| Error (individual tile) | "—" with retry icon. Other tiles unaffected. |

### Flows Table

| State | Trigger | What the user sees | Available actions | How it exits |
|-------|---------|--------------------|-------------------|--------------|
| Loading | Page load or filter change | Skeleton rows | — | Data arrives |
| Populated | Data loaded | Full rows | All | — |
| Empty (no flows) | Store has no flows | Illustration + "No flows yet" + "Create your first flow" CTA | Create Flow | First flow created → Populated |
| Empty (filtered) | Search / filter returns 0 | "No flows match your filters" + "Clear filters" link | Clear filters | Filters cleared → Populated |

### Status Toggle

| State | Trigger | What the user sees |
|-------|---------|--------------------|
| Toggling | Toggle clicked | Toggle shows spinner; row is not interactive |
| Success | API responds | Toggle flips; status label updates; success toast |
| Error | API fails | Toggle reverts; inline error in row |

### Confirmation Dialog (Delete)

| Element | Content |
|---------|---------|
| Title | "Delete [Flow Name]?" |
| Body | "This will permanently delete the flow and all its data. This cannot be undone." |
| Buttons | Cancel · Delete (destructive) |

---

## 8. Edge Cases

**Situation:** Marketer toggles a flow to active that has never been published (status was `draft`, not `paused`).
**Wrong behavior:** Toggle silently activates with no validation; flow may have an incomplete configuration.
**Correct behavior:** If `status === "draft"`, clicking the toggle is equivalent to a first-time publish. The system validates that the flow has at least a start trigger and one node before activating. If validation fails, a modal shows: "This flow isn't ready to go live" with a list of what's missing and a "Finish setup" link to the builder.

---

**Situation:** Two browser tabs have the same Flows page open. Marketer pauses a flow in Tab A.
**Wrong behavior:** Tab B still shows the flow as active indefinitely.
**Correct behavior:** The staleTime for the flows query is 30 seconds. Tab B shows stale data for up to 30 seconds, then refreshes. A background refetch runs when Tab B regains focus.

---

**Situation:** Flow has `channels: []` (no channels set — e.g. a draft with only a trigger).
**Wrong behavior:** Channels cell shows an empty space, implying a visual bug.
**Correct behavior:** Channels cell shows "—".

---

**Situation:** Revenue column has a very large number (e.g. ₹1,23,45,678).
**Wrong behavior:** Number overflows the column width and breaks the table layout.
**Correct behavior:** Numbers ≥ 1,00,000 are formatted as ₹X.XXL (lakhs). Numbers ≥ 1,00,00,000 are formatted as ₹X.XXCr (crores).

---

**Situation:** Marketer searches for a flow that exists but is archived.
**Wrong behavior:** No results shown; marketer thinks the flow was deleted.
**Correct behavior:** Search results include archived flows, shown with an "Archived" badge. The default view excludes them, but search always includes the full dataset with visual differentiation.

---

**Situation:** Export CSV is triggered while a filter is active.
**Wrong behavior:** Export downloads all flows, ignoring the current filter — marketer gets a 500-row CSV when they wanted 12 rows.
**Correct behavior:** Export downloads exactly the rows visible in the current filtered view. File name includes the active filter context: `flows-export-live-conversion-2026-06-11.csv`.

---

**Situation:** Marketer deletes a flow that is currently `active`.
**Wrong behavior:** Flow is deleted immediately; users currently in-journey get no messages for the remaining steps.
**Correct behavior:** If `status === "active"`, the confirmation dialog adds an extra warning: "This flow is currently live. Deleting it will stop all in-journey users immediately." The delete action first pauses the flow, then deletes it. Users mid-step receive no further messages.

---

**Situation:** The "Users in Flows" tile is live-updating but the API call fails mid-session.
**Wrong behavior:** Tile freezes on the last known value with no indication it's stale.
**Correct behavior:** After 2 consecutive failed polls, the live pulse indicator is replaced with a warning icon and tooltip: "Live data unavailable — showing last known value."

---

## 9. Non-Functional Requirements

### Performance
- Page load (stats tiles + first 25 table rows visible): < 2 seconds.
- Filter/search update: < 300ms (client-side filter on already-loaded data).
- Status toggle → API response → UI update: < 1 second.
- "Users in Flows" live tile poll interval: every 30 seconds.

### Scale
- Table must handle stores with 500+ flows without layout degradation. Pagination is mandatory; rendering 500 rows at once is not acceptable.
- Search runs client-side on the current page's loaded data. For stores with > 500 flows, server-side search must be used.

### Security
- `Delete` and `Archive` require write permissions. Overflow menu hides these items for read-only users.
- Status toggle requires write permissions. Toggle is visually disabled (not hidden) for read-only users, with a tooltip: "You don't have permission to change flow status."
- Export CSV requires read permissions (all marketers). File is generated server-side — the frontend does not bundle all data in memory.

### Reliability
- If the stats API is unavailable, the table still loads. Stats tiles show "—" independently.
- If the Growth Engine / Rishi recommendations API is unavailable, those sections do not render. The page is fully functional without them.
- Status toggle failure must not affect the rest of the row — other actions (Edit, Analytics) remain available.

---

## 10. Analytics & Instrumentation

### Events

| Event | Trigger | Properties |
|-------|---------|-----------|
| `flows_page_viewed` | Page load | `flow_count`, `active_flow_count`, `has_critical_health` |
| `flows_filter_applied` | Any filter change | `filter_type` (status/stage/search), `result_count` |
| `flows_status_toggled` | Toggle clicked | `flow_id`, `from_status`, `to_status`, `result` (success/failure) |
| `flows_action_triggered` | Overflow menu item clicked | `flow_id`, `action` (edit/analytics/duplicate/rename/archive/delete/test) |
| `flows_flow_opened` | Flow name clicked | `flow_id`, `entry_point` (name_click/edit_action) |
| `flows_export_triggered` | Export CSV clicked | `row_count`, `active_filters` |
| `flows_create_clicked` | Create Flow button clicked | — |
| `flows_ai_assist_submitted` | AI Assist prompt submitted | `prompt_length`, `used_chip` (boolean) |
| `flows_growth_card_clicked` | Growth Engine CTA clicked | `tier` (START/IMPROVE/SCALE), `flow_type` |
| `flows_rishi_alert_actioned` | Rishi alert CTA clicked | `action` (fix_now/view_analytics/dismissed) |
| `flows_stats_date_changed` | Date range selector changed | `range` |

### Reporting Metrics

| Metric | Definition | Where it surfaces |
|--------|-----------|-------------------|
| List-to-builder rate | `flow_opened / page_views` | Flows usage dashboard |
| Toggle success rate | `toggle_success / toggle_triggered` | Reliability dashboard |
| AI Assist engagement rate | `ai_assist_submitted / page_views` | AI feature adoption |
| Growth card click rate | `growth_card_clicked / page_views` | Growth Engine effectiveness |

---

## 11. Copy

### Empty States

> **No flows yet**
> Create your first automated flow to start guiding customers through personalised journeys.
> [Create Flow →]

> **No flows match your filters**
> Try adjusting your search or filters. [Clear all filters]

---

### Status Labels

| Status value | Label | Colour |
|---|---|---|
| `active` | Live | Green |
| `draft` | Draft | Slate |
| `paused` | In Progress | Amber |
| `completed` | Completed | Blue |
| `inactive` | Inactive | Grey |

---

### Confirmation Dialogs

> **Pause [Flow Name]?**
> No new users will enter this flow. Users already in-journey will complete their current step.
> [Cancel] [Pause Flow]

> **Delete [Flow Name]?**
> This will permanently delete the flow and all its data. This cannot be undone.
> [Cancel] [Delete]

> **Delete [Flow Name]?** *(when flow is active)*
> This flow is currently live. Deleting it will stop all in-journey users immediately.
> [Cancel] [Delete]

---

### Draft publish validation

> **This flow isn't ready to go live**
> Before activating, complete the following:
> — [Missing item 1]
> — [Missing item 2]
> [Finish setup →]

---

### Errors

> Failed to pause [Flow Name]. Try again. [Retry]

> Failed to activate [Flow Name]. Try again. [Retry]

> Failed to load flows. Check your connection. [Retry]

> Live data unavailable — showing last known value. *(stats tile tooltip)*

---

## 12. Dependencies

| Dependency | What is needed | If unavailable | Graceful degradation |
|------------|---------------|---------------|---------------------|
| Flows list API | All flow rows, names, statuses, performance | Table shows error state | Stats tiles and other sections still load |
| Stats aggregate API | Tile values by date range | Tiles show "—" with retry | Table unaffected |
| Pause/Resume API | Status toggle from list | Toggle reverts; error shown inline | Rest of row and table unaffected |
| Delete API | Permanent delete from overflow menu | Error toast; row unchanged | Other actions unaffected |
| Growth Engine API | Recommendation cards | Section does not render | Page functional without it |
| Rishi alerts API | Alert strip content | Strip does not render | Page functional without it |
| AI conversation panel | AI Assist, "Fix now", Growth Engine CTAs | CTA shows error toast | Rest of page unaffected |
| Export service | CSV generation | Action shows error | Rest of page unaffected |

---

## 13. Out of Scope

| Exclusion | Reason | What unlocks it |
|-----------|--------|----------------|
| Bulk actions (bulk pause, bulk delete, bulk archive) | Requires multi-select interaction pattern and bulk processing backend. | Bulk operations PRD. |
| Sorting on table columns | Column sorting requires backend sort support at scale; client-side sort on 500+ rows is not acceptable. | Backend sort API + separate spec. |
| Flow health threshold configuration | What defines "critical" vs "warning" is currently hardcoded. Store-configurable thresholds require a settings surface. | Settings PRD. |
| Archived flows list | Archive action exists but there is no view to see/restore archived flows. | Archive management PRD. |
| Folder / group organisation for flows | No grouping mechanism exists. | Flow organisation PRD. |
| Flow versioning / rollback | No version history. | Versioning PRD. |

---

## 14. Open Questions

| Question | Why it's open | Owner | What resolves it |
|----------|-------------|-------|-----------------|
| Should the AI Flow Assist block, Rishi AI Analytics Zone, and Growth Engine be rendered on the V2 Flows page, or only on V1? | They are built in V2 but not rendered. V2 currently shows only stats + table. No decision recorded in code. | Product | Explicit product decision on whether V2 consolidates all V1 sections or deliberately simplifies the page. |
| What is the correct status label for `paused` — "Paused" or "In Progress"? | V2 uses "In Progress" for a paused flow, which is confusing — a paused flow is not in progress. V1 does not have this label at all. | Product + Design | Copy decision. |
| Should activating a `draft` flow (via the list toggle) be allowed without opening the builder? | Currently undefined. The toggle only calls pause/resume; a draft flow has no publish pathway from the list. | Engineering + Product | Decision on first-publish flow from list view. |
| What are the thresholds for health dot colours? | `critical`, `warning`, `healthy` are hardcoded on the data — there is no business rule documented anywhere. | Engineering + Product | Documented threshold definition (e.g. delivery rate < 60% = critical, < 80% = warning). |
| How many Growth Engine cards should appear, and are they dynamic or static? | Currently 3 hardcoded cards. Whether these come from an API (personalised) or are static templates is not defined. | Engineering + Product | API spec for Growth Engine recommendations. |
| Does "Users in Flows" tile require a WebSocket or is polling acceptable? | Currently no live connection is implemented. The `live` pulse indicator is cosmetic. | Engineering | Infrastructure decision on real-time vs polling. |

---

## 15. Decision Log

| Decision | Alternatives considered | Rationale | Tradeoff accepted |
|----------|------------------------|-----------|------------------|
| V2 as canonical, V1 deprecated | Maintain both routes | Two pages with diverging feature sets create maintenance debt and confusion for users with bookmarked URLs. V2 has the richer table (channels, spent, audience type) and is the active development target. | V1 users need a redirect. Any V1-only features (AI Assist block, Rishi strip, Growth Engine) need an explicit decision on whether to include in V2. |
| Status toggle in the table calls the pause/resume API | Toggle is cosmetic only (local state) | A toggle that appears to work but doesn't persist is worse than no toggle. A marketer who pauses a failing flow from the list and then sees it still running will lose trust in the product. | API latency on toggle. Handled with optimistic UI + revert on failure. |
| Per-row Edit and Analytics as inline icon buttons (not buried in overflow menu) | All actions in overflow only | Edit and Analytics are the two most-used row actions by a wide margin. Burying them in overflow adds an extra click to the most common task. | More visual weight in the actions column. Acceptable given the column is rightmost. |
| Pagination over infinite scroll | Infinite scroll | Infinite scroll on a table of flows (with complex columns) causes DOM and performance issues at 200+ rows. Pagination gives the user a clear mental model of the dataset size. | Extra click to see next page. |
