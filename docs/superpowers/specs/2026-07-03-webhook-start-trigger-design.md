# Webhook Start Trigger — Design Spec

**Date:** 2026-07-03
**Status:** Approved for implementation
**Audience:** Internal product team, designers, engineers
**Scope:** "Webhook trigger" card in Select Start Trigger → a dedicated configuration step, wired into the existing "Who will enter the flow" step and the Flow Builder canvas. Frontend-only (mocked), no real backend integration.

---

## 1. Overview

Today the catalogue already lists a "Webhook trigger" card under **Webhook and API → External signals**, but picking it drops the seller into the generic `Step1WhenContent` condition-builder — the same UI used for `Product Viewed` or `Order Placed` — which has no concept of a webhook URL, a sample payload, or mapping a third party's fields to a customer identity. It is effectively non-functional today.

This spec adds a dedicated Step 1, modeled on BIK's "Webhook as Trigger" flow (https://help.bik.ai/en/articles/8749985-webhook-as-triggers) but compressed from BIK's 3 separate screens into a single scrollable form, plus a mock "Send Test Event" affordance so the seller can validate their mapping before saving. Step 2 ("Who will enter the flow") is **not** replaced — it's the existing audience-qualification step, reused unchanged, since `eventCatalogue.json` already marks `Webhook trigger` as `audience_qualification_allow: true`.

Like the rest of this app, this is a frontend prototype: the webhook URL is generated client-side, the sample payload is parsed with `JSON.parse` in the browser, "sending a test event" is a client-side simulation, and there is no real endpoint receiving traffic. The goal is a fully faithful UI + config-shape build that a backend can later be wired behind.

**Non-goals:** the "API trigger" card (developer-initiated REST calls) is out of scope — it is a distinct concept and gets its own design later. No changes to any existing event/broadcast/date-relative trigger path.

---

## 2. Entry Point & Stage Wiring

No changes to `EventPickerModal.jsx` — the "Webhook trigger" card already exists in `eventCatalogue.json` and calls the existing `onPick(card)` callback.

`StartTriggerWizard.jsx` gains a third content-flag alongside the existing `isBroadcast` / `isDateRelative`, following the same pattern already used for `isDateRelative`: it swaps *what renders* at the existing `"step1"` stage rather than inventing new stage names.

```js
const [isWebhook, setIsWebhook] = useState(false);
const [webhookConfig, setWebhookConfig] = useState(emptyWebhookConfig());
```

In `onPickEvent`:

```js
} else if (card.name === "Webhook trigger") {
  setIsWebhook(true);
  setWebhookConfig(emptyWebhookConfig());
  setIsDateRelative(false);
  setStage("step1");
}
```

At render time:

```js
{stage === "step1" && isWebhook && (
  <WebhookTriggerStep1 config={webhookConfig} setConfig={setWebhookConfig} />
)}
{stage === "step1" && !isWebhook && !isDateRelative && (
  <Step1WhenContent ... />   // unchanged
)}
```

`skipStep2` needs no special-casing — it already evaluates `primaryCard.audience_qualification_allow`, which is `true` for the Webhook trigger card, so Step 2 renders normally via the existing `Step2WhoContent`.

`handleFinish` gains a matching branch (checked before the generic `"event"` branch):

```js
} else if (isWebhook) {
  config = { kind: "webhook", ...webhookConfig, audience };
}
```

Edit-mode hydration (`useEffect` on `initialConfig`) gains a matching branch: `initialConfig?.kind === "webhook"` → restore `webhookConfig` and `audience`, set `isWebhook = true`, `isDateRelative = false`, `stage = "step1"`.

The stepper label swaps its Step 1 text when `isWebhook` is true: `"1. Configure Webhook → 2. Who will enter the flow"` (Step 2's label and component are unchanged).

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
  variableMappings: [              // optional
    {
      payloadVariable: string,
      existingVariable: { category: string, group: string, key: string, label: string }
    }
  ],
  audience: <same shape Step2WhoContent already produces for every other event>,
}
```

`config.kind === "webhook"` is the sole discriminator, exactly like `"broadcast"`, `"broadcast_source"`, and `"date_relative"` today. The "Send Test Event" result is ephemeral UI state inside `WebhookTriggerStep1` — it is **not** persisted into `webhookConfig` (re-opening the wizard doesn't need to remember a stale test result).

---

## 4. New Files

### 4.1 `src/components/flows/builder/trigger/webhookHelpers.js`

Pure helper functions:

- `emptyWebhookConfig()` → returns the zero-state object above (`webhookUrl` generated immediately so the form always has something to display/copy).
- `generateWebhookUrl(seed)` → builds a mock URL in BIK's observed shape: `https://bikapi.bikayi.app/chatbot/webhook/{seed}?flow={flowSlug}`. `seed` is a short random id generated once and stored in config so it doesn't change on every re-render.
- `flattenPayload(jsonString)` → `{ variables: [{path, example}], error: string | null }`. Parses JSON, walks the tree:
  - Object keys become dot-paths (`order.customer.email`).
  - Arrays: only the first element is walked (to keep the variable list finite); its keys are flattened under the array's own path (`items.sku`).
  - Leaf values become the `example` (stringified).
  - Invalid JSON returns `{ variables: [], error: "<message>" }` without throwing.
- `simulateTestEvent(samplePayload, uniqueId)` → re-runs `flattenPayload`, and if it succeeds, also resolves `uniqueId.payloadVariable`'s current example value from the parsed payload. Returns `{ success: boolean, variableCount: number, resolvedIdValue: string | null, error: string | null }` — the shape the "Send Test Event" result panel renders directly.

### 4.2 `src/components/flows/builder/trigger/WebhookTriggerStep1.jsx`

A single scrollable form (no internal stepper) rendered at the wizard's existing `"step1"` stage, in this vertical order:

1. **Webhook URL** — read-only field + Copy button (`navigator.clipboard.writeText`).
2. **Authentication** — "Protect the Webhook with an authentication token" checkbox; checking it inline-reveals two fields (Header name, Token value) directly beneath, no separate modal.
3. **Sample Payload** — "Paste Sample Payload" textarea. On change (debounced or on blur), runs `flattenPayload()`; a live read-only list renders below showing `path → example` for each extracted variable. A parse error renders inline instead of the list.
4. **Send Test Event** button, enabled once the payload parses successfully. Calls `simulateTestEvent()` and renders a result panel:
   - Success: green panel — "Test event received — N variable(s) detected" plus, if `uniqueId` is already set, "Unique ID resolved to `<value>`".
   - Failure (shouldn't normally trigger since the button is gated on a successful parse, but handles a user editing the textarea after a prior successful test): red panel with the parse error.
5. **Unique ID** — "Type of ID" `<select>` with a single option `"Phone Number"` for v1 (a real dropdown, not hardcoded text, so adding ID types later is a one-line data change). "Payload Variable" is a searchable combobox (mirrors the existing `PropertyDropdown`/`GroupedSearchDropdown` popover pattern already in this codebase), populated only from `payloadVariables`, rendering each option as `{{path}}`. "+ Secondary ID (optional)" reveals an identical second Type/Variable pair, stored as `secondaryId`.
6. **Map Payload Variables to Existing Variables (optional)** — appears once `payloadVariables.length > 0`. One row per entry, pre-populated: `{ payloadVariable: path, existingVariable: null }`. "+ Add Field" appends a blank row so the same payload variable can be mapped again under a different existing variable. Right-side panel: search + grouped list — **Customer variables** (Basic, Custom Fields), **Flow variables**, **Store variables**, **Global variables** — small new flat mock arrays (`MOCK_EXISTING_VARIABLES` in `webhookHelpers.js`) of `{key, label}`, not reused from `ATTRIBUTE_GROUPS`.

"Next" (to Step 2) is disabled until: payload parses successfully AND `uniqueId.type` + `uniqueId.payloadVariable` are both set. Variable mapping stays optional.

---

## 5. Canvas Summary

### 5.1 `triggerNodeUtils.js`

Add `summariseWebhook(config)`, reusing the same `summariseAudienceNew()` helper `summariseNewFormat` already calls, since Step 2 is shared:

```js
function summariseWebhook(config) {
  const { whoLine, whoExtraCount, frequencyLine, audienceTypePill, audienceTab, audienceConditions, audienceCombinator } =
    summariseAudienceNew(config.audience);
  return {
    headerLabel: "Start Trigger",
    isWebhook: true,
    webhookUrl: config.webhookUrl,
    uniqueIdType: config.uniqueId?.type || null,
    uniqueIdVar: config.uniqueId?.payloadVariable || null,
    mappedVarCount: (config.variableMappings || []).filter(m => m.existingVariable).length,
    whoLine, whoExtraCount, frequencyLine, audienceTypePill, audienceTab, audienceConditions, audienceCombinator,
    noExitCondition: true,   // webhook has no exit-trigger UI
  };
}
```

Wire into `summariseTriggerConfig`, checked before the existing `isNewFormat` branch:

```js
if (config.kind === "webhook") return summariseWebhook(config);
```

### 5.2 `StartTriggerNode.jsx`

Add an `isWebhook` branch (checked before the existing broadcast/event branch) for the **Entry** section only:

- A row with a link/webhook icon, the truncated `webhookUrl` (middle-ellipsis, e.g. `https://bikapi.bikayi.app/…/7zHbtv…`), and a small copy button.
- A badge: `Unique ID: Phone Number ({{vas_id}})`.
- If `mappedVarCount > 0`, a small muted line: `N variable(s) mapped`.

The existing **Audience** section renders unchanged below it (webhook now populates `audience` via the shared Step 2, same as any other event). No Exit section — webhook triggers have no exit-trigger UI, matching `noExitCondition: true` above.

---

## 6. Out of Scope / Explicitly Deferred

- "API trigger" card — untouched, still falls through to `Step1WhenContent` as it does today.
- Real webhook ingestion, signature verification, or any network call. "Send Test Event" is a client-side simulation against the already-pasted sample payload, not a live listener.
- Array index-level payload paths (`items[0].sku`, `items[1].sku`, …) — only the first array element is flattened, kept under the array's own path.
- Extract "All vs Part" subset selection on the payload variable list (present in BIK's UI) — all extracted variables are always available downstream.
