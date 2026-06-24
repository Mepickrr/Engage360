# PRD: Start Trigger

**Status:** Draft
**Author:** Meenal Kamalakar
**Date:** June 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem With Timing](#2-the-problem-with-timing)
3. [What a Start Trigger Does](#3-what-a-start-trigger-does)
4. [The Two Trigger Primitives](#4-the-two-trigger-primitives)
5. [Trigger Paths](#5-trigger-paths)
6. [The D2C Customer Lifecycle & Event Coverage](#6-the-d2c-customer-lifecycle--event-coverage)
7. [The Eligible User Instance](#7-the-eligible-user-instance)
8. [User Personas](#8-user-personas)
9. [Goals & Non-Goals](#9-goals--non-goals)
10. [Success Metrics](#10-success-metrics)
11. [Open Questions & Dependencies](#11-open-questions--dependencies)

---

## 1. Executive Summary

A D2C seller's most valuable moments happen continuously, at any hour, for any number of customers simultaneously: a cart abandoned at midnight, a first order placed on a Sunday, a customer going quiet after 30 days of engagement. Reaching a customer at these moments with a relevant, timely message is the difference between a retained customer and a lost one.

Today, responding to these moments requires either manual work — export a segment, upload to a send tool, schedule a campaign — or engineering time to wire up a custom event listener. Both approaches break at scale. Manual campaigns always arrive after the moment has passed. Engineering dependencies slow iteration to days or weeks. Neither can run continuously without human intervention.

The Start Trigger is how a seller on Engage turns a customer's action into an automated flow — without exporting a file, without a developer, and without doing anything again. It is the entry gate to every automated flow: the standing rule that says "whenever a customer does X, under these conditions, this flow begins for them." Once configured, it runs forever.

---

## 2. The Problem With Timing

D2C sellers have always understood intuitively that the right message at the right moment converts, and the same message sent too late doesn't. What they've lacked is a tool that matches that instinct at scale.

Three failure modes define how sellers communicate today without event-triggered automation:

**Timing failure.** The seller builds a "cart recovery" campaign. They export all users who abandoned a cart in the last 24 hours, upload the list, and schedule the send. By the time the campaign runs, the recovery window — which is at its strongest in the first 1–4 hours after abandonment — has already closed for most users on that list. Some have purchased elsewhere. Others have simply moved on.

**Targeting failure.** The segment exported yesterday is already stale when the campaign runs today. A user who abandoned a cart yesterday but placed an order this morning is still on the list. A user who abandoned a second cart this morning — higher intent than yesterday's abandonment — is not on it. The export captures a moment in time, not the current state of each customer.

**Repeatability failure.** The same logic needs to run not once but every day, for every new customer who fires that event. In a batch world, the seller recreates the segment and the campaign manually at each cycle. As the brand grows and the number of relevant events increases, this work compounds to the point where the seller is spending more time managing campaigns than building the brand.

The Start Trigger eliminates all three: it listens continuously to every user action captured by Engage, evaluates eligibility the moment the event fires, and starts the appropriate flow immediately — without the seller touching anything.

---

## 3. What a Start Trigger Does

A Start Trigger is a standing rule attached to a flow. It answers three questions that must be resolved before any flow can run:

1. **What event starts the flow?** A specific action taken by a user — or the absence of an action over a defined period — that Engage captures as a user instance. This is the signal. Without a captured event, there is no trigger and no flow.

2. **Under what conditions does that event qualify?** Not every occurrence of the event should start the flow. A cart abandonment is only meaningful above a certain value. A product view is only a strong signal if it happens repeatedly. The event must also carry specific properties for the entry to count.

3. **Which users from those who fired the event actually enter?** From all users who fire the qualifying event, only those who also meet a defined user profile — by identity, property, behavior, or affinity — are admitted into the flow.

Once these three questions are answered and the flow is activated, the trigger operates without further input from the seller. Every customer who matches, at any hour, on any day, enters the flow at exactly the right moment.

A Start Trigger can also operate in broadcast mode — dispatching a flow to a defined audience at a scheduled time, for sellers who need a one-time send rather than an event-driven response. This path has no event condition step; it operates on schedule rather than signal.

---

## 4. The Two Trigger Primitives

All triggers belong to one of two fundamentally different types. Understanding the distinction matters not just for sellers configuring flows, but for the infrastructure required to support them.

### Action-Based Triggers

A user performs a specific action that Engage captures as an event instance. The trigger evaluates immediately when that event fires.

- The signal is the user's action — it is present, active, and high-intent
- The window of opportunity is typically short: minutes to hours for transactional events, days for post-purchase events
- Infrastructure: the trigger fires from the event stream the moment the instance is recorded

**Examples:** Cart abandoned, first order placed, account created, payment failed, order delivered, review submitted, app installed

### Inactivity-Based Triggers

A user has not performed a specific action within a defined time window. Engage evaluates this condition on a schedule.

- The signal is absence — the user's silence is the indicator
- The window of opportunity is longer but still time-sensitive: a 30-day lapse is recoverable; a 90-day lapse is significantly harder to reverse
- Infrastructure: the trigger requires a scheduled evaluation engine that runs periodically against the full user base, not just against incoming events

**Examples:** No purchase in the last 30 days, no website visit in the last 14 days, no email opened in the last 21 days, due for replenishment based on purchase history

The inactivity type is architecturally distinct from the action type. A seller configuring a reactivation flow — "reach users who haven't purchased in 30 days" — is building a different kind of rule than one configuring a cart recovery flow. Both are Start Triggers from the seller's perspective, but they require different backend execution models.

---

## 5. Trigger Paths

When a seller creates a flow, the first decision they make is what kind of trigger to set up. This choice determines the entire configuration path that follows. The three paths are structurally different — not just in appearance but in the seller's underlying intent.

| Path | What initiates the flow | Seller's mental model |
|---|---|---|
| Event-Triggered | A user's action — or inaction — captured by Engage | "React to what my customer just did" |
| Broadcast | The seller's decision to push to a defined audience | "Reach a specific list of people at a specific time" |
| Date-Relative | A meaningful date in the user's life or relationship with the brand | "Anticipate a moment I know is coming for this customer" |

---

### Path 1 — Event-Triggered

**What the seller is trying to accomplish:** React to something a customer just did — or stopped doing. The flow starts for each user individually, at the exact moment they take a relevant action, without the seller having to identify them or time the send manually.

**Configuration sequence:**

**Step 1 — Select the event.** The seller picks the user action that starts the flow. This can be an action the user takes (cart abandoned, order placed, account created) or an inactivity condition — the absence of an action over a defined period (no purchase in 30 days, no visit in 14 days). If the event is not captured by Engage, it cannot serve as a trigger.

**Step 2 — Set event conditions (optional).** The seller narrows which occurrences of that event qualify. Not every cart abandonment starts the flow — only those above ₹500. Not every product view — only repeated views of a specific category. These conditions filter on the properties attached to the event at the time it fires.

**Step 3 — Define who enters.** From the users who fired the qualifying event, the seller filters further by: identity type (all users, Engage identified, or known users), user property, user behavior, user affinity, or custom segment. Multiple filters can be combined. An exclusion condition can be set separately — any user who meets the exclusion does not enter, regardless of other conditions.

**Step 4 — Set entry rules.** The seller defines whether the same user can enter the flow more than once, and if so, how frequently.

This path runs continuously. Every user who fires the qualifying event and meets all conditions enters the flow — at any hour, any day — without the seller doing anything after the initial setup.

---

### Path 2 — Broadcast Trigger

**What the seller is trying to accomplish:** Reach a fixed, defined audience once, at a specific moment. There is no event to listen for. The seller already knows who they want to reach and when.

**Configuration sequence:**

**Step 1 — Define the audience source.** The seller chooses how to bring in the audience. Two options:

- **CSV** — The seller either uploads a new file, or selects from previously uploaded CSV files stored in their Engage account. The CSV contains user identifiers (email, phone number, or customer ID) that Engage matches to existing user profiles.

- **Segment** — The seller either selects a saved segment from their existing segment library, or creates a new one on the spot. Segment creation uses the same condition builder as the user filter layer in event-triggered flows: user property, user behavior, and user affinity conditions, combined with AND/OR logic.

> The segment creation option being available inline here is significant: it means the seller does not need to leave the flow builder to define their audience. They can build the segment, apply it as the broadcast audience, and continue configuring — all in one session.

**Step 2 — Refine with user property filters (optional).** On top of the audience brought in by the CSV or segment, the seller can apply additional user property conditions to narrow further. For example: a seller uploads a CSV of 10,000 customers but wants to send only to those in specific cities. The city filter is applied here. This step does not replace the audience source — it refines it.

**Step 3 — Set the schedule.** Two options:
- **Send immediately on activation** — the flow begins processing the audience the moment the seller activates it
- **Send on a specific date and time** — the flow is queued and starts at a future point the seller defines

Broadcast is a one-time operation. Once the defined audience has been processed, the trigger does not re-evaluate or re-run.

---

### Path 3 — Date-Relative Trigger

**What the seller is trying to accomplish:** Start a flow at a moment that is personally meaningful to the customer — a birthday, an anniversary, a first purchase milestone — timed precisely relative to that date. The seller cannot react to this moment; they have to anticipate it.

**Two types of date sources:**

**Profile date attribute** — A date stored on the user's profile, passed to Engage by the seller's platform or collected from the user directly. Examples: `date_of_birth`, `anniversary_date`.

**Derived / calculated date** — A date that Engage calculates from a user action or event. Examples: date of first purchase, date of account creation, date subscription was activated. The seller references the underlying event and Engage computes the date from it.

Available date attributes:

| Source | Attributes |
|---|---|
| Profile date attributes | Date of Birth, Anniversary Date, *(custom date attributes from seller's platform)* |
| Derived dates | Account Created, Date of First Order, Date of Subscription Start |

**Configuration sequence:**

**Step 1 — Select the date reference.** The seller picks either a profile attribute or a derived event date. This is the anchor for the trigger. The seller can switch between date attributes using an inline dropdown without returning to the event picker.

**Step 2 — Set the offset.** The seller defines when, relative to that date, the user should enter the flow:

- **Before the date** — X days / weeks / months before. Used for anticipatory flows: "Your birthday is in 7 days — here's a gift."
- **On the date** — The user enters the flow on the exact date. Used for same-day sends. Number and unit inputs are hidden.
- **After the date** — X days / weeks / months after. Used for follow-up flows: "Your first purchase anniversary was last week — thank you for being with us."

> **Birthday Week / Month:** A seller who wants to run a birthday week campaign sets the offset to 7 days before. The user enters the flow on day −7, and the flow itself handles the cadence of messages across the week. The trigger defines the entry point; the flow handles what happens next.

**Step 3 — Set recurrence.** The seller can enable **annual recurrence**. When enabled, Engage evaluates the trigger each year on the same relative offset — the flow fires automatically every year without the seller having to recreate it. Enabled by default.

**Step 4 — Apply user filters (optional).** The seller can narrow which users the date-relative trigger applies to, using the same filter types as the event-triggered path: user property, user behavior, user affinity, or custom segment.

---

## 6. The D2C Customer Lifecycle & Event Coverage

Every user instance that Engage captures corresponds to a moment in the customer's relationship with the seller. Sellers don't think in event names — they think in moments: "I need to reach the customer right after they abandon a cart" or "I want to re-engage customers who've gone quiet."

The following sections map those seller intentions to the events that serve them, organized by lifecycle stage. For each stage, the section covers: what the seller is trying to accomplish, which events are the relevant signals, and why timing is critical at that stage specifically.

> **Note:** An event can only serve as a Start Trigger if it is captured by Engage as a user instance. If an action is not tracked — either because the integration is not set up or because the seller's platform does not emit that event — no flow can be triggered on it. The seller's event coverage is the ceiling of their trigger capability.

---

### Stage 1 — Acquisition & First Touch

**Seller intent:** A new user has discovered the brand. This is the highest-leverage moment in the entire customer lifecycle — and also the most time-sensitive. A seller who communicates in the first few hours of a user's first interaction sets the tone for the entire relationship. A seller who waits three days is reaching a user whose initial interest has already cooled.

**The window:** 0–24 hours from first interaction. After 24 hours, the probability of a new user making their first purchase drops significantly.

| Event | What it signals | Seller response |
|---|---|---|
| New Website Visit | A previously unknown user has arrived at the seller's storefront for the first time | Awareness-stage welcome — introduce the brand, not the product |
| Account Created | The user has committed enough to create a relationship — name, email, or phone number are now known | Welcome sequence — the first communication in an ongoing relationship |
| Newsletter / SMS Opt-In | The user has explicitly invited the seller to communicate | Confirmation + first engagement — the user has set an expectation, honor it immediately |
| App Installed | User has downloaded the mobile app — mobile-first intent signal | Onboarding flow — get the user to their first meaningful action in the app |
| Referral Link Visited | User arrived because another customer recommended the brand | Trust-primed acquisition — this user already has social proof; lead with that |

**What sellers get wrong here:** Treating all acquisition events the same. A user who creates an account has a fundamentally different relationship with the brand than a user who just visited. A user who came via referral is warmer than one who arrived from a paid ad. Flows calibrated to the specific acquisition event perform better than a single "new user" flow.

---

### Stage 2 — Consideration & Intent

**Seller intent:** The user is evaluating. They are browsing, comparing, and forming a purchase decision. These are intent signals — the seller's job is to either accelerate the decision or rescue it before the user moves on.

**The window:** Intent signals decay within 24–48 hours. A user who views a product three times in one day has high purchase intent. The same user, unapproached, in five days has likely made a decision elsewhere or forgotten.

| Event | What it signals | Seller response |
|---|---|---|
| Product Viewed | User has looked at a specific product | Consideration nudge — provide information that closes hesitation (reviews, sizing, availability) |
| Category Browsed | User is exploring a product range without committing to a specific item | Category-level engagement — guide them toward the most relevant products |
| Product Added to Wishlist | User wants the product but is not ready to buy — price, timing, or conviction is the barrier | Wishlist reminder — especially powerful when paired with a limited-time signal |
| Search Performed | User is looking for something specific — high-intent signal | Search-based response — surface the most relevant products to what they searched |
| Browse Abandonment (repeated views, no cart add) | User has viewed a product multiple times without proceeding — high consideration, stalled decision | Recovery nudge — social proof, urgency, or an incentive to break the inertia |
| Price Drop on Viewed Product | A product the user has shown interest in is now cheaper | Proactive alert — the barrier that was holding them back may have just been removed |
| Back in Stock | A product the user viewed when it was unavailable is now available | Availability alert — the user expressed intent when the product wasn't there; now it is |

**The browse abandonment distinction:** A single product view is curiosity. Three views of the same product within a 48-hour window is a stalled purchase decision. Sellers should be able to configure browse abandonment triggers that fire on repeated view patterns, not just any visit to a product page. The threshold — how many views, over what time window — is a condition the seller sets.

---

### Stage 3 — Purchase & Conversion

**Seller intent:** The user is at the bottom of the funnel. Every event in this stage represents the highest purchase intent the user has expressed. The seller's job is to remove friction, recover abandonment, and confirm the decision the moment it's made.

**The window:** The tightest windows in D2C. Cart abandonment: 0–4 hours. Payment failure: 1–2 hours. First order welcome: 0–24 hours. These are not guidelines — the difference between a 1-hour response and a next-day response is measured in recovery rate percentage points.

| Event | What it signals | Seller response |
|---|---|---|
| Add to Cart | User has expressed explicit intent to purchase a specific product | Cart acknowledgment — can initiate a soft nurture sequence, especially for high-value items |
| Cart Abandoned | User added to cart but left without completing purchase | Cart recovery — the most commercially valuable trigger in D2C; highest ROI flow type |
| Checkout Started | User began the checkout process — higher intent than cart add | Checkout recovery — the user was one step from buying; friction or hesitation stopped them |
| Checkout Abandoned | User began checkout but did not complete — intent is confirmed, something specific interrupted | High-urgency recovery — this user was ready to buy; reduce friction immediately |
| Payment Initiated | User submitted payment | Confirmation pending — manage the waiting state |
| Payment Failed | Payment was attempted and declined | Payment recovery — the user intended to buy and hit a technical or financial barrier; act within 1–2 hours |
| First Order Placed | User completes their first ever purchase | First-purchase welcome — the most important purchase event; sets the LTV trajectory for the entire relationship |
| Repeat Order Placed | An existing customer places a subsequent order | Loyalty acknowledgment + upsell opportunity — this customer is demonstrating ongoing commitment |

**First order vs. repeat order:** These are not the same event. A first-time buyer needs onboarding into the brand relationship — what to expect, how to get help, what to do next. A repeat buyer has already proven loyalty; they need acknowledgment and an invitation to deepen the relationship. A single "order placed" flow that treats both the same is a targeting failure. Sellers should configure distinct flows for each, triggered by the same base event with a user profile condition (has placed 0 prior orders vs. 1+ prior orders) differentiating them.

---

### Stage 4 — Fulfillment & Experience

**Seller intent:** The purchase is made. The user is waiting. This is a high-anxiety period — especially for first-time buyers and high-value purchases. Proactive communication during fulfillment builds trust, reduces support volume, and sets the emotional tone for the post-delivery relationship.

**The window:** Fulfillment events are time-stamped moments. The response window is short — within minutes of each status change. A shipping confirmation sent 4 hours after dispatch is useful. Sent 2 days later, it creates more confusion than it resolves.

| Event | What it signals | Seller response |
|---|---|---|
| Order Confirmed | System has received and validated the order | Confirmation + expectation setting — what happens next, in what timeframe |
| Order Packed / Ready to Ship | Order has been prepared for dispatch | Processing acknowledgment — optional, but valuable for high-involvement categories |
| Order Shipped | Order has left the warehouse; tracking is now available | Shipping notification with tracking — the event buyers check email for |
| Out for Delivery | Order is in the last-mile phase; delivery is today | Delivery day alert — reduce missed delivery; give user agency to prepare |
| Order Delivered | Confirmed delivery by courier | Delivery confirmation — transition from fulfillment to post-purchase relationship |
| Delivery Attempted, Failed | Courier attempted delivery; customer was unavailable | Reattempt coordination — fast action prevents the order from being returned to origin |
| Order Delayed | Expected delivery date has been extended | Proactive delay notification — the most trust-building thing a seller can do when something goes wrong |

**Why this stage is commercially undervalued:** Sellers over-invest in pre-purchase triggers and under-invest in fulfillment communication. The emotional state of a user during fulfillment directly determines whether they leave a positive review, whether they return for a second purchase, and whether they recommend the brand. Silence during this window is a missed relationship-building moment.

---

### Stage 5 — Post-Purchase & Loyalty

**Seller intent:** The order has been received. The product experience is fresh. This is the window to collect social proof, reinforce the purchase decision, build loyalty, and identify customers with VIP potential.

**The window:** Post-delivery review requests: optimal at 2–3 days post-delivery. Loyalty milestone acknowledgment: within minutes of the milestone being crossed. Return/refund communication: within 1–2 hours of the request being initiated.

| Event | What it signals | Seller response |
|---|---|---|
| Review Not Submitted (2–3 days post-delivery) | User has received the product but not left a review | Review request — while the product experience is still vivid |
| Review Submitted | User has left a review (positive or negative) | Acknowledgment — for positive reviews, gratitude and a loyalty incentive; for negative reviews, service recovery |
| Return / Refund Initiated | User is dissatisfied or the product did not meet expectations | Service recovery flow — speed and empathy here can convert a churn signal into retention |
| Refund Completed | Refund has been processed | Closure + re-engagement — acknowledge the return honestly and invite the user back |
| Loyalty Points Milestone Reached | User has crossed a meaningful points threshold | Milestone celebration — the moment of achievement is high-emotion; time it with the event |
| Loyalty Tier Upgraded | User has moved to a higher loyalty tier | Tier recognition — communicate the new benefits and reinforce the status |
| Referral Made | User has referred another customer to the brand | Referrer recognition — close the loop on the referral; incentivize the next one |

**The return/refund signal:** A return initiation is not just an operational event — it is a dissatisfaction signal. A seller who responds to this event with a proactive service recovery flow (acknowledge the issue, make it easy, offer something forward-looking) can convert a churning customer into a retained one. A seller who treats it as purely operational (send refund confirmation, nothing more) misses the relationship recovery window entirely.

---

### Stage 6 — Retention & Reactivation

**Seller intent:** The customer relationship is at risk. The seller's job in this stage is to detect the earliest signal of disengagement and act before the customer is fully gone. Every day of delay reduces recovery probability.

**The window:** This is the one stage where the window is measured in weeks, not hours — but that doesn't mean timing is less critical. The difference between reaching a lapsed customer at 30 days vs. 60 days is significant. Reactivation campaigns to 30-day lapsed users recover 3–5x more customers than campaigns to 90-day lapsed users.

All triggers in this stage are **inactivity-based** — the signal is what the user has *not* done.

| Inactivity Condition | What it signals | Seller response |
|---|---|---|
| No purchase in last 30 days | First lapse signal — customer has interrupted their normal purchase cadence | Soft re-engagement — check in, not a hard sell |
| No purchase in last 60 days | Deepening lapse — the customer is drifting | Re-engagement with incentive — the cost of a discount is less than the cost of churn |
| No purchase in last 90 days | Critical lapse — high churn probability | Win-back campaign — last meaningful attempt before the customer is considered churned |
| No website visit in last 14 days | Engagement lapse — the customer has stopped interacting with the storefront | Re-engagement stimulus — surface something new, relevant, or personalised |
| No email or SMS opened in last 21 days | Communication lapse — the customer is disengaging from all touchpoints | Reactivation on a different channel, or a re-permission message |
| Replenishment due | Based on product type and purchase history, the user is likely running low on a consumable | Proactive replenishment prompt — before the user has to remember to reorder |

**The replenishment signal is different from all others:** It is not reactive — it is predictive. It is the seller saying "I know you bought a 30-day supply of this product 25 days ago, and you're probably running low" before the customer has experienced the absence. This is only possible when Engage has purchase history data and the seller has configured the product's replenishment window. Done well, it is the most valuable communication in the seller's retention arsenal — it converts repurchase from a decision the customer must initiate into something that simply happens.

---

## 7. The Eligible User Instance

An event firing does not automatically mean a user enters the flow. Before a user instance is admitted into a flow, three layers of eligibility are evaluated in sequence. All three must be satisfied.

### Layer 1 — Event Conditions

The event must match specific property conditions set by the seller. This filters which occurrences of an event are meaningful.

- A cart abandonment only qualifies if the cart value exceeds ₹500
- A product view only qualifies if the viewed product is in a specified category
- A purchase only qualifies if it is the user's first order (no prior orders on record)

Multiple event conditions can be combined with AND or OR logic. These conditions operate on the properties attached to the event instance at the time it was captured. If the event carries no properties, no event conditions can be set.

---

### Layer 2 — User Eligibility

From users who fired the qualifying event, the seller defines which users are actually eligible to enter the flow. This is done across two dimensions: identity type and user filters.

#### Identity Type

Establishes the baseline of who is reachable before any other filter is applied.

| Identity Type | Who it includes | When sellers use it |
|---|---|---|
| All Users | Any user who fires the event, regardless of whether Engage has resolved their identity. Includes anonymous sessions. | Best for early-funnel triggers — new website visits, browse abandonment — where anonymous users are a valid and valuable audience |
| Engage Identified | Users the Engage identity graph has resolved to a persistent profile. The platform has at minimum a consistent device or session identity for these users. | Mid-funnel triggers where some identity certainty is needed for personalization |
| Known User | Users with a confirmed customer record — an email address, phone number, or account ID that ties back to a verified customer. The seller has an established relationship. | Post-purchase and retention triggers where the seller needs a confirmed channel to communicate on |

Identity type is not a filter applied on top of event conditions — it is a pre-condition. A user who fires the event but does not meet the identity type requirement is not evaluated further.

#### User Filters

After identity type is established, the seller can narrow the eligible pool using one or more of the following filter types. Multiple filters can be combined with AND or OR logic.

---

**Filter by User Property**

Narrows by static attributes of the user's profile as recorded by Engage.

- Attributes such as city, registration date, language preference, device type, plan tier, or any custom user attribute the seller's platform passes to Engage
- Operators vary by data type: text fields support equals, does not equal, contains, starts with; numeric fields support greater than, less than, between; date fields support before, after, within last N days; boolean fields support is true, is false
- A user must meet all conditions within a property filter block if they are combined with AND, or at least one if combined with OR

**Example:** A seller wants to run a cart recovery flow only for users in Tier 1 cities. They filter by User Property: City is one of [Mumbai, Delhi, Bangalore, Chennai, Hyderabad]. Only cart abandonments from users in those cities enter the flow.

---

**Filter by User Behavior**

Narrows by what the user has done historically, based on events Engage has captured for them.

- Conditions are structured as: user [has done / has not done] [event] [frequency condition] [time window]
- Frequency conditions: at least N times, exactly N times, at most N times, between N and M times
- Time windows: in the last N days, in the last N weeks, in the last N months
- Multiple behavior conditions combined with AND or OR logic

**Example:** A seller wants a reactivation flow that only reaches lapsed customers who were previously active buyers — not users who signed up but never purchased. They filter by User Behavior: has placed an order at least 1 time in the last 180 days. Users who signed up but never bought do not enter the reactivation flow; a different welcome-back flow is more appropriate for them.

---

**Filter by User Affinity**

Narrows by what the user tends toward, computed from their historical action patterns against event attributes. Affinity filters are derived signals — they represent what a user *predominantly does*, not just what they did once.

Affinity is computed by Engage by analyzing the distribution of a user's actions across an attribute's values over time. Four affinity operators are available:

| Operator | Meaning | Example |
|---|---|---|
| **Predominantly** | The user performs this action more often for this attribute value than any other | User predominantly browses the Beauty category — more of their product views are Beauty than any other category |
| **Minimum of X%** | The user performs this action for this attribute value at least X% of the time | User's purchases are in the Electronics category at least 40% of the time |
| **Most number of times (top X%)** | The user is in the top X percentile for frequency of this action on this attribute | User is in the top 10% of all users by number of Sports product views |
| **Least number of times (bottom X%)** | The user is in the bottom X percentile | User is in the bottom 20% of users by app open frequency |

Affinity filters support string and numeric attribute types. Multiple affinity attributes can be combined into a single affinity condition.

**Why affinity matters:** A user who bought a skincare product once may have done so as a gift. A user who *predominantly* browses skincare and whose last three purchases were all skincare products has a genuine interest in that category. Affinity captures the pattern, not just the latest instance. For sellers who want to match flow content to user interest — not just past behavior — affinity is the most powerful filter available.

---

**Filter by Custom Segment**

Narrows by membership in a pre-built, saved segment.

- The seller selects from existing named segments in their Engage account
- The user must be a current member of that segment at the time of flow entry evaluation
- Segment membership is evaluated dynamically — if the user's segment membership changes after the trigger fires but before the evaluation completes, the latest membership state applies

**Example:** A seller has a saved segment called "VIP Customers" — users who have spent over ₹50,000 lifetime. They run a post-delivery flow that behaves differently for VIPs: a concierge-style message rather than a standard review request. They use the VIP segment as a filter to route those customers into a separate, higher-touch flow.

---

#### Exclusion Logic

A separate exclusion condition can be defined alongside the include conditions. Any user who matches an exclusion condition is blocked from entering the flow, regardless of whether they satisfy all other eligibility criteria.

**Exclusion takes precedence over inclusion in all cases.** A user who matches both include and exclude conditions does not enter the flow.

Exclusion uses the same filter types as inclusion: user property, user behavior, user affinity, and custom segment. Common exclusions: users currently active in another flow, users who already purchased the product being promoted, users who opted out of a specific communication type.

---

### Layer 3 — Entry Rules

After a user passes event conditions and user eligibility, entry rules determine whether this specific user, at this specific moment, is admitted.

| Rule | Behavior |
|---|---|
| **No re-entry** | A user who has previously completed or is currently active in this flow is not admitted again. Default behavior when no entry rule is set. |
| **Allow re-entry** | The same user can enter the flow again each time they fire the qualifying event, subject to frequency limits. |
| **Frequency limit** | A user can enter this flow at most N times within any rolling window of X days. Entry attempts that exceed the limit are suppressed. |

Entry attempts that are blocked by re-entry rules or frequency limits are logged in flow analytics with the reason for suppression. This allows the seller to distinguish "this event never fired for this user" from "this user fired the event but was blocked from re-entering." These are different problems with different solutions; treating them as the same makes diagnosis impossible.

---

### Exit Conditions

Exit conditions define the circumstances under which a user is removed from a flow they have already entered, before they have completed it.

A seller can define one or more exit conditions. If a user meets any exit condition at any point during their time in the flow, they are immediately removed — before the next scheduled action executes.

Multiple exit conditions are evaluated with OR logic: meeting any single exit condition triggers removal.

Exit condition evaluation happens before any action node executes at each step. A user who meets an exit condition at the precise moment they would have received a message does not receive that message.

**Example:** A seller runs a cart recovery flow. The exit condition is: user places an order. A user who abandons a cart and then purchases on their own within the 4-hour recovery window exits the flow before receiving the recovery message. They do not get a "come back and complete your purchase" message after they have already purchased.

---

## 8. User Personas

### Persona 1 — The Early-Stage D2C Founder

**Context:** Running a 1–2 year old brand, typically in a single category. Manages marketing themselves or with one generalist hire. They know they are leaving money on the table — abandoned carts they're not recovering, first-time buyers they're not following up with — but lack the time and technical capacity to fix it systematically.

**What they need from Start Trigger:** Speed and simplicity. They want to configure the three flows that stop the most immediate revenue leakage — cart recovery, first purchase welcome, post-delivery review ask — within a single working session. They need confidence that the right users are entering (an audience count before they activate) and clarity that the flow is live and running without them having to check it.

**What breaks their trust:** They configure a cart abandonment trigger with a filter they think is reasonable (cart value above ₹2,000). They activate the flow. After a week, the flow shows zero entries. They don't know if the event isn't being captured, if the cart value filter is too aggressive, or if something is wrong with the integration. They assume the product doesn't work.

**The failure this persona reveals:** Sellers need feedback at the moment of configuration — not just after activation. An audience count check before saving is the mechanism that catches misconfigurations before they waste a week.

---

### Persona 2 — The Lifecycle Marketer at a Scaling Brand

**Context:** 3–5 year old brand with a dedicated marketing team. Already running some automation but wants more granular control — separate flows for first-time vs. repeat buyers, behavioral conditions based on purchase frequency, affinity-based personalization. They think in lifecycle architecture, not individual campaigns.

**What they need from Start Trigger:** Precision and composability. The ability to stack event conditions, user property filters, behavioral history, and affinity signals into a single, specific trigger. The ability to build separate flows that are activated by the same base event but differentiated by who the user is. The ability to see an accurate audience count that reflects the intersection of all conditions.

**What breaks their trust:** They configure a complex trigger (first order placed + affinity for Beauty + not in the VIP segment). The audience count comes back at 12 users. They expected hundreds. They can't tell which layer of the filter is responsible — the event condition, the affinity filter, or the segment exclusion. Without the ability to check each layer individually, they spend hours debugging a condition stack.

**The failure this persona reveals:** Audience count at the level of the full combined rule is necessary but not sufficient for complex triggers. Sellers building multi-condition triggers need to understand which layer of the filter is narrowing the audience most aggressively.

---

### Persona 3 — The Ops / Broadcast Sender

**Context:** Not a lifecycle marketer. Handles operational and time-sensitive communications: sale launches, policy updates, new collection announcements, flash offers. Needs to dispatch to a large, defined audience at a specific time, not in response to individual user actions.

**What they need from Start Trigger:** A fast path to broadcast configuration. Two steps to set a schedule and an audience; no event condition logic required. The ability to reach all identified users immediately or at a precise future date and time.

**What breaks their trust:** They need to send an announcement in 30 minutes. They open the trigger configuration and land in the event selection flow. They don't understand why they need to pick an event to send a broadcast. They can't find the "send now" option. They miss their window.

**The failure this persona reveals:** The broadcast path must be immediately accessible and clearly distinct from the event-triggered path. For ops senders, any friction between opening trigger configuration and scheduling the send is mission-critical friction.

---

## 9. Goals & Non-Goals

### Goals

1. Allow sellers to configure event-triggered flows in response to any Engage-captured user instance, without engineering involvement.
2. Support the full D2C customer lifecycle through a comprehensive, well-organized event taxonomy — from acquisition through reactivation.
3. Treat action-based and inactivity-based triggers as distinct trigger types with distinct configuration paths, reflecting their different natures.
4. Enable precise audience eligibility through composable user filters: identity type, user property, user behavior, user affinity, and custom segment.
5. Give sellers pre-activation confidence through audience count feedback — the ability to estimate how many users will enter the flow before going live.
6. Support broadcast / scheduled dispatch as a distinct, fast-path trigger mode for non-event-driven communications.
7. Make entry logic transparent through analytics: blocked entries due to re-entry rules or frequency limits are logged and distinguishable from no-event scenarios.

### Non-Goals

| Item | Why deferred | What would unlock it |
|---|---|---|
| Real-time audience count (auto-refreshes on condition change) | Every condition change would trigger an API call; distracting and expensive without debounce + caching | Count API with a caching and debounce layer |
| Test-firing a trigger event | Requires event simulation infrastructure — the ability to synthetically fire an event and verify the flow responds | Event simulation service |
| Configurable re-entry modes beyond frequency limits | "Allow re-entry only if user is not currently active in the flow" requires per-user active-flow state tracking | Backend queuing model with per-user flow state |
| Control groups / holdout groups | No holdout percentage, randomization strategy, or reporting surface defined | Experimentation framework design |
| Multi-event exit triggers with AND logic | Current exit trigger uses OR (any single condition triggers exit); AND requires nested condition support | Backend support for nested exit trigger conditions |
| Frequency cap analytics (why a specific user was blocked) | Requires an entry-attempt log separate from the entry log | Backend entry-attempt event schema |

---

## 10. Success Metrics

| Metric | Target | Why it matters |
|---|---|---|
| Trigger configuration completion rate | ≥ 80% of new flows saved with a configured trigger | Below this indicates sellers are abandoning trigger setup — a usability or complexity failure |
| Median time to configure | < 3 minutes from trigger setup open to save | A trigger that takes 10 minutes to set up won't be used for iterative, experimental flows |
| User filter adoption rate | ≥ 40% of configured triggers include at least one user-level filter | If sellers aren't filtering, they're sending to everyone — the precision value of the system isn't being realized |
| Audience count check rate | ≥ 50% of triggers with user filters use "Show count" before activating | Sellers who validate audience size before activating are less likely to discover misconfiguration post-launch |
| Zero-entry rate in first 7 days | < 5% of activated flows show zero entries | Above 5% indicates systemic misconfiguration — likely event condition mismatch or identity type selection error |
| Lifecycle stage breadth per seller | ≥ 2 distinct lifecycle stages covered per active seller (average) | A seller with triggers only in one stage is underutilizing the system; breadth indicates maturity and value realization |
| Inactivity trigger adoption | ≥ 20% of active sellers have at least one inactivity-based trigger configured | Inactivity triggers represent the retention use case; low adoption suggests sellers don't understand or trust the feature |

---

## 11. Open Questions & Dependencies

### Dependencies

| Dependency | What is needed | Consequence if unavailable |
|---|---|---|
| Event capture coverage | Engage must be capturing and classifying the events in the lifecycle taxonomy above for each seller's integration | If an event is not captured, no flow can be triggered on it; the seller's trigger capability is bounded by their event coverage |
| Inactivity evaluation engine | A scheduled engine that periodically evaluates inactivity conditions against the full user base | Without this, inactivity-based triggers (lapse, replenishment, engagement decay) cannot function; they cannot run on the event stream alone |
| Audience count API | A backend endpoint that evaluates the full trigger + user filter rule and returns an estimated user count | "Show count" is unavailable; sellers activate flows with no visibility into expected entry volume |
| Identity graph | Engage's identity resolution must be operational for "Engage Identified" and "Known User" identity type filters to function correctly | Identity type filters would be unreliable; sellers could not confidently restrict flows to confirmed customer records |
| Segments service | The list of saved segments must be available and integrated with trigger evaluation | "Filter by Custom Segment" is unavailable; sellers cannot reference pre-built segment logic in trigger conditions |

### Open Questions

| # | Question | Why it matters | Owner |
|---|---|---|---|
| Q1 | What is the default re-entry behavior when a seller does not explicitly configure an entry rule? | Without a documented default, the system either creates duplicate journeys or silently drops entries — both are trust failures | Product |
| Q2 | How frequently does the inactivity evaluation engine run? Daily batch, or is near-real-time evaluation supported? | Determines the precision of lapse triggers: a daily batch means a "30-day lapse" fires sometime in the 24-hour window after day 30, not at the exact moment | Engineering |
| Q3 | When a seller edits a trigger on a live flow, what happens to users currently in-flight? Do they continue under the old trigger conditions, or are they re-evaluated against the new conditions? | The seller's mental model of what a trigger edit does is different depending on the answer; needs to be defined before edit behavior is built | Engineering + Product |
| Q4 | What events from the catalog are available as exit conditions? All events, or only a defined subset? | Exit conditions fire a different kind of evaluation than trigger conditions — not all events may be suitable for exit evaluation (e.g., anonymous session events) | Engineering |
| Q5 | Should "Show count" be available before the seller adds any user filters, or only once filtering is active? | If shown without filters, it returns the total universe of users who recently fired the event — useful as a baseline, but potentially misleading if the seller reads it as their filtered audience | Product |
| Q6 | How is replenishment window configured — at the product level, at the flow level, or derived automatically by Engage from purchase history patterns? | Replenishment triggers are only useful if the timing is accurate; the configuration model determines accuracy and seller control | Product + Engineering |
