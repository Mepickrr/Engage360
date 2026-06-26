# Razorpay Node — Product Design Spec

**Date:** 2026-06-26
**Status:** Foundational draft — open for review
**Audience:** Internal product team
**Scope:** Razorpay payment link generation node within the Flow Builder

---

## Table of Contents

1. [What the Prototype Shows](#0-what-the-prototype-shows)
2. [Feature Brief](#1-feature-brief)
3. [The Job](#2-the-job)
4. [Success Metrics](#3-success-metrics)
5. [Who Uses This and When](#4-who-uses-this-and-when)
6. [User Flows](#5-user-flows)
7. [Functional Specification](#6-functional-specification)
8. [States](#7-states)
9. [Edge Cases](#8-edge-cases)
10. [Non-Functional Requirements](#9-non-functional-requirements)
11. [Analytics & Instrumentation](#10-analytics--instrumentation)
12. [Copy](#11-copy)
13. [Dependencies](#12-dependencies)
14. [Out of Scope](#13-out-of-scope)
15. [Open Questions](#14-open-questions)
16. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

### What's built

- **Canvas node renderer** (`RazorpayNode/index.jsx`): Empty state (dashed border, icon, "Click to configure") and a partially-configured state (gradient header, mandatory field completion badge). Single input handle (top) and single output handle (bottom). No branching ports exist.
- **Right panel** (`RazorpayRightPanel.jsx`): Node label edit, mandatory fields section with a completion counter (x/6), collapsible optional fields section, and a read-only "Saved responses" chip list.
- **Variable picker** (`VariablePicker.jsx`): Per-field variable selection from 8 grouped catalogs. Works for all field types.
- **Field schema** (`data/mockData.js`): 6 mandatory fields, 10 optional fields, 5 saved response keys defined. `defaultRazorpayNodeData` sets label and empty `fieldValues`.

### What's incomplete

- **No connector selection**: There is no way to select which Razorpay account (API credentials) to use. The node assumes a single global account.
- **No output branching**: Only a single source handle exists. Success and failure of link generation are not differentiated. There is no way to route a journey differently when link creation fails.
- **`customerId` field type is wrong**: The mandatory field `customerId` is typed as Number, but Razorpay does not accept a customer identifier — it accepts `customer.name`, `customer.email`, and `customer.contact`. The variable catalog correctly has `customer.id` as a Number, but the API mapping is undefined.
- **`amount` vs `orderAmount` ambiguity**: Two separate amount fields exist with no documented distinction. Razorpay's API takes a single `amount` in the smallest currency unit (paise for INR). What `orderAmount` represents and why it differs from `amount` is undefined.
- **`expire_by` is a raw Number**: The field accepts a Unix timestamp, but the variable catalog has no timestamp variables that would produce the right value. There is no duration-based expiry UI.
- **`completeDraftOrder` and `oldOrderId` are unexplained**: These fields do not map to any Razorpay API parameter. Their purpose — likely platform-level Shopify draft order operations — is not documented anywhere in the node schema.
- **No backend integration**: No API call to Razorpay is implemented. The node is purely a UI scaffold with no runtime behavior.
- **Saved responses are display-only**: The 5 response keys shown in the panel are chips with no description. There is no documentation of what each response key contains or how it maps to a Razorpay API response field.

### What's absent

- Connector/account selection step
- Output port configuration (success / failure branching)
- Currency selection
- Amount unit handling (paise vs rupees)
- Expiry duration configuration
- Node-level analytics
- Any error handling or retry behavior definition

---

## 1. Feature Brief

The Razorpay node generates a payment link against a customer and order within an automated journey. When a customer reaches this node, the platform calls the Razorpay Payment Links API using field values mapped from the customer's context — order amount, contact details, reference ID — and receives back a short payment URL. That URL is stored as a node-level response variable (`response.paymentLink`) which downstream messaging nodes — SMS, WhatsApp, Email — can embed as a placeholder in their templates or attach as a button URL. The node removes the manual step of creating payment links one by one; journeys can now trigger personalized payment requests at scale, timed to the right moment in the customer lifecycle.

---

## 2. The Job

Generate a Razorpay payment link scoped to a specific customer and order, and make that link available to downstream nodes as a usable variable.

**Three things that make it not worth shipping if missing:**

1. The generated payment link must be accessible as `{{response.paymentLink}}` in downstream SMS, WhatsApp, and Email nodes.
2. The journey must branch differently when link creation succeeds versus when it fails — a silently swallowed failure is a missed payment collection opportunity.
3. The amount passed to Razorpay must be correct — wrong units (rupees vs paise) or wrong field mapping is a financial error, not just a UX bug.

---

## 3. Success Metrics

| Metric | Baseline | Target | Window |
|---|---|---|---|
| Payment link generation success rate | N/A (not yet live) | ≥ 97% of executions produce a valid link | 30 days post-launch |
| Link delivery rate (link embedded in downstream message) | N/A | ≥ 95% of success-branched customers receive a message containing the link | 30 days post-launch |
| Node misconfiguration rate (journey publishes with mandatory fields incomplete) | N/A | < 5% of journeys published with Razorpay node | 60 days post-launch |
| API error rate (Razorpay-side rejections due to invalid payload) | N/A | < 1% of executions | 30 days post-launch |

---

## 4. Who Uses This and When

**The retention marketer running a COD-to-prepaid conversion journey**
Their goal: convert cash-on-delivery customers to prepaid before dispatch, since COD return rates are higher. At the moment of use, they are setting up a flow triggered by order placement with COD as payment method. Success: the customer receives a WhatsApp message with a payment link, clicks it, and pays. Failure: the link is never generated, the message goes out with a broken placeholder, or the customer receives no message at all.

**The growth marketer recovering abandoned checkouts**
Their goal: bring back customers who added items to cart and left before paying. At the moment of use, they are designing an abandoned cart flow with a time-delay node followed by the Razorpay node. Success: a unique payment link is generated for the cart value and sent via SMS. Failure: the same link is reused for multiple customers (reference_id collision), or the link expires before the customer sees the message.

**The support team lead automating invoice payment collection**
Their goal: collect payments on overdue invoices without manual intervention. At the moment of use, they are configuring a flow triggered by a custom event from their ERP. Success: a payment link is generated with the invoice amount and sent to the customer. Failure: the amount mapping is wrong (paise vs rupees mismatch) and the customer sees a link for ₹0.50 instead of ₹5,000.

---

## 5. User Flows

### 5.1 Happy path — configuring a Razorpay node

1. Marketer drags the Razorpay node from the palette onto the canvas.
2. Node renders in empty state. Marketer clicks it.
3. Right panel opens. Marketer selects a Razorpay connector from the connector dropdown (step unlocked if ≥1 connector is configured on the account).
4. Mandatory fields section activates. Marketer maps each mandatory field to a variable from the catalog or types a static value.
5. Marketer optionally expands the Optional Fields section and maps additional fields.
6. Marketer reviews the Saved Responses section — the five response keys available downstream are listed with their descriptions.
7. Marketer configures Output Branches: selects "Branching" mode and enables the On Success and On Failure ports.
8. Canvas node shows the two output ports. Marketer wires On Success to a WhatsApp node (which embeds `{{response.paymentLink}}` in a button) and On Failure to a delay + retry path.
9. Journey is published. At runtime, when a customer reaches the node, the platform calls the Razorpay API, stores the response, and routes the customer through the correct branch.

### 5.2 Link generation at runtime

1. Customer reaches the Razorpay node in an active journey.
2. Platform resolves all mapped variables for that customer from their profile and event context.
3. Platform calls `POST /v1/payment_links` with the resolved payload.
4. **On API success (2xx):** Platform stores the response fields under `response.*` keys for that customer's journey session. Customer is routed through the On Success branch.
5. **On API failure (4xx / 5xx / timeout):** No link is stored. Customer is routed through the On Failure branch. The failure reason is logged to journey execution logs.

### 5.3 Downstream use of the generated link

1. Customer exits the Razorpay node through On Success.
2. They enter a WhatsApp node. The template body or a button URL contains `{{response.paymentLink}}`.
3. At send time, the platform resolves `{{response.paymentLink}}` to the `short_url` stored in the journey session for this customer.
4. Message is sent with the personalized payment link.

### 5.4 Failure path — connector not configured

1. Marketer opens an account with no Razorpay connector configured.
2. Marketer drags the Razorpay node onto the canvas and opens the right panel.
3. Connector dropdown shows an empty state with a link to Integrations settings.
4. All mandatory fields are locked — not configurable until a connector is selected.
5. Node cannot be saved/published in this state.

### 5.5 Failure path — mandatory fields incomplete at publish

1. Marketer partially configures the node — maps 4 of 6 mandatory fields.
2. Marketer attempts to publish the journey.
3. Publish is blocked. Validation error surfaces identifying the Razorpay node and the 2 unmapped mandatory fields by name.
4. Canvas highlights the node. Marketer opens the panel and completes the mapping.

---

## 6. Functional Specification

### 6.1 Connector

The marketer selects a Razorpay account connector from the account's configured integrations. The selected connector provides the Key ID and Key Secret used for API authentication.

| Rule | Detail |
|---|---|
| Only active connectors | Inactive or disconnected connectors are shown as disabled options, not hidden |
| Changing the connector | Resets nothing — field mappings are connector-agnostic |
| No connector configured | Mandatory fields are locked; a link to Integrations is shown |
| Single connector on account | Auto-selected; dropdown still visible but pre-filled |

---

### 6.2 Mandatory Fields

All six must be mapped before the node can be included in a published journey.

| Field key | Razorpay API param | Type | Validation | Notes |
|---|---|---|---|---|
| `amount` | `amount` | Number | ≥ 100 (paise), ≤ 50,000,000 (paise) | Input is in **rupees**; the platform multiplies by 100 before sending to Razorpay. Minimum: ₹1. Maximum: ₹5,00,000. Display shows rupee value; Razorpay receives paise. |
| `currency` | `currency` | String (enum) | Must be a supported Razorpay currency code | Default: INR. If the account supports multi-currency, the marketer selects from a dropdown. For most accounts: INR only. |
| `reference_id` | `reference_id` | String | Max 40 characters | Maps to what the mockData calls `orderId`. Used to link the Razorpay payment record back to the platform's order. Must be unique per payment link. If two customers in the same journey have the same `reference_id` value (e.g., both mapped to a static string), the second link creation will fail — see §8 Edge Cases. |
| `description` | `description` | String | Max 2048 characters | What the payment is for. Maps to what the mockData calls `purpose`. Shown on the Razorpay payment page to the customer. |
| `customer.contact` | `customer.contact` | String | Must include country code (e.g., +91XXXXXXXXXX) | Maps to what the mockData calls `phoneNumber`. The platform must prepend `+91` if the stored phone number is 10 digits without a country code — see §8. |
| `customer.name` | `customer.name` | String | Max 50 characters | The Razorpay API does not accept a customer ID — it requires the customer's display name. The existing `customerId` field in mockData.js is incorrect; this field should map to `customer.name`, composed from `customer.first_name` + `customer.last_name` or `customer.name`. |

> **Breaking change from mockData.js:** `customerId` (Number) must be replaced with `customerName` (String) and the Razorpay API call must send `customer.name`, not a numeric ID. The `amount`/`orderAmount` split must be resolved — see §14 Open Questions.

---

### 6.3 Optional Fields

All optional. Collapsed by default in the right panel.

| Field key | Razorpay API param | Type | Default | Behavior |
|---|---|---|---|---|
| `customer.email` | `customer.email` | String | — | Customer's email. If mapped, Razorpay can send its own email notification (controlled by `notify.email`). |
| `expire_by_duration` | `expire_by` | Duration (hours) | 168 hours (7 days) | Marketer sets a number of hours after which the link expires. The platform computes the Unix timestamp at execution time by adding the duration to `now()`. Maximum: 4380 hours (6 months). Not a raw Unix timestamp — see §15 Decision Log. |
| `upi_link` | `upi_link` | Boolean | false | When true, generates a UPI payment link instead of a standard link. UPI links only support INR. |
| `notify.sms` | `notify.sms` | Boolean | false | When true, Razorpay sends its own SMS notification to the customer's contact number. Independent of the platform's SMS node. |
| `notify.email` | `notify.email` | Boolean | false | When true, Razorpay sends its own email notification. Only effective if `customer.email` is mapped. |
| `reminder_enable` | `reminder_enable` | Boolean | false | When true, Razorpay sends automated reminders to the customer before the link expires. |
| `callback_url` | `callback_url` | String | — | URL the customer is redirected to after completing payment on the Razorpay hosted page. |
| `accept_partial` | `accept_partial` | Boolean | false | When true, allows the customer to pay in installments. Requires `first_min_partial_amount` if enabled. |
| `first_min_partial_amount` | `first_min_partial_amount` | Number (rupees) | — | Minimum first installment amount in rupees. Platform converts to paise. Only active when `accept_partial` is true. |
| `notes` | `notes` | Key-value | — | Up to 15 custom key-value pairs attached to the Razorpay payment record. Useful for internal tagging. Max 256 chars per value. |

> **Fields removed from mockData.js:** `completeDraftOrder`, `oldOrderId` — these are platform-level order management operations, not Razorpay API parameters. Their behavior must be specified separately if they are to remain — see §14 Open Questions. `description` in optional fields is renamed to `notes` since `description` is mandatory (§6.2).

---

### 6.4 Saved Responses

Variables produced by this node and available to downstream nodes via `{{response.<key>}}` syntax.

| Response key | Source (Razorpay API field) | Type | Description |
|---|---|---|---|
| `response.paymentLink` | `short_url` | String | The shortened Razorpay payment URL. Primary variable for embedding in messages. |
| `response.paymentLinkId` | `id` | String | Razorpay's internal ID for the payment link. Use for lookup, cancellation, or status polling. |
| `response.referenceId` | `reference_id` | String | The reference ID echoed back from Razorpay. Confirms which order this link is for. |
| `response.amountRequested` | `amount` ÷ 100 | Number | The link amount in rupees (converted from paise). Useful for display in message templates (e.g., "Pay ₹{{response.amountRequested}}"). |
| `response.linkStatus` | `status` | String | Status of the link at creation time — always `created` on success. Available for logging and conditional logic downstream. |

Response variables are available only to nodes placed after the On Success branch. Nodes on the On Failure branch do not have access to response variables — the link was not created.

---

### 6.5 Output Branches

The node has two routing modes, configured in the right panel.

**Next Step (default):** All customers proceed to the same downstream node regardless of link generation outcome. Use only when failure is acceptable and no downstream action depends on the link URL. If On Failure behavior is not configured, failed executions are logged silently and the customer advances — this is not recommended.

**Branching:** Two output ports appear on the canvas.

| Port | ID | When it fires | Color |
|---|---|---|---|
| On Success | `on_success` | Razorpay API returns 2xx and a valid `short_url` | Green |
| On Failure | `on_failure` | API returns 4xx/5xx, times out, or `short_url` is absent in the response | Red |

At least one port must be wired when Branching mode is active. If On Failure is not wired, a warning is shown on the canvas node — not a block, since the marketer may intentionally choose to not handle failure — but the warning is persistent until the port is wired.

---

### 6.6 Node Label

Free-text, editable. Default: `Create Payment Link`. Max 60 characters. Shown in the canvas node header and in journey execution logs.

---

## 7. States

| State | Trigger | What the user sees | Available actions | System behavior | How it exits |
|---|---|---|---|---|---|
| **Empty** | Node dragged to canvas, not yet configured | Dashed border, Razorpay icon, "Click to configure" label | Click to open right panel | No validation runs | User opens right panel |
| **No connector** | Right panel opened, no active Razorpay connector on account | Connector dropdown shows empty state with "Connect Razorpay" link | Navigate to Integrations | Mandatory fields are disabled | User configures connector in Integrations and returns |
| **Partially configured** | Some but not all mandatory fields mapped | Solid border, mandatory field badge shows x/6 in amber | Edit fields, add optional fields | Node cannot be included in a publishable journey | User maps all mandatory fields |
| **Fully configured** | All 6 mandatory fields mapped | Badge turns green (6/6), node header shows label | Edit, wire output ports | Node is publishable | — |
| **Publishing validation failure** | User attempts to publish journey with mandatory fields incomplete | Error banner identifying the node and missing fields | Return to node and complete fields | Journey publish is blocked | User completes configuration |
| **Runtime — executing** | Customer reaches node in active journey | Not visible to marketer in real time | — | Platform resolves variables, calls Razorpay API | API responds (success or failure) |
| **Runtime — success** | Razorpay API returns 2xx with `short_url` | Analytics footer increments success counter | — | Response variables stored in journey session; customer routed to On Success | Customer exits node |
| **Runtime — failure** | API returns error or times out | Analytics footer increments failure counter | — | No response variables stored; error logged; customer routed to On Failure | Customer exits node |
| **Runtime — variable missing** | A mandatory field resolves to empty at execution time | — | — | Execution halts for that customer; customer is routed to On Failure; error logged as "missing required field: [field name]" | Customer exits node via On Failure |

---

## 8. Edge Cases

**`reference_id` collision across customers in the same journey**
Situation: Two customers in the same journey have an identical resolved `reference_id` value — for example, the field is mapped to a static string instead of a unique order variable.
Wrong behavior: Second link creation fails with a 400 from Razorpay, customer is silently routed to On Failure.
Correct behavior: Same as above (the API correctly rejects duplicates), but the error logged must clearly state "reference_id already used" so the marketer can debug the mapping. The platform must not retry with the same reference_id.

**Phone number without country code**
Situation: `customer.contact` is stored as a 10-digit number without `+91` (common for Indian contacts).
Wrong behavior: Razorpay rejects the request with "invalid contact" error.
Correct behavior: The platform detects a 10-digit numeric string with no leading `+` and prepends `+91` before sending. If the number is already prefixed, no change. If the number is in an unrecognized format (e.g., 9 digits, or alphanumeric), route to On Failure with error: "Invalid phone number format."

**Amount of zero or below minimum**
Situation: The resolved `amount` is ₹0 or below ₹1 (Razorpay minimum).
Wrong behavior: API call is made and fails with 400.
Correct behavior: Platform validates the resolved amount before making the API call. If `amount` resolves to < 100 paise (< ₹1), skip the API call, log "amount below minimum (₹1)", and route to On Failure.

**Amount above Razorpay maximum**
Situation: Resolved amount exceeds ₹5,00,000 (Razorpay's standard limit for payment links).
Wrong behavior: API call fails with a limit error.
Correct behavior: Pre-flight validation catches this; customer routed to On Failure with reason logged. Note: Razorpay's limit can vary by account type — the platform should surface the API error reason verbatim in the execution log rather than hardcoding a threshold.

**`expire_by` in the past**
Situation: The duration-based expiry, when added to execution time, produces a timestamp that is in the past — or the marketer sets 0 hours.
Wrong behavior: Razorpay rejects the request.
Correct behavior: Minimum expiry duration is 1 hour. If `expire_by_duration` resolves to 0 or negative, the node uses the default (168 hours / 7 days). A validation warning — not a block — appears in the right panel if the configured duration is less than 1 hour.

**`expire_by` exceeds 6-month Razorpay limit**
Situation: Marketer sets duration to more than 4380 hours (6 months).
Wrong behavior: Razorpay rejects the request.
Correct behavior: Platform caps the value at 4380 hours before sending. The right panel shows "Maximum: 6 months" as a field hint.

**Customer has no email, but `notify.email` is true**
Situation: `customer.email` is not mapped or resolves to empty, but the marketer has enabled `notify.email`.
Wrong behavior: Razorpay silently ignores the email notification.
Correct behavior: No error — Razorpay handles this gracefully. The platform does not need to validate this combination. Documented behavior.

**`upi_link` enabled with non-INR currency**
Situation: Marketer selects `upi_link: true` and a non-INR currency.
Wrong behavior: API call fails with a currency/UPI incompatibility error.
Correct behavior: Right panel disables currency selection and locks it to INR when `upi_link` is toggled on. Tooltip explains: "UPI links only support INR."

**`accept_partial` enabled without `first_min_partial_amount`**
Situation: Marketer enables partial payments but does not set a minimum first payment.
Wrong behavior: Razorpay uses a default minimum (100 paise = ₹1), which may not match business intent.
Correct behavior: When `accept_partial` is toggled on, `first_min_partial_amount` becomes a required optional field — it surfaces as mandatory within the optional section with an amber indicator. Journey can still publish without it, but a warning appears in the panel.

**Variable resolves to the wrong type**
Situation: `amount` is mapped to a String variable (e.g., `order.status`) that resolves to "pending" at runtime.
Wrong behavior: Platform sends "pending" as the amount to Razorpay; API returns a type error.
Correct behavior: Variable picker enforces type matching — Number fields only show Number-typed variables from the catalog. If a static value is entered, the panel validates it is numeric before saving.

**Razorpay API timeout**
Situation: The API call does not return within the platform's timeout window.
Wrong behavior: Customer is stuck in the node indefinitely.
Correct behavior: Platform applies a 10-second timeout on the Razorpay API call. On timeout, customer is routed to On Failure with reason "API timeout." No retry is attempted — retrying a payment link creation can result in duplicate links.

**Customer reaches node twice in the same journey (re-entry)**
Situation: A journey allows re-entry and the same customer reaches the Razorpay node a second time with the same `reference_id` mapping.
Wrong behavior: Second API call fails due to duplicate `reference_id`; customer goes to On Failure.
Correct behavior: This is expected behavior and is not a platform bug — the marketer must ensure that `reference_id` produces a unique value per execution (e.g., by appending a timestamp or using a unique event property). The execution log surfaces the Razorpay rejection reason clearly.

**Journey published without On Failure port wired**
Situation: Marketer uses Branching mode but does not connect the On Failure port.
Wrong behavior: Customers who fail link generation have no exit path and are silently dropped.
Correct behavior: A persistent warning indicator on the canvas node reads "On Failure port not connected — failed customers have no exit path." Journey can still publish (it is not a blocking error), but the warning remains visible in both build and review modes.

---

## 9. Non-Functional Requirements

**Performance**
The Razorpay API call must complete within 10 seconds. The platform enforces a hard timeout at that threshold. P95 of API calls at Razorpay's end is typically under 500ms — the timeout is a safety ceiling for outliers.

**Scale**
The node must support execution for journeys that trigger simultaneously for thousands of customers (e.g., a broadcast journey sent to a segment of 50,000). The platform's execution infrastructure must not serialize Razorpay API calls — each customer's execution is independent and concurrent.

**Security**
Razorpay Key ID and Key Secret must never be stored in the flow node's `data` object or in any client-accessible location. They are stored only in the connector record in the integrations service and are resolved server-side at execution time. The connector ID (not credentials) is stored in the node's `fieldValues`.

API calls to Razorpay must be made from the server side. The payment link short URL returned in the response is safe to store and surface in message templates — it is a public URL by design.

**Reliability**
If the integrations service is unavailable at execution time (cannot retrieve the connector credentials), the node routes to On Failure rather than hanging. Error logged: "Connector credentials unavailable."

Razorpay payment link creation is not idempotent by default — if the same API call is made twice, two links are created. The platform must not retry on timeout or on ambiguous failure — only route to On Failure and log.

**Idempotency**
If the platform's own infrastructure causes a duplicate execution of the same node for the same customer (e.g., due to a queue retry), the platform must check whether a `paymentLinkId` already exists in the journey session for that customer before calling the API again. If it does, use the existing link.

---

## 10. Analytics & Instrumentation

| Event | Trigger | Properties |
|---|---|---|
| `razorpay_node_executed` | Node begins execution for a customer | `journey_id`, `node_id`, `customer_id`, `connector_id` |
| `razorpay_link_created` | Razorpay API returns success | `journey_id`, `node_id`, `customer_id`, `payment_link_id`, `amount_paise`, `currency`, `expire_by_unix` |
| `razorpay_link_failed` | API returns error or times out | `journey_id`, `node_id`, `customer_id`, `error_code`, `error_description`, `http_status` |
| `razorpay_node_configured` | Marketer saves node configuration | `journey_id`, `node_id`, `mandatory_fields_filled`, `optional_fields_filled`, `branching_mode`, `connector_id` |

**Node-level analytics (shown in Analytics Mode on canvas):**

| Metric | Definition |
|---|---|
| Executed | Total number of times this node ran for a customer |
| Links Created | Count of successful link generations |
| Failed | Count of failed link generations |
| Success Rate | Links Created ÷ Executed × 100 |

---

## 11. Copy

**Empty state label:** "Click to configure"

**Connector dropdown empty state:** "No Razorpay account connected. Go to Integrations to connect one."

**Mandatory field badge (incomplete):** "{n}/{total} fields mapped"

**Mandatory field badge (complete):** "All fields mapped"

**Publish validation error:** "Razorpay node '{node label}' has {n} unmapped mandatory field(s): {field names}. Map all mandatory fields before publishing."

**On Failure port unconnected warning (canvas):** "On Failure not connected — failed customers have no exit path"

**UPI + non-INR tooltip:** "UPI payment links only support INR. Currency is locked."

**expire_by field hint:** "Number of hours before the link expires. Maximum: 4,380 hours (6 months). Default: 168 hours (7 days)."

**Phone number auto-prefix note:** Shown inline below the `customer.contact` field when the mapped variable is known to produce 10-digit values: "Country code +91 will be added automatically if absent."

**Runtime execution log — missing variable:** "Razorpay node '{node label}': required field '{field name}' resolved to empty. Customer routed to On Failure."

**Runtime execution log — API failure:** "Razorpay node '{node label}': API returned {http_status} — {error_description}. Customer routed to On Failure."

---

## 12. Dependencies

| Dependency | What is needed | If unavailable |
|---|---|---|
| Razorpay Payment Links API (`POST /v1/payment_links`) | Create the payment link | Route customer to On Failure; log error |
| Integrations service | Resolve connector credentials (Key ID + Key Secret) | Route customer to On Failure; log "connector unavailable" |
| Journey execution engine | Resolve `{{variable}}` placeholders to customer attribute values at runtime | If a mandatory variable cannot be resolved, route to On Failure |
| Variable catalog | Surface correct variable options per field type in the right panel | Config-time only; no runtime impact |
| Downstream messaging nodes (SMS, WhatsApp, Email) | Consume `{{response.paymentLink}}` in templates | No dependency at node level — the Razorpay node stores the variable; whether it is used downstream is the marketer's choice |

---

## 13. Out of Scope

**Payment status tracking (paid, expired, cancelled):** The Razorpay node creates a payment link — it does not poll or receive webhooks about whether the customer actually paid. Payment status events from Razorpay (via webhook) are a separate integration concern. A "Payment Received" trigger node is not part of this spec.

**Razorpay Checkout (embedded checkout):** This node generates a hosted payment link (a URL). The embedded Razorpay checkout widget is not in scope.

**Bulk payment link generation:** Generating multiple links in a single node execution (e.g., one per cart item) is not supported. One node execution = one link.

**Link management (cancel, update, resend):** The node creates links — it does not cancel or update existing ones. Managing the lifecycle of a created link (e.g., cancelling it if the customer completes payment through another channel) is out of scope.

**`completeDraftOrder` and `oldOrderId`:** These fields appear in the current mockData.js optional fields. They do not correspond to any Razorpay API parameter. If they represent platform-level order operations (e.g., completing a Shopify draft order before creating a payment link), they must be specified separately. They are excluded from this spec until that behavior is defined.

**Multi-currency:** INR only for the initial release, matching the platform's primary market. Currency field defaults to INR and is hidden unless the account has multi-currency enabled on their Razorpay account.

---

## 14. Open Questions

| Question | Why it's open | Owner | What resolves it |
|---|---|---|---|
| What is `orderAmount` for, and how does it differ from `amount`? The mockData has both as separate mandatory fields, but the Razorpay API takes a single `amount`. | The distinction is unclear from the code — `orderAmount` may be a display amount in rupees while `amount` is in paise, or they may be two different platform concepts (cart total vs payment link amount). | Product | Decision on whether `orderAmount` is a display field, a separate platform data point, or redundant. See §15. |
| What do `completeDraftOrder` and `oldOrderId` do? | They appear in optional fields but have no Razorpay API mapping. They may be Shopify draft order operations that need to run before link creation. | Engineering | Engineering to confirm: are these pre-flight API calls to the platform's order service? If yes, they need their own spec section. |
| Should there be a platform-level unique constraint on `reference_id` per journey run? | If the marketer maps `reference_id` to a non-unique value (e.g., a static string), the second customer will fail. The platform could either warn at config time or enforce uniqueness. | Product | Decide: warn-only at config time, or enforce that the mapped variable is not a static string. |
| Is the phone number auto-prefix (+91) always correct? | India-only journeys may be safe to assume +91. International journeys are not. If the platform serves merchants with customers outside India, auto-prefixing +91 is wrong. | Product | Confirm the platform's country scope for the initial release. |
| Does the platform need to support Razorpay's `notes` field as a configurable mapping, or is it populated automatically from system context? | Notes can carry up to 15 key-value pairs — useful for tagging payment links with journey metadata (e.g., journey_id, node_id). If auto-populated by the platform, no marketer config needed. | Engineering | Decide what is auto-populated and whether the marketer needs to configure anything additional. |

---

## 15. Decision Log

**`expire_by` exposed as duration (hours), not raw Unix timestamp**
Decision: The optional field lets the marketer enter a number of hours (e.g., 48). The platform computes the Unix timestamp at execution time by adding the duration to the moment the node executes.
Alternatives considered: (1) Let the marketer enter a raw Unix timestamp — rejected because timestamps are fixed-point and would expire for all customers at the same moment, regardless of when they each hit the node. (2) Let the marketer map a variable that produces a timestamp — rejected because the variable catalog has no timestamp-producing variables that the Razorpay use case would naturally populate.
Tradeoff: Duration-based expiry is always relative to execution time, which is correct behavior for journey-based sending. Absolute expiry across an entire segment is not supported — and that is intentional.

**Amount input in rupees; platform converts to paise**
Decision: All amount fields in the node UI accept values in rupees (human-readable). The platform multiplies by 100 before sending to Razorpay.
Alternatives considered: Accepting paise directly — rejected because marketers think in rupees, and a misconfigured field that sends ₹50,000 when ₹500 was intended is a financial error with no easy recovery.
Tradeoff: The platform owns the unit conversion, which must be documented and tested. The field hint reads "Enter amount in ₹ (rupees)."

**No retry on API failure**
Decision: If the Razorpay API fails or times out, the platform routes to On Failure without retrying.
Alternatives considered: Auto-retry once after 30 seconds — rejected because Razorpay link creation is not idempotent. A timeout does not guarantee the first request was not processed; retrying could create a duplicate payment link for the same customer and order.
Tradeoff: Failure handling is the marketer's responsibility via the On Failure branch. The marketer can wire a delay + retry via a different journey path if needed.

**`customerId` field in mockData.js must be replaced**
Decision: The existing `customerId: Number` mandatory field does not map to any Razorpay API parameter. It must be replaced with `customerName: String` mapping to `customer.name`. The Razorpay API uses customer display name, email, and contact — not an internal platform customer ID.
Tradeoff: This is a breaking change to the existing mockData.js schema. The UI field must be relabeled and retyped. Any existing journey nodes configured with `customerId` must be migrated.

---

*Sources consulted:*
- [Razorpay — Create a Standard Payment Link](https://razorpay.com/docs/api/payments/payment-links/create-standard/)
- [Razorpay — Create a UPI Payment Link](https://razorpay.com/docs/api/payments/payment-links/create-upi/)
- [Razorpay — Payment Links API overview](https://razorpay.com/docs/api/payments/payment-links/)
