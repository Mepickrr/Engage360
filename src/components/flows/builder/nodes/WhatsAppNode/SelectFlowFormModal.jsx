import React, { useState } from "react";
import { X, Search, Eye } from "lucide-react";
import { PRIMARY, BORDER, MUTED } from "./FormFields";

export default function SelectFlowFormModal({ forms, onCancel, onSelect, onPreview }) {
  const [search, setSearch] = useState("");
  const filtered = forms.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 640px)", maxHeight: "80vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select an existing flow form</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED }}><X size={18} /></button>
        </div>

        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flow forms…"
              style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No flow forms found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{f.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {f.screens.length} screen{f.screens.length !== 1 ? "s" : ""} · Updated {f.updatedAt}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onPreview(f)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
                  ><Eye size={13} /> Preview</button>
                  <button
                    type="button"
                    onClick={() => onSelect(f)}
                    style={{ fontSize: 12, fontWeight: 600, color: "#fff", background: PRIMARY, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
                  >Select</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
