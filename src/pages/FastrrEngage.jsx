import React, { useEffect } from "react";
import {
  Eye,
  MessageCircle,
  Workflow,
  BarChart3,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

// Benchmarks below are directionally real, pending final marketing/legal
// sign-off before this page goes live externally.
const STATS = [
  { value: "20%+", label: "Abandoned cart recovery" },
  { value: "25%+", label: "Contribution to revenue" },
  { value: "20X+", label: "ROAS" },
  { value: "2B+", label: "Conversations delivered" },
];

const FEATURES = [
  {
    icon: Eye,
    name: "Identify Anonymous Shoppers",
    desc: "Spot up to 30% of visitors who never sign up, and track what they browse across visits — so every follow-up feels personal, not random.",
  },
  {
    icon: MessageCircle,
    name: "Conversational Commerce",
    desc: "Shoppers reply, vote, and pick their own offers through WhatsApp flows that feel like a conversation, not a broadcast.",
  },
  {
    icon: Workflow,
    name: "Automated Customer Journeys",
    desc: "Fire the right message on the right channel the moment it matters — abandoned cart, COD-to-prepaid nudge, order status, or RTO risk.",
  },
  {
    icon: BarChart3,
    name: "Real-Time Performance Analytics",
    desc: "Watch ROAS, cart recovery, revenue influenced, and engagement update live in one dashboard built for D2C growth teams.",
  },
  {
    icon: ShoppingCart,
    name: "Instant Checkout on WhatsApp",
    desc: "Let shoppers finish checkout without ever leaving the chat — no app switch, no lost momentum.",
  },
  {
    icon: ShieldCheck,
    name: "Built-In Security & Trust",
    desc: "Enterprise-grade verification keeps shopper data safe, so your brand stays protected and customers stay confident.",
  },
];

function HeroSection({ onOpenPanel }) {
  return (
    <div className="text-center py-16 px-6 bg-primary-tint rounded-lg mb-10">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-3 max-w-2xl mx-auto">
        Turn Every Anonymous Visitor Into a Paying Customer
      </h1>
      <p className="text-base text-text-secondary max-w-xl mx-auto mb-6">
        Identify shoppers before they sign up, then win them back on WhatsApp —
        the channel with the highest open and reply rates in commerce.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          size="lg"
          data-testid="fastrr-engage-hero-cta"
          onClick={onOpenPanel}
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
  );
}

function StatsBar() {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
      data-testid="fastrr-engage-stats-bar"
    >
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-lg p-5 text-center"
        >
          <div className="text-2xl font-bold text-primary">{stat.value}</div>
          <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function TaglineBanner() {
  return (
    <div className="text-center py-8 mb-10">
      <h2 className="text-xl font-semibold text-text-primary tracking-wide mb-2">
        Identify <span className="text-primary">|</span> Engage{" "}
        <span className="text-primary">|</span> Grow
      </h2>
      <p className="text-sm text-text-secondary max-w-lg mx-auto">
        Recognise every shopper, re-engage them across channels, and unlock new
        revenue streams with automated retargeting.
      </p>
    </div>
  );
}

function FeatureGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10"
      data-testid="fastrr-engage-feature-grid"
    >
      {FEATURES.map((f) => (
        <div
          key={f.name}
          className="bg-surface border border-border rounded-lg p-5 flex gap-4"
        >
          <div className="w-10 h-10 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
            <f.icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary mb-1">
              {f.name}
            </div>
            <div className="text-sm text-text-secondary">{f.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OnboardingCTA({ onOpenPanel }) {
  return (
    <div className="text-center py-12 px-6 bg-success-bg rounded-lg">
      <h2 className="text-xl font-semibold text-text-primary mb-2">
        Quick Onboarding, Real Results
      </h2>
      <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
        Go live with your first abandoned-cart journey in as little as 15
        minutes — no dev work required.
      </p>
      <Button
        type="button"
        size="lg"
        data-testid="fastrr-engage-onboarding-cta"
        onClick={onOpenPanel}
      >
        Set Up My Abandoned Cart Journey
      </Button>
    </div>
  );
}

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="max-w-[1000px] mx-auto" data-testid="page-fastrr-engage">
      <HeroSection onOpenPanel={open} />
      <StatsBar />
      <TaglineBanner />
      <FeatureGrid />
      <OnboardingCTA onOpenPanel={open} />
    </div>
  );
}
