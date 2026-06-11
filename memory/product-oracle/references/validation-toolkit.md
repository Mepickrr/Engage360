# Validation Toolkit: MVT Design, Testing, and Anti-Patterns

This file contains the practical tools for validating ideas and designing tests.
Read after the mental model files, when you need to design specific experiments.

---

## THE SPEED-LEARNING HIERARCHY

Always start at the TOP. Only move down when the level above is validated.
Each level increases cost and time but also confidence.

| Level | Method | Time | Cost | Confidence |
|---|---|---|---|---|
| 1 | **Fake Door Test** — button/page that doesn't exist yet, measure clicks | Hours | $0-50 | Low-Med |
| 2 | **Landing Page + Ads** — describe the product, measure signups/payments | 2-5 days | $100-500 | Medium |
| 3 | **Concierge MVP** — deliver the service manually, person-by-person | Days-Weeks | $0-500 | Med-High |
| 4 | **Wizard of Oz** — fake the technology, human behind the curtain | 1-2 weeks | $200-1000 | Med-High |
| 5 | **Single-Feature MVP** — build ONE thing, nothing else | 2-4 weeks | $500-5000 | High |
| 6 | **Full Product** — multiple features, real infrastructure | Months | $5000+ | Highest |

**⛔ NEVER jump to Level 6 before validating at Levels 1-3.**
**Rule:** If you can learn the same thing at a cheaper/faster level, you MUST use that level first.

### Level Details

**Level 1: Fake Door Test**
Create a button, menu item, or landing page for a feature/product that doesn't exist yet.
Measure: click-through rate, signup rate, time spent.
Example: Add a "Premium Plan" button to your existing product. When clicked, show "Coming soon — enter email to be notified." If <2% click, the demand signal is weak.

**Level 2: Landing Page + Targeted Ads**
Build a single page describing the product/value proposition. Run $100-500 in targeted ads.
Measure: cost per click, signup conversion rate, email collection rate, payment intent.
Thresholds: If cost per signup > $50 for consumer product, distribution economics likely don't work. If <3% of visitors take action after 500+ visitors, value proposition needs rethinking.

**Level 3: Concierge MVP**
Deliver the product's value MANUALLY to individual customers. No technology.
Example: Instead of building an AI meal-planning app, personally create meal plans for 10 people via email. Watch their reactions. Are they delighted? Do they refer friends? Will they pay?
This is the BEST way to deeply understand the customer (Altman A2: "watch them use your product").

**Level 4: Wizard of Oz**
The user thinks they're interacting with a product, but a human is doing the work behind the scenes.
Example: A "chatbot" where responses are actually typed by a human. Looks automated, isn't.
This tests the user experience without building the technology.

**Level 5: Single-Feature MVP**
Build ONE feature — the core magic moment. Nothing else. No settings, no profiles, no analytics dashboard. Just the one thing that delivers the core value.
This is where Musk's Algorithm applies most powerfully: Question → Delete → Simplify.
Jobs: "If you could only ship ONE thing, what is it?"

---

## MVT DESIGN FRAMEWORK

### Step 1: Identify the #1 Riskiest Assumption

Every idea has multiple assumptions. Find the ONE that, if false, makes everything else irrelevant.

**Common riskiest assumptions by idea type:**

| Idea Type | Riskiest Assumption Usually Is |
|---|---|
| Consumer App | "Users will invite other users" (distribution) |
| B2B SaaS | "Companies will pay $X/month for this" (willingness to pay) |
| Marketplace | "Both sides will show up" (chicken-and-egg) |
| Content/Media | "People will engage repeatedly" (retention) |
| Hardware | "It can be manufactured at target cost" (unit economics) |
| AI/ML | "The model is accurate enough to be useful" (quality threshold) |
| Platform | "Developers will build on this" (ecosystem) |

### Step 2: Design the Cheapest Possible Test

Use the Speed-Learning Hierarchy. Select the lowest level that can validate the riskiest assumption.

**Design principles (from all builders):**
- Measure BEHAVIOR, not opinions (Chopra Ch.3, 59)
- Target the NARROWEST audience (Chopra Ch.8, Bier B4)
- Define pass/fail BEFORE running (Chopra Ch.63, Bier B9)
- Make the test CONCLUSIVE — no "maybe we needed more time" (Bier B9)
- Time-box ruthlessly (Chopra Ch.13: the Week Rule)

### Step 3: Define Success and Failure Criteria

**BEFORE running the test, commit to specific numbers:**

Good criteria examples:
- ✅ "If 15% of landing page visitors enter their email, we proceed to Level 3."
- ✅ "If 3 out of 10 concierge users offer to pay without being asked, willingness to pay is validated."
- ✅ "If 40% of one school downloads in 48 hours, we expand to 3 more schools." (Bier standard)
- ✅ "If referral rate is >20% (each user invites at least 1 person who also signs up), organic growth is possible."

Bad criteria (inconclusive):
- ❌ "If people seem interested..." (subjective)
- ❌ "If we get enough signups..." (undefined threshold)
- ❌ "If the feedback is positive..." (words, not behavior)

### Step 4: Run and Interpret

- Run the test for the committed duration. Don't extend because results are "almost there."
- If you meet the success threshold: proceed to next level.
- If you're between success and failure thresholds: the test was badly designed. Redesign with clearer criteria.
- If you hit the failure threshold: KILL or PIVOT. Do not rationalize.

---

## MVT OUTPUT TEMPLATE

```
## MVT: [Descriptive Name]

**Idea in one sentence:** [What are we testing?]
**Riskiest Assumption:** [One sentence — the thing that kills everything if false]
**Speed-Learning Level:** [1-6, with justification for why this level]

**Test Design:**
- What exactly we'll do: [Specific, actionable steps]
- What we'll build/create: [Landing page, prototype, manual service, etc.]
- How we'll reach test subjects: [Specific channel — not "social media" but "DM 50 voice AI developers in Discord server X"]

**Target Audience:** [Specific, named group — not "developers" but "solo founders building voice AI products who currently use ElevenLabs"]
**Sample Size:** [Minimum needed for conclusive result]

**Success Metric:** [Quantitative — e.g., "15% email signup rate from 500+ visitors"]
**Failure Metric:** [Quantitative — e.g., "<3% signup rate after 500 visitors = kill"]
**Inconclusive Zone:** [3-15% = redesign test with different positioning]

**Timeline:** [Days, with hard stop date]
**Budget:** [$, itemized]

**Decision Tree:**
- If SUCCESS → [Specific next step — what Level comes next]
- If FAILURE → [Kill entirely / Pivot to X / Re-test with different variable Y]
- If INCONCLUSIVE → [Redesign test: change Z variable]
```

---

## THE 10 ANTI-PATTERNS (Nightmares of Product Validation)

These are the most common ways founders fool themselves. Call them out explicitly when you see them.

### 1. The Solution-First Trap 🔴
**What it looks like:** "I built this cool technology, now I need to find users."
**Why it's fatal:** Chopra Ch.5 — market-product fit, not product-market fit. Musk Step 1 — the requirement (that this technology needs to be a product) hasn't been questioned.
**The fix:** Stop building. Spend a week observing what people actually DO.

### 2. The Survey Trap 🔴
**What it looks like:** "We surveyed 500 people and 80% said they'd use this."
**Why it's fatal:** Chopra Ch.3 — behavior ≠ words. People say they'll pay; they don't. People say they want healthy food; they order pizza.
**The fix:** Find behavioral evidence. What are people SPENDING on right now?

### 3. The Friends-and-Family Trap 🔴
**What it looks like:** "Everyone I've told loves it!"
**Why it's fatal:** Chopra Ch.58 — social relationships create validation bias. Friends are socially incentivized to agree.
**The fix:** Test with strangers who have zero social obligation to be nice.

### 4. The Optimization Trap 🔴
**What it looks like:** Spending weeks optimizing onboarding flow for a product nobody wants.
**Why it's fatal:** Musk Algorithm Step 3 — simplifying/optimizing something that shouldn't exist. "The most common error of a smart engineer."
**The fix:** Apply Steps 1-2 first. Does this product need to exist? Does this feature need to exist?

### 5. The Feature Trap 🟡
**What it looks like:** "Users aren't engaging — let's add more features."
**Why it's fatal:** Jobs J1 — innovation is saying NO. Adding features is the opposite of focus. More features = more complexity = more cognitive load = worse experience.
**The fix:** Delete features until you find the ONE that matters. Then make that one exceptional.

### 6. The Vanity Metrics Trap 🟡
**What it looks like:** "We have 50,000 downloads!" (but 200 DAUs)
**Why it's fatal:** Chopra Ch.48 — north star must be a LEADING indicator of profit. Downloads/signups are lagging indicators that don't predict retention or revenue.
**The fix:** Measure retention (Day 7, Day 30), revenue per user, referral rate.

### 7. The Premature Scaling Trap 🟡
**What it looks like:** Hiring, spending on marketing, expanding to new markets before PMF.
**Why it's fatal:** Chopra Ch.8 — dominate the niche first. Bier B4 — hyper-local before national. Altman — "do things that don't scale" first.
**The fix:** Can you name 100 users who LOVE (not like) your product? If not, don't scale.

### 8. The Paid Acquisition Trap 🟡
**What it looks like:** "We'll just run Facebook ads to grow."
**Why it's fatal:** Bier B6 — no organic loop = buying every user. Unit economics must support it: lifetime value must be >3x customer acquisition cost AND you must have capital to sustain it.
**The fix:** Before spending on acquisition, verify: do users invite others naturally? If not, can you build a mechanic that makes sharing the default behavior?

### 9. The Confirmation Bias Trap 🔴
**What it looks like:** Selectively interpreting data to support the idea. Ignoring negative signals.
**Why it's fatal:** Chopra Ch.57 — always seek disconfirmatory evidence. Pros come naturally; cons require active seeking.
**The fix:** Before every decision, explicitly list 3 reasons the idea might fail. Actively seek evidence for those reasons.

### 10. The Mind Projection Trap 🟡
**What it looks like:** "I would use this, so other people will too."
**Why it's fatal:** Chopra Ch.60 — entrepreneurs are outliers (more risk-taking, early-adopting, driven). Most people aren't like you.
**The fix:** Start by assuming you know NOTHING about target customers. Use the Documentary Interview Technique (Chopra Ch.59): ask what people DID, not what they WILL do.

---

## THE DESIRE-EVIDENCE MATRIX

Use this to quickly classify any idea's validation status:

|  | **Strong Behavioral Evidence** (spending money/time on workarounds) | **Weak Behavioral Evidence** (no spending, no workarounds) |
|---|---|---|
| **Strong Stated Desire** (people say they want it) | 🟢 **GOLD MINE** — Build it. Market is screaming. | 🟡 **INVESTIGATE** — People talk but don't act. Find out WHY. Maybe friction, maybe awareness, maybe the desire isn't real. |
| **Weak Stated Desire** (people don't talk about it) | 🟢 **HIDDEN GEM** — They do it but don't talk about it. Often the best opportunities. Embarrassment, habit, or lack of vocabulary to describe the need. | 🔴 **KILL** — No desire signal anywhere. Don't build. |

---

## THE COMPOUNDING TEST

Every feature, every hire, every dollar must pass this test:

**Does this compound?**
- Does each user make the next user easier to acquire? (Network effect)
- Does each data point make the product better for ALL users? (Data flywheel)
- Does each piece of content attract more content? (Content flywheel)
- Does each customer make the business more defensible? (Switching cost accumulation)
- Does each unit of effort make the next unit more effective? (Learning curve)

If the answer is NO to all five: it's **linear work**. Linear work doesn't compound. Prioritize compounding work relentlessly.

**Amazon's Flywheel applied as test:**
Lower prices → More customers → More sellers → Better selection → Better experience → (loops back) → Lower prices.

Can you draw a similar flywheel for your idea? If not, where does the compounding break?

---

## THE FATAL FLAW CHECKLIST

Run this before any verdict. One "yes" on items 1-3 = KILL (non-negotiable).

| # | Fatal Flaw | Source | Status |
|---|---|---|---|
| 1 | No behavioral evidence of desire | Chopra Ch.3 | ⬜ |
| 2 | No distribution without paid acquisition AND economics don't work | Bier B6 | ⬜ |
| 3 | Solution looking for a problem (tech-first, no market evidence) | Chopra Ch.5, Jobs J4 | ⬜ |
| 4 | Less than 2x improvement on dimensions customers care about | Chopra Ch.11-12 | ⬜ |
| 5 | No long-term defensibility AND no path to build one | Chopra Ch.19, Altman A6 | ⬜ |
| 6 | Founder has no unfair advantage in this space | Chopra Ch.22 | ⬜ |
| 7 | Market too small even with 100% capture | Chopra Ch.8 | ⬜ |
| 8 | Timing wrong — too early (no ecosystem) or too late (saturated) | Chopra Ch.6 | ⬜ |
| 9 | Requires multiple miracles in series | Musk Risk Stacking | ⬜ |
| 10 | Building on a declining ecosystem | Chopra Ch.15 | ⬜ |
