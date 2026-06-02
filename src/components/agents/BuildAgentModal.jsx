import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronRight, ChevronLeft, Check, Lock } from "lucide-react";
import { toast } from "sonner";

const PRIMARY = "#6C3AE8";

const AVATAR_COLORS = [
  "#10B981", "#3B82F6", "#8B5CF6", "#EC4899",
  "#F59E0B", "#14B8A6", "#F43F5E", "#64748B",
];

const SPECIALTY_OPTIONS = [
  "Recovery & Remarketing",
  "Copy & Brand Voice",
  "Segments & Cohorts",
  "Diagnostics & Reports",
  "Journeys & Automation",
  "Setup & Integrations",
  "Custom",
];

const TONE_OPTIONS = ["Friendly", "Professional", "Direct", "Empathetic"];
const LANGUAGE_OPTIONS = ["Formal", "Casual", "Hinglish"];
const GOAL_OPTIONS = ["Recovery", "Retention", "Discovery", "Support", "Custom"];
const METRIC_OPTIONS = ["Revenue recovered", "Conversion rate", "CSAT", "Flow completion"];
const ACCESS_OPTIONS = [
  { value: "full",     label: "Full store access" },
  { value: "orders",   label: "Orders & customers only" },
  { value: "none",     label: "No data access" },
];

function livePreview(name, tone, lang, goal) {
  const n = name || "Your Agent";
  const emoji = tone === "Friendly" ? " 👋" : "";
  if (tone === "Professional") {
    return `Dear {{first_name}}, This is ${n} from TSPKARIX. We noticed your ${goal === "Recovery" ? "order is incomplete" : "account needs attention"}. I can assist you at your convenience.`;
  }
  if (tone === "Direct") {
    return `Hey ${emoji}, ${n} here. ${goal === "Recovery" ? "Your cart has items waiting. Complete your order now →" : "Let's get this sorted fast."}`;
  }
  if (tone === "Empathetic") {
    return `Hi {{first_name}}${emoji}, I'm ${n}. I know life gets busy — just wanted to make sure you didn't miss out on ${goal === "Recovery" ? "completing your order" : "what matters"}.`;
  }
  // Friendly (default)
  return `Hey {{first_name}}${emoji} I'm ${n}. ${goal === "Recovery" ? "You left something in your cart! Want me to help you pick up where you left off?" : "I'm here to help — just ask me anything!"}`;
}

function ProgressBar({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                s < step ? "bg-emerald-500 text-white" :
                s === step ? "text-white" : "bg-slate-100 text-text-muted"
              }`}
              style={s === step ? { backgroundColor: PRIMARY } : {}}
            >
              {s < step ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <span className={`text-[11px] font-medium ${s === step ? "text-text-primary" : "text-text-muted"}`}>
              {s === 1 ? "Identity" : s === 2 ? "Personality" : "Scope"}
            </span>
          </div>
          {s < 3 && <div className={`flex-1 h-px ${s < step ? "bg-emerald-400" : "bg-border"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function Toggle({ value, onChange, label }) {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-[13px] text-text-secondary">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${value ? "bg-primary" : "bg-slate-200"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

function SegmentedPicker({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
            value === opt
              ? "border-primary text-primary bg-primary/5"
              : "border-border text-text-muted hover:border-text-muted/60"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

const FIELD = "w-full px-3 py-2 rounded-md border border-border bg-white text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/60";

export default function BuildAgentModal({ open, onClose, onCreated }) {
  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName]       = useState("");
  const [color, setColor]     = useState(AVATAR_COLORS[0]);
  const [title, setTitle]     = useState("");
  const [specialty, setSpec]  = useState(SPECIALTY_OPTIONS[0]);

  // Step 2
  const [tone, setTone]           = useState("Friendly");
  const [lang, setLang]           = useState("Casual");
  const [emoji, setEmoji]         = useState(true);
  const [brandVoice, setBrand]    = useState("");
  const [goal, setGoal]           = useState("Recovery");
  const [restrictions, setRestr]  = useState("");

  // Step 3
  const [access, setAccess]       = useState("full");
  const [metric, setMetric]       = useState("Revenue recovered");
  const [escalate, setEscalate]   = useState(false);
  const [prompts, setPrompts]     = useState(["", "", ""]);
  const [visible, setVisible]     = useState(true);

  const resetAll = () => {
    setStep(1);
    setName(""); setColor(AVATAR_COLORS[0]); setTitle(""); setSpec(SPECIALTY_OPTIONS[0]);
    setTone("Friendly"); setLang("Casual"); setEmoji(true); setBrand(""); setGoal("Recovery"); setRestr("");
    setAccess("full"); setMetric("Revenue recovered"); setEscalate(false); setPrompts(["","",""]); setVisible(true);
  };

  const handleClose = () => { resetAll(); onClose(); };

  const handleCreate = () => {
    const agentName = name.trim() || "Custom Agent";
    const newAgent = {
      id: `custom-${Date.now()}`,
      name: agentName,
      title: title.trim() || "Custom Agent",
      domain: specialty,
      color,
      avatar_initials: agentName.charAt(0).toUpperCase(),
      bio: `${agentName} is a custom AI agent focused on ${goal.toLowerCase()}. Tone: ${tone}. Language: ${lang}.`,
      suggested_prompts: prompts.filter(Boolean),
      isCustom: true,
    };
    onCreated(newAgent);
    toast.success(`${agentName} is ready. Say hello.`);
    handleClose();
  };

  const preview = livePreview(name, tone, lang, goal);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" data-testid="build-agent-modal">
        <DialogTitle className="sr-only">Build Your Agent</DialogTitle>
        <button type="button" onClick={handleClose} className="absolute right-3 top-3 p-1 rounded-md hover:bg-slate-100 text-text-muted">
          <X className="w-4 h-4" />
        </button>

        <div className="pt-1">
          <h2 className="text-[17px] font-semibold text-text-primary mb-1">Build Your Agent</h2>
          <p className="text-[12px] text-text-muted mb-5">Configure a custom AI agent for your team.</p>
          <ProgressBar step={step} />

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Agent Name</label>
                <input
                  className={FIELD}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sneha, RetentionBot, My Growth Agent"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-2">Avatar Color</label>
                <div className="flex gap-2 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? "border-text-primary scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Role / Title</label>
                <input
                  className={FIELD}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Retention Specialist, Offer Manager"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Specialty</label>
                <select
                  className={FIELD}
                  value={specialty}
                  onChange={(e) => setSpec(e.target.value)}
                >
                  {SPECIALTY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── Step 2: Personality ── */}
          {step === 2 && (
            <div className="space-y-4">
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
                  placeholder="Paste 1–2 messages your brand has sent before. The agent will learn your style."
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Agent Goal</label>
                <select className={FIELD} value={goal} onChange={(e) => setGoal(e.target.value)}>
                  {GOAL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">
                  What this agent should NOT do <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <textarea
                  className={`${FIELD} resize-none`}
                  rows={2}
                  value={restrictions}
                  onChange={(e) => setRestr(e.target.value)}
                  placeholder="e.g. Never offer more than 15% discount. Don't mention competitor brands."
                />
              </div>

              {/* Live preview */}
              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium mb-2">
                  Here's how {name || "your agent"} would open a conversation…
                </div>
                <div className="inline-block max-w-[280px] bg-white border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-[12px] text-text-primary leading-relaxed shadow-sm">
                  {preview}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Scope & Access ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-2">Store Data Access</label>
                <div className="space-y-2">
                  {ACCESS_OPTIONS.map((o) => (
                    <label key={o.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        className="accent-primary"
                        checked={access === o.value}
                        onChange={() => setAccess(o.value)}
                      />
                      <span className="text-[13px] text-text-primary">{o.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-1">Success Metric</label>
                <select className={FIELD} value={metric} onChange={(e) => setMetric(e.target.value)}>
                  {METRIC_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>

              <Toggle value={escalate} onChange={setEscalate} label="Hand off to human agent if needed" />

              <div>
                <label className="block text-[12px] font-medium text-text-secondary mb-2">
                  Suggested Prompts <span className="text-text-muted font-normal">(up to 3)</span>
                </label>
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
                    placeholder={`e.g. ${["Where am I leaking revenue?", "Who are my best customers?", "What should I send this weekend?"][i]}`}
                  />
                ))}
              </div>

              <Toggle value={visible} onChange={setVisible} label="Show on homepage" />
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button type="button" onClick={handleClose} className="text-[12px] text-text-muted hover:text-text-secondary px-2">
              Cancel
            </button>
          </div>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-md text-white text-[12px] font-medium hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-4 py-1.5 rounded-md bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700"
            >
              Create Agent
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
