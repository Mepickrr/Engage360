# Analytics page shell + Overview tab — design

## Context

`/analytics` (`src/pages/Analytics.jsx`) currently renders an unrelated generic mock KPI page. We're rebuilding it into a real 4-tab analytics dashboard: **Overview, Campaign, Journey, Reports**, matching wireframes provided by the user. This spec covers **the shared page shell (tabs + time filter) and the Overview tab only**. Campaign, Journey, and Reports get their own specs later; for now they render a "Coming soon" placeholder so the tab bar is complete.

All content is dummy/mock data — there is no backend integration in this phase.

Naming: every instance of "Bik" in the wireframes is renamed to **"Fastrr"** (e.g. "Fastrr Revenue", "Fastrr Orders", "Fastrr Customers Acquired", "Fastrr Revenue split by"). No references to "Avimee" — mock identifiers (phone numbers, emails, store names) are generic placeholders, not tied to any real brand.

## Routing & shell

- `App.js`: `/analytics` redirects to `/analytics/overview`. Add sibling routes `/analytics/overview`, `/analytics/campaign`, `/analytics/journey`, `/analytics/reports`, all rendered inside the `Analytics.jsx` shell (nested routes) so the tab bar and time filter persist across tab switches — only the tab content swaps.
- `src/pages/Analytics.jsx`: shell only. Renders:
  - Header: page title + the 4-tab nav (`AnalyticsTabs.jsx`) on the left, `TimeRangeFilter.jsx` on the right.
  - Below: an `<Outlet />` (or equivalent) rendering the active tab's component.
- `src/components/analytics/AnalyticsTabs.jsx`: simple tab nav, active tab driven by the current route (`useLocation`/`NavLink`), not local state — so direct links to `/analytics/journey` etc. work.
- Campaign/Journey/Reports: a shared `src/components/analytics/ComingSoonPanel.jsx` (reuses the existing `PreviewHeader` + `previewToast` pattern already used for other unbuilt Phase-3 pages), parametrized by tab name.

## Time-range filter

- `src/components/analytics/TimeRangeFilter.jsx`: dropdown button matching the visual style of the existing time-filter in `AnalyticsTopbar.jsx` (border button, chevron, popover list).
- Options: `Today, Yesterday, Last 7 Days, This Month, Last Month, Custom Range`. Default: **Last 7 Days**.
- Selecting a preset sets `timeRange` state (lifted to `Analytics.jsx`, passed to the active tab) to one of: `today | yesterday | last_7_days | this_month | last_month`.
- Selecting **Custom Range** opens a popover with the existing `src/components/ui/calendar.jsx` (react-day-picker) for picking a from/to date. Since all data is mock, confirming a custom range just sets `timeRange` back to `last_7_days` under the hood (closest approximation) — no real date filtering logic in this phase.
- The filter component itself has no knowledge of which tab is active; it's purely `{ value, onChange }`.

## Mock data

New file: `src/data/mockOverviewAnalytics.js`, keyed by preset (`today`, `yesterday`, `last_7_days`, `this_month`, `last_month`). Each entry shaped as:

```js
{
  revenue: {
    overall: { value, deltaPct, deltaAbs },
    fastrr:  { value, deltaPct, deltaAbs, pctOfOverall },
  },
  orders: {
    overall: { value, deltaPct, deltaAbs },
    fastrr:  { value, deltaPct, deltaAbs, pctOfOverall },
  },
  roi: {
    value,               // e.g. 10.85 ("X")
    totalRevenue,
    totalCost,
    byChannel: { whatsapp, email, instagram, sms, rcs, aiCalling, aiChatbot }, // each an X value
  },
  revenueSplit: {
    byService: [{ label: "Broadcast" | "Journey", value }],
    byChannel: [{ label: "WhatsApp" | "SMS" | "RCS" | "Email" | "Instagram" | "AI Calling" | "AI Chatbot", value }],
  },
  ordersSplit: {
    byService: [...],  // same shape as revenueSplit.byService
    byChannel: [...],  // same shape as revenueSplit.byChannel
  },
  revenueTrend: [{ date, overall, fastrr }],   // one point per day in range
  ordersTrend:  [{ date, overall, fastrr }],

  customersAcquired: {
    overall: { value, deltaPct, deltaAbs },
    fastrr:  { value, deltaPct, deltaAbs },
    bySource: [{ source: "Campaigns" | "Journeys" | "Data upload", count }],
  },
  customersTrend: [{ date, overall, fastrr }],
}
```

`last_7_days` uses numbers matching the wireframe (₹2.1C overall revenue, ₹36.1L Fastrr revenue, 17.0%, etc.). Other presets get plausible varied numbers (not zeroed out) generated at a smaller/larger scale as appropriate (e.g. `today`/`yesterday` single-day scale, `this_month`/`last_month` larger scale).

A helper `getOverviewAnalytics(timeRange)` returns the entry for a preset, falling back to `last_7_days`.

## Overview tab components (`src/components/analytics/overview/`)

- **`OverviewTab.jsx`** — top-level layout, arranges all sections per the wireframe grid (2-column layout on wide screens, stacking on narrow).
- **`MetricCard.jsx`** — label + info-tooltip icon, big value, delta pill (arrow + % + absolute change vs previous period). Used for Overall/Fastrr Revenue, Overall/Fastrr Orders, Overall/Fastrr Customers Acquired. Takes an optional `subBadge` (e.g. "17.0%" pill showing % of total) for the Fastrr variants.
- **`RoiCard.jsx`** — big "X" value + "Total Revenue Generated" / "Total Cost" lines + a per-channel mini-grid (WhatsApp, Email, Instagram, SMS, RCS, AI Calling, AI Chatbot), each showing an "X" value.
- **`SplitBarChart.jsx`** — reusable horizontal bar chart with a **Service | Channel** toggle (segmented control), used for both "Fastrr Revenue split by" and "Fastrr Orders split by" sections. Takes `{ byService, byChannel, valueFormatter }` props.
- **`ComparisonLineChart.jsx`** — reusable Recharts `LineChart` plotting `overall` vs `fastrr` series over `date`, used for the Revenue, Orders, and Customers Acquired trend sections. Takes `{ data, seriesLabels, valueFormatter }`.
- **`CustomersAcquiredSection.jsx`** — composes two `MetricCard`s + a horizontal bar breakdown (`bySource`) + a `ComparisonLineChart` for the customers trend.

All charts use Recharts (already a project dependency, consistent with `FlowAnalytics.jsx` / current `Analytics.jsx`).

## Formatting

- Currency values formatted Indian-style with suffixes: `₹2.1C`, `₹36.1L`, `₹95,518` etc.
- Count values formatted with `K` suffix where relevant: `24.55K`, `3.75K`.
- Delta pills: green + up-arrow for positive, red + down-arrow for negative (consistent with existing `KpiTile` delta tone convention in `PreviewHeader.jsx`).

## Out of scope (this spec)

- Campaign, Journey, Reports tab content (separate specs).
- Real backend/API integration — everything is mock data.
- Real date-range filtering logic for Custom Range — approximated as described above.
- Any changes to shared builder files (`flowMeta.js`, node components) — this feature introduces its own local channel metadata (label/color/icon) for Instagram, AI Calling, and AI Chatbot where `CHANNEL_META` in `flowMeta.js` doesn't already cover them, scoped inside `src/components/analytics/overview/`, to avoid touching the shared builder file per the v1/v2 boundary rule in CLAUDE.md.

## Testing

- `data-testid` conventions consistent with the rest of the app (e.g. `analytics-tab-overview`, `analytics-metric-revenue-overall`, `analytics-roi-card`, `analytics-split-revenue`, `analytics-trend-revenue`).
- A smoke test asserting the shell renders all 4 tabs, defaults to Overview, and that switching tabs updates the route and content.
