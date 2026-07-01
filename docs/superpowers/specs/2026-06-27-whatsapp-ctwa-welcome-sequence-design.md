# WhatsApp CTWA Welcome Message Sequences — Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** Click to WhatsApp (CTWA) as a journey entry point — how the platform handles ad-triggered WhatsApp conversations and the welcome sequence that follows

---

## What This Is

Click to WhatsApp (CTWA) is a Facebook or Instagram ad format where a user taps the ad and is taken directly into a WhatsApp conversation with the business. The moment they land, the platform automatically sends a welcome message — this is the "welcome sequence."

This is different from other template types. It is not a message template the seller sends mid-journey. It is the **start of a journey**, triggered by an ad click. The welcome message is what the customer sees first, before they've said anything.

Use cases: lead generation from Facebook/Instagram ads, product interest capture, abandoned browse retargeting via ads, promotional campaigns where the CTA is "Chat with us on WhatsApp."

---

## How It Works

1. Seller runs a Facebook or Instagram ad with a "Send WhatsApp message" button.
2. Customer taps the ad.
3. WhatsApp opens with the business — customer hasn't typed anything yet.
4. Platform detects the CTWA entry and automatically sends the welcome message.
5. The welcome message can be a Standard template, a Flow template (form), or an Interactive List.
6. The conversation continues as a journey from there.

---

## What the Seller Configures

### The ad link (set up in Meta Ads Manager, outside the platform)

| Field | Notes |
|---|---|
| Ad creative | The Facebook/Instagram ad — image, video, or carousel. Configured in Meta Ads Manager. |
| CTA button | Set to "Send message" → WhatsApp. |
| Pre-filled message | Optional. A short message that auto-populates in the customer's text field when WhatsApp opens (e.g. "I'm interested in your sale"). The customer sees this before sending — they can edit or delete it. |

The seller links their Facebook ad to the platform's journey (or phone number) so the platform knows which journey to trigger when a click comes in.

---

### The welcome message (configured in the platform's journey builder)

The welcome message is the first message the platform sends automatically after detecting a CTWA entry. The seller picks from any approved template.

| Field | Required | What the seller fills in |
|---|---|---|
| Welcome message template | Yes | Any approved template — Standard, Flow, or Interactive List. This is what the customer receives immediately after tapping the ad. |
| Send delay | No | How long to wait before sending the welcome message after the CTWA entry is detected. Default: send immediately. |

**Recommended approaches for the welcome message:**
- **Standard template** — a greeting that acknowledges the ad (e.g. "Hi {{name}}, thanks for reaching out about our sale! Here's what you need to know…")
- **Flow template** — immediately collect lead information (name, interest, location) before the conversation continues
- **Interactive List** — present options so the customer self-selects what they want (e.g. "What are you looking for? [Browse products / Get a quote / Speak to support]")

---

## What the Platform Receives When a Customer Clicks

When a customer opens WhatsApp via a CTWA ad, the platform receives a webhook with the customer's message (or the pre-filled message if they sent it) plus **ad referral data**:

| Data field | What it contains |
|---|---|
| Customer phone number | The customer's WhatsApp number |
| Customer WhatsApp name | Their display name |
| Ad headline | The headline text from the ad they clicked |
| Ad body | The body text from the ad |
| Ad source type | Always `ad` for CTWA |
| Ad ID | Meta's internal ID for the specific ad |
| Click ID (`ctwa_clid`) | A unique identifier for this specific ad click. Used for conversion tracking and ROAS attribution back to Meta. |
| Media type | Whether the ad was an image or video |
| Pre-filled message | The text the customer sent (if they used the pre-filled message or typed something before sending) |

The ad referral data is available as variables in the journey — useful for personalising the welcome message (e.g. referencing the specific product from the ad the customer clicked).

---

## Attribution — Why the Click ID Matters

The `ctwa_clid` (click ID) is Meta's way of connecting a WhatsApp conversation back to the specific ad that drove it. If the platform passes this back to Meta's Conversions API when the customer takes a meaningful action (e.g. makes a purchase, fills a lead form), Meta can attribute the conversion to the correct ad.

Without passing the click ID back, CTWA ad performance in Meta Ads Manager will show lower conversion numbers than actually happened.

**What the platform should do:** When a CTWA-triggered customer completes a conversion event in the journey (form submitted, payment made, order placed), fire a Conversions API event to Meta including the `ctwa_clid`.

---

## Key Constraints

- **The welcome message must be a pre-approved template.** The business is initiating the first message — this is outside the 24-hour customer service window. A free-form message is not allowed.
- **Pre-filled message is optional and customer-controlled.** The customer can edit or delete the pre-filled text before sending. Do not treat it as guaranteed data.
- **Ad referral data is available on the first message only.** If the customer messages again later, the referral data is not re-sent. The platform must store the `ctwa_clid` and ad context when first received.
- **Click ID expires for attribution.** The `ctwa_clid` has a limited window for Conversions API attribution (typically 7 days). Conversion events must be fired within this window to count.
- **One welcome sequence per phone number / journey.** If the same customer clicks the ad again, the platform needs to decide whether to re-send the welcome sequence or treat them as a returning contact.

---

## Open Questions

| Question | Owner |
|---|---|
| How does the platform link a specific Facebook ad to a specific journey? Does the seller configure this in the platform, or via Meta Ads Manager? | Product |
| Does the platform automatically fire a Conversions API event when a CTWA-triggered customer completes a purchase, or does the seller need to add a Conversions API step manually in the journey? | Engineering |
| If the same customer clicks two different ads, and both open WhatsApp — does the platform create two separate journey sessions, or treat it as one customer? | Product |
| What happens if the welcome message template is not yet approved when the customer clicks the ad — does the platform queue the message, send a fallback, or drop it? | Engineering |
| Should the `ctwa_clid` and ad context be stored as customer profile attributes so they are queryable later (e.g. "segment customers who came from ad X")? | Product |
