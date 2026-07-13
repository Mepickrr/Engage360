import React, { useState } from "react";
import {
  Mail, Paperclip, ChevronDown, ChevronRight, Trash2,
  Sparkles, Link, Upload, X, ExternalLink, Eye, Edit3,
  CheckCircle, AlertCircle, Info,
} from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  EMAIL_FROM_ADDRESSES, MOCK_EMAIL_TEMPLATES,
  EMAIL_DELIVERY_OPTIONS, EMAIL_PROVIDERS, TO_EMAIL_VARIABLES,
  defaultEmailNodeData,
} from "./data/mockData";
import TemplateEditorModal from "./TemplateEditorModal";
import EmailTemplateGalleryModal from "./EmailTemplateGalleryModal";
import { UTMFields, RetryFields } from "../shared/DeliveryKit";

const EMAIL_BLUE = "#3B82F6";
const BORDER     = "#E5E7EB";
const MUTED      = "#94A3B8";

// ── Shared helpers ─────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? EMAIL_BLUE : "#E2E8F0",
        cursor: "pointer", display: "flex", alignItems: "center",
        padding: 2, flexShrink: 0, transition: "background 0.2s",
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s",
        transform: on ? "translateX(18px)" : "translateX(0)",
      }} />
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", padding: "7px 28px 7px 10px", fontSize: 13,
        border: `1px solid ${BORDER}`, borderRadius: 8,
        outline: "none", background: "#fff",
        appearance: "none", cursor: "pointer",
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function TextField({ value, onChange, placeholder, mono = false }) {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "7px 10px", fontSize: 13,
        border: `1px solid ${BORDER}`, borderRadius: 8,
        outline: "none", background: "#fff", boxSizing: "border-box",
        fontFamily: mono ? "monospace" : "inherit",
      }}
    />
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F1F5F9", margin: "14px 0" }} />;
}

// ── Tab bar ────────────────────────────────────────────────────
function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, background: "#fff", flexShrink: 0 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            flex: 1, padding: "10px 4px", fontSize: 12, fontWeight: 700,
            border: "none", cursor: "pointer", background: "transparent",
            borderBottom: active === tab.id ? `2px solid ${EMAIL_BLUE}` : "2px solid transparent",
            color: active === tab.id ? EMAIL_BLUE : "#64748B",
            transition: "all 0.15s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Section collapsible ────────────────────────────────────────
function Section({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 6,
          padding: "10px 16px", background: "#F8FAFC",
          border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer",
        }}
      >
        <ChevronRight
          size={13} color="#94A3B8"
          style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", flex: 1, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: "#EFF6FF", color: EMAIL_BLUE }}>
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div style={{ padding: "14px 16px", background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Mini template preview card ─────────────────────────────────
function TemplatePreviewCard({ template, subject, previewText, onEdit, onClear }) {
  return (
    <div style={{ border: `1.5px solid #BFDBFE`, borderRadius: 10, overflow: "hidden", background: "#EFF6FF" }}>
      {/* Thumbnail strip */}
      <div style={{ height: 56, background: template.thumbnailColor, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <Mail size={22} color={EMAIL_BLUE} opacity={0.4} />
        <button
          onClick={onClear}
          style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <X size={11} color="#fff" />
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{template.name}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{template.category}</div>
          </div>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: template.status === "Active" ? "#ECFDF5" : "#F1F5F9", color: template.status === "Active" ? "#065F46" : "#6B7280", fontWeight: 600 }}>
            {template.status}
          </span>
        </div>

        {subject && (
          <div style={{ fontSize: 11, color: "#1E40AF", fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {subject}
          </div>
        )}

        <button
          onClick={onEdit}
          style={{
            width: "100%", marginTop: 8, padding: "8px 0",
            background: EMAIL_BLUE, color: "#fff",
            border: "none", borderRadius: 7, cursor: "pointer",
            fontSize: 12, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Edit3 size={12} /> Edit Template
        </button>
      </div>
    </div>
  );
}

// ── Gmail Annotation section ──────────────────────────────────
function GmailAnnotationSection({ ga, onChange }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Gmail Promotions Tab</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Show discount badge in inbox preview</div>
        </div>
        <Toggle on={ga.enabled} onChange={(v) => onChange({ ...ga, enabled: v })} />
      </div>
      {ga.enabled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <Label>Discount Amount</Label>
            <TextField value={ga.discount} onChange={(v) => onChange({ ...ga, discount: v })} placeholder="e.g. 20% off" />
          </div>
          <div>
            <Label>Promo Code</Label>
            <TextField value={ga.code} onChange={(v) => onChange({ ...ga, code: v })} placeholder="e.g. SAVE20" mono />
          </div>
          <div>
            <Label>Expiry Date</Label>
            <TextField value={ga.expiry} onChange={(v) => onChange({ ...ga, expiry: v })} placeholder="e.g. June 30, 2026" />
          </div>
          <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A", alignItems: "flex-start" }}>
            <Info size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: "#92400E" }}>Gmail only shows annotations for emails sent from verified domains with good sender reputation.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Output tab ─────────────────────────────────────────────────
function OutputTab({ data, patch }) {
  const outputCfg = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode = outputCfg.routingMode ?? "next_step";

  const setRouting = (mode) => {
    patch({
      outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : ["delivered"] },
    });
  };

  const toggleDelivery = (id) => {
    const cur = outputCfg.deliveryOutputs ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  return (
    <div style={{ padding: 16 }}>
      <Label>Routing Mode</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {[
          { id: "next_step",  label: "Next Step",           desc: "All users continue to next node" },
          { id: "delivery",   label: "Delivery-based",      desc: "Branch on delivery status" },
        ].map((mode) => (
          <label key={mode.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: `1.5px solid ${routingMode === mode.id ? EMAIL_BLUE : BORDER}`, borderRadius: 8, cursor: "pointer", background: routingMode === mode.id ? "#EFF6FF" : "#fff" }}>
            <input type="radio" checked={routingMode === mode.id} onChange={() => setRouting(mode.id)} style={{ marginTop: 3 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{mode.label}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{mode.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {routingMode === "delivery" && (
        <div>
          <Label>Output Branches</Label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {EMAIL_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step").map((opt) => {
              const checked = (outputCfg.deliveryOutputs ?? []).includes(opt.id);
              return (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: `1.5px solid ${checked ? EMAIL_BLUE : BORDER}`, borderRadius: 8, cursor: "pointer", background: checked ? "#EFF6FF" : "#fff" }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleDelivery(opt.id)} />
                  <span style={{ fontSize: 13, color: "#0F172A" }}>{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function EmailRightPanel({ node, updateNodeData, removeNode }) {
  const selectedNodeId = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes          = useFlowBuilderStore((s) => s.nodes);
  const storeUpdateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const storeRemoveNode     = useFlowBuilderStore((s) => s.removeNode);

  const resolvedNode          = node ?? nodes.find((n) => n.id === selectedNodeId);
  const resolvedUpdateNodeData = updateNodeData ?? storeUpdateNodeData;
  const resolvedRemoveNode     = removeNode ?? storeRemoveNode;

  const [activeTab, setActiveTab] = useState("template");
  const [showGallery, setShowGallery] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [testEmail,  setTestEmail]  = useState("");

  if (!resolvedNode) return null;

  const data = resolvedNode.data ?? {};
  const patch = (p) => resolvedUpdateNodeData(resolvedNode.id, p);

  const fromAddressOptions = EMAIL_FROM_ADDRESSES.map((f) => ({
    value: f.id,
    label: `${f.name} <${f.email}>${f.verified ? "" : " (unverified)"}`,
  }));

  const selectedFrom = EMAIL_FROM_ADDRESSES.find((f) => f.id === (data.fromId ?? "from_1"));

  const TABS = [
    { id: "template", label: "Template" },
    { id: "delivery", label: "Delivery" },
    { id: "output",   label: "Output"   },
  ];

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", fontFamily: "Inter, system-ui, sans-serif", position: "relative" }}>
        {/* ── Panel header ── */}
        <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Mail size={14} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={data.label ?? "Send Email"}
                onChange={(e) => patch({ label: e.target.value })}
                style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", border: "none", outline: "none", background: "transparent", width: "100%", padding: 0 }}
              />
            </div>
            <button
              type="button"
              onClick={() => resolvedRemoveNode(resolvedNode.id)}
              style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
          <div style={{ fontSize: 11, color: MUTED, paddingLeft: 36 }}>
            Email · {data.template ? "Template selected" : "Not configured"}
          </div>
        </div>

        {/* ── Tab bar ── */}
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ━━ TEMPLATE TAB ━━ */}
          {activeTab === "template" && (
            <div>
              {/* Sender Details */}
              <Section title="Sender Details" defaultOpen>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <Label>Email Provider</Label>
                    <SelectField
                      value={data.provider}
                      onChange={(v) => patch({ provider: v })}
                      options={EMAIL_PROVIDERS.map((p) => ({ value: p.id, label: p.label }))}
                    />
                  </div>
                  <div>
                    <Label>From Address</Label>
                    <SelectField
                      value={data.fromId}
                      onChange={(v) => patch({ fromId: v })}
                      options={fromAddressOptions}
                    />
                    {selectedFrom && !selectedFrom.verified && (
                      <div style={{ display: "flex", gap: 5, marginTop: 5, padding: "5px 8px", background: "#FFFBEB", borderRadius: 6, border: "1px solid #FDE68A", alignItems: "center" }}>
                        <AlertCircle size={12} color="#D97706" />
                        <span style={{ fontSize: 11, color: "#92400E" }}>Domain not verified. Emails may land in spam.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>To Email</Label>
                    <SelectField
                      value={data.toEmailMode === "variable" ? data.toEmailVariable : "auto"}
                      onChange={(v) => {
                        if (v === "auto") patch({ toEmailMode: "auto", toEmailVariable: null });
                        else patch({ toEmailMode: "variable", toEmailVariable: v });
                      }}
                      options={[
                        { value: "auto", label: "Automatically detects the email address" },
                        ...TO_EMAIL_VARIABLES.map((v) => ({ value: v.key, label: `{{${v.key}}} — ${v.label}` })),
                      ]}
                    />
                  </div>
                </div>
              </Section>

              {/* Email Content */}
              <Section title="Email Content" defaultOpen>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <Label>Subject Line</Label>
                      <button style={{ fontSize: 10, color: EMAIL_BLUE, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                        <Sparkles size={11} /> AI Assist
                      </button>
                    </div>
                    <input
                      type="text"
                      value={data.subject || ""}
                      onChange={(e) => patch({ subject: e.target.value })}
                      placeholder="e.g. Your cart is waiting, {{customer.firstName}}!"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 4, textAlign: "right" }}>
                      {(data.subject || "").length} chars · A/B test: <span style={{ color: EMAIL_BLUE, cursor: "pointer" }}>+ Add variant</span>
                    </div>
                  </div>

                  <div>
                    <Label>Preview Text</Label>
                    <input
                      type="text"
                      value={data.previewText || ""}
                      onChange={(e) => patch({ previewText: e.target.value })}
                      placeholder="Short preview shown in inbox…"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                    />
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
                      Recommended: 40–130 characters
                    </div>
                  </div>
                </div>
              </Section>

              {/* Template */}
              <Section title="Template" defaultOpen>
                {!data.template ? (
                  <button
                    onClick={() => setShowGallery(true)}
                    style={{
                      width: "100%", padding: "11px 14px",
                      border: `1.5px dashed ${EMAIL_BLUE}`,
                      borderRadius: 9, background: "#EFF6FF",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 7, background: EMAIL_BLUE, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Eye size={15} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: EMAIL_BLUE }}>Select Template</div>
                      <div style={{ fontSize: 11, color: "#93C5FD" }}>Choose from your template library or create new</div>
                    </div>
                  </button>
                ) : (
                  <TemplatePreviewCard
                    template={data.template}
                    subject={data.subject}
                    previewText={data.previewText}
                    onEdit={() => setShowEditor(true)}
                    onClear={() => patch({ template: null })}
                  />
                )}
              </Section>

              {/* Attachments */}
              <Section title="Attachments" defaultOpen={false} badge={(data.attachments?.length || 0) > 0 ? `${data.attachments.length}` : null}>
                <div>
                  {(data.attachments || []).map((att, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "#F8FAFC", borderRadius: 6, marginBottom: 6, border: `1px solid ${BORDER}` }}>
                      <Paperclip size={13} color={MUTED} />
                      <span style={{ fontSize: 12, flex: 1 }}>{att.name}</span>
                      <span style={{ fontSize: 10, color: MUTED }}>{att.size}</span>
                      <button onClick={() => patch({ attachments: (data.attachments || []).filter((_, j) => j !== i) })} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                        <X size={12} color={MUTED} />
                      </button>
                    </div>
                  ))}
                  <button
                    style={{ width: "100%", padding: "9px 0", border: `1.5px dashed #BFDBFE`, borderRadius: 8, background: "#EFF6FF", cursor: "pointer", fontSize: 12, color: EMAIL_BLUE, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4 }}
                    onClick={() => {
                      const name = prompt("File name (demo):");
                      if (name) patch({ attachments: [...(data.attachments || []), { name, size: "0 KB" }] });
                    }}
                  >
                    <Upload size={13} /> Upload File
                  </button>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 5 }}>Max 10 MB per file · PDF, DOCX, XLSX, ZIP</div>
                </div>
              </Section>

              {/* Gmail Annotation */}
              <Section title="Gmail Annotation" defaultOpen={false}>
                <GmailAnnotationSection
                  ga={data.gmailAnnotation ?? { enabled: false, logo: "", discount: "", code: "", expiry: "" }}
                  onChange={(v) => patch({ gmailAnnotation: v })}
                />
              </Section>
            </div>
          )}

          {/* ━━ DELIVERY TAB ━━ */}
          {activeTab === "delivery" && (
            <div>
              {/* UTM */}
              <Section title="UTM Parameters" defaultOpen>
                <UTMFields
                  utm={data.utm ?? {}}
                  onChange={(v) => patch({ utm: v })}
                  accentColor={EMAIL_BLUE}
                  defaults={{ utm_source: "email", utm_medium: "journey", utm_campaign: "cart-recovery" }}
                />
              </Section>

              {/* AI Best Time */}
              <Section title="Send Optimization" defaultOpen>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: data.aiBestTime ? 12 : 0 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>AI Best Time</div>
                    <div style={{ fontSize: 11, color: MUTED }}>Send at the optimal time for each user</div>
                  </div>
                  <Toggle on={!!data.aiBestTime} onChange={(v) => patch({ aiBestTime: v })} />
                </div>
                {data.aiBestTime && (
                  <div style={{ padding: "8px 10px", background: "#EFF6FF", borderRadius: 8, border: "1px solid #BFDBFE" }}>
                    <div style={{ fontSize: 11, color: "#1D4ED8" }}>⚡ AI will deliver within a 24-hour window, optimised per user based on their open history.</div>
                  </div>
                )}
              </Section>

              {/* Smart Retry */}
              <Section title="Smart Retry" defaultOpen>
                <RetryFields
                  smartRetry={data.smartRetry ?? {}}
                  onChange={(v) => patch({ smartRetry: v })}
                  accentColor={EMAIL_BLUE}
                />
              </Section>

              {/* Test Email */}
              <Section title="Test Campaign" defaultOpen>
                <div>
                  <Label>Send test to email address</Label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@yourteam.com"
                      style={{ flex: 1, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
                    />
                    <button
                      style={{ padding: "7px 14px", background: EMAIL_BLUE, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                    >
                      Send Test
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 5 }}>Uses preview data for personalization variables</div>
                </div>
              </Section>
            </div>
          )}

          {/* ━━ OUTPUT TAB ━━ */}
          {activeTab === "output" && (
            <OutputTab data={data} patch={patch} />
          )}
        </div>

        {/* Template Gallery modal */}
        <EmailTemplateGalleryModal
          open={showGallery}
          templates={MOCK_EMAIL_TEMPLATES}
          onSelect={(t) => {
            patch({ template: t, subject: data.subject || t.subject, previewText: data.previewText || t.previewText });
            setShowGallery(false);
            setShowEditor(true);
          }}
          onCreateNew={() => { setShowGallery(false); setShowEditor(true); }}
          onClose={() => setShowGallery(false)}
        />
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={showEditor}
        template={data.template}
        data={data}
        onSave={(editorData) => {
          const tpl = data.template ?? {
            id: `email_custom_${Date.now()}`,
            name: "Custom Template",
            subject: data.subject || "",
            previewText: data.previewText || "",
            category: "Custom",
            thumbnailColor: "#EFF6FF",
            status: "Active",
            lastUpdated: new Date().toISOString().split("T")[0],
            blocks: [],
          };
          patch({
            template: {
              ...tpl,
              blocks: editorData.blocks,
              ...(editorData.templateName !== undefined && editorData.templateName !== "" && { name: editorData.templateName }),
            },
            ...(editorData.subject !== undefined && { subject: editorData.subject }),
            ...(editorData.previewText !== undefined && { previewText: editorData.previewText }),
          });
        }}
        onClose={() => setShowEditor(false)}
      />
    </>
  );
}
