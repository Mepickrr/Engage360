import React from "react";
import { Handle, Position } from "reactflow";
import { BrainCog } from "lucide-react";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import { NBA_GREEN, NBA_CHANNEL_OPTIONS } from "./data/mockData";

const BORDER = "#E5E7EB";

function PortRow({ portId, label, emoji, color, wired }) {
  return (
    <div style={{
      position: "relative", display: "flex", alignItems: "center",
      justifyContent: "flex-end", gap: 6, padding: "4px 16px 4px 12px", minHeight: 26,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>
        <span style={{ marginRight: 4 }}>{emoji}</span>{label}
      </span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? color : "#CBD5E1"}`,
        background: wired ? color : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute", right: -4, top: "50%",
          transform: "translateY(-50%)", width: 10, height: 10,
          background: "transparent", border: "none",
        }}
      />
    </div>
  );
}

export default function NextBestActionNode({ id, data, selected }) {
  const label      = data?.label      ?? "Next Best Action";
  const channels   = data?.channels   ?? [];
  const model      = data?.model      ?? "best_channel";
  const outputCfg  = data?.outputConfig ?? { wiredPorts: [] };
  const wiredPorts = outputCfg.wiredPorts ?? [];
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius = analyticsData ? "12px 12px 0 0" : 12;
  const isEmpty    = channels.length === 0;

  const borderColor = isEmpty ? `${NBA_GREEN}66` : NBA_GREEN;

  return (
    <div
      data-testid={`rf-nba-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: cardRadius,
        boxShadow: selected ? `0 0 0 3px ${NBA_GREEN}26` : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: NBA_GREEN, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: NBA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BrainCog size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Next Best Action</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px 6px" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: NBA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BrainCog size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>
                {model === "best_channel" ? "AI: Best Channel" : "AI: Best Channel + Time"}
              </div>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: `${NBA_GREEN}18`, color: NBA_GREEN, flexShrink: 0 }}>
              AI
            </span>
          </div>

          {/* Channel port rows */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
            {channels.map((chId) => {
              const ch = NBA_CHANNEL_OPTIONS.find((c) => c.id === chId);
              if (!ch) return null;
              return (
                <PortRow
                  key={chId}
                  portId={chId}
                  label={ch.label}
                  emoji={ch.emoji}
                  color={ch.color}
                  wired={wiredPorts.includes(chId)}
                />
              );
            })}
          </div>
        </>
      )}

      <NodeAnalyticsFooter type="nextbestaction" analyticsData={analyticsData} />
    </div>
  );
}
