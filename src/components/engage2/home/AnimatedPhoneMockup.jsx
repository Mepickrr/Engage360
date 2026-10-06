import React, { useEffect, useState } from "react";
import {
  Loader2,
  Lock,
  ChevronLeft,
  Minus,
  Plus,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";
import PhoneMockup from "@/components/engage2/account-setup/PhoneMockup";

function BrowserChrome() {
  return (
    <div className="flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-slate-100 text-[10px] text-slate-500 mb-3 flex-shrink-0">
      <Lock className="w-2.5 h-2.5" />
      <span className="font-mono">mystore1.in/checkout</span>
    </div>
  );
}

// 6 phases telling the same "checkout -> reminder -> recovered" story as
// the story-steps list HeroSection renders beside this component.
// Durations (ms) are how long each phase holds before advancing.
export const PHASE_CHECKOUT = 0;
export const PHASE_LOCKSCREEN = 1;
export const PHASE_WHATSAPP = 2;
export const PHASE_RESTORING = 3;
export const PHASE_PAYMENT = 4;
export const PHASE_DONE = 5;
const DURATIONS_MS = [2800, 2600, 2600, 1500, 2400, 2800];
const PHASE_COUNT = DURATIONS_MS.length;

// Exported (not private to this file) so HeroSection can own a single
// phase timeline and pass it both to this phone and to its own
// story-steps highlighting — two independent calls to this hook would
// run two un-synced timers that drift apart.
export function usePhonePhase() {
  const [phase, setPhase] = useState(PHASE_CHECKOUT);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      // Freeze on the frame that most directly shows the product's value —
      // the WhatsApp reminder — instead of cycling through the story.
      setPhase(PHASE_WHATSAPP);
      return undefined;
    }
    let timer;
    let current = PHASE_CHECKOUT;
    function tick() {
      timer = setTimeout(() => {
        current = (current + 1) % PHASE_COUNT;
        setPhase(current);
        tick();
      }, DURATIONS_MS[current]);
    }
    tick();
    return () => clearTimeout(timer);
  }, []);

  return phase;
}

function CheckoutScreen() {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="phone-phase-checkout">
      <BrowserChrome />
      <div className="flex items-center gap-2 px-3 pb-2.5 border-b border-border">
        <ChevronLeft className="w-4 h-4 text-slate-700 flex-shrink-0" />
        <span className="text-[13px] font-semibold text-slate-900">Shopping Bag (1)</span>
      </div>

      <div className="bg-primary-tint/50 px-3 py-2.5">
        <div className="text-[10px] font-semibold text-primary mb-1.5">
          You're ₹200 away from free shipping 🎁
        </div>
        <div className="h-1 rounded-full bg-white/80 overflow-hidden">
          <div className="h-full w-[70%] rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3 py-3 border-b border-border">
        <div className="relative w-14 h-14 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0">
          <span className="absolute -top-1.5 -left-1.5 bg-success text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-sm">
            13% OFF
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold text-slate-900 leading-tight truncate">
            Juniper Cotton Throw
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Qty 1 · Ivory</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[12px] font-bold text-slate-900">₹1,240</span>
            <span className="text-[10px] text-slate-400 line-through">₹1,420</span>
          </div>
        </div>
        <div className="flex items-center gap-2 border border-border rounded-md px-1.5 py-1 flex-shrink-0">
          <Minus className="w-2.5 h-2.5 text-slate-500" />
          <span className="text-[11px] font-semibold text-slate-900 w-2.5 text-center">1</span>
          <Plus className="w-2.5 h-2.5 text-slate-500" />
        </div>
      </div>

      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Have a coupon code?</span>
        <span className="text-[11px] font-semibold text-primary">Apply</span>
      </div>

      <div className="px-3 py-2 text-center text-[10px] text-success font-semibold bg-success-bg/70">
        ✨ You're saving ₹180 on this order ✨
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 px-3 py-3 border-t border-border">
        <div>
          <div className="text-[9px] text-slate-500">Total</div>
          <div className="text-[13px] font-bold text-slate-900">₹1,240</div>
        </div>
        <div className="flex-1 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold">
          Continue to payment
        </div>
      </div>
    </div>
  );
}

function LockScreen() {
  return (
    <div
      className="flex flex-col items-center h-full pt-14 text-white relative"
      style={{ background: "linear-gradient(180deg, #3b3550, #221f30)" }}
      data-testid="phone-phase-lockscreen"
    >
      <div className="text-xs opacity-70">Tuesday, 24 September</div>
      <div className="text-4xl font-medium mt-1 tabular-nums">7:42</div>
      <div className="absolute left-3 right-3 top-44 bg-white text-slate-900 rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-xl">
        <span className="w-8 h-8 rounded-lg bg-success flex items-center justify-center flex-shrink-0 text-white text-sm">
          ✓
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
        </div>
      </div>

      <div className="px-3 py-1.5 text-center text-[9px] text-slate-500 border-t border-black/5 flex-shrink-0">
        Type STOP to unsubscribe
      </div>
    </div>
  );
}

function RestoringScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-2 text-xs text-slate-500"
      data-testid="phone-phase-restoring"
    >
      <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      Restoring your cart
    </div>
  );
}

function PaymentScreen() {
  return (
    <div className="flex flex-col h-full p-3" data-testid="phone-phase-payment">
      <BrowserChrome />
      <div className="flex items-center gap-3 pb-3 border-b border-border px-1">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-200 to-amber-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-slate-900">Juniper Cotton Throw</div>
          <div className="text-[11px] text-success font-medium">Welcome back</div>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-900">₹1,240</span>
      </div>
      <div className="mx-1 mt-3 px-2.5 py-2 rounded-md bg-app-bg border border-border flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Deliver to</span>
          <span className="font-semibold text-slate-900">Aanya · Indiranagar</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Pay with</span>
          <span className="font-semibold text-slate-900">UPI</span>
        </div>
      </div>
      <div className="mt-auto mx-1 h-10 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
        Buy now · ₹1,240
      </div>
    </div>
  );
}

function DoneScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center"
      data-testid="phone-phase-done"
    >
      <span className="w-14 h-14 rounded-full bg-success-bg text-success flex items-center justify-center text-2xl">
        ✓
      </span>
      <div className="text-sm font-semibold text-slate-900">Order placed</div>
      <div className="text-[11px] text-slate-500">Thanks, Aanya. We'll share tracking on WhatsApp.</div>
    </div>
  );
}

const SCREENS = {
  [PHASE_CHECKOUT]: CheckoutScreen,
  [PHASE_LOCKSCREEN]: LockScreen,
  [PHASE_WHATSAPP]: WhatsAppScreen,
  [PHASE_RESTORING]: RestoringScreen,
  [PHASE_PAYMENT]: PaymentScreen,
  [PHASE_DONE]: DoneScreen,
};

export default function AnimatedPhoneMockup({ phase }) {
  const Screen = SCREENS[phase];

  return (
    <div data-phone-phase={phase}>
      <PhoneMockup>
        <Screen />
      </PhoneMockup>
    </div>
  );
}
