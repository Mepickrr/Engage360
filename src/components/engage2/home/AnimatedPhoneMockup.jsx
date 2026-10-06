import React, { useEffect, useReducer, useRef } from "react";
import {
  Loader2,
  ChevronLeft,
  Minus,
  Plus,
  BadgeCheck,
  ExternalLink,
  ShoppingBag,
  Check,
  MessageCircle,
  Clock,
} from "lucide-react";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";

// 7 scenes, in the exact order and with the exact in-scene beats (clock
// flip, exit-intent fade-to-black, payment-confirming spinner) as the
// reference "Recovery Activation" prototype this hero is built to match.
export const SCENE_CHECKOUT = 0;
export const SCENE_EXIT_INTENT = 1;
export const SCENE_LOCKSCREEN = 2;
export const SCENE_NOTIFICATION = 3;
export const SCENE_WHATSAPP = 4;
export const SCENE_RESTORED = 5;
export const SCENE_DONE = 6;
const SCENE_COUNT = 7;

const DURATIONS_MS = [2200, 2700, 2000, 2700, 3900, 3100, 6200];

// One-off beats fired a fixed delay after a scene is entered: the exit
// sheet fades the screen to black just before cutting to the lock screen,
// the lock-screen clock flips to the reminder's send time, and the
// restored-checkout CTA swaps to a "confirming payment" spinner.
const BEATS = {
  [SCENE_EXIT_INTENT]: [["exiting", 2200]],
  [SCENE_LOCKSCREEN]: [["flip", 900]],
  [SCENE_RESTORED]: [["paying", 1900]],
};

const INITIAL_BEATS = { exiting: false, flip: false, paying: false };

// Exported (not private to this file) so HeroSection can own a single
// player and drive the phone, the step list, and the playback controls
// from the same state — independent hook calls would run un-synced timers.
export function useHeroPlayer() {
  const [, forceRender] = useReducer((c) => c + 1, 0);
  const ref = useRef({ scene: SCENE_CHECKOUT, paused: false, ...INITIAL_BEATS });
  const tickTimer = useRef(null);
  const beatTimers = useRef([]);

  const clearBeatTimers = () => {
    beatTimers.current.forEach(clearTimeout);
    beatTimers.current = [];
  };

  const armBeats = () => {
    clearBeatTimers();
    (BEATS[ref.current.scene] || []).forEach(([key, ms]) => {
      beatTimers.current.push(
        setTimeout(() => {
          ref.current = { ...ref.current, [key]: true };
          forceRender();
        }, ms)
      );
    });
  };

  const tick = () => {
    clearTimeout(tickTimer.current);
    clearBeatTimers();
    if (ref.current.paused) return;
    armBeats();
    tickTimer.current = setTimeout(() => {
      ref.current = {
        ...ref.current,
        scene: (ref.current.scene + 1) % SCENE_COUNT,
        ...INITIAL_BEATS,
      };
      forceRender();
      tick();
    }, DURATIONS_MS[ref.current.scene]);
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Freeze on the frame that most directly shows the product's value —
      // the WhatsApp reminder — instead of cycling through the story.
      ref.current = { ...ref.current, scene: SCENE_WHATSAPP };
      forceRender();
      return undefined;
    }
    tick();
    return () => {
      clearTimeout(tickTimer.current);
      clearBeatTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jump = (scene) => {
    clearTimeout(tickTimer.current);
    ref.current = { scene, paused: false, ...INITIAL_BEATS };
    forceRender();
    tick();
  };

  const toggle = () => {
    ref.current = { ...ref.current, paused: !ref.current.paused };
    forceRender();
    tick();
  };

  return { ...ref.current, jump, toggle };
}

// Keyframes for the scenes below: a sheet sliding up, a notification
// dropping in, the order-confirmed card stack scrolling into view, and its
// confetti burst. Mounted once (not per-screen) so cycling scenes never
// re-inserts it.
function AnimationStyles() {
  return (
    <style>{`
      @keyframes engage-fade-in { from { opacity: 0 } to { opacity: 1 } }
      @keyframes engage-sheet-up { from { transform: translateY(100%) } to { transform: translateY(0) } }
      @keyframes engage-drop-in { 0% { opacity: 0; transform: translateY(-28px) scale(.96) } 100% { opacity: 1; transform: none } }
      @keyframes engage-rise { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
      @keyframes engage-scroll-up { from { transform: translateY(0) } to { transform: translateY(-180px) } }
      @keyframes engage-confetti { 0% { opacity: 0; transform: translateY(-10px) rotate(0) } 10% { opacity: 1 } 100% { opacity: 0; transform: translateY(130px) rotate(300deg) } }
      @keyframes engage-pop { 0% { transform: scale(0) } 70% { transform: scale(1.12) } 100% { transform: scale(1) } }
      .engage-fade-in { animation: engage-fade-in .4s ease both }
      .engage-sheet-up { animation: engage-sheet-up .4s cubic-bezier(.2,.8,.2,1) both }
      .engage-drop-in { animation: engage-drop-in .5s cubic-bezier(.2,.9,.25,1.05) both }
      .engage-rise { animation: engage-rise .45s cubic-bezier(.2,.8,.2,1) both }
      .engage-scroll-up { animation: engage-scroll-up 1.3s cubic-bezier(.45,0,.2,1) 2.6s both }
      .engage-pop { animation: engage-pop .45s cubic-bezier(.2,.9,.3,1.3) both }
      .engage-confetti { position: absolute; top: 0; width: 5px; height: 8px; border-radius: 2px; opacity: 0; animation: engage-confetti 1.4s ease-in both; pointer-events: none }
    `}</style>
  );
}

function StoreHeader() {
  return (
    <div className="flex items-center justify-between px-3 py-3 bg-slate-900 text-white flex-shrink-0">
      <ChevronLeft className="w-4 h-4 flex-shrink-0" />
      <span className="font-serif italic text-[15px] tracking-wide">Mystore1</span>
      <ShoppingBag className="w-4 h-4 flex-shrink-0" />
    </div>
  );
}

function CheckoutScreen({ scene, exiting }) {
  const showSheet = scene === SCENE_EXIT_INTENT;
  return (
    <div className="relative flex flex-col h-full bg-white" data-testid="phone-phase-checkout">
      <StoreHeader />

      <div className="bg-primary-tint/50 px-3 py-2">
        <div className="text-[10px] font-semibold text-primary mb-1">
          You're ₹200 away from free shipping 🎁
        </div>
        <div className="h-1 rounded-full bg-white/80 overflow-hidden">
          <div className="h-full w-[70%] rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 py-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-900">
            Order summary <span className="text-slate-400 font-normal">· 1 item</span>
          </span>
          <span className="text-[11px] font-semibold text-slate-900">₹1,240</span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-12 h-12 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0">
            <span className="absolute -top-1.5 -left-1.5 bg-success text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-sm">
              13% OFF
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-900 leading-tight truncate">
              Juniper Cotton Throw
            </div>
            <div className="text-[9px] text-slate-500 mt-0.5">Qty 1 · Ivory</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-slate-900">₹1,240</span>
              <span className="text-[9px] text-slate-400 line-through">₹1,420</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 border border-border rounded-md px-1.5 py-1 flex-shrink-0">
            <Minus className="w-2.5 h-2.5 text-slate-500" />
            <span className="text-[10px] font-semibold text-slate-900 w-2.5 text-center">1</span>
            <Plus className="w-2.5 h-2.5 text-slate-500" />
          </div>
        </div>

        <div className="rounded-md bg-success-bg/70 text-success text-[9px] font-semibold text-center py-1.5">
          ✨ You're saving ₹180 on this order ✨
        </div>

        <div className="rounded-md border border-border px-2.5 py-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-500">Deliver to</span>
          <span className="text-[10px] font-semibold text-slate-900 truncate max-w-[55%] text-right">
            Aanya · Indiranagar
          </span>
        </div>

        <div className="rounded-md border border-border px-2.5 py-2 flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-[4px] border-primary flex-shrink-0" />
          <span className="flex-1 text-[10px] font-medium text-slate-700">UPI · GPay, PhonePe, Paytm</span>
          <span className="text-[9px] font-semibold text-success bg-success-bg px-1.5 py-0.5 rounded">
            5% off
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 px-3 py-3 border-t border-border flex-shrink-0">
        <div>
          <div className="text-[9px] text-slate-500">Total</div>
          <div className="text-[13px] font-bold text-slate-900">
            ₹1,178 <span className="text-[9px] font-medium text-slate-400 line-through">₹1,240</span>
          </div>
        </div>
        <div className="flex-1 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold">
          Pay ₹1,178
        </div>
      </div>

      {showSheet && (
        <div className="absolute inset-0 z-10" data-testid="phone-exit-intent-sheet">
          <div className="engage-fade-in absolute inset-0 bg-black/50" />
          <div className="engage-sheet-up absolute inset-x-0 bottom-0 bg-white rounded-t-2xl px-4 pt-3 pb-8 flex flex-col gap-2.5">
            <div className="self-center w-9 h-1 rounded-full bg-slate-300" />
            <div className="text-[15px] font-semibold text-slate-900 mt-1">Leaving already?</div>
            <div className="text-[11px] text-slate-500 leading-snug">
              We'll keep your cart saved, along with your extra 5% off on UPI.
            </div>
            <div className="h-10 rounded-md bg-slate-900 text-white flex items-center justify-center text-[12px] font-semibold mt-1">
              Continue to pay
            </div>
            <div className="h-10 rounded-md border border-border flex items-center justify-center text-[12px] font-semibold text-slate-900">
              Yes, exit checkout
            </div>
          </div>
          {exiting && <div className="engage-fade-in absolute inset-0 bg-black" />}
        </div>
      )}
    </div>
  );
}

function LockScreen({ scene, flip }) {
  const showNotification = scene === SCENE_NOTIFICATION;
  const clockIsNew = showNotification || flip;
  return (
    <div
      className="flex flex-col items-center h-full pt-14 text-white relative"
      style={{ background: "linear-gradient(180deg, #3b3550, #221f30)" }}
      data-testid="phone-phase-lockscreen"
    >
      <div className="text-xs opacity-70">Tuesday, 24 September</div>
      <div className="text-4xl font-medium mt-1 tabular-nums">{clockIsNew ? "8:12" : "7:42"}</div>

      {!showNotification && (
        <span className="engage-rise mt-3 inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-[10px] font-medium">
          <Clock className="w-2.5 h-2.5" />
          30 minutes later
        </span>
      )}

      {showNotification && (
        <div
          className="engage-drop-in absolute left-3 right-3 top-44 bg-white text-slate-900 rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-xl"
          data-testid="phone-lock-notification"
        >
          <span className="w-8 h-8 rounded-lg bg-success flex items-center justify-center flex-shrink-0 text-white">
            <Check className="w-4 h-4" />
          </span>
          <span className="min-w-0">
            <span className="flex justify-between gap-1.5 text-[11px] font-semibold">
              <span>Mystore1</span>
              <span className="text-slate-400 font-normal">now</span>
            </span>
            <span className="block text-[11px] leading-tight text-slate-600 mt-0.5">
              Hi Aanya, your Juniper throw is reserved for you…
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function WhatsAppScreen() {
  return (
    <div className="flex flex-col h-full bg-[#efe9e1]" data-testid="phone-phase-whatsapp">
      <div className="bg-[#005c4b] text-white px-3 py-2.5 flex items-center gap-2.5 flex-shrink-0">
        <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          M
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[13px] font-semibold leading-tight">
            Mystore1
            <BadgeCheck className="w-3 h-3 text-[#53bdeb] fill-[#53bdeb] text-white flex-shrink-0" />
          </div>
          <div className="text-[10px] text-white/70">Business Account</div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-3 py-2.5 flex flex-col gap-2">
        <span className="self-center text-[9px] font-medium bg-black/5 text-slate-500 px-2.5 py-1 rounded-full">
          Today
        </span>
        <div className="bg-white rounded-xl rounded-tl-sm p-1.5 shadow-sm max-w-[88%]">
          <div className="h-24 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 relative overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1.5">
              <span className="text-white text-[11px] font-bold">Juniper Cotton Throw</span>
            </div>
          </div>
          <p className="text-[12px] leading-snug mt-2 px-1 text-slate-800">
            Hi Aanya, your Juniper throw is reserved for you — complete your order in one tap
            before it's gone.
          </p>
          <div className="flex justify-end px-1 mt-1">
            <span className="text-[9px] text-slate-400">8:12 pm</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#00a5f4] border-t border-black/5 mt-1 pt-2">
            <ExternalLink className="w-3 h-3" />
            Complete My Order
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#00a5f4] border-t border-black/5 mt-1 pt-2">
            <Clock className="w-3 h-3" />
            Remind Me Tomorrow
          </div>
        </div>
      </div>

      <div className="px-3 py-1.5 text-center text-[9px] text-slate-500 border-t border-black/5 flex-shrink-0">
        Reply STOP to opt out
      </div>
    </div>
  );
}

function RestoredScreen({ paying }) {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="phone-phase-payment">
      <StoreHeader />

      <div className="flex-1 overflow-hidden px-3 py-2.5 flex flex-col gap-2">
        <div className="rounded-lg bg-slate-900 text-white px-3 py-2.5 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </span>
          <span className="text-[10.5px] leading-snug">
            Welcome back, Aanya. Your cart is just as you left it.
          </span>
        </div>

        <div className="rounded-md border border-border px-2.5 py-2 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0" />
          <span className="flex-1 text-[11px] font-semibold text-slate-900">1 item</span>
          <span className="text-[9px] text-slate-400 line-through">₹1,240</span>
          <span className="text-[11px] font-bold text-slate-900">₹1,178</span>
        </div>

        <div className="rounded-md border border-border px-2.5 py-2 flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] font-semibold text-success">
            <Check className="w-2.5 h-2.5" />
            Saved address
          </span>
          <span className="text-[10.5px] font-semibold text-slate-900">Aanya · Indiranagar</span>
        </div>

        <div className="rounded-md border border-border px-2.5 py-2 flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full border-[4px] border-primary flex-shrink-0" />
          <span className="flex-1 text-[10.5px] font-semibold text-slate-900">GPay UPI</span>
          <span className="text-[9px] font-semibold text-success">₹62 off applied</span>
        </div>
      </div>

      <div className="mt-auto px-3 py-3 border-t border-border flex flex-col gap-1.5 flex-shrink-0">
        <div className="relative h-10 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold overflow-hidden">
          {paying ? (
            <span className="engage-fade-in flex items-center gap-2" data-testid="phone-paying">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Confirming payment
            </span>
          ) : (
            <span className="engage-fade-in">Pay ₹1,178</span>
          )}
        </div>
        <span className="text-[8.5px] text-slate-400 text-center">Secured checkout by Fastrr</span>
      </div>
    </div>
  );
}

const CONFETTI = [
  { left: "12%", bg: "#F59E0B", delay: ".3s" },
  { left: "24%", bg: "#F97066", delay: ".45s" },
  { left: "38%", bg: "#7C5CFC", delay: ".38s" },
  { left: "52%", bg: "#22C55E", delay: ".55s" },
  { left: "66%", bg: "#F59E0B", delay: ".33s" },
  { left: "80%", bg: "#7C5CFC", delay: ".5s" },
  { left: "90%", bg: "#22C55E", delay: ".6s" },
];

function DoneScreen() {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="phone-phase-done">
      <StoreHeader />

      <div className="flex-1 overflow-hidden relative">
        <div className="engage-scroll-up flex flex-col gap-2 px-3 py-3">
          <div className="relative flex flex-col items-center text-center pb-2">
            {CONFETTI.map((c, i) => (
              <span
                key={i}
                className="engage-confetti"
                style={{ left: c.left, background: c.bg, animationDelay: c.delay }}
              />
            ))}
            <span className="engage-pop w-11 h-11 rounded-full bg-success-bg text-success flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5" />
            </span>
            <div className="text-[13px] font-bold text-slate-900 mt-2">Order placed!</div>
            <div className="text-[9.5px] text-slate-500 leading-snug mt-1">
              Thanks, Aanya. Order <span className="font-semibold text-slate-900">#MB-2048</span> is
              confirmed.
            </div>
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success bg-success-bg px-2 py-1 rounded-full mt-2">
              <Check className="w-2.5 h-2.5" />
              ₹1,178 paid via GPay UPI
            </span>
          </div>

          <div className="rounded-md border border-border px-2.5 py-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500">Estimated delivery</span>
              <span className="text-[9px] font-semibold text-primary">Track</span>
            </div>
            <span className="text-[11px] font-bold text-slate-900">Arriving by Thu, 9 Oct</span>
            <div className="grid grid-cols-4 text-[8px] text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-900">Placed</span>
              <span className="text-center">Packed</span>
              <span className="text-center">Shipped</span>
              <span className="text-right">Delivered</span>
            </div>
          </div>

          <div className="rounded-md border border-border px-2.5 py-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#25D366] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-3.5 h-3.5 text-white" />
            </span>
            <span className="text-[9.5px] text-slate-600 text-left leading-snug">
              We'll message you on WhatsApp when your order ships.
            </span>
          </div>

          <div className="rounded-md border border-border px-2.5 py-2 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0" />
            <span className="flex-1 text-[11px] font-semibold text-slate-900">Juniper Cotton Throw</span>
            <span className="text-[11px] font-bold text-slate-900">₹1,178</span>
          </div>

          <div className="rounded-md border border-border px-2.5 py-2 flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between text-slate-500">
              <span>Item total</span>
              <span>₹1,240</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>UPI discount (5%)</span>
              <span className="text-success">−₹62</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery</span>
              <span className="text-success">Free</span>
            </div>
            <div className="border-t border-dashed border-border my-0.5" />
            <div className="flex justify-between text-[11px] font-bold text-slate-900">
              <span>Amount paid</span>
              <span>₹1,178</span>
            </div>
          </div>

          <div className="rounded-md border border-border px-2.5 py-2 flex flex-col gap-0.5">
            <span className="text-[9px] text-slate-500">Delivering to</span>
            <span className="text-[10.5px] font-semibold text-slate-900">Aanya · Indiranagar</span>
          </div>
        </div>
      </div>

      <div className="mt-auto px-3 py-3 border-t border-border flex gap-2 flex-shrink-0">
        <div className="flex-1 h-9 rounded-md border border-border flex items-center justify-center text-[10.5px] font-semibold text-slate-900">
          Keep shopping
        </div>
        <div className="flex-1 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10.5px] font-semibold">
          Track order
        </div>
      </div>
    </div>
  );
}

export default function AnimatedPhoneMockup({ scene, exiting, flip, paying }) {
  let screen;
  switch (scene) {
    case SCENE_LOCKSCREEN:
    case SCENE_NOTIFICATION:
      screen = <LockScreen scene={scene} flip={flip} />;
      break;
    case SCENE_WHATSAPP:
      screen = <WhatsAppScreen />;
      break;
    case SCENE_RESTORED:
      screen = <RestoredScreen paying={paying} />;
      break;
    case SCENE_DONE:
      screen = <DoneScreen />;
      break;
    case SCENE_CHECKOUT:
    case SCENE_EXIT_INTENT:
    default:
      screen = <CheckoutScreen scene={scene} exiting={exiting} />;
      break;
  }

  // Every scene but the WhatsApp chat opens with a colored/dark header
  // flush against the very top of the screen, so the status bar needs
  // white icons there to stay legible.
  const statusVariant = scene === SCENE_WHATSAPP ? "dark" : "light";

  return (
    <div data-phone-scene={scene}>
      <AnimationStyles />
      <PhoneMockup statusVariant={statusVariant}>{screen}</PhoneMockup>
    </div>
  );
}
