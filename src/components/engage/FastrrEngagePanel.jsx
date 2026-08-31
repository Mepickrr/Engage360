import React from "react";
import { Eye, ShoppingCart, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

const STATS = [
  // TODO: replace with real benchmark
  { value: "Upto 3.2x", label: "ROI on automated WhatsApp journeys" },
  // TODO: replace with real benchmark
  { value: "Upto 25%", label: "Cart recovery rate" },
  // TODO: replace with real benchmark
  { value: "Upto 40%", label: "Unknown visitors re-identified & re-engaged" },
];

const JOURNEYS = [
  {
    icon: Eye,
    name: "Abandoned Product",
    desc: "Visitor viewed a product but didn't add to cart — send a timely nudge with the exact product.",
  },
  {
    icon: ShoppingCart,
    name: "Abandoned Cart",
    desc: "Items sitting in cart — recover with a reminder + incentive before they leave.",
  },
  {
    icon: AlertTriangle,
    name: "Abandoned Checkout",
    desc: "Checkout started but not completed — the highest-intent recovery moment.",
  },
];

const WHY_POINTS = [
  "Identifies unknown/anonymous visitors for retargeting",
  "No manual campaign setup — journeys run automatically",
  "Ease of onboarding: live in under 15 minutes",
];

function HeroSection() {
  return (
    <div
      className="rounded-lg p-5 mb-6 text-white"
      style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)" }}
      data-testid="fastrr-engage-panel-hero"
    >
      {/* Simple CSS chat-bubble mockup standing in for a product screenshot */}
      <div className="flex flex-col gap-1.5 mb-4 max-w-[220px]">
        <div className="bg-white/90 text-slate-900 text-[11px] rounded-lg rounded-bl-none px-2.5 py-1.5 self-start shadow-sm">
          Cart reminder sent
        </div>
        <div className="bg-white/60 text-slate-900 text-[11px] rounded-lg rounded-br-none px-2.5 py-1.5 self-end shadow-sm">
          "Yes, still interested!"
        </div>
        <div className="bg-white text-slate-900 text-[11px] rounded-lg rounded-bl-none px-2.5 py-1.5 self-start shadow-sm font-medium">
          ✅ Order confirmed
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-1">
        Recover Revenue From Every Missed Visit
      </h3>
      <p className="text-[13px] text-white/90 mb-4">
        Automated WhatsApp journeys that turn drop-offs into orders — no manual follow-up needed.
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="bg-white text-primary hover:bg-white/90"
          data-testid="fastrr-engage-hero-primary-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Enable Fastrr Journey
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/60 text-white hover:bg-white/10"
          data-testid="fastrr-engage-hero-secondary-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          See how it works
        </Button>
      </div>
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 mb-4" data-testid="fastrr-engage-stat-grid">
      {STATS.map((stat) => (
        <div key={stat.label} className="bg-primary-tint rounded-lg p-3 text-center">
          <div className="text-base font-bold text-primary">{stat.value}</div>
          <div className="text-[10px] text-text-secondary mt-1 leading-tight">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

function TrustLine() {
  return (
    <div className="bg-app-bg border border-border rounded-lg px-4 py-3 text-[13px] text-text-secondary mb-6">
      {/* TODO: replace with real trust stat */}
      Trusted by <strong className="text-text-primary">150+ sellers</strong> recovering{" "}
      <strong className="text-text-primary">₹50L+</strong> in monthly revenue.
    </div>
  );
}

function JourneyList() {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Journeys Supported</h4>
      <div className="flex flex-col gap-3" data-testid="fastrr-engage-journey-list">
        {JOURNEYS.map((j) => (
          <div key={j.name} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
              <j.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-text-primary">{j.name}</div>
              <div className="text-[12px] text-text-secondary mt-0.5">{j.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhySection() {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-text-primary mb-3">Why Sellers Enable It</h4>
      <ul className="flex flex-col gap-2 mb-3">
        {WHY_POINTS.map((point) => (
          <li key={point} className="flex gap-2 items-start text-[13px] text-text-secondary">
            <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            {point}
          </li>
        ))}
      </ul>
      <div className="bg-success-bg border border-success/30 rounded-lg px-3 py-2 text-[13px] font-medium text-success">
        {/* TODO: confirm onboarding time */}
        Get started in as little as 15 minutes
      </div>
    </div>
  );
}

export default function FastrrEngagePanel() {
  const isOpen = useFastrrEngagePanelStore((s) => s.isOpen);
  const close = useFastrrEngagePanelStore((s) => s.close);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[420px] flex flex-col overflow-hidden"
        data-testid="fastrr-engage-panel"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Fastrr Journey</SheetTitle>
          <p className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
            Powered by Fastrr Engage
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <HeroSection />

          <h4 className="text-sm font-semibold text-text-primary mb-1">
            WhatsApp Marketing Journeys
          </h4>
          <p className="text-[13px] text-text-secondary mb-4">
            Turn anonymous website visitors and drop-offs into recovered revenue — automatically.
          </p>

          <StatGrid />
          <TrustLine />
          <JourneyList />
          <WhySection />
        </div>

        <Button
          type="button"
          className="w-full"
          data-testid="fastrr-engage-footer-cta"
          onClick={() => {}} // TODO: wire up once enablement flow is defined
        >
          Enable Fastrr Journey
        </Button>
      </SheetContent>
    </Sheet>
  );
}
