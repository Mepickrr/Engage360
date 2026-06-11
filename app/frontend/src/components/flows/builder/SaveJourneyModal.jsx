import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Plus, Trash2, Sparkles, Play, FlaskConical, Rocket, DollarSign } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";

// ── Flat deduplicated event name list from catalogue ─────────────────────────
const ALL_EVENT_NAMES = Array.from(
  new Set(
    Object.entries(catalogueData.catalogue)
      .filter(([key]) => key !== "ALL")
      .flatMap(([, sections]) => Object.values(sections).flat())
      .map((e) => e.name),
  ),
).sort();

// ── AI: suggest a goal event based on the flow's trigger event ───────────────
const TRIGGER_TO_GOAL = {
  "Abandoned Cart":      "Order placed",
  "Abandoned Checkout":  "Order placed",
  "Abandoned Product":   "Order placed",
  "Checkout started":    "Order placed",
  "App/Website open":    "Order placed",
  "Product viewed":      "Add to cart",
  "Sign Up":             "Purchased a Product",
  "Order placed":        "Review Created",
  "Order delivered":     "Review Created",
  "Product Delivered":   "Review Created",
  "Spin popup Dismiss":  "Order placed",
  "Open Profile":        "Order placed",
  "Address Filled":      "Payment Completed",
  "Checkout Started":    "Payment Completed",
};
const DEFAULT_GOAL_EVENT = "Order placed";

function suggestGoalEvent(triggerEventName) {
  if (!triggerEventName) return DEFAULT_GOAL_EVENT;
  return TRIGGER_TO_GOAL[triggerEventName] ?? DEFAULT_GOAL_EVENT;
}

// ── Small helpers ────────────────────────────────────────────────────────────
let _goalSeq = 0;
function makeGoal(event = DEFAULT_GOAL_EVENT) {
  _goalSeq += 1;
  return { id: `goal-${_goalSeq}`, name: `Goal ${_goalSeq}`, event, trackRevenue: false };
}

const ATTRIBUTION_OPTIONS = ["6 hours", "12 hours", "1 day", "3 days", "7 days", "30 days"];

// ── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0 focus:outline-none ${
        checked ? "bg-primary" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ── Single goal card ─────────────────────────────────────────────────────────
function GoalCard({ goal, index, isPrimary, aiSuggested, onUpdate, onRemove }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        isPrimary
          ? "border-primary/30 bg-primary/[0.03]"
          : "border-border bg-surface"
      }`}
    >
      {/* Card header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-text-primary">
            Goal {index + 1}
          </span>
          {isPrimary && (
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Primary
            </span>
          )}
        </div>
        {!isPrimary && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Fields row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Goal name
          </label>
          <input
            type="text"
            value={goal.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full h-8 px-2.5 rounded-lg border border-border text-[13px] text-text-primary bg-white focus:outline-none focus:border-primary/60"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
            Conversion event
          </label>
          <select
            value={goal.event}
            onChange={(e) => onUpdate({ event: e.target.value })}
            className="w-full h-8 px-2.5 rounded-lg border border-border text-[13px] text-text-primary bg-white focus:outline-none focus:border-primary/60 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              paddingRight: "28px",
            }}
          >
            {ALL_EVENT_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI suggestion note (primary card only when triggered) */}
      {isPrimary && aiSuggested && (
        <div className="flex items-center gap-1.5 text-[11px] text-primary bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5 mb-3">
          <Sparkles className="w-3 h-3 flex-shrink-0" />
          AI suggested based on your trigger event
        </div>
      )}

      {/* Revenue tracking toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-[12px] text-text-secondary font-medium">
            Track revenue for this goal
          </span>
        </div>
        <Toggle
          checked={goal.trackRevenue}
          onChange={(v) => onUpdate({ trackRevenue: v })}
        />
      </div>
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function SaveJourneyModal({
  open,
  onClose,
  triggerEventName,
  onGoLive,
  onTestMode,
  onPreview,
}) {
  const [goals, setGoals] = useState([]);
  const [attributionWindow, setAttributionWindow] = useState("1 day");
  const [exitOnConversion, setExitOnConversion] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);

  // Seed with AI suggestion whenever the modal opens fresh
  useEffect(() => {
    if (!open) return;
    const suggested = suggestGoalEvent(triggerEventName);
    _goalSeq = 0;
    const g = makeGoal(suggested);
    g.name = "Conversion Goal";
    setGoals([g]);
    setAiSuggested(!!TRIGGER_TO_GOAL[triggerEventName]);
    setAttributionWindow("1 day");
    setExitOnConversion(false);
  }, [open]); // intentionally only re-seeds on open, not every triggerEventName change

  const canAddGoal = goals.length < 3;

  const addGoal = () => {
    if (!canAddGoal) return;
    setGoals((prev) => [...prev, makeGoal()]);
  };

  const updateGoal = (id, patch) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const removeGoal = (id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const payload = { goals, attributionWindow, exitOnConversion };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-[540px] p-0 gap-0 overflow-hidden"
        data-testid="save-journey-modal"
      >
        <DialogTitle className="sr-only">Save Journey</DialogTitle>

        {/* ── Header ── */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-bold text-text-primary leading-tight">
                Save Journey
              </h2>
              <p className="text-[12.5px] text-text-secondary mt-0.5 leading-relaxed">
                Set up conversion tracking before you go live. You can skip
                this and configure goals later.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-text-muted hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] px-6 py-5 space-y-5">

          {/* Goals section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[12px] font-bold text-text-primary uppercase tracking-wide">
                Conversion Goals
              </h3>
              <span className="text-[11px] text-text-muted">
                · {goals.length}/3
              </span>
            </div>

            <div className="space-y-3">
              {goals.map((goal, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  index={i}
                  isPrimary={i === 0}
                  aiSuggested={i === 0 && aiSuggested}
                  onUpdate={(patch) => updateGoal(goal.id, patch)}
                  onRemove={() => removeGoal(goal.id)}
                />
              ))}
            </div>

            {canAddGoal && (
              <button
                type="button"
                onClick={addGoal}
                className="mt-3 w-full h-9 rounded-xl border border-dashed border-border text-[12.5px] text-text-muted hover:border-primary/50 hover:text-primary hover:bg-primary/[0.02] transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another goal
              </button>
            )}
          </div>

          {/* Attribution */}
          <div className="rounded-xl border border-border bg-slate-50/60 p-4 space-y-4">
            <div>
              <h3 className="text-[12px] font-bold text-text-primary uppercase tracking-wide mb-3">
                Conversion Attribution
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] text-text-secondary">
                  Count a conversion
                </span>
                <select
                  value={attributionWindow}
                  onChange={(e) => setAttributionWindow(e.target.value)}
                  className="h-8 px-2.5 rounded-lg border border-border text-[13px] text-text-primary bg-white focus:outline-none focus:border-primary/60 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                    paddingRight: "28px",
                  }}
                >
                  {ATTRIBUTION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="text-[13px] text-text-secondary">
                  after a user receives or clicks a message
                </span>
              </div>
            </div>

            {/* Exit on conversion */}
            <div className="flex items-start gap-3 pt-3 border-t border-border">
              <Toggle checked={exitOnConversion} onChange={setExitOnConversion} />
              <div>
                <p className="text-[13px] font-semibold text-text-primary leading-tight">
                  Exit flow on conversion
                </p>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  {exitOnConversion
                    ? "Users are removed from the flow as soon as the primary goal is achieved."
                    : "Users continue through the flow even after converting."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/60">
          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button
              type="button"
              onClick={() => { onPreview?.(payload); onClose(); }}
              className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-border bg-white text-[12px] font-semibold text-text-secondary hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-all"
            >
              <Play className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => { onTestMode?.(payload); onClose(); }}
              className="flex items-center justify-center gap-1.5 h-9 rounded-lg border border-blue-200 bg-blue-50 text-[12px] font-semibold text-blue-700 hover:bg-blue-100 transition-all"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Test Mode
            </button>
            <button
              type="button"
              onClick={() => { onGoLive?.(payload); onClose(); }}
              className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover transition-all shadow-sm"
            >
              <Rocket className="w-3.5 h-3.5" />
              Go Live
            </button>
          </div>

          {/* Skip */}
          <div className="text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[12px] text-text-muted hover:text-text-secondary underline underline-offset-2 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
