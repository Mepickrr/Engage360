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
