# PRD — Onsite Messaging Node (Flow Builder)

**Product:** Dowl Flow Builder  
**Feature:** Onsite Messaging (OSM) Channel Node  
**Author:** Product  
**Status:** In Development  
**Last Updated:** June 2026

---

## 1. Overview

The Onsite Messaging (OSM) Node is a channel node within the Flow Builder that enables marketers to display personalised on-site messages — popups, banners, and nudges — as a step inside an automated customer journey. Unlike a standalone OSM campaign, this node is triggered as part of a flow: when a user reaches this step in the journey, the configured message is queued to appear on their next eligible site visit or app session.

---

## 2. Problem Statement

Currently the "Notification" channel node in the flow builder is a generic placeholder with no dedicated UI, template system, or targeting logic. Marketers who want to pair an on-site message with an email or WhatsApp in a journey (e.g. "send WhatsApp → if not opened in 24h → show popup next visit") have no way to configure the on-site touchpoint inside the same flow. They are forced to create a separate standalone OSM campaign, manually coordinate timing, and lose journey-level attribution.

---

## 3. Goals

| # | Goal |
|---|------|
| G1 | Let marketers configure a popup, banner, or nudge as a flow step — no context switching |
| G2 | Support all four platforms: Web, Mobile Web, Android, iOS — seller-configurable per node |
| G3 | Provide a visual drag-and-drop template editor for building onsite creatives |
| G4 | Let sellers control when within a session the message appears (immediately, after delay, on exit intent, on custom event) |
| G5 | Enable page-level and screen-level targeting so the message only appears in the right context |
| G6 | Surface onsite engagement metrics at the node level in Analytics Mode |

---

## 4. Non-Goals

- Standalone OSM campaign management (audience picker, scheduling, frequency capping across campaigns) — that is a separate Campaigns module
- Real-time session attribute targeting (UTM params, geolocation, device type as session filters) — deferred to v2
- A/B testing creatives — deferred to v2
- Deep link routing for mobile screens — deferred to v2

---

## 5. Terminology

| Term | Definition |
|------|-----------|
| **OSM** | On-Site Messaging — messages displayed on website or mobile app UI |
| **Display Type** | The form factor of the message: Popup, Banner, or Nudge |
| **Trigger type** | The condition that must be met for the message to appear within the session |
| **Trigger delay** | Seconds to wait after the trigger condition before showing the message |
| **Page target** | The URL(s) or screens where the message is eligible to appear |

---

## 6. User Stories

| Role | Story | Priority |
|------|-------|----------|
| Marketer | I want to show a cart recovery popup to users who didn't open my WhatsApp follow-up | P0 |
| Marketer | I want to pick from prebuilt popup/banner/nudge templates so I don't design from scratch | P0 |
| Marketer | I want to build a custom popup in a visual editor with blocks (image, text, button, form) | P0 |
| Marketer | I want to control which pages the popup appears on (e.g. only on /cart or /checkout) | P0 |
| Marketer | I want to show the message on both web and mobile app from the same node | P1 |
| Marketer | I want to delay the popup by 5 seconds so it doesn't interrupt the page load | P1 |
| Marketer | I want to use exit intent so the popup appears when the user is about to leave | P1 |
| Marketer | I want to branch the flow based on whether the user clicked or dismissed the popup | P1 |
| Marketer | I want to personalise the popup copy with {{customer.firstName}} and {{product.name}} | P1 |
| Analyst | I want to see Shown / Clicked / Dismissed rates on each onsite node in analytics mode | P1 |

---

## 7. Feature Breakdown

### 7.1 Canvas Node Card

**Empty state (unconfigured):**
- Teal circle icon (Monitor)
- Label: "Onsite Message"
- Subtext: "Click to configure"
- Dashed teal border

**Configured state:**
- Header: Monitor icon + editable label + template name + display type pill (🪟 Popup / 📢 Banner / 💬 Nudge)
- Template thumbnail strip (colour from template)
- Trigger summary chip: "On page load", "On exit intent +5s", etc.
- Platform pills: 🌐 Web · 📱 Mobile Web · 🤖 Android · 🍎 iOS
- Right-edge delivery port rows (when Interaction-based routing is selected)
- Analytics footer (dark purple) in Analytics Mode: Shown / Clicked% / Dismissed% / Revenue

**Dimensions:** 270px wide (matches all other channel nodes)

---

### 7.2 Right Panel — Template Tab

#### Step 0: Display Type Picker

Shown when no display type is selected yet. Three option cards:

| Type | Emoji | Description |
|------|-------|-------------|
| **Popup** | 🪟 | Full-attention overlay for offers, lead gen and announcements. **Popular** |
| **Banner** | 📢 | Top or bottom bar for sale alerts, cookie notices and countdowns |
| **Nudge** | 💬 | Subtle corner message for feedback, subscriptions or soft CTAs |

Once a type is selected, a chip shows at the top of the tab ("🪟 Popup · Change"). Clicking "Change" resets display type and template.

#### Template Selection

Two entry points once display type is chosen:

1. **Select Prebuilt Template** — opens full-panel overlay with search, type filter tabs (All / Popup / Banner / Nudge), and a list of prebuilt + saved templates (thumbnail, name, use case, status, last updated)
2. **Start from Scratch** — opens the full-screen Template Editor Modal

Once a template is selected, a preview card shows:
- Colour thumbnail with emoji
- Template name + use case + status badge
- **Edit Template** button → re-opens the editor
- **× Clear** to deselect and go back to picker

---

### 7.3 Right Panel — Targeting Tab

#### Platform
Multi-select checkboxes for: Web · Mobile Web · Android · iOS. At least one must be selected.

#### Trigger
Radio group — when within the session to show the message:

| Trigger | Description | Platform restriction |
|---------|-------------|---------------------|
| On Page / Screen Load | Shows when page or screen loads | All platforms |
| On Session Start | Shows when user opens app or site | All platforms |
| On Custom Event | Shows when a specific event fires (text field for event name) | All platforms |
| On Exit Intent | Shows when cursor moves to close tab | Web only — disabled if Web is not selected |

#### Trigger Delay
Number input (seconds, min 0). Not shown for Exit Intent.
- 0 = "Immediately"
- > 0 = "Xs after trigger"

#### Page Targeting
Two modes:
- **All Pages** — message eligible on any page/screen
- **Specific Pages** — URL rule list

URL rules:
- Operator: contains / starts with / ends with / is exactly / is not
- Value: free text (e.g. `/cart`, `/checkout`)
- Multiple rules combined with AND logic
- Add / remove rules inline

---

### 7.4 Right Panel — Output Tab

Controls how the journey branches after this node.

| Routing Mode | Behaviour |
|---|---|
| Next Step | All users proceed to next node regardless of message interaction |
| Interaction-based | Users branch into separate paths per interaction event |

Available interaction branches (when Interaction-based is selected):
- Shown
- CTA Clicked
- Dismissed
- Timed Out

Each enabled branch creates a labelled Handle on the right edge of the canvas node.

---

### 7.5 Template Editor Modal (Full-Screen)

Launched from "Start from Scratch" or "Edit Template". Overlays the full page.

#### Top Bar
| Element | Function |
|---------|---------|
| Node name + display type label | Template identity |
| Desktop / Tablet / Mobile toggle | Switches preview canvas width (600px / 420px / 320px) |
| Undo / Redo | History (stub in v1) |
| Preview | Preview-only mode (stub in v1) |
| Save Template | Persists blocks back to node data, closes modal |
| × Close | Discards unsaved changes |

#### Preview Canvas

The canvas simulates the message in a fake browser chrome wrapper. Display-type-specific rendering:

| Display Type | Canvas rendering |
|---|---|
| **Popup** | Fake browser + blurred page background + dark overlay + centred popup card with × close button |
| **Banner** | Fake browser + banner bar at top + visible page content below |
| **Nudge** | Fake browser + page content + corner-anchored card (bottom-right) |

Preview width adjusts with device toggle. Each block has:
- Hover state with teal border
- Drag handle (left, grab cursor)
- Delete button (top-right, red)

"Add Block" dashed button at the bottom of block list.

#### Block Types

**Essentials:**
| Block | Behaviour |
|-------|---------|
| Title | Contenteditable heading |
| Text | Contenteditable paragraph with `{{variable}}` support |
| Image | Click-to-upload placeholder |
| Button | Styled CTA button (label + URL) |
| Icon | Icon picker |
| Spacer | Adjustable vertical gap |
| Form | Email/phone capture with CTA label |
| Line | Horizontal divider |

**Media:**
| Block | Behaviour |
|-------|---------|
| Video | Video embed placeholder |
| Audio | Audio player placeholder |

**Content:**
| Block | Behaviour |
|-------|---------|
| Countdown | Animated DD:HH:MM:SS countdown timer |
| Carousel | Horizontally scrollable cards |
| Alert | Highlighted notice box |

**Custom:**
| Block | Behaviour |
|-------|---------|
| Spin Wheel | Gamified prize wheel |
| Scratch Card | Reveal-on-scratch card |

#### Right Sidebar Tabs

**CONTENT** — collapsible groups of draggable block chips (3 per row). Drag onto canvas to insert.

**VARIABLES** — searchable list of personalization tokens grouped by Customer / Order / Product / Store. Displays example value. Click token to copy `{{key}}`.

**SETTINGS:**
| Setting | Control |
|---------|---------|
| Background color | Color picker |
| Border radius | Range slider (0–32px) |
| Overlay color | Color picker (popup/nudge only) |
| Show close button | Checkbox |

---

## 8. Prebuilt Template Library (v1)

| Template | Type | Use Case |
|----------|------|---------|
| Cart Recovery Popup | Popup | Promotions & Sales |
| Email Capture — 10% Off | Popup | Lead Gen |
| Flash Sale Banner | Banner | Promotions & Sales |
| Review Nudge | Nudge | Notification |
| Back in Stock Alert | Nudge | Product Info |
| Spin the Wheel | Popup | Gamification |

Templates are filterable by type (Popup / Banner / Nudge) and searchable by name and use case.

---

## 9. Data Model

```js
// Stored in node.data
{
  label:        "Onsite Message",      // editable node label
  displayType:  "popup",               // "popup" | "banner" | "nudge" | null (picker shown)
  template:     TemplateObject | null, // selected or created template
  platforms:    ["web"],               // one or more of: "web", "mobile_web", "android", "ios"
  triggerType:  "page_load",           // "page_load" | "session_start" | "custom_event" | "exit_intent"
  triggerEvent: "",                    // event name when triggerType === "custom_event"
  triggerDelay: 0,                     // seconds after trigger condition (0 = immediately)
  pageTarget:   "all",                 // "all" | "specific"
  pageRules:    [                      // used when pageTarget === "specific"
    { operator: "contains", value: "/cart" }
  ],
  outputConfig: {
    routingMode:      "next_step",     // "next_step" | "delivery"
    deliveryOutputs:  [],              // enabled branch ids
    wiredPorts:       [],              // ports that have edges connected
  },
}
```

```js
// Template object shape
{
  id:             "osm_001",
  name:           "Cart Recovery Popup",
  displayType:    "popup",
  useCase:        "Promotions & Sales",
  thumbnailBg:    "#FEF3C7",
  thumbnailAccent:"#F59E0B",
  platforms:      ["web", "mobile_web"],
  status:         "Active",
  lastUpdated:    "2025-05-14",
  blocks:         [Block],
}
```

---

## 10. Platform × Feature Matrix

| Feature | Web | Mobile Web | Android | iOS |
|---------|-----|-----------|---------|-----|
| Popup | ✓ | ✓ | ✓ | ✓ |
| Banner | ✓ | ✓ | ✓ | ✓ |
| Nudge | ✓ | ✓ | ✓ | ✓ |
| On page load | ✓ | ✓ | — | — |
| On screen load | — | — | ✓ | ✓ |
| On session start | ✓ | ✓ | ✓ | ✓ |
| On custom event | ✓ | ✓ | ✓ | ✓ |
| On exit intent | ✓ | — | — | — |
| Page URL targeting | ✓ | ✓ | — | — |
| Screen targeting | — | — | ✓ | ✓ |

---

## 11. Edge Cases & Validation

| Scenario | Behaviour |
|----------|-----------|
| No display type selected | Canvas card shows empty/dashed state; flow cannot be activated |
| No template configured | Warning on node; flow cannot be activated |
| Exit intent selected but Web not in platforms | Exit intent trigger is disabled and greyed out |
| Specific pages selected with no rules added | Treated as All Pages (no rules = no restriction) |
| All platforms deselected | Last selected platform cannot be deselected (minimum 1) |
| Template has `{{variables}}` with no system data | Variables render as raw token text; no blocking error in builder |
| Interaction-based routing with no branches enabled | Falls back to Next Step behaviour |

---

## 12. Relationship to Standalone OSM Campaigns

| Dimension | OSM Node (Flow Builder) | Standalone OSM Campaign |
|---|---|---|
| Trigger | Flow entry condition (user reaches this step in journey) | Page load / session / custom event |
| Audience | Defined by the flow's start trigger | Audience filters + segments |
| Scheduling | Controlled by flow timing (wait nodes, delays) | One-time or periodic schedule |
| Frequency capping | Inherited from flow's global settings | Per-campaign frequency cap |
| Attribution | Journey-level attribution | Campaign-level attribution |
| Use case | Part of a multi-step journey | One-off or recurring campaign |

---

## 13. Out of Scope (v1)

| Feature | Reason |
|---------|--------|
| Session attribute targeting (UTM, geo, device) | Requires real-time session data pass-through; deferred |
| A/B testing creatives | Analytics infra dependency; deferred |
| Deep link routing for mobile screens | Mobile SDK integration required; deferred |
| Form submission webhook | Backend integration; deferred |
| Spin the wheel prize engine | Requires prize pool configuration backend; stub in v1 |
| Scratch card reveal logic | Same as above |
| Custom CSS / HTML injection | Security review required; deferred |

---

## 14. Success Metrics

| Metric | Target (90 days post-launch) |
|--------|------------------------------|
| Onsite nodes created per week | > 40 |
| % of onsite nodes with template configured | > 75% |
| % of flows combining OSM + another channel | > 30% |
| Template editor session completion rate | > 65% |
| Click rate on onsite messages from flows | > 8% |

---

## 15. Open Questions

1. Should a template saved in the OSM node editor also appear in a global template library (reusable across flows and standalone campaigns)?
2. How does frequency capping work for an OSM node inside a flow — if the user enters the same flow twice, should the popup show twice?
3. For mobile platforms (Android / iOS), does the OSM node use the same SDK integration as standalone in-app campaigns, or a separate trigger?
4. Should "Specific Screens" targeting for mobile use a free-text screen name, or a structured screen picker from the app's registered screens?
5. Is Spin the Wheel / Scratch Card gated behind a specific plan tier?
