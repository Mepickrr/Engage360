import React, { useEffect, useRef, useState } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { PUSH_TEMPLATE_STYLES, PUSH_PLACEHOLDER_VARS } from "./data/mockData";

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

function StyleThumbnail({ styleId }) {
  if (styleId === "basic") {
    return (
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px", height: 80, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: AMBER, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 7, background: "#1E293B", borderRadius: 3, marginBottom: 4, width: "70%" }} />
            <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, width: "90%" }} />
          </div>
        </div>
      </div>
    );
  }
  if (styleId === "stylized_basic") {
    return (
      <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "10px", height: 80, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: `3px solid ${AMBER}` }}>
          <div style={{ height: 7, background: AMBER, borderRadius: 3, marginBottom: 4, width: "80%" }} />
          <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, width: "100%" }} />
        </div>
      </div>
    );
  }
  if (styleId === "image_carousel") {
    return (
      <div style={{ background: "#F0F9FF", borderRadius: 8, padding: "10px", height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#0EA5E9", borderRadius: 6, width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 18 }}>🖼</span>
        </div>
      </div>
    );
  }
  if (styleId === "image_banner") {
    return (
      <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "10px", height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ background: "#FB923C", borderRadius: 6, width: "100%", height: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>SALE</span>
        </div>
      </div>
    );
  }
  if (styleId === "timer") {
    return (
      <div style={{ background: "#FFF1F2", borderRadius: 8, padding: "10px", height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ height: 22, width: 60, background: "#EF4444", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 11, color: "#fff", fontFamily: "monospace" }}>11:59:59</span>
        </div>
      </div>
    );
  }
  return <div style={{ height: 80, background: "#F1F5F9", borderRadius: 8 }} />;
}

function PlaceholdersDropdown({ onInsert }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 12, fontWeight: 600, background: "#3B82F6", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", flexShrink: 0 }}
      >
        Placeholders <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 240, maxHeight: 260, overflowY: "auto" }}>
          {Object.entries(PUSH_PLACEHOLDER_VARS).map(([group, vars]) => (
            <div key={group}>
              <div style={{ padding: "6px 12px 3px", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", background: "#F8FAFC" }}>{group}</div>
              {vars.map((v) => (
                <div
                  key={v.key}
                  onClick={() => { onInsert(v.key); setOpen(false); }}
                  style={{ padding: "7px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                >
                  <span style={{ fontSize: 12, color: "#1E293B" }}>{v.label}</span>
                  <span style={{ fontSize: 10, color: MUTED, fontFamily: "monospace" }}>{v.example}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PushTemplateForm({ draft, patch }) {
  const insertPlaceholder = (field, token) => patch({ [field]: (draft[field] || "") + token });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Template Style */}
      <div>
        <Label>Template Style <span style={{ color: "#EF4444" }}>*</span></Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {PUSH_TEMPLATE_STYLES.map((style) => (
            <div
              key={style.id}
              onClick={() => patch({ style: style.id })}
              style={{
                border: `2px solid ${draft.style === style.id ? AMBER : BORDER}`,
                borderRadius: 10, padding: 8, cursor: "pointer",
                background: draft.style === style.id ? "#FFFBEB" : "#fff",
                transition: "all 0.15s",
              }}
            >
              <StyleThumbnail styleId={style.id} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", marginTop: 6 }}>{style.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Target platforms */}
      <div>
        <Label>Target Platforms</Label>
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          {["android", "ios", "web"].map((p) => (
            <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
              <input type="checkbox" checked={!!draft.platforms?.[p]} onChange={(e) => patch({ platforms: { ...draft.platforms, [p]: e.target.checked } })}
                style={{ accentColor: AMBER, width: 14, height: 14, cursor: "pointer" }} />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </label>
          ))}
        </div>
        {draft.platforms?.ios && (
          <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>iOS</div>
            {[
              ["all", "Send this campaign to all eligible devices"],
              ["no_prov", "Exclude provisional push devices"],
              ["only_prov", "Send this campaign to only provisional push enabled devices"],
            ].map(([val, lbl]) => (
              <label key={val} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 6 }}>
                <input type="radio" name="iosSendMode" value={val} checked={draft.iosSendMode === val} onChange={() => patch({ iosSendMode: val })}
                  style={{ accentColor: AMBER, marginTop: 2, cursor: "pointer", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#374151", lineHeight: 1.4 }}>{lbl}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Template Name */}
      <div>
        <Label>Template Name</Label>
        <input value={draft.name || ""} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. cart_recovery_push"
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Title */}
      <div>
        <Label>Enter Title <span style={{ color: "#EF4444" }}>*</span></Label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={draft.title || ""} onChange={(e) => patch({ title: e.target.value })} placeholder="Your notification title"
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("title", token)} />
        </div>
      </div>

      {/* Body */}
      <div>
        <Label>Notification Body</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={draft.body || ""} onChange={(e) => patch({ body: e.target.value })} placeholder="Your notification message"
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("body", token)} />
        </div>
      </div>

      {/* Image */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={!!draft.hasImage} onChange={(e) => patch({ hasImage: e.target.checked })}
            style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
          <span style={{ fontSize: 13, color: "#374151" }}>Add image to notification</span>
        </label>
        {draft.hasImage && (
          <input value={draft.imageUrl || ""} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="Image URL…"
            style={{ width: "100%", marginTop: 8, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        )}
      </div>

      {/* Landing URL */}
      <div>
        <Label>Enter Landing Page URL <span style={{ color: "#EF4444" }}>*</span></Label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={draft.landingUrl || ""} onChange={(e) => patch({ landingUrl: e.target.value })} placeholder="https://store.com/page"
            style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("landingUrl", token)} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <input value={draft.tags || ""} onChange={(e) => patch({ tags: e.target.value })} placeholder="cart_recovery, sale, etc."
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Renotify */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={!!draft.renotify} onChange={(e) => patch({ renotify: e.target.checked })}
          style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer", marginTop: 1, flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Renotify</span>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>One notification will popup at a time on screen based on tags</div>
        </div>
      </label>

      {/* Persist */}
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={!!draft.persistNotification} onChange={(e) => patch({ persistNotification: e.target.checked })}
          style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer", marginTop: 1, flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Persist Notification</span>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>The notification will be closed by user only</div>
        </div>
      </label>

      {/* UTM */}
      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8 }}>
          <input type="checkbox" checked={!!draft.utm?.enabled} onChange={(e) => patch({ utm: { ...draft.utm, enabled: e.target.checked } })}
            style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>UTM Parameters</span>
        </label>
        {draft.utm?.enabled && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginLeft: 25 }}>
            {[["utm_source", "Source", "push"], ["utm_medium", "Medium", "journey"], ["utm_campaign", "Campaign", ""], ["utm_term", "Term", ""], ["utm_content", "Content", ""]].map(([key, label, ph]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>{label}</span>
                <input value={draft.utm?.[key] || ""} placeholder={ph} onChange={(e) => patch({ utm: { ...draft.utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to action */}
      <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <input type="checkbox" checked={!!draft.callToAction} onChange={(e) => patch({ callToAction: e.target.checked })}
          style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
        <div>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Add call to action</span>
          <span style={{ fontSize: 11, color: MUTED, marginLeft: 6 }}>*For Chrome Only*</span>
        </div>
      </label>

      {/* Icon */}
      <div>
        <Label>Enter Icon URL</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["org", "Organization Logo"],
            ["url", "Enter the URL"],
            ["upload", "Upload Image / Select from Gallery"],
          ].map(([val, lbl]) => (
            <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="radio" name="iconType" value={val} checked={draft.iconType === val} onChange={() => patch({ iconType: val })}
                style={{ accentColor: AMBER, cursor: "pointer" }} />
              <span style={{ fontSize: 13, color: "#374151" }}>{lbl}</span>
            </label>
          ))}
        </div>
        {draft.iconType === "url" && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <input value={draft.iconUrl || ""} onChange={(e) => patch({ iconUrl: e.target.value })} placeholder="Icon URL…"
              style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
            <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("iconUrl", token)} />
          </div>
        )}
        {!draft.iconUrl && draft.iconType === "url" && (
          <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>Icon URL required!</div>
        )}
      </div>

      {/* AI Enhance */}
      <button type="button"
        onClick={() => alert("AI Enhance: generates tone variants — coming soon")}
        style={{ width: "100%", padding: "9px", border: `1px solid ${AMBER}`, borderRadius: 8, background: "#FFFBEB", color: "#92400E", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <Sparkles size={13} />
        AI Enhance — Generate tone variants
      </button>
    </div>
  );
}
