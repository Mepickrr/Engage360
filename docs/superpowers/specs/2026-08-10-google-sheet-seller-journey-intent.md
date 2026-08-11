# Google Sheet Integration — Seller Journey & Product Intent

**Date:** 2026-08-10
**Type:** Product thinking / strategic framing — not a PRD, not an implementation spec
**Companion docs:** `2026-07-07-google-sheet-node-design.md`, `2026-07-08-google-sheet-new-row-trigger-design.md`, `2026-07-10-google-sheet-node-modal-design.md`, `2026-07-10-google-sheet-trigger-modal-ux-redesign.md`, `2026-07-10-google-sheet-node-prd.md`
**Purpose of this doc:** work backwards from what's already been built — the node, the trigger, the field choices, the copy — to state plainly what job this feature is actually doing for the seller, independent of any UI. The other docs describe the surface. This one describes why the surface looks the way it does.

---

## 1. The real job isn't "spreadsheet CRUD"

If you read the node in isolation — Add Row, Update Row, Get Row Data, Upsert Row — it reads like a generic database connector that happens to target Google Sheets. That framing misses what the seller is actually trying to do.

A seller running flows in this product does not run their business inside this product. Their fulfillment team works off a sheet. Their finance person reconciles orders in a sheet. Their support team tracks escalations in a sheet. None of that is going to change because a flow builder exists — the sheet is the seller's actual system of record for the parts of their operation this app doesn't own. The seller's real problem is: **my flow knows things happening to my customers in real time, and my team's systems of record don't** — unless something bridges that gap.

That's the job. The Google Sheet node isn't "let a flow write to a spreadsheet." It's **let a flow communicate what it's learning about a customer's journey to wherever the seller's team actually works.** The spreadsheet is incidental — it's the destination sellers already have, not a destination this product is trying to promote. The same underlying job, aimed at the opposite direction, is what the start trigger does: **let something that happened in the seller's system of record restart a journey inside this product.**

## 2. Why Google Sheets specifically — reading the evidence

Nothing in the build says this explicitly, but the choices made only make sense under this reading:

- **The service-account-sharing model, not OAuth.** A seller grants `engagetechsupport@shiprocket.com` Editor access to *their own, already-existing* sheet. There's no "create a new sheet for us" flow, no "import your data into our system" flow. The product is deliberately going to where the seller's data already lives, not asking the seller to bring their data to the product. That's a statement about whose system of record this integration respects.
- **Upsert Row exists specifically to avoid a two-node dance.** The 2026-07-07 spec calls this out directly: without Upsert, a seller would need Get Row Data → conditional branch → Add Row or Update Row, just to keep one customer record current. Upsert collapses that because the actual seller need is "keep my sheet in sync with this customer's state," not "perform a database operation." Nobody designs Upsert for a reporting log — they design it for a **living record that mirrors what the product knows about a customer.**
- **Every field value in the node's tips-box examples is a variable interpolation** (`{{customer.name}}`, `{{Order.ID}}`) — never a literal. The node was never conceived as "let a seller type static data into a sheet." It was conceived as "let a seller pour journey data — the stuff the flow already knows about this specific customer, this specific event — into a row."
- **The trigger's "contact identifier column" concept.** The Google Sheet Data Entry trigger doesn't just ask "which sheet, which columns" — it insists on knowing which column identifies *the customer*. That requirement only exists because the intent is for a sheet row to resume a *journey for a specific person*, not to fire a generic, contact-less webhook-style event. Compare this to the plain Webhook trigger, which has no equivalent requirement — the Sheet trigger's extra insistence on contact identity is a tell that this was designed around the same "journey" mental model as the node, not around generic automation.
- **"Row number saved as a variable" on both Add Row and Upsert Row.** This has no reporting purpose — you don't need a row number to log something. It exists so a *later step in the same flow* can act on the specific row it just touched. That's a build decision that only makes sense if the sheet write is a checkpoint *inside* an ongoing customer journey, not an end-of-journey export.

Put together, these aren't isolated UX choices. They're the fingerprints of one underlying idea: **the sheet is a two-way extension of the customer's journey state, living outside the product, that the product needs to stay honest with.**

## 3. The seller's actual journey (told forward, not as a UI walkthrough)

**Before this feature exists:** A seller's flow does something valuable — a customer completes an order, hits a loyalty milestone, abandons a cart. The moment passes. If the seller's ops team needs to know it happened, someone is manually exporting data, or the seller has stitched together a Zapier-style workaround outside this product entirely, at real cost and real fragility. Every "communicate this to my team" need either doesn't happen or happens through a system this product has no visibility into.

**The moment the node exists:** Now, at any point *inside* a flow the seller already built for another reason (a purchase confirmation flow, a churn-risk flow, a support-escalation flow), the seller can add one step: write what just happened — and which customer it happened to — into the sheet their team already watches. The seller isn't building a reporting pipeline. They're adding one more thing their existing flow does, the same way they'd add a "send a WhatsApp message" step. The mental model is "make my flow tell my team," not "export my data."

**The gap that motivates the trigger:** Once a seller's team is working out of a sheet the product writes to, the natural next question is: *can my team write back?* Ops manually resolves a flagged order in the sheet — should that be able to restart a flow (e.g., "notify the customer their issue was resolved")? A sales rep bulk-imports a list of leads into a sheet — should that be able to *start* a nurture journey for each one, the same way a webhook or a CSV upload does today? The trigger exists to close that loop: the sheet isn't just something the flow writes to, it's something the seller's team can write to *in order to steer the flow*. This is why the trigger deliberately sits next to "Webhook trigger" in the catalogue (`Webhook and API → External signals`) rather than off in an "Integrations" bucket by itself — the product is already treating "an external system started this" as one category, and a sheet a human edits by hand is just a slower, human-operated version of the same idea.

**The full loop, once both exist:** A flow runs, writes a checkpoint to the seller's sheet with the customer's identity attached. The seller's team works from that sheet the way they always have — no retraining, no new tool. When the team's own action on that sheet (a new row, a status change once trigger scope extends beyond "new row") should mean something back in the product, the trigger restarts or continues a journey for that same customer. The product never asks the seller to change how their team works; it asks only to be let in and out of a system the seller already trusts.

## 4. What this reframes about "success"

The PRD's success metrics (configuration completion rate, time-to-first-save) measure whether the *feature* works. They don't measure whether the *job* is being done. Read backwards from the journey above, the real signal is closer to:

- Are sellers using this to keep an *external team* informed, or are they using it as a dead-end logging tool nobody reads? (Evidence: does the written-to sheet get edited by humans afterward, or only ever appended to by the flow?)
- Is the sheet becoming a place the seller's team *trusts* enough to act on — i.e., do write failures (today invisible, since nothing really executes yet) actually matter to someone downstream, or is this decorative?
- Once the trigger is real: does a human edit in the sheet actually get treated by the seller as equivalent in reliability to any other way of starting a flow — or do sellers avoid it because they don't trust a spreadsheet edit to reliably kick off something important?
- Does this reduce a seller's reliance on external automation tools (the Zapier-shaped workaround from "before this feature existed") — that's the real competitive job this feature is doing, not "did the modal ship."

None of these are things a frontend-only prototype can answer today. But they're the questions that should govern what gets built *next* — not "which field is missing validation," but "does the loop this is trying to close actually get closed."

## 5. What this means going backward into the two specs already written

- The **node** should be read, and defended in any future scoping conversation, as **the write half of a bidirectional bridge to a seller's external system of record** — not as a spreadsheet action library. If a future feature request asks "should we add Delete Row / Clear Range / bulk read," the right question isn't "does Bik support it" (the framing the 2026-07-07 spec used) — it's "does this serve keeping the seller's external record honestly in sync with a customer's journey, or is it scope creep into being a spreadsheet API wrapper."
- The **trigger** should be read as **the read half of the same bridge**, which is why polling (checking the seller's system of record for changes) was the right call over a push-based webhook model that would have required the seller's team to *also* learn Apps Script — that would have broken the entire premise of "we go to where your team already works," reintroducing exactly the technical burden this feature exists to remove.
- Both specs already, without saying so, converge on the same non-negotiable: **a contact must be identifiable on both sides of the bridge.** The node has no equivalent requirement baked in as strictly as the trigger does today — every action lets a seller write to any column with no requirement that one column represent "the customer." That asymmetry is worth resolving deliberately (should Add Row/Upsert Row *require* naming which written field is the contact identifier, the way the trigger requires it?) rather than leaving it as an accident of two specs written a day apart.

## 6. What this is not

This is not a case for rebuilding either feature. Both are frontend prototypes today, correctly scoped as such. This is a statement of what problem they're solving, so that:

- the next round of scoping (real backend, validation, error states) gets justified by "does this make the seller's team trust the bridge," not by "does this complete the CRUD surface,"
- and so that anyone reading the node or trigger spec cold doesn't mistake either for a general-purpose spreadsheet integration — they are one feature, told from two directions, in service of one seller journey: **let a flow talk to the system the seller's team already lives in, in both directions, without asking that team to change how they work.**
