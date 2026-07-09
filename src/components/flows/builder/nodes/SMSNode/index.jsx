import React, { useState } from "react";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import { Handle, Position } from "reactflow";
import { MessageSquare } from "lucide-react";
import { SMS_DELIVERY_OPTIONS, SMS_GATEWAYS } from "./data/mockData";
import NodeHoverActions from "../shared/NodeHoverActions";

const SMS_PURPLE = "#6366F1";
const BORDER     = "#E5E7EB";

function renderBody(text, variableMap = {}) {
  const parts = text.split(/(\{\{[^}]+\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{[^}]+\}\}$/.test(part)) {
      const varKey = part.slice(2, -2);
      const resolved = (variableMap[varKey] && Array.isArray(variableMap[varKey]))
        ? variableMap[varKey].find(Boolean)
        : variableMap[varKey];
      return (
        <span key={i} style={{ background: "#EEF2FF", color: SMS_PURPLE, padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>
          {resolved ? `{{${resolved}}}` : part}
        </span>
      );
    }
    return part;
  });
}

function StatusPill({ status }) {
  const map = {
    "Approved":  { bg: "#ECFDF5", color: "#065F46" },
    "Pending":   { bg: "#FFFBEB", color: "#92400E" },
    "Rejected":  { bg: "#FEF2F2", color: "#991B1B" },
    "Draft":     { bg: "#F1F5F9", color: "#6B7280" },
  };
  const s = map[status] || map["Draft"];
  return (
    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0 }}>
      {status}
    </span>
  );
}

function PortRow({ portId, label, wired }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? SMS_PURPLE : "#CBD5E1"}`,
        background: wired ? SMS_PURPLE : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute", right: -4, top: "50%",
          transform: "translateY(-50%)",
          width: 10, height: 10,
          background: "transparent", border: "none",
        }}
      />
    </div>
  );
}

export default function SMSNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false);
  const template   = data?.template ?? null;
  const label      = data?.label ?? "Send SMS";
  const outputCfg  = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const wiredPorts = outputCfg.wiredPorts ?? [];
  const isEmpty    = !template;

  const routingMode         = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts = routingMode === "next_step"
    ? SMS_DELIVERY_OPTIONS.filter((o) => o.id === "next_step")
    : SMS_DELIVERY_OPTIONS.filter((o) => (outputCfg.deliveryOutputs ?? []).includes(o.id));

  const gateway     = SMS_GATEWAYS.find((g) => g.id === template?.gateway);
  const borderColor   = isEmpty ? "rgba(99,102,241,0.4)" : SMS_PURPLE;
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius    = analyticsData ? "12px 12px 0 0" : 12;

  const chips = [
    data?.utm?.enabled        && { label: "UTM" },
    data?.aiBestTime          && { label: "AI Best Time" },
    data?.smartRetry?.enabled && { label: "Smart Retry" },
  ].filter(Boolean);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHoverActions nodeId={id} visible={hovered || selected} channel="sms" />
      <div
        data-testid={`rf-sms-node-${id}`}
        style={{
          background: "#fff",
          border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
          borderRadius: cardRadius,
          boxShadow: selected ? "0 0 0 3px rgba(99,102,241,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
          width: 270,
          position: "relative",
          overflow: "visible",
        }}
      >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: SMS_PURPLE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: SMS_PURPLE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Send SMS</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: SMS_PURPLE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MessageSquare size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template.name}
              </div>
            </div>
            {gateway && (
              <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4, flexShrink: 0, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {gateway.label.split(" - ")[0]}
              </span>
            )}
            <StatusPill status={template.status} />
          </div>

          {/* SMS bubble */}
          <div style={{ margin: "0 8px 8px", background: "#F1F5F9", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 11, color: "#1E293B", lineHeight: 1.55, wordBreak: "break-word" }}>
              {renderBody(template.body || "", data?.variableMap || {})}
            </div>
            <div style={{ textAlign: "right", marginTop: 4, fontSize: 9, color: "#94A3B8" }}>
              SMS · {template.body?.length ?? 0} chars
            </div>
          </div>

          {/* Delivery output ports */}
          {activeDeliveryPorts.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {activeDeliveryPorts.map((opt) => (
                <PortRow key={opt.id} portId={opt.id} label={opt.label} wired={wiredPorts.includes(opt.id)} />
              ))}
            </div>
          )}

          {/* Feature chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px 8px", borderTop: `1px solid ${BORDER}` }}>
              {chips.map((chip, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "#EEF2FF", color: SMS_PURPLE }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <NodeAnalyticsFooter type="sms" analyticsData={analyticsData} />
      </div>
    </div>
  );
}
