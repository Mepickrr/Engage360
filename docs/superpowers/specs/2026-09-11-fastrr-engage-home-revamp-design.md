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

- No fabricated customer testimonials/named quotes — with no real
  customers yet, inventing a quote (even labeled "illustrative") crosses
  into misrepresentation. The logo strip uses abstract, non-representational
  placeholder marks only — no real or invented brand names.
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
| `src/pages/FastrrEngage.jsx` (rewrite) | Composition only: renders `HeroSection`, `LogoStrip`, `RevenueOpportunityCard` (unchanged import), `DarkStatBand`, `BentoFeatureGrid`, `FinalCTA` in order. Still owns `handleEnable` (unchanged logic) and passes it down. |
| `src/components/engage/home/HeroSection.jsx` (new) | 2-column hero: text + dual CTA on the left (same copy/testids as today), `ChatPreviewMockup` on the right. Gradient background instead of flat tint. |
| `src/components/engage/home/ChatPreviewMockup.jsx` (new) | The floating chat-bubble visual: a white card, `shadow-xl`, slight tilt, WhatsApp-green header strip, 3 message bubbles (same copy as `FastrrEngagePanel`'s existing hero mockup: "Cart reminder sent" / "Yes, still interested!" / "✅ Order confirmed"), sized larger/more polished for hero use. |
| `src/components/engage/home/LogoStrip.jsx` (new) | "Trusted by growing D2C brands" eyebrow + a row of 6 abstract geometric placeholder marks (lucide icons in muted circles) — no text/names. |
| `src/components/engage/home/DarkStatBand.jsx` (new) | Full-width dark section; the existing `STATS` (unchanged values/labels from `FastrrEngage.jsx`, moved here) rendered large/bold in white on dark; a primary-colored eyebrow line above. |
| `src/components/engage/home/BentoFeatureGrid.jsx` (new) | The existing `FEATURES` (unchanged names/descriptions, moved here) laid out in the 3-column bento pattern below; replaces both the old `TaglineBanner` and `FeatureGrid` — the tagline becomes this section's eyebrow heading. |
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
then a row of 6 abstract marks: a plain lucide icon (e.g. `Hexagon`,
`Triangle`, `Circle`, `Square`, `Diamond`, `Pentagon` — whichever 6 exist
in this app's lucide-react version) each centered in a muted gray circle
(`bg-slate-100 text-slate-400`), evenly spaced with `flex justify-between`
or a `grid grid-cols-6`. No labels, no names — reads as "logo placement
reserved," not as any specific brand, real or invented.

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
- `LogoStrip.test.jsx`: renders the eyebrow text and exactly 6 placeholder
  marks.
- `DarkStatBand.test.jsx`: renders all 4 stat values and labels.
- `BentoFeatureGrid.test.jsx`: renders all 6 feature names/descriptions;
  confirms the 2 designated tiles carry a wider-tile class/testid
  distinguishing them from the other 4 (structural check, not a visual
  regression test).
- `FinalCTA.test.jsx`: renders the heading/subcopy/testid; clicking the
  CTA calls `onEnable`.
- `FastrrEngage.test.jsx` (rewrite): page-level test confirming all six
  sections render together in order and the page's own testid/max-width
  wrapper is present; the existing hero/onboarding/revenue-card CTA
  behavior tests (close panel + navigate to `/engage/account-setup`)
  move to their respective new component test files, with the page-level
  test only doing a light integration check (each section renders, no
  need to re-assert every button's full behavior at this level — that's
  covered in each section's own test).

## Open items (explicitly deferred, not blocking this design)

- Real customer logos/testimonials/case studies — deferred until real
  customers exist; the logo strip stays abstract placeholders until then.
- Whether `ChatPreviewMockup`/`DarkStatBand`/bento-grid patterns should
  become shared primitives if a second marketing page needs them —
  kept bespoke per YAGNI (only one consumer today).
