// Analytics footer appended below a node card in analytics mode.
// Each node passes data.analyticsData + its type to decide what to show.

import React from "react";

const BG  = "#1E1B4B";
const LBL = "#A5B4FC";
const VAL = "#FFFFFF";
const HI  = "#C4B5FD";

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

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", lineHeight: 1.2 }}>
      <span style={{ fontSize: 10, color: LBL }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: highlight ? HI : VAL }}>{value}</span>
    </div>
  );
}

function rows(type, a) {
  switch (type) {
    case "start-trigger":
    case "trigger":
      return [
        <Row key="t" label="Triggered" value={fmt(a.triggered)} />,
        <Row key="s" label="Stopped"   value={fmt(a.stopped)}   />,
      ];
    case "wait":
      return [
        <Row key="t"  label="Triggered"    value={fmt(a.triggered)}   />,
        <Row key="sr" label="Success rate" value={pct(a.success_rate)} highlight />,
      ];
    case "whatsapp":
      return [
        <Row key="s"  label="Sent"      value={fmt(a.sent)}           />,
        <Row key="d"  label="Delivered" value={pct(a.delivered_pct)}   highlight />,
        <Row key="o"  label="Opened"    value={pct(a.opened_pct)}      highlight />,
        <Row key="r"  label="Revenue"   value={fmtINR(a.revenue_inr)} />,
        ...(a.cta_clicks ?? []).map((cta, i) => (
          <Row key={`cta${i}`} label={cta.label} value={fmt(cta.clicks)} />
        )),
      ];
    case "aichatbot":
    case "onsite":
    case "inapp":
    case "nextbestaction":
    case "smartflowoptimizer":
      return [
        <Row key="s"  label="Shown"      value={fmt(a.shown)}           />,
        <Row key="c"  label="Clicked"    value={pct(a.clicked_pct)}      highlight />,
        <Row key="d"  label="Dismissed"  value={pct(a.dismissed_pct)}    />,
        <Row key="r"  label="Revenue"    value={fmtINR(a.revenue_inr)}  />,
      ];
    case "email":
      return [
        <Row key="s"  label="Sent"        value={fmt(a.sent)}             />,
        <Row key="d"  label="Delivered"   value={pct(a.delivered_pct)}     highlight />,
        <Row key="o"  label="Opened"      value={pct(a.opened_pct)}        highlight />,
        <Row key="c"  label="Clicked"     value={pct(a.clicked_pct)}       highlight />,
        <Row key="r"  label="Revenue"     value={fmtINR(a.revenue_inr)}   />,
      ];
    case "sms":
      return [
        <Row key="s" label="Sent"      value={fmt(a.sent)}           />,
        <Row key="d" label="Delivered" value={pct(a.delivered_pct)}   highlight />,
        <Row key="c" label="CTR"       value={pct(a.ctr_pct)}         highlight />,
        <Row key="r" label="Revenue"   value={fmtINR(a.revenue_inr)} />,
      ];
    case "conditionalsplit":
      return [
        <Row key="t" label="Triggered" value={fmt(a.triggered)} />,
        ...(a.branches ?? []).map((b, i) => (
          <Row key={`b${i}`} label={b.label} value={pct(b.pct)} highlight />
        )),
      ];
    default:
      return null;
  }
}

export default function NodeAnalyticsFooter({ type, analyticsData, borderRadius = "0 0 12px 12px" }) {
  if (!analyticsData) return null;
  const content = rows(type, analyticsData);
  if (!content) return null;

  return (
    <div style={{
      background: BG,
      borderRadius,
      padding: "8px 12px 9px",
      display: "flex",
      flexDirection: "column",
      gap: 5,
      marginTop: -1, // close the visual gap with the node card above
    }}>
      {content}
    </div>
  );
}
