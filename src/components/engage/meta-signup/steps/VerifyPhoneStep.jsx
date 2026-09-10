import React, { useState } from "react";
import { Button } from "@/components/ui/button";

const OTP_DIGITS = "123456".split("");

export default function VerifyPhoneStep({ phoneNumber, onBack, onNext }) {
  const [showResent, setShowResent] = useState(false);

  return (
    <div className="p-6 flex flex-col h-full relative" data-testid="verify-phone-step">
      <h2 className="text-base font-bold text-text-primary mb-1">Verify your phone number</h2>
      <p className="text-sm text-text-secondary mb-4">
        {`We sent a code via text message to ${phoneNumber}`}
      </p>
      <label className="text-[13px] font-semibold text-text-primary mb-2 block">Verification code</label>
      <div className="flex gap-2 mb-4">
        {OTP_DIGITS.map((d, i) => (
          <div
            key={i}
            className="w-9 h-11 border border-border rounded-md flex items-center justify-center text-sm font-medium"
            data-testid={`verify-phone-otp-${i}`}
          >
            {d}
          </div>
        ))}
      </div>
      <button
        type="button"
        className="text-sm text-primary underline text-left mb-4 w-fit"
        onClick={() => setShowResent(true)}
        data-testid="verify-phone-resend"
      >
        Resend Code
      </button>
      <p className="text-[13px] font-semibold text-text-primary mb-2">Choose how you would like to verify your number</p>
      <div className="flex items-center gap-4 text-sm text-text-secondary mb-6">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked readOnly /> Text message
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" readOnly /> Phone call
        </label>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onBack} data-testid="verify-phone-back">Back</Button>
        <Button type="button" onClick={onNext} data-testid="verify-phone-next">Next</Button>
      </div>
      {showResent && (
        <div
          className="absolute bottom-4 right-4 bg-success-bg border border-success/30 text-success text-sm px-3 py-2 rounded-md shadow"
          data-testid="verify-phone-resent-toast"
        >
          Code sent successfully.
        </div>
      )}
    </div>
  );
}
