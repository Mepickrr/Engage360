# SMS Node — Product Design Spec

**Date:** 2026-06-22
**Status:** Foundational draft — open for additional layers
**Audience:** Internal product team, designers
**Scope:** SMS channel node within the Flow Builder

---

## Node Purpose & Conceptual Model

SMS is the most universally reachable messaging channel — every mobile number can receive it, no app install or internet connection required. For India specifically, all business SMS is governed by the **DLT (Distributed Ledger Technology)** regulatory framework mandated by TRAI, which requires every message to be sent from a pre-registered entity using a pre-approved template and a registered sender header. This compliance layer is the defining characteristic of the SMS node.

**What makes SMS different as a channel:**

- **Universal reach:** No app, no data connection required. If a customer has a mobile number, they can receive an SMS.
- **DLT-regulated (India):** All business-initiated SMS to Indian numbers must use pre-approved templates registered on the DLT portal. Messages that don't match an approved template are rejected by the telecom operator before delivery.
- **No rich media or interactive buttons:** SMS is plain text only. No images, no buttons, no carousels. The only interactive element is a URL the customer can tap.
- **No read receipts:** Delivery signals are limited to Sent, Delivered, and Failed. There is no read or open signal.
- **Pre-synced templates:** Templates are created and registered externally (in the SMS provider's platform and on the DLT portal) and synced into the flow builder. Inline template creation is not supported for SMS.

**What the SMS node does in a journey:**
The SMS node sends a DLT-compliant, pre-approved SMS template to the customer as a step in an automated journey. The marketer selects a connector, picks a registered sender header, chooses an approved template, maps personalization variables, and configures how the journey branches next based on delivery outcome.

---

## 1. Configuration

The node panel follows a sequential four-step configuration chain. Each step unlocks the next.

### 1.1 Connector

The marketer selects an SMS provider connector from a dropdown of all active integrations configured on the account (e.g. Gupshup, Kaleyra). The selected connector determines:
- Which sender IDs (headers) are shown in step 1.2
- Which template library is shown in step 1.3

**Rules:**
- Only **active** connectors are selectable. Inactive connectors are visible for reference but greyed out.
- Changing the connector resets the sender ID and template selection.

---

### 1.2 Sender ID (Header)

The marketer selects a **registered DLT header** from the dropdown filtered to the selected connector. The sender ID is the alphanumeric or numeric identifier that appears as the sender name in the customer's SMS inbox (e.g. `ACMEMK`, `ACMETX`).

**Rules:**
- Each sender ID is tagged with its **category** — Promotional or Transactional — since this is a regulatory classification that determines delivery rules and DND eligibility.
- The **Principal Entity ID** (the brand's registered TRAI entity identifier) is configured at the account level and submitted automatically at send time. It is not surfaced in the node UI.
- Only sender IDs registered against the selected connector are shown.
- Changing the sender ID does not reset the template selection, but the selected template must be registered under the new sender ID — if not, the template selection is cleared.

---

### 1.3 Template

The marketer selects a **pre-synced, approved SMS template** from the library filtered to the selected connector.

**What is shown:**
- Template name
- Truncated preview of the template body text
- Template category (Promotional or Transactional)

**Rules:**
- Only **approved** templates are selectable. Pending or rejected templates are not shown.
- Templates are synced from the SMS provider — no inline creation within the flow builder.
- The DLT Template ID associated with the selected template is submitted automatically at send time. It is surfaced read-only in the node for reference.
- Changing the template resets the variable mapping in step 1.4.

---

### 1.4 Variable Mapping

Once a template is selected, the system parses all `#var#` placeholders from the DLT template body and surfaces them for mapping. Each placeholder becomes a named variable the marketer maps to customer attribute sources.

**How OR-chain fallback works:**

Each variable is mapped to an **OR-chain** — an ordered list of customer attribute sources evaluated top-to-bottom at send time. The system uses the first attribute that has a non-empty value for that customer. If all attributes in the chain are empty, the variable renders as blank and the message still sends.

**Example:** Variable `#var1#` mapped to:
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

**Message preview:** A live preview of the resolved message body is shown below the variable mapping, using sample attribute values to illustrate how the final message will appear.

**URL variables:** If the template body contains a URL placeholder, it can be mapped to a tracked/shortened link. Shortened links expire after 15 days. Special characters are not supported in shortened links. Attribute names used in URL variables cannot contain spaces.

---

## 2. Delivery

### 2.1 Smart Retry

When enabled, the system automatically re-attempts delivery if the initial SMS send fails.

| Mode | Behavior |
|------|----------|
| **Smart (recommended)** | System determines retry timing based on failure type. Retries within a configurable window (default: 72 hours). |
| **Manual** | Marketer defines specific time slots for retry attempts. |

**Rules:**
- Retry only triggers on delivery failure — not on no-response or no-click.
- If all retries fail, the customer exits through the "Failed" branch.

---

### 2.2 AI Best Sent Time

When enabled, the message is not sent the moment the customer reaches this node. The system holds the send for up to **4 hours** and delivers within the window when that customer historically shows the highest messaging engagement.

**Logic:**
- If the system has engagement history for this customer → sends at the optimal time within the 4-hour window
- If no history exists → sends immediately, no hold
- The 4-hour hold does not delay when the customer advances to the next node — advancement happens when the message is sent

---

### 2.3 DND (Do Not Disturb)

**Promotional SMS** to numbers registered on India's national DND registry are blocked at the telecom operator level. DND scrubbing is enforced by the SMS provider at send time — it does not require marketer configuration in the node.

**Rules:**
- DND blocking applies only to Promotional sender IDs. Transactional SMS is exempt from DND restrictions.
- DND-blocked numbers are counted in node analytics but do not consume message quota.
- The node does not expose DND configuration — this is a provider-level enforcement.

---

## 3. Output Nodes

### 3.1 Routing Modes

**Next Step (single output):** All customers proceed to the same next node regardless of delivery outcome. Use when delivery status doesn't affect the next action in the journey.

**Delivery Branches (multiple outputs):** The journey branches based on delivery status. Each selected status becomes a separate output path on the canvas.

---

### 3.2 Delivery Branch Types

| Branch | What it means | Time config |
|--------|--------------|-------------|
| **Sent** | Message dispatched from the platform and accepted by the provider | No |
| **Delivered** | Message confirmed delivered to the customer's handset | No |
| **Failed** | Message could not be delivered after all retries | No |
| **No Response After** | Message sent but no tracked URL click recorded within a configured time window | Yes — value + unit (minutes / hours / days) |

**Resolution rules:**
- Delivery statuses are progressive: Delivered implies Sent.
- The customer exits through the **most specific satisfied branch** — Delivered takes priority over Sent.
- "No Response After" runs a timer from send time. When the timer expires with no URL click recorded, the customer exits through this branch.
- At least one branch must be selected when Delivery Branches mode is active.

**UI hint — No Response After:** If the selected template contains no tracked URL, the node surfaces an inline hint that "No Response After" tracks URL clicks and may not be meaningful without a tracked link in the message body.

---

### 3.3 No Button Output Ports

SMS has no interactive buttons. There are no button output ports on the SMS node. All customer routing is through delivery branches or the single Next Step output.

---

### 3.4 Total Output Ports

**Total ports = delivery branch ports only** (1 to 4, depending on which delivery branches are enabled).

---

## 4. Node Analytics

In Analytics Mode, the SMS node displays performance metrics inline on the canvas.

| Metric | What it shows |
|--------|--------------|
| **Sent** | Total messages dispatched from this node |
| **Delivered %** | Share of sent messages confirmed delivered to handset |
| **Failed %** | Share of sent messages that failed after all retries |
| **DND Blocked** | Count of numbers skipped due to DND registration (Promotional only) |
| **Clicked %** | Share of delivered messages where a tracked URL was tapped (shown only if template contains a tracked link) |
| **Revenue** | Total attributed revenue from customers who received this message (requires Marketing Attribution enabled at the node) |

**What is not shown at node level:** Individual customer delivery events, carrier-level rejection details, provider-level error codes. These are available in journey-level or account-level reporting.

**No Read %:** SMS does not return read receipts. No per-button CTA breakdown — SMS has no interactive buttons.

---

## Open Questions

1. When templates are synced from the provider, how frequently does the sync run — on-demand, scheduled, or real-time via webhook?
2. If a template is de-approved on the DLT portal after being used in a live journey, what happens to in-flight sends — do they fail or does the provider still deliver?
3. Is the DLT Template ID always embedded in the synced template record, or does the marketer ever need to manually enter it?
4. For the "No Response After" branch — should it be gated/hidden when the selected template has no tracked URL, or shown with a warning?
5. Are there plans to surface Promotional vs Transactional send volume split in analytics, since these are regulated differently?
6. Does the platform support multiple Principal Entity IDs per account (e.g. for brands operating multiple legal entities), or is one Entity ID configured per account?
