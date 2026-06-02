import React from "react";
import { CHANNEL_META } from "@/lib/flowMeta";

export default function ChannelChip({ channel }) {
  const meta = CHANNEL_META[channel];
  if (!meta) return null;
  const Icon = meta.Icon;
  return (
    <span
      data-testid={`channel-chip-${channel}`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ color: meta.color, backgroundColor: `${meta.color}15` }}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}
