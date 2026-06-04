import React from "react";
import { Handle, Position } from "reactflow";
import { Brain } from "lucide-react";
import { PREDICTION_TYPES, THRESHOLD_META } from "./data/mockData";

const VIOLET = "#6D28D9";
const BORDER  = "#E5E7EB";

// Module-scope — prevents React unmounting on re-render
function BranchRow({ portId, label, threshold, wired }) {
  const meta = THRESHOLD_META[threshold] ?? null;
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "4px 16px 4px 12px", minHeight: 26,
    }}>
      {/* Threshold pill */}
      {meta && (
        <span style={{
          fontSize: 9, fontWeight: 700,
          padding: "1px 6px", borderRadius: 20,
          background: meta.bg, color: meta.color,
          border: `1px solid ${meta.border}`,
          flexShrink: 0,
        }}>
          {meta.label}
        </span>
      )}
      {/* Branch label */}
      <span style={{
        fontSize: 10, color: "#475569",
        flex: 1, textAlign: "right",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        marginLeft: 6,
      }}>
        {label}
      </span>
      {/* Port dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginLeft: 6,
        border: `2px solid ${wired ? (meta?.color ?? VIOLET) : "#CBD5E1"}`,
        background: wired ? (meta?.color ?? VIOLET) : "transparent",
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

export default function AiPredictNode({ id, data, selected }) {
  const predType   = PREDICTION_TYPES.find((p) => p.id === data?.predictionType);
  const branches   = data?.branches ?? [];
  const wiredPorts = data?.wiredPorts ?? [];
  const label      = data?.label ?? "AI Predict";
  const isEmpty    = !data?.predictionType;
  const borderColor = isEmpty ? `rgba(109,40,217,0.4)` : VIOLET;

  return (
    <div
      data-testid={`rf-aipredict-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(109,40,217,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: VIOLET, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%", background: VIOLET,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Brain size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>AI Predict</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Brain size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {label}
              </div>
              {predType && (
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                  {predType.label}
                  {data?.predictionType === "custom" && data?.customEvent ? ` · ${data.customEvent}` : ""}
                </div>
              )}
            </div>
          </div>

          {/* Branch output rows — exactly what's configured */}
          {branches.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {branches.map((b) => (
                <BranchRow
                  key={b.id}
                  portId={b.id}
                  label={b.label}
                  threshold={b.threshold}
                  wired={wiredPorts.includes(b.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
