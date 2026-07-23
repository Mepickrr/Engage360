# Segment Homepage Redesign — Design Spec

**Date:** 2026-07-23
**Status:** Draft
**Scope:** `src/pages/Segments.jsx` (full rebuild) + new components under `src/components/segments/home/` + new mock data module `src/data/segmentsHomeData.js`. Extends (does not replace) `src/data/segmentsData.js`, which remains the CRUD store for real user-created segments.

---

## 1. Summary

Replace the current flat-table `Segments.jsx` page with a tabbed dashboard matching the provided wireframes:

- A top bar with **+ New Segment** (opens a creation-method modal) and a search box.
- A KPI strip (reused from the current page).
- An "Opportunities to grow revenue" card carousel, shared across all tabs.
- Five top-level tabs: **All segments** (default) · **Fastrr Signals** · **Custom segments** · **Shopify segments** · **Suppression assets**.
- All naming avoids "BIK" (→ **Fastrr**) and "Avimee" (→ **SStore**).

No backend integration — this is a frontend-only mock, consistent with the rest of the segments feature (`segmentsData.js` has no real persistence either).

---

## 2. File layout

- **Rewritten:** `src/pages/Segments.jsx` — page shell: top bar, KPI strip, opportunity carousel, tab bar, tab routing (local state, not URL-routed).
- **New:** `src/components/segments/home/`
  - `NewSegmentModal.jsx` — creation-method picker (filters vs CSV).
  - `ImportSegmentCsvModal.jsx` — CSV upload modal (opened from `NewSegmentModal`).
  - `OpportunityCarousel.jsx` — the "Opportunities to grow revenue" card row with `< >` nav.
  - `SegmentCard.jsx` — shared presentational card (icon, name, updated time, description, footer stat/badges, optional `⋮` menu) used by every tab's grid.
  - `AllSegmentsTab.jsx`, `FastrrSignalsTab.jsx`, `CustomSegmentsTab.jsx`, `ShopifySegmentsTab.jsx`, `SuppressionAssetsTab.jsx` — one component per tab body.
- **New:** `src/data/segmentsHomeData.js` — static mock data: opportunity cards, KPI-adjacent constants (if any beyond what `segmentsData.js` already derives), Fastrr Signals presets (retention/acquisition/library), Shopify segment mocks, suppression asset mocks, and a `SHOW_MORE_PAGE_SIZE` constant.
- **Extended:** `src/data/segmentsData.js` — add a `creationMethod: "filter" | "csv"` field to existing seed segments (default `"filter"`, with 2-3 seeded as `"csv"`), and accept `creationMethod` in `createSegment()`.

---

## 3. Page shell (`Segments.jsx`)

- Title: "Segment management" (replaces "Segments").
- Top-right: **+ New Segment** button → opens `NewSegmentModal`. Search input (client-side, filters the active tab's visible cards by name/title substring, case-insensitive).
- Below top bar: existing 4-tile KPI strip (Total segments, Active, High-value users, Stale), computed from `listSegments()`, unchanged logic.
- Below KPI strip: `OpportunityCarousel` — rendered once, above the tab content, identical across all 5 tabs (matches every wireframe screenshot).
- Tab bar (`Tabs`/`TabsList`/`TabsTrigger` from `ui/tabs.jsx`): All segments (default) · Fastrr Signals (`New` badge) · Custom segments · Shopify segments · Suppression assets. Tab state is local (`useState`), not URL-synced — no deep-linking requirement was given.

---

## 4. Opportunity carousel

- 3 visible cards at a time, `< >` arrows to page through a slightly larger mock array (enough to make the arrows meaningfully clickable — e.g. 4-5 total opportunity cards).
- Card shape: icon badge (trending-up, green), headline (e.g. "89.87K Hibernating customers can be recovered"), one-line description, "Estimated gain ₹X" + a **Boost sales** button (primary, sometimes disabled/muted per mock data flag — matches the 3rd wireframe card).
- Mock data lives in `segmentsHomeData.js` as `OPPORTUNITY_CARDS`.

---

## 5. "+ New Segment" modal (`NewSegmentModal.jsx`)

Dialog with title "Create a new segment" and two option-cards:

| Option | Description | Action on click |
|---|---|---|
| **Create Segment via filters** | "Segments can be created by filtering customers on the basis of the events they performed, their user properties or existing segments." | Closes modal, `navigate("/segments/builder/new")` (existing route/page, untouched). |
| **Upload CSV** | "Segments can be created by uploading a csv file that contains a list of customers and their contact details." | Closes this modal, opens `ImportSegmentCsvModal`. |

Clicking either option acts immediately (no separate Continue/confirm step).

---

## 6. CSV upload modal (`ImportSegmentCsvModal.jsx`)

Matches the provided screenshot exactly, with "Excel" replaced by "CSV" throughout:

- Title: **"Import segment from CSV upload"**.
- Subtitle: "Segments can be created by uploading a CSV file that contains a list of customers and their contact details."
- **Segment name** text input. While empty, shows helper text "Please add name before uploading the file" and disables the upload zone/button.
- Dropzone (adapted from `UploadListModal.jsx`'s existing drag-and-drop pattern): circular icon badge (Users icon), "Add a csv file of your customers", primary **Upload customers** button (triggers hidden `<input type="file" accept=".csv">`), "or drag and drop a file here" text, **Download sample file** link (download icon, static/no-op href since there's no real template to serve).
- Footer: **Create segment** button, disabled until both segment name and a selected/dropped file are present. On click: calls `createSegment({ name, description: "", audience: emptySegmentAudience(), creationMethod: "csv" })`, closes both modals, and stays on `/segments` so the new segment appears immediately under Custom segments → CSV Upload.
- ✕ / Cancel closes without creating anything.

---

## 7. "All segments" tab (`AllSegmentsTab.jsx`)

Single aggregated grid (no further sub-tabs), concatenating in this order:
1. Fastrr Signals presets (Retention + Acquisition + Segment library entries — all merged, since "All" surfaces everything).
2. Custom segments — real segments from `listSegments()`.
3. Shopify segments (mock).
4. Suppression assets (mock).

Each entry renders via the shared `SegmentCard`. Initial page size 9 (matches "Showing 9 out of 21 results" wireframe framing, scaled to however many total mock+real cards exist); a **Show more** link reveals the next page (slice-based, no real pagination API).

---

## 8. "Fastrr Signals" tab (`FastrrSignalsTab.jsx`)

- Renamed from "BIK smart segments" → **Fastrr Signals** (tab keeps its `New` badge).
- Three sub-tabs (segmented pill control, same visual pattern as the current Retention/Acquisition toggle): **Retention segments** (default) · **Acquisition segments** · **Segment library**.
- Each sub-tab shows an info banner (ⓘ + one-line description) above its card grid, swapped per sub-tab:
  - Retention: "Customers who have purchased from you. Keep them engaged, prevent churn, and grow their value."
  - Acquisition: "Potential customers who haven't purchased yet. Convert them with targeted campaigns based on their intent."
  - Segment library: reuse whatever framing line existed for the old standalone tab (generic "Pre-built segments ready to use" copy, since the wireframe didn't show an info line for it).
- Card sets carried over as-is from the wireframes into `segmentsHomeData.js`:
  - Retention: Champions, Loyal customers, Potential loyalists, New customers, Promising, Need attention, At risk, Can't lose them, Hibernating, Lost customers.
  - Acquisition: Hot Leads, Warm Leads, Cold Leads (+ 1 more mock entry so "Show more" / "3 out of 4" behavior is preserved).
  - Segment library: promising Customer, Repeat buyers, Engaged customers, Subscribers who never purchased, All WhatsApp subscribers, All email subscribers, All subscribers, New subscribers (8 shown, "Show more" toward 21 total — pad with a few more generic mock entries).
- All copy scrubbed for "BIK"/"Avimee" (none currently exist in segment code; ensuring none are introduced in new mock content).

---

## 9. "Custom segments" tab (`CustomSegmentsTab.jsx`)

- Two sub-tabs, **filter-only** (do not affect any create action): **Filter-based** (default) · **CSV Upload**.
- Filters the real `listSegments()` array by the new `creationMethod` field.
- Card shows: name, "Filters" badge (filter-based only), updated time, description/definition summary (reuse `renderBlockSetSummary`), user count, `⋮` menu (existing overflow pattern, no new actions specified).
- Seed 2-3 mock segments with `creationMethod: "csv"` in `segmentsData.js` so the CSV Upload sub-tab isn't empty on first load.
- "Show more" pagination, same pattern as other tabs.

---

## 10. "Shopify segments" tab (`ShopifySegmentsTab.jsx`)

- Static mock list in `segmentsHomeData.js`: title, rule expression (e.g. `products_purchased MATCHES (...)`), "New" badge, sync icon.
- Header: "Last synced on: {date}" + **Sync** button (no-op click, purely presentational — no real Shopify integration).
- "Show more" pagination toward a larger mock total (matches "9 out of 61" framing).

---

## 11. "Suppression assets" tab (`SuppressionAssetsTab.jsx`)

- Two static cards: "Email suppressed by Fastrr" and "WhatsApp suppressed by Fastrr" (both replacing the ambiguous/truncated original labels with a clear Fastrr-branded name), same description copy as wireframe ("Fastrr-generated list of customers who shouldn't be targeted in campaigns...").
- No "Show more" — fixed 2 results.

---

## 12. Out of scope

- No backend/API wiring for Shopify sync, suppression list generation, or CSV parsing — file selection is tracked in local state only; no actual row-count/validation of the uploaded CSV content.
- No URL/query-param persistence of active tab or search term.
- No changes to `/segments/builder/new` or `/segments/builder/:id` (the filter-based builder) — only the entry point into it changes.
- No changes to `SegmentQueryResults.jsx`, `SampleUsersModal.jsx`, `SegmentSummaryView.jsx`, `SegmentReachabilityPanel.jsx` — untouched.
- No enforcement of "Download sample file" actually producing a real file — static/no-op link.

---

## 13. Testing

- New `__tests__/SegmentsHomepage.test.jsx`: renders all 5 tabs, confirms tab switching shows the right sections; confirms "Fastrr Signals" and "SStore" strings are used (and "BIK"/"Avimee" are absent) in rendered output; confirms `+ New Segment` opens `NewSegmentModal`; confirms selecting "Create Segment via filters" navigates to `/segments/builder/new`; confirms selecting "Upload CSV" opens `ImportSegmentCsvModal`, and that its Create button stays disabled until both name and file are set.
- Existing segment builder tests (`SegmentBuilderPage`, `AudienceFilterBuilder`, etc.) are unaffected since those routes/components aren't touched.
