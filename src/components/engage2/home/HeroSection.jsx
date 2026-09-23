import React from "react";
import AnimatedPhoneMockup, {
  usePhonePhase,
  PHASE_CHECKOUT,
  PHASE_LOCKSCREEN,
  PHASE_WHATSAPP,
  PHASE_RESTORING,
  PHASE_PAYMENT,
  PHASE_DONE,
} from "./AnimatedPhoneMockup";

const STORY_STEPS = [
  { title: "Shopper drops off", sub: "Leaves checkout before completing payment.", phases: [PHASE_CHECKOUT] },
  {
    title: "Engage waits, then reminds on WhatsApp",
    sub: "A short, configurable delay — never intrusive.",
    phases: [PHASE_LOCKSCREEN, PHASE_WHATSAPP],
  },
  {
    title: "One tap back to purchase",
    sub: "Cart restored, details pre-filled, order placed.",
    phases: [PHASE_RESTORING, PHASE_PAYMENT],
  },
  { title: "Order recovered", sub: "Revenue that would otherwise have been lost.", phases: [PHASE_DONE] },
];

export default function HeroSection() {
  // Owned here (not inside AnimatedPhoneMockup) so this one phase value can
  // drive both the phone's screen AND which story step is highlighted,
  // without running two independent, un-synced timers.
  const phase = usePhonePhase();

  return (
    <div className="bg-gradient-to-br from-primary-tint to-white rounded-lg py-16 px-6 mb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-[1000px] mx-auto">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 bg-primary-tint text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Fastrr Engage · WhatsApp recovery
          </span>
          <h1
            className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
            data-testid="hero-headline"
          >
            Recover abandoned revenue on WhatsApp — automatically.
          </h1>
          <p className="text-base text-text-secondary mb-6" data-testid="hero-subhead">
            Engage detects shoppers who drop off at product, cart or checkout, and re-engages
            them with a personalised WhatsApp message from your brand — one tap takes them
            straight back to purchase.
          </p>
          <div className="flex flex-col gap-3" data-testid="hero-story-steps">
            {STORY_STEPS.map((s, i) => {
              const isActive = s.phases.includes(phase);
              return (
                <div
                  key={s.title}
                  data-testid={`hero-story-step-${i}`}
                  data-active={isActive}
                  className={`flex gap-3 items-start transition-opacity ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 ${
                      isActive
                        ? "bg-text-primary border-text-primary text-white"
                        : "bg-surface border-border text-text-secondary"
                    }`}
                  >
                    ✓
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-text-primary">{s.title}</div>
                    <div className="text-xs text-text-secondary mt-0.5">{s.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-center">
          <AnimatedPhoneMockup phase={phase} />
        </div>
      </div>
    </div>
  );
}
