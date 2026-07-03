# Sticky Note Redesign — Design Spec

Date: 2026-07-04
Scope: Flow Builder v1 (`app/frontend/src`) and Flow Builder v2 (`src`)

## Background

Today, "Sticky Notes" exists only as a palette entry (a "Notes" category in the node palette) in both flow builder versions. There is no dedicated sticky-note node UI — dragging it onto the canvas falls back to the generic `ChannelNode` renderer via the `note` node kind. No color theming, rich text, or emoji support exists.

This spec redesigns sticky notes as a first-class, purpose-built canvas node, accessible from a footer toolbar button instead of the node palette, with inline formatting controls on the note card itself (no right-hand configuration panel).

## 1. Remove sticky note from the node palette

**v2** — `src/components/flows/builder/NodePalette.jsx:110-113`: delete the `notes` category object (id `"notes"`, label `"Notes"`, `FileText` icon, `amber` color, and its single `stickynote` node entry) from the `CATEGORIES` array.

**v1** — `app/frontend/src/data/nodeComponents.json`: delete the `notes` category block (containing the `sticky_notes` entry) from the category list.

Result: the "Notes" section heading and "Sticky Notes" draggable palette item disappear entirely from both versions. No other file in either codebase renders a sticky-note section/heading, so this removal is self-contained.

## 2. Footer toolbar button

Both canvases currently render React Flow's built-in `<Controls position="bottom-left" showInteractive={false} />`, producing three icon buttons: Zoom In, Zoom Out, and Fit View ("Pan view").

Add a 4th button as a child of `<Controls>` using React Flow's `<ControlButton>`, so it inherits the same visual style, sizing, and hover treatment as the existing three buttons, positioned directly below Fit View:

```jsx
<Controls position="bottom-left" showInteractive={false}>
  <ControlButton onClick={handleAddStickyNote} title="Sticky Note">
    <StickyNoteIcon size={16} />
  </ControlButton>
</Controls>
```

Behavior: clicking the button creates a new sticky note node at a default position (centered in the current viewport, offset slightly from any previously-added note to avoid exact overlap) and selects it immediately so the formatting toolbar (Section 4) appears for editing.

Applied to both `Canvas.jsx` files (v1 and v2), matching each version's existing node-creation conventions.

## 3. Sticky note node — data model & layout

New component `StickyNoteNode.jsx`, added under each version's `nodes/` folder and registered in the respective `Canvas.jsx` `nodeTypes` map as `note: StickyNoteNode` (replacing the current fallback to `ChannelNode`).

### Data schema (`node.data`)

```js
{
  icon: "📌",          // emoji, default provided
  heading: "",          // plain text, 0-30 characters (hard cap on input)
  body: "",             // rich text (inline bold/italic/underline/strike), 0-1000 characters
  color: "yellow",      // "yellow" | "green" | "blue"
  fontSize: "medium",   // "small" | "medium" | "large" | "xlarge"
}
```

### Layout

No connection handles — sticky notes are a pure visual annotation, not part of flow logic. Draggable and selectable like other nodes. Fixed card width; height auto-grows as body text wraps.

```
┌───────────────────────────────┐
│ 📌  Heading text here          │  ← icon + heading: bold, ~20% larger than body
├───────────────────────────────┤
│ Body text goes here, up to     │  ← body: regular weight, size per fontSize
│ 1000 characters, wraps and     │
│ grows the card vertically.     │
└───────────────────────────────┘
```

- **Heading**: emoji icon + text input, placeholder "Add a heading...", capped at 30 characters, bold, sized ~20% larger than the current body font size.
- **Body**: `contentEditable` region (same pattern as `EmailNode/TemplateEditorModal.jsx`), placeholder "Add a note...", capped at 1000 characters, supports inline bold/italic/underline/strikethrough formatting and emoji insertion.
- **Card color**: background/border driven by `data.color`. Three presets (yellow/green/blue), each a light background with a slightly darker border, following the same ramp treatment as `NodePalette.jsx`'s existing `COLORS` map.

## 4. Inline formatting toolbar

Rendered only when the note is selected/focused (hidden otherwise, keeping the canvas uncluttered), floating directly above the card:

```
┌─────────────────────────────────────────┐
│ 🟡 🟢 🔵  |  B  S  U  I  😊  |  Aa▾      │
└─────────────────────────────────────────┘
┌───────────────────────────────┐
│ 📌  Heading text here          │
├───────────────────────────────┤
│ Body text...                   │
└───────────────────────────────┘
```

- **Color swatches** (yellow/green/blue): 3 small circles; clicking sets `data.color`; the active color shows a selection ring.
- **Bold / Strike / Underline / Italic**: 4 icon toggle buttons, styled after the existing icon-button pattern in `WhatsAppNode/TemplateEditor.jsx`. Apply inline formatting to the current text selection inside the body's `contentEditable`. Toggle state reflects whether the current selection already carries that formatting.
- **Emoji button**: opens a lightweight curated emoji grid popover — a new component, no external dependency, ~40-60 common emojis grouped loosely (faces, hearts, objects, symbols). Context-sensitive target:
  - If the heading icon field has focus, the selected emoji replaces `data.icon`.
  - If the body has focus, the selected emoji is inserted at the current cursor position in `data.body`.
- **Font size dropdown ("Aa▾")**: small / medium / large / xlarge. Sets `data.fontSize`, controlling the body's font size. Heading remains proportionally ~20% larger than the current body size at every setting, preserving hierarchy.

Implemented as a shared component, e.g. `StickyNoteToolbar.jsx`, reused by both v1 and v2 `StickyNoteNode` implementations — the toolbar's behavior is identical across versions; only the surrounding node-registration wiring differs.

## Out of scope

- No right-hand configuration panel integration — all editing happens inline on the card, per requirement.
- No resizing/manual-width handles on the note card (auto-grow height only).
- No rich emoji library dependency — curated grid only.
- No connection handles / flow-graph participation for sticky notes.
