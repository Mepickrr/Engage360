# Product Requirements Document: Syncing Customer Journey Data to a Seller's Spreadsheet

**Date:** 2026-08-10
**Type:** Product PRD — problem and capability level, implementation-agnostic

---

## 1. Problem Statement

Sellers run their day-to-day operations outside any single platform. Fulfillment teams track orders in a spreadsheet. Finance reconciles payments in a spreadsheet. Support teams triage escalations in a spreadsheet. A CRM, if one exists at all, is often just a well-organized spreadsheet with a few tabs.

Meanwhile, a seller's automated customer journeys — order confirmations, loyalty milestones, cart recovery, support hand-offs — generate real information about real customers as they happen. Today, that information stays trapped inside the journey. If a seller wants their operations team to know that a specific customer just did something, they have to notice it themselves, then manually re-enter it somewhere their team will see it. At scale, this either doesn't happen, or it happens through a brittle, hand-built workaround that lives outside the seller's control and breaks silently.

The seller doesn't want a new system to manage. They want the system they already trust — their spreadsheet — to stay current with what's happening to their customers, without anyone on their team doing extra work.

## 2. Goal

Let a seller's automated customer journeys keep an external spreadsheet in sync with what's happening to each customer — automatically, as part of the journey itself, with no manual re-entry and no separate integration tool.

## 3. Who This Is For

**The seller who already runs their business on a spreadsheet.** They don't think of themselves as technical. They have a sheet their team opens every day — for orders, for support tickets, for a lightweight version of a customer list. They are not going to migrate off it, and any solution that asks them to is a non-starter.

**Their moment of need:** something just happened to a customer inside an automated journey — an order was placed, a refund was approved, a customer hit a loyalty threshold, a support case needs manual follow-up — and the seller wants their team, working in the sheet they already use, to know about it and be able to act on it, without the seller personally relaying the information.

**What success feels like to them:** they set this up once, and from then on, the sheet just stays right. They stop being the messenger between their automated journeys and their own team.

**What failure feels like:** the sheet drifts out of date, or worse, silently gets the wrong information, and the seller's team starts distrusting it — at which point they go back to manual re-entry, and the feature might as well not exist.

## 4. The Job To Be Done

When something happens to a customer inside a journey, keep the seller's own record of that customer — wherever it lives — accurate, without the seller having to do it by hand.

Three things that, if missing, make this not worth having:
1. It must write about a *specific, identifiable customer* — a log of anonymous events is not what the seller's team needs; they need to know which customer, every time.
2. It must be able to keep a record *up to date* over time, not just append a one-time note — a customer's status changes, and the sheet needs to reflect the latest truth, not a growing pile of disconnected entries.
3. It must let a later step in the same journey *use* what's already in the sheet — otherwise this is a one-way export, not a real sync, and the seller's operational data stays a dead end the journey can't reason about.

## 5. What the Seller Must Be Able to Do

Read as capabilities, not features to build in a particular order:

- **Record a new event about a customer.** When something worth tracking happens, add it to the sheet as a new entry, carrying the customer's identity and whatever details about the moment matter (what happened, an order ID, an amount, a status).
- **Update what's already known about a customer.** When new information supersedes old information about the same customer or the same record, correct it in place rather than creating a duplicate or conflicting entry.
- **Look up what's already known about a customer.** Before deciding what to do next in a journey, pull in whatever the sheet already holds about this customer, so the journey can act on the seller's own data, not just what the journey itself has seen.
- **Keep a customer's record current without needing to know in advance whether it already exists.** The seller shouldn't have to build separate logic for "this is the first time we're hearing about this customer" versus "we've seen them before" — the system should figure that out and do the right thing either way.
- **Trust that this doesn't require touching their spreadsheet's structure or workflow.** The seller keeps their sheet exactly as it is today; they only grant access to it. Nothing about how their team works in the sheet changes.

These five capabilities map onto four distinct actions a journey needs to be able to take against the seller's sheet, and each exists for a specific reason tied back to the job in Section 4, not as an arbitrary set of database operations. **Add Row** is how a journey records a new event about a customer the moment it happens — the write that turns a passing moment in the journey into a durable entry the seller's team will see. **Update Row** is how a journey corrects or advances what's already known about a customer or a record, so the sheet reflects the latest truth instead of accumulating stale or duplicate entries. **Get Row Data** is how a journey looks up what the sheet already holds before deciding what to do next, which is what makes this a real two-way sync rather than a one-way export the journey never reads back. **Upsert Row** exists specifically to satisfy the capability of keeping a record current without the seller — or the journey — needing to know in advance whether that customer already has an entry; it collapses "is this new or existing" into a single reliable action instead of asking every journey to work that out for itself first. Together, these four actions are the complete, minimum action set the job in Section 4 requires — nothing here is included because a spreadsheet happens to support it; each is included because a specific part of the seller's need would go unmet without it.

## 6. Journey, Told as a Story

A seller runs a loyalty journey. A customer crosses a spend threshold and is granted VIP status. The journey needs the seller's operations team — who work entirely out of a shared sheet — to know this happened, so someone can manually reach out with a personal thank-you.

Today, without this capability: the seller finds out about the milestone (if at all) through their own monitoring, and manually tells the ops team, or the moment is lost entirely.

With this capability: the journey itself writes the customer's new status into the ops sheet the moment it happens, tagged to that specific customer. The ops person opens their sheet the next morning and sees exactly who reached VIP status yesterday, with nothing lost and no one having to remember to mention it.

A second story, later: the same seller runs a win-back journey for lapsed customers. Before deciding whether to offer a discount, the journey checks the same sheet to see whether this customer has already been flagged by the ops team as "do not discount" for some reason outside the system (a dispute, a past abuse case). The journey reads that flag and skips the discount for that customer. The seller's own operational knowledge, kept in the sheet by a human, now shapes what the automated journey does — closing the loop between "the journey acts" and "the seller's team decides."

## 7. Success Metrics

| Metric | Why it matters |
|---|---|
| % of sellers who, after connecting a sheet, keep using it for 30+ days without disconnecting | Measures whether the sync is trusted enough to become a permanent part of operations, not an experiment that gets abandoned |
| % of records written that are later referenced by another step in the same journey (a subsequent lookup) | Measures whether this is functioning as a two-way sync the journey actually reasons about, not a one-way export nobody reads back |
| Reduction in sellers using third-party automation tools for the same purpose | The real competing behavior this replaces is a seller's own manual workaround — success looks like that workaround becoming unnecessary |
| Rate of customer-identity mismatches (a record written or updated against the wrong customer) | Any sync that gets a customer's identity wrong will be trusted less than no sync at all — this must trend to zero, not just be low |

## 8. Requirements

**Customer identity is mandatory, every time.** Every record written or looked up must be tied to a specific customer, using a value the seller's own sheet can use to recognize that person (a phone number, an email, a customer ID). A capability that can write a record without a customer attached to it does not satisfy the job.

**Writes must be safe to repeat.** If the same journey step runs again for the same customer — because a customer re-enters a journey, or a step retries — it must not create duplicate, conflicting records. The seller's sheet should always reflect one true current state per customer, not an accumulating trail of near-duplicates.

**The seller controls access, not the platform.** The platform must never require the seller to hand over their sheet, migrate its contents, or restructure it. The seller keeps ownership and keeps working in it exactly as before; the platform is a guest with permission to read and write, nothing more.

**Failures must be visible to the journey, not silent.** If a write or lookup can't complete — access was revoked, the sheet was deleted, the expected data isn't there — the journey must be able to know and react (for example, by notifying someone, or by taking a fallback path), rather than the journey silently continuing as if nothing was wrong.

**A lookup must be usable as a real decision input.** Whatever the sheet holds must be available to condition later journey behavior — not just displayed back to the customer, but usable in the same way any other piece of customer data is usable to branch a journey.

## 9. Edge Cases Worth Deciding Deliberately

**A customer has two different records in the sheet with conflicting identity values** (e.g. an old row with a typo'd phone number). A lookup or update could silently pick the wrong one, or the wrong one could get updated. The product needs a clear, stated rule for what happens on an ambiguous match — not an assumption that this never occurs.

**The seller's team edits or deletes the row a journey is about to update, at the same moment the journey is trying to update it.** Someone owns this collision, and it should not be "whichever write happens to land last, silently."

**The seller revokes access, or deletes the sheet, mid-journey.** Every journey with an in-flight write or lookup against that sheet needs a defined, not accidental, outcome.

**A journey tries to record information about a customer that has no reliable identifying value available** (for example, an anonymous visitor who hasn't yet given a phone number or email). The product needs to decide whether this is disallowed, deferred, or handled with a fallback identity — not left to whatever happens to occur.

**The seller's sheet grows very large over time**, as journeys keep appending and updating records for years. Lookups and updates need to keep working correctly and quickly as the sheet scales, not only in a demo with a handful of rows.

## 10. Non-Functional Expectations

- **Latency:** a lookup used to make an in-journey decision needs to return fast enough that the customer or the next step isn't left waiting — this is a synchronous decision input, not a background report.
- **Trust over completeness:** it is better to do less (fewer supported record shapes, fewer edge cases) reliably than to support everything with occasional silent incorrectness. A seller's operational trust, once broken by one wrong entry, is expensive to win back.
- **No lock-in:** the seller must be able to stop using this at any time without losing anything — their sheet remains theirs, in the same shape, whether or not this capability continues to write to it.

## 11. Out of Scope

- **Bringing the seller's spreadsheet data into the platform as its own system of record.** The sheet stays external and seller-owned; this is a sync, not a migration or an import.
- **Replacing the seller's spreadsheet with a purpose-built CRM.** The whole premise is meeting the seller where they already are — building a better spreadsheet is a different product with a different goal.
- **Real-time, sub-second reaction to a human edit in the sheet.** A human editing a spreadsheet is not a real-time event source; the product should set an honest expectation about delay, not promise instant reaction to a manual edit.
- **Structural changes to how the seller's team works in the sheet** (new columns they're forced to add, new conventions they must adopt) beyond the minimum needed for the sync to know which customer a row belongs to.

## 12. Open Questions

1. **What should happen when the seller's sheet already has data before this is turned on?** Should existing records be treated as already-known customer data (available to lookups) from day one, or only records created after the sync starts? This materially changes whether the seller feels the product "understands" their existing business, or starts them from zero.
2. **Who is responsible for correctness when the seller's own sheet has messy or duplicate data before the sync ever starts?** The product can't fix a seller's bad data, but it needs a stated position on what it does when it encounters it, rather than an implicit assumption of clean input.
3. **Should a customer be allowed to have more than one identifying value across different journeys** (a phone number in one flow, an email in another), and if so, how does the product avoid treating them as two different people in the sheet? This is a real seller scenario, not a hypothetical, and needs an explicit answer before it's discovered in production.
