# WhatsApp List Message Form — Design Spec

**Date:** 2026-07-03  
**Status:** Approved for implementation  
**Audience:** Internal engineers  
**Scope:** Replace the FBM-redirect path for the `list` template style with a self-contained right-panel form. Applies to both Flow Builder (v1) and Flow Builder V2.

---

## 1. Background

Interactive List Messages are WhatsApp session-based messages (`type: "interactive", interactive.type: "list"`). They do not require Meta template approval and must not be routed through the WhatsApp Business Manager (FBM) template flow.

The current implementation registers `list` in `TEMPLATE_STYLES` but has no dedicated form. It falls through to the generic non-standard-template path which shows an amber warning telling sellers to create the template in FBM — which is incorrect for this message type.

---

## 2. WhatsApp API Structure

```
POST /messages
{
  type: "interactive",
  interactive: {
    type: "list",
    header:  { type: "text", text: string },   // optional, text only
    body:    { text: string },                  // required
    footer:  { text: string },                  // optional
    action: {
      button: string,                           // trigger button label
      sections: [{
        title: string,                          // optional section heading
        rows: [{ id, title, description }]      // description optional
      }]
    }
  }
}
```

Constraints from the API:
- `header.text`: max 60 chars
- `body.text`: max 1024 chars
- `footer.text`: max 60 chars
- `action.button`: max 20 chars
- `section.title`: max 24 chars
- `row.title`: max 24 chars
- `row.description`: max 72 chars
- Max 10 sections total
- Max 10 rows total (across all sections)

---

## 3. Data Shape

Stored in `data.template` on the node:

```js
{
  isListMessage: true,
  header: string,       // optional, "" when absent
  body: string,         // required
  footer: string,       // optional, "" when absent
  buttonText: string,   // required
  sections: [
    {
      title: string,    // optional, "" when absent
      rows: [
        { id: string, title: string, description: string }
        // id: auto-generated "row_1", "row_2", …; not shown to seller
      ]
    }
  ]
}
```

Row IDs are assigned at row-creation time (`row_<n>`) and never reassigned. They are not exposed in the form UI.

---

## 4. `ListMessageForm` Component

A new self-contained form component, following the same pattern as `CarouselForm` and `CollectInputForm`. Lives in `WhatsAppRightPanel.jsx` (or extracted to its own file if the panel grows too large).

### 4.1 Header bar

Back arrow + title ("Configure List Message"). Back arrow cancels — if a template was already configured, returns to the summary card; otherwise returns to the style picker (same pattern as CarouselForm/CollectInputForm cancel behaviour).

### 4.2 Fields (top to bottom)

| Field | Label | Required | Max chars | Notes |
|---|---|---|---|---|
| `body` | Body | Yes | 1024 | Textarea, char counter below |
| `buttonText` | Button label | Yes | 20 | Single-line input, char counter; this is the text on the tappable trigger button |
| `header` | Header (Optional) | No | 60 | Single-line input, char counter |
| `footer` | Footer (Optional) | No | 60 | Single-line input, char counter |

### 4.3 Sections builder

Below the fields, a **Sections** heading with an "+ Add Section" button (disabled when 10 sections exist).

Each section card:
- Optional **Section title** input (max 24 chars, char counter)
- **Rows list** — each row has:
  - **Title** input (required, max 24 chars, char counter)
  - **Description** input (optional, max 72 chars, char counter)
  - Delete icon (disabled when it's the last row in the last section)
- **+ Add Row** link at the bottom of the section (disabled when total rows = 10)
- Section delete icon in the section header (disabled when it's the only section)

Running total "X / 10 rows used" shown below the sections builder.

### 4.4 Apply button

Disabled until: `body` is non-empty, `buttonText` is non-empty, at least one section exists with at least one row whose `title` is non-empty. No validation modal — just grey-out the button with a tooltip "Fill in body, button label, and at least one row title."

### 4.5 Initial state

When opening a fresh form (no prior template): one empty section with one empty row pre-populated so the seller sees the structure immediately.

---

## 5. Right Panel Wiring (`WhatsAppRightPanel.jsx`)

### 5.1 New flag

```js
const isListMessage = templateStyle === "list";
```

Alongside the existing `isStandard`, `isCarousel`, `isCollectInput` flags.

### 5.2 Early-exit render path

Insert before the carousel early-exit block (line ~596):

```js
if (isListMessage && (!template || editingListMessage)) {
  return (
    <ListMessageForm
      initial={template?.isListMessage ? template : null}
      onCancel={() => {
        if (template) setEditingListMessage(false);
        else patch({ templateStyle: null });
      }}
      onApply={(draft) => {
        patch({ template: { ...draft, id: `list_${Date.now()}` } });
        setEditingListMessage(false);
      }}
    />
  );
}
```

Add `editingListMessage` / `setEditingListMessage` state alongside the existing `editingCarousel` / `editingCollectInput`.

### 5.3 Configured summary card

When `isListMessage && template`:

Show a summary card in the template section (same slot as the carousel and collect_input summary cards):
- Header: "📋 List Message" + row count chip (e.g. "5 rows") + Edit button
- Body preview (first 80 chars, truncated with …)
- Button label preview ("Opens with: **{buttonText}**")

Edit button sets `setEditingListMessage(true)`.

### 5.4 Remove FBM warning for list

No gate change is required. The early-exit in 5.2 catches every unconfigured `list` state (`!template`), so the amber "must be created in WhatsApp Business Manager" notice and the "Select Existing" (TemplatePicker) button are never reached for list. The FBM path is removed by the early-exit, not by a conditional guard.

---

## 6. Canvas Node Output Ports (`index.jsx`)

The canvas already renders one output port per button via `connectableButtons`. Extend the logic that builds `connectableButtons` to also read from list rows:

```js
// existing: reads from template.buttons[]
// new: if isListMessage, read from template.sections[].rows[]
const connectableButtons = isListMessage
  ? (template?.sections ?? []).flatMap((sec) =>
      (sec.rows ?? []).map((row) => ({ label: row.title || row.id }))
    )
  : /* existing button logic */;
```

Port IDs follow the existing `btn_0`, `btn_1`, … scheme — index into the flat row list. Labels show `row.title`. No new rendering code required.

---

## 7. What Is NOT Changing

- `TEMPLATE_STYLES` registration for `list` — already correct
- `V2_ALLOWED_TEMPLATE_STYLES` in `FlowBuilderV2.jsx` — already includes `"list"`
- The FBM template picker (`TemplatePicker`) — unchanged, just hidden for list style
- The fallback flow section and prevent-backtracking section in the right panel — unchanged, rendered for all styles
- The standard / carousel / collect_input paths — untouched

---

## 8. Files Changed

| File | Change |
|---|---|
| `WhatsAppRightPanel.jsx` | Add `ListMessageForm` component; add `isListMessage` flag + early-exit path + summary card; remove FBM gating for list |
| `nodes/WhatsAppNode/index.jsx` | Extend `connectableButtons` to read from list rows |
