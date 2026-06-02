import React, { useState, useRef, useCallback } from "react";
import { X, Bold, Italic, Upload, Smile, Eye, Plus, Trash2, FileText, Image, Video, FileIcon } from "lucide-react";
import { SYSTEM_VARIABLES } from "./data/mockTemplates";

const PRIMARY = "#6C3AE8";
const BORDER  = "#E5E7EB";
const WA_GREEN = "#25D366";

// ── Helpers ────────────────────────────────────────────────────
function extractVariables(body) {
  const matches = [...body.matchAll(/\{\{(\$\d+|[^}]+)\}\}/g)];
  const seen = new Set();
  return matches.map((m) => m[1]).filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

function countVariables(body) {
  return new Set([...body.matchAll(/\{\{[^}]+\}\}/g)].map((m) => m[0])).size;
}

const MAX_VARS = 10;
const BTN_MAX  = 20;

// ── Header type selector ───────────────────────────────────────
const HEADER_TYPES = [
  { id: "none",     label: "None",     icon: null },
  { id: "text",     label: "Text",     icon: FileText },
  { id: "image",    label: "Image",    icon: Image },
  { id: "video",    label: "Video",    icon: Video },
  { id: "document", label: "Document", icon: FileIcon },
];

function HeaderSelector({ headerType, headerText, onTypeChange, onTextChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
        Header <span style={{ fontSize: 10, color: "#94A3B8", fontWeight: 400 }}>(optional · only one type allowed)</span>
      </label>

      {/* Type chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {HEADER_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTypeChange(id)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${headerType === id ? PRIMARY : BORDER}`,
              background: headerType === id ? "#F5F3FF" : "#fff",
              color: headerType === id ? PRIMARY : "#64748B",
              fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
            }}
          >
            {Icon && <Icon size={12} />}
            {label}
          </button>
        ))}
      </div>

      {/* Header content input */}
      {headerType === "text" && (
        <div style={{ position: "relative" }}>
          <input
            value={headerText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Enter header text (e.g. Your Order is Ready!)"
            maxLength={60}
            style={{ width: "100%", padding: "9px 50px 9px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 10, fontSize: 13, outline: "none", color: "#0F172A" }}
          />
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>
            {headerText.length}/60
          </span>
        </div>
      )}
      {(headerType === "image" || headerType === "video" || headerType === "document") && (
        <div style={{
          border: `2px dashed ${BORDER}`, borderRadius: 10, padding: "20px",
          textAlign: "center", cursor: "pointer", background: "#F8FAFC",
          transition: "border-color 0.15s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = PRIMARY}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}
          onClick={() => alert(`${headerType} upload coming soon — integrate with your media library`)}
        >
          <Upload size={20} style={{ color: "#94A3B8", margin: "0 auto 6px", display: "block" }} />
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>
            Click to upload {headerType}
          </div>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
            {headerType === "image" ? "JPG, PNG — max 5 MB" :
             headerType === "video" ? "MP4 — max 16 MB" :
             "PDF, DOCX — max 100 MB"}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Variable picker dropdown (inline) ─────────────────────────
function VarValueSelect({ value, onChange }) {
  const allOpts = Object.entries(SYSTEM_VARIABLES).flatMap(([group, vars]) =>
    vars.map((v) => ({ group, ...v }))
  );
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: "none",
        background: "transparent", outline: "none", cursor: "pointer", color: "#0F172A",
        appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
      }}
    >
      <option value="">Select value…</option>
      {Object.entries(SYSTEM_VARIABLES).map(([group, vars]) => (
        <optgroup key={group} label={group}>
          {vars.map((v) => (
            <option key={v.key} value={v.key}>{v.label}</option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

// ── Main TemplateEditor ────────────────────────────────────────
export default function TemplateEditor({ template, onSave, onClose }) {
  const [headerType, setHeaderType] = useState(template?.header?.type || "none");
  const [headerText, setHeaderText] = useState(template?.header?.type === "text" ? template.header.text : "");
  const [body,       setBody]       = useState(template?.body || "");
  const [footer,     setFooter]     = useState(template?.footer || "");
  const [buttons,    setButtons]    = useState(template?.buttons ? template.buttons.map((b) => ({ ...b })) : []);
  const [varMap,     setVarMap]     = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const bodyRef = useRef(null);

  const vars     = extractVariables(body);
  const varCount = countVariables(body);

  // Insert a positional variable at cursor
  const insertVariable = useCallback(() => {
    if (varCount >= MAX_VARS) return;
    const nextIdx = vars.filter((v) => /^\$\d+$/.test(v)).length + 1;
    const token   = `{{$${nextIdx}}}`;
    const el = bodyRef.current;
    if (el) {
      const start = el.selectionStart;
      const end   = el.selectionEnd;
      const next  = body.slice(0, start) + token + body.slice(end);
      setBody(next);
      setTimeout(() => { el.selectionStart = el.selectionEnd = start + token.length; el.focus(); }, 0);
    } else {
      setBody((b) => b + token);
    }
  }, [body, varCount, vars]);

  // Wrap selection with markdown marker
  const wrapSelection = useCallback((marker) => {
    const el = bodyRef.current;
    if (!el) return;
    const start  = el.selectionStart;
    const end    = el.selectionEnd;
    const sel    = body.slice(start, end);
    const next   = body.slice(0, start) + marker + sel + marker + body.slice(end);
    setBody(next);
    setTimeout(() => { el.selectionStart = start + marker.length; el.selectionEnd = end + marker.length; el.focus(); }, 0);
  }, [body]);

  // Render body with highlights (for preview tooltip)
  function renderBodyHighlighted(text) {
    return text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g).map((part, i) => {
      if (part === "\n") return <br key={i} />;
      if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1,-1)}</strong>;
      if (/^_[^_]+_$/.test(part))   return <em key={i}>{part.slice(1,-1)}</em>;
      if (/^{{[^}]+}}$/.test(part)) return (
        <span key={i} style={{ background: "#EEF2FF", color: PRIMARY, padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 12 }}>{part}</span>
      );
      return part;
    });
  }

  const handleSave = () => {
    const updated = {
      ...template,
      header: headerType === "none" ? { type: "none" }
             : headerType === "text" ? { type: "text", text: headerText }
             : { type: headerType, url: null, bg: template?.header?.bg || "#1a1a2e" },
      body,
      footer,
      buttons,
      variables: vars,
    };
    onSave(updated);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "min(92vw, 520px)", maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 0 0 2px #A78BFA, 0 20px 60px rgba(0,0,0,0.2)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Customize Template
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setShowPreview((v) => !v)}
              style={{ fontSize: 12, color: PRIMARY, background: showPreview ? "#F5F3FF" : "#fff", border: `1px solid ${showPreview ? PRIMARY : BORDER}`, padding: "4px 12px", borderRadius: 20, cursor: "pointer", fontWeight: 500 }}
            >
              {showPreview ? "Hide Preview" : "Preview"}
            </button>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} style={{ color: "#64748B" }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          <div style={{ display: showPreview ? "grid" : "block", gridTemplateColumns: showPreview ? "1fr 1fr" : undefined, gap: 16 }}>

            {/* ── Left: edit form ── */}
            <div>
              {/* Header section */}
              <HeaderSelector
                headerType={headerType}
                headerText={headerText}
                onTypeChange={setHeaderType}
                onTextChange={setHeaderText}
              />

              {/* Autoresponse / Body */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                  Autoresponse by Seller <span style={{ color: "#EF4444" }}>*</span>
                </label>

                <div style={{ border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s" }}
                  onFocusCapture={(e) => e.currentTarget.style.borderColor = PRIMARY}
                  onBlurCapture={(e) => e.currentTarget.style.borderColor = BORDER}
                >
                  <textarea
                    ref={bodyRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Hello,&#10;Here are your {{$1}} order details-&#10;Your order ID is {{$2}} and total amount is {{$3}} ({{$4}}).&#10;Delivery Address: {{$5}}"
                    rows={6}
                    style={{
                      width: "100%", padding: "12px", fontSize: 13, border: "none", outline: "none",
                      resize: "none", color: PRIMARY, lineHeight: 1.6, fontFamily: "inherit",
                    }}
                  />

                  {/* Toolbar */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 2, padding: "6px 10px",
                    borderTop: `1px solid ${BORDER}`, background: "#F8FAFC",
                  }}>
                    <button
                      type="button"
                      onClick={insertVariable}
                      disabled={varCount >= MAX_VARS}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "4px 10px", border: `1px solid ${BORDER}`, borderRadius: 20,
                        background: varCount >= MAX_VARS ? "#F1F5F9" : "#fff",
                        color: varCount >= MAX_VARS ? "#94A3B8" : PRIMARY,
                        fontSize: 11, fontWeight: 600, cursor: varCount >= MAX_VARS ? "not-allowed" : "pointer",
                        marginRight: 4,
                      }}
                    >
                      <Plus size={10} />
                      Add Variable ({varCount}/{MAX_VARS})
                    </button>

                    {[
                      { icon: <Bold size={13} />,   title: "Bold (*text*)",   action: () => wrapSelection("*") },
                      { icon: <Italic size={13} />, title: "Italic (_text_)", action: () => wrapSelection("_") },
                      { icon: <Upload size={13} />, title: "Attach media",    action: () => alert("Media attachment — coming soon") },
                      { icon: <Smile size={13} />,  title: "Emoji",           action: () => alert("Emoji picker — coming soon") },
                      { icon: <Eye size={13} />,    title: "Toggle preview",  action: () => setShowPreview((v) => !v) },
                    ].map(({ icon, title, action }, i) => (
                      <button
                        key={i}
                        type="button"
                        title={title}
                        onClick={action}
                        style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#E2E8F0"; e.currentTarget.style.color = "#0F172A"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variable mapping table */}
              {vars.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <table style={{ width: "100%", border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", borderCollapse: "separate", borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: `1px solid ${BORDER}`, width: "30%" }}>
                          Variable <span style={{ color: "#EF4444" }}>*</span>
                        </th>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#374151", borderBottom: `1px solid ${BORDER}` }}>
                          Value <span style={{ color: "#EF4444" }}>*</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vars.map((v, i) => (
                        <tr key={v} style={{ borderBottom: i < vars.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                          <td style={{ padding: "8px 14px", borderRight: `1px solid ${BORDER}` }}>
                            <span style={{ fontFamily: "monospace", fontSize: 13, color: "#374151" }}>
                              {`{{${v}}}`}
                            </span>
                          </td>
                          <td style={{ padding: "0" }}>
                            <VarValueSelect
                              value={varMap[v]}
                              onChange={(val) => setVarMap((m) => ({ ...m, [v]: val }))}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Footer */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                  Footer
                </label>
                <input
                  value={footer}
                  onChange={(e) => setFooter(e.target.value)}
                  placeholder="Enter footer text"
                  maxLength={200}
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 13,
                    border: `1.5px solid ${BORDER}`, borderRadius: 10, outline: "none", color: "#0F172A",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = PRIMARY}
                  onBlur={(e) => e.target.style.borderColor = BORDER}
                />
              </div>

              {/* Buttons */}
              {buttons.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                    Buttons
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {buttons.map((btn, i) => (
                      <div key={i} style={{ position: "relative" }}>
                        <input
                          value={btn.label}
                          onChange={(e) => {
                            const next = [...buttons];
                            next[i] = { ...btn, label: e.target.value.slice(0, BTN_MAX) };
                            setButtons(next);
                          }}
                          maxLength={BTN_MAX}
                          style={{
                            width: "100%", padding: "10px 50px 10px 14px", fontSize: 13,
                            border: `1.5px solid ${BORDER}`, borderRadius: 10, outline: "none", color: "#64748B",
                            transition: "border-color 0.15s",
                          }}
                          onFocus={(e) => e.target.style.borderColor = PRIMARY}
                          onBlur={(e) => e.target.style.borderColor = BORDER}
                        />
                        <span style={{ position: "absolute", right: 36, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#94A3B8" }}>
                          {btn.label.length}/{BTN_MAX}
                        </span>
                        <button
                          type="button"
                          onClick={() => setButtons(buttons.filter((_, j) => j !== i))}
                          style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#CBD5E1", padding: 4 }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                          onMouseLeave={(e) => e.currentTarget.style.color = "#CBD5E1"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {buttons.length < 3 && (
                    <button
                      type="button"
                      onClick={() => setButtons([...buttons, { type: "QUICK_REPLY", label: "" }])}
                      style={{
                        marginTop: 8, width: "100%", padding: "8px", border: `1.5px dashed ${BORDER}`,
                        borderRadius: 10, background: "transparent", fontSize: 12, color: "#94A3B8",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#94A3B8"; }}
                    >
                      + Add button
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── Right: live preview ── */}
            {showPreview && (
              <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  Live Preview
                </div>
                <div style={{ background: "#E5DDD5", borderRadius: 10, padding: 10 }}>
                  <div style={{ background: "#fff", borderRadius: "10px 10px 10px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", overflow: "hidden" }}>
                    {(headerType === "image" || headerType === "video") && (
                      <div style={{ height: 90, background: "#CBD5E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "#94A3B8", fontSize: 11 }}>{headerType === "video" ? "▶ Video" : "🖼 Image"}</span>
                      </div>
                    )}
                    {headerType === "text" && headerText && (
                      <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>{headerText}</div>
                    )}
                    <div style={{ padding: "8px 12px", fontSize: 12, color: "#111", lineHeight: 1.6 }}>
                      {renderBodyHighlighted(body || "Your message body will appear here…")}
                    </div>
                    {footer && <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{footer}</div>}
                    <div style={{ textAlign: "right", padding: "0 12px 8px", fontSize: 10, color: "#aaa" }}>16:48 ✓✓</div>
                    {buttons.length > 0 && (
                      <div style={{ borderTop: "1px solid #f0f0f0" }}>
                        {buttons.map((btn, i) => (
                          <div key={i} style={{ padding: "9px 12px", borderBottom: i < buttons.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 13, color: "#0a8fc4", textAlign: "center", fontWeight: 500 }}>
                            {btn.label || `Button ${i + 1}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer buttons */}
        <div style={{ display: "flex", gap: 10, padding: "14px 20px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "12px", border: `2px solid #0F172A`, borderRadius: 10,
              background: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#0F172A",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              flex: 1, padding: "12px", border: "none", borderRadius: 10,
              background: PRIMARY, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.88"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            Update Template
          </button>
        </div>
      </div>
    </div>
  );
}
