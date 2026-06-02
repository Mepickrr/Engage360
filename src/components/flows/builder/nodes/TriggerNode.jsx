import React from "react";
import { Handle, Position } from "reactflow";
import { Zap, Users, Calendar, Webhook } from "lucide-react";

const TRIGGER_ICONS = {
  event: Zap,
  segment: Users,
  schedule: Calendar,
  webhook: Webhook,
};

export default function TriggerNode({ data, selected }) {
  const subtype = data?.trigger_type || "event";
  const Icon = TRIGGER_ICONS[subtype] || Zap;
  return (
    <div
      data-testid="rf-trigger-node"
      className={`min-w-[200px] bg-white border-2 rounded-lg shadow-sm transition-all ${
        selected ? "ring-2 ring-primary" : ""
      }`}
      style={{ borderColor: "#6C3AE8" }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-white"
          style={{ backgroundColor: "#6C3AE8" }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
            Trigger
          </div>
          <div className="text-[13px] font-semibold text-text-primary truncate">
            {data?.label || "Trigger"}
          </div>
          {data?.event_name && (
            <div className="text-[10px] text-text-muted truncate">
              {data.event_name}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#6C3AE8", width: 8, height: 8 }}
      />
    </div>
  );
}
