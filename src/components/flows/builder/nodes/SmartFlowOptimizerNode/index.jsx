import React from "react";
import { Handle, Position } from "reactflow";
import { Route } from "lucide-react";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import { SFO_INDIGO, SFO_CHANNEL_OPTIONS } from "./data/mockData";

const BORDER = "#E5E7EB";

function BranchPortRow({ branch, wired }) {
  const ch = SFO_CHANNEL_OPTIONS.find((c) => c.id === branch.channel);
  return (
    <div style={{
      position: "relative", display: "flex", alignItems: "center",
      justifyContent: "flex-end", gap: 6, padding: "4px 16px 4px 12px", minHeight: 26,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>
        {ch ? <span style={{ marginRight: 4 }}>{ch.emoji}</span> : null}
        {branch.label}
      </span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? (ch?.color ?? SFO_INDIGO) : "#CBD5E1"}`,
        background: wired ? (ch?.color ?? SFO_INDIGO) : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={branch.id}
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

export default function SmartFlowOptimizerNode({ id, data, selected }) {
  const label      = data?.label      ?? "Smart Flow Optimizer";
  const branches   = data?.branches   ?? [];
  const distribution = data?.distribution ?? "auto";
  const optimizeFor  = data?.optimizeFor  ?? "ctr";
  const outputCfg  = data?.outputConfig ?? { wiredPorts: [] };
  const wiredPorts = outputCfg.wiredPorts ?? [];
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius = analyticsData ? "12px 12px 0 0" : 12;
  const isEmpty    = branches.length === 0;

  const borderColor = isEmpty ? `${SFO_INDIGO}66` : SFO_INDIGO;

  const distLabel = { auto: "Auto-optimise", equal: "Equal split", manual: "Manual" }[distribution] ?? "Auto";
  const goalLabel = { ctr: "CTR", conversion: "Conversion", revenue: "Revenue" }[optimizeFor] ?? "CTR";

  return (
    <div
      data-testid={`rf-sfo-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: cardRadius,
        boxShadow: selected ? `0 0 0 3px ${SFO_INDIGO}26` : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: SFO_INDIGO, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: SFO_INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Route size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Smart Flow Optimizer</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px 6px" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: SFO_INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Route size={12} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8" }}>
                {distLabel} · Optimise {goalLabel}
              </div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: `${SFO_INDIGO}18`, color: SFO_INDIGO, fontWeight: 700, flexShrink: 0 }}>
              {branches.length} branches
            </span>
          </div>

          {/* Branch port rows */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
            {branches.map((branch) => (
              <BranchPortRow
                key={branch.id}
                branch={branch}
                wired={wiredPorts.includes(branch.id)}
              />
            ))}
          </div>
        </>
      )}

      <NodeAnalyticsFooter type="smartflowoptimizer" analyticsData={analyticsData} />
    </div>
  );
}
