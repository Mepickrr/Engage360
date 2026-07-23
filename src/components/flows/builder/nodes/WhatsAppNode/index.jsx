import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { DELIVERY_OUTPUT_OPTIONS, isConnectable, WABA_NUMBERS } from "./data/mockTemplates";
import { resolveStyleInfo, normalizeFallback } from "./WhatsAppRightPanel";
import NodeAnalyticsFooter from "@/components/flows/analytics/NodeAnalyticsFooter";
import { useFlowVariant } from "@/components/flows/FlowVariantContext";
import NodeHoverActions from "../shared/NodeHoverActions";
import whatsappIcon from "@/assets/icons/whatsapp.png";

const WA_GREEN = "#25D366";
const BORDER   = "#E5E7EB";

// Resolve a variableMap entry — supports OR chain (array) or legacy string
function resolveVar(varKey, variableMap = {}) {
  const val = variableMap[varKey];
  if (!val) return null;
  if (Array.isArray(val)) return val.find((v) => v) || null; // first non-empty
  return val; // legacy string
}

// Render WhatsApp markdown + variables inline
function renderBody(text, variableMap = {}) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part))   return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      const varKey = part.slice(2, -2);
      const resolved = resolveVar(varKey, variableMap);
      return (
        <span key={i} style={{ background: "#EEF2FF", color: "#6C3AE8", padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>
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

// ── Carousel canvas preview ─────────────────────────────────────
const CAROUSEL_BLUE_NODE = "#3D3CB8";

function CarouselNodePreview({ template }) {
  const body  = template?.body  || "";
  const cards = template?.cards || [];
  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
      {body && (
        <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", padding: "6px 10px", marginBottom: 5, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: 11, color: "#111", lineHeight: 1.5 }}>{body.slice(0, 80)}{body.length > 80 ? "…" : ""}</div>
          <div style={{ textAlign: "right", fontSize: 9, color: "#aaa", marginTop: 2 }}>16:48 ✓✓</div>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {cards.slice(0, 3).map((card, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
            <div style={{ height: 44, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {card.mediaUrl ? <span style={{ fontSize: 16 }}>🖼</span> : <span style={{ fontSize: 9, color: "#94A3B8" }}>No image</span>}
            </div>
            {card.cardBody && (
              <div style={{ padding: "4px 8px", fontSize: 10, color: "#374151", lineHeight: 1.4 }}>
                {card.cardBody.slice(0, 45)}{card.cardBody.length > 45 ? "…" : ""}
              </div>
            )}
            {(card.buttons || []).filter((b) => b.label).map((btn, bi) => (
              <div key={bi} style={{ padding: "3px 8px", borderTop: "1px solid #F3F4F6", fontSize: 10, color: CAROUSEL_BLUE_NODE, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 8 }}>{btn.type === "URL" ? "↗" : "↩"}</span>
                {btn.label}
              </div>
            ))}
          </div>
        ))}
        {cards.length > 3 && (
          <div style={{ textAlign: "center", fontSize: 9, color: "#94A3B8", padding: "2px 0" }}>+{cards.length - 3} more cards</div>
        )}
      </div>
    </div>
  );
}

// ── Collect Input canvas preview ────────────────────────────────
const CI_INPUT_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};

function CollectInputNodePreview({ template }) {
  const emoji = CI_INPUT_EMOJIS[template?.inputType] || "📝";
  const typeLabel = (template?.inputType || "input").replace("_", " ");
  const question = template?.questionMessage || "";

  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
      {/* Input type badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#F0FDF4", borderRadius: 10, border: "1px solid #BBF7D0", marginBottom: 5 }}>
        <span style={{ fontSize: 11 }}>{emoji}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: "#065F46", textTransform: "capitalize" }}>{typeLabel}</span>
      </div>
      {/* Question bubble */}
      <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", padding: "6px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 11, color: "#111", lineHeight: 1.5 }}>
          {question ? (question.length > 80 ? question.slice(0, 80) + "…" : question) : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>No question set</span>}
        </div>
        <div style={{ textAlign: "right", fontSize: 9, color: "#aaa", marginTop: 2 }}>16:48 ✓✓</div>
      </div>
    </div>
  );
}

// ── List Message canvas preview ─────────────────────────────────
function ListMessageNodePreview({ template }) {
  if (!template) return null;
  const totalRows = (template?.sections ?? []).reduce((sum, s) => sum + (s.rows?.length ?? 0), 0);
  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
      {template.header && (
        <div style={{ fontSize: 10, fontWeight: 700, color: "#111", marginBottom: 4, padding: "0 4px" }}>
          {template.header}
        </div>
      )}
      <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", padding: "6px 10px", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 11, color: "#111", lineHeight: 1.5 }}>
          {template.body
            ? (template.body.length > 80 ? template.body.slice(0, 80) + "…" : template.body)
            : <span style={{ color: "#94A3B8", fontStyle: "italic" }}>No body set</span>}
        </div>
        {template.footer && (
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{template.footer}</div>
        )}
        <div style={{ textAlign: "right", fontSize: 9, color: "#aaa", marginTop: 2 }}>16:48 ✓✓</div>
      </div>
      <div style={{ marginTop: 6, padding: "5px 8px", background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <span style={{ fontSize: 10 }}>📋</span>
        <span style={{ fontSize: 10, color: "#25D366", fontWeight: 600 }}>
          {template.buttonText || "View list"}
        </span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>
          · {totalRows} option{totalRows !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

// ── Main node ───────────────────────────────────────────────────
export default function WhatsAppNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false);
  const { brandIcons } = useFlowVariant();
  const useBrandIcon = !!brandIcons?.whatsapp;
  const template    = data?.template ?? null;
  const smartRetry  = data?.smartRetry  ?? {};
  const utm         = data?.utm         ?? {};
  const aiBestTime  = data?.aiBestTime  ?? false;
  const fallback    = normalizeFallback(data?.fallback);
  const outputCfg   = data?.outputConfig ?? { deliveryOutputs: ["next_step"], noResponseValue: 5, noResponseUnit: "hours", wiredPorts: [] };
  const wiredPorts  = outputCfg.wiredPorts ?? [];

  const isEmpty       = !template;
  const isCarousel    = data?.templateStyle === "carousel" && template?.isCarousel && (template?.cards?.length > 0);
  const isCollectInput = data?.templateStyle === "collect_input";
  const isListMessageNode = data?.templateStyle === "list" && template?.isListMessage;

  // Delivery ports — based on routingMode
  const routingMode = outputCfg.routingMode ?? "next_step";
  const activeDeliveryPorts = routingMode === "next_step"
    ? DELIVERY_OUTPUT_OPTIONS.filter((o) => o.id === "next_step")
    : DELIVERY_OUTPUT_OPTIONS.filter((o) => (outputCfg.deliveryOutputs ?? []).includes(o.id));

  // Connectable buttons from template
  const connectableButtons = isListMessageNode
    ? (template?.sections ?? []).flatMap((sec) =>
        (sec.rows ?? []).map((row) => ({ label: row.title || row.id, type: "QUICK_REPLY" }))
      )
    : (template?.buttons ?? []).filter(isConnectable);

  // Phone number display
  const wabaNumber = WABA_NUMBERS.find((w) => w.id === (data?.wabaNumberId ?? "waba_1"));
  const phoneDisplay = wabaNumber ? `+${wabaNumber.number.replace(/\D/g, "").slice(-10)}` : "";

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
    [fallback.disabled, fallback.categoryChanged].some(
      (t) => t.enabled && (t.action === "opt_out" || t.template)
    ) && { label: "Fallback" },
  ].filter(Boolean);

  const borderColor = isEmpty ? "rgba(37,211,102,0.4)" : template?.status === "In Review" ? "#F59E0B" : WA_GREEN;
  const analyticsData = data?.analyticsData ?? null;
  const cardRadius = analyticsData ? "12px 12px 0 0" : 12;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <NodeHoverActions nodeId={id} visible={hovered || selected} channel="whatsapp" />
      <div
        data-testid={`rf-whatsapp-node-${id}`}
        style={{
          background: "#fff",
          border: `${selected ? "2px" : "1.5px"} ${isEmpty ? "dashed" : "solid"} ${borderColor}`,
          borderRadius: cardRadius,
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
          {useBrandIcon ? (
            <img src={whatsappIcon} alt="" width={38} height={38} style={{ objectFit: "contain" }} />
          ) : (
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 18 }}>✓</span>
            </div>
          )}
          <span style={{ fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>Send WhatsApp</span>
          <span style={{ fontSize: 10, color: "#CBD5E1" }}>Click to configure</span>
        </div>
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 12px" }}>
            {useBrandIcon ? (
              <img src={whatsappIcon} alt="" width={22} height={22} style={{ objectFit: "contain", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: "#fff", fontSize: 10 }}>✓</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data?.label || "WhatsApp"}
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {template.name
                  || (data?.templateStyle === "collect_input" ? "Collect Input" : data?.templateStyle === "list" ? "List Message" : resolveStyleInfo(data?.templateStyle)?.label)
                  || ""}
              </div>
            </div>
            {phoneDisplay && (
              <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4, flexShrink: 0 }}>
                {phoneDisplay}
              </span>
            )}
            {template.status && <StatusPill status={template.status} />}
          </div>

          {/* ── Message bubble / carousel preview / collect input preview / list message preview ── */}
          {isCollectInput ? (
            <CollectInputNodePreview template={template} />
          ) : isCarousel ? (
            <CarouselNodePreview template={template} />
          ) : isListMessageNode ? (
            <ListMessageNodePreview template={template} />
          ) : (
          <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
            <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>

              {/* Media header */}
              {template.header?.type === "image" && (
                <div style={{ height: 80, background: template.header.bg || WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", opacity: 0.9 }}>
                    <div style={{ fontSize: 22, marginBottom: 2 }}>🖼</div>
                    <div style={{ fontSize: 9, color: "#fff" }}>Image</div>
                  </div>
                </div>
              )}
              {template.header?.type === "video" && (
                <div style={{ height: 80, background: template.header.bg || "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}>▶</span>
                  </div>
                  <span style={{ position: "absolute", bottom: 6, left: 8, fontSize: 9, color: "rgba(255,255,255,0.7)" }}>0:00</span>
                </div>
              )}
              {template.header?.type === "document" && (
                <div style={{ height: 52, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>Document</span>
                </div>
              )}

              {/* Text header */}
              {template.header?.type === "text" && template.header?.text && (
                <div style={{ padding: "8px 10px 0", fontSize: 11, fontWeight: 700, color: "#111" }}>
                  {template.header.text}
                </div>
              )}

              {/* Body — full, no truncation */}
              {template.body && (
                <div style={{ padding: "6px 10px", fontSize: 11, color: "#111", lineHeight: 1.6 }}>
                  {renderBody(template.body, data?.variableMap || {})}
                </div>
              )}

              {/* Footer */}
              {template.footer && (
                <div style={{ padding: "0 10px 4px", fontSize: 10, color: "#aaa" }}>
                  {template.footer}
                </div>
              )}

              {/* Timestamp */}
              <div style={{ textAlign: "right", padding: "0 10px 6px", fontSize: 9, color: "#aaa" }}>
                16:48 ✓✓
              </div>
            </div>
          </div>
          )}

          {/* ── Button response ports (output handles) ── */}
          {connectableButtons.length > 0 && connectableButtons.map((btn, i) => (
            <ButtonPortRow
              key={`btn_${i}`}
              portId={`btn_${i}`}
              label={btn.label}
              wired={wiredPorts.includes(`btn_${i}`)}
            />
          ))}

          {/* ── Collect Input fixed output ports / standard delivery output ports ── */}
          {isCollectInput ? (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 2, paddingBottom: 4 }}>
              {[
                { id: "ci_success",       label: "Success",       color: "#22C55E" },
                { id: "ci_no_response",   label: (() => { const val = template?.noResponse?.timeoutValue ?? 1; const unit = template?.noResponse?.timeoutUnit ?? "hours"; const singular = unit === "hours" ? "hour" : "minute"; return `No Response after ${val} ${Number(val) === 1 ? singular : unit}`; })() },
                { id: "ci_limit_reached", label: "Limit Reached" },
                { id: "ci_send_failed",   label: "Send Failed",   color: "#EF4444" },
              ].map((port) => (
                <PortRow key={port.id} portId={port.id} label={port.label} wired={wiredPorts.includes(port.id)} />
              ))}
            </div>
          ) : (
            /* ── Standard delivery output ports ── */
            activeDeliveryPorts.length > 0 && (
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
            )
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
      <NodeAnalyticsFooter type="whatsapp" analyticsData={analyticsData} />
      </div>
    </div>
  );
}
