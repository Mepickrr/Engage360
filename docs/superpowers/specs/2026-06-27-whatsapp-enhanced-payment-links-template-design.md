# WhatsApp Enhanced Payment Links Template — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft — requires engineering verification against Meta docs before implementation
**Audience:** Internal product team
**Scope:** Enhanced Payment Links template style within the WhatsApp node

---

## What This Is

Enhanced Payment Links is an upgraded version of the standard Payment Links template. The core mechanic is the same — send a payment request via WhatsApp — but the customer experience is richer: instead of tapping a button that opens a browser payment page, the payment screen opens natively inside WhatsApp and shows more context about what the customer is paying for before they confirm.

Use cases: same as Payment Links — invoice collection, custom order payment, overdue payment follow-up — but for sellers who want a more polished in-app experience rather than a browser redirect.

**How this fits alongside the standard Payment Links template:**

| | Payment Links | Enhanced Payment Links |
|---|---|---|
| Payment screen location | Opens in browser (external) | Opens natively inside WhatsApp |
| Product/item context shown | No — just amount and description | Yes — item image, name, and breakdown |
| Merchant branding | Basic | Logo and business name on payment screen |
| WhatsApp Pay support | Depends on provider | Native WhatsApp Pay integration |

**Important constraints:**
- **India only.** Part of WhatsApp's India payments infrastructure.
- **Requires Meta approval.** Template shell must be approved before use.
- **Utility category only.** Must be for a real, specific payment request.

> **Note:** This is a newer Meta feature. The field-level details below should be verified against Meta's current documentation before implementation begins. Open questions are flagged at the end.

---

## What the Seller Fills In

### Part 1 — Template shell (created once, submitted for approval)

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | Unique internal name. Lowercase letters and underscores only. |
| Language | Yes | Language the message is written in. |
| Header | No | Optional text or image above the body. |
| Body | Yes | The main message text. Can include personalisation placeholders (e.g. customer name, amount, item name). Max 1,024 characters. |
| Footer | No | Small grey text below the message. Max 60 characters. No personalisation. |
| Button label | Yes | The text on the payment button (e.g. "Pay now", "Complete payment"). Max 20 characters. |

---

### Part 2 — Payment data (populated at send time, per customer)

| Field | Required | Notes |
|---|---|---|
| Payment reference ID | Yes | Unique ID for this payment request. Returned in the payment confirmation. |
| Amount | Yes | The payment amount in rupees. |
| Description | No | A short label for what the payment is for (e.g. "Invoice #1042"). Shown on the in-app payment screen. Max 60 characters. |
| Link expiry | No | Duration the payment button stays active. |

#### Item details (optional — what makes this "enhanced")

These fields populate the richer product context shown on the in-app payment screen. If omitted, the experience falls back to a basic amount + description display.

| Field | Required | Notes |
|---|---|---|
| Item name | No | The product or service being paid for. Shown prominently on the payment screen. Max 60 characters. |
| Item image | No | An image of the product or service. Shown on the payment screen. |
| Item quantity | No | Number of units. |
| Unit price | No | Price per unit in rupees. |
| Additional items | No | Up to a small number of additional line items (exact limit to be confirmed with Meta docs). |

#### Merchant branding (optional)

| Field | Required | Notes |
|---|---|---|
| Business logo | No | The seller's logo shown on the payment screen. Pulled from the connected WhatsApp Business Account if not overridden. |

---

## What the Customer Sees

The customer receives the message with:
- The body text
- A payment button at the bottom

When the customer taps the button, a native payment screen opens inside WhatsApp (no browser) showing:
- Merchant name and logo
- Item name, image, and breakdown (if provided)
- Total amount to pay
- Payment options: WhatsApp Pay (UPI, saved cards)

The customer confirms and pays without leaving WhatsApp.

---

## What Comes Back After the Customer Acts

| Event | What the platform receives |
|---|---|
| Customer completes payment | Payment confirmation with transaction ID, amount paid, payment method, payment reference ID, and timestamp |
| Customer opens payment screen but does not pay | No event |
| Customer ignores the message | No event |
| Payment link expires | No event — button becomes inactive |

---

## Key Constraints

- **India only.** Native WhatsApp Pay and Indian payment infrastructure.
- **Meta approval required.** Template shell approved once; payment data is dynamic.
- **Utility only.** Cannot be used for unsolicited promotional payment pushes.
- **Payment reference ID must be unique per send.** Reusing IDs causes matching errors.
- **Item fields are optional but recommended.** Without item details, the enhanced experience is not meaningfully different from standard Payment Links. Sellers should use standard Payment Links if they have no item context to show.
- **Business logo pulled from WABA by default.** Sellers who want a custom logo per message must upload it at send time (to be confirmed).

---

## Relationship to Other Payment Templates

Use this decision guide when the seller is choosing a payment template:

| Situation | Recommended template |
|---|---|
| Need to show full order line items with totals before collecting payment | Order Details |
| Customer has a pending cart; order doesn't exist yet | Checkout Button |
| Need to send a payment request with product context, paid natively in WhatsApp | Enhanced Payment Links |
| Need to send a payment request, browser checkout is acceptable | Payment Links |

---

## Open Questions

| Question | Owner |
|---|---|
| What is the exact maximum number of line items supported on the in-app payment screen? | Engineering — verify against Meta docs |
| Is business logo configurable per send, or fixed to the WhatsApp Business Account profile? | Engineering — verify against Meta docs |
| Does Enhanced Payment Links require a specific Meta partner or payment provider tier, or is it available to all India WABA accounts? | Engineering |
| Is the fallback to browser checkout automatic if WhatsApp Pay is not available for a customer, or does the message fail to send? | Engineering |
| How does this interact with the Razorpay node — does the Razorpay node still generate the underlying payment link, or does Meta generate it natively? | Product + Engineering |
