# SMS Node — Template Style & Template Picker (WhatsApp-Parity Design)

## Context

The SMS node (`src/components/flows/builder/nodes/SMSNode/`) exists in both FlowBuilder (v1) and FlowBuilderV2 — both pages render the same shared `Canvas`/node-tree, so there is no per-variant fork. Today its right-panel `TemplateTab` (`SMSRightPanel.jsx`) is far simpler than the WhatsApp node's: it jumps straight to a "Create New" / "Select Existing" choice, backed by a flat, hover-less list overlay (`SMSTemplatePicker`). There is no provider/sender-number gate, no template-style categorization, and no hover-triggered edit/analytics affordances.

The WhatsApp node (`WhatsAppNode/`) already has the richer pattern this work should bring to SMS:
- A step-0 gate (`WhatsAppRightPanel.jsx` `TemplateTab`, lines ~363-406) that requires a sender number before showing the template-style picker.
- A `TemplateStylePicker` / `StyleCard` grid (icon + title, hover tooltip for description) that sets `data.templateStyle`.
- A central `UnifiedTemplateModal` with a Browse view (search, "+ Create new", grid of `TemplateCard`s) and an Edit view (form + live bubble preview split pane).
- Hover-triggered actions on each `TemplateCard`: Edit, Analytics (opens `TemplateAnalyticsPopover`), Select (quick-select).

This spec brings the same UX to the SMS node, adapted to SMS's simpler, category-based (Transactional/Promotional) DLT world, reusing the WhatsApp files as a copy-and-adapt starting point (consistent with how `SMSNode/` already independently mirrors `WhatsAppNode/` rather than sharing components).

## Goals

1. Right panel Template tab, before any template exists, first asks for **Provider** and **Sender ID** (SMS's analog to WhatsApp's sender-number gate).
2. Once both are chosen, show a **Template Style** picker: two cards — **Transactional** and **Promotional** — each with icon, title, and an always-visible short description (unlike WhatsApp's hover-only tooltip, since there are only 2 cards and room to spare).
3. Selecting a style opens a **central modal** template picker (WhatsApp-style): Browse view listing templates filtered to that style/category, with search and "+ Create new"; hovering a template card reveals **Edit**, **Analytics**, and **Select** actions, matching WhatsApp's hover bar.
4. Analytics popover shows SMS-appropriate metrics only: **Sent**, **Delivered**, **Failed** (no read receipts or CTR — SMS doesn't support them).
5. No FlowBuilder v1/v2 divergence needed — this ships as shared code, same as the rest of the SMS node.

## Non-goals

- No backend/API integration — this is mock-data-driven UI, matching the existing WhatsApp and SMS node conventions (`data/mockData.js`, `data/mockTemplates.js` are all static arrays).
- No generalization/sharing of components between WhatsApp and SMS (e.g. no color-token-parameterized shared `UnifiedTemplateModal`) — SMS gets its own copied-and-adapted files, per existing project convention.
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

## Central Template Picker Modal

New file: `SMSNode/SMSTemplateModal.jsx` — copy-and-adapt of `UnifiedTemplateModal.jsx`, simplified because SMS has one flat field-set (no per-style `TEMPLATE_STYLE_CONFIGS` map, no Carousel/List/CollectInput branching) — SMS only ever needs one form shape.

Props: `{ open, category, categoryLabel, initialTemplate, customTemplates, onSave, onClose }`.

**Browse view** (`SMSBrowseView`, adapted from `BrowseView`):
- Header: "Select a {categoryLabel} template" + close (X).
- Search input (filters by name/body, same as existing `SMSTemplatePicker` search logic) + "+ Create new" button (purple `#6366F1`).
- 3-col grid of `SMSTemplateCard`s, filtered to `template.category === category`.
- Footer: count + Cancel.

**`SMSTemplateCard`** (adapted from `TemplateCard`): name + 2-line body preview (reusing existing body-preview truncation from `SMSTemplatePicker`). On hover, bottom overlay bar (dark translucent) with three buttons:
- **Edit** (pencil) → flips modal to edit mode pre-filled with this template.
- **Analytics** (bar-chart) → opens `SMSTemplateAnalyticsPopover` anchored to the card's rect.
- **Select** (check, purple bg) → quick-selects and calls `onSave`, closing the modal.
- Clicking the card body (not a specific button) also quick-selects, same as WhatsApp.

**Edit/create view**: 55/45 split pane, matching WhatsApp's modal layout.
- Left (form): reuses `InlineSMSTemplateForm`'s field set — Template Name, Approved Template ID, Text Message (textarea + char/segment-count meter), "+ Add Variables", Variable Mapping OR-chain, Shorten URL, AI Enhance button — **minus** the "Select SMS Gateway" field (removed: provider/sender is now chosen upstream in Step 0, not per-template).
- Right (preview): new `SMSBubblePreview.jsx` — a simple phone-frame mockup rendering the message body as a single SMS bubble, with `{{var}}` tokens substituted from `SYSTEM_VARIABLES` example values (lighter-weight than `WhatsAppBubblePreview`, since SMS has no header/footer/buttons/media to render).
- Save/Cancel buttons at the bottom of the form pane, same as WhatsApp.

The modal is invoked from `TemplateTab` exactly like WhatsApp's is from its own `TemplateTab` — a fixed-position full-screen overlay (`position: fixed, inset: 0`, dark backdrop, `zIndex: 9999`), not a route change.

## Analytics popover

New file: `SMSNode/SMSTemplateAnalyticsPopover.jsx` — trimmed copy of `TemplateAnalyticsPopover.jsx`:
- Same portal-rendering + viewport-clamped positioning logic (anchored to the hovered card's `getBoundingClientRect()`, flips above/below to stay on-screen).
- Metrics shown: **Sent**, **Delivered** (count + %), **Failed** (count + %). No Read/CTR row, no "Meta insights" benchmarks/recommendations/feedback section — all removed as WhatsApp/Meta-specific and out of scope per the Goals section.
- Backing data: new `SMSNode/data/mockSMSAnalytics.js`, `getSMSTemplateAnalytics(template)` using the same deterministic `hashString(template.id) + mulberry32` seeding pattern as `mockTemplateAnalytics.js`, returning `{ sent, delivered, deliveredPct, failed, failedPct }`.

## File plan

**New files** (all under `src/components/flows/builder/nodes/SMSNode/`):
- `SMSTemplateModal.jsx`
- `SMSTemplateAnalyticsPopover.jsx`
- `SMSBubblePreview.jsx`
- `data/mockSMSAnalytics.js`

**Modified files**:
- `data/mockData.js` — replace `SMS_GATEWAYS` with `SMS_PROVIDERS` + `SMS_SENDER_IDS`; add `category` to each `MOCK_SMS_TEMPLATES` entry; add `SMS_TEMPLATE_STYLES`; extend `defaultSMSNodeData`.
- `SMSRightPanel.jsx` — rewrite `TemplateTab` with the Step-0 gate (Provider → Sender ID → Template Style cards) and modal wiring; remove the standalone `SMSTemplatePicker` overlay (superseded by the modal's Browse view); simplify `InlineSMSTemplateForm` by dropping the "Select SMS Gateway" field (still used as the Edit-form field set inside the modal, minus that one field).

**Unchanged**: `SMSNode/index.jsx` (canvas card), `DeliveryTab`, `OutputTab`. No `FlowBuilder.jsx`/`FlowBuilderV2.jsx` changes — this ships as shared code with no v1/v2 divergence, consistent with how the rest of the SMS node already works.

## Testing / verification

Manual verification in-browser (no automated tests exist for this node tree today, per the existing WhatsApp/SMS node conventions):
1. Open an SMS node's right panel with no template configured — confirm Provider → Sender ID → Template Style sequencing gates correctly, including inactive sender IDs being disabled.
2. Pick Transactional — confirm the modal opens showing only `category: "transactional"` templates.
3. Hover a template card — confirm Edit/Analytics/Select all appear and each does the right thing (edit pre-fills the form, analytics opens the popover with Sent/Delivered/Failed, select quick-saves and closes).
4. Create a new template via "+ Create new" — confirm the form (minus gateway field) + live bubble preview work, and the saved template appears in the node's canvas card afterward.
5. Confirm "Change" on the style chip resets back to Step 0 without losing the Provider/Sender ID selection (only `templateStyle`/`template` reset, per WhatsApp's existing "Change" behavior at `WhatsAppRightPanel.jsx:446`).
