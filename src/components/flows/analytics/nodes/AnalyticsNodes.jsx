// Read-only analytics node renderers used exclusively in FlowAnalytics.jsx.
// Each wraps a compact card + a dark-purple analytics footer row.

import React from "react";
import { Handle, Position } from "reactflow";
import {
  ShoppingCart, Clock, MessageCircle, MessageSquare,
  Zap, GitFork, TrendingUp,
} from "lucide-react";

// ── Shared helpers ────────────────────────────────────────────────────────────
const FOOTER_BG  = "#1E1B4B";
const FOOTER_TXT = "#C4B5FD";
const FOOTER_VAL = "#FFFFFF";
const BORDER     = "#E5E7EB";

function fmt(n) {
  if (n == null) return "—";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
function fmtINR(n) {
  if (!n) return "₹0";
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString("en-IN")}`;
}
function pct(n) { return n == null ? "—" : `${n}%`; }

function NodeCard({ width = 240, accent, icon: Icon, title, subtitle, footer, handles }) {
  return (
    <div style={{ width, fontFamily: "Inter, sans-serif", userSelect: "none" }}>
      {/* Top handle */}
      <Handle
        id="in"
        type="target"
        position={Position.Top}
        style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
      />

      {/* Card body */}
      <div style={{
        background: "#FFFFFF",
        border: `1.5px solid ${BORDER}`,
        borderRadius: footer ? "8px 8px 0 0" : 8,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{
          background: accent,
          height: 3,
          borderRadius: "8px 8px 0 0",
        }} />
        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
          {Icon && (
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: accent + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={14} color={accent} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B", lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: "#64748B", marginTop: 2, lineHeight: 1.3 }}>{subtitle}</div>}
          </div>
        </div>
      </div>

      {/* Analytics footer */}
      {footer && (
        <div style={{
          background: FOOTER_BG,
          borderRadius: "0 0 8px 8px",
          padding: "7px 12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          {footer}
        </div>
      )}

      {/* Bottom / source handles */}
      {handles}
    </div>
  );
}

function FooterRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 10, color: FOOTER_TXT }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: highlight ? "#A78BFA" : FOOTER_VAL }}>{value}</span>
    </div>
  );
}

// ── Start Trigger node ────────────────────────────────────────────────────────
export function StartTriggerAnalyticsNode({ data }) {
  const a = data?.analyticsData;
  return (
    <NodeCard
      width={240}
      accent="#6C3AE8"
      icon={Zap}
      title={data?.config?.event ? data.config.event.replace(/_/g, " ") : "Start Trigger"}
      subtitle="Entry point"
      footer={a && (
        <>
          <FooterRow label="Triggered"  value={fmt(a.triggered)}  />
          <FooterRow label="Stopped"    value={fmt(a.stopped)}    />
        </>
      )}
      handles={
        <Handle
          id="out"
          type="source"
          position={Position.Bottom}
          style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
        />
      }
    />
  );
}

// ── Wait / Delay node ─────────────────────────────────────────────────────────
export function WaitAnalyticsNode({ data }) {
  const a = data?.analyticsData;
  const label = data?.label || `Wait ${data?.forValue ?? ""}${data?.forUnit ? ` ${data.forUnit}` : ""}`;
  return (
    <NodeCard
      width={240}
      accent="#F59E0B"
      icon={Clock}
      title={label}
      subtitle="Delay step"
      footer={a && (
        <>
          <FooterRow label="Triggered"    value={fmt(a.triggered)}   />
          <FooterRow label="Success rate" value={pct(a.success_rate)} highlight />
        </>
      )}
      handles={
        <Handle
          id="out"
          type="source"
          position={Position.Bottom}
          style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
        />
      }
    />
  );
}

// ── WhatsApp node ─────────────────────────────────────────────────────────────
export function WhatsAppAnalyticsNode({ data }) {
  const a = data?.analyticsData;
  const tpl = data?.template;
  return (
    <NodeCard
      width={260}
      accent="#25D366"
      icon={MessageCircle}
      title={data?.label || "WhatsApp"}
      subtitle={tpl?.name || "template"}
      footer={a && (
        <>
          <FooterRow label="Sent"            value={fmt(a.sent)}            />
          <FooterRow label="Delivered"       value={pct(a.delivered_pct)}   highlight />
          <FooterRow label="Opened"          value={pct(a.opened_pct)}      highlight />
          <FooterRow label="Revenue"         value={fmtINR(a.revenue_inr)}  />
          {a.cta_clicks?.map((cta, i) => (
            <FooterRow key={i} label={cta.label} value={fmt(cta.clicks)} />
          ))}
        </>
      )}
      handles={
        <>
          <Handle
            id="delivery_failed"
            type="source"
            position={Position.Right}
            style={{
              background: "#EF4444", width: 8, height: 8,
              border: "2px solid #fff", top: "50%",
            }}
          />
          <Handle
            id="out"
            type="source"
            position={Position.Bottom}
            style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
          />
        </>
      }
    />
  );
}

// ── SMS node ──────────────────────────────────────────────────────────────────
export function SMSAnalyticsNode({ data }) {
  const a = data?.analyticsData;
  const tpl = data?.template;
  return (
    <NodeCard
      width={240}
      accent="#3B82F6"
      icon={MessageSquare}
      title={data?.label || "SMS"}
      subtitle={tpl?.name || "template"}
      footer={a && (
        <>
          <FooterRow label="Sent"      value={fmt(a.sent)}          />
          <FooterRow label="Delivered" value={pct(a.delivered_pct)} highlight />
          <FooterRow label="CTR"       value={pct(a.ctr_pct)}       highlight />
          <FooterRow label="Revenue"   value={fmtINR(a.revenue_inr)} />
        </>
      )}
      handles={
        <Handle
          id="out"
          type="source"
          position={Position.Bottom}
          style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
        />
      }
    />
  );
}

// ── Conditional Split node ────────────────────────────────────────────────────
export function ConditionalSplitAnalyticsNode({ data }) {
  const a = data?.analyticsData;
  return (
    <NodeCard
      width={240}
      accent="#0D9488"
      icon={GitFork}
      title={data?.label || "Conditional Split"}
      subtitle={`Mode: ${data?.mode || "filter"}`}
      footer={a && (
        <>
          <FooterRow label="Triggered" value={fmt(a.triggered)} />
          {a.branches?.map((b, i) => (
            <FooterRow key={i} label={b.label} value={pct(b.pct)} highlight />
          ))}
        </>
      )}
      handles={
        <Handle
          id="out"
          type="source"
          position={Position.Bottom}
          style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
        />
      }
    />
  );
}

// ── Generic fallback node ─────────────────────────────────────────────────────
export function GenericAnalyticsNode({ data, type }) {
  return (
    <NodeCard
      width={220}
      accent="#94A3B8"
      icon={TrendingUp}
      title={data?.label || type || "Node"}
      subtitle={type}
      footer={null}
      handles={
        <>
          <Handle
            id="out"
            type="source"
            position={Position.Bottom}
            style={{ background: "#94A3B8", width: 8, height: 8, border: "2px solid #fff" }}
          />
        </>
      }
    />
  );
}
