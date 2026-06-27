# WhatsApp Interactive List — Template Structure Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Interactive list message template style within the WhatsApp node

---

## What This Is

An interactive list message lets a seller send a WhatsApp message with a button that opens a scrollable menu of options. The customer picks one item from the list and their selection is sent back to the journey.

Use cases: order status options, support topic selection, product category menus, FAQ choices, appointment type selection.

**Important difference from other template styles:** Interactive list messages do not require Meta approval. They are sent directly — no submission, no review queue. However, they can only be sent within a **24-hour window** after the customer last messaged the business first. They cannot be used for outbound business-initiated messages.

---

## What the Seller Fills In

### Message fields

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | An internal name to find and reuse this template. No restrictions on format. |
| Header | No | A short line of text above the message body. Text only — no images or media. Max 60 characters. |
| Body | Yes | The main message text. Can include personalisation placeholders. Max 4,096 characters. |
| Footer | No | A small line of grey text below the message. No personalisation. Max 60 characters. |
| List button label | Yes | The text on the button the customer taps to open the list (e.g. "See options", "Choose a topic"). Max 20 characters. |

### List structure

The list is organised into **sections**. Each section contains **rows** — the individual options the customer can pick from.

| Field | Required | What the seller fills in |
|---|---|---|
| Section title | Only if more than one section | A label that groups the rows below it (e.g. "Order support", "Account help"). Max 24 characters. |
| Row title | Yes | The option the customer sees and taps. Max 24 characters. |
| Row description | No | A short line of context below the row title (e.g. "Track, update, or cancel your order"). Max 72 characters. |

**Limits:**
- Up to **10 sections**
- Up to **10 rows total** across all sections
- At least 1 row required

---

## What Comes Back When the Customer Selects an Option

When the customer taps a row, the platform receives their selection and routes the journey accordingly.

The platform captures:
- **Which option they selected** — the row title (available as a variable in downstream nodes)
- **The customer's WhatsApp display name**
- **The time they responded**

Unlike a form, the customer picks exactly one option and that's it — there is no multi-step flow. The journey continues immediately after selection.

---

## Journey Branching

Because the customer's choice is the entire point of this message, the node should support output branches — one per row — so the journey can take a different path depending on what the customer selected.

For example: three rows ("Track my order", "Return an item", "Speak to support") → three separate journey paths.

If branching is not configured, all selections continue down the same path with the selected row title available as a variable.

---

## Key Constraints

- **24-hour window only.** The customer must have sent the business a message within the last 24 hours. If the window has passed, this message type cannot be sent — the journey should route to a fallback (e.g. a standard template message instead).
- **Text-only header.** Unlike standard templates, the header cannot be an image or video.
- **Single selection only.** The customer picks one row. There is no multi-select.
- **No nested lists.** Sections group rows visually — they are not sub-menus.
- **No Meta approval required.** This template is saved internally and used directly. It does not appear in the Meta template library.

---

## Open Questions

| Question | Owner |
|---|---|
| How does the node handle customers who are outside the 24-hour window — does it block sending, silently skip, or route to a fallback branch? | Product |
| Should each row in the list map to a named output branch on the canvas node, or is branching handled by a downstream condition node reading the selection variable? | Product |
| Is there a timeout if the customer never selects — after which the journey moves on or exits? | Product |
