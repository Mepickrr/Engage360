import React from "react";
import { Handle, Position } from "reactflow";
import { GitFork } from "lucide-react";

const TEAL = "#0D9488";
const BORDER = "#E5E7EB";

function PortRow({ portId, label, color, wired }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        padding: "3px 16px 3px 12px",
        minHeight: 24,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: "#475569",
          whiteSpace: "nowrap",
          maxWidth: 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${wired ? color : "#CBD5E1"}`,
          background: wired ? color : "transparent",
          transition: "all 0.15s",
        }}
      />
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute",
          right: -4,
          top: "50%",
          transform: "translateY(-50%)",
          width: 10,
          height: 10,
          background: "transparent",
          border: "none",
        }}
      />
    </div>
  );
}

export default function ConditionalSplitNode({ id, data, selected }) {
  const mode = data?.mode ?? null;
  const wiredPorts = data?.wiredPorts ?? [];

  const ports = [];
  if (mode === "filter") {
    const groups = data?.filterGroups ?? [];
    groups.forEach((g, i) => {
      ports.push({ id: g.id, label: g.label || `Branch ${i + 1}`, color: TEAL });
    });
    ports.push({ id: "else", label: "Else", color: "#94A3B8" });
  } else if (mode === "ab") {
    const paths = data?.abPaths ?? [];
    paths.forEach((p) => {
      ports.push({ id: p.id, label: `${p.label}: ${p.percentage}%`, color: TEAL });
    });
  } else if (mode === "expression") {
    const exprs = data?.expressions ?? [];
    exprs.forEach((e, i) => {
      const raw = e.rawText?.trim() || e.variable || `Expression ${i + 1}`;
      ports.push({
        id: e.id,
        label: raw.length > 22 ? raw.slice(0, 20) + "…" : raw,
        color: TEAL,
      });
    });
    ports.push({ id: "false", label: "False", color: "#EF4444" });
  }

  const modeLabel = { filter: "Filter", ab: "A/B Test", expression: "Expression" }[mode] ?? null;
  const isEmpty = !mode;

  return (
    <div
      data-testid={`rf-conditionalsplit-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${isEmpty ? "rgba(13,148,136,0.4)" : TEAL}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(13,148,136,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 260,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: TEAL, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px 16px",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: TEAL,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <GitFork size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
            Conditional Split
          </span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: TEAL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <GitFork size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: TEAL,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Conditional Split
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#0F172A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data?.label || "Conditional Split"}
              </div>
            </div>
            {modeLabel && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: 10,
                  background: "#CCFBF1",
                  color: TEAL,
                  flexShrink: 0,
                }}
              >
                {modeLabel}
              </span>
            )}
          </div>

          {ports.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {ports.map((p) => (
                <PortRow
                  key={p.id}
                  portId={p.id}
                  label={p.label}
                  color={p.color}
                  wired={wiredPorts.includes(p.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
