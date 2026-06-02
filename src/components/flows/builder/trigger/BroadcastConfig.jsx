import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Broadcast events skip Step 1/Step 2 and use Schedule + Audience.
export default function BroadcastConfig({ config, setConfig }) {
  const set = (patch) => setConfig({ ...config, ...patch });
  return (
    <div className="space-y-5">
      <section>
        <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">
          Schedule
        </h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                checked={config.schedule_kind === "now"}
                onChange={() => set({ schedule_kind: "now" })}
                className="accent-primary"
                data-testid="broadcast-now"
              />
              Send immediately
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                checked={config.schedule_kind === "scheduled"}
                onChange={() => set({ schedule_kind: "scheduled" })}
                className="accent-primary"
                data-testid="broadcast-scheduled"
              />
              Schedule for later
            </label>
          </div>
          {config.schedule_kind === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-secondary">
                  Date
                </label>
                <input
                  type="date"
                  value={config.send_at_date || ""}
                  onChange={(e) => set({ send_at_date: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">
                  Time
                </label>
                <input
                  type="time"
                  value={config.send_at_time || ""}
                  onChange={(e) => set({ send_at_time: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border pt-4">
        <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-3">
          Audience
        </h4>
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-text-secondary">
              Send to
            </label>
            <Select
              value={config.audience_kind || "all"}
              onValueChange={(v) => set({ audience_kind: v })}
            >
              <SelectTrigger className="mt-1 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="segment">A saved segment</SelectItem>
                <SelectItem value="known">Known users only</SelectItem>
                <SelectItem value="identified">
                  Engage-identified users only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.audience_kind === "segment" && (
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Segment
              </label>
              <Select
                value={config.segment || ""}
                onValueChange={(v) => set({ segment: v })}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue placeholder="Pick a segment" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Top 10% buyers (90d)",
                    "Lapsed VIPs (60d+)",
                    "Cart abandoners (24h)",
                    "First-time buyers (30d)",
                    "Newsletter subscribers",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
