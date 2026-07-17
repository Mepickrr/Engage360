import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import AudienceFilterBuilder from "./audience/AudienceFilterBuilder";
import { emptyConditionBlock } from "./triggerHelpers";

const TRIGGER_BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment", label: "Custom segment" },
];

const AUDIENCE_KINDS = [
  { id: "all", label: "All Users" },
  { id: "identified", label: "Engage Identified" },
  { id: "known", label: "Known User" },
];

export default function Step2WhoContent({
  audience,
  setAudience,
  showCount,
  count,
  loadingCount,
}) {
  const setIncludeAll = (all) => setAudience({ ...audience, include_all: all });

  return (
    <div className="space-y-5">
      {/* Top radio */}
      <div className="flex items-center gap-5">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!!audience.include_all}
            onChange={() => setIncludeAll(true)}
            data-testid="audience-all-users"
            className="accent-primary"
          />
          <span className="text-sm">All users who match the start trigger</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!audience.include_all}
            onChange={() => setIncludeAll(false)}
            data-testid="audience-filter-users"
            className="accent-primary"
          />
          <span className="text-sm">Filter users by</span>
        </label>
      </div>

      {!audience.include_all && (
        <>
          {/* Audience kind pills */}
          <AudienceKindBlock
            value={audience.audience_kind || "all"}
            onChange={(v) => setAudience({ ...audience, audience_kind: v })}
          />
          <div className="h-px bg-border" />

          {/* Include blocks */}
          <AudienceFilterBuilder
            blockSet={audience.include || { blocks: [emptyConditionBlock("property")], blocksCombinator: "AND" }}
            onChange={(b) => setAudience({ ...audience, include: b })}
            testIdPrefix="audience-include"
            blockTypes={TRIGGER_BLOCK_TYPES}
          />
        </>
      )}

      {/* Exclude Users */}
      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.exclude_enabled}
            onChange={(e) => setAudience({ ...audience, exclude_enabled: e.target.checked })}
            data-testid="audience-exclude-toggle"
            className="accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">Exclude Users</span>
        </label>
        {audience.exclude_enabled && (
          <div className="mt-3">
            <AudienceFilterBuilder
              blockSet={audience.exclude || { blocks: [emptyConditionBlock("behavior")], blocksCombinator: "AND" }}
              onChange={(b) => setAudience({ ...audience, exclude: b })}
              testIdPrefix="audience-exclude"
              blockTypes={TRIGGER_BLOCK_TYPES}
            />
          </div>
        )}
      </div>

      {/* Limit entry frequency */}
      <div className="border-t border-border pt-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.limit_enabled}
            onChange={(e) => setAudience({ ...audience, limit_enabled: e.target.checked })}
            className="accent-primary"
            data-testid="audience-limit-toggle"
          />
          <span className="text-sm font-medium">Limit entry frequency</span>
        </label>
        {audience.limit_enabled && (
          <div className="pl-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-text-secondary">Limit to</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.count ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), count: Number(e.target.value) } })
              }
              data-testid="audience-limit-count"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <span className="text-text-secondary">time(s) within</span>
            <input
              type="number"
              min={1}
              value={audience.limit_entry?.window ?? 1}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), window: Number(e.target.value) } })
              }
              data-testid="audience-limit-window"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <select
              value={audience.limit_entry?.unit || "days"}
              onChange={(e) =>
                setAudience({ ...audience, limit_entry: { ...(audience.limit_entry || {}), unit: e.target.value } })
              }
              data-testid="audience-limit-unit"
              className="h-9 text-sm rounded-md border border-border bg-surface px-2"
            >
              <option value="days">Days</option>
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
            </select>
          </div>
        )}
        {false && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!audience.global_control}
              onChange={(e) => setAudience({ ...audience, global_control: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm font-medium">Global control group</span>
          </label>
        )}
        {false && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!audience.flow_control}
              onChange={(e) => setAudience({ ...audience, flow_control: e.target.checked })}
              className="accent-primary"
            />
            <span className="text-sm font-medium">Flow control group</span>
          </label>
        )}
      </div>

      {/* Show count */}
      <div className="border-t border-border pt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={showCount}
          disabled={loadingCount}
          data-testid="audience-show-count"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary border border-primary/50 rounded-md hover:bg-primary-tint disabled:opacity-50"
        >
          {loadingCount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Show count
        </button>
        {count != null && (
          <span className="text-sm text-text-primary" data-testid="audience-count-value">
            ≈ <span className="font-semibold">{count.toLocaleString("en-IN")}</span> users will enter
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Audience Kind pills ───────────────────────────────────────
function AudienceKindBlock({ value, onChange }) {
  return (
    <div className="space-y-2" data-testid="audience-type-block">
      <div className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
        Audience Type
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {AUDIENCE_KINDS.map((t) => {
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              data-testid={`audience-type-${t.id}`}
              className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-primary border-border hover:bg-primary-tint hover:border-primary/40"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
