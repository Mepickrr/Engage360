# Email Template Editor Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `TemplateEditorModal` from a raw full-screen fixed overlay to a Shadcn `Dialog` popup with a left config panel and right canvas preview, matching the RCS modal pattern.

**Architecture:** Single file change to `TemplateEditorModal.jsx` — swap the outer fixed overlay for a `Dialog`/`DialogContent`, flip the body flex order (sidebar left, canvas right), and add editable Template Name / Subject / Pre-header inputs to the top bar. A small companion change to `EmailRightPanel.jsx` passes the new `open` prop and patches subject/previewText on save.

**Tech Stack:** React, Shadcn UI (`@/components/ui/dialog`), inline styles (existing pattern), lucide-react icons

## Global Constraints

- Use Shadcn `Dialog` + `DialogContent` from `@/components/ui/dialog` — same import used by `RCSTemplateModal.jsx`
- Dialog size: `width: "95vw"`, `maxWidth: 1400`, `maxHeight: "95vh"`, `padding: 0`, `overflow: "hidden"`
- Sidebar width: 280px, fixed, on the LEFT
- Canvas: `flex: 1`, on the RIGHT
- All existing state, handlers, block types, and tab content remain unchanged
- `onSave` / `onClose` prop names unchanged

---

### Task 1: Add `open` prop to `TemplateEditorModal` and update `EmailRightPanel`

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx:689-709`
- Modify: `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx:212`

**Interfaces:**
- Produces: `TemplateEditorModal` accepts a new `open: bool` prop
- Produces: `EmailRightPanel` passes `open={showEditor}` and always renders `<TemplateEditorModal>` (not conditionally)

---

- [ ] **Step 1: Update `EmailRightPanel` to always render modal with `open` prop**

In `src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx`, replace lines 688–709:

```jsx
      {/* Full-screen Template Editor Modal */}
      {showEditor && (
        <TemplateEditorModal
          template={data.template}
          data={data}
          onSave={(editorData) => {
            const tpl = data.template ?? {
              id: `email_custom_${Date.now()}`,
              name: "Custom Template",
              subject: data.subject || "",
              previewText: data.previewText || "",
              category: "Custom",
              thumbnailColor: "#EFF6FF",
              status: "Active",
              lastUpdated: new Date().toISOString().split("T")[0],
              blocks: [],
            };
            patch({ template: { ...tpl, blocks: editorData.blocks } });
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
```

with:

```jsx
      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={showEditor}
        template={data.template}
        data={data}
        onSave={(editorData) => {
          const tpl = data.template ?? {
            id: `email_custom_${Date.now()}`,
            name: "Custom Template",
            subject: data.subject || "",
            previewText: data.previewText || "",
            category: "Custom",
            thumbnailColor: "#EFF6FF",
            status: "Active",
            lastUpdated: new Date().toISOString().split("T")[0],
            blocks: [],
          };
          patch({
            template: { ...tpl, blocks: editorData.blocks },
            ...(editorData.subject !== undefined && { subject: editorData.subject }),
            ...(editorData.previewText !== undefined && { previewText: editorData.previewText }),
          });
        }}
        onClose={() => setShowEditor(false)}
      />
```

- [ ] **Step 2: Add `open` to the `TemplateEditorModal` function signature**

In `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx`, change line 212:

```jsx
export default function TemplateEditorModal({ template, data, onSave, onClose }) {
```

to:

```jsx
export default function TemplateEditorModal({ open, template, data, onSave, onClose }) {
```

- [ ] **Step 3: Verify the app still opens and closes the modal**

Run the dev server (`npm run dev` or `yarn dev`) and open a flow builder. Click "Create New Template" on an email node — the editor should open. Click X — it should close. No visual change yet is expected.

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/nodes/EmailNode/EmailRightPanel.jsx \
        src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx
git commit -m "feat: add open prop to TemplateEditorModal, always render with Dialog-ready pattern"
```

---

### Task 2: Replace fixed overlay with Shadcn Dialog

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx:1-10, 241-256, 559-563`

**Interfaces:**
- Consumes: `open` prop from Task 1
- Produces: modal now renders via `Dialog`/`DialogContent` — backdrop + rounded corners provided by Shadcn

---

- [ ] **Step 1: Add Dialog import**

In `TemplateEditorModal.jsx`, replace line 1:

```jsx
import React, { useState } from "react";
```

with:

```jsx
import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
```

- [ ] **Step 2: Replace the outer fixed overlay wrapper**

The current return statement at lines 241–563 starts with:

```jsx
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "stretch",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex", flexDirection: "column",
          width: "100%", height: "100%",
          background: "#F8FAFC",
        }}
      >
```

and closes at lines 559–563 with:

```jsx
      </div>
    </div>
  );
```

Replace the opening wrapper with:

```jsx
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        style={{
          width: "95vw",
          maxWidth: 1400,
          maxHeight: "95vh",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#F8FAFC",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
```

And replace the closing wrapper with:

```jsx
      </DialogContent>
    </Dialog>
  );
```

- [ ] **Step 3: Verify the modal opens as a proper popup**

Run the dev server. Open a flow, click "Create New Template" on an email node. The editor should now open as a centered popup with the Shadcn backdrop (dark overlay around it), with a visible border radius. Clicking outside or pressing Escape should close it.

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx
git commit -m "feat: replace fixed overlay with Shadcn Dialog in TemplateEditorModal"
```

---

### Task 3: Flip layout — sidebar to left, canvas to right

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx:329-558`

**Interfaces:**
- Consumes: existing `sideTab`, `setSideTab`, all sidebar panel JSX, canvas JSX — unchanged
- Produces: sidebar is the first child in the body flex container (left), canvas is second (right)

---

- [ ] **Step 1: Reorder the body's children**

The body div at line 330 contains two children in this order:
1. `{/* ─ Email canvas (main area) ─ */}` — `<div style={{ flex: 1, ... }}>`
2. `{/* ─ Right sidebar ─ */}` — `<div style={{ width: 280, borderLeft: ... }}>`

Swap them so the sidebar comes first. Also update the sidebar's border from `borderLeft` to `borderRight` since it will now be on the left edge of the canvas.

The body section (lines 330–558) should become:

```jsx
        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* ─ Left sidebar ─ */}
          <div style={{
            width: 280, background: "#fff", borderRight: "1px solid #E5E7EB",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            {/* Sidebar tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
              {["content", "rows", "variables", "settings"].map((tab) => (
                <SideTab key={tab} active={sideTab === tab} onClick={() => setSideTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </SideTab>
              ))}
            </div>

            <div style={{ flex: 1, overflow: "y-auto", overflowY: "auto" }}>
              {/* CONTENT tab */}
              {sideTab === "content" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Drag blocks into the email
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {EDITOR_CONTENT_BLOCKS.map((block) => (
                      <ContentBlockChip key={block.type} block={block} />
                    ))}
                  </div>
                </div>
              )}

              {/* ROWS tab */}
              {sideTab === "rows" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Choose a column layout
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {EDITOR_ROW_LAYOUTS.map((layout) => (
                      <div key={layout.id}>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>{layout.label}</div>
                        <RowLayout layout={layout} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VARIABLES tab */}
              {sideTab === "variables" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Insert Personalization
                  </div>
                  <input
                    value={varSearch}
                    onChange={(e) => setVarSearch(e.target.value)}
                    placeholder="Search variables…"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  {Object.entries(SYSTEM_VARIABLES).map(([group, vars]) => {
                    const filtered = vars.filter((v) => !varSearch || v.label.toLowerCase().includes(varSearch.toLowerCase()) || v.key.toLowerCase().includes(varSearch.toLowerCase()));
                    if (!filtered.length) return null;
                    return (
                      <div key={group} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{group}</div>
                        {filtered.map((v) => (
                          <div
                            key={v.key}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", background: "#F8FAFC" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v.label}</div>
                              <div style={{ fontSize: 10, color: "#94A3B8" }}>{v.example}</div>
                            </div>
                            <code style={{ fontSize: 10, background: "#EEF2FF", color: "#4F46E5", padding: "2px 6px", borderRadius: 4 }}>
                              {`{{${v.key}}}`}
                            </code>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SETTINGS tab */}
              {sideTab === "settings" && (
                <div>
                  <SettingsSection label="Email Background" defaultOpen>
                    <SettingRow label="Background color">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{ width: 24, height: 24, borderRadius: 5, background: bgColor, border: "1px solid #E5E7EB", cursor: "pointer" }}
                        />
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
                          id="bg-color-input"
                        />
                        <label htmlFor="bg-color-input" style={{ fontSize: 12, color: "#64748B", cursor: "pointer" }}>
                          {bgColor}
                        </label>
                      </div>
                    </SettingRow>
                  </SettingsSection>

                  <SettingsSection label="Email Width" defaultOpen>
                    <FontSelect
                      label="Max width"
                      value={emailWidth}
                      onChange={setEmailWidth}
                      options={[
                        { value: "500", label: "500px" },
                        { value: "600", label: "600px (Default)" },
                        { value: "700", label: "700px" },
                        { value: "800", label: "800px" },
                      ]}
                    />
                  </SettingsSection>

                  <SettingsSection label="Typography">
                    <FontSelect
                      label="Font family"
                      value="inter"
                      onChange={() => {}}
                      options={[
                        { value: "inter",   label: "Inter" },
                        { value: "arial",   label: "Arial" },
                        { value: "georgia", label: "Georgia" },
                        { value: "verdana", label: "Verdana" },
                      ]}
                    />
                    <FontSelect
                      label="Base font size"
                      value="14"
                      onChange={() => {}}
                      options={["12","13","14","16","18"].map((v) => ({ value: v, label: `${v}px` }))}
                    />
                  </SettingsSection>

                  <SettingsSection label="Link Colors">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <ColorSwatch color={EMAIL_BLUE} label="Link color" />
                      <ColorSwatch color="#1D4ED8" label="Visited color" />
                    </div>
                  </SettingsSection>
                </div>
              )}
            </div>
          </div>

          {/* ─ Email canvas (main area) ─ */}
          <div
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", overflow: "auto",
              background: "#E2E8F0", padding: "32px 16px",
            }}
          >
            {/* Canvas header */}
            <div style={{ width: previewWidth, marginBottom: 8, transition: "width 0.25s" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 6 }}>
                {viewMode === "mobile" ? "📱 Mobile Preview" : "🖥 Desktop Preview"} — {previewWidth}px
              </div>
            </div>

            {/* Email wrapper */}
            <div
              style={{
                width: previewWidth, background: bgColor,
                borderRadius: 8, overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                transition: "width 0.25s",
              }}
            >
              {/* Email header bar */}
              <div style={{ background: "#fff", padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  {data?.subject || "Your Email Subject"}
                </div>
                {data?.previewText && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{data.previewText}</div>
                )}
              </div>

              {/* Email body */}
              <div style={{ padding: "8px 0" }}>
                {blocks.map((block, i) => (
                  <EmailCanvasBlock
                    key={i}
                    block={block}
                    index={i}
                    total={blocks.length}
                    onDelete={deleteBlock}
                  />
                ))}

                {/* Add block button */}
                <div style={{ padding: "12px 24px" }}>
                  <button
                    onClick={() => addBlock("text")}
                    style={{
                      width: "100%", padding: "10px", border: "2px dashed #BFDBFE",
                      borderRadius: 8, background: "#EFF6FF", cursor: "pointer",
                      fontSize: 12, color: "#3B82F6", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add Block
                  </button>
                </div>
              </div>

              {/* Email footer */}
              <div style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", padding: "16px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                  You're receiving this because you opted in at <strong>store.com</strong>.
                </div>
                <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 6, cursor: "pointer" }}>
                  Unsubscribe · View in browser · Privacy Policy
                </div>
              </div>
            </div>
          </div>

        </div>
```

- [ ] **Step 2: Verify layout**

Run the dev server. Open the email template editor. The block chips / tabs should now appear on the **left** side, and the email canvas preview should be on the **right** side.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx
git commit -m "feat: flip email editor layout — sidebar left, canvas right"
```

---

### Task 4: Add Template Name, Subject, Pre-header inputs to top bar

**Files:**
- Modify: `src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx:212-327`

**Interfaces:**
- Consumes: `data.subject`, `data.previewText`, `template.name` from props (initial values)
- Produces: `onSave` payload now includes `{ blocks, bgColor, subject, previewText }` — `EmailRightPanel.onSave` already handles these from Task 1

---

- [ ] **Step 1: Add `templateName`, `subject`, `previewText` state**

In `TemplateEditorModal.jsx`, the state block at lines 213–218 currently reads:

```jsx
  const [viewMode,   setViewMode]   = useState("desktop");
  const [sideTab,    setSideTab]    = useState("content");
  const [blocks,     setBlocks]     = useState(template?.blocks ?? DEFAULT_BLOCKS);
  const [bgColor,    setBgColor]    = useState("#F8FAFC");
  const [emailWidth, setEmailWidth] = useState("600");
  const [varSearch,  setVarSearch]  = useState("");
```

Replace with:

```jsx
  const [viewMode,      setViewMode]      = useState("desktop");
  const [sideTab,       setSideTab]       = useState("content");
  const [blocks,        setBlocks]        = useState(template?.blocks ?? DEFAULT_BLOCKS);
  const [bgColor,       setBgColor]       = useState("#F8FAFC");
  const [emailWidth,    setEmailWidth]    = useState("600");
  const [varSearch,     setVarSearch]     = useState("");
  const [templateName,  setTemplateName]  = useState(template?.name || "");
  const [subject,       setSubject]       = useState(data?.subject || "");
  const [previewText,   setPreviewText]   = useState(data?.previewText || "");
```

- [ ] **Step 2: Update `handleSave` to include new fields**

Current `handleSave` at lines 230–233:

```jsx
  const handleSave = () => {
    onSave({ blocks, bgColor });
    onClose();
  };
```

Replace with:

```jsx
  const handleSave = () => {
    onSave({ blocks, bgColor, subject, previewText });
    onClose();
  };
```

- [ ] **Step 3: Replace the top bar left section with editable inputs**

The top bar left section at lines 264–275 currently shows display-only text:

```jsx
          {/* Left: title */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlignLeft size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                {template?.name || "Email Template"}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>Visual Editor</div>
            </div>
          </div>
```

Replace with editable inputs:

```jsx
          {/* Left: template meta inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              style={{
                padding: "5px 10px", fontSize: 12, fontWeight: 600,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 160, color: "#0F172A", background: "#F8FAFC",
              }}
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              style={{
                padding: "5px 10px", fontSize: 12,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 200, color: "#0F172A", background: "#F8FAFC",
              }}
            />
            <input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Pre-header text"
              style={{
                padding: "5px 10px", fontSize: 12,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 200, color: "#0F172A", background: "#F8FAFC",
              }}
            />
          </div>
```

- [ ] **Step 4: Verify fields work**

Run the dev server. Open the email editor. The top bar should now show three compact text inputs for Template Name, Subject line, and Pre-header text. Type into them, click Save Template — reopen the node's right panel and confirm the subject value updated on the node.

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/EmailNode/TemplateEditorModal.jsx
git commit -m "feat: add editable Template Name, Subject, Pre-header inputs to email editor top bar"
```
