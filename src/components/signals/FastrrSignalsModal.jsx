import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, ShoppingCart, ShoppingBag, Package, ShieldCheck, TrendingUp, BadgePercent,
  Wallet, Shapes, Sparkles, ArrowRight, Check,
} from "lucide-react";
import { toast } from "sonner";
import { markSignalsActive } from "./fastrrSignals";

// ─── Open from anywhere ───────────────────────────────────────
// <FastrrSignalsModalHost /> is mounted once in App.js. Any surface opens the
// modal with `openFastrrSignals({ source: "home-v6" })` — no props threading
// while the placements and triggers are still being decided. Pass
// `onActivate` to resume whatever the seller was doing once they activate.
const OPEN_EVENT = "fastrr-signals:open";

export function openFastrrSignals(detail = {}) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail }));
}

export function FastrrSignalsModalHost() {
  const [request, setRequest] = useState(null);
  useEffect(() => {
    const onOpen = (e) => setRequest({ source: "unknown", ...e.detail });
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);
  return (
    <FastrrSignalsModal
      open={request !== null}
      source={request?.source}
      onActivate={request?.onActivate}
      onClose={() => setRequest(null)}
    />
  );
}

// ─── Content ──────────────────────────────────────────────────
const VIOLET = "#6C3AE8";
const PRICE = "₹5,000";

const STATS = [
  { icon: ShoppingCart, value: "₹4,920", label: "Lifetime Spend",     tint: "#F3EEFF", ink: VIOLET },
  { icon: Package,      value: "12",     label: "Lifetime Orders",    tint: "#F3EEFF", ink: VIOLET },
  { icon: ShieldCheck,  value: "Low",    label: "RTO Risk",           tint: "#E9F8EF", ink: "#16A34A" },
  { icon: ShoppingBag,  value: "Fashion", label: "Preferred Category", tint: "#F3EEFF", ink: VIOLET },
];

const TRAITS = [
  { icon: ShieldCheck,  name: "RTO Risk Score",       desc: "Spot likely refusals and returns before you ship." },
  { icon: BadgePercent, name: "Discount Sensitivity", desc: "Know who needs a coupon and who doesn't — protect your margins." },
  { icon: Wallet,       name: "Prepaid Affinity",     desc: "See who pays online vs. who insists on COD — reduce COD risk." },
  { icon: Shapes,       name: "Category Affinity",    desc: "See what they love to shop — cross-brand shopping patterns." },
];

function ShopperAvatar() {
  return (
    <div className="relative shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="rounded-full ring-4 ring-white shadow-md" aria-hidden>
        <defs>
          <linearGradient id="fs-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E9DFFF" />
            <stop offset="1" stopColor="#C9B5FF" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#fs-bg)" />
        <path d="M14 30c0-14 8-21 18-21s18 7 18 21v20H14z" fill="#2A1B14" />
        <path d="M10 64c2-11 10-16 22-16s20 5 22 16z" fill="#F4EEE6" />
        <rect x="27" y="39" width="10" height="10" rx="4" fill="#C98D6B" />
        <ellipse cx="32" cy="30" rx="11" ry="13" fill="#D9A07E" />
        <path d="M21 27c2-9 8-12 11-12s10 3 12 12c-5-4-14-5-23 0z" fill="#2A1B14" />
        <circle cx="28" cy="30" r="1.3" fill="#2A1B14" />
        <circle cx="36" cy="30" r="1.3" fill="#2A1B14" />
        <path d="M28 36c2 2 6 2 8 0" stroke="#8A3B2E" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">
        <Check className="w-3 h-3 text-white" strokeWidth={3} />
      </span>
    </div>
  );
}

// Left half — the shopper profile the store would otherwise never see.
function ProfilePreview() {
  return (
    <div className="relative h-full overflow-hidden bg-gradient-to-b from-[#F7F3FF] via-[#FBF9FF] to-white p-7 flex flex-col gap-4">
      <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#6C3AE8]/10 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-bold tracking-[0.14em] text-[#6C3AE8]">FASTRR SIGNALS</p>
        <h3 className="mt-2 text-[22px] leading-[1.2] font-extrabold tracking-tight text-[#0F0A1F]">
          Your store sees a customer.
          <br />
          <span className="bg-gradient-to-r from-[#6C3AE8] to-[#9B6BFF] bg-clip-text text-transparent">Fastrr Signals reveals the shopper.</span>
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
          A unified, enriched profile with 300+ real commerce signals from across the Shiprocket network.
        </p>
      </div>

      <div className="relative rounded-2xl bg-white border border-[#EEE8FB] shadow-[0_4px_20px_rgba(108,58,232,0.08)] p-4 flex items-center gap-4">
        <ShopperAvatar />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[16px] font-bold text-[#0F0A1F]">Shopper #A8291</p>
            <span className="text-[10px] font-semibold text-slate-400">· enriched just now</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#EFE7FF] text-[#5B2FD0]">High-Value Shopper</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#E3F6EA] text-[#15803D]">Prepaid Affinity</span>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-2.5">
        {STATS.map(({ icon: Icon, value, label, tint, ink }) => (
          <div key={label} className="rounded-xl bg-white border border-[#EEE8FB] p-3 flex items-center gap-3 transition-transform hover:-translate-y-0.5">
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tint, color: ink }}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-[16px] font-bold text-[#0F0A1F] leading-tight">{value}</p>
              <p className="text-[11px] text-slate-500 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative rounded-2xl bg-gradient-to-r from-[#6C3AE8] to-[#8B5CF6] text-white px-5 py-4 grid grid-cols-2 shadow-[0_8px_24px_rgba(108,58,232,0.3)]">
        <div className="pr-4">
          <p className="text-[24px] font-extrabold leading-none">300+</p>
          <p className="text-[12px] text-white/80 mt-1">Behaviour signals</p>
        </div>
        <div className="pl-5 border-l border-white/25">
          <p className="text-[24px] font-extrabold leading-none">90M+</p>
          <p className="text-[12px] text-white/80 mt-1">Network subscribers</p>
        </div>
      </div>

      <div className="relative grid grid-cols-2 px-1">
        {[["10%+", "Lower CAC"], ["20%+", "Higher ROAS"]].map(([v, l], i) => (
          <div key={l} className={`flex items-center gap-2.5 ${i ? "pl-5 border-l border-slate-200" : ""}`}>
            <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[20px] font-extrabold text-[#0F0A1F] leading-none">{v}</p>
              <p className="text-[12px] text-slate-500 mt-1">{l}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────
export default function FastrrSignalsModal({ open, onClose, source, onActivate }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activate = () => {
    markSignalsActive();
    toast.success("Fastrr Signals activated", { description: `Billed at ${PRICE}/month · source: ${source ?? "direct"}` });
    onClose();
    onActivate?.();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-[#0F0A1F]/50 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Activate Fastrr Signals"
        data-testid="fastrr-signals-modal"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[920px] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-[0_24px_80px_rgba(15,10,31,0.35)] grid md:grid-cols-[1fr_1.05fr]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <ProfilePreview />

        <div className="p-8 flex flex-col">
          <span className="self-start inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] text-[#6C3AE8] bg-[#F3EEFF] px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> FASTRR SIGNALS
          </span>
          <h2 className="mt-4 text-[26px] leading-[1.2] font-extrabold tracking-tight text-[#0F0A1F]">
            Your store sees one visitor. The Fastrr network sees the whole shopper.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600">
            A first-time buyer is a blank slate to you — but they've likely shopped with other brands on Shiprocket.
            Fastrr Signals turns that history into ready-to-use traits:
          </p>

          <ul className="mt-5 space-y-3">
            {TRAITS.map(({ icon: Icon, name, desc }) => (
              <li key={name} className="flex gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#F3EEFF] text-[#6C3AE8] flex items-center justify-center shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#0F0A1F]">{name}</p>
                  <p className="text-[13px] text-slate-500 leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-7">
            <button
              type="button"
              onClick={activate}
              data-testid="fastrr-signals-activate"
              className="group w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6C3AE8] to-[#8B5CF6] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(108,58,232,0.35)] hover:brightness-110 transition"
            >
              Activate Signals at {PRICE}/month
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <p className="mt-2.5 text-center text-[11px] text-slate-400">Cancel anytime · Signals start enriching new visitors instantly</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
