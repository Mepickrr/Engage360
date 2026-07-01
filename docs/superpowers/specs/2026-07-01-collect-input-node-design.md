# Collect Input Node — Product Design Spec

**Date:** 2026-07-01
**Status:** Approved for implementation
**Audience:** Internal product team, designers, engineers
**Scope:** Collect Input node within the Flow Builder, WhatsApp channel, 24-hour service window

---

## 1. Overview

The Collect Input node enables sellers to gather structured information from end-users during an active WhatsApp conversation (within the 24-hour service window). Because the user has already initiated the session, free-form messages are permitted — no Meta template approval is required for any message sent by this node.

The node sends a question to the user, waits for a valid response, optionally confirms the input, handles retries on invalid input, and routes the flow down one of four output branches based on the outcome. The collected value is saved to a Flow or Global Variable for use downstream.

---

## 2. Design Approach: Type-First with Smart Defaults

The seller picks the input type first. The question message is the only required field. Everything else — error message, retry count, timeout, confirmation — is pre-filled with sensible defaults and lives in collapsible sections. The seller only opens a section when they need to override a default.

A live WhatsApp preview updates as the seller configures, showing exactly what the end-user will see. This eliminates the need to mentally simulate the conversation.

---

## 3. Canvas Node

### 3.1 Unconfigured State
- Dashed border
- Label: "Collect Input"
- Subtext: "Click to configure"

### 3.2 Configured State
- Input type chip (e.g. `📧 Email`, `📞 Phone`, `🔘 Quick Reply`)
- Truncated question preview (first 60 chars)
- 4 output ports: `Success`, `No Response`, `Limit Reached`, `Send Failed`

---

## 4. Configuration Panel

### 4.1 Structure

```
[ Input Type ]             ← prominent selector, drives all fields below

[ Question Message ]       ← always visible, required
                             + Add Variable, 1000 char limit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ Confirmation             (collapsed by default)
▼ Error & Retries          (collapsed, defaults pre-filled)
▼ No Response              (collapsed, default timeout pre-filled)
▼ Save to Variable         (collapsed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ WhatsApp Preview ]       ← live preview, updates as seller types
```

### 4.2 Input Type Selector

A grouped dropdown — not a flat list — organized into four categories:

**Text-based** · **Choice** · **Media** · **Location**

Selecting a type:
- Adapts which collapsible sections are shown
- Pre-fills the error message with a type-appropriate default
- Shows/hides Confirmation (hidden for Choice, Media, Location)
- Updates the live preview

---

## 5. Input Type Taxonomy

### 5.1 Text-based

| Type | Auto-validation | Confirmation default | Type-specific config |
|---|---|---|---|
| **Text** | None (any reply accepted) | On | Max length (optional) |
| **Number** | Must be numeric | On | Min / Max range (optional) |
| **Phone** | E.164 or local format | On | Country code hint |
| **Email** | Valid email format | On | — |
| **Date** | Valid date format | On | Min / Max date range (optional) |

### 5.2 Choice

Choice types use WhatsApp's native interactive message formats. The user's input IS the interaction — no free-form typing, no validation friction, no confirmation needed.

| Type | Mechanism | Confirmation | Type-specific config |
|---|---|---|---|
| **Quick Reply** | 2–3 buttons attached to the question message | Off — tap is unambiguous | Button labels (seller-defined), each maps to a saved value |
| **List** | Scrollable list, up to 10 options in sections | Off | Section labels + option labels |

The value saved to the variable is the option label by default. Sellers can override with a custom mapped value per option (e.g. button label "Yes" maps to value `true`).

### 5.3 Media

Media types validate that the user shared the correct media kind. Confirmation is off — there is no ambiguity in what was shared.

| Type | Auto-validation | Type-specific config |
|---|---|---|
| **Image** | Must be JPG, PNG, or WebP | Max file size |
| **Video** | Must be MP4 | Max file size, max duration |
| **Audio** | Must be audio or voice note | Max duration |
| **Document** | Must be a file | Allowed types (PDF, XLS, DOCX, etc.) |

The variable stores the WhatsApp media URL / media ID.

### 5.4 Location

| Type | Auto-validation | Confirmation | Notes |
|---|---|---|---|
| **Location** | Must be a WhatsApp location pin (not a text address) | Off | Variable stores lat/long + place name |

---

## 6. Collapsible Sections

### 6.1 Confirmation
*Hidden for Choice, Media, and Location types.*

- **Toggle** to enable / disable (on by default for Text-based types)
- **Confirmation message** — pre-filled: *"You entered `{{collected_value}}` — is this correct?"* (editable, + Add Variable)
- Two quick reply buttons auto-attached: **Confirm** / **Edit** (labels editable)
- If user taps **Edit** → question is re-asked; counts as one retry against the retry limit

### 6.2 Error & Retries

- **Error message** — pre-filled per type (e.g. *"That doesn't look like a valid email. Please try again."*) — editable, + Add Variable
- **Retry attempts** — 1 to 5, default: 3
- On limit reached → `Limit Reached` output port fires; no further message sent unless seller wires one downstream

### 6.3 No Response

- **Timeout** — seller sets value + unit (minutes / hours); no system ceiling
- **One-time retry toggle** — re-sends the question once before triggering No Response (off by default)
- On timeout → `No Response` output port fires

### 6.4 Save to Variable

- **Scope** — Flow Variable (scoped to this flow) or Global Variable (available across flows)
- **Variable name** — auto-suggested based on input type (e.g. `collected_email`, `collected_phone`) — editable
- For Choice types: saved value is the option label, or a custom mapped value per option
- For Media types: saved value is the WhatsApp media URL / media ID
- For Location: saved value is `{ lat, long, name }`

---

## 7. Output Branches

| Branch | Trigger | Typical seller action downstream |
|---|---|---|
| **Success** | Valid input received and saved to variable | Continue journey with collected value |
| **No Response** | Timeout expired without any user reply | Send nudge, close ticket, try different channel |
| **Limit Reached** | Retry limit exhausted after repeated invalid input | Route to human agent, send fallback message |
| **Send Failed** | Question message could not be delivered to WhatsApp | Alert, retry via SMS/email |

All four ports are always visible on the canvas node. Sellers who don't need to differentiate Limit Reached from Send Failed can wire both to the same downstream node.

---

## 8. End-User Conversation Flow

### 8.1 Happy Path (Text-based, confirmation on)
```
Bot:   "What's your email address?"
User:  "john@gmail.com"
Bot:   "You entered john@gmail.com — is this correct?
        [✅ Confirm]  [✏️ Edit]"
User:  [taps Confirm]
→ Success branch fires, variable saved
```

### 8.2 Invalid Input → Retry
```
Bot:   "What's your email address?"
User:  "not-an-email"
Bot:   "That doesn't look like a valid email. Please try again."
User:  "john@gmail.com"
→ Continues to confirmation / success
```

### 8.3 Retry Limit Exhausted
```
Bot:   [question] → User: [invalid] × N times (N = retry limit)
→ Limit Reached branch fires
```

### 8.4 Choice (Quick Reply) — No Friction Path
```
Bot:   "Which size do you prefer?
        [S]  [M]  [L]"
User:  [taps M]
→ Success branch fires, variable saved as "M"
```

### 8.5 No Response
```
Bot:   [question sent]
       [optional one-time re-send if toggle on]
       [timeout expires]
→ No Response branch fires
```

### 8.6 Send Failed
```
System cannot deliver question message to WhatsApp
→ Send Failed branch fires immediately; no retries
```

---

## 9. Non-Goals (v1)

- Chained multi-question flows within a single node — each question is its own Collect Input node
- OTP / verification code input — deferred; requires external verification API integration
- Seller-defined custom validation rules (regex, length constraints beyond min/max) — deferred
- Media processing or transcription (e.g. reading text from image, transcribing audio) — deferred
- WhatsApp template approval for question messages — not needed; 24hr service window allows free-form
