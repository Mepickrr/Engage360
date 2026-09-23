import React from "react";
import { Sparkles, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const TIPS = [
  {
    icon: Sparkles,
    text: "No WhatsApp number yet? Grab an SR Virtual Number for just ₹500/month — no SIM required, fully WhatsApp-ready from day one.",
  },
  {
    icon: Link2,
    text: "Setting up a new WABA? Register it directly with your new number — we'll walk you through every screen.",
  },
];

const PREREQUISITES = [
  "A phone number that can receive WhatsApp — not already active on the WhatsApp app or Business app.",
  "Your business name, category, and a support email or phone number.",
];

const STEPS = [
  {
    title: "Add Your Business Details",
    desc: "Fill in what WhatsApp needs to approve your account: name, category, and contact info.",
  },
  {
    title: "Start Embedded Signup",
    desc: "Launch Meta's official signup yourself, or let our AI assistant fill it in for you in seconds.",
  },
  {
    title: "Verify & Go Live",
    desc: "Confirm your phone number, business details, and email — then you're ready to message customers.",
  },
];

export default function SetupInstructions({ onStart }) {
  return (
    <div data-testid="setup-instructions">
      <h1 className="text-2xl font-bold text-text-primary mb-1">
        Let's Get Your WhatsApp Business Ready
      </h1>
      <p className="text-sm text-text-secondary mb-6">
        A few details and you'll be sending your first message today.
      </p>

      <div className="flex flex-col gap-3 mb-8" data-testid="setup-tips">
        {TIPS.map((tip) => (
          <div
            key={tip.text}
            className="flex gap-2 items-start bg-primary-tint border border-primary/20 rounded-lg px-3 py-2.5 text-[13px] text-text-secondary"
          >
            <tip.icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            {tip.text}
          </div>
        ))}
      </div>

      <div className="mb-8" data-testid="setup-prerequisites">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
          Before you start
        </div>
        <ul className="flex flex-col gap-1.5">
          {PREREQUISITES.map((p) => (
            <li key={p} className="text-[13px] text-text-secondary flex gap-2">
              <span className="text-primary">•</span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-5 mb-8" data-testid="setup-steps">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">{step.title}</div>
              <div className="text-[13px] text-text-secondary mt-0.5">{step.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="lg"
          data-testid="setup-cta-manual"
          onClick={onStart}
        >
          Confirm & Start WhatsApp Setup Manually
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          data-testid="setup-cta-ai"
          onClick={onStart}
        >
          Confirm & Start WhatsApp Setup with AI
        </Button>
      </div>
      <p className="text-xs text-text-muted mt-3 text-center">
        Meta verification opens right after — it only takes a few seconds, and you'll land back
        here automatically once it's done.
      </p>
    </div>
  );
}
