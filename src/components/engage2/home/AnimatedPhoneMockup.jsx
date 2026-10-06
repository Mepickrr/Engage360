import React, { useEffect, useState } from "react";
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

function StoreHeader() {
  return (
    <div className="flex items-center justify-between px-3 py-3 bg-slate-900 text-white flex-shrink-0">
      <ChevronLeft className="w-4 h-4 flex-shrink-0" />
      <span className="font-serif italic text-[15px] tracking-wide">Mystore1</span>
      <ShoppingBag className="w-4 h-4 flex-shrink-0" />
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
      <span className="mt-3 inline-flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full text-[10px] font-medium">
        <Clock className="w-2.5 h-2.5" />
        30 minutes later
      </span>
      <div className="absolute left-3 right-3 top-48 bg-white text-slate-900 rounded-2xl px-3 py-2.5 flex gap-2.5 shadow-xl">
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
        <div className="h-10 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-semibold">
          Pay ₹1,178
        </div>
        <span className="text-[8.5px] text-slate-400 text-center">Secured checkout by Fastrr</span>
      </div>
    </div>
  );
}

function DoneScreen() {
  return (
    <div className="flex flex-col h-full bg-white" data-testid="phone-phase-done">
      <StoreHeader />

      <div className="flex-1 overflow-hidden px-3 py-3 flex flex-col items-center gap-2 text-center">
        <span className="w-11 h-11 rounded-full bg-success-bg text-success flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5" />
        </span>
        <div className="text-[13px] font-bold text-slate-900">Order placed!</div>
        <div className="text-[9.5px] text-slate-500 leading-snug">
          Thanks, Aanya. Order <span className="font-semibold text-slate-900">#MB-2048</span> is confirmed.
        </div>
        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-success bg-success-bg px-2 py-1 rounded-full">
          <Check className="w-2.5 h-2.5" />
          ₹1,178 paid via GPay UPI
        </span>

        <div className="w-full rounded-md border border-border px-2.5 py-2 flex items-center justify-between mt-1">
          <span className="text-[9px] text-slate-500">Arriving by</span>
          <span className="text-[10.5px] font-semibold text-slate-900">Thu, 9 Oct</span>
        </div>

        <div className="w-full rounded-md border border-border px-2.5 py-2 flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-3.5 h-3.5 text-white" />
          </span>
          <span className="text-[9.5px] text-slate-600 text-left leading-snug">
            We'll message you on WhatsApp when your order ships.
          </span>
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
