# WhatsApp Unified Template Modal

## Problem

Picking a WhatsApp template style today routes the seller through inconsistent, extra-click paths:

- **Standard** style shows a two-button CTA (**+ Create New** / **☰ Select Existing**). "Select Existing" opens `TemplatePicker` — a full-screen grid modal ("Select a template message"). "+ Create New" instead renders `InlineTemplateForm` *inline* in the side panel, with no live preview.
- **Carousel**, **List**, **Collect Input** each render their own full-width inline builder in the side panel (no modal, no browse-existing option, no live preview alongside the form).
- **Authentication, Session, Location, Audio, the 4 Order styles, the 4 Catalog styles, Call Permission** show an amber "create it in WhatsApp Business Manager" notice and only a "Select Existing" affordance — no in-app creation, no preview.
- A separate `TemplateEditor` modal exists purely for editing an already-selected Standard template, with a *toggle-able* preview (off by default) — a third, differently-shaped surface for what is conceptually the same job.

Net effect: 4+ different UI shapes for "pick or make a template," most without a live preview, and an extra click (open CTA row → then modal) before the seller ever sees a template.

## Goal

One modal per template style. Selecting a style card in `TemplateStylePicker` opens it immediately:

- **Browse view** — grid of that style's existing templates (2-3 seeded dummy templates per style) with search/filter and a **"+ Create new"** action, matching the current `TemplatePicker` ("Select a template message") layout.
- **Edit view** — opens when a card is picked or "Create new" is clicked. Left pane: the skeleton form for that style. Right pane: a live WhatsApp-bubble preview, always visible (no toggle), matching the layout already used by `RCSTemplateModal` (left form / right preview, save+cancel footer under the form).

This replaces `TemplatePicker`, `TemplateEditor`, the Standard "+Create New" CTA + inline form, and relocates `CarouselForm`, `ListMessageForm`, `CollectInputForm` from standalone full-width panel views into the modal's left pane (unchanged internally — they just gain a preview neighbor).

Every pickable style gets full browse + create, including the styles that today are Business-Manager-only. (Meta's real approval workflow isn't modeled here — this is an internal builder mock.)

Out of scope: RCS node changes. `RCSTemplateModal` is referenced only as the visual pattern for the edit view — it is not modified.

## Architecture

### New files

- `WhatsAppNode/UnifiedTemplateModal.jsx` — the modal shell. Owns `mode: "browse" | "edit"`, the active `draft`, and whether editing an existing template vs. creating new. Renders:
  - **Browse view**: header (`Select a {style.label} template`), search input, 1-2 filter selects (config-driven — e.g. Standard filters by category/status; simpler styles may only show the search box), template grid (reusing the `TemplateCard` visual language from today's `TemplatePicker.jsx`), "+ Create new" button, footer count + Cancel.
  - **Edit view**: two-column layout (`flex: 55% form / 45% preview`, scroll independently, matches `RCSTemplateModal.jsx` proportions). Left pane renders either the generic config-driven form (see below) or one of the three bespoke editors (`CarouselForm`, `ListMessageForm`, `CollectInputForm`) when the style is one of those three. Right pane renders `<WhatsAppBubblePreview draft={draft} previewKind={config.previewKind} />`. Footer: Cancel / Save (or Back-to-browse when creating fresh, matching RCS's back-arrow pattern used today in the inline "Create New Template" header).

- `WhatsAppNode/WhatsAppBubblePreview.jsx` — generic preview renderer, switched on `previewKind`:
  - `standard` — header media/text, body (reusing the existing markdown + `{{variable}}` highlighting regex from `TemplateEditor.jsx`), footer, buttons. Covers Standard, Authentication, Session, all 4 Order styles, Payment Link, Call Permission, Address.
  - `carousel` — horizontal card strip (reuses the visual shape of `CarouselCardThumb`, rendered at bubble scale).
  - `list` — message bubble + a single "View options" list button (WhatsApp's native list-message affordance).
  - `catalog` — message bubble + a small product-thumbnail grid/strip, covering all 4 Catalog styles.
  - `location` — message bubble containing a static-map placeholder + pin + address caption.
  - `audio` — message bubble containing a voice-note waveform/play-button row.
  - `collectInput` — the question text as an outgoing bubble, plus an affordance chip showing the configured input type (reuses `INPUT_TYPE_EMOJIS` already defined in `WhatsAppRightPanel.jsx`).

- `WhatsAppNode/data/templateStyleConfigs.js` — registry keyed by style id (the same ids used in `TEMPLATE_STYLE_GROUPS`). Each entry:
  ```js
  {
    previewKind: "standard" | "carousel" | "list" | "catalog" | "location" | "audio" | "collectInput",
    fields: [ /* generic-form field defs — omitted for carousel/list/collectInput, which use their bespoke editor */ ],
    defaultDraft: { ... },
    mockTemplates: [ /* 2-3 seeded dummy templates, see per-style content below */ ],
    filters: { category: [...], status: [...] } | null, // drives the browse-view filter selects
  }
  ```
  `mapsTo` styles (the 9 `ask_*` shortcuts into `collect_input`, and `list_order`/`list_bestsellers` into `list`) resolve to their target's config and pass `presetInputType` / a preset section shape through `defaultDraft`, exactly as `pendingInputType` does today.

### Generic field-schema form

For styles using `previewKind: "standard"`, the left pane renders from `fields: [...]`, each entry `{ key, label, type }` where `type` is one of the primitives already hand-built in `WhatsAppRightPanel.jsx` (`text`, `textarea`, `select`, `pillgroup`, `buttons-list`, `header-picker`). These primitives get extracted into a shared `WhatsAppNode/FormFields.jsx` (currently duplicated inline as `Label`, `SelectField`, `PillButton`, `Toggle`, the header-type chips, and the button-list editor inside `InlineTemplateForm`) so both the modal and any remaining inline summaries reuse them instead of copy-pasting styles.

### `WhatsAppRightPanel.jsx` changes

- `TemplateStylePicker.onSelect` opens `UnifiedTemplateModal` directly (`mode: "browse"`) instead of just patching `templateStyle` and falling through to the old CTA/inline-form branches.
- All per-style conditional rendering for the "no template yet" state (`isStandard` amber-notice-vs-CTA branching, the two-button CTA block) is deleted.
- The "template selected" state collapses to one generic summary card (name/label + type/status badges + Edit + Change buttons) reused across every style, replacing the bespoke Carousel-summary and Collect-Input-summary blocks. Edit reopens the modal in edit view with `initialTemplate`; Change reopens it in browse view.
- `creatingNew`, `showPicker`, `showFallbackPicker`, `showEditor`, `editingFallback`, `editingCarousel`, `editingCollectInput`, `editingListMessage`, `newDraft`, `InlineTemplateForm` component, and the direct `<TemplatePicker>`/`<TemplateEditor>` renders are removed from `TemplateTab`. The **fallback template** picker (a separate, smaller "pick a Standard template as a fallback" affordance) keeps using `UnifiedTemplateModal` scoped to `style: standard` — same modal, different call site.
- `TemplatePicker.jsx` and `TemplateEditor.jsx` are deleted once `UnifiedTemplateModal` covers their cases.

### Flow Builder V2

No separate code path — `WhatsAppRightPanel.jsx` is shared between Flow Builder and Flow Builder V2, gated only by `useFlowVariant().allowedTemplateStyleIds` filtering which style *cards* appear in `TemplateStylePicker`. The unified modal automatically applies to whichever styles V2 allows.

## Per-style dummy content (2-3 templates each)

Grouped by `previewKind`. Existing Standard entries in `mockTemplates.js` (`TRUST_NOTE_J`, `AH_QuizCompleted_NoPurchase_Day1`, `rosemary_water`, `order_address_confirm`, `Black_friday_mega_sale313`, `order_shipped_utility`) are kept as-is and reused for `standard`.

| Style | Dummy templates |
|---|---|
| `session` | "Welcome back! How can we help today?" · "Your cart is still here — need a hand checking out?" |
| `authentication` | OTP template: "Your verification code is {{otp}}. Valid for 5 minutes. Don't share this code." (Meta's fixed auth shape: body + copy-code button) · a resend variant |
| `carousel` | "New Arrivals" (3 cards: Rosemary Water / Hair Oil / Scalp Serum, each with an image, price line, "Shop Now" button) · "Bestsellers This Week" (2 cards) |
| `location` | "Our store is here — see you soon!" with a static map + pin to a sample address · "Pickup point confirmed for order #7842" |
| `audio` | "Here's a quick voice note from our founder 🎙" · "Listen to how to use your Rosemary Water" |
| `order_payment` | "Your order of Rosemary Water (₹399) is ready — complete payment to confirm" + Pay Now button · "2 items in your order — pay ₹1,299 to ship today" |
| `order_confirmation` | "Payment received! Order #7842 confirmed and being packed" · "Payment failed for order #7842 — retry now" |
| `complete_checkout` | "Let's finish your order — confirm your delivery address to continue" (multi-step guided copy) · a second variant for COD confirmation |
| `payment_link` | "Complete your ₹599 payment here" + UPI link button · "Reminder: your payment link expires in 2 hours" |
| `address` | "Please confirm your delivery address for order #7842" with map preview · "Add a landmark to help our rider find you" |
| `call_permission` | "Can we give you a quick call about your order?" + Allow/Deny buttons · "Our support team would like to call you back" |
| `catalog_single` | Featured product card: Rosemary Water, ₹399, "View Product" · Keshpallav Hair Oil |
| `catalog_multiple` | 3-product carousel: Rosemary Water / Hair Oil / Grey Hair Serum · a 2-product "Combo Deal" set |
| `catalog_view` | "Browse our full catalog" scrollable card · "New collection just dropped" |
| `catalog_list_bestsellers` | "Our Top 5 Bestsellers" list card · "Trending This Month" |
| `catalog` | "🔥 Bestsellers you'll love" showcase card · a seasonal-sale variant |
| `list` | "Choose a delivery slot" (3 sections: Morning/Afternoon/Evening) · "Pick a support topic" (Orders/Returns/Other) |
| `collect_input` (and its 9 `ask_*` presets) | Preset per type — e.g. `ask_email`: "What's your email address?" · `ask_rating`: "How would you rate your experience (1-5)?" · custom: "Tell us what you're looking for today" |

`session` and `authentication` use `previewKind: "standard"` with a reduced field set (no header/footer/buttons editor for auth — Meta fixes that structure to body + one copy-code button).

## Testing

- Existing tests under `WhatsAppNode/__tests__` reference `TemplatePicker`/`TemplateEditor`/inline flows — these get updated to drive `UnifiedTemplateModal` instead (open via style card click, assert browse grid renders seeded templates, assert edit view shows form+preview panes, assert Save patches node data the same way today's flows do).
- Add coverage for at least one style per `previewKind` to confirm the config-driven form + preview renders without crashing (Standard, Carousel, List, Collect Input, Catalog, Location, Audio).
