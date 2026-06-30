import React from "react";
import { Handle, Position } from "reactflow";
import { PhoneCall, Phone, Target, Mic } from "lucide-react";
import { OUTPUT_PORTS_BY_TYPE, AGENT_TYPES, VOICES, PHONE_NUMBERS } from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// Defined at module scope so ReactFlow never remounts handles on re-render
function PortRow({ portId, label, wired, isFirst }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
      opacity: wired ? 1 : 0.45,
      borderTop: isFirst ? `1px solid ${BORDER}` : "none",
    }}>
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? INDIGO : "#CBD5E1"}`,
        background: wired ? INDIGO : "transparent",
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

function InfoRow({ Icon, text }) {
  if (!text) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px" }}>
      <Icon size={11} color={MUTED} style={{ flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {text}
      </span>
    </div>
  );
}

export default function AiCallingV2Node({ id, data, selected }) {
  const agentType   = data?.agentType   ?? "";
  const voiceBuild  = data?.voiceBuild  ?? "";
  const phoneNumber = data?.phoneNumber ?? "";
  const voice       = data?.voice       ?? "varsha";
  const outputMode  = data?.outputMode  ?? "next";
  const wiredPorts  = data?.wiredPorts  ?? [];
  const label       = data?.label       ?? "AI Calling";

  const isEmpty = !agentType;

  const agentTypeLabel  = AGENT_TYPES.find((t) => t.value === agentType)?.label ?? "";
  const voiceLabel      = VOICES.find((v) => v.value === voice)?.label ?? "";
  const phoneLabel      = PHONE_NUMBERS.find((p) => p.value === phoneNumber)?.label ?? phoneNumber;

  const ports = agentType ? (OUTPUT_PORTS_BY_TYPE[agentType] ?? []) : [];
  const intentPorts     = ports.filter((p) => p.group === "intent");
  const connectionPorts = ports.filter((p) => p.group === "connection");

  const borderColor = isEmpty ? "rgba(79,70,229,0.4)" : INDIGO;

  return (
    <div
      data-testid={`rf-aicallingv2-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(79,70,229,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 280,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: INDIGO, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        /* ── Empty state ── */
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: INDIGO,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <PhoneCall size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>AI Calling</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{
            background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <PhoneCall size={13} color="#fff" />
            </div>
            <span style={{
              flex: 1, fontSize: 11, fontWeight: 700, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </div>

          {/* ── Info rows ── */}
          <div style={{ borderBottom: `1px solid ${BORDER}`, paddingTop: 4, paddingBottom: 4 }}>
            <InfoRow Icon={Phone}  text={phoneLabel ? `Squadstack · ${phoneLabel}` : "Squadstack"} />
            <InfoRow Icon={Target} text={[agentTypeLabel, voiceBuild].filter(Boolean).join(" · ")} />
            <InfoRow Icon={Mic}    text={voiceLabel} />
          </div>

          {/* ── Output ports (branch mode only) ── */}
          {outputMode === "branch" && ports.length > 0 && (
            <div style={{ paddingBottom: 4 }}>
              {intentPorts.map((port, i) => (
                <PortRow
                  key={port.id}
                  portId={port.id}
                  label={port.label}
                  wired={wiredPorts.includes(port.id)}
                  isFirst={i === 0}
                />
              ))}
              {connectionPorts.length > 0 && (
                <>
                  <div style={{ height: 1, background: BORDER, margin: "2px 12px" }} />
                  {connectionPorts.map((port) => (
                    <PortRow
                      key={port.id}
                      portId={port.id}
                      label={port.label}
                      wired={wiredPorts.includes(port.id)}
                      isFirst={false}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Single bottom source handle (next mode) */}
      {(outputMode === "next" || !agentType) && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: INDIGO, width: 10, height: 10, bottom: -5 }}
        />
      )}
    </div>
  );
}
