import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  SMS_PROVIDERS, SMS_SENDER_IDS, SMS_TEMPLATE_STYLES, SMS_TEMPLATE_STYLE_CONFIGS,
  SMS_DELIVERY_OPTIONS, defaultSMSNodeData,
} from "./data/mockData";
import { getSMSTemplateAnalytics, SMS_ANALYTICS_METRICS } from "./data/mockSMSAnalytics";
import UnifiedTemplateModal from "../WhatsAppNode/UnifiedTemplateModal";
import SMSTemplateForm from "./SMSTemplateForm";
import SMSBubblePreview from "./SMSBubblePreview";
import { Group, Row, UTMFields, RetryFields } from "../shared/DeliveryKit";

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

function SMSStyleCard({ style, onSelect }) {
  const Icon = style.Icon;
  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: 14,
        border: `1.5px solid ${BORDER}`, borderRadius: 12, cursor: "pointer", background: "#fff",
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.background = "#EEF2FF"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "#fff"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={15} color="#4338CA" />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{style.label}</div>
      </div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0 }}>{style.desc}</p>
    </div>
  );
}

function SMSTemplateStylePicker({ onSelect }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Choose Template Style</div>
      <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, marginBottom: 12 }}>Select the type of SMS you want to send</div>
      <div style={{ display: "flex", gap: 10 }}>
        {SMS_TEMPLATE_STYLES.map((style) => (
          <SMSStyleCard key={style.id} style={style} onSelect={() => onSelect(style)} />
        ))}
      </div>
    </div>
  );
}

// ── Template Tab ────────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [customTemplatesByStyle, setCustomTemplatesByStyle] = useState({});

  const { providerId, senderIdId, templateStyle, template } = data;
  const styleInfo = SMS_TEMPLATE_STYLES.find((s) => s.id === templateStyle);
  const senderOptions = SMS_SENDER_IDS.filter((s) => s.providerId === providerId);

  if (!providerId || !senderIdId || !templateStyle) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Label>Provider</Label>
          <select
            value={providerId || ""}
            onChange={(e) => patch({ providerId: e.target.value, senderIdId: null })}
            style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
          >
            <option value="" disabled>Select a provider</option>
            {SMS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {providerId && (
          <div>
            <Label>Sender ID</Label>
            <select
              value={senderIdId || ""}
              onChange={(e) => patch({ senderIdId: e.target.value })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              <option value="" disabled>Select a sender ID</option>
              {senderOptions.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "inactive"}>
                  {s.senderId}{s.status === "inactive" ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {senderIdId && (
          <SMSTemplateStylePicker onSelect={(style) => { patch({ templateStyle: style.id }); setModalOpen(true); }} />
        )}
      </div>
    );
  }

  const handleModalSave = (tpl) => {
    const { variableMap, ...templateFields } = tpl;
    const withId = templateFields.id
      ? templateFields
      : { ...templateFields, id: `sms_new_${Date.now()}`, category: templateStyle, status: "Draft" };
    setCustomTemplatesByStyle((prev) => {
      const existing = prev[templateStyle] || [];
      const already = existing.find((t) => t.id === withId.id);
      return { ...prev, [templateStyle]: already ? existing.map((t) => (t.id === withId.id ? withId : t)) : [...existing, withId] };
    });
    patch({ template: withId, variableMap: variableMap || {} });
    setModalOpen(false);
  };

  return (
    <>
      {modalOpen && (
        <UnifiedTemplateModal
          open
          styleId={templateStyle}
          styleLabel={styleInfo?.label || "Template"}
          customTemplates={customTemplatesByStyle[templateStyle] || []}
          configRegistry={SMS_TEMPLATE_STYLE_CONFIGS}
          accentColor={SMS_PURPLE}
          PreviewComponent={SMSBubblePreview}
          metaInsightsStyleIds={[]}
          getAnalytics={getSMSTemplateAnalytics}
          analyticsMetrics={SMS_ANALYTICS_METRICS}
          customFormRenderer={({ draft, patch: patchDraft }) => <SMSTemplateForm draft={draft} patch={patchDraft} />}
          onSave={handleModalSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {styleInfo && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#EEF2FF", borderRadius: 20, border: "1px solid #C7D2FE", alignSelf: "flex-start" }}>
            <styleInfo.Icon size={13} color="#4338CA" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#4338CA" }}>{styleInfo.label}</span>
            <span style={{ fontSize: 11, color: MUTED }}>·</span>
            <span
              onClick={() => patch({ templateStyle: null, template: null })}
              style={{ fontSize: 11, color: SMS_PURPLE, cursor: "pointer", fontWeight: 500 }}
            >Change</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Label>Provider</Label>
            <select
              value={providerId}
              onChange={(e) => patch({ providerId: e.target.value, senderIdId: null })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              {SMS_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <Label>Sender ID</Label>
            <select
              value={senderIdId}
              onChange={(e) => patch({ senderIdId: e.target.value })}
              style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}
            >
              {senderOptions.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === "inactive"}>
                  {s.senderId}{s.status === "inactive" ? " (Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Template</Label>
            {template && (
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setModalOpen(true)} style={{ fontSize: 11, color: SMS_PURPLE, fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>Change</button>
                <button type="button" onClick={() => patch({ template: null, variableMap: {} })} style={{ fontSize: 11, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
              </div>
            )}
          </div>

          {!template ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              style={{ width: "100%", padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = SMS_PURPLE; e.currentTarget.style.color = SMS_PURPLE; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
              Select or create a template
            </button>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", background: "#F8FAFC" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{template.name}</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                {template.body}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Delivery Tab ────────────────────────────────────────────────
function DeliveryTab({ data, patch }) {
  const { markAsMarketing, utm = {}, aiBestTime, smartRetry = {} } = data;
  return (
    <div>
      <Group title="Attribution">
        <Row>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <input type="checkbox" id="sms-marketing" checked={markAsMarketing !== false} onChange={(e) => patch({ markAsMarketing: e.target.checked })} style={{ marginTop: 2, accentColor: SMS_PURPLE }} />
            <div>
              <label htmlFor="sms-marketing" style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", cursor: "pointer", display: "block", marginBottom: 2 }}>Mark as Revenue Attribution</label>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>Automatically map this communication's performance to revenue, based on your attribution settings.</p>
            </div>
          </div>
        </Row>
        <Row last>
          <UTMFields
            utm={utm}
            onChange={(v) => patch({ utm: v })}
            accentColor={SMS_PURPLE}
            defaults={{
              utm_source: "sms",
              utm_medium: "journey",
              utm_campaign: data.template?.name || "abandoned_cart_reminder",
              utm_term: "promo",
              utm_content: data.template?.name || "sms_template",
            }}
          />
        </Row>
      </Group>

      <Group title="Send Optimization">
        <Row>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Toggle on={!!aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 2 }}>AI Best Sent Time</div>
              <p style={{ fontSize: 11, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Sends at each user's optimal engagement window. Usually within 0–4 hours.
              </p>
            </div>
          </div>
        </Row>
        <Row last>
          <RetryFields smartRetry={smartRetry} onChange={(v) => patch({ smartRetry: v })} accentColor={SMS_PURPLE} />
        </Row>
      </Group>
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
