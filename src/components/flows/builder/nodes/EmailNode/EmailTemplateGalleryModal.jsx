import React, { useState } from "react";
import { X, Search, Image as ImageIcon } from "lucide-react";

const EMAIL_BLUE = "#3B82F6";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

function BlockPreview({ block }) {
  if (block.type === "image") {
    return (
      <div style={{ height: 22, borderRadius: 4, background: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ImageIcon size={12} color={MUTED} />
      </div>
    );
  }
  if (block.type === "button") {
    return (
      <div style={{ alignSelf: "flex-start", padding: "3px 10px", borderRadius: 4, background: EMAIL_BLUE, fontSize: 8, color: "#fff", fontWeight: 700 }}>
        {block.label || "Button"}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ height: 5, width: "85%", borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
      <div style={{ height: 5, width: "55%", borderRadius: 3, background: "rgba(255,255,255,0.7)" }} />
    </div>
  );
}

function EmailTemplateCard({ template, onSelect }) {
  const previewBlocks = (template.blocks || []).slice(0, 3);
  return (
    <div
      onClick={onSelect}
      style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", background: "#fff", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = EMAIL_BLUE)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ height: 92, background: template.thumbnailColor, padding: 10, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
        {previewBlocks.map((block, i) => <BlockPreview key={i} block={block} />)}
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{template.name}</span>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: template.status === "Active" ? "#ECFDF5" : "#F1F5F9", color: template.status === "Active" ? "#065F46" : "#6B7280", fontWeight: 600, flexShrink: 0 }}>
            {template.status}
          </span>
        </div>
        <div style={{ fontSize: 10, color: MUTED }}>{template.category}</div>
      </div>
    </div>
  );
}

export default function EmailTemplateGalleryModal({ open, templates, onSelect, onCreateNew, onClose }) {
  const [search, setSearch] = useState("");

  if (!open) return null;

  const filtered = (templates || []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 900px)", maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select Email Template</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button type="button" onClick={onCreateNew} style={{ padding: "8px 16px", background: EMAIL_BLUE, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Create new
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No templates found</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {filtered.map((t) => <EmailTemplateCard key={t.id} template={t} onSelect={() => onSelect(t)} />)}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: MUTED }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</span>
          <button onClick={onClose} style={{ padding: "7px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
