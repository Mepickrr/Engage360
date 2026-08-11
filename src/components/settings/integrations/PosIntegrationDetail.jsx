import React, { useState } from "react";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { SAMPLE_WEBHOOK_CURL } from "./data/mockIntegrations";

function ToggleSwitch({ on, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-label={label}
      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${on ? "bg-primary" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function PosIntegrationDetail({ pos, onBack, onUpdate }) {
  const [copied, setCopied] = useState(false);

  const handleToggle = (next) => {
    onUpdate({ enabled: next, connected: next });
  };

  const handleCopy = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(SAMPLE_WEBHOOK_CURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div data-testid="pos-integration-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="pos-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-sm font-semibold text-text-primary">POS Integration</span>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <div className="bg-surface border border-border rounded-lg p-4 flex items-start justify-between gap-4">
          <div>
            <span className="text-[13px] font-semibold text-text-primary">Enable POS Integration</span>
            <p className="text-[12px] text-text-secondary mt-1">{pos.desc}</p>
          </div>
          <ToggleSwitch on={pos.enabled} onChange={handleToggle} label="Enable POS Integration" />
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-text-primary">Sample Webhook cURL</span>
            <button
              type="button"
              onClick={handleCopy}
              data-testid="pos-copy-curl"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-medium rounded-md border border-border text-text-secondary hover:bg-slate-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="text-[11px] font-mono bg-slate-50 border border-border rounded-md p-3 overflow-x-auto whitespace-pre-wrap text-text-secondary">
            {SAMPLE_WEBHOOK_CURL}
          </pre>
        </div>
      </div>
    </div>
  );
}
