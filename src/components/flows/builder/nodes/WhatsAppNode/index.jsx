import React from "react";
import { Handle, Position } from "reactflow";
import { DELIVERY_OUTPUT_OPTIONS, isConnectable, WABA_NUMBERS } from "./data/mockTemplates";

const WA_GREEN = "#25D366";
const BORDER   = "#E5E7EB";

// ── Status pill ─────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    "Active":    { bg: "#ECFDF5", color: "#065F46" },
    "In Review": { bg: "#FFFBEB", color: "#92400E" },
    "Fallback":  { bg: "#FFFBEB", color: "#92400E" },
    "Rejected":  { bg: "#FEF2F2", color: "#991B1B" },
    "Paused":    { bg: "#F1F5F9", color: "#475569" },
    "Draft":     { bg: "#F1F5F9", color: "#6B7280" },
  };
  const s = map[status] || map["Draft"];
  return (
    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, fontWeight: 600, background: s.bg, color: s.color, flexShrink: 0 }}>
      {status}
    </span>
  );
}

// ── Port row — position:relative so Handle can be absolute-positioned ──
// MUST be defined at module scope to avoid React unmounting on each render.
function PortRow({ portId, label, wired, children }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", justifyContent: "flex-end",
      gap: 6, padding: "3px 16px 3px 12px", minHeight: 24,
    }}>
      {children}
      <span style={{ fontSize: 10, color: "#475569", whiteSpace: "nowrap" }}>{label}</span>
      {/* Visual dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? WA_GREEN : "#CBD5E1"}`,
        background: wired ? WA_GREEN : "transparent",
        transition: "all 0.15s",
      }} />
      {/* React Flow source handle — sits on top of the visual dot */}
      <Handle
        id={portId}
        type="source"
        position={Position.Right}
        style={{
          position: "absolute", right: -4, top: "50%",
          transform: "translateY(-50%)",
          width: 10, height: 10,
          background: "transparent", border: "none",
          // Transparent so the visual dot above shows through
        }}
      />
    </div>
  );
}

// ── Button port row (left-aligned label) ────────────────────────
function ButtonPortRow({ portId, label, wired }) {
  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center",
      padding: "4px 16px 4px 12px", minHeight: 26, gap: 8,
      borderTop: `1px solid ${BORDER}`,
    }}>
      <div style={{
        flex: 1, fontSize: 10, color: "#374151", fontWeight: 500,
        background: "#F3F4F6", borderRadius: 4, padding: "3px 8px",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {label}
      </div>
      {/* Visual dot */}
      <div style={{
        width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${wired ? WA_GREEN : "#CBD5E1"}`,
        background: wired ? WA_GREEN : "transparent",
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

// ── Main node ───────────────────────────────────────────────────
export default function WhatsAppNode({ id, data, selected }) {
  const template    = data?.template ?? null;
  const smartRetry  = data?.smartRetry  ?? {};
  const utm         = data?.utm         ?? {};
  const aiBestTime  = data?.aiBestTime  ?? false;
  const fallback    = data?.fallback    ?? {};
  const outputCfg   = data?.outputConfig ?? { deliveryOutputs: ["next_step"], noResponseValue: 5, noResponseUnit: "hours", wiredPorts: [] };
  const wiredPorts  = outputCfg.wiredPorts ?? [];

  const isEmpty = !template;

  // Which delivery output ports to render (from outputConfig)
  const selectedDeliveryIds = outputCfg.deliveryOutputs ?? ["next_step"];
  const activeDeliveryPorts = DELIVERY_OUTPUT_OPTIONS.filter((o) => selectedDeliveryIds.includes(o.id));

  // Connectable buttons from template
  const connectableButtons = (template?.buttons ?? []).filter(isConnectable);

  // Phone number display
  const wabaNumber = WABA_NUMBERS.find((w) => w.id === (data?.wabaNumberId ?? "waba_1"));
  const phoneDisplay = wabaNumber ? `+${wabaNumber.number.replace(/\D/g, "").slice(-10)}` : "";

  // Body preview — strip markdown, truncate
  const bodyPreview = (template?.body ?? "")
    .replace(/\*/g, "").replace(/_/g, "")
    .replace(/{{[^}]+}}/g, (m) => m)  // keep vars visible
    .substring(0, 90);

  // Delivery output label (with time config for no_response)
  const deliveryLabel = (opt) => {
    if (opt.id === "no_response") {
      return `No response after ${outputCfg.noResponseValue ?? 5} ${outputCfg.noResponseUnit ?? "hours"}`;
    }
    return opt.label;
  };

  // Feature chips to show
  const chips = [
    utm?.enabled        && { label: "UTM", value: utm.campaign ? `UTM: ${utm.campaign}` : "UTM" },
    aiBestTime          && { label: "AI Best Time" },
    smartRetry?.enabled && { label: "Smart Retry" },
    fallback?.enabled && fallback?.template && { label: "Fallback" },
  ].filter(Boolean);

  const borderColor = isEmpty ? "rgba(37,211,102,0.4)" : template?.status === "In Review" ? "#F59E0B" : WA_GREEN;

  return (
    <div
      data-testid={`rf-whatsapp-node-${id}`}
      style={{
        background: "#fff",
        border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
        borderRadius: 12,
        boxShadow: selected ? "0 0 0 3px rgba(37,211,102,0.15)" : "0 1px 6px rgba(0,0,0,0.07)",
        width: 290,
        position: "relative",
        overflow: "visible",
      }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: WA_GREEN, width: 10, height: 10, top: -5 }}
      />

      {isEmpty ? (
        /* ── Empty state ── */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 16px", gap: 8 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 18 }}>✓</span>
          </div>
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Send WhatsApp</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A" }}>WhatsApp</div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template.name}
              </div>
            </div>
            {phoneDisplay && (
              <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4, flexShrink: 0 }}>
                {phoneDisplay}
              </span>
            )}
            <StatusPill status={template.status} />
          </div>

          {/* ── Media header ── */}
          {template.header?.type === "image" && (
            <div style={{ height: 52, background: template.header.bg || WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, opacity: 0.85 }}>🖼 Image</span>
            </div>
          )}
          {template.header?.type === "video" && (
            <div style={{ height: 52, background: template.header.bg || "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, opacity: 0.85 }}>▶ Video</span>
            </div>
          )}
          {template.header?.type === "text" && template.header?.text && (
            <div style={{ padding: "4px 12px 0", fontSize: 10, fontWeight: 600, color: "#111" }}>
              {template.header.text}
            </div>
          )}

          {/* ── Body preview ── */}
          <div style={{ padding: "6px 12px 6px" }}>
            <p style={{
              fontSize: 10, color: "#374151", lineHeight: 1.55, margin: 0,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {bodyPreview}{(template.body ?? "").length > 90 ? "…" : ""}
            </p>
          </div>

          {/* ── Button response ports ── */}
          {connectableButtons.length > 0 && connectableButtons.map((btn, i) => (
            <ButtonPortRow
              key={`btn_${i}`}
              portId={`btn_${i}`}
              label={btn.label}
              wired={wiredPorts.includes(`btn_${i}`)}
            />
          ))}

          {/* ── Delivery output ports ── */}
          {activeDeliveryPorts.length > 0 && (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
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

          {/* ── Feature chips ── */}
          {chips.length > 0 && (
            <div style={{
              display: "flex", flexWrap: "wrap", gap: 4,
              padding: "6px 10px 8px",
              borderTop: `1px solid ${BORDER}`,
            }}>
              {chips.map((chip, i) => (
                <span key={i} style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 7px",
                  borderRadius: 10, background: "#F1ECFE", color: "#6C3AE8",
                }}>
                  {chip.value || chip.label}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
