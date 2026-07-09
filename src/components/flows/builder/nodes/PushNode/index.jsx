import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Bell } from "lucide-react";
import { PUSH_DELIVERY_OPTIONS, PUSH_TEMPLATE_STYLES } from "./data/mockData";
import NodeHoverActions from "../shared/NodeHoverActions";

const AMBER  = "#F59E0B";
const BORDER = "#E5E7EB";

function PortRow({ portId, label, wired }) {
  const color = { clicked: "#3B82F6", dismissed: "#94A3B8", delivered: "#10B981" }[portId] ?? AMBER;
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
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
          transform: "translateY(-50%)",
          width: 10, height: 10,
          background: "transparent", border: "none",
        }}
      />
    </div>
  );
}

// Mini Mac-style notification preview on the canvas node
function MiniNotification({ title, body }) {
  return (
    <div style={{
      margin: "0 8px 8px",
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(10px)",
      borderRadius: 10,
      boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      padding: "8px 10px",
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 6, background: AMBER,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Bell size={14} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#1E293B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title || "Notification Title"}
        </div>
        <div style={{ fontSize: 9, color: "#64748B", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {body || "Notification message"}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0 }}>
        <div style={{ fontSize: 8, padding: "1px 6px", background: "#F1F5F9", borderRadius: 3, color: "#64748B", cursor: "pointer" }}>Close</div>
        <div style={{ fontSize: 8, padding: "1px 6px", background: "#F1F5F9", borderRadius: 3, color: "#64748B", cursor: "pointer" }}>Settings</div>
      </div>
    </div>
  );
}

export default function PushNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false);
  const template   = data?.template ?? null;
  const label      = data?.label ?? "Push Notification";
  const outputCfg  = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const wiredPorts = outputCfg.wiredPorts ?? [];
  const isEmpty    = !template;

  const routingMode         = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts = routingMode === "next_step"
    ? PUSH_DELIVERY_OPTIONS.filter((o) => o.id === "next_step")
    : PUSH_DELIVERY_OPTIONS.filter((o) => (outputCfg.deliveryOutputs ?? []).includes(o.id));

  const styleMeta   = PUSH_TEMPLATE_STYLES.find((s) => s.id === template?.style);
  const borderColor = isEmpty ? "rgba(245,158,11,0.4)" : AMBER;

  const chips = [
    data?.aiBestTime          && { label: "AI Best Time" },
    data?.smartRetry?.enabled && { label: "Smart Retry" },
    template?.utm?.enabled    && { label: "UTM" },
  ].filter(Boolean);

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHoverActions nodeId={id} visible={hovered || selected} channel="push" />
      <div
        data-testid={`rf-push-node-${id}`}
        style={{
          background: "#fff",
          border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
          borderRadius: 12,
          boxShadow: selected ? "0 0 0 3px rgba(245,158,11,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
          width: 270,
          position: "relative",
          overflow: "visible",
        }}
      >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: AMBER, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Push Notification</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Bell size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template.name}
              </div>
            </div>
            {styleMeta && (
              <span style={{ fontSize: 8, background: "#FFFBEB", color: "#92400E", padding: "2px 5px", borderRadius: 4, flexShrink: 0 }}>
                {styleMeta.name.split(" ").slice(0, 2).join(" ")}
              </span>
            )}
          </div>

          {/* Notification preview */}
          <MiniNotification title={template.title} body={template.body} />

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
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "#FFFBEB", color: "#92400E" }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
