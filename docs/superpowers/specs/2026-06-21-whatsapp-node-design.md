# WhatsApp Node — Product Design Spec

**Date:** 2026-06-21
**Status:** Foundational draft — open for additional layers
**Audience:** Internal product team, designers
**Scope:** WhatsApp channel node within the Flow Builder

---

## Node Purpose & Conceptual Model

WhatsApp is a high-intent, personal messaging channel. Unlike email or SMS, **every message sent through WhatsApp must use a Meta-approved template** — freeform text is not allowed for business-initiated messages. This constraint shapes the entire node: the primary job of the WhatsApp node is to let a marketer select a template style, configure and personalize it with customer data, and then control what the journey does next based on how the customer interacts with that message.

**What makes WhatsApp different as a channel:**

- **Template-gated:** Every message uses a pre-approved template. Templates are submitted to Meta for approval before they can be used. Approval is not instant.
- **Rich delivery signals:** WhatsApp returns receipts at four levels — Sent, Delivered, Read, Failed. More granular than email, making delivery-based branching significantly more powerful.
- **Multiple message formats:** Beyond simple text+image, WhatsApp supports carousels, product catalogs, payment links, location pins, and more — each as a distinct template style.
- **Interactive buttons:** Templates can include Quick Reply and URL buttons. Tapping a button routes the customer down a specific journey path.
- **Sender identity:** Messages are sent from a registered WhatsApp Business Account (WABA) number. A brand may operate multiple WABA numbers for different regions, brands, or use cases.

---

## 1. Configuration

### 1.1 Template Style

The first decision in configuring the node is choosing the **template style** — the structural format of the WhatsApp message. There are 9 styles:

| Style | What it is | When to use |
|-------|-----------|-------------|
| **Standard** | Text body with optional image, video, or document header, plus up to 3 buttons | Default for most marketing and utility messages |
| **List** | Scrollable list of up to 10 sections with selectable items | Menu-style choices, product categories, FAQ options |
| **Carousel** | A single message bubble followed by 2–10 horizontally swipeable cards, each with a media header, body text, and up to 2 buttons | Showcasing multiple products, promotions, or content pieces where each item needs its own CTA |
| **Address** | Shares a delivery or pickup address with a map preview | Order delivery updates, store locations |
| **Catalog** | Sends a message with a fixed "View Catalog" CTA that opens the brand's entire WhatsApp-linked product catalog for the customer to browse | Full catalog browsing, product discovery |
| **Single Product** | Sends a product detail card for one specific item from the catalog — image, name, price, description, and an add-to-cart action | Targeted product pushes, cart recovery for a specific item |
| **Multi Product** | Sends up to 30 products organized in up to 10 labelled sections, with an in-chat browsable shopping interface | Curated collections, category promotions, multi-item cart recovery |
| **Payment Link** | Sends a UPI or payment link directly in chat | Checkout, dues collection |
| **Call Permission** | Sends a Meta-generated consent request asking the customer to allow the business to call them via WhatsApp. Customer can grant temporary (7-day) or permanent permission, or decline. | Pre-call consent flows before using WhatsApp Business Calling |
| **Audio** | Shares a voice note or audio clip | Voice announcements, tutorials |
| **Location** | Shares a static or live location pin | Delivery tracking, event venues |

**Critical distinction:** Only the **Standard** style supports inline template creation within the flow builder. All other styles require the template to be created and approved in WhatsApp Business Manager first, then selected from the library inside the builder.

Once a style is selected, it is locked for that node. Changing style resets the template selection and all configuration associated with it.

---

### 1.2 Template — Standard Style

Standard is the most flexible template style. It supports inline creation within the flow builder and comes in three sub-styles that the marketer selects when configuring the template:

| Sub-style | Best for |
|-----------|----------|
| **Basic** | General marketing and utility messages — product announcements, order updates, re-engagement |
| **Limited Time Offer (LTO)** | Promotions with an offer code and a live countdown timer |
| **Coupon Code** | Sharing a discount code the customer can copy to their clipboard in one tap |

For Standard templates, the marketer has two paths:

- **Create a new template inline** — configure all fields directly within the node
- **Select an existing approved template** — pick from the brand's template library

**Template Status lifecycle:** Draft → Uploaded → In Review → Active / Rejected / Paused. Only **Active** templates can be sent in a live journey. The node surfaces the current status so the marketer knows whether the template is usable before the journey goes live.

**AI Enhance:** Available on all Standard sub-styles. Generates Friendly, Persuasive, or Urgent tone variants of the body copy. Generative assist only — the marketer reviews and selects.

---

#### 1.2.1 Basic Standard Template

The default Standard template. Full flexibility on header, body, footer, and buttons.

| Field | Rule |
|-------|------|
| Template Name | Internal identifier (snake_case). Used in reporting and API references. |
| Category | Marketing (promotional), Utility (transactional/operational), or Conversational (session-based — planned, not active in v1) |
| Language | Language of the message body. Determines which customer segment this template can reach. |
| Header | Optional. Image, video, document, or plain text. |
| Body | Required. The message text. Supports personalization variables in `{{variable}}` format. |
| Footer | Optional. Static text below the body. Typically used for opt-out instructions. |
| Buttons | Up to 3 buttons: Quick Reply (triggers a reply), Website URL (opens a link), Phone Number (initiates a call). Each button label max 20 characters. |

---

#### 1.2.2 Limited Time Offer (LTO) Template

A marketing-only sub-style that adds an offer code and a live countdown timer to the message. The customer sees the offer code with a ticking timer and can copy the code or visit the promotion URL directly from chat.

**What the customer sees:**
- The seller's body text
- An offer title (the headline of the deal)
- A live countdown timer showing time remaining (if an expiry is set)
- A "Copy Code" button that copies the offer code to their clipboard
- A "Visit Website" button linking to the promotion

**What the seller configures:**

| Field | Rule |
|-------|------|
| Body text | Required. Up to 600 characters. Supports personalization variables. |
| Offer title | Required. Up to 16 characters. The headline name of the offer (e.g. "Flash Sale"). |
| Offer code | Required. Up to 15 characters. The actual promo code (e.g. `SAVE20`). |
| Expiration timer | Optional. The seller sets an expiry timestamp **at send time, not at template creation**. The timer displayed is computed from the timestamp at the moment the customer receives the message. |
| Visit Website button | Required. A URL button the customer can tap to go to the promotion landing page. |
| Copy Code button | Included automatically — copies the offer code to the customer's clipboard on tap. |
| Footer | Not supported in LTO templates. |
| Header | Required. Can be image, video, or text. |

**Key constraints:**
- Marketing category only — cannot be used for Utility or Conversational templates
- The expiry timestamp is passed at send time, meaning the same template can be reused for multiple campaigns with different expiry windows — no re-approval needed for different expiry dates
- **Mobile only** — customers viewing the message on WhatsApp Web or desktop will not see the offer or timer. They receive a notice that the message is not supported on their current client. This is a Meta platform constraint.
- The "Copy Code" button label is fixed — it cannot be renamed

---

#### 1.2.3 Coupon Code Template

A marketing-only sub-style focused on a single action: giving the customer a discount code they can copy instantly. Simpler than LTO — no timer, no expiry, just a code and a one-tap copy action.

**What the customer sees:**
- A text header (the campaign hook)
- The seller's body text with personalization (customer name, discount value, etc.)
- A "Copy Code" button — tapping it copies the coupon code to their clipboard

**What the seller configures:**

| Field | Rule |
|-------|------|
| Header | Required. Text only. The campaign headline (e.g. "Black Friday is here!"). |
| Body text | Required. Supports personalization variables — commonly used for customer name, discount percentage, and code. |
| Coupon code | Required. Up to 15 characters. Alphanumeric only. This is the value copied to clipboard when the customer taps the button. |
| Copy Code button | Included automatically — one per template, label is fixed and cannot be renamed. |
| Additional buttons | Quick Reply buttons can be added alongside the Copy Code button. A URL button can also be included. |
| Footer | Optional. |

**Key constraints:**
- Marketing category only
- One "Copy Code" button per template — no more
- Coupon code is alphanumeric only, max 15 characters
- **Mobile only** — not supported on WhatsApp Web or desktop client
- The "Copy Code" button label is system-defined — it cannot be customised

---

### 1.3 Variable Personalization

Variables in the message body (e.g. `{{$1}}`, `{{customer.firstName}}`) are replaced with real customer data at send time. Each variable is mapped to an **OR-chain fallback** — an ordered list of customer attribute sources.

**How OR-chain fallback works:**
- At send time, the system evaluates the chain top-to-bottom
- It uses the first attribute that has a non-empty value for that specific customer
- If all attributes in the chain are empty for a customer, the variable renders as blank — the message still sends

**Example:** Variable `{{$1}}` mapped to:
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

---

### 1.4 Template — Non-Standard Styles

For all styles except Standard, templates must be created and Meta-approved via WhatsApp Business Manager before they can be used in the flow builder. The node offers only a **library selector** — no inline creation within the builder.

This applies to: List, Carousel, Address, Payment Link, Call Permission, Audio, Location, and the three Commerce styles (Catalog, Single Product, Multi Product).

**Exceptions with dedicated specs below:**
- Carousel — see §1.4.1 for full field-level specifications
- Commerce templates (Catalog, Single Product, Multi Product) — see §1.4.2 for full specifications and how the seller configures them within the flow builder

---

### 1.4.1 Carousel Template — Detailed Specifications

Carousel is the only non-Standard style documented here in detail because its structure is meaningfully different from a single-message template and has several consistency constraints sellers need to understand before creating one in WhatsApp Business Manager.

**What a Carousel template is made of:**

A Carousel template has two distinct layers — a **message bubble** that sits above the cards, and the **cards** themselves that the recipient scrolls through horizontally.

**Layer 1 — Message Bubble (above the cards)**

The message bubble is the main body text of the template — it appears once, above all the cards. It provides context or a headline for what the cards below contain.

| Property | Rule |
|----------|------|
| Character limit | Up to 1,024 characters |
| Variables | Supported — personalization tokens (e.g. `{{customer.firstName}}`) can be used |
| Footer | Not supported in Carousel templates |

**Layer 2 — Cards**

Each card is an independent unit with its own media, text, and action buttons.

| Property | Rule |
|----------|------|
| Minimum cards | 2 |
| Maximum cards | 10 |
| Scroll direction | Horizontal — recipients swipe left/right |

**Card Header (media) — required on every card**

| Property | Rule |
|----------|------|
| Supported types | Image or Video — one type must be chosen and applied consistently across all cards |
| Image formats | JPEG, JPG, PNG |
| Image max size | 5 MB |
| Image max resolution | 1,920 × 1,920 px |
| Video formats | MP4, 3GPP |
| Video max size | 16 MB |
| Consistency rule | **All cards in a carousel must use the same media type.** You cannot mix images and videos across cards. |

**Card Body (text) — required on every card**

| Property | Rule |
|----------|------|
| Character limit | Up to 160 characters per card |
| Variables | Supported — each card body can include personalization tokens |

**Card Buttons — 1 or 2 per card**

| Property | Rule |
|----------|------|
| Maximum buttons per card | 2 |
| Supported button types | Quick Reply, URL (website link), Phone Number |
| Button label limit | 20 characters per button |
| Consistency rule | **Button types must be the same across all cards in the same position.** If card 1 has a Quick Reply as button 1 and a URL as button 2, every other card must follow the same pattern. You cannot mix button types in the same slot across cards. |
| Mixing types per card | Allowed — a single card can have one Quick Reply and one URL button |

**Key constraints for sellers setting this up in WhatsApp Business Manager:**

1. **Decide media type before you start** — once set, you cannot mix images and videos across cards in the same template. Create a separate template if you need both.
2. **Plan your button layout across all cards first** — the button type in each slot must be identical across all cards. Changing the button type on one card means updating all cards.
3. **Card body is shorter than Standard** — 160 characters per card vs. 1,024 in the Standard message bubble. Keep card copy punchy.
4. **Template must be approved by Meta before it appears in the flow builder** — Carousel templates cannot be created inline. The seller creates and submits the template in WhatsApp Business Manager, waits for approval, then selects it in the node.

**When to use Carousel vs. Standard:**

| Situation | Use |
|-----------|-----|
| Sending a single product or offer with one CTA | Standard |
| Sending 2–10 distinct products/offers, each needing its own image and CTA | Carousel |
| Sending a multi-step guided experience (onboarding steps, a recipe, a how-to) | Carousel |
| Body copy needs to be longer than 160 characters per item | Standard (one template per item) |

---

### 1.4.2 Commerce Templates — Catalog, Single Product, Multi Product

Commerce templates are a distinct category of WhatsApp message that connect directly to a seller's product inventory. Unlike Standard or Carousel templates — where the seller writes and uploads the content — commerce templates pull product data (images, names, prices, descriptions) live from the seller's connected WhatsApp catalog. This means the seller configures *which products* to show and *what surrounding message* to send; the product content itself is owned and maintained in the catalog.

**Shared prerequisite for all three commerce types:**
The seller's Facebook product catalog must already be connected to their WhatsApp Business Account. Commerce setup, catalog sync, and inventory management are handled outside the flow builder (assumed complete). Within the flow builder, the seller selects products and writes message copy — they do not manage the catalog itself here.

---

#### Catalog Template

A Catalog template sends a single message that gives the customer a direct entry point into the seller's entire product catalog — viewable without leaving WhatsApp.

**What the customer receives:**
- A product thumbnail (from the catalog — seller selects which product's image acts as the preview)
- The seller's custom body text providing context or a prompt
- A fixed CTA button labelled **"View Catalog"** — this label cannot be changed
- When tapped, the customer browses all available products in the catalog within WhatsApp

**What the seller configures in the flow builder:**

| Field | Rule |
|-------|------|
| Body text | Required. Up to 1,024 characters. Supports personalization variables (OR-chain fallback applies). |
| Footer | Optional. Up to 60 characters. Typically used for opt-out or tagline text. |
| Thumbnail product | Optional. Seller selects one product from the catalog whose image appears as the preview. If not set, Meta selects one automatically. |
| CTA button | Fixed — always reads "View Catalog". Cannot be renamed or replaced. |

**How it differs from Standard:**
- No custom header media (image/video uploaded by seller) — the thumbnail is pulled from the catalog
- No custom button label — "View Catalog" is fixed by Meta
- No Quick Reply or URL buttons — the only interactive element is the catalog CTA

**Output node behaviour:** The Catalog template does not produce button output ports. Delivery branch routing (Sent / Delivered / Read / Failed) applies normally.

---

#### Single Product Message (SPM) Template

A Single Product Message sends a focused, product detail card for one specific item from the catalog. The customer sees the product exactly as it exists in the catalog — image, name, price, description — and can add it to a WhatsApp cart directly from the message.

**What the customer receives:**
- The product's image, name, price, and description (all pulled automatically from the catalog)
- The seller's custom body text (shown above the product card)
- An optional footer
- An in-chat "Add to Cart" and "View" action on the product card

**What the seller configures in the flow builder:**

| Field | Rule |
|-------|------|
| Product selection | Required. Seller selects one product from the connected catalog. The product is referenced by its catalog product ID — the product name, image, and price are pulled automatically. |
| Body text | Required. Up to 1,024 characters. Supports personalization variables. |
| Footer | Optional. Up to 60 characters. |
| Header | Not applicable — the product image serves as the visual header. |

**Key constraints:**
- Only one product per message — for multiple products, use Multi Product template
- Product data is live from the catalog — if the product's price or image changes in the catalog, the message reflects the current catalog state at send time
- The customer must be on WhatsApp v2.22.24 or later to see the interactive product card

**Output node behaviour:** No button output ports. Delivery branches apply normally.

---

#### Multi Product Message (MPM) Template

A Multi Product Message sends a curated selection of up to 30 products, organized into labelled sections, in a single in-chat shopping interface. The customer can browse all products, view individual details, add items to a WhatsApp cart, and submit their cart as an order — all without leaving WhatsApp.

**What the customer receives:**
- A header (text-only)
- The seller's body text providing context or a promotional message
- A browsable product list organized by sections — each section has a title and contains product cards
- The first product in the first section is used as the message thumbnail
- An optional footer
- In-chat cart and order submission capability

**What the seller configures in the flow builder:**

| Field | Rule |
|-------|------|
| Header | Required. Text only (no image/video). Serves as the title of the message. |
| Body text | Required. The main message above the product list. Supports personalization variables. |
| Footer | Optional. Up to 60 characters. |
| Sections | Up to 10 sections. Each section requires a title and at least one product. |
| Products | Up to 30 products in total across all sections. Products are selected from the connected catalog. The first product added to the first section becomes the message thumbnail. |

**Seller workflow for configuring an MPM in the flow builder:**
1. Write the header text and body copy
2. Add sections — give each section a label (e.g. "Best Sellers", "New Arrivals")
3. Within each section, select products from the catalog (product name, image, price are auto-populated from catalog)
4. Review the product order — the first product in section 1 becomes the thumbnail
5. Optionally add a footer

**Key constraints:**
- Maximum 30 products total across all sections
- Maximum 10 sections
- Header is text-only — no image or video header supported
- MPM messages cannot be forwarded by the customer to others
- Customer must be on WhatsApp v2.22.24 or later
- If a product referenced in the MPM is removed from the catalog before the message is sent, the send will fail for that customer — catalog accuracy matters

**Output node behaviour:** No button output ports. Delivery branches (Sent / Delivered / Read / Failed / No Response After) apply normally.

---

#### Commerce Templates — Shared Considerations for the Flow Builder

**Variable personalization:** Body text in all three commerce template types supports personalization variables with OR-chain fallback (same system as Standard templates). Header text in MPM also supports variables.

**Template approval:** Commerce templates (Catalog, SPM, MPM) require Meta approval before use in a live journey. They are created and submitted via WhatsApp Business Manager, then selected from the template library in the flow builder — no inline creation.

**Fallback template:** If a commerce template fails to send (e.g. product out of sync, catalog disconnected), the fallback template logic applies — a fallback template is sent if one is configured, otherwise the customer exits through the Delivery Failed branch.

**Analytics:** Commerce nodes display the same analytics metrics as other WhatsApp nodes (Sent, Delivered %, Read %, Revenue). Revenue attribution is particularly meaningful here since commerce templates are directly tied to product purchases.

---

### 1.4.3 Call Permission Template — Detailed Specifications

Call Permission is a special-purpose template that exists solely to obtain customer consent before placing an outbound WhatsApp call. WhatsApp Business Calling requires explicit permission from the customer — this template is the mechanism for requesting it within a journey.

**What makes it different from other templates:**
- The template message itself is **generated and owned by Meta**, not written by the seller. Sellers do not create this template in WhatsApp Business Manager — it is auto-provisioned per language under the format `whatsapp_call_permission_request_{language_code}` (e.g. `whatsapp_call_permission_request_en`).
- The seller's only configuration is the **body text** — the reason why they want to call. The buttons and permission mechanics are handled entirely by WhatsApp.

**What the customer sees:**
- The seller's custom body text explaining why the business wants to call
- Two system-generated buttons:
  - **"Allow"** — grants calling permission
  - **"Decline"** — denies permission

When the customer taps "Allow," WhatsApp presents a follow-up choice:
- **Temporary** — grants permission for 7 days
- **Permanent** — grants permission indefinitely

**What the seller configures in the flow builder:**

| Field | Rule |
|-------|------|
| Language | Determines which pre-built template is used (one exists per supported language) |
| Body text | The reason for the call. Best practice: be specific — e.g. "We'd like to call you to confirm delivery of your order." Vague requests get lower acceptance rates. |
| Buttons | System-generated. Cannot be changed. "Allow" and "Decline" are always the options. |

**Rate limits and expiry — important for journey design:**

| Rule | Detail |
|------|--------|
| Requests per day | Maximum 1 permission request per customer per 24 hours |
| Requests per week | Maximum 2 permission requests per customer in any 7-day period |
| Expiry | If the customer does not respond, the request expires after 7 days |
| Re-request | After expiry or decline, a new request can be sent (subject to rate limits) |

**Permission duration options (customer's choice):**
- Temporary: valid for 7 days from acceptance
- Permanent: valid indefinitely unless revoked by the customer

**Designing the journey around Call Permission:**

Since the customer has three possible outcomes (accepted temporary, accepted permanent, or declined / no response), the output branches for this node should be configured accordingly:

| Outcome | Recommended branch |
|---------|--------------------|
| Customer accepts | Route to a "Call" node or a follow-up in the journey |
| Customer declines | Route to an alternative channel (e.g. SMS or email) |
| No response after N days | Route to a fallback branch — do not re-request immediately due to rate limits |

**Key constraints:**
- The seller cannot modify the button labels or the permission-granting mechanics
- Only the message body is seller-authored
- Calling itself (after permission is granted) is handled outside this node — this node only requests consent
- Rate limits are enforced by Meta — sending this node more than once per 24 hours to the same customer will result in the second message being blocked

---

### 1.7 Sender Number (WABA)

Each message is sent from a specific registered WhatsApp Business Account number. The marketer selects the WABA number for this node.

**Rules:**
- Only **active** WABA numbers can be selected; inactive numbers are visible for reference but not selectable
- The selected WABA number determines which template library is available — templates are scoped to the account that owns them

---

### 1.8 Fallback Template

A secondary template that is sent **if the primary template fails to deliver**.

**When the fallback triggers:**
- Primary template delivery failure (device unreachable, template rejected at send time, etc.)
- The fallback must be from the same WABA number's approved template library

**Behavior chain:**
1. Primary template send attempted
2. If primary succeeds → fallback is never used; customer proceeds normally
3. If primary fails AND a fallback is configured → fallback template is sent
4. If primary fails AND no fallback is configured → node logs a failure; customer exits through the "Delivery Failed" output branch (if configured), or is dropped from the journey

The fallback can use any approved template style, independent of the primary style.

---

## 2. Delivery

### 2.1 Marketing Attribution

Marks this node's messages for revenue attribution. When enabled, any purchase made by the customer within the attribution window after receiving this message is credited to this node in analytics.

- Default **On** for Marketing category templates
- Default **Off** for Utility templates

---

### 2.2 UTM Tracking

When enabled, UTM parameters are appended to all URLs in the template (button links and body links) at send time. This enables attribution in downstream analytics tools.

**Five parameters:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`

UTM values are applied at send time — changing them does not require re-submitting the template for Meta approval.

---

### 2.3 AI Best Sent Time

When enabled, the message is not sent the moment the customer reaches this node. The system holds the send for up to **4 hours** and delivers it within the window when that customer historically shows the highest WhatsApp engagement.

**Logic:**
- If the system has engagement history for this customer → sends at the optimal time within the 4-hour window
- If no history exists → sends immediately, no hold
- The 4-hour hold does not delay when the customer advances to the next node — advancement happens when the message is sent, not when it is read

---

### 2.4 Smart Retry

When enabled, the system automatically re-attempts delivery if the initial send fails.

| Mode | Behavior |
|------|----------|
| **Smart (recommended)** | System determines retry timing based on failure type and delivery patterns. Retries within a configurable window (default: 72 hours). |
| **Manual** | Marketer defines specific time slots for retry attempts. |

**Rules:**
- Retry only triggers on delivery failure — not on "Not Read" or "No Response"
- WhatsApp's 24-hour marketing messaging window applies — retries that fall outside this window may not succeed
- If all retries fail, the customer exits through the "Delivery Failed" branch

---

## 3. Output Nodes

### 3.1 Routing Modes

**Next Step (single output):** All customers proceed to the same next node regardless of delivery or engagement status. Use when delivery outcome doesn't affect the next action in the journey.

**Delivery Branches (multiple outputs):** The journey branches based on delivery and engagement status. Each selected status becomes a separate output path on the canvas.

---

### 3.2 Delivery Branch Types

| Branch | What it means | Time config |
|--------|--------------|-------------|
| **Sent** | Message left the platform and was accepted by WhatsApp's network | No |
| **Delivered** | Message reached the customer's device | No |
| **Read** | Customer opened and viewed the message | No |
| **Delivery Failed** | Message could not be delivered (after all retries, if Smart Retry is on) | No |
| **Not Read** | Message was delivered but not read within the journey's wait period | No |
| **No Response After** | Message was sent but no button interaction was received within a configured time window | Yes — value + unit (minutes / hours / days) |

**Resolution rules (when multiple branches apply to one customer):**
- Delivery statuses are progressive: Delivered implies Sent, Read implies Delivered
- The customer exits through the **most specific satisfied branch** — Read takes priority over Delivered, Delivered over Sent
- "No Response After" runs a timer from send time; when the timer expires with no button interaction recorded, the customer exits through this branch
- At least one branch must be selected when Delivery Branches mode is active

---

### 3.3 Button Output Ports

Each Quick Reply and URL button in the configured template creates an **additional output port** on the node, named after the button label.

**Behavior:**
- Customer taps a Quick Reply or URL button → exits through that button's specific output port
- Button taps are mutually exclusive — a customer exits through at most one button port
- Customers who exit through a button port do **not** also exit through a delivery branch port
- Once a button port route is taken, the customer does not re-enter any other branch from this node

**Constraint with UTM:** When button ports are active, link click events are captured as button port routing events. UTM-based link click tracking works differently in this mode — the click registers as a port event first.

---

### 3.4 Total Output Ports

A node can have both delivery branch ports and button ports active simultaneously.

**Total ports = delivery branch ports + button ports**

**Example:** A Standard template with 2 Quick Reply buttons + "Read" and "No Response After 24 hours" delivery branches = **4 output ports** on the canvas node.

---

## 4. Node Analytics

In Analytics Mode, the WhatsApp node displays performance metrics inline on the canvas so the marketer can assess node-level impact without leaving the builder.

### Metrics displayed:

| Metric | What it shows |
|--------|--------------|
| **Sent** | Total messages dispatched from this node |
| **Delivered %** | Share of sent messages that reached the customer's device |
| **Read %** | Share of sent messages that were opened and read |
| **Revenue** | Total attributed revenue from customers who received this message (requires Marketing Attribution enabled) |
| **CTA [button label]** | Click count per button — one row per button in the template |

**Attribution:** Revenue is credited to this node when a customer who received the message completes a purchase within the attribution window. Attribution window is configured at the journey or account level.

**What is not shown at node level:** Unsubscribes, spam reports, individual customer events. These are available in journey-level or account-level reporting.

---

## Open Questions

1. Should templates created inline via "Create New" be auto-submitted to Meta for approval, or remain in Draft until the seller manually submits from WhatsApp Business Manager?
2. How does the fallback template trigger precisely — only on delivery failure, or also on template rejection or customer opt-out?
3. For Conversational templates (future v2), what is the fallback behaviour when no active user session exists — send fallback template, skip the node, or hold until a session opens?
4. Should WABA numbers be manageable within the flow builder (add/remove), or only in a separate account settings area?
5. Is Smart Retry bounded by WhatsApp's 24-hour marketing messaging window — and if so, how is this surfaced to the marketer?
