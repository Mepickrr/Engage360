import React from "react";
import { Image as ImageIcon } from "lucide-react";
import { ONSITE_TEAL } from "./data/mockData";

const MUTED = "#94A3B8";

// Read-only render of a single content block — no drag handles, no
// contentEditable, no delete button (those belong to the editor canvas).
function PreviewBlock({ block }) {
  if (block.type === "title") {
    return <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{block.content || "Your headline here"}</div>;
  }
  if (block.type === "text") {
    return <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>{block.content || "Your message body…"}</p>;
  }
  if (block.type === "image") {
    return block.src ? (
      <img src={block.src} alt="" style={{ width: "100%", borderRadius: 8, display: "block" }} />
    ) : (
      <div style={{ width: "100%", height: 130, background: "#F1F5F9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={24} color="#CBD5E1" />
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={{ padding: "11px 28px", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "default" }}>
          {block.label || "Click Here"}
        </button>
      </div>
    );
  }
  if (block.type === "form") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input disabled placeholder="Enter your email…" style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "#F8FAFC" }} />
        <button disabled style={{ padding: "10px", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
          {block.cta || "Submit"}
        </button>
      </div>
    );
  }
  if (block.type === "countdown") {
    return (
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {["00", "12", "34", "56"].map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: ONSITE_TEAL, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{v}</div>
            <div style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{["Days", "Hrs", "Min", "Sec"][i]}</div>
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "line") return <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "4px 0" }} />;
  if (block.type === "spacer") return <div style={{ height: 20 }} />;
  if (block.type === "custom" && block.subtype === "spin_wheel") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: `conic-gradient(${ONSITE_TEAL} 0deg 60deg, #F59E0B 60deg 120deg, #EF4444 120deg 180deg, #8B5CF6 180deg 240deg, #3B82F6 240deg 300deg, #10B981 300deg 360deg)`, border: "4px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }} />
        <span style={{ fontSize: 11, color: "#64748B" }}>Spin the Wheel</span>
      </div>
    );
  }
  return null;
}

// The card/bar shape itself — sized to its content (no fixed height, no
// overflow:hidden) so nothing gets clipped, unlike the old fixed 36-52px
// emoji-only placeholder this replaces.
function DisplayFrame({ displayType, bgColor, children }) {
  const isBanner = displayType === "banner";
  const isNudge = displayType === "nudge";

  if (isBanner) {
    return (
      <div style={{ background: "#F1F5F9", borderRadius: 10, padding: 10 }}>
        <div style={{ background: bgColor, borderRadius: 8, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 8 }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#CBD5E1", borderRadius: 10, padding: 16, display: "flex", justifyContent: isNudge ? "flex-end" : "center", position: "relative" }}>
      {!isNudge && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", borderRadius: 10 }} />}
      <div style={{ position: "relative", zIndex: 1, width: isNudge ? 200 : "min(340px, 100%)", background: bgColor, borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: isNudge ? 12 : "20px 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function OnsitePreview({ draft }) {
  const blocks = draft?.blocks || [];
  const displayType = draft?.displayType;
  const bgColor = draft?.bgColor || "#fff";

  return (
    <DisplayFrame displayType={displayType} bgColor={bgColor}>
      {blocks.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: MUTED }}>No content blocks yet</div>
      ) : (
        blocks.map((b, i) => <PreviewBlock key={i} block={b} />)
      )}
    </DisplayFrame>
  );
}
