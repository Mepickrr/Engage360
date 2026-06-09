import React from "react";
import { Handle, Position } from "reactflow";
import { Smartphone } from "lucide-react";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import {
  INAPP_VIOLET, INAPP_DISPLAY_TYPES, INAPP_DELIVERY_OPTIONS, INAPP_PLATFORM_OPTIONS,
} from "./data/mockData";

const BORDER = "#E5E7EB";

function DisplayTypePill({ displayType }) {
  const dt = INAPP_DISPLAY_TYPES.find((d) => d.id === displayType);
  if (!dt) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8,
      background: `${INAPP_VIOLET}18`, color: INAPP_VIOLET, flexShrink: 0,
    }}>
      {dt.emoji} {dt.label}
    </span>
  );
}

function PlatformPills({ platforms = [] }) {
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {platforms.map((pid) => {
        const p = INAPP_PLATFORM_OPTIONS.find((o) => o.id === pid);
        if (!p) return null;
        return (
          <span key={pid} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 6, background: "#F1F5F9", color: "#64748B", fontWeight: 600 }}>
            {p.icon} {p.label}
          </span>
        );
      })}
    </div>
  );
}

function PortRow({ portId, label, wired }) {
  return (
    <div style={{
      position: "relative", display: "flex", alignItems: "center",
      justifyContent: "flex-end", gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? INAPP_VIOLET : "#CBD5E1"}`,
        background: wired ? INAPP_VIOLET : "transparent",
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

export default function InAppNode({ id, data, selected }) {
  const template     = data?.template ?? null;
  const displayType  = data?.displayType ?? null;
  const label        = data?.label ?? "InApp Message";
  const platforms    = data?.platforms ?? ["android", "ios"];
  const triggerType  = data?.triggerType ?? "screen_load";
  const triggerDelay = data?.triggerDelay ?? 0;
  const outputCfg    = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const wiredPorts   = outputCfg.wiredPorts ?? [];
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius   = analyticsData ? "12px 12px 0 0" : 12;
  const isEmpty      = !template && !displayType;

  const routingMode        = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts = routingMode === "next_step"
    ? INAPP_DELIVERY_OPTIONS.filter((o) => o.id === "next_step")
    : INAPP_DELIVERY_OPTIONS.filter((o) => (outputCfg.deliveryOutputs ?? []).includes(o.id));

  const borderColor = isEmpty ? `${INAPP_VIOLET}66` : INAPP_VIOLET;

  const triggerLabel = {
    screen_load:   "On screen load",
    session_start: "On session start",
    custom_event:  "On custom event",
  }[triggerType] || "On screen load";

  return (
    <div
      data-testid={`rf-inapp-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: cardRadius,
        boxShadow: selected ? `0 0 0 3px ${INAPP_VIOLET}26` : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: INAPP_VIOLET, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: INAPP_VIOLET, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Smartphone size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>InApp Message</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: INAPP_VIOLET, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Smartphone size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template?.name || "No template"}
              </div>
            </div>
            {displayType && <DisplayTypePill displayType={displayType} />}
          </div>

          {/* Template preview strip */}
          {template && (
            <div style={{ margin: "0 8px 8px", borderRadius: 8, overflow: "hidden", border: `1px solid ${BORDER}` }}>
              <div style={{ height: 36, background: template.thumbnailBg ?? "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18 }}>
                  {INAPP_DISPLAY_TYPES.find((d) => d.id === displayType)?.emoji || "📱"}
                </span>
              </div>
            </div>
          )}

          {/* Trigger + platform row */}
          <div style={{ margin: "0 8px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            <span style={{ fontSize: 10, color: "#64748B", background: "#F8FAFC", borderRadius: 5, padding: "2px 7px", border: `1px solid ${BORDER}`, flexShrink: 0 }}>
              {triggerLabel}{triggerDelay > 0 ? ` +${triggerDelay}s` : ""}
            </span>
            <PlatformPills platforms={platforms} />
          </div>

          {/* Delivery ports */}
          {activeDeliveryPorts.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {activeDeliveryPorts.map((opt) => (
                <PortRow key={opt.id} portId={opt.id} label={opt.label} wired={wiredPorts.includes(opt.id)} />
              ))}
            </div>
          )}
        </>
      )}

      <NodeAnalyticsFooter type="inapp" analyticsData={analyticsData} />
    </div>
  );
}
