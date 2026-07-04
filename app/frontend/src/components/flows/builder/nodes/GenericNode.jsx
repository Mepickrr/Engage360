// Generic fallback node renderer for palette nodes that don't have a
// dedicated renderer yet (AI Calling, AI Content, Judge Me,
// etc.). Keeps drag-drop & selection working without any feature logic.
import React from "react";
import { Handle, Position } from "reactflow";
import * as LucideIcons from "lucide-react";

const NODE_W = 200;

export default function GenericNode({ data }) {
  const IconComp = (data?.icon && LucideIcons[data.icon]) || LucideIcons.Box;
  const color = data?.color || "#64748B";
  return (
    <div
      style={{ width: NODE_W }}
      className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden"
      data-testid={`canvas-generic-node-${data?.subtype || "x"}`}
    >
      <Handle type="target" position={Position.Top} />
      <div
        className="px-3 py-2 flex items-center gap-2 text-white"
        style={{ backgroundColor: color }}
      >
        <IconComp className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {data?.category || "Component"}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <div className="text-sm font-semibold text-text-primary truncate">
          {data?.label || "Component"}
        </div>
        <div className="text-[11px] text-text-muted italic mt-0.5">
          Configuration coming soon
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
