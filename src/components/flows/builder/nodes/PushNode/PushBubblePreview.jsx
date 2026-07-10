import React, { useState } from "react";
import { Bell } from "lucide-react";
import { PUSH_PREVIEW_PLATFORMS } from "./data/mockData";

const AMBER  = "#F59E0B";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function NotificationPreview({ platform, title, body, imageUrl, hasImage, domain = "www.yourdomain.com" }) {
  const t = title || "Notification Title Here";
  const b = body || "Notification Message Here";

  if (platform === "mac") {
    return (
      <div style={{ background: "rgba(240,240,240,0.95)", backdropFilter: "blur(20px)", borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", maxWidth: 360, width: "100%" }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{t}</div>
          <div style={{ fontSize: 11, color: "#64748B" }}>{domain}</div>
          <div style={{ fontSize: 12, color: "#374151", marginTop: 2, lineHeight: 1.4 }}>{b}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button style={{ fontSize: 11, padding: "3px 10px", background: "#E5E7EB", border: "none", borderRadius: 5, cursor: "pointer", color: "#374151" }}>Close</button>
          <button style={{ fontSize: 11, padding: "3px 10px", background: "#E5E7EB", border: "none", borderRadius: 5, cursor: "pointer", color: "#374151" }}>Settings</button>
        </div>
      </div>
    );
  }

  if (platform === "android") {
    return (
      <div style={{ background: "#1C1C1E", borderRadius: 12, padding: "10px 14px", maxWidth: 340, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={9} color="#fff" />
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", flex: 1 }}>MoeSample · 5:30 pm</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>{b}</div>
        {hasImage && imageUrl && (
          <div style={{ marginTop: 8, height: 80, background: "#333", borderRadius: 8, overflow: "hidden" }}>
            <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>
    );
  }

  if (platform === "win10") {
    return (
      <div style={{ background: "#1A1A2E", borderRadius: 4, padding: "10px 12px", maxWidth: 360, width: "100%", display: "flex", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={16} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{t}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{domain}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>{b}</div>
        </div>
      </div>
    );
  }

  // windows (classic)
  return (
    <div style={{ background: "#fff", border: "1px solid #D1D5DB", borderRadius: 4, padding: "10px 12px", maxWidth: 360, width: "100%", display: "flex", gap: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 4, background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Bell size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1E293B" }}>{t}</div>
        <div style={{ fontSize: 11, color: "#64748B" }}>{domain}</div>
        <div style={{ fontSize: 12, color: "#374151", marginTop: 2 }}>{b}</div>
      </div>
    </div>
  );
}

export default function PushBubblePreview({ draft }) {
  const [platform, setPlatform] = useState("mac");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Label>Preview for</Label>
      <div style={{ display: "flex", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 3, gap: 2 }}>
        {PUSH_PREVIEW_PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            style={{
              flex: 1, padding: "5px 4px", fontSize: 11, fontWeight: 500,
              border: "none", borderRadius: 6, cursor: "pointer",
              background: platform === p.id ? "#EEF2FF" : "transparent",
              color: platform === p.id ? "#4F46E5" : "#64748B",
              transition: "all 0.12s",
            }}
          >{p.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <NotificationPreview
          platform={platform}
          title={draft?.title}
          body={draft?.body}
          imageUrl={draft?.imageUrl}
          hasImage={draft?.hasImage}
        />
      </div>

      {platform === "android" && (
        <p style={{ fontSize: 11, color: MUTED, marginTop: 4, textAlign: "center", lineHeight: 1.5 }}>
          Preview may vary across Android versions and OEM launchers.
        </p>
      )}
    </div>
  );
}
