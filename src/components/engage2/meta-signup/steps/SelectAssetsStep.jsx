import React from "react";
import { Button } from "@/components/ui/button";

export default function SelectAssetsStep({ onBack, onNext }) {
  return (
    <div className="p-6 flex flex-col h-full" data-testid="select-assets-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Select the business assets to share with TSP Karix</h2>
      <p className="text-sm text-text-secondary mb-5">You can use existing assets or create new ones.</p>

      <label className="text-[13px] font-semibold text-text-primary mb-1 block">Business portfolio</label>
      <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary mb-4">
        Shiprocket
      </div>

      <label className="text-[13px] font-semibold text-text-primary mb-1 block">WhatsApp Business account</label>
      <div className="border border-primary rounded-md px-3 py-2 text-sm text-text-primary mb-6">
        Create a WhatsApp Business account
      </div>

      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="select-assets-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="select-assets-next">Next</Button>
      </div>
    </div>
  );
}
