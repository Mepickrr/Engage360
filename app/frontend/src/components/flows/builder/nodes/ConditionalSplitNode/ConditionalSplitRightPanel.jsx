import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Trash2, Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  EXPRESSION_VARIABLE_GROUPS,
  EXPRESSION_OPERATORS,
  PATH_LABELS,
  newFilterGroup,
  newExpression,
} from "./data/mockData";
import AudienceFilterBuilder from "@/components/flows/builder/trigger/audience/AudienceFilterBuilder";
import CombinatorPill from "@/components/flows/builder/trigger/audience/CombinatorPill";
import TwoPanelDropdown from "@/components/flows/builder/trigger/TwoPanelDropdown";

// ── Reusable small atoms ──────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wide font-semibold text-text-muted mb-1">
      {children}
    </div>
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        danger ? "text-text-muted hover:text-rose-600 hover:bg-rose-50" : "text-text-muted hover:text-text-primary hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

// ── Filter Tab ────────────────────────────────────────────────────────────────

const SPLIT_BLOCK_TYPES = [
  { id: "property",       label: "User property" },
  { id: "behavior",       label: "User behavior" },
  { id: "affinity",       label: "User affinity" },
  { id: "event_property", label: "Event property" },
  { id: "segment",        label: "Custom segment" },
];

function FilterTab({ data, patch }) {
  const groups = useMemo(() => data.filterGroups ?? [], [data.filterGroups]);
  const groupsCombinator = data.filterGroupsCombinator ?? "AND";

  const updateGroup = useCallback(
    (id, next) =>
      patch({ filterGroups: groups.map((g) => (g.id === id ? { ...g, ...next } : g)) }),
    [groups, patch],
  );

  const removeGroup = useCallback(
    (id) => {
      const next = groups.filter((g) => g.id !== id);
      patch({ filterGroups: next.length ? next : [newFilterGroup(0)] });
    },
    [groups, patch],
  );

  const addGroup = useCallback(() => {
    patch({ filterGroups: [...groups, newFilterGroup(groups.length)] });
  }, [groups, patch]);

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <React.Fragment key={group.id}>
          {gi > 0 && (
            <div className="py-1">
              <CombinatorPill
                value={groupsCombinator}
                onChange={(v) => patch({ filterGroupsCombinator: v })}
                testId="filter-groups-combinator"
              />
            </div>
          )}
          <FilterGroupCard
            group={group}
            index={gi}
            onChange={(next) => updateGroup(group.id, next)}
            onRemove={() => removeGroup(group.id)}
            canRemove={groups.length > 1}
          />
        </React.Fragment>
      ))}

      <button
        type="button"
        onClick={addGroup}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
      >
        <Plus className="w-3.5 h-3.5" />
        Add branch
      </button>

      <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-md border border-border">
        <div className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
        <span className="text-[11px] text-text-secondary">
          <span className="font-medium">Else</span> — users that don't match any branch
        </span>
      </div>
    </div>
  );
}

function FilterGroupCard({ group, index, onChange, onRemove, canRemove }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-border">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="text-text-muted"
        >
          {collapsed ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
        <input
          type="text"
          value={group.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="flex-1 min-w-0 text-sm font-medium bg-transparent focus:outline-none"
        />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md text-text-muted hover:text-rose-600 hover:bg-rose-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="p-3">
          <AudienceFilterBuilder
            blockSet={{
              blocks: group.blocks || [],
              blocksCombinator: group.blocksCombinator || "AND",
            }}
            onChange={(next) =>
              onChange({
                blocks: next.blocks,
                blocksCombinator: next.blocksCombinator,
              })
            }
            testIdPrefix={`fg-${group.id}`}
            blockTypes={SPLIT_BLOCK_TYPES}
          />
        </div>
      )}
    </div>
  );
}

// ── A/B Test Tab ──────────────────────────────────────────────────────────────

function ABTestTab({ data, patch }) {
  const paths = data.abPaths ?? [];
  const randomise = data.abRandomise ?? false;

  const updatePath = (id, next) =>
    patch({ abPaths: paths.map((p) => (p.id === id ? { ...p, ...next } : p)) });

  const removePath = (id) => {
    const next = paths.filter((p) => p.id !== id);
    patch({ abPaths: next });
  };

  const addPath = () => {
    if (paths.length >= 8) return;
    const label = PATH_LABELS[paths.length] || String.fromCharCode(65 + paths.length);
    const equalPct = Math.floor(100 / (paths.length + 1));
    const remainder = 100 - equalPct * (paths.length + 1);
    const updated = paths.map((p) => ({ ...p, percentage: equalPct }));
    updated[0] = { ...updated[0], percentage: equalPct + remainder };
    const newPath = {
      id: `path_${Date.now()}`,
      label,
      percentage: equalPct,
    };
    patch({ abPaths: [...updated, newPath] });
  };

  const splitEqually = () => {
    const equal = Math.floor(100 / paths.length);
    const rem = 100 - equal * paths.length;
    patch({
      abPaths: paths.map((p, i) => ({
        ...p,
        percentage: i === 0 ? equal + rem : equal,
      })),
    });
  };

  const total = paths.reduce((s, p) => s + (Number(p.percentage) || 0), 0);

  // 2-path: slider for path A, auto-compute B
  const isTwoPath = paths.length === 2;

  const handleSliderChange = (val) => {
    const pct = Number(val);
    patch({
      abPaths: [
        { ...paths[0], percentage: pct },
        { ...paths[1], percentage: 100 - pct },
      ],
    });
  };

  return (
    <div className="space-y-4">
      {isTwoPath ? (
        <>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] text-text-muted">
              <span>Path A</span>
              <span>Path B</span>
            </div>
            <input
              type="range"
              min={5}
              max={95}
              step={5}
              value={paths[0]?.percentage ?? 50}
              onChange={(e) => handleSliderChange(e.target.value)}
              className="w-full accent-teal-600"
            />
            <div className="flex justify-between">
              {paths.map((p) => (
                <div key={p.id} className="text-center">
                  <div className="text-xl font-bold text-text-primary">{p.percentage}%</div>
                  <div className="text-[10px] text-text-muted">Path {p.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={addPath}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Add path C
          </button>
        </>
      ) : (
        <div className="space-y-2">
          {paths.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                style={{ background: "#CCFBF1", color: "#0D9488" }}>
                {p.label}
              </div>
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={p.percentage}
                  onChange={(e) => updatePath(p.id, { percentage: Number(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-border rounded-md text-center focus:outline-none focus:border-teal-400"
                />
                <span className="text-sm text-text-muted">%</span>
              </div>
              {paths.length > 2 && (
                <IconBtn danger onClick={() => removePath(p.id)} title="Remove path">
                  <Trash2 className="w-3.5 h-3.5" />
                </IconBtn>
              )}
            </div>
          ))}

          <div className={`text-[11px] font-medium mt-1 ${total !== 100 ? "text-rose-600" : "text-teal-600"}`}>
            Total: {total}% {total !== 100 && "(must equal 100%)"}
          </div>

          {paths.length < 8 && (
            <button
              type="button"
              onClick={addPath}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add path {PATH_LABELS[paths.length] || ""}
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={splitEqually}
        className="w-full py-1.5 text-xs font-medium border border-teal-200 text-teal-700 rounded-md hover:bg-teal-50 transition-colors"
      >
        Split equally
      </button>

      <label className="flex items-center gap-2 cursor-pointer">
        <div
          onClick={() => patch({ abRandomise: !randomise })}
          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${randomise ? "bg-teal-500" : "bg-slate-200"}`}
        >
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${randomise ? "translate-x-4" : "translate-x-0.5"}`} />
        </div>
        <span className="text-sm text-text-primary">Randomise path for every visit</span>
      </label>
    </div>
  );
}

// ── Custom Expression Tab ─────────────────────────────────────────────────────

// Variable groups in TwoPanelDropdown format for the expression variable picker
function buildExprVarGroups() {
  const result = {};
  for (const g of EXPRESSION_VARIABLE_GROUPS) {
    result[g.label] = g.variables.map((v) => ({
      name: v.key,
      description: `${v.label} (${v.type})`,
    }));
  }
  return result;
}

const EXPR_VAR_GROUPS = buildExprVarGroups();

// Simple inline variable insertion dropdown (portal-based for safe z-index)
function VariableInserter({ onInsert }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setStyle({
      position: "fixed",
      zIndex: 9999,
      top: r.bottom + 4,
      left: r.left,
      width: 260,
    });
    function onDoc(e) {
      if (!btnRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] text-teal-600 hover:text-teal-700 font-medium"
      >
        <Plus className="w-3 h-3" />
        Add variable
      </button>
      {open && typeof document !== "undefined" &&
        (() => {
          const { createPortal } = require("react-dom");
          return createPortal(
            <div
              style={style}
              className="bg-white border border-border rounded-lg shadow-xl overflow-hidden"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold px-3 pt-2 pb-1">
                Insert variable
              </div>
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {EXPRESSION_VARIABLE_GROUPS.map((group) => (
                  <div key={group.id}>
                    <div className="px-3 py-1 text-[9px] uppercase tracking-wide text-text-muted font-bold bg-slate-50 sticky top-0">
                      {group.label}
                    </div>
                    {group.variables.map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onInsert(`{{${v.key}}}`);
                          setOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 flex items-center justify-between gap-2"
                      >
                        <span className="font-mono text-slate-700">{v.key}</span>
                        <span className="text-[10px] text-text-muted flex-shrink-0">{v.type}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          );
        })()
      }
    </>
  );
}

function ExpressionRow({ expr, index, onChange, onRemove, canRemove }) {
  const isStructured = (expr.inputMode ?? "structured") === "structured";

  const textareaRef = useRef(null);

  const insertVariable = (token) => {
    const el = textareaRef.current;
    if (!el) {
      onChange({ ...expr, rawText: (expr.rawText || "") + token });
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = expr.rawText || "";
    const next = text.slice(0, start) + token + text.slice(end);
    onChange({ ...expr, rawText: next });
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + token.length;
      el.focus();
    });
  };

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
          Expression {index + 1}
        </span>
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-border overflow-hidden text-[10px] font-medium">
            <button
              type="button"
              onClick={() => onChange({ ...expr, inputMode: "structured" })}
              className={`px-2 py-1 transition-colors ${isStructured ? "bg-teal-500 text-white" : "bg-white text-text-muted hover:bg-slate-50"}`}
            >
              Selector
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...expr, inputMode: "freetext" })}
              className={`px-2 py-1 transition-colors ${!isStructured ? "bg-teal-500 text-white" : "bg-white text-text-muted hover:bg-slate-50"}`}
            >
              Text
            </button>
          </div>
          {canRemove && (
            <IconBtn danger onClick={onRemove} title="Remove expression">
              <Trash2 className="w-3.5 h-3.5" />
            </IconBtn>
          )}
        </div>
      </div>

      {isStructured ? (
        <div className="space-y-1.5">
          <TwoPanelDropdown
            value={expr.variable}
            onChange={(v) => onChange({ ...expr, variable: v })}
            groups={EXPR_VAR_GROUPS}
            placeholder="Select variable"
            testId={`expr-var-${expr.id}`}
            buttonClassName="w-full"
            width={480}
          />
          <div className="flex gap-1.5">
            <select
              value={expr.operator}
              onChange={(e) => onChange({ ...expr, operator: e.target.value })}
              className="w-36 px-2 py-1.5 text-[12px] border border-border rounded-md bg-white focus:outline-none focus:border-teal-400"
            >
              {EXPRESSION_OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={expr.value ?? ""}
              onChange={(e) => onChange({ ...expr, value: e.target.value })}
              placeholder="Value"
              className="flex-1 px-2 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            ref={textareaRef}
            value={expr.rawText ?? ""}
            onChange={(e) => onChange({ ...expr, rawText: e.target.value })}
            placeholder="e.g. {{customer.order_count}} > 5 AND {{customer.rfm}} == 'champion'"
            rows={3}
            className="w-full px-2 py-1.5 text-[12px] border border-border rounded-md focus:outline-none focus:border-teal-400 resize-none font-mono"
          />
          <VariableInserter onInsert={insertVariable} />
        </div>
      )}
    </div>
  );
}

function ExpressionTab({ data, patch }) {
  const expressions = data.expressions ?? [];

  const updateExpr = (id, next) =>
    patch({ expressions: expressions.map((e) => (e.id === id ? { ...e, ...next } : e)) });

  const removeExpr = (id) => {
    const next = expressions.filter((e) => e.id !== id);
    patch({ expressions: next.length ? next : [newExpression(0)] });
  };

  const addExpr = () => {
    patch({ expressions: [...expressions, newExpression(expressions.length)] });
  };

  return (
    <div className="space-y-3">
      {expressions.map((e, i) => (
        <ExpressionRow
          key={e.id}
          expr={e}
          index={i}
          onChange={(next) => updateExpr(e.id, next)}
          onRemove={() => removeExpr(e.id)}
          canRemove={expressions.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addExpr}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700"
      >
        <Plus className="w-3.5 h-3.5" />
        Add expression
      </button>

      <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md border border-red-100">
        <div className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
        <span className="text-[11px] text-text-secondary">
          <span className="font-medium text-red-600">False</span> — when no expression matches
        </span>
      </div>
    </div>
  );
}

// ── Main right panel ──────────────────────────────────────────────────────────

const MODES = [
  { id: "filter",     label: "Filter" },
  { id: "ab",         label: "A/B Test" },
  { id: "expression", label: "Expression" },
];

export default function ConditionalSplitRightPanel({ node, updateNodeData, removeNode }) {
  const data = node?.data ?? {};

  const patch = useCallback(
    (p) => {
      if (!node) return;
      updateNodeData(node.id, p);
    },
    [node, updateNodeData],
  );

  const currentMode = data.mode ?? null;

  const selectMode = (modeId) => {
    if (modeId === currentMode) return;
    // Silently preserve other mode data; only switch mode
    patch({ mode: modeId });
  };

  if (!node) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
            Conditional Split
          </div>
          <input
            type="text"
            value={data.label ?? "Conditional Split"}
            onChange={(e) => patch({ label: e.target.value })}
            className="text-sm font-semibold text-text-primary bg-transparent focus:outline-none border-b border-transparent focus:border-teal-400 w-full"
          />
        </div>
        <button
          type="button"
          onClick={() => removeNode(node.id)}
          className="text-[11px] text-rose-600 hover:underline flex-shrink-0"
        >
          Delete
        </button>
      </div>

      {/* Mode selector */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <SectionLabel>Split mode</SectionLabel>
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMode(m.id)}
              className={`flex-1 py-1.5 text-[12px] font-medium rounded-md border transition-colors ${
                currentMode === m.id
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-text-secondary border-border hover:border-teal-300 hover:text-teal-600"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {!currentMode && (
          <div className="mt-4 text-center text-[12px] text-text-muted py-8 border border-dashed border-border rounded-lg">
            Select a split mode above to configure branches
          </div>
        )}

        {currentMode === "filter" && (
          <FilterTab data={data} patch={patch} />
        )}

        {currentMode === "ab" && (
          <ABTestTab data={data} patch={patch} />
        )}

        {currentMode === "expression" && (
          <ExpressionTab data={data} patch={patch} />
        )}
      </div>
    </div>
  );
}
