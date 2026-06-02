// Structured TriggerNode preview (3 sections: Entry / Audience / Frequency+Exit).
// Outer shell + handles + double-click-to-edit unchanged.
import React from "react";
import { Handle, Position } from "reactflow";
import { Zap, Users, LogOut, Pencil, Clock } from "lucide-react";
import {
  describeCondition,
  renderConditionLine,
  renderFrequencyText,
  renderExitSummary,
  renderAudienceLines,
  AUDIENCE_TYPE_LABELS,
} from "@/components/flows/trigger/triggerHelpers";

const NODE_W = 320;

export default function TriggerNode({ data }) {
  const cfg = data?.trigger_config;
  const hasConfig = !!cfg && Array.isArray(cfg.triggerGroups);
  const isBroadcast = cfg?.kind === "broadcast";

  const onEdit = (e) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("engage:open-trigger-wizard", { detail: { mode: "edit" } }),
    );
  };

  const groups = cfg?.triggerGroups || [];
  const groupsCombinator = cfg?.groupsCombinator || "AND";
  const showGroups = groups.slice(0, 2);
  const moreGroups = groups.length - showGroups.length;

  const audience = cfg?.audience;
  const audienceLines = !isBroadcast ? renderAudienceLines(cfg) : [];
  const audienceShown = audienceLines.slice(0, 3);
  const moreAudience = audienceLines.length - audienceShown.length;

  const freqText = renderFrequencyText(audience);
  const exitText = renderExitSummary(cfg?.exitTrigger);
  const showFooter = !!(freqText || exitText);

  return (
    <div
      style={{ width: NODE_W }}
      className="rounded-xl border border-primary/30 bg-surface shadow-sm overflow-hidden"
      data-testid="canvas-trigger-node"
      onDoubleClick={onEdit}
    >
      <div
        className="px-3 py-2 flex items-center gap-2 text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
        }}
      >
        <Zap className="w-3.5 h-3.5" />
        <span className="text-[11px] uppercase tracking-wide font-bold">
          Start trigger
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto p-1 rounded hover:bg-white/15"
          aria-label="Edit trigger"
          data-testid="canvas-trigger-edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3">
        {!hasConfig && (
          <div className="text-xs text-text-muted italic">
            Not configured yet — double-click to set up.
          </div>
        )}

        {hasConfig && (
          <>
            {/* Section A — Entry */}
            <SectionLabel icon={Zap} label="Entry" />
            <div className="space-y-2 mt-1.5">
              {showGroups.map((g, gi) => (
                <React.Fragment key={gi}>
                  {gi > 0 && (
                    <CombinatorChip value={groupsCombinator} />
                  )}
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-tint text-primary text-[12px] font-semibold max-w-full">
                      <span className="truncate">📥 {g.event}</span>
                    </div>
                    {(g.conditions || []).filter((c) => c && c.property).length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {g.conditions
                          .filter((c) => c && c.property)
                          .slice(0, 3)
                          .map((c, ci) => (
                            <React.Fragment key={ci}>
                              {ci > 0 && (
                                <CombinatorChip
                                  value={g.combinator || "AND"}
                                  small
                                />
                              )}
                              <li
                                className="text-[11px] text-text-secondary truncate"
                                title={describeCondition(c)}
                                data-testid={`tn-cond-${gi}-${ci}`}
                              >
                                {renderConditionLine(c) || "—"}
                              </li>
                            </React.Fragment>
                          ))}
                        {g.conditions.filter((c) => c && c.property).length >
                          3 && (
                          <li
                            className="text-[10px] text-text-muted"
                            title={g.conditions
                              .filter((c) => c && c.property)
                              .slice(3)
                              .map(describeCondition)
                              .join(" · ")}
                          >
                            +{" "}
                            {g.conditions.filter((c) => c && c.property)
                              .length - 3}{" "}
                            more
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </React.Fragment>
              ))}
              {moreGroups > 0 && (
                <div
                  className="text-[10px] text-text-muted"
                  title={groups
                    .slice(showGroups.length)
                    .map((g) => g.event)
                    .join(", ")}
                >
                  + {moreGroups} more trigger{moreGroups === 1 ? "" : "s"}
                </div>
              )}
            </div>

            {/* Section B — Audience */}
            {!isBroadcast && (
              <>
                <Divider />
                <SectionLabel icon={Users} label="Audience" />
                <div className="mt-1.5 space-y-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-tint text-primary">
                    {AUDIENCE_TYPE_LABELS[audience?.audience_type || "all"]}
                  </span>
                  {audienceShown.map((line, i) => (
                    <div
                      key={i}
                      className={`text-[11px] truncate ${
                        line.kind === "exclude"
                          ? "text-rose-600"
                          : "text-text-secondary"
                      }`}
                      title={line.full}
                      data-testid={`tn-aud-${i}`}
                    >
                      {line.kind === "exclude" ? "🚫 " : ""}
                      {line.text}
                    </div>
                  ))}
                  {moreAudience > 0 && (
                    <div
                      className="text-[10px] text-text-muted"
                      title={audienceLines
                        .slice(audienceShown.length)
                        .map((l) => l.full)
                        .join(" · ")}
                    >
                      + {moreAudience} more
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Section C — Frequency + Exit */}
            {showFooter && (
              <>
                <Divider />
                <div className="flex items-center gap-2 flex-wrap">
                  {freqText && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] text-text-secondary"
                      title={freqText.full}
                      data-testid="tn-freq"
                    >
                      <Clock className="w-3 h-3 text-text-muted" />
                      {freqText.short}
                    </span>
                  )}
                  {exitText && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-[11px] text-rose-700"
                      title={exitText.full}
                      data-testid="tn-exit"
                    >
                      <LogOut className="w-3 h-3" />
                      {exitText.short}
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function SectionLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-text-muted" />
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border my-2.5" />;
}

function CombinatorChip({ value = "AND", small }) {
  const isAnd = value === "AND";
  return (
    <div className="flex items-center gap-1">
      <span
        className={`px-1.5 py-0 text-[9px] font-bold rounded uppercase tracking-wide ${
          isAnd
            ? "bg-slate-200 text-slate-700"
            : "bg-sky-100 text-sky-700"
        }`}
      >
        {value}
      </span>
      {!small && <span className="flex-1 h-px bg-border" />}
    </div>
  );
}
