# WhatsApp Order Status Template — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Order Status template style within the WhatsApp node

---

## What This Is

An order status template lets a seller send a structured WhatsApp notification that tells the customer what happened to their order or payment — confirmed, shipped, delivered, refunded, and so on. The message shows the order reference and a clear status label alongside the body text.

Use cases: payment confirmation after WhatsApp Pay, order confirmation, shipment notification, out-for-delivery alert, delivery confirmation, cancellation notice, refund update.

**Important constraints:**
- **India only.** This template is part of the WhatsApp Payments (India) ecosystem. It uses the structured order status component that Meta provisions for Indian payment flows.
- **Requires Meta approval.** Same process as Standard and Order Details templates.
- **Utility category only.** Status updates are transactional by nature. Marketing category is not allowed.

---

## What the Seller Fills In

### Part 1 — Template shell (created once, submitted for approval)

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | Unique internal name. Lowercase letters and underscores only. |
| Language | Yes | Language the message is written in. |
| Header | No | Optional text or image above the body. |
| Body | Yes | The main message text. Can include personalisation placeholders (e.g. customer name, order reference). Max 1,024 characters. |
| Footer | No | Small grey text below the status block. Max 60 characters. No personalisation. |
| Buttons | No | Up to 2 buttons — a URL button (e.g. "Track order") or a Quick Reply button (e.g. "Contact support"). Optional. |

---

### Part 2 — Order status data (populated at send time, per customer)

The seller maps these to order and customer variables from the journey. They resolve to real values when the message is sent.

| Field | Required | Notes |
|---|---|---|
| Order reference ID | Yes | The order or transaction ID shown to the customer. Used to identify which order this update is about. |
| Order status | Yes | The status to display. See supported statuses below. |
| Status description | No | A short note giving more context on the status (e.g. "Your refund will reflect in 3–5 business days"). Max 60 characters. |
| Payment amount | No | The amount associated with the update (e.g. amount refunded). In rupees. |

#### Supported order statuses

| Status | When to use |
|---|---|
| Payment pending | Payment initiated but not yet confirmed |
| Payment received | Payment successfully captured |
| Payment failed | Payment attempt was unsuccessful |
| Order confirmed | Order placed and accepted |
| Order processing | Order is being prepared or packed |
| Order shipped | Order dispatched from warehouse |
| Out for delivery | Order with delivery agent, arriving today |
| Order delivered | Order successfully delivered |
| Order cancelled | Order cancelled by seller or customer |
| Order returned | Customer return accepted |
| Refund initiated | Refund process started |
| Refund completed | Refund successfully credited |

---

## What the Customer Sees

The customer receives the message with:
- The body text
- A structured status block showing the order reference ID and the current status label
- The status description (if provided)
- Payment amount (if provided)
- Any buttons configured on the template

There is no action required from the customer — this is an informational message. Buttons are optional and link to external tracking pages or trigger a Quick Reply.

---

## What Comes Back After Sending

Order status templates are one-way notifications. The platform does not receive a response from the customer unless a Quick Reply button is tapped.

| Event | What the platform receives |
|---|---|
| Customer taps a Quick Reply button | The button's reply text, used to route the journey |
| Customer taps a URL button | No event — opens a browser link |
| Customer ignores | No event |

---

## Key Constraints

- **India only.** The structured order status component is part of Meta's India payments infrastructure.
- **Meta approval required.** The template must be approved before use. The status data is dynamic and not part of the approval.
- **Utility only.** Must relate to a real transaction or order event.
- **One status per message.** A single send shows one status update. To send multiple updates across a journey (confirmed → shipped → delivered), the seller creates one template and sends it at each relevant journey step with the appropriate status mapped.
- **No payment collection.** Unlike the Order Details template, no payment button or UPI flow is involved. This template informs — it does not collect.

---

## Open Questions

| Question | Owner |
|---|---|
| Does Meta enforce that the order reference ID matches a prior Order Details message, or can this template be used independently for any order? | Engineering |
| Are all 12 statuses listed above supported by Meta's current API, or is the supported list smaller? | Engineering |
| Can a Quick Reply on this template re-enter a journey (e.g. tap "Return item" → triggers a return flow)? | Product |
