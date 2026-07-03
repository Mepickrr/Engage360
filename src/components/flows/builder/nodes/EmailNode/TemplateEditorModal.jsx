import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Monitor, Smartphone, Undo2, Redo2, Eye, Save,
  ChevronDown, ChevronRight, GripVertical, Trash2, Plus,
  Type, Image, Square, Minus, AlignLeft, Code2, Share2,
  ShoppingBag, MailMinus, AlignCenter, Bold, Italic,
  Link, Palette,
} from "lucide-react";
import { EDITOR_CONTENT_BLOCKS, EDITOR_ROW_LAYOUTS, SYSTEM_VARIABLES } from "./data/mockData";

const EMAIL_BLUE = "#3B82F6";

// ── Sidebar tab button ─────────────────────────────────────────
function SideTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "9px 4px", fontSize: 11, fontWeight: 700,
        border: "none", cursor: "pointer",
        borderBottom: active ? `2px solid ${EMAIL_BLUE}` : "2px solid transparent",
        background: "transparent",
        color: active ? EMAIL_BLUE : "#64748B",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ── Draggable content block chip ───────────────────────────────
const BLOCK_ICONS = {
  text:        Type,
  image:       Image,
  button:      Square,
  divider:     Minus,
  spacer:      AlignLeft,
  html:        Code2,
  social:      Share2,
  product:     ShoppingBag,
  unsubscribe: MailMinus,
};

function ContentBlockChip({ block }) {
  const Icon = BLOCK_ICONS[block.type] || Type;
  return (
    <div
      draggable
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
        padding: "10px 6px", background: "#fff",
        border: "1.5px solid #E5E7EB", borderRadius: 8, cursor: "grab",
        fontSize: 10, color: "#64748B", fontWeight: 600, textAlign: "center",
        userSelect: "none",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = EMAIL_BLUE; e.currentTarget.style.color = EMAIL_BLUE; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; e.currentTarget.style.color = "#64748B"; }}
    >
      <Icon size={16} />
      <span>{block.label}</span>
    </div>
  );
}

// ── Row layout selector ────────────────────────────────────────
function RowLayout({ layout }) {
  const cols = Array.from({ length: layout.cols });
  return (
    <div
      style={{
        display: "flex", gap: 4, alignItems: "center",
        padding: 8, background: "#fff",
        border: "1.5px solid #E5E7EB", borderRadius: 8, cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = EMAIL_BLUE; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
    >
      {cols.map((_, i) => (
        <div key={i} style={{ flex: 1, height: 28, background: "#EFF6FF", borderRadius: 4 }} />
      ))}
    </div>
  );
}

// ── Settings section ──────────────────────────────────────────
function SettingsSection({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid #F1F5F9" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <ChevronRight size={14} color="#94A3B8" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
      {children}
    </div>
  );
}

// ── Mock email canvas block ────────────────────────────────────
function EmailCanvasBlock({ block, index, total, onDelete }) {
  const [hovered, setHovered] = useState(false);

  let content = null;
  if (block.type === "image") {
    content = (
      <div style={{ width: "100%", height: 160, background: "#F1F5F9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, cursor: "pointer" }}>
        <Image size={28} color="#CBD5E1" />
        <span style={{ fontSize: 12, color: "#94A3B8" }}>Click to add image</span>
      </div>
    );
  } else if (block.type === "text") {
    content = (
      <div style={{ padding: "6px 0" }}>
        <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, margin: 0 }} contentEditable suppressContentEditableWarning>
          {block.content || "Click to edit text…"}
        </p>
      </div>
    );
  } else if (block.type === "button") {
    content = (
      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
        <button style={{ padding: "12px 32px", background: EMAIL_BLUE, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          {block.label || "Click Me"}
        </button>
      </div>
    );
  } else if (block.type === "divider") {
    content = <hr style={{ border: "none", borderTop: "1px solid #E5E7EB", margin: "8px 0" }} />;
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", padding: "12px 16px",
        background: hovered ? "#F8FAFC" : "#fff",
        border: `1.5px solid ${hovered ? EMAIL_BLUE : "transparent"}`,
        borderRadius: 6, marginBottom: 4,
        transition: "all 0.1s",
      }}
    >
      {hovered && (
        <div style={{ position: "absolute", top: 6, right: 8, display: "flex", gap: 4, zIndex: 10 }}>
          <button onClick={() => onDelete(index)} style={{ width: 22, height: 22, borderRadius: 4, background: "#FEE2E2", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={11} color="#EF4444" />
          </button>
        </div>
      )}
      {hovered && (
        <div style={{ position: "absolute", left: 4, top: "50%", transform: "translateY(-50%)", cursor: "grab" }}>
          <GripVertical size={14} color="#CBD5E1" />
        </div>
      )}
      {content}
    </div>
  );
}

// ── Default template blocks for editor ────────────────────────
const DEFAULT_BLOCKS = [
  { type: "image",   src: null },
  { type: "text",    content: "Hi {{customer.firstName}},\n\nThank you for shopping with us. Here's what you need to know." },
  { type: "button",  label: "View Details", url: "" },
  { type: "divider" },
  { type: "text",    content: "If you have any questions, just reply to this email." },
];

// ── Color swatch ───────────────────────────────────────────────
function ColorSwatch({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: "1px solid #E5E7EB", cursor: "pointer", flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
    </div>
  );
}

// ── Font size select ───────────────────────────────────────────
function FontSelect({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "4px 8px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 6, background: "#fff", cursor: "pointer", outline: "none" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function TemplateEditorModal({ open, template, data, onSave, onClose }) {
  const [viewMode,      setViewMode]      = useState("desktop");
  const [sideTab,       setSideTab]       = useState("content");
  const [blocks,        setBlocks]        = useState(template?.blocks ?? DEFAULT_BLOCKS);
  const [bgColor,       setBgColor]       = useState("#F8FAFC");
  const [emailWidth,    setEmailWidth]    = useState("600");
  const [varSearch,     setVarSearch]     = useState("");
  const [templateName,  setTemplateName]  = useState(template?.name || "");
  const [subject,       setSubject]       = useState(data?.subject || "");
  const [previewText,   setPreviewText]   = useState(data?.previewText || "");

  useEffect(() => {
    if (open) {
      setBlocks(template?.blocks ?? DEFAULT_BLOCKS);
      setBgColor("#F8FAFC");
      setEmailWidth("600");
      setVarSearch("");
      setTemplateName(template?.name || "");
      setSubject(data?.subject || "");
      setPreviewText(data?.previewText || "");
    }
  }, [open]);

  const deleteBlock = (idx) => setBlocks((b) => b.filter((_, i) => i !== idx));

  const addBlock = (type) => {
    const newBlock = type === "image" ? { type: "image", src: null }
      : type === "button" ? { type: "button", label: "Click Here", url: "" }
      : type === "divider" ? { type: "divider" }
      : { type: "text", content: "New text block…" };
    setBlocks((b) => [...b, newBlock]);
  };

  const handleSave = () => {
    onSave({ blocks, bgColor, subject, previewText, templateName });
    onClose();
  };

  const previewWidth = viewMode === "mobile" ? 375 : 660;

  const allVars = Object.entries(SYSTEM_VARIABLES).flatMap(([group, vars]) =>
    vars.map((v) => ({ ...v, group }))
  ).filter((v) => !varSearch || v.label.toLowerCase().includes(varSearch.toLowerCase()) || v.key.toLowerCase().includes(varSearch.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        style={{
          width: "95vw",
          maxWidth: 1400,
          maxHeight: "95vh",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#F8FAFC",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: 52,
          background: "#fff", borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
        }}>
          {/* Left: template meta inputs */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template Name"
              style={{
                padding: "5px 10px", fontSize: 12, fontWeight: 600,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 160, color: "#0F172A", background: "#F8FAFC",
              }}
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line"
              style={{
                padding: "5px 10px", fontSize: 12,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 200, color: "#0F172A", background: "#F8FAFC",
              }}
            />
            <input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Pre-header text"
              style={{
                padding: "5px 10px", fontSize: 12,
                border: "1px solid #E5E7EB", borderRadius: 8,
                outline: "none", width: 200, color: "#0F172A", background: "#F8FAFC",
              }}
            />
          </div>

          {/* Center: device toggle */}
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 8, padding: 3, gap: 3 }}>
            {[
              { id: "desktop", Icon: Monitor },
              { id: "mobile",  Icon: Smartphone },
            ].map(({ id, Icon }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                  background: viewMode === id ? "#fff" : "transparent",
                  color: viewMode === id ? EMAIL_BLUE : "#64748B",
                  fontWeight: viewMode === id ? 700 : 500,
                  fontSize: 12,
                  boxShadow: viewMode === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <Icon size={13} />
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </button>
            ))}
          </div>

          {/* Right: history + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 12, color: "#64748B", cursor: "pointer" }}>
              <Undo2 size={13} /> Undo
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 12, color: "#64748B", cursor: "pointer" }}>
              <Redo2 size={13} /> Redo
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 12, color: "#64748B", cursor: "pointer" }}>
              <Eye size={13} /> Preview
            </button>
            <button
              onClick={handleSave}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", border: "none", borderRadius: 8, background: EMAIL_BLUE, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              <Save size={13} /> Save Template
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
          {/* ─ Left sidebar ─ */}
          <div style={{
            width: 280, background: "#fff", borderRight: "1px solid #E5E7EB",
            display: "flex", flexDirection: "column", flexShrink: 0,
          }}>
            {/* Sidebar tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
              {["content", "rows", "variables", "settings"].map((tab) => (
                <SideTab key={tab} active={sideTab === tab} onClick={() => setSideTab(tab)}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </SideTab>
              ))}
            </div>

            <div style={{ flex: 1, overflow: "y-auto", overflowY: "auto" }}>
              {/* CONTENT tab */}
              {sideTab === "content" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Drag blocks into the email
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {EDITOR_CONTENT_BLOCKS.map((block) => (
                      <ContentBlockChip key={block.type} block={block} />
                    ))}
                  </div>
                </div>
              )}

              {/* ROWS tab */}
              {sideTab === "rows" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                    Choose a column layout
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {EDITOR_ROW_LAYOUTS.map((layout) => (
                      <div key={layout.id}>
                        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>{layout.label}</div>
                        <RowLayout layout={layout} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VARIABLES tab */}
              {sideTab === "variables" && (
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                    Insert Personalization
                  </div>
                  <input
                    value={varSearch}
                    onChange={(e) => setVarSearch(e.target.value)}
                    placeholder="Search variables…"
                    style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", marginBottom: 12, boxSizing: "border-box" }}
                  />
                  {Object.entries(SYSTEM_VARIABLES).map(([group, vars]) => {
                    const filtered = vars.filter((v) => !varSearch || v.label.toLowerCase().includes(varSearch.toLowerCase()) || v.key.toLowerCase().includes(varSearch.toLowerCase()));
                    if (!filtered.length) return null;
                    return (
                      <div key={group} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{group}</div>
                        {filtered.map((v) => (
                          <div
                            key={v.key}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, marginBottom: 3, cursor: "pointer", background: "#F8FAFC" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#EFF6FF"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
                          >
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v.label}</div>
                              <div style={{ fontSize: 10, color: "#94A3B8" }}>{v.example}</div>
                            </div>
                            <code style={{ fontSize: 10, background: "#EEF2FF", color: "#4F46E5", padding: "2px 6px", borderRadius: 4 }}>
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
                  <SettingsSection label="Email Background" defaultOpen>
                    <SettingRow label="Background color">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div
                          style={{ width: 24, height: 24, borderRadius: 5, background: bgColor, border: "1px solid #E5E7EB", cursor: "pointer" }}
                        />
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
                          id="bg-color-input"
                        />
                        <label htmlFor="bg-color-input" style={{ fontSize: 12, color: "#64748B", cursor: "pointer" }}>
                          {bgColor}
                        </label>
                      </div>
                    </SettingRow>
                  </SettingsSection>

                  <SettingsSection label="Email Width" defaultOpen>
                    <FontSelect
                      label="Max width"
                      value={emailWidth}
                      onChange={setEmailWidth}
                      options={[
                        { value: "500", label: "500px" },
                        { value: "600", label: "600px (Default)" },
                        { value: "700", label: "700px" },
                        { value: "800", label: "800px" },
                      ]}
                    />
                  </SettingsSection>

                  <SettingsSection label="Typography">
                    <FontSelect
                      label="Font family"
                      value="inter"
                      onChange={() => {}}
                      options={[
                        { value: "inter",   label: "Inter" },
                        { value: "arial",   label: "Arial" },
                        { value: "georgia", label: "Georgia" },
                        { value: "verdana", label: "Verdana" },
                      ]}
                    />
                    <FontSelect
                      label="Base font size"
                      value="14"
                      onChange={() => {}}
                      options={["12","13","14","16","18"].map((v) => ({ value: v, label: `${v}px` }))}
                    />
                  </SettingsSection>

                  <SettingsSection label="Link Colors">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <ColorSwatch color={EMAIL_BLUE} label="Link color" />
                      <ColorSwatch color="#1D4ED8" label="Visited color" />
                    </div>
                  </SettingsSection>
                </div>
              )}
            </div>
          </div>

          {/* ─ Email canvas (main area) ─ */}
          <div
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", overflow: "auto",
              background: "#E2E8F0", padding: "32px 16px",
            }}
          >
            {/* Canvas header */}
            <div style={{ width: previewWidth, marginBottom: 8, transition: "width 0.25s" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 6 }}>
                {viewMode === "mobile" ? "📱 Mobile Preview" : "🖥 Desktop Preview"} — {previewWidth}px
              </div>
            </div>

            {/* Email wrapper */}
            <div
              style={{
                width: previewWidth, background: bgColor,
                borderRadius: 8, overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                transition: "width 0.25s",
              }}
            >
              {/* Email header bar */}
              <div style={{ background: "#fff", padding: "16px 24px", borderBottom: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>Subject</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                  {subject || "Your Email Subject"}
                </div>
                {previewText && (
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{previewText}</div>
                )}
              </div>

              {/* Email body */}
              <div style={{ padding: "8px 0" }}>
                {blocks.map((block, i) => (
                  <EmailCanvasBlock
                    key={i}
                    block={block}
                    index={i}
                    total={blocks.length}
                    onDelete={deleteBlock}
                  />
                ))}

                {/* Add block button */}
                <div style={{ padding: "12px 24px" }}>
                  <button
                    onClick={() => addBlock("text")}
                    style={{
                      width: "100%", padding: "10px", border: "2px dashed #BFDBFE",
                      borderRadius: 8, background: "#EFF6FF", cursor: "pointer",
                      fontSize: 12, color: "#3B82F6", fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                  >
                    <Plus size={14} /> Add Block
                  </button>
                </div>
              </div>

              {/* Email footer */}
              <div style={{ background: "#F8FAFC", borderTop: "1px solid #E5E7EB", padding: "16px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>
                  You're receiving this because you opted in at <strong>store.com</strong>.
                </div>
                <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 6, cursor: "pointer" }}>
                  Unsubscribe · View in browser · Privacy Policy
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
