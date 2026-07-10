import React, { useEffect, useState } from "react";
import { Bell, Mail, MessageSquare, MessageCircle } from "lucide-react";
import { estimateAudience } from "@/data/segmentsData";

const CHANNELS = [
  { key: "push", label: "Push", icon: Bell },
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: MessageSquare },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

// Live, always-visible count + channel reachability panel. Recomputes
// (debounced) from `audience` using deterministic mock math — see
// estimateAudience in src/data/segmentsData.js. Also supports a
// `staleUpdatedAt` prop (saved-detail mode) and an external `recomputing`
// flag (Refresh action) to briefly show a loading state.
export default function SegmentReachabilityPanel({ audience, staleUpdatedAt, recomputing, forwardedRef, sticky = true }) {
  const [estimate, setEstimate] = useState(() => estimateAudience(audience));

  useEffect(() => {
    const timer = setTimeout(() => {
      setEstimate(estimateAudience(audience));
    }, 300);
    return () => clearTimeout(timer);
  }, [audience]);

  const isStale = staleUpdatedAt
    ? Date.parse("2026-07-10T09:00:00.000Z") - Date.parse(staleUpdatedAt) > 3 * 24 * 60 * 60 * 1000
    : false;

  return (
    <div
      ref={forwardedRef}
      className={`bg-surface border border-border rounded-lg p-4 space-y-4 ${sticky ? "sticky top-4" : ""}`}
      data-testid="segment-reachability-panel"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
          Estimated reach
        </span>
        {isStale && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
            Stale
          </span>
        )}
      </div>

      <div data-testid="segment-user-count">
        {recomputing ? (
          <div className="h-8 w-32 rounded bg-slate-100 animate-pulse" />
        ) : (
          <div className="text-2xl font-semibold text-text-primary tabular-nums">
            ~{estimate.userCount.toLocaleString("en-IN")} users
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {CHANNELS.map(({ key, label, icon: Icon }) => {
          const count = estimate.reachability[key] || 0;
          const pct = estimate.userCount ? Math.round((count / estimate.userCount) * 100) : 0;
          return (
            <div key={key} data-testid={`segment-reach-${key}`}>
              <div className="flex items-center justify-between text-[12px] mb-1">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <Icon className="w-3.5 h-3.5 text-text-muted" />
                  {label}
                </span>
                <span className="text-text-primary font-medium tabular-nums">
                  {recomputing ? "…" : `${count.toLocaleString("en-IN")} (${pct}%)`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: recomputing ? "0%" : `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
