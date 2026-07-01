# WhatsApp Order Details Template — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Order Details template style within the WhatsApp node

---

## What This Is

An order details template lets a seller send a WhatsApp message that shows the customer a full order summary — items, quantities, prices, totals — with a button to pay or confirm directly in chat. No link, no redirect to a browser checkout.

Use cases: send order summary after checkout, collect payment for a COD-to-prepaid conversion, share invoice before dispatch, confirm order details with the customer.

**Important constraints:**
- **India only.** This template works with Indian payment providers (Razorpay, PayU, Cashfree, Paytm, and others). It is not available for international orders.
- **Requires Meta approval.** Unlike address and list messages, this is a proper template that must be submitted and approved before use — same process as Standard templates.
- **Utility category only.** This template cannot be created as a Marketing template.

---

## What the Seller Fills In

### Part 1 — Template shell (created once, submitted for approval)

This is the fixed message frame that gets approved by Meta. The actual order data (items, prices) fills in dynamically when the message is sent.

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | Unique internal name. Lowercase letters and underscores only. |
| Language | Yes | Language the message is written in. |
| Header | No | Optional text or image above the body. |
| Body | Yes | The main message text. Can include personalisation placeholders (e.g. customer name, order reference number). Max 1,024 characters. |
| Footer | No | Small grey text below the order summary. Max 60 characters. No personalisation. |
| Payment type | Yes | **Prepaid** (customer pays in WhatsApp via UPI or card) or **Cash on Delivery** (customer confirms the order). This determines what the action button does. |
| Button label | Yes | The text on the action button. For prepaid: e.g. "Review and Pay". For COD: e.g. "Confirm Order". Max 20 characters. |

---

### Part 2 — Order data (populated at send time, per customer)

The seller maps these fields to customer and order variables from the journey. They are not filled in at template creation — they resolve to real values when the message is sent.

#### Order items

Each item in the order requires:

| Field | Required | Notes |
|---|---|---|
| Item name | Yes | The product name shown to the customer. Max 60 characters. |
| Quantity | Yes | Number of units. |
| Unit price | Yes | Price per item in rupees. Shown to the customer. |
| Original price | No | The original price before any discount, shown as a strikethrough. Used to show a sale price. |
| Image | No | A product image shown alongside the item. |

Up to 99 items per order.

#### Order totals

| Field | Required | Notes |
|---|---|---|
| Subtotal | Yes | Sum of all item prices before adjustments. |
| Shipping | No | Shipping charge in rupees. |
| Tax | No | Tax amount in rupees. |
| Discount | No | Discount amount in rupees. Shown as a deduction. |
| Total | Yes | The final amount the customer pays or confirms. |

#### Payment settings (prepaid orders only)

| Field | Required | Notes |
|---|---|---|
| Payment provider | Yes | The connected payment gateway (Razorpay, PayU, Cashfree, etc.) |
| Payment reference ID | Yes | A unique ID for this transaction. Used to match the payment confirmation back to the order. |

---

## What the Customer Sees

The customer receives the message with:
- The body text from the template
- A structured order summary showing all items with quantities and prices
- The totals breakdown (subtotal, shipping, tax, discount, final total)
- The action button at the bottom

For **prepaid**: tapping the button opens the WhatsApp Pay flow where the customer completes payment via UPI or saved card without leaving WhatsApp.

For **COD**: tapping the button confirms the order. No payment is collected at this step.

---

## What Comes Back After the Customer Acts

| Event | What the platform receives |
|---|---|
| Customer completes payment (prepaid) | Payment confirmation with transaction ID, amount paid, payment method, and timestamp |
| Customer confirms order (COD) | Order confirmation event with the order reference ID and timestamp |
| Customer dismisses / ignores | No event — the message stays in chat with the button available until it expires |

The payment reference ID the seller set at send time is returned in the confirmation, allowing the platform to match the payment back to the right order and customer.

---

## Key Constraints

- **India only.** Tied to Indian payment infrastructure — UPI, Indian cards, Indian payment gateways.
- **Meta approval required.** The template shell must be approved before use. The order data is dynamic and does not go through approval.
- **Utility only.** Cannot be used for promotional messages. The order details must relate to a real transaction.
- **Prepaid and COD are separate templates.** The payment type is set at template creation — a single template cannot support both modes. Sellers who need both flows will have two templates.
- **Price must be in rupees.** All amounts are in INR. No multi-currency support.
- **Payment link expires.** For prepaid orders, the payment session has a time limit set by the payment provider. After expiry, the button becomes inactive.

---

## Open Questions

| Question | Owner |
|---|---|
| Which payment providers are connected on the platform — does the seller pick a provider at template creation or at send time? | Engineering |
| If the payment fails (e.g. UPI timeout), does the platform receive a failure event, or only success? Is there a failure branch on the journey node? | Engineering |
| Can the seller resend the same order details message if the customer ignores the first one — or does the duplicate reference ID cause a conflict? | Product |
| Is there a way to cancel or invalidate a payment link after sending — e.g. if the customer calls in and pays via another channel? | Product |
