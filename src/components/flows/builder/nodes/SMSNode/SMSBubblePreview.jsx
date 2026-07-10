import React from "react";
import { SYSTEM_VARIABLES } from "./data/mockData";

const MUTED = "#94A3B8";

const ALL_SYSTEM_VARS = Object.values(SYSTEM_VARIABLES).flat();

function substituteVars(body, variableMap = {}) {
  if (!body) return "";
  return body.replace(/\{\{([^}]+)\}\}/g, (match, token) => {
    const mapped = variableMap[token];
    const key = Array.isArray(mapped) ? mapped.find(Boolean) : mapped;
    const found = key && ALL_SYSTEM_VARS.find((v) => v.key === key);
    return found ? found.example : match;
  });
}

export default function SMSBubblePreview({ draft }) {
  const text = substituteVars(draft?.body, draft?.variableMap);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        SMS Preview
      </div>
      <div style={{ background: "#F1F5F9", borderRadius: 14, padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: "14px 14px 14px 4px", boxShadow: "0 1px 3px rgba(0,0,0,0.12)", padding: "10px 12px", fontSize: 13, color: "#0F172A", lineHeight: 1.6 }}>
          {text || <span style={{ color: MUTED, fontStyle: "italic" }}>Your message will appear here…</span>}
        </div>
      </div>
    </div>
  );
}
