import React from "react";
import { Handle, Position } from "reactflow";
import { MessagesSquare, Image, Video, FileText } from "lucide-react";
import { RCS_DELIVERY_OUTPUT_OPTIONS, RCS_NUMBERS, rcsIsConnectable } from "./data/mockData";

const RCS_INDIGO = "#4F46E5";
const BORDER = "#E5E7EB";

// Resolve a variableMap entry — supports OR chain (array) or legacy string
function resolveVar(varKey, variableMap = {}) {
  const val = variableMap[varKey];
  if (!val) return null;
  if (Array.isArray(val)) return val.find((v) => v) || null;
  return val;
}

// Render RCS body text with markdown + variable highlighting
function renderBody(text, variableMap = {}) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      const varKey = part.slice(2, -2);
      const resolved = resolveVar(varKey, variableMap);
      return (
        <span
          key={i}
          style={{
            background: "#EEF2FF",
            color: RCS_INDIGO,
            padding: "0 3px",
            borderRadius: 3,
            fontFamily: "monospace",
            fontSize: 10,
          }}
        >
          {resolved ? `{{${resolved}}}` : part}
        </span>
      );
    }
    return part;
  });
}

// ── Status pill ─────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    Approved:  { bg: "#ECFDF5", color: "#065F46" },
    "In Review": { bg: "#FFFBEB", color: "#92400E" },
    Rejected:  { bg: "#FEF2F2", color: "#991B1B" },
    Draft:     { bg: "#F1F5F9", color: "#6B7280" },
    Promotional: { bg: "#EEF2FF", color: "#4338CA" },
    Transactional: { bg: "#F0FDF4", color: "#166534" },
  };
  const s = map[status] || map["Draft"];
  return (
    <span
      style={{
        fontSize: 9,
        padding: "1px 6px",
        borderRadius: 8,
        fontWeight: 600,
        background: s.bg,
        color: s.color,
        flexShrink: 0,
      }}
    >
      {status}
    </span>
  );
}

// ── Port row — position:relative so Handle can be absolute-positioned ──
// MUST be defined at module scope to avoid React unmounting on each render.
function PortRow({ portId, label, wired }) {
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
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      {/* Visual dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${wired ? RCS_INDIGO : "#CBD5E1"}`,
          background: wired ? RCS_INDIGO : "transparent",
          transition: "all 0.15s",
        }}
      />
      {/* React Flow source handle — sits on top of the visual dot */}
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

// ── Button port row (left-aligned label) ────────────────────────
// MUST be defined at module scope to avoid React unmounting on each render.
function ButtonPortRow({ portId, label, wired }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "4px 16px 4px 12px",
        minHeight: 26,
        gap: 8,
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 10,
          color: "#374151",
          fontWeight: 500,
          background: "#EEF2FF",
          borderRadius: 4,
          padding: "3px 8px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      {/* Visual dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          flexShrink: 0,
          border: `2px solid ${wired ? RCS_INDIGO : "#CBD5E1"}`,
          background: wired ? RCS_INDIGO : "transparent",
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

// ── Main node ───────────────────────────────────────────────────
export default function RCSNode({ id, data, selected }) {
  const template = data?.template ?? null;
  const outputCfg = data?.outputConfig ?? {
    routingMode: "next_step",
    deliveryOutputs: [],
    noResponseValue: 5,
    noResponseUnit: "hours",
    wiredPorts: [],
  };
  const wiredPorts = outputCfg.wiredPorts ?? [];
  const isEmpty = !template;

  // Delivery ports — based on routingMode
  const routingMode = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts =
    routingMode === "next_step"
      ? RCS_DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id === "next_step")
      : RCS_DELIVERY_OUTPUT_OPTIONS.filter((o) =>
          (outputCfg.deliveryOutputs ?? []).includes(o.id)
        );

  // Connectable buttons from template
  const connectableButtons = (template?.buttons ?? []).filter(rcsIsConnectable);

  // RCS number display
  const rcsNumber = RCS_NUMBERS.find((n) => n.id === (data?.rcsNumberId ?? "rcs_1"));
  const phoneDisplay = rcsNumber
    ? rcsNumber.number.replace(/\D/g, "").slice(-10)
    : "";

  // Delivery output label (with time config for no_response)
  const deliveryLabel = (opt) => {
    if (opt.id === "no_response") {
      return `No response after ${outputCfg.noResponseValue ?? 5} ${outputCfg.noResponseUnit ?? "hours"}`;
    }
    return opt.label;
  };

  const borderColor = isEmpty
    ? "rgba(79,70,229,0.4)"
    : template?.status === "In Review"
    ? "#F59E0B"
    : RCS_INDIGO;

  return (
    <div
      data-testid={`rf-rcs-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected
          ? "0 0 0 3px rgba(79,70,229,0.15)"
          : "0 1px 6px rgba(0,0,0,0.07)",
        width: 290,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: RCS_INDIGO, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        /* ── Empty state ── */
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
              background: RCS_INDIGO,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MessagesSquare size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>
            Send RCS
          </span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 12px",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: RCS_INDIGO,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MessagesSquare size={11} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#0F172A",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data?.label || "Send RCS"}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "#94A3B8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {template.name}
              </div>
            </div>
            {phoneDisplay && (
              <span
                style={{
                  fontSize: 8,
                  background: "#EEF2FF",
                  color: "#4338CA",
                  padding: "2px 5px",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                +{phoneDisplay}
              </span>
            )}
            <StatusPill status={template.status} />
          </div>

          {/* ── RCS message card ── */}
          <div
            style={{
              margin: "0 8px 8px",
              background: "#F0F4FF",
              borderRadius: 8,
              padding: 6,
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "8px 8px 8px 3px",
                overflow: "hidden",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              {/* Media placeholder */}
              {template.style === "single" && template.mediaType === "image" && (
                <div
                  style={{
                    height: 80,
                    background: RCS_INDIGO,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ textAlign: "center", opacity: 0.9 }}>
                    <Image size={28} color="#fff" />
                    <div style={{ fontSize: 9, color: "#fff", marginTop: 2 }}>Image</div>
                  </div>
                </div>
              )}
              {template.style === "single" && template.mediaType === "video" && (
                <div
                  style={{
                    height: 80,
                    background: "#1a1a2e",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Video size={14} color="#fff" style={{ marginLeft: 2 }} />
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 8,
                      fontSize: 9,
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    0:00
                  </span>
                </div>
              )}
              {template.style === "single" && template.mediaType === "document" && (
                <div
                  style={{
                    height: 52,
                    background: "#F1F5F9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <FileText size={16} color="#64748B" />
                  <span style={{ fontSize: 10, color: "#475569" }}>Document</span>
                </div>
              )}

              {/* Text header */}
              {template.headerText && (
                <div
                  style={{ padding: "8px 10px 0", fontSize: 11, fontWeight: 700, color: "#111" }}
                >
                  {template.headerText}
                </div>
              )}

              {/* Body */}
              {template.body && (
                <div
                  style={{
                    padding: "6px 10px",
                    fontSize: 11,
                    color: "#111",
                    lineHeight: 1.6,
                  }}
                >
                  {renderBody(template.body, data?.variableMap || {})}
                </div>
              )}

              {/* Timestamp */}
              <div
                style={{
                  textAlign: "right",
                  padding: "0 10px 6px",
                  fontSize: 9,
                  color: "#aaa",
                }}
              >
                10:30 ✓✓
              </div>
            </div>

            {/* Style badge */}
            <div style={{ textAlign: "right", marginTop: 4 }}>
              <span
                style={{
                  fontSize: 9,
                  padding: "1px 7px",
                  borderRadius: 8,
                  fontWeight: 600,
                  background: "#EEF2FF",
                  color: RCS_INDIGO,
                }}
              >
                {template.style === "basic" ? "Basic" : "Single"}
              </span>
            </div>
          </div>

          {/* ── Button response ports (output handles) ── */}
          {connectableButtons.length > 0 &&
            connectableButtons.map((btn, i) => (
              <ButtonPortRow
                key={`btn_${i}`}
                portId={`btn_${i}`}
                label={btn.label}
                wired={wiredPorts.includes(`btn_${i}`)}
              />
            ))}

          {/* ── Delivery output ports ── */}
          {activeDeliveryPorts.length > 0 && (
            <div
              style={{
                borderTop: `1px solid ${BORDER}`,
                paddingTop: 2,
                paddingBottom: 4,
              }}
            >
              {activeDeliveryPorts.map((opt) => (
                <PortRow
                  key={opt.id}
                  portId={opt.id}
                  label={deliveryLabel(opt)}
                  wired={wiredPorts.includes(opt.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
