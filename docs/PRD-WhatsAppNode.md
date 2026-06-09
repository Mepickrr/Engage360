# PRD — WhatsApp Channel Node (Flow Builder)

## 1. Overview

The WhatsApp Node is a channel node within the Flow Builder that enables marketers to send pre-approved WhatsApp Business messages as a step inside an automated customer journey. The node supports nine distinct message styles — from standard text+media to carousels, catalogs, and payment links — and provides full delivery-based routing so downstream journey branches respond to real message engagement.

---

## 2. Problem Statement

WhatsApp is a high-engagement channel that requires pre-approved message templates, multiple message formats, and careful routing based on delivery receipts (sent, delivered, read, failed). A generic channel node cannot accommodate this complexity: marketers need a dedicated experience to select template style, configure variable personalisation, manage sender numbers, and branch the journey by read vs. no-response vs. failure — all within the same flow UI.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Let marketers pick from 9 WhatsApp message styles and configure or create a template without leaving the flow builder |
| G2 | Support inline template creation (Standard style) with variable insertion and OR-chain fallback mapping |
| G3 | Enable delivery-based routing so the journey branches differently on Sent / Delivered / Read / Failed / No Response |
| G4 | Allow Quick Reply and URL button outputs to be wired as individual journey branches |
| G5 | Provide delivery controls: UTM tracking, AI Best Sent Time, Smart Retry |
| G6 | Surface WhatsApp engagement metrics at the node level in Analytics Mode |

---

## 4. Non-Goals

- WhatsApp Business Manager template approval workflow — templates must be approved by Meta before they appear in the library
- Conversational / session messaging — deferred; UI note exists in code but the category is hidden in v1
- Two-way conversation threading (handling inbound replies as a new flow trigger) — separate feature
- Catalog or product sync — the Catalog style is available as a template style, but the product data connection is outside scope for v1

---

## 5. Terminology

| Term | Definition |
|------|-----------|
| **WABA Number** | WhatsApp Business Account number registered with Meta through which messages are sent |
| **Template Style** | The structural format of the WhatsApp message (Standard, List, Carousel, etc.) |
| **Variable** | A personalisation token in the message body, denoted `{{$1}}`, `{{customer.firstName}}`, etc. |
| **Variable Mapping (OR chain)** | An ordered list of customer attribute fallbacks for each variable — the first non-empty value is used |
| **Delivery Branch** | A named output port on the canvas node corresponding to a WhatsApp delivery status |
| **Smart Retry** | Automatic re-send within a configurable window if the initial send fails |

---

## 6. User Stories

| Role | Story | Priority |
|------|-------|----------|
| Marketer | I want to send a WhatsApp cart recovery message with a product image header and two reply buttons | P0 |
| Marketer | I want to create a new template inline without leaving the flow | P0 |
| Marketer | I want to pick an existing approved template from the library and personalise it | P0 |
| Marketer | I want the journey to branch if the message is not read after 24 hours | P0 |
| Marketer | I want each Quick Reply button to route users into a separate journey path | P1 |
| Marketer | I want to add UTM parameters to all links in this node for analytics attribution | P1 |
| Marketer | I want to configure a fallback template in case the primary one fails to send | P1 |
| Marketer | I want to use AI Best Sent Time so messages are delivered at each user's optimal window | P1 |
| Analyst | I want to see Sent / Delivered% / Read% / Revenue on each WhatsApp node in analytics mode | P1 |
| Marketer | I want to test my whatsapp message | P1 |

---

## 7. Feature Breakdown

### 7.1 Canvas Node Card

**Empty state (unconfigured):**
- WA Green (#25D366) circle icon
- Label: "WhatsApp"
- Subtext: "Click to configure"
- Dashed green border

**Configured state:**
- Header: WA icon + editable label + template style chip (e.g. "💬 Standard") + template name
- Category badge: Marketing / Utility
- Template status badge: Active / In Review / Draft / Rejected
- Header type indicator: Image / Video / Document / None
- Body preview with highlighted variable tokens
- CTA button chips (up to 3)
- Feature chips: UTM / AI Best Time / Smart Retry / Fallback
- Right-edge delivery port rows (when Delivery Branches routing is selected) and button port rows
- Analytics footer (dark purple) in Analytics Mode: Sent / Delivered% / Read% / Revenue

**Dimensions:** 270px wide (matches all other channel nodes)

---

### 7.2 Right Panel — Template Tab

#### Step 0: Template Style Picker

Shown when no style is selected yet. Nine option cards in a 3×3 grid:

| Style | Emoji | Description |
|-------|-------|-------------|
| **Standard** | 💬 | Text body with image, video or document header and reply buttons. **Popular** |
| **List** | 📋 | Scrollable list of up to 10 sections with items |
| **Carousel** | 🎠 | Horizontal cards with images, text and buttons |
| **Address** | 📍 | Share a delivery or pickup address with map preview |
| **Catalog** | 🛍️ | Showcase products from your WhatsApp catalog |
| **Payment Link** | 💳 | Send a UPI or payment link directly in chat |
| **Call Permission** | 📞 | Request permission to call the customer |
| **Audio** | 🎙️ | Share a voice note or audio clip |
| **Location** | 🗺️ | Share a live or static location pin |

Once a style is selected, a chip shows at the top of the tab ("💬 Standard · Change"). Clicking "Change" resets style and template.

#### Standard Style — Template Configuration

Two entry points once Standard is selected:

1. **Create New** — opens an inline template form within the panel
2. **Select Existing** — opens a full-panel TemplatePicker overlay

**Inline Template Form (Create New / Edit):**

| Field | Control |
|-------|---------|
| Template Name | Text input (snake_case, e.g. `cart_recovery_v1`) |
| Category | Select: Marketing / Utility / Conversational |
| Language | Select: English / Hindi |
| Status | Select: Draft / Uploaded / Approved / Rejected / Paused |
| Header | Pill toggle: None / Image / Video / Document + upload dropzone or text input |
| Message Body | Textarea with `{{variable}}` tokens; "+ Add Variable" appends `{{$n}}` |
| Variable Mapping | OR-chain per detected variable (see below) |
| Buttons | Up to 3 buttons: Quick Reply / Website URL / Phone Number (20-char label limit each) |
| AI Enhance | Button to generate Friendly / Persuasive / Urgent tone variants |
| Footer | Optional text input (max 200 chars; e.g. "Reply STOP to unsubscribe") |

**Variable Mapping — OR Chain:**

Each `{{variable}}` detected in the body gets a card with an ordered list of customer attribute selectors. The system uses the first non-empty value for that user. Marketers can:
- Select from grouped system attributes (Customer / Order / Product / Store)
- Add additional fallback rows ("+ Add fallback")
- Remove individual OR entries (shown only when chain has > 1 entry)

Available attribute groups: Customer (firstName, lastName, name, phone, email, id), Order (id, amount, items, trackingUrl, deliveryDate, status), Product (name, price, url, imageUrl), Store (name, url, supportNumber).

#### Non-Standard Styles — Template Configuration

For List, Carousel, Address, Catalog, Payment Link, Call Permission, Audio, and Location:
- Amber notice: templates for this style must be created in WhatsApp Business Manager and approved by Meta before use
- "Open WhatsApp Manager →" link
- "Select Existing" button only — no inline creation

#### Template Selected State

Once a template is selected (either path):
- Action bar: template name + Edit / Change / Test buttons
- Inline editable form populated with template data (all fields remain live-editable)
- Canvas node updates in real time as body and variables are edited

#### Sender Number

Dropdown of registered WABA numbers (nickname + last 4 digits). Inactive numbers are shown but disabled.

#### Fallback Template

Toggle (default off). When enabled, a secondary template picker appears. The fallback template is sent if the primary template delivery fails. Supports Edit / Change / Remove actions.

---

### 7.3 Right Panel — Delivery Tab

| Setting | Control | Description |
|---------|---------|-------------|
| Mark as Marketing | Checkbox (default on) | Tags the message for revenue attribution |
| UTM Parameters | Toggle + 5 text fields | Appends utm_source, utm_medium, utm_campaign, utm_content, utm_term to all links |
| AI Best Sent Time | Toggle | Delivers within each user's highest-engagement window (0–4 hour buffer) |
| Smart Retry | Toggle + mode selector | Re-sends on failure; Smart (auto-window, recommended) or Manual (time-slot config) |

---

### 7.4 Right Panel — Output Tab

Controls how the journey branches after this node.

#### Routing Modes

| Mode | Behaviour |
|------|-----------|
| **Next Step** | Single output port — all users proceed to the same next node regardless of delivery status |
| **Delivery Branches** | One output port per selected delivery status |

#### Delivery Branch Options (when Branches mode selected)

| Branch | Has Time Config |
|--------|----------------|
| Sent | No |
| Delivered | No |
| Read | No |
| Delivery Failed | No |
| Not Read | No |
| No response after | Yes — number input (value + unit: Minutes / Hours / Days) |

At least one branch must be selected when Branches mode is active.

#### Response Outputs from Buttons

Quick Reply and URL buttons in the configured template each automatically create a labelled output port on the canvas. These ports appear in addition to delivery branch ports.

Warning: using button ports disables "On Link Click" tracking. Once a user exits through a button branch they cannot enter subsequent branches.

#### Port Count Summary

A summary bar at the bottom of the Output tab shows the total number of output ports that will appear on the canvas node (delivery ports + button ports).

---

## 8. Template Picker Overlay

Launched from "Select Existing" on the Template tab. Full-panel overlay with:
- Search by template name
- Filter tabs: All / Marketing / Utility
- Template list rows: name, category badge, status badge, last updated date
- Clicking a row selects the template and closes the overlay

---

## 9. Data Model

```js
// Stored in node.data
{
  label:           "WhatsApp",           // editable node label
  templateStyle:   "standard",          // one of 9 style ids | null (picker shown)
  template:        TemplateObject | null,
  variableMap:     {                    // per-variable OR-chain fallback arrays
    "$1": ["customer.firstName", "customer.name"],
    "$2": ["order.id"],
  },
  wabaNumberId:    "waba_1",            // selected WABA number id
  templateType:    "Marketing",         // "Marketing" | "Utility" | "Conversational"
  markAsMarketing: true,
  utm: {
    enabled:   false,
    source:    "whatsapp",
    medium:    "journey",
    campaign:  "",
    content:   "",
    term:      "",
  },
  aiBestTime:  false,
  smartRetry: {
    enabled:     false,
    mode:        "smart",            // "smart" | "manual"
    smartWindow: "72",               // hours for smart retry window
    manualSlots: [],
  },
  fallback: {
    enabled:  false,
    template: TemplateObject | null,
  },
  outputConfig: {
    routingMode:      "next_step",   // "next_step" | "branches"
    deliveryOutputs:  [],            // selected branch status ids
    noResponseValue:  5,
    noResponseUnit:   "hours",       // "minutes" | "hours" | "days"
    wiredPorts:       [],            // port ids that have edges connected
  },
}
```

```js
// Template object shape
{
  id:          "tpl_001",
  name:        "cart_recovery_v1",
  type:        "Marketing",
  status:      "Active",           // "Active" | "In Review" | "Draft" | "Rejected" | "Paused"
  language:    "en",
  category:    "Marketing",        // "Marketing" | "Utility" | "Conversational"
  header: {
    type: "image",                 // "none" | "image" | "video" | "document" | "text"
    url:  "https://cdn…",
    bg:   "#1a4a2e",               // thumbnail background for picker
    text: "",                      // used when type === "text"
  },
  body:        "Hey {{$1}}, your cart is waiting…",
  footer:      "Reply STOP to unsubscribe",
  buttons: [
    { type: "QUICK_REPLY", label: "Shop Now" },
    { type: "URL", label: "View Cart", url: "https://store.com/cart" },
    { type: "PHONE", label: "Call Us" },
  ],
  variables:   ["$1", "$2"],
  lastUpdated: "2025-05-14",
}
```

---
   
   
## 10. Analytics Footer (Analytics Mode)

When `data.analyticsData` is present, a dark footer (bg #1E1B4B) appended below the canvas node card shows:

| Row | Value | Highlighted |
|-----|-------|-------------|
| Sent | absolute count | No |
| Delivered | percentage | Yes |
| Opened | percentage | Yes |
| Revenue | INR formatted | No |
| CTA \[label\] | click count per button | No (one row per CTA) |

---

## 11. Edge Cases & Validation

| Scenario | Behaviour |
|----------|-----------|
| No template style selected | Canvas shows empty/dashed state; flow cannot be activated |
| No template configured | Warning on node; flow cannot be activated |
| Non-Standard style: no template selected | Only "Select Existing" is available; "Create New" is hidden; amber notice shown |
| Delivery Branches mode with no branches selected | Error message shown; flow cannot be activated |
| Button ports + Delivery Branches both active | Total port count = delivery ports + button ports; both types rendered on canvas |
| Template has variables but variable mapping is empty | Variables render as raw tokens (`{{$1}}`); no blocking error in builder |
| WABA number is inactive | Number shown in dropdown but disabled; cannot be selected |
| Smart Retry enabled but no mode set | Defaults to Smart Retry mode |
| Fallback enabled but no fallback template selected | Warning state on fallback row; flow can still be saved |
| No Response branch selected with no time value | Falls back to default (5 hours) |

---

## 12. Template Style Availability

| Feature | Standard | List | Carousel | Address | Catalog | Payment Link | Call Permission | Audio | Location |
|---------|----------|------|----------|---------|---------|-------------|----------------|-------|----------|
| Inline creation | ✓ | — | — | — | — | — | — | — | — |
| Select Existing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Image / Video / Doc header | ✓ | — | per card | — | — | — | — | — | — |
| Quick Reply buttons | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| URL buttons | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |
| Button output ports | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |

---
##13 Template testing

Seller can test the whatsapp template by clicking on test now button on the node preview.

---

## 14. Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| WhatsApp nodes created per week | > 80 |
| % of nodes with template configured | > 80% |
| % of nodes using Delivery Branches routing | > 40% |
| % of nodes with UTM enabled | > 35% |
| Read rate on WhatsApp messages from flows | > 45% |

---

## 15. Open Questions

1. Should templates created inline via "Create New" be auto-submitted to Meta for approval, or remain in Draft until the seller manually submits from WhatsApp Manager?
2. How does the fallback template trigger — only on delivery failure, or also on template rejection or opt-out?
3. For Conversational templates requiring an active user session, what is the fallback behaviour when the user has no open session — send the fallback template, skip the node, or hold the user until a session opens?
4. Should WABA numbers be manageable within the flow builder (add/remove), or only configured in a separate account settings area?
5. Is Smart Retry limited by WhatsApp's 24-hour messaging window for marketing messages?
