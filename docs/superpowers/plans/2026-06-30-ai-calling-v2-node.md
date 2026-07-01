# AI Calling V2 Node — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `AiCallingV2Node` (kind `aicallingv2`, display name "AI Calling") to both flow builders, replacing the now-hidden original `AiCallingNode`.

**Architecture:** All configuration is per-node, stored in `node.data`. A three-tab right panel (Template / Delivery / Output) provides the full UI. The canvas node card shows a compact summary. Static frontend data arrays are used throughout — no API calls.

**Tech Stack:** React 18, ReactFlow, Zustand (`flowBuilderStore`), Lucide icons, inline styles (no Tailwind in node files — follow existing node pattern).

## Global Constraints

- No external API calls — all data is static sample arrays.
- Follow inline-style pattern (not Tailwind) in node component files, matching `AiCallingNode/index.jsx` and `WhatsAppRightPanel.jsx`.
- Indigo accent color: `#4F46E5`.
- Node type key (used in ReactFlow and store): `aicallingv2`.
- Palette node id (used in NodePalette `CATEGORIES`): `aicallingv2`.
- Changing `agentType` must reset `voiceBuild` to `""` and clear `wiredPorts`.
- Unwired ports in branch mode render dimmed (opacity 0.45), not hidden.
- All port IDs are camelCase slugs.
- Retry attempt: integer, min 1, max 10.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| **Create** | `src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js` | All static arrays + default node data |
| **Create** | `src/components/flows/builder/nodes/AiCallingV2Node/index.jsx` | Canvas renderer (empty + configured + port rows) |
| **Create** | `src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx` | Three-tab right panel (Template / Delivery / Output) |
| **Modify** | `src/components/flows/builder/Canvas.jsx` | Register `aicallingv2` in `nodeTypes` |
| **Modify** | `src/components/flows/builder/NodePalette.jsx` | Add `aicallingv2` entry to Communication category |
| **Modify** | `src/lib/flowMeta.js` | Add `aicallingv2` to `rendererTypeForKind` + `defaultDataForPaletteItem` |
| **Modify** | `src/pages/FlowBuilderV2.jsx` | Add `"aicallingv2"` to `V2_ALLOWED_NODES` |
| **Modify** | `src/components/flows/builder/panels/ConfigTab.jsx` | Route `node.type === "aicallingv2"` to right panel |

---

## Task 1: Static Data (`mockData.js`)

**Files:**
- Create: `src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js`

**Interfaces:**
- Produces: `PROVIDERS`, `PHONE_NUMBERS`, `AGENT_TYPES`, `VOICE_BUILDS_BY_TYPE`, `VOICES`, `RETRY_GAPS`, `COUPON_EXPIRY_OPTIONS`, `OUTPUT_PORTS_BY_TYPE`, `defaultAiCallingV2NodeData`

- [ ] **Step 1: Create the file with all static arrays and default data**

```js
// src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js

export const PROVIDERS = [
  { value: "squadstack", label: "Squadstack" },
];

export const PHONE_NUMBERS = [
  { value: "919999999999", label: "+91 99999 99999" },
  { value: "918888888888", label: "+91 88888 88888" },
];

export const AGENT_TYPES = [
  { value: "oc_ac_c2p",      label: "OC-AC-C2P Stack" },
  { value: "abandoned_cart", label: "Abandoned Cart" },
  { value: "marketing",      label: "Marketing Pitch" },
  { value: "nps",            label: "NPS" },
];

export const VOICE_BUILDS_BY_TYPE = {
  oc_ac_c2p:      ["OC-AC", "OC", "AC", "OC-CTP", "CTP", "CTP2"],
  abandoned_cart: ["Aba1", "aba_fem", "aba"],
  marketing:      ["Payday"],
  nps:            ["Npss"],
};

export const VOICES = [
  { value: "varsha", label: "Varsha (F)", gender: "F" },
  { value: "harish", label: "Harish (M)", gender: "M" },
];

export const RETRY_GAPS = [
  { value: 5,   label: "5 min" },
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 60,  label: "1 hr" },
  { value: 120, label: "2 hrs" },
];

export const COUPON_EXPIRY_OPTIONS = [
  { value: "none", label: "No expiry" },
  { value: "24h",  label: "24 hours" },
  { value: "48h",  label: "48 hours" },
  { value: "72h",  label: "72 hours" },
  { value: "7d",   label: "7 days" },
];

// Each entry: { id: string, label: string, group: "intent"|"connection" }
export const OUTPUT_PORTS_BY_TYPE = {
  oc_ac_c2p: [
    { id: "oc",                label: "OC",                   group: "intent" },
    { id: "orderCancellation", label: "Order Cancellation",   group: "intent" },
    { id: "ac",                label: "AC",                   group: "intent" },
    { id: "acChange",          label: "AC Change",            group: "intent" },
    { id: "acNotInterested",   label: "AC Not Interested",    group: "intent" },
    { id: "ctpInterested",     label: "CTP Interested",       group: "intent" },
    { id: "ctpNotInterested",  label: "CTP Not Interested",   group: "intent" },
    { id: "codInterested",     label: "COD Interested",       group: "intent" },
    { id: "connected",         label: "Connected",            group: "connection" },
    { id: "noResponse",        label: "No Response",          group: "connection" },
    { id: "notConnected",      label: "Not Connected",        group: "connection" },
  ],
  abandoned_cart: [
    { id: "abcInterested",          label: "ABC Interested",              group: "intent" },
    { id: "abcInterestedNoAddress", label: "ABC Interested (No Address)", group: "intent" },
    { id: "abcNotInterested",       label: "ABC Not Interested",          group: "intent" },
    { id: "codEnabled",             label: "COD Enabled",                 group: "intent" },
    { id: "connected",              label: "Connected",                   group: "connection" },
    { id: "noResponse",             label: "No Response",                 group: "connection" },
    { id: "notConnected",           label: "Not Connected",               group: "connection" },
  ],
  marketing: [
    { id: "interested",   label: "Interested",    group: "intent" },
    { id: "cutTheCall",   label: "Cut the Call",  group: "intent" },
    { id: "notConnected", label: "Not Connected", group: "intent" },
  ],
  nps: [
    { id: "interested",   label: "Interested",    group: "intent" },
    { id: "cutTheCall",   label: "Cut the Call",  group: "intent" },
    { id: "notConnected", label: "Not Connected", group: "intent" },
  ],
};

export const defaultAiCallingV2NodeData = {
  label: "AI Calling",
  provider: "squadstack",
  phoneNumber: "",
  agentType: "",
  voiceBuild: "",
  voice: "varsha",
  discount: {
    enabled: false,
    message: "",
    couponCode: "",
    expiry: "none",
  },
  placeCOD: false,
  retryAttempt: 1,
  retryGap: 5,
  utm: {
    enabled: false,
    utm_source: "aicalling",
    utm_medium: "journey",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  },
  outputMode: "next",
  wiredPorts: [],
};
```

- [ ] **Step 2: Verify file is valid by checking no syntax errors**

```bash
node --input-type=module < src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js 2>&1 | head -5
```

Expected: no output (no errors). If errors appear, fix syntax before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js
git commit -m "feat: add AiCallingV2Node static data and default schema"
```

---

## Task 2: Canvas Node Renderer (`index.jsx`)

**Files:**
- Create: `src/components/flows/builder/nodes/AiCallingV2Node/index.jsx`

**Interfaces:**
- Consumes: `defaultAiCallingV2NodeData`, `OUTPUT_PORTS_BY_TYPE`, `AGENT_TYPES`, `VOICES`, `PHONE_NUMBERS` from `./data/mockData`
- Consumes: `Handle`, `Position` from `reactflow`; `useFlowBuilderStore` from `@/store/flowBuilderStore`
- Produces: default export `AiCallingV2Node` — ReactFlow node component with props `{ id, data, selected }`

- [ ] **Step 1: Create the canvas node renderer**

```jsx
// src/components/flows/builder/nodes/AiCallingV2Node/index.jsx
import React from "react";
import { Handle, Position } from "reactflow";
import { PhoneCall, Phone, Target, Mic } from "lucide-react";
import { OUTPUT_PORTS_BY_TYPE, AGENT_TYPES, VOICES, PHONE_NUMBERS } from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// Defined at module scope so ReactFlow never remounts handles on re-render
function PortRow({ portId, label, wired, isFirst }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
      opacity: wired ? 1 : 0.45,
      borderTop: isFirst ? `1px solid ${BORDER}` : "none",
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
        background: wired ? INDIGO : "transparent",
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

function InfoRow({ Icon, text }) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px" }}>
      <Icon size={11} color={MUTED} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {text}
      </span>
    </div>
  );
}

export default function AiCallingV2Node({ id, data, selected }) {
  const agentType   = data?.agentType   ?? "";
  const voiceBuild  = data?.voiceBuild  ?? "";
  const phoneNumber = data?.phoneNumber ?? "";
  const voice       = data?.voice       ?? "varsha";
  const outputMode  = data?.outputMode  ?? "next";
  const wiredPorts  = data?.wiredPorts  ?? [];
  const label       = data?.label       ?? "AI Calling";

  const isEmpty = !agentType;

  const agentTypeLabel  = AGENT_TYPES.find((t) => t.value === agentType)?.label ?? "";
  const voiceLabel      = VOICES.find((v) => v.value === voice)?.label ?? "";
  const phoneLabel      = PHONE_NUMBERS.find((p) => p.value === phoneNumber)?.label ?? phoneNumber;

  const ports = agentType ? (OUTPUT_PORTS_BY_TYPE[agentType] ?? []) : [];
  const intentPorts     = ports.filter((p) => p.group === "intent");
  const connectionPorts = ports.filter((p) => p.group === "connection");

  const borderColor = isEmpty ? "rgba(79,70,229,0.4)" : INDIGO;

  return (
    <div
      data-testid={`rf-aicallingv2-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(79,70,229,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 280,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: INDIGO, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        /* ── Empty state ── */
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: INDIGO,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PhoneCall size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>AI Calling</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <PhoneCall size={13} color="#fff" />
            </div>
            <span style={{
              flex: 1, fontSize: 11, fontWeight: 700, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </div>

          {/* ── Info rows ── */}
          <div style={{ borderBottom: `1px solid ${BORDER}`, paddingTop: 4, paddingBottom: 4 }}>
            <InfoRow Icon={Phone}  text={phoneLabel ? `Squadstack · ${phoneLabel}` : "Squadstack"} />
            <InfoRow Icon={Target} text={[agentTypeLabel, voiceBuild].filter(Boolean).join(" · ")} />
            <InfoRow Icon={Mic}    text={voiceLabel} />
          </div>

          {/* ── Output ports (branch mode only) ── */}
          {outputMode === "branch" && ports.length > 0 && (
            <div style={{ paddingBottom: 4 }}>
              {intentPorts.map((port, i) => (
                <PortRow
                  key={port.id}
                  portId={port.id}
                  label={port.label}
                  wired={wiredPorts.includes(port.id)}
                  isFirst={i === 0}
                />
              ))}
              {connectionPorts.length > 0 && (
                <>
                  <div style={{ height: 1, background: BORDER, margin: "2px 12px" }} />
                  {connectionPorts.map((port) => (
                    <PortRow
                      key={port.id}
                      portId={port.id}
                      label={port.label}
                      wired={wiredPorts.includes(port.id)}
                      isFirst={false}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Single bottom source handle (next mode) */}
      {(outputMode === "next" || !agentType) && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: INDIGO, width: 10, height: 10, bottom: -5 }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flows/builder/nodes/AiCallingV2Node/index.jsx
git commit -m "feat: add AiCallingV2Node canvas renderer"
```

---

## Task 3: Right Panel — Shared helpers + Template Tab

**Files:**
- Create: `src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx` (partial — Template tab only, full file scaffold)

**Interfaces:**
- Consumes: `PROVIDERS`, `PHONE_NUMBERS`, `AGENT_TYPES`, `VOICE_BUILDS_BY_TYPE`, `VOICES`, `COUPON_EXPIRY_OPTIONS` from `./data/mockData`
- Consumes: `useFlowBuilderStore` from `@/store/flowBuilderStore`
- Produces: default export `AiCallingV2RightPanel` (no props — reads from store)

- [ ] **Step 1: Create the right panel file with shared helpers and Template tab**

```jsx
// src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx
import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhoneCall, Play, Square } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  PROVIDERS,
  PHONE_NUMBERS,
  AGENT_TYPES,
  VOICE_BUILDS_BY_TYPE,
  VOICES,
  COUPON_EXPIRY_OPTIONS,
  RETRY_GAPS,
  OUTPUT_PORTS_BY_TYPE,
} from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Shared UI primitives ─────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: MUTED,
      textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function FieldLabel({ children, required, optional }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{children}</span>
      {required && (
        <span style={{ fontSize: 10, fontWeight: 600, color: "#EF4444", border: "1px solid #FCA5A5", borderRadius: 4, padding: "1px 6px" }}>
          Required
        </span>
      )}
      {optional && (
        <span style={{ fontSize: 10, fontWeight: 600, color: "#16A34A", border: "1px solid #86EFAC", borderRadius: 4, padding: "1px 6px" }}>
          Optional
        </span>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ position: "relative" }}>
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
            border: `1px solid ${(!value && required) ? "#FCA5A5" : BORDER}`,
            borderRadius: 8, outline: "none", background: "#fff",
            appearance: "none", cursor: "pointer",
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
      </div>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 38, height: 22, borderRadius: 11, flexShrink: 0,
        background: on ? INDIGO : "#E2E8F0",
        cursor: "pointer", display: "flex", alignItems: "center", padding: 2,
        transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        transition: "transform 0.2s",
        transform: on ? "translateX(16px)" : "translateX(0)",
      }} />
    </div>
  );
}

// ── Template Tab ─────────────────────────────────────────────────

function TemplateTab({ data, upd }) {
  const [playingVoice, setPlayingVoice] = useState(null);

  const voiceBuilds = data.agentType
    ? (VOICE_BUILDS_BY_TYPE[data.agentType] ?? []).map((v) => ({ value: v, label: v }))
    : [];

  function handleAgentTypeChange(val) {
    upd({ agentType: val, voiceBuild: "", wiredPorts: [] });
  }

  function handleVoicePreview(voiceValue) {
    if (playingVoice === voiceValue) {
      setPlayingVoice(null);
      return;
    }
    setPlayingVoice(voiceValue);
    // Simulate preview — reset after 3 seconds
    setTimeout(() => setPlayingVoice(null), 3000);
  }

  const showCouponFields = data.agentType === "abandoned_cart" || data.agentType === "marketing";
  const showPlaceCOD     = data.agentType === "abandoned_cart";

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Provider */}
      <SelectField
        label="Provider"
        value={data.provider}
        onChange={(v) => upd({ provider: v })}
        options={PROVIDERS}
      />

      {/* Phone Number */}
      <SelectField
        label="Phone Number"
        value={data.phoneNumber}
        onChange={(v) => upd({ phoneNumber: v })}
        options={PHONE_NUMBERS}
        placeholder="Select phone number"
        required
      />

      {/* Type */}
      <SelectField
        label="Type"
        value={data.agentType}
        onChange={handleAgentTypeChange}
        options={AGENT_TYPES}
        placeholder="Select agent type"
        required
      />

      {/* Squadstack Voice Build */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Squadstack Voice Build</SectionLabel>
        <div style={{ position: "relative" }}>
          <select
            value={data.voiceBuild || ""}
            onChange={(e) => upd({ voiceBuild: e.target.value })}
            disabled={!data.agentType}
            style={{
              width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
              border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
              background: data.agentType ? "#fff" : "#F8FAFC",
              appearance: "none", cursor: data.agentType ? "pointer" : "not-allowed",
              color: data.agentType ? "#0F172A" : MUTED,
            }}
          >
            <option value="">{data.agentType ? "Select voice build" : "Select type first"}</option>
            {voiceBuilds.map((vb) => (
              <option key={vb.value} value={vb.value}>{vb.label}</option>
            ))}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
        </div>
      </div>

      {/* Voice with preview */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Voice</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {VOICES.map((v) => {
            const isSelected = data.voice === v.value;
            const isPlaying  = playingVoice === v.value;
            return (
              <div
                key={v.value}
                onClick={() => upd({ voice: v.value })}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px",
                  border: `1.5px solid ${isSelected ? INDIGO : BORDER}`,
                  borderRadius: 8, cursor: "pointer",
                  background: isSelected ? "#EEF2FF" : "#fff",
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: isSelected ? INDIGO : "#F1F5F9",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, color: isSelected ? "#fff" : MUTED,
                }}>
                  {v.gender}
                </div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: isSelected ? 600 : 400, color: "#0F172A" }}>
                  {v.label}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleVoicePreview(v.value); }}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    border: `1px solid ${isPlaying ? INDIGO : BORDER}`,
                    background: isPlaying ? INDIGO : "#F8FAFC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {isPlaying
                    ? <Square size={10} color="#fff" fill="#fff" />
                    : <Play  size={10} color={MUTED} />
                  }
                </button>
              </div>
            );
          })}
        </div>
        {playingVoice && (
          <p style={{ fontSize: 10, color: INDIGO, marginTop: 6, fontStyle: "italic" }}>
            Playing preview for {VOICES.find((v) => v.value === playingVoice)?.label}…
          </p>
        )}
      </div>

      {/* AI Actions */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>AI Actions</SectionLabel>

        {/* Offer a prepaid discount */}
        <div style={{
          border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 10,
        }}>
          {/* Toggle header */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "12px", background: "#F8FAFC",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                Offer a prepaid discount
              </div>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Before accepting COD, the AI nudges the shopper to pay online with a discount. Helps shift COD orders to prepaid.
              </p>
            </div>
            <Toggle
              on={!!data.discount?.enabled}
              onChange={(v) => upd({ discount: { ...data.discount, enabled: v } })}
            />
          </div>

          {data.discount?.enabled && (
            <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Discount message */}
              <div>
                <FieldLabel required>Discount message</FieldLabel>
                <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                  The AI speaks this line when offering the discount. Keep it short and specific.
                </p>
                <textarea
                  value={data.discount?.message ?? ""}
                  onChange={(e) => upd({ discount: { ...data.discount, message: e.target.value } })}
                  placeholder="Pay online now and get 5% off instantly"
                  rows={2}
                  style={{
                    width: "100%", padding: "8px 10px", fontSize: 13,
                    border: `1px solid ${!data.discount?.message ? "#FCA5A5" : BORDER}`,
                    borderRadius: 8, outline: "none", resize: "none",
                    fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Discount coupon code — abandoned_cart + marketing only */}
              {showCouponFields && (
                <div>
                  <FieldLabel optional>Discount coupon code</FieldLabel>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                    If you have a coupon code, the AI will read it out on the call so the shopper can apply it at checkout.
                  </p>
                  <input
                    type="text"
                    value={data.discount?.couponCode ?? ""}
                    onChange={(e) => upd({ discount: { ...data.discount, couponCode: e.target.value } })}
                    placeholder="E.G. PREPAY5"
                    style={{
                      width: "100%", padding: "8px 10px", fontSize: 13,
                      border: `1px solid ${BORDER}`, borderRadius: 8,
                      outline: "none", fontFamily: "monospace", boxSizing: "border-box",
                    }}
                  />
                  {data.discount?.couponCode && (
                    <p style={{ fontSize: 11, color: "#64748B", marginTop: 6, fontStyle: "italic" }}>
                      The AI will say something like: <em style={{ color: INDIGO }}>"Use code {data.discount.couponCode} at checkout to get 5% off when you pay online."</em>
                    </p>
                  )}
                </div>
              )}

              {/* Coupon expiry — abandoned_cart + marketing only */}
              {showCouponFields && (
                <div>
                  <FieldLabel optional>Coupon expiry</FieldLabel>
                  <p style={{ fontSize: 11, color: "#64748B", margin: "0 0 6px" }}>
                    Add urgency. The AI will mention the expiry if set.
                  </p>
                  <div style={{ position: "relative", display: "inline-block", width: "auto", minWidth: 160 }}>
                    <select
                      value={data.discount?.expiry ?? "none"}
                      onChange={(e) => upd({ discount: { ...data.discount, expiry: e.target.value } })}
                      style={{
                        padding: "7px 32px 7px 12px", fontSize: 13,
                        border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
                        background: "#fff", appearance: "none", cursor: "pointer",
                      }}
                    >
                      {COUPON_EXPIRY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Place COD — abandoned_cart only */}
        {showPlaceCOD && (
          <div style={{
            border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              padding: "12px", background: "#F8FAFC",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                  Place COD
                </div>
                <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                  AI will place the order as Cash on Delivery if the shopper agrees.
                </p>
              </div>
              <Toggle
                on={!!data.placeCOD}
                onChange={(v) => upd({ placeCOD: v })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

*(The file is incomplete here — Delivery and Output tabs are added in Tasks 4 and 5. Do not commit yet.)*

---

## Task 4: Delivery Tab

**Files:**
- Modify: `src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx` (add `DeliveryTab` component below `TemplateTab`)

**Interfaces:**
- Consumes: `RETRY_GAPS` from `./data/mockData`
- UTM field keys: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

- [ ] **Step 1: Add `DeliveryTab` function to the right panel file, directly after `TemplateTab`**

```jsx
// Add after TemplateTab, before the export

function DeliveryTab({ data, upd }) {
  const utm = data.utm ?? {};

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 0 }}>

      {/* Retry */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Retry</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          {/* Attempts */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Attempts</div>
            <input
              type="number"
              min={1}
              max={10}
              value={data.retryAttempt ?? 1}
              onChange={(e) => {
                const val = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
                upd({ retryAttempt: val });
              }}
              style={{
                width: "100%", padding: "8px 10px", fontSize: 13,
                border: `1px solid ${BORDER}`, borderRadius: 8,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          {/* Gap */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Gap between retries</div>
            <div style={{ position: "relative" }}>
              <select
                value={data.retryGap ?? 5}
                onChange={(e) => upd({ retryGap: Number(e.target.value) })}
                style={{
                  width: "100%", padding: "8px 28px 8px 10px", fontSize: 13,
                  border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
                  background: "#fff", appearance: "none", cursor: "pointer",
                }}
              >
                {RETRY_GAPS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 10, color: MUTED }}>▼</span>
            </div>
          </div>
        </div>
      </div>

      {/* UTM Parameters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <SectionLabel>UTM Parameters</SectionLabel>
          <Toggle
            on={!!utm.enabled}
            onChange={(v) => upd({ utm: { ...utm, enabled: v } })}
          />
        </div>
        {utm.enabled && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            {[
              ["utm_source",   "Source",   "aicalling"],
              ["utm_medium",   "Medium",   "journey"],
              ["utm_campaign", "Campaign", ""],
              ["utm_content",  "Content",  ""],
              ["utm_term",     "Term",     ""],
            ].map(([key, label, placeholder], i, arr) => (
              <div
                key={key}
                style={{
                  display: "flex", alignItems: "center",
                  borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <span style={{
                  fontSize: 11, color: "#64748B", padding: "8px 10px", width: 84,
                  flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`,
                  fontFamily: "monospace",
                }}>
                  {label}
                </span>
                <input
                  type="text"
                  value={utm[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => upd({ utm: { ...utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "8px 10px", fontSize: 12, border: "none", outline: "none" }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

*(Still do not commit — Output tab comes next.)*

---

## Task 5: Output Tab + Full Panel Assembly + Commit

**Files:**
- Modify: `src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx` (add `OutputTab` + main export)

**Interfaces:**
- Consumes: `OUTPUT_PORTS_BY_TYPE` from `./data/mockData`
- Produces: default export `AiCallingV2RightPanel` (no props)

- [ ] **Step 1: Add `OutputTab` and the main exported component after `DeliveryTab`**

```jsx
// Add after DeliveryTab

function OutputTab({ data, upd }) {
  const ports    = data.agentType ? (OUTPUT_PORTS_BY_TYPE[data.agentType] ?? []) : [];
  const wiredPorts = data.wiredPorts ?? [];

  const intentPorts     = ports.filter((p) => p.group === "intent");
  const connectionPorts = ports.filter((p) => p.group === "connection");

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Output mode selector */}
      <div>
        <SectionLabel>Output Mode</SectionLabel>
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[
            { value: "next",   label: "Next Step" },
            { value: "branch", label: "Branch Output" },
          ].map((opt) => {
            const isActive = (data.outputMode ?? "next") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => upd({ outputMode: opt.value })}
                style={{
                  flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                  border: "none", cursor: "pointer",
                  background: isActive ? INDIGO : "#fff",
                  color: isActive ? "#fff" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Next step description */}
      {(data.outputMode ?? "next") === "next" && (
        <p style={{ fontSize: 12, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
          Flow continues to the next connected node after the call completes.
        </p>
      )}

      {/* Branch output — port list */}
      {data.outputMode === "branch" && (
        <div>
          {!data.agentType ? (
            <p style={{ fontSize: 12, color: MUTED, fontStyle: "italic" }}>
              Select a Type in the Template tab to see available output ports.
            </p>
          ) : (
            <>
              <SectionLabel>Output Ports</SectionLabel>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                {intentPorts.map((port, i) => {
                  const wired = wiredPorts.includes(port.id);
                  return (
                    <div
                      key={port.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "9px 12px",
                        borderBottom: i < intentPorts.length - 1 ? `1px solid ${BORDER}` : "none",
                        opacity: wired ? 1 : 0.5,
                      }}
                    >
                      <div style={{
                        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
                        background: wired ? INDIGO : "transparent",
                      }} />
                      <span style={{ fontSize: 12, color: "#0F172A" }}>{port.label}</span>
                      {wired && (
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "#16A34A", fontWeight: 500 }}>Connected</span>
                      )}
                    </div>
                  );
                })}

                {connectionPorts.length > 0 && (
                  <>
                    <div style={{ height: 1, background: BORDER }} />
                    {connectionPorts.map((port) => {
                      const wired = wiredPorts.includes(port.id);
                      return (
                        <div
                          key={port.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "9px 12px",
                            borderBottom: `1px solid ${BORDER}`,
                            opacity: wired ? 1 : 0.5,
                          }}
                        >
                          <div style={{
                            width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                            border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
                            background: wired ? INDIGO : "transparent",
                          }} />
                          <span style={{ fontSize: 12, color: "#0F172A" }}>{port.label}</span>
                          {wired && (
                            <span style={{ marginLeft: "auto", fontSize: 10, color: "#16A34A", fontWeight: 500 }}>Connected</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
                Dimmed ports are not yet connected. Wire them on the canvas to activate.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────

export default function AiCallingV2RightPanel() {
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const updateNodeData = useFlowBuilderStore((s) => s.updateNodeData);

  const node = nodes.find((n) => n.id === selectedNodeId);
  const data = node?.data ?? {};
  const upd  = (patch) => updateNodeData(selectedNodeId, patch);

  if (!node) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <PhoneCall size={15} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>AI Calling</div>
          <div style={{ fontSize: 10, color: MUTED }}>Squadstack voice agent</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="template" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <TabsList style={{ flexShrink: 0, borderRadius: 0, borderBottom: `1px solid ${BORDER}`, background: "#F8FAFC", padding: "4px 12px 0", justifyContent: "flex-start" }}>
          <TabsTrigger value="template">Template</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="template" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <TemplateTab data={data} upd={upd} />
        </TabsContent>
        <TabsContent value="delivery" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <DeliveryTab data={data} upd={upd} />
        </TabsContent>
        <TabsContent value="output" style={{ flex: 1, overflowY: "auto", margin: 0 }}>
          <OutputTab data={data} upd={upd} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Commit the complete right panel**

```bash
git add src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx
git commit -m "feat: add AiCallingV2Node right panel (Template/Delivery/Output tabs)"
```

---

## Task 6: Wire Up All Registration Points

**Files:**
- Modify: `src/components/flows/builder/Canvas.jsx`
- Modify: `src/components/flows/builder/NodePalette.jsx`
- Modify: `src/lib/flowMeta.js`
- Modify: `src/pages/FlowBuilderV2.jsx`
- Modify: `src/components/flows/builder/panels/ConfigTab.jsx`

**Interfaces:**
- Consumes: `AiCallingV2Node` default export from `./nodes/AiCallingV2Node`
- Consumes: `AiCallingV2RightPanel` default export from `@/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel`
- Consumes: `defaultAiCallingV2NodeData` from `@/components/flows/builder/nodes/AiCallingV2Node/data/mockData`

- [ ] **Step 1: Register node type in `Canvas.jsx`**

In `src/components/flows/builder/Canvas.jsx`, add the import after the existing `AiCallingNode` import:

```js
import AiCallingV2Node from "./nodes/AiCallingV2Node";
```

Then inside the `nodeTypes` object, add after the `aicalling` line:

```js
aicallingv2: AiCallingV2Node,
```

- [ ] **Step 2: Add node to `NodePalette.jsx` Communication category**

In `src/components/flows/builder/NodePalette.jsx`, in the `CATEGORIES` array, find the `communication` group's `nodes` array. Add after the `aicalling` entry (which has `hidden: true`):

```js
{ id: "aicallingv2", name: "AI Calling", Icon: PhoneCall, kind: "aicallingv2", subtype: null },
```

The `PhoneCall` icon is already imported in that file.

- [ ] **Step 3: Update `flowMeta.js`**

In `src/lib/flowMeta.js`:

Add this import at the top (after existing imports):
```js
import { defaultAiCallingV2NodeData } from "@/components/flows/builder/nodes/AiCallingV2Node/data/mockData";
```

In `rendererTypeForKind`, add before the `return "logic"` fallback:
```js
if (kind === "aicallingv2") return "aicallingv2";
```

In `defaultDataForPaletteItem`, add in the `switch` before the `default` case:
```js
case "aicallingv2":
  return { ...defaultAiCallingV2NodeData };
```

- [ ] **Step 4: Add to `V2_ALLOWED_NODES` in `FlowBuilderV2.jsx`**

In `src/pages/FlowBuilderV2.jsx`, find the `V2_ALLOWED_NODES` array and add `"aicallingv2"` to the Communication comment line:

```js
"whatsapp", "email", "rcs", "sms", "webpush", "onsite", "inapp", "aichatbot", "aicallingv2",
```

- [ ] **Step 5: Add routing in `ConfigTab.jsx`**

In `src/components/flows/builder/panels/ConfigTab.jsx`, add the import after the existing `AiCallingRightPanel` import:

```js
import AiCallingV2RightPanel from "@/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel";
```

Then add this block after the `if (node?.type === "aicalling")` block:

```jsx
if (node?.type === "aicallingv2") {
  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col">
      <AiCallingV2RightPanel />
    </div>
  );
}
```

- [ ] **Step 6: Commit all wiring changes**

```bash
git add src/components/flows/builder/Canvas.jsx \
        src/components/flows/builder/NodePalette.jsx \
        src/lib/flowMeta.js \
        src/pages/FlowBuilderV2.jsx \
        src/components/flows/builder/panels/ConfigTab.jsx
git commit -m "feat: wire AiCallingV2Node into both flow builders"
```

---

## Task 7: Browser Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: dev server starts without errors on localhost (check console for port).

- [ ] **Step 2: Verify node appears in v1 builder palette**

Open the v1 flow builder. In the Communication category of the left palette, confirm:
- "AI Calling" appears once (the new v2 node — `aicallingv2`)
- The old "AI Calling" entry is NOT visible (hidden flag)

- [ ] **Step 3: Verify node appears in v2 builder palette**

Open the v2 flow builder. Confirm "AI Calling" appears in the Communication palette category.

- [ ] **Step 4: Drag node onto canvas — empty state**

Drag the "AI Calling" node onto the canvas. Confirm:
- Canvas card shows dashed indigo border, PhoneCall icon, "AI Calling" label, "Click to configure" hint
- Single bottom output handle visible
- Right panel opens with Template / Delivery / Output tabs

- [ ] **Step 5: Configure Template tab**

In the right panel Template tab:
- Select Provider: "Squadstack" (pre-selected)
- Select Phone Number: one of the two options
- Select Type: "Abandoned Cart" — confirm Voice Build dropdown updates to [Aba1, aba_fem, aba]
- Select a Voice Build
- Click a Voice play button — confirm it switches to stop icon and shows "Playing preview…" text, resets after ~3 seconds
- Enable "Offer a prepaid discount" toggle — confirm Discount message, Coupon code, Coupon expiry fields appear
- Confirm "Place COD" toggle appears (Abandoned Cart only)
- Change Type to "OC-AC-C2P Stack" — confirm Voice Build resets to empty, Place COD disappears, Coupon fields disappear

- [ ] **Step 6: Verify canvas card updates**

After configuring Type and Voice Build, confirm the canvas card transitions from empty state to configured state showing provider, type · voice build, and voice rows.

- [ ] **Step 7: Test Delivery tab**

Switch to Delivery tab:
- Set Attempt to 3, Gap to "15 min"
- Enable UTM toggle — confirm 5 UTM rows appear (Source, Medium, Campaign, Content, Term)
- Enter values in UTM fields

- [ ] **Step 8: Test Output tab — Next Step mode**

Switch to Output tab. Confirm "Next Step" pill is active and description text is visible. Canvas node shows single bottom handle.

- [ ] **Step 9: Test Output tab — Branch Output mode**

Click "Branch Output". Confirm port list appears for the selected agent type. Ports with no edges are dimmed. On the canvas node, port rows replace the bottom handle.

- [ ] **Step 10: Commit verification note**

```bash
git commit --allow-empty -m "chore: verify AiCallingV2Node in browser — all paths confirmed"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Provider dropdown (Squadstack)
- ✅ Phone number dropdown (2 sample numbers, formatted)
- ✅ Agent Type dropdown (4 options)
- ✅ Squadstack Voice Build (cascades from Type, resets on Type change)
- ✅ Voice with play-button preview
- ✅ Offer a prepaid discount: toggle, message (required), coupon code (optional, abandoned_cart+marketing), expiry dropdown (optional, abandoned_cart+marketing)
- ✅ Place COD toggle (abandoned_cart only)
- ✅ Retry Attempt (1–10 integer) + Retry Gap dropdown
- ✅ UTM parameters (same format as WhatsApp node)
- ✅ Output mode: Next Step (single handle) vs Branch Output (type-specific port rows)
- ✅ Output ports per type with intent/connection divider
- ✅ Unwired ports dimmed (opacity 0.45)
- ✅ Canvas node: empty state + configured state (header, info rows, port rows in branch mode)
- ✅ Hidden in both builders: old `aicalling` node
- ✅ New node visible in both builders: `aicallingv2`
- ✅ All data is static frontend arrays

**Placeholder scan:** No TBD, TODO, or incomplete steps found.

**Type consistency:** `defaultAiCallingV2NodeData`, `OUTPUT_PORTS_BY_TYPE`, `VOICE_BUILDS_BY_TYPE` defined in Task 1 and consumed by name consistently in Tasks 2, 3, 4, 5, 6.
