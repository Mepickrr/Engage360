import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, X, ChevronDown, ChevronUp, RefreshCcw,
  MessageCircle, Mail, MessageSquare, Bell, Zap, Monitor,
  BarChart3, TrendingUp, TrendingDown, Minus,
  MoreVertical, Edit3, Trash2, Copy, Archive,
  CheckCircle, AlertCircle, Clock, PauseCircle, XCircle,
  SlidersHorizontal, LayoutGrid, List, Star, ArrowLeft,
  Send, TestTube2, ChevronRight, Info, Sparkles,
} from "lucide-react";
import {
  MOCK_TEMPLATES, TEMPLATE_LIBRARY, CHANNEL_META, STATUS_META,
  QUALITY_META, USE_CASES,
} from "@/data/mockTemplates";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── helpers ──────────────────────────────────────────────────────
const trunc = (str, n) => (!str ? "" : str.length <= n ? str : str.slice(0, n) + "…");
const fmtNum = (n) => n == null ? "—" : new Intl.NumberFormat("en-IN").format(n);
const CHANNELS = ["all", "whatsapp", "sms", "email", "push", "rcs", "onsite"];

const CHANNEL_ICONS = {
  whatsapp: MessageCircle,
  sms:      MessageSquare,
  email:    Mail,
  push:     Bell,
  rcs:      Zap,
  onsite:   Monitor,
};

// ─── channel preview renderers ────────────────────────────────────
function WhatsAppPreview({ p, large }) {
  return (
    <div style={{ background: "#E5DDD5", borderRadius: 8, padding: large ? 14 : 10, minHeight: large ? 260 : 140, overflow: "hidden" }}>
      <div style={{ background: "#fff", borderRadius: "8px 8px 8px 2px", padding: large ? "10px 12px" : "8px 10px", maxWidth: "92%", boxShadow: "0 1px 2px rgba(0,0,0,0.12)" }}>
        {p.header?.type === "image" && (
          <div style={{ background: "linear-gradient(135deg,#C8E6C9,#A5D6A7)", borderRadius: 6, aspectRatio: "16/9", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <span style={{ fontSize: large ? 24 : 16, opacity: 0.6 }}>🖼</span>
          </div>
        )}
        {p.header?.type === "text" && (
          <div style={{ fontWeight: 700, fontSize: large ? 14 : 11, color: "#111", marginBottom: 5 }}>{p.header.text}</div>
        )}
        <p style={{ fontSize: large ? 13 : 10, color: "#111", lineHeight: 1.45, margin: 0, whiteSpace: "pre-line" }}>
          {trunc(p.body, large ? 400 : 90)}
        </p>
        {p.footer && <p style={{ fontSize: large ? 11 : 9, color: "#667781", marginTop: 4, marginBottom: 0 }}>{p.footer}</p>}
        {p.buttons?.length > 0 && (
          <div style={{ borderTop: "1px solid #E5E7EB", marginTop: 8, paddingTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
            {p.buttons.slice(0, large ? 3 : 2).map((btn, i) => (
              <div key={i} style={{ textAlign: "center", color: "#0A8FC4", fontSize: large ? 13 : 10, fontWeight: 500 }}>
                {btn.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SMSPreview({ p, large }) {
  return (
    <div style={{ background: "#FEF9F0", borderRadius: 8, padding: large ? 14 : 10, minHeight: large ? 260 : 140 }}>
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, padding: large ? "12px 14px" : "8px 10px" }}>
        {p.senderId && (
          <div style={{ fontSize: large ? 11 : 9, fontWeight: 600, color: "#8B5CF6", marginBottom: 6, letterSpacing: "0.05em" }}>
            {p.senderId}
          </div>
        )}
        <p style={{ fontSize: large ? 13 : 10, color: "#0F172A", lineHeight: 1.55, margin: 0, fontFamily: "inherit", whiteSpace: "pre-line" }}>
          {trunc(p.body, large ? 400 : 100)}
        </p>
        {p.dltId && (
          <p style={{ fontSize: 9, color: "#94A3B8", marginTop: 8, marginBottom: 0 }}>DLT ID: {p.dltId}</p>
        )}
      </div>
    </div>
  );
}

function EmailPreview({ p, large }) {
  return (
    <div style={{ background: "#F1F5F9", borderRadius: 8, padding: large ? 14 : 8, minHeight: large ? 260 : 140 }}>
      <div style={{ background: "#fff", borderRadius: 6, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ background: "#F8FAFC", padding: large ? "8px 12px" : "5px 8px", borderBottom: "1px solid #E2E8F0" }}>
          <span style={{ fontSize: large ? 11 : 9, color: "#64748B" }}>Subject: </span>
          <span style={{ fontSize: large ? 11 : 9, fontWeight: 700, color: "#0F172A" }}>{trunc(p.subject, large ? 80 : 45)}</span>
        </div>
        {p.preheader && (
          <div style={{ background: "#FAFAFA", padding: large ? "4px 12px" : "3px 8px", borderBottom: "1px solid #F1F5F9" }}>
            <span style={{ fontSize: large ? 10 : 8, color: "#94A3B8" }}>{trunc(p.preheader, large ? 80 : 50)}</span>
          </div>
        )}
        <div style={{ padding: large ? "12px 14px" : "8px 10px" }}>
          <p style={{ fontSize: large ? 13 : 10, color: "#334155", lineHeight: 1.5, margin: "0 0 10px 0", whiteSpace: "pre-line" }}>
            {trunc(p.body, large ? 300 : 80)}
          </p>
          {p.ctaLabel && (
            <div style={{ display: "inline-block", background: "#6C3AE8", color: "#fff", borderRadius: 6, padding: large ? "8px 18px" : "5px 12px", fontSize: large ? 13 : 10, fontWeight: 600 }}>
              {p.ctaLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PushPreview({ p, large }) {
  return (
    <div style={{ background: "#1E293B", borderRadius: 8, padding: large ? 14 : 10, minHeight: large ? 260 : 140, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {large && (
        <div style={{ display: "flex", gap: 4, marginBottom: 12, opacity: 0.4 }}>
          {["#EF4444","#F59E0B","#10B981"].map(c => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
        </div>
      )}
      <div style={{ background: "rgba(255,255,255,0.95)", borderRadius: 10, padding: large ? "12px 14px" : "8px 10px", display: "flex", gap: large ? 12 : 8, alignItems: "flex-start", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ width: large ? 36 : 26, height: large ? 36 : 26, borderRadius: 8, background: "#6C3AE8", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? 16 : 12 }}>🔔</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: large ? 13 : 10, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{trunc(p.title, large ? 80 : 45)}</div>
          <div style={{ fontSize: large ? 11 : 9, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>
            {trunc(p.body, large ? 150 : 60)}
          </div>
          {large && p.style === "image_banner" && (
            <div style={{ marginTop: 10, background: "linear-gradient(135deg,#FEF3C7,#FDE68A)", borderRadius: 6, height: 60, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#92400E" }}>
              🖼 Banner image
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RCSPreview({ p, large }) {
  return (
    <div style={{ background: "#EFF6FF", borderRadius: 8, padding: large ? 14 : 10, minHeight: large ? 260 : 140 }}>
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #BFDBFE", boxShadow: "0 2px 8px rgba(59,130,246,0.1)" }}>
        {p.cardImage && (
          <div style={{ background: "linear-gradient(135deg,#DBEAFE,#BFDBFE)", aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: large ? 22 : 14, opacity: 0.5 }}>🃏</span>
          </div>
        )}
        <div style={{ padding: large ? "12px 14px" : "8px 10px" }}>
          <div style={{ fontSize: large ? 14 : 11, fontWeight: 700, color: "#1E40AF", marginBottom: 3 }}>
            {trunc(p.title, large ? 80 : 45)}
          </div>
          <div style={{ fontSize: large ? 12 : 9, color: "#64748B", lineHeight: 1.4 }}>
            {trunc(p.body, large ? 200 : 60)}
          </div>
          {p.buttons?.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
              {p.buttons.slice(0, large ? 3 : 2).map((btn, i) => (
                <span key={i} style={{ fontSize: large ? 11 : 9, padding: "3px 10px", borderRadius: 20, border: "1px solid #3B82F6", color: "#3B82F6", fontWeight: 500 }}>
                  {btn.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OnsitePreview({ p, large }) {
  return (
    <div style={{ background: "#F1F5F9", borderRadius: 8, padding: large ? 8 : 6, minHeight: large ? 260 : 140 }}>
      {/* browser chrome */}
      <div style={{ background: "#E2E8F0", borderRadius: "8px 8px 0 0", padding: "5px 8px", display: "flex", gap: 5, alignItems: "center" }}>
        {["#EF4444","#F59E0B","#10B981"].map(c => (
          <div key={c} style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
        ))}
        <div style={{ flex: 1, background: "#fff", borderRadius: 4, height: 12, marginLeft: 6, opacity: 0.7 }} />
      </div>
      <div style={{ background: "#fff", borderRadius: "0 0 8px 8px", minHeight: large ? 220 : 110, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        {/* dimmed page bg */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.04)", borderRadius: "0 0 8px 8px" }} />
        {/* popup */}
        <div style={{ position: "relative", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: large ? "16px 20px" : "10px 12px", boxShadow: "0 4px 24px rgba(0,0,0,0.18)", textAlign: "center", maxWidth: large ? 280 : 160, width: "100%" }}>
          <div style={{ fontSize: large ? 15 : 11, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>{trunc(p.title, large ? 60 : 30)}</div>
          <div style={{ fontSize: large ? 12 : 9, color: "#64748B", marginBottom: 10 }}>{trunc(p.body, large ? 120 : 45)}</div>
          {p.ctaLabel && (
            <div style={{ background: "#6C3AE8", color: "#fff", borderRadius: 7, padding: large ? "8px 18px" : "5px 12px", fontSize: large ? 12 : 9, fontWeight: 700, display: "inline-block" }}>
              {p.ctaLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelPreview({ template, large = false }) {
  const p = template.preview;
  if (!p) return <div style={{ background: "#F8FAFC", borderRadius: 8, minHeight: large ? 260 : 140, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 11, color: "#94A3B8" }}>No preview</span></div>;
  switch (template.channel) {
    case "whatsapp": return <WhatsAppPreview p={p} large={large} />;
    case "sms":      return <SMSPreview p={p} large={large} />;
    case "email":    return <EmailPreview p={p} large={large} />;
    case "push":     return <PushPreview p={p} large={large} />;
    case "rcs":      return <RCSPreview p={p} large={large} />;
    case "onsite":   return <OnsitePreview p={p} large={large} />;
    default:         return null;
  }
}

// ─── status badge ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: m.bg, color: m.fg }}>
      {m.label}
    </span>
  );
}

// ─── quality badge ────────────────────────────────────────────────
function QualityBadge({ quality, showSource = false }) {
  if (!quality) return null;
  const m = QUALITY_META[quality.tier] || QUALITY_META.unknown;
  return (
    <span
      title={`${quality.label}${quality.source ? ` · ${quality.source}` : ""}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: m.bg, color: m.color, letterSpacing: "0.02em" }}
    >
      {m.label}
      {showSource && quality.source && <span style={{ fontWeight: 400, opacity: 0.75 }}>· {quality.source}</span>}
    </span>
  );
}

// ─── stat chip (sent / delivered / read) ──────────────────────────
function formatCount(n) {
  if (n == null) return "–";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

function StatChip({ label, value, accent = false }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 9, color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: accent ? "#0F172A" : "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
    </div>
  );
}

// ─── sparkline ────────────────────────────────────────────────────
function Sparkline({ values, color = "#6C3AE8" }) {
  if (!values?.length) return null;
  const w = 80, h = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── template card ─────────────────────────────────────────────────
function TemplateCard({ template, onView, onViewAnalytics }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const ch = CHANNEL_META[template.channel] || {};
  const Icon = CHANNEL_ICONS[template.channel] || MessageCircle;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${hovered ? ch.color || "#6C3AE8" : "#E5E7EB"}`,
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
        boxShadow: hovered ? `0 8px 32px ${ch.color}22` : "0 1px 4px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: ch.bgColor || "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={12} color={ch.color} strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {template.name}
          </span>
        </div>
        <StatusBadge status={template.status} />
      </div>

      {/* preview area */}
      <div style={{ padding: "0 10px", flex: 1 }}>
        <ChannelPreview template={template} />
      </div>

      {/* footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "8px 12px 10px", borderTop: "1px solid #F1F5F9", marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <QualityBadge quality={template.quality} />
            {!template.analytics && (
              <span style={{ fontSize: 10, color: "#94A3B8", fontStyle: "italic" }}>No data</span>
            )}
          </div>
          {template.usedInFlows > 0 && (
            <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 10, background: "#F1F5F9", color: "#64748B", fontWeight: 500 }}>
              {template.usedInFlows} flow{template.usedInFlows !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {template.analytics && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
            <StatChip label="Sent" value={formatCount(template.analytics.sent)} />
            <StatChip label="Del" value={`${template.analytics.delivered?.pct}%`} />
            <StatChip label="Read" value={`${template.analytics.read?.pct}%`} accent />
          </div>
        )}
      </div>

      {/* hover overlay */}
      {hovered && (
        <div
          style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: "rgba(15,23,42,0.62)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onView(template, "preview"); }}
            style={{ width: 168, padding: "9px 0", borderRadius: 8, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            View Details
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); navigate("/campaigns"); }}
            style={{ width: 168, padding: "8px 0", borderRadius: 8, background: "transparent", color: "#fff", fontSize: 13, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.6)", cursor: "pointer" }}
          >
            Send Campaign
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewAnalytics(template); }}
            style={{ background: "none", border: "none", color: "#A78BFA", fontSize: 12, fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
          >
            View Analytics
          </button>
        </div>
      )}
    </div>
  );
}

// ─── skeleton card ─────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: "#F1F5F9" }} />
        <div style={{ width: 120, height: 12, borderRadius: 6, background: "#F1F5F9" }} />
        <div style={{ marginLeft: "auto", width: 48, height: 16, borderRadius: 10, background: "#F1F5F9" }} />
      </div>
      <div style={{ background: "#F8FAFC", borderRadius: 8, height: 140, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <div style={{ width: 40, height: 10, borderRadius: 6, background: "#F1F5F9" }} />
        <div style={{ width: 56, height: 10, borderRadius: 6, background: "#F1F5F9" }} />
      </div>
    </div>
  );
}

// ─── filter panel ──────────────────────────────────────────────────
const ACCORDION_SECTIONS = [
  {
    id: "type", label: "Type",
    options: [{ value: "all", label: "All" }, { value: "marketing", label: "Marketing" }, { value: "utility", label: "Utility" }],
  },
  {
    id: "status", label: "Status",
    options: [
      { value: "all", label: "All" },
      { value: "active", label: "Active" },
      { value: "draft", label: "Draft" },
      { value: "rejected", label: "Rejected" },
      { value: "in_review", label: "In review" },
      { value: "disabled", label: "Disabled" },
      { value: "paused", label: "Paused" },
    ],
  },
  {
    id: "language", label: "Language",
    options: [{ value: "all", label: "All" }, { value: "english", label: "English" }, { value: "hindi", label: "Hindi" }, { value: "regional", label: "Regional" }],
  },
];

function FilterPanel({ filters, onChange, templateCounts, view }) {
  const [openSections, setOpenSections] = useState({ type: true, status: true, language: false, channel: true });
  const toggle = (id) => setOpenSections(p => ({ ...p, [id]: !p[id] }));

  const sections = view === "library"
    ? [{ id: "useCase", label: "Use Case", options: USE_CASES.map(u => ({ value: u === "All" ? "all" : u, label: u })) }]
    : ACCORDION_SECTIONS;

  return (
    <div style={{ width: 220, flexShrink: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 0", height: "fit-content", position: "sticky", top: 16 }}>
      <div style={{ padding: "0 14px 10px", borderBottom: "1px solid #F1F5F9", marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>Filters</span>
      </div>

      {view === "my" && (
        <div style={{ padding: "10px 14px 6px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Channel</div>
          {CHANNELS.map(ch => {
            const meta = ch === "all" ? null : CHANNEL_META[ch];
            const Icon = ch === "all" ? null : CHANNEL_ICONS[ch];
            const count = ch === "all"
              ? Object.values(templateCounts).reduce((a, b) => a + b, 0)
              : (templateCounts[ch] || 0);
            return (
              <label key={ch} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 8, cursor: "pointer", background: filters.channel === ch ? "#F5F3FF" : "transparent" }}>
                <input
                  type="radio" name="channel" value={ch}
                  checked={filters.channel === ch}
                  onChange={() => onChange({ ...filters, channel: ch })}
                  style={{ accentColor: "#6C3AE8" }}
                />
                {Icon && <Icon size={12} color={meta?.color} />}
                <span style={{ fontSize: 12, color: "#0F172A", flex: 1 }}>{ch === "all" ? "All" : meta?.label}</span>
                <span style={{ fontSize: 10, color: "#94A3B8" }}>{count}</span>
              </label>
            );
          })}
        </div>
      )}

      {sections.map(section => {
        const isOpen = openSections[section.id] !== false;
        return (
          <div key={section.id} style={{ borderTop: "1px solid #F1F5F9" }}>
            <button
              type="button"
              onClick={() => toggle(section.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px 6px", background: "none", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{section.label}</span>
              {isOpen ? <ChevronUp size={13} color="#94A3B8" /> : <ChevronDown size={13} color="#94A3B8" />}
            </button>
            {isOpen && (
              <div style={{ padding: "0 14px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
                {section.options.map(opt => (
                  <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 8, cursor: "pointer", background: (view === "library" ? filters.useCase : filters[section.id]) === opt.value ? "#F5F3FF" : "transparent" }}>
                    <input
                      type="radio"
                      name={section.id}
                      value={opt.value}
                      checked={(view === "library" ? filters.useCase : filters[section.id]) === opt.value}
                      onChange={() => {
                        if (view === "library") onChange({ ...filters, useCase: opt.value });
                        else onChange({ ...filters, [section.id]: opt.value });
                      }}
                      style={{ accentColor: "#6C3AE8" }}
                    />
                    <span style={{ fontSize: 12, color: "#0F172A" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {view === "my" && (
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "10px 14px 4px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={filters.usedInFlows}
              onChange={e => onChange({ ...filters, usedInFlows: e.target.checked })}
              style={{ accentColor: "#6C3AE8", width: 14, height: 14 }}
            />
            <span style={{ fontSize: 12, color: "#0F172A" }}>Used in active flows</span>
          </label>
        </div>
      )}
    </div>
  );
}

// ─── analytics funnel ──────────────────────────────────────────────
function AnalyticsFunnel({ analytics, timeWindow, onTimeWindowChange }) {
  if (!analytics) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#94A3B8" }}>
        <BarChart3 size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
        <div style={{ fontSize: 13, fontWeight: 500 }}>No send data yet</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>Use this template in a flow or campaign to start seeing performance.</div>
      </div>
    );
  }

  const steps = [
    { label: "Sent", count: analytics.sent, pct: 100, color: "#6C3AE8" },
    { label: "Delivered", count: analytics.delivered.count, pct: analytics.delivered.pct, color: "#3B82F6" },
    { label: "Read", count: analytics.read.count, pct: analytics.read.pct, color: "#10B981" },
    ...(analytics.clicked?.length ? [{ label: "Clicked", count: analytics.clicked.reduce((a, c) => a + c.count, 0), pct: analytics.clicked.reduce((a, c) => a + c.pct, 0), color: "#F59E0B" }] : []),
  ];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>Delivery & engagement</span>
        <select
          value={timeWindow}
          onChange={e => onTimeWindowChange(e.target.value)}
          style={{ fontSize: 11, color: "#64748B", border: "1px solid #E5E7EB", borderRadius: 6, padding: "3px 8px", background: "#fff", cursor: "pointer" }}
        >
          {["7d","30d","90d","all"].map(w => (
            <option key={w} value={w}>{ w === "7d" ? "Last 7 days" : w === "30d" ? "Last 30 days" : w === "90d" ? "Last 90 days" : "All time" }</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ flex: 1, background: "#F8FAFC", borderRadius: 10, padding: "12px 10px", border: `1px solid ${step.color}22` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: step.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{step.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>{fmtNum(step.count)}</div>
            {i > 0 && <div style={{ fontSize: 11, fontWeight: 600, color: step.color, marginTop: 2 }}>{step.pct.toFixed(1)}%</div>}
          </div>
        ))}
      </div>

      {/* connector line */}
      <div style={{ position: "relative", height: 3, background: "#F1F5F9", borderRadius: 4, marginBottom: 20 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${steps[steps.length - 1].pct}%`, background: "linear-gradient(to right,#6C3AE8,#10B981)", borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>

      {analytics.clicked?.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>CTA Breakdown</div>
          {analytics.clicked.map((cta, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, marginBottom: 6, border: "1px solid #F1F5F9" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send size={13} color="#F59E0B" />
              </div>
              <span style={{ flex: 1, fontSize: 13, color: "#0F172A" }}>{cta.label}</span>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: "#FEF9C3", color: "#A16207", fontWeight: 600 }}>{cta.pct.toFixed(2)}%</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{fmtNum(cta.count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── quality panel ─────────────────────────────────────────────────
function QualityPanel({ template }) {
  const q = template.quality;
  const eng = template.engagement;
  const qMeta = QUALITY_META[q?.tier] || QUALITY_META.unknown;

  const qualityExplanations = {
    high: `${q?.source || "The channel"} rates this template as High quality based on strong delivery rates, positive customer interactions, and low block rates. Maintain the content style to keep this rating.`,
    medium: `${q?.source || "The channel"} rates this template as Medium quality. There may be room to improve open rates or reduce opt-outs. Review the audience targeting and message relevance.`,
    low: `${q?.source || "The channel"} rates this template as Low quality. This can affect delivery to future subscribers. Edit the template content or reduce send frequency to improve the rating.`,
    unknown: `Quality is rated after the first 1,000 sends. Keep monitoring after your first campaign.`,
  };

  const engTrend = eng?.trend?.length >= 2
    ? eng.trend[eng.trend.length - 1] > eng.trend[0] ? "up"
    : eng.trend[eng.trend.length - 1] < eng.trend[0] ? "down" : "flat"
    : "flat";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {/* channel quality */}
      <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Channel Quality</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: qMeta.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: qMeta.color }}>{qMeta.label}</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{q?.label}</div>
            {q?.source && <div style={{ fontSize: 10, color: "#94A3B8" }}>via {q.source}</div>}
          </div>
        </div>
        <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
          {qualityExplanations[q?.tier || "unknown"]}
        </p>
      </div>

      {/* platform health */}
      <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "14px", border: "1px solid #E5E7EB" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Platform Health</div>
        {eng?.score != null ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: eng.score >= 70 ? "#10B981" : eng.score >= 40 ? "#F59E0B" : "#EF4444" }}>
                {eng.score}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#64748B" }}>/ 100</div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: engTrend === "up" ? "#10B981" : engTrend === "down" ? "#EF4444" : "#64748B" }}>
                  {engTrend === "up" ? <TrendingUp size={10} /> : engTrend === "down" ? <TrendingDown size={10} /> : <Minus size={10} />}
                  {engTrend === "up" ? "Improving" : engTrend === "down" ? "Declining" : "Stable"}
                </div>
              </div>
            </div>
            {eng.trend?.length > 0 && <Sparkline values={eng.trend} color={eng.score >= 70 ? "#10B981" : eng.score >= 40 ? "#F59E0B" : "#EF4444"} />}
            {eng.readRate != null && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#64748B" }}>Read rate: <span style={{ fontWeight: 700, color: "#0F172A" }}>{eng.readRate}%</span></div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8 }}>No data yet</div>
        )}
      </div>
    </div>
  );
}

// ─── detail drawer ─────────────────────────────────────────────────
function TemplateDetailDrawer({ template, initialTab = "preview", onClose, isLibrary = false }) {
  const [tab, setTab] = useState(initialTab);
  const [timeWindow, setTimeWindow] = useState("30d");
  const [kebabOpen, setKebabOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setTab(initialTab); }, [initialTab]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ch = CHANNEL_META[template.channel] || {};
  const Icon = CHANNEL_ICONS[template.channel] || MessageCircle;
  const tabs = isLibrary ? ["preview"] : ["preview", "analytics", "feedback"];

  const aiInsight = template.engagement?.score != null
    ? template.engagement.score >= 70
      ? `This template performs ${(template.engagement.score / 40).toFixed(1)}× above your ${ch.label} average — consider expanding its reach.`
      : template.engagement.score < 40
        ? `Read rate has dropped — review content relevance or audience targeting for this segment.`
        : `Performance is stable. Try A/B testing the CTA label to improve click-through rate.`
    : null;

  return (
    <>
      {/* backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40, backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />
      {/* drawer */}
      <div style={{ position: "fixed", top: 48, right: 0, bottom: 0, width: 580, background: "#fff", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", overflowY: "auto" }}>
        {/* drawer header */}
        <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: 7, background: ch.bgColor || "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={ch.color} strokeWidth={2.2} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: ch.color }}>{ch.label}</span>
                {!isLibrary && <StatusBadge status={template.status} />}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>{template.name}</h3>
              {!isLibrary && (
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 3 }}>
                  {template.category} · {template.subcategory} · Created {template.createdAt}
                </div>
              )}
              {isLibrary && template.description && (
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 1.4 }}>{template.description}</div>
              )}
            </div>
            <button type="button" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={14} color="#64748B" />
            </button>
          </div>

          {tabs.length > 1 && (
            <div style={{ display: "flex", gap: 0, borderBottom: "none" }}>
              {tabs.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{ padding: "8px 16px", fontSize: 13, fontWeight: tab === t ? 700 : 500, color: tab === t ? "#6C3AE8" : "#64748B", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#6C3AE8" : "transparent"}`, cursor: "pointer", textTransform: "capitalize" }}
                >
                  {t === "feedback" ? "Feedback" : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* drawer body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {tab === "preview" && (
            <div>
              {template.status === "rejected" && template.rejectionReason && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
                  <XCircle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", marginBottom: 2 }}>Rejected</div>
                    <div style={{ fontSize: 11, color: "#7F1D1D" }}>{template.rejectionReason}</div>
                  </div>
                </div>
              )}
              {template.status === "in_review" && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", gap: 8 }}>
                  <Clock size={15} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: "#92400E" }}>Submitted for approval · Est. 24–48 hrs</div>
                </div>
              )}
              {(template.channel === "whatsapp" || template.channel === "rcs") && template.status === "active" && (
                <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 12px", marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
                  <Info size={13} color="#15803D" />
                  <span style={{ fontSize: 11, color: "#166534" }}>Media is editable while sending campaign</span>
                </div>
              )}
              <ChannelPreview template={template} large />
              {!isLibrary && (
                <div style={{ marginTop: 16, background: "#F8FAFC", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                    {[
                      ["Template ID", template.templateId || "—"],
                      ["Category", template.category],
                      ["Language", template.language],
                      ["Type", template.type],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k}</div>
                        <div style={{ fontSize: 12, color: "#0F172A", fontWeight: 600, fontFamily: k === "Template ID" ? "monospace" : "inherit", marginTop: 1 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "analytics" && (
            <AnalyticsFunnel analytics={template.analytics} timeWindow={timeWindow} onTimeWindowChange={setTimeWindow} />
          )}

          {tab === "analytics" && template.analytics && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Quality Signals</div>
              <QualityPanel template={template} />
            </div>
          )}

          {tab === "feedback" && (
            <div>
              <QualityPanel template={template} />
              {aiInsight && (
                <div style={{ marginTop: 16, background: "linear-gradient(135deg,#FAF8FF,#F0EBFF)", border: "1px solid #DDD6FE", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10 }}>
                  <Sparkles size={16} color="#6C3AE8" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#6C3AE8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>AI Insight</div>
                    <p style={{ fontSize: 12, color: "#3B1A8A", lineHeight: 1.5, margin: 0 }}>{aiInsight}</p>
                  </div>
                </div>
              )}
              {template.status === "draft" && (
                <div style={{ marginTop: 16, background: "#F8FAFC", borderRadius: 10, padding: "14px 16px", border: "1px solid #E5E7EB" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Approval guidance</div>
                  <ul style={{ fontSize: 12, color: "#64748B", lineHeight: 1.7, margin: 0, paddingLeft: 16 }}>
                    <li>Ensure body copy matches the selected category (Marketing / Utility)</li>
                    <li>Avoid promotional language in Utility templates</li>
                    <li>Placeholder variables must use the correct format: {`{{variable.name}}`}</li>
                    <li>For WhatsApp: templates must be approved by Meta before first send</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* drawer footer */}
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "12px 20px", flexShrink: 0, display: "flex", gap: 8, background: "#fff" }}>
          {isLibrary ? (
            <button
              type="button"
              onClick={() => { toast.success("Template added to your library — customise and submit for approval"); onClose(); }}
              style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
            >
              Use this template
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => toast.info("Template editor coming soon")}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#F1F5F9", color: "#0F172A", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => toast.info("Test message sent to your number")}
                style={{ flex: 1, padding: "9px 0", borderRadius: 8, background: "#F1F5F9", color: "#0F172A", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Test
              </button>
              <button
                type="button"
                onClick={() => navigate("/campaigns")}
                style={{ flex: 2, padding: "9px 0", borderRadius: 8, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Send Campaign
              </button>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setKebabOpen(o => !o)}
                  style={{ width: 36, height: 36, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <MoreVertical size={15} color="#64748B" />
                </button>
                {kebabOpen && (
                  <div style={{ position: "absolute", bottom: 44, right: 0, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", width: 160, zIndex: 10, overflow: "hidden" }}>
                    {[
                      { icon: Copy, label: "Duplicate", action: () => toast.success("Template duplicated") },
                      { icon: Archive, label: "Archive", action: () => toast.success("Template archived") },
                      { icon: Trash2, label: "Delete", action: () => toast.error("Template deleted"), color: "#EF4444" },
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => { item.action(); setKebabOpen(false); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: item.color || "#0F172A", textAlign: "left" }}
                      >
                        <item.icon size={13} color={item.color || "#64748B"} />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── channel picker modal ──────────────────────────────────────────
const CHANNEL_DESCRIPTORS = {
  whatsapp: "Rich messages with buttons & media",
  sms:      "Plain text with DLT compliance",
  email:    "Subject, body, HTML layouts",
  push:     "Notifications for Android, iOS & Web",
  rcs:      "Rich cards with carousels & actions",
  onsite:   "Popups, banners & embedded widgets",
};

function ChannelPickerModal({ open, onClose }) {
  const [selected, setSelected] = useState(null);
  const [notifyChannels, setNotifyChannels] = useState({});
  const [step, setStep] = useState("pick"); // "pick" | "comingsoon"

  useEffect(() => { if (!open) { setSelected(null); setStep("pick"); } }, [open]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const channels = ["whatsapp","sms","email","push","rcs","onsite"];

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 60, backdropFilter: "blur(2px)" }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 16, zIndex: 70, width: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        {step === "pick" ? (
          <>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>What channel is this template for?</h2>
                <p style={{ fontSize: 12, color: "#64748B", margin: "4px 0 0" }}>Choose the channel to define the template structure.</p>
              </div>
              <button type="button" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={13} color="#64748B" />
              </button>
            </div>
            <div style={{ padding: "16px 24px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {channels.map(ch => {
                const meta = CHANNEL_META[ch];
                const Icon = CHANNEL_ICONS[ch];
                const isSel = selected === ch;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => { setSelected(ch); setStep("comingsoon"); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${isSel ? meta.color : "#E5E7EB"}`, background: isSel ? meta.bgColor : "#fff", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: meta.bgColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={16} color={meta.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{meta.label}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", lineHeight: 1.3, marginTop: 1 }}>{CHANNEL_DESCRIPTORS[ch]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 10 }}>
              <button type="button" onClick={() => setStep("pick")} style={{ width: 28, height: 28, borderRadius: 8, background: "#F1F5F9", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowLeft size={13} color="#64748B" />
              </button>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {selected && CHANNEL_META[selected]?.label} template builder
              </h2>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: selected ? CHANNEL_META[selected]?.bgColor : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  {selected && (() => { const Icon = CHANNEL_ICONS[selected]; return <Icon size={24} color={CHANNEL_META[selected]?.color} />; })()}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Coming soon</h3>
                <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.5, margin: 0 }}>
                  The {selected && CHANNEL_META[selected]?.label} template creation form is under development. Toggle the notification below to be the first to know when it's ready.
                </p>
              </div>
              <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: 13, color: "#0F172A" }}>Notify me when ready</span>
                <button
                  type="button"
                  onClick={() => setNotifyChannels(p => ({ ...p, [selected]: !p[selected] }))}
                  style={{ width: 40, height: 22, borderRadius: 11, background: notifyChannels[selected] ? "#6C3AE8" : "#CBD5E1", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                >
                  <span style={{ position: "absolute", top: 2, left: notifyChannels[selected] ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                </button>
              </div>
              {notifyChannels[selected] && (
                <p style={{ fontSize: 11, color: "#10B981", textAlign: "center", marginTop: 8 }}>✓ You'll be notified when this is ready</p>
              )}
            </div>
            <div style={{ padding: "0 24px 20px" }}>
              <button type="button" onClick={onClose} style={{ width: "100%", padding: "10px 0", borderRadius: 8, background: "#F1F5F9", color: "#64748B", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ─── library card ──────────────────────────────────────────────────
function LibraryCard({ template, onPreview, onUse }) {
  const [hovered, setHovered] = useState(false);
  const ch = CHANNEL_META[template.channel] || {};
  const Icon = CHANNEL_ICONS[template.channel] || MessageCircle;

  return (
    <div
      style={{
        background: "#fff", border: `1px solid ${hovered ? ch.color : "#E5E7EB"}`, borderRadius: 14, overflow: "hidden",
        cursor: "pointer", transition: "all 0.15s", boxShadow: hovered ? `0 8px 28px ${ch.color}1A` : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-2px)" : "none", position: "relative", display: "flex", flexDirection: "column",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px 8px" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: ch.bgColor, color: ch.color, fontWeight: 600 }}>{ch.label}</span>
          <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#F1F5F9", color: "#64748B", fontWeight: 500 }}>{template.useCase}</span>
        </div>
      </div>
      <div style={{ padding: "0 10px" }}>
        <ChannelPreview template={template} />
      </div>
      {template.description && (
        <div style={{ padding: "8px 12px 10px", fontSize: 10, color: "#94A3B8", lineHeight: 1.4 }}>
          {trunc(template.description, 80)}
        </div>
      )}

      {hovered && (
        <div style={{ position: "absolute", inset: 0, borderRadius: 14, background: "rgba(15,23,42,0.58)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <button type="button" onClick={(e) => { e.stopPropagation(); onPreview(template); }}
            style={{ width: 168, padding: "9px 0", borderRadius: 8, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            Preview
          </button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onUse(template); }}
            style={{ width: 168, padding: "8px 0", borderRadius: 8, background: "transparent", color: "#fff", fontSize: 13, fontWeight: 500, border: "1.5px solid rgba(255,255,255,0.6)", cursor: "pointer" }}>
            Use this template
          </button>
        </div>
      )}
    </div>
  );
}

// ─── empty state ───────────────────────────────────────────────────
function EmptyState({ type, onPrimary, onSecondary }) {
  const configs = {
    no_templates: {
      emoji: "📋",
      title: "Your template library is empty",
      desc: "Create your first template or start from a curated ecommerce starter.",
      primary: "Create template", secondary: "Browse Library",
    },
    no_results: {
      emoji: "🔍",
      title: "No templates match your filters",
      desc: "Try adjusting your filters or search term.",
      primary: "Clear filters", secondary: null,
    },
    library_empty: {
      emoji: "✨",
      title: "No starters for this use case yet",
      desc: "We're adding new starters regularly. Check back soon.",
      primary: null, secondary: null,
    },
  };
  const c = configs[type] || configs.no_results;
  return (
    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{c.emoji}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{c.title}</div>
      <div style={{ fontSize: 13, color: "#64748B", marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>{c.desc}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {c.primary && (
          <button type="button" onClick={onPrimary} style={{ padding: "9px 20px", borderRadius: 8, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            {c.primary}
          </button>
        )}
        {c.secondary && (
          <button type="button" onClick={onSecondary} style={{ padding: "9px 20px", borderRadius: 8, background: "#F1F5F9", color: "#0F172A", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
            {c.secondary}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── main page ─────────────────────────────────────────────────────
const FILTER_DEFAULTS = { channel: "all", type: "all", status: "all", language: "all", usedInFlows: false, useCase: "all" };
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most_used", label: "Most used in flows" },
  { value: "read_rate", label: "Highest read rate" },
  { value: "alpha", label: "Alphabetical" },
];

export default function TemplatesPage() {
  const [view, setView] = useState("my"); // "my" | "library"
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [drawerTemplate, setDrawerTemplate] = useState(null);
  const [drawerTab, setDrawerTab] = useState("preview");
  const [drawerIsLibrary, setDrawerIsLibrary] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [myTemplates, setMyTemplates] = useState(MOCK_TEMPLATES);
  const syncTimerRef = useRef(null);

  // computed filtered + sorted list
  const filtered = useMemo(() => {
    const src = view === "my" ? myTemplates : TEMPLATE_LIBRARY;
    return src.filter(t => {
      if (view === "my") {
        if (filters.channel !== "all" && t.channel !== filters.channel) return false;
        if (filters.type !== "all" && t.type !== filters.type) return false;
        if (filters.status !== "all" && t.status !== filters.status) return false;
        if (filters.language !== "all" && t.language !== filters.language) return false;
        if (filters.usedInFlows && (t.usedInFlows || 0) === 0) return false;
      } else {
        if (filters.useCase !== "all" && t.useCase !== filters.useCase) return false;
        if (filters.channel !== "all" && t.channel !== filters.channel) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return t.name.toLowerCase().includes(q) || (t.preview?.body || "").toLowerCase().includes(q) || (t.preview?.subject || "").toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => {
      if (sort === "alpha") return a.name.localeCompare(b.name);
      if (sort === "most_used") return (b.usedInFlows || 0) - (a.usedInFlows || 0);
      if (sort === "read_rate") return (b.engagement?.readRate || 0) - (a.engagement?.readRate || 0);
      return new Date(b.createdAt || "2020-01-01") - new Date(a.createdAt || "2020-01-01");
    });
  }, [view, myTemplates, filters, search, sort]);

  // channel counts for filter panel
  const templateCounts = useMemo(() =>
    myTemplates.reduce((acc, t) => { acc[t.channel] = (acc[t.channel] || 0) + 1; return acc; }, {}),
  [myTemplates]);

  // active filter chips
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.channel !== "all") chips.push({ key: "channel", label: `Channel: ${CHANNEL_META[filters.channel]?.label}` });
    if (filters.type !== "all") chips.push({ key: "type", label: `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}` });
    if (filters.status !== "all") chips.push({ key: "status", label: `Status: ${STATUS_META[filters.status]?.label}` });
    if (filters.language !== "all") chips.push({ key: "language", label: `Language: ${filters.language.charAt(0).toUpperCase() + filters.language.slice(1)}` });
    if (filters.usedInFlows) chips.push({ key: "usedInFlows", label: "Used in active flows" });
    if (view === "library" && filters.useCase !== "all") chips.push({ key: "useCase", label: `Use case: ${filters.useCase}` });
    return chips;
  }, [filters, view]);

  const removeChip = (key) => setFilters(p => ({ ...p, [key]: key === "usedInFlows" ? false : "all" }));

  const handleSync = () => {
    setSyncing(true);
    syncTimerRef.current = setTimeout(() => { setSyncing(false); toast.success("Templates synced"); }, 1500);
  };

  const handleUseLibraryTemplate = (template) => {
    const newDraft = { ...template, id: `custom_${Date.now()}`, status: "draft", usedInFlows: 0, quality: { tier: "unknown", label: "Not submitted", source: null }, engagement: { score: null, readRate: null, trend: [] }, analytics: null, createdAt: new Date().toISOString().slice(0, 10) };
    setMyTemplates(p => [newDraft, ...p]);
    setView("my");
    setDrawerTemplate(newDraft);
    setDrawerTab("preview");
    setDrawerIsLibrary(false);
    toast.success("Template added to your library — customise and submit for approval");
  };

  const openView = (template, tab = "preview", isLib = false) => {
    setDrawerTemplate(template);
    setDrawerTab(tab);
    setDrawerIsLibrary(isLib);
  };

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-templates">
      {/* page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: "-0.02em" }}>Templates</h1>
          <p style={{ fontSize: 13, color: "#64748B", margin: "3px 0 0" }}>Create and manage message templates across all channels.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 9, background: "#6C3AE8", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(108,58,232,0.3)" }}
        >
          <Plus size={15} />
          Create new template
        </button>
      </div>

      {/* body */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        {/* left filter panel */}
        <FilterPanel filters={filters} onChange={setFilters} templateCounts={templateCounts} view={view} />

        {/* main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* view toggle + sync */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 9, padding: 3, gap: 2 }}>
                {["my", "library"].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setView(v); setFilters(FILTER_DEFAULTS); setSearch(""); }}
                    style={{ padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", background: view === v ? "#fff" : "transparent", color: view === v ? "#0F172A" : "#64748B", boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}
                  >
                    {v === "my" ? "My templates" : "Template Library"}
                  </button>
                ))}
              </div>
              {view === "library" && (
                <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Curated by Dowl · ecommerce starters</span>
              )}
              {view === "my" && (
                <button
                  type="button"
                  onClick={handleSync}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, background: "transparent", color: "#64748B", fontSize: 11, border: "1px solid #E5E7EB", cursor: "pointer" }}
                >
                  <RefreshCcw size={11} style={{ animation: syncing ? "spin 0.8s linear infinite" : "none" }} />
                  Sync
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* search */}
              <div style={{ position: "relative" }}>
                <Search size={13} color="#94A3B8" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  style={{ paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", color: "#0F172A", outline: "none", width: 200 }}
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={11} color="#94A3B8" />
                  </button>
                )}
              </div>
              {/* sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={{ fontSize: 12, color: "#0F172A", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 10px", background: "#fff", cursor: "pointer" }}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {activeChips.map(chip => (
                <span key={chip.key} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 500, padding: "3px 9px", borderRadius: 20, background: "#EDE9FE", color: "#6C3AE8", border: "1px solid #DDD6FE" }}>
                  {chip.label}
                  <button type="button" onClick={() => removeChip(chip.key)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
                    <X size={10} color="#6C3AE8" />
                  </button>
                </span>
              ))}
              <button type="button" onClick={() => setFilters(FILTER_DEFAULTS)} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: "3px 2px" }}>
                Clear all
              </button>
            </div>
          )}

          {/* grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            {filtered.length === 0 ? (
              <EmptyState
                type={myTemplates.length === 0 && view === "my" ? "no_templates" : "no_results"}
                onPrimary={() => {
                  if (myTemplates.length === 0) setCreateOpen(true);
                  else setFilters(FILTER_DEFAULTS);
                }}
                onSecondary={() => setView("library")}
              />
            ) : view === "my" ? (
              filtered.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  onView={(tpl, tab) => openView(tpl, tab, false)}
                  onViewAnalytics={(tpl) => openView(tpl, "analytics", false)}
                />
              ))
            ) : (
              filtered.map(t => (
                <LibraryCard
                  key={t.id}
                  template={t}
                  onPreview={(tpl) => openView(tpl, "preview", true)}
                  onUse={handleUseLibraryTemplate}
                />
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
              Showing {filtered.length} of {view === "my" ? myTemplates.length : TEMPLATE_LIBRARY.length} templates
            </div>
          )}
        </div>
      </div>

      {/* detail drawer */}
      {drawerTemplate && (
        <TemplateDetailDrawer
          template={drawerTemplate}
          initialTab={drawerTab}
          isLibrary={drawerIsLibrary}
          onClose={() => setDrawerTemplate(null)}
        />
      )}

      {/* channel picker modal */}
      <ChannelPickerModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
      `}</style>
    </div>
  );
}
