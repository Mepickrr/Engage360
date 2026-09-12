import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, User } from "lucide-react";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";
import RechargeWalletModal from "./RechargeWalletModal";
import ProfileDetailsModal from "./ProfileDetailsModal";

function formatINR(amount) {
  return `₹${amount.toFixed(2)}`;
}

export default function JourneyHeader() {
  const balance = useJourneyWalletStore((s) => s.balance);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div
      className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface"
      data-testid="journey-header"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-text-primary">Fastrr Journey</span>
        <span className="h-4 w-px bg-border" />
        <span
          className="inline-flex items-center gap-1.5 text-xs text-text-secondary"
          data-testid="journey-whatsapp-status"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          WhatsApp: TSP Karix Connected
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full border border-border bg-app-bg hover:border-primary transition-colors"
          data-testid="journey-wallet-pill"
          onClick={() => setRechargeOpen(true)}
        >
          <Wallet className="w-3.5 h-3.5 text-text-secondary" />
          <span
            className="text-[12px] font-semibold tabular-nums text-text-primary"
            data-testid="journey-wallet-balance"
          >
            {formatINR(balance)}
          </span>
          <span className="h-3 w-px bg-border" />
          <span
            className="text-[12px] font-semibold text-primary"
            data-testid="journey-recharge-link"
          >
            Recharge
          </span>
        </button>

        <button
          type="button"
          className="w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center hover:brightness-95 transition"
          data-testid="journey-profile-icon"
          onClick={() => setProfileOpen(true)}
        >
          <User className="w-4 h-4 text-primary" />
        </button>

        <Link
          to="/"
          data-testid="journey-open-engage-link"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          Open Engage
        </Link>
      </div>

      <RechargeWalletModal open={rechargeOpen} onClose={() => setRechargeOpen(false)} />
      <ProfileDetailsModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
