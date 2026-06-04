import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import {
  X, Zap, MessageCircle, Mail, MessageSquare, Bell, GitFork,
  Clock, CircleStop, Target, PhoneCall, ExternalLink,
} from "lucide-react";
import { FLOW_STATUSES, CHANNEL_ICONS } from "./data/mockData";

// ── Mini node shapes for the preview canvas ───────────────────────
const NODE_COLORS = {
  trigger:   { bg: "#F5F3FF", border: "#DDD6FE", header: "#7C3AED", icon: "#7C3AED" },
  channel_wa:{ bg: "#F0FDF4", border: "#BBF7D0", header: "#10B981", icon: "#10B981" },
  channel_em:{ bg: "#EFF6FF", border: "#BFDBFE", header: "#3B82F6", icon: "#3B82F6" },
  channel_sm:{ bg: "#FAF5FF", border: "#E9D5FF", header: "#8B5CF6", icon: "#8B5CF6" },
  condition: { bg: "#FFFBEB", border: "#FDE68A", header: "#F59E0B", icon: "#F59E0B" },
  wait:      { bg: "#F8FAFC", border: "#E2E8F0", header: "#64748B", icon: "#64748B" },
  end:       { bg: "#F8FAFC", border: "#E2E8F0", header: "#64748B", icon: "#64748B" },
  goal:      { bg: "#F0FDF4", border: "#BBF7D0", header: "#10B981", icon: "#10B981" },
};

function MiniNode({ x, y, type = "trigger", label, icon: IconComp }) {
  const col = NODE_COLORS[type] ?? NODE_COLORS.trigger;
  return (
    <g>
      <rect
        x={x} y={y} width={110} height={36}
        rx={8} ry={8}
        fill={col.bg}
        stroke={col.border}
        strokeWidth={1.5}
      />
      <rect x={x} y={y} width={4} height={36} rx={2} fill={col.header} />
      <text
        x={x + 14} y={y + 14}
        fontSize={9} fontWeight={600}
        fill={col.icon}
        fontFamily="system-ui, sans-serif"
      >
        ▶
      </text>
      <text
        x={x + 26} y={y + 14}
        fontSize={9} fontWeight={600}
        fill="#374151"
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ── Predefined layouts for each preview type ──────────────────────
function buildLayout(previewType, channels) {
  const ch1 = channels[0] ?? "whatsapp";
  const ch2 = channels[1] ?? "email";

  const nodeTypeForChannel = (ch) => {
    if (ch === "whatsapp") return "channel_wa";
    if (ch === "email")    return "channel_em";
    if (ch === "sms")      return "channel_sm";
    return "channel_wa";
  };

  const labelForChannel = (ch) => {
    const map = { whatsapp: "WhatsApp", email: "Email", sms: "SMS", push: "Push", inapp: "In-App", rcs: "RCS", aicall: "AI Call" };
    return `Send ${map[ch] ?? ch}`;
  };

  if (previewType === "simple") {
    // Trigger → Channel → End
    return {
      width: 280, height: 260,
      nodes: [
        { id: "n1", x: 85, y: 20,  type: "trigger",            label: "Event Trigger" },
        { id: "n2", x: 85, y: 95,  type: nodeTypeForChannel(ch1), label: labelForChannel(ch1) },
        { id: "n3", x: 85, y: 170, type: "end",                label: "End" },
      ],
      edges: [
        { x1: 140, y1: 56,  x2: 140, y2: 95  },
        { x1: 140, y1: 131, x2: 140, y2: 170 },
      ],
    };
  }

  if (previewType === "cart") {
    // Trigger → Wait → Channel 1 → Condition → Channel 2 → End
    return {
      width: 280, height: 380,
      nodes: [
        { id: "n1", x: 85, y: 20,  type: "trigger",               label: "Event Trigger" },
        { id: "n2", x: 85, y: 90,  type: "wait",                  label: "Wait 1 hour" },
        { id: "n3", x: 85, y: 160, type: nodeTypeForChannel(ch1),  label: labelForChannel(ch1) },
        { id: "n4", x: 85, y: 230, type: "condition",              label: "Condition" },
        { id: "n5", x: 85, y: 300, type: nodeTypeForChannel(ch2),  label: labelForChannel(ch2) },
        { id: "n6", x: 85, y: 340, type: "end",                   label: "End" },
      ],
      edges: [
        { x1: 140, y1: 56,  x2: 140, y2: 90  },
        { x1: 140, y1: 126, x2: 140, y2: 160 },
        { x1: 140, y1: 196, x2: 140, y2: 230 },
        { x1: 140, y1: 266, x2: 140, y2: 300 },
        { x1: 195, y1: 248, x2: 220, y2: 248, x3: 220, y3: 300, x4: 195, y4: 318, curved: true },
      ],
    };
  }

  // branched — Trigger → Channel 1 → Condition → two branches
  return {
    width: 380, height: 340,
    nodes: [
      { id: "n1", x: 135, y: 20,  type: "trigger",              label: "Event Trigger" },
      { id: "n2", x: 135, y: 90,  type: nodeTypeForChannel(ch1), label: labelForChannel(ch1) },
      { id: "n3", x: 135, y: 160, type: "condition",             label: "Condition" },
      { id: "n4", x: 30,  y: 250, type: nodeTypeForChannel(ch1), label: labelForChannel(ch1) },
      { id: "n5", x: 240, y: 250, type: nodeTypeForChannel(ch2), label: labelForChannel(ch2) },
      { id: "n6", x: 30,  y: 305, type: "end",                  label: "End" },
      { id: "n7", x: 240, y: 305, type: "goal",                 label: "Goal reached" },
    ],
    edges: [
      { x1: 190, y1: 56,  x2: 190, y2: 90  },
      { x1: 190, y1: 126, x2: 190, y2: 160 },
      { x1: 190, y1: 196, x2: 85,  y2: 250, curved: true },
      { x1: 190, y1: 196, x2: 295, y2: 250, curved: true },
      { x1: 85,  y1: 286, x2: 85,  y2: 305 },
      { x1: 295, y1: 286, x2: 295, y2: 305 },
    ],
  };
}

function FlowDiagram({ flow }) {
  const layout = buildLayout(flow.preview, flow.channels);

  return (
    <div style={{
      width: "100%", display: "flex", justifyContent: "center",
      padding: "24px 0",
      background: "radial-gradient(circle at 50% 50%, #F8FAFC 0%, #F1F5F9 100%)",
      borderRadius: 12,
      border: "1px solid #E2E8F0",
      minHeight: 320,
      alignItems: "flex-start",
    }}>
      <svg
        width={layout.width}
        height={layout.height + 40}
        viewBox={`0 0 ${layout.width} ${layout.height + 40}`}
        style={{ overflow: "visible" }}
      >
        {/* Connector lines */}
        {layout.edges.map((e, i) => (
          e.curved ? (
            <path
              key={i}
              d={`M ${e.x1} ${e.y1} C ${e.x1} ${(e.y1 + (e.x3 !== undefined ? e.y3 : e.y2)) / 2} ${e.x2} ${(e.y1 + (e.x3 !== undefined ? e.y3 : e.y2)) / 2} ${e.x2} ${e.y2}`}
              stroke="#CBD5E1" strokeWidth={1.5} fill="none"
              strokeDasharray="none"
              markerEnd="url(#arrowhead)"
            />
          ) : (
            <line
              key={i}
              x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
              stroke="#CBD5E1" strokeWidth={1.5}
              markerEnd="url(#arrowhead)"
            />
          )
        ))}

        {/* Arrowhead marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#94A3B8" />
          </marker>
        </defs>

        {/* Nodes */}
        {layout.nodes.map((n) => (
          <MiniNode key={n.id} x={n.x} y={n.y} type={n.type} label={n.label} />
        ))}
      </svg>
    </div>
  );
}

// ── Channel icon strip ────────────────────────────────────────────
function ChannelPills({ channels }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {(channels || []).map((ch) => {
        const meta = CHANNEL_ICONS[ch];
        if (!meta) return null;
        const { Icon, color } = meta;
        const names = { whatsapp: "WhatsApp", email: "Email", sms: "SMS", push: "Push", inapp: "In-App", rcs: "RCS", aicall: "AI Call" };
        return (
          <div key={ch} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 20,
            background: `${color}18`, border: `1px solid ${color}30`,
          }}>
            <Icon size={11} color={color} />
            <span style={{ fontSize: 11, color, fontWeight: 600 }}>{names[ch] ?? ch}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────
export default function FlowPreviewModal({ flow, onClose }) {
  const statusMeta = FLOW_STATUSES.find((s) => s.id === flow.status);

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(15,15,26,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
      onMouseDown={onClose}
    >
      <div
        style={{
          background: "#fff", borderRadius: 16,
          width: "min(900px, 92vw)",
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "20px 24px 16px",
          borderBottom: "1px solid #F1F5F9",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {flow.name}
              </h2>
              {statusMeta && (
                <span style={{
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                  padding: "3px 10px", borderRadius: 20,
                  color: statusMeta.fg, background: statusMeta.bg,
                  border: `1px solid ${statusMeta.border}`,
                }}>
                  {statusMeta.label}
                </span>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <ChannelPills channels={flow.channels} />
              <span style={{ fontSize: 12, color: "#64748B" }}>{flow.trigger}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>Updated {flow.updatedAt}</span>
              <span style={{ fontSize: 12, color: "#94A3B8" }}>{flow.nodeCount} nodes</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0, marginLeft: 16,
              width: 32, height: 32, borderRadius: 8,
              background: "#F1F5F9", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color="#64748B" />
          </button>
        </div>

        {/* ── Flow diagram ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 12, textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 600 }}>
            Flow Preview
          </div>
          <FlowDiagram flow={flow} />
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 24px",
          borderTop: "1px solid #F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            This is a preview only. Open the flow to edit it.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              background: "#F43F5E", color: "#fff",
              border: "none", borderRadius: 8, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
