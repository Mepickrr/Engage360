import React from "react";
import { Image as ImageIcon, Sparkles } from "lucide-react";
import { ONSITE_TEAL } from "./data/mockData";

const MUTED = "#94A3B8";

export const DEFAULT_THEME = { bg: "#FFFFFF", ink: "#0F172A", muted: "#475569", accent: ONSITE_TEAL, accentInk: "#FFFFFF" };

export function resolveTheme(draft) {
  const theme = { ...DEFAULT_THEME, ...draft?.theme };
  if (draft?.bgColor) theme.bg = draft.bgColor;
  return theme;
}

const FIELD_LABELS = { name: "Full name", phone: "Phone number", email: "Email address" };
const SMART_SAMPLE = { name: "Priya Sharma", phone: "+91 98•••• 3210" };

// Read-only render of a single content block. The editor reuses it, wrapping
// title/text/button in contentEditable, so preview and canvas never drift.
export function PreviewBlock({ block, theme = DEFAULT_THEME, compact }) {
  const t = theme;
  if (block.type === "badge") {
    return <div style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", color: t.accent, border: `1.5px solid ${t.accent}`, borderRadius: 20, padding: "3px 10px" }}>{block.text || "LABEL"}</div>;
  }
  if (block.type === "title") {
    return <div style={{ fontSize: compact ? 14 : 20, fontWeight: 800, color: t.ink, lineHeight: 1.25 }}>{block.content || "Your headline here"}</div>;
  }
  if (block.type === "text") {
    if (block.style === "link") return <div style={{ fontSize: 12, color: t.muted, textAlign: "center", textDecoration: "underline" }}>{block.content}</div>;
    return <p style={{ fontSize: compact ? 13 : 13.5, color: compact ? t.ink : t.muted, lineHeight: 1.55, margin: 0, fontWeight: compact ? 600 : 400 }}>{block.content || "Your message body…"}</p>;
  }
  if (block.type === "image") {
    if (block.src) return <img src={block.src} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} />;
    return (
      <div style={{ width: "100%", height: block.emoji ? 110 : 130, background: block.bg || "#F1F5F9", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 46 }}>
        {block.emoji || <ImageIcon size={24} color="#CBD5E1" />}
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div style={{ display: "flex", justifyContent: compact ? "flex-start" : "center" }}>
        <span style={{ display: "inline-block", padding: compact ? "7px 16px" : "11px 28px", background: t.accent, color: t.accentInk, borderRadius: 8, fontSize: compact ? 12 : 14, fontWeight: 700, whiteSpace: "nowrap" }}>
          {block.label || "Click Here"}
        </span>
      </div>
    );
  }
  if (block.type === "form") {
    const fields = block.fields?.length ? block.fields : ["email"];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fields.map((f) => (
          <div key={f} style={{ padding: "9px 12px", border: `1px solid ${t.muted}55`, borderRadius: 8, fontSize: 13, background: "rgba(255,255,255,0.9)", color: block.smart && SMART_SAMPLE[f] ? "#0F172A" : MUTED, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {block.smart && SMART_SAMPLE[f] ? SMART_SAMPLE[f] : FIELD_LABELS[f] || f}
            {block.smart && SMART_SAMPLE[f] && <span style={{ fontSize: 9, fontWeight: 700, color: ONSITE_TEAL }}>PREFILLED</span>}
          </div>
        ))}
        <div style={{ padding: "10px", background: t.accent, color: t.accentInk, borderRadius: 8, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
          {block.cta || "Submit"}
        </div>
        {block.smart && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 10, color: t.muted }}>
            <Sparkles size={10} /> Smart Pop-up · details prefilled for recognised shoppers
          </div>
        )}
      </div>
    );
  }
  if (block.type === "countdown") {
    const size = compact ? 26 : 44;
    return (
      <div style={{ display: "flex", gap: compact ? 4 : 8, justifyContent: "center" }}>
        {["00", "12", "34", "56"].map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: size, height: size, background: t.accent, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: t.accentInk, fontWeight: 700, fontSize: compact ? 12 : 18 }}>{v}</div>
            {!compact && <div style={{ fontSize: 9, color: t.muted, marginTop: 3 }}>{["Days", "Hrs", "Min", "Sec"][i]}</div>}
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "coupon") {
    return (
      <div style={{ alignSelf: compact ? "center" : "stretch", textAlign: "center", padding: compact ? "5px 12px" : "10px", border: `2px dashed ${t.accent}`, borderRadius: 8, fontSize: compact ? 12 : 16, fontWeight: 800, letterSpacing: "0.15em", color: t.ink }}>
        {block.code || "CODE10"}
      </div>
    );
  }
  if (block.type === "options") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {(block.items || []).map((o) => (
          <div key={o} style={{ padding: "8px", border: `1.5px solid ${t.muted}55`, borderRadius: 8, fontSize: 12, color: t.ink, textAlign: "center" }}>{o}</div>
        ))}
      </div>
    );
  }
  if (block.type === "line") return <hr style={{ border: "none", borderTop: `1px solid ${t.muted}33`, margin: "4px 0" }} />;
  if (block.type === "spacer") return <div style={{ height: 20 }} />;
  if ((block.type === "custom" && block.subtype === "spin_wheel") || block.type === "spin_wheel") {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 110, height: 110, borderRadius: "50%", background: `conic-gradient(${t.accent} 0deg 60deg, #F59E0B 60deg 120deg, #EF4444 120deg 180deg, #8B5CF6 180deg 240deg, #3B82F6 240deg 300deg, #10B981 300deg 360deg)`, border: "4px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }} />
      </div>
    );
  }
  if ((block.type === "custom" && block.subtype === "scratch_card") || block.type === "scratch_card") {
    return (
      <div style={{ width: "100%", height: 90, background: "repeating-linear-gradient(45deg, #94A3B8, #94A3B8 8px, #CBD5E1 8px, #CBD5E1 16px)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 700, background: "rgba(255,255,255,0.85)", padding: "4px 10px", borderRadius: 6 }}>🎟 Scratch here</span>
      </div>
    );
  }
  return <div style={{ padding: "8px 0", textAlign: "center", fontSize: 12, color: MUTED }}>[{block.type}] block</div>;
}

// Lays the blocks out for each display type. Shared with the editor canvas.
export function TemplateBody({ draft, renderBlock }) {
  const blocks = draft?.blocks || [];
  const theme = resolveTheme(draft);
  const isBanner = draft?.displayType === "banner";
  const isNudge = draft?.displayType === "nudge";
  const draw = (b, i) => (renderBlock ? renderBlock(b, i, theme) : <PreviewBlock key={i} block={b} theme={theme} compact={isBanner || isNudge} />);

  if (blocks.length === 0) {
    return <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: MUTED }}>No content blocks yet</div>;
  }
  if (isBanner) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 14 }}>{blocks.map(draw)}</div>;
  }
  const imgIdx = draft?.layout === "split" ? blocks.findIndex((b) => b.type === "image") : -1;
  if (imgIdx >= 0 && !isNudge) {
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        <div style={{ flex: "0 0 42%", display: "flex" }}>
          <div style={{ flex: 1, borderRadius: 10, background: blocks[imgIdx].bg || "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54 }}>{blocks[imgIdx].emoji}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
          {blocks.map((b, i) => (i === imgIdx ? null : draw(b, i)))}
        </div>
      </div>
    );
  }
  return <div style={{ display: "flex", flexDirection: "column", gap: isNudge ? 8 : 12 }}>{blocks.map(draw)}</div>;
}

// The card/bar shape on a mock page backdrop — sized to its content.
export default function OnsitePreview({ draft }) {
  const theme = resolveTheme(draft);
  const isBanner = draft?.displayType === "banner";
  const isNudge = draft?.displayType === "nudge";
  const split = draft?.layout === "split";

  if (isBanner) {
    return (
      <div style={{ background: "#F1F5F9", borderRadius: 10, padding: 10 }}>
        <div style={{ background: theme.bg, borderRadius: 8, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <TemplateBody draft={draft} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#CBD5E1", borderRadius: 10, padding: 16, display: "flex", justifyContent: isNudge ? "flex-end" : "center", position: "relative" }}>
      {!isNudge && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", borderRadius: 10 }} />}
      <div style={{ position: "relative", zIndex: 1, width: isNudge ? 220 : split ? "min(460px, 100%)" : "min(340px, 100%)", background: theme.bg, borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.18)", padding: isNudge ? 14 : "22px 22px 18px" }}>
        <TemplateBody draft={draft} />
      </div>
    </div>
  );
}
