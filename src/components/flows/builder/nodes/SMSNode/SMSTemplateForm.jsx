import React from "react";
import { Sparkles, Link } from "lucide-react";
import { SYSTEM_VARIABLES } from "./data/mockData";

const SMS_PURPLE = "#6366F1";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function extractVars(body) {
  const seen = new Set();
  return [...(body || "").matchAll(/\{\{([^}]+)\}\}/g)]
    .map((m) => m[1])
    .filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

function charCount(text) {
  const len = (text || "").length;
  const msgs = Math.ceil(len / 160) || 1;
  return { len, msgs };
}

export default function SMSTemplateForm({ draft, patch }) {
  const vars = extractVars(draft.body);
  const { len, msgs } = charCount(draft.body);

  const insertVar = () => {
    const next  = vars.length + 1;
    const token = `{{$${next}}}`;
    patch({ body: (draft.body || "") + token });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <div>
        <Label>Template Name</Label>
        <input
          value={draft.name || ""}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. cart_recovery_v1"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div>
        <Label>Approved Template ID</Label>
        <input
          value={draft.approvedTemplateId || ""}
          onChange={(e) => patch({ approvedTemplateId: e.target.value })}
          placeholder="e.g. 1707177711975941111"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
        />
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Text Message</Label>
          <button
            type="button"
            onClick={insertVar}
            style={{ fontSize: 10, color: SMS_PURPLE, fontWeight: 600, background: "none", border: `1px solid ${SMS_PURPLE}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer" }}
          >
            + Add Variables
          </button>
        </div>
        <textarea
          value={draft.body || ""}
          onChange={(e) => patch({ body: e.target.value })}
          placeholder="Hey {{$1}}, your order is almost done…"
          rows={5}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit", boxSizing: "border-box" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 11, color: MUTED }}>
            {`Characters: ${len}/160 (No. of SMS to be sent: ${msgs})`}
          </span>
        </div>
      </div>

      {vars.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Label>Variable Mapping</Label>
            <span style={{ fontSize: 10, color: MUTED }}>First non-empty value is used</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {vars.map((v) => {
              const rawVal  = (draft.variableMap || {})[v];
              const chain   = Array.isArray(rawVal) ? rawVal : rawVal ? [rawVal] : [""];
              const updateChain = (newChain) =>
                patch({ variableMap: { ...(draft.variableMap || {}), [v]: newChain } });

              return (
                <div key={v} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ padding: "6px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: SMS_PURPLE }}>{`{{${v}}}`}</span>
                    <span style={{ fontSize: 10, color: MUTED }}>OR chain</span>
                  </div>
                  {chain.map((entry, idx) => (
                    <div key={idx}>
                      {idx > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: MUTED, padding: "1px 6px", borderRadius: 10, background: "#F1F5F9", letterSpacing: 1 }}>OR</span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <select
                          value={entry || ""}
                          onChange={(e) => { const c = [...chain]; c[idx] = e.target.value; updateChain(c); }}
                          style={{ flex: 1, padding: "7px 8px", fontSize: 12, border: "none", background: "transparent", outline: "none", cursor: "pointer", minWidth: 0 }}
                        >
                          <option value="">Select attribute…</option>
                          {Object.entries(SYSTEM_VARIABLES).map(([group, svars]) => (
                            <optgroup key={group} label={group}>
                              {svars.map((sv) => <option key={sv.key} value={sv.key}>{`${sv.label} · ${sv.example}`}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {chain.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateChain(chain.filter((_, j) => j !== idx))}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "4px 8px", fontSize: 13, lineHeight: 1 }}
                          >×</button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${BORDER}` }}>
                    <button
                      type="button"
                      onClick={() => updateChain([...chain, ""])}
                      style={{ width: "100%", padding: "6px 10px", background: "transparent", border: "none", cursor: "pointer", fontSize: 11, color: SMS_PURPLE, fontWeight: 600, textAlign: "left" }}
                    >+ Add fallback</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
          <Label>Shorten URL</Label>
          <Link size={11} color={MUTED} style={{ marginTop: -6 }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={draft.shortenUrl || ""}
            onChange={(e) => patch({ shortenUrl: e.target.value })}
            placeholder="Example https://app-engage.shiprocket.in"
            style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", color: "#64748B" }}
          />
          <button
            type="button"
            onClick={() => alert("Shorten URL — coming soon")}
            style={{ padding: "7px 12px", fontSize: 12, fontWeight: 500, background: "#F1F5F9", color: "#64748B", border: `1px solid ${BORDER}`, borderRadius: 8, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            Shorten URL
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => alert("AI Enhance: generates Friendly / Persuasive / Urgent tone variants — coming soon")}
        style={{ width: "100%", padding: "9px", border: `1px solid ${SMS_PURPLE}`, borderRadius: 8, background: "#EEF2FF", color: SMS_PURPLE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
      >
        <Sparkles size={13} />
        AI Enhance — Generate tone variants
      </button>
    </div>
  );
}
