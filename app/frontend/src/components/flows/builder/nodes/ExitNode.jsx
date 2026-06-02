import React from "react";
import { Handle, Position } from "reactflow";
import { CircleStop, Target } from "lucide-react";

export default function ExitNode({ data, type, selected }) {
  const isGoal = type === "goal";
  const Icon = isGoal ? Target : CircleStop;
  const color = isGoal ? "#10B981" : "#64748B";
  return (
    <div
      data-testid={`rf-exit-node-${type}`}
      className={`min-w-[180px] bg-white border-2 rounded-lg shadow-sm transition-all ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      style={{ borderColor: color }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: color, width: 8, height: 8 }}
      />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color }}>
            {isGoal ? "Goal" : "End"}
          </div>
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {data?.label || (isGoal ? "Goal reached" : "End")}
          </div>
        </div>
      </div>
    </div>
  );
}
