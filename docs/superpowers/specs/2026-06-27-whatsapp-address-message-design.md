# WhatsApp Address Message — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Address message template style within the WhatsApp node

---

## What This Is

An address message lets a seller send a WhatsApp message that prompts the customer to share their delivery address without leaving the chat. The customer either fills in a new address or selects one they've already saved in WhatsApp. The completed address is returned to the platform as structured fields.

Use cases: collect delivery address at checkout, confirm address before dispatch, update address for a return or exchange.

**Important constraint: India only.** This message type is currently supported by Meta for Indian addresses only. The address form uses Indian address format (pin code, state, city). It is not available for international addresses.

---

## What the Seller Fills In

### Message fields

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | An internal name to find and reuse this template. |
| Body | Yes | The message the customer sees before the address form opens (e.g. "Please share your delivery address so we can process your order"). Supports personalisation placeholders. |

There is no header, footer, or button label to configure — the address form has a fixed structure set by Meta.

### Pre-fill fields (optional)

The seller can optionally pre-fill some address fields using customer data already in the platform. If a field is pre-filled, it appears populated when the customer opens the form — the customer can review and edit before submitting.

| Field | Can be pre-filled | Notes |
|---|---|---|
| Customer name | Yes | Maps from customer profile |
| Phone number | Yes | Maps from customer contact number |
| Pin code | Yes | Maps from a customer attribute if available |
| Street address | Yes | Maps from a customer attribute if available |
| City | Yes | Maps from a customer attribute if available |
| State | Yes | Maps from a customer attribute if available |
| Floor / flat number | Yes | Optional detail |
| Building name | Yes | Optional detail |
| Landmark / area | Yes | Optional detail |

Pre-filling is optional. If no pre-fill is configured, the customer sees an empty form.

---

## What the Customer Sees

When the customer opens the form, they can either:
- **Fill in a new address** — using the fields below
- **Select a saved address** — if they have addresses saved in their WhatsApp account, these appear as selectable options

### Address fields the customer fills in

| Field | Required for customer |
|---|---|
| Name | Yes |
| Phone number | Yes |
| Pin code | Yes |
| Street / house / flat details | Yes |
| City | Yes |
| State | Yes |
| Floor number | No |
| Building name | No |
| Landmark / area | No |

The customer submits when all required fields are filled. There is no partial submission.

---

## What Comes Back After the Customer Submits

The platform receives the completed address as structured fields, available as variables in downstream nodes.

| Variable | What it contains |
|---|---|
| `response.name` | Customer's name as entered |
| `response.phone` | Customer's phone number as entered |
| `response.pincode` | Pin code |
| `response.address` | Street / house / flat details |
| `response.city` | City |
| `response.state` | State |
| `response.floor` | Floor number (if entered) |
| `response.building` | Building name (if entered) |
| `response.landmark` | Landmark / area (if entered) |
| `response.saved_address_id` | Populated if the customer selected a saved WhatsApp address rather than entering a new one |

---

## Key Constraints

- **India only.** The address format (pin code, state/city structure) is specific to India. Cannot be used for international delivery addresses.
- **No approval required.** Like interactive list messages, this is sent directly — no Meta template submission.
- **Customer must initiate conversation first.** Address messages are session messages and can only be sent within 24 hours of the customer last messaging the business.
- **Single submission.** The customer fills and submits once. There is no multi-step flow or confirmation screen.
- **Fixed form structure.** The seller cannot add, remove, or reorder the address fields — the form layout is defined by Meta.

---

## Open Questions

| Question | Owner |
|---|---|
| Is the 24-hour session window confirmed for address messages, or can they be sent proactively like a template? | Engineering |
| If the customer selects a saved WhatsApp address, do all the individual fields still come back in the webhook, or only the `saved_address_id`? | Engineering |
| Should pin code pre-fill trigger an auto-populated city and state (common in Indian address UX)? If so, does Meta handle this or does the platform need to maintain a pin code lookup? | Engineering |
| Is there a failure branch needed — e.g. customer dismisses the form without submitting? | Product |
