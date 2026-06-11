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
import StatusPill from "@/components/flows/StatusPill";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Loader2,
  Pause,
  Play,
  FlaskConical,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import SaveJourneyModal from "./SaveJourneyModal";

function SaveIndicator({ status }) {
  if (status === "saving")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
        <Loader2 className="w-3 h-3 animate-spin" /> Saving...
      </span>
    );
  if (status === "saved")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
        <Check className="w-3 h-3" /> Saved
      </span>
    );
  if (status === "error")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600">
        <CircleAlert className="w-3 h-3" /> Save failed
      </span>
    );
  return null;
}

export default function BuilderTopbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const flowId        = useFlowBuilderStore((s) => s.flowId);
  const meta          = useFlowBuilderStore((s) => s.meta);
  const nodes         = useFlowBuilderStore((s) => s.nodes);
  const autosaveStatus = useFlowBuilderStore((s) => s.autosaveStatus);
  const patchMeta     = useFlowBuilderStore((s) => s.patchMeta);
  const setAutosaveStatus = useFlowBuilderStore((s) => s.setAutosaveStatus);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(meta?.name || "");
  const [saveJourneyOpen, setSaveJourneyOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraftName(meta?.name || ""); }, [meta?.name]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  // Derive trigger event name from first trigger node on canvas
  const triggerEventName = (() => {
    const triggerNode = nodes?.find(
      (n) => n.type === "trigger" || n.type === "startTrigger" || n.id === "start",
    );
    return (
      triggerNode?.data?.event_name ||
      triggerNode?.data?.groups?.[0]?.event ||
      ""
    );
  })();

  const renameMut = useMutation({
    mutationFn: ({ name }) => updateFlow(flowId, { name }),
    onMutate: () => setAutosaveStatus("saving"),
    onSuccess: () => {
      setAutosaveStatus("saved");
      patchMeta({ name: draftName });
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

  const commitName = () => {
    setEditing(false);
    if (draftName.trim() && draftName !== meta?.name && flowId) {
      renameMut.mutate({ name: draftName.trim() });
    } else {
      setDraftName(meta?.name || "");
    }
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

  const status = meta?.status || "draft";

  return (
    <header
      data-testid="builder-topbar"
      className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0"
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          data-testid="builder-back"
          onClick={() => navigate("/flows")}
          className="p-1.5 rounded-md hover:bg-slate-100 text-text-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setEditing(false);
                  setDraftName(meta?.name || "");
                }
              }}
              data-testid="builder-name-input"
              className="text-[15px] font-semibold text-text-primary bg-transparent border-b border-primary outline-none min-w-[280px]"
            />
          ) : (
            <button
              type="button"
              data-testid="builder-name"
              onClick={() => flowId && setEditing(true)}
              className="text-[15px] font-semibold text-text-primary hover:text-primary truncate max-w-[420px]"
              disabled={!flowId}
            >
              {meta?.name || "Untitled flow"}
            </button>
          )}
          <StatusPill status={status} testId="builder-status-pill" />
          <SaveIndicator status={autosaveStatus} />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {status === "active" && (
          <button
            type="button"
            data-testid="builder-pause"
            onClick={() => pauseMut.mutate()}
            disabled={pauseMut.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            data-testid="builder-resume"
            onClick={() => resumeMut.mutate()}
            disabled={resumeMut.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50"
          >
            Resume
          </button>
        )}

        {/* Play preview */}
        <button
          type="button"
          data-testid="builder-play"
          onClick={handlePreview}
          disabled={!flowId}
          title="Preview journey"
          className="w-8 h-8 rounded-md flex items-center justify-center border border-border text-text-secondary hover:bg-slate-50 hover:text-primary disabled:opacity-40 transition-colors"
        >
          <Play className="w-3.5 h-3.5" />
        </button>

        {/* Test */}
        <button
          type="button"
          data-testid="builder-test"
          onClick={() => setSaveJourneyOpen(true)}
          disabled={!flowId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 bg-blue-50 text-blue-700 text-[12px] font-semibold hover:bg-blue-100 disabled:opacity-40 transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Test
        </button>

        {/* Save Journey */}
        <button
          type="button"
          data-testid="builder-save-journey"
          onClick={() => setSaveJourneyOpen(true)}
          disabled={!flowId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-[12px] font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors"
        >
          <BookMarked className="w-3.5 h-3.5" />
          Save Journey
        </button>
      </div>

      {/* Save Journey Modal */}
      <SaveJourneyModal
        open={saveJourneyOpen}
        onClose={() => setSaveJourneyOpen(false)}
        triggerEventName={triggerEventName}
        onGoLive={handleGoLive}
        onTestMode={handleTestMode}
        onPreview={handlePreview}
      />
    </header>
  );
}
