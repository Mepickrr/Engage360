import React from "react";
import {
  Workflow,
  Clock,
  GitBranch,
  Flag,
  CheckCircle2,
  Mail,
  MessageCircle,
  Bell,
  MessageSquare,
} from "lucide-react";

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageSquare,
  push: Bell,
};

const NODE_TYPE_META = {
  trigger: { Icon: Flag, label: "Trigger", color: "#6C3AE8" },
  wait: { Icon: Clock, label: "Wait", color: "#94A3B8" },
  channel: { Icon: MessageCircle, label: "Channel", color: "#10B981" },
  condition: { Icon: GitBranch, label: "Condition", color: "#F59E0B" },
  end: { Icon: CheckCircle2, label: "End", color: "#64748B" },
};

function formatINR(value) {
  if (value == null) return "—";
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function NodeBox({ node, index, total }) {
  const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META.channel;
  const Icon = meta.Icon;
  const ChannelIcon = node.channel ? CHANNEL_ICONS[node.channel] : null;
  return (
    <div className="relative">
      <div
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white"
        style={{ borderColor: meta.color + "55" }}
        data-testid={`flow-node-${node.id}`}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white flex-shrink-0"
          style={{ backgroundColor: meta.color }}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
            {meta.label}
            {node.branch ? ` · branch: ${node.branch}` : ""}
          </div>
          <div className="text-[13px] text-text-primary font-medium truncate">
            {node.label}
          </div>
          {node.duration_minutes && (
            <div className="text-[10px] text-text-muted mt-0.5">
              {node.duration_minutes >= 60
                ? `${Math.round(node.duration_minutes / 60)} hours`
                : `${node.duration_minutes} min`}
            </div>
          )}
        </div>
        {ChannelIcon && (
          <div
            className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-text-secondary inline-flex items-center gap-1 flex-shrink-0"
            title={node.channel}
          >
            <ChannelIcon className="w-3 h-3" />
            {node.channel}
          </div>
        )}
      </div>
      {index < total - 1 && (
        <div className="flex justify-center my-1.5">
          <div className="w-px h-4 bg-border" />
        </div>
      )}
    </div>
  );
}

export default function FlowBriefPreview({ payload, onApprove, onReject, onRequestChanges }) {
  if (!payload) return null;
  return (
    <div className="flex flex-col h-full" data-testid="flow-brief-preview">
      <div className="px-5 py-4 border-b border-border bg-surface">
        <div className="flex items-start gap-2">
          <Workflow className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-semibold text-text-primary">
              {payload.name}
            </h3>
            <p className="text-[12px] text-text-secondary mt-1">{payload.goal}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="px-2 py-1 rounded-md bg-slate-50 border border-border text-[11px]">
            <span className="text-text-muted">Segment:</span>{" "}
            <span className="font-medium text-text-primary">
              {payload.segment?.name}
            </span>
          </span>
          <span className="px-2 py-1 rounded-md bg-slate-50 border border-border text-[11px]">
            <span className="text-text-muted">Audience:</span>{" "}
            <span className="font-medium text-text-primary">
              {new Intl.NumberFormat("en-IN").format(
                payload.segment?.estimated_users || 0,
              )}{" "}
              users
            </span>
          </span>
          <span className="px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px]">
            <span className="text-emerald-700">Est. impact:</span>{" "}
            <span className="font-semibold text-emerald-800">
              {formatINR(payload.estimated_revenue_impact)}
            </span>
          </span>
        </div>

        <div className="mt-2 flex gap-1.5">
          {(payload.channels || []).map((c) => {
            const Icon = CHANNEL_ICONS[c] || MessageCircle;
            return (
              <span
                key={c}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary-tint text-primary text-[10px] font-medium"
              >
                <Icon className="w-3 h-3" />
                {c}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
          Flow sequence
        </div>
        {(() => {
          const nodes = Array.isArray(payload.nodes) ? payload.nodes : [];
          return nodes.map((n, i) => (
            <NodeBox key={n.id || i} node={n} index={i} total={nodes.length} />
          ));
        })()}
      </div>

      <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-end gap-2">
        <button
          type="button"
          data-testid="flow-reject"
          onClick={onReject}
          className="px-3 py-1.5 text-[12px] rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          Reject
        </button>
        <button
          type="button"
          data-testid="flow-request-changes"
          onClick={onRequestChanges}
          className="px-3 py-1.5 text-[12px] rounded-md border border-border text-text-secondary hover:bg-slate-50"
        >
          Request changes
        </button>
        <button
          type="button"
          data-testid="flow-approve"
          onClick={onApprove}
          className="px-3 py-1.5 text-[12px] font-medium rounded-md bg-primary text-white hover:bg-primary-hover"
        >
          Approve and build
        </button>
      </div>
    </div>
  );
}
