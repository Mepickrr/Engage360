import React from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import AnimatedPhoneMockup, {
  useHeroPlayer,
  SCENE_CHECKOUT,
  SCENE_LOCKSCREEN,
  SCENE_RESTORED,
  SCENE_DONE,
} from "./AnimatedPhoneMockup";

// Maps each of the phone's 7 scenes onto the 4 story beats shown beside it,
// and gives each beat the scene its step jumps the player to when clicked.
const STEP_OF_SCENE = [0, 0, 1, 1, 1, 2, 3];
const STEP_STARTS = [SCENE_CHECKOUT, SCENE_LOCKSCREEN, SCENE_RESTORED, SCENE_DONE];

const CAPTIONS = [
  "9:41 · Aanya reaches payment",
  "She exits with ₹1,240 in her cart",
  "Engage waits 30 minutes",
  "The reminder lands on her lock screen",
  "Her cart and offer, inside WhatsApp",
  "Cart restored, details pre-filled",
  "Order placed · ₹1,178 recovered",
];

const STORY_STEPS = [
  { title: "Shopper drops off", sub: "Leaves checkout before completing payment." },
  {
    title: "Engage waits, then reminds on WhatsApp",
    sub: "A short, configurable delay — never intrusive.",
  },
  { title: "One tap back to purchase", sub: "Cart restored, details pre-filled, order placed." },
  { title: "Order recovered", sub: "Revenue that would otherwise have been lost." },
];

export default function HeroSection() {
  // Owned here (not inside AnimatedPhoneMockup) so this one player drives
  // the phone's screen, the story-step highlighting, AND the playback
  // controls, without running independent, un-synced timers.
  const player = useHeroPlayer();
  const activeStep = STEP_OF_SCENE[player.scene];

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
          <div className="flex items-center gap-3 mb-8">
            <button
              type="button"
              data-testid="hero-cta"
              onClick={() =>
                document
                  .getElementById("recovery-journeys")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className="bg-slate-900 text-white text-sm font-semibold px-5 py-3 rounded-md hover:bg-slate-800 transition-colors"
            >
              Set up recovery journeys
            </button>
            <span className="text-xs text-text-secondary">Live in under 5 minutes</span>
          </div>
          <div
            className="grid grid-cols-3 gap-4 pt-5 border-t border-border mb-8"
            data-testid="hero-features"
          >
            <div>
              <div className="text-sm font-semibold text-text-primary">Pay per message</div>
              <div className="text-xs text-text-secondary mt-0.5">No platform or setup fee</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Zero code</div>
              <div className="text-xs text-text-secondary mt-0.5">
                Pre-built, Meta-approved templates
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">Full control</div>
              <div className="text-xs text-text-secondary mt-0.5">Pause any journey, any time</div>
            </div>
          </div>
          <div className="flex flex-col gap-3" data-testid="hero-story-steps">
            {STORY_STEPS.map((s, i) => {
              const isActive = activeStep === i;
              return (
                <button
                  type="button"
                  key={s.title}
                  data-testid={`hero-story-step-${i}`}
                  data-active={isActive}
                  onClick={() => player.jump(STEP_STARTS[i])}
                  className={`flex gap-3 items-start text-left bg-transparent border-0 p-0 cursor-pointer transition-opacity ${
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
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{s.title}</span>
                    <span className="block text-xs text-text-secondary mt-0.5">{s.sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <AnimatedPhoneMockup
            scene={player.scene}
            exiting={player.exiting}
            flip={player.flip}
            paying={player.paying}
          />
          <div className="flex items-center gap-2 w-full max-w-[360px]" data-testid="hero-phone-controls">
            <button
              type="button"
              onClick={player.toggle}
              aria-label={player.paused ? "Play animation" : "Pause animation"}
              className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center flex-shrink-0 hover:bg-primary-tint transition-colors"
            >
              {player.paused ? (
                <Play className="w-4 h-4 text-text-primary" />
              ) : (
                <Pause className="w-4 h-4 text-text-primary" />
              )}
            </button>
            <button
              type="button"
              onClick={() => player.jump(SCENE_CHECKOUT)}
              aria-label="Replay from start"
              className="w-10 h-10 rounded-full border border-border bg-surface flex items-center justify-center flex-shrink-0 hover:bg-primary-tint transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-text-primary" />
            </button>
            <span
              className="flex-1 text-xs text-text-secondary truncate"
              data-testid="hero-phone-caption"
            >
              {CAPTIONS[player.scene]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
