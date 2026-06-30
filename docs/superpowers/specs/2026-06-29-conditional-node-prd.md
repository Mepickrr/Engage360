# Conditional Node — Product Requirements Document

**Version:** 1.0
**Date:** 2026-06-29
**Status:** Draft for Review
**Audience:** Product, Engineering, Design

---

## Table of Contents

0. [What the Prototype Shows](#0-what-the-prototype-shows)
1. [Feature Brief](#1-feature-brief)
2. [The Job](#2-the-job)
3. [Success Metrics](#3-success-metrics)
4. [Who Uses This and When](#4-who-uses-this-and-when)
5. [User Flows](#5-user-flows)
6. [Functional Specification](#6-functional-specification)
7. [States](#7-states)
8. [Edge Cases](#8-edge-cases)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Analytics & Instrumentation](#10-analytics--instrumentation)
11. [Copy](#11-copy)
12. [Dependencies](#12-dependencies)
13. [Out of Scope](#13-out-of-scope)
14. [Open Questions](#14-open-questions)
15. [Decision Log](#15-decision-log)

---

## 0. What the Prototype Shows

**Built:**
- Canvas node with three mode tabs: Filter, A/B Test, Expression
- Filter tab: full `AudienceFilterBuilder` with 5 block types (user property, user behavior, user affinity, event property, custom segment), nested AND/OR combinators at three levels (between branches, between blocks within a branch, between conditions within a block)
- A/B tab: 2–8 variant paths with percentage-based distribution; two-path slider UI; multi-path manual percentage input; optional per-visit randomization toggle (`abRandomise`)
- Expression tab: structured mode (variable → operator → value from a grouped dropdown) and freetext mode (raw text with `{{variable}}` interpolation); AND/OR between expressions

**Incomplete:**
- Backend evaluation logic for condition resolution is not implemented; the node is UI-only today
- No branch priority or ordering contract defined for cases where a customer could match multiple Filter branches
- A/B percentage validation enforces the sum at input but the save-time check is not wired to journey publish validation
- Journey-level publish validation for incomplete branches is specified in the engineering spec but not yet wired end-to-end

**Absent:**
- No customer-level attribution record for which branch a specific customer entered (needed for analytics)
- No experience for what happens when a seller tries to edit a live flow's A/B variant structure mid-run
- Degradation behavior when external dependencies (segment service, attribute catalog) are unavailable is unspecified at the product level

---

## 1. Feature Brief

Without the ability to branch, every flow is a one-size message blast — the same WhatsApp, the same discount, the same cadence sent to every customer, regardless of what they bought, how much they spent, or whether they're a first-time visitor or a loyal repeat buyer. That blunt approach burns budget, trains customers to ignore messages, and destroys the trust that drives repeat purchase.

The Conditional Node splits a customer journey into multiple downstream paths, each tailored to a specific profile, behavior, or business rule. A seller defines the conditions under which a customer enters each branch, connects different actions downstream, and the platform routes every customer automatically at runtime. The result: the right action for the right customer at exactly the right moment — not a campaign built separately for every segment, but one flow that handles them all.

---

## 2. The Job

**Irreducible job:** Route each customer entering this node into exactly one downstream path, based on seller-defined rules, so every subsequent action applies to the right audience.

**Three things that make this worth shipping:**

1. Sellers can split by audience attributes — who the customer is and what they have done — including conditions tied to the specific event that triggered their entry into the flow.
2. Sellers can run true randomized experiments across variants, with verifiable percentage splits and no assignment bias.
3. Sellers can encode custom business logic — expressions that go beyond standard attribute matching — without requiring an engineering request.

---

## 3. Success Metrics

| Metric | Baseline | Target | How to Measure |
|---|---|---|---|
| % of active flows containing at least one Conditional Node | TBD at launch | 40% within 60 days of release | Flow configuration data |
| Revenue per journey: flows with conditional node vs. without | TBD | +15% lift | Order attribution per flow, 30-day window |
| Median time to configure a Filter-mode split (first use) | N/A (new feature) | < 3 minutes | Session funnel / recording |
| "Wrong segment received this message" support tickets | Baseline from pre-split flow era | −30% within 90 days | Support ticket tagging |
| Sellers who use A/B mode at least once within 90 days | N/A | 20% of active flow builders | Event tracking |

Baselines marked TBD must be pulled from pre-launch analytics before the feature is released to sellers. Without baselines, lift claims cannot be verified.

---

## 4. Who Uses This and When

**Persona 1 — The D2C Growth Seller**
Goal: Maximize return on every rupee spent on recovery and retention flows — not fire the same intervention at every customer.
Moment of use: Building a cart abandonment flow and wanting to separate high-value cart abandoners (cart value > ₹5,000) who are worth an AI calling intervention from lower-value abandoners who get a standard SMS nudge.
Success: Their flow routes high-value customers to an AI call and others to a discounted SMS, reducing CAC on the high-value cohort while not over-investing in low-value recoveries.
Failure: They cannot find where to filter by cart value (an event property, not a user property), or they configure it but cannot verify the condition logic is correct before going live.

**Persona 2 — The Campaign Experimenter**
Goal: Run structured, measurable A/B tests on channel, offer, or copy to find what moves their conversion rate — not guess based on intuition.
Moment of use: Building a new win-back flow and wanting to test WhatsApp + 10% off vs. email + free shipping on a 50/50 split.
Success: Traffic splits cleanly, each variant runs its own downstream action independently, and after 7 days they can see which variant converted better and double down on the winner.
Failure: The split is not truly random, percentages do not add up cleanly, or they cannot add a third variant to test a no-discount control group.

**Persona 3 — The Technical Operator**
Goal: Encode complex business logic that standard attribute filters cannot express — modulo-based cohort splitting, derived value comparisons, combinations of store variables and customer session attributes.
Moment of use: Configuring a loyalty tier flow where branch logic depends on a combination of customer tier, session data, and store-level configuration that has no single-attribute equivalent.
Success: They write an expression that evaluates correctly at runtime without filing a ticket. The expression they configure today is still valid six months from now without manual maintenance.
Failure: Expression syntax is unclear, validation feedback is absent, and they cannot confirm whether their expression is correct until a real customer hits it in production.

---

## 5. User Flows

### Filter Mode — Configuring a Multi-Branch Audience Split

1. Seller adds a Conditional Node to the journey canvas. Node enters unconfigured state — no mode is selected.
2. Seller opens the node and selects Filter mode.
3. Default state: one branch (Branch 1) containing one condition block of type User property.
4. Seller selects a block type for their condition: User property, User behavior, User affinity, Event property, or Custom segment.
5. Seller configures conditions within the block. Each condition specifies a property, an operator, and a value. Multiple conditions within a block are joined by the block's combinator (AND or OR).
6. Seller adds more condition blocks within the same branch if needed. Blocks within a branch are joined by the branch's `blocksCombinator` (AND or OR).
7. Seller adds additional branches. Each branch is independently evaluated.
8. Seller connects each branch to different downstream actions.
9. The Else branch is always present and always last. It captures every customer who does not match any configured branch. Seller may or may not connect the Else branch — but if left unconnected, customers who fall through exit the flow silently.

**Mid-configuration:** If the seller navigates away without completing configuration, the node persists its partial state. On return, the seller resumes exactly where they left off.

**Branch evaluation order:** Branches are evaluated top-to-bottom. A customer enters the first branch whose conditions evaluate to true. Evaluation stops — the customer does not continue checking remaining branches.

---

### A/B Test Mode — Setting Up a Randomized Split

1. Seller selects A/B Test mode.
2. Default: two variants (A and B), 50/50 percentage split.
3. Seller adjusts percentages. When only two variants exist, adjusting A automatically updates B to maintain a 100% sum.
4. Seller adds variants as needed, up to a maximum of 8 (labeled A through H). With more than two variants, each percentage is entered independently.
5. Seller sets randomization mode: per-user (default) or per-visit.
   - Per-user: a customer assigned to variant A on their first entry always enters variant A for this flow.
   - Per-visit: assignment is re-evaluated on every entry. A returning customer may enter a different variant.
6. Seller connects each variant path to its own downstream actions.
7. Every customer who enters the node is assigned to a variant. There is no Else branch in A/B mode — the distribution is exhaustive.

**Percentage validation:** All variant percentages must sum to exactly 100% before the flow can be published. The system does not silently correct; it shows a validation error and identifies which variants need adjustment.

---

### Expression Mode — Writing Custom Routing Logic

1. Seller selects Expression mode.
2. Default: one empty expression in structured input mode.
3. In structured mode, seller picks a variable from a grouped dropdown, picks an operator, and enters a value. The resulting expression is shown as a readable string.
4. Seller switches to freetext mode to type expressions directly using `{{variable}}` syntax for dynamic values.
5. Seller combines multiple expressions with AND or OR.
6. Expressions are evaluated top-to-bottom. The customer enters the first expression path that evaluates to true.
7. An Else path is always present and always last — it captures customers for whom no expression evaluates to true.
8. Seller connects each expression path and the Else path to downstream actions.

---

## 6. Functional Specification

### Split Mode

| Attribute | Detail |
|---|---|
| Name | `mode` |
| Type | Enum: `filter` \| `ab` \| `expression` |
| Default | `null` (unconfigured) |
| Required to publish | Yes |
| On mode switch | Switching between modes preserves each mode's configuration independently. A seller who configures Filter, switches to A/B, then switches back to Filter finds their Filter configuration intact. |

---

### Filter Mode — Branches (`filterGroups`)

| Attribute | Detail |
|---|---|
| `label` | Editable string. Defaults: "Branch 1", "Branch 2", etc. |
| `blocksCombinator` | `AND` \| `OR` — controls how condition blocks within this branch combine |
| Minimum | 1 branch |
| Maximum | 10 branches (recommended hard cap; enforced with a clear message at the limit) |
| Else branch | System-generated, always last, not editable or removable |
| Branch order | Functionally significant — evaluation is top-to-bottom, first match wins |

---

### Filter Mode — Condition Blocks (`blocks`)

A block is a self-contained group of conditions sharing the same type. A branch can contain multiple blocks combined with AND/OR.

| Attribute | Detail |
|---|---|
| `type` | `property` \| `behavior` \| `affinity` \| `event_property` \| `segment` |
| `combinator` | `AND` \| `OR` — how individual conditions within this block combine |
| `conditions[]` | Array of condition objects (property, behavior, affinity, event_property types) |
| `segments[]` | Array of segment references (segment type only) |
| Minimum per branch | 1 block |

**Block Type: User Property (`property`)**
Matches static attributes stored on the customer's profile.
- Operators by data type: string (equals, contains, starts with, ends with, is set, is not set), numeric (>, <, >=, <=, =, ≠), date (before, after, on, between), boolean (is true, is false), enum (is one of, is not one of).
- Missing or null property: positive operators (equals, contains, >, etc.) evaluate to false. Absence operators (is not set) evaluate to true.

**Block Type: User Behavior (`behavior`)**
Matches patterns of past event execution over a historical window.
- Configured as: qualifier (Has Executed / Has Not Executed) + event name + frequency constraint (at least N / exactly N / at most N times) + time range.
- Customer with zero event history: "Has Not Executed" evaluates true. "Has Executed" evaluates false.

**Block Type: User Affinity (`affinity`)**
Matches a customer's dominant behavioral pattern across a category or type of event.
- Configured as: affinity operator (predominantly, minimum X%, most times, least times) + event category.
- Use case: customers who have predominantly purchased from a specific product category.

**Block Type: Event Property (`event_property`)**
Matches attributes of the specific trigger event that brought this customer into the current journey run. This is the highest-value block type for D2C flows.

Key rules:
- The event name is inherited automatically from the flow's start trigger. The seller does not re-select it.
- If the start trigger has no event configured, this block is non-functional and shows a placeholder. The branch can still be published using other block types.
- If the start trigger event changes after conditions are already configured in this block, all conditions in the block are cleared automatically and a warning is shown.
- Condition syntax: same as User behavior attribute filters — event-level attribute + operator + value.

**D2C example:** Journey trigger = `cart_abandoned` → Event property block: `cart_value > 5000` → routes to AI calling node. Same flow, different branch: `cart_value <= 5000` → routes to SMS with small incentive. This configuration optimizes CAC by reserving the expensive AI calling intervention for high-intent, high-value abandoners only.

**Block Type: Custom Segment (`segment`)**
Matches customers who are members of a pre-saved audience segment.
- Seller selects one or more segments from their account's segment library.
- A segment referenced in a branch that has since been deleted: the branch is marked invalid. The flow cannot be published (or, if live, enters an error state) until the reference is updated or removed.

---

### A/B Test Mode

| Attribute | Detail |
|---|---|
| `abPaths` | Array of `{id, label, percentage}`. Labels: A through H. |
| Minimum variants | 2 |
| Maximum variants | 8 |
| Percentage validation | All variant percentages must sum to exactly 100. Non-integers: round to nearest whole number. System enforces sum on publish; does not silently correct. |
| Default | Two variants, A at 50%, B at 50% |
| `abRandomise` | `false` (per-user, default) \| `true` (per-visit) |
| Adding a variant | New variant starts at 0%. Seller manually sets its percentage and rebalances others. |
| Removing a variant | Remaining percentages are not auto-redistributed. Seller rebalances manually. System shows validation error until sum is 100%. |
| Else branch | None. Assignment is exhaustive — every customer entering the node receives a variant. |

**Per-user assignment:** A customer's variant is determined by a hash of their customer ID and the A/B node's ID. The same customer always lands in the same variant for the same node, regardless of how many times they re-enter the flow.

**Per-visit assignment:** Assignment is re-randomized on each flow entry. A returning customer may receive a different variant.

---

### Expression Mode

| Attribute | Detail |
|---|---|
| Input modes | Structured (variable → operator → value) \| Freetext (`{{variable}}` syntax) |
| Operators | `>`, `<`, `>=`, `<=`, `==`, `!=`, `contains`, `%` (modulo) |
| Variable groups | Customer, Flow, Local responses, Store, Global, Session |
| `combinator` | `AND` \| `OR` between expressions |
| Minimum | 1 expression |
| Default | One empty expression in structured mode |
| Else path | Always present, always last. Captures customers for whom no expression evaluates to true. |
| Evaluation order | Top-to-bottom, first match wins. Expression order is functionally significant. |

**Freetext mode:** No real-time validation. Runtime evaluation determines correctness. A missing variable resolves to null; the expression evaluates to false and the customer falls through to the next expression or Else.

---

## 7. States

| State | Trigger | What the seller sees | Available actions | How it exits |
|---|---|---|---|---|
| **Unconfigured** | Node added to canvas, mode not set | Mode selector only | Select a mode | Mode selected |
| **Incomplete** | Mode selected; required fields are empty or partial | Branch/variant cards with empty inputs; node shows an indicator that configuration is incomplete | Fill in conditions; set percentages | All required fields filled and valid |
| **Valid** | All required fields filled; percentages sum to 100 (A/B); at least one complete condition per branch (Filter) | No error indicators | Connect branches to downstream nodes; publish flow | Flow published, or seller navigates away |
| **Validation error** | A/B percentages don't sum to 100, or a deleted segment is referenced | Inline error on the specific field; node is flagged | Fix the specific error | Error condition resolved |
| **Event property — no trigger** | Event property block selected; start trigger has no event | Placeholder in block body; block is non-interactive | Configure the start trigger event first | Trigger event is added |
| **Event property — trigger changed** | Start trigger event changes after conditions are set | Warning in block; conditions cleared | Reconfigure event property conditions | Conditions reconfigured |
| **Published** | Flow is live | Node shows configured mode and branch count; no editing allowed | Edit (requires unpublishing or pausing flow) | Flow taken out of published state |

---

## 8. Edge Cases

**Customer matches more than one Filter branch**
Without explicit handling, a customer satisfying multiple branch conditions could enter multiple branches, triggering duplicate actions.
Correct behavior: First-match-wins. Branches are evaluated top-to-bottom. The customer enters the first branch that evaluates to true. Evaluation stops immediately. The seller is responsible for ordering branches so priority logic is explicit.

**Customer matches no Filter branch; Else path unconnected**
A customer who falls through all branches exits silently with no logged outcome.
Correct behavior: Customer exits the flow. This exit is logged as "no branch matched at node [id]" in flow analytics, making it visible to the seller as a funnel drop-off that may indicate misconfigured conditions.

**A/B percentages don't sum to 100% at publish time**
Journey publishes with undefined distribution, causing unknown assignment behavior.
Correct behavior: Flow cannot be published. Error identifies the specific A/B node and shows the current sum (e.g., "Variant percentages total 90% — 10% unassigned").

**Seller removes an A/B variant on a live flow**
Customers already assigned to the removed variant have no valid path.
Correct behavior: Variant structure changes (adding or removing variants) are blocked while the flow is published. Seller must pause or unpublish the flow before modifying the variant count.

**A Custom Segment referenced in a branch is deleted**
Evaluation silently treats the branch as non-matching, invisibly removing a branch of the seller's logic.
Correct behavior: The node enters an error state. The flow cannot be published. If already live, the flow pauses at this node and alerts the seller: "Segment '[Name]' referenced in Branch [Name] no longer exists."

**Start trigger event changes after Event property conditions are configured**
Old event-property conditions reference attributes that belong to the old event. Evaluation silently returns wrong results or errors.
Correct behavior: All Event property blocks across all branches of this node have their conditions cleared. A visible warning names which branches were affected. Seller must reconfigure before publishing.

**Seller switches modes (e.g., Filter → A/B → Filter) multiple times**
Configuration from a previous mode setting is lost, forcing the seller to redo work.
Correct behavior: Each mode's configuration is preserved independently regardless of how many times the seller switches. The three modes are not mutually exclusive in their stored state — only in their runtime behavior.

**Incomplete condition block — empty condition treated as wildcard**
A branch with an empty or partial condition accidentally matches all customers.
Correct behavior: Incomplete conditions are invalid. A branch containing any incomplete condition cannot route customers. Journey publish validation catches this and names the specific branch. Empty conditions are never treated as wildcards.

**Expression references a variable that doesn't exist at runtime**
Expression throws a runtime error; customer journey halts at the node.
Correct behavior: Missing variable resolves to null. The expression evaluates to false. Customer falls through to the next expression or Else path. The error is logged with the variable name for seller visibility.

**Per-user A/B assignment — customer is deleted and re-enters with a new ID**
New customer ID receives a different variant assignment, creating a contaminated cohort.
Correct behavior: This is a known limitation of ID-based deterministic hashing. A customer who re-enters with a new profile ID is treated as a new customer. Sellers relying on longitudinal A/B consistency must maintain stable customer IDs. This limitation is documented.

**Event property block used on a re-entry flow**
On a customer's second entry, the trigger event from the previous run could be incorrectly reused.
Correct behavior: Each journey entry is scoped to its own trigger event instance. Event property evaluation uses the trigger event from the current entry only. If no trigger event is present on re-entry, the block falls back to the "no trigger event" state.

**A branch has no downstream connection in Filter or Expression mode**
Customer enters the branch but has nowhere to go.
Correct behavior: An unconnected branch is a valid configuration (seller may intentionally route some customers to a dead end — e.g., suppress all messaging). The seller should be informed via a warning at publish time that one or more branches have no downstream connection, but this does not block publishing.

**All blocks in a branch are deleted**
Branch configuration becomes empty, with no conditions to evaluate.
Correct behavior: Minimum one block per branch is enforced. If the last block is deleted, the branch resets to a default User property block rather than allowing an empty state.

---

## 9. Non-Functional Requirements

**Performance**
- Condition evaluation for a single customer at this node must complete in under 200ms at the 95th percentile for real-time triggered flows.
- A node configured with 10 branches and 5 blocks each (50 condition sets) must stay within this threshold.
- For batch flows, evaluation is asynchronous but must complete before the customer's next node executes.

**Scale**
- Must support concurrent evaluation for flows with over 100,000 customers reaching this node within a 1-hour window.
- Node configuration limits: 10 branches (Filter), 8 variants (A/B), 20 blocks per branch (soft limit with warning).
- When a hard limit is reached, the add action is disabled and a clear message explains the constraint.

**Security**
- Expression freetext input is never executed as arbitrary server-side code. It is evaluated against a constrained grammar only. Inputs that do not conform to the grammar return a parse error and are not forwarded to any interpreter.
- Custom Segment references are account-scoped. A segment ID from a different seller account must not resolve.
- Expression variable groups expose only the current seller's customer and flow data. System-level or cross-account variables must not be accessible from the expression builder.

**Reliability**
- If the segment membership service is unavailable when a customer hits a Custom Segment block, the block evaluates to false (fail-safe). The customer routes to the next branch or Else. This degradation is logged.
- If the expression evaluation engine is unavailable, the customer routes to Else. This is logged.
- Filter conditions that rely only on in-flow customer data (no external service) must evaluate correctly even during partial external outages.

---

## 10. Analytics & Instrumentation

| Event | Trigger | Properties |
|---|---|---|
| `conditional_node_mode_selected` | Seller selects a mode | `flow_id`, `node_id`, `mode` |
| `conditional_node_branch_added` | Seller adds a branch or A/B variant | `flow_id`, `node_id`, `mode`, `branch_count` |
| `conditional_node_block_type_selected` | Seller selects a condition block type | `flow_id`, `node_id`, `block_type` |
| `conditional_node_published` | Flow containing this node is published | `flow_id`, `node_id`, `mode`, `branch_count`, `has_else_connected` |
| `customer_routed_to_branch` | Customer evaluated at this node | `flow_id`, `node_id`, `customer_id`, `branch_id`, `matched_else` (bool) |
| `conditional_node_evaluation_error` | Evaluation fails for a customer | `flow_id`, `node_id`, `customer_id`, `error_type`, `block_type` |
| `conditional_node_segment_missing` | A referenced segment is not found at evaluation time | `flow_id`, `node_id`, `segment_id`, `branch_id` |

**Reporting metrics:**

| Metric | Definition | Attribution |
|---|---|---|
| Branch distribution | % of customers routed to each branch/variant over a time window | Per flow run, per node |
| Else fallthrough rate | % of customers entering the Else path (high rates signal misconfigured conditions) | Per flow run, per node |
| A/B variant conversion | Downstream conversion event rate per variant | 7-day window from branch entry |
| Expression error rate | % of customer evaluations failing due to invalid expressions | Per flow run, per node |

---

## 11. Copy

**Unconfigured node — empty state**
> Choose how to split your flow: filter by audience, run an A/B test, or write a custom expression.

**Event property block — no trigger event configured**
> Add a start trigger event to use event property filters.

**Event property block — trigger event changed, conditions cleared**
> Your start trigger event changed. Conditions in this block have been cleared — please reconfigure.

**A/B test — percentage validation error**
> Variant percentages must add up to 100%. Current total: [X]%.

**Deleted segment referenced in a branch**
> Segment "[Name]" no longer exists. Update Branch [Name] before publishing.

**Else branch label**
> Everyone else

**Branch — incomplete, blocks publish**
> Branch [Name] has incomplete conditions. Complete or remove it before publishing.

**Hard limit reached — cannot add more branches**
> You've reached the maximum of [N] branches for this node.

**A/B variant — cannot be removed while flow is live**
> Pause or unpublish this flow before changing the number of variants.

**Expression — variable not found (internal log only, not seller-facing)**
`expression_variable_not_found: {{variable_name}}, resolved to null, customer routed to else`

---

## 12. Dependencies

| Dependency | What is needed | Unavailability behavior |
|---|---|---|
| User property catalog | List of available customer attributes and data types, for User property block | No properties shown. Seller cannot configure property conditions. Node marked incomplete. |
| Event attribute catalog | List of attributes per event name, for Event property and User behavior blocks | No attributes shown. Block body shows a placeholder. Seller cannot add attribute-level conditions. |
| Segment service | Segment list for selection; membership evaluation at runtime | At config time: list unavailable, seller cannot add new segments. At runtime: evaluates to false, routes to Else, logs error. |
| Start trigger event (flow store) | Event name configured on the journey's trigger node, read by Event property block | Event property block shows "no trigger event" state. Non-interactive until trigger is configured. |
| Expression evaluation engine | Parses and evaluates expression syntax at runtime | Customer routes to Else. Evaluation error is logged. |

---

## 13. Out of Scope

| Exclusion | Reason |
|---|---|
| Backend condition evaluation engine | Runtime evaluation is an engineering implementation concern. This PRD defines evaluation rules and failure behavior, not implementation architecture. |
| Statistical significance calculation for A/B tests | Requires integration with a statistics layer. Not in v1 — sellers read raw performance data and decide manually. |
| Saving a conditional branch as a reusable audience segment | Segment creation from journey logic is a separate future feature. |
| Real-time segment membership updates mid-journey | Evaluation uses segment membership at the time the customer reaches the node, not streaming updates. Streaming membership is a future capability. |
| Conditional logic based on prior journey history (e.g., "has entered this flow before") | Requires persistent cross-journey customer state. Out of scope for v1. |
| Mixing modes within one node (e.g., A/B test within a Filter branch) | Each node operates in exactly one mode. Multi-mode logic requires chaining multiple Conditional Nodes. |
| Nested Conditional Nodes (a branch that itself branches) | Standard canvas composition handles this — the seller adds another Conditional Node downstream. No special nesting behavior is needed. |

---

## 14. Open Questions

| Question | Why it matters | Owner | Resolves when |
|---|---|---|---|
| What is the maximum number of Filter branches per node? | Needs a hard cap for evaluation performance, but the number must be grounded in real seller use cases. Is 10 enough for the most complex D2C segmentation flows? | Product + Engineering | Before performance spec is finalized |
| Should leaving the Else branch unconnected produce a warning or block publishing? | Silent customer exits are a real data quality problem, but some sellers intentionally use Else as a suppression path. A warning is better than a hard block, but this must be decided explicitly. | Product | Before publish validation is built |
| Is per-user A/B assignment sticky across re-entries for recurring flows (e.g., weekly cart abandonment)? | A customer who abandons a cart every week will always land in the same variant — which may create long-term exposure bias. Should there be a "sticky per campaign run" option? | Product | Before A/B backend spec is written |
| What happens to in-flight customers when a seller edits a live flow's expression? | Customers mid-journey when expression logic changes may receive inconsistent behavior. Needs a versioning or freeze policy. | Engineering + Product | Before live-edit spec is written |
| Should branch evaluation order be explicitly drag-sortable by the seller? | Evaluation order is functionally significant (first-match-wins), but sellers may not realize this. Explicit ordering controls make the priority contract visible. | Product + Design | Before Filter mode is released |

---

## 15. Decision Log

| Decision | Alternatives Considered | Rationale | Tradeoff Accepted |
|---|---|---|---|
| Three distinct modes rather than a unified condition builder | A single builder combining audience filters, percentage splits, and expressions in one UI | Three modes map to three distinct seller mental models: audience split, experiment, and custom logic. Unified builders that attempt all three become navigation-heavy and hard to learn for sellers who only need one. | A seller cannot mix modes within a single node — expressing "split 80/20 where the 80% is filtered by cart value" requires two chained nodes. |
| Event property block inherits trigger event automatically | Seller re-selects the event manually within the block | The trigger event is the entry context for the entire journey run. Requiring re-selection creates redundancy and introduces drift risk (seller accidentally selects a different event, causing silent misconfiguration). | When the trigger event changes, all event_property conditions must be cleared automatically — a disruptive experience that requires clear in-product communication. |
| First-match-wins evaluation across Filter branches | All-match (customer enters every matching branch), or explicit numeric priority ordering | All-match triggers duplicate actions and creates unpredictable downstream behavior. Explicit numeric priority adds configuration complexity most sellers don't need. First-match-wins is deterministic and matches how sellers naturally reason about if/else logic. | Branch order is functionally significant. The order in which branches are listed is a product decision, not just a display preference. This must be communicated clearly to avoid subtle bugs in seller configurations. |
| A/B test maximum of 8 variants | Unlimited, or capped at 4 or 5 | 8 variants (A–H) supports aggressive testing programs while keeping percentage management tractable. More than 8 variants typically signals a problem with test design — the seller should consolidate hypotheses, not add more arms. | Sellers running hyper-granular cohort splits (>8 groups) must use Filter mode with percentage-based conditions or chain multiple A/B nodes. |
| Expression mode: first-match-wins between expressions | All-match, explicit priority ordering | Consistent with Filter mode semantics. Sellers reason about expressions as an ordered if/else chain — the same mental model as the rest of the node. | Expression order is functionally significant. Sellers must order expressions deliberately. A seller who adds a catch-all expression first will find subsequent expressions never execute. |
