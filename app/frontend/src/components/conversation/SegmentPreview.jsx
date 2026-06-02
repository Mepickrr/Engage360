import React from "react";
import { Users } from "lucide-react";

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value || 0);
}

export default function SegmentPreview({ payload, onSave, onModify }) {
  if (!payload) return null;
  return (
    <div className="flex flex-col h-full" data-testid="segment-preview">
      <div className="px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-start gap-2">
          <Users className="w-5 h-5 text-violet-500 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-text-primary">
              {payload.name}
            </h3>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {payload.data_freshness}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
            Conditions
          </div>
          <div className="space-y-2">
            {(payload.conditions || []).map((c, i) => (
              <div
                key={`${c.field || "cond"}-${i}`}
                data-testid={`segment-condition-${i}`}
                className="flex items-center gap-2 text-[13px] px-3 py-2 rounded-md border border-border bg-white"
              >
                <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-mono">
                  {c.field}
                </span>
                <span className="text-text-muted text-[11px]">{c.operator}</span>
                <span className="font-medium text-text-primary">
                  {String(c.value)}
                </span>
                {c.period_days != null && (
                  <span className="ml-auto text-[10px] text-text-muted">
                    in last {c.period_days}d
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-center">
          <div className="text-[10px] uppercase tracking-wide text-violet-700 font-semibold">
            Estimated audience
          </div>
          <div className="text-3xl font-bold text-violet-900 mt-1">
            {formatNumber(payload.estimated_users)}
          </div>
          <div className="text-[11px] text-violet-700 mt-0.5">users match</div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-end gap-2">
        <button
          type="button"
          data-testid="segment-modify"
          onClick={onModify}
          className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
        >
          Modify
        </button>
        <button
          type="button"
          data-testid="segment-save"
          onClick={onSave}
          className="px-3 py-1.5 text-[12px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
        >
          Save segment
        </button>
      </div>
    </div>
  );
}
