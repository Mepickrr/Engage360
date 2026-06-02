import React from "react";
import { Handle, Position } from "reactflow";
import { CHANNEL_META } from "@/lib/flowMeta";

export default function ChannelNode({ data, selected }) {
  const channel = data?.channel || "whatsapp";
  const meta = CHANNEL_META[channel] || CHANNEL_META.whatsapp;
  const Icon = meta.Icon;
  return (
    <div
      data-testid={`rf-channel-node-${channel}`}
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
            {data?.label || `Send ${meta.label}`}
          </div>
          {data?.body && (
            <div className="text-[10px] text-text-muted line-clamp-1 italic">
              "{data.body.slice(0, 40)}..."
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: meta.color, width: 8, height: 8 }}
      />
    </div>
  );
}
