import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  updateFlow,
  publishFlow,
  pauseFlow,
  resumeFlow,
} from "@/lib/flowsApi";
import StatusPill from "@/components/flows/StatusPill";
import { ArrowLeft, Check, CircleAlert, Loader2, Pause, Play, Rocket, Save } from "lucide-react";
import { toast } from "sonner";

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
  const flowId = useFlowBuilderStore((s) => s.flowId);
  const meta = useFlowBuilderStore((s) => s.meta);
  const autosaveStatus = useFlowBuilderStore((s) => s.autosaveStatus);
  const patchMeta = useFlowBuilderStore((s) => s.patchMeta);
  const setAutosaveStatus = useFlowBuilderStore((s) => s.setAutosaveStatus);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(meta?.name || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setDraftName(meta?.name || "");
  }, [meta?.name]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

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
      toast.success("Flow is now live");
    },
  });
  const pauseMut = useMutation({
    mutationFn: () => pauseFlow(flowId),
    onSuccess: (doc) => {
      patchMeta({ status: doc.status });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow paused");
    },
  });
  const resumeMut = useMutation({
    mutationFn: () => resumeFlow(flowId),
    onSuccess: (doc) => {
      patchMeta({ status: doc.status });
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow resumed");
    },
  });

  // Manual save — bypasses the 1.5s autosave debounce. Pipes through the same
  // autosaveStatus indicator so the user sees "Saving..." → "Saved" inline.
  const saveMut = useMutation({
    mutationFn: () =>
      updateFlow(flowId, {
        nodes,
        edges,
        name: meta?.name,
        description: meta?.description,
      }),
    onMutate: () => setAutosaveStatus("saving"),
    onSuccess: () => {
      setAutosaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      setTimeout(() => setAutosaveStatus("idle"), 1500);
    },
    onError: () => setAutosaveStatus("error"),
  });

  const commitName = () => {
    setEditing(false);
    if (draftName.trim() && draftName !== meta?.name && flowId) {
      renameMut.mutate({ name: draftName.trim() });
    } else {
      setDraftName(meta?.name || "");
    }
  };

  const status = meta?.status || "draft";

  return (
    <header
      data-testid="builder-topbar"
      className="h-12 bg-surface border-b border-border flex items-center justify-between px-4 flex-shrink-0"
    >
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
            <Play className="w-3.5 h-3.5" />
            Resume
          </button>
        )}
        <button
          type="button"
          data-testid="builder-save"
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending || !flowId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-[12px] text-text-secondary hover:bg-slate-50 hover:text-primary disabled:opacity-50 transition-colors"
          title="Save now (autosave runs every 1.5s)"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        {status === "draft" && (
          <button
            type="button"
            data-testid="builder-publish"
            onClick={() => publishMut.mutate()}
            disabled={publishMut.isPending || !flowId}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-[12px] font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            <Rocket className="w-3.5 h-3.5" />
            {publishMut.isPending ? "Publishing..." : "Publish"}
          </button>
        )}
      </div>
    </header>
  );
}
