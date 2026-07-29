import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function SimpleChannelDetail({ item, groupLabel, Icon, iconColor, identifierLabel, identifierKey, onBack, onUpdate, onDisconnect }) {
  const [name, setName] = useState(item.name || "");

  return (
    <div data-testid="simple-channel-detail">
      <div className="flex items-center gap-2 pb-4 border-b border-border mb-4">
        <button type="button" onClick={onBack} data-testid="simple-detail-back" className="text-text-secondary hover:text-text-primary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 flex items-center justify-center gap-2">
          {Icon && <Icon className="w-4 h-4" style={{ color: iconColor }} />}
          <span className="text-sm font-semibold text-text-primary">{groupLabel}</span>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onUpdate(item.id, { name })}
            data-testid="simple-detail-name"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md text-text-primary"
          />
        </label>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">{identifierLabel}</span>
          <input
            type="text"
            defaultValue={item[identifierKey]}
            disabled
            data-testid="simple-detail-identifier"
            className="mt-1 w-full px-3 py-2 text-sm border border-border rounded-md bg-slate-50 text-text-primary disabled:cursor-not-allowed"
          />
        </label>

        <button
          type="button"
          onClick={() => onDisconnect(item.id)}
          data-testid="simple-detail-disconnect"
          className="px-3 py-2 rounded-md border border-rose-300 text-rose-600 text-sm font-medium hover:bg-rose-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
