# WhatsApp Checkout — Coupons & Inventory Spec

**Date:** 2026-06-27
**Status:** Draft — Beta feature, requires Meta enablement before use
**Audience:** Internal product team
**Scope:** Coupons and live inventory/shipping validation as an extension of the Checkout Button template. Builds on the Checkout Button spec — read that first.

---

## What This Is

An extension of the Checkout Button template that adds two live capabilities to the in-WhatsApp checkout screen:

1. **Coupons** — the customer can browse and apply discount codes directly on the checkout screen. WhatsApp calls the platform's backend to fetch available coupons and recalculate the order total in real time.
2. **Inventory and shipping validation** — when the customer enters their address, WhatsApp calls the platform's backend to check whether the items can be delivered there and what the shipping cost is. The order total updates live before the customer pays.

Without this extension, the Checkout Button template shows a fixed order summary with no coupon or live pricing capability. With it, the checkout screen becomes dynamic.

**Important constraints:**
- **Beta.** This feature is in beta and only available to India businesses with India country-code customers.
- **Requires Meta enablement.** Not self-serve. The platform must contact Meta (whatsappindia-bizpayments-support@meta.com) to enable this capability.
- **Requires a server endpoint.** Unlike the standard Checkout Button, this is not a static flow. The platform must maintain an always-on HTTPS endpoint that WhatsApp calls during checkout. See engineering requirements below.

---

## What the Customer Sees

On the in-app checkout screen, the customer sees:
- The order summary (items, prices, running total)
- An **"Apply a savings offer"** button — tapping this shows available coupons from the platform
- A shipping address field — entering an address triggers live inventory and shipping cost validation
- The total updates in real time as coupons are applied or removed and shipping is calculated
- A final Pay button once the total is confirmed

---

## The Four Interactions (What WhatsApp Calls the Platform For)

When the customer interacts with the checkout screen, WhatsApp sends a request to the platform's endpoint. The platform responds with updated order data.

| Interaction | Trigger | What WhatsApp sends | What the platform returns |
|---|---|---|---|
| **Get coupons** | Customer taps "Apply a savings offer" | Order details + customer phone number | List of available coupons — each with a code, ID, and description |
| **Apply coupon** | Customer selects a coupon | Order details + selected coupon code | Updated order with recalculated item prices and new total |
| **Remove coupon** | Customer removes a coupon | Order details + removed coupon code | Order with coupon stripped and original pricing restored |
| **Apply shipping** | Customer submits their delivery address | Order details + customer contact and address | Updated order with shipping cost added and inventory serviceability confirmed |

All four responses must return the full updated `order_details` object — not just the changed fields.

---

## What the Seller Configures

### In the platform (seller-facing)

| Field | Required | What the seller fills in |
|---|---|---|
| Enable coupons | No | Toggle to allow coupon entry on the checkout screen. When on, the "Apply a savings offer" button appears. |
| Enable shipping validation | No | Toggle to validate address and calculate shipping live during checkout. When on, an address field appears on the checkout screen. |

The seller can enable one, both, or neither. If both are off, the checkout screen behaves like a standard Checkout Button with no dynamic updates.

### Coupon configuration (seller-facing, if coupons are enabled)

Coupons are not defined in the template — they are returned dynamically by the platform's backend when WhatsApp calls the Get Coupons endpoint. The seller manages their coupon catalogue within the platform (or their connected e-commerce system) separately. No coupon fields are filled in at template creation or send time.

---

## What Engineering Needs to Set Up (Platform-Level, Not Per Seller)

This is not seller-facing configuration — it is a one-time platform infrastructure requirement.

| Requirement | Detail |
|---|---|
| HTTPS endpoint | A platform-hosted endpoint at a business domain that receives and responds to WhatsApp's four checkout interaction requests |
| Cryptographic key pair | Generated and uploaded to Meta via Cloud API. Used to encrypt/decrypt the payloads exchanged between WhatsApp and the endpoint. |
| Payload encryption | The platform must implement encryption and decryption of all request/response payloads using the uploaded key pair |
| Endpoint linked to payment configuration | The endpoint URL is registered with Meta via the Onboarding APIs and tied to the payment configuration |

This endpoint must be live and responsive during any checkout session where coupons or shipping validation are enabled. A slow or erroring endpoint will degrade the customer's checkout experience.

---

## Key Constraints

- **Beta — India only.** Only available for India businesses sending to India country-code customers.
- **Requires Meta enablement.** Must be requested from Meta before the platform can use this capability. Not available by default.
- **Endpoint is required infrastructure.** There is no static/offline mode for this feature. If the endpoint is down, coupon and shipping features will fail during live checkouts.
- **All four response types must return the full updated order object.** Partial updates are not accepted — the platform must return the complete recalculated `order_details` on every response.
- **Builds on Checkout Button template.** This is not a standalone template type — it extends the Checkout Button. The base template setup (body, button label, cart data mapping) is the same.

---

## Open Questions

| Question | Owner |
|---|---|
| Is the encryption key pair per-platform (one key for all sellers) or per-seller WABA? | Engineering |
| If the platform's endpoint is slow to respond, does WhatsApp show an error to the customer or time out silently? What is the response time SLA? | Engineering |
| When the seller enables coupons, should the platform's coupon catalogue be integrated directly (coupons created in the platform) or can it proxy to an external system (e.g. Shopify discount codes)? | Product |
| Is Meta's enablement process per-platform (once for all sellers) or does each seller need individual enablement? | Engineering — confirm with Meta |
