# WhatsApp In-App Signup — Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** How sellers connect their WhatsApp Business Account to the platform without leaving the app — covers the onboarding flow, what the platform receives, and ongoing account management

---

## What This Is

In-App Signup (also called Embedded Signup) is the mechanism that lets a seller connect their WhatsApp Business Account directly inside the platform — no redirects to Facebook Business Manager, no separate Meta setup steps. The seller clicks "Connect WhatsApp," completes a guided flow inside a popup, and their WhatsApp number is live on the platform.

This is not a message template. It is the **account connection step** that must happen before any WhatsApp message can be sent. Every seller who wants to use WhatsApp features on the platform goes through this once.

---

## Who Does What

There are two parties: the **platform** (set up once by engineering) and the **seller** (completes the flow once per WhatsApp account).

### What engineering sets up once (platform-level)

| Requirement | What it is |
|---|---|
| Meta App | The platform must be a registered Meta developer app with WhatsApp Business API access approved. Done once, not per seller. |
| Embedded Signup SDK | The Facebook JavaScript SDK embedded in the platform's settings page to launch the signup popup. |
| Redirect / callback URL | The endpoint that receives the seller's credentials after they complete signup. Must be HTTPS. |
| Required permissions | `whatsapp_business_management` (to manage templates, WABAs, phone numbers) and `whatsapp_business_messaging` (to send messages). Requested during the seller's OAuth flow. |

---

### What the seller does (once per account)

1. Seller navigates to Integrations → WhatsApp in the platform.
2. Seller clicks "Connect WhatsApp."
3. A Facebook popup opens — the seller logs in with their Facebook account.
4. Seller selects or creates a **WhatsApp Business Account (WABA)**.
5. Seller adds or selects a **business phone number** to use for messaging.
6. Seller verifies the phone number via OTP (SMS or voice call).
7. Seller grants the platform permission to send messages and manage templates on their behalf.
8. Popup closes. The platform receives the account details automatically.
9. The connected number appears in the platform's Integrations page — ready to use.

The seller does not need a Facebook Business Manager account beforehand. The flow creates one if it doesn't exist.

---

## What the Platform Receives After Signup

Once the seller completes the flow, Meta sends the platform:

| Data | What it is |
|---|---|
| WhatsApp Business Account ID | The ID of the seller's WABA. Used in all API calls on their behalf. |
| Phone number ID | The ID of the verified WhatsApp phone number. Used when sending messages. |
| Business ID | The seller's Meta Business ID. |
| Access token | Authorises the platform to make API calls on behalf of this seller. Must be stored securely — never exposed client-side. |
| Phone number | The actual WhatsApp business number that was verified. |
| Display name | The business display name shown to customers in WhatsApp. |

---

## What the Seller Sees in the Platform After Connection

Once connected, the Integrations page shows:

| Field | Notes |
|---|---|
| Connected number | The verified WhatsApp business phone number |
| Display name | Business name shown in WhatsApp |
| WABA ID | Shown for reference (useful for debugging) |
| Status | Active / Disconnected / Flagged |
| Message limit tier | Meta assigns limits (1K / 10K / 100K messages per day) based on account quality. Shown so the seller knows their current capacity. |
| Quality rating | Meta's quality score for the number (Green / Yellow / Red). A red rating means the number is at risk of being restricted. |

---

## Ongoing Account Health

After signup, the platform should monitor and surface:

| Signal | What it means |
|---|---|
| Quality rating drops to Yellow | Warning — customers have been blocking or reporting the number. Seller should review their message content and frequency. |
| Quality rating drops to Red | Risk — the number may be restricted or banned by Meta. Action required. |
| Message limit downgrade | Meta reduced the daily sending limit due to quality issues. |
| Message limit upgrade | Meta increased the daily limit — the seller can now send to more customers per day. |
| Number banned | The phone number has been banned by Meta. The seller must request a review or register a new number. |

These signals come in via Meta's webhook and should be surfaced as alerts in the platform.

---

## Disconnecting or Changing the Connected Number

| Action | What happens |
|---|---|
| Seller disconnects the account | Platform revokes its access token. No messages can be sent. Active journeys using WhatsApp will fail until reconnected. |
| Seller wants to add a second number | A second In-App Signup flow is required. Each phone number has its own Phone Number ID and must be connected separately. |
| Seller's number changes | Old number must be disconnected. New number must go through the full signup and verification flow again. |

---

## Key Constraints

- **One WABA per legal business entity.** Meta enforces this — the same business cannot have multiple WABAs unless they have multiple distinct brands with separate business registrations.
- **Phone number cannot be actively used on another WhatsApp.** If the seller's number is registered on a personal WhatsApp or WhatsApp Business App, it must be migrated or a new number used. Migration is a separate Meta process.
- **Display name must match the business.** Meta reviews the display name for compliance. Generic or misleading names are rejected.
- **Access token must be stored server-side.** The platform must never expose the access token in client-side code or URLs.
- **Permissions are revocable.** A seller can disconnect the platform's access via their Facebook account settings at any time. The platform should handle this gracefully — detect revoked access and prompt the seller to reconnect.
- **Meta App must remain in good standing.** If the platform's Meta App violates usage policies, all connected seller accounts may lose access simultaneously.

---

## Open Questions

| Question | Owner |
|---|---|
| Does the platform use a system user access token (permanent, no expiry) or a user access token (short-lived, requires refresh)? System tokens are recommended for production. | Engineering |
| When a seller's quality rating drops to Red, does the platform send them an automated alert, or is it only visible on the Integrations page? | Product |
| Can a seller connect multiple WhatsApp numbers to the same platform account (e.g. one number per brand or store)? What is the UI for managing multiple connected numbers? | Product |
| How does the platform handle a seller who disconnects their Facebook account — is the access token immediately invalidated, and how quickly does the platform detect this? | Engineering |
