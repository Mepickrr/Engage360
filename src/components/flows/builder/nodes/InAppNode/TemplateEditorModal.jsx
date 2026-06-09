import React, { useState } from "react";
import { X, Trash2, GripVertical } from "lucide-react";
import {
  INAPP_VIOLET, INAPP_BLOCK_GROUPS, INAPP_SYSTEM_VARIABLES, INAPP_DISPLAY_TYPES,
} from "./data/mockData";

const BORDER  = "#E5E7EB";
const MUTED   = "#94A3B8";
const ANDROID_GREEN = "#3DDC84";
const IOS_SILVER    = "#E5E7EB";

// ── Device frames ──────────────────────────────────────────────
function AndroidStatusBar() {
  return (
    <div style={{ height: 24, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px" }}>
      <span style={{ color: "#fff", fontSize: 9, fontWeight: 600 }}>5:32</span>
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 8, color: "#fff" }}>●●●</span>
        <span style={{ fontSize: 8, color: "#fff" }}>WiFi</span>
        <span style={{ fontSize: 8, color: "#fff" }}>100%</span>
      </div>
    </div>
  );
}

function IOSStatusBar() {
  return (
    <div style={{ height: 44, background: "#1a1a2e", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 20px 8px" }}>
      <span style={{ color: "#fff", fontSize: 10, fontWeight: 600 }}>5:32</span>
      <div style={{ width: 120, height: 28, background: "#000", borderRadius: 20, alignSelf: "center" }} />
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <span style={{ fontSize: 8, color: "#fff" }}>●●●</span>
        <span style={{ fontSize: 8, color: "#fff" }}>100%</span>
      </div>
    </div>
  );
}

function PhoneFrame({ platform, displayType, bgColor, children }) {
  const isIOS     = platform === "ios";
  const frameW    = 320;
  const frameH    = 580;
  const screenW   = 300;
  const screenH   = 540;

  const outerStyle = {
    width: frameW, height: frameH, flexShrink: 0,
    background: isIOS ? "#f0f0f0" : "#1a1a2e",
    borderRadius: isIOS ? 44 : 32,
    border: `6px solid ${isIOS ? "#c8c8cc" : "#333"}`,
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", position: "relative", overflow: "hidden",
    boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
  };

  const screenStyle = {
    width: screenW, height: screenH,
    background: "#1a1a2e",
    borderRadius: isIOS ? 36 : 24,
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    position: "relative",
  };

  const appBg = {
    flex: 1, background: "#252535",
    display: "flex", flexDirection: "column",
    position: "relative",
  };

  return (
    <div style={outerStyle}>
      {/* Home button / pill */}
      {!isIOS && (
        <div style={{ position: "absolute", bottom: 8, width: 120, height: 4, background: "#555", borderRadius: 2 }} />
      )}
      <div style={screenStyle}>
        {isIOS ? <IOSStatusBar /> : <AndroidStatusBar />}
        <div style={appBg}>
          {/* Simulated app content */}
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, opacity: 0.4 }}>
            {[60, 40, 80, 40].map((w, i) => (
              <div key={i} style={{ height: 8, width: `${w}%`, background: "#555", borderRadius: 4 }} />
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, height: 48, background: "#333", borderRadius: 8 }} />
              ))}
            </div>
            {[70, 50].map((w, i) => (
              <div key={i} style={{ height: 8, width: `${w}%`, background: "#555", borderRadius: 4 }} />
            ))}
          </div>

          {/* InApp overlay based on display type */}
          <InAppPreviewOverlay displayType={displayType} bgColor={bgColor} children={children} />
        </div>

        {/* Bottom nav */}
        <div style={{ height: 36, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {["🏠", "🔍", "🛒"].map((icon, i) => (
            <span key={i} style={{ fontSize: 14 }}>{icon}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function InAppPreviewOverlay({ displayType, bgColor, children }) {
  if (displayType === "fullscreen") {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: bgColor || "#fff",
        display: "flex", flexDirection: "column", overflowY: "auto",
      }}>
        <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <X size={10} color="#fff" />
        </div>
        {children}
      </div>
    );
  }

  if (displayType === "popup") {
    return (
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          background: bgColor || "#fff",
          borderRadius: 16, width: "82%", maxHeight: "70%",
          overflowY: "auto", position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}>
          <div style={{ position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={9} color="#555" />
          </div>
          {children}
        </div>
      </div>
    );
  }

  // Nudge — bottom bar
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: bgColor || "#fff",
      borderRadius: "12px 12px 0 0",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.2)",
      padding: "8px 12px 12px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ width: 36, height: 3, background: "#CBD5E1", borderRadius: 2, margin: "0 auto 4px" }} />
      {children}
    </div>
  );
}

// ── Canvas blocks ──────────────────────────────────────────────
function BlockRenderer({ block, onDelete, onUpdate, accentColor }) {
  const [hovered, setHovered] = useState(false);

  const containerStyle = {
    position: "relative", padding: "4px 6px",
    border: `1.5px solid ${hovered ? accentColor : "transparent"}`,
    borderRadius: 6, cursor: "grab", transition: "border-color 0.15s",
  };

  const renderContent = () => {
    switch (block.type) {
      case "heading":
        return (
          <div
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate({ content: e.currentTarget.textContent })}
            style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", outline: "none", lineHeight: 1.3 }}
          >{block.content || "Add heading"}</div>
        );
      case "text":
        return (
          <div
            contentEditable suppressContentEditableWarning
            onBlur={(e) => onUpdate({ content: e.currentTarget.textContent })}
            style={{ fontSize: 11, color: "#475569", outline: "none", lineHeight: 1.5 }}
          >{block.content || "Add text"}</div>
        );
      case "image":
        return (
          <div
            onClick={() => alert("Image upload — connect your media library")}
            style={{
              height: 64, background: block.bgColor || "#F1F5F9", borderRadius: 8,
              border: `2px dashed ${BORDER}`, display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", fontSize: 10, color: MUTED,
            }}
          >
            🖼 {block.src ? "Image set" : "Click to upload / set URL"}
          </div>
        );
      case "button":
        return (
          <button style={{
            width: "100%", padding: "7px 12px",
            background: block.style === "primary" ? accentColor : "transparent",
            color: block.style === "primary" ? "#fff" : accentColor,
            border: `1.5px solid ${accentColor}`,
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            {block.label || "Button"}
          </button>
        );
      case "rating":
        return (
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {Array.from({ length: block.stars || 5 }).map((_, i) => (
              <span key={i} style={{ fontSize: 18, color: "#FBBF24" }}>★</span>
            ))}
          </div>
        );
      case "spacer":
        return <div style={{ height: block.height || 12 }} />;
      case "line":
        return <hr style={{ border: "none", borderTop: `1px solid ${BORDER}`, margin: "2px 0" }} />;
      case "form":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input placeholder="Email address" style={{ padding: "6px 10px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} readOnly />
            <button style={{ padding: "7px", background: accentColor, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
              {block.cta || "Submit"}
            </button>
          </div>
        );
      case "countdown":
        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {["00", "12", "45", "30"].map((val, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ background: accentColor, color: "#fff", borderRadius: 6, width: 32, height: 28, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{["DD","HH","MM","SS"][i]}</div>
              </div>
            ))}
          </div>
        );
      case "gif":
        return (
          <div style={{ height: 48, background: "#0F172A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>GIF</span>
          </div>
        );
      case "video":
        return (
          <div style={{ height: 48, background: "#1E293B", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER}` }}>
            <span style={{ fontSize: 16, color: "#fff" }}>▶</span>
          </div>
        );
      case "spin_wheel":
        return (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: `4px conic-gradient(#F59E0B 0%, #EF4444 25%, #3B82F6 50%, #10B981 75%) solid`, background: "conic-gradient(#F59E0B, #EF4444, #3B82F6, #10B981)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎡</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Spin the Wheel</div>
          </div>
        );
      case "scratch_card":
        return (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ width: 80, height: 40, background: "linear-gradient(135deg, #94A3B8, #CBD5E1)", borderRadius: 6, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#475569", fontWeight: 600 }}>Scratch to reveal</div>
          </div>
        );
      default:
        return <div style={{ fontSize: 10, color: MUTED, padding: "4px 0" }}>{block.type}</div>;
    }
  };

  return (
    <div
      style={containerStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <>
          <GripVertical size={10} style={{ position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)", color: MUTED, cursor: "grab" }} />
          <button
            onClick={onDelete}
            style={{ position: "absolute", top: 2, right: 2, background: "#EF4444", border: "none", borderRadius: 4, width: 16, height: 16, color: "#fff", fontSize: 9, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}
          ><Trash2 size={9} /></button>
        </>
      )}
      {renderContent()}
    </div>
  );
}

// ── Right sidebar ──────────────────────────────────────────────
function RightSidebar({ sidebarTab, onTabChange, onAddBlock, bgColor, onBgColorChange, showCloseButton, onCloseButtonToggle }) {
  const [varSearch, setVarSearch] = useState("");

  return (
    <div style={{ width: 200, borderLeft: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", background: "#FAFAFA" }}>
      {/* Tab row */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
        {["CONTENT", "VARIABLES", "SETTINGS"].map((t) => (
          <button key={t} onClick={() => onTabChange(t)} style={{
            flex: 1, padding: "8px 2px", fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
            background: "none", border: "none", cursor: "pointer",
            color: sidebarTab === t ? INAPP_VIOLET : MUTED,
            borderBottom: `2px solid ${sidebarTab === t ? INAPP_VIOLET : "transparent"}`,
          }}>{t}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {sidebarTab === "CONTENT" && (
          <div>
            {INAPP_BLOCK_GROUPS.map((group) => (
              <div key={group.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{group.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                  {group.blocks.map((b) => (
                    <button key={b.type} onClick={() => onAddBlock(b.type)} style={{
                      padding: "6px 4px", border: `1px solid ${BORDER}`, borderRadius: 7,
                      background: "#fff", cursor: "pointer", textAlign: "center",
                      fontSize: 9, color: "#475569",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = INAPP_VIOLET; e.currentTarget.style.color = INAPP_VIOLET; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
                      <div style={{ fontSize: 14, marginBottom: 2 }}>{b.icon}</div>
                      <div>{b.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {sidebarTab === "VARIABLES" && (
          <div>
            <input
              value={varSearch}
              onChange={(e) => setVarSearch(e.target.value)}
              placeholder="Search variables…"
              style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
            />
            {Object.entries(INAPP_SYSTEM_VARIABLES).map(([group, vars]) => {
              const filtered = vars.filter((v) => v.label.toLowerCase().includes(varSearch.toLowerCase()) || v.key.toLowerCase().includes(varSearch.toLowerCase()));
              if (!filtered.length) return null;
              return (
                <div key={group} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{group}</div>
                  {filtered.map((v) => (
                    <div key={v.key} onClick={() => { navigator.clipboard?.writeText(`{{${v.key}}}`); }} style={{
                      padding: "5px 8px", marginBottom: 3, border: `1px solid ${BORDER}`, borderRadius: 6,
                      cursor: "pointer", background: "#fff",
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}>
                      <div style={{ fontFamily: "monospace", fontSize: 10, color: INAPP_VIOLET, fontWeight: 600 }}>{`{{${v.key}}}`}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{v.example}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {sidebarTab === "SETTINGS" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Background Color</div>
              <input type="color" value={bgColor || "#ffffff"} onChange={(e) => onBgColorChange(e.target.value)}
                style={{ width: "100%", height: 32, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: "pointer", padding: 2 }} />
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Close Button</div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={showCloseButton} onChange={(e) => onCloseButtonToggle(e.target.checked)} style={{ accentColor: INAPP_VIOLET }} />
                <span style={{ fontSize: 11, color: "#475569" }}>Show close button</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────
export default function InAppTemplateEditorModal({ displayType, template, onSave, onClose }) {
  const [platform,         setPlatform]         = useState("android");
  const [sidebarTab,       setSidebarTab]        = useState("CONTENT");
  const [blocks,           setBlocks]            = useState(template?.blocks ?? []);
  const [bgColor,          setBgColor]           = useState(template?.bgColor ?? "#FFFFFF");
  const [showCloseButton,  setShowCloseButton]   = useState(template?.showCloseButton ?? true);

  const dt = INAPP_DISPLAY_TYPES.find((d) => d.id === displayType);

  const addBlock = (type) => {
    const defaults = {
      heading:    { content: "Add heading" },
      text:       { content: "Add text here" },
      image:      { src: null, bgColor: "#F1F5F9" },
      button:     { label: "Tap here", style: "primary", action: "dismiss", url: "" },
      rating:     { stars: 5 },
      spacer:     { height: 12 },
      line:       {},
      form:       { fields: ["email"], cta: "Submit" },
      countdown:  { endsAt: null },
      carousel:   { items: [] },
      gif:        { src: null },
      video:      { src: null },
      spin_wheel: {},
      scratch_card: {},
    };
    setBlocks((prev) => [...prev, { id: `b_${Date.now()}`, type, ...(defaults[type] || {}) }]);
  };

  const deleteBlock = (id) => setBlocks((prev) => prev.filter((b) => b.id !== id));
  const updateBlock = (id, patch) => setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, ...patch } : b));

  const handleSave = () => {
    onSave({ blocks, bgColor, showCloseButton });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ height: 52, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#fff", flexShrink: 0 }}>
        {/* Node name + type */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: INAPP_VIOLET, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>{dt?.emoji || "📱"}</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>InApp Template Editor</div>
            <div style={{ fontSize: 10, color: MUTED }}>{dt?.label || "Message"}</div>
          </div>
        </div>

        {/* Platform toggle */}
        <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
          {[{ id: "android", label: "🤖 Android" }, { id: "ios", label: "🍎 iOS" }].map(({ id, label }) => (
            <button key={id} onClick={() => setPlatform(id)} style={{
              padding: "5px 12px", fontSize: 11, fontWeight: 500,
              background: platform === id ? INAPP_VIOLET : "#fff",
              color: platform === id ? "#fff" : "#64748B",
              border: "none", cursor: "pointer",
            }}>{label}</button>
          ))}
        </div>

        {/* Actions */}
        <button
          onClick={handleSave}
          style={{ padding: "7px 16px", background: INAPP_VIOLET, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
        >Save Template</button>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Canvas area */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflowY: "auto", padding: 24, gap: 32 }}>
          <PhoneFrame platform={platform} displayType={displayType} bgColor={bgColor}>
            <div style={{ padding: "8px 10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {blocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  onDelete={() => deleteBlock(block.id)}
                  onUpdate={(patch) => updateBlock(block.id, patch)}
                  accentColor={INAPP_VIOLET}
                />
              ))}
              {/* Add Block */}
              <button
                onClick={() => addBlock("text")}
                style={{
                  marginTop: 4, padding: "6px", border: `1.5px dashed ${BORDER}`, borderRadius: 8,
                  background: "transparent", cursor: "pointer", fontSize: 10, color: MUTED,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = INAPP_VIOLET; e.currentTarget.style.color = INAPP_VIOLET; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
              >+ Add Block</button>
            </div>
          </PhoneFrame>
        </div>

        {/* Right sidebar */}
        <RightSidebar
          sidebarTab={sidebarTab}
          onTabChange={setSidebarTab}
          onAddBlock={addBlock}
          bgColor={bgColor}
          onBgColorChange={setBgColor}
          showCloseButton={showCloseButton}
          onCloseButtonToggle={setShowCloseButton}
        />
      </div>
    </div>
  );
}
