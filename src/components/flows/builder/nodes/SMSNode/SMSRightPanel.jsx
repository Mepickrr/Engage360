import React, { useState } from "react";
import { MessageSquare, Sparkles, Link } from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  MOCK_SMS_TEMPLATES, SMS_GATEWAYS, SYSTEM_VARIABLES,
  SMS_DELIVERY_OPTIONS, defaultSMSNodeData,
} from "./data/mockData";

const SMS_PURPLE = "#6366F1";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

// ── Shared helpers ──────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? SMS_PURPLE : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

// ── Extract {{$1}}, {{$2}} etc. from body ───────────────────────
function extractVars(body) {
  const seen = new Set();
  return [...(body || "").matchAll(/\{\{([^}]+)\}\}/g)]
    .map((m) => m[1])
    .filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
}

// ── Character / SMS count ───────────────────────────────────────
function charCount(text) {
  const len = (text || "").length;
  const msgs = Math.ceil(len / 160) || 1;
  return { len, msgs };
}

// ── Template Picker overlay ─────────────────────────────────────
function SMSTemplatePicker({ onSelect, onClose }) {
  const [q, setQ] = useState("");
  const filtered = MOCK_SMS_TEMPLATES.filter((t) =>
    t.name.toLowerCase().includes(q.toLowerCase()) ||
    t.approvedTemplateId.includes(q)
  );
  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Select SMS Template</span>
      </div>
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <input
          type="text"
          placeholder="Search by name or template ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: MUTED }}>No templates match</div>
        ) : filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{t.name}</span>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#ECFDF5", color: "#065F46", fontWeight: 600 }}>{t.status}</span>
            </div>
            <div style={{ fontSize: 10, color: MUTED, fontFamily: "monospace", marginBottom: 4 }}>ID: {t.approvedTemplateId}</div>
            <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {t.body}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Inline SMS Template Form ────────────────────────────────────
function InlineSMSTemplateForm({ draft, onChange }) {
  const patch   = (p) => onChange({ ...draft, ...p });
  const vars    = extractVars(draft.body);
  const { len, msgs } = charCount(draft.body);

  const insertVar = () => {
    const next  = vars.length + 1;
    const token = `{{$${next}}}`;
    patch({ body: (draft.body || "") + token });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Template Name */}
      <div>
        <Label>Template Name</Label>
        <input
          value={draft.name || ""}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. cart_recovery_v1"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {/* Approved Template ID */}
      <div>
        <Label>Approved Template ID</Label>
        <input
          value={draft.approvedTemplateId || ""}
          onChange={(e) => patch({ approvedTemplateId: e.target.value })}
          placeholder="e.g. 1707177711975941111"
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box", fontFamily: "monospace" }}
        />
      </div>

      {/* SMS Gateway */}
      <div>
        <Label>Select SMS Gateway</Label>
        <div style={{ position: "relative" }}>
          <select
            value={draft.gateway || ""}
            onChange={(e) => patch({ gateway: e.target.value })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            <option value="">Select gateway…</option>
            {SMS_GATEWAYS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: 12, color: MUTED }}>▾</span>
        </div>
      </div>

      {/* Text Message */}
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
            Characters: {len}/160 (No. of SMS to be sent: {msgs})
          </span>
        </div>
      </div>

      {/* Variable Mapping — OR chain per variable */}
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
                              {svars.map((sv) => <option key={sv.key} value={sv.key}>{sv.label} · {sv.example}</option>)}
                            </optgroup>
                          ))}
                        </select>
                        {chain.length > 1 && (
                          <button
                            type="button"
                            onClick={() => updateChain(chain.filter((_, j) => j !== idx))}
                            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "4px 8px", fontSize: 13, lineHeight: 1 }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"}
                            onMouseLeave={(e) => e.currentTarget.style.color = MUTED}
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
                      onMouseEnter={(e) => e.currentTarget.style.background = "#EEF2FF"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >+ Add fallback</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shorten URL */}
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
            onMouseEnter={(e) => { e.currentTarget.style.background = "#E2E8F0"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          >
            Shorten URL
          </button>
        </div>
      </div>

      {/* AI Enhance */}
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

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [showPicker,   setShowPicker]   = useState(false);
  const [creatingNew,  setCreatingNew]  = useState(false);
  const [newDraft,     setNewDraft]     = useState({ name: "", approvedTemplateId: "", gateway: "", body: "", shortenUrl: "", variableMap: {} });

  const { template } = data;

  const handleTemplateSelect = (tpl) => {
    patch({ template: tpl, variableMap: {} });
    setShowPicker(false);
  };

  const handleCreateSave = () => {
    const tpl = { ...newDraft, id: `sms_new_${Date.now()}`, status: "Draft", lastUpdated: new Date().toISOString().slice(0, 10) };
    patch({ template: tpl, variableMap: newDraft.variableMap || {} });
    setCreatingNew(false);
  };

  if (showPicker) {
    return <SMSTemplatePicker onSelect={handleTemplateSelect} onClose={() => setShowPicker(false)} />;
  }

  if (creatingNew) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
          <button type="button" onClick={() => setCreatingNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Create New Template</span>
        </div>
        <InlineSMSTemplateForm draft={newDraft} onChange={setNewDraft} />
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button type="button" onClick={() => setCreatingNew(false)} style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button
            type="button"
            onClick={handleCreateSave}
            disabled={!newDraft.name || !newDraft.body}
            style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: SMS_PURPLE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (!newDraft.name || !newDraft.body) ? 0.5 : 1 }}
          >
            Save Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Template selection */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Template</Label>
          {template && (
            <button type="button" onClick={() => setCreatingNew(true)} style={{ fontSize: 11, color: SMS_PURPLE, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
              + Create New
            </button>
          )}
        </div>

        {!template ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setCreatingNew(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.color = SMS_PURPLE; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Create New
            </button>
            <button type="button" onClick={() => setShowPicker(true)} style={{
              flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
              background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.color = SMS_PURPLE; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>☰</div>
              Select Existing
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Action bar */}
            <div style={{ padding: "8px 12px", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
              <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                <button onClick={() => setShowPicker(true)} style={{ fontSize: 11, color: SMS_PURPLE, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                <button onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
              </div>
            </div>

            {/* Inline edit form */}
            <div style={{ padding: "12px", borderTop: `1px solid ${BORDER}` }}>
              <InlineSMSTemplateForm
                draft={{
                  name: template.name,
                  approvedTemplateId: template.approvedTemplateId,
                  gateway: template.gateway,
                  body: template.body,
                  shortenUrl: template.shortenUrl || "",
                  variableMap: data.variableMap || {},
                }}
                onChange={(updated) => patch({
                  template: { ...template, ...updated },
                  variableMap: updated.variableMap,
                })}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { utm = {}, aiBestTime, smartRetry = {} } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* UTM Parameters */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>UTM Parameters</Label>
          <Toggle on={!!utm.enabled} onChange={(v) => patch({ utm: { ...utm, enabled: v } })} />
        </div>
        {utm.enabled && (
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 8, overflow: "hidden" }}>
            {[["utm_source", "Source", "sms"], ["utm_medium", "Medium", "journey"], ["utm_campaign", "Campaign", data.template?.name || ""]].map(([key, label, placeholder]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 11, color: "#64748B", padding: "7px 10px", width: 80, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, fontFamily: "monospace" }}>{label}</span>
                <input value={utm[key] || ""} placeholder={placeholder} onChange={(e) => patch({ utm: { ...utm, [key]: e.target.value } })}
                  style={{ flex: 1, padding: "7px 10px", fontSize: 12, border: "none", outline: "none" }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Best Sent Time */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BORDER}` }}>
        <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
          <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            Sends at each user's optimal engagement window. Usually within 0–4 hours.
          </p>
        </div>
      </div>

      {/* Smart Retry */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Smart Retry</Label>
          <Toggle on={!!smartRetry.enabled} onChange={(v) => patch({ smartRetry: { ...smartRetry, enabled: v } })} />
        </div>
        {smartRetry.enabled && (
          <div style={{ display: "flex", gap: 8 }}>
            {[["smart", "Smart Retry (Recommended)"], ["manual", "Manual Retry"]].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => patch({ smartRetry: { ...smartRetry, mode } })} style={{
                flex: 1, padding: "10px 8px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 500,
                border: `2px solid ${smartRetry.mode === mode ? SMS_PURPLE : BORDER}`,
                background: smartRetry.mode === mode ? "#EEF2FF" : "#fff",
                color: smartRetry.mode === mode ? SMS_PURPLE : "#64748B",
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Output Tab ──────────────────────────────────────────────────
const BRANCH_OPTIONS = SMS_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const outputCfg        = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode      = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["sent"]) } });
  };
  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const deliveryPortCount = routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? SMS_PURPLE : BORDER}`,
    borderRadius: 10, cursor: "pointer", background: active ? "#EEF2FF" : "#fff",
    transition: "all 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Choose how this node routes users after the SMS is sent.
      </p>

      <div>
        <Label>Routing Mode</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? SMS_PURPLE : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: SMS_PURPLE }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Single output port — all users continue regardless of delivery status.
              </div>
            </div>
          </div>

          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "branches" ? SMS_PURPLE : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "branches" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: SMS_PURPLE }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Delivery Branches</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
                Separate output port per delivery status — route users by sent, delivered, or failed.
              </div>
            </div>
          </div>
        </div>
      </div>

      {routingMode === "branches" && (
        <div>
          <Label>Select Branch Statuses</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              return (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#EEF2FF" : "#fff", cursor: "pointer",
                }} onClick={() => toggleBranch(opt.id)}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: SMS_PURPLE, width: 14, height: 14, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  <span style={{
                    fontSize: 10, padding: "1px 7px", borderRadius: 10, fontWeight: 600,
                    background: opt.id === "failed" ? "#FEF2F2" : opt.id === "delivered" ? "#F0FDF4" : "#F0F9FF",
                    color:      opt.id === "failed" ? "#DC2626" : opt.id === "delivered" ? "#16A34A" : "#0EA5E9",
                  }}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one status to create output ports.</p>
          )}
        </div>
      )}

      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{deliveryPortCount}</span>
      </div>
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────
const TABS = [
  { id: "template", label: "Template" },
  { id: "delivery", label: "Delivery" },
  { id: "output",   label: "Output"   },
];

export default function SMSRightPanel({ node, updateNodeData, removeNode }) {
  const [tab,          setTab]          = useState("template");
  const [editingLabel, setEditingLabel] = useState(false);

  if (!node) return null;

  const data  = node.data || {};
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: SMS_PURPLE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <MessageSquare size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingLabel ? (
              <input
                autoFocus
                value={data.label || ""}
                onChange={(e) => patch({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false); }}
                placeholder="Send SMS"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", borderBottom: `1.5px solid ${SMS_PURPLE}`, outline: "none", background: "transparent", width: "100%", padding: "0 0 1px" }}
              />
            ) : (
              <div
                onClick={() => setEditingLabel(true)}
                title="Click to rename"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              >
                {data.label || "Send SMS"}
                <span style={{ fontSize: 9, color: MUTED, marginLeft: 5, fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: MUTED }}>Configure message &amp; delivery</div>
          </div>
        </div>
        <button
          onClick={() => removeNode(node.id)}
          style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"}
          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
        >
          Delete
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 500,
            border: "none", borderBottom: `2px solid ${tab === id ? SMS_PURPLE : "transparent"}`,
            background: tab === id ? "#EEF2FF" : "transparent",
            color: tab === id ? SMS_PURPLE : MUTED, cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, position: "relative" }}>
        {tab === "template" && <TemplateTab data={data} patch={patch} />}
        {tab === "delivery" && <DeliveryTab data={data} patch={patch} />}
        {tab === "output"   && <OutputTab   data={data} patch={patch} />}
      </div>

      {/* Save footer */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button
          onClick={() => alert("Changes saved")}
          style={{ width: "100%", padding: "9px", background: SMS_PURPLE, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
