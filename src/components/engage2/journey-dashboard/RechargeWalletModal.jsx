import React from "react";
import { Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import WalletRechargeCard, { formatINR } from "./WalletRechargeCard";
import { useJourneyWalletStore } from "@/store/journeyWalletStore2";

export default function RechargeWalletModal({ open, onClose }) {
  const balance = useJourneyWalletStore((s) => s.balance);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg" data-testid="recharge-wallet-modal">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary-tint flex items-center justify-center mb-1">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg">Recharge Your Wallet</DialogTitle>
          <DialogDescription
            className="text-center"
            data-testid="recharge-wallet-current-balance"
          >
            {`Current balance: ${formatINR(balance)}`}
          </DialogDescription>
        </DialogHeader>

        <WalletRechargeCard
          eyebrow="Top Up Your Wallet"
          subtitle="Keep your journeys running without interruption — recharge anytime."
          onDone={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
