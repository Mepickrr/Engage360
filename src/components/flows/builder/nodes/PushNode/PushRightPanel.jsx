import React, { useState } from "react";
import { Bell } from "lucide-react";
import { PUSH_TEMPLATE_STYLES, PUSH_TEMPLATE_STYLE_CONFIGS, PUSH_DELIVERY_OPTIONS } from "./data/mockData";
import { getPushTemplateAnalytics, PUSH_ANALYTICS_METRICS } from "./data/mockPushAnalytics";
import UnifiedTemplateModal from "../WhatsAppNode/UnifiedTemplateModal";
import PushTemplateForm from "./PushTemplateForm";
import PushBubblePreview from "./PushBubblePreview";

const AMBER  = "#F59E0B";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

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
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? AMBER : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}


// ── Output Tab ──────────────────────────────────────────────────
const BRANCH_OPTIONS = PUSH_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const outputCfg        = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode      = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["clicked"]) } });
  };
  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const portCount = routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1);

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? AMBER : BORDER}`, borderRadius: 10, cursor: "pointer",
    background: active ? "#FFFBEB" : "#fff", transition: "all 0.15s",
  });

  const branchColor = { clicked: "#3B82F6", dismissed: "#94A3B8", delivered: "#10B981" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.6, margin: 0 }}>
        Choose how users are routed after the notification is sent.
      </p>
      <div>
        <Label>Routing Mode</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? AMBER : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>Single port — all users continue to the same next node.</div>
            </div>
          </div>
          <div style={radioStyle(routingMode === "branches")} onClick={() => setMode("branches")}>
            <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "branches" ? AMBER : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {routingMode === "branches" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER }} />}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Delivery Branches</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>Separate port per status — clicked, dismissed, or delivered.</div>
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
              const bc = branchColor[opt.id] ?? AMBER;
              return (
                <div key={opt.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#FFFBEB" : "#fff", cursor: "pointer",
                }} onClick={() => toggleBranch(opt.id)}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: bc, width: 14, height: 14, cursor: "pointer" }} />
                  <span style={{ fontSize: 13, color: "#0F172A", flex: 1 }}>{opt.label}</span>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: bc, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one status.</p>
          )}
        </div>
      )}

      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{portCount}</span>
      </div>
    </div>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { aiBestTime, smartRetry = {} } = data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px", background: "#F8FAFC", borderRadius: 10, border: `1px solid ${BORDER}` }}>
        <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
          <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Sends at each user's optimal engagement window.</p>
        </div>
      </div>
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
                border: `2px solid ${smartRetry.mode === mode ? AMBER : BORDER}`,
                background: smartRetry.mode === mode ? "#FFFBEB" : "#fff",
                color: smartRetry.mode === mode ? "#92400E" : "#64748B",
              }}>{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [customTemplates, setCustomTemplates] = useState([]);

  const { template } = data;

  const handleModalSave = (tpl) => {
    const withId = tpl.id ? tpl : { ...tpl, id: `push_new_${Date.now()}`, status: "Draft", lastUpdated: new Date().toISOString().slice(0, 10) };
    setCustomTemplates((prev) => {
      const already = prev.find((t) => t.id === withId.id);
      return already ? prev.map((t) => (t.id === withId.id ? withId : t)) : [...prev, withId];
    });
    patch({ template: withId, variableMap: {} });
    setModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {modalOpen && (
        <UnifiedTemplateModal
          open
          styleId="push"
          styleLabel="Push"
          initialTemplate={null}
          customTemplates={customTemplates}
          configRegistry={PUSH_TEMPLATE_STYLE_CONFIGS}
          accentColor={AMBER}
          PreviewComponent={PushBubblePreview}
          metaInsightsStyleIds={[]}
          getAnalytics={getPushTemplateAnalytics}
          analyticsMetrics={PUSH_ANALYTICS_METRICS}
          customFormRenderer={({ draft, patch: patchDraft }) => <PushTemplateForm draft={draft} patch={patchDraft} />}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Template</Label>
          {template && (
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setModalOpen(true)} style={{ fontSize: 11, color: AMBER, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
              <button type="button" onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
            </div>
          )}
        </div>

        {!template ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{ width: "100%", padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = AMBER; e.currentTarget.style.color = AMBER; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
            Select or create a template
          </button>
        ) : (
          <div>
            {/* Template summary card */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "8px 12px", background: "#FFFBEB", display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={13} color={AMBER} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</span>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1E293B" }}>{template.title}</div>
                <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.4 }}>{template.body}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
                  {template.style && (
                    <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#FEF3C7", color: "#92400E" }}>
                      {PUSH_TEMPLATE_STYLES.find((s) => s.id === template.style)?.name || template.style}
                    </span>
                  )}
                  {template.platforms && Object.entries(template.platforms).filter(([, v]) => v).map(([k]) => (
                    <span key={k} style={{ fontSize: 10, padding: "1px 7px", borderRadius: 6, background: "#F1F5F9", color: "#64748B" }}>{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform preview — same component used in the modal's edit view */}
            <PushBubblePreview draft={template} />
          </div>
        )}
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

export default function PushRightPanel({ node, updateNodeData, removeNode }) {
  const [tab,          setTab]          = useState("template");
  const [editingLabel, setEditingLabel] = useState(false);

  if (!node) return null;

  const data    = node.data || {};
  const patch   = (p) => updateNodeData(node.id, p);
  const template = data?.template;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, color: "#0F172A" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Bell size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {editingLabel ? (
              <input autoFocus value={data.label || ""} onChange={(e) => patch({ label: e.target.value })}
                onBlur={() => setEditingLabel(false)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingLabel(false); }}
                placeholder="Push Notification"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", borderBottom: `1.5px solid ${AMBER}`, outline: "none", background: "transparent", width: "100%", padding: "0 0 1px" }} />
            ) : (
              <div onClick={() => setEditingLabel(true)} title="Click to rename"
                style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {data.label || "Push Notification"}
                <span style={{ fontSize: 9, color: MUTED, marginLeft: 5, fontWeight: 400 }}>✎</span>
              </div>
            )}
            <div style={{ fontSize: 10, color: MUTED }}>Configure notification &amp; delivery</div>
          </div>
        </div>
        <button onClick={() => removeNode(node.id)} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, flexShrink: 0 }}
          onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
          Delete
        </button>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 500,
            border: "none", borderBottom: `2px solid ${tab === id ? AMBER : "transparent"}`,
            background: tab === id ? "#FFFBEB" : "transparent",
            color: tab === id ? "#92400E" : MUTED, cursor: "pointer", transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, position: "relative" }}>
        {tab === "template" && (
          <TemplateTab data={data} patch={patch} />
        )}
        {tab === "delivery" && <DeliveryTab data={data} patch={patch} />}
        {tab === "output"   && <OutputTab   data={data} patch={patch} />}
      </div>

      {/* Save footer */}
      <div style={{ padding: "10px 16px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <button onClick={() => alert("Changes saved")} style={{ width: "100%", padding: "9px", background: AMBER, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
