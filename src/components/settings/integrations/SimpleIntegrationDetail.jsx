import React from "react";
import { ArrowLeft } from "lucide-react";

export default function SimpleIntegrationDetail({ item, label, Icon, iconColor, onBack, onDisconnect, fieldLabel = "API Key", fieldValue }) {
  return (
    <div data-testid="simple-integration-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="simple-integration-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <p className="text-[12px] text-text-secondary">{item.desc}</p>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{fieldLabel}</span>
          <input
            type="text"
            defaultValue={fieldValue ?? item.apiKey}
            disabled
            data-testid="simple-integration-detail-apikey"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          onClick={() => onDisconnect(item.id)}
          data-testid="simple-integration-detail-disconnect"
          className="px-3 py-2 rounded-md border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
