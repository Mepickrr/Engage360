# Design: Date & Time Start Trigger — Step 1 Redesign

**Date:** 2026-07-04
**Applies to:** Flow Builder V1 (`FlowBuilder.jsx`) and Flow Builder V2 (`FlowBuilderV2.jsx`) — both share the same trigger components under `src/components/flows/builder/trigger/`.

---

## Objective

The Start Trigger's purpose is to let sellers build automation around time-based moments — birthday, anniversary, order date, restock, price drop — so the brand can reach the customer at the moment that matters, without engineering involvement.

Today, the "Date and time" catalogue section is inconsistent:

- Five events (`date_of_birth_trigger`, `anniversary_date_trigger`, `account_created_date_trigger`, `first_order_date_trigger`, `subscription_start_date_trigger`) already route to a clean before/on/after + recurring UI (`DateRelativeTriggerContent`) — but their catalogue `name` is a raw slug, so the event picker literally shows "date_of_birth_trigger" as a card title.
- Three older cards (`Birthday`, `Anniversary`, `Custom date attribute`) duplicate those same concepts but still route to the generic attribute-condition builder (`Step1WhenContent`), which shows an "event attribute selection" UI that makes no sense for a date-based trigger.
- Two system-driven events (`Back in Stock`, `Price Drop`) also route to `Step1WhenContent`'s attribute-condition builder, which is equally wrong for them — they don't need attribute filtering, just a time offset.

This design removes the attribute-condition concept from the entire "Date and time" section and replaces it with two purpose-built step-1 experiences.

---

## Two Trigger Shapes

### A. User-attribute time events

Birthday, Anniversary, Custom date attribute, Account Created, First Order Date, Subscription Start Date.

The seller anchors the trigger to a date on the user's profile (or derived from an event, like first order date) and defines an offset:

> Trigger **[Before / On / After]** **[X]** **[Days / Weeks / Months]** user's **[date attribute ▾]**

Plus a **Repeat annually** checkbox (checked by default), so the same trigger fires every year on the same relative offset without the seller recreating it.

This is exactly the existing `DateRelativeTriggerContent` UI — it stays, with three fixes (below).

### B. System-driven events

Back in Stock, Price Drop.

These are not tied to a user profile date — they're tied to a product event with a single, one-time follow-up window. No "before," no recurrence — the event either happens or it doesn't.

> Trigger **[X]** **[Hours / Days / Weeks]** after **{event}** fires

---

## Catalogue Changes (`src/data/eventCatalogue.json`)

Applies to both the `"Date and time"` header and the mirrored `"ALL"` bucket (both currently duplicate this section — same edits required in both places, matching the existing pattern in the file).

1. **Delete** the legacy `Birthday`, `Anniversary`, `Custom date attribute` cards (the ones with `attribute_allowed: true`, no `date_relative` flag).
2. **Rename** the five `*_trigger` cards' `name` field to their friendly display name:
   - `date_of_birth_trigger` → `Birthday`
   - `anniversary_date_trigger` → `Anniversary`
   - `account_created_date_trigger` → `Account Created`
   - `first_order_date_trigger` → `First Order Date`
   - `subscription_start_date_trigger` → `Subscription Start Date`

   These keep `date_relative: true`, `attribute_allowed: false`, `audience_qualification_allow: true`.
3. **Add** a new `Custom date attribute` card under "User date attributes" with `date_relative: true`, description "Start this flow relative to any date field on the customer's profile."
4. **Flag** `Back in Stock` and `Price Drop` (under "Product") with `system_event_relative: true`, and set `attribute_allowed: false` (removing them from the attribute-condition path). `audience_qualification_allow` stays `true` so Step 2 still runs.

Each renamed/added card needs a stable internal key distinct from its display `name`, since `date_of_birth`, `anniversary_date`, etc. are also used as **attribute values** inside `DateRelativeTriggerContent`'s dropdown. Add an `attribute_key` field to each date-relative card (e.g. `"attribute_key": "date_of_birth"`) so the wizard can map "which card was clicked" → "which attribute to preselect" without string-matching on the display name.

---

## `DateRelativeTriggerContent.jsx` Changes

1. **Pre-select the attribute.** Today, clicking any of the five cards opens the picker with `attribute: ""` — the seller has to reselect from scratch. `StartTriggerWizard` will pass the clicked card's `attribute_key` into `emptyDateConfig()`, so e.g. clicking "Birthday" opens with "Date of Birth" already selected. The seller can still change it via the inline dropdown — that flexibility is preserved (matches the original PRD: "seller can switch between date attributes using an inline dropdown without returning to the event picker").
2. **Add "Custom date attribute" to `DATE_ATTRIBUTE_GROUPS`**, under a new "Custom" group.
3. **Conditional field-key input.** When `dateConfig.attribute === "custom_date_attribute"`, render a text input below the main row: label "Which date field?", placeholder "e.g. subscription_renewal_date". Stored as `dateConfig.customFieldKey`. Hidden for all other attribute selections.

No changes to the direction/offset/recurrence UI — that part already matches the target design.

---

## New Component: `EventOffsetTriggerContent.jsx`

Mirrors the visual language of `DateRelativeTriggerContent` (same card shell, same section-label styling) but with a single row:

> **Trigger** **[value input]** **[unit select: Hours / Days / Weeks]** **after {event name} fires**

- `event name` is read-only text sourced from the clicked card (`triggerGroups[0].event` equivalent) — not editable here.
- Default: `{ value: 1, unit: "Hours" }`.
- No direction, no recurrence, no attribute picker.

```js
export function emptyEventOffsetConfig(eventName) {
  return { event: eventName, value: 1, unit: "Hours" };
}
```

---

## `StartTriggerWizard.jsx` Wiring

New state, mirroring the existing `isDateRelative` / `dateConfig` pair:

```js
const [isEventOffset, setIsEventOffset] = useState(false);
const [eventOffsetConfig, setEventOffsetConfig] = useState(emptyEventOffsetConfig(""));
```

**`onPickEvent`** — add a branch before the final `else`:

```js
} else if (card.system_event_relative) {
  setIsWebhook(false);
  setIsDateRelative(false);
  setIsEventOffset(true);
  setEventOffsetConfig(emptyEventOffsetConfig(card.name));
  setStage("step1");
} else if (card.date_relative) {
  setIsWebhook(false);
  setIsEventOffset(false);
  setIsDateRelative(true);
  setDateConfig(emptyDateConfig(card.attribute_key));
  setStage("step1");
}
```

(`isEventOffset` reset to `false` in every other branch, and in the "no initialConfig" reset block, and in the `onPickEvent`'s second branch used for re-picking a group's event — that branch doesn't apply to date/time or system-event cards today and stays as-is.)

**Hydration** (edit mode) — add a branch alongside the existing `kind === "date_relative"` check:

```js
} else if (initialConfig?.kind === "event_offset") {
  setIsWebhook(false);
  setIsDateRelative(false);
  setIsEventOffset(true);
  setEventOffsetConfig(initialConfig.eventOffsetConfig || emptyEventOffsetConfig(""));
  setStage("step1");
}
```

**Render** — add alongside the existing `isDateRelative` render branch:

```jsx
{stage === "step1" && isEventOffset && (
  <EventOffsetTriggerContent
    config={eventOffsetConfig}
    setConfig={setEventOffsetConfig}
  />
)}
```

**`handleFinish`** — add a branch:

```js
} else if (isEventOffset) {
  config = { kind: "event_offset", eventOffsetConfig, audience };
}
```

**Step 2 behavior is unchanged.** `skipStep2 = !isDateRelative && primaryCard && !primaryCard.audience_qualification_allow` already evaluates to `false` for `Back in Stock` / `Price Drop` (their `audience_qualification_allow` stays `true`), so Step 2 continues to render exactly as it does today. No formula change needed.

---

## Canvas Summary (`triggerNodeUtils.js` + `StartTriggerNode.jsx`)

Today `summariseTriggerConfig` has no branch for `kind === "date_relative"` — those trigger nodes render with an empty/fallback summary on canvas, which is a pre-existing gap. This design closes it for both kinds, following the pattern established by the recent webhook summary work (`summariseWebhook`, rendered via `StartTriggerNode.jsx`).

Add two functions:

```js
function summariseDateRelative(config) {
  const { whoLine, whoExtraCount, frequencyLine } = summariseAudienceNew(config.audience);
  const { attribute, direction, value, unit, repeat_annually, customFieldKey } = config.dateConfig || {};
  const attrLabel = attribute === "custom_date_attribute" ? (customFieldKey || "custom date") : ATTRIBUTE_LABELS[attribute] || attribute;
  const offsetLine = direction === "on"
    ? `On ${attrLabel}`
    : `${value} ${unit} ${direction} ${attrLabel}`;
  return {
    headerLabel: "Start Trigger",
    kindLabel: "Date & time",
    offsetLine,
    recurrenceLine: repeat_annually ? "Repeats yearly" : null,
    whoLine, whoExtraCount, frequencyLine,
  };
}

function summariseEventOffset(config) {
  const { whoLine, whoExtraCount, frequencyLine } = summariseAudienceNew(config.audience);
  const { event, value, unit } = config.eventOffsetConfig || {};
  return {
    headerLabel: "Start Trigger",
    kindLabel: "Date & time",
    offsetLine: `${value} ${unit} after ${event}`,
    whoLine, whoExtraCount, frequencyLine,
  };
}
```

Wired into `summariseTriggerConfig`:

```js
if (config.kind === "webhook") return summariseWebhook(config);
if (config.kind === "date_relative") return summariseDateRelative(config);
if (config.kind === "event_offset") return summariseEventOffset(config);
```

`StartTriggerNode.jsx` gets a small addition to render `offsetLine` / `recurrenceLine` when present — same card-row pattern already used for the webhook summary and the existing `whoLine`/`frequencyLine` rows.

`ATTRIBUTE_LABELS` is a small local lookup (`date_of_birth` → "Date of Birth", etc.) reused from the `DATE_ATTRIBUTE_GROUPS` data or duplicated minimally in `triggerNodeUtils.js` — implementation detail for the plan to settle, not a design fork.

---

## Files Changed

| File | Change |
|---|---|
| `src/data/eventCatalogue.json` | Delete 3 legacy cards, rename 5 `*_trigger` cards, add `Custom date attribute`, add `attribute_key` to date-relative cards, flag `Back in Stock`/`Price Drop` with `system_event_relative` (both the `"Date and time"` header and mirrored `"ALL"` bucket) |
| `src/components/flows/builder/trigger/DateRelativeTriggerContent.jsx` | Pre-select attribute from `attribute_key`; add Custom date attribute group + conditional field-key input |
| `src/components/flows/builder/trigger/EventOffsetTriggerContent.jsx` | **New** — value + unit + static event-name row |
| `src/components/flows/builder/trigger/StartTriggerWizard.jsx` | New `isEventOffset`/`eventOffsetConfig` state; picker, hydration, render, and finish wiring |
| `src/components/flows/builder/triggerNodeUtils.js` | Add `summariseDateRelative`, `summariseEventOffset`; wire into `summariseTriggerConfig` |
| `src/components/flows/builder/StartTriggerNode.jsx` | Render `offsetLine`/`recurrenceLine` on canvas card |

---

## Out of Scope

- `Step1WhenContent.jsx` and the attribute-condition builder itself are untouched — they still serve every other catalogue section (Cart, Checkout, etc.). This design only stops "Date and time" cards from routing into it.
- No backend/API changes — `dateConfig` and `eventOffsetConfig` remain client-side wizard state, consistent with the rest of the trigger wizard's current mock-data approach.
- Step 2 (Who) logic, audience filters, entry rules — unchanged, confirmed to already work correctly for this section.
- Custom date attribute's field key is a free-text input in this pass (no live validation against the seller's actual profile schema) — matches the "any date field" framing in the existing catalogue description and the prototype-level fidelity of the rest of the wizard.
