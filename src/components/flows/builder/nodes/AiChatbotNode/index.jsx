import React from "react";
import { Handle, Position } from "reactflow";
import { BotMessageSquare, Globe } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { CHATBOT_TEAL, CHATBOT_TONES, AGENT_TYPES, SYSTEM_PORT_GOAL, SYSTEM_PORT_TIMEOUT } from "./data/mockData";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";

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
        border: `2px solid ${wired ? (color || CHATBOT_TEAL) : "#CBD5E1"}`,
        background: wired ? (color || CHATBOT_TEAL) : "transparent",
        transition: "all 0.15s",
      }} />
      <Handle
        id={portId} type="source" position={Position.Right}
        style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, background: "transparent", border: "none" }}
      />
    </div>
  );
}

export default function AiChatbotNode({ id, data, selected }) {
  const aiChatbotGlobal = useFlowBuilderStore((s) => s.aiChatbotGlobal);

  const label          = data?.label          ?? "AI Chatbot";
  const goal           = data?.goal           ?? "";
  const replyOptions   = data?.replyOptions   ?? [];
  const wiredPorts     = data?.wiredPorts     ?? [];

  const tone      = aiChatbotGlobal?.tone      ?? "professional";
  const agentType = aiChatbotGlobal?.agentType ?? null;

  const toneLabel  = CHATBOT_TONES.find((t) => t.id === tone)?.label ?? tone;
  const agentLabel = AGENT_TYPES.find((a) => a.id === agentType)?.label ?? null;

  const isEmpty = !goal && label === "AI Chatbot";
  const borderColor = isEmpty ? `rgba(8,145,178,0.4)` : CHATBOT_TEAL;

  const allPorts = [
    ...replyOptions.map((r) => ({ id: r.id, label: r.label, color: CHATBOT_TEAL })),
    { id: SYSTEM_PORT_GOAL,    label: "Goal achieved", color: "#10B981" },
    { id: SYSTEM_PORT_TIMEOUT, label: "No response",   color: "#94A3B8" },
  ];

  return (
    <div
      data-testid={`rf-aichatbot-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 3px rgba(8,145,178,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 280, position: "relative", overflow: "visible",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: CHATBOT_TEAL, width: 10, height: 10, top: -5 }} />

      {isEmpty ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: CHATBOT_TEAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BotMessageSquare size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>AI Chatbot</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, ${CHATBOT_TEAL} 0%, #0E7490 100%)`,
            borderRadius: "10px 10px 0 0", padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BotMessageSquare size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
            </div>
            {agentLabel && (
              <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: "rgba(255,255,255,0.2)", color: "#fff", flexShrink: 0 }}>
                {agentLabel}
              </span>
            )}
          </div>

          {/* Global row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderBottom: `1px solid ${BORDER}` }}>
            <Globe size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "#475569", flex: 1 }}>
              {agentLabel ? `${agentLabel} · ` : ""}{toneLabel}
            </span>
            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: "#ECFEFF", color: CHATBOT_TEAL }}>
              Global
            </span>
          </div>

          {/* Goal preview */}
          {goal && (
            <div style={{ margin: "6px 10px", background: "#F0FDFF", borderRadius: 6, padding: "5px 8px", borderLeft: `2px solid ${CHATBOT_TEAL}` }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: CHATBOT_TEAL, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Goal
              </div>
              <div style={{ fontSize: 10, color: "#334155", lineHeight: 1.4 }}>
                {goal.length > 65 ? goal.slice(0, 65) + "…" : goal}
              </div>
            </div>
          )}

          {/* Port rows */}
          {allPorts.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {allPorts.map((p) => (
                <PortRow key={p.id} portId={p.id} label={p.label} color={p.color} wired={wiredPorts.includes(p.id)} />
              ))}
            </div>
          )}
        </>
      )}

      {data?.analyticsData && (
        <NodeAnalyticsFooter type="aichatbot" analyticsData={data.analyticsData} />
      )}
    </div>
  );
}
