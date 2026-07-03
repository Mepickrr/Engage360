# Shopify Unified Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace four separate Shopify palette nodes with a single unified Shopify node that has a card-grid action picker and action-specific config panels.

**Architecture:** New `kind:"shopify"` node following the JudgeMeNode pattern. Canvas component reads `data.action` to show unconfigured/configured states with Success+Failed output handles. Right panel shows a 3-column action picker (matching WhatsApp's TemplateStylePicker) and, once an action is chosen, action-specific config. Four existing Shopify palette entries are hidden from both builders.

**Tech Stack:** React, ReactFlow (Handle, Position), Lucide icons, inline styles (no Tailwind in node components — matches JudgeMeNode pattern).

## Global Constraints

- Shopify accent color: `#96BF48`
- No business logic — UX only; all API calls are mocked/omitted
- Follow JudgeMeNode patterns exactly: inline styles, no Tailwind inside node component files
- Right panel uses `updateNodeData(node.id, { ...data, ...changes })` pattern
- Canvas node width: 240px (matches all other nodes)
- `data-testid` on every interactive element

---

### Task 1: mockData.js — default data + action definitions

**Files:**
- Create: `src/components/flows/builder/nodes/ShopifyNode/data/mockData.js`

**Interfaces:**
- Produces: `SHOPIFY_GREEN`, `SHOPIFY_ACTIONS`, `MOCK_TAGS`, `defaultShopifyNodeData` — imported by index.jsx, ShopifyRightPanel.jsx, and flowMeta.js

- [ ] **Step 1: Create the file**

```js
// src/components/flows/builder/nodes/ShopifyNode/data/mockData.js

export const SHOPIFY_GREEN = "#96BF48";

export const SHOPIFY_ACTIONS = [
  { id: "order_creation",     label: "Order Creation",      emoji: "🛒", desc: "Create an order on Shopify"    },
  { id: "order_cancellation", label: "Order Cancellation",  emoji: "❌", desc: "Cancel an existing order"       },
  { id: "order_tag",          label: "Order Tag Update",    emoji: "🏷️", desc: "Add tags to an order"          },
  { id: "customer_tag",       label: "Customer Tag Update", emoji: "👤", desc: "Add tags to a customer"        },
  { id: "order_notes",        label: "Order Notes",         emoji: "📝", desc: "Update notes on an order"      },
  { id: "discount_code",      label: "Discount Code",       emoji: "🎁", desc: "Generate a discount coupon"    },
];

export const MOCK_TAGS = ["Nitro", "nitro", "fastrr_login"];

export const defaultShopifyNodeData = {
  action: null,
  orderTags: [...MOCK_TAGS],
  customerTags: [...MOCK_TAGS],
  orderNote: "",
  discount: {
    title: "",
    type: "amount",
    amount: null,
    percentage: null,
    appliesTo: "entire_order",
    products: [],
    collections: [],
    minPurchaseEnabled: false,
    minPurchaseType: "order_value",
    minPurchaseValue: null,
    buyX: { quantity: 1, type: "specific_products", items: [] },
    getY: { quantity: 1, type: "specific_products", items: [], discountType: "free", discountValue: null },
    expirationEnabled: false,
    expirationType: "days",
    expirationValue: null,
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/ShopifyNode/data/mockData.js
git commit -m "feat: add ShopifyNode mockData"
```

---

### Task 2: Canvas node — ShopifyNode/index.jsx

**Files:**
- Create: `src/components/flows/builder/nodes/ShopifyNode/index.jsx`
- Test: `src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyNode.test.jsx`

**Interfaces:**
- Consumes: `SHOPIFY_ACTIONS`, `SHOPIFY_GREEN`, `defaultShopifyNodeData` from `./data/mockData`
- Consumes: `Handle`, `Position` from `reactflow`
- Produces: default export `ShopifyNode` — registered as `shopify` in `Canvas.jsx` nodeTypes

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyNode.test.jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import ShopifyNode from "../index";

jest.mock("reactflow", () => ({
  Handle: ({ id }) => <div data-testid={`handle-${id}`} />,
  Position: { Top: "top", Right: "right" },
}));

const baseNode = { id: "n1", data: {} };

describe("ShopifyNode", () => {
  it("renders unconfigured state", () => {
    render(<ShopifyNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("rf-shopify-node-n1")).toBeInTheDocument();
    expect(screen.getByText("Click to configure")).toBeInTheDocument();
  });

  it("renders configured state for order_creation", () => {
    render(<ShopifyNode id="n1" data={{ action: "order_creation" }} selected={false} />);
    expect(screen.getByText("Order Creation")).toBeInTheDocument();
    expect(screen.getByText("Order will be created on Shopify")).toBeInTheDocument();
  });

  it("renders configured state for order_tag with tag preview", () => {
    render(<ShopifyNode id="n1" data={{ action: "order_tag", orderTags: ["vip"] }} selected={false} />);
    expect(screen.getByText(/Order Tag <vip> is Updated/)).toBeInTheDocument();
  });

  it("renders Success and Failed handles", () => {
    render(<ShopifyNode {...baseNode} selected={false} />);
    expect(screen.getByTestId("handle-success")).toBeInTheDocument();
    expect(screen.getByTestId("handle-failed")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest ShopifyNode.test --no-coverage
```
Expected: FAIL — "Cannot find module '../index'"

- [ ] **Step 3: Create the canvas component**

```jsx
// src/components/flows/builder/nodes/ShopifyNode/index.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { ShoppingBag } from "lucide-react";
import { SHOPIFY_ACTIONS, SHOPIFY_GREEN } from "./data/mockData";

const GREEN  = "#16A34A";
const RED    = "#DC2626";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function OutputHandle({ id, label, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>{label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        style={{
          background: color, width: 10, height: 10,
          position: "relative", top: "auto", right: "auto",
          transform: "none", flexShrink: 0,
        }}
      />
    </div>
  );
}

function getPreviewLine(data) {
  const action = data?.action;
  if (!action) return null;
  if (action === "order_creation")    return "Order will be created on Shopify";
  if (action === "order_cancellation") return "Order will be cancelled on Shopify";
  if (action === "order_tag") {
    const tag = (data?.orderTags ?? [])[0] ?? "—";
    return `Order Tag <${tag}> is Updated`;
  }
  if (action === "customer_tag") {
    const tag = (data?.customerTags ?? [])[0] ?? "—";
    return `Customer Tag <${tag}> is Updated`;
  }
  if (action === "order_notes") {
    const note = (data?.orderNote ?? "").slice(0, 30) || "—";
    return `Order Note <${note}> is Updated`;
  }
  if (action === "discount_code") {
    const d = data?.discount ?? {};
    const title   = d.title || "—";
    const type    = d.type  || "amount";
    const expires = d.expirationEnabled ? (d.expirationValue ?? "set") : "never";
    return `Discount: ${title} · ${type} · expires ${expires}`;
  }
  return null;
}

export default function ShopifyNode({ id, data, selected }) {
  const action     = data?.action ?? null;
  const isConfigured = !!action;
  const actionMeta   = SHOPIFY_ACTIONS.find((a) => a.id === action);
  const previewLine  = getPreviewLine(data);

  return (
    <div
      data-testid={`rf-shopify-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isConfigured ? "solid" : "dashed"} ${
          isConfigured ? SHOPIFY_GREEN : "rgba(150,191,72,0.4)"
        }`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(150,191,72,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: SHOPIFY_GREEN, width: 10, height: 10, top: -5 }}
      />

      {!isConfigured ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: SHOPIFY_GREEN,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShoppingBag size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: MUTED, fontWeight: 500 }}>Shopify</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, #6a9e2a 0%, ${SHOPIFY_GREEN} 100%)`,
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <ShoppingBag size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {actionMeta?.label ?? "Shopify"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Shopify
              </div>
            </div>
          </div>

          {/* Action chip */}
          <div style={{
            padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              fontSize: 9, fontWeight: 600, color: SHOPIFY_GREEN,
              background: "#F2F7E8", border: "1px solid #C8E190",
              borderRadius: 20, padding: "1px 7px",
            }}>
              {actionMeta?.emoji} {actionMeta?.label}
            </span>
          </div>

          {/* Preview line */}
          {previewLine && (
            <div style={{
              padding: "6px 10px", borderBottom: `1px solid ${BORDER}`,
              background: "#F8FAFC",
            }}>
              <span style={{ fontSize: 10, color: "#475569" }}>{previewLine}</span>
            </div>
          )}
        </>
      )}

      {/* Output handles */}
      <div style={{
        padding: "8px 10px 10px",
        display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end",
      }}>
        <OutputHandle id="success" label="Success" color={GREEN} />
        <OutputHandle id="failed"  label="Failed"  color={RED}   />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest ShopifyNode.test --no-coverage
```
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/ShopifyNode/index.jsx \
        src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyNode.test.jsx
git commit -m "feat: add ShopifyNode canvas component"
```

---

### Task 3: Right panel — ShopifyRightPanel.jsx

**Files:**
- Create: `src/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel.jsx`
- Test: `src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyRightPanel.test.jsx`

**Interfaces:**
- Consumes: `SHOPIFY_ACTIONS`, `SHOPIFY_GREEN`, `defaultShopifyNodeData` from `./data/mockData`
- Produces: default export `ShopifyRightPanel({ node, updateNodeData, removeNode })` — mounted by ConfigTab

- [ ] **Step 1: Write the failing test**

```jsx
// src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyRightPanel.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ShopifyRightPanel from "../ShopifyRightPanel";

const makeNode = (data = {}) => ({ id: "n1", data });
const noop = jest.fn();

describe("ShopifyRightPanel", () => {
  it("shows action picker when no action set", () => {
    render(<ShopifyRightPanel node={makeNode()} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByText("Order Creation")).toBeInTheDocument();
    expect(screen.getByText("Discount Code")).toBeInTheDocument();
  });

  it("selecting an action calls updateNodeData with that action", () => {
    const update = jest.fn();
    render(<ShopifyRightPanel node={makeNode()} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("shopify-action-order_creation"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: "order_creation" }));
  });

  it("shows change-action link when action is set", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_creation" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("shopify-change-action")).toBeInTheDocument();
  });

  it("change-action resets action to null", () => {
    const update = jest.fn();
    render(<ShopifyRightPanel node={makeNode({ action: "order_tag", orderTags: ["a"] })} updateNodeData={update} removeNode={noop} />);
    fireEvent.click(screen.getByTestId("shopify-change-action"));
    expect(update).toHaveBeenCalledWith("n1", expect.objectContaining({ action: null }));
  });

  it("renders tag input for order_tag action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_tag", orderTags: [] })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("order-tags-input")).toBeInTheDocument();
  });

  it("renders notes textarea for order_notes action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "order_notes", orderNote: "" })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("order-notes-input")).toBeInTheDocument();
  });

  it("renders discount title input for discount_code action", () => {
    render(<ShopifyRightPanel node={makeNode({ action: "discount_code", discount: { title: "", type: "amount", appliesTo: "entire_order", minPurchaseEnabled: false, expirationEnabled: false, expirationType: "days" } })} updateNodeData={noop} removeNode={noop} />);
    expect(screen.getByTestId("discount-title")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest ShopifyRightPanel.test --no-coverage
```
Expected: FAIL — "Cannot find module '../ShopifyRightPanel'"

- [ ] **Step 3: Create the right panel component**

```jsx
// src/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel.jsx
import React, { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { SHOPIFY_ACTIONS, SHOPIFY_GREEN, defaultShopifyNodeData } from "./data/mockData";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Action picker ─────────────────────────────────────────────────────────────
function ActionPicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
        Select an action
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {SHOPIFY_ACTIONS.map(({ id, label, emoji, desc }) => {
          const highlight = hovered === id;
          return (
            <div
              key={id}
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              data-testid={`shopify-action-${id}`}
              style={{
                position: "relative", borderRadius: 8, padding: "10px 8px",
                textAlign: "center", cursor: "pointer",
                background: highlight ? "#F2F7E8" : "#fff",
                border: `${highlight ? 2 : 1.5}px solid ${highlight ? SHOPIFY_GREEN : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 9, color: "#64748B", marginTop: 3, lineHeight: 1.3 }}>{desc}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tag input + chip display ──────────────────────────────────────────────────
function TagsEditor({ tags, onChange, testId }) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const t = input.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput("");
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        placeholder="Enter text here"
        data-testid={testId}
        style={{
          width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box",
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, marginTop: 4, marginBottom: 8 }}>
        Please ENTER to add
      </div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {tags.map((tag) => (
            <span key={tag} style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "#F1F5F9", border: `1px solid ${BORDER}`,
              borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#374151",
            }}>
              {tag}
              <button
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 14, lineHeight: 1, padding: 0 }}
              >×</button>
            </span>
          ))}
          <button
            onClick={() => onChange([])}
            style={{ fontSize: 10, color: "#DC2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ── Applies-to radio group ────────────────────────────────────────────────────
function AppliesToPicker({ value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        Applies to
      </div>
      {[
        { id: "entire_order",         label: "Entire Order"          },
        { id: "specific_products",    label: "Specific Products"     },
        { id: "specific_collections", label: "Specific Collections"  },
      ].map(({ id, label }) => (
        <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
          <input
            type="radio"
            name="appliesTo"
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            style={{ accentColor: SHOPIFY_GREEN }}
          />
          {label}
        </label>
      ))}
    </div>
  );
}

// ── Minimum purchase requirements ─────────────────────────────────────────────
function MinPurchaseSection({ discount, patchDiscount }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 4 }}>
        <input
          type="checkbox"
          checked={discount.minPurchaseEnabled}
          onChange={(e) => patchDiscount({ minPurchaseEnabled: e.target.checked })}
          style={{ accentColor: SHOPIFY_GREEN }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Minimum Purchase Requirements</span>
      </label>
      <div style={{ fontSize: 11, color: MUTED, marginLeft: 22, marginBottom: 8 }}>
        Enable coupon only after a minimum order value
      </div>
      {discount.minPurchaseEnabled && (
        <div style={{ marginLeft: 22 }}>
          <select
            value={discount.minPurchaseType}
            onChange={(e) => patchDiscount({ minPurchaseType: e.target.value })}
            style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", marginBottom: 8, background: "#fff" }}
          >
            <option value="order_value">Minimum Order Value</option>
            <option value="item_count">Minimum Number of Items</option>
          </select>
          <input
            type="number"
            value={discount.minPurchaseValue ?? ""}
            onChange={(e) => patchDiscount({ minPurchaseValue: e.target.value ? Number(e.target.value) : null })}
            placeholder={discount.minPurchaseType === "order_value" ? "Minimum amount" : "Minimum items"}
            min={0}
            style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      )}
    </div>
  );
}

// ── Item type picker (products/collections placeholder) ───────────────────────
function ItemTypePicker({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
        {label}
      </div>
      {[
        { id: "specific_products",    label: "Specific Products"   },
        { id: "specific_collections", label: "Specific Collection" },
      ].map(({ id, label: l }) => (
        <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
          <input
            type="radio"
            value={id}
            checked={value === id}
            onChange={() => onChange(id)}
            style={{ accentColor: SHOPIFY_GREEN }}
          />
          {l}
        </label>
      ))}
      <div style={{
        border: `1.5px dashed ${BORDER}`, borderRadius: 6, padding: "8px 10px",
        fontSize: 11, color: MUTED, textAlign: "center", cursor: "pointer", marginTop: 4,
      }}>
        + Add {value === "specific_products" ? "Product(s) or Product Variable(s)" : "Collection(s)"}
      </div>
    </div>
  );
}

// ── Discount code full config ─────────────────────────────────────────────────
const DISCOUNT_TYPES = [
  { id: "amount",       label: "Amount",       icon: "₹"  },
  { id: "percentage",   label: "Percentage",   icon: "%"  },
  { id: "buy_x_get_y",  label: "Buy X Get Y",  icon: "🎁" },
  { id: "free_shipping",label: "Free Shipping", icon: "🚚" },
];

function DiscountCodeConfig({ discount, patchDiscount }) {
  return (
    <div style={{ padding: "0 16px 16px" }}>
      {/* Coupon Detail */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginTop: 12, marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        Coupon Detail
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Discount Coupon Title
          </span>
          <span style={{ fontSize: 10, color: MUTED }}>{(discount.title || "").length}/30</span>
        </div>
        <input
          type="text"
          value={discount.title}
          onChange={(e) => patchDiscount({ title: e.target.value.slice(0, 30) })}
          placeholder='Eg. "Flat ₹15 Off"'
          data-testid="discount-title"
          style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Discount Details */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${BORDER}` }}>
        Discount Details
      </div>

      {/* Type selector — 4-column card grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
        {DISCOUNT_TYPES.map(({ id, label, icon }) => {
          const sel = discount.type === id;
          return (
            <div
              key={id}
              onClick={() => patchDiscount({ type: id })}
              data-testid={`discount-type-${id}`}
              style={{
                borderRadius: 8, padding: "8px 4px", textAlign: "center", cursor: "pointer",
                background: sel ? "#F2F7E8" : "#fff",
                border: `${sel ? 2 : 1.5}px solid ${sel ? SHOPIFY_GREEN : BORDER}`,
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: sel ? "#3B6D11" : "#374151", lineHeight: 1.2 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Amount */}
      {discount.type === "amount" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Discount Amount
            </div>
            <input
              type="number"
              value={discount.amount ?? ""}
              onChange={(e) => patchDiscount({ amount: e.target.value ? Number(e.target.value) : null })}
              placeholder="15"
              min={0}
              data-testid="discount-amount"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <AppliesToPicker value={discount.appliesTo} onChange={(v) => patchDiscount({ appliesTo: v })} />
          <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
        </>
      )}

      {/* Percentage */}
      {discount.type === "percentage" && (
        <>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Discount Percentage
            </div>
            <input
              type="number"
              value={discount.percentage ?? ""}
              onChange={(e) => patchDiscount({ percentage: e.target.value ? Number(e.target.value) : null })}
              placeholder="15"
              min={0}
              max={100}
              data-testid="discount-percentage"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <AppliesToPicker value={discount.appliesTo} onChange={(v) => patchDiscount({ appliesTo: v })} />
          <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
        </>
      )}

      {/* Buy X Get Y */}
      {discount.type === "buy_x_get_y" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Customer Buys</div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Quantity
            </div>
            <input
              type="number"
              value={discount.buyX.quantity}
              onChange={(e) => patchDiscount({ buyX: { ...discount.buyX, quantity: Number(e.target.value) || 1 } })}
              min={1}
              data-testid="buyx-quantity"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <ItemTypePicker
            label="Any items from"
            value={discount.buyX.type}
            onChange={(v) => patchDiscount({ buyX: { ...discount.buyX, type: v, items: [] } })}
          />

          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 12, marginTop: 4, marginBottom: 8, fontSize: 11, fontWeight: 700, color: "#374151" }}>
            Customer Gets
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
              Quantity
            </div>
            <input
              type="number"
              value={discount.getY.quantity}
              onChange={(e) => patchDiscount({ getY: { ...discount.getY, quantity: Number(e.target.value) || 1 } })}
              min={1}
              data-testid="gety-quantity"
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <ItemTypePicker
            label="Any items from"
            value={discount.getY.type}
            onChange={(v) => patchDiscount({ getY: { ...discount.getY, type: v, items: [] } })}
          />

          <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            At a discounted value
          </div>
          {[
            { id: "free",       label: "Free"          },
            { id: "percentage", label: "Percentage off" },
          ].map(({ id, label }) => (
            <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
              <input
                type="radio"
                name="getYDiscount"
                value={id}
                checked={discount.getY.discountType === id}
                onChange={() => patchDiscount({ getY: { ...discount.getY, discountType: id, discountValue: null } })}
                style={{ accentColor: SHOPIFY_GREEN }}
              />
              {label}
            </label>
          ))}
          {discount.getY.discountType === "percentage" && (
            <input
              type="number"
              value={discount.getY.discountValue ?? ""}
              onChange={(e) => patchDiscount({ getY: { ...discount.getY, discountValue: e.target.value ? Number(e.target.value) : null } })}
              placeholder="10"
              min={0}
              max={100}
              style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
          )}
        </>
      )}

      {/* Free Shipping */}
      {discount.type === "free_shipping" && (
        <MinPurchaseSection discount={discount} patchDiscount={patchDiscount} />
      )}

      {/* Expiration */}
      <div style={{ borderTop: `1px solid ${BORDER}`, marginTop: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={discount.expirationEnabled}
            onChange={(e) => patchDiscount({ expirationEnabled: e.target.checked })}
            style={{ accentColor: SHOPIFY_GREEN }}
            data-testid="expiration-toggle"
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Add Expiration</span>
        </label>
        <div style={{ fontSize: 11, color: MUTED, marginLeft: 22, marginBottom: 8 }}>
          Make coupon only valid till a certain time
        </div>
        {discount.expirationEnabled && (
          <div style={{ marginLeft: 22 }}>
            {[
              { id: "days",       label: "Number of days" },
              { id: "fixed_date", label: "Fixed Date"     },
            ].map(({ id, label }) => (
              <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>
                <input
                  type="radio"
                  name="expType"
                  value={id}
                  checked={discount.expirationType === id}
                  onChange={() => patchDiscount({ expirationType: id, expirationValue: null })}
                  style={{ accentColor: SHOPIFY_GREEN }}
                />
                {label}
              </label>
            ))}
            {discount.expirationType === "days" && (
              <input
                type="number"
                value={discount.expirationValue ?? ""}
                onChange={(e) => patchDiscount({ expirationValue: e.target.value ? Number(e.target.value) : null })}
                placeholder="30"
                min={1}
                data-testid="expiration-days"
                style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            )}
            {discount.expirationType === "fixed_date" && (
              <input
                type="date"
                value={discount.expirationValue ?? ""}
                onChange={(e) => patchDiscount({ expirationValue: e.target.value || null })}
                data-testid="expiration-date"
                style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────
export default function ShopifyRightPanel({ node, updateNodeData }) {
  const data = node?.data ?? {};
  const patch = (changes) => updateNodeData(node.id, { ...data, ...changes });
  const patchDiscount = (changes) => patch({ discount: { ...(data.discount ?? defaultShopifyNodeData.discount), ...changes } });

  const action     = data.action ?? null;
  const actionMeta = SHOPIFY_ACTIONS.find((a) => a.id === action);

  const resetAction = () => patch({
    action:       null,
    orderTags:    [],
    customerTags: [],
    orderNote:    "",
    discount:     { ...defaultShopifyNodeData.discount },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: SHOPIFY_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShoppingBag size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Shopify</div>
          {actionMeta && (
            <div style={{ fontSize: 11, color: MUTED }}>{actionMeta.emoji} {actionMeta.label}</div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!action ? (
          <ActionPicker onSelect={(a) => patch({ action: a })} />
        ) : (
          <>
            {/* Change-action link */}
            <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={resetAction}
                data-testid="shopify-change-action"
                style={{ fontSize: 11, color: SHOPIFY_GREEN, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Change action
              </button>
            </div>

            {/* Order Creation */}
            {action === "order_creation" && (
              <div style={{ padding: 16 }}>
                <div style={{ background: "#F2F7E8", border: "1px solid #C8E190", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#3B6D11", marginBottom: 12 }}>
                  🛒 This is a smart node. Shopify order details are automatically resolved.
                </div>
                <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
                  Order will be created on Shopify
                </div>
              </div>
            )}

            {/* Order Cancellation */}
            {action === "order_cancellation" && (
              <div style={{ padding: 16 }}>
                <div style={{ background: "#F2F7E8", border: "1px solid #C8E190", borderRadius: 8, padding: "12px 14px", fontSize: 12, color: "#3B6D11", marginBottom: 12 }}>
                  ❌ This is a smart node. Shopify order details are automatically resolved.
                </div>
                <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#475569" }}>
                  Order will be cancelled on Shopify
                </div>
              </div>
            )}

            {/* Order Tag */}
            {action === "order_tag" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Tag name
                </div>
                <TagsEditor
                  tags={data.orderTags ?? []}
                  onChange={(tags) => patch({ orderTags: tags })}
                  testId="order-tags-input"
                />
              </div>
            )}

            {/* Customer Tag */}
            {action === "customer_tag" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Tag name
                </div>
                <TagsEditor
                  tags={data.customerTags ?? []}
                  onChange={(tags) => patch({ customerTags: tags })}
                  testId="customer-tags-input"
                />
              </div>
            )}

            {/* Order Notes */}
            {action === "order_notes" && (
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Notes
                </div>
                <textarea
                  value={data.orderNote ?? ""}
                  onChange={(e) => patch({ orderNote: e.target.value })}
                  placeholder="Enter your text here"
                  rows={4}
                  data-testid="order-notes-input"
                  style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            )}

            {/* Discount Code */}
            {action === "discount_code" && (
              <DiscountCodeConfig
                discount={data.discount ?? defaultShopifyNodeData.discount}
                patchDiscount={patchDiscount}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest ShopifyRightPanel.test --no-coverage
```
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel.jsx \
        src/components/flows/builder/nodes/ShopifyNode/__tests__/ShopifyRightPanel.test.jsx
git commit -m "feat: add ShopifyRightPanel with action picker and all configs"
```

---

### Task 4: Wire up registration — NodePalette, FlowBuilderV2, Canvas, ConfigTab, flowMeta

**Files:**
- Modify: `src/components/flows/builder/NodePalette.jsx`
- Modify: `src/pages/FlowBuilderV2.jsx`
- Modify: `src/components/flows/builder/Canvas.jsx`
- Modify: `src/components/flows/builder/panels/ConfigTab.jsx`
- Modify: `src/lib/flowMeta.js`

**Interfaces:**
- Consumes: `ShopifyNode` from `./nodes/ShopifyNode`
- Consumes: `ShopifyRightPanel` from `./nodes/ShopifyNode/ShopifyRightPanel`
- Consumes: `defaultShopifyNodeData` from `./nodes/ShopifyNode/data/mockData`

- [ ] **Step 1: NodePalette.jsx — remove Shopify section, add `shopify` to Integrations**

In `src/components/flows/builder/NodePalette.jsx`, make two changes:

**Remove** the entire `shopify` category object (lines 66–73):
```js
// DELETE this block entirely:
  {
    id: "shopify", label: "Shopify", Icon: ShoppingCart, color: "green",
    nodes: [
      { id:"custtag",    name:"Customer Tag",  Icon:Tag,          kind:"action", subtype:"custtag"    },
      { id:"discount",   name:"Discount Code", Icon:Percent,      kind:"action", subtype:"discount"   },
      { id:"ordertag",   name:"Add Order Tag", Icon:ClipboardList,kind:"action", subtype:"ordertag"   },
      { id:"ordernotes", name:"Order Notes",   Icon:StickyNote,   kind:"action", subtype:"ordernotes" },
    ],
  },
```

**Add** `shopify` entry to the `integrations` category nodes array (after `judgeme`):
```js
{ id:"shopify", name:"Shopify", Icon:ShoppingCart, kind:"shopify", subtype:null },
```

Result — integrations section becomes:
```js
  {
    id: "integrations", label: "Integrations", Icon: Plug, color: "blue",
    nodes: [
      { id:"judgeme",   name:"Judge Me",  Icon:Star,         kind:"judgeme",  subtype:null  },
      { id:"shopify",   name:"Shopify",   Icon:ShoppingCart, kind:"shopify",  subtype:null  },
      { id:"razorpay",  name:"Razor Pay", Icon:CreditCard,   kind:"razorpay", subtype:null  },
      { id:"freshdesk", name:"Freshdesk", Icon:Headphones,   kind:"action",   subtype:"freshdesk" },
      { id:"webhook",   name:"Webhook",   Icon:Webhook,      kind:"webhook",  subtype:null  },
    ],
  },
```

- [ ] **Step 2: FlowBuilderV2.jsx — update V2_ALLOWED_NODES**

In `src/pages/FlowBuilderV2.jsx`, replace lines 43–44:
```js
  // Shopify
  "custtag", "discount", "ordertag", "ordernotes",
```
with:
```js
  // Integrations (shopify added, old separate nodes removed)
  "shopify",
```

Full updated `V2_ALLOWED_NODES`:
```js
const V2_ALLOWED_NODES = [
  // Communication
  "whatsapp", "email", "rcs", "sms", "webpush", "onsite", "inapp", "aichatbot", "aicallingv2",
  // Flow Control
  "condsplit", "delay", "startflow",
  // Integrations
  "webhook", "judgeme", "razorpay", "shopify",
];
```

- [ ] **Step 3: Canvas.jsx — add shopify to nodeTypes**

In `src/components/flows/builder/Canvas.jsx`:

Add import after the JudgeMeNode import (line 35):
```js
import ShopifyNode from "./nodes/ShopifyNode";
```

Add to the `nodeTypes` object after `judgeme: JudgeMeNode,` (line 60):
```js
  shopify:         ShopifyNode,
```

- [ ] **Step 4: ConfigTab.jsx — add routing for shopify type**

In `src/components/flows/builder/panels/ConfigTab.jsx`:

Add import after `JudgeMeRightPanel` import (line 22):
```js
import ShopifyRightPanel from "@/components/flows/builder/nodes/ShopifyNode/ShopifyRightPanel";
```

Add routing block before the final `return` / catch-all (insert before the last block that renders `NodeConfig`, around line 527). Follow the exact same pattern as the `judgeme` block:
```js
  if (node?.type === "judgeme") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <JudgeMeRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
      </div>
    );
  }

  if (node?.type === "shopify") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <ShopifyRightPanel node={node} updateNodeData={updateNodeData} removeNode={removeNode} />
      </div>
    );
  }
```

- [ ] **Step 5: flowMeta.js — add shopify to defaultDataForPaletteItem and rendererTypeForKind**

In `src/lib/flowMeta.js`:

**Add import** at the top alongside existing node data imports:
```js
import { defaultShopifyNodeData } from "@/components/flows/builder/nodes/ShopifyNode/data/mockData";
```

**Add case** to `defaultDataForPaletteItem` switch, after the `judgeme` case (line 134):
```js
    case "shopify":
      return { ...defaultShopifyNodeData };
```

**Add kind mapping** to `rendererTypeForKind`, after `if (kind === "judgeme") return "judgeme";` (line 221):
```js
  if (kind === "shopify")    return "shopify";
```

- [ ] **Step 6: Verify the app builds without errors**

```bash
npm run build 2>&1 | tail -20
```
Expected: no errors, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/flows/builder/NodePalette.jsx \
        src/pages/FlowBuilderV2.jsx \
        src/components/flows/builder/Canvas.jsx \
        src/components/flows/builder/panels/ConfigTab.jsx \
        src/lib/flowMeta.js
git commit -m "feat: wire up Shopify unified node — hide old nodes, register new ShopifyNode"
```
