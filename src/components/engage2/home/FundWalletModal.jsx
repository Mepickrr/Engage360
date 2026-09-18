import React from "react";
import { useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import WalletRechargeCard from "@/components/engage2/journey-dashboard/WalletRechargeCard";
import { useJourneySelectionStore2 } from "@/store/journeySelectionStore2";
import { computeCartFunding } from "./cartFunding";
import { WALLET_TOPUP } from "@/components/engage2/journey-dashboard/data";

// The post-listing "fund your wallet" step, as a modal opened straight from
// the listing page's cart rail — not a separate route, so browsing and
// funding never leave the same page.
export default function FundWalletModal({ open, onClose }) {
  const navigate = useNavigate();
  const selectedJourneys = useJourneySelectionStore2((s) => s.selectedJourneys());
  const { total, runwayDays } = computeCartFunding(selectedJourneys);
  const cartAmount = total || WALLET_TOPUP.defaultAmount;

  function handleContinue() {
    onClose();
    navigate("/engage-2/account-setup");
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid="fund-wallet-modal">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center mb-1">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg">Fund Your Wallet</DialogTitle>
          <DialogDescription className="text-center">
            One step before setup — add balance so your selected journeys can start sending the
            moment they go live.
          </DialogDescription>
        </DialogHeader>

        <WalletRechargeCard
          eyebrow="Recharge for Your Selected Journeys"
          subtitle={`This covers the journeys you just picked for their first ${runwayDays} days.`}
          initialAmount={cartAmount}
          hideSubtitleOnChange
          onDone={handleContinue}
        />

        <button
          type="button"
          className="text-xs font-medium text-text-secondary hover:text-text-primary text-center mx-auto block mt-4"
          onClick={handleContinue}
          data-testid="fund-wallet-skip"
        >
          Skip and Continue Meta (WhatsApp) Setup
        </button>
      </DialogContent>
    </Dialog>
  );
}
