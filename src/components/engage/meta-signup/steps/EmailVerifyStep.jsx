import React from "react";
import { Button } from "@/components/ui/button";

const OTP_DIGITS = "654321".split("");

function maskEmail(email) {
  if (!email || !email.includes("@")) return "s************1@s********.com";
  const [local, domain] = email.split("@");
  const maskedLocal = local.charAt(0) + "*".repeat(Math.max(local.length - 1, 3));
  const domainName = domain.split(".")[0];
  const maskedDomain = domainName.charAt(0) + "*".repeat(Math.max(domainName.length - 1, 3));
  const ext = domain.includes(".") ? domain.slice(domain.indexOf(".")) : "";
  return `${maskedLocal}@${maskedDomain}${ext}`;
}

export default function EmailVerifyStep({ email, onNext }) {
  return (
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4" data-testid="email-verify-step">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <p className="text-[11px] text-text-muted mb-1">Facebook</p>
        <h2 className="text-lg font-bold text-text-primary mb-2">Enter confirmation code</h2>
        <p className="text-sm text-text-secondary mb-4">
          {`We've sent a confirmation code to ${maskEmail(email)}.`}
        </p>
        <div className="flex gap-2 mb-3">
          {OTP_DIGITS.map((d, i) => (
            <div
              key={i}
              className="w-9 h-11 border border-border rounded-md flex items-center justify-center text-sm font-medium"
              data-testid={`email-verify-otp-${i}`}
            >
              {d}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mb-6">We can send a new code in 00:29</p>
        <Button type="button" className="w-full" onClick={onNext} data-testid="email-verify-next">
          Next
        </Button>
      </div>
    </div>
  );
}
