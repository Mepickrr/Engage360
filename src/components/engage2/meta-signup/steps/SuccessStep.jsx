import React from "react";
import { PartyPopper, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuccessStep({ brandName, onFinish }) {
  const assetName = `${brandName || "Your Business"} WhatsApp Account`;
  return (
    <div className="p-6 flex flex-col items-center text-center" data-testid="success-step">
      <div className="w-16 h-16 rounded-full bg-primary-tint flex items-center justify-center mb-4">
        <PartyPopper className="w-8 h-8 text-primary" />
      </div>
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Your account is connected to Shiprocket Communication
      </h2>
      <p className="text-sm text-text-secondary mb-6">
        We'll review your business to ensure it complies with the WhatsApp Business Messaging Policy and get in touch within 24 hours if there's an issue.
      </p>
      <h3 className="text-sm font-semibold text-text-primary mb-2 self-start">Assets successfully created</h3>
      <div className="flex items-center gap-2 self-start mb-8">
        <MessageCircle className="w-4 h-4 text-success" />
        <span className="text-sm text-primary underline">{assetName}</span>
      </div>
      <Button type="button" className="w-full" onClick={onFinish} data-testid="success-finish">
        Finish
      </Button>
    </div>
  );
}
