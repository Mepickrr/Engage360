import React, { useState } from "react";
import {
  X, Monitor, Smartphone, Tablet, Save, Eye,
  Undo2, Redo2, ChevronRight, GripVertical, Trash2,
  Plus, Type, Image, Square, Minus, Star, AlignLeft,
  FileText, Video, Volume2, Timer, LayoutGrid, AlertTriangle,
  Zap, Ticket, ChevronDown,
} from "lucide-react";
import {
  ONSITE_TEAL, DISPLAY_TYPES, EDITOR_BLOCK_GROUPS, SYSTEM_VARIABLES,
} from "./data/mockData";

// ── Device preview sizes ───────────────────────────────────────
const DEVICES = [
  { id: "desktop", label: "Desktop",  Icon: Monitor,    w: 600 },
  { id: "tablet",  label: "Tablet",   Icon: Tablet,     w: 420 },
  { id: "mobile",  label: "Mobile",   Icon: Smartphone, w: 320 },
];

// ── Block icon map ─────────────────────────────────────────────
const BLOCK_ICON_MAP = {
  title: Type, text: AlignLeft, image: Image, button: Square,
  icon: Star, spacer: AlignLeft, form: FileText, line: Minus,
  video: Video, audio: Volume2, countdown: Timer, carousel: LayoutGrid,
  alert: AlertTriangle, spin_wheel: Zap, scratch_card: Ticket,
};

// ── Sidebar tab ────────────────────────────────────────────────
function SideTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 700,
        border: "none", cursor: "pointer", background: "transparent",
        borderBottom: active ? `2px solid ${ONSITE_TEAL}` : "2px solid transparent",
        color: active ? ONSITE_TEAL : "#64748B", transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Block chip ─────────────────────────────────────────────────
function BlockChip({ block }) {
  const Icon = BLOCK_ICON_MAP[block.type] || Type;
  return (
    <div
      draggable
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        gap: 5, padding: "10px 6px", background: "#fff",
        border: "1.5px solid #E5E7EB", borderRadius: 8, cursor: "grab",
        fontSize: 10, color: "#64748B", fontWeight: 600,
        textAlign: "center", userSelect: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = ONSITE_TEAL; e.currentTarget.style.color = ONSITE_TEAL; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#64748B"; }}
    >
      <Icon size={15} />
      <span style={{ lineHeight: 1.2 }}>{block.label}</span>
    </div>
  );
}

// ── Collapsible block group ────────────────────────────────────
function BlockGroup({ group }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "4px 0 8px", marginBottom: 2 }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em" }}>{group.label}</span>
        <ChevronDown size={13} color="#94A3B8" style={{ transform: open ? "none" : "rotate(-90deg)", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {group.blocks.map((b) => <BlockChip key={b.type} block={b} />)}
        </div>
      )}
    </div>
  );
}

// ── Canvas block renderer ──────────────────────────────────────
function CanvasBlock({ block, index, onDelete }) {
  const [hovered, setHovered] = useState(false);
  let content = null;

  if (block.type === "title") {
    content = (
      <div contentEditable suppressContentEditableWarning style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", outline: "none" }}>
        {block.content || "Your headline here"}
      </div>
    );
  } else if (block.type === "text") {
    content = (
      <p contentEditable suppressContentEditableWarning style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0, outline: "none" }}>
        {block.content || "Your message body…"}
      </p>
    );
  } else if (block.type === "image") {
    content = (
      <div style={{ width: "100%", height: 130, background: "#F1F5F9", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", border: "2px dashed #CBD5E1" }}>
        <Image size={24} color="#CBD5E1" />
        <span style={{ fontSize: 11, color: "#94A3B8" }}>Click to upload image</span>
      </div>
    );
  } else if (block.type === "button") {
    content = (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button style={{ padding: "11px 28px", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          {block.label || "Click Here"}
        </button>
      </div>
    );
  } else if (block.type === "form") {
    content = (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input disabled placeholder="Enter your email…" style={{ padding: "9px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, background: "#F8FAFC" }} />
        <button disabled style={{ padding: "10px", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
          {block.cta || "Submit"}
        </button>
      </div>
    );
  } else if (block.type === "countdown") {
    content = (
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {["00", "12", "34", "56"].map((v, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ width: 44, height: 44, background: ONSITE_TEAL, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 }}>{v}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 3 }}>{["Days","Hrs","Min","Sec"][i]}</div>
          </div>
        ))}
      </div>
    );
  } else if (block.type === "line") {
    content = <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "4px 0" }} />;
  } else if (block.type === "spacer") {
    content = <div style={{ height: 20 }} />;
  } else if (block.type === "spin_wheel") {
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <div style={{ width: 100, height: 100, borderRadius: "50%", background: `conic-gradient(${ONSITE_TEAL} 0deg 60deg, #F59E0B 60deg 120deg, #EF4444 120deg 180deg, #8B5CF6 180deg 240deg, #3B82F6 240deg 300deg, #10B981 300deg 360deg)`, border: "4px solid #fff", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }} />
        <span style={{ fontSize: 11, color: "#64748B" }}>Spin the Wheel</span>
      </div>
    );
  } else if (block.type === "scratch_card") {
    content = (
      <div style={{ width: "100%", height: 80, background: "#CBD5E1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>🎟 Scratch to Reveal</span>
      </div>
    );
  } else {
    content = (
      <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12, color: "#94A3B8" }}>
        [{block.type}] block
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", padding: "10px 12px",
        background: hovered ? "#F8FAFC" : "transparent",
        border: `1.5px solid ${hovered ? ONSITE_TEAL : "transparent"}`,
        borderRadius: 8, marginBottom: 4, transition: "all 0.1s",
      }}
    >
      {hovered && (
        <>
          <button onClick={() => onDelete(index)} style={{ position: "absolute", top: 6, right: 8, width: 22, height: 22, borderRadius: 4, background: "#FEE2E2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
            <Trash2 size={11} color="#EF4444" />
          </button>
          <div style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", cursor: "grab" }}>
            <GripVertical size={13} color="#CBD5E1" />
          </div>
        </>
      )}
      {content}
    </div>
  );
}

// ── Display canvas wrapper ─────────────────────────────────────
function DisplayWrapper({ displayType, device, children, bgColor }) {
  const isBanner = displayType === "banner";
  const isNudge  = displayType === "nudge";

  if (isBanner) {
    return (
      <div style={{ position: "relative", background: "#F8FAFC", borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", width: DEVICES.find((d) => d.id === device)?.w ?? 600 }}>
        {/* Fake browser chrome */}
        <div style={{ background: "#E5E7EB", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
          <div style={{ flex: 1, height: 16, background: "#fff", borderRadius: 4, marginLeft: 8 }} />
        </div>
        {/* Banner at top of page */}
        <div style={{ background: bgColor, padding: "12px 20px" }}>
          {children}
        </div>
        {/* Fake page content */}
        <div style={{ background: "#fff", height: 140, padding: 16 }}>
          {[40, 100, 80, 60, 90].map((w, i) => (
            <div key={i} style={{ height: 10, background: "#F1F5F9", borderRadius: 4, width: `${w}%`, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  const popupW = device === "mobile" ? 280 : device === "tablet" ? 340 : 400;

  return (
    <div style={{ position: "relative", width: DEVICES.find((d) => d.id === device)?.w ?? 600, borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
      {/* Fake browser chrome */}
      <div style={{ background: "#E5E7EB", padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
        <div style={{ flex: 1, height: 16, background: "#fff", borderRadius: 4, marginLeft: 8 }} />
      </div>
      {/* Page background */}
      <div style={{ background: "#CBD5E1", height: 280, position: "relative", display: "flex", alignItems: isNudge ? "flex-end" : "center", justifyContent: isNudge ? "flex-end" : "center", padding: 16 }}>
        {/* Fake page content behind */}
        <div style={{ position: "absolute", inset: 0, padding: 16 }}>
          {[40, 100, 80, 60, 90].map((w, i) => (
            <div key={i} style={{ height: 8, background: "rgba(255,255,255,0.3)", borderRadius: 4, width: `${w}%`, marginBottom: 6 }} />
          ))}
        </div>
        {/* Overlay for popup */}
        {!isNudge && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
        )}
        {/* The popup/nudge card */}
        <div style={{ position: "relative", zIndex: 1, width: isNudge ? 200 : popupW, background: bgColor, borderRadius: 12, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", marginBottom: isNudge ? 0 : 0 }}>
          {/* Close button */}
          <button style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <X size={10} color="#fff" />
          </button>
          <div style={{ padding: isNudge ? "12px" : "20px 20px 16px" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Settings section ───────────────────────────────────────────
function SettingsSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <ChevronRight size={13} color="#94A3B8" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && <div style={{ padding: "0 16px 14px" }}>{children}</div>}
    </div>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: value, border: "1px solid #E5E7EB" }} />
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 60, fontSize: 11, border: "1px solid #E5E7EB", borderRadius: 4, padding: "1px 4px" }} />
      </div>
    </div>
  );
}

// ── Default blocks per display type ───────────────────────────
function defaultBlocks(displayType) {
  if (displayType === "banner") return [
    { type: "text",   content: "🔥 Special offer — 30% off today only!" },
    { type: "button", label: "Shop Now", url: "" },
  ];
  if (displayType === "nudge") return [
    { type: "text",   content: "Enjoying your experience? Leave us a review ⭐" },
    { type: "button", label: "Leave Review", url: "" },
  ];
  return [
    { type: "image" },
    { type: "title",  content: "Don't miss out!" },
    { type: "text",   content: "Complete your order and get a special discount." },
    { type: "button", label: "Claim Offer", url: "" },
    { type: "spacer" },
  ];
}

// ── Main modal ─────────────────────────────────────────────────
export default function OnsiteTemplateEditorModal({ template, displayType, onSave, onClose }) {
  const [device,  setDevice]  = useState("desktop");
  const [sideTab, setSideTab] = useState("content");
  const [blocks,  setBlocks]  = useState(template?.blocks ?? defaultBlocks(displayType));
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [overlayColor, setOverlayColor] = useState("rgba(0,0,0,0.5)");
  const [varSearch, setVarSearch] = useState("");
  const [borderRadius, setBorderRadius] = useState(12);

  const activeDevice = DEVICES.find((d) => d.id === device) ?? DEVICES[0];
  const dt = DISPLAY_TYPES.find((d) => d.id === displayType);

  const deleteBlock = (idx) => setBlocks((b) => b.filter((_, i) => i !== idx));
  const addBlock = (type) => setBlocks((b) => [...b, { type }]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "stretch", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#F1F5F9" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, background: "#fff", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: ONSITE_TEAL, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Monitor size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                {template?.name || `New ${dt?.label ?? "Onsite"} Template`}
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>{dt?.emoji} {dt?.label} · Visual Editor</div>
            </div>
          </div>

          {/* Center: device toggle */}
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 3 }}>
            {DEVICES.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: device === id ? "#fff" : "transparent",
                  color: device === id ? ONSITE_TEAL : "#64748B",
                  fontWeight: device === id ? 700 : 500, fontSize: 12,
                  boxShadow: device === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 12, color: "#64748B", cursor: "pointer" }}>
              <Undo2 size={13} /> Undo
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 12, color: "#64748B", cursor: "pointer" }}>
              <Eye size={13} /> Preview
            </button>
            <button
              onClick={() => { onSave({ blocks, bgColor }); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", border: "none", borderRadius: 8, background: ONSITE_TEAL, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <Save size={13} /> Save Template
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="#64748B" />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* Canvas */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", background: "#E2E8F0", padding: "32px 16px" }}>
            <div style={{ marginBottom: 12, width: activeDevice.w, transition: "width 0.25s" }}>
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                {activeDevice.Icon && <>{device === "desktop" ? "🖥" : device === "tablet" ? "📟" : "📱"}</>} {activeDevice.label} · {activeDevice.w}px
              </span>
            </div>

            <DisplayWrapper displayType={displayType} device={device} bgColor={bgColor}>
              {blocks.map((block, i) => (
                <CanvasBlock key={i} block={block} index={i} onDelete={deleteBlock} />
              ))}
              <div style={{ paddingTop: 8 }}>
                <button
                  onClick={() => addBlock("text")}
                  style={{ width: "100%", padding: "8px", border: `2px dashed ${ONSITE_TEAL}66`, borderRadius: 8, background: `${ONSITE_TEAL}0D`, cursor: "pointer", fontSize: 11, color: ONSITE_TEAL, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                >
                  <Plus size={13} /> Add Block
                </button>
              </div>
            </DisplayWrapper>
          </div>

          {/* Right sidebar */}
          <div style={{ width: 272, background: "#fff", borderLeft: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
              {["content", "variables", "settings"].map((tab) => (
                <SideTab key={tab} active={sideTab === tab} onClick={() => setSideTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </SideTab>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>

              {/* CONTENT tab */}
              {sideTab === "content" && (
                <div>
                  {EDITOR_BLOCK_GROUPS.map((group) => (
                    <BlockGroup key={group.id} group={group} />
                  ))}
                </div>
              )}

              {/* VARIABLES tab */}
              {sideTab === "variables" && (
                <div>
                  <input
                    value={varSearch}
                    onChange={(e) => setVarSearch(e.target.value)}
                    placeholder="Search variables…"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  {Object.entries(SYSTEM_VARIABLES).map(([group, vars]) => {
                    const filtered = vars.filter((v) => !varSearch || v.label.toLowerCase().includes(varSearch.toLowerCase()));
                    if (!filtered.length) return null;
                    return (
                      <div key={group} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{group}</div>
                        {filtered.map((v) => (
                          <div
                            key={v.key}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", background: "#F8FAFC" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = `${ONSITE_TEAL}10`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v.label}</div>
                              <div style={{ fontSize: 10, color: "#94A3B8" }}>{v.example}</div>
                            </div>
                            <code style={{ fontSize: 10, background: `${ONSITE_TEAL}18`, color: ONSITE_TEAL, padding: "2px 6px", borderRadius: 4 }}>
                              {`{{${v.key}}}`}
                            </code>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SETTINGS tab */}
              {sideTab === "settings" && (
                <div>
                  <SettingsSection label="Background" defaultOpen>
                    <ColorRow label="Background color" value={bgColor} onChange={setBgColor} />
                  </SettingsSection>

                  <SettingsSection label="Shape" defaultOpen>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>Border radius</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="range" min={0} max={32} value={borderRadius}
                          onChange={(e) => setBorderRadius(Number(e.target.value))}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 12, color: "#64748B", width: 36 }}>{borderRadius}px</span>
                      </div>
                    </div>
                  </SettingsSection>

                  {displayType !== "banner" && (
                    <SettingsSection label="Overlay" defaultOpen={false}>
                      <ColorRow label="Overlay color" value={overlayColor} onChange={setOverlayColor} />
                    </SettingsSection>
                  )}

                  <SettingsSection label="Close Button" defaultOpen={false}>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input type="checkbox" defaultChecked />
                      <span style={{ fontSize: 12, color: "#374151" }}>Show close button</span>
                    </label>
                  </SettingsSection>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
