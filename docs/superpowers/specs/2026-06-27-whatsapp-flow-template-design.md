# WhatsApp Flow Template — Product Design Spec

**Date:** 2026-06-27
**Status:** Draft
**Audience:** Internal product team
**Scope:** WhatsApp Flow template style — two-step creation modal within the Templates page

---

## What This Is

A WhatsApp Flow template lets a seller send a message with a button that opens an interactive form directly inside WhatsApp — no link, no browser, no redirect. The customer fills out the form and submits it without leaving the chat. The seller gets the responses back as variables they can use in the rest of the journey.

Use cases: lead capture, feedback surveys, appointment booking, preference collection, support intake.

---

## How Creation Works

The seller creates a Flow template in two steps inside a modal:

- **Step 1 — Message:** Fill in the WhatsApp message the customer receives.
- **Step 2 — Form:** Build the screens and fields the customer sees after tapping the button.

The platform submits both to Meta on the seller's behalf. The seller never needs to open Facebook Business Manager.

---

## Step 1 — The Message

This is the WhatsApp message the customer receives in their chat. It contains the text and a button to open the form.

| Field | Required | What the seller fills in |
|---|---|---|
| Template name | Yes | A unique internal name. Lowercase letters and underscores only. Used to find the template later. |
| Category | Yes | **Marketing** (promotions, offers) or **Utility** (transactional, post-purchase, service updates) |
| Language | Yes | The language the message is written in (e.g. English, Hindi) |
| Header | No | An optional line above the message body. Can be a short line of text, an image, a video, or a document. |
| Body | Yes | The main message text. Can include personalisation placeholders like the customer's name or order details. Max 1,024 characters. |
| Footer | No | A small line of grey text below the message body. No personalisation. |
| Button label | Yes | The text on the button that opens the form (e.g. "Fill in details", "Book now", "Share feedback"). Max 20 characters. |

**Note:** A Flow template can only have one button. It cannot be combined with Quick Reply or link buttons.

---

## Step 2 — The Form

The form is made up of one or more **screens**. The customer moves through them one at a time. The last screen has a Submit button that sends their answers back.

### Screen settings

Each screen the seller adds has:

| Field | Required | What the seller fills in |
|---|---|---|
| Screen title | Yes | Shown as the heading at the top of the screen on the customer's device. Max 30 characters. |
| Button label | Yes | The text on the button at the bottom of the screen. For middle screens: "Next", "Continue", etc. For the last screen: "Submit", "Done", etc. |
| Components | Yes | The content blocks the seller adds to the screen — see below. |

### Components

Sellers build each screen by adding components from a palette. There are two types: **display** (show information) and **input** (collect answers).

---

#### Display components

These show content to the customer. They do not collect any data.

| Component | What it does | What the seller fills in |
|---|---|---|
| Heading | Large title text | The heading text |
| Subheading | Medium emphasis text | The subheading text |
| Body text | Regular paragraph text | The body text |
| Caption | Small grey text | The caption text |
| Rich text | Text with formatting (bold, italics, links) | The formatted text |
| Image | A static image | Upload the image |

---

#### Input components

These collect answers from the customer. Each one produces a variable the seller can use in downstream journey nodes.

| Component | What it does | What the seller fills in | Required toggle |
|---|---|---|---|
| Short answer | Single-line text field | Field label, input type (text / number / email / phone / password), optional hint text, min/max character limits | Yes |
| Long answer | Multi-line text box | Field label, optional hint text, max character limit | Yes |
| Dropdown | Single choice from a list | Field label, list of options (each option needs a label) | Yes |
| Single choice | Radio buttons — pick one | Field label, list of options | Yes |
| Multiple choice | Checkboxes — pick one or more | Field label, list of options, min/max selections allowed | Yes |
| Date | Date picker | Field label, optional earliest and latest date allowed | Yes |
| Opt-in | A single checkbox with a label (e.g. consent, terms agreement) | Checkbox label (can include a link) | Yes |
| Photo upload | Lets the customer upload photos | Field label, source (camera / gallery / both), max number of photos | Yes |
| Document upload | Lets the customer upload a file | Field label, max number of documents | Yes |
| Selectable list | A list of items the customer taps to select, which navigates to the next screen | List label, list items (each needs a title; optional subtitle and caption) | — |
| Embedded link | A tappable text link that navigates to another screen | Link text, destination screen | — |

---

## What Comes Back After the Customer Submits

When the customer submits the form, the platform receives their answers and makes them available as variables in downstream nodes (SMS, WhatsApp, Email, etc.).

Each input component the seller named in Step 2 becomes a variable. For example, if the seller added a Short Answer field and labelled it "Customer name", the answer becomes available as a variable called `Customer name` that can be dropped into a message template.

The platform also captures:
- The customer's WhatsApp display name
- The time they submitted the form

**Important:** The customer's answers arrive asynchronously — the journey pauses at the Flow node and waits until the customer submits (or a timeout is reached). Downstream nodes only run after the response is received.

---

## Approval

Once the seller saves the template:
1. The platform creates the form (Flow) in Meta and submits it for review.
2. The platform then submits the message template referencing that form.
3. Both must be approved by Meta before the template can be used in a live journey.
4. Approval typically takes a few minutes to 24 hours.

The template status on the Templates page shows **Pending**, **Approved**, or **Rejected** — same as other WhatsApp template types.

---

## What Is Not Supported in v1

- Dynamic forms where options on one screen change based on answers from a previous screen (requires a server endpoint — out of scope for static mode)
- Conditional screen navigation (branching between screens based on answers)
- Pre-filling form fields with customer data from the platform

---

## Open Questions

| Question | Owner |
|---|---|
| What is the timeout for waiting on a customer's form submission — after which the journey routes to a failure/timeout branch? | Product |
| Should the seller be able to preview what the form looks like on a device before submitting for approval? | Product |
| Is there a cap on the number of screens per form for v1? Meta allows up to 10. | Engineering |
| How are PhotoPicker and DocumentPicker uploads stored — does the platform receive the media, or just a reference ID from Meta? | Engineering |
