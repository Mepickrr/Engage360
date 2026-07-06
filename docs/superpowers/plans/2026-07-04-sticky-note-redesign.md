# Sticky Note Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the palette-based "Sticky Notes" entry in both Flow Builder v1 and v2 with a purpose-built `StickyNoteNode` canvas node, triggered from a new footer toolbar button, with all formatting (color, bold/italic/underline/strike, emoji, text size) done inline on the note card.

**Architecture:** A new `StickyNoteNode` component (icon+heading header, `contentEditable` body, floating formatting toolbar shown on selection) is added to each app's `nodes/` folder and registered in each `Canvas.jsx`'s `nodeTypes` map under the `note` key. The existing React Flow `<Controls>` gets a 4th `<ControlButton>` below Fit View that creates a note at the viewport center via `useReactFlow().screenToFlowPosition()`. The palette entry is deleted from both `NodePalette.jsx` (v2) and `nodeComponents.json` (v1).

**Tech Stack:** React, `reactflow` v11 (`useReactFlow`, `ControlButton`), Zustand (`useFlowBuilderStore`), `lucide-react` icons, native `contentEditable` + `document.execCommand` for inline rich text (matches existing `EmailNode`/`WhatsAppNode` patterns — no new dependencies), Jest + React Testing Library (v2 only — v1 has no test infra).

## Global Constraints

- Heading: plain text, hard-capped at 30 characters.
- Body: rich text (bold/italic/underline/strikethrough + emoji), hard-capped at 1000 characters.
- Color presets: exactly `yellow`, `green`, `blue`.
- Text sizes: exactly `small`, `medium`, `large`, `xlarge`.
- Sticky notes have **no connection handles** — pure canvas annotation, not part of flow logic.
- Formatting toolbar renders **only when the note is selected**; hidden otherwise.
- No right-hand configuration panel involvement — all editing is inline on the card.
- No new npm dependencies (emoji grid is hand-built, ~40 curated emoji, no picker library).
- v1 (`app/frontend/src`) and v2 (`src`) are independent apps with no shared package — every new file is duplicated into both, following the existing per-app node-folder convention (e.g. `WebhookNode` exists independently in both trees).
- v2 has Jest + RTL test infra and existing test conventions (`__tests__/*.test.jsx`, mock `reactflow`'s `Handle`/`Position`/`useReactFlow`); v1 has zero test files and no `@testing-library` install — v1 tasks are implementation + manual verification only, per "follow existing patterns."

---

## Task 1: v2 — Remove sticky note from the node palette

**Files:**
- Modify: `src/components/flows/builder/NodePalette.jsx:17,22,108-113`
- Test: `src/components/flows/builder/__tests__/NodePalette.test.jsx` (new)

**Interfaces:**
- Produces: `CATEGORIES` array in `NodePalette.jsx` no longer contains an entry with `id: "notes"`.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/__tests__/NodePalette.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import NodePalette from "../NodePalette";

describe("NodePalette — sticky note removal", () => {
  it("does not render a Notes category or Sticky Notes item", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Sticky Notes")).not.toBeInTheDocument();
  });

  it("still renders other categories, e.g. Communication", () => {
    render(<NodePalette onNodeAdd={() => {}} />);
    expect(screen.getByText("Communication")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test NodePalette --watchAll=false`
Expected: FAIL — `expect(screen.queryByText("Notes")).not.toBeInTheDocument()` fails because the Notes category currently renders.

- [ ] **Step 3: Remove the notes category and unused import**

In `src/components/flows/builder/NodePalette.jsx`, delete the `notes` category block (currently lines 108-113):

```jsx
  {
    id: "notes", label: "Notes", Icon: FileText, color: "amber",
    nodes: [
      { id:"stickynote", name:"Sticky Notes", Icon:FileText, kind:"note", subtype:null },
    ],
  },
```

`FileText` is only referenced by this category (verified via grep — no other usage in the file), so remove it from the lucide-react import on line 22:

```jsx
  FilePlus, UserCheck, RefreshCw, FileText,
```
becomes:
```jsx
  FilePlus, UserCheck, RefreshCw,
```

Leave `StickyNote` on line 17 as-is — it was already unused before this change (dead import, out of scope for this task).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test NodePalette --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/NodePalette.jsx src/components/flows/builder/__tests__/NodePalette.test.jsx
git commit -m "feat: remove sticky note entry from v2 node palette"
```

---

## Task 2: v2 — Sticky note data module + wire into `defaultDataForPaletteItem`

**Files:**
- Create: `src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js`
- Modify: `src/lib/flowMeta.js:200-201` (the existing `case "note":` block), plus its import list
- Modify: `src/lib/__tests__/flowMeta.judgeme.test.js` (add a mock for the new mockData path so the existing test file keeps passing)
- Test: `src/lib/__tests__/flowMeta.stickynote.test.js` (new)

**Interfaces:**
- Produces: `defaultStickyNoteNodeData` (shape below), `STICKY_NOTE_COLORS` (keys `yellow`/`green`/`blue`, each `{ bg, border, text }`), `STICKY_NOTE_FONT_SIZES` (keys `small`/`medium`/`large`/`xlarge`, each `{ heading, body }` px numbers), `STICKY_NOTE_EMOJIS` (array of 40 emoji strings) — all from `StickyNoteNode/data/mockData.js`. These are consumed by Task 5 (`StickyNoteNode/index.jsx`), Task 3 (`EmojiPicker.jsx`), and Task 4 (`StickyNoteToolbar.jsx`).

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/flowMeta.stickynote.test.js`:

```js
import { defaultDataForPaletteItem } from "../flowMeta";

jest.mock(
  "@/components/flows/builder/nodes/StickyNoteNode/data/mockData",
  () => ({
    defaultStickyNoteNodeData: {
      icon: "📌", heading: "", body: "", color: "yellow", fontSize: "medium",
    },
  }),
);
// Silence all other mockData imports
jest.mock("@/components/flows/builder/nodes/JudgeMeNode/data/mockData",       () => ({ defaultJudgeMeNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiCallingNode/data/mockData",      () => ({ defaultAiCallingNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiCallingV2Node/data/mockData",    () => ({ defaultAiCallingV2NodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiChatbotNode/data/mockData",      () => ({ defaultAiChatbotNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/RCSNode/data/mockData",            () => ({ defaultRCSNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/AiPredictNode/data/mockData",      () => ({ defaultAiPredictNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/StartFlowNode/data/mockData",      () => ({ defaultStartFlowNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/RazorpayNode/data/mockData",       () => ({ defaultRazorpayNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/SMSNode/data/mockData",            () => ({ defaultSMSNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/PushNode/data/mockData",           () => ({ defaultPushNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/ConditionalSplitNode/data/mockData",() => ({ defaultConditionalSplitData: {} }));
jest.mock("@/components/flows/builder/nodes/EmailNode/data/mockData",          () => ({ defaultEmailNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/OnsiteNode/data/mockData",         () => ({ defaultOnsiteNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/InAppNode/data/mockData",          () => ({ defaultInAppNodeData: {} }));
jest.mock("@/components/flows/builder/nodes/NextBestActionNode/data/mockData", () => ({ defaultNBANodeData: {} }));
jest.mock("@/components/flows/builder/nodes/SmartFlowOptimizerNode/data/mockData",() => ({ defaultSFONodeData: {} }));
jest.mock("@/components/flows/builder/nodes/WebhookNode/data/mockData",        () => ({ defaultWebhookNodeData: {} }));

describe("flowMeta — sticky note", () => {
  it("defaultDataForPaletteItem returns sticky note defaults for kind:note", () => {
    const data = defaultDataForPaletteItem({ kind: "note" });
    expect(data).toEqual({ icon: "📌", heading: "", body: "", color: "yellow", fontSize: "medium" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test flowMeta.stickynote --watchAll=false`
Expected: FAIL — module `@/components/flows/builder/nodes/StickyNoteNode/data/mockData` does not exist yet, and `case "note"` still returns `{ label: "Note", body: "" }`.

- [ ] **Step 3: Create the data module**

Create `src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js`:

```js
export const STICKY_NOTE_COLORS = {
  yellow: { bg: "#FEF9C3", border: "#EAB308", text: "#713F12" },
  green:  { bg: "#DCFCE7", border: "#22C55E", text: "#14532D" },
  blue:   { bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A" },
};

export const STICKY_NOTE_FONT_SIZES = {
  small:  { heading: 13, body: 11 },
  medium: { heading: 16, body: 13 },
  large:  { heading: 18, body: 15 },
  xlarge: { heading: 22, body: 18 },
};

export const STICKY_NOTE_EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "😢", "😡", "👍", "👎", "🙏",
  "🎉", "🔥", "💡", "⭐", "❤️", "💯", "✅", "❌", "⚠️", "📌",
  "📝", "📅", "⏰", "🚀", "🎯", "💰", "🛒", "📦", "🎁", "🔔",
  "😊", "😴", "🤝", "👏", "🙌", "💪", "👀", "🚨", "✨", "🏆",
];

export const defaultStickyNoteNodeData = {
  icon: "📌",
  heading: "",
  body: "",
  color: "yellow",
  fontSize: "medium",
};
```

- [ ] **Step 4: Wire it into `flowMeta.js`**

In `src/lib/flowMeta.js`, add an import next to the other `defaultXNodeData` imports (after line 42):

```js
import { defaultStickyNoteNodeData } from "@/components/flows/builder/nodes/StickyNoteNode/data/mockData";
```

Replace the existing `case "note":` block (lines 200-201):

```js
    case "note":
      return { label: "Note", body: "" };
```
with:
```js
    case "note":
      return { ...defaultStickyNoteNodeData };
```

- [ ] **Step 5: Silence the new mockData import in the existing judgeme test file**

In `src/lib/__tests__/flowMeta.judgeme.test.js`, add one line to the existing block of `jest.mock(...)` calls (after the `WebhookNode` mock on line 23):

```js
jest.mock("@/components/flows/builder/nodes/StickyNoteNode/data/mockData",     () => ({ defaultStickyNoteNodeData: {} }));
```

- [ ] **Step 6: Run both tests to verify they pass**

Run: `npx craco test flowMeta --watchAll=false`
Expected: PASS (both `flowMeta.judgeme.test.js` and `flowMeta.stickynote.test.js`)

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js src/lib/flowMeta.js src/lib/__tests__/flowMeta.judgeme.test.js src/lib/__tests__/flowMeta.stickynote.test.js
git commit -m "feat: add sticky note default data and wire into flowMeta"
```

---

## Task 3: v2 — `EmojiPicker` popover component

**Files:**
- Create: `src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx`
- Test: `src/components/flows/builder/nodes/StickyNoteNode/__tests__/EmojiPicker.test.jsx`

**Interfaces:**
- Consumes: `STICKY_NOTE_EMOJIS` from `./data/mockData` (Task 2).
- Produces: `export default function EmojiPicker({ onSelect, onClose })` — clicking an emoji button calls `onSelect(emoji: string)`; clicking outside the popover calls `onClose()`. Consumed by Task 4 (`StickyNoteToolbar`) and Task 5 (`StickyNoteNode`, for the heading icon).

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/StickyNoteNode/__tests__/EmojiPicker.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EmojiPicker from "../EmojiPicker";
import { STICKY_NOTE_EMOJIS } from "../data/mockData";

describe("EmojiPicker", () => {
  it("renders one button per curated emoji", () => {
    render(<EmojiPicker onSelect={() => {}} onClose={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(STICKY_NOTE_EMOJIS.length);
  });

  it("calls onSelect with the clicked emoji", () => {
    const onSelect = jest.fn();
    render(<EmojiPicker onSelect={onSelect} onClose={() => {}} />);
    fireEvent.click(screen.getByText(STICKY_NOTE_EMOJIS[0]));
    expect(onSelect).toHaveBeenCalledWith(STICKY_NOTE_EMOJIS[0]);
  });

  it("calls onClose when clicking outside the picker", () => {
    const onClose = jest.fn();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <EmojiPicker onSelect={() => {}} onClose={onClose} />
      </div>,
    );
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(onClose).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test EmojiPicker --watchAll=false`
Expected: FAIL — `../EmojiPicker` module does not exist yet.

- [ ] **Step 3: Implement the component**

Create `src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx`:

```jsx
import React, { useEffect, useRef } from "react";
import { STICKY_NOTE_EMOJIS } from "./data/mockData";

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-testid="sticky-note-emoji-picker"
      style={{
        position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 20,
        display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2,
        padding: 8, background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", width: 208,
      }}
    >
      {STICKY_NOTE_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            width: 22, height: 22, border: "none", background: "transparent",
            cursor: "pointer", fontSize: 14, borderRadius: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test EmojiPicker --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx src/components/flows/builder/nodes/StickyNoteNode/__tests__/EmojiPicker.test.jsx
git commit -m "feat: add sticky note emoji picker popover"
```

---

## Task 4: v2 — `StickyNoteToolbar` formatting bar

**Files:**
- Create: `src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx`
- Test: `src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteToolbar.test.jsx`

**Interfaces:**
- Consumes: `STICKY_NOTE_COLORS`, `STICKY_NOTE_FONT_SIZES` from `./data/mockData` (Task 2); `EmojiPicker` from `./EmojiPicker` (Task 3).
- Produces: `export default function StickyNoteToolbar({ color, onColorChange, onFormat, fontSize, onFontSizeChange, onEmojiSelect })`. `onFormat` is called with one of the literal strings `"bold"`, `"italic"`, `"underline"`, `"strikeThrough"` (these match `document.execCommand` command names exactly — Task 5 passes them straight through). Consumed by Task 5.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteToolbar.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyNoteToolbar from "../StickyNoteToolbar";

const baseProps = {
  color: "yellow",
  onColorChange: jest.fn(),
  onFormat: jest.fn(),
  fontSize: "medium",
  onFontSizeChange: jest.fn(),
  onEmojiSelect: jest.fn(),
};

describe("StickyNoteToolbar", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls onColorChange with the clicked color key", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("green"));
    expect(baseProps.onColorChange).toHaveBeenCalledWith("green");
  });

  it("calls onFormat with the execCommand-compatible name for each format button", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Bold"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("bold");
    fireEvent.click(screen.getByTitle("Strikethrough"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("strikeThrough");
    fireEvent.click(screen.getByTitle("Underline"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("underline");
    fireEvent.click(screen.getByTitle("Italic"));
    expect(baseProps.onFormat).toHaveBeenCalledWith("italic");
  });

  it("opens the emoji picker and forwards selection via onEmojiSelect", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Emoji"));
    expect(screen.getByTestId("sticky-note-emoji-picker")).toBeInTheDocument();
    fireEvent.click(screen.getByText("😀"));
    expect(baseProps.onEmojiSelect).toHaveBeenCalledWith("😀");
  });

  it("calls onFontSizeChange when a size option is picked", () => {
    render(<StickyNoteToolbar {...baseProps} />);
    fireEvent.click(screen.getByTitle("Text size"));
    fireEvent.click(screen.getByText(/XL — Xlarge/i));
    expect(baseProps.onFontSizeChange).toHaveBeenCalledWith("xlarge");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test StickyNoteToolbar --watchAll=false`
Expected: FAIL — `../StickyNoteToolbar` module does not exist yet.

- [ ] **Step 3: Implement the component**

Create `src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx`:

```jsx
import React, { useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Smile, ChevronDown } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import { STICKY_NOTE_COLORS, STICKY_NOTE_FONT_SIZES } from "./data/mockData";

const FORMAT_BUTTONS = [
  { command: "bold",          icon: Bold,          title: "Bold" },
  { command: "strikeThrough", icon: Strikethrough, title: "Strikethrough" },
  { command: "underline",     icon: Underline,      title: "Underline" },
  { command: "italic",        icon: Italic,        title: "Italic" },
];

function iconBtnStyle() {
  return {
    width: 24, height: 24, borderRadius: 5, border: "none", background: "transparent",
    cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center",
  };
}

export default function StickyNoteToolbar({
  color, onColorChange, onFormat, fontSize, onFontSizeChange, onEmojiSelect,
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  return (
    <div
      data-testid="sticky-note-toolbar"
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
        display: "flex", alignItems: "center", gap: 4, padding: "4px 6px",
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 10, whiteSpace: "nowrap",
      }}
    >
      {Object.entries(STICKY_NOTE_COLORS).map(([key, val]) => (
        <button
          key={key}
          type="button"
          title={key}
          onClick={() => onColorChange(key)}
          style={{
            width: 16, height: 16, borderRadius: "50%", background: val.bg,
            border: `2px solid ${color === key ? val.border : "transparent"}`,
            cursor: "pointer", padding: 0,
          }}
        />
      ))}

      <div style={{ width: 1, height: 18, background: "#E5E7EB", margin: "0 2px" }} />

      {FORMAT_BUTTONS.map(({ command, icon: Icon, title }) => (
        <button
          key={command}
          type="button"
          title={title}
          onClick={() => onFormat(command)}
          style={iconBtnStyle()}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon size={13} />
        </button>
      ))}

      <div style={{ position: "relative" }}>
        <button type="button" title="Emoji" onClick={() => setShowEmoji((v) => !v)} style={iconBtnStyle()}>
          <Smile size={13} />
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => { onEmojiSelect(emoji); setShowEmoji(false); }}
            onClose={() => setShowEmoji(false)}
          />
        )}
      </div>

      <div style={{ width: 1, height: 18, background: "#E5E7EB", margin: "0 2px" }} />

      <div style={{ position: "relative" }}>
        <button
          type="button"
          title="Text size"
          onClick={() => setShowSizeMenu((v) => !v)}
          style={{ ...iconBtnStyle(), width: "auto", padding: "0 6px", gap: 2, fontSize: 11, fontWeight: 600 }}
        >
          Aa <ChevronDown size={10} />
        </button>
        {showSizeMenu && (
          <div style={{
            position: "absolute", bottom: "100%", left: 0, marginBottom: 4, background: "#fff",
            border: "1px solid #E5E7EB", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            overflow: "hidden", zIndex: 10,
          }}>
            {Object.keys(STICKY_NOTE_FONT_SIZES).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { onFontSizeChange(size); setShowSizeMenu(false); }}
                style={{
                  display: "block", width: "100%", padding: "6px 12px", textAlign: "left", border: "none",
                  background: fontSize === size ? "#F1F5F9" : "transparent", cursor: "pointer",
                  fontSize: 12, color: "#0F172A",
                }}
              >
                {size[0].toUpperCase()}{size === "xlarge" ? "L" : ""} — {size[0].toUpperCase() + size.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test StickyNoteToolbar --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteToolbar.test.jsx
git commit -m "feat: add sticky note inline formatting toolbar"
```

---

## Task 5: v2 — `StickyNoteNode` canvas card

**Files:**
- Create: `src/components/flows/builder/nodes/StickyNoteNode/index.jsx`
- Test: `src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteNode.test.jsx`

**Interfaces:**
- Consumes: `StickyNoteToolbar` (Task 4), `EmojiPicker` (Task 3), `STICKY_NOTE_COLORS`/`STICKY_NOTE_FONT_SIZES` (Task 2), `useReactFlow` from `reactflow`.
- Produces: `export default function StickyNoteNode({ id, data, selected })` — a React Flow custom node with no `Handle`s. Registered in Canvas as `note: StickyNoteNode` in Task 6.

- [ ] **Step 1: Write the failing test**

Create `src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteNode.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import StickyNoteNode from "../index";

const setNodesMock = jest.fn();

jest.mock("reactflow", () => ({
  useReactFlow: () => ({ setNodes: setNodesMock }),
}));

const baseData = { icon: "📌", heading: "Launch notes", body: "Ship by Friday", color: "yellow", fontSize: "medium" };

describe("StickyNoteNode", () => {
  beforeEach(() => setNodesMock.mockClear());

  it("renders heading and icon, no connection handles", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    expect(screen.getByTestId("sticky-note-node")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Launch notes")).toBeInTheDocument();
    expect(screen.getByText("📌")).toBeInTheDocument();
    expect(screen.queryByTestId(/handle-/)).not.toBeInTheDocument();
  });

  it("does not render the formatting toolbar when not selected", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    expect(screen.queryByTestId("sticky-note-toolbar")).not.toBeInTheDocument();
  });

  it("renders the formatting toolbar when selected", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected />);
    expect(screen.getByTestId("sticky-note-toolbar")).toBeInTheDocument();
  });

  it("caps the heading input at 30 characters via maxLength", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    const input = screen.getByDisplayValue("Launch notes");
    expect(input).toHaveAttribute("maxlength", "30");
  });

  it("patches heading text via setNodes on change", () => {
    render(<StickyNoteNode id="note1" data={baseData} selected={false} />);
    const input = screen.getByDisplayValue("Launch notes");
    fireEvent.change(input, { target: { value: "New heading" } });
    expect(setNodesMock).toHaveBeenCalled();
    const updater = setNodesMock.mock.calls[0][0];
    const result = updater([{ id: "note1", data: baseData }]);
    expect(result[0].data.heading).toBe("New heading");
  });

  it("applies the selected color's background", () => {
    render(<StickyNoteNode id="note1" data={{ ...baseData, color: "green" }} selected={false} />);
    expect(screen.getByTestId("sticky-note-node")).toHaveStyle("background: #DCFCE7");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test StickyNoteNode --watchAll=false`
Expected: FAIL — `../index` module does not exist yet.

- [ ] **Step 3: Implement the component**

Create `src/components/flows/builder/nodes/StickyNoteNode/index.jsx`:

```jsx
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useReactFlow } from "reactflow";
import StickyNoteToolbar from "./StickyNoteToolbar";
import EmojiPicker from "./EmojiPicker";
import { STICKY_NOTE_COLORS, STICKY_NOTE_FONT_SIZES } from "./data/mockData";

const HEADING_MAX = 30;
const BODY_MAX = 1000;

export default function StickyNoteNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null); // "heading" | "body" | null
  const [showHeadingEmoji, setShowHeadingEmoji] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);

  const color = data?.color || "yellow";
  const fontSize = data?.fontSize || "medium";
  const palette = STICKY_NOTE_COLORS[color];
  const sizes = STICKY_NOTE_FONT_SIZES[fontSize];

  // contentEditable is uncontrolled: seed its DOM content once on mount only,
  // so React re-renders from later data patches never touch the DOM and reset the caret.
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = data?.body || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchData = useCallback((patch) => {
    setNodes((nodes) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [id, setNodes]);

  const handleHeadingChange = (e) => {
    patchData({ heading: e.target.value.slice(0, HEADING_MAX) });
  };

  const handleBodyInput = (e) => {
    const text = e.currentTarget.innerText || "";
    if (text.length > BODY_MAX) {
      e.currentTarget.innerText = text.slice(0, BODY_MAX);
    }
    patchData({ body: e.currentTarget.innerHTML });
  };

  const handleFormat = (command) => {
    bodyRef.current?.focus();
    document.execCommand(command);
    patchData({ body: bodyRef.current?.innerHTML || "" });
  };

  const handleEmojiSelect = (emoji) => {
    if (activeField === "heading") {
      patchData({ icon: emoji });
      return;
    }
    bodyRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    patchData({ body: bodyRef.current?.innerHTML || "" });
  };

  return (
    <div
      data-testid="sticky-note-node"
      style={{
        position: "relative", width: 220, background: palette.bg,
        border: `1px solid ${palette.border}`, borderRadius: 10,
        boxShadow: selected ? `0 0 0 2px ${palette.border}` : "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {selected && (
        <StickyNoteToolbar
          color={color}
          onColorChange={(c) => patchData({ color: c })}
          onFormat={handleFormat}
          fontSize={fontSize}
          onFontSizeChange={(s) => patchData({ fontSize: s })}
          onEmojiSelect={handleEmojiSelect}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 4px" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => { setActiveField("heading"); setShowHeadingEmoji((v) => !v); }}
            style={{ fontSize: sizes.heading, lineHeight: 1, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            title="Change icon"
          >
            {data?.icon || "📌"}
          </button>
          {showHeadingEmoji && (
            <EmojiPicker
              onSelect={(emoji) => { patchData({ icon: emoji }); setShowHeadingEmoji(false); }}
              onClose={() => setShowHeadingEmoji(false)}
            />
          )}
        </div>
        <input
          value={data?.heading || ""}
          onChange={handleHeadingChange}
          onFocus={() => setActiveField("heading")}
          placeholder="Add a heading..."
          maxLength={HEADING_MAX}
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: sizes.heading, fontWeight: 700, color: palette.text,
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        {!bodyFocused && !data?.body && (
          <span style={{
            position: "absolute", top: 4, left: 12, fontSize: sizes.body, color: "#94A3B8", pointerEvents: "none",
          }}>
            Add a note...
          </span>
        )}
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => { setActiveField("body"); setBodyFocused(true); }}
          onBlur={() => setBodyFocused(false)}
          onInput={handleBodyInput}
          style={{
            padding: "4px 12px 12px", fontSize: sizes.body, color: palette.text,
            lineHeight: 1.5, outline: "none", minHeight: 40, wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test StickyNoteNode --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/StickyNoteNode/index.jsx src/components/flows/builder/nodes/StickyNoteNode/__tests__/StickyNoteNode.test.jsx
git commit -m "feat: add StickyNoteNode canvas card component"
```

---

## Task 6: v2 — Register the node and add the footer "Sticky Note" button

**Files:**
- Modify: `src/components/flows/builder/Canvas.jsx`

**Interfaces:**
- Consumes: `StickyNoteNode` (Task 5, default export), `defaultDataForPaletteItem` (already imported), `useReactFlow`/`ControlButton` from `reactflow`.

- [ ] **Step 1: Update imports and `nodeTypes`**

In `src/components/flows/builder/Canvas.jsx`, change the `reactflow` import (lines 2-10) to add `ControlButton` and `useReactFlow`:

```jsx
import ReactFlow, {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
} from "reactflow";
```

Add a `lucide-react` import for the button icon, and the new node import, near the top import block:

```jsx
import { StickyNote as StickyNoteIcon } from "lucide-react";
import StickyNoteNode from "./nodes/StickyNoteNode";
```

Replace the `note: ChannelNode,   // Sticky notes` line inside `nodeTypes` (currently line 68):

```jsx
  note:            StickyNoteNode,
```

- [ ] **Step 2: Add the create-sticky-note handler and footer button**

Inside `export default function Canvas({ onCanvasDrop })`, after the existing `wrapperRef` declaration (currently line 103), add:

```jsx
  const { screenToFlowPosition } = useReactFlow();

  const handleAddStickyNote = useCallback(() => {
    const noteCount = nodes.filter((n) => n.type === "note").length;
    const offset = (noteCount % 5) * 24;
    const center = screenToFlowPosition({
      x: window.innerWidth / 2 + offset,
      y: window.innerHeight / 2 + offset,
    });
    onCanvasDrop?.({
      id: nextId(nodes, "note"),
      type: "note",
      position: center,
      data: defaultDataForPaletteItem({ kind: "note" }),
    });
  }, [nodes, onCanvasDrop, screenToFlowPosition]);
```

Then update the `<Controls>` element (currently line 213) to render the new button as a child, directly after Fit View:

```jsx
        <Controls position="bottom-left" showInteractive={false}>
          <ControlButton onClick={handleAddStickyNote} title="Sticky Note">
            <StickyNoteIcon size={16} />
          </ControlButton>
        </Controls>
```

- [ ] **Step 2b: Note on `useReactFlow` availability**

`useReactFlow` requires the calling component to be a descendant of `<ReactFlowProvider>`. Both `src/pages/FlowBuilderV2.jsx:324-326` and `src/pages/FlowBuilder.jsx` already wrap `<Canvas />` in `<ReactFlowProvider>`, so calling the hook directly inside the `Canvas` function body (not just inside `<ReactFlow>`'s children) works correctly.

- [ ] **Step 3: Manual verification (no Canvas.jsx test file exists in this repo — follow that convention)**

Run the dev server and confirm in-browser:

```bash
npm start
```

1. Open a flow in the builder, confirm the footer control stack now shows 4 buttons: Zoom In, Zoom Out, Fit View, Sticky Note (in that order, same visual style).
2. Click the Sticky Note button — a note card appears near the center of the canvas, pre-selected, with its formatting toolbar visible.
3. Click elsewhere to deselect — toolbar disappears, note card remains with default yellow color and placeholder text.
4. Click the Sticky Note button again — a second note appears offset from the first (not exactly overlapping).

- [ ] **Step 4: Commit**

```bash
git add src/components/flows/builder/Canvas.jsx
git commit -m "feat: register StickyNoteNode and add footer Sticky Note button"
```

---

## Task 7: v1 — Remove sticky note from the node palette data

**Files:**
- Modify: `app/frontend/src/data/nodeComponents.json:53-61`

- [ ] **Step 1: Remove the notes category**

In `app/frontend/src/data/nodeComponents.json`, delete the entire `notes` category object (currently lines 53-61):

```json
    {
      "id": "notes",
      "name": "Notes",
      "color": "#F59E0B",
      "bg": "#FEF3C7",
      "items": [
        { "slug": "sticky_notes", "name": "Sticky Notes", "kind": "generic", "subtype": "sticky_notes", "icon": "StickyNote", "color": "#F59E0B" }
      ]
    },
```

Ensure the surrounding JSON stays valid (no trailing comma issues) — the category before it (`integrations`) should now be followed directly by `flow_control`.

- [ ] **Step 2: Manual verification**

Run the v1 dev server and confirm the "Notes" section no longer appears in the palette:

```bash
cd app/frontend && npm start
```

Open the flow builder, confirm no "Notes" category / "Sticky Notes" item shows in the left palette.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/data/nodeComponents.json
git commit -m "feat: remove sticky note entry from v1 node palette"
```

---

## Task 8: v1 — Sticky note data module + `defaultDataForPaletteItem` case

**Files:**
- Create: `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js`
- Modify: `app/frontend/src/lib/flowMeta.js`

**Interfaces:**
- Produces: same shape as v2 Task 2 (`defaultStickyNoteNodeData`, `STICKY_NOTE_COLORS`, `STICKY_NOTE_FONT_SIZES`, `STICKY_NOTE_EMOJIS`) — duplicated verbatim into the v1 tree since v1/v2 share no package.

- [ ] **Step 1: Create the data module**

Create `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js` with the exact same content as `src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js` from Task 2, Step 3.

- [ ] **Step 2: Add the "note" case to v1's `flowMeta.js`**

In `app/frontend/src/lib/flowMeta.js`, add an import near the existing `defaultWebhookNodeData` import (line 80):

```js
import { defaultStickyNoteNodeData } from "@/components/flows/builder/nodes/StickyNoteNode/data/mockData";
```

Add a new case inside `defaultDataForPaletteItem` (in the `switch (item.kind)` block, alongside `case "webhook":`):

```js
    case "note":
      return { ...defaultStickyNoteNodeData };
```

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/components/flows/builder/nodes/StickyNoteNode/data/mockData.js app/frontend/src/lib/flowMeta.js
git commit -m "feat: add v1 sticky note default data and wire into flowMeta"
```

---

## Task 9: v1 — `EmojiPicker` and `StickyNoteToolbar` components

**Files:**
- Create: `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx`
- Create: `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx`

**Interfaces:**
- Same as v2 Tasks 3 and 4 — identical component API, duplicated into the v1 tree.

- [ ] **Step 1: Create `EmojiPicker.jsx`**

Create `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx` with the exact same content as `src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx` from Task 3, Step 3.

- [ ] **Step 2: Create `StickyNoteToolbar.jsx`**

Create `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx` with the exact same content as `src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx` from Task 4, Step 3.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/src/components/flows/builder/nodes/StickyNoteNode/EmojiPicker.jsx app/frontend/src/components/flows/builder/nodes/StickyNoteNode/StickyNoteToolbar.jsx
git commit -m "feat: add v1 sticky note emoji picker and formatting toolbar"
```

---

## Task 10: v1 — `StickyNoteNode` canvas card

**Files:**
- Create: `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/index.jsx`

**Interfaces:**
- Same as v2 Task 5 — identical component API, duplicated into the v1 tree.

- [ ] **Step 1: Create the component**

Create `app/frontend/src/components/flows/builder/nodes/StickyNoteNode/index.jsx` with the exact same content as `src/components/flows/builder/nodes/StickyNoteNode/index.jsx` from Task 5, Step 3.

- [ ] **Step 2: Commit**

```bash
git add app/frontend/src/components/flows/builder/nodes/StickyNoteNode/index.jsx
git commit -m "feat: add v1 StickyNoteNode canvas card component"
```

---

## Task 11: v1 — Register the node and add the footer "Sticky Note" button

**Files:**
- Modify: `app/frontend/src/components/flows/builder/Canvas.jsx`

**Interfaces:**
- Consumes: `StickyNoteNode` (Task 10), `defaultDataForPaletteItem` (already imported), `useReactFlow`/`ControlButton` from `reactflow`.

- [ ] **Step 1: Update imports and `nodeTypes`**

In `app/frontend/src/components/flows/builder/Canvas.jsx`, change the `reactflow` import (lines 2-10) to add `ControlButton` and `useReactFlow`:

```jsx
import ReactFlow, {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
} from "reactflow";
```

Add imports for the icon and the new node:

```jsx
import { StickyNote as StickyNoteIcon } from "lucide-react";
import StickyNoteNode from "./nodes/StickyNoteNode";
```

Add `note: StickyNoteNode,` to the `nodeTypes` map (currently lines 26-37; v1 has no existing `note` key, so this is a new line):

```jsx
const nodeTypes = {
  trigger: TriggerNode,
  channel: ChannelNode,
  wait: LogicNode,
  condition: ConditionalSplitNode,
  split: LogicNode,
  wait_until: LogicNode,
  end: ExitNode,
  goal: ExitNode,
  generic: GenericNode,
  webhook: WebhookNode,
  note: StickyNoteNode,
};
```

- [ ] **Step 2: Add the create-sticky-note handler and footer button**

Inside `export default function Canvas({ onCanvasDrop })`, after the existing `wrapperRef` declaration (currently line 64), add:

```jsx
  const { screenToFlowPosition } = useReactFlow();

  const handleAddStickyNote = useCallback(() => {
    const noteCount = nodes.filter((n) => n.type === "note").length;
    const offset = (noteCount % 5) * 24;
    const center = screenToFlowPosition({
      x: window.innerWidth / 2 + offset,
      y: window.innerHeight / 2 + offset,
    });
    onCanvasDrop?.({
      id: nextId(nodes, "note"),
      type: "note",
      position: center,
      data: defaultDataForPaletteItem({ kind: "note" }),
    });
  }, [nodes, onCanvasDrop, screenToFlowPosition]);
```

Update the `<Controls>` element (currently lines 185-188) to render the new button as a child:

```jsx
        <Controls position="bottom-left" showInteractive={false}>
          <ControlButton onClick={handleAddStickyNote} title="Sticky Note">
            <StickyNoteIcon size={16} />
          </ControlButton>
        </Controls>
```

- [ ] **Step 2b: Note on `useReactFlow` availability**

`app/frontend/src/pages/FlowBuilder.jsx:250-252` already wraps `<Canvas />` in `<ReactFlowProvider>`, so `useReactFlow()` works correctly inside the `Canvas` function body.

- [ ] **Step 3: Manual verification**

```bash
cd app/frontend && npm start
```

Repeat the same checklist as v2 Task 6, Step 3 (4 footer buttons in order, click creates a selected note with toolbar, deselect hides toolbar, second click offsets the new note).

- [ ] **Step 4: Commit**

```bash
git add app/frontend/src/components/flows/builder/Canvas.jsx
git commit -m "feat: register v1 StickyNoteNode and add footer Sticky Note button"
```

---

## Task 12: End-to-end manual verification of formatting features (both apps)

**Files:** none (verification only)

- [ ] **Step 1: v2 — full feature walkthrough**

With `npm start` running at the repo root, in the Flow Builder V2 canvas:

1. Add a sticky note via the footer button.
2. Type a heading longer than 30 characters — confirm input stops accepting further characters at 30.
3. Click the heading emoji button, pick an emoji — confirm it replaces the header icon.
4. Click into the body, type text, select part of it, click Bold/Italic/Underline/Strikethrough — confirm each toggles visually.
5. With the body focused, click the toolbar's emoji button and pick an emoji — confirm it's inserted at the cursor in the body (not replacing the heading icon).
6. Switch text size through all four options (S/M/L/XL) — confirm body (and proportionally heading) text resizes.
7. Switch color through yellow/green/blue — confirm card background/border updates.
8. Type body text up to and past 1000 characters — confirm it stops accepting further characters at 1000.
9. Deselect the note, reselect it — confirm all formatting/content persisted.
10. Confirm the note has no connection dots and cannot be wired to other nodes.

- [ ] **Step 2: v1 — repeat the same walkthrough**

With `cd app/frontend && npm start` running, repeat Step 1's full checklist against the v1 Flow Builder canvas.

- [ ] **Step 3: Run the full v2 test suite to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All tests pass, including the new `NodePalette`, `flowMeta.stickynote`, `EmojiPicker`, `StickyNoteToolbar`, and `StickyNoteNode` tests from Tasks 1-5.
