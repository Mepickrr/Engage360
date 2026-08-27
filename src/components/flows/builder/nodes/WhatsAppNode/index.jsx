import React, { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";
import { ChevronRight } from "lucide-react";
import { DELIVERY_OUTPUT_OPTIONS, isConnectable, WABA_NUMBERS } from "./data/mockTemplates";
import { resolveStyleInfo, normalizeFallback, deriveFallbackName, OPT_OUT_LINE, OPT_OUT_QUICK_REPLY_LABEL } from "./WhatsAppRightPanel";
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
    "Primary":   { bg: "#EEF2FF", color: "#4F46E5" },
    "Rejected":  { bg: "#FEF2F2", color: "#991B1B" },
    "Paused":    { bg: "#F1F5F9", color: "#475569" },
    "Disabled":  { bg: "#F1F5F9", color: "#475569" },
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
// Used by node styles whose own preview (carousel, list message) already
// shows the buttons/rows in a different visual form, so the port list below
// stays a plain technical row rather than a native WhatsApp CTA.
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

// ── Native-looking CTA button row, rendered inside the message bubble ───
// Renders exactly like a real WhatsApp template button (centered blue text,
// divider line, full width). When `portId` is set (Quick Reply / Flow —
// see isConnectable), a small output-port dot + Handle sit flush on the
// row's right edge so the connector reads as part of the native button
// rather than a separate technical element. URL/Phone buttons render the
// identical row with no dot/handle: visible, not wireable.
function TemplateButtonRow({ label, portId, wired }) {
  const connectable = portId != null;
  return (
    <div style={{
      position: "relative",
      padding: connectable ? "9px 26px 9px 10px" : "9px 10px",
      borderTop: "1px solid #f0f0f0",
      fontSize: 11, color: "#0a8fc4", textAlign: "center", fontWeight: 500,
      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    }}>
      {label}
      {connectable && (
        <>
          <div style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            border: `2px solid ${wired ? WA_GREEN : "#CBD5E1"}`,
            background: wired ? WA_GREEN : "transparent",
            transition: "all 0.15s",
          }} />
          <Handle
            id={portId}
            type="source"
            position={Position.Right}
            style={{
              position: "absolute", right: 4, top: "50%",
              transform: "translateY(-50%)",
              width: 8, height: 8,
              background: "transparent", border: "none",
            }}
          />
        </>
      )}
    </div>
  );
}

// Assigns `btn_{n}` port ids over only the connectable buttons in a list,
// keeping the numbering seen by the rest of the node (wiredPorts, etc.)
// stable regardless of URL/Phone buttons interleaved between them.
function withButtonPortIds(buttons) {
  let n = 0;
  return buttons.map((btn) => ({ btn, portId: isConnectable(btn) ? `btn_${n++}` : null }));
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

// ── Standard template bubble content (shared by the plain preview and the
// primary card in the fallback stack) ────────────────────────────
function StandardBubbleContent({ template, variableMap, wiredPorts = [] }) {
  return (
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
          {renderBody(template.body, variableMap)}
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

      {/* CTA buttons — Quick Reply/Flow get an inline output port, URL/Phone are shown as native, non-connectable rows */}
      {withButtonPortIds((template.buttons ?? []).filter((b) => b.label)).map(({ btn, portId }, i) => (
        <TemplateButtonRow key={i} label={btn.label} portId={portId} wired={portId != null && wiredPorts.includes(portId)} />
      ))}
    </div>
  );
}

// ── Fallback template preview (canvas) ───────────────────────────
const FALLBACK_AMBER_TEXT = "#92400E";

function FallbackBubblePreview({ trigger, originalTemplate, variableMap }) {
  const isOptOut = trigger.action === "opt_out";
  const tpl = isOptOut ? originalTemplate : trigger.template;
  if (!tpl) return null;

  return (
    <div style={{ background: "#fff", borderRadius: "8px 8px 8px 3px", overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
      {tpl.header?.type === "text" && tpl.header?.text && (
        <div style={{ padding: "8px 10px 0", fontSize: 11, fontWeight: 700, color: "#111" }}>{tpl.header.text}</div>
      )}
      {tpl.body && (
        <div style={{ padding: "6px 10px", fontSize: 11, color: "#111", lineHeight: 1.6 }}>
          {renderBody(tpl.body, variableMap)}
        </div>
      )}
      {tpl.footer && (
        <div style={{ padding: "0 10px 4px", fontSize: 10, color: "#aaa" }}>
          {tpl.footer}
        </div>
      )}
      {isOptOut && (
        <div style={{ padding: "0 10px 4px", fontSize: 10, color: "#aaa" }}>
          {OPT_OUT_LINE}
        </div>
      )}
      <div style={{ textAlign: "right", padding: "0 10px 6px", fontSize: 9, color: "#aaa" }}>16:48 ✓✓</div>
      {/* Opt-out keeps the primary's own buttons and appends Stop as an extra CTA */}
      {(tpl.buttons || []).filter((b) => b.label).map((btn, i) => (
        <div key={i} style={{ padding: "9px 10px", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#0a8fc4", textAlign: "center", fontWeight: 500 }}>
          {btn.label}
        </div>
      ))}
      {isOptOut && (
        <div style={{ padding: "9px 10px", borderTop: "1px solid #f0f0f0", fontSize: 11, color: "#0a8fc4", textAlign: "center", fontWeight: 500 }}>
          {OPT_OUT_QUICK_REPLY_LABEL}
        </div>
      )}
    </div>
  );
}

// A real card stack — the primary template sits on top by default, with the
// enabled fallback(s) peeking out behind it. Clicking the front card (or the
// arrow) slides it away to reveal the next one; no drag gesture, since this
// lives inside a draggable/pannable React Flow canvas and a real swipe would
// fight the canvas's own pointer handling.
function TemplatePreviewStack({ items, onIndexChange }) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);
  if (items.length === 0) return null;

  const advance = (e) => {
    e.stopPropagation();
    if (items.length <= 1 || leaving) return;
    // `leaving` blocks any other advance until this one finishes, so the
    // closed-over `index` is still current when the timeout fires.
    const next = (index + 1) % items.length;
    setLeaving(true);
    setTimeout(() => {
      setIndex(next);
      setLeaving(false);
      onIndexChange?.(next);
    }, 160);
  };

  const current = items[index];
  const behindDepths = items.length > 2 ? [1, 2] : items.length > 1 ? [1] : [];

  return (
    <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6, position: "relative" }}>
      {/* Peeking cards behind — furthest painted first so nearer ones sit on top */}
      {behindDepths.slice().reverse().map((depth) => (
        <div
          key={depth}
          data-testid={`wa-template-stack-peek-${depth}`}
          style={{
            position: "absolute",
            left: 6 + depth * 5, right: 6 + depth * 5, top: depth * 5,
            height: 22, background: "#fff", border: "1px solid #E5E7EB",
            borderRadius: "8px 8px 0 0", opacity: 1 - depth * 0.28,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)", zIndex: 10 - depth,
          }}
        />
      ))}

      {/* Front card */}
      <div
        onClick={items.length > 1 ? advance : undefined}
        data-testid="wa-template-stack-front"
        style={{
          position: "relative", zIndex: 20,
          transition: "transform 160ms ease, opacity 160ms ease",
          transform: leaving ? "translateY(8px) scale(0.97)" : "translateY(0) scale(1)",
          opacity: leaving ? 0 : 1,
          cursor: items.length > 1 ? "pointer" : "default",
        }}
      >
        {items.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5, padding: "0 2px" }}>
            <span
              style={{
                fontSize: 10, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                color: current.isFallback ? FALLBACK_AMBER_TEXT : "#475569",
              }}
            >
              {current.isFallback ? `Fallback · ${current.caption}: ${current.name}` : current.caption}
            </span>
            <div
              style={{ display: "inline-flex", alignItems: "center", gap: 3, border: "1px solid #E5E7EB", borderRadius: 999, padding: "1px 5px", background: "#fff", flexShrink: 0 }}
            >
              <span data-testid="wa-template-stack-counter" style={{ fontSize: 9, color: "#475569", fontWeight: 600 }}>{index + 1} / {items.length}</span>
              <ChevronRight size={11} color="#64748B" />
            </div>
          </div>
        )}
        {current.render()}
      </div>
    </div>
  );
}

// ── Main node ───────────────────────────────────────────────────
export default function WhatsAppNode({ id, data, selected }) {
  const [hovered, setHovered] = useState(false);
  const [activeStackIndex, setActiveStackIndex] = useState(0);
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

  // Delivery output label — any hasTimeConfig branch (Not Read, Not Clicked, No
  // response after, ...) reads its own value/unit from outputCfg.timeConfig;
  // "no_response" falls back to the legacy flat noResponseValue/noResponseUnit
  // fields for flows saved before timeConfig existed.
  const deliveryLabel = (opt) => {
    if (!opt.hasTimeConfig) return opt.label;
    const stored = outputCfg.timeConfig?.[opt.id];
    const { value, unit } = stored
      ?? (opt.id === "no_response" ? { value: outputCfg.noResponseValue ?? 5, unit: outputCfg.noResponseUnit ?? "hours" } : { value: 5, unit: "hours" });
    const verb = opt.id === "no_response" ? opt.label : `${opt.label} after`;
    return `${verb} ${value} ${unit}`;
  };

  // Feature chips to show
  const chips = [
    utm?.enabled        && { label: "UTM", value: utm.campaign ? `UTM: ${utm.campaign}` : "UTM" },
    aiBestTime          && { label: "AI Best Time" },
    smartRetry?.enabled && { label: "Smart Retry" },
  ].filter(Boolean);

  // Fallback previews — only triggers that are enabled AND actually resolve to
  // content (opt-out always does once enabled; template action needs a template picked).
  const fallbackItems = [
    fallback.disabled.enabled && (fallback.disabled.action === "opt_out" || fallback.disabled.template) && {
      key: "disabled",
      isFallback: true,
      name: fallback.disabled.action === "opt_out" ? deriveFallbackName(template?.name) : fallback.disabled.template?.name,
      caption: "When Paused/Disabled",
      render: () => <FallbackBubblePreview trigger={fallback.disabled} originalTemplate={template} variableMap={data?.variableMap || {}} />,
    },
    fallback.categoryChanged.enabled && (fallback.categoryChanged.action === "opt_out" || fallback.categoryChanged.template) && {
      key: "categoryChanged",
      isFallback: true,
      name: fallback.categoryChanged.action === "opt_out" ? deriveFallbackName(template?.name) : fallback.categoryChanged.template?.name,
      caption: "When Category Changes",
      render: () => <FallbackBubblePreview trigger={fallback.categoryChanged} originalTemplate={template} variableMap={data?.variableMap || {}} />,
    },
  ].filter(Boolean);
  const hasFallback = fallbackItems.length > 0;

  // Reset to the primary card whenever fallback config drops out, so a stale
  // index doesn't briefly mismatch the header if it's re-enabled later.
  useEffect(() => {
    if (!hasFallback) setActiveStackIndex(0);
  }, [hasFallback]);

  // Stack shown on the canvas: primary template first, then each enabled fallback.
  const templateStackItems = hasFallback
    ? [
        { key: "primary", isFallback: false, name: template?.name, caption: "Primary Template", render: () => <StandardBubbleContent template={template} variableMap={data?.variableMap || {}} /> },
        ...fallbackItems,
      ]
    : null;

  // Keeps the header's template name in sync with whichever card is currently
  // in view as the seller slides through the stack, instead of always showing
  // the primary template's name.
  const activeStackItem = hasFallback ? templateStackItems[Math.min(activeStackIndex, templateStackItems.length - 1)] : null;
  const headerTemplateName = activeStackItem
    ? activeStackItem.name
    : (template?.name
        || (data?.templateStyle === "collect_input" ? "Collect Input" : data?.templateStyle === "list" ? "List Message" : resolveStyleInfo(data?.templateStyle)?.label)
        || "");

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
        position={Position.Left}
        style={{ background: WA_GREEN, width: 10, height: 10, left: -5 }}
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
              <div style={{ fontSize: 9, color: "#94A3B8", overflowWrap: "break-word", wordBreak: "break-word" }} data-testid="wa-header-template-name">
                {headerTemplateName}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
              {phoneDisplay && (
                <span style={{ fontSize: 8, background: "#F1F5F9", color: "#64748B", padding: "2px 5px", borderRadius: 4 }}>
                  {phoneDisplay}
                </span>
              )}
              <div style={{ display: "flex", gap: 4 }}>
                {template.status && <StatusPill status={template.status} />}
              </div>
            </div>
          </div>

          {/* ── Message bubble / carousel preview / collect input preview / list message preview ── */}
          {isCollectInput ? (
            <CollectInputNodePreview template={template} />
          ) : isCarousel ? (
            <CarouselNodePreview template={template} />
          ) : isListMessageNode ? (
            <ListMessageNodePreview template={template} />
          ) : hasFallback ? (
            <TemplatePreviewStack items={templateStackItems} onIndexChange={setActiveStackIndex} />
          ) : (
          <div style={{ margin: "0 8px 8px", background: "#E5DDD5", borderRadius: 8, padding: 6 }}>
            <StandardBubbleContent template={template} variableMap={data?.variableMap || {}} wiredPorts={wiredPorts} />
          </div>
          )}

          {/* ── Button response ports (output handles) ──
              Only for previews that don't already render buttons inline
              (carousel/list rows have their own visual form; the fallback
              stack keeps ports tied to the primary template regardless of
              which card is currently swiped into view). The plain preview
              above renders its ports inline inside the bubble instead. */}
          {(isCarousel || isListMessageNode || hasFallback) && connectableButtons.length > 0 && connectableButtons.map((btn, i) => (
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
