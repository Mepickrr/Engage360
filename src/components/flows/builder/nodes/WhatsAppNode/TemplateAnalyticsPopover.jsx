import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Info, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";
import { BORDER, MUTED } from "./FormFields";
import { getTemplateAnalytics } from "./data/mockTemplateAnalytics";

const ORANGE = "#C2410C";
const INK = "#0F172A";
const POPOVER_WIDTH = 340;
const MARGIN = 8;

function fmt(n) {
  if (n == null) return "—";
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

const DEFAULT_METRICS = [
  { label: "Sent", value: (d) => fmt(d.sent) },
  { label: "Delivered", value: (d) => `${fmt(d.delivered)} · ${d.deliveredPct}%` },
  { label: "Read", value: (d) => `${fmt(d.read)} · ${d.readPct}%` },
  { label: "CTR", value: (d) => `${fmt(d.clicks)} · ${d.ctrPct}%` },
];

function MetricRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>{value}</span>
    </div>
  );
}

function ComparisonBlock({ headline, thisLabel, thisValue, similarValue }) {
  const lower = thisValue < similarValue;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>
          {headline} {lower ? "lower" : "higher"} than others
        </span>
        <Info size={12} style={{ color: MUTED, flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>{thisLabel}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: lower ? ORANGE : INK }}>{thisValue}%</div>
        </div>
        <div style={{ width: 1, background: BORDER }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: MUTED, marginBottom: 3 }}>Similar templates</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>{similarValue}%</div>
        </div>
      </div>
    </div>
  );
}

function RecommendationsCarousel({ recommendations }) {
  const [index, setIndex] = useState(0);
  const rec = recommendations[index];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>Recommendations</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Actions you can take</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronLeft size={13} /></button>
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(recommendations.length - 1, i + 1))}
            disabled={index === recommendations.length - 1}
            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BORDER}`, background: "#fff", cursor: index === recommendations.length - 1 ? "default" : "pointer", opacity: index === recommendations.length - 1 ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronRight size={13} /></button>
        </div>
      </div>

      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: INK, lineHeight: 1.4, marginBottom: 6 }}>{rec.title}</div>
        <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.5, marginBottom: 12 }}>{rec.description}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" style={{ padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 7, background: "#fff", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            See details
          </button>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px", border: `1px solid ${BORDER}`, borderRadius: 7, background: "#fff", fontSize: 11, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
            <Pencil size={11} /> Edit template
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 10 }}>
        {recommendations.map((_, i) => (
          <div key={i} style={{ width: i === index ? 14 : 6, height: 6, borderRadius: 3, background: i === index ? "#4338CA" : "#E2E8F0", transition: "width 0.15s" }} />
        ))}
      </div>
    </div>
  );
}

function FeedbackRow() {
  const [choice, setChoice] = useState(null);
  return (
    <div>
      <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>Are these benchmarks and recommendations useful?</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => setChoice("yes")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${choice === "yes" ? "#25D366" : BORDER}`, background: choice === "yes" ? "#F0FDF4" : "#fff", fontSize: 11, fontWeight: 600, color: choice === "yes" ? "#15803D" : "#475569", cursor: "pointer" }}
        ><ThumbsUp size={12} /> Yes</button>
        <button
          type="button"
          onClick={() => setChoice("no")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: `1px solid ${choice === "no" ? "#EF4444" : BORDER}`, background: choice === "no" ? "#FEF2F2" : "#fff", fontSize: 11, fontWeight: 600, color: choice === "no" ? "#B91C1C" : "#475569", cursor: "pointer" }}
        ><ThumbsDown size={12} /> No</button>
      </div>
    </div>
  );
}

export default function TemplateAnalyticsPopover({
  anchorRect,
  template,
  showMetaInsights,
  onClose,
  getAnalytics = getTemplateAnalytics,
  metrics = DEFAULT_METRICS,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
    }
    function handleKey(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (!anchorRect) return null;
  const data = getAnalytics(template);

  const left = Math.min(Math.max(anchorRect.left, MARGIN), window.innerWidth - POPOVER_WIDTH - MARGIN);
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < 320 && anchorRect.top > 320;
  const maxHeight = Math.min(520, (openUpward ? anchorRect.top : window.innerHeight - anchorRect.bottom) - 16);

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed", left,
        ...(openUpward ? { bottom: window.innerHeight - anchorRect.top + 8 } : { top: anchorRect.bottom + 8 }),
        width: POPOVER_WIDTH, maxHeight: Math.max(maxHeight, 240), overflowY: "auto",
        background: "#fff", borderRadius: 12, border: `1px solid ${BORDER}`,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)", zIndex: 2000,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: "#fff" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Template Analytics</span>
        <button type="button" onClick={onClose} style={{ width: 22, height: 22, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {metrics.map((m) => <MetricRow key={m.label} label={m.label} value={m.value(data)} />)}
      </div>

      {showMetaInsights && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: 14, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: INK }}>Template benchmarks</span>
              <Info size={12} style={{ color: MUTED }} />
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{data.metaInsights.dateRange}</div>
          </div>

          <ComparisonBlock headline="Your read rate is" thisLabel="This template" thisValue={data.metaInsights.readRate.thisTemplate} similarValue={data.metaInsights.readRate.similar} />
          <div style={{ height: 1, background: BORDER }} />
          <ComparisonBlock headline="Your click rate is" thisLabel="This template" thisValue={data.metaInsights.clickRate.thisTemplate} similarValue={data.metaInsights.clickRate.similar} />
          <div style={{ height: 1, background: BORDER }} />

          <RecommendationsCarousel recommendations={data.metaInsights.recommendations} />
          <div style={{ height: 1, background: BORDER }} />

          <FeedbackRow />
        </div>
      )}
    </div>,
    document.body
  );
}
