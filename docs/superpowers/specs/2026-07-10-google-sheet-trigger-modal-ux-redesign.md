# Google Sheet Trigger — Step 1 UX Redesign Proposal

## Context

This proposes a UX redesign of `GoogleSheetTriggerStep1.jsx` (rendered inside
`StartTriggerWizard.jsx`), the config screen a seller sees after picking
"Google Sheet — new row" as their flow's start trigger. It is a proposal doc,
not an implementation — no components are changed here.

Current fields (in `googleSheetTriggerHelpers.js` / `GoogleSheetTriggerStep1.jsx`):
`sheetUrl`, `sheetId`, `columnIdMode` ("header" | "id"), `columns[]`,
`contactIdentifierColumn`, `pollIntervalMinutes`, `sampleValues{}`.

Problem: everything renders as one flat stack of technical fields in field
order, not seller-mental-model order. `columnIdMode` forces a backend
decision ("header" vs "id") before the seller has even connected a sheet.
Variable capture is a raw text/letter input with no relationship to a real
sheet. There's no concept of "connect → preview → confirm."

**Applies to both FlowBuilder and FlowBuilderV2 with a single change.**
Both `src/pages/FlowBuilder.jsx` and `src/pages/FlowBuilderV2.jsx` render the
same `StartTriggerWizard`, which renders the same `GoogleSheetTriggerStep1`
— there is no per-builder fork of this trigger config today. Implementing
this redesign in `GoogleSheetTriggerStep1.jsx` (and splitting it into the
4 steps described below inside `StartTriggerWizard.jsx`'s existing step
shell) automatically covers both builders; no duplicated component or
separate V2 variant is needed.

## 1. Redesigned modal structure

### Section A — Connect your Google Sheet (default, always visible)
**Purpose:** establish which sheet this trigger watches, and confirm access,
before asking anything about structure or columns.

**Fields:**
- Sheet URL (`sheetUrl`) — text input, paste-first UX.
- **Connect** button — triggers a mock/real validation + column read.
- Tab/sheet selector — only rendered if the connected file has >1 tab
  (dropdown, not a free-text Sheet ID).
- Access status indicator — "Not connected" / "Connected" badge.
- Access note (see microcopy §4) — always visible under the URL field.

**Advanced (collapsed by default):** Sheet ID override — for sellers who
already know they need to target one tab in a multi-tab file by ID rather
than name. This replaces today's always-visible `sheetId` field.

**Why default vs advanced:** URL + Connect is the seller's actual mental
model ("here's my sheet"). Sheet ID is an implementation detail that only
matters when tab-name matching is ambiguous — most sellers never need it.

### Section B — How should we read this sheet? (default, appears after Connect)
**Purpose:** replace `columnIdMode` with a plain-language question, and show
proof the system understood the sheet correctly.

**Fields:**
- Toggle/checkbox: "The first row contains column names" — on by default.
  This *is* `columnIdMode`, reframed: checked → `header`, unchecked → `id`
  (letter-based). Sellers basically never want letter-based; defaulting to
  header keeps the letter path alive only as a fallback, not a forced choice.
- **Detected columns preview** — chips/table showing the actual column
  names (or letters, if unchecked) read from the connected sheet.
- Inline trigger-behavior note (new-rows-only, append-only) — moved here
  because it's directly relevant once the seller is looking at real rows.

**Why this replaces "Column Identifier: Header/Id":** the old field asked
the seller to choose an implementation mode with no context. The new
version asks a factual question about their sheet ("does row 1 have
headers?") and immediately proves the answer with a real preview — the
seller never has to reason about "identifier modes" at all.

### Section C — Contact & variables (default, most prominent section)

**Part A — Contact identification**
- Field: "Which column identifies the contact for this automation?"
  (renamed from `contactIdentifierColumn`) — single-select dropdown,
  populated from the detected columns in Section B, not from a
  separately-built `columns[]` list.
- Helper text names the expected shape: Phone Number, Email, Customer ID.
- This field sits alone, above variable mapping, with slightly heavier
  visual weight (larger label, no competing controls beside it) — it is a
  required decision, not one line among many.

**Part B — Variable mapping**
- Mapping table, one row per detected column (see §3 for full interaction
  model). Replaces the current single-letter-at-a-time "select + Add"
  flow and the free-text chip input.
- Each row: checkbox to include, source column name (read-only), editable
  variable name (auto-suggested, e.g. `Customer Name` → `customer_name`).
- Live preview of the `{{trigger.variable_name}}` tokens the flow will get.

**Why grouped together:** contact identification and variable mapping are
both "what do I get out of this row," so they belong in one step — but
contact identification gets asked first and alone because every other
config decision (which columns to map) is secondary to it.

### Section D — Trigger behavior (default, final section before Save)
**Purpose:** isolate operational/scheduling concerns from data structure,
and state unambiguously what will and won't fire the flow.

**Fields:**
- "Check for new rows" frequency (`pollIntervalMinutes`) — unchanged
  control, moved to its own section.
- Static behavior summary (3 bullets, see §4) — new-rows-only, append-only,
  activation-time cutoff. Same content as today's bottom note, but placed
  here instead of buried under the field stack, and after the seller has
  already made their column decisions so it reads as confirmation, not a
  wall of caveats up front.
- "Simulate a new row" (optional) stays here, reusing mapped variable names
  as the labels instead of raw column strings — it becomes a dry run of
  Section D's promise, not a disconnected debugging tool.

## 2. Field-level changes

| Current field | Recommendation | Better label | Why |
|---|---|---|---|
| Sheet URL | Keep, move to top, pair with Connect action | "Google Sheet URL" | Same field, now the literal first decision, with a Connect button giving immediate feedback instead of a lone unvalidated input. |
| Sheet ID (optional) | Hide under Advanced | "Sheet ID (advanced — for multi-tab files)" | Sellers think in tab names, not IDs; only needed when name-matching is ambiguous. Replaced in the default path by a tab-name dropdown once the file is read. |
| Column Identifier (Header/Id) | Rename + reframe as a checkbox, keep header as default | "The first row contains column names" | The old label exposes an internal mode; the new one asks a fact the seller can answer by looking at their own sheet, then proves the system got it right via a column preview. |
| Columns to capture as variables | Replace input model entirely (see §3), rename | "Map sheet columns to flow variables" | Current select+Add / free-text-chip flow requires the seller to retype column identity from memory; new version selects from real detected columns. |
| Contact identifier column | Keep concept, promote to its own labeled block, source from detected columns not typed columns | "Which column identifies the contact for this automation?" | Currently just another dropdown gated on `columns.length` — needs to read as the primary decision it is, and it should never be disconnected from what the sheet actually contains. |
| Check for new rows | Keep, move to its own final section | "How often should we check for new rows?" | Unchanged mechanically, but separating it from structure/mapping fields stops it from reading as "just another setting" mixed in with data-modeling decisions. |

## 3. Interaction model for variable mapping

**Recommended pattern: auto-detect + editable mapping table** (not a raw
dropdown+Add, not a dual-pane source→destination canvas — that's overkill
for a flat 1:1 column→variable mapping with no transforms).

**What the seller sees**, once Section B's Connect+read succeeds:

```
┌─ Map columns to variables ──────────────────────────────┐
│ ☑  Column            Variable name           Preview     │
│ ── ────────────────  ──────────────────────  ─────────── │
│ ☑  Customer Name     [customer_name      ]   {{trigger.customer_name}} │
│ ☑  Phone Number      [phone_number       ]   {{trigger.phone_number}}  │
│ ☐  Internal Notes     internal_notes (dim)   —            │
│ ☑  Order Value        [order_value        ]  {{trigger.order_value}}  │
└───────────────────────────────────────────────────────────┘
```

- Every detected column starts **pre-checked and pre-named** (auto-slugified
  from the header, e.g. "Customer Name" → `customer_name`) — the seller's
  default action is "review and uncheck what I don't need," not "build a
  list from scratch."
- Unchecking a row grays it out but keeps it visible (so the seller can see
  what exists in the sheet even if unused) rather than removing it, which
  avoids the "wait, where did that column go" confusion of the current chip
  model.
- Variable name is editable inline, validated live (lowercase, underscores,
  no duplicates) — invalid names get an inline error, not a submit-time one.
- The contact identifier column (chosen in Part A) is visually pinned or
  badge-marked in this table ("Used as contact ID") so the seller sees the
  relationship between the two decisions instead of tracking it in their
  head across two separate dropdowns.
- If `columnIdMode` is letter-based (no headers), the table shows letters as
  the "Column" values and requires the seller to type a name for every
  variable manually — same table, no separate UI branch.

**Why this beats the current dropdown+Add:**
- Current model: seller manually picks a letter or types a column name from
  memory, one at a time, with no view of the actual sheet — high risk of
  typos silently breaking the mapping (a mistyped header just becomes a
  dead variable).
- New model: mapping is generated from what's actually in the sheet, so
  errors are impossible for column *identity* — the only thing left for the
  seller to get "wrong" is the variable name, which is validated live.
- Batch visibility (a table of all columns) lets the seller reason about the
  whole row at once, rather than reconstructing it column-by-column.

## 4. Microcopy

**Section A — Connect**
- Field helper: "Paste the link to the Google Sheet you want to use. We'll
  check access and read its structure."
- Access note (persistent, under the URL field):
  "Share this sheet with **engagetechsupport@shiprocket.com** (Editor
  access) so we can read new rows as they're added."
- Post-connect success: "Connected to **[Sheet name]**. Found **[N] tabs**
  — pick the one this trigger should watch." (only if >1 tab)
- Connection failure: "We couldn't access this sheet. Make sure the link is
  correct and that engagetechsupport@shiprocket.com has Editor access, then
  try again."

**Section B — How should we read this sheet?**
- Section intro: "We'll use this to figure out what each column means."
- Toggle helper: "Turn this off only if your first row is already data, not
  column titles."
- Preview label: "Here's what we found in row 1:" followed by column chips.
- Trigger-scope note (moved here): "Only rows added **after** this trigger
  is turned on will start the flow. Rows already in the sheet won't
  trigger anything, and new rows must be added at the bottom of the sheet —
  not inserted in the middle."

**Section C — Contact & variables**
- Contact field helper: "This tells us who the automation is for. Choose a
  column with a unique value per row — e.g. Phone Number, Email, or
  Customer ID."
- No-good-column warning (if seller picks a column with likely-duplicate
  values — optional validation): "This column may not uniquely identify a
  contact. Double-check this is the right choice."
- Variable mapping intro: "Choose which columns should be available inside
  this flow as variables. We've pre-selected everything and generated
  variable names — edit or uncheck anything you don't need."
- Per-row helper (only on hover/focus of the name field): "Variable names
  must be lowercase, with underscores instead of spaces."

**Section D — Trigger behavior**
- Frequency helper: "How often should we check the sheet for new rows?
  Shorter intervals mean the flow starts sooner after a row is added."
- Behavior summary (static, always shown):
  - "✓ Only newly added rows trigger the flow — existing rows are ignored."
  - "✓ New rows must be appended at the bottom of the sheet."
  - "✓ The flow starts running the next time we check after a row is
    added, based on the frequency above."
- Simulate section intro: "Enter sample values to preview what a real row
  would look like when this trigger fires."

## 5. Layout

- **Stepper, not one long modal.** Four steps (Connect → Read → Contact &
  Variables → Trigger behavior), each its own screen inside the existing
  wizard shell (`StartTriggerWizard.jsx` already has a step header pattern —
  reuse it rather than inventing a new one). A long single-scroll modal is
  what's currently wrong with this screen; committing to a stepper is the
  single highest-leverage change here.
- **No left/right split needed** for this trigger — the config is
  fundamentally linear (connect → structure → mapping → schedule), unlike
  something like the audience-filter builder where a live preview pane
  earns its keep. A split pane would add layout complexity without adding
  seller understanding.
- **No sticky summary panel for now** — four short steps don't need a
  persistent recap; add one only if user testing shows sellers get lost
  navigating back and forth between steps.
- **Column/sample-row preview**: rendered inline within Section B and C as
  chips (Section B, "what we found") and a table (Section C, mapping) — not
  a separate collapsible or side panel. Keeping it inline, right where the
  decision is being made, is what makes the "preview" actually useful
  rather than decorative.
- Each step keeps a persistent **Back / Continue** footer consistent with
  the existing `WizardHeader` step-dot pattern in `FlowTriggerModal.jsx`,
  so this trigger's config screen doesn't feel like a different product
  from the rest of the trigger wizard.

## 6. Low-fidelity wireframe spec

```
MODAL: "Set up Google Sheet trigger"
Stepper: ① Connect sheet  ② Read sheet  ③ Contact & variables  ④ Trigger behavior

──────────────────────────────────────────────────────────────
STEP 1 — Connect your Google Sheet
──────────────────────────────────────────────────────────────
Label:  Google Sheet URL *
Input:  [ https://docs.google.com/spreadsheets/d/...          ]
Helper: Paste the link to the Google Sheet you want to use.
Button: [ Connect ]
Status: ⚪ Not connected  /  🟢 Connected — "[Sheet name]"

(shown only if multiple tabs found)
Label:  Which tab should we watch?
Select: [ Sheet1 ▾ ]

Note (persistent):
  ℹ Share this sheet with engagetechsupport@shiprocket.com
    (Editor access) so we can read new rows.

▸ Advanced settings
  Label: Sheet ID (only if tab name matching is ambiguous)
  Input: [ 123456 ]

CTA: [ Back ]                                    [ Continue → ]
(Continue disabled until Connected)

──────────────────────────────────────────────────────────────
STEP 2 — How should we read this sheet?
──────────────────────────────────────────────────────────────
Toggle: [✓] The first row contains column names

Preview: "Here's what we found in row 1:"
  [ Customer Name ] [ Phone Number ] [ Order Value ] [ Internal Notes ]

Note (inline, not a warning — informational):
  ✓ Only rows added after this trigger is turned on will start the flow
  ✓ New rows must be appended at the bottom of the sheet

CTA: [ Back ]                                    [ Continue → ]

──────────────────────────────────────────────────────────────
STEP 3 — Contact & variables
──────────────────────────────────────────────────────────────
PART A
Label:  Which column identifies the contact for this automation? *
Select: [ Phone Number ▾ ]
Helper: Choose a column with a unique value per row — e.g. Phone Number,
        Email, or Customer ID.

PART B
Label: Map columns to variables
Helper: We've pre-selected everything and generated variable names —
        edit or uncheck anything you don't need.

Table:
  ☑  Customer Name    [customer_name ]   {{trigger.customer_name}}
  ☑  Phone Number*    [phone_number  ]   {{trigger.phone_number}}   [Contact ID]
  ☑  Order Value      [order_value   ]   {{trigger.order_value}}
  ☐  Internal Notes    internal_notes     —

Inline validation: red outline + "Variable names must be lowercase,
  use underscores" if a name is invalid or duplicated.

CTA: [ Back ]                                    [ Continue → ]
(Continue disabled until contact column chosen + ≥1 variable mapped)

──────────────────────────────────────────────────────────────
STEP 4 — Trigger behavior
──────────────────────────────────────────────────────────────
Label:  Check for new rows
Select: [ Every 5 minutes ▾ ]
Helper: Shorter intervals mean the flow starts sooner after a row is added.

Summary (static):
  ✓ Only newly added rows trigger the flow — existing rows are ignored
  ✓ New rows must be appended at the bottom of the sheet
  ✓ The flow runs the next time we check, based on the frequency above

▸ Simulate a new row (optional)
  customer_name  [ e.g. Alicia Chen        ]
  phone_number   [ e.g. +91 98765 43210    ]
  order_value    [ e.g. 1499               ]
  Button: [ Simulate new row ]
  Result: ✅ Simulated row — 3 variable(s) filled · Contact resolved to
             "+91 98765 43210"

CTA: [ Back ]                                    [ Save trigger ]
```
