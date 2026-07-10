import React from "react";

const INDIGO = "#4F46E5";
const MUTED = "#94A3B8";

function renderBody(text) {
  if (!text) return null;
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      return (
        <span key={i} style={{ background: "#EEF2FF", color: INDIGO, padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 10 }}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function MediaPlaceholder({ mediaType }) {
  if (mediaType === "image") {
    return (
      <div style={{ height: 100, background: INDIGO, borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 26, color: "#fff" }}>🖼</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>Image</span>
      </div>
    );
  }
  if (mediaType === "video") {
    return (
      <div style={{ height: 100, background: "#1a1a2e", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span>
        </div>
        <span style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "rgba(255,255,255,0.6)" }}>0:00</span>
      </div>
    );
  }
  if (mediaType === "document") {
    return (
      <div style={{ height: 60, background: "#F1F5F9", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ fontSize: 18 }}>📄</span>
        <span style={{ fontSize: 12, color: "#475569" }}>Document</span>
      </div>
    );
  }
  return null;
}

export default function RCSBubblePreview({ draft }) {
  const hasMedia = draft?.style === "single" && draft?.mediaType && draft.mediaType !== "none";
  const connectableBtns = (draft?.buttons || []).filter((b) => b.type === "quick_reply" || b.type === "url");

  return (
    <div style={{ background: "#E8EDF8", borderRadius: 12, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ maxWidth: "90%" }}>
        <div style={{ background: "#fff", borderRadius: "14px 14px 14px 4px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}>
          {hasMedia && <MediaPlaceholder mediaType={draft.mediaType} />}
          <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>
            {draft?.body
              ? renderBody(draft.body)
              : <span style={{ color: MUTED, fontStyle: "italic" }}>Your message body will appear here…</span>}
          </div>
        </div>

        {connectableBtns.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {connectableBtns.map((btn, i) => (
              <button
                key={i}
                type="button"
                style={{ width: "100%", padding: "8px 12px", borderRadius: 20, border: `1.5px solid ${INDIGO}`, background: "#fff", color: INDIGO, fontSize: 12, fontWeight: 500, cursor: "default", textAlign: "center" }}
              >
                {btn.label || "Button"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
