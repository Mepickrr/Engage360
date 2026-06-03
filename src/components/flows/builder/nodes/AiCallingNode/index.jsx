import React from "react";
import { Handle, Position } from "reactflow";
import { PhoneCall, Globe, Pencil } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { VOICE_PERSONAS, TONES } from "./data/mockData";

const INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";

// PortRow — module-scope to avoid React unmounting on each render
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

export default function AiCallingNode({ id, data, selected }) {
  const aiCallingGlobal = useFlowBuilderStore((s) => s.aiCallingGlobal);

  const outputs = data?.outputs ?? [];
  const wiredPorts = data?.wiredPorts ?? [];
  const script = data?.script ?? "";
  const label = data?.label ?? "AI Call";

  const voiceId = aiCallingGlobal?.voiceId ?? "varsha";
  const tone = aiCallingGlobal?.tone ?? "professional";

  const persona = VOICE_PERSONAS.find((p) => p.id === voiceId);
  const toneLabel = TONES.find((t) => t.id === tone)?.label ?? tone;

  const isEmpty = !script && label === "AI Call";

  const borderColor = isEmpty ? `rgba(79,70,229,0.4)` : INDIGO;

  return (
    <div
      data-testid={`rf-aicalling-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 3px rgba(79,70,229,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: INDIGO, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PhoneCall size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>AI Call</span>
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
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PhoneCall size={13} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </div>
            </div>
            {data?.onEdit && (
              <button
                type="button"
                onClick={data.onEdit}
                style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4, padding: "3px 5px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}
              >
                <Pencil size={10} color="#fff" />
              </button>
            )}
          </div>

          {/* ── Global voice/tone row ── */}
          {persona && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderBottom: `1px solid ${BORDER}` }}>
              <Globe size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "#475569", flex: 1 }}>
                {persona.name} · {toneLabel}
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: "#EEF2FF", color: INDIGO }}>
                Global
              </span>
            </div>
          )}

          {/* ── Script preview ── */}
          {script && (
            <div style={{ margin: "6px 10px", background: "#F8FAFC", borderRadius: 6, padding: "5px 8px" }}>
              <div style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace", lineHeight: 1.5 }}>
                {script.length > 80 ? script.slice(0, 80) + "…" : script}
              </div>
            </div>
          )}

          {/* ── Output port rows ── */}
          {outputs.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {outputs.map((out) => (
                <PortRow
                  key={out.id}
                  portId={out.id}
                  label={out.label}
                  wired={wiredPorts.includes(out.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
