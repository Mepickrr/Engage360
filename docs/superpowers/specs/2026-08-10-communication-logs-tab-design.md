# Communication Logs tab — design

## Context

The Analytics page (`src/pages/Analytics.jsx`) is a 4-tab shell: Overview (built), Campaign/Journey/Reports (placeholder `ComingSoonPanel`). This adds a 5th tab, **Communication Logs**, showing every outbound communication (Campaign or Journey send) as a filterable, sortable, searchable log table — the standard "message log" view sellers expect from a comms platform.

This is a self-contained UI feature: dummy data only, no backend/API integration. It establishes the shape of the real feature for when the backend is ready.

## Non-goals

- No live API integration — data is a static, deterministically generated mock dataset.
- No export/download of logs.
- No bulk actions (resend, etc.) on log rows.
- No new generic/reusable `DataTable` abstraction — this is the first and only consumer of a log-table UI today (Reports tab is still a placeholder); building a generic abstraction now would be premature.

## Placement & routing

- `src/pages/Analytics.jsx`: add `{ value: "logs", label: "Communication Logs" }` to the `TABS` array (after Reports), and a matching render branch:
  ```jsx
  {activeTab === "logs" && <CommunicationLogsTab />}
  ```
- No new route — this rides the existing `/analytics/:tab` param already handled in `App.js`.
- Follows the same wiring pattern already used for `OverviewTab`; unlike Overview it does not consume the shared `timeRange` picker at the page level — the tab has its own Sent Timestamp date-range filter, scoped to the log data only (matching the fact that a "date range for the whole page" and "date range to filter which log rows show" are different controls the seller would use differently).

## Files

All new files live under `src/components/analytics/logs/`:

```
src/components/analytics/logs/
  CommunicationLogsTab.jsx      # container: state, data derivation, layout
  LogsFilterBar.jsx             # search input + filter popovers + active filter chips
  LogsTable.jsx                 # table rendering, sortable headers, empty state
  LogDetailDrawer.jsx           # Sheet showing full row detail
  data/mockCommunicationLogs.js # 150-row deterministic dummy dataset
  __tests__/
    CommunicationLogsTab.test.jsx
    LogsFilterBar.test.jsx
    LogsTable.test.jsx
```

## Data model

Each log row (`mockCommunicationLogs.js` exports `COMMUNICATION_LOGS: LogRow[]`):

```ts
{
  id: string,                // stable row id, e.g. "log-0001"
  sentAt: string,            // ISO timestamp
  engageId: string,          // e.g. "ENG-48213"
  phone: string | null,      // e.g. "+91 98765 43210"
  email: string | null,
  type: "Campaign" | "Journey",
  templateName: string,
  channel: "WhatsApp" | "Email" | "SMS" | "RCS" | "AI Calling",
  senderPhone: string | null,   // populated for WhatsApp/SMS/RCS/AI Calling
  senderEmail: string | null,   // populated for Email
  deliveryStatus: "Sent" | "Delivered" | "Read" | "Failed" | "Bounced" | "Pending",
  aiCallDurationSec: number | null,  // populated only when channel === "AI Calling" and status is a terminal state
  errorResponse: string | null,      // populated only when deliveryStatus is "Failed" or "Bounced"
  updatedAt: string,          // ISO timestamp, >= sentAt
}
```

**Generation rules** (deterministic — index-cycled through fixture arrays, no `Math.random`/`Date.now`, so output is stable across renders and safe for test snapshots):

- 150 rows, `sentAt` spread across the last 30 days.
- `channel` cycles through all 5 channels; `type` alternates Campaign/Journey.
- `phone` populated when channel is WhatsApp/SMS/RCS/AI Calling; `email` populated when channel is Email. (A row has exactly one of phone/email as its "contact", matching how a single send only goes to one address type.)
- `deliveryStatus` distribution weighted toward success (Delivered/Read/Sent) with a realistic minority of Failed/Bounced/Pending, per channel.
- `errorResponse`, when status is Failed/Bounced, drawn from a **channel-specific** fixture list:
  - WhatsApp: "Rate limit hit", "Health Ecosystem issue", "Template not approved", "User opted out"
  - SMS: "DND Provider level block", "Invalid number"
  - Email: "Mailbox full", "Spam block"
  - RCS: "Device not RCS-capable", "Agent not verified"
  - AI Calling: "No answer", "Call declined", "Number unreachable"
- `aiCallDurationSec` populated (30–600s) only for AI Calling rows with a terminal status (Delivered/Read → treated as "Completed" for display purposes; Failed → 0 or null depending on error).
- `updatedAt` = `sentAt` + a small deterministic offset (seconds to a few hours later).

## Components

### `CommunicationLogsTab.jsx`

Owns all UI state:
- `search` (string), `dateRange` ({from, to} | preset), `typeFilter` (Set), `channelFilter` (Set), `statusFilter` (Set), `errorFilter` (Set), `sort` ({field: "sentAt"|"updatedAt", dir: "asc"|"desc"}), `page` (number), `selectedRow` (LogRow | null, drives the drawer).

Derivation, via `useMemo` chained off the raw dataset:
1. Apply date range filter on `sentAt`.
2. Apply type/channel/status/error filters (each is a Set; empty Set = no filter applied for that facet).
3. Apply search — case-insensitive substring match against `engageId`, `phone`, `email`, `templateName` (any one matching includes the row).
4. Apply sort.
5. Slice to the current page (25 rows/page, via `ui/pagination.jsx`).

Facet counts shown in `LogsFilterBar` are computed off the dataset *after* all filters except the facet's own are applied (standard faceted-search behavior — so checking a Type doesn't hide the count of channels that no longer apply, but narrows by everything else already chosen).

Renders: heading/row-count summary → `LogsFilterBar` → `LogsTable` → `Pagination` → `LogDetailDrawer` (conditionally, when `selectedRow` is set).

### `LogsFilterBar.jsx`

- Search `Input` (icon-prefixed, matches `Audience.jsx` styling), debounced ~250ms.
- Sent Timestamp: `Popover` with the same preset list as `TimeRangeFilter` (Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month, Custom Range → `Calendar mode="range"`).
- Type / Communication Channel / Delivery Status: `Popover` + `Checkbox` list, each option showing a live count; a search-within-facet box is unnecessary given the small fixed option counts (2, 5, 6 respectively).
- Error Response: same `Popover` + `Checkbox` pattern, but options are the *distinct error strings present in the currently filtered data* (not a fixed list) with counts; the control is disabled (with a tooltip: "No errors in current results") when zero visible rows have an error.
- Active filters (everything except an empty search box) render as removable chips below the bar, plus a "Clear all" action — mirrors `Audience.jsx`'s filter-chip row.

### `LogsTable.jsx`

Built on the shadcn `Table` primitive (`ui/table.jsx`). Columns, left to right:

| Column | Notes |
|---|---|
| Sent Timestamp | sortable |
| Engage ID | |
| Contact | phone or email, whichever is populated |
| Type | badge |
| Template Name | truncated with tooltip |
| Channel | badge + icon |
| Delivery Status | colored `Badge` (green=Delivered/Read, gray=Sent/Pending, red=Failed/Bounced) |
| Error Response | truncated with tooltip; em-dash when null |
| Last Update Time | sortable |

`Sender Phone Number`, `Sender Email`, and `AI Call Duration` are **not** table columns — with 13 total fields, a scannable log row needs to stay to the fields a seller scans first; the rest live in the detail drawer. Clicking any row (except when clicking inside an interactive cell, if any) opens `LogDetailDrawer` for that row.

Sortable headers: click toggles asc/desc, with an up/down chevron indicator; only "Sent Timestamp" and "Last Update Time" are sortable, per spec — other headers are static labels.

Empty state: when the filtered set is empty, show a centered message ("No logs match your filters") with a "Clear all filters" action, instead of an empty table.

### `LogDetailDrawer.jsx`

`Sheet` (right-side) opened via `selectedRow`. Renders all 13 fields as label/value pairs, in the same field order as the PRD's field list. `AI Call Duration` row is omitted entirely when the channel isn't AI Calling (rather than shown as "—"), since it's not a meaningful field for other channels.

## Testing

Following the existing convention (e.g. `WhatsAppNode/__tests__/FallbackTemplateSection.test.jsx`), add RTL tests per component:

- `LogsFilterBar.test.jsx`: selecting a facet option updates the active-filter chips; "Clear all" resets state; Error Response facet is disabled when no errors are visible.
- `LogsTable.test.jsx`: renders rows from a fixed fixture; clicking a sortable header toggles order; row click invokes the row-select callback; empty array renders the empty state.
- `CommunicationLogsTab.test.jsx`: integration — typing in search narrows visible rows; combining a channel filter + status filter narrows further; pagination shows the correct row count/page controls for 150 rows at 25/page.

## Open items resolved during brainstorming (for reference)

- Tab label: **"Communication Logs"** (not bare "Logs").
- Dataset size/paging: **150 rows, 25/page, standard pagination**.
- Long/conditional fields: **truncate + tooltip in-row, full detail in a click-to-open drawer**.
- Delivery status set: **Sent, Delivered, Read, Failed, Bounced, Pending**.
- Error Response filter: **faceted checklist of distinct error strings present in the current data, with counts** (not a fixed category list, not free-text search).
- Structural approach: **scoped `analytics/logs/` folder using existing-but-unused shadcn primitives** (`table`, `pagination`, `popover`, `checkbox`, `sheet`, `badge`, `calendar`) — no new generic DataTable abstraction.
