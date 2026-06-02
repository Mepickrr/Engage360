import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAgent, deleteAgent } from "@/lib/engageApi";
import { toast } from "sonner";
import { Lock, ChevronDown, Trash2 } from "lucide-react";

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
const TONES = ["friendly", "professional", "direct", "empathetic"];
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

function LockHint({ children }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
            <Lock className="w-3 h-3" />
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs max-w-[220px]">
          This is a system agent. Core behaviour is managed by Engage 360.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function EditAgentPanel({ agent, open, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);
  const [advOpen, setAdvOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open && agent) {
      setForm({
        name: agent.name || "",
        title: agent.title || "",
        color: agent.color || SWATCHES[2],
        specialty_tag: agent.specialty_tag || agent.domain || SPECIALTY_TAGS[0],
        status: agent.status || "active",
        tone: agent.tone || "professional",
        language_style: agent.language_style || "casual",
        emoji_usage: !!agent.emoji_usage,
        brand_voice_sample: agent.brand_voice_sample || "",
        custom_instructions: agent.custom_instructions || "",
        agent_goal: agent.agent_goal || "recovery",
        dont_do: agent.dont_do || "",
        store_data_access: agent.store_data_access || "orders_customers",
        success_metric: agent.success_metric || "revenue_recovered",
        escalation_enabled: !!agent.escalation_enabled,
        escalation_queue: agent.escalation_queue || "General Support",
        suggested_prompts: [
          agent.suggested_prompts?.[0] || "",
          agent.suggested_prompts?.[1] || "",
          agent.suggested_prompts?.[2] || "",
        ],
      });
      setAdvOpen(false);
    }
  }, [open, agent]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saveMut = useMutation({
    mutationFn: ({ id, body }) => updateAgent(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Changes saved");
      onClose();
    },
    onError: () => toast.error("Couldn't save. Try again."),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      toast.success("Agent deleted");
      setConfirmDelete(false);
      onClose();
    },
    onError: () => toast.error("Couldn't delete. Try again."),
  });

  if (!agent || !form) {
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-[540px] sm:max-w-[540px] p-0">
          <SheetTitle className="sr-only">Edit agent</SheetTitle>
        </SheetContent>
      </Sheet>
    );
  }

  const isSystem = !!agent.is_system;

  const onSave = () => {
    const payload = {
      name: form.name,
      title: form.title,
      color: form.color,
      specialty_tag: form.specialty_tag,
      domain: form.specialty_tag,
      status: form.status,
      tone: form.tone,
      language_style: form.language_style,
      emoji_usage: form.emoji_usage,
      brand_voice_sample: form.brand_voice_sample,
      dont_do: form.dont_do,
      success_metric: form.success_metric,
      escalation_enabled: form.escalation_enabled,
      escalation_queue: form.escalation_enabled ? form.escalation_queue : "",
      suggested_prompts: form.suggested_prompts
        .map((p) => p.trim())
        .filter(Boolean),
    };
    if (!isSystem) {
      payload.custom_instructions = form.custom_instructions;
      payload.agent_goal = form.agent_goal;
      payload.store_data_access = form.store_data_access;
    }
    saveMut.mutate({ id: agent.id, body: payload });
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-[540px] sm:max-w-[540px] p-0 flex flex-col"
        data-testid="edit-agent-panel"
      >
        <SheetTitle className="sr-only">Edit {agent.name}</SheetTitle>

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold"
            style={{ backgroundColor: form.color }}
          >
            {agent.avatar_initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-text-primary truncate">
              Edit {agent.name}
            </div>
            <div className="text-[11px] text-text-muted">
              {isSystem ? "System agent" : "Custom agent"}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* A. Identity */}
          <section className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
              Identity
            </h4>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Avatar color
              </label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline:
                        form.color === c
                          ? "2px solid var(--color-primary)"
                          : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Role / Title
              </label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Specialty tag
              </label>
              <Select
                value={form.specialty_tag}
                onValueChange={(v) => set("specialty_tag", v)}
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
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-medium text-text-secondary">
                  Status
                </div>
                <div className="text-[11px] text-text-muted">
                  Paused agents stop responding but stay configured.
                </div>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) => set("status", v ? "active" : "paused")}
              />
            </div>
          </section>

          {/* B. Personality & Tone */}
          <section className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
              Personality & tone
            </h4>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Tone
              </label>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5 p-1 bg-app-bg rounded-md">
                {TONES.map((t) => {
                  const on = form.tone === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("tone", t)}
                      className="py-1.5 text-xs font-medium rounded capitalize transition-colors"
                      style={{
                        backgroundColor: on ? form.color : "transparent",
                        color: on ? "white" : "var(--color-text-secondary)",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Language style
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 p-1 bg-app-bg rounded-md">
                {["formal", "casual", "hinglish"].map((s) => {
                  const on = form.language_style === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("language_style", s)}
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
                onCheckedChange={(v) => set("emoji_usage", v)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">
                Brand voice sample
              </label>
              <Textarea
                rows={2}
                value={form.brand_voice_sample}
                onChange={(e) => set("brand_voice_sample", e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            {/* Advanced custom instructions */}
            <Collapsible open={advOpen} onOpenChange={setAdvOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-1.5 text-xs font-medium text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  Custom instructions (advanced)
                  {isSystem && <LockHint>locked</LockHint>}
                </span>
                <ChevronDown
                  className="w-3.5 h-3.5 transition-transform"
                  style={{ transform: advOpen ? "rotate(180deg)" : "none" }}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Textarea
                  rows={4}
                  disabled={isSystem}
                  value={form.custom_instructions}
                  onChange={(e) => set("custom_instructions", e.target.value)}
                  placeholder="Raw additional instructions appended to the agent's prompt."
                  className="mt-1 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Use plain English. These instructions are appended to the
                  agent's core prompt.
                </p>
              </CollapsibleContent>
            </Collapsible>
          </section>

          {/* C. Scope & Guardrails */}
          <section className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
              Scope & guardrails
            </h4>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">
                  Agent goal
                </label>
                {isSystem && <LockHint>locked</LockHint>}
              </div>
              <Select
                value={form.agent_goal}
                onValueChange={(v) => set("agent_goal", v)}
                disabled={isSystem}
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
                What this agent should NOT do
              </label>
              <Textarea
                rows={2}
                value={form.dont_do}
                onChange={(e) => set("dont_do", e.target.value)}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">
                  Store data access
                </label>
                {isSystem && <LockHint>locked</LockHint>}
              </div>
              <RadioGroup
                value={form.store_data_access}
                onValueChange={(v) => set("store_data_access", v)}
                disabled={isSystem}
                className="mt-1.5 space-y-1.5"
              >
                {[
                  { v: "full", l: "Full access" },
                  { v: "orders_customers", l: "Orders & customers only" },
                  { v: "none", l: "No store data" },
                ].map((o) => (
                  <label
                    key={o.v}
                    className={`flex items-center gap-2 text-sm ${isSystem ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <RadioGroupItem value={o.v} disabled={isSystem} />
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
                onValueChange={(v) => set("success_metric", v)}
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
                onCheckedChange={(v) => set("escalation_enabled", v)}
              />
            </div>
            {form.escalation_enabled && (
              <Select
                value={form.escalation_queue}
                onValueChange={(v) => set("escalation_queue", v)}
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
          </section>

          {/* D. Suggested prompts */}
          <section className="space-y-3">
            <h4 className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">
              Suggested prompts
            </h4>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  value={form.suggested_prompts[i]}
                  onChange={(e) => {
                    const next = [...form.suggested_prompts];
                    next[i] = e.target.value.slice(0, 80);
                    set("suggested_prompts", next);
                  }}
                  maxLength={80}
                  placeholder={`Prompt ${i + 1}`}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface focus:outline-none focus:border-primary/60"
                />
              ))}
            </div>
          </section>

          {/* E. Danger zone (custom only) */}
          {!isSystem && (
            <section className="space-y-3">
              <h4 className="text-[11px] uppercase tracking-wide text-rose-600 font-semibold">
                Danger zone
              </h4>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                data-testid="edit-agent-delete"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 border border-rose-200 rounded-md hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete this agent
              </button>
            </section>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2 bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary rounded-md hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saveMut.isPending}
            data-testid="edit-agent-save"
            className="px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
            }}
          >
            {saveMut.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this agent?</AlertDialogTitle>
              <AlertDialogDescription>
                "{agent.name}" will be removed permanently. Any conversations
                already pinned to this agent will remain.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMut.mutate(agent.id)}
                className="bg-rose-600 hover:bg-rose-700"
                data-testid="edit-agent-delete-confirm"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
