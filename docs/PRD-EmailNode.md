# PRD — Email Node (Flow Builder)

**Product:** Dowl Flow Builder  
**Feature:** Email Channel Node  
**Author:** Product  
**Status:** In Development  
**Last Updated:** June 2026

---

## 1. Overview

The Email Node is a first-class channel node within the Flow Builder that enables marketers to design, configure, and send personalised email campaigns as part of an automated customer journey. It is the email equivalent of the WhatsApp and SMS nodes — a dedicated canvas block with a full-featured right panel and an embedded visual template editor.

---

## 2. Problem Statement

Currently, the email channel in the flow builder renders as a generic `ChannelNode` (a simple text + body card). This gives marketers no way to:

- Pick or build a real email template with visual blocks (image, text, CTA button)
- Configure sender identity (From Name, From Email, Reply-To)
- Set subject lines and preview text with personalization tokens
- Enable Gmail Promotions tab annotations (discount badge)
- Add UTM parameters per-send
- Route flow branches based on delivery status (Delivered / Opened / Clicked / Bounced)

The gap forces marketers to build email campaigns outside the journey tool, break the single-flow mental model, and lose journey-level attribution.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Let marketers configure a complete email send from inside the flow builder, with zero context switching |
| G2 | Provide a visual template editor that produces production-ready email HTML |
| G3 | Support deep personalization via system variables (customer, order, product, store) |
| G4 | Enable delivery-status-based branching so journeys can react to email engagement |
| G5 | Surface email performance metrics at the node level in Analytics Mode |

---

## 4. Non-Goals

- Full marketing email campaign module (one-time blasts with audience picker) — that is a separate Campaign page
- SMTP/ESP connector management — handled in Settings > Integrations
- A/B testing subject lines at GA (deferred to v2)
- AMP email support (deferred to v2)

---

## 5. User Stories

| Role | Story | Priority |
|------|-------|----------|
| Marketer | I want to pick an existing email template so I don't have to rebuild the design every time | P0 |
| Marketer | I want to set a subject line with `{{customer.firstName}}` so the email feels personal | P0 |
| Marketer | I want to open a full-screen visual editor to build a new template from blocks | P0 |
| Marketer | I want the canvas card to show me subject + from address at a glance so I can scan my flow | P0 |
| Marketer | I want to add UTM params automatically to all links in the email | P1 |
| Marketer | I want to branch the flow on "Opened" vs "Not Opened" so I can send a follow-up SMS to non-openers | P1 |
| Marketer | I want to test the email by sending it to my own address before going live | P1 |
| Marketer | I want to add a Gmail Promotions badge with a discount code so the email stands out in inbox | P2 |
| Analyst | I want to see Sent / Delivered / Opened / Clicked rates on each email node in analytics mode | P1 |

---

## 6. Feature Breakdown

### 6.1 Canvas Node Card

The card is the visual representation of the email node on the ReactFlow canvas.

**Empty state (unconfigured):**
- Blue circle icon (Mail)
- Label: "Send Email"
- Subtext: "Click to configure"
- Dashed blue border

**Configured state:**
- Subject line in a blue pill (truncated at 1 line)
- Preview text in smaller text below subject
- From name + email address row with avatar initial
- Template name + status badge (Active / Draft)
- Delivery output port rows on the right edge (Next Step, Delivered, Opened, etc.)
- Feature chips at the bottom: UTM · AI Best Time · N Files · Gmail Annotation
- Analytics footer (dark purple) in Analytics Mode showing Sent / Delivered% / Opened% / Clicked% / Revenue

**Dimensions:** 270px wide (matches WhatsApp and SMS nodes)

---

### 6.2 Right Panel — Template Tab

The default tab when the node is selected.

#### 6.2.1 Sender Details
| Field | Type | Notes |
|-------|------|-------|
| From Address | Dropdown | Shows Name + Email from verified sender list. Warns if domain unverified |
| Reply-To Email | Text input | Optional. Falls back to From address if blank |

#### 6.2.2 Email Content
| Field | Type | Notes |
|-------|------|-------|
| Subject Line | Text input | Supports `{{variables}}`. Character count shown. "AI Assist" CTA (stub) |
| Preview Text | Text input | Shown in inbox preview below subject. Recommended 40–130 chars |

#### 6.2.3 Template
Two entry points:
1. **Select Existing Template** — opens a full-panel template picker overlay (search by name/subject, thumbnail, status badge, category, last updated date)
2. **Create New Template** — opens the full-screen Template Editor Modal

Once a template is selected, a mini preview card is shown with:
- Colour thumbnail
- Template name + status + category
- Subject line (from node data)
- **Edit Template** button → re-opens editor
- **× Clear** to deselect

#### 6.2.4 Attachments
- List of attached files (name, size, remove button)
- Upload button (accepts PDF, DOCX, XLSX, ZIP; max 10 MB)

#### 6.2.5 Gmail Annotation (toggle)
| Field | Purpose |
|-------|---------|
| Discount Amount | e.g. "20% off" |
| Promo Code | e.g. "SAVE20" |
| Expiry Date | e.g. "June 30, 2026" |

Renders a badge in Gmail's Promotions tab inbox card. Requires verified sender domain.

---

### 6.3 Right Panel — Delivery Tab

#### UTM Parameters (toggle)
| Param | Default |
|-------|---------|
| utm_source | `email` |
| utm_medium | `journey` |
| utm_campaign | (user-set) |
| utm_content | (user-set) |

Auto-appended to all links in the email body when enabled.

#### Send Optimization
- **AI Best Time** toggle — delivers within a 24-hour window per user based on individual open history

#### Test Campaign
- Free-text email input + "Send Test" button
- Renders the email with preview/example variable values

---

### 6.4 Right Panel — Output Tab

Controls what downstream node(s) users flow into after this email is processed.

| Routing Mode | Behaviour |
|---|---|
| Next Step | All users continue to the next connected node regardless of delivery outcome |
| Delivery-based | Users branch into separate paths per delivery event |

Available delivery output branches (when Delivery-based is selected):
- Sent
- Delivered
- Opened
- Link Clicked
- Bounced
- Unsubscribed

Each enabled branch creates a labelled Handle on the right edge of the canvas node.

---

### 6.5 Template Editor Modal (Full-Screen)

Launched from "Create New Template" or "Edit Template". Overlays the entire page.

#### Top Bar
| Element | Function |
|---------|---------|
| Template name + "Visual Editor" label | Displays current template identity |
| Desktop / Mobile toggle | Switches canvas preview width (660px / 375px) |
| Undo / Redo | History navigation (stub in v1) |
| Preview button | Opens a preview-only modal (stub in v1) |
| Save Template | Persists blocks back to node data, closes modal |
| × Close | Discards unsaved changes, closes modal |

#### Email Canvas (main area)
- Scrollable canvas showing the email rendered at the selected device width
- Editable subject + preview text shown in an email header bar
- Drag-drop target for blocks
- Each block has hover state with: drag handle (left), delete button (top-right)
- Footer row: unsubscribe · view in browser · privacy policy
- "Add Block" dashed button at the bottom of the block list

**Block types:**
| Block | Behaviour |
|-------|---------|
| Text | Contenteditable rich text. Supports `{{variables}}` |
| Image | Click-to-upload placeholder. Shows upload CTA when empty |
| Button | Centred CTA button. Editable label + URL |
| Divider | 1px horizontal line |
| Spacer | Empty vertical gap |
| HTML | Raw HTML paste area |
| Social | Social icon row |
| Product | Product card with image, name, price, CTA |
| Unsubscribe | Standard unsubscribe link block |

#### Right Sidebar Tabs

**CONTENT** — 2-column grid of draggable block chips (icon + label). Drag onto canvas to insert.

**ROWS** — Column layout presets (1 column, 2 columns equal, 2 columns wide-left, 3 columns). Click to insert an empty row with placeholder columns.

**VARIABLES** — Searchable list of personalization tokens grouped by category (Customer, Order, Product, Store). Click token to copy `{{key}}`. Displays example value.

**SETTINGS** — Design-level controls:
| Setting | Options |
|---------|---------|
| Background color | Color picker |
| Max email width | 500 / 600 / 700 / 800 px |
| Font family | Inter, Arial, Georgia, Verdana |
| Base font size | 12 / 13 / 14 / 16 / 18 px |
| Link color | Color picker |
| Visited link color | Color picker |

---

### 6.6 Analytics Mode

In Flow Analytics (`/flows/builder/:id/analytics`), the email node renders identically to the builder but with a dark-purple analytics footer appended below the card:

| Metric | Description |
|--------|-------------|
| Sent | Total emails dispatched |
| Delivered | % of sent that reached the inbox |
| Opened | % of delivered that were opened |
| Clicked | % that clicked at least one link |
| Revenue | Attributed ₹ revenue from this node |

---

## 7. Data Model

```js
// Stored in node.data
{
  label:       "Send Email",          // editable node label
  template:    TemplateObject | null, // selected/created template
  fromId:      "from_1",              // sender identity id
  replyTo:     "",                    // optional reply-to email
  subject:     "",                    // subject line (may include {{vars}})
  previewText: "",                    // inbox preview text
  attachments: [{ name, size }],      // file list
  gmailAnnotation: {
    enabled:  false,
    discount: "",
    code:     "",
    expiry:   "",
  },
  outputConfig: {
    routingMode:     "next_step",     // "next_step" | "delivery"
    deliveryOutputs: [],              // enabled branch ids
    wiredPorts:      [],              // ports that have edges connected
  },
  utm: {
    enabled:  false,
    source:   "email",
    medium:   "journey",
    campaign: "",
    content:  "",
  },
  aiBestTime: false,
}
```

```js
// Template object shape
{
  id:           "email_tpl_001",
  name:         "Cart Recovery — Minimal",
  subject:      "Hey {{first_name}}, you left something behind 🛒",
  previewText:  "Your cart is waiting.",
  category:     "Transactional",
  thumbnailColor: "#EFF6FF",
  status:       "Active",            // "Active" | "Draft"
  lastUpdated:  "2025-05-18",
  blocks:       [Block],
}
```

---

## 8. Sender Identity

Senders are managed in Settings > Senders (not within the node itself). The node only selects from pre-verified senders. Each sender has:

- `id` — internal reference
- `name` — display name shown to recipients
- `email` — sending address
- `verified` — boolean; unverified senders show a warning in the node panel

---

## 9. Edge Cases & Validation

| Scenario | Behaviour |
|----------|-----------|
| No template selected | Canvas card shows empty/dashed state; flow cannot be activated |
| No subject line | Warning indicator on node; flow cannot be activated |
| Unverified sender domain | Amber warning in Sender Details; still allows save |
| Template has variables with no mapping | Variable tokens render as-is; no blocking error in builder (validation at send time) |
| Delivery-based routing with no branches enabled | Falls back to Next Step behavior |
| Attachment over 10 MB | Upload rejected with inline error |

---

## 10. Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Full HTML rendering in editor | Browser sandbox constraints; use preview button |
| Real drag-and-drop between rows | Requires dedicated DnD library integration |
| Saved block library | Requires backend storage; deferred |
| Conditional content blocks | Content personalization engine; deferred |
| A/B subject line variants | Analytics infra dependency; deferred |
| AMP email blocks | Niche use case; deferred |
| Unsubscribe group management | Requires ESP-level integration |

---

## 11. Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Email nodes created per week | > 50 |
| % of email nodes with template selected | > 80% |
| % of flows using email + SMS fallback branching | > 20% |
| Template editor session completion rate | > 70% |
| Support tickets about email configuration | < 5/month |

---

## 12. Open Questions

1. Should "Create New Template" also save the template to a global template library, or is it node-local only?
2. What ESP integrations are supported at launch — only internal SMTP, or also Postmark / SendGrid / Mailmodo?
3. Should variable tokens in subject lines be validated at flow-activation time or at send time?
4. Is the Gmail Annotation feature gated behind a plan tier?
5. Should AI Best Time share a per-user model with the WhatsApp AI Best Time, or is it channel-specific?
