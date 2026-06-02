import React, { useState } from "react";
import { X, Search, Plus } from "lucide-react";
import { MOCK_TEMPLATES } from "./data/mockTemplates";

const WA_GREEN = "#25D366";
const PRIMARY   = "#6C3AE8";

function TemplateCard({ template, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: 12, border: `1px solid ${hovered ? WA_GREEN : "#E5E7EB"}`,
        overflow: "hidden", background: "#fff", cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? "0 4px 16px rgba(37,211,102,0.15)" : "none",
      }}
    >
      {/* Header media */}
      {template.header.type === "image" && (
        <div style={{ height: 108, background: template.header.bg || WA_GREEN, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28 }}>🖼</span>
        </div>
      )}
      {template.header.type === "video" && (
        <div style={{ height: 108, background: template.header.bg || "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", marginLeft: 2 }}>▶</span>
          </div>
        </div>
      )}
      {(template.header.type === "text" || template.header.type === "none") && (
        <div style={{ height: 54, background: "#F8FAFC", display: "flex", alignItems: "center", padding: "0 12px" }}>
          <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
            {template.header.type === "text" ? template.header.text : "Text only"}
          </span>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: "10px 12px 4px" }}>
        <p style={{
          fontSize: 12, color: "#374151", lineHeight: 1.5, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {template.body.replace(/\*/g, "").replace(/_/g, "").replace(/{{[^}]+}}/g, "·")}
        </p>
      </div>

      {/* Footer: name + badges */}
      <div style={{ padding: "6px 12px 10px", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: WA_GREEN }}>✓</span>
        <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {template.name}
        </span>
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 8, fontWeight: 600,
          background: template.type === "Marketing" ? "#F3E8FF" : "#EFF6FF",
          color:      template.type === "Marketing" ? "#7C3AED" : "#2563EB",
        }}>
          {template.type}
        </span>
        <span style={{
          fontSize: 9, padding: "1px 5px", borderRadius: 8, fontWeight: 600,
          background: template.status === "Active" ? "#ECFDF5" : "#FFFBEB",
          color:      template.status === "Active" ? "#065F46" : "#92400E",
        }}>
          {template.status}
        </span>
      </div>

      {/* Hover overlay */}
      {hovered && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        }}>
          <button
            style={{ padding: "7px 16px", background: "#fff", color: "#111", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); alert(`Edit ${template.name}`); }}
          >
            Edit
          </button>
          <button
            style={{ padding: "7px 16px", background: WA_GREEN, color: "#fff", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            onClick={(e) => { e.stopPropagation(); onSelect(template); }}
          >
            Select
          </button>
        </div>
      )}
    </div>
  );
}

export default function TemplatePicker({ onSelect, onClose }) {
  const [search, setSearch]     = useState("");
  const [typeFilter, setType]   = useState("All");
  const [statusFilter, setStatus] = useState("All");

  const filtered = MOCK_TEMPLATES.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.name.toLowerCase().includes(q) || t.body.toLowerCase().includes(q);
    const matchType   = typeFilter   === "All" || t.type   === typeFilter;
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, width: "min(92vw, 860px)", maxHeight: "88vh",
        display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Select a template message
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* Search + filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: "1px solid #E5E7EB", flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, outline: "none" }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: "8px 28px 8px 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", outline: "none", appearance: "none" }}
          >
            {["All", "Marketing", "Utility", "Conversational"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: "8px 28px 8px 10px", fontSize: 13, border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", cursor: "pointer", outline: "none", appearance: "none" }}
          >
            {["All", "Active", "In Review", "Inactive"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <button
            style={{ padding: "8px 16px", background: PRIMARY, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => alert("Template builder coming soon")}
          >
            <Plus size={13} /> Create new
          </button>
        </div>

        {/* Template grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94A3B8", padding: "40px 0", fontSize: 13 }}>
              No templates found
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {filtered.map((t) => (
                <TemplateCard key={t.id} template={t} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #E5E7EB", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {filtered.length} template{filtered.length !== 1 ? "s" : ""} found
          </span>
          <button onClick={onClose} style={{ padding: "7px 18px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
