import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAgent } from "@/lib/engageApi";
import { toast } from "sonner";
import { Check } from "lucide-react";

const SWATCHES = [
  "#10B981",
  "#EC4899",
  "#8B5CF6",
  "#3B82F6",
  "#64748B",
  "#F59E0B",
  "#14B8A6",
  "#F43F5E",
];

const SPECIALTY_TAGS = [
  "Recovery & Remarketing",
  "Copy & Brand Voice",
  "Segments & Cohorts",
  "Diagnostics & Reports",
  "Journeys & Automation",
  "Setup & Integrations",
  "Custom",
];

const TONES = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "direct", label: "Direct" },
  { id: "empathetic", label: "Empathetic" },
];

const PREVIEW_BY_TONE = {
  friendly:
    "Hey! Looks like you left something behind 🛒 Want me to send your cart back to you?",
  professional:
    "Hi, we noticed an incomplete order in your cart. Would you like to complete the purchase?",
  direct: "You left items in your cart. Complete checkout now?",
  empathetic:
    "We get it — life gets busy. Your cart's saved if you want to come back to it.",
};

const GOALS = [
  { id: "recovery", label: "Recovery" },
  { id: "retention", label: "Retention" },
  { id: "discovery", label: "Discovery" },
  { id: "support", label: "Support" },
  { id: "custom", label: "Custom" },
];

const METRICS = [
  { id: "revenue_recovered", label: "Revenue recovered" },
  { id: "conversion_rate", label: "Conversion rate" },
  { id: "csat", label: "CSAT" },
  { id: "flow_completion", label: "Flow completion" },
];

const QUEUES = ["General Support", "Tech Support", "Sales"];

const initialForm = {
  name: "",
  title: "",
  color: SWATCHES[2],
  specialty_tag: SPECIALTY_TAGS[0],
  tone: "professional",
  language_style: "casual",
  emoji_usage: false,
  brand_voice_sample: "",
  agent_goal: "recovery",
  dont_do: "",
  store_data_access: "orders_customers",
  success_metric: "revenue_recovered",
  escalation_enabled: false,
  escalation_queue: "General Support",
  suggested_prompts: ["", "", ""],
  visibility: "shown",
};

export default function BuildAgentModal({ open, onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const qc = useQueryClient();

  const reset = () => {
    setStep(1);
    setForm(initialForm);
  };

  const close = () => {
    onClose();
    // Small delay so the user doesn't see step reset before unmount.
    setTimeout(reset, 200);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setPrompt = (i, v) =>
    setForm((f) => {
      const next = [...f.suggested_prompts];
      next[i] = v;
      return { ...f, suggested_prompts: next };
    });

  const createMut = useMutation({
    mutationFn: createAgent,
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success(`${doc.name} is ready. Say hello.`);
      close();
    },
    onError: () => toast.error("Couldn't create agent. Try again."),
  });

  const submit = () => {
    const payload = {
      ...form,
      domain: form.specialty_tag,
      suggested_prompts: form.suggested_prompts
        .map((p) => p.trim())
        .filter(Boolean),
      escalation_queue: form.escalation_enabled ? form.escalation_queue : "",
    };
    createMut.mutate(payload);
  };

  const canNext1 = form.name.trim().length > 0;

  const previewText =
    (PREVIEW_BY_TONE[form.tone] || PREVIEW_BY_TONE.professional) +
    (form.emoji_usage ? " 😊" : "");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent
        className="max-w-xl max-h-[90vh] overflow-y-auto"
        data-testid="build-agent-modal"
      >
        <DialogTitle className="text-lg font-semibold">
          Build your agent
        </DialogTitle>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-1 mb-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-1.5 flex-1 rounded-full transition-colors"
              style={{
                backgroundColor:
                  n <= step ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
          <span className="text-[11px] text-text-muted ml-2 whitespace-nowrap">
            Step {step} of 3
          </span>
        </div>

        {step === 1 && (
          <div className="space-y-4" data-testid="build-agent-step-1">
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Agent Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                data-testid="build-agent-name"
                placeholder="e.g. Naina"
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Avatar Color
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setField("color", c)}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline:
                        form.color === c
                          ? "2px solid var(--color-primary)"
                          : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                    aria-label={c}
                  >
                    {form.color === c && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Role / Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Refund concierge"
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Specialty Tag
              </label>
              <Select
                value={form.specialty_tag}
                onValueChange={(v) => setField("specialty_tag", v)}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTY_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4" data-testid="build-agent-step-2">
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Tone
              </label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5 p-1 bg-app-bg rounded-md">
                {TONES.map((t) => {
                  const on = form.tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setField("tone", t.id)}
                      className="py-1.5 text-xs font-medium rounded transition-colors"
                      style={{
                        backgroundColor: on ? form.color : "transparent",
                        color: on ? "white" : "var(--color-text-secondary)",
                      }}
                      data-testid={`build-agent-tone-${t.id}`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Language Style
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 p-1 bg-app-bg rounded-md">
                {["formal", "casual", "hinglish"].map((s) => {
                  const on = form.language_style === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setField("language_style", s)}
                      className="py-1.5 text-xs font-medium rounded capitalize transition-colors"
                      style={{
                        backgroundColor: on
                          ? "var(--color-primary)"
                          : "transparent",
                        color: on ? "white" : "var(--color-text-secondary)",
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">
                Emoji usage
              </label>
              <Switch
                checked={form.emoji_usage}
                onCheckedChange={(v) => setField("emoji_usage", v)}
                data-testid="build-agent-emoji"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Brand voice sample (optional)
              </label>
              <Textarea
                rows={2}
                value={form.brand_voice_sample}
                onChange={(e) =>
                  setField("brand_voice_sample", e.target.value)
                }
                placeholder='e.g. "Warm, witty, never pushy."'
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Agent goal
              </label>
              <Select
                value={form.agent_goal}
                onValueChange={(v) => setField("agent_goal", v)}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                What this agent should NOT do (optional)
              </label>
              <Textarea
                rows={2}
                value={form.dont_do}
                onChange={(e) => setField("dont_do", e.target.value)}
                placeholder="e.g. Never quote pricing, never promise delivery dates."
                className="mt-1 text-sm"
              />
            </div>
            {/* Live preview */}
            <div className="mt-2 border border-border rounded-md p-3 bg-app-bg">
              <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium mb-2">
                Live preview · checkout recovery
              </div>
              <div className="text-[11px] text-text-secondary mb-1">
                {form.name || "Your agent"}
              </div>
              <div
                className="inline-block max-w-full px-3 py-2 rounded-lg text-sm text-emerald-900"
                style={{ backgroundColor: "#DCFCE7" }}
                data-testid="build-agent-preview"
              >
                {previewText}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4" data-testid="build-agent-step-3">
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Store data access
              </label>
              <RadioGroup
                value={form.store_data_access}
                onValueChange={(v) => setField("store_data_access", v)}
                className="mt-1.5 space-y-1.5"
              >
                {[
                  { v: "full", l: "Full access" },
                  { v: "orders_customers", l: "Orders & customers only" },
                  { v: "none", l: "No store data" },
                ].map((o) => (
                  <label
                    key={o.v}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <RadioGroupItem value={o.v} />
                    {o.l}
                  </label>
                ))}
              </RadioGroup>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Success metric
              </label>
              <Select
                value={form.success_metric}
                onValueChange={(v) => setField("success_metric", v)}
              >
                <SelectTrigger className="mt-1 h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRICS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-text-secondary">
                Escalation rule
              </label>
              <Switch
                checked={form.escalation_enabled}
                onCheckedChange={(v) => setField("escalation_enabled", v)}
              />
            </div>
            {form.escalation_enabled && (
              <Select
                value={form.escalation_queue}
                onValueChange={(v) => setField("escalation_queue", v)}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUEUES.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Suggested prompts (optional)
              </label>
              <div className="mt-1.5 space-y-2">
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    value={form.suggested_prompts[i]}
                    onChange={(e) => setPrompt(i, e.target.value.slice(0, 80))}
                    placeholder={`Prompt ${i + 1}`}
                    maxLength={80}
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-text-secondary">
                  Show on homepage
                </div>
                <div className="text-[11px] text-text-muted">
                  Toggle off to hide from Meet Your Team.
                </div>
              </div>
              <Switch
                checked={form.visibility === "shown"}
                onCheckedChange={(v) =>
                  setField("visibility", v ? "shown" : "hidden")
                }
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-border">
          <button
            type="button"
            onClick={step === 1 ? close : () => setStep(step - 1)}
            className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
            data-testid="build-agent-back"
          >
            {step === 1 ? "Cancel" : "Back"}
          </button>
          <div className="flex items-center gap-2">
            {step === 3 && (
              <button
                type="button"
                onClick={close}
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !canNext1}
                data-testid={`build-agent-next-${step}`}
                className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
                }}
              >
                {step === 1
                  ? "Next → Personality"
                  : "Next → Scope & Access"}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={createMut.isPending}
                data-testid="build-agent-create"
                className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
                }}
              >
                {createMut.isPending ? "Creating…" : "Create Agent"}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
