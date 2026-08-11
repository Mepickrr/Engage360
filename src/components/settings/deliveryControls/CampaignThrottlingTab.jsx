import React, { useState } from "react";
import { Smartphone, MessageSquare, Mail, MessageCircle, Plug } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import SaveBar from "./SaveBar";
import { DEFAULT_THROTTLING_ROWS } from "./constants";

const ICON_BY_ID = {
  push: Smartphone,
  smsRcs: MessageSquare,
  email: Mail,
  whatsapp: MessageCircle,
  connectors: Plug,
};

function ToggleSwitch({ checked, onChange, testId }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      data-testid={testId}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-primary" : "bg-slate-300"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

function formatCount(n) {
  return n.toLocaleString("en-US");
}

export default function CampaignThrottlingTab() {
  const [rows, setRows] = useState(DEFAULT_THROTTLING_ROWS);
  const [baseline, setBaseline] = useState(DEFAULT_THROTTLING_ROWS);
  const dirty = rows !== baseline;

  function patchRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function handleDiscard() {
    setRows(baseline);
  }

  function handleSave() {
    previewToast();
    setBaseline(rows);
  }

  return (
    <div data-testid="delivery-campaign-throttling">
      <SaveBar
        title="Campaign Throttling Limits"
        subtitle="Best used to distribute the load on your servers across a time period. Set the default limits that will be used by campaigns to control the speed of sending the messages. These limits can be changed later while creating the campaign."
        dirty={dirty}
        onDiscard={handleDiscard}
        onSave={handleSave}
        testIdPrefix="campaign-throttling"
      />

      <div className="bg-surface border border-border rounded-lg divide-y divide-border">
        {rows.map((row) => {
          const Icon = ICON_BY_ID[row.id];
          return (
            <div key={row.id} className="p-4" data-testid={`throttling-row-${row.id}`}>
              <div className="flex items-center gap-2 mb-3">
                <ToggleSwitch
                  checked={row.enabled}
                  onChange={(v) => patchRow(row.id, { enabled: v })}
                  testId={`throttling-row-${row.id}-enabled`}
                />
                {Icon && <Icon className="w-4 h-4 text-text-muted" />}
                <span className="text-sm font-medium text-text-primary">{row.label}</span>
              </div>

              <div className="flex items-center gap-2 mb-3 ml-11">
                <span className="text-[13px] text-text-secondary">Limit to</span>
                <input
                  type="number"
                  min={0}
                  disabled={!row.enabled}
                  value={row.limit}
                  onChange={(e) =>
                    patchRow(row.id, { limit: e.target.value === "" ? "" : Math.max(0, Number(e.target.value)) })
                  }
                  data-testid={`throttling-row-${row.id}-limit`}
                  className="w-28 px-2 py-1.5 border border-border rounded-md text-sm bg-slate-50 disabled:cursor-not-allowed disabled:text-text-muted"
                />
                <span className="text-[13px] text-text-secondary">{row.unit}</span>
              </div>

              <div className="ml-11 text-[12px] text-text-muted space-y-0.5">
                <p>Maximum allowed: {formatCount(row.max)}</p>
                <p>Minimum required: {formatCount(row.min)}</p>
                <p>Default speed: {formatCount(row.defaultSpeed)} {row.label}/minute</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
