import React from "react";
import { CalendarDays, Zap } from "lucide-react";
import { TIMEZONES } from "../broadcastAudienceData";
import AudienceFilterBuilder from "./audience/AudienceFilterBuilder";
import { emptyConditionBlock } from "./triggerHelpers";

const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "segment", label: "Custom segment" },
];

export default function BroadcastSourceStep2({ schedule, setSchedule, audience, setAudience }) {
  return (
    <div className="space-y-6">
      {/* ── Schedule ───────────────────────────────────────────────── */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-3">When to send</div>
        <div className="space-y-2">
          {/* Immediate */}
          <label
            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              schedule.type === "immediate"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="bcast_schedule_type"
              checked={schedule.type === "immediate"}
              onChange={() => setSchedule({ ...schedule, type: "immediate" })}
              className="accent-primary shrink-0"
            />
            <Zap
              className={`w-4 h-4 shrink-0 ${
                schedule.type === "immediate" ? "text-primary" : "text-text-muted"
              }`}
            />
            <div>
              <div className="text-sm font-medium text-text-primary">
                Send immediately when made live
              </div>
              <div className="text-xs text-text-muted">
                The broadcast starts as soon as you publish the flow.
              </div>
            </div>
          </label>

          {/* Scheduled */}
          <label
            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
              schedule.type === "scheduled"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="bcast_schedule_type"
              checked={schedule.type === "scheduled"}
              onChange={() => setSchedule({ ...schedule, type: "scheduled" })}
              className="accent-primary shrink-0 mt-0.5"
            />
            <CalendarDays
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                schedule.type === "scheduled" ? "text-primary" : "text-text-muted"
              }`}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">Schedule for later</div>
              <div className="text-xs text-text-muted">Pick a date and time to send this broadcast.</div>

              {schedule.type === "scheduled" && (
                <div
                  className="flex flex-wrap gap-2 mt-3"
                  onClick={(e) => e.preventDefault()}
                >
                  <input
                    type="date"
                    value={schedule.date || ""}
                    onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
                    className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                  />
                  <input
                    type="time"
                    value={schedule.time || ""}
                    onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                    className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                  />
                  <select
                    value={schedule.timezone || "Asia/Kolkata"}
                    onChange={(e) => setSchedule({ ...schedule, timezone: e.target.value })}
                    className="h-9 text-sm rounded-md border border-border bg-surface px-2 focus:outline-none focus:border-primary/60"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* ── Audience qualification ─────────────────────────────────── */}
      <div>
        <div className="text-sm font-semibold text-text-primary mb-3">Audience qualification</div>

        {/* Include filter */}
        <div className="space-y-3">
          <div className="border border-border rounded-xl p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-3">
              Include users who match
            </div>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!!audience.include_all}
                  onChange={() => setAudience({ ...audience, include_all: true })}
                  className="accent-primary"
                />
                <span className="text-sm">All users in the source</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!audience.include_all}
                  onChange={() => setAudience({ ...audience, include_all: false })}
                  className="accent-primary"
                />
                <span className="text-sm">Filter by conditions</span>
              </label>
            </div>

            {!audience.include_all && (
              <AudienceFilterBuilder
                blockSet={
                  audience.include || {
                    blocks: [emptyConditionBlock("property")],
                    blocksCombinator: "AND",
                  }
                }
                onChange={(b) => setAudience({ ...audience, include: b })}
                testIdPrefix="bcast-source-include"
                blockTypes={TRIGGER_BLOCK_TYPES}
              />
            )}
          </div>

          {/* Exclude filter */}
          <div className="border border-border rounded-xl p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!audience.exclude_enabled}
                onChange={(e) =>
                  setAudience({ ...audience, exclude_enabled: e.target.checked })
                }
                className="accent-primary"
              />
              <span className="text-sm font-medium text-text-primary">Exclude users</span>
            </label>
            {audience.exclude_enabled && (
              <div className="mt-3">
                <AudienceFilterBuilder
                  blockSet={
                    audience.exclude || {
                      blocks: [emptyConditionBlock("behavior")],
                      blocksCombinator: "AND",
                    }
                  }
                  onChange={(b) => setAudience({ ...audience, exclude: b })}
                  testIdPrefix="bcast-source-exclude"
                  blockTypes={TRIGGER_BLOCK_TYPES}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
