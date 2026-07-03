# Email Template Editor — Popup Modal Redesign

**Date:** 2026-07-03
**Status:** Approved

## Overview

Convert the email template editor from a raw full-screen fixed overlay to a Shadcn `Dialog` popup, matching the RCS template modal pattern. Flip the panel layout so the blocks/config panel is on the left and the email canvas preview is on the right, matching the Stripo-style interface. Applies to both Flow Builder v1 and v2 (they share the same component).

## Affected Files

- `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx` — primary change

No changes needed to `EmailRightPanel.jsx`, `FlowBuilder.jsx`, or `FlowBuilderV2.jsx` — the `onSave`/`onClose` interface is unchanged.

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Template Name │ Subject │ Pre-header   [Undo][Redo] [Save] [✕] │  ← top bar
├────────────────┬────────────────────────────────────────────────┤
│  Content       │                                                 │
│  ─────────────│   Email canvas (scrollable, grey bg)           │
│  Block chips   │                                                 │
│  (2-col grid)  │   [Desktop / Mobile toggle]                    │
│                │                                                 │
│  Rows tab      │                                                 │
│  Variables tab │                                                 │
│  Settings tab  │                                                 │
└────────────────┴────────────────────────────────────────────────┘
  280px fixed             flex: 1
```

## Sizing

Matches RCS popup pattern, scaled up for the editor canvas:

```js
width: "95vw"
maxWidth: 1400
maxHeight: "95vh"
padding: 0
overflow: "hidden"
display: "flex"
flexDirection: "column"
```

## Changes

### 1. Replace outer overlay with Shadcn Dialog

**Before:**
```jsx
<div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
  <div style={{ /* modal box */ }}>
    ...
  </div>
</div>
```

**After:**
```jsx
import { Dialog, DialogContent } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
  <DialogContent style={{ width: "95vw", maxWidth: 1400, maxHeight: "95vh", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
    ...
  </DialogContent>
</Dialog>
```

The `open` prop comes from the parent (`EmailRightPanel`) via the existing `showEditor` state; `onClose` prop is already passed in.

### 2. Top toolbar

Compact single row containing:
- Template Name input (existing state: `templateName`)
- Subject input (existing state: `subject`)
- Pre-header Text input (existing state: `previewText`)
- Undo / Redo buttons
- Preview button
- Save Template button (calls existing `handleSave`)
- Close (X) button (calls `onClose`)

These fields already exist as state in `TemplateEditorModal`; they are repositioned from the canvas header area into this top bar.

### 3. Body: flip panel order

**Before:** `[canvas (flex:1)] [sidebar (280px)]`

**After:** `[sidebar (280px)] [canvas (flex:1)]`

The sidebar (tabs: Content, Rows, Variables, Settings) moves to the left. The email canvas moves to the right. No changes to the content of either panel.

### 4. Remove old inline overlay styles

Delete the outermost fixed-position wrapper div and the inner modal box div. The `DialogContent` replaces them entirely.

## Props Interface (unchanged)

```js
TemplateEditorModal.propTypes = {
  open: bool,          // was: rendered conditionally by parent — add explicit open prop
  onClose: func,
  onSave: func,
  initialTemplate: object,
}
```

The `open` prop is new (was previously controlled by conditional rendering in `EmailRightPanel`). `EmailRightPanel` passes `open={showEditor}` to the modal and always renders it (instead of `{showEditor && <TemplateEditorModal />}`).

## Non-goals

- No changes to block types, row layouts, variables, or settings panel content
- No Stripo API integration
- No changes to how templates are stored or persisted
- No visual redesign of the canvas or block chips
