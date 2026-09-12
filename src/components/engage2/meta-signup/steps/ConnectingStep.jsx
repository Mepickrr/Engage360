import React, { useEffect } from "react";
import { Loader2, UserRound } from "lucide-react";

export default function ConnectingStep({ onAutoAdvance }) {
  useEffect(() => {
    const timer = setTimeout(onAutoAdvance, 1500);
    return () => clearTimeout(timer);
  }, [onAutoAdvance]);

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full text-center" data-testid="connecting-step">
      <div className="w-20 h-20 rounded-full bg-primary-tint flex items-center justify-center mb-4">
        <UserRound className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-base font-bold text-text-primary mb-1">Connecting your account</h2>
      <p className="text-sm text-text-secondary flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        This may take a few moments...
      </p>
    </div>
  );
}
