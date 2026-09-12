import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function BusinessInfoStep({ brandName, category, website, onBack, onNext }) {
  return (
    <div className="p-6 flex flex-col h-full overflow-y-auto" data-testid="business-info-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Enter business information for new assets</h2>
      <p className="text-sm text-text-secondary mb-5">Any changes will only affect new assets.</p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Name</label>
          <Input value={brandName || "Your Business"} readOnly data-testid="business-info-name" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Category</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary" data-testid="business-info-category">
            {category || "Others"}
          </div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Country</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-muted bg-app-bg">India</div>
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Website</label>
          <Input value={website} readOnly data-testid="business-info-website" />
        </div>
        <div>
          <label className="text-[13px] font-semibold text-text-primary mb-1 block">Time zone</label>
          <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary">
            (GMT+05:30) Asia/Kolkata
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="business-info-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="business-info-next">Next</Button>
      </div>
    </div>
  );
}
