# Segment Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `src/pages/Segments.jsx` from a flat table into a tabbed "Segment management" dashboard (All segments / Fastrr Signals / Custom segments / Shopify segments / Suppression assets) with a KPI strip, an "Opportunities to grow revenue" carousel, and a "+ New Segment" flow that opens a creation-method modal (filters vs CSV upload).

**Architecture:** One page shell (`Segments.jsx`) holds shared chrome (top bar, KPI strip, opportunity carousel, tab bar, search state) and delegates each tab's body to its own component under `src/components/segments/home/`. All net-new display content (opportunity cards, Fastrr Signals presets, Shopify/Suppression mocks) lives in a new `src/data/segmentsHomeData.js` module, kept separate from the real-segment CRUD store `src/data/segmentsData.js` (which only gains a `creationMethod` field).

**Tech Stack:** React (CRA + craco), react-router-dom v6, Radix UI (`@radix-ui/react-tabs` via `src/components/ui/tabs.jsx`, `@radix-ui/react-dialog` via `src/components/ui/dialog.jsx`), lucide-react v0.507.0, Tailwind CSS, Jest + `@testing-library/react` (via `craco test`).

## Global Constraints

- Spec source of truth: `docs/superpowers/specs/2026-07-23-segment-homepage-redesign-design.md` — all mock copy/numbers in §13 (Appendix) must be reproduced verbatim, not invented.
- Replace "BIK" with "Fastrr" and "Avimee" with "SStore" in every new string introduced by this feature (e.g. `orderedInLast7DaysInBik` → `orderedInLast7DaysInFastrr`).
- Frontend-only mock — no backend/API calls. Matches the existing `segmentsData.js` pattern (in-memory arrays, deterministic derived values, no `Math.random()`/`Date.now()`).
- `@` import alias resolves to `src/` (configured in `craco.config.js`, applies to both webpack and Jest).
- **`react-router-dom` cannot be resolved by Jest directly** (ESM-only `exports` map) — every test file that imports a component using `useNavigate`/`useParams` must `jest.mock("react-router-dom", () => ({...}), { virtual: true })`.
- Run tests with: `npx craco test --testPathPattern="<pattern>" --watchAll=false`.
- Run the full segments test pattern before considering the feature done: `npx craco test --testPathPattern="Segments" --watchAll=false`.
- After any edit to files shared with Flow Builder v1/v2 — not applicable here, this feature touches only `src/pages/Segments.jsx`, `src/data/segmentsData.js`, and new `src/components/segments/home/*` / `src/data/segmentsHomeData.js` files, none of which are on the v1/v2 shared list in `CLAUDE.md`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/data/segmentsData.js` | *(modified)* real segment CRUD store — adds `creationMethod: "filter" \| "csv"` field |
| `src/data/segmentsHomeData.js` | *(new)* all static mock content: opportunity cards, Fastrr Signals (retention/acquisition/library), Shopify segments, suppression assets, filler-entry generator |
| `src/components/segments/home/SegmentCard.jsx` | *(new)* shared presentational card (icon, name, updated time, description, footer stat/badge) |
| `src/components/segments/home/SegmentedToggle.jsx` | *(new)* shared 2/3-option pill toggle (used by Fastrr Signals sub-tabs and Custom segments sub-tabs) |
| `src/components/segments/home/OpportunityCarousel.jsx` | *(new)* "Opportunities to grow revenue" 3-card carousel with prev/next paging |
| `src/components/segments/home/NewSegmentModal.jsx` | *(new)* "+ New Segment" creation-method picker modal |
| `src/components/segments/home/ImportSegmentCsvModal.jsx` | *(new)* CSV upload modal (segment name + dropzone + Create) |
| `src/components/segments/home/AllSegmentsTab.jsx` | *(new)* aggregated grid across all sources + Show more |
| `src/components/segments/home/FastrrSignalsTab.jsx` | *(new)* Retention / Acquisition / Segment library sub-tabs |
| `src/components/segments/home/CustomSegmentsTab.jsx` | *(new)* Filter-based / CSV Upload sub-tabs over real segments |
| `src/components/segments/home/ShopifySegmentsTab.jsx` | *(new)* Shopify segment mocks + Sync button + Show more |
| `src/components/segments/home/SuppressionAssetsTab.jsx` | *(new)* 2 fixed suppression cards |
| `src/pages/Segments.jsx` | *(rewritten)* page shell wiring all of the above |

Test files mirror each new/modified source file 1:1 under a `__tests__/` folder alongside it (matching existing repo convention).

---

### Task 1: Add `creationMethod` to the segment store

**Files:**
- Modify: `src/data/segmentsData.js`
- Test: `src/data/__tests__/segmentsData.test.js`

**Interfaces:**
- Produces: `createSegment({ name, description, audience, creationMethod = "filter" })` now returns a segment object that includes `creationMethod`. Seed segments `seg_1`..`seg_6` get `creationMethod: "filter"`. Two new seed segments `seg_7` ("Diwali excel import") and `seg_8` ("Store loyalty list Q2") are added with `creationMethod: "csv"`.

- [ ] **Step 1: Write the failing tests**

Create `src/data/__tests__/segmentsData.test.js`:

```js
import { listSegments, createSegment } from "../segmentsData";

describe("segmentsData creationMethod", () => {
  test("existing seed segments default to filter-based creation", () => {
    const segments = listSegments();
    const seedFilterSegments = segments.filter((s) => s.id.startsWith("seg_") && Number(s.id.split("_")[1]) <= 6);
    expect(seedFilterSegments.length).toBeGreaterThan(0);
    seedFilterSegments.forEach((s) => expect(s.creationMethod).toBe("filter"));
  });

  test("seeds include at least two csv-created segments", () => {
    const segments = listSegments();
    const csvSegments = segments.filter((s) => s.creationMethod === "csv");
    expect(csvSegments.length).toBeGreaterThanOrEqual(2);
    expect(csvSegments.map((s) => s.name)).toEqual(
      expect.arrayContaining(["Diwali excel import", "Store loyalty list Q2"]),
    );
  });

  test("createSegment defaults creationMethod to filter", () => {
    const seg = createSegment({ name: "Test seg", audience: { include: { blocks: [], blocksCombinator: "AND" }, exclude_enabled: false, exclude: { blocks: [], blocksCombinator: "AND" } } });
    expect(seg.creationMethod).toBe("filter");
  });

  test("createSegment accepts an explicit creationMethod", () => {
    const seg = createSegment({
      name: "CSV test seg",
      audience: { include: { blocks: [], blocksCombinator: "AND" }, exclude_enabled: false, exclude: { blocks: [], blocksCombinator: "AND" } },
      creationMethod: "csv",
    });
    expect(seg.creationMethod).toBe("csv");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="segmentsData" --watchAll=false`
Expected: FAIL — `creationMethod` is `undefined` on seed segments and on `createSegment()`'s return value; the two csv seed segments don't exist yet.

- [ ] **Step 3: Implement**

In `src/data/segmentsData.js`, add `creationMethod: "filter"` to each of the 6 existing seed segment objects (`seg_1` through `seg_6`), then append two new seed segments before the `segments = segments.map((s) => ({ ...s, ...estimateAudience(s.audience) }));` line:

```js
  {
    id: "seg_7",
    name: "Diwali excel import",
    description: "",
    audience: {
      include: { blocksCombinator: "AND", blocks: [] },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
    owner: null,
    status: "active",
    creationMethod: "csv",
  },
  {
    id: "seg_8",
    name: "Store loyalty list Q2",
    description: "",
    audience: {
      include: { blocksCombinator: "AND", blocks: [] },
      exclude_enabled: false,
      exclude: emptyBlockSet(),
    },
    createdAt: "2026-07-18T09:00:00.000Z",
    updatedAt: "2026-07-18T09:00:00.000Z",
    owner: null,
    status: "active",
    creationMethod: "csv",
  },
```

Update `nextSegmentSeq` initialization (it already reads `segments.length + 1`, so no change needed there — it will now compute `9` automatically).

In `createSegment()`, change the signature and returned object:

```js
export function createSegment({ name, description = "", audience, creationMethod = "filter" }) {
  const estimate = estimateAudience(audience);
  const segment = {
    id: `seg_${nextSegmentSeq++}`,
    name,
    description,
    audience,
    userCount: estimate.userCount,
    reachability: estimate.reachability,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    owner: "meera",
    status: "active",
    creationMethod,
  };
  segments = [segment, ...segments];
  return segment;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="segmentsData" --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/segmentsData.js src/data/__tests__/segmentsData.test.js
git commit -m "feat(segments): add creationMethod field to segment store"
```

---

### Task 2: Create `segmentsHomeData.js` mock data module

**Files:**
- Create: `src/data/segmentsHomeData.js`
- Test: `src/data/__tests__/segmentsHomeData.test.js`

**Interfaces:**
- Produces:
  - `OPPORTUNITY_CARDS: Array<{ id, headline, description, gain, boostEnabled }>`
  - `RETENTION_SEGMENTS: Array<{ id, name, Icon, updated, description, users, avgRevenuePerUser }>` (`avgRevenuePerUser` is `null` for entries with no figure shown)
  - `ACQUISITION_SEGMENTS: Array<{ id, name, Icon, updated, description, users }>`
  - `SEGMENT_LIBRARY: Array<{ id, name, updated, description, users }>` (21 entries total: 9 verbatim + 12 filler)
  - `SHOPIFY_SEGMENTS: Array<{ id, name, updated, rule }>` (61 entries total: 9 verbatim + 52 filler)
  - `SUPPRESSION_ASSETS: Array<{ id, name, updated, description, users }>` (2 entries)
  - `SHOPIFY_LAST_SYNCED: string` (display string `"23 Jul 2026 at 6:08 PM"`)
  - `makeFillerCards(prefix, count, startIndex)` — deterministic generator, no `Math.random()`.

- [ ] **Step 1: Write the failing tests**

Create `src/data/__tests__/segmentsHomeData.test.js`:

```js
import {
  OPPORTUNITY_CARDS,
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  SHOPIFY_SEGMENTS,
  SUPPRESSION_ASSETS,
  makeFillerCards,
} from "../segmentsHomeData";

describe("segmentsHomeData", () => {
  test("opportunity cards match the wireframe exactly", () => {
    expect(OPPORTUNITY_CARDS).toHaveLength(3);
    expect(OPPORTUNITY_CARDS[0]).toMatchObject({
      headline: "89.87K Hibernating customers can be recovered",
      description: "These long-inactive have a good chance of responding",
      gain: "₹58,69,329",
      boostEnabled: true,
    });
    expect(OPPORTUNITY_CARDS[2]).toMatchObject({
      headline: "11.80K Dormant customers show small signals",
      gain: "₹3,78,925",
      boostEnabled: false,
    });
  });

  test("retention segments has all 10 wireframe cards with correct data", () => {
    expect(RETENTION_SEGMENTS).toHaveLength(10);
    expect(RETENTION_SEGMENTS[0]).toMatchObject({
      name: "Champions",
      updated: "11:25 PM, 22nd Jul",
      users: "1,63,073",
      avgRevenuePerUser: "₹3,733",
    });
    const lost = RETENTION_SEGMENTS.find((s) => s.name === "Lost customers");
    expect(lost).toMatchObject({ users: "47,302", avgRevenuePerUser: null });
  });

  test("acquisition segments has 4 cards, no BIK/Avimee strings", () => {
    expect(ACQUISITION_SEGMENTS).toHaveLength(4);
    expect(ACQUISITION_SEGMENTS.map((s) => s.name)).toEqual(["Hot Leads", "Warm Leads", "Cold Leads", "Nurture Leads"]);
    const serialized = JSON.stringify(ACQUISITION_SEGMENTS);
    expect(serialized).not.toMatch(/BIK/i);
    expect(serialized).not.toMatch(/Avimee/i);
  });

  test("segment library has 21 total entries, first 9 match wireframe", () => {
    expect(SEGMENT_LIBRARY).toHaveLength(21);
    expect(SEGMENT_LIBRARY[0].name).toBe("promising Customer");
    expect(SEGMENT_LIBRARY[8].name).toBe("All SMS subscribers");
  });

  test("shopify segments has 61 total entries, first 9 match wireframe", () => {
    expect(SHOPIFY_SEGMENTS).toHaveLength(61);
    expect(SHOPIFY_SEGMENTS[0]).toMatchObject({ name: "Last 30 days", rule: "last_order_date > -30d" });
  });

  test("suppression assets use Fastrr branding, not BIK", () => {
    expect(SUPPRESSION_ASSETS).toHaveLength(2);
    expect(SUPPRESSION_ASSETS.map((s) => s.name)).toEqual([
      "Email suppressed by Fastrr",
      "WhatsApp suppressed by Fastrr",
    ]);
    const serialized = JSON.stringify(SUPPRESSION_ASSETS);
    expect(serialized).not.toMatch(/BIK/i);
  });

  test("makeFillerCards generates deterministic, distinct entries", () => {
    const a = makeFillerCards("lib", 3, 1);
    const b = makeFillerCards("lib", 3, 1);
    expect(a).toEqual(b);
    expect(a).toHaveLength(3);
    expect(new Set(a.map((c) => c.id)).size).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx craco test --testPathPattern="segmentsHomeData" --watchAll=false`
Expected: FAIL — module `../segmentsHomeData` does not exist.

- [ ] **Step 3: Implement**

Create `src/data/segmentsHomeData.js`:

```js
// Static mock content for the Segment management homepage — separate from
// segmentsData.js (the real segment CRUD store) since none of this flows
// through create/update paths. Frontend-only, no backend.

import {
  Trophy,
  Gem,
  Rocket,
  UserPlus,
  Star,
  AlertTriangle,
  Clock,
  Anchor,
  Moon,
  UserX,
  Flame,
  Coffee,
  Snowflake,
  Sprout,
} from "lucide-react";

export const OPPORTUNITY_CARDS = [
  {
    id: "opp_1",
    headline: "89.87K Hibernating customers can be recovered",
    description: "These long-inactive have a good chance of responding",
    gain: "₹58,69,329",
    boostEnabled: true,
  },
  {
    id: "opp_2",
    headline: "42.62K high-value customers are active",
    description: "Few Big Spenders are showing signs of buying again",
    gain: "₹13,21,726",
    boostEnabled: true,
  },
  {
    id: "opp_3",
    headline: "11.80K Dormant customers show small signals",
    description: "Long-lost customers. A few are can become active again",
    gain: "₹3,78,925",
    boostEnabled: false,
  },
];

export const RETENTION_SEGMENTS = [
  { id: "ret_1", name: "Champions", Icon: Trophy, updated: "11:25 PM, 22nd Jul", description: "Your top fans - they buy often, spend the most, and purchased recently. Treat them like VIPs.", users: "1,63,073", avgRevenuePerUser: "₹3,733" },
  { id: "ret_2", name: "Loyal customers", Icon: Gem, updated: "11:30 PM, 22nd Jul", description: "Repeat buyers who come back regularly. Not as frequent as Champions, but very reliable.", users: "69,540", avgRevenuePerUser: "₹2,940" },
  { id: "ret_3", name: "Potential loyalists", Icon: Rocket, updated: "12:19 AM, 23rd Jul", description: "Bought recently and showing early signs of becoming Loyalists, they just need a little nudge.", users: "5,12,566", avgRevenuePerUser: "₹663" },
  { id: "ret_4", name: "New customers", Icon: UserPlus, updated: "12:25 AM, 23rd Jul", description: "Made their first purchase recently but haven't come back yet. The goal is to get them to order again.", users: "1,14,121", avgRevenuePerUser: null },
  { id: "ret_5", name: "Promising", Icon: Star, updated: "12:52 AM, 23rd Jul", description: "Bought a few times but inconsistently. They like you, they just haven't made it a habit yet.", users: "3,42,560", avgRevenuePerUser: "₹1,007" },
  { id: "ret_6", name: "Need attention", Icon: AlertTriangle, updated: "1:03 AM, 23rd Jul", description: "Used to buy regularly but have slowed down. They're starting to re-engage, a good time to reach out.", users: "1,83,591", avgRevenuePerUser: "₹1,270" },
  { id: "ret_7", name: "At risk", Icon: Clock, updated: "1:36 AM, 23rd Jul", description: "Were frequent buyers but have gone quiet.", users: "3,97,251", avgRevenuePerUser: "₹1,328" },
  { id: "ret_8", name: "Can't lose them", Icon: Anchor, updated: "1:46 AM, 23rd Jul", description: "High spenders who are at risk of leaving your brand. They don't buy often, but when they do, it's big.", users: "1,79,723", avgRevenuePerUser: "₹1,949" },
  { id: "ret_9", name: "Hibernating", Icon: Moon, updated: "2:08 AM, 23rd Jul", description: "Haven't bought in a long time and weren't very active. A re-introduction campaign may wake them up.", users: "3,60,385", avgRevenuePerUser: "₹642" },
  { id: "ret_10", name: "Lost customers", Icon: UserX, updated: "2:11 AM, 23rd Jul", description: "Customers who purchased long ago and haven't returned", users: "47,302", avgRevenuePerUser: null },
];

export const RETENTION_INFO_BANNER =
  "Customers who have purchased from you. Keep them engaged, prevent churn, and grow their value.";

export const ACQUISITION_SEGMENTS = [
  { id: "acq_1", name: "Hot Leads", Icon: Flame, updated: "2:16 AM, 23rd Jul", description: "Leads who took high-intent actions in the last 7 days (like add to cart or replied)", users: "59,607" },
  { id: "acq_2", name: "Warm Leads", Icon: Coffee, updated: "2:43 AM, 23rd Jul", description: "Leads who showed interest recently (like clicks or product views)", users: "3,81,173" },
  { id: "acq_3", name: "Cold Leads", Icon: Snowflake, updated: "3:26 AM, 23rd Jul", description: "Leads with only light or older activity (like message delivered or profile created)", users: "5,82,784" },
  { id: "acq_4", name: "Nurture Leads", Icon: Sprout, updated: "3:40 AM, 23rd Jul", description: "Leads who've gone quiet after early interest — a nudge campaign can re-engage them.", users: "2,14,300" },
];

export const ACQUISITION_INFO_BANNER =
  "Potential customers who haven't purchased yet. Convert them with targeted campaigns based on their intent.";

const SEGMENT_LIBRARY_BASE = [
  { id: "lib_1", name: "promising Customer", updated: "4:59 PM, 11th Mar", description: "Customers who have made frequent purchases and spent a lot but haven't engaged recently.", users: "2,63,037" },
  { id: "lib_2", name: "Repeat buyers", updated: "10:18 PM, 7th Mar", description: "Customers who have purchased more than twice from your store.", users: "1,33,873" },
  { id: "lib_3", name: "Engaged customers", updated: "5:20 PM, 13th Dec", description: "Customers who have either clicked on or replied to your messages at least three times in the last 60 days.", users: "87,409" },
  { id: "lib_4", name: "Subscribers who never purchased", updated: "6:21 PM, 1st Dec", description: "All customers who are reachable on at least one messaging channel but have never placed an order.", users: "11,75,823" },
  { id: "lib_5", name: "All WhatsApp subscribers", updated: "5:51 PM, 16th Aug", description: "All customers who are reachable on WhatsApp.", users: "15,08,035" },
  { id: "lib_6", name: "All email subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on email.", users: "0" },
  { id: "lib_7", name: "All subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on at least one messaging channel.", users: "0" },
  { id: "lib_8", name: "New subscribers (30 days)", updated: "1:07 PM, 7th Feb", description: "New reachable customers acquired in the last 30 days.", users: "0" },
  { id: "lib_9", name: "All SMS subscribers", updated: "1:07 PM, 7th Feb", description: "All customers who are reachable on SMS.", users: "0" },
];

export const SEGMENT_LIBRARY_INFO_BANNER = "Pre-built segments ready to use.";

const SHOPIFY_SEGMENTS_BASE = [
  { id: "shop_1", name: "Last 30 days", updated: "6:08 PM, 23rd Jul", rule: "last_order_date > -30d" },
  { id: "shop_2", name: "Customers Who Purchase...", updated: "3:52 PM, 8th Jul", rule: "products_purchased MATCHES ( id = 7698145706200, date >= -30d )" },
  { id: "shop_3", name: "Customers Who Purchase...", updated: "11:51 AM, 8th Jul", rule: "products_purchased MATCHES ( id = 8164014194904, date >= -30d )" },
  { id: "shop_4", name: "Customers Who Purchase...", updated: "11:50 AM, 8th Jul", rule: "products_purchased MATCHES (id IN (7968704037080, 9180697002200, 9180692185304, 9092271603928), date >= -30d)" },
  { id: "shop_5", name: "Customers Who Purchase...", updated: "11:43 AM, 8th Jul", rule: "products_purchased MATCHES (id IN (8174008369368, 7698045665496), date >= -30d)" },
  { id: "shop_6", name: "Customers Who Purchase...", updated: "6:21 PM, 7th Jul", rule: "products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...)" },
  { id: "shop_7", name: "Customers Who Purchase...", updated: "6:19 PM, 7th Jul", rule: "products_purchased MATCHES (id IN (7698126242008, 8377127502040, 7971095871704, 8852681064664,...)" },
  { id: "shop_8", name: "Customers who purchase...", updated: "5:57 PM, 7th Jul", rule: "products_purchased MATCHES ( id = 7698126242008 )" },
  { id: "shop_9", name: "Customers Who Have Pur...", updated: "10:56 AM, 1st Jul", rule: "number_of_orders >= 3" },
];

export const SHOPIFY_LAST_SYNCED = "23 Jul 2026 at 6:08 PM";

export const SUPPRESSION_ASSETS = [
  {
    id: "supp_1",
    name: "Email suppressed by Fastrr",
    updated: "6:24 AM, 20th Jul",
    description:
      "Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid email or marked emails as spam.",
    users: "1",
  },
  {
    id: "supp_2",
    name: "WhatsApp suppressed by Fastrr",
    updated: "5:22 AM, 20th Jul",
    description:
      "Fastrr-generated list of customers who shouldn't be targeted in campaigns, such as opted-out or invalid phone numbers",
    users: "4,81,734",
  },
];

// Deterministic filler generator (no Math.random/Date.now) — used to pad
// Segment library (9 → 21) and Shopify segments (9 → 61) to their wireframe
// "Showing X out of Y" totals with entries not depicted in the wireframes.
export function makeFillerCards(prefix, count, startIndex) {
  return Array.from({ length: count }, (_, i) => {
    const n = startIndex + i;
    return {
      id: `${prefix}_filler_${n}`,
      name: `${prefix === "lib" ? "Segment" : "Shopify segment"} ${n}`,
      updated: "9:00 AM, 1st Jan",
      description: prefix === "lib" ? "Additional pre-built segment." : undefined,
      rule: prefix === "shop" ? `custom_rule_${n} = true` : undefined,
      users: prefix === "lib" ? "0" : undefined,
    };
  });
}

export const SEGMENT_LIBRARY = [...SEGMENT_LIBRARY_BASE, ...makeFillerCards("lib", 12, 1)];

export const SHOPIFY_SEGMENTS = [...SHOPIFY_SEGMENTS_BASE, ...makeFillerCards("shop", 52, 1)];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx craco test --testPathPattern="segmentsHomeData" --watchAll=false`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/data/segmentsHomeData.js src/data/__tests__/segmentsHomeData.test.js
git commit -m "feat(segments): add segmentsHomeData mock content module"
```

---

### Task 3: `SegmentCard` shared component

**Files:**
- Create: `src/components/segments/home/SegmentCard.jsx`
- Test: `src/components/segments/home/__tests__/SegmentCard.test.jsx`

**Interfaces:**
- Consumes: nothing from earlier tasks (pure presentational).
- Produces: `<SegmentCard name Icon updated description users footerRight badge onMenuClick testId />` — a `data-testid={testId}` root div. Used by every tab component.

Props:
- `name: string` (required)
- `Icon: React.ComponentType` (optional — lucide icon component)
- `updated: string` (optional — "Updated {updated}" line)
- `description: string` (optional)
- `users: string` (optional — footer left stat, rendered with a `Users` icon)
- `footerRight: React.ReactNode` (optional — e.g. "Average revenue per user : ₹3,733" or a "Filters" badge)
- `badge: React.ReactNode` (optional — top-right badge, e.g. "New" pill)
- `onMenuClick: () => void` (optional — shows a `⋮` button when provided)
- `testId: string` (required — used as `data-testid`)

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/SegmentCard.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Trophy } from "lucide-react";
import SegmentCard from "../SegmentCard";

describe("SegmentCard", () => {
  test("renders name, icon, updated, description, and footer stat", () => {
    render(
      <SegmentCard
        testId="card-champions"
        name="Champions"
        Icon={Trophy}
        updated="11:25 PM, 22nd Jul"
        description="Your top fans - they buy often, spend the most, and purchased recently. Treat them like VIPs."
        users="1,63,073"
        footerRight="Average revenue per user : ₹3,733"
      />,
    );
    expect(screen.getByTestId("card-champions")).toBeInTheDocument();
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText(/Updated 11:25 PM, 22nd Jul/)).toBeInTheDocument();
    expect(screen.getByText(/Your top fans/)).toBeInTheDocument();
    expect(screen.getByText("1,63,073")).toBeInTheDocument();
    expect(screen.getByText("Average revenue per user : ₹3,733")).toBeInTheDocument();
  });

  test("renders a badge and a clickable overflow menu when provided", () => {
    const onMenuClick = jest.fn();
    render(<SegmentCard testId="card-shop-1" name="Last 30 days" badge="New" onMenuClick={onMenuClick} />);
    expect(screen.getByText("New")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("card-shop-1-menu"));
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  test("omits users footer and menu button when not provided", () => {
    render(<SegmentCard testId="card-plain" name="Plain card" />);
    expect(screen.queryByTestId("card-plain-menu")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SegmentCard" --watchAll=false`
Expected: FAIL — `../SegmentCard` does not exist.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/SegmentCard.jsx`:

```jsx
import React from "react";
import { Users, MoreVertical } from "lucide-react";

export default function SegmentCard({
  testId,
  name,
  Icon,
  updated,
  description,
  users,
  footerRight,
  badge,
  onMenuClick,
}) {
  return (
    <div
      data-testid={testId}
      className="bg-surface border border-border rounded-lg p-4 flex flex-col h-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-violet-600" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-text-primary truncate">{name}</div>
            {updated && <div className="text-[11px] text-text-muted">Updated {updated}</div>}
          </div>
        </div>
        {badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap">
            {badge}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-2 text-[12px] text-text-secondary leading-snug flex-1">{description}</p>
      )}

      {(users || footerRight || onMenuClick) && (
        <div className="mt-3 -mx-4 -mb-4 px-4 py-2.5 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-primary">
            {users && (
              <>
                <Users className="w-3.5 h-3.5 text-text-muted" />
                {users}
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-text-secondary">
            {footerRight}
            {onMenuClick && (
              <button
                type="button"
                data-testid={`${testId}-menu`}
                onClick={onMenuClick}
                className="p-1 rounded hover:bg-slate-200 text-text-muted"
                aria-label="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SegmentCard" --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/SegmentCard.jsx src/components/segments/home/__tests__/SegmentCard.test.jsx
git commit -m "feat(segments): add shared SegmentCard component"
```

---

### Task 4: `SegmentedToggle` shared component

**Files:**
- Create: `src/components/segments/home/SegmentedToggle.jsx`
- Test: `src/components/segments/home/__tests__/SegmentedToggle.test.jsx`

**Interfaces:**
- Produces: `<SegmentedToggle options={[{ value, label }]} value onChange testIdPrefix />` — pill-button group, matching the Retention/Acquisition and Filter-based/CSV Upload toggles in the wireframes.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/SegmentedToggle.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SegmentedToggle from "../SegmentedToggle";

describe("SegmentedToggle", () => {
  const options = [
    { value: "retention", label: "Retention segments" },
    { value: "acquisition", label: "Acquisition segments" },
  ];

  test("renders all options and highlights the active one", () => {
    render(<SegmentedToggle testIdPrefix="fastrr" options={options} value="retention" onChange={jest.fn()} />);
    const active = screen.getByTestId("fastrr-toggle-retention");
    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("fastrr-toggle-acquisition")).toHaveAttribute("aria-pressed", "false");
  });

  test("clicking an option calls onChange with its value", () => {
    const onChange = jest.fn();
    render(<SegmentedToggle testIdPrefix="fastrr" options={options} value="retention" onChange={onChange} />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-acquisition"));
    expect(onChange).toHaveBeenCalledWith("acquisition");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SegmentedToggle" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/SegmentedToggle.jsx`:

```jsx
import React from "react";

export default function SegmentedToggle({ options, value, onChange, testIdPrefix }) {
  return (
    <div className="inline-flex gap-2" role="tablist">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testIdPrefix}-toggle-${opt.value}`}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              active
                ? "bg-violet-50 border-violet-300 text-violet-700"
                : "bg-surface border-border text-text-secondary hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SegmentedToggle" --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/SegmentedToggle.jsx src/components/segments/home/__tests__/SegmentedToggle.test.jsx
git commit -m "feat(segments): add shared SegmentedToggle component"
```

---

### Task 5: `OpportunityCarousel`

**Files:**
- Create: `src/components/segments/home/OpportunityCarousel.jsx`
- Test: `src/components/segments/home/__tests__/OpportunityCarousel.test.jsx`

**Interfaces:**
- Consumes: `OPPORTUNITY_CARDS` from `src/data/segmentsHomeData.js` (imported directly, no props needed for data — matches the "shared, identical across every tab" requirement).
- Produces: `<OpportunityCarousel />`, `data-testid="opportunity-carousel"`. Shows 3 cards at a time; `data-testid="opportunity-carousel-prev"` / `"opportunity-carousel-next"` buttons page through when more than 3 cards exist.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/OpportunityCarousel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import OpportunityCarousel from "../OpportunityCarousel";

describe("OpportunityCarousel", () => {
  test("renders the section heading and first 3 opportunity cards", () => {
    render(<OpportunityCarousel />);
    expect(screen.getByText("Opportunities to grow revenue")).toBeInTheDocument();
    expect(screen.getByText("89.87K Hibernating customers can be recovered")).toBeInTheDocument();
    expect(screen.getByText("42.62K high-value customers are active")).toBeInTheDocument();
    expect(screen.getByText("11.80K Dormant customers show small signals")).toBeInTheDocument();
  });

  test("disables the primary Boost sales button for the disabled opportunity", () => {
    render(<OpportunityCarousel />);
    const buttons = screen.getAllByText("Boost sales");
    expect(buttons[2]).toBeDisabled();
    expect(buttons[0]).not.toBeDisabled();
  });

  test("prev button is disabled at the start", () => {
    render(<OpportunityCarousel />);
    expect(screen.getByTestId("opportunity-carousel-prev")).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="OpportunityCarousel" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/OpportunityCarousel.jsx`:

```jsx
import React, { useState } from "react";
import { TrendingUp, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { OPPORTUNITY_CARDS } from "@/data/segmentsHomeData";

const PAGE_SIZE = 3;

export default function OpportunityCarousel() {
  const [start, setStart] = useState(0);
  const maxStart = Math.max(0, OPPORTUNITY_CARDS.length - PAGE_SIZE);
  const visible = OPPORTUNITY_CARDS.slice(start, start + PAGE_SIZE);

  return (
    <section data-testid="opportunity-carousel" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-1.5">
          Opportunities to grow revenue
          <Info className="w-3.5 h-3.5 text-text-muted" />
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="opportunity-carousel-prev"
            disabled={start === 0}
            onClick={() => setStart((s) => Math.max(0, s - PAGE_SIZE))}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            data-testid="opportunity-carousel-next"
            disabled={start >= maxStart}
            onClick={() => setStart((s) => Math.min(maxStart, s + PAGE_SIZE))}
            className="w-7 h-7 rounded-full border border-border flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((card) => (
          <div key={card.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-[15px] font-semibold text-text-primary leading-snug">{card.headline}</h3>
            <p className="mt-1 text-[12px] text-text-muted">{card.description}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-[11px] text-text-muted">Estimated gain</div>
                <div className="text-[15px] font-semibold text-emerald-700">{card.gain}</div>
              </div>
              <button
                type="button"
                disabled={!card.boostEnabled}
                className="px-3 py-1.5 rounded-md border border-primary text-primary text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted hover:bg-primary/5"
              >
                Boost sales
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="OpportunityCarousel" --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/OpportunityCarousel.jsx src/components/segments/home/__tests__/OpportunityCarousel.test.jsx
git commit -m "feat(segments): add OpportunityCarousel component"
```

---

### Task 6: `NewSegmentModal`

**Files:**
- Create: `src/components/segments/home/NewSegmentModal.jsx`
- Test: `src/components/segments/home/__tests__/NewSegmentModal.test.jsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` from `@/components/ui/dialog`.
- Produces: `<NewSegmentModal open onSelectFilters onSelectCsv onClose />`.
  - `open: boolean`
  - `onSelectFilters: () => void` — called when "Create Segment via filters" is clicked
  - `onSelectCsv: () => void` — called when "Upload CSV" is clicked
  - `onClose: () => void` — called on ✕ / outside click

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/NewSegmentModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NewSegmentModal from "../NewSegmentModal";

describe("NewSegmentModal", () => {
  test("renders both creation-method options with their descriptions", () => {
    render(<NewSegmentModal open onSelectFilters={jest.fn()} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByTestId("new-segment-option-filters")).toBeInTheDocument();
    expect(screen.getByTestId("new-segment-option-csv")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by filtering customers on the basis of the events they performed, their user properties or existing segments.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by uploading a csv file that contains a list of customers and their contact details.",
      ),
    ).toBeInTheDocument();
  });

  test("clicking 'Create Segment via filters' calls onSelectFilters", () => {
    const onSelectFilters = jest.fn();
    render(<NewSegmentModal open onSelectFilters={onSelectFilters} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("new-segment-option-filters"));
    expect(onSelectFilters).toHaveBeenCalledTimes(1);
  });

  test("clicking 'Upload CSV' calls onSelectCsv", () => {
    const onSelectCsv = jest.fn();
    render(<NewSegmentModal open onSelectFilters={jest.fn()} onSelectCsv={onSelectCsv} onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId("new-segment-option-csv"));
    expect(onSelectCsv).toHaveBeenCalledTimes(1);
  });

  test("renders nothing when open is false", () => {
    render(<NewSegmentModal open={false} onSelectFilters={jest.fn()} onSelectCsv={jest.fn()} onClose={jest.fn()} />);
    expect(screen.queryByTestId("new-segment-option-filters")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="NewSegmentModal" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/NewSegmentModal.jsx`:

```jsx
import React from "react";
import { Filter, UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function NewSegmentModal({ open, onSelectFilters, onSelectCsv, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="new-segment-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new segment</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <button
            type="button"
            data-testid="new-segment-option-filters"
            onClick={onSelectFilters}
            className="w-full text-left border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Filter className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Create Segment via filters</div>
              <div className="text-[12px] text-text-muted mt-1">
                Segments can be created by filtering customers on the basis of the events they performed, their user
                properties or existing segments.
              </div>
            </div>
          </button>

          <button
            type="button"
            data-testid="new-segment-option-csv"
            onClick={onSelectCsv}
            className="w-full text-left border border-border rounded-lg p-4 flex items-start gap-3 hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <UploadCloud className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-text-primary">Upload CSV</div>
              <div className="text-[12px] text-text-muted mt-1">
                Segments can be created by uploading a csv file that contains a list of customers and their contact
                details.
              </div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="NewSegmentModal" --watchAll=false`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/NewSegmentModal.jsx src/components/segments/home/__tests__/NewSegmentModal.test.jsx
git commit -m "feat(segments): add NewSegmentModal creation-method picker"
```

---

### Task 7: `ImportSegmentCsvModal`

**Files:**
- Create: `src/components/segments/home/ImportSegmentCsvModal.jsx`
- Test: `src/components/segments/home/__tests__/ImportSegmentCsvModal.test.jsx`

**Interfaces:**
- Consumes: `createSegment`, `emptySegmentAudience` from `@/data/segmentsData`.
- Produces: `<ImportSegmentCsvModal open onClose onCreated />`.
  - `open: boolean`
  - `onClose: () => void`
  - `onCreated: (segment) => void` — called with the created segment object after a successful "Create segment" click

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/ImportSegmentCsvModal.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ImportSegmentCsvModal from "../ImportSegmentCsvModal";

function makeFile(name = "customers.csv") {
  return new File(["a,b,c"], name, { type: "text/csv" });
}

describe("ImportSegmentCsvModal", () => {
  test("renders title, subtitle, and helper text while name is empty", () => {
    render(<ImportSegmentCsvModal open onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByText("Import segment from CSV upload")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Segments can be created by uploading a CSV file that contains a list of customers and their contact details.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Please add name before uploading the file")).toBeInTheDocument();
    expect(screen.getByTestId("import-csv-upload-btn")).toBeDisabled();
  });

  test("Create segment button stays disabled until both name and file are set", () => {
    render(<ImportSegmentCsvModal open onClose={jest.fn()} onCreated={jest.fn()} />);
    expect(screen.getByTestId("import-csv-create-btn")).toBeDisabled();

    fireEvent.change(screen.getByTestId("import-csv-name-input"), { target: { value: "My CSV segment" } });
    expect(screen.getByTestId("import-csv-create-btn")).toBeDisabled();
    expect(screen.getByTestId("import-csv-upload-btn")).not.toBeDisabled();

    const input = screen.getByTestId("import-csv-file-input");
    fireEvent.change(input, { target: { files: [makeFile()] } });
    expect(screen.getByTestId("import-csv-create-btn")).not.toBeDisabled();
    expect(screen.getByText("customers.csv")).toBeInTheDocument();
  });

  test("Create segment calls onCreated with a csv-tagged segment and closes", () => {
    const onCreated = jest.fn();
    const onClose = jest.fn();
    render(<ImportSegmentCsvModal open onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByTestId("import-csv-name-input"), { target: { value: "My CSV segment" } });
    fireEvent.change(screen.getByTestId("import-csv-file-input"), { target: { files: [makeFile()] } });
    fireEvent.click(screen.getByTestId("import-csv-create-btn"));

    expect(onCreated).toHaveBeenCalledTimes(1);
    const created = onCreated.mock.calls[0][0];
    expect(created.name).toBe("My CSV segment");
    expect(created.creationMethod).toBe("csv");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ImportSegmentCsvModal" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/ImportSegmentCsvModal.jsx`:

```jsx
import React, { useRef, useState } from "react";
import { Users, Upload, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { createSegment, emptySegmentAudience } from "@/data/segmentsData";

export default function ImportSegmentCsvModal({ open, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const canCreate = Boolean(name.trim()) && Boolean(file);

  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const handleCreate = () => {
    if (!canCreate) return;
    const segment = createSegment({
      name: name.trim(),
      audience: emptySegmentAudience(),
      creationMethod: "csv",
    });
    onCreated(segment);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent data-testid="import-csv-modal" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import segment from CSV upload</DialogTitle>
        </DialogHeader>

        <p className="text-[13px] text-text-secondary">
          Segments can be created by uploading a CSV file that contains a list of customers and their contact
          details.
        </p>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Segment name</label>
          <input
            data-testid="import-csv-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm"
          />
          {!name.trim() && (
            <div className="mt-1 text-[11px] text-text-muted">Please add name before uploading the file</div>
          )}
        </div>

        <div className="mt-4 border border-dashed border-border rounded-lg p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-slate-500" />
          </div>
          <div className="text-sm font-semibold text-text-primary">Add a csv file of your customers</div>
          <button
            type="button"
            data-testid="import-csv-upload-btn"
            disabled={!name.trim()}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            Upload customers
          </button>
          <input
            ref={fileInputRef}
            data-testid="import-csv-file-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mt-2 text-[12px] text-text-muted">or drag and drop a file here</div>
          <a href="#sample-csv" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary font-medium">
            <Download className="w-3.5 h-3.5" />
            Download sample file
          </a>
          {file && (
            <div className="mt-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-[12px] text-text-primary">
              {file.name}
              <button type="button" onClick={() => setFile(null)} aria-label="Remove file">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            data-testid="import-csv-create-btn"
            disabled={!canCreate}
            onClick={handleCreate}
            className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create segment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ImportSegmentCsvModal" --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/ImportSegmentCsvModal.jsx src/components/segments/home/__tests__/ImportSegmentCsvModal.test.jsx
git commit -m "feat(segments): add ImportSegmentCsvModal"
```

---

### Task 8: `FastrrSignalsTab`

**Files:**
- Create: `src/components/segments/home/FastrrSignalsTab.jsx`
- Test: `src/components/segments/home/__tests__/FastrrSignalsTab.test.jsx`

**Interfaces:**
- Consumes: `RETENTION_SEGMENTS`, `ACQUISITION_SEGMENTS`, `SEGMENT_LIBRARY`, `RETENTION_INFO_BANNER`, `ACQUISITION_INFO_BANNER`, `SEGMENT_LIBRARY_INFO_BANNER` from `@/data/segmentsHomeData`; `SegmentCard` (Task 3); `SegmentedToggle` (Task 4).
- Produces: `<FastrrSignalsTab searchQuery />` — `searchQuery: string` (case-insensitive substring filter on `name`).

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/FastrrSignalsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrSignalsTab from "../FastrrSignalsTab";

describe("FastrrSignalsTab", () => {
  test("defaults to Retention segments showing all 10 with no Show more", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.getByText("Lost customers")).toBeInTheDocument();
    expect(screen.queryByText(/Show more/)).not.toBeInTheDocument();
  });

  test("switching to Acquisition shows 3 of 4 with a Show more link that reveals the 4th", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-acquisition"));
    expect(screen.getByText("Hot Leads")).toBeInTheDocument();
    expect(screen.getByText("Warm Leads")).toBeInTheDocument();
    expect(screen.getByText("Cold Leads")).toBeInTheDocument();
    expect(screen.queryByText("Nurture Leads")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 3 out of 4 results")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Show more"));
    expect(screen.getByText("Nurture Leads")).toBeInTheDocument();
  });

  test("switching to Segment library shows the library info banner and cards", () => {
    render(<FastrrSignalsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("fastrr-toggle-library"));
    expect(screen.getByText("promising Customer")).toBeInTheDocument();
  });

  test("search filters cards by name within the active sub-tab", () => {
    render(<FastrrSignalsTab searchQuery="champ" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Loyal customers")).not.toBeInTheDocument();
  });

  test("does not render BIK or Avimee anywhere", () => {
    const { container } = render(<FastrrSignalsTab searchQuery="" />);
    expect(container.textContent).not.toMatch(/BIK/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="FastrrSignalsTab" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/FastrrSignalsTab.jsx`:

```jsx
import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import SegmentCard from "./SegmentCard";
import SegmentedToggle from "./SegmentedToggle";
import {
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  RETENTION_INFO_BANNER,
  ACQUISITION_INFO_BANNER,
  SEGMENT_LIBRARY_INFO_BANNER,
} from "@/data/segmentsHomeData";

const SUB_TABS = [
  { value: "retention", label: "Retention segments" },
  { value: "acquisition", label: "Acquisition segments" },
  { value: "library", label: "Segment library" },
];

const SOURCE = {
  retention: { data: RETENTION_SEGMENTS, banner: RETENTION_INFO_BANNER, pageSize: RETENTION_SEGMENTS.length },
  acquisition: { data: ACQUISITION_SEGMENTS, banner: ACQUISITION_INFO_BANNER, pageSize: 3 },
  library: { data: SEGMENT_LIBRARY, banner: SEGMENT_LIBRARY_INFO_BANNER, pageSize: 8 },
};

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function FastrrSignalsTab({ searchQuery }) {
  const [subTab, setSubTab] = useState("retention");
  const [visibleCount, setVisibleCount] = useState(SOURCE.retention.pageSize);

  const handleSubTabChange = (value) => {
    setSubTab(value);
    setVisibleCount(SOURCE[value].pageSize);
  };

  const { data, banner } = SOURCE[subTab];
  const filtered = useMemo(() => filterByQuery(data, searchQuery), [data, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="fastrr-signals-tab">
      <SegmentedToggle testIdPrefix="fastrr" options={SUB_TABS} value={subTab} onChange={handleSubTabChange} />

      <div className="mt-3 mb-4 flex items-center gap-1.5 text-[13px] text-text-secondary">
        <Info className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
        {banner}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`fastrr-card-${item.id}`}
            name={item.name}
            Icon={item.Icon}
            updated={item.updated}
            description={item.description}
            users={item.users}
            footerRight={item.avgRevenuePerUser ? `Average revenue per user : ${item.avgRevenuePerUser}` : undefined}
            onMenuClick={subTab !== "acquisition" ? () => {} : undefined}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        Showing {visible.length} out of {filtered.length} results
        {hasMore && (
          <>
            {" "}
            <button
              type="button"
              className="text-primary font-medium"
              onClick={() => setVisibleCount((c) => c + SOURCE[subTab].pageSize)}
            >
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="FastrrSignalsTab" --watchAll=false`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/FastrrSignalsTab.jsx src/components/segments/home/__tests__/FastrrSignalsTab.test.jsx
git commit -m "feat(segments): add FastrrSignalsTab with Retention/Acquisition/Library sub-tabs"
```

---

### Task 9: `CustomSegmentsTab`

**Files:**
- Create: `src/components/segments/home/CustomSegmentsTab.jsx`
- Test: `src/components/segments/home/__tests__/CustomSegmentsTab.test.jsx`

**Interfaces:**
- Consumes: `listSegments` from `@/data/segmentsData`; `renderBlockSetSummary` from `@/components/flows/builder/triggerV2/triggerHelpers`; `SegmentCard`; `SegmentedToggle`.
- Produces: `<CustomSegmentsTab searchQuery />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/CustomSegmentsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomSegmentsTab from "../CustomSegmentsTab";

describe("CustomSegmentsTab", () => {
  test("defaults to Filter-based sub-tab showing filter-created segments with a Filters badge", () => {
    render(<CustomSegmentsTab searchQuery="" />);
    expect(screen.getByTestId("custom-toggle-filter")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    expect(screen.queryByText("Diwali excel import")).not.toBeInTheDocument();
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0);
  });

  test("switching to CSV Upload sub-tab shows csv-created segments only", () => {
    render(<CustomSegmentsTab searchQuery="" />);
    fireEvent.click(screen.getByTestId("custom-toggle-csv"));
    expect(screen.getByText("Diwali excel import")).toBeInTheDocument();
    expect(screen.getByText("Store loyalty list Q2")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });

  test("search filters within the active sub-tab", () => {
    render(<CustomSegmentsTab searchQuery="cart" />);
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    expect(screen.queryByText("VIP Customers (LTV > ₹10K)")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="CustomSegmentsTab" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/CustomSegmentsTab.jsx`:

```jsx
import React, { useMemo, useState } from "react";
import SegmentCard from "./SegmentCard";
import SegmentedToggle from "./SegmentedToggle";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";

const SUB_TABS = [
  { value: "filter", label: "Filter-based" },
  { value: "csv", label: "CSV Upload" },
];

const PAGE_SIZE = 9;

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function CustomSegmentsTab({ searchQuery }) {
  const [subTab, setSubTab] = useState("filter");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const handleSubTabChange = (value) => {
    setSubTab(value);
    setVisibleCount(PAGE_SIZE);
  };

  const bySubTab = useMemo(
    () => listSegments().filter((s) => (s.creationMethod || "filter") === subTab),
    [subTab],
  );
  const filtered = useMemo(() => filterByQuery(bySubTab, searchQuery), [bySubTab, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="custom-segments-tab">
      <SegmentedToggle testIdPrefix="custom" options={SUB_TABS} value={subTab} onChange={handleSubTabChange} />

      <h2 className="mt-4 mb-3 text-base font-semibold text-text-primary">Custom segments</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((s) => (
          <SegmentCard
            key={s.id}
            testId={`custom-card-${s.id}`}
            name={s.name}
            updated={new Date(s.updatedAt).toLocaleString("en-IN")}
            description={subTab === "filter" ? renderBlockSetSummary(s.audience?.include) || "All users" : undefined}
            users={s.userCount?.toLocaleString("en-IN")}
            badge={subTab === "filter" ? "Filters" : undefined}
            onMenuClick={() => {}}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        Showing {visible.length} out of {filtered.length} results
        {hasMore && (
          <>
            {" "}
            <button type="button" className="text-primary font-medium" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="CustomSegmentsTab" --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/CustomSegmentsTab.jsx src/components/segments/home/__tests__/CustomSegmentsTab.test.jsx
git commit -m "feat(segments): add CustomSegmentsTab with Filter-based/CSV Upload sub-tabs"
```

---

### Task 10: `ShopifySegmentsTab`

**Files:**
- Create: `src/components/segments/home/ShopifySegmentsTab.jsx`
- Test: `src/components/segments/home/__tests__/ShopifySegmentsTab.test.jsx`

**Interfaces:**
- Consumes: `SHOPIFY_SEGMENTS`, `SHOPIFY_LAST_SYNCED` from `@/data/segmentsHomeData`; `SegmentCard`.
- Produces: `<ShopifySegmentsTab searchQuery />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/ShopifySegmentsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopifySegmentsTab from "../ShopifySegmentsTab";

describe("ShopifySegmentsTab", () => {
  test("renders header with last synced time and first 9 segments", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    expect(screen.getByText("Your Shopify segments")).toBeInTheDocument();
    expect(screen.getByText(/Last synced on: 23 Jul 2026 at 6:08 PM/)).toBeInTheDocument();
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("last_order_date > -30d")).toBeInTheDocument();
    expect(screen.getByText("Showing 9 out of 61 results")).toBeInTheDocument();
  });

  test("Show more reveals additional segments", () => {
    render(<ShopifySegmentsTab searchQuery="" />);
    fireEvent.click(screen.getByText("Show more"));
    expect(screen.getByText("Showing 18 out of 61 results")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="ShopifySegmentsTab" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/ShopifySegmentsTab.jsx`:

```jsx
import React, { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import SegmentCard from "./SegmentCard";
import { SHOPIFY_SEGMENTS, SHOPIFY_LAST_SYNCED } from "@/data/segmentsHomeData";

const PAGE_SIZE = 9;

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function ShopifySegmentsTab({ searchQuery }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(() => filterByQuery(SHOPIFY_SEGMENTS, searchQuery), [searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="shopify-segments-tab">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Your Shopify segments</h2>
        <div className="flex items-center gap-3 text-[12px] text-text-muted">
          <span>Last synced on: {SHOPIFY_LAST_SYNCED}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-text-secondary hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`shopify-card-${item.id}`}
            name={item.name}
            updated={item.updated}
            description={item.rule}
            badge="New"
            onMenuClick={() => {}}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        Showing {visible.length} out of {filtered.length} results
        {hasMore && (
          <>
            {" "}
            <button type="button" className="text-primary font-medium" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="ShopifySegmentsTab" --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/ShopifySegmentsTab.jsx src/components/segments/home/__tests__/ShopifySegmentsTab.test.jsx
git commit -m "feat(segments): add ShopifySegmentsTab"
```

---

### Task 11: `SuppressionAssetsTab`

**Files:**
- Create: `src/components/segments/home/SuppressionAssetsTab.jsx`
- Test: `src/components/segments/home/__tests__/SuppressionAssetsTab.test.jsx`

**Interfaces:**
- Consumes: `SUPPRESSION_ASSETS` from `@/data/segmentsHomeData`; `SegmentCard`.
- Produces: `<SuppressionAssetsTab searchQuery />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/SuppressionAssetsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import SuppressionAssetsTab from "../SuppressionAssetsTab";

describe("SuppressionAssetsTab", () => {
  test("renders both suppression cards with Fastrr branding and no Show more", () => {
    render(<SuppressionAssetsTab searchQuery="" />);
    expect(screen.getByText("Email suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.getByText("Showing all 2 results")).toBeInTheDocument();
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });

  test("search filters the two cards", () => {
    render(<SuppressionAssetsTab searchQuery="whatsapp" />);
    expect(screen.getByText("WhatsApp suppressed by Fastrr")).toBeInTheDocument();
    expect(screen.queryByText("Email suppressed by Fastrr")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="SuppressionAssetsTab" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/SuppressionAssetsTab.jsx`:

```jsx
import React, { useMemo } from "react";
import SegmentCard from "./SegmentCard";
import { SUPPRESSION_ASSETS } from "@/data/segmentsHomeData";

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function SuppressionAssetsTab({ searchQuery }) {
  const filtered = useMemo(() => filterByQuery(SUPPRESSION_ASSETS, searchQuery), [searchQuery]);

  return (
    <div data-testid="suppression-assets-tab">
      <h2 className="mb-3 text-base font-semibold text-text-primary">Suppression assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`suppression-card-${item.id}`}
            name={item.name}
            updated={item.updated}
            description={item.description}
            users={item.users}
            onMenuClick={() => {}}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-[13px] text-text-muted">Showing all {filtered.length} results</div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="SuppressionAssetsTab" --watchAll=false`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/SuppressionAssetsTab.jsx src/components/segments/home/__tests__/SuppressionAssetsTab.test.jsx
git commit -m "feat(segments): add SuppressionAssetsTab"
```

---

### Task 12: `AllSegmentsTab`

**Files:**
- Create: `src/components/segments/home/AllSegmentsTab.jsx`
- Test: `src/components/segments/home/__tests__/AllSegmentsTab.test.jsx`

**Interfaces:**
- Consumes: `RETENTION_SEGMENTS`, `ACQUISITION_SEGMENTS`, `SEGMENT_LIBRARY`, `SHOPIFY_SEGMENTS`, `SUPPRESSION_ASSETS` from `@/data/segmentsHomeData`; `listSegments` from `@/data/segmentsData`; `SegmentCard`.
- Produces: `<AllSegmentsTab searchQuery />` — concatenates all five sources into one grid, normalizing each source's shape into `{ id, testId, name, description, users, footerRight, badge }` before rendering.

- [ ] **Step 1: Write the failing test**

Create `src/components/segments/home/__tests__/AllSegmentsTab.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AllSegmentsTab from "../AllSegmentsTab";

describe("AllSegmentsTab", () => {
  test("aggregates cards from every source and paginates at 9", () => {
    render(<AllSegmentsTab searchQuery="" />);
    // Fastrr Signals (retention) card present
    expect(screen.getByText("Champions")).toBeInTheDocument();
    // Custom (real) segment present
    expect(screen.getByText("Cart Abandoners 48h")).toBeInTheDocument();
    // Shopify mock present
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    // Suppression mock present or not, depending on page size — check pagination text instead
    expect(screen.getByText(/Showing 9 out of/)).toBeInTheDocument();
  });

  test("Show more reveals additional aggregated cards", () => {
    render(<AllSegmentsTab searchQuery="" />);
    const before = screen.getAllByTestId(/^all-card-/).length;
    fireEvent.click(screen.getByText("Show more"));
    const after = screen.getAllByTestId(/^all-card-/).length;
    expect(after).toBeGreaterThan(before);
  });

  test("search filters across all aggregated sources", () => {
    render(<AllSegmentsTab searchQuery="champions" />);
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="AllSegmentsTab" --watchAll=false`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/segments/home/AllSegmentsTab.jsx`:

```jsx
import React, { useMemo, useState } from "react";
import SegmentCard from "./SegmentCard";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";
import {
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  SHOPIFY_SEGMENTS,
  SUPPRESSION_ASSETS,
} from "@/data/segmentsHomeData";

const PAGE_SIZE = 9;

function normalizeSignalCard(item) {
  return {
    id: `signal-${item.id}`,
    name: item.name,
    Icon: item.Icon,
    updated: item.updated,
    description: item.description,
    users: item.users,
    footerRight: item.avgRevenuePerUser ? `Average revenue per user : ${item.avgRevenuePerUser}` : undefined,
  };
}

function normalizeLibraryCard(item) {
  return { id: `lib-${item.id}`, name: item.name, updated: item.updated, description: item.description, users: item.users };
}

function normalizeCustomSegment(s) {
  return {
    id: `custom-${s.id}`,
    name: s.name,
    updated: new Date(s.updatedAt).toLocaleString("en-IN"),
    description: renderBlockSetSummary(s.audience?.include) || "All users",
    users: s.userCount?.toLocaleString("en-IN"),
    badge: (s.creationMethod || "filter") === "filter" ? "Filters" : undefined,
  };
}

function normalizeShopifyCard(item) {
  return { id: `shopify-${item.id}`, name: item.name, updated: item.updated, description: item.rule, badge: "New" };
}

function normalizeSuppressionCard(item) {
  return { id: `suppression-${item.id}`, name: item.name, updated: item.updated, description: item.description, users: item.users };
}

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function AllSegmentsTab({ searchQuery }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allCards = useMemo(
    () => [
      ...RETENTION_SEGMENTS.map(normalizeSignalCard),
      ...ACQUISITION_SEGMENTS.map(normalizeSignalCard),
      ...SEGMENT_LIBRARY.map(normalizeLibraryCard),
      ...listSegments().map(normalizeCustomSegment),
      ...SHOPIFY_SEGMENTS.map(normalizeShopifyCard),
      ...SUPPRESSION_ASSETS.map(normalizeSuppressionCard),
    ],
    [],
  );

  const filtered = useMemo(() => filterByQuery(allCards, searchQuery), [allCards, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="all-segments-tab">
      <h2 className="mb-3 text-base font-semibold text-text-primary">All segments</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard key={item.id} testId={`all-card-${item.id}`} {...item} onMenuClick={() => {}} />
        ))}
      </div>
      <div className="mt-4 text-center text-[13px] text-text-muted">
        Showing {visible.length} out of {filtered.length} results
        {hasMore && (
          <>
            {" "}
            <button type="button" className="text-primary font-medium" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="AllSegmentsTab" --watchAll=false`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/segments/home/AllSegmentsTab.jsx src/components/segments/home/__tests__/AllSegmentsTab.test.jsx
git commit -m "feat(segments): add AllSegmentsTab aggregating every source"
```

---

### Task 13: Rewrite `Segments.jsx` page shell

**Files:**
- Modify: `src/pages/Segments.jsx` (full rewrite)
- Test: `src/pages/__tests__/Segments.test.jsx`

**Interfaces:**
- Consumes: every component from Tasks 3-12; `listSegments` from `@/data/segmentsData`; `useNavigate` from `react-router-dom`.
- Produces: the page rendered at route `/segments` (route registration in `src/App.js` is unchanged — same path, same default export name `SegmentsPage`).

- [ ] **Step 1: Write the failing test**

Create `src/pages/__tests__/Segments.test.jsx` (mocks `react-router-dom` as a virtual module per the Global Constraints note):

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}), { virtual: true });

import SegmentsPage from "../Segments";

describe("SegmentsPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("renders the top bar, KPI strip, opportunity carousel, and defaults to All segments tab", () => {
    render(<SegmentsPage />);
    expect(screen.getByText("Segment management")).toBeInTheDocument();
    expect(screen.getByTestId("segments-new-btn")).toBeInTheDocument();
    expect(screen.getByTestId("opportunity-carousel")).toBeInTheDocument();
    expect(screen.getByTestId("all-segments-tab")).toBeInTheDocument();
  });

  test("switching tabs renders the corresponding tab body", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByRole("tab", { name: /Fastrr Signals/ }));
    expect(screen.getByTestId("fastrr-signals-tab")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Custom segments/ }));
    expect(screen.getByTestId("custom-segments-tab")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Shopify segments/ }));
    expect(screen.getByTestId("shopify-segments-tab")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Suppression assets/ }));
    expect(screen.getByTestId("suppression-assets-tab")).toBeInTheDocument();
  });

  test("+ New Segment opens NewSegmentModal, and 'Create Segment via filters' navigates to the builder", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByTestId("segments-new-btn"));
    expect(screen.getByTestId("new-segment-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("new-segment-option-filters"));
    expect(mockNavigate).toHaveBeenCalledWith("/segments/builder/new");
    expect(screen.queryByTestId("new-segment-modal")).not.toBeInTheDocument();
  });

  test("+ New Segment then 'Upload CSV' opens the ImportSegmentCsvModal instead", () => {
    render(<SegmentsPage />);
    fireEvent.click(screen.getByTestId("segments-new-btn"));
    fireEvent.click(screen.getByTestId("new-segment-option-csv"));
    expect(screen.queryByTestId("new-segment-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("import-csv-modal")).toBeInTheDocument();
  });

  test("search box filters the active tab's cards", () => {
    render(<SegmentsPage />);
    fireEvent.change(screen.getByTestId("segments-search-input"), { target: { value: "champions" } });
    expect(screen.getByText("Champions")).toBeInTheDocument();
    expect(screen.queryByText("Cart Abandoners 48h")).not.toBeInTheDocument();
  });

  test("page contains no BIK or Avimee strings", () => {
    const { container } = render(<SegmentsPage />);
    expect(container.textContent).not.toMatch(/\bBIK\b/i);
    expect(container.textContent).not.toMatch(/Avimee/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/Segments" --watchAll=false`
Expected: FAIL — current `Segments.jsx` doesn't have any of these tabs/testids.

- [ ] **Step 3: Implement**

Replace the full contents of `src/pages/Segments.jsx`:

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import { listSegments } from "@/data/segmentsData";
import OpportunityCarousel from "@/components/segments/home/OpportunityCarousel";
import NewSegmentModal from "@/components/segments/home/NewSegmentModal";
import ImportSegmentCsvModal from "@/components/segments/home/ImportSegmentCsvModal";
import AllSegmentsTab from "@/components/segments/home/AllSegmentsTab";
import FastrrSignalsTab from "@/components/segments/home/FastrrSignalsTab";
import CustomSegmentsTab from "@/components/segments/home/CustomSegmentsTab";
import ShopifySegmentsTab from "@/components/segments/home/ShopifySegmentsTab";
import SuppressionAssetsTab from "@/components/segments/home/SuppressionAssetsTab";

export default function SegmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const segments = listSegments();
  const kpis = [
    { label: "Total segments", value: String(segments.length), testId: "seg-kpi-total" },
    { label: "Active", value: String(segments.filter((s) => s.status === "active").length), testId: "seg-kpi-active" },
    {
      label: "High-value users",
      value: Math.max(...segments.map((s) => s.userCount), 0).toLocaleString("en-IN"),
      testId: "seg-kpi-hv",
    },
    {
      label: "Stale (need refresh)",
      value: String(segments.filter((s) => s.status === "stale").length),
      deltaTone: "negative",
      testId: "seg-kpi-stale",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-segments">
      <PreviewHeader
        title="Segment management"
        testIdPrefix="segments"
        actions={
          <button
            type="button"
            data-testid="segments-new-btn"
            onClick={() => setShowNewSegmentModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create new segment
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          data-testid="segments-search-input"
          type="text"
          placeholder="Search.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All segments</TabsTrigger>
          <TabsTrigger value="fastrr">
            Fastrr Signals{" "}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
              New
            </span>
          </TabsTrigger>
          <TabsTrigger value="custom">Custom segments</TabsTrigger>
          <TabsTrigger value="shopify">Shopify segments</TabsTrigger>
          <TabsTrigger value="suppression">Suppression assets</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => (
            <KpiTile key={k.testId} {...k} />
          ))}
        </div>

        <OpportunityCarousel />

        <TabsContent value="all">
          <AllSegmentsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="fastrr">
          <FastrrSignalsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="custom">
          <CustomSegmentsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="shopify">
          <ShopifySegmentsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="suppression">
          <SuppressionAssetsTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      <NewSegmentModal
        open={showNewSegmentModal}
        onClose={() => setShowNewSegmentModal(false)}
        onSelectFilters={() => {
          setShowNewSegmentModal(false);
          navigate("/segments/builder/new");
        }}
        onSelectCsv={() => {
          setShowNewSegmentModal(false);
          setShowCsvModal(true);
        }}
      />

      <ImportSegmentCsvModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onCreated={() => setActiveTab("custom")}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/Segments" --watchAll=false`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/pages/Segments.jsx src/pages/__tests__/Segments.test.jsx
git commit -m "feat(segments): rebuild Segments page as tabbed dashboard"
```

---

### Task 14: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run every new test together**

Run: `npx craco test --testPathPattern="segments|Segments" --watchAll=false`
Expected: all suites from Tasks 1-13 PASS.

- [ ] **Step 2: Run the full test suite to check for regressions**

Run: `npx craco test --watchAll=false`
Expected: no new failures outside the files touched in this plan (pre-existing failures, if any, are out of scope).

- [ ] **Step 3: Manually verify in the dev server**

Run: `npm start`, navigate to `/segments`, and confirm:
- All 5 tabs render and switch correctly.
- The Opportunities carousel and its `< >` buttons work identically on every tab.
- `+ Create new segment` → "Create Segment via filters" lands on `/segments/builder/new`.
- `+ Create new segment` → "Upload CSV" opens the CSV modal; entering a name and choosing a file enables "Create segment"; submitting returns to `/segments` with the new segment visible under Custom segments → CSV Upload.
- No visible "BIK" or "Avimee" text anywhere on the page.

- [ ] **Step 4: Commit any final fixups**

```bash
git add -A
git commit -m "chore(segments): fixups from full regression pass"
```

(Skip this commit if nothing needed fixing.)
