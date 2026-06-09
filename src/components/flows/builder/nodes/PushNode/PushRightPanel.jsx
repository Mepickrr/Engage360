import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Bell, Sparkles, ChevronDown, X } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  PUSH_TEMPLATE_STYLES, MOCK_PUSH_TEMPLATES, PUSH_PLACEHOLDER_VARS,
  PUSH_DELIVERY_OPTIONS, PUSH_PREVIEW_PLATFORMS,
} from "./data/mockData";

const AMBER  = "#F59E0B";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

// ── Shared helpers ──────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? AMBER : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

// ── Placeholder dropdown ────────────────────────────────────────
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
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100,
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", width: 240, maxHeight: 260, overflowY: "auto",
        }}>
          {Object.entries(PUSH_PLACEHOLDER_VARS).map(([group, vars]) => (
            <div key={group}>
              <div style={{ padding: "6px 12px 3px", fontSize: 10, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", background: "#F8FAFC" }}>{group}</div>
              {vars.map((v) => (
                <div
                  key={v.key}
                  onClick={() => { onInsert(v.key); setOpen(false); }}
                  style={{ padding: "7px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
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

// ── Platform Notification Previews ─────────────────────────────
function NotificationPreview({ platform, title, body, iconType, imageUrl, hasImage, domain = "www.yourdomain.com" }) {
  const t = title || "Notification Title Here";
  const b = body  || "Notification Message Here";

  if (platform === "mac") {
    return (
      <div style={{
        background: "rgba(240,240,240,0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        padding: "10px 12px",
        display: "flex", gap: 10, alignItems: "flex-start",
        maxWidth: 360, width: "100%",
      }}>
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
      <div style={{
        background: "#1C1C1E",
        borderRadius: 12,
        padding: "10px 14px",
        maxWidth: 340, width: "100%",
      }}>
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
      <div style={{
        background: "#1A1A2E",
        borderRadius: 4,
        padding: "10px 12px",
        maxWidth: 360, width: "100%",
        display: "flex", gap: 10,
      }}>
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
    <div style={{
      background: "#fff",
      border: "1px solid #D1D5DB",
      borderRadius: 4,
      padding: "10px 12px",
      maxWidth: 360, width: "100%",
      display: "flex", gap: 10,
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    }}>
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

// ── Style Thumbnail SVG ─────────────────────────────────────────
function StyleThumbnail({ styleId }) {
  if (styleId === "basic") {
    return (
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px", height: 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: AMBER, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 7, background: "#1E293B", borderRadius: 3, marginBottom: 4, width: "70%" }} />
            <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, width: "90%" }} />
            <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, marginTop: 2, width: "60%" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 12, width: 34, background: "#E5E7EB", borderRadius: 3 }} />
            <div style={{ height: 12, width: 34, background: "#E5E7EB", borderRadius: 3 }} />
          </div>
        </div>
      </div>
    );
  }
  if (styleId === "stylized_basic") {
    return (
      <div style={{ background: "#FFFBEB", borderRadius: 8, padding: "10px", height: 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderLeft: `3px solid ${AMBER}`, display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ height: 7, background: AMBER, borderRadius: 3, marginBottom: 4, width: "80%" }} />
            <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, width: "100%" }} />
            <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, marginTop: 2, width: "70%" }} />
          </div>
        </div>
      </div>
    );
  }
  if (styleId === "image_carousel") {
    return (
      <div style={{ background: "#F0F9FF", borderRadius: 8, padding: "10px", height: 100, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
        <div style={{ background: "#0EA5E9", borderRadius: 6, height: 52, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <span style={{ color: "#fff", fontSize: 18 }}>🖼</span>
          <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3 }}>
            {[1,2,3].map((d,i) => <div key={i} style={{ width: i===1?10:5, height: 5, borderRadius: 3, background: i===0 ? "#fff" : "rgba(255,255,255,0.5)" }} />)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ height: 5, background: "#1E293B", borderRadius: 3, flex: 1 }} />
          <div style={{ height: 5, background: "#94A3B8", borderRadius: 3, flex: 2 }} />
        </div>
      </div>
    );
  }
  if (styleId === "image_banner") {
    return (
      <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "10px", height: 100, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ background: "#FB923C", borderRadius: 6, height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>SALE</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: AMBER, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 5, background: "#1E293B", borderRadius: 3, width: "80%" }} />
            <div style={{ height: 4, background: "#94A3B8", borderRadius: 3, marginTop: 2, width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }
  if (styleId === "timer") {
    return (
      <div style={{ background: "#FFF1F2", borderRadius: 8, padding: "10px", height: 100, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "#fff", borderRadius: 8, padding: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ height: 6, background: "#1E293B", borderRadius: 3, width: "60%" }} />
            <div style={{ height: 14, width: 40, background: "#EF4444", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: "#fff", fontFamily: "monospace" }}>11:59:59</span>
            </div>
          </div>
          <div style={{ height: 4, background: "#94A3B8", borderRadius: 3, width: "85%" }} />
          <div style={{ height: 4, background: "#94A3B8", borderRadius: 3, marginTop: 2, width: "65%" }} />
        </div>
      </div>
    );
  }
  return <div style={{ height: 100, background: "#F1F5F9", borderRadius: 8 }} />;
}

// ── Push Template Picker Modal ──────────────────────────────────
function PushTemplatePicker({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered  = MOCK_PUSH_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    (t.title || "").toLowerCase().includes(q.toLowerCase())
  );
  const styleMeta = (id) => PUSH_TEMPLATE_STYLES.find((s) => s.id === id);

  const modal = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center",
    }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16,
        width: "min(640px, 92vw)", maxHeight: "80vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Select Push Template</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Choose from your existing templates</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <input
            autoFocus
            type="text"
            placeholder="Search templates…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Template list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", fontSize: 13, color: MUTED }}>No templates match</div>
          ) : filtered.map((t) => {
            const sm = styleMeta(t.style);
            return (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", gap: 14, alignItems: "flex-start" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#FFFBEB"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
              >
                {/* mini preview */}
                <div style={{ width: 56, height: 44, background: "#F8FAFC", borderRadius: 8, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ transform: "scale(0.4)", transformOrigin: "center", width: 140, height: 110 }}>
                    <StyleThumbnail styleId={t.style} />
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{t.name}</span>
                    {sm && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: "#FFFBEB", color: "#92400E", border: `1px solid #FDE68A`, flexShrink: 0 }}>{sm.name}</span>}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.body}</div>
                </div>
                <span style={{ fontSize: 10, color: MUTED, flexShrink: 0, marginTop: 2 }}>{t.lastUpdated}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ── Push Create Modal (2-step) ──────────────────────────────────
function PushCreateModal({ onSave, onClose }) {
  const [step,           setStep]           = useState(1);
  const [selectedStyle,  setSelectedStyle]  = useState(null);
  const [previewPlatform,setPreviewPlatform]= useState("mac");
  const [draft, setDraft] = useState({
    name: "", title: "", body: "",
    hasImage: false, imageUrl: "",
    landingUrl: "", tags: "",
    renotify: false, persistNotification: false,
    utm: { enabled: false, utm_source: "push", utm_medium: "journey", utm_campaign: "" },
    callToAction: false,
    iconType: "org", iconUrl: "",
    platforms: { android: true, ios: true, web: true },
    iosSendMode: "all",
  });

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const insertPlaceholder = (field, token) => {
    patch({ [field]: (draft[field] || "") + token });
  };

  const modal = (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 16,
        width: step === 1 ? "min(760px, 92vw)" : "min(1000px, 96vw)",
        maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              {step === 1 ? "Push Campaign" : "Configure Template"}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {[1, 2].map((s) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: step >= s ? AMBER : "#F1F5F9",
                    color: step >= s ? "#fff" : MUTED,
                  }}>{s}</div>
                  <span style={{ fontSize: 11, color: step === s ? "#0F172A" : MUTED, fontWeight: step === s ? 600 : 400 }}>
                    {s === 1 ? "Select Style" : "Configure"}
                  </span>
                  {s < 2 && <span style={{ fontSize: 11, color: MUTED }}>→</span>}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, display: "flex", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Step 1 — Style picker */}
        {step === 1 && (
          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
              Click on any tile to select the template style.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {PUSH_TEMPLATE_STYLES.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  style={{
                    border: `2px solid ${selectedStyle === style.id ? AMBER : BORDER}`,
                    borderRadius: 12, padding: 12, cursor: "pointer",
                    background: selectedStyle === style.id ? "#FFFBEB" : "#fff",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { if (selectedStyle !== style.id) { e.currentTarget.style.borderColor = "#FDE68A"; e.currentTarget.style.background = "#FFFDF7"; } }}
                  onMouseLeave={(e) => { if (selectedStyle !== style.id) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "#fff"; } }}
                >
                  <StyleThumbnail styleId={style.id} />
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{style.name}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      {style.platforms.map((p) => (
                        <span key={p} style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#F1F5F9", color: "#64748B" }}>
                          {p === "android" ? "🤖 Android" : "🍎 iOS"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Configuration */}
        {step === 2 && (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* Form */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, borderRight: `1px solid ${BORDER}` }}>

              {/* Target platforms */}
              <div style={{ marginBottom: 20 }}>
                <Label>Target Platforms</Label>
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  {["android", "ios", "web"].map((p) => (
                    <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151" }}>
                      <input type="checkbox" checked={!!draft.platforms[p]} onChange={(e) => patch({ platforms: { ...draft.platforms, [p]: e.target.checked } })}
                        style={{ accentColor: AMBER, width: 14, height: 14, cursor: "pointer" }} />
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </label>
                  ))}
                </div>
                {draft.platforms.ios && (
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>iOS</div>
                    {[
                      ["all",         "Send this campaign to all eligible devices"],
                      ["no_prov",     "Exclude provisional push devices"],
                      ["only_prov",   "Send this campaign to only provisional push enabled devices"],
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
              <div style={{ marginBottom: 16 }}>
                <Label>Template Name</Label>
                <input value={draft.name} onChange={(e) => patch({ name: e.target.value })} placeholder="e.g. cart_recovery_push"
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Enter Title */}
              <div style={{ marginBottom: 16 }}>
                <Label>Enter Title <span style={{ color: "#EF4444" }}>*</span></Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Your notification title"
                      style={{ width: "100%", padding: "8px 36px 8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
                    <button type="button" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>😊</button>
                  </div>
                  <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("title", token)} />
                </div>
              </div>

              {/* Notification Body */}
              <div style={{ marginBottom: 16 }}>
                <Label>Notification Body</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input value={draft.body} onChange={(e) => patch({ body: e.target.value })} placeholder="Your notification message"
                      style={{ width: "100%", padding: "8px 36px 8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
                    <button type="button" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>😊</button>
                  </div>
                  <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("body", token)} />
                </div>
              </div>

              {/* Add image */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.hasImage} onChange={(e) => patch({ hasImage: e.target.checked })}
                    style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>Add image to notification</span>
                </label>
                {draft.hasImage && (
                  <input value={draft.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="Image URL…"
                    style={{ width: "100%", marginTop: 8, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
                )}
              </div>

              {/* Landing Page URL */}
              <div style={{ marginBottom: 16 }}>
                <Label>Enter Landing Page URL <span style={{ color: "#EF4444" }}>*</span></Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input value={draft.landingUrl} onChange={(e) => patch({ landingUrl: e.target.value })} placeholder="https://store.com/page"
                    style={{ flex: 1, padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
                  <PlaceholdersDropdown onInsert={(token) => insertPlaceholder("landingUrl", token)} />
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 16 }}>
                <Label>Tags</Label>
                <input value={draft.tags} onChange={(e) => patch({ tags: e.target.value })} placeholder="cart_recovery, sale, etc."
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Renotify */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.renotify} onChange={(e) => patch({ renotify: e.target.checked })}
                    style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Renotify</span>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>One notification will popup at a time on screen based on tags</div>
                    <div style={{ fontSize: 11, color: MUTED }}>(Notification with above mentioned tags will get cleared)</div>
                  </div>
                </label>
              </div>

              {/* Persist Notification */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.persistNotification} onChange={(e) => patch({ persistNotification: e.target.checked })}
                    style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer", marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Persist Notification</span>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>The notification will be closed by user only</div>
                  </div>
                </label>
              </div>

              {/* UTM Parameters */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8 }}>
                  <input type="checkbox" checked={!!draft.utm?.enabled} onChange={(e) => patch({ utm: { ...draft.utm, enabled: e.target.checked } })}
                    style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>UTM Parameters</span>
                </label>
                {draft.utm?.enabled && (
                  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden", marginLeft: 25 }}>
                    {[["utm_source", "Source", "push"], ["utm_medium", "Medium", "journey"], ["utm_campaign", "Campaign", ""]].map(([key, label, ph]) => (
                      <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                        <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>{label}</span>
                        <input value={draft.utm[key] || ""} placeholder={ph} onChange={(e) => patch({ utm: { ...draft.utm, [key]: e.target.value } })}
                          style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add call to action */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input type="checkbox" checked={draft.callToAction} onChange={(e) => patch({ callToAction: e.target.checked })}
                    style={{ accentColor: AMBER, width: 15, height: 15, cursor: "pointer" }} />
                  <div>
                    <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>Add call to action</span>
                    <span style={{ fontSize: 11, color: MUTED, marginLeft: 6 }}>*For Chrome Only*</span>
                  </div>
                </label>
              </div>

              {/* Enter Icon URL */}
              <div style={{ marginBottom: 16 }}>
                <Label>Enter Icon URL</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["org",    "Organization Logo"],
                    ["url",    "Enter the URL"],
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
                    <input value={draft.iconUrl} onChange={(e) => patch({ iconUrl: e.target.value })} placeholder="Icon URL…"
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

            {/* Preview panel */}
            <div style={{ width: 360, flexShrink: 0, padding: 24, overflowY: "auto", background: "#F8FAFC" }}>
              <div style={{ marginBottom: 16 }}>
                <Label>Preview for</Label>
                <div style={{ display: "flex", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 3, gap: 2 }}>
                  {PUSH_PREVIEW_PLATFORMS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPreviewPlatform(p.id)} style={{
                      flex: 1, padding: "5px 4px", fontSize: 11, fontWeight: 500,
                      border: "none", borderRadius: 6, cursor: "pointer",
                      background: previewPlatform === p.id ? "#EEF2FF" : "transparent",
                      color: previewPlatform === p.id ? "#4F46E5" : "#64748B",
                      transition: "all 0.12s",
                    }}>{p.label}</button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                <NotificationPreview
                  platform={previewPlatform}
                  title={draft.title}
                  body={draft.body}
                  iconType={draft.iconType}
                  imageUrl={draft.imageUrl}
                  hasImage={draft.hasImage}
                />
              </div>

              {previewPlatform === "android" && (
                <p style={{ fontSize: 11, color: MUTED, marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
                  Preview may vary across Android versions and OEM launchers.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button type="button" onClick={onClose} style={{ padding: "9px 20px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151" }}>Cancel</button>
          <div style={{ display: "flex", gap: 10 }}>
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} style={{ padding: "9px 20px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151" }}>
                ← Back
              </button>
            )}
            {step === 1 && (
              <button
                type="button"
                onClick={() => { if (selectedStyle) setStep(2); }}
                disabled={!selectedStyle}
                style={{ padding: "9px 24px", border: "none", borderRadius: 8, background: selectedStyle ? AMBER : "#E2E8F0", color: selectedStyle ? "#fff" : MUTED, fontSize: 13, fontWeight: 600, cursor: selectedStyle ? "pointer" : "not-allowed" }}
              >
                Next →
              </button>
            )}
            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  if (!draft.title || !draft.landingUrl) { alert("Title and Landing Page URL are required."); return; }
                  onSave({ ...draft, style: selectedStyle, id: `push_new_${Date.now()}`, status: "Draft", lastUpdated: new Date().toISOString().slice(0, 10) });
                }}
                style={{ padding: "9px 24px", border: "none", borderRadius: 8, background: AMBER, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Save Template
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

// ── Output Tab ──────────────────────────────────────────────────
const BRANCH_OPTIONS = PUSH_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const outputCfg        = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode      = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["clicked"]) } });
  };
  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const portCount = routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? AMBER : BORDER}`, borderRadius: 10, cursor: "pointer",
    background: active ? "#FFFBEB" : "#fff", transition: "all 0.15s",
  });

  const branchColor = { clicked: "#3B82F6", dismissed: "#94A3B8", delivered: "#10B981" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Choose how users are routed after the notification is sent.
      </p>
      <div>
        <Label>Routing Mode</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? AMBER : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>Single port — all users continue to the same next node.</div>
            </div>
          </div>
          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "branches" ? AMBER : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "branches" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Delivery Branches</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>Separate port per status — clicked, dismissed, or delivered.</div>
            </div>
          </div>
        </div>
      </div>

      {routingMode === "branches" && (
        <div>
          <Label>Select Branch Statuses</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              const bc = branchColor[opt.id] ?? AMBER;
              return (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#FFFBEB" : "#fff", cursor: "pointer",
                }} onClick={() => toggleBranch(opt.id)}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: bc, width: 14, height: 14, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: bc, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one status.</p>
          )}
        </div>
      )}

      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{portCount}</span>
      </div>
    </div>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { aiBestTime, smartRetry = {} } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BORDER}` }}>
        <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
          <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Sends at each user's optimal engagement window.</p>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Smart Retry</Label>
          <Toggle on={!!smartRetry.enabled} onChange={(v) => patch({ smartRetry: { ...smartRetry, enabled: v } })} />
        </div>
        {smartRetry.enabled && (
          <div style={{ display: "flex", gap: 8 }}>
            {[["smart", "Smart Retry (Recommended)"], ["manual", "Manual Retry"]].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => patch({ smartRetry: { ...smartRetry, mode } })} style={{
                flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                border: `2px solid ${smartRetry.mode === mode ? AMBER : BORDER}`,
                background: smartRetry.mode === mode ? "#FFFBEB" : "#fff",
                color: smartRetry.mode === mode ? "#92400E" : "#64748B",
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [showPicker,  setShowPicker]  = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);

  const { template } = data;

  if (showPicker) {
    return (
      <PushTemplatePicker
        onSelect={(tpl) => { patch({ template: tpl, variableMap: {} }); setShowPicker(false); }}
        onClose={() => setShowPicker(false)}
      />
    );
  }
  if (showCreate) {
    return (
      <PushCreateModal
        onSave={(tpl) => { patch({ template: tpl, variableMap: {} }); setShowCreate(false); }}
        onClose={() => setShowCreate(false)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Template</Label>
          {template && (
            <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 11, color: AMBER, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              + Create New
            </button>
          )}
        </div>

        {!template ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShowCreate(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Create New
            </button>
            <button type="button" onClick={() => setShowPicker(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>☰</div>
              Select Existing
            </button>
          </div>
        ) : (
          <div>
            {/* Template card */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "8px 12px", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Bell size={13} color={AMBER} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setShowCreate(true)} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, color: AMBER, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                  <button onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              </div>

              {/* Summary */}
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{template.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{template.body}</div>
                {template.style && (
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#FEF3C7", color: "#92400E" }}>
                      {PUSH_TEMPLATE_STYLES.find((s) => s.id === template.style)?.name || template.style}
                    </span>
                    {template.platforms && Object.entries(template.platforms).filter(([, v]) => v).map(([k]) => (
                      <span key={k} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#F1F5F9", color: "#64748B" }}>{k}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Preview for</Label>
              <div style={{ display: "flex", background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 3, gap: 2, marginBottom: 12 }}>
                {PUSH_PREVIEW_PLATFORMS.map((p) => (
                  <PreviewPlatformButton key={p.id} platform={p} template={template} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Stateful preview switcher
function PreviewPlatformButton({ platform, template }) {
  const [active, setActive] = useState(false);
  return null; // handled by parent
}

// Better: local state in TemplateTab won't reset between tab switches, so lift it up
// We'll use a simple inline solution with local state per TemplateTab render
// (The above is unused — preview handled inline)

// ── Main Panel ──────────────────────────────────────────────────
const TABS = [
  { id: "template", label: "Template" },
  { id: "delivery", label: "Delivery" },
  { id: "output",   label: "Output"   },
];

export default function PushRightPanel({ node, updateNodeData, removeNode }) {
  const [tab,          setTab]          = useState("template");
  const [editingLabel, setEditingLabel] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState("mac");

  if (!node) return null;

  const data    = node.data || {};
  const patch   = (p) => updateNodeData(node.id, p);
  const template = data?.template;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingLabel ? (
              <input autoFocus value={data.label || ""} onChange={(e) => patch({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false); }}
                placeholder="Push Notification"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", borderBottom: `1.5px solid ${AMBER}`, outline: "none", background: "transparent", width: "100%", padding: "0 0 1px" }} />
            ) : (
              <div onClick={() => setEditingLabel(true)} title="Click to rename"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.label || "Push Notification"}
                <span style={{ fontSize: 9, color: MUTED, marginLeft: 5, fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: MUTED }}>Configure notification &amp; delivery</div>
          </div>
        </div>
        <button onClick={() => removeNode(node.id)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          Delete
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 500,
            border: "none", borderBottom: `2px solid ${tab === id ? AMBER : "transparent"}`,
            background: tab === id ? "#FFFBEB" : "transparent",
            color: tab === id ? "#92400E" : MUTED, cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, position: "relative" }}>
        {tab === "template" && (
          <TemplateTabWithPreview data={data} patch={patch} />
        )}
        {tab === "delivery" && <DeliveryTab data={data} patch={patch} />}
        {tab === "output"   && <OutputTab   data={data} patch={patch} />}
      </div>

      {/* Save footer */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={() => alert("Changes saved")} style={{ width: "100%", padding: "9px", background: AMBER, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// TemplateTab with local preview state
function TemplateTabWithPreview({ data, patch }) {
  const [showPicker,      setShowPicker]      = useState(false);
  const [showCreate,      setShowCreate]      = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState("mac");

  const { template } = data;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Modals */}
      {showPicker && (
        <PushTemplatePicker
          onSelect={(tpl) => { patch({ template: tpl, variableMap: {} }); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}
      {showCreate && (
        <PushCreateModal
          onSave={(tpl) => { patch({ template: tpl, variableMap: {} }); setShowCreate(false); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Template</Label>
          {template && (
            <button type="button" onClick={() => setShowCreate(true)} style={{ fontSize: 11, color: AMBER, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              + Create New
            </button>
          )}
        </div>

        {!template ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setShowCreate(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Create New
            </button>
            <button type="button" onClick={() => setShowPicker(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>☰</div>
              Select Existing
            </button>
          </div>
        ) : (
          <div>
            {/* Template summary card */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "8px 12px", background: "#FFFBEB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <Bell size={13} color={AMBER} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  <button onClick={() => setShowCreate(true)} style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, color: AMBER, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                  <button onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{template.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{template.body}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
                  {template.style && (
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#FEF3C7", color: "#92400E" }}>
                      {PUSH_TEMPLATE_STYLES.find((s) => s.id === template.style)?.name || template.style}
                    </span>
                  )}
                  {template.platforms && Object.entries(template.platforms).filter(([, v]) => v).map(([k]) => (
                    <span key={k} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#F1F5F9", color: "#64748B" }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform preview */}
            <div>
              <Label>Preview for</Label>
              <div style={{ display: "flex", background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 3, gap: 2, marginBottom: 12 }}>
                {PUSH_PREVIEW_PLATFORMS.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPreviewPlatform(p.id)} style={{
                    flex: 1, padding: "5px 4px", fontSize: 11, fontWeight: 500,
                    border: "none", borderRadius: 6, cursor: "pointer",
                    background: previewPlatform === p.id ? "#FEF3C7" : "transparent",
                    color: previewPlatform === p.id ? "#92400E" : "#64748B",
                    transition: "all 0.12s",
                  }}>{p.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <NotificationPreview
                  platform={previewPlatform}
                  title={template.title}
                  body={template.body}
                  iconType={template.iconType}
                  imageUrl={template.imageUrl}
                  hasImage={template.hasImage}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
