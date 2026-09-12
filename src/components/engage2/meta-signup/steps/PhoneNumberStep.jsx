import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PhoneNumberStep({ phoneNumber, onBack, onNext }) {
  const digits = phoneNumber.replace(/^\+91\s*/, "");
  return (
    <div className="p-6 flex flex-col h-full" data-testid="phone-number-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Add your WhatsApp phone number</h2>
      <p className="text-sm text-text-secondary mb-4">Choose how you want to be identified when sending messages.</p>
      <label className="text-[13px] font-semibold text-text-primary mb-1 block">Phone number</label>
      <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary mb-2">
        Enter a new phone number
      </div>
      <div className="flex gap-2 mb-6">
        <div className="border border-border rounded-md px-3 py-2 text-sm text-text-secondary">IN +91</div>
        <Input value={digits} readOnly data-testid="phone-number-input" className="flex-1" />
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="phone-number-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="phone-number-next">Next</Button>
      </div>
    </div>
  );
}
