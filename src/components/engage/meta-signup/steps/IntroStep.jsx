import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, TrendingUp, ChevronDown } from "lucide-react";

const CAPABILITIES = [
  { icon: MessageCircle, label: "Communicate with customers at scale" },
  { icon: TrendingUp, label: "Send messages with optimisations" },
];

export default function IntroStep({ onCancel, onContinue }) {
  return (
    <div className="p-6" data-testid="intro-step">
      <div className="h-32 rounded-lg mb-5 bg-gradient-to-br from-primary-tint to-success-bg" />
      <h2 className="text-lg font-bold text-text-primary mb-2">
        Seamlessly connect your account to Shiprocket Communication and Karix Mobile Pvt Ltd
      </h2>
      <p className="text-sm text-text-secondary mb-4">
        This onboarding process will walk you through registering and connecting your business account to your partner.
      </p>
      <h3 className="text-sm font-semibold text-text-primary mb-2">You'll be able to:</h3>
      <div className="flex flex-col gap-2 mb-6">
        {CAPABILITIES.map((c) => (
          <div key={c.label} className="flex items-center justify-between border-t border-border pt-2 text-sm text-text-secondary">
            <div className="flex items-center gap-2">
              <c.icon className="w-4 h-4 text-text-muted" />
              {c.label}
            </div>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-text-muted mb-4">
        By continuing, you agree to the{" "}
        <a href="#" className="text-primary underline">Marketing Messages API for WhatsApp Terms</a>; you agree to share event
        activity data with Meta to help optimise marketing messages. You also agree to the{" "}
        <a href="#" className="text-primary underline">WhatsApp Business Platform Cloud API Terms</a>.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" data-testid="intro-cancel" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" data-testid="intro-continue" onClick={onContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
