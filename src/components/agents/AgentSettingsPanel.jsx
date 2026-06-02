import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Lock, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PRIMARY = "#6C3AE8";

const AVATAR_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#14B8A6", "#F43F5E", "#64748B",
];
const SPECIALTY_OPTIONS = [
  "Recovery & Remarketing", "Copy & Brand Voice", "Segments & Cohorts",
  "Diagnostics & Reports", "Journeys & Automation", "Setup & Integrations", "Custom",
];
const TONE_OPTIONS     = ["Friendly", "Professional", "Direct", "Empathetic"];
const LANGUAGE_OPTIONS = ["Formal", "Casual", "Hinglish"];
const GOAL_OPTIONS     = ["Recovery", "Retention", "Discovery", "Support", "Custom"];
const METRIC_OPTIONS   = ["Revenue recovered", "Conversion rate", "CSAT", "Flow completion"];
const ACCESS_OPTIONS   = [
  { value: "full",   label: "Full store access" },
  { value: "orders", label: "Orders & customers only" },
  { value: "none",   label: "No data access" },
];

const SYSTEM_AGENT_IDS = ["aryan", "zara", "meera", "rishi", "dev", "priya"];

const FIELD = "w-full px-3 py-2 rounded-md border border-border bg-white text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60 disabled:bg-slate-50 disabled:text-text-muted";

function SectionHeading({ label }) {
  return (
    <div className="text-[10px] uppercase tracking-widest font-semibold text-text-muted mb-3 pt-2 border-t border-border">
      {label}
    </div>
  );
}

function LockNote() {
  return (
    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
      <Lock className="w-3 h-3 flex-shrink-0" />
      <span>This is a system agent. Core behaviour is managed by Engage 360.</span>
    </div>
  );
}

function Toggle({ value, onChange, label, disabled }) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className={`text-[13px] ${disabled ? "text-text-muted" : "text-text-secondary"}`}>{label}</span>}
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${value ? "bg-primary" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function SegmentedPicker({ options, value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => !disabled && onChange(opt)}
          disabled={disabled}
          className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
            value === opt
              ? "border-primary text-primary bg-primary/5"
              : "border-border text-text-muted"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-text-muted/60 cursor-pointer"}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function AgentSettingsPanel({ open, onClose, agent, onSave }) {
  const isSystem = agent ? SYSTEM_AGENT_IDS.includes(agent.id) : false;

  // Identity
  const [name, setName]      = useState("");
  const [color, setColor]    = useState(AVATAR_COLORS[0]);
  const [title, setTitle]    = useState("");
  const [specialty, setSpec] = useState(SPECIALTY_OPTIONS[0]);
  const [paused, setPaused]  = useState(false);

  // Personality
  const [tone, setTone]          = useState("Friendly");
  const [lang, setLang]          = useState("Casual");
  const [emoji, setEmoji]        = useState(true);
  const [brandVoice, setBrand]   = useState("");
  const [advanced, setAdvanced]  = useState("");
  const [advOpen, setAdvOpen]    = useState(false);

  // Scope
  const [goal, setGoal]       = useState("Recovery");
  const [restrict, setRestr]  = useState("");
  const [access, setAccess]   = useState("full");
  const [metric, setMetric]   = useState("Revenue recovered");
  const [escalate, setEsc]    = useState(false);

  // Prompts
  const [prompts, setPrompts] = useState(["", "", ""]);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Pre-populate when agent changes
  useEffect(() => {
    if (!agent) return;
    setName(agent.name || "");
    setColor(agent.color || AVATAR_COLORS[0]);
    setTitle(agent.title || "");
    setSpec(agent.domain || SPECIALTY_OPTIONS[0]);
    setPaused(false);
    setTone("Friendly");
    setLang("Casual");
    setEmoji(true);
    setBrand("");
    setAdvanced("");
    setGoal("Recovery");
    setRestr("");
    setAccess("full");
    setMetric("Revenue recovered");
    setEsc(false);
    const sp = (agent.suggested_prompts || []);
    setPrompts([sp[0] || "", sp[1] || "", sp[2] || ""]);
    setConfirmDelete(false);
    setAdvOpen(false);
  }, [agent]);

  if (!agent) return null;

  const handleSave = () => {
    onSave({
      ...agent,
      name,
      color,
      title,
      domain: specialty,
      avatar_initials: name.charAt(0).toUpperCase() || agent.avatar_initials,
      suggested_prompts: prompts.filter(Boolean),
    });
    toast.success("Changes saved");
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    toast.success(`${agent.name} deleted`);
    onSave(null);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] p-0 flex flex-col"
        data-testid="agent-settings-panel"
      >
        <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
          <SheetTitle className="text-[15px] font-semibold flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ backgroundColor: color }}
            >
              {(name || agent.name).charAt(0).toUpperCase()}
            </span>
            Edit — {name || agent.name}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Section A — Identity */}
          <SectionHeading label="Identity" />

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Agent Name</label>
            <input className={FIELD} value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-2">Avatar Color</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-text-primary scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Role / Title</label>
            <input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Specialty</label>
            <select className={FIELD} value={specialty} onChange={(e) => setSpec(e.target.value)}>
              {SPECIALTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          <Toggle value={paused} onChange={setPaused} label="Agent Active" />
          {paused && (
            <p className="text-[11px] text-amber-600 mt-1">
              When paused, this agent won't generate signals or respond to conversations.
            </p>
          )}

          {/* Section B — Personality */}
          <SectionHeading label="Personality & Tone" />

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-2">Tone</label>
            <SegmentedPicker options={TONE_OPTIONS} value={tone} onChange={setTone} />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-2">Language Style</label>
            <SegmentedPicker options={LANGUAGE_OPTIONS} value={lang} onChange={setLang} />
          </div>

          <Toggle value={emoji} onChange={setEmoji} label="Emoji Usage" />

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              Brand Voice Sample <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              className={`${FIELD} resize-none`}
              rows={3}
              value={brandVoice}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Paste 1–2 messages your brand has sent before."
            />
          </div>

          {/* Advanced instructions — collapsible */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setAdvOpen((o) => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium text-text-secondary hover:bg-slate-50"
              disabled={isSystem}
            >
              <span className="flex items-center gap-1.5">
                {isSystem && <Lock className="w-3 h-3 text-text-muted" />}
                Custom Instructions (Advanced)
              </span>
              {advOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {advOpen && (
              <div className="px-3 pb-3">
                {isSystem && <LockNote />}
                <textarea
                  className={`${FIELD} resize-none mt-2`}
                  rows={4}
                  disabled={isSystem}
                  value={advanced}
                  onChange={(e) => setAdvanced(e.target.value)}
                  placeholder="These instructions are added to the agent's core behaviour. Use this only if guided settings above don't cover your needs."
                />
              </div>
            )}
          </div>

          {/* Section C — Scope */}
          <SectionHeading label="Scope & Guardrails" />

          <div>
            <label className={`block text-[12px] font-medium mb-1 ${isSystem ? "text-text-muted" : "text-text-secondary"}`}>
              {isSystem && <Lock className="w-3 h-3 inline mr-1" />}Agent Goal
            </label>
            <select className={FIELD} value={goal} onChange={(e) => setGoal(e.target.value)} disabled={isSystem}>
              {GOAL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            {isSystem && <LockNote />}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">
              What this agent should NOT do <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              className={`${FIELD} resize-none`}
              rows={2}
              value={restrict}
              onChange={(e) => setRestr(e.target.value)}
              placeholder="e.g. Never offer more than 15% discount."
            />
          </div>

          <div>
            <label className={`block text-[12px] font-medium mb-2 ${isSystem ? "text-text-muted" : "text-text-secondary"}`}>
              {isSystem && <Lock className="w-3 h-3 inline mr-1" />}Store Data Access
            </label>
            <div className="space-y-2">
              {ACCESS_OPTIONS.map((o) => (
                <label key={o.value} className={`flex items-center gap-2.5 ${isSystem ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                  <input type="radio" className="accent-primary" checked={access === o.value}
                    onChange={() => !isSystem && setAccess(o.value)} disabled={isSystem} />
                  <span className="text-[13px] text-text-primary">{o.label}</span>
                </label>
              ))}
            </div>
            {isSystem && <LockNote />}
          </div>

          <div>
            <label className="block text-[12px] font-medium text-text-secondary mb-1">Success Metric</label>
            <select className={FIELD} value={metric} onChange={(e) => setMetric(e.target.value)}>
              {METRIC_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          <Toggle value={escalate} onChange={setEsc} label="Hand off to human agent if needed" />

          {/* Section D — Suggested Prompts */}
          <SectionHeading label="Suggested Prompts" />
          {prompts.map((p, i) => (
            <input
              key={i}
              className={`${FIELD} mb-2`}
              value={p}
              onChange={(e) => {
                const next = [...prompts];
                next[i] = e.target.value;
                setPrompts(next);
              }}
              placeholder={`Prompt ${i + 1}`}
            />
          ))}

          {/* Section E — Danger Zone (custom agents only) */}
          {!isSystem && (
            <div className="border border-rose-100 rounded-lg p-4 mt-2">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-rose-400 mb-3">
                Danger Zone
              </div>
              {confirmDelete ? (
                <div className="space-y-2">
                  <p className="text-[12px] text-rose-600">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleDelete}
                      className="px-3 py-1 rounded-md bg-rose-600 text-white text-[12px] font-medium hover:bg-rose-700">
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(false)}
                      className="px-3 py-1 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 text-[12px] text-rose-600 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete this agent
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sticky save */}
        <div className="flex-shrink-0 px-5 py-3 border-t border-border bg-surface">
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2 rounded-md text-white text-[13px] font-medium hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            Save Changes
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
