import React from "react";
import { Handle, Position } from "reactflow";
import { Clock, SplitSquareVertical, TimerReset } from "lucide-react";

const KIND_META = {
  wait: { Icon: Clock, label: "Wait", color: "#64748B" },
  split: { Icon: SplitSquareVertical, label: "A/B Split", color: "#8B5CF6" },
  wait_until: { Icon: TimerReset, label: "Wait until", color: "#64748B" },
};

function formatDuration(min) {
  if (!min) return null;
  if (min >= 1440) return `${Math.round(min / 1440)} day${min >= 2880 ? "s" : ""}`;
  if (min >= 60) return `${Math.round(min / 60)} hour${min >= 120 ? "s" : ""}`;
  return `${min} min`;
}

export default function LogicNode({ id, data, type, selected }) {
  // The stored `type` on the node IS the kind. ReactFlow passes the type prop
  // when our nodeTypes object was registered under the same key.
  const kind = type;
  const meta = KIND_META[kind] || KIND_META.wait;
  const Icon = meta.Icon;
  const hasTwoOutputs = kind === "condition" || kind === "split";

  return (
    <div
      data-testid={`rf-logic-node-${kind}`}
      className={`min-w-[220px] bg-white border-2 rounded-lg shadow-sm transition-all ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      style={{ borderColor: meta.color }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: meta.color, width: 8, height: 8 }}
      />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: meta.color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: meta.color }}>
            {meta.label}
          </div>
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {data?.label || meta.label}
          </div>
          {kind === "wait" && data?.duration_minutes && (
            <div className="text-[10px] text-text-muted">
              {formatDuration(data.duration_minutes)}
            </div>
          )}
          {kind === "condition" && data?.field && (
            <div className="text-[10px] text-text-muted truncate">
              {data.field} {data.operator || "="} {String(data.value)}
            </div>
          )}
        </div>
      </div>

      {hasTwoOutputs ? (
        <div className="relative h-3">
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            style={{ left: "30%", background: "#10B981", width: 8, height: 8 }}
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            style={{ left: "70%", background: "#EF4444", width: 8, height: 8 }}
          />
        </div>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: meta.color, width: 8, height: 8 }}
        />
      )}
    </div>
  );
}
