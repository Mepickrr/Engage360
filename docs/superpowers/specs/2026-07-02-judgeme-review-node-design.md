# Judge.me Review Node — Product Design Spec

**Date:** 2026-07-02
**Status:** Approved for implementation
**Audience:** Internal product team, designers, engineers
**Scope:** Judge.me Review node within the Flow Builder, WhatsApp / RCS / Instagram channels

---

## 1. Overview

The Judge.me Review node enables sellers to collect product reviews from end-users during an active conversation (within the 24-hour service window) and automatically submit them to Judge.me. Because the user has already initiated the session, free-form messages and interactive message formats are permitted — no template approval is required.

The node sequences three steps: rating collection → review text collection → optional image collection. On completion it submits the review to Judge.me via an internal backend proxy. All collected values are also saved as Flow Variables for downstream use.

A placeholder node (`judgeme`) already exists in `NodePalette.jsx` and `FlowBuilderV2.jsx` — this spec defines the full implementation.

---

## 2. Canvas Node

### 2.1 Unconfigured State
- Dashed border, Judge.me orange accent (`#F97316`)
- Star icon centered
- Label: "Judge.me Review"
- Subtext: "Click to configure"

### 2.2 Configured State
- Solid border, `#F97316`
- Channel chip (e.g. `💬 WhatsApp`, `📱 RCS`, `📸 Instagram`)
- Step summary row: `⭐ Rating · ✍️ Review · 🖼️ Image` (Image chip grayed out if disabled)
- Product variable line: `product_id → {{order_product_id}}`
- **Inline chat bubble preview** — mini scrollable stack of the actual messages the user will receive, in sequence, updating live as the seller edits the right panel

### 2.3 Output Handles
Three labeled source handles at the bottom:

| Handle | Color | Trigger |
|---|---|---|
| `Success` | Green | Review submitted to Judge.me successfully |
| `Skipped` | Amber | User abandoned mid-flow (no response or retries exhausted at any step) |
| `Submission Failed` | Red | Judge.me API call failed after all steps completed |

---

## 3. Right Panel

### 3.1 Structure

```
[ Channel Selector ]          ← WhatsApp / RCS / Instagram chips

[ Product Variable ]          ← Variable picker → resolves to Judge.me product ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 1 — Rating
  Question message            ← editable, 1000 char limit
  Button text (WhatsApp only) ← List button label, editable, 20 char limit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 2 — Review Text
  Question message            ← editable, 1000 char limit
  ▼ Error & Retries           ← collapsed; error message + retry count (1–3, default 2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Step 3 — Image Upload         ← toggle on/off (off by default)
  [when enabled]
  Question message            ← editable, 1000 char limit
  ▼ Skip option               ← collapsed; "Allow skip" toggle + skip label (default "Skip")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ No Response                 ← collapsed; timeout value + unit (minutes / hours), default 24 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ Live Channel Preview ]      ← scrollable bubble stack, updates as seller types
```

### 3.2 Default Message Text

| Step | Default question |
|---|---|
| Rating | "How would you rate your recent purchase? Please select a rating." |
| Review Text | "Please share a brief review of your experience in one line." |
| Image Upload | "Please upload a photo of your product." |

### 3.3 Rating Options
Fixed set — not editable by the seller. Maps directly to Judge.me's 1–5 scale:

| Value | Label |
|---|---|
| 1 | ⭐ 1 — Poor |
| 2 | ⭐ 2 — Fair |
| 3 | ⭐ 3 — Good |
| 4 | ⭐ 4 — Very Good |
| 5 | ⭐ 5 — Excellent |

---

## 4. Channel-Specific Message Formats

### 4.1 Rating Step

| Channel | Format |
|---|---|
| WhatsApp | List message — body text + configurable button label; 5 list items as above |
| RCS | Suggestion chips — 5 chips: "⭐1" through "⭐5" |
| Instagram | Quick replies — 5 buttons: "⭐ 1" through "⭐ 5" (≤13 chars each) |

### 4.2 Review Text Step

All channels: plain text message. User replies free-form. No interactive element.

### 4.3 Image Step

| Channel | Format |
|---|---|
| WhatsApp | Plain text message + optional "Skip" Quick Reply button |
| RCS | Plain text message + "Skip" suggestion chip (if skip allowed) |
| Instagram | Plain text message + "Skip" quick reply (if skip allowed) |

### 4.4 Live Preview Rendering
The right panel preview switches rendering when the seller changes channel:
- WhatsApp: existing bubble style from the codebase
- RCS: matches existing RCS node preview style
- Instagram: matches existing Instagram node preview style

---

## 5. Runtime Sequence

```
1. Send rating question (List / chips / quick reply per channel)
   └─ User selects 1–5 → proceed
   └─ No response within timeout → Skipped branch

2. Send review text question
   └─ User replies with text → proceed
   └─ Less than 3 characters after retries → Skipped branch
   └─ No response within timeout → Skipped branch

3. [If image enabled] Send image question
   └─ User sends image → captured, proceed
   └─ User taps Skip (if allowed) → proceed without image
   └─ No response → Skipped branch

4. Submit to Judge.me (via internal backend proxy)
   Payload:
   {
     rating:       <collected 1–5>,
     body:         <collected review text>,
     name:         <from contact profile>,
     email:        <from contact profile>,
     id:           <resolved product variable>,
     picture_urls: [<media URL>]   // omitted if no image collected
   }

5. API success → Success branch
   API error   → Submission Failed branch
```

---

## 6. Auto-Saved Flow Variables

All collected values are saved automatically — no seller configuration required:

| Variable | Value |
|---|---|
| `jm_rating` | Integer 1–5 |
| `jm_review_text` | String |
| `jm_image_url` | Media URL (empty string if not collected) |
| `jm_product_id` | Resolved value of the seller's mapped product variable |

These are available to all downstream nodes in the flow.

---

## 7. End-User Conversation Flow

### 7.1 Happy Path (image enabled, WhatsApp)
```
Bot:   "How would you rate your recent purchase? Please select a rating."
       [List: ⭐1 Poor … ⭐5 Excellent]
User:  [selects ⭐4 — Very Good]
Bot:   "Please share a brief review of your experience in one line."
User:  "Great quality, fast delivery!"
Bot:   "Please upload a photo of your product."
       [Skip]
User:  [sends image]
→ Submits to Judge.me → Success branch
```

### 7.2 User Skips Image
```
...after review text...
Bot:   "Please upload a photo of your product."
       [Skip]
User:  [taps Skip]
→ Submits without picture_urls → Success branch
```

### 7.3 No Response at Any Step
```
Bot:   [sends any step message]
       [timeout expires]
→ Skipped branch fires
```

### 7.4 Retry on Review Text
```
Bot:   "Please share a brief review..."
User:  " " (empty)
Bot:   "Please share a brief review..." (retry message)
User:  [still empty after N retries]
→ Skipped branch fires
```

### 7.5 API Failure
```
[all steps collected successfully]
→ Judge.me API returns error
→ Submission Failed branch fires
   (jm_* variables still populated for manual handling downstream)
```

---

## 8. File Structure

```
src/components/flows/builder/nodes/JudgeMeNode/
  index.jsx                 ← canvas node (unconfigured + configured states, 3 output handles)
  JudgeMeRightPanel.jsx     ← right panel with all configuration sections
  data/
    mockData.js             ← default messages, rating options, variable names
```

Registration points:
- `NodePalette.jsx` — placeholder already exists, no change needed
- `FlowBuilderV2.jsx` line 42 — `"judgeme"` already in action node list; add `"judgeme"` → `JudgeMeNode` to the `nodeTypes` map and right panel routing

---

## 9. Non-Goals (v1)

- Multiple product reviews in a single node — one review per node, one product per API call
- Seller-configurable rating scale (e.g. 1–10) — fixed 1–5 to match Judge.me API
- Review moderation or approval flow within the builder
- Displaying past reviews or review counts in the node
- OTP / verified purchase confirmation before collecting review
