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

## 13. Appendix: exact wireframe mock data

All mock content in `segmentsHomeData.js` (and the `creationMethod`-tagged seeds in `segmentsData.js`) must reproduce these values verbatim — no invented substitutes — so the built page visually matches the wireframes. Where a name embeds "Bik", it's renamed per the Fastrr rule (e.g. `orderedInLast7DaysInBik` → `orderedInLast7DaysInFastrr`).

**Opportunity cards** (shown identically above every tab; 3rd card's "Boost sales" is disabled/muted):
| Headline | Description | Estimated gain | Boost sales |
|---|---|---|---|
| 89.87K Hibernating customers can be recovered | These long-inactive have a good chance of responding | ₹58,69,329 | enabled |
| 42.62K high-value customers are active | Few Big Spenders are showing signs of buying again | ₹13,21,726 | enabled |
| 11.80K Dormant customers show small signals | Long-lost customers. A few are can become active again | ₹3,78,925 | disabled |

**Fastrr Signals → Retention segments** (10 total, "Showing all 10 results", no Show more):
| Card | Icon | Updated | Description | Users | Avg revenue/user |
|---|---|---|---|---|---|
| Champions | Trophy | 11:25 PM, 22nd Jul | Your top fans - they buy often, spend the most, and purchased recently. Treat them like VIPs. | 1,63,073 | ₹3,733 |
| Loyal customers | Diamond | 11:30 PM, 22nd Jul | Repeat buyers who come back regularly. Not as frequent as Champions, but very reliable. | 69,540 | ₹2,940 |
| Potential loyalists | Rocket | 12:19 AM, 23rd Jul | Bought recently and showing early signs of becoming Loyalists, they just need a little nudge. | 5,12,566 | ₹663 |
| New customers | Person+ | 12:25 AM, 23rd Jul | Made their first purchase recently but haven't come back yet. The goal is to get them to order again. | 1,14,121 | — |
| Promising | Star | 12:52 AM, 23rd Jul | Bought a few times but inconsistently. They like you, they just haven't made it a habit yet. | 3,42,560 | ₹1,007 |
| Need attention | Warning triangle | 1:03 AM, 23rd Jul | Used to buy regularly but have slowed down. They're starting to re-engage, a good time to reach out. | 1,83,591 | ₹1,270 |
| At risk | Clock | 1:36 AM, 23rd Jul | Were frequent buyers but have gone quiet. | 3,97,251 | ₹1,328 |
| Can't lose them | Anchor | 1:46 AM, 23rd Jul | High spenders who are at risk of leaving your brand. They don't buy often, but when they do, it's big. | 1,79,723 | ₹1,949 |
| Hibernating | "zZ" | 2:08 AM, 23rd Jul | Haven't bought in a long time and weren't very active. A re-introduction campaign may wake them up. | 3,60,385 | ₹642 |
| Lost customers | Person-x | 2:11 AM, 23rd Jul | Customers who purchased long ago and haven't returned | 47,302 | — |

Info banner: "Customers who have purchased from you. Keep them engaged, prevent churn, and grow their value."

**Fastrr Signals → Acquisition segments** (4 total, "Showing 3 out of 4 results", Show more reveals the 4th):
| Card | Icon | Updated | Description | Users |
|---|---|---|---|---|
| Hot Leads | Flame | 2:16 AM, 23rd Jul | Leads who took high-intent actions in the last 7 days (like add to cart or replied) | 59,607 |
| Warm Leads | Coffee cup | 2:43 AM, 23rd Jul | Leads who showed interest recently (like clicks or product views) | 3,81,173 |
| Cold Leads | Snowflake | 3:26 AM, 23rd Jul | Leads with only light or older activity (like message delivered or profile created) | 5,82,784 |
| Nurture Leads | Seedling/leaf | 3:40 AM, 23rd Jul | Leads who've gone quiet after early interest — a nudge campaign can re-engage them. | 2,14,300 |

Info banner: "Potential customers who haven't purchased yet. Convert them with targeted campaigns based on their intent."

**Fastrr Signals → Segment library** (21 total, "Showing 8 out of 21 results" as the sub-tab's own page size — the last screenshot shows a 9th, "All SMS subscribers", visible when this content is aggregated into the "All segments" tab's 9-per-page grid):
| Card | Updated | Description | Users |
|---|---|---|---|
| promising Customer | 4:59 PM, 11th Mar | Customers who have made frequent purchases and spent a lot but haven't engaged recently. | 2,63,037 |
| Repeat buyers | 10:18 PM, 7th Mar | Customers who have purchased more than twice from your store. | 1,33,873 |
| Engaged customers | 5:20 PM, 13th Dec | Customers who have either clicked on or replied to your messages at least three times in the last 60 days. | 87,409 |
| Subscribers who never purchased | 6:21 PM, 1st Dec | All customers who are reachable on at least one messaging channel but have never placed an order. | 11,75,823 |
| All WhatsApp subscribers | 5:51 PM, 16th Aug | All customers who are reachable on WhatsApp. | 15,08,035 |
| All email subscribers | 1:07 PM, 7th Feb | All customers who are reachable on email. | 0 |
| All subscribers | 1:07 PM, 7th Feb | All customers who are reachable on at least one messaging channel. | 0 |
| New subscribers (30 days) | 1:07 PM, 7th Feb | New reachable customers acquired in the last 30 days. | 0 |
| All SMS subscribers | 1:07 PM, 7th Feb | All customers who are reachable on SMS. | 0 |

The remaining 12 (to reach 21 total, revealed via Show more) are net-new filler entries in the same style (name, timestamp, one-line description, user count) — not shown in any wireframe, so invented consistently with this table's tone.

**Custom segments — Filter-based** (1319 total, "Showing 9 out of 1319 results"; all carry a "Filters" badge):
| Card | Updated | Description | Users |
|---|---|---|---|
| orderedInLast7DaysInFastrr | 4:00 AM, 23rd Jul | Customers who have placed an order in the last 7 days | 28,484 |
| Drip AH_WA_LOD61-90DA... | 7:46 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_LOD61-90DAYS_REFILL_JULY18 - Drip Campaign whatsapp 1 | 13,677 |
| Drip AH_WA_LOD31-45DA... | 7:31 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_LOD31-45DAYS_REFILL_JULY18 - Drip Campaign whatsapp 1 | 12,316 |
| Drip AH_WA_FAKE_RTO_L... | 7:30 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_FAKE_RTO_L7D_JULY18 - Drip Campaign whatsapp 1 | 1,329 |
| Drip AH_WA_LOD15-30DA... | 7:16 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_LOD15-30DAYS_CS_WATER_SOFTENER_JULY18 - Drip Campaign whatsa... | 19,194 |
| Drip AH_WA_LOD91-120D... | 7:16 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_LOD91-120DAYS_REFILL_JULY18 - Drip Campaign whatsapp 1 | 10,935 |
| Drip AH_WA_LOD46-60D... | 7:16 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_LOD46-60DAYS_REFILL_JULY18 - Drip Campaign whatsapp 1 | 8,891 |
| Drip AH_WA_ABANDONED... | 7:15 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_ABANDONED_CKT_L7D_JULY18 - Drip Campaign whatsap... | 4,843 |
| Drip AH_WA_L7D_NITRO_... | 7:15 PM, 19th Jul | Segment for Drip Broadcast Drip AH_WA_L7D_NITRO_HIGH_INTENT_CART_EXIST_JULY18 - Drip... | 675 |

These 9 are seeded with `creationMethod: "filter"`. Per §9, 2-3 additional new mock rows are seeded with `creationMethod: "csv"` for the CSV Upload sub-tab (not shown in any wireframe — invent 2-3 plausible names, e.g. "Diwali excel import", "Store loyalty list Q2").

**Shopify segments** (61 total, "Showing 9 out of 61 results"; header: "Last synced on: 23 Jul 2026 at 6:08 PM" + Sync button; every card has a "New" badge + refresh icon):
| Card | Updated | Rule |
|---|---|---|
| Last 30 days | 6:08 PM, 23rd Jul | last_order_date > -30d |
| Customers Who Purchase... | 3:52 PM, 8th Jul | products_purchased MATCHES ( id = 7698145706200, date >= -30d ) |
| Customers Who Purchase... | 11:51 AM, 8th Jul | products_purchased MATCHES ( id = 8164014194904, date >= -30d ) |
| Customers Who Purchase... | 11:50 AM, 8th Jul | products_purchased MATCHES (id IN (7968704037080, 9180697002200, 9180692185304, 9092271603928), date >= -30d) |
| Customers Who Purchase... | 11:43 AM, 8th Jul | products_purchased MATCHES (id IN (8174008369368, 7698045665496), date >= -30d) |
| Customers Who Purchase... | 6:21 PM, 7th Jul | products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...) |
| Customers Who Purchase... | 6:19 PM, 7th Jul | products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...) |
| Customers who purchase... | 5:57 PM, 7th Jul | products_purchased MATCHES ( id = 7698126242008 ) |
| Customers Who Have Pur... | 10:56 AM, 1st Jul | number_of_orders >= 3 |

The remaining 52 (toward 61 total, Show more) are net-new filler entries in the same style — not shown in any wireframe.

**Suppression assets** (2 total, no Show more):
| Card | Updated | Description | Users |
|---|---|---|---|
| Email suppressed by Fastrr | 6:24 AM, 20th Jul | Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid email or marked emails as spam. | 1 |
| WhatsApp suppressed by Fastrr | 5:22 AM, 20th Jul | Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid phone numbers | 4,81,734 |

---

## 14. Testing

- New `__tests__/SegmentsHomepage.test.jsx`: renders all 5 tabs, confirms tab switching shows the right sections; confirms "Fastrr Signals" and "SStore" strings are used (and "BIK"/"Avimee" are absent) in rendered output; confirms `+ New Segment` opens `NewSegmentModal`; confirms selecting "Create Segment via filters" navigates to `/segments/builder/new`; confirms selecting "Upload CSV" opens `ImportSegmentCsvModal`, and that its Create button stays disabled until both name and file are set.
- Existing segment builder tests (`SegmentBuilderPage`, `AudienceFilterBuilder`, etc.) are unaffected since those routes/components aren't touched.
