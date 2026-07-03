# Webhook Start Trigger — Design Spec

**Date:** 2026-07-03
**Status:** Approved for implementation
**Audience:** Internal product team, designers, engineers
**Scope:** "Webhook trigger" card in Select Start Trigger → a dedicated 3-step configuration wizard, wired into the Flow Builder canvas. Frontend-only (mocked), no real backend integration.

---

## 1. Overview

Today the catalogue already lists a "Webhook trigger" card under **Webhook and API → External signals**, but picking it drops the seller into the generic `Step1WhenContent` condition-builder — the same UI used for `Product Viewed` or `Order Placed` — which has no concept of a webhook URL, a sample payload, or mapping a third party's fields to a customer identity. It is effectively non-functional today.

This spec adds a dedicated wizard, modeled directly on BIK's existing "Webhook as Trigger" flow (https://help.bik.ai/en/articles/8749985-webhook-as-triggers), so a seller can let any third-party system (custom CRM, ERP, marketing tool, etc.) start a flow by POSTing data to a generated URL.

Like the rest of this app, this is a frontend prototype: the webhook URL is generated client-side, the sample payload is parsed with `JSON.parse` in the browser, and there is no real endpoint receiving traffic. The goal is a fully faithful UI + config-shape build that a backend can later be wired behind.

**Non-goals:** the "API trigger" card (developer-initiated REST calls) is out of scope — it is a distinct concept and gets its own design later. No changes to any existing event/broadcast/date-relative trigger path.

---

## 2. Entry Point

No changes to `EventPickerModal.jsx` — the "Webhook trigger" card already exists in `eventCatalogue.json` under `Webhook and API → External signals` and calls the existing `onPick(card)` callback.

In `StartTriggerWizard.jsx`, `onPickEvent` gains a new branch, following the same pattern already used for `card.header === "Broadcast"`:

```js
} else if (card.name === "Webhook trigger") {
  setIsWebhook(true);
  setWebhookConfig(emptyWebhookConfig());
  setStage("webhook-1");
}
```

The wizard stage machine grows three new stages — `"webhook-1"`, `"webhook-2"`, `"webhook-3"` — that render `WebhookTriggerWizard` instead of `Step1WhenContent` / `Step2WhoContent`. `Step2WhoContent` (audience qualification) is skipped entirely for webhooks, the same way it's skipped for Broadcast — a webhook payload has no pre-existing user profile to qualify against until the Unique ID step resolves one.

`handleFinish` gains a matching branch:

```js
} else if (isWebhook) {
  config = { kind: "webhook", ...webhookConfig };
}
```

Edit-mode hydration (`useEffect` on `initialConfig`) gains a matching `initialConfig?.kind === "webhook"` branch that restores `webhookConfig` and jumps to `"webhook-1"`.

---

## 3. Data Model

```ts
{
  kind: "webhook",
  webhookUrl: string,              // mock-generated, stable across re-opens of the same trigger
  authProtected: boolean,
  authConfig: { headerName: string, token: string } | null,  // present only when authProtected
  samplePayload: string,           // raw pasted JSON, kept verbatim for redisplay
  payloadVariables: [              // derived from samplePayload via flattenPayload()
    { path: string, example: string }
  ],
  uniqueId: { type: "Phone Number", payloadVariable: string } | null,
  secondaryId: { type: "Phone Number", payloadVariable: string } | null,
  variableMappings: [              // optional, step 3
    {
      payloadVariable: string,
      existingVariable: { category: string, group: string, key: string, label: string }
    }
  ],
}
```

This is a standalone shape, not nested inside `triggerGroups` — `config.kind === "webhook"` is the sole discriminator, exactly like `"broadcast"`, `"broadcast_source"`, and `"date_relative"` today.

---

## 4. New Files

### 4.1 `src/components/flows/builder/trigger/webhookHelpers.js`

Pure helper functions:

- `emptyWebhookConfig()` → returns the zero-state object above (`webhookUrl` generated immediately so Step 1 always has something to display/copy).
- `generateWebhookUrl(seed)` → builds a mock URL in BIK's observed shape: `https://bikapi.bikayi.app/chatbot/webhook/{seed}?flow={flowSlug}`. `seed` is a short random id generated once and stored in config so it doesn't change on every re-render.
- `flattenPayload(jsonString)` → `{ variables: [{path, example}], error: string | null }`. Parses JSON, walks the tree:
  - Object keys become dot-paths (`order.customer.email`).
  - Arrays: only the first element is walked (to keep the variable list finite); its keys are flattened under the array's own path (`items.sku`), matching how sellers think about "the array of line items" rather than per-index paths.
  - Leaf values become the `example` (stringified).
  - Invalid JSON returns `{ variables: [], error: "<message>" }` without throwing.

### 4.2 `src/components/flows/builder/trigger/WebhookTriggerWizard.jsx`

Owns local stage state (`"url_payload" | "unique_id" | "variable_mapping"`) plus the header/stepper/footer chrome, structurally parallel to `StartTriggerWizard`'s own `Dialog` shell but with a 3-dot stepper labeled to match the screenshots ("Configure Webhook (Step 1/3)" etc.) instead of the 2-dot "When → Who" stepper.

Props: `{ config, setConfig, onBack, onFinish, onCancel }` — `StartTriggerWizard` owns `webhookConfig` state and passes it down, same ownership pattern as `triggerGroups`/`audience` today.

Renders one of three step components per stage:

**`WebhookStep1UrlPayload`**
- Read-only URL field + Copy button (`navigator.clipboard.writeText`, small "Copied" toast reusing whatever copy-feedback pattern already exists in this codebase — check for one before adding a new one).
- "Protect the Webhook with an authentication token" checkbox. Checking it inline-reveals two fields (Header name, Token value) directly beneath — no separate modal.
- "Paste Sample Payload" textarea. On change (debounced or on blur), runs `flattenPayload()`; a live read-only list renders below showing `path → example` for each extracted variable. A parse error renders inline under the textarea instead of the list.
- Next disabled until `payloadVariables.length > 0`.

**`WebhookStep2UniqueId`**
- "Type of ID" `<select>` — single option `"Phone Number"` for v1 (still a real dropdown, not hardcoded text, so adding ID types later is a one-line data change, not a UI change).
- "Payload Variable" — a searchable combobox (mirrors the existing `PropertyDropdown`/`GroupedSearchDropdown` popover pattern already in this codebase) populated only from `payloadVariables` computed in Step 1, rendering each option as `{{path}}`. No free text entry.
- "+ Secondary ID (optional)" reveals an identical second Type/Variable pair, stored as `secondaryId`.
- A read-only "Payload Variables from Webhook" reference panel below, reusing the same list from Step 1.
- Next disabled until `uniqueId.type` and `uniqueId.payloadVariable` are both set.

**`WebhookStep3VariableMapping`**
- One row per entry in `payloadVariables`, pre-populated (not manually added) on first render of this step: `{ payloadVariable: path, existingVariable: null }`.
- "+ Add Field" appends an extra blank row so the same payload variable can be mapped again under a different existing variable (matches BIK's UI, where the left column can have more rows than there are distinct payload variables).
- Right-side panel: search input + grouped list of existing variables the seller can assign to the focused row — **Customer variables** (Basic, Custom Fields), **Flow variables**, **Store variables**, **Global variables**. All four groups are small new flat mock arrays (`MOCK_EXISTING_VARIABLES` in `webhookHelpers.js`) of `{key, label}` — not reused from `ATTRIBUTE_GROUPS`, to keep this feature self-contained.
- Entirely optional: both "Skip and Create" and "Create Trigger" call `onFinish`; skipping just leaves rows with `existingVariable: null` filtered out of the saved `variableMappings`.

---

## 5. Canvas Summary

### 5.1 `triggerNodeUtils.js`

Add `summariseWebhook(config)`:

```js
function summariseWebhook(config) {
  return {
    headerLabel: "Webhook Trigger",
    isWebhook: true,
    webhookUrl: config.webhookUrl,
    uniqueIdType: config.uniqueId?.type || null,
    uniqueIdVar: config.uniqueId?.payloadVariable || null,
    mappedVarCount: (config.variableMappings || []).filter(m => m.existingVariable).length,
  };
}
```

Wire into `summariseTriggerConfig`:

```js
if (config.kind === "webhook") return summariseWebhook(config);
```

placed before the existing `isNewFormat` check.

### 5.2 `StartTriggerNode.jsx`

Add an `isWebhook` branch (checked before the existing broadcast/event branches). When true, the header still reads "Start Trigger" (webhook is a trigger kind, not a distinct header the way Broadcast is), but the body renders a compact info block instead of Entry/Audience/Exit:

- A row with a link/webhook icon, the truncated `webhookUrl` (middle-ellipsis, e.g. `https://bikapi.bikayi.app/…/7zHbtv…`), and a small copy button.
- A badge: `Unique ID: Phone Number ({{vas_id}})`.
- If `mappedVarCount > 0`, a small muted line: `N variable(s) mapped`.

The Audience and Exit sections are omitted entirely for webhook triggers (no `Step2WhoContent` was ever configured, so there's nothing to summarize there).

---

## 6. Out of Scope / Explicitly Deferred

- "API trigger" card — untouched, still falls through to `Step1WhenContent` as it does today.
- Real webhook ingestion, signature verification, or any network call — this is a UI/config-shape build only.
- Array index-level payload paths (`items[0].sku`, `items[1].sku`, …) — only the first array element is flattened, kept under the array's own path.
- Extract "All vs Part" subset selection on the payload variable list (present in BIK's UI) — all extracted variables are always available downstream.
