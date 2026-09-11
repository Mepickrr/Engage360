# Fastrr Engage Home Page Revamp — Design

## Purpose

The current `/fastrr-engage` page (hero in a flat tinted box, a plain 4-stat
grid, a standalone tagline banner, a uniform 6-card feature list, a flat
CTA box) reads as an internal placeholder rather than a modern, confident
B2B SaaS pitch page. This revamp restructures the page using patterns
observed directly from three competitor references — Bitespeed, Bik.ai,
and GoKwik's KwikPass — plus current (2026) B2B SaaS landing-page research,
while keeping this codebase's existing content (stat values, feature
copy, hero headline) and design tokens.

## Additional reference research (added after initial design pass, at user's request)

- **Fastrr's own real marketing site** (fastrrai.shiprocket.in): headline
  "India's first AI-native growth suite for Commerce brands"; 11 product
  cards (Fastrr Checkout, Identify, Broadcast, **Journey**, Login, Ads,
  Assist, Studio, Voice, Signals, Shield) each with icon + name +
  description + bolded inline metrics + "Get Started Now ↗" CTA; real
  stat callouts include **"90M+ subscribers on Shiprocket network"** and
  "ROAS up to 10x"; notably has **no client logos or testimonials** on
  this particular page.
- **Shiprocket's own site** (shiprocket.in, the parent company): teal
  accent brand color (not adopted here — this app already has its own
  established purple primary token); a real, publicly-stated
  **"4 Lakh+ Businesses"** stat; a 2-row grayscale client-logo strip;
  a testimonial section with photo/name/title/company attribution and
  star ratings; card-grid feature showcase (3-4 columns); consistent
  teal "Sign Up for Free" CTAs.

These two additional references changed two decisions from the initial
design pass (both re-confirmed with the user):

1. **Logo strip** now uses styled text wordmarks with clearly fictional
   D2C brand names (not real companies) — closer to Shiprocket's actual
   logo-strip pattern — instead of the earlier abstract-icon-shape design.
2. **Testimonials are now in scope**, as a static 3-card row (not a
   rotating carousel, for prototype simplicity) with fictional
   attribution (name/title/fictional-brand/stars) — the user explicitly
   authorized this, superseding the initial pass's "no fabricated
   quotes" caution. Names, titles, and brand names must remain clearly
   fictional/generic (no real people or companies), consistent with this
   being an internal prototype, not a page real external users will see.

A new, **real** trust line is also added: Fastrr's own site's "90M+
subscribers on Shiprocket network" and Shiprocket's own "4 Lakh+
Businesses" are both currently-public, verifiable facts (fetched
directly from the two live sites above) — not fabricated, so this one
does not need a "pending sign-off" flag the way the page's other
benchmark numbers do.

## Competitive reference summary (researched directly, not assumed)

- **Bitespeed** (bitespeed.co): centered hero with dual high-contrast CTAs;
  a bold, dark-background stat band with very large numbers ("6000+",
  "$100M+", "1.5B+") and minimal supporting copy; feature sections
  alternate screenshot+text; a horizontal client-logo carousel; named
  testimonials with company logos; case studies with hard ROI numbers.
  Overall tone: bold, metric-driven, corporate.
- **Bik.ai** (bik.ai): hero headline positions the product as "Agentic AI";
  repeated "Book a demo" CTAs at hero/mid-page/footer; a "500+ global
  brands" logo section; big stat callouts ("30M+ messages/day", "137X+
  ROI"); 6 feature cards with thumbnails + category tags; clean white
  background, minimal accent palette.
- **GoKwik / KwikPass** (fetched in an earlier session): hero tagline +
  brand-trust logo row + a stats bar with icon+metric+explanation +
  4-stage feature blocks (Identify → Optimize → Engage → Recover) with
  icon/subheading/bullets + a security/certifications section + case
  studies + FAQ + a final CTA block.
- **General 2026 B2B SaaS trends** (websearch): bento-grid feature layouts
  (67% of top-100 Product Hunt SaaS sites, correlates with higher
  dwell-time/CTR) over uniform card grids; product visuals in the hero
  rather than text-only; outcome-driven copy; authentic (not fabricated)
  social proof.

## Non-goals

- The logo strip and testimonials use clearly **fictional** brand/person
  names (never a real company or person) — this is authorized for this
  internal prototype page specifically, not a general license to
  fabricate customer proof elsewhere in the app.
- No copy rewrite of the existing hero headline/subhead, stat values, or
  feature names/descriptions — this is a visual/structural revamp. The
  only copy addition is the two bento "hero" tiles' descriptions may read
  slightly fuller given their larger tile size, using the same source
  sentences already in `FEATURES` (not new claims).
- No new color palette — the dark stat band uses the app's own darkest
  existing token/a dark neutral plus the existing `--color-primary`, not
  a new "SaaS dark mode" the rest of the app doesn't share.
- Not a rebuild of `RevenueOpportunityCard` — it's kept exactly as-is,
  in its existing personalized-hook position in the page flow.

## Approach

Extract the page's growing section list out of one monolithic file
(the current pattern — every section as a local function inside
`FastrrEngage.jsx`) into a `src/components/engage/home/` folder, one
file per section — matching this codebase's already-established pattern
for `journey-dashboard/` and `meta-signup/`. `FastrrEngage.jsx` itself
becomes a thin composition of imports in the new section order.

## Files

| File | Purpose |
|---|---|
| `src/pages/FastrrEngage.jsx` (rewrite) | Composition only: renders `HeroSection`, `LogoStrip`, `RevenueOpportunityCard` (unchanged import), `DarkStatBand`, `BentoFeatureGrid`, `TestimonialSection`, `FinalCTA` in order. Still owns `handleEnable` (unchanged logic) and passes it down. |
| `src/components/engage/home/HeroSection.jsx` (new) | 2-column hero: text + dual CTA on the left (same copy/testids as today), `ChatPreviewMockup` on the right. Gradient background instead of flat tint. |
| `src/components/engage/home/ChatPreviewMockup.jsx` (new) | The floating chat-bubble visual: a white card, `shadow-xl`, slight tilt, WhatsApp-green header strip, 3 message bubbles (same copy as `FastrrEngagePanel`'s existing hero mockup: "Cart reminder sent" / "Yes, still interested!" / "✅ Order confirmed"), sized larger/more polished for hero use. |
| `src/components/engage/home/LogoStrip.jsx` (new) | "Trusted by growing D2C brands" eyebrow + a "Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers" trust line (real, sourced numbers) + a row of 6 fictional D2C brand-name wordmarks. |
| `src/components/engage/home/DarkStatBand.jsx` (new) | Full-width dark section; the existing `STATS` (unchanged values/labels from `FastrrEngage.jsx`, moved here) rendered large/bold in white on dark; a primary-colored eyebrow line above. |
| `src/components/engage/home/BentoFeatureGrid.jsx` (new) | The existing `FEATURES` (unchanged names/descriptions, moved here) laid out in the 3-column bento pattern below; replaces both the old `TaglineBanner` and `FeatureGrid` — the tagline becomes this section's eyebrow heading. |
| `src/components/engage/home/TestimonialSection.jsx` (new) | 3 static testimonial cards — quote, 5-star rating, initials-avatar, name/title/fictional-brand attribution. |
| `src/components/engage/home/FinalCTA.jsx` (new) | The existing onboarding CTA copy/testid, restyled with a gradient background and a high-contrast button. |

## Behavior

### Page composition (`FastrrEngage.jsx`)

```jsx
<div className="max-w-[1100px] mx-auto" data-testid="page-fastrr-engage">
  <HeroSection onEnable={handleEnable} />
  <LogoStrip />
  <RevenueOpportunityCard variant="full" ctaLabel="Unlock This Revenue with Fastrr Journey" onCtaClick={handleEnable} />
  <DarkStatBand />
  <BentoFeatureGrid />
  <TestimonialSection />
  <FinalCTA onEnable={handleEnable} />
</div>
```
(`max-w` widened slightly from `1000px` to `1100px` to give the bento grid
and dark band more breathing room — still a bounded content width, not
full-bleed.)

### `HeroSection.jsx`

Two-column on desktop (`grid md:grid-cols-2`), stacked on mobile. Left
column: a small eyebrow badge **"For D2C Brands on WhatsApp"**
(`bg-primary-tint text-primary` pill), then the existing headline
("Convert Every Anonymous Visitor Into a Paying Customer") and subhead
verbatim, then the same dual CTA (`fastrr-engage-hero-cta` /
`fastrr-engage-hero-secondary-cta` testids preserved, same labels/
behavior — primary calls `onEnable`, secondary stays the existing no-op).
Right column: `<ChatPreviewMockup />`. Section background: a soft
gradient (`bg-gradient-to-br from-primary-tint to-white` or equivalent
existing-token gradient) instead of the flat `bg-primary-tint` block.

### `ChatPreviewMockup.jsx`

A `max-w-sm` white card, `rounded-xl shadow-xl`, `rotate-2` transform for
a "product shot" tilt. Header strip: WhatsApp green (`#25D366`) background,
small white circle "online" dot, "Fastrr Journey" label. Body: 3 stacked
message bubbles reusing `FastrrEngagePanel`'s existing hero-mockup copy
and bubble styling (`bg-white/90` outbound-style bubble "Cart reminder
sent"; `bg-white/60` reply-style bubble "\"Yes, still interested!\""; a
bold confirmation bubble "✅ Order confirmed") — same visual language
already established elsewhere in this feature area, just bigger/cleaner
for hero prominence.

### `LogoStrip.jsx`

Centered eyebrow text **"Trusted by growing D2C brands"** (small, muted),
then the trust line **"Backed by Shiprocket — powering 4 Lakh+ businesses
and 90M+ shoppers"** (`text-sm text-text-secondary`, with a code comment
citing the source: Fastrr's own site's "90M+ subscribers on Shiprocket
network" and Shiprocket's own "4 Lakh+ Businesses", both fetched directly
from the live sites — real, public numbers, no sign-off flag needed),
then a row of 6 fictional D2C brand-name wordmarks — **"Lumora"**,
**"Verve & Co."**, **"Northline"**, **"Aurelia Home"**, **"Kindred
Goods"**, **"Solstice Apparel"** — rendered as bold gray text
(`text-lg font-bold text-slate-300` or similar muted-but-legible weight),
evenly spaced in a `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6` row.
These are clearly invented names (no resemblance to real companies
intended or checked against), consistent with this being an internal
prototype page.

### `DarkStatBand.jsx`

Full-width section, `bg-slate-900` (or this app's darkest existing
neutral token if one exists closer to the design system — implementer's
judgment, must not be a newly-invented hex value), `py-16` vertical
padding. A small primary-colored eyebrow line ("The Numbers Behind Fastrr
Journey") centered above a `grid grid-cols-2 md:grid-cols-4` row of the
same 4 `STATS` values (`20%+` Abandoned cart recovery, `25%+`
Contribution to revenue, `20X+` ROAS, `2B+` Conversations delivered),
rendered as `text-4xl md:text-5xl font-bold text-white` with the label
underneath in a muted light gray (`text-slate-400`) — no card borders, no
boxes, just large numbers in a row (matching the Bitespeed reference's
treatment).

### `BentoFeatureGrid.jsx`

Section eyebrow (replacing the old standalone `TaglineBanner`):
**"Identify \| Engage \| Grow"** heading + the existing one-line subcopy,
centered, directly above the grid. Grid: `grid grid-cols-1 md:grid-cols-3
gap-5`, with 2 of the 6 existing `FEATURES` entries spanning 2 columns
(`md:col-span-2`) as "hero" tiles and the other 4 at 1 column each,
arranged as:

```
[ Identify Anonymous Shoppers  (col-span-2) ] [ Conversational Commerce ]
[ Automated Journeys ] [ Real-Time Analytics ] [ Instant Checkout on WhatsApp (col-span-2) ]
[ Built-In Security & Trust ]
```

The 2 wide tiles get a slightly larger icon chip (`w-12 h-12` vs `w-10
h-10`) and heading size (`text-base` vs `text-sm`) to read as visual
anchors; all 6 keep their exact existing name/description text from
`FEATURES` (moved here unchanged, not reworded).

### `TestimonialSection.jsx`

Section heading: **"Loved by Growing D2C Brands"**. Three cards in a
`grid grid-cols-1 md:grid-cols-3 gap-5`, each with: a 5-star row (filled
`Star` icons from lucide-react, `text-warning`/amber), a short quote
(2 lines), and an attribution row (a circular initials avatar —
`bg-primary-tint text-primary`, no real photo — + name, title, and one
of the fictional brand names introduced in `LogoStrip.jsx`, reusing the
same names for continuity). Exact copy (fictional, tied to this
product's actual value proposition, not generic praise):

| Quote | Attribution |
|---|---|
| "We recovered 22% of abandoned carts in the first month — WhatsApp converts so much better than email ever did for us." | Ananya Rao, Growth Lead, Lumora |
| "Fastrr Journey found shoppers we didn't even know we had. Our repeat purchase rate jumped almost overnight." | Rohit Malhotra, Founder, Northline |
| "Setup took less than 15 minutes and we were already sending our first recovery messages that same day." | Priya Nair, D2C Manager, Aurelia Home |

### `FinalCTA.jsx`

Same heading ("Quick Onboarding, Real Results"), same subcopy (the
15-minute line), same CTA label ("Set Up My Abandoned Cart Journey") and
testid (`fastrr-engage-onboarding-cta`) and behavior (`onEnable`).
Restyled: background becomes a gradient (`bg-gradient-to-br from-primary
to-primary-hover` or similar existing-token gradient, white text), CTA
button becomes high-contrast (`bg-white text-primary hover:bg-white/90`)
instead of the default primary button, matching the "pop against a bold
background" closing-CTA pattern from all three references.

## Styling

All colors come from this app's existing Tailwind/shadcn tokens
(`bg-primary`, `bg-primary-tint`, `text-text-primary/secondary/muted`,
`border-border`, `bg-surface`, `bg-app-bg`) with two deliberate,
consistent exceptions already used elsewhere in this feature area:
the WhatsApp-authentic header color in `ChatPreviewMockup` (matching the
existing precedent in `FastrrEngagePanel`/`WhatsAppBubblePreview`), and
the dark neutral background in `DarkStatBand` (a single intentional
dark section, not a new app-wide dark theme). No other new hex values
are introduced.

## Testing

- `HeroSection.test.jsx`: renders the eyebrow, existing headline/subhead
  text, both CTA testids with correct labels, and `ChatPreviewMockup`'s
  3 message bubbles; clicking the primary CTA calls `onEnable`; the
  secondary CTA remains a no-op (unchanged from today's test coverage,
  moved into this file).
- `LogoStrip.test.jsx`: renders the eyebrow text, the Shiprocket trust
  line, and exactly 6 fictional brand-name wordmarks.
- `TestimonialSection.test.jsx`: renders the section heading and all 3
  testimonial cards (quote text + attribution name/title/brand).
- `DarkStatBand.test.jsx`: renders all 4 stat values and labels.
- `BentoFeatureGrid.test.jsx`: renders all 6 feature names/descriptions;
  confirms the 2 designated tiles carry a wider-tile class/testid
  distinguishing them from the other 4 (structural check, not a visual
  regression test).
- `FinalCTA.test.jsx`: renders the heading/subcopy/testid; clicking the
  CTA calls `onEnable`.
- `FastrrEngage.test.jsx` (rewrite): page-level test confirming all seven
  sections render together in order and the page's own testid/max-width
  wrapper is present; the existing hero/onboarding/revenue-card CTA
  behavior tests (close panel + navigate to `/engage/account-setup`)
  move to their respective new component test files, with the page-level
  test only doing a light integration check (each section renders, no
  need to re-assert every button's full behavior at this level — that's
  covered in each section's own test).

## Open items (explicitly deferred, not blocking this design)

- Real customer logos/testimonials/case studies — the logo strip and
  testimonials use clearly fictional names for now; swapping in real
  customer names/logos/quotes (with their consent) is deferred until
  real customers exist and agree to be featured.
- Whether `ChatPreviewMockup`/`DarkStatBand`/bento-grid patterns should
  become shared primitives if a second marketing page needs them —
  kept bespoke per YAGNI (only one consumer today).
