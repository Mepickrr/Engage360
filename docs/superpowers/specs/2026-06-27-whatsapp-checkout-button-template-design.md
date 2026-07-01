# WhatsApp Checkout Button Template — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Checkout Button template style within the WhatsApp node

---

## What This Is

A checkout button template lets a seller send a WhatsApp message with a button that takes the customer directly into a checkout experience to complete a pending purchase. Unlike the Order Details template — which shows an already-created order and collects payment — the checkout button is used when no order exists yet. The order is created only after the customer pays.

Use cases: abandoned cart recovery (customer left before paying), re-engaging a customer who browsed but didn't buy, completing a quote or consultation that ended with a pending purchase.

**Important constraints:**
- **India only.** Part of the WhatsApp Payments (India) ecosystem. Works with Indian payment providers and WhatsApp Pay.
- **Requires Meta approval.** Template shell must be approved before use.
- **Utility category only.** Directly tied to a real pending transaction.

---

## What the Seller Fills In

### Part 1 — Template shell (created once, submitted for approval)

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | Unique internal name. Lowercase letters and underscores only. |
| Language | Yes | Language the message is written in. |
| Header | No | Optional text or image above the body. |
| Body | Yes | The main message text. Can include personalisation placeholders (e.g. customer name, cart value, product name). Max 1,024 characters. |
| Footer | No | Small grey text below the message. Max 60 characters. No personalisation. |
| Button label | Yes | The text on the checkout button (e.g. "Complete purchase", "Checkout now", "Pay now"). Max 20 characters. |

---

### Part 2 — Checkout data (populated at send time, per customer)

The seller maps these fields to customer and cart variables from the journey. They are not filled in at template creation — they resolve per customer when the message is sent.

| Field | Required | Notes |
|---|---|---|
| Cart reference ID | Yes | A unique ID for this customer's cart or pending checkout session. Returned in the payment confirmation so the seller can match the payment to the right cart. |
| Cart total | Yes | The total value of the cart in rupees. Shown to the customer on the checkout screen. |
| Payment provider | Yes | The connected payment gateway that processes the payment (Razorpay, PayU, Cashfree, etc.). |
| Checkout expiry | No | How long the checkout button remains active. After this time, the button stops working. |

#### Cart items (optional but recommended)

If provided, the checkout screen shows the customer what they are paying for before they confirm.

| Field | Required | Notes |
|---|---|---|
| Item name | No | Product name. Max 60 characters. |
| Quantity | No | Number of units. |
| Unit price | No | Price per item in rupees. |
| Item image | No | Product image shown on the checkout screen. |

---

## What the Customer Sees

The customer receives the message with:
- The body text (e.g. "You left something behind — your cart is still waiting")
- A checkout button at the bottom

When the customer taps the button, a checkout screen opens inside WhatsApp showing:
- Cart items (if provided)
- Cart total
- Payment options (UPI, saved cards via WhatsApp Pay)

The customer confirms and pays without leaving WhatsApp. If they close the screen without paying, no order is created.

---

## What Comes Back After the Customer Acts

| Event | What the platform receives |
|---|---|
| Customer completes payment | Payment confirmation with transaction ID, amount paid, payment method, cart reference ID, and timestamp |
| Customer opens checkout but does not pay | No event (checkout abandoned) |
| Customer ignores the message | No event |
| Checkout button expires | No event — button becomes inactive in chat |

The cart reference ID the seller set at send time is returned in the payment confirmation, allowing the platform to identify which cart was paid for and trigger the order creation flow.

---

## How This Differs From the Order Details Template

| | Checkout Button | Order Details |
|---|---|---|
| Order exists before sending? | No — order is created after payment | Yes — order is already created |
| Primary use | Recover a pending cart or quote | Collect payment on an existing order |
| Cart items required? | Optional | Required |
| Payment type | Prepaid only | Prepaid or COD |

---

## Key Constraints

- **India only.** Tied to WhatsApp Pay and Indian payment infrastructure.
- **Meta approval required.** The template shell must be approved. Cart data is dynamic and not part of approval.
- **Utility only.** Must relate to a real pending transaction, not a generic promotional push.
- **Prepaid only.** The checkout button collects payment at the point of tap. COD is not applicable — if COD is needed, use the Order Details template instead.
- **Cart reference ID must be unique.** Reusing the same ID for a different customer's cart will cause a payment matching error.
- **Button expiry.** Once the checkout session expires, the button in the message becomes inactive. A new message must be sent to re-offer checkout.

---

## Open Questions

| Question | Owner |
|---|---|
| If the customer opens the checkout screen but does not pay, can the seller detect this and trigger a follow-up? Or is there truly no event for an abandoned checkout? | Engineering |
| Does the platform need to pre-create a checkout session with the payment provider before sending the message, or is the session created on demand when the customer taps? | Engineering |
| What happens if the cart changes (item goes out of stock, price changes) after the message is sent but before the customer pays? | Product |
| Is there a retry limit — how many times can the seller send a checkout button for the same cart before Meta flags it as spam? | Product |
