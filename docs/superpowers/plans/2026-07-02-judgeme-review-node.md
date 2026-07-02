# Judge.me Review Node — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Judge.me Review node (canvas + right panel) fully into the Flow Builder so sellers can configure a 3-step review collection sequence (Rating → Review Text → Image) with live channel previews across WhatsApp, RCS, and Instagram.

**Architecture:** The canvas node (`JudgeMeNode/index.jsx`) and data layer (`data/mockData.js`) already exist from commit `145caa6`. Task 1 wires the node into the builder plumbing (nodeTypes, flowMeta, ConfigTab routing). Task 2 creates the right panel with all configuration sections and channel-specific live previews.

**Tech Stack:** React 18, React Flow, Zustand (`useFlowBuilderStore`), inline styles only (no Tailwind, no CSS modules), `@testing-library/react`, Jest via `craco test`.

## Global Constraints

- Inline styles only — no Tailwind utility classes, no CSS modules.
- Orange accent: `#F97316` (ORANGE). BORDER: `#E5E7EB`. MUTED: `#94A3B8`.
- `updateNodeData(nodeId, patch)` from Zustand store — never mutate `node.data` directly.
- JudgeMeRightPanel accepts `{ node, updateNodeData, removeNode }` as props (matches PushRightPanel / SMSRightPanel / WebhookRightPanel pattern in ConfigTab).
- Test command: `craco test --watchAll=false --testPathPattern=JudgeMe` (runs in ~15 s).
- All new text content (labels, placeholders, defaults) must match the spec verbatim.
- No comments except where the WHY is non-obvious.

---

### Task 1: Wire JudgeMeNode into the builder plumbing

**Files:**
- Modify: `src/components/flows/builder/NodePalette.jsx` line 77
- Modify: `src/components/flows/builder/Canvas.jsx` (import + nodeTypes entry)
- Modify: `src/lib/flowMeta.js` (import + `defaultDataForPaletteItem` + `rendererTypeForKind`)
- Modify: `src/components/flows/builder/panels/ConfigTab.jsx` (import + routing block)
- Test: `src/lib/__tests__/flowMeta.judgeme.test.js`

**Interfaces:**
- Consumes: `defaultJudgeMeNodeData` exported from `src/components/flows/builder/nodes/JudgeMeNode/data/mockData.js`
- Produces: `defaultDataForPaletteItem({ kind: "judgeme" })` returns `defaultJudgeMeNodeData`; `rendererTypeForKind("judgeme")` returns `"judgeme"`; Canvas renders `JudgeMeNode` for nodes with `type: "judgeme"`; ConfigTab routes `node.type === "judgeme"` to `<JudgeMeRightPanel />`

- [ ] **Step 1: Write the failing tests for flowMeta helpers**

Create `src/lib/__tests__/flowMeta.judgeme.test.js`:

```js
import { defaultDataForPaletteItem, rendererTypeForKind } from "../flowMeta";

jest.mock(
  "@/components/flows/builder/nodes/JudgeMeNode/data/mockData",
  () => ({ defaultJudgeMeNodeData: { label: "Collect Review", channel: "whatsapp" } }),
);
// Silence all other mockData imports
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

describe("flowMeta — judgeme", () => {
  it("defaultDataForPaletteItem returns judgeme defaults for kind:judgeme", () => {
    const data = defaultDataForPaletteItem({ kind: "judgeme" });
    expect(data.label).toBe("Collect Review");
    expect(data.channel).toBe("whatsapp");
  });

  it("rendererTypeForKind returns judgeme for kind:judgeme", () => {
    expect(rendererTypeForKind("judgeme")).toBe("judgeme");
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /Users/meenalkamalakar/Documents/dowl
craco test --watchAll=false --testPathPattern="flowMeta.judgeme"
```

Expected: FAIL — `defaultDataForPaletteItem({ kind: "judgeme" })` falls through to the default case and `rendererTypeForKind` returns `"logic"`.

- [ ] **Step 3: Change NodePalette.jsx — set kind to "judgeme"**

In `src/components/flows/builder/NodePalette.jsx` line 77, change:
```js
{ id:"judgeme",   name:"Judge Me",  Icon:Star,       kind:"action", subtype:"judgeme"  },
```
to:
```js
{ id:"judgeme",   name:"Judge Me",  Icon:Star,       kind:"judgeme", subtype:null  },
```

- [ ] **Step 4: Add JudgeMeNode to Canvas.jsx**

In `src/components/flows/builder/Canvas.jsx`, after the existing node imports (after the `WebhookNode` import, line ~34), add:
```js
import JudgeMeNode from "./nodes/JudgeMeNode";
```

In the `nodeTypes` object (after the `razorpay: RazorpayNode` line), add:
```js
judgeme:         JudgeMeNode,
```

- [ ] **Step 5: Update flowMeta.js — import + two function cases**

In `src/lib/flowMeta.js`, after the existing import block (after the `defaultWebhookNodeData` import, line ~41), add:
```js
import { defaultJudgeMeNodeData } from "@/components/flows/builder/nodes/JudgeMeNode/data/mockData";
```

In `defaultDataForPaletteItem`, after the `case "razorpay":` block, add:
```js
    case "judgeme":
      return { ...defaultJudgeMeNodeData };
```

In `rendererTypeForKind`, after `if (kind === "razorpay")   return "razorpay";`, add:
```js
  if (kind === "judgeme")    return "judgeme";
```

- [ ] **Step 6: Add JudgeMeRightPanel routing to ConfigTab.jsx**

In `src/components/flows/builder/panels/ConfigTab.jsx`, after the existing imports (after the `WebhookRightPanel` import, line ~21), add:
```js
import JudgeMeRightPanel from "@/components/flows/builder/nodes/JudgeMeNode/JudgeMeRightPanel";
```

In `ConfigTab`, after the `if (node?.type === "razorpay")` block, add:
```js
  if (node?.type === "judgeme") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <JudgeMeRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
craco test --watchAll=false --testPathPattern="flowMeta.judgeme"
```

Expected: PASS — both assertions green.

- [ ] **Step 8: Commit**

```bash
git add src/components/flows/builder/NodePalette.jsx \
        src/components/flows/builder/Canvas.jsx \
        src/lib/flowMeta.js \
        src/components/flows/builder/panels/ConfigTab.jsx \
        src/lib/__tests__/flowMeta.judgeme.test.js
git commit -m "feat: wire JudgeMeNode into builder plumbing (nodeTypes, flowMeta, ConfigTab)"
```

---

### Task 2: Build JudgeMeRightPanel

**Files:**
- Create: `src/components/flows/builder/nodes/JudgeMeNode/JudgeMeRightPanel.jsx`
- Create: `src/components/flows/builder/nodes/JudgeMeNode/__tests__/JudgeMeRightPanel.test.jsx`

**Interfaces:**
- Consumes: `{ node, updateNodeData, removeNode }` props; `RATING_OPTIONS`, `DEFAULT_MESSAGES`, `VARIABLE_GROUPS` from `./data/mockData`
- Produces: a scrollable right panel; calls `updateNodeData(node.id, patch)` on every field change

- [ ] **Step 1: Write the failing tests**

Create `src/components/flows/builder/nodes/JudgeMeNode/__tests__/JudgeMeRightPanel.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import JudgeMeRightPanel from "../JudgeMeRightPanel";

const makeNode = (overrides = {}) => ({
  id: "jm-1",
  type: "judgeme",
  data: {
    label: "Collect Review",
    channel: "whatsapp",
    productVar: null,
    ratingQuestion: "How would you rate your recent purchase? Please select a rating.",
    ratingButton: "Rate",
    reviewQuestion: "Please share a brief review of your experience in one line.",
    reviewError: "Your review must be at least 3 characters. Please try again.",
    retryCount: 2,
    imageEnabled: false,
    imageQuestion: "Please upload a photo of your product.",
    allowSkipImage: true,
    imageSkipLabel: "Skip",
    noResponseValue: 24,
    noResponseUnit: "hours",
    ...overrides,
  },
});

describe("JudgeMeRightPanel — channel selector", () => {
  it("renders three channel chips", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText(/RCS/i)).toBeInTheDocument();
    expect(screen.getByText(/Instagram/i)).toBeInTheDocument();
  });

  it("clicking RCS chip calls updateNodeData with channel:rcs", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    fireEvent.click(screen.getByText(/RCS/i));
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ channel: "rcs" }));
  });
});

describe("JudgeMeRightPanel — Step 1 Rating", () => {
  it("renders rating question textarea pre-filled with default", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    const textarea = screen.getByDisplayValue("How would you rate your recent purchase? Please select a rating.");
    expect(textarea).toBeInTheDocument();
  });

  it("shows button text field for WhatsApp channel", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "whatsapp" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Rate")).toBeInTheDocument();
  });

  it("hides button text field for RCS channel", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "rcs" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.queryByDisplayValue("Rate")).not.toBeInTheDocument();
  });

  it("shows all 5 fixed rating options", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByText("⭐ 1 — Poor")).toBeInTheDocument();
    expect(screen.getByText("⭐ 5 — Excellent")).toBeInTheDocument();
  });
});

describe("JudgeMeRightPanel — Step 2 Review Text", () => {
  it("renders review question textarea", () => {
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Please share a brief review of your experience in one line.")).toBeInTheDocument();
  });

  it("editing review question calls updateNodeData", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode()} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    const textarea = screen.getByDisplayValue("Please share a brief review of your experience in one line.");
    fireEvent.change(textarea, { target: { value: "What did you think?" } });
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ reviewQuestion: "What did you think?" }));
  });
});

describe("JudgeMeRightPanel — Step 3 Image", () => {
  it("image question is hidden when imageEnabled is false", () => {
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: false })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.queryByDisplayValue("Please upload a photo of your product.")).not.toBeInTheDocument();
  });

  it("image question is shown when imageEnabled is true", () => {
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: true })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByDisplayValue("Please upload a photo of your product.")).toBeInTheDocument();
  });

  it("clicking image toggle calls updateNodeData with imageEnabled:true", () => {
    const updateNodeData = jest.fn();
    render(<JudgeMeRightPanel node={makeNode({ imageEnabled: false })} updateNodeData={updateNodeData} removeNode={jest.fn()} />);
    fireEvent.click(screen.getByTestId("image-toggle"));
    expect(updateNodeData).toHaveBeenCalledWith("jm-1", expect.objectContaining({ imageEnabled: true }));
  });
});

describe("JudgeMeRightPanel — Live Preview", () => {
  it("WhatsApp preview shows list button placeholder", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "whatsapp" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-wa-rating-btn")).toBeInTheDocument();
  });

  it("RCS preview shows suggestion chips", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "rcs" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-rcs-chips")).toBeInTheDocument();
  });

  it("Instagram preview shows quick reply buttons", () => {
    render(<JudgeMeRightPanel node={makeNode({ channel: "instagram" })} updateNodeData={jest.fn()} removeNode={jest.fn()} />);
    expect(screen.getByTestId("preview-ig-replies")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
craco test --watchAll=false --testPathPattern="JudgeMeRightPanel"
```

Expected: FAIL — module not found (file doesn't exist yet).

- [ ] **Step 3: Implement JudgeMeRightPanel.jsx**

Create `src/components/flows/builder/nodes/JudgeMeNode/JudgeMeRightPanel.jsx`:

```jsx
import React, { useState } from "react";
import { RATING_OPTIONS, DEFAULT_MESSAGES, VARIABLE_GROUPS } from "./data/mockData";

const ORANGE = "#F97316";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

const CHANNELS = [
  { id: "whatsapp",  label: "💬 WhatsApp"  },
  { id: "rcs",       label: "📱 RCS"       },
  { id: "instagram", label: "📸 Instagram" },
];

function FieldLabel({ text }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#6B7280",
      textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
    }}>
      {text}
    </div>
  );
}

function FieldTextarea({ label, value, onChange, maxLength = 1000, placeholder, testId }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <FieldLabel text={label} />}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={3}
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, resize: "none", outline: "none",
          boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, textAlign: "right" }}>{value.length}/{maxLength}</div>
    </div>
  );
}

function FieldInput({ label, value, onChange, maxLength, placeholder, type = "text", min, max, testId }) {
  return (
    <div style={{ marginBottom: 8 }}>
      {label && <FieldLabel text={label} />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        min={min}
        max={max}
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, outline: "none",
          boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
        }}
      />
      {maxLength && (
        <div style={{ fontSize: 10, color: MUTED, textAlign: "right", marginTop: 2 }}>
          {String(value).length}/{maxLength}
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onToggle, testId }) {
  return (
    <button
      onClick={onToggle}
      data-testid={testId}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: on ? ORANGE : "#E5E7EB",
        border: "none", cursor: "pointer", position: "relative", transition: "background 0.15s",
      }}
    >
      <span style={{
        display: "block", width: 14, height: 14, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3, left: on ? 19 : 3, transition: "left 0.15s",
      }} />
    </button>
  );
}

function CollapsibleSection({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", background: "none", border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 600, color: "#374151",
        }}
      >
        {title}
        <span style={{ fontSize: 10, color: MUTED }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

function SectionHeader({ label, color = ORANGE }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 10 }}>{label}</div>
  );
}

function Bubble({ children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: "10px 10px 10px 2px",
      padding: "8px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)", fontSize: 11, color: "#374151",
    }}>
      {children}
    </div>
  );
}

function WhatsAppPreview({ ratingQuestion, ratingButton, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{ background: "#E5DDD5", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <Bubble>
        {ratingQuestion || DEFAULT_MESSAGES.rating}
        <div style={{ marginTop: 6, borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>
          <div
            data-testid="preview-wa-rating-btn"
            style={{ fontSize: 10, color: "#6366F1", textAlign: "center" }}
          >
            📋 {ratingButton || DEFAULT_MESSAGES.ratingButton}
          </div>
        </div>
      </Bubble>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <Bubble>
          {imageQuestion || DEFAULT_MESSAGES.image}
          {allowSkipImage && (
            <div style={{ marginTop: 6, borderTop: `1px solid ${BORDER}`, paddingTop: 6 }}>
              <div style={{ fontSize: 10, color: "#25D366", textAlign: "center" }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </div>
            </div>
          )}
        </Bubble>
      )}
    </div>
  );
}

function RCSPreview({ ratingQuestion, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{ background: "#F0F4F8", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <Bubble>{ratingQuestion || DEFAULT_MESSAGES.rating}</Bubble>
        <div
          data-testid="preview-rcs-chips"
          style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}
        >
          {["⭐1", "⭐2", "⭐3", "⭐4", "⭐5"].map((chip) => (
            <span key={chip} style={{
              fontSize: 10, padding: "3px 8px", border: "1px solid #6366F1",
              borderRadius: 20, color: "#6366F1", background: "#fff",
            }}>
              {chip}
            </span>
          ))}
        </div>
      </div>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <div>
          <Bubble>{imageQuestion || DEFAULT_MESSAGES.image}</Bubble>
          {allowSkipImage && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", border: "1px solid #6366F1",
                borderRadius: 20, color: "#6366F1", background: "#fff",
              }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InstagramPreview({ ratingQuestion, reviewQuestion, imageEnabled, imageQuestion, allowSkipImage, imageSkipLabel }) {
  return (
    <div style={{
      background: "#FAFAFA", borderRadius: 8, padding: 10,
      border: "1px solid rgba(225,48,108,0.15)",
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div>
        <Bubble>{ratingQuestion || DEFAULT_MESSAGES.rating}</Bubble>
        <div
          data-testid="preview-ig-replies"
          style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 6 }}
        >
          {["⭐ 1", "⭐ 2", "⭐ 3", "⭐ 4", "⭐ 5"].map((btn) => (
            <span key={btn} style={{
              fontSize: 10, padding: "3px 8px", border: "1px solid #E1306C",
              borderRadius: 20, color: "#E1306C", background: "#fff",
            }}>
              {btn}
            </span>
          ))}
        </div>
      </div>
      <Bubble>{reviewQuestion || DEFAULT_MESSAGES.reviewText}</Bubble>
      {imageEnabled && (
        <div>
          <Bubble>{imageQuestion || DEFAULT_MESSAGES.image}</Bubble>
          {allowSkipImage && (
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              <span style={{
                fontSize: 10, padding: "3px 8px", border: "1px solid #E1306C",
                borderRadius: 20, color: "#E1306C", background: "#fff",
              }}>
                {imageSkipLabel || DEFAULT_MESSAGES.imageSkip}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JudgeMeRightPanel({ node, updateNodeData }) {
  if (!node) return null;

  const data = node.data ?? {};
  const patch = (changes) => updateNodeData(node.id, changes);

  const channel        = data.channel        ?? "whatsapp";
  const productVar     = data.productVar     ?? "";
  const ratingQuestion = data.ratingQuestion ?? DEFAULT_MESSAGES.rating;
  const ratingButton   = data.ratingButton   ?? DEFAULT_MESSAGES.ratingButton;
  const reviewQuestion = data.reviewQuestion ?? DEFAULT_MESSAGES.reviewText;
  const reviewError    = data.reviewError    ?? DEFAULT_MESSAGES.reviewError;
  const retryCount     = data.retryCount     ?? 2;
  const imageEnabled   = data.imageEnabled   ?? false;
  const imageQuestion  = data.imageQuestion  ?? DEFAULT_MESSAGES.image;
  const allowSkipImage = data.allowSkipImage ?? true;
  const imageSkipLabel = data.imageSkipLabel ?? DEFAULT_MESSAGES.imageSkip;
  const noResponseValue = data.noResponseValue ?? 24;
  const noResponseUnit  = data.noResponseUnit  ?? "hours";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Judge.me Review</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
          Collect product reviews during conversation
        </div>
      </div>

      {/* Channel selector */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <FieldLabel text="Channel" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => patch({ channel: ch.id })}
              style={{
                padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                border: `1.5px solid ${channel === ch.id ? ORANGE : BORDER}`,
                background: channel === ch.id ? "#FFF7ED" : "#fff",
                color: channel === ch.id ? ORANGE : "#6B7280",
                cursor: "pointer",
              }}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product variable */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <FieldLabel text="Product Variable" />
        <select
          value={productVar}
          onChange={(e) => patch({ productVar: e.target.value || null })}
          style={{
            width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "6px 8px", fontSize: 12, background: "#fff", color: "#374151",
          }}
        >
          <option value="">— Select variable —</option>
          {VARIABLE_GROUPS.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.variables.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}{v.recommended ? " ★" : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Step 1 — Rating */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <SectionHeader label="Step 1 — Rating" />
        <FieldTextarea
          label="Question message"
          value={ratingQuestion}
          onChange={(v) => patch({ ratingQuestion: v })}
          placeholder={DEFAULT_MESSAGES.rating}
        />
        {channel === "whatsapp" && (
          <FieldInput
            label="Button text"
            value={ratingButton}
            onChange={(v) => patch({ ratingButton: v.slice(0, 20) })}
            maxLength={20}
            placeholder="Rate"
          />
        )}
        <div style={{ marginTop: 4 }}>
          <FieldLabel text="Rating options (fixed)" />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {RATING_OPTIONS.map((opt) => (
              <div key={opt.value} style={{
                fontSize: 11, color: "#6B7280", padding: "3px 8px",
                background: "#F9FAFB", borderRadius: 4, border: `1px solid ${BORDER}`,
              }}>
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2 — Review Text */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <SectionHeader label="Step 2 — Review Text" />
        <FieldTextarea
          label="Question message"
          value={reviewQuestion}
          onChange={(v) => patch({ reviewQuestion: v })}
          placeholder={DEFAULT_MESSAGES.reviewText}
        />
      </div>

      <CollapsibleSection title="Error & Retries">
        <FieldTextarea
          label="Error message"
          value={reviewError}
          onChange={(v) => patch({ reviewError: v })}
          placeholder={DEFAULT_MESSAGES.reviewError}
        />
        <FieldLabel text="Retry attempts (1–3)" />
        <input
          type="number"
          min={1}
          max={3}
          value={retryCount}
          onChange={(e) => patch({ retryCount: Math.min(3, Math.max(1, Number(e.target.value))) })}
          style={{
            width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
            padding: "6px 8px", fontSize: 12, outline: "none",
            boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
          }}
        />
      </CollapsibleSection>

      {/* Step 3 — Image Upload */}
      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{
          padding: "12px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: imageEnabled ? ORANGE : MUTED }}>
            Step 3 — Image Upload
          </div>
          <Toggle
            on={imageEnabled}
            onToggle={() => patch({ imageEnabled: !imageEnabled })}
            testId="image-toggle"
          />
        </div>
        {imageEnabled && (
          <div style={{ padding: "0 16px 12px" }}>
            <FieldTextarea
              label="Question message"
              value={imageQuestion}
              onChange={(v) => patch({ imageQuestion: v })}
              placeholder={DEFAULT_MESSAGES.image}
            />
          </div>
        )}
      </div>

      {imageEnabled && (
        <CollapsibleSection title="Skip option">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <FieldLabel text="Allow skip" />
            <Toggle
              on={allowSkipImage}
              onToggle={() => patch({ allowSkipImage: !allowSkipImage })}
              testId="skip-toggle"
            />
          </div>
          {allowSkipImage && (
            <FieldInput
              label="Skip button label"
              value={imageSkipLabel}
              onChange={(v) => patch({ imageSkipLabel: v })}
              placeholder="Skip"
            />
          )}
        </CollapsibleSection>
      )}

      {/* No Response */}
      <CollapsibleSection title="No Response">
        <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
          <input
            type="number"
            min={1}
            value={noResponseValue}
            onChange={(e) => patch({ noResponseValue: Number(e.target.value) || 1 })}
            data-testid="no-response-value"
            style={{
              flex: 1, border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: "6px 8px", fontSize: 12, outline: "none",
              boxSizing: "border-box", fontFamily: "inherit", color: "#374151",
            }}
          />
          <select
            value={noResponseUnit}
            onChange={(e) => patch({ noResponseUnit: e.target.value })}
            data-testid="no-response-unit"
            style={{
              flex: 1, border: `1px solid ${BORDER}`, borderRadius: 6,
              padding: "6px 8px", fontSize: 12, background: "#fff", color: "#374151",
            }}
          >
            <option value="minutes">minutes</option>
            <option value="hours">hours</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* Live Preview */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
          Live Preview
        </div>
        {channel === "whatsapp" && (
          <WhatsAppPreview
            ratingQuestion={ratingQuestion}
            ratingButton={ratingButton}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
        {channel === "rcs" && (
          <RCSPreview
            ratingQuestion={ratingQuestion}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
        {channel === "instagram" && (
          <InstagramPreview
            ratingQuestion={ratingQuestion}
            reviewQuestion={reviewQuestion}
            imageEnabled={imageEnabled}
            imageQuestion={imageQuestion}
            allowSkipImage={allowSkipImage}
            imageSkipLabel={imageSkipLabel}
          />
        )}
      </div>

    </div>
  );
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
craco test --watchAll=false --testPathPattern="JudgeMeRightPanel"
```

Expected: all 10 tests pass.

- [ ] **Step 5: Run all JudgeMe tests together**

```bash
craco test --watchAll=false --testPathPattern="JudgeMe"
```

Expected: all tests pass (JudgeMeNode canvas tests + JudgeMeRightPanel tests + flowMeta.judgeme tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/flows/builder/nodes/JudgeMeNode/JudgeMeRightPanel.jsx \
        src/components/flows/builder/nodes/JudgeMeNode/__tests__/JudgeMeRightPanel.test.jsx
git commit -m "feat: implement JudgeMeRightPanel with 3-step config and live channel previews"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Plan task |
|---|---|
| Canvas node unconfigured/configured (§2.1/2.2) | Already implemented in `index.jsx` (pre-existing) |
| Output handles: Success/Skipped/Submission Failed (§2.3) | Already in `index.jsx` |
| Channel selector: WhatsApp/RCS/Instagram (§3.1) | Task 2 — channel chips |
| Product variable picker (§3.1) | Task 2 — grouped select with `VARIABLE_GROUPS` |
| Step 1: rating question + button text WA only (§3.1) | Task 2 |
| Step 2: review text + Error & Retries collapsible (§3.1) | Task 2 |
| Step 3: image toggle + Skip option collapsible (§3.1) | Task 2 |
| No Response collapsible (§3.1) | Task 2 |
| Default messages (§3.2) | Task 2 — `DEFAULT_MESSAGES` from mockData |
| Rating options fixed 1–5 (§3.3) | Task 2 — `RATING_OPTIONS` rendered as non-editable list |
| WhatsApp: list message format preview (§4.1) | Task 2 — `WhatsAppPreview` |
| RCS: suggestion chips preview (§4.1) | Task 2 — `RCSPreview` |
| Instagram: quick replies preview (§4.1) | Task 2 — `InstagramPreview` |
| Image step preview with skip button (§4.3) | Task 2 — preview components conditionally show skip |
| Node registration in Canvas + flowMeta (§8) | Task 1 |
| ConfigTab routing (§8) | Task 1 |

All spec sections covered.

**Placeholder scan:** None found — all code blocks are complete and executable.

**Type consistency:** `patch(changes)` → `updateNodeData(node.id, changes)` consistent throughout. `DEFAULT_MESSAGES` key names (`rating`, `ratingButton`, `reviewText`, `reviewError`, `image`, `imageSkip`) used verbatim from `mockData.js`. `RATING_OPTIONS` array imported and rendered directly.
