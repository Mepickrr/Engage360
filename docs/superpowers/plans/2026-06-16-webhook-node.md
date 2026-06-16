# Webhook Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully configurable Webhook Node — canvas card + right-panel config — wired into both the `src/` and `app/frontend/src/` flow builders.

**Architecture:** Three new files per builder path (`mockData.js`, canvas `index.jsx`, `WebhookRightPanel.jsx`) live under `nodes/WebhookNode/`. The canvas card is registered in each `Canvas.jsx`'s `nodeTypes` map; the right panel is dispatched from `ConfigTab.jsx` via an early-return guard on `node.type === "webhook"`. Sub-panels for URL params, headers, and payload are absolute-positioned overlays inside the right panel (same pattern as `SMSTemplatePicker`).

**Tech Stack:** React, ReactFlow handles, Lucide icons, `useFlowBuilderStore` (Zustand), inline styles (matching all other node panels).

---

## File Map

### Create
| File | Responsibility |
|---|---|
| `src/components/flows/builder/nodes/WebhookNode/data/mockData.js` | Constants, default node data shape |
| `src/components/flows/builder/nodes/WebhookNode/index.jsx` | Canvas card — empty + configured states, output port handles |
| `src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx` | Full config panel with sub-panel overlays |
| `app/frontend/src/components/flows/builder/nodes/WebhookNode/data/mockData.js` | Same as above (no analytics dep) |
| `app/frontend/src/components/flows/builder/nodes/WebhookNode/index.jsx` | Same as above but omits `NodeAnalyticsFooter` (not present in app/frontend) |
| `app/frontend/src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx` | Identical to src/ version |

### Modify
| File | Change |
|---|---|
| `src/components/flows/builder/Canvas.jsx` | Import `WebhookNode`; add `webhook: WebhookNode` to `nodeTypes` |
| `src/components/flows/builder/panels/ConfigTab.jsx` | Import `WebhookRightPanel`; add early-return guard for `node.type === "webhook"` |
| `src/lib/flowMeta.js` | Import `defaultWebhookNodeData`; add `case "webhook"` to `defaultDataForPaletteItem` |
| `src/components/flows/builder/NodePalette.jsx` | Change webhook entry `kind` from `"action"` to `"webhook"` |
| `app/frontend/src/components/flows/builder/Canvas.jsx` | Import `WebhookNode`; add `webhook: WebhookNode` to `nodeTypes` |
| `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx` | Import `WebhookRightPanel`; add early-return guard |
| `app/frontend/src/lib/flowMeta.js` | Add `case "webhook"` to `defaultDataForPaletteItem` |

---

## Task 1 — Mock Data (`src/` path)

**Files:**
- Create: `src/components/flows/builder/nodes/WebhookNode/data/mockData.js`

- [ ] **Step 1: Create the file**

```js
// src/components/flows/builder/nodes/WebhookNode/data/mockData.js

export const WEBHOOK_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const WEBHOOK_AUTH_TYPES = [
  { id: "none",    label: "None"         },
  { id: "api_key", label: "API Key"      },
  { id: "bearer",  label: "Bearer Token" },
  { id: "basic",   label: "Basic Auth"   },
];

export const WEBHOOK_RETRY_STRATEGIES = [
  { id: "fixed",       label: "Fixed"              },
  { id: "exponential", label: "Exponential Backoff" },
];

export const WEBHOOK_INITIAL_DELAYS = [
  { id: 10,  label: "10s"  },
  { id: 30,  label: "30s"  },
  { id: 60,  label: "60s"  },
  { id: 300, label: "5min" },
];

export const WEBHOOK_OUTPUT_PORTS = [
  { id: "on_success", label: "On Success", color: "#10B981" },
  { id: "on_failure", label: "On Failure", color: "#EF4444" },
];

export const SYSTEM_VARIABLES = {
  Customer: [
    { key: "customer.firstName", label: "First Name",  example: "Priya"              },
    { key: "customer.lastName",  label: "Last Name",   example: "Sharma"             },
    { key: "customer.phone",     label: "Phone",       example: "+91 98765 43210"    },
    { key: "customer.email",     label: "Email",       example: "priya@example.com"  },
    { key: "customer.id",        label: "Customer ID", example: "CUST_4821"          },
  ],
  Order: [
    { key: "order.id",          label: "Order ID",     example: "#ORD-7842"                   },
    { key: "order.amount",      label: "Order Amount", example: "1299"                        },
    { key: "order.status",      label: "Order Status", example: "Shipped"                     },
    { key: "order.trackingUrl", label: "Tracking URL", example: "https://track.example.com/" },
  ],
  Flow: [
    { key: "flow.name",   label: "Flow Name", example: "Cart Recovery" },
    { key: "flow.nodeId", label: "Node ID",   example: "n5"            },
    { key: "flow.runId",  label: "Run ID",    example: "run_12345"     },
  ],
};

export const defaultWebhookNodeData = {
  label: "Webhook",
  method: "POST",
  url: "",
  auth: {
    type: "none",
    apiKeyName: "",
    apiKeyValue: "",
    apiKeyIn: "header",
    bearerToken: "",
    basicUser: "",
    basicPass: "",
  },
  params: [],
  headers: [],
  payload: {
    mode: "form",
    form: [],
    raw: "",
  },
  retry: {
    enabled: false,
    max: 3,
    strategy: "exponential",
    initialDelay: 30,
  },
  timeout_ms: 10000,
  outputConfig: {
    wiredPorts: [],
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/WebhookNode/data/mockData.js
git commit -m "feat: add WebhookNode mockData (methods, auth types, retry, default data)"
```

---

## Task 2 — Canvas Card (`src/` path)

**Files:**
- Create: `src/components/flows/builder/nodes/WebhookNode/index.jsx`

- [ ] **Step 1: Create the file**

```jsx
// src/components/flows/builder/nodes/WebhookNode/index.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { Webhook } from "lucide-react";
import { WEBHOOK_OUTPUT_PORTS } from "./data/mockData";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";

const WEBHOOK_BLUE = "#3B82F6";
const BORDER = "#E5E7EB";

function PortRow({ portId, label, color, wired }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? color : "#CBD5E1"}`,
        background: wired ? color : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute", right: -4, top: "50%",
          transform: "translateY(-50%)",
          width: 10, height: 10,
          background: "transparent", border: "none",
        }}
      />
    </div>
  );
}

export default function WebhookNode({ id, data, selected }) {
  const label      = data?.label ?? "Webhook";
  const url        = data?.url ?? "";
  const method     = data?.method ?? "POST";
  const auth       = data?.auth ?? { type: "none" };
  const retry      = data?.retry ?? { enabled: false };
  const wiredPorts = data?.outputConfig?.wiredPorts ?? [];
  const isEmpty    = !url;

  const analyticsData = data?.analyticsData ?? null;
  const cardRadius    = analyticsData ? "12px 12px 0 0" : 12;
  const borderColor   = isEmpty ? "rgba(59,130,246,0.4)" : WEBHOOK_BLUE;

  const chips = [
    auth?.type !== "none" && {
      label: auth.type === "api_key" ? "API Key" : auth.type === "bearer" ? "Bearer" : "Basic Auth",
    },
    retry?.enabled && { label: "Retry" },
  ].filter(Boolean);

  return (
    <div
      data-testid={`rf-webhook-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: cardRadius,
        boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: WEBHOOK_BLUE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: WEBHOOK_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Webhook size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Webhook</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: WEBHOOK_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Webhook size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url.replace(/^https?:\/\//, "").slice(0, 40)}
              </div>
            </div>
            <span style={{ fontSize: 8, background: "#EFF6FF", color: WEBHOOK_BLUE, padding: "2px 5px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
              {method}
            </span>
          </div>

          {/* Output ports */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
            {WEBHOOK_OUTPUT_PORTS.map((port) => (
              <PortRow
                key={port.id}
                portId={port.id}
                label={port.label}
                color={port.color}
                wired={wiredPorts.includes(port.id)}
              />
            ))}
          </div>

          {/* Feature chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px 8px", borderTop: `1px solid ${BORDER}` }}>
              {chips.map((chip, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "#EFF6FF", color: WEBHOOK_BLUE }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <NodeAnalyticsFooter type="webhook" analyticsData={analyticsData} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/WebhookNode/index.jsx
git commit -m "feat: add WebhookNode canvas card with empty/configured states and output ports"
```

---

## Task 3 — Right Panel (`src/` path)

**Files:**
- Create: `src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx`

- [ ] **Step 1: Create the file**

```jsx
// src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx
import React, { useState } from "react";
import { Webhook, Trash2, ChevronRight, Play, X } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  WEBHOOK_METHODS,
  WEBHOOK_AUTH_TYPES,
  WEBHOOK_RETRY_STRATEGIES,
  WEBHOOK_INITIAL_DELAYS,
  WEBHOOK_OUTPUT_PORTS,
  SYSTEM_VARIABLES,
  defaultWebhookNodeData,
} from "./data/mockData";

const BLUE  = "#3B82F6";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{ width: 40, height: 22, borderRadius: 11, background: on ? BLUE : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

function SectionButton({ label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width: "100%", padding: "9px 12px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.1s" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
    >
      <span style={{ fontSize: 12, color: "#0F172A", fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {count > 0 && (
          <span style={{ fontSize: 10, background: "#EFF6FF", color: BLUE, padding: "1px 6px", borderRadius: 10, fontWeight: 600 }}>
            {count}
          </span>
        )}
        <ChevronRight size={13} color={MUTED} />
      </div>
    </button>
  );
}

function VariableSelect({ value, onChange, placeholder = "Variable comes here" }) {
  const [open, setOpen] = useState(false);
  const groups = Object.entries(SYSTEM_VARIABLES);
  const allVars = groups.flatMap(([, vars]) => vars);
  const displayVal = value ? (allVars.find((v) => `{{${v.key}}}` === value)?.label ?? value) : "";

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        readOnly
        value={displayVal}
        placeholder={placeholder}
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer", boxSizing: "border-box", background: value ? "#EFF6FF" : "#fff", color: value ? BLUE : "#94A3B8" }}
      />
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto" }}>
          <div
            onClick={() => { onChange(""); setOpen(false); }}
            style={{ padding: "8px 12px", fontSize: 11, color: "#EF4444", cursor: "pointer", borderBottom: `1px solid ${BORDER}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Clear
          </div>
          {groups.map(([group, vars]) => (
            <div key={group}>
              <div style={{ padding: "5px 12px", fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", background: "#F8FAFC" }}>
                {group}
              </div>
              {vars.map((v) => (
                <div
                  key={v.key}
                  onClick={() => { onChange(`{{${v.key}}}`); setOpen(false); }}
                  style={{ padding: "7px 12px", fontSize: 11, cursor: "pointer", display: "flex", justifyContent: "space-between" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                >
                  <span style={{ color: "#0F172A" }}>{v.label}</span>
                  <span style={{ color: MUTED, fontSize: 9 }}>{v.example}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KVRow({ keyVal, value, onKeyChange, onValueChange, onRemove, valueIsVariable = false }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
      <input
        type="text"
        value={keyVal}
        onChange={(e) => onKeyChange(e.target.value)}
        placeholder="Key Name"
        style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
      />
      {valueIsVariable ? (
        <VariableSelect value={value} onChange={onValueChange} />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Value"
          style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4, display: "flex", alignItems: "center" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function URLParamsPanel({ params, onChange, onClose }) {
  const add    = () => onChange([...params, { key: "", value: "" }]);
  const remove = (i) => onChange(params.filter((_, j) => j !== i));
  const patch  = (i, field, val) => { const next = [...params]; next[i] = { ...next[i], [field]: val }; onChange(next); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>URL Parameters</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Parameters appended to your destination URL.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {params.map((p, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Parameter {i + 1}</div>
            <KVRow keyVal={p.key} value={p.value} onKeyChange={(v) => patch(i, "key", v)} onValueChange={(v) => patch(i, "value", v)} onRemove={() => remove(i)} valueIsVariable />
          </div>
        ))}
        <button type="button" onClick={add} style={{ padding: "9px 14px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Add Parameters
        </button>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

function HeadersPanel({ headers, onChange, onClose }) {
  const add    = () => onChange([...headers, { key: "", value: "" }]);
  const remove = (i) => onChange(headers.filter((_, j) => j !== i));
  const patch  = (i, field, val) => { const next = [...headers]; next[i] = { ...next[i], [field]: val }; onChange(next); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Custom Headers</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>HTTP headers sent with your webhook request.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {headers.map((h, i) => (
          <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Header {i + 1}</div>
            <KVRow keyVal={h.key} value={h.value} onKeyChange={(v) => patch(i, "key", v)} onValueChange={(v) => patch(i, "value", v)} onRemove={() => remove(i)} valueIsVariable={false} />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          style={{ padding: "8px 14px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = BLUE; e.currentTarget.style.color = BLUE; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}
        >
          + Add Header
        </button>
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

function PayloadPanel({ payload, onChange, onClose }) {
  const { mode, form, raw } = payload;
  const setMode  = (m) => onChange({ ...payload, mode: m });
  const addRow   = () => onChange({ ...payload, form: [...form, { key: "", value: "" }] });
  const removeRow = (i) => onChange({ ...payload, form: form.filter((_, j) => j !== i) });
  const patchRow = (i, field, val) => { const next = [...form]; next[i] = { ...next[i], [field]: val }; onChange({ ...payload, form: next }); };

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Request Payload</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>JSON body payload sent with your webhook request.</div>
        </div>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex" }}><X size={18} /></button>
      </div>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", gap: 8 }}>
        {["form", "raw"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            style={{ padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", background: mode === m ? BLUE : "#F1F5F9", color: mode === m ? "#fff" : "#475569", border: "none" }}
          >
            {m === "form" ? "Form" : "Raw JSON"}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {mode === "form" ? (
          <>
            {form.map((row, i) => (
              <div key={i} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 12, background: "#FAFAFA" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>Request Payload {i + 1}</div>
                <KVRow keyVal={row.key} value={row.value} onKeyChange={(v) => patchRow(i, "key", v)} onValueChange={(v) => patchRow(i, "value", v)} onRemove={() => removeRow(i)} valueIsVariable />
              </div>
            ))}
            <button type="button" onClick={addRow} style={{ padding: "9px 14px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              + Add Payload
            </button>
          </>
        ) : (
          <textarea
            value={raw}
            onChange={(e) => onChange({ ...payload, raw: e.target.value })}
            placeholder={'{\n  "userId": "{{customer.id}}",\n  "event": "cart_abandoned"\n}'}
            rows={12}
            style={{ width: "100%", padding: 10, fontSize: 12, fontFamily: "monospace", border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", boxSizing: "border-box", lineHeight: 1.5 }}
          />
        )}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={onClose} style={{ padding: "9px 24px", background: "#1E3A5F", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Done</button>
      </div>
    </div>
  );
}

const MOCK_TEST_RESPONSE = {
  status: 200,
  latency: 142,
  body: JSON.stringify({ success: true, message: "Webhook received", userId: "CUST_4821" }, null, 2),
};

export default function WebhookRightPanel({ node, updateNodeData, removeNode }) {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const [panel,       setPanel]       = useState(null); // null | "params" | "headers" | "payload"
  const [testVisible, setTestVisible] = useState(false);
  const [testResult,  setTestResult]  = useState(null); // null | "loading" | MOCK_TEST_RESPONSE

  if (!node) return null;

  const data = { ...defaultWebhookNodeData, ...node.data };
  const patch = (p) => updateNodeData(selectedNodeId, p);

  const method     = data.method  ?? "POST";
  const url        = data.url     ?? "";
  const auth       = data.auth    ?? defaultWebhookNodeData.auth;
  const params     = data.params  ?? [];
  const headers    = data.headers ?? [];
  const payload    = data.payload ?? defaultWebhookNodeData.payload;
  const retry      = data.retry   ?? defaultWebhookNodeData.retry;
  const wiredPorts = data.outputConfig?.wiredPorts ?? [];

  const togglePort = (portId) => {
    const next = wiredPorts.includes(portId)
      ? wiredPorts.filter((p) => p !== portId)
      : [...wiredPorts, portId];
    patch({ outputConfig: { ...data.outputConfig, wiredPorts: next } });
  };

  const sendTest = () => {
    setTestVisible(true);
    setTestResult("loading");
    setTimeout(() => setTestResult(MOCK_TEST_RESPONSE), 1200);
  };

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sub-panel overlays */}
      {panel === "params"  && <URLParamsPanel params={params}   onChange={(v) => patch({ params: v })}   onClose={() => setPanel(null)} />}
      {panel === "headers" && <HeadersPanel  headers={headers}  onChange={(v) => patch({ headers: v })}  onClose={() => setPanel(null)} />}
      {panel === "payload" && <PayloadPanel  payload={payload}  onChange={(v) => patch({ payload: v })} onClose={() => setPanel(null)} />}

      {/* Header bar */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Webhook size={14} color="#fff" />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", flex: 1 }}>Webhook</span>
        <button
          type="button"
          onClick={() => removeNode(node.id)}
          title="Delete node"
          style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Node label */}
        <div>
          <Label>Node Label</Label>
          <input
            type="text"
            value={data.label ?? "Webhook"}
            onChange={(e) => patch({ label: e.target.value })}
            style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Method + URL */}
        <div>
          <Label>Request</Label>
          <div style={{ display: "flex", gap: 6 }}>
            <select
              value={method}
              onChange={(e) => patch({ method: e.target.value })}
              style={{ width: 84, padding: "7px 8px", fontSize: 12, fontWeight: 700, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#F8FAFC", color: BLUE, cursor: "pointer" }}
            >
              {WEBHOOK_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
              type="text"
              value={url}
              onChange={(e) => patch({ url: e.target.value })}
              placeholder="https://api.example.com/webhook"
              style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* URL Parameters */}
        <div>
          <Label>URL Parameters</Label>
          <SectionButton label="URL Parameters" count={params.length} onClick={() => setPanel("params")} />
        </div>

        {/* Custom Headers */}
        <div>
          <Label>Custom Headers</Label>
          <SectionButton label="Custom Headers" count={headers.length} onClick={() => setPanel("headers")} />
        </div>

        {/* Authentication */}
        <div>
          <Label>Authentication</Label>
          <select
            value={auth.type}
            onChange={(e) => patch({ auth: { ...auth, type: e.target.value } })}
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer", marginBottom: auth.type !== "none" ? 10 : 0 }}
          >
            {WEBHOOK_AUTH_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>

          {auth.type === "api_key" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={auth.apiKeyName}
                  onChange={(e) => patch({ auth: { ...auth, apiKeyName: e.target.value } })}
                  placeholder="Key name (e.g. X-Api-Key)"
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
                />
                <select
                  value={auth.apiKeyIn}
                  onChange={(e) => patch({ auth: { ...auth, apiKeyIn: e.target.value } })}
                  style={{ width: 80, padding: "7px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                >
                  <option value="header">Header</option>
                  <option value="query">Query</option>
                </select>
              </div>
              <input
                type="password"
                value={auth.apiKeyValue}
                onChange={(e) => patch({ auth: { ...auth, apiKeyValue: e.target.value } })}
                placeholder="Key value"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          {auth.type === "bearer" && (
            <input
              type="password"
              value={auth.bearerToken}
              onChange={(e) => patch({ auth: { ...auth, bearerToken: e.target.value } })}
              placeholder="Bearer token"
              style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          )}

          {auth.type === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                type="text"
                value={auth.basicUser}
                onChange={(e) => patch({ auth: { ...auth, basicUser: e.target.value } })}
                placeholder="Username"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
              <input
                type="password"
                value={auth.basicPass}
                onChange={(e) => patch({ auth: { ...auth, basicPass: e.target.value } })}
                placeholder="Password"
                style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}
        </div>

        {/* Request Payload — hidden for GET */}
        {method !== "GET" && (
          <div>
            <Label>Request Payload</Label>
            <SectionButton
              label="Request Payload"
              count={payload.mode === "form" ? payload.form.length : (payload.raw ? 1 : 0)}
              onClick={() => setPanel("payload")}
            />
          </div>
        )}

        {/* Retry */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: retry.enabled ? 12 : 0 }}>
            <Label>Retry on Failure</Label>
            <Toggle on={retry.enabled} onChange={(v) => patch({ retry: { ...retry, enabled: v } })} />
          </div>
          {retry.enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Max Retries</div>
                  <select
                    value={retry.max}
                    onChange={(e) => patch({ retry: { ...retry, max: Number(e.target.value) } })}
                    style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Strategy</div>
                  <select
                    value={retry.strategy}
                    onChange={(e) => patch({ retry: { ...retry, strategy: e.target.value } })}
                    style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                  >
                    {WEBHOOK_RETRY_STRATEGIES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Initial Delay</div>
                <select
                  value={retry.initialDelay}
                  onChange={(e) => patch({ retry: { ...retry, initialDelay: Number(e.target.value) } })}
                  style={{ width: "100%", padding: "7px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", cursor: "pointer" }}
                >
                  {WEBHOOK_INITIAL_DELAYS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Timeout */}
        <div>
          <Label>Timeout</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="number"
              value={data.timeout_ms ?? 10000}
              onChange={(e) => patch({ timeout_ms: Number(e.target.value) || 10000 })}
              min={1000}
              max={60000}
              step={1000}
              style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
            />
            <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap" }}>ms</span>
          </div>
        </div>

        {/* Output Branches */}
        <div>
          <Label>Output Branches</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {WEBHOOK_OUTPUT_PORTS.map((port) => (
              <div
                key={port.id}
                onClick={() => togglePort(port.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${wiredPorts.includes(port.id) ? port.color : BORDER}`,
                  background: wiredPorts.includes(port.id) ? `${port.color}15` : "#F8FAFC",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: wiredPorts.includes(port.id) ? port.color : "#475569" }}>
                  {port.label}
                </span>
                <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${wiredPorts.includes(port.id) ? port.color : "#CBD5E1"}`, background: wiredPorts.includes(port.id) ? port.color : "transparent" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Test Mode */}
        <div>
          <Label>Test Mode</Label>
          <button
            type="button"
            onClick={sendTest}
            disabled={!url}
            style={{ width: "100%", padding: "9px", border: `1px solid ${url ? BLUE : BORDER}`, borderRadius: 8, background: url ? "#EFF6FF" : "#F8FAFC", color: url ? BLUE : MUTED, fontSize: 12, fontWeight: 600, cursor: url ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <Play size={13} />
            Send Test
          </button>

          {testVisible && (
            <div style={{ marginTop: 10, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>Response</span>
                <button type="button" onClick={() => { setTestVisible(false); setTestResult(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}>
                  <X size={13} />
                </button>
              </div>
              {testResult === "loading" ? (
                <div style={{ padding: 16, textAlign: "center", fontSize: 12, color: MUTED }}>Sending request…</div>
              ) : testResult ? (
                <div style={{ padding: 12 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#ECFDF5", color: "#065F46", fontWeight: 700 }}>{testResult.status} OK</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{testResult.latency}ms</span>
                  </div>
                  <pre style={{ fontSize: 10, background: "#F8FAFC", padding: 10, borderRadius: 6, overflowX: "auto", margin: 0, color: "#1E293B", lineHeight: 1.5 }}>
                    {testResult.body}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx
git commit -m "feat: add WebhookRightPanel with URL params, headers, payload, auth, retry, test mode"
```

---

## Task 4 — Wire `src/` builder files

**Files:**
- Modify: `src/components/flows/builder/Canvas.jsx`
- Modify: `src/components/flows/builder/panels/ConfigTab.jsx`
- Modify: `src/lib/flowMeta.js`
- Modify: `src/components/flows/builder/NodePalette.jsx`

- [ ] **Step 1: Register WebhookNode in `src/Canvas.jsx`**

Add after the existing `import SmartFlowOptimizerNode` import (line 32):
```js
import WebhookNode from "./nodes/WebhookNode";
```

Add to the `nodeTypes` object after `razorpay: RazorpayNode` (line 53):
```js
webhook: WebhookNode,
```

- [ ] **Step 2: Add webhook case to `src/ConfigTab.jsx`**

Add after the last `import` line (after `SmartFlowOptimizerRightPanel` import):
```js
import WebhookRightPanel from "@/components/flows/builder/nodes/WebhookNode/WebhookRightPanel";
```

Add before the `if (node?.type === "sms")` block (around line 408):
```js
  if (node?.type === "webhook") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <WebhookRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }
```

- [ ] **Step 3: Add default data case to `src/lib/flowMeta.js`**

Add after the last node import (after `defaultSFONodeData` import, around line 38):
```js
import { defaultWebhookNodeData } from "@/components/flows/builder/nodes/WebhookNode/data/mockData";
```

Add inside `defaultDataForPaletteItem` before the `case "whatsapp"` block (around line 136):
```js
    case "webhook":
      return { ...defaultWebhookNodeData };
```

- [ ] **Step 4: Fix NodePalette.jsx kind for webhook**

In `src/components/flows/builder/NodePalette.jsx`, find line 79 and change `kind:"action"` to `kind:"webhook"`:

Before:
```js
{ id:"webhook", name:"Webhook", Icon:Webhook, kind:"action", subtype:"webhook" },
```

After:
```js
{ id:"webhook", name:"Webhook", Icon:Webhook, kind:"webhook", subtype:null },
```

- [ ] **Step 5: Commit**

```bash
git add src/components/flows/builder/Canvas.jsx \
        src/components/flows/builder/panels/ConfigTab.jsx \
        src/lib/flowMeta.js \
        src/components/flows/builder/NodePalette.jsx
git commit -m "feat: wire WebhookNode into src/ Canvas, ConfigTab, flowMeta, NodePalette"
```

---

## Task 5 — `app/frontend/src/` node files

**Files:**
- Create: `app/frontend/src/components/flows/builder/nodes/WebhookNode/data/mockData.js`
- Create: `app/frontend/src/components/flows/builder/nodes/WebhookNode/index.jsx`
- Create: `app/frontend/src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx`

- [ ] **Step 1: Create mockData.js**

Identical content to Task 1. Create at path:
`app/frontend/src/components/flows/builder/nodes/WebhookNode/data/mockData.js`

Copy the exact same content from Task 1 Step 1.

- [ ] **Step 2: Create index.jsx (no NodeAnalyticsFooter)**

`app/frontend` does not have `@/components/flows/analytics/`. Create `app/frontend/src/components/flows/builder/nodes/WebhookNode/index.jsx` with the same content as Task 2 Step 1, but with these two changes:

1. Remove the import line:
   ```js
   // REMOVE: import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
   ```

2. Remove the `<NodeAnalyticsFooter>` JSX line at the bottom of the component:
   ```js
   // REMOVE: <NodeAnalyticsFooter type="webhook" analyticsData={analyticsData} />
   ```

3. Remove the `analyticsData` and `cardRadius` lines since they're no longer needed:
   ```js
   // REMOVE: const analyticsData = data?.analyticsData ?? null;
   // REMOVE: const cardRadius    = analyticsData ? "12px 12px 0 0" : 12;
   ```

4. Replace `borderRadius: cardRadius` with `borderRadius: 12` in the root `<div>` style.

- [ ] **Step 3: Create WebhookRightPanel.jsx**

Identical content to Task 3 Step 1. Create at path:
`app/frontend/src/components/flows/builder/nodes/WebhookNode/WebhookRightPanel.jsx`

Copy the exact same content from Task 3 Step 1.

- [ ] **Step 4: Commit**

```bash
git add app/frontend/src/components/flows/builder/nodes/WebhookNode/
git commit -m "feat: add WebhookNode files to app/frontend (no analytics footer)"
```

---

## Task 6 — Wire `app/frontend/src/` builder files

**Files:**
- Modify: `app/frontend/src/components/flows/builder/Canvas.jsx`
- Modify: `app/frontend/src/components/flows/builder/panels/ConfigTab.jsx`
- Modify: `app/frontend/src/lib/flowMeta.js`

- [ ] **Step 1: Register WebhookNode in `app/frontend/src/Canvas.jsx`**

Add after the existing `import GenericNode` import (line 17):
```js
import WebhookNode from "./nodes/WebhookNode";
```

Add to the `nodeTypes` object after `generic: GenericNode` (line 33):
```js
webhook: WebhookNode,
```

- [ ] **Step 2: Add webhook case to `app/frontend/src/ConfigTab.jsx`**

Add after the existing imports (the file has no dedicated panel imports yet, add as first import after the store import):
```js
import WebhookRightPanel from "@/components/flows/builder/nodes/WebhookNode/WebhookRightPanel";
```

In `ConfigTab`, the function currently reads the node from the store and returns `<NodeConfig>`. Add an early-return before the existing `return` statement:

```js
export default function ConfigTab() {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const meta           = useFlowBuilderStore((s) => s.meta);
  const patchMeta      = useFlowBuilderStore((s) => s.patchMeta);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const removeNode     = useFlowBuilderStore((s) => s.removeNode);

  const node = nodes.find((n) => n.id === selectedNodeId) || null;

  // NEW: webhook gets its own full panel
  if (node?.type === "webhook") {
    return (
      <div className="absolute inset-0 overflow-hidden flex flex-col" data-testid="right-config-tab">
        <WebhookRightPanel
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto h-full" data-testid="right-config-tab">
      {node ? (
        <NodeConfig
          node={node}
          updateNodeData={updateNodeData}
          removeNode={removeNode}
        />
      ) : (
        <FlowSettings meta={meta} onPatch={patchMeta} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add default data case to `app/frontend/src/lib/flowMeta.js`**

Add after the existing imports at the top of the file:
```js
import { defaultWebhookNodeData } from "@/components/flows/builder/nodes/WebhookNode/data/mockData";
```

Add inside `defaultDataForPaletteItem` before the `default` case:
```js
    case "webhook":
      return { ...defaultWebhookNodeData };
```

- [ ] **Step 4: Commit**

```bash
git add app/frontend/src/components/flows/builder/Canvas.jsx \
        app/frontend/src/components/flows/builder/panels/ConfigTab.jsx \
        app/frontend/src/lib/flowMeta.js
git commit -m "feat: wire WebhookNode into app/frontend Canvas, ConfigTab, flowMeta"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Multi-method support (GET/POST/PUT/PATCH/DELETE) — Method dropdown in right panel
- ✅ Authentication (API Key, Bearer, Basic Auth) — Auth section with conditional fields
- ✅ Variable picker on value fields — `VariableSelect` component in URL Params and Payload sub-panels
- ✅ Test Mode with response preview — mocked 200 + JSON body after 1.2s
- ✅ Retry logic — toggle + max retries + strategy + initial delay
- ✅ Timeout control — number input (ms)
- ✅ Success/Failure output branches — clickable port toggles + canvas handles
- ✅ URL Parameters sub-panel — matches wireframe exactly
- ✅ Custom Headers sub-panel — matches wireframe exactly
- ✅ Request Payload sub-panel (form + raw JSON) — matches wireframe exactly
- ✅ Canvas card — empty state + configured state with method badge, URL preview, auth/retry chips
- ✅ Both `src/` and `app/frontend/src/` builders wired

**Placeholder scan:** No TBDs. All code is complete in every step.

**Type consistency:**
- `defaultWebhookNodeData` exported from `mockData.js`, imported in `flowMeta.js` and `WebhookRightPanel.jsx` — consistent.
- `WEBHOOK_OUTPUT_PORTS` used in both `index.jsx` and `WebhookRightPanel.jsx` from the same source — consistent.
- `patch()` calls `updateNodeData(selectedNodeId, p)` matching the store's `updateNodeData(nodeId, dataPatch)` signature — consistent.
- `node.type === "webhook"` matches the `kind:"webhook"` set in NodePalette (Canvas uses `item.kind` as the node `type`) — consistent.
