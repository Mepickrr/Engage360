# AI Calling V2 Node — Design Spec

**Date:** 2026-06-30
**Status:** Approved

---

## Overview

Add a new `AiCallingV2Node` to both the v1 and v2 flow builders. This node replaces the original `AiCallingNode` (which is hidden). It integrates with SquaredStack for AI voice call configuration — the seller selects a provider, phone number, agent type, voice build, and AI actions. All configuration is per-node, in a three-tab right panel (Template / Delivery / Output). No global wizard.

---

## Node Identity

| Property | Value |
|---|---|
| Kind / type key | `aicallingv2` |
| Palette display name | `AI Calling` |
| Palette category | Communication |
| Icon | `PhoneCall` (lucide) |
| Color | `#4F46E5` (indigo — same family as old node) |
| Canvas width | 280px |

---

## Data Schema (per-node, stored in `node.data`)

```js
{
  label: "AI Calling",
  provider: "squadstack",
  phoneNumber: "",
  agentType: "",       // "oc_ac_c2p" | "abandoned_cart" | "marketing" | "nps"
  voiceBuild: "",      // filtered list based on agentType
  voice: "varsha",     // "varsha" | "harish"

  // AI Actions
  discount: {
    enabled: false,
    message: "",       // required when enabled
    couponCode: "",    // optional; shown for abandoned_cart + marketing only
    expiry: "none",    // shown for abandoned_cart + marketing only
  },
  placeCOD: false,     // toggle; shown for abandoned_cart only

  // Delivery
  retryAttempt: 1,
  retryGap: 5,         // minutes
  utm: {
    enabled: false,
    utm_source: "aicalling",
    utm_medium: "journey",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  },

  // Output
  outputMode: "next",  // "next" | "branch"
  wiredPorts: [],      // array of port ids connected to edges
}
```

---

## Sample Data Arrays (frontend static)

### Providers
```js
[{ value: "squadstack", label: "Squadstack" }]
```

### Phone Numbers
```js
[
  { value: "919999999999", label: "+91 99999 99999" },
  { value: "918888888888", label: "+91 88888 88888" },
]
```

### Agent Types
```js
[
  { value: "oc_ac_c2p",      label: "OC-AC-C2P Stack" },
  { value: "abandoned_cart", label: "Abandoned Cart" },
  { value: "marketing",      label: "Marketing Pitch" },
  { value: "nps",            label: "NPS" },
]
```

### Voice Builds (keyed by agentType)
```js
{
  oc_ac_c2p:      ["OC-AC", "OC", "AC", "OC-CTP", "CTP", "CTP2"],
  abandoned_cart: ["Aba1", "aba_fem", "aba"],
  marketing:      ["Payday"],
  nps:            ["Npss"],
}
```

### Voices
```js
[
  { value: "varsha", label: "Varsha (F)", gender: "F" },
  { value: "harish", label: "Harish (M)", gender: "M" },
]
```

### Retry Gaps
```js
[
  { value: 5,   label: "5 min" },
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 60,  label: "1 hr" },
  { value: 120, label: "2 hrs" },
]
```

### Coupon Expiry Options
```js
[
  { value: "none", label: "No expiry" },
  { value: "24h",  label: "24 hours" },
  { value: "48h",  label: "48 hours" },
  { value: "72h",  label: "72 hours" },
  { value: "7d",   label: "7 days" },
]
```

---

## Output Ports by Agent Type

Ports are split into two visual groups: **Intent ports** (top) and **Connection status ports** (bottom, always: Connected / No Response / Not Connected), separated by a thin divider.

### OC-AC-C2P Stack
```
OC
Order Cancellation
AC
AC Change
AC Not Interested
CTP Interested
CTP Not Interested
COD Interested
── divider ──
Connected
No Response
Not Connected
```

### Abandoned Cart
```
ABC Interested
ABC Interested (No Address)
ABC Not Interested
COD Enabled
── divider ──
Connected
No Response
Not Connected
```

### Marketing Pitch
```
Interested
Cut the Call
Not Connected
```

### NPS
```
Interested
Cut the Call
Not Connected
```

Port IDs are camelCase slugs of the labels, e.g. `oc`, `orderCancellation`, `connected`, `abcInterested`, etc.

---

## Right Panel — Template Tab

Fields rendered top-to-bottom:

1. **Provider** — dropdown, required. Single option: Squadstack.
2. **Phone Number** — dropdown, required. Formatted as `+91 XXXXX XXXXX`.
3. **Type** — dropdown, required. Drives cascading reset of voiceBuild when changed.
4. **Squadstack Voice Build** — dropdown, required. Options filtered by selected Type. Resets to `""` when Type changes.
5. **Voice** — dropdown with inline play-button per option. Clicking play shows a visual "playing" state (button swaps to stop icon) and plays a short placeholder audio clip. Same placeholder audio for both voices (static, no API call needed now).
6. **AI Actions** — section header, then:
   - **Offer a prepaid discount** — card with toggle in header row, title, and description. When toggle is ON, reveals three sub-fields:
     - **Discount message** — textarea, `Required` badge, placeholder: "Pay online now and get 5% off instantly"
     - **Discount coupon code** — text input, `Optional` badge, placeholder: "E.G. PREPAY5". Helper text: *The AI will say something like: "Use code PREPAY5 at checkout to get 5% off when you pay online."* Shown only for `abandoned_cart` and `marketing`.
     - **Coupon expiry** — dropdown (`No expiry` default), `Optional` badge. Shown only for `abandoned_cart` and `marketing`.
   - **Place COD** — simple toggle row with title + description. Shown only when `agentType === "abandoned_cart"`.

---

## Right Panel — Delivery Tab

1. **Retry** — section header, then two inline fields side-by-side:
   - **Attempts** — number input, min 1, max 10, integer only
   - **Gap** — dropdown of [5 min, 15 min, 30 min, 1 hr, 2 hrs]
2. **UTM Parameters** — toggle to expand. Collapsed by default. When expanded: same inline-label table format as WhatsApp node — Source / Medium / Campaign / Content / Term.

---

## Right Panel — Output Tab

- **Output mode** pill toggle: `Next Step` | `Branch Output`
- **Next Step**: single bottom output handle on canvas node; output tab shows a short description ("Flow continues to the next connected node").
- **Branch Output**: type-specific port list rendered as port rows with dimmed style for unwired ports. Port rows also appear on the canvas node card in this mode.

---

## Canvas Node Card

**Empty state** (no agentType selected):
- Dashed indigo border, centered PhoneCall icon in filled circle, label "AI Calling", hint "Click to configure"

**Configured state:**
- Indigo gradient header: PhoneCall icon + label
- Info row 1: phone icon + `{provider display} · {formatted phone number}`
- Info row 2: target icon + `{agentType label} · {voiceBuild}`
- Info row 3: mic icon + `{voice label}`
- If `outputMode === "branch"`: port rows section below (same PortRow component, unwired ports dimmed)
- Input handle top-center, single source handle bottom-center (next mode) or per-port handles (branch mode)

---

## AI Action Eligibility Matrix

| Action | OC-AC-C2P Stack | Abandoned Cart | Marketing Pitch | NPS |
|---|---|---|---|---|
| Offer a prepaid discount (toggle + message) | ✓ | ✓ | ✓ | ✓ |
| Discount coupon code | — | ✓ | ✓ | — |
| Coupon expiry | — | ✓ | ✓ | — |
| Place COD | — | ✓ | — | — |

---

## Files

### New files
| File | Purpose |
|---|---|
| `src/components/flows/builder/nodes/AiCallingV2Node/data/mockData.js` | All static sample arrays and output port definitions |
| `src/components/flows/builder/nodes/AiCallingV2Node/index.jsx` | Canvas node renderer |
| `src/components/flows/builder/nodes/AiCallingV2Node/AiCallingV2RightPanel.jsx` | Three-tab right panel |

### Updated files
| File | Change |
|---|---|
| `src/components/flows/builder/Canvas.jsx` | Add `aicallingv2: AiCallingV2Node` to `nodeTypes` |
| `src/components/flows/builder/NodePalette.jsx` | Add `{ id: "aicallingv2", name: "AI Calling", ... }` to Communication category |
| `src/lib/flowMeta.js` | Add `aicallingv2` to `rendererTypeForKind` and `defaultDataForPaletteItem` |
| `src/pages/FlowBuilderV2.jsx` | Add `"aicallingv2"` to `V2_ALLOWED_NODES` |
| `src/components/flows/builder/panels/ConfigTab.jsx` | Add `if (node?.type === "aicallingv2")` routing block |

---

## Constraints

- All data is static frontend arrays — no API calls for this implementation.
- Voice preview uses a static placeholder audio; no external audio URL needed.
- Changing `agentType` resets `voiceBuild` to `""` and clears output `wiredPorts`.
- `outputMode` switching does not clear `wiredPorts` (user may switch back).
- Retry attempt bounded 1–10 (integer input with min/max attributes).
- The old `aicallingv2` node (`aicalling`) remains in the codebase but is hidden via `hidden: true` in NodePalette and absent from `V2_ALLOWED_NODES`.
