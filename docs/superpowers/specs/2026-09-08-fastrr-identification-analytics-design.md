# Fastrr Identification analytics tab — design

Status: approved for implementation planning
Source brief: `fastrr-identification-analytics-claude-code-prompt.md` (pasted PRD)

## 1. Objective

Add a new tab, **"Fastrr Identification"**, to the existing Analytics page
(`src/pages/Analytics.jsx`), positioned between **Journey** and **Reports**.
It is a coded, interactive prototype backed by deterministic mock data —
no backend integration — that reports on Fastrr's shopper-identification +
checkout-autofill product: how much traffic gets identified, what happens
to identified sessions through to a sale, and how identified users compare
to known/anonymous users.

This is one self-contained subsystem (one new tab), not multiple
sub-projects — the "decompose into sub-projects" step from the brainstorming
process doesn't apply; the phasing that does apply is internal to the
implementation plan (see §8).

## 2. Where it plugs into the existing app

- `src/pages/Analytics.jsx`: `TABS` gains one entry —
  `{ value: "fastrr-identification", label: "Fastrr Identification" }` —
  between the `journey` and `reports` entries. Rendered as
  `{activeTab === "fastrr-identification" && <FastrrIdentificationTab />}`,
  same pattern as `OverviewTab`/`CommunicationLogsTab`.
- No route changes: `/analytics/:tab` already resolves any tab value.
- No new top-level nav entry — this lives inside the existing Analytics
  page exactly like every other tab.

## 3. Directory layout

```
src/components/analytics/fastrr/
  FastrrIdentificationTab.jsx        — owns filter state, scroll container, section order
  FastrrFilterBar.jsx                — date preset + compare toggle + channel filter (sticky)
  AnchorNav.jsx                      — sticky slim bar, scroll-spy + smooth-scroll
  sections/
    HeroBandSection.jsx              — §1 identification snapshot + benchmark
    IdentificationFunnelSection.jsx  — §2 funnel + drop-off breakdown
    EngagementSection.jsx            — §3 sent/delivered/read/clicked, channel-wise
    ConversionRoiSection.jsx         — §4 orders/revenue/AOV/ROI, top journeys table
    SegmentComparisonSection.jsx     — §5 known vs identified vs anon + extras
    SmartCardSection.jsx             — §6 autofill deep-dive
    TrendsSection.jsx                — §7 2x2 line-chart grid
    SourceBreakdownSection.jsx       — §8 identification source + device split
  shared/
    FunnelChart.jsx                  — connected tapering-bar funnel (same-denominator only)
    GroupedBarChart.jsx              — generic multi-series grouped bar (never stacked)
    AttributionPair.jsx              — "Last-Click: ₹X | First-Click/Open: ₹Y", side by side
    MetricTooltip.jsx                — formula tooltip: name / formula / plain-English line
    PoweredByLabel.jsx               — muted "Powered by [source]" microcopy
    SectionSkeleton.jsx              — shimmer placeholder matching a section's grid shape
    SectionEmptyState.jsx            — centered "No data for this range/channel yet…" message
  data/
    mockFastrrIdentification.js      — the one generator, `getFastrrIdentificationAnalytics(filters)`
```

Reused as-is from `src/components/analytics/overview/`: `MetricCard`,
`SplitBarChart`, `ComparisonLineChart`. Reused from `src/lib/analyticsFormat.js`:
`formatCompactCurrency`, `formatCompactNumber`, `formatDelta` — extended
with `formatPercent(value, digits=1)` and `formatSeconds(value)` (needed
for §6's checkout-time comparison), added to the same file rather than a
parallel one.

## 4. Filter state (section-local, per user decision)

`FastrrIdentificationTab` owns:
```js
{ datePreset, customRange, compare: boolean, channel }
```
- `datePreset`/`customRange`: same preset set as `TimeRangeFilter`
  (today, yesterday, last_7_days, this_month, last_month, custom).
- `compare`: "Compare to previous period" toggle — when off, delta chips
  are hidden (nothing to compare against), not rendered as `0%`.
- `channel`: All / WhatsApp / Email / SMS / RCS / AI Calling — single-select
  chip row, same visual language as `Audience.jsx`'s filter chips.

This is independent of the page-level `TimeRangeFilter` already at the top
of `Analytics.jsx` (used by Overview) — same precedent as
`CommunicationLogsTab`, which manages its own filters entirely separately
from the page-level control. This is a deliberate, accepted deviation from
reading the PRD's "global filter bar" as page-wide; here it is scoped to
this tab's content, exactly like the Communication Logs tab's filter bar
is scoped to that tab.

The filter bar + anchor nav are both `sticky` and stack directly under
each other, under the outer page's own header/tabs.

## 5. Data generation (`mockFastrrIdentification.js`)

One function, `getFastrrIdentificationAnalytics(filters)`, deterministic
(cycles off fixed pools keyed by `datePreset`+`channel`, no `Math.random`/
`Date.now`, following `mockCommunicationLogs.js`'s convention) returning a
single object with one key per section (`hero`, `funnel`, `engagement`,
`conversionRoi`, `segmentComparison`, `smartCard`, `trends`,
`sourceBreakdown`) plus `topIdentifiedUsers` and `repeatCohort` for the two
accepted extras.

**Internal consistency is load-bearing**, not cosmetic:
- `hero.identifiedSessions` === `funnel.stages[1].count` (both sections
  read off the same base number for the given filters).
- `funnel` stages are **all computed against the same denominator**
  (Total Sessions) so the connected funnel visual is valid per the PRD's
  caution in §2. A code comment marks this decision point:
  `// TODO: confirm all funnel stages share a common denominator before enabling connected funnel visual`
  so it's easy to find when real data is wired in.
- One specific, documented combo —
  `channel: "AI Calling"` + `datePreset: "today"` — deterministically
  returns empty arrays/zeroed sections, so `SectionEmptyState` is actually
  reachable in the running prototype, not dead code.

**"Powered by" sources** are placeholder strings per section
(e.g. "Powered by Fastrr SDK", "Powered by WhatsApp delivery webhook",
"Powered by Shiprocket order sync"), each marked
`// TODO: confirm source system` at its definition site, per the PRD.

**ROI cost assumptions**: WhatsApp/Email/SMS/RCS use a flat assumed
cost-per-message constant; AI Calling uses a per-minute rate — both
labeled `(estimated)` in the UI and flagged
`// TODO: confirm real per-channel cost inputs, especially AI Calling (per-minute billing, not per-message)`.

## 6. Section-by-section notes (delta from the PRD only — full spec is the pasted brief)

- **§1 Hero**: Total/Identified/Identification Rate via `MetricCard`;
  benchmark card is bespoke (three numbers + conditional purple callout
  line — only rendered when "Your Store" beats both comparisons, per PRD);
  GMV via `AttributionPair`; freshness note as small muted text.
- **§2 Funnel**: `FunnelChart` (tapering bars, count + stage-to-stage %
  under each) for the 5-stage connected funnel; drop-off-by-page as a
  horizontal bar (`SplitBarChart`-style, single series).
- **§3 Engagement**: funnel card (Sent→Delivered→Read→Clicked) with Read
  Rate/CTR computed inline; `GroupedBarChart` across WA/Email/SMS/RCS/AI
  Calling; AI Calling rendered as its own small
  `Calls Placed → Connected → Completed → Action Taken` funnel card
  *beneath* the grouped chart, not as empty bars inside it.
- **§4 Conversion & ROI**: `GroupedBarChart` for Orders/Revenue/AOV/ROI;
  ROI formula shown as visible text under the chart title (not
  tooltip-only); `AttributionPair` again (same two numbers, no third
  model); Top Journeys table — new lightweight `SortableTable`-style
  component (client-side sort, click column header, default sort
  Revenue→Triggers, capped at 10 rows, "view all" is a disabled stub
  link); trigger-wise horizontal bar (Product View/ATC/Cart
  Abandon/Other).
- **§5 Segment Comparison**: three side-by-side cards (Known / Fastrr-
  Identified / Anonymous), each leading with **rates** (repeat rate,
  engagement rate) and showing raw counts small/secondary underneath, per
  PRD; growth-over-time line (`ComparisonLineChart`-style, anon→identified
  conversion trend); **+ extras**: `TopIdentifiedUsersSection`-style
  mini-table (name, identified-on, LTV, "View in Audience" — a disabled
  stub link for now, since a real deep-link into the Audience page's new
  filter is a separate follow-up) and a repeat-purchase cohort line
  (W0–W4 repeat rate, Fastrr-Identified vs Known).
- **§6 Smart Card**: autofill trigger rate + acceptance rate as
  `MetricCard`s; per-field edit-rate table (Name/Phone/Address/Pincode);
  checkout time-to-complete bar (Smart-Card-assisted vs manual, seconds
  via `formatSeconds`); conversion-rate comparison given visual priority
  (first item / larger card, per PRD); drop-off-per-step grouped bar
  (with vs without Smart Card).
- **§7 Trends**: 2×2 grid at 1440px — Identification Rate,
  Sent/Delivered/Read/Clicked (multi-line), Orders & Revenue (dual-axis),
  Repeat Orders. Each chart: day/week granularity toggle (local state per
  chart) + %-change chip rendered on the chart itself.
- **§8 Source Breakdown**: horizontal bar, sources fixed exactly to
  `Smart Card, Checkout, Pop-up, Cookie, Signup`, sorted descending by
  volume, % of total identified sessions; device/platform grouped bar
  (Web Desktop / Web Mobile / App, or just Desktop/Mobile if no app
  traffic — mock data includes app traffic so all three render).

## 7. Loading / empty states

- Filter changes set `isLoading=true` for ~400ms (synthetic — real data
  fetch will replace this) before the memoized data recomputes, so
  `SectionSkeleton` (shimmer, shaped per-section) is actually visible in
  the demo rather than an instant swap. Skeleton, not a full-page spinner.
- `SectionEmptyState` renders per-section (not full-page) whenever that
  section's underlying data is empty for the current filters — reachable
  via the documented AI Calling + Today combo (§5).

## 8. Testing plan

- `data/__tests__/mockFastrrIdentification.test.js` — pure unit tests:
  cross-section consistency (hero vs funnel identified count), funnel
  stages share one denominator, benchmark callout only appears when ahead
  on both comparisons, the empty-data combo actually returns empty.
- `FastrrIdentificationTab.test.jsx` — renders all 10 sections; anchor nav
  click smooth-scrolls (mock `scrollIntoView`) and highlights active
  section; filter bar change triggers skeleton then resolved content;
  empty-state renders for the documented combo; "view all"/"View in
  Audience" stub links are disabled, not navigable.
- Section components get focused tests only where they have real logic
  (funnel %s, table sort, granularity toggle) — presentational-only
  sections don't need dedicated test files, matching this repo's existing
  density (e.g. `RoiCard`/`SplitBarChart` have no dedicated test files
  today; `CommunicationLogsTab`/`LogsFilterBar` do, because they have
  logic).

## 9. Acceptance checklist (PRD's own checklist, kept verbatim + carried through)

- [ ] No tabs/sub-tabs inside this tab's content — single scroll + anchor nav only
- [ ] Section-local filter bar affects all 8 core sections + 2 extras
- [ ] Every section has a visible "Powered by [source]" label
- [ ] Every attribution-touching number shows Last-Click and First-Click/Open side by side, no toggle
- [ ] §2 funnel does not connect stages with mismatched denominators via arrows (mock data guarantees a common denominator; TODO comment left for real-data wiring)
- [ ] §8 identification source breakdown uses exactly: Smart Card, Checkout, Pop-up, Cookie, Signup
- [ ] AI Calling has its own funnel shape in §3, not forced into Sent/Delivered/Read/Clicked
- [ ] All channel comparisons use grouped bars, not stacked
- [ ] §5 segment comparison leads with rates, not raw counts
- [ ] Loading and empty states implemented per section, not a single full-page spinner/blank
- [ ] New tab inserted between Journey and Reports, no route changes needed
- [ ] Top Identified Users mini-table and repeat-purchase cohort curve present in §5 (coverage/health strip explicitly rejected — not built)

## 10. Explicitly out of scope

- Coverage/health strip (rejected).
- Real backend data integration (this is a mock-data prototype per the PRD).
- Mobile breakpoint (desktop-only, 1440px, per PRD).
- A real deep-link from "View in Audience" into the Audience page's
  "Fastrr Identified New User" filter — stub link only for now.
