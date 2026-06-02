import React from "react";

const WA_GREEN = "#25D366";

function renderBody(text, variableMap = {}) {
  const parts = text.split(/(\*[^*\n]+\*|_[^_\n]+_|{{[^}]+}}|\n)/g);
  return parts.map((part, i) => {
    if (part === "\n") return <br key={i} />;
    if (/^\*[^*]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_]+_$/.test(part))   return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^{{[^}]+}}$/.test(part)) {
      const varKey = part.slice(2, -2);
      const mapped = variableMap[varKey];
      return (
        <span
          key={i}
          style={{ background: "#EEF2FF", color: "#6C3AE8", padding: "0 3px", borderRadius: 3, fontFamily: "monospace", fontSize: 11 }}
        >
          {mapped ? `{{${mapped}}}` : part}
        </span>
      );
    }
    return part;
  });
}

export default function TemplatePreview({ template, variableMap = {} }) {
  if (!template) return null;

  return (
    <div style={{ background: "#E5DDD5", borderRadius: 10, padding: 10 }}>
      <div style={{ background: "#fff", borderRadius: "10px 10px 10px 4px", maxWidth: 300, boxShadow: "0 1px 3px rgba(0,0,0,0.12)", overflow: "hidden" }}>

        {/* Header */}
        {template.header.type === "image" && (
          <div style={{
            height: 130, display: "flex", alignItems: "center", justifyContent: "center",
            background: template.header.bg || WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 500,
          }}>
            <div style={{ textAlign: "center", opacity: 0.85 }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>🖼</div>
              <div style={{ fontSize: 11 }}>Image Header</div>
            </div>
          </div>
        )}
        {template.header.type === "video" && (
          <div style={{
            height: 130, display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", background: template.header.bg || "#1a1a2e",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 18, marginLeft: 3 }}>▶</span>
            </div>
            <span style={{ position: "absolute", bottom: 8, left: 10, fontSize: 10, color: "rgba(255,255,255,0.7)" }}>0:00</span>
          </div>
        )}
        {template.header.type === "text" && (
          <div style={{ padding: "10px 12px 0", fontWeight: 600, fontSize: 13, color: "#111" }}>
            {template.header.text}
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "8px 12px", fontSize: 13, color: "#111", lineHeight: 1.55 }}>
          {renderBody(template.body, variableMap)}
        </div>

        {/* Footer */}
        {template.footer && (
          <div style={{ padding: "0 12px 6px", fontSize: 11, color: "#aaa" }}>{template.footer}</div>
        )}

        {/* Timestamp */}
        <div style={{ textAlign: "right", padding: "0 12px 8px", fontSize: 10, color: "#aaa" }}>
          16:48 ✓✓
        </div>

        {/* Buttons */}
        {template.buttons?.length > 0 && (
          <div style={{ borderTop: "1px solid #f0f0f0" }}>
            {template.buttons.map((btn, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "10px 12px", borderBottom: i < template.buttons.length - 1 ? "1px solid #f0f0f0" : "none",
                  fontSize: 13, color: "#0a8fc4", fontWeight: 500, cursor: "pointer",
                }}
              >
                {btn.type === "URL" && <span style={{ marginRight: 6, fontSize: 11 }}>↗</span>}
                {btn.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template meta */}
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#25D366", fontWeight: 600 }}>✓</span>
        <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>{template.name}</span>
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 500,
          background: template.type === "Marketing" ? "#F3E8FF" : template.type === "Utility" ? "#EFF6FF" : "#F0FDF4",
          color:      template.type === "Marketing" ? "#7C3AED" : template.type === "Utility" ? "#2563EB" : "#16A34A",
        }}>
          {template.type}
        </span>
        <span style={{
          fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 500,
          background: template.status === "Active" ? "#ECFDF5" : template.status === "In Review" ? "#FFFBEB" : "#FEF2F2",
          color:      template.status === "Active" ? "#065F46" : template.status === "In Review" ? "#92400E" : "#991B1B",
        }}>
          {template.status}
        </span>
      </div>
    </div>
  );
}
