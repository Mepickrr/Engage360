import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { INAPP_VIOLET } from "./data/mockData";

const MUTED = "#94A3B8";
const BORDER = "#E5E7EB";

// Read-only render of a single content block — no drag handles, no
// contentEditable, no delete button (those belong to the editor canvas).
function PreviewBlock({ block }) {
  if (block.type === "heading") {
    return <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>{block.content || "Add heading"}</div>;
  }
  if (block.type === "text") {
    return <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: 0 }}>{block.content || "Add text"}</p>;
  }
  if (block.type === "image") {
    return block.src ? (
      <img src={block.src} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} />
    ) : (
      <div style={{ width: "100%", height: 100, background: block.bgColor || "#F1F5F9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={20} color="#CBD5E1" />
      </div>
    );
  }
  if (block.type === "button") {
    const primary = block.style === "primary";
    return (
      <button style={{ width: "100%", padding: "9px 12px", background: primary ? INAPP_VIOLET : "transparent", color: primary ? "#fff" : INAPP_VIOLET, border: `1.5px solid ${INAPP_VIOLET}`, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "default" }}>
        {block.label || "Button"}
      </button>
    );
  }
  if (block.type === "rating") {
    return (
      <div style={{ display: "flex", gap: 3, justifyContent: "center" }}>
        {Array.from({ length: block.stars || 5 }).map((_, i) => <span key={i} style={{ fontSize: 16, color: "#FBBF24" }}>★</span>)}
      </div>
    );
  }
  if (block.type === "form") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input disabled placeholder="Email address" style={{ padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#F8FAFC" }} />
        <button disabled style={{ padding: "8px", background: INAPP_VIOLET, color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{block.cta || "Submit"}</button>
      </div>
    );
  }
  if (block.type === "countdown") {
    return (
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {["00", "12", "45", "30"].map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ background: INAPP_VIOLET, color: "#fff", borderRadius: 6, width: 34, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{v}</div>
            <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{["DD", "HH", "MM", "SS"][i]}</div>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "line") return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "4px 0" }} />;
  if (block.type === "spacer") return <div style={{ height: block.height || 16 }} />;
  if (block.type === "video") {
    return (
      <div style={{ height: 60, background: "#1E293B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 18, color: "#fff" }}>▶</span>
      </div>
    );
  }
  if (block.type === "gif") {
    return (
      <div style={{ height: 60, background: "#0F172A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>GIF</span>
      </div>
    );
  }
  if (block.type === "spin_wheel") {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "conic-gradient(#F59E0B, #EF4444, #3B82F6, #10B981)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎡</div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Spin the Wheel</div>
      </div>
    );
  }
  if (block.type === "scratch_card") {
    return (
      <div style={{ width: "100%", height: 44, background: "linear-gradient(135deg, #94A3B8, #CBD5E1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>Scratch to reveal</span>
      </div>
    );
  }
  return null;
}

// The card/screen shape itself — sized to its content (no fixed height, no
// overflow:hidden) so nothing gets clipped, unlike the fixed 36-60px
// emoji-only placeholder this replaces.
function DisplayFrame({ displayType, bgColor, children }) {
  const isFullscreen = displayType === "fullscreen";
  const isNudge = displayType === "nudge";

  if (isFullscreen) {
    return (
      <div style={{ background: bgColor || "#fff", borderRadius: 10, border: `1px solid ${BORDER}`, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    );
  }

  if (isNudge) {
    return (
      <div style={{ background: "#F1F5F9", borderRadius: 10, padding: 10 }}>
        <div style={{ background: bgColor || "#fff", borderRadius: "10px 10px 0 0", padding: "10px 14px", boxShadow: "0 -2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ width: 32, height: 3, background: "#CBD5E1", borderRadius: 2, margin: "0 auto 2px" }} />
          {children}
        </div>
      </div>
    );
  }

  // popup — centered overlay card, dark scrim behind it
  return (
    <div style={{ background: "#CBD5E1", borderRadius: 10, padding: 16, display: "flex", justifyContent: "center", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", borderRadius: 10 }} />
      <div style={{ position: "relative", zIndex: 1, width: "min(320px, 100%)", background: bgColor || "#fff", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function InAppPreview({ draft }) {
  const blocks = draft?.blocks || [];
  const displayType = draft?.displayType;
  const bgColor = draft?.bgColor || "#fff";

  return (
    <DisplayFrame displayType={displayType} bgColor={bgColor}>
      {blocks.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: MUTED }}>No content blocks yet</div>
      ) : (
        blocks.map((b, i) => <PreviewBlock key={b.id || i} block={b} />)
      )}
    </DisplayFrame>
  );
}
