# WhatsApp AI Body Assist — Product Design Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** AI-assisted body text generation and enhancement within the WhatsApp template creation form. Body field only — header, footer, and button labels are out of scope.

---

## What This Is

Two AI entry points on the template body field:

1. **Generate** — when the body is empty, write it from scratch using a short prompt.
2. **Enhance** — when the body already has text, rewrite it in a different tone.

Both are inline — no separate modal, no page navigation.

---

## Entry Point 1 — Generate (empty body)

### When it appears
The "Generate with AI" button appears inside the body text field when it is empty. It disappears as soon as the seller starts typing.

### What the seller fills in
On click, a small panel opens just below the body field with three inputs:

| Input | What the seller fills in | Details |
|---|---|---|
| What's this message for? | A single free-text line describing the message intent | e.g. "30% off sale", "recover abandoned cart", "COD to prepaid nudge". No length constraint — short phrases work best. |
| Tone | One of: **Friendly**, **Persuasive**, **Urgent** | Single-select chips. Defaults to Friendly. |
| Length | One of: **Short** (150 chars), **Medium** (300 chars), **Long** (500 chars) | Single-select. Defaults to Medium. |

Brand name is pulled automatically from account settings. Template category (Marketing or Utility) is already set on the template — both are used silently as context for generation and are not shown as inputs.

### What happens after
The generated body text appears directly in the body field. The panel closes. The seller can edit the result freely, regenerate with different inputs, or use the Enhance entry point to change the tone.

A "Regenerate" link stays visible below the field until the seller edits the text manually. Once they edit, it disappears.

---

## Entry Point 2 — Enhance (body has text)

### When it appears
An "Enhance with AI" chip appears at the bottom-right of the body field whenever the field contains text — whether the seller typed it or generated it.

### What happens on click
Three rewritten variants appear in a side-by-side card row below the field, one per tone:

| Card | What it shows |
|---|---|
| Friendly | The body rewritten in a warm, approachable tone |
| Persuasive | The body rewritten to drive action |
| Urgent | The body rewritten with time-sensitivity and urgency |

Each card shows the full rewritten body text and a character count. The seller taps a card to replace the body field content with that variant, or dismisses the panel to keep the current text.

Length is preserved — the rewrite targets the same approximate length as the current body. The seller can adjust length afterwards using Regenerate.

---

## What Is Not Part of This Feature

- Generating or rewriting header text, footer text, or button labels
- Persona-based generation (e.g. "write for a budget-conscious shopper") — deferred to a later iteration
- Generating multiple full variants from scratch to compare side-by-side (Enhance covers post-draft comparison)
- Auto-saving AI-generated drafts — the seller must save the template explicitly

---

## Open Questions

| Question | Owner |
|---|---|
| Does the AI use the existing body variables (e.g. `{{customer.firstName}}`) as context when enhancing, or strips them and asks the seller to re-add? | Engineering |
| Should there be a character count warning if the generated text exceeds the template body limit (1,024 chars for standard templates)? | Product |
| Is "Regenerate" a full re-generation using the same inputs, or does it cycle through alternative variants silently? | Product |
