# Campaign Builder — Central Panel, Right Preview Gallery & Follow-up Behavior

**Status:** Design spec, revised after a rejected first draft. Builds directly on top of the already-implemented entry flow (`docs/superpowers/specs/2026-07-09-campaign-builder-entry-flow-design.md` and its plan/implementation).

**Relationship to prior work:** The entry-flow spec explicitly deferred "Delivery Optimization / Template Resilience / Compliance sections" and "Audience Summary Card" as follow-up passes (its Section 9). This spec is that follow-up for the primary WhatsApp step's full config, the Right Preview Panel's template gallery, and a real gap discovered in the already-built follow-up Trigger Condition editor (Task 7 never added a behavior selector, despite the original `Campaign Builder.md` spec calling for one).

**Revision note:** the first draft of this spec reused Flow Builder's `TemplateTab` (sender number + style picker + fallback, bundled together) directly inside the Right Preview Panel. That was rejected — it imports Flow Builder's node-panel UX into what should be a pure template-display surface, and duplicates configuration that belongs in the Central Panel. This revision separates the two cleanly: **Central Panel owns every configuration field** (including Sender Number); **Right Panel only ever displays templates** (gallery or single preview), never configures anything.

**Reference:** three screenshots of the target UI — the full "Create WhatsApp Broadcast" 3-column screen, a follow-up step's "WhatsApp Follow-up conditions" panel, and this revision's clarification of Right Panel hover behavior (Confirm/Edit/Analytics/Quality on each gallery card) and the edit modal's exact field list.

## 1. Right Preview Panel — Gallery mode

Shown whenever the step has no `channel_config.template` yet. A card grid of **all WhatsApp templates already in the system**, sourced from `src/data/mockTemplates.js`'s `MOCK_TEMPLATES` filtered to `channel === "whatsapp"` (7 templates today — the same dataset the existing Templates page renders, each with `name`, `category`, `quality.tier/label`, `status`, `analytics`).

Each card, on hover, reveals an overlay with: **Confirm** (select this template — sets `channel_config.template`), **Edit** (opens the edit modal, Section 4, pre-filled), and inline **Quality Rating** + **Analytics** summary (reusing the same `quality`/`analytics` fields the Templates page already renders — no new data needed). This is deliberately modeled on the existing Templates page's card treatment, not on any Flow Builder node UI.

**New component**, `TemplateGalleryPanel.jsx` (owned by Campaign Builder, not shared with Flow Builder) — no dependency on `TemplateTab`, `TemplateStylePicker`, or sender-number selection.

## 2. Right Preview Panel — Preview mode

Once `channel_config.template` is set, the gallery grid disappears entirely and is replaced by a single, full preview of the selected template — "shown solely on the panel," per your correction. The template's name is displayed prominently at the top. Below it: the rendered bubble preview via `TemplatePreview.jsx` (`WhatsAppNode/TemplatePreview.jsx` — already exists, already renders exactly the header/body/footer/buttons bubble style used elsewhere in the system), plus **Change Template** (returns to Gallery mode) and **Edit** (opens the edit modal, Section 4, pre-filled) affordances.

**Data shape reconciliation:** `src/data/mockTemplates.js` entries (`{ preview: { header, body, footer, buttons }, analytics, quality, ... }`) and `TemplatePreview.jsx`/`WhatsAppBubblePreview.jsx`/the edit modal's `GenericEditForm` (which all expect a flat `{ header, body, footer, buttons, name, category, language }` shape, matching `WhatsAppNode/data/mockTemplates.js`'s entries) are two different, incompatible datasets — confirmed no shared IDs, no shared shape, and button-type casing differs (`"url"` vs `"URL"`). A small adapter function, `mapCatalogTemplateToDraft(entry)`, unwraps `entry.preview.*` into the flat shape (normalizing button-type casing) whenever a gallery-selected template needs to go into `TemplatePreview`, `WhatsAppBubblePreview`, or the edit modal. This is the only new "glue" code this spec introduces between the two datasets.

## 3. Central Panel — Broadcast Details (primary WhatsApp step, ALL configuration lives here)

A new component, `WhatsAppBroadcastDetails.jsx`, rendered by `CenterConfigPanel.jsx` in place of the current bare "Broadcast Name" field when `step.is_primary && step.channel === "whatsapp"`. This is the single home for every config field — nothing here defers to the Right Panel except the template's own name/content, which the Right Panel owns display of:

- **Broadcast Name** — stays exactly as already built (bound to `store.meta.name`, same field as the header).
- **Sender Number** — a `<select>` over the existing `WABA_NUMBERS` list (from `WhatsAppNode/data/mockTemplates.js`, unchanged), writing to `channel_config.wabaNumberId`. Lives here, not in the Right Panel.
- **Quality Rating / Messaging Limit** — new. A local mock map (`WABA_QUALITY_META`, keyed by the same `WABA_NUMBERS` ids) lives in this new component file — no change to the shared `WABA_NUMBERS` array. The strip renders only once `wabaNumberId` is set (no empty "— —" placeholder, per the original spec's correction).
- **Selected template summary** — a read-only line showing the currently selected template's name (or "No template selected" + a "Choose template" link that focuses the Right Panel), per the original spec's cross-panel affordance: template selection/editing is reachable from both panels, but the Central Panel never hosts the picker itself.
- **Send To** — renders `BroadcastSourceStep1` and `BroadcastSourceStep2` (from `src/components/flows/builder/trigger/`, unchanged, reused as-is per their existing plain state/setter prop contract) wired to a new `channel_config.audience` shape: `{ sourceType, broadcastSourceConfig, broadcastSourceSchedule, audienceFilters }` — replacing the entry-flow spec's placeholder `{mode, segments_or_lists, suppression_lists}` shape for the primary step only (follow-up steps keep `audience.mode: "computed"`, unaffected).
- **Don't Send To** — a simple `<select>`, default value `"WhatsApp suppression list"`, backed by a small static mock list local to the new component (no existing suppression-list data source found — genuinely new, minimal).
- **Add UTM Tracking** — toggle + 3 fields (Source/Medium/Campaign), new campaign-only state on `channel_config.utm`, defaults: Source `"Engage 360"`, Medium `"WhatsApp"`, Campaign `` `${meta.name} ${formattedDate}` ``.
- **AI Smart Send** toggle — boolean, `channel_config.aiSmartSend`.
- **Smart Retry** toggle + **Retry Time Window** number input (max 72h) — `channel_config.smartRetry = { enabled, windowHours }`. Campaign-only shape, independent of Flow Builder's own `smartRetry.mode`/`manualSlots` field (separate stores, no cross-contamination).
- **Fallback Template** toggle + picker — see Section 5 (extracted, shared component).
- **Fallback Template Category Change** toggle, dependent on the above — Campaign-Builder-only (not shared with Flow Builder, per your earlier decision).
- **Enable International Audience** toggle — boolean, `channel_config.internationalAudience`.
- **Set Validity Window** — toggle for custom vs. standard; when custom, a number input in minutes. `channel_config.validityWindow = { custom: boolean, minutes }`, defaulting to `{ custom: false, minutes: 10 }`.
- **Pricing view** — static text, computed inline (no new state): `₹1.5 × <resolved audience count from Send To>`.

(Implementation plan decides whether this becomes one large file or is split into sub-sections — e.g. `WhatsAppBroadcastDetails.jsx` composing smaller pieces — but architecturally all of it is Central Panel content, none of it Right Panel content.)

## 4. Template edit/create modal — reuse `UnifiedTemplateModal`, add 2 new buttons (shared with Flow Builder)

`UnifiedTemplateModal` already is the split-view described: left pane = structural form (`GenericEditForm` over `STANDARD_FIELDS`: name, category, language, header type [none/image/video/document], body with placeholder tokens, footer, buttons), right pane = live `WhatsAppBubblePreview` that updates as the left form changes. This is reused as-is for both Campaign Builder (via the adapter from Section 2) and Flow Builder (unchanged).

**Two new additions, shared (both builders get them):**
- **AI Enhance** button, next to the body field: on click, replaces `draft.body` with one mocked AI-rewritten variant of the current body text (no real AI call — a simple canned transformation, e.g. tightening phrasing/adding an emoji, consistent with this app's other `previewToast()`-style mocked interactions). Single action, not a multi-suggestion picker — keeps the interaction simple.
- **Upload & Submit** button, replacing/alongside the existing "Cancel"/"Save" pair: on click, sets `draft.status` to a "pending review" state and shows a confirmation toast (mocked — no real Meta submission), then closes the modal same as Save does today.

Both are additive to `UnifiedTemplateModal.jsx` only — no change to `GenericEditForm`, `WhatsAppBubblePreview`, or any field definition.

## 5. Fallback Template — extracted, shared component

The fallback JSX currently inline inside `TemplateTab` (in `WhatsAppRightPanel.jsx`: the `Label` + `Toggle` + conditional picker/remove block, gated on `template && !styleInfo?.mapsTo && resolvedStyleId !== "collect_input"`) is pulled into a new named export, `FallbackTemplateSection({ data, patch })` — byte-identical UI/logic to what Flow Builder already does, just callable standalone. `TemplateTab` calls it in place of its inline block — **zero behavior change for Flow Builder**, pure refactor.

Campaign Builder's `WhatsAppBroadcastDetails.jsx` renders `<FallbackTemplateSection data={step.channel_config} patch={...} />` directly (Section 3), gated on `channel_config.template` being set — no dependency on `TemplateTab` or any sender-number/style-picker context.

## 6. Follow-up step Central Panel — Time + Behavior (fixes a real Task 7 gap)

Task 7 built the delay/date timing toggle but never added a behavior selector at all — the store's `trigger_condition.behavior` field has existed since Task 2 but was never wired to any UI. Per the original spec ("behavior conditions still need how long to wait before evaluating the behavior") and the reference screenshot, time and behavior are not alternate modes — every follow-up step shows both, always, together:

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
- Modify: `src/components/flows/builder/nodes/WhatsAppNode/UnifiedTemplateModal.jsx` — add AI Enhance and Upload & Submit buttons (shared with Flow Builder).
- Rewrite: `src/components/campaigns/builder/CampaignContentPanel.jsx` — becomes a thin switcher between `TemplateGalleryPanel` (no template) and the Preview-mode UI (template set); no longer imports or renders `TemplateTab` at all.
- Create: `src/components/campaigns/builder/TemplateGalleryPanel.jsx` (Section 1).
- Create: a small adapter module (exact location decided at plan time) exporting `mapCatalogTemplateToDraft` (Section 2).
- Modify: `src/components/campaigns/builder/CenterConfigPanel.jsx` — render `WhatsAppBroadcastDetails` for the primary WhatsApp step instead of the bare name field.
- Create: `src/components/campaigns/builder/WhatsAppBroadcastDetails.jsx` (Section 3 — all primary-step config, including Sender Number and the extracted `FallbackTemplateSection`).
- Modify: `src/components/campaigns/builder/TriggerConditionEditor.jsx` — add the "Send to users" behavior selector alongside the existing timing UI.
- Modify: `src/store/campaignBuilderStore.js` — extend `channel_config`'s audience/utm/smartRetry/fallback/internationalAudience/validityWindow shape for the primary WhatsApp step; drop `condition_type`, default `behavior` to `"delivered_not_viewed"`.

## 8. Out of scope (still deferred)

Audience Summary Card (live recalculation, AI suggestions), Save & Schedule modal, Header actions (Switch to Flow Builder, Test Mode, Save & Schedule button), campaign list page real data wiring. These remain the next follow-up passes per the entry-flow spec's Section 9, now further specified as their own future design docs.
