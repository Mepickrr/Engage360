# Fastrr Engage 2 Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork the entire Fastrr Engage flow (nav page, Account Setup, Meta Embedded Signup wizard, Journey Dashboard, welcome modal, wallet, profile) into a fully independent "Fastrr Engage 2" parallel copy — new pages, new component folders, new stores, new mock-data storage keys, new routes — reachable from the sidebar nav, so it can be iterated on (sequence, flow, screens) without ever affecting the original.

**Architecture:** A byte-for-byte mechanical fork. Every file under the Fastrr Engage flow is copied to a `2`-suffixed sibling (folder prefix `engage2/`, page/store/lib filenames get a literal `2` appended), with import paths and internal route-string literals repointed to the new siblings. No new design, copy, or sequence changes happen in this pass — day one, v2 renders and behaves identically to v1. It becomes free to diverge only through future edits made directly to the `engage2`/`*2` files.

**Tech Stack:** React 19, react-router-dom v7, zustand, Jest + React Testing Library (via `craco test`).

**Spec:** No separate spec doc — the full design was worked out and approved in conversation (per user preference, this plan carries the complete design instead of pointing to a separate file).

## Global Constraints

- **v1 stays untouched and green throughout.** No file under the original `engage/` component folders, the original 4 pages, the original 2 stores, or `metaSignupMock.js` is ever modified — only `App.js` and `Sidebar.jsx` (already-shared files) get small additive edits. The full pre-existing test suite (including the 3 known pre-existing, unrelated failures in `campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`) must show the exact same pass/fail counts after every task as before it.
- **Naming convention** (exact, do not deviate):
  | Original | v2 copy |
  |---|---|
  | `src/pages/FastrrEngage.jsx` | `src/pages/FastrrEngage2.jsx` |
  | `src/pages/EngageAccountSetup.jsx` | `src/pages/EngageAccountSetup2.jsx` |
  | `src/pages/MetaEmbeddedSignup.jsx` | `src/pages/MetaEmbeddedSignup2.jsx` |
  | `src/pages/FastrrJourney.jsx` | `src/pages/FastrrJourney2.jsx` |
  | `src/components/engage/home/` | `src/components/engage2/home/` |
  | `src/components/engage/account-setup/` | `src/components/engage2/account-setup/` |
  | `src/components/engage/meta-signup/` | `src/components/engage2/meta-signup/` |
  | `src/components/engage/journey-dashboard/` | `src/components/engage2/journey-dashboard/` |
  | `src/components/engage/FastrrEngagePanel.jsx` | `src/components/engage2/FastrrEngagePanel2.jsx` |
  | `src/components/engage/RevenueOpportunityCard.jsx` | `src/components/engage2/RevenueOpportunityCard2.jsx` |
  | `src/store/fastrrEngagePanelStore.js` | `src/store/fastrrEngagePanelStore2.js` |
  | `src/store/journeyWalletStore.js` | `src/store/journeyWalletStore2.js` |
  | `src/lib/metaSignupMock.js` | `src/lib/metaSignupMock2.js` |
  | Route `/fastrr-engage` | `/fastrr-engage-2` |
  | Route `/engage/account-setup` | `/engage-2/account-setup` |
  | Route `/engage/meta-embedded-signup` | `/engage-2/meta-embedded-signup` |
  | Route `/fastrr-journey` | `/fastrr-journey-2` |
  Files *inside* a copied folder (e.g. `LogoStrip.jsx`, `JourneyHeader.jsx`) keep their **exact original filename** — only the folder prefix changes. Only the "outward-facing" files listed above (pages, `RevenueOpportunityCard`, `FastrrEngagePanel`) get a literal `2` appended to their own filename.
- **`data-testid`s inside every duplicated file stay byte-identical to v1.** They're only ever asserted within that same file's own copied test (v1 and v2 pages are never rendered in the same test), so there is no collision to avoid. The one exception is the new `Sidebar.jsx` nav entry, which is hand-written (not copied) and gets its own distinct `testId: "nav-fastrr-engage-2"`.
- **Storage isolation** (exact values, do not deviate):
  - `metaSignupMock2.js`'s `STORAGE_KEY` = `"fastrr-engage-2-signup-mock-payload"` (was `"fastrr-engage-signup-mock-payload"`).
  - `metaSignupMock2.js`'s `MOCK_WABA_ID` = `"5647382910473829"` (was `"1029384756203847"` — deliberately different so the two flows are visually distinguishable if compared side by side; not functionally required, just good hygiene).
  - The `sessionStorage` welcome-flag key becomes `"fastrrJourney2Welcome"` (was `"fastrrJourneyWelcome"`) everywhere it appears (`MetaEmbeddedSignup2.jsx` and `FastrrJourney2.jsx`).
- **Fidelity, deliberately:** no bug-fixing, no "while I'm here" improvements to anything noticed during the fork (e.g. `JourneyHeader`'s "Open Engage" link points to `/`, not `/fastrr-engage` — that quirk is preserved verbatim in the v2 copy too). Only routing/storage isolation changes as listed above.
- `src/lib/engageApi.js` (the Agent Home / Conversation Panel API helper — unrelated despite the name) and every shadcn UI primitive under `src/components/ui/` are never touched or copied.
- `CI=true npm run build` must compile clean after the final task.

## Approach Note (read before Task 1)

This plan forks already-built, already-tested code — there is no new behavior to test-drive. So instead of the usual RED→GREEN cycle, each task's steps are: (1) run the exact copy/patch commands shown, (2) run the newly-created test file(s) and confirm they **pass immediately** (if one fails, the copy/patch was done wrong — that failure is the signal, not an expected step), (3) confirm the *existing* v1 test(s) for the same area are still passing and unchanged, (4) commit. This is still evidence-based verification, just shaped for a mechanical fork rather than new-feature TDD.

---

### Task 1: Fork the wallet and panel stores

**Files:**
- Create: `src/store/fastrrEngagePanelStore2.js`
- Create: `src/store/journeyWalletStore2.js`
- Create: `src/store/__tests__/fastrrEngagePanelStore2.test.js`

**Interfaces:**
- Produces: `useFastrrEngagePanelStore` (from `fastrrEngagePanelStore2.js`) — same shape as v1: `{ isOpen, open(), close() }`. Later tasks (`FastrrEngage2.jsx`, `FastrrEngagePanel2.jsx`) import this.
- Produces: `useJourneyWalletStore` (from `journeyWalletStore2.js`) — same shape as v1: `{ balance, credit(amount) }`. Later tasks (`journey-dashboard/` fork) import this.

- [ ] **Step 1: Copy the two store files and the one store test file**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp src/store/fastrrEngagePanelStore.js src/store/fastrrEngagePanelStore2.js
cp src/store/journeyWalletStore.js src/store/journeyWalletStore2.js
cp src/store/__tests__/fastrrEngagePanelStore.test.js src/store/__tests__/fastrrEngagePanelStore2.test.js
```

Neither store file imports anything else in this app (they only import `zustand`), so no content changes are needed in the two store files themselves.

- [ ] **Step 2: Fix the copied test's import path**

In `src/store/__tests__/fastrrEngagePanelStore2.test.js`, change:
```js
import { useFastrrEngagePanelStore } from "../fastrrEngagePanelStore";
```
to:
```js
import { useFastrrEngagePanelStore } from "../fastrrEngagePanelStore2";
```

- [ ] **Step 3: Run the copied test and confirm it passes**

Run: `npx craco test --testPathPattern="fastrrEngagePanelStore2" --watchAll=false`
Expected: PASS (all tests from the original file, now against the v2 store).

- [ ] **Step 4: Commit**

```bash
git add src/store/fastrrEngagePanelStore2.js src/store/journeyWalletStore2.js src/store/__tests__/fastrrEngagePanelStore2.test.js
git commit -m "feat(fastrr-engage-2): fork wallet and panel stores

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Fork `metaSignupMock.js`

**Files:**
- Create: `src/lib/metaSignupMock2.js`
- Create: `src/lib/__tests__/metaSignupMock2.test.js`

**Interfaces:**
- Produces: `STORAGE_KEY`, `DEFAULT_SIGNUP_PAYLOAD`, `buildSignupPayload()`, `writeSignupPayload()`, `readSignupPayload()`, `openSignupPopup()`, `MOCK_WABA_ID` — same names/signatures as v1, from `@/lib/metaSignupMock2`. Later tasks (`EngageAccountSetup2.jsx`, `MetaEmbeddedSignup2.jsx`, `engage2/journey-dashboard/ProfileDetailsModal.jsx`) import these.

- [ ] **Step 1: Copy the lib file and its test**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp src/lib/metaSignupMock.js src/lib/metaSignupMock2.js
cp src/lib/__tests__/metaSignupMock.test.js src/lib/__tests__/metaSignupMock2.test.js
```

- [ ] **Step 2: Patch the 3 v2-specific values in `metaSignupMock2.js`**

Change:
```js
export const STORAGE_KEY = "fastrr-engage-signup-mock-payload";
```
to:
```js
export const STORAGE_KEY = "fastrr-engage-2-signup-mock-payload";
```

Change:
```js
export function openSignupPopup() {
  return window.open(
    "/engage/meta-embedded-signup",
    "metaEmbeddedSignup",
    "width=560,height=780"
  );
}
```
to:
```js
export function openSignupPopup() {
  return window.open(
    "/engage-2/meta-embedded-signup",
    "metaEmbeddedSignup",
    "width=560,height=780"
  );
}
```

Change:
```js
export const MOCK_WABA_ID = "1029384756203847";
```
to:
```js
export const MOCK_WABA_ID = "5647382910473829";
```

- [ ] **Step 3: Fix the copied test's import path and popup-URL assertion**

In `src/lib/__tests__/metaSignupMock2.test.js`, change the import:
```js
import {
  STORAGE_KEY,
  DEFAULT_SIGNUP_PAYLOAD,
  buildSignupPayload,
  writeSignupPayload,
  readSignupPayload,
  openSignupPopup,
} from "../metaSignupMock";
```
to:
```js
import {
  STORAGE_KEY,
  DEFAULT_SIGNUP_PAYLOAD,
  buildSignupPayload,
  writeSignupPayload,
  readSignupPayload,
  openSignupPopup,
} from "../metaSignupMock2";
```

And change the popup assertion:
```js
    expect(openSpy).toHaveBeenCalledWith(
      "/engage/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
```
to:
```js
    expect(openSpy).toHaveBeenCalledWith(
      "/engage-2/meta-embedded-signup",
      "metaEmbeddedSignup",
      "width=560,height=780"
    );
```

- [ ] **Step 4: Run the copied test and confirm it passes**

Run: `npx craco test --testPathPattern="metaSignupMock2" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/metaSignupMock2.js src/lib/__tests__/metaSignupMock2.test.js
git commit -m "feat(fastrr-engage-2): fork metaSignupMock with isolated storage key and WABA ID

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Fork `RevenueOpportunityCard`

**Files:**
- Create: `src/components/engage2/RevenueOpportunityCard2.jsx`
- Create: `src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx`

**Interfaces:**
- Produces: `RevenueOpportunityCard2` (default export, props `variant`/`ctaLabel`/`onCtaClick` — identical to v1), plus named exports `computeRevenueOpportunity`, `MOCK_STORE_ACTIVITY` from `@/components/engage2/RevenueOpportunityCard2`. Later tasks (`FastrrEngage2.jsx`, `engage2/FastrrEngagePanel2.jsx`, `engage2/journey-dashboard/WalletRechargeCard.jsx`) import these.

- [ ] **Step 1: Create the folder and copy the file and its test**

```bash
cd /Users/meenalkamalakar/Documents/dowl
mkdir -p src/components/engage2/__tests__
cp src/components/engage/RevenueOpportunityCard.jsx src/components/engage2/RevenueOpportunityCard2.jsx
cp src/components/engage/__tests__/RevenueOpportunityCard.test.jsx src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx
```

This file only imports `lucide-react`, `@/components/ui/button`, and `@/lib/analyticsFormat` (all shared, untouched) — no content changes needed in the component itself.

- [ ] **Step 2: Fix the copied test's import path**

In `src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx`, change:
```js
import RevenueOpportunityCard, {
  computeRevenueOpportunity,
  MOCK_STORE_ACTIVITY,
} from "../RevenueOpportunityCard";
```
to:
```js
import RevenueOpportunityCard, {
  computeRevenueOpportunity,
  MOCK_STORE_ACTIVITY,
} from "../RevenueOpportunityCard2";
```

- [ ] **Step 3: Run the copied test and confirm it passes**

Run: `npx craco test --testPathPattern="RevenueOpportunityCard2" --watchAll=false`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/engage2/RevenueOpportunityCard2.jsx src/components/engage2/__tests__/RevenueOpportunityCard2.test.jsx
git commit -m "feat(fastrr-engage-2): fork RevenueOpportunityCard

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Fork the `home/`, `account-setup/`, and `meta-signup/` folders

**Files:**
- Create: `src/components/engage2/home/` (copy of `src/components/engage/home/`, 13 files)
- Create: `src/components/engage2/account-setup/` (copy of `src/components/engage/account-setup/`, 9 files)
- Create: `src/components/engage2/meta-signup/` (copy of `src/components/engage/meta-signup/`, 13 files)

**Interfaces:**
- Produces: every named export these three folders already produce (e.g. `HeroSection`, `LogoStrip`, `DarkStatBand`, `BentoFeatureGrid`, `TestimonialSection`, `FinalCTA`, `ChatPreviewMockup` from `home/`; `PhoneMockup`, `WhatsAppProfilePreview`, `NumberSetupCard`, `SetupInstructions`, `DEFAULT_BUSINESS_CATEGORY`, `BUSINESS_CATEGORIES` from `account-setup/`; `MetaTopBarChrome`, `FbLoginWindowChrome`, `StepRail`, and all 8 step components from `meta-signup/`) — identical names, now importable from `@/components/engage2/home/<File>`, `@/components/engage2/account-setup/<File>`, `@/components/engage2/meta-signup/<File>` (and `meta-signup/steps/<File>`). Later tasks (the 4 pages, and `engage2/journey-dashboard/ProfileDetailsModal.jsx`) import these.
- Consumes: nothing new from earlier tasks — these three folders have zero cross-references to stores, lib, or other engage folders (verified: none of their 35 files import anything outside their own folder besides `react`, `lucide-react`, `react-router-dom`, and `@/components/ui/*`, all of which are shared and untouched).

- [ ] **Step 1: Copy all three folders in full, including their `__tests__` (and `meta-signup/steps/__tests__`) subfolders**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp -r src/components/engage/home src/components/engage2/home
cp -r src/components/engage/account-setup src/components/engage2/account-setup
cp -r src/components/engage/meta-signup src/components/engage2/meta-signup
```

No content changes are needed anywhere in these three folders — every internal import is a relative sibling import (e.g. `HeroSection.jsx`'s `import ChatPreviewMockup from "./ChatPreviewMockup"`), which still resolves correctly since the whole folder moved together.

- [ ] **Step 2: Run all three folders' copied test suites and confirm they pass**

Run: `npx craco test --testPathPattern="components/engage2/(home|account-setup|meta-signup)" --watchAll=false`
Expected: PASS — the same test count as the original `home/`, `account-setup/`, and `meta-signup/` suites combined.

- [ ] **Step 3: Commit**

```bash
git add src/components/engage2/home src/components/engage2/account-setup src/components/engage2/meta-signup
git commit -m "feat(fastrr-engage-2): fork home, account-setup, and meta-signup component folders

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Fork `journey-dashboard/`

**Files:**
- Create: `src/components/engage2/journey-dashboard/` (copy of `src/components/engage/journey-dashboard/`, 16 files)

**Interfaces:**
- Consumes: `useJourneyWalletStore` from `@/store/journeyWalletStore2` (Task 1); `computeRevenueOpportunity` from `@/components/engage2/RevenueOpportunityCard2` (Task 3); `PhoneMockup`, `WhatsAppProfilePreview`, `DEFAULT_BUSINESS_CATEGORY` from `@/components/engage2/account-setup/*` (Task 4); `readSignupPayload`, `MOCK_WABA_ID` from `@/lib/metaSignupMock2` (Task 2).
- Produces: `JourneyHeader`, `JourneyStatsRow`, `JourneysTable`, `JourneyPreviewModal`, `WelcomeModal`, `WalletRechargeCard`, `RechargeWalletModal`, `ProfileDetailsModal`, `JOURNEYS`, `WAIT_LABEL`, `RATE_CARD`, `WALLET_TOPUP`, `COUPONS` (from `data.js`) — identical names, now importable from `@/components/engage2/journey-dashboard/<File>`. Later tasks (`FastrrJourney2.jsx`) import these.

- [ ] **Step 1: Copy the whole folder**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp -r src/components/engage/journey-dashboard src/components/engage2/journey-dashboard
```

- [ ] **Step 2: Rewrite the 4 absolute cross-references inside the copied folder**

In `src/components/engage2/journey-dashboard/JourneyHeader.jsx`, `WalletRechargeCard.jsx`, and `RechargeWalletModal.jsx`, change:
```js
import { useJourneyWalletStore } from "@/store/journeyWalletStore";
```
to:
```js
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";
```
(this exact line appears in all three files — apply it in each).

In `src/components/engage2/journey-dashboard/WalletRechargeCard.jsx`, change:
```js
import { computeRevenueOpportunity } from "@/components/engage/RevenueOpportunityCard";
```
to:
```js
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
```

In `src/components/engage2/journey-dashboard/ProfileDetailsModal.jsx`, change:
```js
import PhoneMockup from "@/components/engage/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage/account-setup/data";
import { readSignupPayload, MOCK_WABA_ID } from "@/lib/metaSignupMock";
```
to:
```js
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { readSignupPayload, MOCK_WABA_ID } from "@/lib/metaSignupMock2";
```

- [ ] **Step 3: Rewrite the sessionStorage welcome-flag key**

There is no hardcoded `"fastrrJourneyWelcome"` string inside `journey-dashboard/` itself (it's only read/written by the page files, handled in Task 7) — skip.

- [ ] **Step 4: Fix every copied test file's cross-references the same way**

Some of the 16 files are tests under `journey-dashboard/__tests__/` that mock or import the same paths rewritten in Step 2 (e.g. a test mocking `@/store/journeyWalletStore` or importing `@/components/engage/RevenueOpportunityCard`/`@/lib/metaSignupMock`). Search and apply the identical replacements from Step 2 inside `src/components/engage2/journey-dashboard/__tests__/`:

```bash
cd /Users/meenalkamalakar/Documents/dowl
grep -rl "@/store/journeyWalletStore\"" src/components/engage2/journey-dashboard/__tests__/
grep -rl "@/components/engage/RevenueOpportunityCard\"" src/components/engage2/journey-dashboard/__tests__/
grep -rl "@/lib/metaSignupMock\"" src/components/engage2/journey-dashboard/__tests__/
```

For every file each command lists, open it and apply the same three replacements as Step 2 (`@/store/journeyWalletStore` → `@/store/journeyWalletStore2`, `@/components/engage/RevenueOpportunityCard` → `@/components/engage2/RevenueOpportunityCard2`, `@/lib/metaSignupMock` → `@/lib/metaSignupMock2`). Do not change anything the grep commands don't list.

- [ ] **Step 5: Run the copied test suite and confirm it passes**

Run: `npx craco test --testPathPattern="components/engage2/journey-dashboard" --watchAll=false`
Expected: PASS — the same test count as the original `journey-dashboard/` suite.

- [ ] **Step 6: Commit**

```bash
git add src/components/engage2/journey-dashboard
git commit -m "feat(fastrr-engage-2): fork journey-dashboard, repointed to v2 store/lib/component deps

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Fork `FastrrEngagePanel`

**Files:**
- Create: `src/components/engage2/FastrrEngagePanel2.jsx`
- Create: `src/components/engage2/__tests__/FastrrEngagePanel2.test.jsx`

**Interfaces:**
- Consumes: `useFastrrEngagePanelStore` from `@/store/fastrrEngagePanelStore2` (Task 1); default export from `@/components/engage2/RevenueOpportunityCard2` (Task 3).
- Produces: `FastrrEngagePanel2` (default export, no props — same as v1) from `@/components/engage2/FastrrEngagePanel2`. Task 8 (`App.js`) mounts this globally.

- [ ] **Step 1: Copy the file and its test**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp src/components/engage/FastrrEngagePanel.jsx src/components/engage2/FastrrEngagePanel2.jsx
cp src/components/engage/__tests__/FastrrEngagePanel.test.jsx src/components/engage2/__tests__/FastrrEngagePanel2.test.jsx
```

- [ ] **Step 2: Rewrite the 3 references inside `FastrrEngagePanel2.jsx`**

Change:
```js
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
import RevenueOpportunityCard from "./RevenueOpportunityCard";
```
to:
```js
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
import RevenueOpportunityCard from "./RevenueOpportunityCard2";
```

Change the navigate call:
```js
    navigate("/engage/account-setup");
```
to:
```js
    navigate("/engage-2/account-setup");
```

- [ ] **Step 3: Rewrite the 2 references inside `FastrrEngagePanel2.test.jsx`**

Change:
```js
import FastrrEngagePanel from "../FastrrEngagePanel";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
```
to:
```js
import FastrrEngagePanel from "../FastrrEngagePanel2";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
```

Change both occurrences of:
```js
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
```
to:
```js
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
```

- [ ] **Step 4: Run the copied test and confirm it passes**

Run: `npx craco test --testPathPattern="FastrrEngagePanel2" --watchAll=false`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/engage2/FastrrEngagePanel2.jsx src/components/engage2/__tests__/FastrrEngagePanel2.test.jsx
git commit -m "feat(fastrr-engage-2): fork FastrrEngagePanel, repointed to v2 store/component/route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Fork the 4 pages

**Files:**
- Create: `src/pages/FastrrEngage2.jsx`
- Create: `src/pages/EngageAccountSetup2.jsx`
- Create: `src/pages/MetaEmbeddedSignup2.jsx`
- Create: `src/pages/FastrrJourney2.jsx`
- Create: `src/pages/__tests__/FastrrEngage2.test.jsx`
- Create: `src/pages/__tests__/EngageAccountSetup2.test.jsx`
- Create: `src/pages/__tests__/MetaEmbeddedSignup2.test.jsx`
- Create: `src/pages/__tests__/FastrrJourney2.test.jsx`

**Interfaces:**
- Consumes: everything from Tasks 1-6 (`engage2/home/*`, `engage2/account-setup/*`, `engage2/meta-signup/*`, `engage2/journey-dashboard/*`, `RevenueOpportunityCard2`, both v2 stores, `metaSignupMock2`).
- Produces: `FastrrEngagePage`, `EngageAccountSetupPage`, `MetaEmbeddedSignup`, `FastrrJourneyPage` (default exports, same names as v1 — fine, since they live in different files) from `@/pages/FastrrEngage2` etc. Task 8 (`App.js`) routes to these.

- [ ] **Step 1: Copy the 4 page files and their 4 test files**

```bash
cd /Users/meenalkamalakar/Documents/dowl
cp src/pages/FastrrEngage.jsx src/pages/FastrrEngage2.jsx
cp src/pages/EngageAccountSetup.jsx src/pages/EngageAccountSetup2.jsx
cp src/pages/MetaEmbeddedSignup.jsx src/pages/MetaEmbeddedSignup2.jsx
cp src/pages/FastrrJourney.jsx src/pages/FastrrJourney2.jsx
cp src/pages/__tests__/FastrrEngage.test.jsx src/pages/__tests__/FastrrEngage2.test.jsx
cp src/pages/__tests__/EngageAccountSetup.test.jsx src/pages/__tests__/EngageAccountSetup2.test.jsx
cp src/pages/__tests__/MetaEmbeddedSignup.test.jsx src/pages/__tests__/MetaEmbeddedSignup2.test.jsx
cp src/pages/__tests__/FastrrJourney.test.jsx src/pages/__tests__/FastrrJourney2.test.jsx
```

- [ ] **Step 2: Rewrite `FastrrEngage2.jsx`**

Change the 7 import lines:
```js
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
import RevenueOpportunityCard from "@/components/engage/RevenueOpportunityCard";
import HeroSection from "@/components/engage/home/HeroSection";
import LogoStrip from "@/components/engage/home/LogoStrip";
import DarkStatBand from "@/components/engage/home/DarkStatBand";
import BentoFeatureGrid from "@/components/engage/home/BentoFeatureGrid";
import TestimonialSection from "@/components/engage/home/TestimonialSection";
import FinalCTA from "@/components/engage/home/FinalCTA";
```
to:
```js
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
import RevenueOpportunityCard from "@/components/engage2/RevenueOpportunityCard2";
import HeroSection from "@/components/engage2/home/HeroSection";
import LogoStrip from "@/components/engage2/home/LogoStrip";
import DarkStatBand from "@/components/engage2/home/DarkStatBand";
import BentoFeatureGrid from "@/components/engage2/home/BentoFeatureGrid";
import TestimonialSection from "@/components/engage2/home/TestimonialSection";
import FinalCTA from "@/components/engage2/home/FinalCTA";
```

Change the navigate call:
```js
    navigate("/engage/account-setup");
```
to:
```js
    navigate("/engage-2/account-setup");
```

- [ ] **Step 3: Rewrite `FastrrEngage2.test.jsx`**

Change:
```js
import FastrrEngagePage from "../FastrrEngage";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
```
to:
```js
import FastrrEngagePage from "../FastrrEngage2";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore2";
```

Change all 3 occurrences of:
```js
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
```
to:
```js
    expect(mockNavigate).toHaveBeenCalledWith("/engage-2/account-setup");
```

- [ ] **Step 4: Rewrite `EngageAccountSetup2.jsx`**

Change:
```js
import SetupInstructions from "@/components/engage/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage/account-setup/data";
import { buildSignupPayload, writeSignupPayload, openSignupPopup } from "@/lib/metaSignupMock";
```
to:
```js
import SetupInstructions from "@/components/engage2/account-setup/SetupInstructions";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";
import WhatsAppProfilePreview from "@/components/engage2/account-setup/WhatsAppProfilePreview";
import { DEFAULT_BUSINESS_CATEGORY } from "@/components/engage2/account-setup/data";
import { buildSignupPayload, writeSignupPayload, openSignupPopup } from "@/lib/metaSignupMock2";
```

Change the exit-setup link:
```jsx
        <Link
          to="/fastrr-engage"
          data-testid="exit-setup-link"
```
to:
```jsx
        <Link
          to="/fastrr-engage-2"
          data-testid="exit-setup-link"
```

- [ ] **Step 5: Rewrite `EngageAccountSetup2.test.jsx`**

Change:
```js
import EngageAccountSetupPage from "../EngageAccountSetup";
import { STORAGE_KEY } from "@/lib/metaSignupMock";
```
to:
```js
import EngageAccountSetupPage from "../EngageAccountSetup2";
import { STORAGE_KEY } from "@/lib/metaSignupMock2";
```

Read the rest of this file (`src/pages/__tests__/EngageAccountSetup2.test.jsx`) after copying and change any assertion that checks the exit-setup link's `href` from `/fastrr-engage` to `/fastrr-engage-2`, and any assertion mocking or importing `openSignupPopup`'s popup URL from `/engage/meta-embedded-signup` to `/engage-2/meta-embedded-signup` — search first:

```bash
grep -n "fastrr-engage\|meta-embedded-signup" src/pages/__tests__/EngageAccountSetup2.test.jsx
```

Apply the `-2` suffix to every route string the grep lists.

- [ ] **Step 6: Rewrite `MetaEmbeddedSignup2.jsx`**

Change the import block:
```js
import MetaTopBarChrome from "@/components/engage/meta-signup/MetaTopBarChrome";
import FbLoginWindowChrome from "@/components/engage/meta-signup/FbLoginWindowChrome";
import StepRail from "@/components/engage/meta-signup/StepRail";
import IntroStep from "@/components/engage/meta-signup/steps/IntroStep";
import PhoneNumberStep from "@/components/engage/meta-signup/steps/PhoneNumberStep";
import VerifyPhoneStep from "@/components/engage/meta-signup/steps/VerifyPhoneStep";
import SelectAssetsStep from "@/components/engage/meta-signup/steps/SelectAssetsStep";
import BusinessInfoStep from "@/components/engage/meta-signup/steps/BusinessInfoStep";
import ConnectingStep from "@/components/engage/meta-signup/steps/ConnectingStep";
import EmailVerifyStep from "@/components/engage/meta-signup/steps/EmailVerifyStep";
import SuccessStep from "@/components/engage/meta-signup/steps/SuccessStep";
import { readSignupPayload } from "@/lib/metaSignupMock";
```
to:
```js
import MetaTopBarChrome from "@/components/engage2/meta-signup/MetaTopBarChrome";
import FbLoginWindowChrome from "@/components/engage2/meta-signup/FbLoginWindowChrome";
import StepRail from "@/components/engage2/meta-signup/StepRail";
import IntroStep from "@/components/engage2/meta-signup/steps/IntroStep";
import PhoneNumberStep from "@/components/engage2/meta-signup/steps/PhoneNumberStep";
import VerifyPhoneStep from "@/components/engage2/meta-signup/steps/VerifyPhoneStep";
import SelectAssetsStep from "@/components/engage2/meta-signup/steps/SelectAssetsStep";
import BusinessInfoStep from "@/components/engage2/meta-signup/steps/BusinessInfoStep";
import ConnectingStep from "@/components/engage2/meta-signup/steps/ConnectingStep";
import EmailVerifyStep from "@/components/engage2/meta-signup/steps/EmailVerifyStep";
import SuccessStep from "@/components/engage2/meta-signup/steps/SuccessStep";
import { readSignupPayload } from "@/lib/metaSignupMock2";
```

Change `handleFinish`:
```js
  const handleFinish = useCallback(() => {
    // Consumed once by FastrrJourneyPage to auto-open the welcome modal —
    // never reappears on a later visit or refresh. sessionStorage is
    // per-tab, so when this ran in a popup the flag must be set on the
    // *opener* tab's storage (where /fastrr-journey actually renders),
    // not this popup's own.
    const targetStorage = window.opener ? window.opener.sessionStorage : window.sessionStorage;
    targetStorage.setItem("fastrrJourneyWelcome", "1");
    if (window.opener) {
      window.opener.location.href = "/fastrr-journey";
      window.close();
    } else {
      navigate("/fastrr-journey");
    }
  }, [navigate]);
```
to:
```js
  const handleFinish = useCallback(() => {
    // Consumed once by FastrrJourneyPage to auto-open the welcome modal —
    // never reappears on a later visit or refresh. sessionStorage is
    // per-tab, so when this ran in a popup the flag must be set on the
    // *opener* tab's storage (where /fastrr-journey-2 actually renders),
    // not this popup's own.
    const targetStorage = window.opener ? window.opener.sessionStorage : window.sessionStorage;
    targetStorage.setItem("fastrrJourney2Welcome", "1");
    if (window.opener) {
      window.opener.location.href = "/fastrr-journey-2";
      window.close();
    } else {
      navigate("/fastrr-journey-2");
    }
  }, [navigate]);
```

Change `handleCancel`:
```js
      navigate("/engage/account-setup");
```
to:
```js
      navigate("/engage-2/account-setup");
```

- [ ] **Step 7: Rewrite `MetaEmbeddedSignup2.test.jsx`**

Change:
```js
import MetaEmbeddedSignup from "../MetaEmbeddedSignup";
import { writeSignupPayload } from "@/lib/metaSignupMock";
```
to:
```js
import MetaEmbeddedSignup from "../MetaEmbeddedSignup2";
import { writeSignupPayload } from "@/lib/metaSignupMock2";
```

Change every occurrence of `"/fastrr-journey"` to `"/fastrr-journey-2"`, every occurrence of `"fastrrJourneyWelcome"` to `"fastrrJourney2Welcome"`, and the `"/engage/account-setup"` assertion to `"/engage-2/account-setup"`:

```bash
grep -n '"/fastrr-journey"\|"fastrrJourneyWelcome"\|"/engage/account-setup"' src/pages/__tests__/MetaEmbeddedSignup2.test.jsx
```

Apply the rewrite to every line the grep lists (there are 6: two `/fastrr-journey` navigate/href assertions, two `fastrrJourneyWelcome` sessionStorage assertions, and one `/engage/account-setup` assertion, per the exact content read earlier in this task).

- [ ] **Step 8: Rewrite `FastrrJourney2.jsx`**

Change the import block:
```js
import JourneyHeader from "@/components/engage/journey-dashboard/JourneyHeader";
import JourneyStatsRow from "@/components/engage/journey-dashboard/JourneyStatsRow";
import JourneysTable from "@/components/engage/journey-dashboard/JourneysTable";
import JourneyPreviewModal from "@/components/engage/journey-dashboard/JourneyPreviewModal";
import WelcomeModal from "@/components/engage/journey-dashboard/WelcomeModal";
import { JOURNEYS } from "@/components/engage/journey-dashboard/data";
```
to:
```js
import JourneyHeader from "@/components/engage2/journey-dashboard/JourneyHeader";
import JourneyStatsRow from "@/components/engage2/journey-dashboard/JourneyStatsRow";
import JourneysTable from "@/components/engage2/journey-dashboard/JourneysTable";
import JourneyPreviewModal from "@/components/engage2/journey-dashboard/JourneyPreviewModal";
import WelcomeModal from "@/components/engage2/journey-dashboard/WelcomeModal";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
```

Change `consumeWelcomeFlag`:
```js
function consumeWelcomeFlag() {
  const shouldShow = window.sessionStorage.getItem("fastrrJourneyWelcome") === "1";
  if (shouldShow) window.sessionStorage.removeItem("fastrrJourneyWelcome");
  return shouldShow;
}
```
to:
```js
function consumeWelcomeFlag() {
  const shouldShow = window.sessionStorage.getItem("fastrrJourney2Welcome") === "1";
  if (shouldShow) window.sessionStorage.removeItem("fastrrJourney2Welcome");
  return shouldShow;
}
```

Change the page's `data-testid`:
```jsx
    <div className="min-h-screen bg-app-bg" data-testid="page-fastrr-journey">
```
to:
```jsx
    <div className="min-h-screen bg-app-bg" data-testid="page-fastrr-journey-2">
```

(This is the one deliberate exception to "testids stay identical" — the page-level wrapper testid must differ here because a later task, Task 8, adds a smoke assertion that both `/fastrr-journey` and `/fastrr-journey-2` are independently reachable in the same App-level check, which needs to tell the two pages apart. No other testid inside this file or its children changes.)

- [ ] **Step 9: Rewrite `FastrrJourney2.test.jsx`**

Change:
```js
import FastrrJourneyPage from "../FastrrJourney";
import { JOURNEYS } from "@/components/engage/journey-dashboard/data";
```
to:
```js
import FastrrJourneyPage from "../FastrrJourney2";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
```

Change every occurrence of `"fastrrJourneyWelcome"` to `"fastrrJourney2Welcome"`, and every occurrence of `"page-fastrr-journey"` to `"page-fastrr-journey-2"`:

```bash
grep -n '"fastrrJourneyWelcome"\|"page-fastrr-journey"' src/pages/__tests__/FastrrJourney2.test.jsx
```

Apply the rewrite to every line the grep lists.

- [ ] **Step 10: Run all 4 pages' copied test suites and confirm they pass**

Run: `npx craco test --testPathPattern="pages/__tests__/(FastrrEngage2|EngageAccountSetup2|MetaEmbeddedSignup2|FastrrJourney2)" --watchAll=false`
Expected: PASS — the same test count as the 4 original page suites combined.

- [ ] **Step 11: Commit**

```bash
git add src/pages/FastrrEngage2.jsx src/pages/EngageAccountSetup2.jsx src/pages/MetaEmbeddedSignup2.jsx src/pages/FastrrJourney2.jsx src/pages/__tests__/FastrrEngage2.test.jsx src/pages/__tests__/EngageAccountSetup2.test.jsx src/pages/__tests__/MetaEmbeddedSignup2.test.jsx src/pages/__tests__/FastrrJourney2.test.jsx
git commit -m "feat(fastrr-engage-2): fork the 4 pages, fully repointed to v2 routes/stores/components

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Wire routes, nav, and the global panel; final verification

**Files:**
- Modify: `src/App.js`
- Modify: `src/components/layout/Sidebar.jsx`

**Interfaces:**
- Consumes: `FastrrEngage2`, `EngageAccountSetup2` (default export `EngageAccountSetupPage`), `MetaEmbeddedSignup2` (default export `MetaEmbeddedSignup`), `FastrrJourney2` (default export `FastrrJourneyPage`) from Task 7; `FastrrEngagePanel2` from Task 6.

- [ ] **Step 1: Add the 5 new imports to `src/App.js`**

Change:
```js
import FastrrEngagePage from "@/pages/FastrrEngage";
import FastrrEngagePanel from "@/components/engage/FastrrEngagePanel";
import EngageAccountSetupPage from "@/pages/EngageAccountSetup";
import MetaEmbeddedSignup from "@/pages/MetaEmbeddedSignup";
import FastrrJourneyPage from "@/pages/FastrrJourney";
```
to:
```js
import FastrrEngagePage from "@/pages/FastrrEngage";
import FastrrEngagePanel from "@/components/engage/FastrrEngagePanel";
import EngageAccountSetupPage from "@/pages/EngageAccountSetup";
import MetaEmbeddedSignup from "@/pages/MetaEmbeddedSignup";
import FastrrJourneyPage from "@/pages/FastrrJourney";
import FastrrEngagePage2 from "@/pages/FastrrEngage2";
import FastrrEngagePanel2 from "@/components/engage2/FastrrEngagePanel2";
import EngageAccountSetupPage2 from "@/pages/EngageAccountSetup2";
import MetaEmbeddedSignup2 from "@/pages/MetaEmbeddedSignup2";
import FastrrJourneyPage2 from "@/pages/FastrrJourney2";
```

- [ ] **Step 2: Add the 4 new routes to `src/App.js`, mirroring each original's placement exactly**

Change:
```jsx
            <Route path="/fastrr-engage" element={<FastrrEngagePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/engage/account-setup" element={<EngageAccountSetupPage />} />
          <Route path="/engage/meta-embedded-signup" element={<MetaEmbeddedSignup />} />
          <Route path="/fastrr-journey" element={<FastrrJourneyPage />} />
        </Routes>
        <ConversationPanel />
        <FastrrEngagePanel />
        <Toaster richColors position="top-right" />
```
to:
```jsx
            <Route path="/fastrr-engage" element={<FastrrEngagePage />} />
            <Route path="/fastrr-engage-2" element={<FastrrEngagePage2 />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/engage/account-setup" element={<EngageAccountSetupPage />} />
          <Route path="/engage/meta-embedded-signup" element={<MetaEmbeddedSignup />} />
          <Route path="/fastrr-journey" element={<FastrrJourneyPage />} />
          <Route path="/engage-2/account-setup" element={<EngageAccountSetupPage2 />} />
          <Route path="/engage-2/meta-embedded-signup" element={<MetaEmbeddedSignup2 />} />
          <Route path="/fastrr-journey-2" element={<FastrrJourneyPage2 />} />
        </Routes>
        <ConversationPanel />
        <FastrrEngagePanel />
        <FastrrEngagePanel2 />
        <Toaster richColors position="top-right" />
```

- [ ] **Step 3: Add the sidebar nav entry to `src/components/layout/Sidebar.jsx`**

Change:
```js
  { label: "Fastrr Engage", icon: Sparkles, route: "/fastrr-engage", testId: "nav-fastrr-engage" },
```
to:
```js
  { label: "Fastrr Engage", icon: Sparkles, route: "/fastrr-engage", testId: "nav-fastrr-engage" },
  { label: "Fastrr Engage V2", icon: Sparkles, route: "/fastrr-engage-2", testId: "nav-fastrr-engage-2" },
```

- [ ] **Step 4: Run the full test suite and confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: every suite from before this plan started still passes exactly as before (including the 3 known pre-existing, unrelated failures — nothing new fails), plus all newly-created v2 test files from Tasks 1-7 pass. Total test count should be roughly double what the original 4-page flow contributed, plus the pre-existing rest of the suite unchanged.

- [ ] **Step 5: Run the CI build and confirm it compiles clean**

Run: `CI=true npm run build`
Expected: `Compiled successfully.` (no new unused-import or lint errors from the new files).

- [ ] **Step 6: Commit**

```bash
git add src/App.js src/components/layout/Sidebar.jsx
git commit -m "feat(fastrr-engage-2): wire routes, global panel, and sidebar nav entry

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** naming/route table ✅ Global Constraints + Task 1-8 file lists; storage isolation (localStorage key, sessionStorage key, WABA ID) ✅ Tasks 2, 7; testid identity (with the one deliberate page-wrapper exception for `/fastrr-journey-2`) ✅ Global Constraints + Task 7 Step 8; nav wiring mirroring "Flows"/"Flows V2" precedent ✅ Task 8 Step 3; fidelity (no bug-fixing, e.g. the "Open Engage" `to="/"` quirk) ✅ Global Constraints, left untouched in every copy; `engageApi.js` and shadcn primitives excluded ✅ Global Constraints, never referenced in any task's file list.
- **Placeholder scan:** every task's copy/patch step shows exact, runnable commands and exact before/after code — no "TBD", no "similarly update the rest", no unshown diffs. The two `grep`-then-apply steps (Task 5 Step 4, Task 7 Steps 5/7/9) are not vague — each names the exact search pattern and the exact replacement rule to apply to whatever it finds, which is necessary because a test file's exact line numbers depend on how the earlier steps in a page's own test file were structured; every replacement itself is a concrete, exact string pair.
- **Type/name consistency:** `useJourneyWalletStore`/`useFastrrEngagePanelStore` exported names stay identical to v1 across every task that imports them (Tasks 1, 5, 6, 7, 8) — only the import path changes, never the imported identifier. `RevenueOpportunityCard2`'s default export and named exports (`computeRevenueOpportunity`, `MOCK_STORE_ACTIVITY`) are established in Task 3 and consumed identically (same identifier names) in Tasks 5, 6, 7. Route path strings (`/fastrr-engage-2`, `/engage-2/account-setup`, `/engage-2/meta-embedded-signup`, `/fastrr-journey-2`) are used byte-identically everywhere they appear across Tasks 6, 7, 8 — cross-checked against the Global Constraints table.
