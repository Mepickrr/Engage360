# Shiprocket Signals — Fastrr Signals Sub-Tab

**Date:** 2026-08-03
**Status:** Approved for implementation
**Audience:** Engineering
**Scope:** Segment page → Fastrr Signals tab — add a 4th sub-tab "Shiprocket Signals" with 3 sample cards

---

## 1. Why This Matters

Fastrr Signals currently has 3 sub-tabs — Retention, Acquisition, Segment library — each a labeled grid of pre-built segment cards driven by a shared `SOURCE` config in `FastrrSignalsTab.jsx`. This adds a 4th sub-tab, "Shiprocket Signals", surfacing segments derived from Shiprocket-side traits (RTO risk, AOV) alongside Fastrr's own behavioral segments, with 3 illustrative sample cards.

## 2. What Changes

### `src/data/segmentsHomeData.js`
Add a new data array and banner string, following the existing card shape (`id, name, Icon, updated, description, users`, optional `avgRevenuePerUser`):

```js
export const SHIPROCKET_SEGMENTS = [
  {
    id: "shp_1",
    name: "Low RTO- Loyal Customers",
    Icon: ShieldCheck,
    updated: "9:45 AM, 1st Aug",
    description: "Repeat buyers who come back regularly and have a low RTO trait in the Shiprocket universe.",
    users: "72,410",
  },
  {
    id: "shp_2",
    name: "High AOV- Promising",
    Icon: TrendingUp,
    updated: "10:12 AM, 1st Aug",
    description: "Bought a few times but inconsistently in your store, yet have a high AOV in your industry. They like you, they just haven't made it a habit yet.",
    users: "1,08,264",
  },
  {
    id: "shp_3",
    name: "High AOV & Low RTO- New Customers",
    Icon: Sparkles,
    updated: "10:30 AM, 1st Aug",
    description: "Made their first purchase but haven't come back yet — they show strong purchase intent and a low RTO trait in your industry. The goal is to get them to order again.",
    users: "38,950",
  },
];

export const SHIPROCKET_INFO_BANNER =
  "Segments powered by Shiprocket delivery signals — RTO risk and order value — layered on top of your store data.";
```

`ShieldCheck`, `TrendingUp`, `Sparkles` are added to the existing `lucide-react` import list at the top of the file.

### `src/components/segments/home/SegmentedToggle.jsx`
Add optional per-option badge support. An option may carry `badge: string`; when present, render a small pill next to the label using the same style as the existing "New" badge on the top-level Fastrr Signals tab (`Segments.jsx:76-78`: `bg-rose-100 text-rose-700`, `10px` semibold, rounded-full). No prop signature change beyond reading `opt.badge` — existing consumers (`CustomSegmentsTab.jsx`) are unaffected since no current option sets `badge`.

### `src/components/segments/home/FastrrSignalsTab.jsx`
- Import `SHIPROCKET_SEGMENTS`, `SHIPROCKET_INFO_BANNER` from `segmentsHomeData`.
- Add to `SUB_TABS`: `{ value: "shiprocket", label: "Shiprocket Signals", badge: "New" }`.
- Add to `SOURCE`: `shiprocket: { data: SHIPROCKET_SEGMENTS, banner: SHIPROCKET_INFO_BANNER, pageSize: SHIPROCKET_SEGMENTS.length }` — `pageSize` equals the full array length (3) so all cards show with no "Show more" link, matching how Retention (10 items, pageSize 10) behaves.

No changes to the card grid/pagination rendering logic itself — it's already generic over `SOURCE[subTab]`.

## 3. Out of Scope

- `AllSegmentsTab.jsx`'s aggregated "All segments" view is not updated to include Shiprocket Signals — user confirmed this is not required.
- No backend/API wiring — this is static mock content, consistent with the rest of `segmentsHomeData.js`.
- No changes to Retention, Acquisition, or existing Segment library cards or banners.

## 4. Testing

- `FastrrSignalsTab.test.jsx`: new test — switching to the Shiprocket sub-tab shows its banner and all 3 card names, with no "Show more" link (all 3 fit in one page).
- `SegmentedToggle.test.jsx`: new test — an option with `badge` set renders the badge text; an option without `badge` does not render a badge element.
- Existing "does not render BIK or Avimee" content-guard test in `FastrrSignalsTab.test.jsx` continues to pass unchanged (Shiprocket card copy contains neither string).

---

*Files referenced:*
- `src/data/segmentsHomeData.js`
- `src/components/segments/home/SegmentedToggle.jsx`
- `src/components/segments/home/FastrrSignalsTab.jsx`
- `src/components/segments/home/__tests__/FastrrSignalsTab.test.jsx`
- `src/components/segments/home/__tests__/SegmentedToggle.test.jsx`
- `src/pages/Segments.jsx` (badge style reference only, not modified)
