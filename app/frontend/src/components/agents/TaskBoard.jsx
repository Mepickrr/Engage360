import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  fetchTasks,
  fetchTaskCounts,
  approveTask,
  rejectTask,
} from "@/lib/engageApi";
import { getAgentMeta, timeAgo, hexAlpha } from "@/lib/agentMeta";
import { useConversationStore } from "@/store/uiStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, CheckCircle2, Loader2, X } from "lucide-react";

function formatINR(value) {
  if (value == null) return null;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function ImpactChips({ impact }) {
  if (!impact) return null;
  const chips = [];
  if (impact.estimated_reach != null) {
    chips.push(`${new Intl.NumberFormat("en-IN").format(impact.estimated_reach)} users`);
  }
  if (impact.estimated_revenue != null) {
    chips.push(`Est. ${formatINR(impact.estimated_revenue)}`);
  }
  if (!chips.length) return null;
  return (
    <div className="flex gap-1.5 mt-1.5">
      {chips.map((c) => (
        <span
          key={c}
          className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-tint text-primary font-medium"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function OriginChip({ origin, agentName }) {
  if (origin === "seller")
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-text-secondary">
        Created by you
      </span>
    );
  if (origin === "instruction")
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-text-secondary">
        Scheduled job
      </span>
    );
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-text-secondary">
      Suggested by {agentName}
    </span>
  );
}

function ApprovalDialog({ task, onClose }) {
  const queryClient = useQueryClient();
  const openWith = useConversationStore((s) => s.openWith);
  const meta = task ? getAgentMeta(task.agent_id) : null;

  const approveMut = useMutation({
    mutationFn: approveTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-counts"] });
      onClose();
    },
  });
  const rejectMut = useMutation({
    mutationFn: rejectTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-counts"] });
      onClose();
    },
  });

  if (!task || !meta) return null;

  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg"
        data-testid={`task-approval-dialog-${task.id}`}
      >
        <DialogHeader>
          <DialogTitle className="pr-6">{task.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-semibold"
            style={{ backgroundColor: meta.color }}
          >
            {meta.name[0]}
          </div>
          <span>
            {meta.name} · {meta.title}
          </span>
        </div>

        {task.summary && (
          <p className="mt-3 text-sm text-text-secondary">{task.summary}</p>
        )}

        <ImpactChips impact={task.impact_meta} />

        <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            data-testid={`task-approval-discuss-${task.id}`}
            onClick={() => {
              onClose();
              openWith({
                seedMessage: `Walk me through this task: ${task.title}`,
                pinnedAgent: task.agent_id,
                source: "task",
              });
            }}
            className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
          >
            Discuss
          </button>
          <button
            type="button"
            data-testid={`task-approval-reject-${task.id}`}
            onClick={() => rejectMut.mutate(task.id)}
            disabled={rejectMut.isPending}
            className="px-3 py-1.5 text-[12px] rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            Reject
          </button>
          <button
            type="button"
            data-testid={`task-approval-approve-${task.id}`}
            onClick={() => approveMut.mutate(task.id)}
            disabled={approveMut.isPending}
            className="px-3 py-1.5 text-[12px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {approveMut.isPending ? "Approving..." : "Approve"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskRow({ task, status, onReview }) {
  const meta = getAgentMeta(task.agent_id);
  const Icon = meta.icon;

  return (
    <div
      data-testid={`task-row-${task.id}`}
      className="border border-border rounded-lg bg-surface px-4 py-3 flex items-start gap-3 hover:border-text-muted/40 transition-colors"
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: hexAlpha(meta.color, 0.12) }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-text-primary line-clamp-1">
          {task.title}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <OriginChip origin={task.origin} agentName={meta.name} />
          {task.schedule && (
            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted">
              <CalendarClock className="w-3 h-3" />
              {task.schedule}
            </span>
          )}
          {status === "ongoing" && task.progress_pct != null && (
            <span className="inline-flex items-center gap-1.5 text-[10px] text-text-secondary">
              <Loader2 className="w-3 h-3 animate-spin" />
              {task.progress_pct}% · {task.progress_label}
            </span>
          )}
          {status === "completed" && task.outcome_text && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700">
              <CheckCircle2 className="w-3 h-3" />
              {task.outcome_text}
            </span>
          )}
        </div>
        <ImpactChips impact={task.impact_meta} />
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-[10px] text-text-muted whitespace-nowrap">
          {timeAgo(task.updated_at)}
        </span>
        {status === "awaiting" && (
          <button
            type="button"
            data-testid={`task-review-${task.id}`}
            onClick={() => onReview(task)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
          >
            Review & Approve
          </button>
        )}
        {status === "scheduled" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              data-testid={`task-runnow-${task.id}`}
              className="px-2.5 py-1 text-[11px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
              title="Coming soon"
            >
              Run now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const TAB_STATUSES = [
  { id: "awaiting", label: "Awaiting Approval" },
  { id: "ongoing", label: "Ongoing" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Completed" },
];

export default function TaskBoard() {
  const [reviewing, setReviewing] = useState(null);
  const [tab, setTab] = useState("awaiting");

  const { data: counts = {} } = useQuery({
    queryKey: ["task-counts"],
    queryFn: fetchTaskCounts,
    staleTime: 30_000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", tab],
    queryFn: () => fetchTasks(tab),
    staleTime: 30_000,
  });

  return (
    <section data-testid="task-board">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-base font-semibold text-text-primary">Tasks</h2>
        {counts.total != null && (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary font-medium">
            {counts.total} total
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList data-testid="task-tabs">
          {TAB_STATUSES.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              data-testid={`task-tab-${t.id}`}
              className="text-[12px]"
            >
              {t.label} ({counts[t.id] ?? 0})
            </TabsTrigger>
          ))}
        </TabsList>
        {TAB_STATUSES.map((t) => (
          <TabsContent key={t.id} value={t.id} className="mt-4">
            <div className="flex flex-col gap-2.5">
              {tasks.length === 0 ? (
                <div className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
                  Nothing here yet.
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    status={t.id}
                    onReview={setReviewing}
                  />
                ))
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <ApprovalDialog task={reviewing} onClose={() => setReviewing(null)} />
    </section>
  );
}
