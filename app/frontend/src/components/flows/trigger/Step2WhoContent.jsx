import React, { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import UserPropertyConditions from "./audience/UserPropertyConditions";
import UserBehaviorConditions from "./audience/UserBehaviorConditions";
import UserAffinityConditions from "./audience/UserAffinityConditions";
import EventActionRow, {
  emptyEventAction,
} from "./audience/EventActionRow";

const TABS = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment", label: "Custom segment" },
];

const MOCK_SEGMENTS = [
  "Top 10% buyers (90d)",
  "Lapsed VIPs (60d+)",
  "Cart abandoners (24h)",
  "First-time buyers (30d)",
  "Newsletter subscribers",
];

const AUDIENCE_TYPES = [
  { id: "all", label: "All Users" },
  { id: "engage_identified", label: "Engage Identified User" },
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
          {/* Audience Type pills */}
          <AudienceTypeBlock
            value={audience.audience_type || "all"}
            onChange={(v) => setAudience({ ...audience, audience_type: v })}
          />
          <div className="h-px bg-border" />

          <FilterTabsBlock
            block={audience.include || {}}
            onChange={(b) => setAudience({ ...audience, include: b })}
            testIdPrefix="audience-include"
          />
        </>
      )}

      {/* Exclude Users — event-based list (Has Done / Has Not Done + event) */}
      <div className="border-t border-border pt-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.exclude_enabled}
            onChange={(e) =>
              setAudience({ ...audience, exclude_enabled: e.target.checked })
            }
            data-testid="audience-exclude-toggle"
            className="accent-primary"
          />
          <span className="text-sm font-medium text-text-primary">
            Exclude Users
          </span>
        </label>
        {audience.exclude_enabled && (
          <div className="mt-3">
            <ExcludeEventList
              events={audience.exclude?.events}
              onChange={(events) =>
                setAudience({ ...audience, exclude: { events } })
              }
              testIdPrefix="audience-exclude"
            />
          </div>
        )}
      </div>

      {/* Limit entry frequency — screenshot 7 format */}
      <div className="border-t border-border pt-4 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.limit_enabled}
            onChange={(e) =>
              setAudience({ ...audience, limit_enabled: e.target.checked })
            }
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
                setAudience({
                  ...audience,
                  limit_entry: {
                    ...(audience.limit_entry || {}),
                    count: Number(e.target.value),
                  },
                })
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
                setAudience({
                  ...audience,
                  limit_entry: {
                    ...(audience.limit_entry || {}),
                    window: Number(e.target.value),
                  },
                })
              }
              data-testid="audience-limit-window"
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-border bg-surface"
            />
            <select
              value={audience.limit_entry?.unit || "days"}
              onChange={(e) =>
                setAudience({
                  ...audience,
                  limit_entry: {
                    ...(audience.limit_entry || {}),
                    unit: e.target.value,
                  },
                })
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.global_control}
            onChange={(e) =>
              setAudience({ ...audience, global_control: e.target.checked })
            }
            className="accent-primary"
          />
          <span className="text-sm font-medium">Global control group</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!audience.flow_control}
            onChange={(e) =>
              setAudience({ ...audience, flow_control: e.target.checked })
            }
            className="accent-primary"
          />
          <span className="text-sm font-medium">Flow control group</span>
        </label>
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
          <span
            className="text-sm text-text-primary"
            data-testid="audience-count-value"
          >
            ≈{" "}
            <span className="font-semibold">
              {count.toLocaleString("en-IN")}
            </span>{" "}
            users will enter
          </span>
        )}
      </div>
    </div>
  );
}

// ───────── Audience Type pills ─────────
function AudienceTypeBlock({ value, onChange }) {
  return (
    <div className="space-y-2" data-testid="audience-type-block">
      <div className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
        Audience Type
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {AUDIENCE_TYPES.map((t) => {
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

// ───────── Filter Tabs Block (4 tabs, include path only) ─────────
function FilterTabsBlock({ block, onChange, testIdPrefix }) {
  const [tab, setTab] = useState("property");
  const tabsState = block.tabs || {};
  const setTabBlock = (id, b) =>
    onChange({ ...block, tabs: { ...tabsState, [id]: b } });

  return (
    <div className="border border-border rounded-lg bg-surface">
      <div className="border-b border-border px-3 pt-2 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            data-testid={`${testIdPrefix}-tab-${t.id}`}
            className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tab === "property" && (
          <UserPropertyConditions
            block={tabsState.property || { conditions: [], combinator: "AND" }}
            onChange={(b) => setTabBlock("property", b)}
            testIdPrefix={`${testIdPrefix}-property`}
          />
        )}
        {tab === "behavior" && (
          <UserBehaviorConditions
            block={tabsState.behavior || { conditions: [], combinator: "AND" }}
            onChange={(b) => setTabBlock("behavior", b)}
            testIdPrefix={`${testIdPrefix}-behavior`}
          />
        )}
        {tab === "affinity" && (
          <UserAffinityConditions
            block={tabsState.affinity || { conditions: [], combinator: "AND" }}
            onChange={(b) => setTabBlock("affinity", b)}
            testIdPrefix={`${testIdPrefix}-affinity`}
          />
        )}
        {tab === "segment" && (
          <SegmentList
            block={tabsState.segment || { segments: [] }}
            onChange={(b) => setTabBlock("segment", b)}
            testIdPrefix={`${testIdPrefix}-segment`}
          />
        )}
      </div>
    </div>
  );
}

function SegmentList({ block, onChange, testIdPrefix }) {
  const segments = block.segments || [];

  React.useEffect(() => {
    if ((block.segments || []).length === 0) {
      onChange({ ...block, segments: [""] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {segments.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={s}
            onChange={(e) =>
              onChange({
                ...block,
                segments: segments.map((x, idx) =>
                  idx === i ? e.target.value : x,
                ),
              })
            }
            data-testid={`${testIdPrefix}-${i}`}
            className="h-9 text-sm flex-1 rounded-md border border-border bg-surface px-2"
          >
            <option value="">Select a segment</option>
            {MOCK_SEGMENTS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...block,
                segments: segments.filter((_, idx) => idx !== i),
              })
            }
            className="p-1.5 text-text-muted hover:text-rose-600 rounded-md"
            aria-label="Remove segment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...block, segments: [...segments, ""] })}
        data-testid={`${testIdPrefix}-add`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add segment (OR)
      </button>
    </div>
  );
}

// ───────── Exclude Users — list of EventActionRow ─────────
function ExcludeEventList({ events, onChange, testIdPrefix }) {
  const list = events || [];

  React.useEffect(() => {
    if ((events || []).length === 0) {
      onChange([emptyEventAction()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2 border border-border rounded-lg bg-surface p-3">
      {list.map((row, i) => (
        <EventActionRow
          key={i}
          value={row}
          onChange={(v) =>
            onChange(list.map((x, idx) => (idx === i ? v : x)))
          }
          onRemove={
            list.length > 1
              ? () => onChange(list.filter((_, idx) => idx !== i))
              : undefined
          }
          testId={`${testIdPrefix}-row-${i}`}
        />
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, emptyEventAction()])}
        data-testid={`${testIdPrefix}-add`}
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
      >
        <Plus className="w-3.5 h-3.5" />
        Add condition
      </button>
    </div>
  );
}
