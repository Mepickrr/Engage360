import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  updateFlow,
  publishFlow,
  pauseFlow,
  resumeFlow,
} from "@/lib/flowsApi";
import {
  ArrowLeft,
  CircleAlert,
  Loader2,
  Play,
  BarChart2,
  Download,
  MoreHorizontal,
  Clock,
  FlaskConical,
  BookMarked,
  Tag,
  ChevronDown,
  TriangleAlert,
  History,
  Undo2,
  Redo2,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import SaveJourneyModal from "./SaveJourneyModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";

// ── Status config ────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  draft:            { label: "Draft",           bg: "bg-slate-100", text: "text-slate-600",  dot: "bg-slate-400"  },
  active:           { label: "Live",             bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  paused:           { label: "Paused",           bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  archived:         { label: "Archive",          bg: "bg-slate-100", text: "text-slate-500",  dot: "bg-slate-300"  },
  test:             { label: "Test",             bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  completed:        { label: "Completed",        bg: "bg-sky-50",    text: "text-sky-700",    dot: "bg-sky-500"    },
  scheduled:        { label: "Scheduled",        bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  rerun_completed:  { label: "Rerun Completed",  bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500"   },
  dnd:               { label: "DND",              bg: "bg-rose-50",   text: "text-rose-700",   dot: "bg-rose-500"   },
  error:            { label: "Error",            bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
  inprogress:       { label: "In Progress",      bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500"   },
};

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Flow tag pill ────────────────────────────────────────────────────────────
export const FLOW_TAG_OPTIONS = ["Transactional", "Promotional", "Broadcast", "Retention"];

export function FlowTagPill({ tag, onClick }) {
  return (
    <button
      type="button"
      data-testid="builder-tag-pill"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-text-secondary hover:bg-slate-200 transition-colors"
    >
      <Tag className="w-3 h-3" />
      {tag || "Promotional"}
      <ChevronDown className="w-3 h-3" />
    </button>
  );
}

// ── Flow warning badge ───────────────────────────────────────────────────────
export function WarningBadge({ count, onClick }) {
  if (!count || count <= 0) return null;
  return (
    <button
      type="button"
      data-testid="builder-warning-badge"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
    >
      <TriangleAlert className="w-3 h-3" />
      {count}
    </button>
  );
}

// ── Active toggle ────────────────────────────────────────────────────────────
function ActiveToggle({ active, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      disabled={disabled}
      title={active ? "Click to pause" : "Click to activate"}
      className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none disabled:opacity-50 ${
        active ? "bg-primary" : "bg-slate-300"
      }`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${active ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

// ── Autosave / last-saved indicator ─────────────────────────────────────────
export function SaveIndicator({ status, lastSavedAt, lastSavedBy }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (status === "saving") { setLabel(""); return; }
    if (status === "error")  { setLabel(""); return; }
    if (!lastSavedAt) return;
    function compute() {
      const diff = Math.round((Date.now() - lastSavedAt) / 1000);
      if (diff < 5)   return "Just saved";
      if (diff < 60)  return `Saved ${diff}s ago`;
      const mins = Math.round(diff / 60);
      if (mins < 60)  return `Saved ${mins}m ago`;
      const hrs  = Math.round(mins / 60);
      if (hrs < 24)   return `Saved ${hrs}h ago`;
      return `Saved ${Math.round(hrs / 24)}d ago`;
    }
    setLabel(compute());
    const id = setInterval(() => setLabel(compute()), 30_000);
    return () => clearInterval(id);
  }, [status, lastSavedAt]);

  if (status === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-500">
        <CircleAlert className="w-3 h-3" /> Save failed
      </span>
    );
  if (label)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Clock className="w-3 h-3" /> {label}{lastSavedBy ? ` · ${lastSavedBy}` : ""}
      </span>
    );
  return null;
}

// ── More menu ────────────────────────────────────────────────────────────────
export function MoreMenu({ onDownload, onDownloadError }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden">
          <button
            type="button"
            onClick={() => { onDownload(); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-primary hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            Download report
          </button>
          <button
            type="button"
            onClick={() => { onDownloadError(); setOpen(false); }}
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-primary hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5 text-text-muted" />
            Download error report
          </button>
        </div>
      )}
    </div>
  );
}

// ── Version history menu ─────────────────────────────────────────────────────
export function VersionHistoryMenu({ versions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const list = versions || [];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        data-testid="builder-version-history"
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
      >
        <History className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          data-testid="builder-version-history-list"
          className="absolute right-0 top-full mt-1 w-56 bg-white border border-border rounded-lg shadow-lg z-50 py-1 overflow-hidden"
        >
          {list.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-text-muted">No live versions yet</div>
          ) : (
            list.map((v) => (
              <div key={v.id} className="px-3 py-2 text-[12px] text-text-primary">
                {v.liveAt} · {v.editedBy}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="w-px h-5 bg-border flex-shrink-0" />;
}

// ── Icon button with hover tooltip ──────────────────────────────────────────
export function TopbarIconButton({ icon: Icon, label, onClick, disabled, testId }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          data-testid={testId}
          onClick={onClick}
          disabled={disabled}
          className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-text-primary disabled:opacity-40 transition-colors"
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

// ── Main topbar ──────────────────────────────────────────────────────────────
export default function BuilderTopbar({ basePath = "/flows" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const flowId         = useFlowBuilderStore((s) => s.flowId);
  const meta           = useFlowBuilderStore((s) => s.meta);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const edges          = useFlowBuilderStore((s) => s.edges);
  const autosaveStatus = useFlowBuilderStore((s) => s.autosaveStatus);
  const patchMeta      = useFlowBuilderStore((s) => s.patchMeta);
  const setFlowId      = useFlowBuilderStore((s) => s.setFlowId);
  const setAutosaveStatus = useFlowBuilderStore((s) => s.setAutosaveStatus);

  const [editing, setEditing]       = useState(false);
  const [draftName, setDraftName]   = useState(meta?.name || "Untitled flow");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const inputRef = useRef(null);

  // Sync draft name when meta loads
  useEffect(() => { setDraftName(meta?.name || "Untitled flow"); }, [meta?.name]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  // Record timestamp whenever autosave succeeds
  useEffect(() => {
    if (autosaveStatus === "saved") setLastSavedAt(Date.now());
  }, [autosaveStatus]);

  const status = meta?.status || "draft";
  const isActive = status === "active";

  // ── Mutations ────────────────────────────────────────────────────────────
  const renameMut = useMutation({
    mutationFn: ({ name }) => updateFlow(flowId, { name }),
    onMutate: () => setAutosaveStatus("saving"),
    onSuccess: (saved) => {
      patchMeta({ name: draftName });
      if (saved?.id && saved.id !== flowId) {
        setFlowId(saved.id);
        navigate(`${basePath}/builder/${saved.id}`, { replace: true });
      }
      setAutosaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
    onError: () => setAutosaveStatus("error"),
  });

  const publishMut = useMutation({
    mutationFn: () => publishFlow(flowId),
    onSuccess: (doc) => {
      patchMeta({ status: doc.status });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow is now live 🚀");
    },
    onError: () => toast.error("Failed to publish"),
  });

  const pauseMut = useMutation({
    mutationFn: () => pauseFlow(flowId),
    onSuccess: (doc) => {
      patchMeta({ status: doc.status });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow paused");
    },
    onError: () => toast.error("Failed to pause"),
  });

  const resumeMut = useMutation({
    mutationFn: () => resumeFlow(flowId),
    onSuccess: (doc) => {
      patchMeta({ status: doc.status });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow resumed");
    },
    onError: () => toast.error("Failed to resume"),
  });

  const saveMut = useMutation({
    mutationFn: () =>
      updateFlow(flowId, { nodes, edges, name: meta?.name, description: meta?.description }),
    onMutate: () => setAutosaveStatus("saving"),
    onSuccess: (saved) => {
      // Seed converted to real/local copy — update store ID and URL
      if (saved?.id && saved.id !== flowId) {
        setFlowId(saved.id);
        navigate(`${basePath}/builder/${saved.id}`, { replace: true });
        toast.success("Flow saved — you can now find it in your flows list");
      }
      setAutosaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
    },
    onError: () => setAutosaveStatus("error"),
  });

  const [saveJourneyOpen, setSaveJourneyOpen] = useState(false);

  // Derive trigger event name from the first trigger node in the canvas
  const triggerEventName = (() => {
    const triggerNode = nodes.find(
      (n) => n.type === "trigger" || n.type === "startTrigger" || n.id === "start",
    );
    return (
      triggerNode?.data?.event_name ||
      triggerNode?.data?.groups?.[0]?.event ||
      ""
    );
  })();

  // ── Handlers ──────────────────────────────────────────────────────────────
  const commitName = () => {
    setEditing(false);
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== meta?.name && flowId) {
      renameMut.mutate({ name: trimmed });
    } else {
      setDraftName(meta?.name || "Untitled flow");
    }
  };

  const handleToggle = () => {
    if (!flowId) return;
    if (isActive) pauseMut.mutate();
    else if (status === "paused") resumeMut.mutate();
    else setSaveJourneyOpen(true); // draft → open Save Journey modal
  };

  const handleGoLive = (payload) => {
    patchMeta({ goals: payload.goals, attributionWindow: payload.attributionWindow });
    publishMut.mutate();
  };

  const handleTestMode = (payload) => {
    patchMeta({ goals: payload.goals, status: "test" });
    toast.info("Test mode activated — the flow will run for selected test profiles");
  };

  const handlePreview = () => {
    toast.info("Journey preview coming soon");
  };

  const handleDownloadReport = () => {
    toast.info("Generating report…");
  };

  const handleDownloadErrorReport = () => {
    toast.info("Generating error report…");
  };

  const handleUndo = () => {
    toast.info("Undo coming soon");
  };

  const handleRedo = () => {
    toast.info("Redo coming soon");
  };

  const handleViewChats = () => {
    toast.info("Customer chat view coming soon");
  };

  const handleTagClick = () => {
    toast.info("Flow tag editing coming soon");
  };

  const handleWarningClick = () => {
    toast.info("Flow issue list coming soon");
  };

  const hasBeenLive = status !== "draft";

  const saving = saveMut.isPending || renameMut.isPending;

  return (
    <TooltipProvider delayDuration={150}>
      <header
        data-testid="builder-topbar"
        className="h-[52px] bg-surface border-b border-border flex items-center justify-between px-3 gap-3 flex-shrink-0"
      >
        {/* ── Left group ── */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            data-testid="builder-back"
            onClick={() => navigate(basePath)}
            className="p-1.5 rounded-md hover:bg-slate-100 text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Divider />

          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") { setEditing(false); setDraftName(meta?.name || "Untitled flow"); }
              }}
              data-testid="builder-name-input"
              className="text-[14px] font-semibold text-text-primary bg-transparent border-b-2 border-primary outline-none max-w-[260px]"
            />
          ) : (
            <button
              type="button"
              data-testid="builder-name"
              onClick={() => flowId && setEditing(true)}
              title="Click to rename"
              className="text-[14px] font-semibold text-text-primary hover:text-primary truncate max-w-[240px] transition-colors"
              disabled={!flowId}
            >
              {meta?.name || "Untitled flow"}
            </button>
          )}

          <FlowTagPill tag={meta?.tag} onClick={handleTagClick} />

          <ActiveToggle
            active={isActive}
            disabled={!flowId || pauseMut.isPending || resumeMut.isPending || publishMut.isPending}
            onToggle={handleToggle}
          />

          <StatusBadge status={status} />

          <WarningBadge count={meta?.warningCount} onClick={handleWarningClick} />
        </div>

        {/* ── Center: last saved ── */}
        <div className="flex-shrink-0">
          <SaveIndicator status={autosaveStatus} lastSavedAt={lastSavedAt} lastSavedBy={meta?.updated_by_name || "You"} />
        </div>

        {/* ── Right group ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <TopbarIconButton icon={Undo2} label="Undo" testId="builder-undo" onClick={handleUndo} />
          <TopbarIconButton icon={Redo2} label="Redo" testId="builder-redo" onClick={handleRedo} />

          {hasBeenLive && (
            <>
              <Divider />
              <VersionHistoryMenu versions={[]} />
              <TopbarIconButton
                icon={BarChart2}
                label="View Analytics"
                testId="builder-analytics"
                disabled={!flowId}
                onClick={() => navigate(`/flows/builder/${flowId}/analytics`)}
              />
              <TopbarIconButton
                icon={MessageCircle}
                label="View all Customer Chat"
                testId="builder-chats"
                onClick={handleViewChats}
              />
            </>
          )}

          <Divider />

          {status === "active" && (
            <button
              type="button"
              data-testid="builder-pause"
              onClick={() => pauseMut.mutate()}
              disabled={pauseMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Pause
            </button>
          )}
          {status === "paused" && (
            <button
              type="button"
              data-testid="builder-resume"
              onClick={() => resumeMut.mutate()}
              disabled={resumeMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Resume
            </button>
          )}

          <TopbarIconButton icon={Play} label="Preview Flow" testId="builder-play" disabled={!flowId} onClick={handlePreview} />
          <TopbarIconButton icon={FlaskConical} label="Test Mode" testId="builder-test" disabled={!flowId} onClick={() => setSaveJourneyOpen(true)} />

          <button
            type="button"
            data-testid="builder-save-journey"
            onClick={() => setSaveJourneyOpen(true)}
            disabled={!flowId}
            className="inline-flex items-center gap-1.5 px-4 h-8 rounded-md bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BookMarked className="w-3.5 h-3.5" />
            )}
            Save Journey
          </button>

          <MoreMenu onDownload={handleDownloadReport} onDownloadError={handleDownloadErrorReport} />
        </div>

        <SaveJourneyModal
          open={saveJourneyOpen}
          onClose={() => setSaveJourneyOpen(false)}
          triggerEventName={triggerEventName}
          onGoLive={handleGoLive}
          onTestMode={handleTestMode}
          onPreview={handlePreview}
        />
      </header>
    </TooltipProvider>
  );
}
