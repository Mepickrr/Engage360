# Fastrr Engage Home Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp `/fastrr-engage` from a plain, flat-styled page into a modern, confident B2B SaaS pitch page — a 2-column hero with a chat-preview visual, a fictional-brand logo strip with a real Shiprocket trust line, a bold dark stat band, a bento-style feature grid, a testimonial section, and a high-contrast final CTA — extracted into a `src/components/engage/home/` folder matching this codebase's established per-page component-folder pattern.

**Architecture:** Six new small, independent presentational components (`HeroSection`+`ChatPreviewMockup`, `LogoStrip`, `DarkStatBand`, `BentoFeatureGrid`, `TestimonialSection`, `FinalCTA`), each owning its own static content, composed by a rewritten, much-thinner `FastrrEngage.jsx` page that keeps its existing `handleEnable` logic and passes it down as the only prop any section needs.

**Tech Stack:** React 19, react-router-dom v7, shadcn/ui `Button`, lucide-react icons, Jest + React Testing Library (via `craco test`).

**Spec:** `docs/superpowers/specs/2026-09-11-fastrr-engage-home-revamp-design.md`

## Global Constraints

- No backend/API calls anywhere — this remains a static prototype page.
- The logo strip and testimonials use clearly **fictional** names only (never a real company or person): brand wordmarks `"Lumora"`, `"Verve & Co."`, `"Northline"`, `"Aurelia Home"`, `"Kindred Goods"`, `"Solstice Apparel"`; testimonial attributions `Ananya Rao / Growth Lead / Lumora`, `Rohit Malhotra / Founder / Northline`, `Priya Nair / D2C Manager / Aurelia Home`.
- The "Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers" trust line uses real, publicly-stated numbers (sourced from fastrrai.shiprocket.in and shiprocket.in directly) — no "pending sign-off" comment needed for this one line, unlike the page's other benchmark numbers.
- Existing copy is preserved verbatim and must not be reworded: the hero headline ("Convert Every Anonymous Visitor Into a Paying Customer") and subhead, the 4 `STATS` values/labels, all 6 `FEATURES` names/descriptions, the "Identify \| Engage \| Grow" tagline + its subcopy, and the final-CTA heading/subcopy/button label.
- All existing `data-testid` values are preserved exactly across the refactor: `fastrr-engage-hero-cta`, `fastrr-engage-hero-secondary-cta`, `fastrr-engage-stats-bar`, `fastrr-engage-feature-grid`, `fastrr-engage-onboarding-cta`, `fastrr-revenue-opportunity` / `fastrr-revenue-opportunity-cta` (from the untouched `RevenueOpportunityCard`), `page-fastrr-engage`.
- `RevenueOpportunityCard` is imported and rendered unchanged (same props: `variant="full"`, `ctaLabel="Unlock This Revenue with Fastrr Journey"`, `onCtaClick={handleEnable}`) — not modified by this plan.
- Only the WhatsApp-authentic green (`#25D366`) in `ChatPreviewMockup` and the dark neutral background in `DarkStatBand` (`bg-slate-900`) are exceptions to using existing app tokens — both are single, deliberate, already-precedented exceptions (matching `FastrrEngagePanel`/`WhatsAppBubblePreview`'s existing use of the same WhatsApp green). No other new hex values are introduced anywhere in this plan.
- Any JSX text a test asserts via `getByText` must be a single template-literal string (not an expression adjacent to separate literal text); text genuinely split across multiple child nodes (e.g. a heading with an inline `<span>` separator) must be asserted via `toHaveTextContent` on a wrapping element instead, not `getByText`.

---

### Task 1: `ChatPreviewMockup` + `HeroSection`

**Files:**
- Create: `src/components/engage/home/ChatPreviewMockup.jsx`
- Create: `src/components/engage/home/HeroSection.jsx`
- Test: `src/components/engage/home/__tests__/HeroSection.test.jsx`

**Interfaces:**
- Produces `ChatPreviewMockup` (default export, no props) — consumed only by `HeroSection` in this same task, not exported for use elsewhere.
- Produces `HeroSection` (default export, prop: `onEnable`) — Task 7 renders this with `onEnable={handleEnable}`.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/HeroSection.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeroSection from "../HeroSection";

describe("HeroSection", () => {
  it("renders the eyebrow, headline, subhead, and chat preview mockup", () => {
    render(<HeroSection onEnable={() => {}} />);
    expect(screen.getByText("For D2C Brands on WhatsApp")).toBeInTheDocument();
    expect(
      screen.getByText("Convert Every Anonymous Visitor Into a Paying Customer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("chat-preview-mockup")).toBeInTheDocument();
    expect(screen.getByText("Cart reminder sent")).toBeInTheDocument();
    expect(screen.getByText('"Yes, still interested!"')).toBeInTheDocument();
    expect(screen.getByText("✅ Order confirmed")).toBeInTheDocument();
  });

  it("clicking the primary CTA calls onEnable", () => {
    const onEnable = jest.fn();
    render(<HeroSection onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-cta"));
    expect(onEnable).toHaveBeenCalledTimes(1);
  });

  it("the secondary CTA is a present, clickable no-op", () => {
    const onEnable = jest.fn();
    render(<HeroSection onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-secondary-cta"));
    expect(onEnable).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/HeroSection" --watchAll=false`
Expected: FAIL — cannot find module `../HeroSection`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/ChatPreviewMockup.jsx`:

```jsx
import React from "react";

export default function ChatPreviewMockup() {
  return (
    <div
      className="max-w-sm mx-auto bg-white rounded-xl shadow-xl overflow-hidden rotate-2"
      data-testid="chat-preview-mockup"
    >
      <div
        className="flex items-center gap-2 px-4 py-3 text-white"
        style={{ background: "#25D366" }}
      >
        <span className="w-2 h-2 rounded-full bg-white" />
        <span className="text-sm font-semibold">Fastrr Journey</span>
      </div>
      <div className="flex flex-col gap-2 p-4 bg-app-bg">
        <div className="bg-white/90 text-slate-900 text-sm rounded-lg rounded-bl-none px-3 py-2 self-start shadow-sm max-w-[85%]">
          Cart reminder sent
        </div>
        <div className="bg-white/60 text-slate-900 text-sm rounded-lg rounded-br-none px-3 py-2 self-end shadow-sm max-w-[85%]">
          "Yes, still interested!"
        </div>
        <div className="bg-white text-slate-900 text-sm rounded-lg rounded-bl-none px-3 py-2 self-start shadow-sm font-medium max-w-[85%]">
          ✅ Order confirmed
        </div>
      </div>
    </div>
  );
}
```

Create `src/components/engage/home/HeroSection.jsx`:

```jsx
import React from "react";
import { Button } from "@/components/ui/button";
import ChatPreviewMockup from "./ChatPreviewMockup";

export default function HeroSection({ onEnable }) {
  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-block bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            For D2C Brands on WhatsApp
          </span>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Convert Every Anonymous Visitor Into a Paying Customer
          </h1>
          <p className="text-base text-text-secondary mb-6">
            Identify shoppers before they sign up, then win them back on WhatsApp —
            the channel with the highest open and reply rates in commerce.
          </p>
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Button
              type="button"
              size="lg"
              data-testid="fastrr-engage-hero-cta"
              onClick={onEnable}
            >
              Set Up My Abandoned Cart Journey
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              data-testid="fastrr-engage-hero-secondary-cta"
              onClick={() => {}} // TODO: wire up once enablement flow is defined
            >
              See how it works
            </Button>
          </div>
        </div>
        <div>
          <ChatPreviewMockup />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/HeroSection" --watchAll=false`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/ChatPreviewMockup.jsx src/components/engage/home/HeroSection.jsx src/components/engage/home/__tests__/HeroSection.test.jsx
git commit -m "feat(fastrr-engage-home): add revamped hero with chat preview mockup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `LogoStrip`

**Files:**
- Create: `src/components/engage/home/LogoStrip.jsx`
- Test: `src/components/engage/home/__tests__/LogoStrip.test.jsx`

**Interfaces:**
- Produces `LogoStrip` (default export, no props) — Task 7 renders this directly.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/LogoStrip.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import LogoStrip from "../LogoStrip";

const BRANDS = [
  "Lumora",
  "Verve & Co.",
  "Northline",
  "Aurelia Home",
  "Kindred Goods",
  "Solstice Apparel",
];

describe("LogoStrip", () => {
  it("renders the eyebrow, the Shiprocket trust line, and all 6 fictional brand wordmarks", () => {
    render(<LogoStrip />);
    expect(screen.getByTestId("fastrr-engage-logo-strip")).toBeInTheDocument();
    expect(screen.getByText("Trusted by growing D2C brands")).toBeInTheDocument();
    expect(
      screen.getByText("Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers")
    ).toBeInTheDocument();
    BRANDS.forEach((brand) => {
      expect(screen.getByText(brand)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/LogoStrip" --watchAll=false`
Expected: FAIL — cannot find module `../LogoStrip`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/LogoStrip.jsx`:

```jsx
import React from "react";

// Public, real numbers sourced directly from https://fastrrai.shiprocket.in/
// ("90M+ subscribers on Shiprocket network") and https://www.shiprocket.in/
// ("4 Lakh+ Businesses") — not fabricated, no sign-off flag needed.
const FICTIONAL_BRANDS = [
  "Lumora",
  "Verve & Co.",
  "Northline",
  "Aurelia Home",
  "Kindred Goods",
  "Solstice Apparel",
];

export default function LogoStrip() {
  return (
    <div className="text-center mb-10" data-testid="fastrr-engage-logo-strip">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
        Trusted by growing D2C brands
      </p>
      <p className="text-sm text-text-secondary mb-6">
        Backed by Shiprocket — powering 4 Lakh+ businesses and 90M+ shoppers
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {FICTIONAL_BRANDS.map((brand) => (
          <div key={brand} className="text-lg font-bold text-slate-300 text-center">
            {brand}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/LogoStrip" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/LogoStrip.jsx src/components/engage/home/__tests__/LogoStrip.test.jsx
git commit -m "feat(fastrr-engage-home): add logo strip with Shiprocket trust line

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `DarkStatBand`

**Files:**
- Create: `src/components/engage/home/DarkStatBand.jsx`
- Test: `src/components/engage/home/__tests__/DarkStatBand.test.jsx`

**Interfaces:**
- Produces `DarkStatBand` (default export, no props) — Task 7 renders this directly. Renders with `data-testid="fastrr-engage-stats-bar"`, preserving the pre-existing testid.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/DarkStatBand.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import DarkStatBand from "../DarkStatBand";

describe("DarkStatBand", () => {
  it("renders the eyebrow and all 4 stat values with labels", () => {
    render(<DarkStatBand />);
    expect(screen.getByTestId("fastrr-engage-stats-bar")).toBeInTheDocument();
    expect(screen.getByText("The Numbers Behind Fastrr Journey")).toBeInTheDocument();
    expect(screen.getByText("20%+")).toBeInTheDocument();
    expect(screen.getByText("Abandoned cart recovery")).toBeInTheDocument();
    expect(screen.getByText("25%+")).toBeInTheDocument();
    expect(screen.getByText("Contribution to revenue")).toBeInTheDocument();
    expect(screen.getByText("20X+")).toBeInTheDocument();
    expect(screen.getByText("ROAS")).toBeInTheDocument();
    expect(screen.getByText("2B+")).toBeInTheDocument();
    expect(screen.getByText("Conversations delivered")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/DarkStatBand" --watchAll=false`
Expected: FAIL — cannot find module `../DarkStatBand`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/DarkStatBand.jsx`:

```jsx
import React from "react";

// Benchmarks below are directionally real, pending final marketing/legal
// sign-off before this page goes live externally.
const STATS = [
  { value: "20%+", label: "Abandoned cart recovery" },
  { value: "25%+", label: "Contribution to revenue" },
  { value: "20X+", label: "ROAS" },
  { value: "2B+", label: "Conversations delivered" },
];

export default function DarkStatBand() {
  return (
    <div
      className="bg-slate-900 rounded-lg py-16 px-6 mb-10"
      data-testid="fastrr-engage-stats-bar"
    >
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-primary mb-8">
        The Numbers Behind Fastrr Journey
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[800px] mx-auto">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-2">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/DarkStatBand" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/DarkStatBand.jsx src/components/engage/home/__tests__/DarkStatBand.test.jsx
git commit -m "feat(fastrr-engage-home): add bold dark stat band

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: `BentoFeatureGrid`

**Files:**
- Create: `src/components/engage/home/BentoFeatureGrid.jsx`
- Test: `src/components/engage/home/__tests__/BentoFeatureGrid.test.jsx`

**Interfaces:**
- Produces `BentoFeatureGrid` (default export, no props) — Task 7 renders this directly. Renders with `data-testid="fastrr-engage-feature-grid"`, preserving the pre-existing testid, plus `data-testid="feature-tile-wide"` on exactly 2 tiles and `data-testid="feature-tile"` on the other 4.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/BentoFeatureGrid.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import BentoFeatureGrid from "../BentoFeatureGrid";

describe("BentoFeatureGrid", () => {
  it("renders the tagline, all 6 features, and exactly 2 wide tiles", () => {
    render(<BentoFeatureGrid />);
    expect(screen.getByTestId("bento-tagline-heading")).toHaveTextContent(
      "Identify | Engage | Grow"
    );
    expect(screen.getByTestId("fastrr-engage-feature-grid")).toBeInTheDocument();
    expect(screen.getByText("Identify Anonymous Shoppers")).toBeInTheDocument();
    expect(screen.getByText("Conversational Commerce")).toBeInTheDocument();
    expect(screen.getByText("Automated Customer Journeys")).toBeInTheDocument();
    expect(screen.getByText("Real-Time Performance Analytics")).toBeInTheDocument();
    expect(screen.getByText("Instant Checkout on WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Built-In Security & Trust")).toBeInTheDocument();
    expect(screen.getAllByTestId("feature-tile-wide")).toHaveLength(2);
    expect(screen.getAllByTestId("feature-tile")).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/BentoFeatureGrid" --watchAll=false`
Expected: FAIL — cannot find module `../BentoFeatureGrid`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/BentoFeatureGrid.jsx`:

```jsx
import React from "react";
import {
  Eye,
  MessageCircle,
  Workflow,
  BarChart3,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";

const FEATURES = [
  {
    icon: Eye,
    name: "Identify Anonymous Shoppers",
    desc: "Spot up to 30% of visitors who never sign up, and track what they browse across visits — so every follow-up feels personal, not random.",
    wide: true,
  },
  {
    icon: MessageCircle,
    name: "Conversational Commerce",
    desc: "Shoppers reply, vote, and pick their own offers through WhatsApp flows that feel like a conversation, not a broadcast.",
    wide: false,
  },
  {
    icon: Workflow,
    name: "Automated Customer Journeys",
    desc: "Fire the right message on the right channel the moment it matters — abandoned cart, COD-to-prepaid nudge, order status, or RTO risk.",
    wide: false,
  },
  {
    icon: BarChart3,
    name: "Real-Time Performance Analytics",
    desc: "Watch ROAS, cart recovery, revenue influenced, and engagement update live in one dashboard built for D2C growth teams.",
    wide: false,
  },
  {
    icon: ShoppingCart,
    name: "Instant Checkout on WhatsApp",
    desc: "Let shoppers finish checkout without ever leaving the chat — no app switch, no lost momentum.",
    wide: true,
  },
  {
    icon: ShieldCheck,
    name: "Built-In Security & Trust",
    desc: "Enterprise-grade verification keeps shopper data safe, so your brand stays protected and customers stay confident.",
    wide: false,
  },
];

export default function BentoFeatureGrid() {
  return (
    <div className="mb-10">
      <div className="text-center mb-8">
        <h2
          className="text-xl font-semibold text-text-primary tracking-wide mb-2"
          data-testid="bento-tagline-heading"
        >
          Identify <span className="text-primary">|</span> Engage{" "}
          <span className="text-primary">|</span> Grow
        </h2>
        <p className="text-sm text-text-secondary max-w-lg mx-auto">
          Recognise every shopper, re-engage them across channels, and unlock new
          revenue streams with automated retargeting.
        </p>
      </div>
      <div
        className="grid grid-cols-1 md:grid-cols-3 md:grid-flow-dense gap-5"
        data-testid="fastrr-engage-feature-grid"
      >
        {FEATURES.map((f) => (
          <div
            key={f.name}
            data-testid={f.wide ? "feature-tile-wide" : "feature-tile"}
            className={`bg-surface border border-border rounded-lg p-5 flex gap-4 ${
              f.wide ? "md:col-span-2" : ""
            }`}
          >
            <div
              className={`rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0 ${
                f.wide ? "w-12 h-12" : "w-10 h-10"
              }`}
            >
              <f.icon className={f.wide ? "w-6 h-6 text-primary" : "w-5 h-5 text-primary"} />
            </div>
            <div>
              <div
                className={`font-semibold text-text-primary mb-1 ${
                  f.wide ? "text-base" : "text-sm"
                }`}
              >
                {f.name}
              </div>
              <div className="text-sm text-text-secondary">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/BentoFeatureGrid" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/BentoFeatureGrid.jsx src/components/engage/home/__tests__/BentoFeatureGrid.test.jsx
git commit -m "feat(fastrr-engage-home): add bento-style feature grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: `TestimonialSection`

**Files:**
- Create: `src/components/engage/home/TestimonialSection.jsx`
- Test: `src/components/engage/home/__tests__/TestimonialSection.test.jsx`

**Interfaces:**
- Produces `TestimonialSection` (default export, no props) — Task 7 renders this directly.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/TestimonialSection.test.jsx`:

```jsx
import React from "react";
import { render, screen } from "@testing-library/react";
import TestimonialSection from "../TestimonialSection";

describe("TestimonialSection", () => {
  it("renders the heading and all 3 testimonial cards with attribution", () => {
    render(<TestimonialSection />);
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
    expect(screen.getByText("Loved by Growing D2C Brands")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-ananya-rao")).toBeInTheDocument();
    expect(
      screen.getByText(/We recovered 22% of abandoned carts/)
    ).toBeInTheDocument();
    expect(screen.getByText("Ananya Rao")).toBeInTheDocument();
    expect(screen.getByText("Growth Lead, Lumora")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-rohit-malhotra")).toBeInTheDocument();
    expect(screen.getByText("Rohit Malhotra")).toBeInTheDocument();
    expect(screen.getByText("Founder, Northline")).toBeInTheDocument();

    expect(screen.getByTestId("testimonial-priya-nair")).toBeInTheDocument();
    expect(screen.getByText("Priya Nair")).toBeInTheDocument();
    expect(screen.getByText("D2C Manager, Aurelia Home")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/TestimonialSection" --watchAll=false`
Expected: FAIL — cannot find module `../TestimonialSection`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/TestimonialSection.jsx`:

```jsx
import React from "react";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "We recovered 22% of abandoned carts in the first month — WhatsApp converts so much better than email ever did for us.",
    name: "Ananya Rao",
    title: "Growth Lead",
    brand: "Lumora",
  },
  {
    quote:
      "Fastrr Journey found shoppers we didn't even know we had. Our repeat purchase rate jumped almost overnight.",
    name: "Rohit Malhotra",
    title: "Founder",
    brand: "Northline",
  },
  {
    quote:
      "Setup took less than 15 minutes and we were already sending our first recovery messages that same day.",
    name: "Priya Nair",
    title: "D2C Manager",
    brand: "Aurelia Home",
  },
];

function initials(name) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function TestimonialSection() {
  return (
    <div className="mb-10" data-testid="fastrr-engage-testimonials">
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
        Loved by Growing D2C Brands
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="bg-surface border border-border rounded-lg p-5"
            data-testid={`testimonial-${t.name.replace(/\s+/g, "-").toLowerCase()}`}
          >
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className="w-4 h-4 text-warning" />
              ))}
            </div>
            <p className="text-sm text-text-secondary mb-4">{`"${t.quote}"`}</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-tint text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {initials(t.name)}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{t.name}</div>
                <div className="text-xs text-text-muted">{`${t.title}, ${t.brand}`}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/TestimonialSection" --watchAll=false`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/TestimonialSection.jsx src/components/engage/home/__tests__/TestimonialSection.test.jsx
git commit -m "feat(fastrr-engage-home): add testimonial section

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `FinalCTA`

**Files:**
- Create: `src/components/engage/home/FinalCTA.jsx`
- Test: `src/components/engage/home/__tests__/FinalCTA.test.jsx`

**Interfaces:**
- Produces `FinalCTA` (default export, prop: `onEnable`) — Task 7 renders this with `onEnable={handleEnable}`. Renders with `data-testid="fastrr-engage-onboarding-cta"` on its button, preserving the pre-existing testid.

- [ ] **Step 1: Write the failing test**

Create `src/components/engage/home/__tests__/FinalCTA.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FinalCTA from "../FinalCTA";

describe("FinalCTA", () => {
  it("renders the heading, subcopy, and CTA", () => {
    render(<FinalCTA onEnable={() => {}} />);
    expect(screen.getByText("Quick Onboarding, Real Results")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-onboarding-cta")).toBeInTheDocument();
  });

  it("clicking the CTA calls onEnable", () => {
    const onEnable = jest.fn();
    render(<FinalCTA onEnable={onEnable} />);
    fireEvent.click(screen.getByTestId("fastrr-engage-onboarding-cta"));
    expect(onEnable).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/FinalCTA" --watchAll=false`
Expected: FAIL — cannot find module `../FinalCTA`.

- [ ] **Step 3: Write minimal implementation**

Create `src/components/engage/home/FinalCTA.jsx`:

```jsx
import React from "react";
import { Button } from "@/components/ui/button";

export default function FinalCTA({ onEnable }) {
  return (
    <div className="text-center py-12 px-6 rounded-lg bg-gradient-to-br from-primary to-primary-hover text-white">
      <h2 className="text-xl font-semibold mb-2">Quick Onboarding, Real Results</h2>
      <p className="text-sm text-white/90 max-w-md mx-auto mb-6">
        Go live with your first abandoned-cart journey in as little as 15
        minutes — no dev work required.
      </p>
      <Button
        type="button"
        size="lg"
        className="bg-white text-primary hover:bg-white/90"
        data-testid="fastrr-engage-onboarding-cta"
        onClick={onEnable}
      >
        Set Up My Abandoned Cart Journey
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="components/engage/home/__tests__/FinalCTA" --watchAll=false`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/engage/home/FinalCTA.jsx src/components/engage/home/__tests__/FinalCTA.test.jsx
git commit -m "feat(fastrr-engage-home): add high-contrast final CTA

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: Rewrite `FastrrEngage.jsx` page composition

**Files:**
- Modify (rewrite): `src/pages/FastrrEngage.jsx`
- Modify (rewrite): `src/pages/__tests__/FastrrEngage.test.jsx`

**Interfaces:**
- Consumes `HeroSection` (Task 1, prop `onEnable`), `LogoStrip` (Task 2, no props), `DarkStatBand` (Task 3, no props), `BentoFeatureGrid` (Task 4, no props), `TestimonialSection` (Task 5, no props), `FinalCTA` (Task 6, prop `onEnable`), and the existing, unmodified `RevenueOpportunityCard` (`@/components/engage/RevenueOpportunityCard`, props `variant`/`ctaLabel`/`onCtaClick`).
- Produces `FastrrEngagePage` (default export, no props) registered at the existing `/fastrr-engage` route (no `App.js` change needed — the route already points at this same file).

- [ ] **Step 1: Write the failing test**

Replace the full contents of `src/pages/__tests__/FastrrEngage.test.jsx`:

```jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FastrrEngagePage from "../FastrrEngage";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

describe("FastrrEngagePage", () => {
  beforeEach(() => {
    useFastrrEngagePanelStore.getState().close();
    mockNavigate.mockClear();
  });

  it("opens the panel automatically on mount", () => {
    render(<FastrrEngagePage />);
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(true);
  });

  it("renders the page wrapper and all seven sections", () => {
    render(<FastrrEngagePage />);
    expect(screen.getByTestId("page-fastrr-engage")).toBeInTheDocument();
    expect(
      screen.getByText("Convert Every Anonymous Visitor Into a Paying Customer")
    ).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-logo-strip")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-revenue-opportunity")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-stats-bar")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-feature-grid")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-testimonials")).toBeInTheDocument();
    expect(screen.getByTestId("fastrr-engage-onboarding-cta")).toBeInTheDocument();
  });

  it("clicking the hero CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-engage-hero-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });

  it("clicking the onboarding CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-engage-onboarding-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });

  it("clicking the revenue opportunity card's CTA closes the panel and navigates to account setup", () => {
    render(<FastrrEngagePage />);
    fireEvent.click(screen.getByTestId("fastrr-revenue-opportunity-cta"));
    expect(useFastrrEngagePanelStore.getState().isOpen).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/engage/account-setup");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage" --watchAll=false`
Expected: FAIL — the current page doesn't yet render `fastrr-engage-logo-strip` or `fastrr-engage-testimonials`, and doesn't yet import the new Task 1-6 components.

- [ ] **Step 3: Write the implementation**

Replace the full contents of `src/pages/FastrrEngage.jsx`:

```jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";
import RevenueOpportunityCard from "@/components/engage/RevenueOpportunityCard";
import HeroSection from "@/components/engage/home/HeroSection";
import LogoStrip from "@/components/engage/home/LogoStrip";
import DarkStatBand from "@/components/engage/home/DarkStatBand";
import BentoFeatureGrid from "@/components/engage/home/BentoFeatureGrid";
import TestimonialSection from "@/components/engage/home/TestimonialSection";
import FinalCTA from "@/components/engage/home/FinalCTA";

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);
  const close = useFastrrEngagePanelStore((s) => s.close);
  const navigate = useNavigate();

  useEffect(() => {
    open();
  }, [open]);

  function handleEnable() {
    close();
    navigate("/engage/account-setup");
  }

  return (
    <div className="max-w-[1100px] mx-auto" data-testid="page-fastrr-engage">
      <HeroSection onEnable={handleEnable} />
      <LogoStrip />
      <RevenueOpportunityCard
        variant="full"
        ctaLabel="Unlock This Revenue with Fastrr Journey"
        onCtaClick={handleEnable}
      />
      <DarkStatBand />
      <BentoFeatureGrid />
      <TestimonialSection />
      <FinalCTA onEnable={handleEnable} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx craco test --testPathPattern="pages/__tests__/FastrrEngage" --watchAll=false`
Expected: PASS (5 tests).

- [ ] **Step 5: Run the full test suite and the CI-mode build to confirm no regressions**

Run: `npx craco test --watchAll=false`
Expected: All previously-passing tests still pass, plus every new test from Tasks 1-7. This repo has a known, pre-existing, unrelated baseline of exactly 3 failing suites (`campaignBuilderStore.test.js`, `UnifiedTemplateModal.test.jsx`, `TemplateTabCarousel.test.jsx`) — those are expected to still fail; nothing else should.

Run: `CI=true npm run build`
Expected: `Compiled successfully.` (Vercel's build runs with `CI=true`, which turns ESLint warnings into errors — this must be clean.)

- [ ] **Step 6: Commit**

```bash
git add src/pages/FastrrEngage.jsx src/pages/__tests__/FastrrEngage.test.jsx
git commit -m "feat(fastrr-engage-home): compose the revamped home page from the new sections

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** Hero with chat mockup ✅ Task 1; logo strip + Shiprocket trust line ✅ Task 2; dark stat band ✅ Task 3; bento feature grid ✅ Task 4; testimonial section ✅ Task 5; high-contrast final CTA ✅ Task 6; page composition in the exact new order, preserved testids, unchanged `RevenueOpportunityCard` ✅ Task 7. All existing copy (hero headline/subhead, 4 stats, 6 features, tagline, final-CTA text) preserved verbatim across every task per the Global Constraints. Both deliberate color exceptions (WhatsApp green, dark slate band) called out explicitly, no other new hex values anywhere.
- **Placeholder scan:** No "TBD"/"implement later" — the one `// TODO` (hero's secondary CTA) is the pre-existing, explicitly-deferred convention carried over unchanged, not a new gap.
- **Type/name consistency:** `HeroSection`'s and `FinalCTA`'s single `onEnable` prop is defined identically in both files and passed with the same name from `FastrrEngage.jsx` in Task 7. All preserved `data-testid`s (`fastrr-engage-hero-cta`, `fastrr-engage-hero-secondary-cta`, `fastrr-engage-stats-bar`, `fastrr-engage-feature-grid`, `fastrr-engage-onboarding-cta`, `page-fastrr-engage`) match character-for-character between where each Task 1-6 component defines them and where Task 7's rewritten test asserts them. All new testids (`chat-preview-mockup`, `fastrr-engage-logo-strip`, `bento-tagline-heading`, `feature-tile-wide`/`feature-tile`, `fastrr-engage-testimonials`, `testimonial-{slug}`) are each defined once and referenced identically in their own task's test.
