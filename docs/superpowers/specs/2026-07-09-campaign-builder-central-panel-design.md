# Campaign Builder — Central Panel, Right Preview Gallery & Follow-up Behavior

**Status:** Design spec. Builds directly on top of the already-implemented entry flow (`docs/superpowers/specs/2026-07-09-campaign-builder-entry-flow-design.md` and its plan/implementation).

**Relationship to prior work:** The entry-flow spec explicitly deferred "Delivery Optimization / Template Resilience / Compliance sections" and "Audience Summary Card" as follow-up passes (its Section 9). This spec is that follow-up for the primary WhatsApp step's full config, the Right Preview Panel's template gallery, and a real gap discovered in the already-built follow-up Trigger Condition editor (Task 7 never added a behavior selector, despite the original `Campaign Builder.md` spec calling for one).

**Reference:** two screenshots of the target UI — one showing the full "Create WhatsApp Broadcast" 3-column screen (Broadcast Details / Broadcast Content gallery), one showing a follow-up step's "WhatsApp Follow-up conditions" panel (time picker + behavior checkboxes).

## 1. Right Preview Panel — Template Gallery

**Current state:** `CampaignContentPanel.jsx` renders `TemplateTab` for WhatsApp steps, which already has its own gallery via `UnifiedTemplateModal`'s browse view — but only once the seller has picked a sender number and template style. Before that, the Central/Right panels show plain empty states.

**New behavior:** Add a real gallery to `CampaignContentPanel.jsx` itself, shown whenever the step has no `channel_config.template` yet — a card grid of **all WhatsApp templates already in the system**, sourced from `src/data/mockTemplates.js`'s `MOCK_TEMPLATES` filtered to `channel === "whatsapp"` (7 templates today; this is the same dataset the existing Templates page renders, each with `name`, `category`, `quality.tier/label`, `status`). Clicking a card sets `channel_config.template` directly (no need to go through the sender-number/style-picker flow for a template that's already approved and exists in the system). Once `channel_config.template` is set, the panel falls through to the existing `TemplateTab` preview/edit behavior unchanged.

This only touches `CampaignContentPanel.jsx` — no change to `TemplateTab`, `UnifiedTemplateModal`, or the Templates page.

## 2. Central Panel — Broadcast Details (primary WhatsApp step)

A new component, `WhatsAppBroadcastDetails.jsx`, rendered by `CenterConfigPanel.jsx` in place of the current bare "Broadcast Name" field when `step.is_primary && step.channel === "whatsapp"`:

- **Broadcast Name** — stays exactly as already built (bound to `store.meta.name`, same field as the header).
- **Sender Number** — a `<select>` over the existing `WABA_NUMBERS` list (from `WhatsAppNode/data/mockTemplates.js`, unchanged), writing to `channel_config.wabaNumberId`.
- **Quality Rating / Messaging Limit** — new. A local mock map (`WABA_QUALITY_META`, keyed by the same `WABA_NUMBERS` ids) lives in the new component file — no change to the shared `WABA_NUMBERS` array. The strip renders only once `wabaNumberId` is set (no empty "— —" placeholder, per the original spec's correction).
- **Send To** — renders `BroadcastSourceStep1` and `BroadcastSourceStep2` (from `src/components/flows/builder/trigger/`, unchanged, reused as-is per their existing plain state/setter prop contract) wired to a new `channel_config.audience` shape: `{ sourceType, broadcastSourceConfig, broadcastSourceSchedule, audienceFilters }` — replacing the entry-flow spec's placeholder `{mode, segments_or_lists, suppression_lists}` shape for the primary step only (follow-up steps keep `audience.mode: "computed"`, unaffected).
- **Don't Send To** — a simple `<select>`, default value `"WhatsApp suppression list"`, backed by a small static mock list local to the new component (no existing suppression-list data source found — genuinely new, minimal).
- **Add UTM Tracking** — toggle + 3 fields (Source/Medium/Campaign), new campaign-only state on `channel_config.utm`, defaults: Source `"Engage 360"`, Medium `"WhatsApp"`, Campaign `` `${meta.name} ${formattedDate}` ``.

## 3. Central Panel — Delivery Optimization (new section, campaign-only)

Per your decision not to reuse/modify Flow Builder's `DeliveryTab`, this is new UI, added to the same `WhatsAppBroadcastDetails.jsx`:

- **AI Smart Send** toggle — boolean, `channel_config.aiSmartSend`.
- **Smart Retry** toggle + **Retry Time Window** number input (max 72h) — `channel_config.smartRetry = { enabled, windowHours }`. Note this is a different (simpler) shape than Flow Builder's `smartRetry.mode`/`manualSlots` — campaign-only, no cross-contamination with the Flow Builder node's own `smartRetry` field, since they live in separate stores entirely.

## 4. Central Panel — Template Resilience (fallback, extracted)

**Extraction from `WhatsAppRightPanel.jsx`:** the fallback JSX currently inline inside `TemplateTab` (lines 466-486 today: the `Label` + `Toggle` + conditional picker/remove block, gated on `template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input"`) is pulled into a new named export, `FallbackTemplateSection({ data, patch })`, containing exactly that block's toggle-and-picker behavior — byte-identical UI/logic to what Flow Builder already does, just callable standalone. `TemplateTab` is updated to call `<FallbackTemplateSection data={data} patch={patch} />` in place of the inline block it already had — **zero behavior change for Flow Builder**, pure refactor.

**Campaign Builder's own new file**, `TemplateResilienceSection.jsx`:
- Renders `<FallbackTemplateSection data={step.channel_config} patch={...} />` only once `channel_config.template` is set (mirrors the same gating Flow Builder already applies), otherwise shows a hint ("Select a template first").
- Adds its own **Fallback Template Category Change** toggle (`channel_config.fallback.categoryChangeEnabled`), dependent on `fallback.enabled` — this toggle is Campaign-Builder-only, not part of the shared `FallbackTemplateSection`, per your decision to keep Flow Builder's node panel unchanged beyond the base extraction.

## 5. Central Panel — Compliance & Delivery Window (new section, campaign-only)

Also new, in `WhatsAppBroadcastDetails.jsx` (or a small sibling file if the parent grows too large — implementation plan will decide the exact split):

- **Enable International Audience** toggle — boolean, `channel_config.internationalAudience`.
- **Set Validity Window** — toggle for custom vs. standard; when custom, a number input in minutes. `channel_config.validityWindow = { custom: boolean, minutes }`, defaulting to `{ custom: false, minutes: 10 }`.
- **Pricing view** — static text, computed inline (no new state): `₹1.5 × <resolved audience count from Section 2's audience step>`. No persistence needed beyond what Section 2 already stores.

## 6. Follow-up step Central Panel — Time + Behavior (fixes a real Task 7 gap)

Task 7 built the delay/date timing toggle but never added a behavior selector at all — the store's `trigger_condition.behavior` field has existed since Task 2 but was never wired to any UI. Per the original spec ("behavior conditions still need how long to wait before evaluating the behavior") and the new reference screenshot, time and behavior are not alternate modes — every follow-up step shows both, always, together:

- **Set follow-up time** — the existing delay/date toggle in `TriggerConditionEditor.jsx`, unchanged.
- **Send to users** — new: a single-select, checkbox-styled group (visually checkboxes, behaviorally exclusive — selecting one clears any other), with exactly these 4 options and copy:
  - "Primary broadcast received, but not viewed" → `behavior: "delivered_not_viewed"`
  - "Primary broadcast viewed, but CTA not clicked" → `behavior: "viewed_not_clicked"`
  - "Primary broadcast CTA clicked" → `behavior: "clicked"`
  - "Primary broadcast failed" → `behavior: "failed"`

  Defaults to `"delivered_not_viewed"` on a newly-created follow-up step (`addFollowupStep`'s `defaultTriggerCondition` gets this default instead of `null`).

**Data model simplification:** `trigger_condition.condition_type` (currently `"time_elapsed"`, set but never read by any UI) is dropped — behavior is now always present rather than an alternate condition type. `campaignBuilderStore.js`'s `defaultTriggerCondition` drops the `condition_type` field entirely.

## 7. Summary of file changes

- Modify: `src/components/flows/builder/nodes/WhatsAppNode/WhatsAppRightPanel.jsx` — extract `FallbackTemplateSection` (new named export), `TemplateTab` calls it instead of its inline block. Pure refactor, no behavior change.
- Modify: `src/components/campaigns/builder/CampaignContentPanel.jsx` — add the template gallery for the no-template state.
- Modify: `src/components/campaigns/builder/CenterConfigPanel.jsx` — render `WhatsAppBroadcastDetails` for the primary WhatsApp step instead of the bare name field.
- Modify: `src/components/campaigns/builder/TriggerConditionEditor.jsx` — add the "Send to users" behavior selector alongside the existing timing UI.
- Modify: `src/store/campaignBuilderStore.js` — extend `channel_config`'s audience/utm/smartRetry/fallback/internationalAudience/validityWindow shape for the primary WhatsApp step; drop `condition_type`, default `behavior` to `"delivered_not_viewed"`.
- Create: `src/components/campaigns/builder/WhatsAppBroadcastDetails.jsx` (Sections 2, 3, 5 above — exact file split decided at plan time).
- Create: `src/components/campaigns/builder/TemplateResilienceSection.jsx` (Section 4 above).

## 8. Out of scope (still deferred)

Audience Summary Card (live recalculation, AI suggestions), Save & Schedule modal, Header actions (Switch to Flow Builder, Test Mode, Save & Schedule button), campaign list page real data wiring. These remain the next follow-up passes per the entry-flow spec's Section 9, now further specified as their own future design docs.
