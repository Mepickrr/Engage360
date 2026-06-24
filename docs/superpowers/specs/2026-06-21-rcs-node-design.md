# RCS Node — Product Design Spec

**Date:** 2026-06-21
**Status:** Foundational draft — open for additional layers
**Audience:** Internal product team, designers
**Scope:** RCS channel node within the Flow Builder

---

## Node Purpose & Conceptual Model

RCS (Rich Communication Services) is Google's standard for rich, branded business messaging delivered directly inside a user's native SMS/Messages app — no separate app download required. It is the upgraded successor to SMS, delivering interactive, media-rich messages to any Android device running Google Messages.

**What makes RCS different as a channel:**

- **No app install barrier:** Messages arrive in the customer's default Messages app. Unlike WhatsApp, there is no separate install, no opt-in to a platform, and no account creation required from the customer.
- **Template-registered but more flexible:** Like WhatsApp, all business-initiated RCS messages must use registered templates approved by Google and/or the carrier. Unlike WhatsApp, however, there is no rigid style-gating — templates are Basic (text), Single (rich card), or Carousel (multiple scrollable cards), and the approval process is typically faster (within 24 hours).
- **Native SMS fallback:** If the customer's device or carrier does not support RCS, the message automatically falls back to a standard SMS. This makes RCS the channel with the broadest potential reach — every mobile number is reachable, either via RCS or SMS.
- **Rich delivery signals:** RCS returns delivery receipts at four levels — Sent, Delivered, Read, Failed — enabling delivery-based journey branching, the same as WhatsApp.
- **Interactive suggestions:** Templates support up to 4 action buttons per card (called "suggestions" in RCS terminology): Quick Reply, Open URL, Dial Phone, Send Location, Request Location, and Calendar Event.
- **Sender identity is a brand agent:** Messages are sent from a registered RCS Business Agent — a Google-verified brand identity with a display name, logo, and verified checkmark. This is different from WhatsApp's WABA phone number. The customer sees a brand name, not a raw number.
- **Text formatting:** RCS Basic templates support inline text formatting — bold, italic, strikethrough, and monospace — which standard SMS and WhatsApp do not offer natively.

**What the RCS node does in a journey:**
The RCS node sends a registered, approved RCS template to the customer as a step in an automated journey. The marketer selects the message style (Basic, Single, or Carousel), configures the template content and personalization, and sets how the journey branches next — based on delivery status or the customer's button tap.

---

## 1. Configuration

### 1.1 Message Style

The first configuration decision is choosing the **message style** — the structural format of the RCS message. There are two styles:

| Style | What it is | When to use |
|-------|-----------|-------------|
| **Basic** | Text-only message with optional inline formatting and up to 10 suggestion buttons | Transactional updates, simple notifications, text-based promotions where a clean readable message is sufficient |
| **Single** | A rich card with a media header (image, video, or PDF), a title, a description, and up to 4 suggestion buttons | Product showcases, offer announcements, visually driven campaigns, appointment reminders with a branded image |
| **Carousel** | Up to 10 horizontally scrollable rich cards in a single message, each with its own media, title, description, and buttons | Showcasing multiple products, plans, or offers side-by-side where each item needs its own visual and CTA |

Once a style is selected, it is locked for that node. Changing style resets the template selection and all associated configuration.

---

### 1.2 Template — Basic Style

A Basic template is text-only. It is the RCS equivalent of a well-formatted SMS — but with the ability to add interactive buttons, inline formatting, and delivery receipts.

**Two paths for the marketer:**
- **Create a new template inline** — configure all fields directly within the node panel
- **Select and edit an existing approved template** — pick from the brand's RCS template library, with the ability to edit fields before activating

**Template fields:**

| Field | Rule |
|-------|------|
| Template Name | Internal identifier. Alphanumeric and underscores only, max 20 characters. Must be unique per registered agent. |
| Category | Promotional or Transactional. Determines delivery rules and promotional frequency caps (see §1.8). |
| Message Body | Required. Up to 1,000 characters. Supports inline formatting and personalization variables. |
| Suggestion Buttons | Optional. Up to 10 suggestions per Basic message (see §1.2.1 for button types). |

**Inline text formatting in Basic templates:**
RCS Basic supports Markdown-style formatting within the message body. These render natively in the customer's Messages app.

| Format | Syntax | Example |
|--------|--------|---------|
| Bold | `*text*` | `*Your order is ready*` |
| Italic | `_text_` | `_Thank you for choosing us_` |
| Strikethrough | `~text~` | `~₹1,999~` `₹999` |
| Monospace | ` ```text``` ` | For order IDs, codes, etc. |

**Template Status lifecycle:**
Draft → Submitted → In Review → Approved / Rejected

Only **Approved** templates can be used in a live journey. The node surfaces the current status so the marketer knows whether the template is ready before activating the journey. In-Review and Approved templates cannot be edited — the marketer must create a new version.

---

#### 1.2.1 Suggestion Buttons — Basic Template

Suggestion buttons (called "suggestions" in RCS) are interactive elements that appear below the message body. The customer taps one to take an action.

Basic templates support **up to 10 suggestion buttons** in total. All button labels max 25 characters. No special characters allowed in labels.

| Button Type | What it does | Creates output port |
|------------|-------------|-------------------|
| **Quick Reply** | Sends a predefined reply back to the business when tapped | Yes |
| **Open URL** | Opens a web page in the customer's default browser or an in-app webview | Yes |
| **Dial Phone** | Pre-fills the customer's dialer with the specified phone number | No |
| **Send Location to User** | Opens a map to a specific coordinate the business defines | No |
| **Get User Location** | Requests the customer's current GPS location | No |
| **Calendar Event** | Pre-fills the customer's calendar app with event details (title, start/end time, description) | No |

**Why only Quick Reply and URL create output ports:**
Output ports route the customer to a subsequent node in the journey. Dial, Location, and Calendar are one-way actions that happen on the customer's device — there is no response the platform can listen for to determine which branch to take next.

---

### 1.3 Template — Single (Rich Card) Style

A Single template is a rich card — a structured, visually branded message combining media, a title, a description, and interactive buttons. It renders like a product card or notification card inside the Messages app.

**Two paths for the marketer:**
- **Create a new template inline** — configure all fields directly within the node panel
- **Select and edit an existing approved template** — pick from the library and modify before activating

**Template fields:**

| Field | Rule |
|-------|------|
| Template Name | Alphanumeric and underscores only, max 20 characters. Must be unique per registered agent. |
| Category | Promotional or Transactional |
| Media | Required (at minimum one of media, title, or description must be present). Image, video, or PDF. See media specs below. |
| Card Layout | The aspect ratio and height of the card as it appears in the Messages app. See layout options below. |
| Title | Optional. Up to 200 characters. Displayed prominently above the description. |
| Description | Optional. Up to 2,000 characters. The main body of the card. Supports personalization variables. |
| Suggestion Buttons | Optional. Up to 4 buttons per card (same 6 button types as Basic — see §1.2.1). |

**Note:** At least one of media, title, or description must be present. A card with none of these cannot be submitted for approval.

**Media specifications:**

| Type | Formats | Max size |
|------|---------|---------|
| Image | JPEG, GIF, PNG | 2 MB |
| Video | MP4, WebM, MPEG, M4V | 10 MB |
| PDF | PDF | Standard file limits (India/Google Messages only) |

**Card layout options (aspect ratio):**

The layout determines how tall the media area appears on the card. Choose based on the type of media and how much visual emphasis you want.

| Layout | Aspect Ratio | Best for |
|--------|-------------|---------|
| Short | 2:1 | Landscape product images, banners |
| Medium | 16:9 | Standard widescreen images, video thumbnails |
| Tall | 3:4 | Portrait product images, app-style cards |

**Template Status lifecycle:** Same as Basic — Draft → Submitted → In Review → Approved / Rejected. Only Approved templates can be activated in a live journey.

---

### 1.4 Template — Carousel Style

A Carousel template sends multiple rich cards in a single message, displayed as a horizontally scrollable row inside the Messages app. Each card is independent — its own image, title, description, and buttons — but all cards share the same layout size and the same button type structure.

**Two paths for the marketer:**
- **Create a new template inline** — build all cards directly within the node panel
- **Select and edit an existing approved template** — pick from the library and modify before activating

**Message-level fields:**

| Field | Rule |
|-------|------|
| Template Name | Alphanumeric and underscores only, max 20 characters. Must be unique per registered agent. |
| Category | Promotional or Transactional |
| Card Size | Small (180dp wide) or Medium (296dp wide). Applies uniformly to all cards in the carousel — cannot be mixed. |

**Card limits:**

| Property | Rule |
|----------|------|
| Minimum cards | 2 |
| Maximum cards | 10 |

**Per-card fields:**

| Field | Rule |
|-------|------|
| Media | Required per card. Image (JPEG, GIF, PNG — max 2 MB, aspect ratio 2:1 or 4:3) or Video (max 5 MB). All cards must use the same media type — no mixing image and video across cards. |
| Title | Optional. Up to 200 characters. |
| Description | Optional. Up to 1,000 characters per card (shorter than Single's 2,000 — keep card copy punchy). |
| Suggestion Buttons | Optional. Up to 4 buttons per card. Same 6 button types as Basic and Single (§1.2.1). |

**Consistency rules — critical for template creation:**

| Rule | Detail |
|------|--------|
| Card size | Must be the same for all cards — Small or Medium, set at the template level |
| Media type | Must be the same across all cards — all image OR all video. Cannot be mixed. |
| Button count | Should be consistent across cards for a predictable visual layout |
| Button types | Button types can differ per card — unlike WhatsApp carousel, RCS does not require button type consistency across cards |

**Carousel layout dimensions:**

| Card size | Width | Max height (Small) | Max height (Medium) |
|-----------|-------|--------------------|---------------------|
| Small | 180 dp | 542 dp | — |
| Medium | 296 dp | — | 592 dp |

**Template Status lifecycle:** Same as Basic and Single — Draft → Submitted → In Review → Approved / Rejected. Only Approved templates can be activated in a live journey.

**Output ports from Carousel:** Each Quick Reply and Open URL button across all cards creates an output port. If multiple cards share the same button label, they share one output port — the customer exits through that port regardless of which card's button they tapped. Unique button labels create unique ports.

---

### 1.5 Variable Personalization


Variables in the message body, title, or description (e.g. `{{customerName}}`, `{{orderId}}`) are replaced with real customer data at send time. Each variable is mapped to an **OR-chain fallback** — an ordered list of customer attribute sources evaluated top-to-bottom.

**How OR-chain fallback works:**
- At send time, the system evaluates the chain in order
- It uses the first attribute that has a non-empty value for that specific customer
- If all attributes in the chain are empty, the variable renders as blank — the message still sends

**Example:** Variable `{{customerName}}` mapped to:
1. `customer.firstName`
2. `customer.name`
3. *(empty — message sends without the name)*

**Available attribute groups:**

| Group | Attributes |
|-------|-----------|
| Customer | firstName, lastName, name, phone, email, id |
| Order | id, amount, items, trackingUrl, deliveryDate, status |
| Product | name, price, url, imageUrl |
| Store | name, url, supportNumber |

**Variables in button URLs:** Open URL buttons support dynamic URL suffixes. The URL prefix is fixed at template creation; the suffix (e.g. a tracking ID or product slug) can be a personalization variable resolved at send time.

---

### 1.6 Sender Agent

RCS messages are sent from a **registered RCS Business Agent** — a Google-verified brand identity, not a raw phone number. The agent has a display name, a brand logo, and a verified badge that appears in the customer's Messages app.

A brand may have more than one registered agent — for example, separate agents for different regions, product lines, or use cases.

**Rules:**
- Only **active** agents can be selected; inactive agents are visible for reference but not selectable
- The selected agent determines which template library is shown — templates are registered per agent
- The agent's display name and logo are what the customer sees in their inbox, not a phone number

---

### 1.7 Fallback to SMS

When a customer's device or carrier does not support RCS, the node automatically falls back to sending the message as a standard SMS. This is the most important operational difference from WhatsApp — RCS has near-universal reach because every mobile number can receive an SMS.

**Fallback behavior:**

| Condition | What happens |
|-----------|-------------|
| Device supports RCS | Full RCS message sent — media, buttons, formatting all intact |
| Device does not support RCS | Plain text SMS sent — media and buttons are stripped, only the text body is delivered |
| Customer is temporarily offline (RCS) | System retries RCS; after retry window expires, falls back to SMS |

**What the marketer configures for fallback:**
- **SMS fallback body:** A plain-text version of the message body for customers who receive the SMS fallback. This is separate from the RCS body and should be written to make sense without any media or button context.
- If no SMS fallback body is set, the RCS body text is used as-is (formatting markdown characters will appear as raw text in SMS).

**Fallback and analytics:** Messages delivered via SMS fallback are tracked separately in analytics. They count toward Sent but are tagged as SMS delivery — so the marketer can see the split between RCS-delivered and SMS-delivered recipients at the node level.

---

### 1.8 Template Approval

All RCS templates must be reviewed and approved by Google and/or the carrier before they can be used in a live journey. This is handled through the RCS Business Agent registration system — the marketer creates and submits templates within our platform, and the system submits them to the relevant approval authority on their behalf.

**Approval statuses:**

| Status | What it means |
|--------|--------------|
| **Draft** | Template created but not yet submitted for approval |
| **Submitted** | Sent for review; approval typically within 24 hours |
| **In Review** | Under active review by Google/carrier |
| **Approved** | Ready to use in live journeys |
| **Rejected** | Failed review — feedback provided; must be revised and resubmitted as a new version |

**Editing restrictions:**
- Templates that are In Review or Approved **cannot be edited**. The marketer must create a new template version if changes are needed.
- The node surfaces template status so the marketer knows whether the selected template is ready before activating the journey.

**Promotional frequency caps (India):**
Promotional RCS templates are subject to a regulatory cap of **4 promotional messages per customer per month** in India. This is enforced at the carrier level. Transactional templates are exempt from this cap.

---

## 2. Delivery

### 2.1 Smart Retry

When enabled, the system automatically re-attempts delivery if the initial RCS send fails.

| Mode | Behavior |
|------|----------|
| **Smart (recommended)** | System determines retry timing based on failure type and delivery patterns. Retries within a configurable window (default: 72 hours). |
| **Manual** | Marketer defines specific time slots for retry attempts. |

**Rules:**
- Retry only triggers on delivery failure — not on "Not Read" or "No Response"
- If all retries fail and SMS fallback is configured, the fallback SMS is sent at the end of the retry window
- If all retries fail and no SMS fallback is configured, the customer exits through the "Delivery Failed" branch

---

### 2.2 AI Best Sent Time

When enabled, the message is not sent the moment the customer reaches this node. The system holds the send for up to **4 hours** and delivers within the window when that customer historically shows the highest messaging engagement.

**Logic:**
- If the system has engagement history for this customer → sends at the optimal time within the 4-hour window
- If no history exists → sends immediately, no hold
- The 4-hour hold does not delay when the customer advances to the next node — advancement happens when the message is sent, not when it is read

---

## 3. Output Nodes

### 3.1 Routing Modes

**Next Step (single output):** All customers proceed to the same next node regardless of delivery or engagement status. Use when delivery outcome doesn't affect the next action in the journey.

**Delivery Branches (multiple outputs):** The journey branches based on delivery and engagement status. Each selected status becomes a separate output path on the canvas.

---

### 3.2 Delivery Branch Types

| Branch | What it means | Time config |
|--------|--------------|-------------|
| **Sent** | Message left the platform and was accepted by the RCS network | No |
| **Delivered** | Message reached the customer's device | No |
| **Read** | Customer opened and viewed the message | No |
| **Delivery Failed** | Message could not be delivered via RCS (after all retries) and no SMS fallback was triggered | No |
| **No Response After** | Message was sent but no suggestion button interaction was received within a configured time window | Yes — value + unit (minutes / hours / days) |

**Resolution rules (when multiple branches apply):**
- Delivery statuses are progressive: Delivered implies Sent, Read implies Delivered
- The customer exits through the **most specific satisfied branch** — Read takes priority over Delivered, Delivered over Sent
- "No Response After" runs a timer from send time; when the timer expires with no button interaction recorded, the customer exits through this branch
- At least one branch must be selected when Delivery Branches mode is active

**Note on SMS fallback and delivery branches:**
If a message falls back to SMS and the SMS is delivered, it satisfies the "Delivered" branch. If the SMS also fails, the customer exits through "Delivery Failed." RCS Read receipts are not available for SMS fallback — a customer who received the message via SMS will never satisfy the "Read" branch.

---

### 3.3 Button Output Ports

Quick Reply and Open URL suggestion buttons in the configured template each create an **additional output port** on the node, named after the button label.

**Behavior:**
- Customer taps a Quick Reply → exits through that button's output port; the reply text is recorded
- Customer taps an Open URL button → exits through that button's output port; the click is recorded
- Button taps are mutually exclusive — a customer exits through at most one button port
- Customers who exit through a button port do **not** also exit through a delivery branch port
- Dial Phone, Send Location, Get User Location, and Calendar Event buttons do **not** create output ports — these are device-level actions with no platform-observable response

---

### 3.4 Total Output Ports

A node can have both delivery branch ports and button output ports active simultaneously.

**Total ports = delivery branch ports + button output ports**

**Example:** A Single rich card with 2 Quick Reply buttons and 1 URL button, configured with "Read" and "No Response After 24 hours" delivery branches = **5 output ports** on the canvas node.

---

## 4. Node Analytics

In Analytics Mode, the RCS node displays performance metrics inline on the canvas so the marketer can assess node-level impact without leaving the builder.

### Metrics displayed:

| Metric | What it shows |
|--------|--------------|
| **Sent** | Total messages dispatched from this node (RCS + SMS fallback combined) |
| **RCS Delivered %** | Share of sent messages delivered as RCS to the customer's device |
| **SMS Fallback %** | Share of sent messages that fell back to SMS delivery |
| **Read %** | Share of RCS-delivered messages that were opened and read (SMS fallback messages are excluded — read receipts are not available over SMS) |
| **Revenue** | Total attributed revenue from customers who received this message (requires Marketing Attribution to be enabled at the node) |
| **CTA [button label]** | Tap/click count per connectable button (Quick Reply and URL) — one row per button in the template |

**Attribution:** Revenue is credited to this node when a customer who received the message (via RCS or SMS fallback) completes a purchase within the attribution window. Attribution window is configured at the journey or account level.

**What is not shown at node level:** Individual customer events, carrier-level rejection details, device-level RCS capability breakdown. These are available in journey-level or account-level reporting.

---

## Open Questions

1. When a marketer creates a template inline and submits it for approval, does our platform handle the submission to Google/carrier, or does the marketer need to also submit from a separate Google portal?
2. What is the exact SMS fallback trigger — is it checked at send time (device capability known) or does it fall back only after an RCS delivery failure/timeout?
3. For Promotional templates in India, how is the 4-messages-per-month cap tracked — per sender agent, per customer, or globally across all agents for the brand?
4. Should the SMS fallback body be configured at the template level (part of the template definition and approval) or at the node level (set per journey step)?
5. Are there plans to surface the RCS vs SMS fallback split in the delivery branch routing — e.g. a dedicated "Delivered via SMS Fallback" branch?
6. Can Calendar Event and Get User Location buttons receive response data that could be used in later journey steps (e.g. the location the user shared), or is the data inaccessible to the journey?
