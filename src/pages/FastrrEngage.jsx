import React, { useEffect } from "react";
import { Sparkles } from "lucide-react";
import PreviewHeader from "@/components/common/PreviewHeader";
import { Button } from "@/components/ui/button";
import { useFastrrEngagePanelStore } from "@/store/fastrrEngagePanelStore";

export default function FastrrEngagePage() {
  const open = useFastrrEngagePanelStore((s) => s.open);

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-fastrr-engage">
      <PreviewHeader
        title="Fastrr Engage"
        subtitle="Customer engagement journeys, bridging Fastrr Checkout and Fastrr Engage."
        testIdPrefix="fastrr-engage"
      />
      <div className="flex flex-col items-center justify-center text-center py-20 bg-surface border border-border rounded-lg">
        <div className="w-14 h-14 rounded-full bg-primary-tint flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1">
          Bring conversations into every checkout drop-off
        </h2>
        <p className="text-sm text-text-secondary max-w-md mb-6">
          Fastrr Journey connects Fastrr Checkout with WhatsApp marketing automation, recovering
          revenue from abandoned products, carts, and checkouts.
        </p>
        <Button type="button" data-testid="fastrr-engage-view-journey-btn" onClick={open}>
          View Fastrr Journey
        </Button>
      </div>
    </div>
  );
}
