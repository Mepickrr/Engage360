# SMS Node — Template Style & Template Picker (WhatsApp-Parity Design)

## Context

The SMS node (`src/components/flows/builder/nodes/SMSNode/`) exists in both FlowBuilder (v1) and FlowBuilderV2 — both pages render the same shared `Canvas`/node-tree, so there is no per-variant fork. Today its right-panel `TemplateTab` (`SMSRightPanel.jsx`) is far simpler than the WhatsApp node's: it jumps straight to a "Create New" / "Select Existing" choice, backed by a flat, hover-less list overlay (`SMSTemplatePicker`). There is no provider/sender-number gate, no template-style categorization, and no hover-triggered edit/analytics affordances.

The WhatsApp node (`WhatsAppNode/`) already has the richer pattern this work should bring to SMS:
- A step-0 gate (`WhatsAppRightPanel.jsx` `TemplateTab`, lines ~363-406) that requires a sender number before showing the template-style picker.
- A `TemplateStylePicker` / `StyleCard` grid (icon + title, hover tooltip for description) that sets `data.templateStyle`.
- A central `UnifiedTemplateModal` with a Browse view (search, "+ Create new", grid of `TemplateCard`s) and an Edit view (form + live bubble preview split pane).
- Hover-triggered actions on each `TemplateCard`: Edit, Analytics (opens `TemplateAnalyticsPopover`), Select (quick-select).

This spec brings the same UX to the SMS node, adapted to SMS's simpler, category-based (Transactional/Promotional) DLT world. **Revision:** the modal shell, hover-action bar, and analytics popover are substantial, already-tested WhatsApp code (`UnifiedTemplateModal.jsx`, `TemplateAnalyticsPopover.jsx`) — duplicating them into SMS-specific copies would mean maintaining two copies of the same backdrop/grid/hover-bar/positioning logic. Instead, both files are generalized in place with a small set of optional, backward-compatible props (theme color, config registry, preview component, analytics data/metrics, a custom-form render prop) — the WhatsApp node passes none of them and behaves identically to today; the SMS node passes its own. There's already precedent for cross-node reuse of `UnifiedTemplateModal` (`CampaignContentPanel.jsx` already imports it directly from `WhatsAppNode/`), so this follows an established pattern rather than introducing a new "shared" folder.

## Goals

1. Right panel Template tab, before any template exists, first asks for **Provider** and **Sender ID** (SMS's analog to WhatsApp's sender-number gate).
2. Once both are chosen, show a **Template Style** picker: two cards — **Transactional** and **Promotional** — each with icon, title, and an always-visible short description (unlike WhatsApp's hover-only tooltip, since there are only 2 cards and room to spare).
3. Selecting a style opens a **central modal** template picker (WhatsApp-style): Browse view listing templates filtered to that style/category, with search and "+ Create new"; hovering a template card reveals **Edit**, **Analytics**, and **Select** actions, matching WhatsApp's hover bar.
4. Analytics popover shows SMS-appropriate metrics only: **Sent**, **Delivered**, **Failed** (no read receipts or CTR — SMS doesn't support them).
5. No FlowBuilder v1/v2 divergence needed — this ships as shared code, same as the rest of the SMS node.

## Non-goals

- No backend/API integration — this is mock-data-driven UI, matching the existing WhatsApp and SMS node conventions (`data/mockData.js`, `data/mockTemplates.js` are all static arrays).
- No relocation of `UnifiedTemplateModal.jsx`/`TemplateAnalyticsPopover.jsx` into a new "shared" folder, and no behavior change for existing WhatsApp call sites (`WhatsAppRightPanel.jsx`, `CampaignContentPanel.jsx`) — generalization is additive-only (new optional props with defaults that reproduce today's WhatsApp behavior exactly).
- No rewrite of the three WhatsApp-only bespoke forms (Carousel/List/CollectInput) or their `styleId`-keyed branches inside `UnifiedTemplateModal.jsx` — left untouched.
- No "Meta insights" style benchmarking/recommendations section in SMS analytics — out of scope, WhatsApp/Meta-specific.
- No changes to the Delivery or Output tabs.

## Data model changes

File: `src/components/flows/builder/nodes/SMSNode/data/mockData.js`

Replace `SMS_GATEWAYS` (which today conflates provider + category, e.g. `"TRUSTSIGNAL - Promotional"`) with two category-agnostic lists, plus a template-level category field:

```js
export const SMS_PROVIDERS = [
  { id: "trustsignal", name: "TrustSignal" },
  { id: "msg91",       name: "MSG91" },
  { id: "kaleyra",     name: "Kaleyra" },
];

export const SMS_SENDER_IDS = [
  { id: "trustsignal_txtind", providerId: "trustsignal", senderId: "TXTIND", status: "active" },
  { id: "trustsignal_shprkt", providerId: "trustsignal", senderId: "SHPRKT", status: "active" },
  { id: "msg91_avimee",       providerId: "msg91",       senderId: "AVIMEE", status: "active" },
  { id: "kaleyra_studdm",     providerId: "kaleyra",     senderId: "STUDDM", status: "inactive" },
];
```

`MOCK_SMS_TEMPLATES` entries drop `gateway` and gain `category: "transactional" | "promotional"` (category lives on the template, not the provider/sender — a provider+sender pair can send both categories; the Template Style step is purely a template filter, decided in the "Category field" clarifying question).

New style catalogue (analog to WhatsApp's `TEMPLATE_STYLE_GROUPS`, but flat — just 2 items, no grouping needed):

```js
export const SMS_TEMPLATE_STYLES = [
  { id: "transactional", label: "Transactional", Icon: PackageCheck,
    desc: "Order updates, OTPs, delivery alerts — sent to a specific customer about their own activity." },
  { id: "promotional", label: "Promotional", Icon: Megaphone,
    desc: "Marketing blasts, offers, and sale alerts — sent to customers who've opted in to promotions." },
];
```

Both icons (`PackageCheck`, `Megaphone`) come from `lucide-react`, the same icon library already used throughout `WhatsAppRightPanel.jsx` (`PackageCheck` is already imported there for the "Order Confirmation Status" style card, at line 67).

`defaultSMSNodeData` gains `providerId: null, senderIdId: null, templateStyle: null` alongside the existing `template: null`.

## Right panel: Step-0 gate + Template Style picker

File: `SMSRightPanel.jsx`, `TemplateTab` component — rewritten to mirror `WhatsAppRightPanel.jsx`'s `TemplateTab` step-0 gate (lines ~373-406), extended by one extra field:

**Step 0** — rendered while `!providerId || !senderIdId || !templateStyle`:
1. `Label` "Provider" + `<select>` bound to `data.providerId`, options from `SMS_PROVIDERS`.
2. Once `providerId` is set: `Label` "Sender ID" + `<select>` bound to `data.senderIdId`, options = `SMS_SENDER_IDS.filter(s => s.providerId === providerId)`, with `status === "inactive"` entries disabled (same treatment as WhatsApp's inactive `WABA_NUMBERS`).
3. Once `senderIdId` is set: render the **Template Style picker** — two `StyleCard`-style cards laid out side-by-side (not a 4-col grid; only 2 items). Each card shows:
   - A circular icon badge (purple-tinted `#EEF2FF` bg, `#4338CA`-ish icon color — SMS's purple family, replacing WhatsApp's green `#DCFCE7`/`#0F766E`).
   - Title (style label).
   - **Description text directly on the card body** (not a hover tooltip) — the deliberate deviation from WhatsApp's icon-only + tooltip pattern, since there's room for 2 cards and the user wants the description visible without hovering.
   - Selected/hover border highlight, same visual language as WhatsApp's `StyleCard` (border color shift, subtle bg tint, checkmark badge when selected).
4. Selecting a style sets `data.templateStyle` and opens the `SMSTemplateModal` in browse mode, filtered to that category.

**After a style is chosen** — collapse Provider/Sender ID/Style into a compact summary above the template section (matching WhatsApp's post-selection layout at `WhatsAppRightPanel.jsx:452-459`): a style chip (icon + label + "Change" link that resets `templateStyle`/`template` back to null) and the Provider/Sender ID selects still editable above it.

## Central Template Picker Modal (standardized, reused from WhatsApp)

`UnifiedTemplateModal.jsx` gains new **optional** props, each defaulting to today's exact WhatsApp behavior:

- `configRegistry` (default `TEMPLATE_STYLE_CONFIGS`) — SMS passes its own registry keyed by `"transactional"`/`"promotional"`, each entry `{ defaultDraft, mockTemplates }` (no `fields` — see `customFormRenderer` below).
- `accentColor` (default `null`) — when set, replaces both of the modal's two WhatsApp brand colors (`WA_GREEN` for select/save/hover-border, `PRIMARY` for the "+ Create new" button) with this single color everywhere inside the modal. SMS passes `SMS_PURPLE` (`#6366F1`) so both roles collapse to one purple, matching the rest of the SMS panel.
- `PreviewComponent` (default `WhatsAppBubblePreview`) — SMS passes the new `SMSBubblePreview`.
- `metaInsightsStyleIds` (default `["standard"]`) — replaces the hardcoded `styleId === "standard"` check that gates the "Meta insights" benchmarking block. SMS passes `[]` so that block never renders (out of scope per Goals).
- `getAnalytics` / `analyticsMetrics` — forwarded through to the analytics popover (see below). SMS passes `getSMSTemplateAnalytics` and a 3-row metric list.
- `customFormRenderer` — an optional render-prop `({ draft, patch, onSave, onCancel }) => ReactNode`, checked after the existing `config.fields` branch and before the three hardcoded WhatsApp bespoke-form branches (Carousel/List/CollectInput — untouched, still keyed by literal `styleId` strings SMS never uses). SMS passes a renderer for the new `SMSTemplateForm` component, since SMS's field set (char/segment counter, OR-chain variable mapping, shorten URL, AI Enhance) is too bespoke for the generic `FieldRenderer`-driven form — the same reasoning that already justifies WhatsApp's own three bespoke forms.

None of WhatsApp's existing call sites (`WhatsAppRightPanel.jsx`, `CampaignContentPanel.jsx`) pass any of these new props, so their behavior and existing tests (`UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`, etc.) are unaffected.

**What SMS reuses as-is, unmodified:** the modal shell/backdrop/sizing, the Browse view (search, "+ Create new", 3-col grid, footer count/Cancel), the `TemplateCard` hover bar (Edit/Analytics/Select), and the 55/45 edit-view split-pane layout.

**What's SMS-specific:** the `SMSTemplateForm.jsx` render-prop component (Template Name, Approved Template ID, Text Message w/ char-count meter, "+ Add Variables", Variable Mapping OR-chain, Shorten URL, AI Enhance — adapted from today's `InlineSMSTemplateForm`, minus the "Select SMS Gateway" field, since provider/sender is now chosen upstream in Step 0) and `SMSBubblePreview.jsx` (a simple phone-frame mockup rendering the body with `{{var}}` tokens substituted from `SYSTEM_VARIABLES` example values — lighter than `WhatsAppBubblePreview` since SMS has no header/footer/buttons/media).

The modal is invoked from `TemplateTab` exactly like WhatsApp's is — a fixed-position full-screen overlay, not a route change.

## Analytics popover (standardized, reused from WhatsApp)

`TemplateAnalyticsPopover.jsx` gains two new **optional** props, both defaulting to today's exact WhatsApp behavior:

- `getAnalytics` (default `getTemplateAnalytics` from `mockTemplateAnalytics.js`) — SMS passes `getSMSTemplateAnalytics` from a new `mockSMSAnalytics.js`, using the same deterministic `hashString(template.id) + mulberry32` seeding pattern, returning `{ sent, delivered, deliveredPct, failed, failedPct }`.
- `metrics` (default the existing 4 rows: Sent, Delivered, Read, CTR) — an array of `{ label, value: (data) => string }` describing which rows to render. SMS passes 3 rows: Sent, Delivered, Failed.

The portal-rendering, viewport-clamped positioning, outside-click/Escape handling, and the `showMetaInsights`-gated benchmarks block are all reused unchanged (SMS's `metaInsightsStyleIds={[]}` from the modal means `showMetaInsights` is always `false` for SMS, so that block never mounts).

## File plan

**New files** (all under `src/components/flows/builder/nodes/SMSNode/`):
- `SMSTemplateForm.jsx` — the bespoke create/edit form, passed into `UnifiedTemplateModal`'s `customFormRenderer` prop.
- `SMSBubblePreview.jsx` — passed as `PreviewComponent`.
- `data/mockSMSAnalytics.js` — `getSMSTemplateAnalytics(template)`.

**Modified files**:
- `WhatsAppNode/UnifiedTemplateModal.jsx` — add the optional props listed above; thread `accentColor`/`PreviewComponent`/`customFormRenderer`/analytics props through to `BrowseView`, `TemplateCard`, `HoverActionButton`, and the analytics-popover instantiation. No change to default-path rendering.
- `WhatsAppNode/TemplateAnalyticsPopover.jsx` — add the optional `getAnalytics`/`metrics` props; replace the 4 hardcoded `MetricRow` calls with a `metrics.map(...)`. No change to default-path rendering.
- `SMSNode/data/mockData.js` — replace `SMS_GATEWAYS` with `SMS_PROVIDERS` + `SMS_SENDER_IDS`; add `category` to each `MOCK_SMS_TEMPLATES` entry; add `SMS_TEMPLATE_STYLES` and `SMS_TEMPLATE_STYLE_CONFIGS` (the `configRegistry` passed to the modal); extend `defaultSMSNodeData`.
- `SMSNode/SMSRightPanel.jsx` — rewrite `TemplateTab` with the Step-0 gate (Provider → Sender ID → Template Style cards, the latter local to this file since its always-visible-description/2-card layout differs enough from WhatsApp's tooltip-driven `StyleCard` to not be worth generalizing) and wire up `UnifiedTemplateModal` with the SMS-specific props; remove the now-superseded `SMSTemplatePicker` overlay and inline-form-in-panel code (both replaced by the modal).

**Also modified**: `SMSNode/index.jsx` — its canvas-card chip currently reads `SMS_GATEWAYS.find(g => g.id === template?.gateway)`; since `SMS_GATEWAYS`/`gateway` are removed, this one lookup is updated to `SMS_SENDER_IDS.find(s => s.id === data?.senderIdId)`, showing the sender ID (e.g. "TXTIND") instead. No other change to the canvas card.

**Unchanged**: `DeliveryTab`, `OutputTab`, all three WhatsApp bespoke forms (`CarouselForm.jsx`, `ListMessageForm.jsx`, `CollectInputForm.jsx`) and their `styleId`-keyed branches. No `FlowBuilder.jsx`/`FlowBuilderV2.jsx` changes.

## Testing / verification

This codebase has an existing Jest + React Testing Library setup (`craco test`) with test coverage already in place for the exact files this spec touches (`WhatsAppNode/__tests__/UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`, `TemplateTabCollectInput.test.jsx`, `TemplateTabListMessage.test.jsx`, `FallbackTemplateSection.test.jsx`). The implementation plan adds RTL tests per task, following these files' existing conventions (`render`/`screen`/`fireEvent`, `jest.mock` for store/router dependencies), and re-runs the existing `UnifiedTemplateModal` test suite after each modification to confirm no regression to WhatsApp's behavior.

Manual in-browser verification (in addition to automated tests):
1. Open an SMS node's right panel with no template configured — confirm Provider → Sender ID → Template Style sequencing gates correctly, including inactive sender IDs being disabled.
2. Pick Transactional — confirm the modal opens showing only `category: "transactional"` templates.
3. Hover a template card — confirm Edit/Analytics/Select all appear and each does the right thing (edit pre-fills the form, analytics opens the popover with Sent/Delivered/Failed, select quick-saves and closes).
4. Create a new template via "+ Create new" — confirm the form (minus gateway field) + live bubble preview work, and the saved template appears in the node's canvas card afterward.
5. Confirm "Change" on the style chip resets back to Step 0 without losing the Provider/Sender ID selection.
6. Open the WhatsApp node's template picker and confirm it looks and behaves identically to before this change (regression check on the generalized modal/popover).
