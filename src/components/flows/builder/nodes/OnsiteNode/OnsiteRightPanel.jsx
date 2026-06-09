import React, { useState } from "react";
import {
  Monitor, ChevronRight, Plus, X, Check, Info,
} from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  ONSITE_TEAL, DISPLAY_TYPES, MOCK_ONSITE_TEMPLATES,
  PLATFORM_OPTIONS, TRIGGER_TYPES, ONSITE_DELIVERY_OPTIONS,
} from "./data/mockData";
import OnsiteTemplateEditorModal from "./TemplateEditorModal";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";

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
      style={{ width: 40, height: 22, borderRadius: 11, background: on ? ONSITE_TEAL : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
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
            borderBottom: active === tab.id ? `2px solid ${ONSITE_TEAL}` : "2px solid transparent",
            color: active === tab.id ? ONSITE_TEAL : "#64748B", transition: "all 0.15s",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "#F8FAFC", border: "none", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}
      >
        <ChevronRight size={13} color="#94A3B8" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#374151", flex: 1, textAlign: "left", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: `${ONSITE_TEAL}18`, color: ONSITE_TEAL }}>{badge}</span>
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

// ── Display Type Picker ────────────────────────────────────────
function DisplayTypePicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div>
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Choose Display Type</div>
        <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Select how the message appears on screen</div>
      </div>
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {DISPLAY_TYPES.map((dt) => {
          const isHovered = hovered === dt.id;
          return (
            <div
              key={dt.id}
              onClick={() => onSelect(dt.id)}
              onMouseEnter={() => setHovered(dt.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative", display: "flex", alignItems: "flex-start", gap: 12,
                padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${isHovered ? ONSITE_TEAL : BORDER}`,
                background: isHovered ? `${ONSITE_TEAL}0A` : "#fff",
                transition: "all 0.15s",
              }}
            >
              {dt.popular && (
                <span style={{ position: "absolute", top: 7, right: 10, fontSize: 8, fontWeight: 700, color: "#065F46", background: "#DCFCE7", borderRadius: 4, padding: "1px 5px" }}>Popular</span>
              )}
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `${ONSITE_TEAL}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>
                {dt.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{dt.label}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>{dt.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template picker overlay ────────────────────────────────────
function TemplatePicker({ displayType, onSelect, onClose }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const templates = MOCK_ONSITE_TEMPLATES.filter((t) => {
    const matchType = filter === "all" || t.displayType === filter;
    const matchQ = !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.useCase.toLowerCase().includes(q.toLowerCase());
    return matchType && matchQ;
  });

  return (
    <div style={{ position: "absolute", inset: 0, background: "#fff", zIndex: 10, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Select Template</span>
      </div>

      {/* Search + filter */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <input
          type="text" placeholder="Search templates…" value={q}
          onChange={(e) => setQ(e.target.value)} autoFocus
          style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "popup", "banner", "nudge"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "3px 10px", borderRadius: 20, border: `1px solid ${filter === f ? ONSITE_TEAL : BORDER}`,
                background: filter === f ? `${ONSITE_TEAL}15` : "#fff",
                color: filter === f ? ONSITE_TEAL : "#64748B",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {templates.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: MUTED }}>No templates match</div>
        ) : templates.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelect(t)}
            style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F8FAFC"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 8, background: t.thumbnailBg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {DISPLAY_TYPES.find((d) => d.id === t.displayType)?.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{t.name}</span>
                <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: t.status === "Active" ? "#ECFDF5" : "#F1F5F9", color: t.status === "Active" ? "#065F46" : "#6B7280", fontWeight: 600 }}>{t.status}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{t.useCase} · {t.displayType}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>Updated {t.lastUpdated}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Template preview card ──────────────────────────────────────
function TemplatePreviewCard({ template, displayType, onEdit, onClear }) {
  const dt = DISPLAY_TYPES.find((d) => d.id === displayType);
  return (
    <div style={{ border: `1.5px solid ${ONSITE_TEAL}44`, borderRadius: 10, overflow: "hidden", background: `${ONSITE_TEAL}08` }}>
      <div style={{ height: 52, background: template.thumbnailBg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: 26 }}>
        {dt?.emoji}
        <button onClick={onClear} style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={10} color="#fff" />
        </button>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{template.name}</div>
            <div style={{ fontSize: 10, color: MUTED }}>{template.useCase}</div>
          </div>
          <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, background: template.status === "Active" ? "#ECFDF5" : "#F1F5F9", color: template.status === "Active" ? "#065F46" : "#6B7280", fontWeight: 600 }}>{template.status}</span>
        </div>
        <button
          onClick={onEdit}
          style={{ width: "100%", padding: "8px 0", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          Edit Template
        </button>
      </div>
    </div>
  );
}

// ── Page rule row ──────────────────────────────────────────────
function PageRuleRow({ rule, onChange, onDelete }) {
  const ops = ["contains", "starts with", "ends with", "is exactly", "is not"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <select
        value={rule.operator}
        onChange={(e) => onChange({ ...rule, operator: e.target.value })}
        style={{ padding: "5px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", flexShrink: 0 }}
      >
        {ops.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <input
        type="text" value={rule.value || ""}
        onChange={(e) => onChange({ ...rule, value: e.target.value })}
        placeholder="/checkout, /cart…"
        style={{ flex: 1, padding: "5px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
      />
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}>
        <X size={13} color={MUTED} />
      </button>
    </div>
  );
}

// ── Output tab ─────────────────────────────────────────────────
function OutputTab({ data, patch }) {
  const outputCfg  = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode = outputCfg.routingMode ?? "next_step";

  const setRouting = (mode) => patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : ["shown"] } });
  const toggleDelivery = (id) => {
    const cur  = outputCfg.deliveryOutputs ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  return (
    <div style={{ padding: 16 }}>
      <Label>Routing Mode</Label>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {[
          { id: "next_step", label: "Next Step",        desc: "All users move to next node" },
          { id: "delivery",  label: "Interaction-based", desc: "Branch on how user responded" },
        ].map((mode) => (
          <label key={mode.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: `1.5px solid ${routingMode === mode.id ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: "pointer", background: routingMode === mode.id ? `${ONSITE_TEAL}0A` : "#fff" }}>
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
            {ONSITE_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step").map((opt) => {
              const checked = (outputCfg.deliveryOutputs ?? []).includes(opt.id);
              return (
                <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", border: `1.5px solid ${checked ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: "pointer", background: checked ? `${ONSITE_TEAL}0A` : "#fff" }}>
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

// ── Main panel ─────────────────────────────────────────────────
export default function OnsiteRightPanel({ node, updateNodeData, removeNode }) {
  const selectedNodeId      = useFlowBuilderStore((s) => s.selectedNodeId);
  const nodes               = useFlowBuilderStore((s) => s.nodes);
  const storeUpdateNodeData = useFlowBuilderStore((s) => s.updateNodeData);
  const storeRemoveNode     = useFlowBuilderStore((s) => s.removeNode);

  const resolvedNode           = node ?? nodes.find((n) => n.id === selectedNodeId);
  const resolvedUpdateNodeData = updateNodeData ?? storeUpdateNodeData;
  const resolvedRemoveNode     = removeNode ?? storeRemoveNode;

  const [activeTab,   setActiveTab]   = useState("template");
  const [showPicker,  setShowPicker]  = useState(false);
  const [showEditor,  setShowEditor]  = useState(false);

  if (!resolvedNode) return null;

  const data = resolvedNode.data ?? {};
  const patch = (p) => resolvedUpdateNodeData(resolvedNode.id, p);

  const TABS = [
    { id: "template",  label: "Template"  },
    { id: "targeting", label: "Targeting" },
    { id: "output",    label: "Output"    },
  ];

  const platforms   = data.platforms ?? ["web"];
  const pageRules   = data.pageRules  ?? [];
  const triggerType = data.triggerType ?? "page_load";

  const togglePlatform = (pid) => {
    const cur  = platforms;
    const next = cur.includes(pid) ? cur.filter((x) => x !== pid) : [...cur, pid];
    if (next.length > 0) patch({ platforms: next });
  };

  const addPageRule = () => patch({ pageRules: [...pageRules, { operator: "contains", value: "" }] });
  const updatePageRule = (i, r) => patch({ pageRules: pageRules.map((x, j) => j === i ? r : x) });
  const deletePageRule = (i) => patch({ pageRules: pageRules.filter((_, j) => j !== i) });

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", fontFamily: "Inter, system-ui, sans-serif", position: "relative" }}>

        {/* Panel header */}
        <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: ONSITE_TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Monitor size={14} color="#fff" />
            </div>
            <input
              value={data.label ?? "Onsite Message"}
              onChange={(e) => patch({ label: e.target.value })}
              style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", border: "none", outline: "none", background: "transparent", flex: 1, padding: 0 }}
            />
            <button
              onClick={() => resolvedRemoveNode(resolvedNode.id)}
              style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
          <div style={{ fontSize: 11, color: MUTED, paddingLeft: 36 }}>
            Onsite · {data.displayType ? `${DISPLAY_TYPES.find((d) => d.id === data.displayType)?.emoji} ${DISPLAY_TYPES.find((d) => d.id === data.displayType)?.label}` : "Not configured"}
          </div>
        </div>

        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ━━ TEMPLATE TAB ━━ */}
          {activeTab === "template" && (
            <div>
              {/* Step 1: no display type yet → show picker */}
              {!data.displayType ? (
                <DisplayTypePicker onSelect={(dt) => patch({ displayType: dt })} />
              ) : (
                <>
                  {/* Display type chip + change */}
                  <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${ONSITE_TEAL}15`, color: ONSITE_TEAL }}>
                      {DISPLAY_TYPES.find((d) => d.id === data.displayType)?.emoji} {DISPLAY_TYPES.find((d) => d.id === data.displayType)?.label}
                    </span>
                    <button
                      onClick={() => patch({ displayType: null, template: null })}
                      style={{ fontSize: 11, color: "#64748B", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      · Change
                    </button>
                  </div>

                  {/* Template section */}
                  <Section title="Template" defaultOpen>
                    {!data.template ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {/* Select prebuilt */}
                        <button
                          onClick={() => setShowPicker(true)}
                          style={{ width: "100%", padding: "11px 14px", border: `1.5px dashed ${ONSITE_TEAL}`, borderRadius: 9, background: `${ONSITE_TEAL}0A`, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 7, background: ONSITE_TEAL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
                            {DISPLAY_TYPES.find((d) => d.id === data.displayType)?.emoji}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: ONSITE_TEAL }}>Select Prebuilt Template</div>
                            <div style={{ fontSize: 11, color: `${ONSITE_TEAL}99` }}>Browse {MOCK_ONSITE_TEMPLATES.filter((t) => t.displayType === data.displayType).length} templates</div>
                          </div>
                        </button>

                        {/* Create from scratch */}
                        <button
                          onClick={() => setShowEditor(true)}
                          style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${BORDER}`, borderRadius: 9, background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ONSITE_TEAL; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: 7, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Plus size={15} color="#64748B" />
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Start from Scratch</div>
                            <div style={{ fontSize: 11, color: MUTED }}>Design in visual editor</div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <TemplatePreviewCard
                        template={data.template}
                        displayType={data.displayType}
                        onEdit={() => setShowEditor(true)}
                        onClear={() => patch({ template: null })}
                      />
                    )}
                  </Section>
                </>
              )}
            </div>
          )}

          {/* ━━ TARGETING TAB ━━ */}
          {activeTab === "targeting" && (
            <div>
              {/* Platform */}
              <Section title="Platform" defaultOpen>
                <Label>Show this message on</Label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {PLATFORM_OPTIONS.map((p) => {
                    const active = platforms.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", border: `1.5px solid ${active ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: "pointer", background: active ? `${ONSITE_TEAL}0A` : "#fff" }}
                      >
                        <input type="checkbox" checked={active} onChange={() => togglePlatform(p.id)} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{p.icon} {p.label}</span>
                      </label>
                    );
                  })}
                </div>
              </Section>

              {/* Trigger */}
              <Section title="Trigger" defaultOpen>
                <Label>When to show</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {TRIGGER_TYPES.map((tt) => {
                    const active = triggerType === tt.id;
                    // Exit intent only available for web
                    const disabled = tt.id === "exit_intent" && !platforms.includes("web");
                    return (
                      <label
                        key={tt.id}
                        style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", border: `1.5px solid ${active ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer", background: active ? `${ONSITE_TEAL}0A` : disabled ? "#F8FAFC" : "#fff", opacity: disabled ? 0.5 : 1 }}
                      >
                        <input type="radio" checked={active} onChange={() => !disabled && patch({ triggerType: tt.id })} disabled={disabled} style={{ marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{tt.label}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{tt.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Custom event name */}
                {triggerType === "custom_event" && (
                  <div style={{ marginBottom: 14 }}>
                    <Label>Event name</Label>
                    <input
                      type="text"
                      value={data.triggerEvent || ""}
                      onChange={(e) => patch({ triggerEvent: e.target.value })}
                      placeholder="e.g. add_to_cart"
                      style={{ width: "100%", padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                {/* Delay */}
                {triggerType !== "exit_intent" && (
                  <div>
                    <Label>Show after (seconds)</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="number" min={0} max={300}
                        value={data.triggerDelay ?? 0}
                        onChange={(e) => patch({ triggerDelay: Math.max(0, parseInt(e.target.value) || 0) })}
                        style={{ width: 80, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }}
                      />
                      <span style={{ fontSize: 12, color: MUTED }}>
                        {(data.triggerDelay ?? 0) === 0 ? "Immediately" : `${data.triggerDelay}s after trigger`}
                      </span>
                    </div>
                  </div>
                )}
              </Section>

              {/* Page targeting */}
              <Section title="Page Targeting" defaultOpen>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    { id: "all",      label: "All Pages"      },
                    { id: "specific", label: "Specific Pages" },
                  ].map((opt) => (
                    <label key={opt.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", border: `1.5px solid ${data.pageTarget === opt.id ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: "pointer", background: data.pageTarget === opt.id ? `${ONSITE_TEAL}0A` : "#fff" }}>
                      <input type="radio" checked={data.pageTarget === opt.id} onChange={() => patch({ pageTarget: opt.id, pageRules: [] })} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {data.pageTarget === "specific" && (
                  <div>
                    {pageRules.map((rule, i) => (
                      <PageRuleRow
                        key={i} rule={rule}
                        onChange={(r) => updatePageRule(i, r)}
                        onDelete={() => deletePageRule(i)}
                      />
                    ))}
                    <button
                      onClick={addPageRule}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 0", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: ONSITE_TEAL, fontWeight: 600 }}
                    >
                      <Plus size={13} /> Add URL rule
                    </button>
                    {pageRules.length > 0 && (
                      <div style={{ marginTop: 8, padding: "7px 10px", background: "#F0FDFA", borderRadius: 7, border: `1px solid ${ONSITE_TEAL}44`, fontSize: 11, color: "#0F766E" }}>
                        <Info size={12} style={{ verticalAlign: "middle", marginRight: 5 }} />
                        All rules must match (AND logic)
                      </div>
                    )}
                  </div>
                )}
              </Section>
            </div>
          )}

          {/* ━━ OUTPUT TAB ━━ */}
          {activeTab === "output" && (
            <OutputTab data={data} patch={patch} />
          )}
        </div>

        {/* Template picker overlay */}
        {showPicker && (
          <TemplatePicker
            displayType={data.displayType}
            onSelect={(t) => { patch({ template: t }); setShowPicker(false); }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>

      {/* Full-screen editor modal */}
      {showEditor && (
        <OnsiteTemplateEditorModal
          template={data.template}
          displayType={data.displayType}
          onSave={(editorData) => {
            const tpl = data.template ?? {
              id: `osm_custom_${Date.now()}`,
              name: `Custom ${DISPLAY_TYPES.find((d) => d.id === data.displayType)?.label}`,
              displayType: data.displayType,
              useCase: "Custom",
              thumbnailBg: `${ONSITE_TEAL}22`,
              thumbnailAccent: ONSITE_TEAL,
              platforms: data.platforms,
              status: "Active",
              lastUpdated: new Date().toISOString().split("T")[0],
              blocks: [],
            };
            patch({ template: { ...tpl, blocks: editorData.blocks } });
          }}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
