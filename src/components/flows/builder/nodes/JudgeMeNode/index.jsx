import React from "react";
import { Handle, Position } from "reactflow";
import { Star } from "lucide-react";

const ORANGE = "#F97316";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const GREEN  = "#16A34A";
const AMBER  = "#D97706";
const RED    = "#DC2626";

const CHANNEL_LABELS = {
  whatsapp:  "💬 WhatsApp",
  rcs:       "📱 RCS",
  instagram: "📸 Instagram",
};

function Bubble({ text }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: "10px 10px 10px 2px",
      padding: "5px 8px",
      fontSize: 10,
      color: "#374151",
      lineHeight: 1.4,
      maxWidth: "100%",
      wordBreak: "break-word",
    }}>
      {text}
    </div>
  );
}

function OutputHandle({ id, label, color, style = {} }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      justifyContent: "flex-end",
      ...style,
    }}>
      <span style={{ fontSize: 9, color: "#64748B", fontWeight: 600 }}>{label}</span>
      <Handle
        type="source"
        position={Position.Right}
        id={id}
        style={{
          background: color, width: 10, height: 10,
          position: "relative", top: "auto", right: "auto",
          transform: "none", flexShrink: 0,
        }}
      />
    </div>
  );
}

export default function JudgeMeNode({ id, data, selected }) {
  const channel     = data?.channel ?? null;
  const isConfigured = !!channel;

  const ratingQ  = data?.ratingQuestion  ?? "";
  const reviewQ  = data?.reviewQuestion  ?? "";
  const imageEnabled = data?.imageEnabled ?? false;
  const imageQ   = data?.imageQuestion   ?? "";
  const productVar = data?.productVar ?? null;

  return (
    <div
      data-testid={`rf-judgeme-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isConfigured ? "solid" : "dashed"} ${isConfigured ? ORANGE : "rgba(249,115,22,0.4)"}`,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 3px rgba(249,115,22,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 240,
        position: "relative",
        overflow: "visible",
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: ORANGE, width: 10, height: 10, top: -5 }}
      />

      {!isConfigured ? (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", padding: "20px 16px", gap: 8,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: ORANGE,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Star size={18} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Judge.me Review</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{
            background: `linear-gradient(135deg, #EA580C 0%, ${ORANGE} 100%)`,
            borderRadius: "10px 10px 0 0",
            padding: "8px 12px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Star size={12} color="#fff" fill="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {data?.label ?? "Collect Review"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Judge.me Review
              </div>
            </div>
          </div>

          {/* Meta row */}
          <div style={{ padding: "6px 10px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 600, color: ORANGE,
              background: "#FFF7ED", border: "1px solid #FED7AA",
              borderRadius: 20, padding: "1px 7px",
            }}>
              {CHANNEL_LABELS[channel] ?? channel}
            </span>
          </div>

          {/* Step chips */}
          <div style={{ padding: "5px 10px", display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${BORDER}` }}>
            {[
              { label: "⭐ Rating", always: true },
              { label: "✍️ Review", always: true },
              { label: "🖼️ Image", always: false, enabled: imageEnabled },
            ].map(({ label, always, enabled }) => (
              <span key={label} style={{
                fontSize: 9, padding: "2px 6px", borderRadius: 20,
                background: (always || enabled) ? "#FFF7ED" : "#F8FAFC",
                color: (always || enabled) ? ORANGE : MUTED,
                border: `1px solid ${(always || enabled) ? "#FED7AA" : BORDER}`,
              }}>
                {label}
              </span>
            ))}
          </div>

          {/* Inline bubble preview */}
          <div style={{
            padding: "8px 10px", background: "#F8FAFC",
            display: "flex", flexDirection: "column", gap: 4,
            borderBottom: `1px solid ${BORDER}`,
          }}>
            {ratingQ && <Bubble text={ratingQ.length > 70 ? ratingQ.slice(0, 70) + "…" : ratingQ} />}
            {reviewQ && <Bubble text={reviewQ.length > 70 ? reviewQ.slice(0, 70) + "…" : reviewQ} />}
            {imageEnabled && imageQ && <Bubble text={imageQ.length > 70 ? imageQ.slice(0, 70) + "…" : imageQ} />}
          </div>

          {/* Product variable */}
          {productVar && (
            <div style={{ padding: "4px 10px 6px", borderBottom: `1px solid ${BORDER}` }}>
              <span style={{ fontSize: 9, color: MUTED }}>product_id → </span>
              <span style={{ fontSize: 9, color: "#3B82F6", fontFamily: "monospace" }}>{`{{${productVar}}}`}</span>
            </div>
          )}
        </>
      )}

      {/* Output handles */}
      <div style={{ padding: "8px 10px 10px", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <OutputHandle id="success"          label="Success"          color={GREEN} />
        <OutputHandle id="skipped"          label="Skipped"          color={AMBER} />
        <OutputHandle id="submission_failed" label="Submission Failed" color={RED}   />
      </div>
    </div>
  );
}
