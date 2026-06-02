import React from "react";
import {
  Sparkles,
  ChevronDown,
  Clock,
  Wallet,
  LayoutGrid,
  Headphones,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FALLBACK_ME = {
  user: { name: "Himanshu", initials: "HK" },
  tenant: { id: "tspkarix", name: "TSPKARIX" },
  wallet: { balance: -1094785.66, currency: "INR" },
  role: "SSO User",
};

function formatINR(amount) {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  // Indian grouping: 1,094,785.66 per the spec (Latn grouping).
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}₹${formatted}`;
}

export const TopBar = () => {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const me = data ?? FALLBACK_ME;
  const isNegative = me.wallet.balance < 0;

  return (
    <header
      data-testid="topbar"
      className="fixed top-0 left-0 right-0 z-40 h-12 bg-topbar-bg text-white flex items-center justify-between px-4 border-b border-white/5"
    >
      {/* Left: brand */}
      <div className="flex items-center gap-2.5" data-testid="topbar-brand">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(108,58,232,0.5)]">
          <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="font-semibold text-[14px] tracking-tight">
          Engage 360
        </span>
      </div>

      {/* Center: tenant pill */}
      <button
        type="button"
        data-testid="topbar-tenant-pill"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/30 hover:border-white/60 text-[12px] font-medium text-white/95 transition-colors"
      >
        <span>{me.tenant.name}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70" />
      </button>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <span
          data-testid="topbar-sso-pill"
          className="inline-flex items-center px-2.5 py-1 rounded-full border border-emerald-400/70 text-emerald-300 text-[11px] font-medium whitespace-nowrap"
        >
          Logged In As {me.role || "SSO User"}
        </span>

        <button
          type="button"
          data-testid="topbar-copilot-btn"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/30 hover:border-white/60 hover:bg-white/5 text-white text-[12px] font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Copilot</span>
        </button>

        <button
          type="button"
          data-testid="topbar-talk-link"
          className="inline-flex items-center gap-1.5 text-white/85 hover:text-white text-[12px] font-medium transition-colors"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Talk to Us</span>
        </button>

        <div
          data-testid="topbar-wallet"
          className="inline-flex items-center gap-2 pl-2.5 pr-2.5 py-1 rounded-full border border-white/10 bg-white/[0.04]"
        >
          <Wallet className="w-3.5 h-3.5 text-white/80" />
          <span
            className={`text-[12px] font-semibold tabular-nums ${
              isNegative ? "text-rose-400" : "text-emerald-300"
            }`}
            data-testid="topbar-wallet-balance"
          >
            {formatINR(me.wallet.balance)}
          </span>
          <span className="h-3 w-px bg-white/15" />
          <button
            type="button"
            data-testid="topbar-recharge-link"
            className="text-[12px] font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Recharge Now
          </button>
        </div>

        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-testid="topbar-appswitch-btn"
                className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Switch app"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">App switcher</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <button
          type="button"
          data-testid="topbar-support-btn"
          className="flex flex-col items-center gap-0.5 text-white/80 hover:text-white transition-colors leading-none"
          aria-label="Support"
        >
          <Headphones className="w-4 h-4" />
          <span className="text-[10px] font-medium">Support</span>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
