import React from "react";
import { Clock } from "lucide-react";
import PreviewHeader, { previewToast } from "@/components/common/PreviewHeader";

export default function ComingSoonPanel({ tabName, testId }) {
  return (
    <div data-testid={testId}>
      <PreviewHeader
        title={`${tabName} — coming soon`}
        subtitle={`We're still building out the ${tabName} tab. Check back shortly.`}
        testIdPrefix={testId}
      />
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted bg-surface border border-border rounded-lg">
        <Clock className="w-8 h-8" />
        <p className="text-sm">This section isn't ready yet.</p>
        <button
          type="button"
          data-testid="coming-soon-notify-btn"
          onClick={() => previewToast()}
          className="text-[12px] text-primary hover:underline"
        >
          Notify me when it's ready
        </button>
      </div>
    </div>
  );
}
