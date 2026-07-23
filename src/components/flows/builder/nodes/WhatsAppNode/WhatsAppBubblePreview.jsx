import React from "react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";

const INPUT_TYPE_EMOJIS = {
  text: "💬", number: "🔢", phone: "📞", email: "📧", date: "📅",
  quick_reply: "🔘", list: "📋", image: "🖼", video: "🎥", audio: "🎙", document: "📄", location: "📍",
};

function renderBody(text) {
  if (!text) return <span style={{ color: MUTED, fontStyle: "italic" }}>Your message body will appear here…</span>;
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      return <span key={i} style={{ background: "#EEF2FF", color: PRIMARY, padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 }}>{part}</span>;
    }
    return part;
  });
}

function Bubble({ children }) {
  return (
    <div style={{ background: "#E5DDD5", borderRadius: 10, padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: "10px 10px 10px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function ButtonRow({ label }) {
  return (
    <div style={{ padding: "9px 12px", borderTop: "1px solid #f0f0f0", fontSize: 13, color: "#0a8fc4", textAlign: "center", fontWeight: 500 }}>
      {label}
    </div>
  );
}

function StandardPreview({ draft }) {
  const header = draft.header || {};
  const buttons = draft.buttons && draft.buttons.length > 0
    ? draft.buttons
    : draft.codeButtonLabel ? [{ label: draft.codeButtonLabel }] : [];
  return (
    <Bubble>
      {(header.type === "image" || header.type === "video") && (
        <div style={{ height: 90, background: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#94A3B8", fontSize: 11 }}>{header.type === "video" ? "▶ Video" : "🖼 Image"}</span>
        </div>
      )}
      {header.type === "text" && header.text && (
        <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>{header.text}</div>
      )}
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.footer && <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{draft.footer}</div>}
      {buttons.map((btn, i) => <ButtonRow key={i} label={btn.label || `Button ${i + 1}`} />)}
      {draft.flowCta?.flowFormId && <ButtonRow label={`🔗 ${draft.flowCta.buttonText}`} />}
    </Bubble>
  );
}

function CarouselPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 12px 12px" }}>
        {(draft.cards || []).map((card, i) => (
          <div key={i} style={{ width: 110, flexShrink: 0, borderRadius: 8, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ height: 60, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>🖼</div>
            <div style={{ padding: "6px 8px", fontSize: 10, color: "#111" }}>{card.cardBody || `Card ${i + 1}`}</div>
          </div>
        ))}
      </div>
    </Bubble>
  );
}

function ListPreview({ draft }) {
  return (
    <Bubble>
      {draft.header && <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>{draft.header}</div>}
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.footer && <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{draft.footer}</div>}
      <ButtonRow label={`📋 ${draft.buttonText || "View options"}`} />
    </Bubble>
  );
}

function CatalogPreview({ draft }) {
  const products = (draft.productNames || "").split(",").map((p) => p.trim()).filter(Boolean);
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "0 12px 12px" }}>
        {products.map((p, i) => (
          <span key={i} style={{ fontSize: 10, padding: "4px 8px", borderRadius: 8, background: "#F1F5F9", color: "#475569" }}>{p}</span>
        ))}
      </div>
    </Bubble>
  );
}

function LocationPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ height: 90, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📍</div>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      {draft.addressLabel && <div style={{ padding: "0 12px 10px", fontSize: 11, color: "#64748B" }}>{draft.addressLabel}</div>}
    </Bubble>
  );
}

function AudioPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>{renderBody(draft.body)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px 10px" }}>
        <span style={{ fontSize: 16 }}>▶</span>
        <span style={{ fontSize: 11, color: "#64748B" }}>{draft.audioLabel || "Audio clip"}</span>
      </div>
    </Bubble>
  );
}

function CollectInputPreview({ draft }) {
  return (
    <Bubble>
      <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>
        {draft.questionMessage || <span style={{ color: MUTED, fontStyle: "italic" }}>Question will appear here…</span>}
      </div>
      <div style={{ padding: "0 12px 10px" }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: "#EEF2FF", color: PRIMARY }}>
          {INPUT_TYPE_EMOJIS[draft.inputType] || "📝"} {draft.inputType || "text"}
        </span>
      </div>
    </Bubble>
  );
}

export default function WhatsAppBubblePreview({ draft, previewKind }) {
  const d = draft || {};
  if (previewKind === "carousel") return <CarouselPreview draft={d} />;
  if (previewKind === "list") return <ListPreview draft={d} />;
  if (previewKind === "catalog") return <CatalogPreview draft={d} />;
  if (previewKind === "location") return <LocationPreview draft={d} />;
  if (previewKind === "audio") return <AudioPreview draft={d} />;
  if (previewKind === "collectInput") return <CollectInputPreview draft={d} />;
  return <StandardPreview draft={d} />;
}
