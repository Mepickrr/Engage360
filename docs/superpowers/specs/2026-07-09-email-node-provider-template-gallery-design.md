# Email Node: Provider Field, To Email Dropdown, Template Gallery

## Context

The Email node's configuration panel is a single shared component,
`src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx`, rendered by
`ConfigTab.jsx` for `node.type === "email"`. Both the legacy Flow Builder
(`FlowBuilder.jsx`) and Flow Builder V2 (`FlowBuilderV2.jsx`) go through the
same `RightPanel.jsx` → `ConfigTab.jsx` → `EmailRightPanel.jsx` chain, so there
is only one component to change — not two parallel implementations.

The WhatsApp node's `UnifiedTemplateModal.jsx` (in
`nodes/WhatsAppNode/`) provides the layout pattern to mirror for a new Email
template gallery: a centered modal with a browse grid of template cards, a
search bar, a "+ Create new" affordance, and a way to open an edit view from a
card.

## Goals

1. Let the seller pick an email provider (mocked: Trust signal, Karix).
2. Rename "Reply-To Email" to "To Email", defaulting to auto-detect, with the
   option to map it to a variable instead of free text.
3. Replace the current two-button Template section (Select Existing / Create
   New) with a single "Select Template" entry point that opens a visual,
   WhatsApp-style gallery modal with illustrative cards.

## Non-goals

- No backend/API wiring for actual provider selection or email sending — this
  stays mocked, consistent with the rest of the flow builder's node configs.
- No change to the existing block-based `TemplateEditorModal.jsx` editor
  itself — it's reused as-is.
- No change to the legacy `ConfigTab.jsx` generic `"channel"` type config
  block — that path doesn't apply to `type === "email"` nodes and is out of
  scope.

## Design

### 1. Email Provider field

Add a new field, "Email Provider", as the first field inside the existing
**Sender Details** section (`EmailRightPanel.jsx`, Section titled "Sender
Details"), above "From Address".

- Rendered with the existing `SelectField` component.
- Options (mocked, in `data/mockData.js`): `Trust signal`, `Karix`.
- Stored on node data as `data.provider` (string id). Defaults to the first
  option (`Trust signal`) when unset.
- No dependency on From Address options for this iteration — the two fields
  are independent selects.

### 2. To Email field (renamed from Reply-To Email)

Replace the current `TextField` for Reply-To with a `SelectField`:

- Label changes from "Reply-To Email" to **"To Email"**.
- First option: `Automatically detects the email address` — this is the
  default/selected value when `data.toEmailMode` is unset.
- Remaining options are variables sourced from the same canonical properties
  list already used by `ConditionalSplitNode/data/mockData.js` (e.g.
  `customer.email`, `customer.name`, `customer.phone`, etc.), rendered as
  `{{key}} — Label`. `EmailNode` will import/duplicate the relevant subset of
  that properties list into its own `data/mockData.js` (matching how other
  nodes keep their own local copies rather than cross-importing between node
  folders).
- Data shape: `data.toEmailMode` = `"auto"` (default) | `"variable"`, plus
  `data.toEmailVariable` (the selected key, only meaningful when mode is
  `"variable"`).
- Selecting the auto-detect option clears `toEmailVariable`; selecting any
  other option sets `toEmailMode: "variable"` and stores the chosen key.

### 3. Template section → gallery modal

**Panel changes (`EmailRightPanel.jsx`, Template section):**

- Remove the "Create New Template" button and its click handler
  (`setShowEditor(true)` from the unselected-template state) entirely.
- The remaining button is relabeled **"Select Template"** (was "Select
  Existing Template") and now opens the new gallery modal instead of the old
  `TemplatePicker` overlay. `TemplatePicker` (the search-and-list overlay,
  lines ~147-214 today) is removed/replaced by the modal.
- Once a template is selected/saved, the panel continues to show the existing
  `TemplatePreviewCard` (unchanged), with its "Edit Template" button still
  opening `TemplateEditorModal` directly (editing an already-selected
  template doesn't need to go through the gallery again).

**New component: `EmailTemplateGalleryModal.jsx`** (in
`nodes/EmailNode/`), modeled on `UnifiedTemplateModal.jsx`'s `BrowseView`:

- Centered fixed-position modal, similar sizing (`min(92vw, 900px)`),
  header with title "Select Email Template" + close button.
- Row below header: search input (filters by name/subject, same behavior as
  today's `TemplatePicker`) + a prominent **"+ Create new"** button.
- Body: a responsive grid (3 columns, matching WhatsApp's grid) of
  illustrative template cards (see below). Empty state: "No templates found"
  when search yields nothing.
- Footer: template count on the left, "Cancel" button on the right (closes
  modal without changes).
- Clicking a card calls `onSelect(template)` and closes the gallery modal;
  the panel then opens `TemplateEditorModal` pre-loaded with that template so
  the seller can immediately tweak it, matching how "Edit Template" already
  works today. Clicking "+ Create new" closes the gallery and opens
  `TemplateEditorModal` with a blank draft — i.e., both entry points funnel
  into the existing editor component, just from a new launch point.

**Illustrative card design (`EmailTemplateCard`, inside the new modal file):**

Each card renders a small mock email preview built purely from data already
on each template record (`thumbnailColor`, `blocks`, `name`, `category`,
`status`) — no new image assets:

- A colored header strip using `thumbnailColor` (as today).
- A simplified rendering of the template's `blocks` array as stacked visual
  placeholders: an `image` block renders as a light rectangle with a small
  icon; a `text` block renders as 1-2 short gray line placeholders; a
  `button` block renders as a small pill/rectangle in the email accent blue.
  This is a lightweight visual stand-in, not a real render of block content.
- Below the preview: template name (bold) and a caption row with category +
  status badge (reusing the existing status-badge styling from
  `TemplatePreviewCard`).
- Hover state: border highlights in the email accent blue (`#3B82F6`),
  consistent with the existing hover pattern in `TemplatePicker`.

### Data model summary (additions to `EmailNode` node data)

```
data.provider          // string, e.g. "trust_signal" | "karix"
data.toEmailMode        // "auto" | "variable"
data.toEmailVariable    // string key, e.g. "customer.email" (only when mode = "variable")
```

`data.template`, `data.subject`, `data.previewText` etc. are unchanged.

## Testing

- Update/extend existing tests under
  `src/components/flows/builder/nodes/WhatsAppNode/__tests__/` pattern —
  specifically add/adjust tests colocated with `EmailRightPanel` (create
  `EmailNode/__tests__/EmailRightPanel.test.jsx` if none exists) covering:
  - Provider dropdown renders and updates `data.provider`.
  - To Email dropdown defaults to auto-detect and updates
    `toEmailMode`/`toEmailVariable` correctly.
  - Template section shows only "Select Template" (no "Create New Template"
    button) when unselected.
  - Selecting a template from the new gallery modal opens
    `TemplateEditorModal` pre-loaded with that template.
  - "+ Create new" in the gallery opens `TemplateEditorModal` with a blank
    draft.

## Open items resolved during brainstorming

- Provider field placement: new field above Sender Details section (not
  replacing From Address). ✅
- To Email: dropdown with auto-detect default + variable list (not a
  free-text fallback option). ✅
- Card visuals: richer styled mock preview built from block data, not a
  plain enlarged color+icon thumbnail. ✅
- Create/edit flow: reuses the existing `TemplateEditorModal` block editor
  rather than rebuilding a WhatsApp-style split-view form. ✅
