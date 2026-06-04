import React from "react";
import { Handle, Position } from "reactflow";
import { LogIn, AlertTriangle } from "lucide-react";
import { FLOW_STATUSES, MOCK_FLOWS, flowNeedsWarning } from "./data/mockData";

const ROSE   = "#F43F5E";
const BORDER = "#E5E7EB";

// Compact SVG mini-diagram shown directly on the canvas node
function MiniDiagram({ previewType, channels }) {
  const ch1Color = channels[0] === "email" ? "#3B82F6" : channels[0] === "sms" ? "#8B5CF6" : "#10B981";
  const ch2Color = channels[1] === "email" ? "#3B82F6" : channels[1] === "sms" ? "#8B5CF6" : "#10B981";

  if (previewType === "branched") {
    return (
      <svg width="214" height="68" viewBox="0 0 214 68" style={{ display: "block" }}>
        {/* Trigger */}
        <rect x="82" y="2"  width="52" height="16" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="1" />
        <text x="108" y="13" fontSize="7" fill="#7C3AED" textAnchor="middle" fontWeight="600">Trigger</text>
        {/* Line down */}
        <line x1="108" y1="18" x2="108" y2="28" stroke="#CBD5E1" strokeWidth="1" />
        {/* Condition */}
        <rect x="82" y="28" width="52" height="16" rx="4" fill="#FFFBEB" stroke="#FDE68A" strokeWidth="1" />
        <text x="108" y="39" fontSize="7" fill="#D97706" textAnchor="middle" fontWeight="600">Condition</text>
        {/* Branch lines */}
        <line x1="82"  y1="36" x2="46"  y2="36" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="46"  y1="36" x2="46"  y2="50" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="134" y1="36" x2="170" y2="36" stroke="#CBD5E1" strokeWidth="1" />
        <line x1="170" y1="36" x2="170" y2="50" stroke="#CBD5E1" strokeWidth="1" />
        {/* Left branch node */}
        <rect x="20"  y="50" width="52" height="16" rx="4" fill={`${ch1Color}18`} stroke={`${ch1Color}50`} strokeWidth="1" />
        <text x="46"  y="61" fontSize="7" fill={ch1Color} textAnchor="middle" fontWeight="600">Send msg</text>
        {/* Right branch node */}
        <rect x="144" y="50" width="52" height="16" rx="4" fill={`${ch2Color}18`} stroke={`${ch2Color}50`} strokeWidth="1" />
        <text x="170" y="61" fontSize="7" fill={ch2Color} textAnchor="middle" fontWeight="600">Send msg</text>
      </svg>
    );
  }

  if (previewType === "cart") {
    return (
      <svg width="214" height="68" viewBox="0 0 214 68" style={{ display: "block" }}>
        <rect x="82" y="2"  width="52" height="16" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="1" />
        <text x="108" y="13" fontSize="7" fill="#7C3AED" textAnchor="middle" fontWeight="600">Trigger</text>
        <line x1="108" y1="18" x2="108" y2="28" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="82" y="28" width="52" height="16" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
        <text x="108" y="39" fontSize="7" fill="#64748B" textAnchor="middle" fontWeight="600">Wait</text>
        <line x1="108" y1="44" x2="108" y2="50" stroke="#CBD5E1" strokeWidth="1" />
        <rect x="82" y="50" width="52" height="16" rx="4" fill={`${ch1Color}18`} stroke={`${ch1Color}50`} strokeWidth="1" />
        <text x="108" y="61" fontSize="7" fill={ch1Color} textAnchor="middle" fontWeight="600">Send msg</text>
      </svg>
    );
  }

  // simple
  return (
    <svg width="214" height="52" viewBox="0 0 214 52" style={{ display: "block" }}>
      <rect x="82" y="2"  width="52" height="16" rx="4" fill="#EDE9FE" stroke="#DDD6FE" strokeWidth="1" />
      <text x="108" y="13" fontSize="7" fill="#7C3AED" textAnchor="middle" fontWeight="600">Trigger</text>
      <line x1="108" y1="18" x2="108" y2="28" stroke="#CBD5E1" strokeWidth="1" />
      <rect x="82" y="28" width="52" height="16" rx="4" fill={`${ch1Color}18`} stroke={`${ch1Color}50`} strokeWidth="1" />
      <text x="108" y="39" fontSize="7" fill={ch1Color} textAnchor="middle" fontWeight="600">Send msg</text>
    </svg>
  );
}

export default function StartFlowNode({ id, data, selected }) {
  const linkedFlowId     = data?.linkedFlowId    ?? null;
  const linkedFlowName   = data?.linkedFlowName   ?? null;
  const linkedFlowStatus = data?.linkedFlowStatus ?? null;
  const label            = data?.label ?? "Start Flow";

  const isEmpty    = !linkedFlowId;
  const hasWarning = linkedFlowStatus && flowNeedsWarning(linkedFlowStatus);
  const statusMeta = FLOW_STATUSES.find((s) => s.id === linkedFlowStatus);
  const linkedFlow = MOCK_FLOWS.find((f) => f.id === linkedFlowId) ?? null;
  const borderColor = isEmpty ? "rgba(244,63,94,0.4)" : ROSE;

  return (
    <div
      data-testid={`rf-startflow-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(244,63,94,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Input handle only — terminal node, no output */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: ROSE, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: "#FFF1F2",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <LogIn size={18} color={ROSE} />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Start Flow</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to link a flow</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #F43F5E 0%, #FB7185 100%)",
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <LogIn size={13} color="#fff" />
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#fff",
              flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {label}
            </span>
          </div>

          {/* Warning banner */}
          {hasWarning && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 10px",
              background: "#FFFBEB", borderBottom: `1px solid #FDE68A`,
            }}>
              <AlertTriangle size={11} color="#D97706" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#B45309" }}>
                Linked flow is {linkedFlowStatus}
              </span>
            </div>
          )}

          {/* Flow name + status */}
          <div style={{ padding: "8px 12px 6px" }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "#1E293B",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginBottom: 5,
            }}>
              {linkedFlowName}
            </div>
            {statusMeta && statusMeta.id !== "all" && (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusMeta.dot, flexShrink: 0 }} />
                <span style={{
                  fontSize: 10, fontWeight: 600, color: statusMeta.fg,
                  padding: "1px 6px", borderRadius: 20,
                  background: statusMeta.bg, border: `1px solid ${statusMeta.border}`,
                }}>
                  {statusMeta.label}
                </span>
              </div>
            )}
          </div>

          {/* Mini flow preview diagram */}
          {linkedFlow && (
            <div style={{
              margin: "0 10px 10px",
              background: "#F8FAFC",
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              padding: "8px 0 4px",
              overflow: "hidden",
              display: "flex", justifyContent: "center",
            }}>
              <MiniDiagram
                previewType={linkedFlow.preview}
                channels={linkedFlow.channels}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
