import React from "react";
import { Handle, Position } from "reactflow";
import { Webhook } from "lucide-react";
import { WEBHOOK_OUTPUT_PORTS } from "./data/mockData";

const WEBHOOK_BLUE = "#3B82F6";
const BORDER = "#E5E7EB";

function PortRow({ portId, label, color, wired }) {
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

export default function WebhookNode({ id, data, selected }) {
  const label      = data?.label ?? "Webhook";
  const url        = data?.url ?? "";
  const method     = data?.method ?? "POST";
  const auth       = data?.auth ?? { type: "none" };
  const retry      = data?.retry ?? { enabled: false };
  const wiredPorts = data?.outputConfig?.wiredPorts ?? [];
  const isEmpty    = !url;

  const borderColor = isEmpty ? "rgba(59,130,246,0.4)" : WEBHOOK_BLUE;

  const chips = [
    auth?.type !== "none" && {
      label: auth.type === "api_key" ? "API Key" : auth.type === "bearer" ? "Bearer" : "Basic Auth",
    },
    retry?.enabled && { label: "Retry" },
  ].filter(Boolean);

  return (
    <div
      data-testid={`rf-webhook-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 3px rgba(59,130,246,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 270,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: WEBHOOK_BLUE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: WEBHOOK_BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Webhook size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Webhook</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: WEBHOOK_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Webhook size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url.replace(/^https?:\/\//, "").slice(0, 40)}
              </div>
            </div>
            <span style={{ fontSize: 8, background: "#EFF6FF", color: WEBHOOK_BLUE, padding: "2px 5px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
              {method}
            </span>
          </div>

          {/* Output ports */}
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
            {WEBHOOK_OUTPUT_PORTS.map((port) => (
              <PortRow
                key={port.id}
                portId={port.id}
                label={port.label}
                color={port.color}
                wired={wiredPorts.includes(port.id)}
              />
            ))}
          </div>

          {/* Feature chips */}
          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "6px 10px 8px", borderTop: `1px solid ${BORDER}` }}>
              {chips.map((chip, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: "#EFF6FF", color: WEBHOOK_BLUE }}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
