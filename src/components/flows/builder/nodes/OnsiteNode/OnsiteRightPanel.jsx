import React, { useState } from "react";
import {
  Monitor, Plus, X, Info, LogIn, MousePointerClick, LogOut, Sparkles, Check,
} from "lucide-react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import {
  ONSITE_TEAL, DISPLAY_TYPES,
  PLATFORM_OPTIONS, TRIGGER_TYPES, ONSITE_DELIVERY_OPTIONS, WEB_EVENTS, URL_OPERATORS,
  defaultOnsiteNodeData,
} from "./data/mockData";
import { ONSITE_TEMPLATE_LIBRARY, loadSavedTemplates, saveTemplateToLibrary } from "./data/templateLibrary";
import OnsiteTemplateEditorModal from "./TemplateEditorModal";
import OnsiteTemplateLibrary from "./OnsiteTemplateLibrary";
import OnsitePreview from "./OnsitePreview";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const INK    = "#0F172A";

const TRIGGER_ICONS = { page_load: LogIn, custom_event: MousePointerClick, exit_intent: LogOut };

const inputStyle = { padding: "6px 9px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 7, outline: "none", background: "#fff", boxSizing: "border-box" };

// ── Shared helpers ─────────────────────────────────────────────
function Toggle({ on, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!on)}
      style={{ width: 34, height: 19, borderRadius: 10, background: on && !disabled ? ONSITE_TEAL : "#E2E8F0", cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s", opacity: disabled ? 0.6 : 1 }}
    >
      <div style={{ width: 15, height: 15, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on && !disabled ? "translateX(15px)" : "translateX(0)" }} />
    </div>
  );
}

function Helper({ children }) {
  return <div style={{ fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>{children}</div>;
}

function Radio({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: disabled ? MUTED : INK, cursor: disabled ? "not-allowed" : "pointer" }}>
      <input type="radio" checked={checked} onChange={onChange} disabled={disabled} style={{ accentColor: ONSITE_TEAL, margin: 0 }} />
      {label}
    </label>
  );
}

// Numbered section, all stacked in one scroll — no tabs.
function Step({ n, title, required, aside, children }) {
  return (
    <div style={{ padding: "16px 16px 18px", borderBottom: `1px solid #F1F5F9` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: `${ONSITE_TEAL}18`, color: ONSITE_TEAL, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: INK, flex: 1 }}>
          {title}{required && <span style={{ color: "#EF4444" }}>*</span>}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

// ── Template card ──────────────────────────────────────────────
function TemplatePreviewCard({ template, onEdit, onBrowse, onClear }) {
  return (
    <div style={{ border: `1.5px solid ${ONSITE_TEAL}44`, borderRadius: 10, overflow: "hidden", background: `${ONSITE_TEAL}08` }}>
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{template.name}</div>
          <div style={{ fontSize: 10, color: MUTED }}>{template.useCase}</div>
        </div>
        <button onClick={onClear} title="Remove template" style={{ width: 20, height: 20, borderRadius: 4, background: "rgba(0,0,0,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={10} color="#64748B" />
        </button>
      </div>
      <div style={{ padding: "0 12px 12px" }}>
        <OnsitePreview draft={template} />
      </div>
      <div style={{ padding: "0 12px 12px", display: "flex", gap: 8 }}>
        <button onClick={onBrowse} style={{ flex: 1, padding: "8px 0", background: "#fff", color: ONSITE_TEAL, border: `1px solid ${ONSITE_TEAL}`, borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Change
        </button>
        <button onClick={onEdit} style={{ flex: 1, padding: "8px 0", background: ONSITE_TEAL, color: "#fff", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
          Edit Template
        </button>
      </div>
    </div>
  );
}

// ── Chips input (Enter or comma-paste adds chips) ──────────────
function ChipsInput({ values, onChange }) {
  const [draft, setDraft] = useState("");
  const add = (raw) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean).filter((s) => !values.includes(s));
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 5, border: `1px solid ${BORDER}`, borderRadius: 7, background: "#fff", minHeight: 32 }}>
      {values.map((v) => (
        <span key={v} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "2px 4px 2px 8px", borderRadius: 5, background: `${ONSITE_TEAL}14`, color: "#0F766E", fontWeight: 600 }}>
          {v}
          <button onClick={() => onChange(values.filter((x) => x !== v))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <X size={11} color="#0F766E" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && draft.trim()) { e.preventDefault(); add(draft); }
          if (e.key === "Backspace" && !draft && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={values.length ? "" : "/checkout, sale… press Enter"}
        style={{ flex: 1, minWidth: 90, border: "none", outline: "none", fontSize: 12, padding: "2px 4px" }}
      />
    </div>
  );
}

function ruleMatches(rule, url) {
  const u = url.toLowerCase();
  const hit = (v) => {
    const s = v.toLowerCase();
    switch (rule.operator) {
      case "does not contain": return !u.includes(s);
      case "starts with":      return u.startsWith(s);
      case "ends with":        return u.endsWith(s);
      case "is exactly":       return u === s;
      case "matches regex":    try { return new RegExp(v, "i").test(url); } catch { return false; }
      default:                 return u.includes(s);
    }
  };
  // Multiple chips in one rule: any chip satisfies it ("does not contain" needs all).
  return rule.operator === "does not contain" ? rule.values.every(hit) : rule.values.some(hit);
}

// ── Page conditions ────────────────────────────────────────────
function PageConditions({ value, onChange }) {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [testUrl, setTestUrl] = useState("");
  const [result, setResult] = useState(null);
  const rules = value.rules.length ? value.rules : [{ operator: "contains", values: [] }];
  const setRules = (next) => { onChange({ ...value, rules: next }); setResult(null); };

  const runTest = () => {
    const active = rules.map((r, i) => ({ r, i })).filter(({ r }) => r.values.length);
    if (!testUrl.trim() || !active.length) return;
    const failed = active.filter(({ r }) => !ruleMatches(r, testUrl.trim()));
    const ok = value.match === "any" ? failed.length < active.length : failed.length === 0;
    setResult(ok ? { ok } : { ok, msg: value.match === "any" ? "no rule matches" : `fails rule ${failed[0].i + 1}` });
  };

  return (
    <div style={{ marginTop: 12 }}>
      {bannerOpen && (
        <div style={{ position: "relative", padding: "9px 28px 9px 10px", background: "#EFF6FF", borderRadius: 8, fontSize: 11, color: "#1E3A8A", lineHeight: 1.5, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>More flexible page targeting</div>
          Add several URLs or keywords per rule, choose Any of / All of, and test a URL below.
          <button onClick={() => setBannerOpen(false)} style={{ position: "absolute", top: 7, right: 7, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <X size={12} color="#1E3A8A" />
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>If URL</span>
        <div style={{ display: "flex", border: `1px solid ${BORDER}`, borderRadius: 6, overflow: "hidden" }}>
          {[{ id: "all", label: "All of" }, { id: "any", label: "Any of" }].map((m) => (
            <button
              key={m.id}
              onClick={() => { onChange({ ...value, rules, match: m.id }); setResult(null); }}
              style={{ padding: "3px 9px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", background: value.match === m.id ? `${ONSITE_TEAL}18` : "#fff", color: value.match === m.id ? "#0F766E" : "#64748B" }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ borderLeft: `2px solid ${BORDER}`, paddingLeft: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        {rules.map((rule, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select
                value={rule.operator}
                onChange={(e) => setRules(rules.map((r, j) => (j === i ? { ...r, operator: e.target.value } : r)))}
                style={{ ...inputStyle, flex: 1 }}
              >
                {URL_OPERATORS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              {rules.length > 1 && (
                <button onClick={() => setRules(rules.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                  <X size={13} color={MUTED} />
                </button>
              )}
            </div>
            <ChipsInput values={rule.values} onChange={(vals) => setRules(rules.map((r, j) => (j === i ? { ...r, values: vals } : r)))} />
          </div>
        ))}
      </div>
      <button
        onClick={() => setRules([...rules, { operator: "contains", values: [] }])}
        style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: ONSITE_TEAL, background: "#fff", border: `1px solid ${ONSITE_TEAL}`, borderRadius: 6, cursor: "pointer" }}
      >
        <Plus size={12} /> Filter
      </button>

      <div style={{ marginTop: 12, padding: 10, background: "#F8FAFC", borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Check a URL</div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={testUrl} onChange={(e) => { setTestUrl(e.target.value); setResult(null); }} onKeyDown={(e) => e.key === "Enter" && runTest()} placeholder="https://store.com/checkout" style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
          <button onClick={runTest} style={{ padding: "0 12px", fontSize: 12, fontWeight: 600, border: "none", borderRadius: 7, background: INK, color: "#fff", cursor: "pointer" }}>Test</button>
        </div>
        {result && (
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: result.ok ? "#047857" : "#B91C1C" }}>
            {result.ok ? "✓ Shows on this URL" : `✕ Won't show: ${result.msg}`}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Delivery control row ───────────────────────────────────────
function DeliveryRow({ on, onToggle, label, disabled, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Toggle on={on} onChange={onToggle} disabled={disabled} />
        <span style={{ fontSize: 12.5, color: disabled ? MUTED : INK, flex: 1 }}>{label}</span>
      </div>
      {on && !disabled && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, paddingLeft: 44 }}>{children}</div>}
      {hint && <div style={{ paddingLeft: 44 }}><Helper>{hint}</Helper></div>}
    </div>
  );
}

// ── Output (branching) ─────────────────────────────────────────
function OutputSection({ data, patch, formCapable }) {
  const outputCfg   = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode = outputCfg.routingMode ?? "next_step";

  const setRouting = (mode) => patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : ["shown"] } });
  const toggleDelivery = (id) => {
    const cur  = outputCfg.deliveryOutputs ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { id: "next_step", label: "Next Step",         desc: "All shoppers move to the next node" },
          { id: "delivery",  label: "Interaction-based", desc: "Branch on how the shopper responded" },
        ].map((mode) => (
          <label key={mode.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", border: `1.5px solid ${routingMode === mode.id ? ONSITE_TEAL : BORDER}`, borderRadius: 8, cursor: "pointer", background: routingMode === mode.id ? `${ONSITE_TEAL}0A` : "#fff" }}>
            <input type="radio" checked={routingMode === mode.id} onChange={() => setRouting(mode.id)} style={{ marginTop: 3, accentColor: ONSITE_TEAL }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{mode.label}</div>
              <div style={{ fontSize: 11, color: MUTED }}>{mode.desc}</div>
            </div>
          </label>
        ))}
      </div>

      {routingMode === "delivery" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {ONSITE_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step" && (!o.smartOnly || formCapable)).map((opt) => {
            const checked = (outputCfg.deliveryOutputs ?? []).includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => toggleDelivery(opt.id)}
                style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", fontSize: 11.5, fontWeight: 600, borderRadius: 14, cursor: "pointer", border: `1.5px solid ${checked ? ONSITE_TEAL : BORDER}`, background: checked ? `${ONSITE_TEAL}12` : "#fff", color: checked ? "#0F766E" : "#475569" }}
              >
                {checked && <Check size={11} />} {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </>
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

  const [libraryTab,  setLibraryTab]  = useState(null); // null = closed | "library" | "scratch"
  const [showEditor,  setShowEditor]  = useState(false);
  const [editorInitialTemplate, setEditorInitialTemplate] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState(loadSavedTemplates);

  if (!resolvedNode) return null;

  const data  = resolvedNode.data ?? {};
  const patch = (p) => resolvedUpdateNodeData(resolvedNode.id, p);
  const dt    = DISPLAY_TYPES.find((d) => d.id === data.displayType);

  // Read-time migration of older node shapes (triggerDelay / pageRules / app platforms).
  const platforms   = data.platforms ?? ["web", "mobile_web"];
  const legacyApps  = platforms.filter((p) => p === "android" || p === "ios");
  const triggerType = data.triggerType === "session_start" ? "page_load" : (data.triggerType ?? "page_load");
  const triggerTime = data.triggerTime ?? (data.triggerDelay > 0
    ? { mode: "delay", value: data.triggerDelay, unit: "sec" }
    : defaultOnsiteNodeData.triggerTime);
  const pageConditions = data.pageConditions ?? {
    match: "all",
    rules: (data.pageRules ?? []).map((r) => ({ operator: r.operator, values: r.value ? [r.value] : [] })),
  };
  const delivery    = { ...defaultOnsiteNodeData.delivery, ...data.delivery };
  const smartPopup  = !!data.smartPopup;
  const formCapable = smartPopup || (data.template?.blocks ?? []).some((b) => b.type === "form");

  const togglePlatform = (pid) => {
    const next = platforms.includes(pid) ? platforms.filter((x) => x !== pid) : [...platforms, pid];
    if (next.some((p) => p === "web" || p === "mobile_web")) patch({ platforms: next });
  };
  const setTime     = (p) => patch({ triggerTime: { ...triggerTime, ...p } });
  const setDelivery = (key, p) => patch({ delivery: { ...delivery, [key]: { ...delivery[key], ...p } } });

  const timeHelper = {
    immediate: "This message shows as soon as the page has loaded.",
    delay:     `After page load, wait for ${triggerTime.value || "N"} ${triggerTime.unit === "min" ? "min(s)" : "sec(s)"}.`,
    scroll:    `Shows once the shopper scrolls ${triggerTime.value || "N"}% of the page.`,
  }[triggerTime.mode];

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
              style={{ fontSize: 14, fontWeight: 700, color: INK, border: "none", outline: "none", background: "transparent", flex: 1, padding: 0 }}
            />
            <button
              onClick={() => resolvedRemoveNode(resolvedNode.id)}
              style={{ padding: "3px 8px", fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, cursor: "pointer" }}
            >
              Delete
            </button>
          </div>
          <div style={{ fontSize: 11, color: MUTED, paddingLeft: 36 }}>
            Onsite · {dt ? `${dt.emoji} ${dt.label}` : "Not configured"}{smartPopup && " · Smart Pop-up"}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* 1 — Platforms */}
          <Step n={1} title="Target platforms" required>
            <div style={{ display: "flex", gap: 18 }}>
              {PLATFORM_OPTIONS.map((p) => (
                <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: INK, cursor: "pointer" }}>
                  <input type="checkbox" checked={platforms.includes(p.id)} onChange={() => togglePlatform(p.id)} style={{ accentColor: ONSITE_TEAL, margin: 0 }} />
                  {p.label}
                </label>
              ))}
            </div>
            {legacyApps.length > 0 && (
              <div style={{ marginTop: 10, padding: "7px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 7, fontSize: 11, color: "#92400E", lineHeight: 1.45 }}>
                This node still targets {legacyApps.map((p) => (p === "ios" ? "iOS" : "Android")).join(" & ")}. Use the In-App node for app messages.
              </div>
            )}
          </Step>

          {/* 2 — Template */}
          <Step n={2} title="Select template" required>
            {data.template ? (
              <TemplatePreviewCard
                template={data.template}
                onBrowse={() => setLibraryTab("library")}
                onEdit={() => { setEditorInitialTemplate(data.template); setShowEditor(true); }}
                onClear={() => patch({ template: null, displayType: null })}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => setLibraryTab("library")}
                  style={{ padding: "12px 12px", border: `1.5px dashed ${ONSITE_TEAL}`, borderRadius: 9, background: `${ONSITE_TEAL}0A`, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div style={{ display: "flex", flexShrink: 0 }}>
                    {DISPLAY_TYPES.map((d, i) => (
                      <span key={d.id} style={{ width: 26, height: 26, borderRadius: "50%", background: "#fff", border: `1.5px solid ${ONSITE_TEAL}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginLeft: i ? -8 : 0 }}>{d.emoji}</span>
                    ))}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: ONSITE_TEAL }}>Browse template library</div>
                    <div style={{ fontSize: 11, color: `${ONSITE_TEAL}aa` }}>
                      {ONSITE_TEMPLATE_LIBRARY.length} popups, banners & nudges{savedTemplates.length ? ` · ${savedTemplates.length} saved` : ""}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setLibraryTab("scratch")}
                  style={{ padding: "10px 12px", border: `1.5px solid ${BORDER}`, borderRadius: 9, background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ONSITE_TEAL; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Plus size={14} color="#64748B" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>Start from scratch</div>
                    <div style={{ fontSize: 11, color: MUTED }}>Blank popup, banner or nudge</div>
                  </div>
                </button>
              </div>
            )}
          </Step>

          {/* 3 — Smart Pop-up */}
          <Step n={3} title="Smart Pop-up" aside={<span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: "#FEF3C7", color: "#92400E" }}>FASTRR EXCLUSIVE</span>}>
            <label
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 12px", borderRadius: 9, cursor: "pointer", border: `1.5px solid ${smartPopup ? ONSITE_TEAL : BORDER}`, background: smartPopup ? `${ONSITE_TEAL}0A` : "#fff", transition: "all 0.15s" }}
            >
              <input type="checkbox" checked={smartPopup} onChange={(e) => patch({ smartPopup: e.target.checked })} style={{ accentColor: ONSITE_TEAL, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, display: "flex", alignItems: "center", gap: 5 }}>
                  <Sparkles size={13} color={ONSITE_TEAL} /> Prefill shopper details
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 3, lineHeight: 1.5 }}>
                  Asks for name and phone number. When the browser recognises the shopper, both fields arrive prefilled, so they only confirm.
                </div>
              </div>
            </label>
            {smartPopup && (
              <Helper>Name and phone fields are added to the template, and a <b>Form Submitted</b> branch is available under Output.</Helper>
            )}
          </Step>

          {/* 4 — Trigger */}
          <Step n={4} title="When to show" required>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TRIGGER_TYPES.map((tt) => {
                const active   = triggerType === tt.id;
                const disabled = tt.id === "exit_intent" && !platforms.includes("web");
                const Icon     = TRIGGER_ICONS[tt.id];
                return (
                  <div
                    key={tt.id}
                    onClick={() => !disabled && patch({ triggerType: tt.id })}
                    title={disabled ? "Exit intent needs desktop Web" : undefined}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 9, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, border: `1.5px solid ${active ? ONSITE_TEAL : BORDER}`, background: active ? `${ONSITE_TEAL}0A` : "#fff", transition: "all 0.15s" }}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: active ? ONSITE_TEAL : "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={15} color={active ? "#fff" : "#64748B"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{tt.label}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{tt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {triggerType === "custom_event" && (
              <div style={{ marginTop: 12, padding: 10, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 6 }}>If shopper performs</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: INK, whiteSpace: "nowrap" }}>Has executed</span>
                  <select value={data.triggerEvent || ""} onChange={(e) => patch({ triggerEvent: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
                    <option value="" disabled>Select an event</option>
                    {WEB_EVENTS.map((ev) => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                </div>
                <Helper>Events sent via the Data API or any server-side source can't trigger an onsite message.</Helper>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: INK, marginBottom: 8 }}>
                {triggerType === "custom_event" ? "Then show the message" : "Trigger time"}
              </div>
              {triggerType === "exit_intent" ? (
                <Helper>Shows the moment the shopper moves to leave. No trigger time needed.</Helper>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 14 }}>
                    <Radio checked={triggerTime.mode === "immediate"} onChange={() => setTime({ mode: "immediate" })} label="Immediately" />
                    <Radio checked={triggerTime.mode === "delay"} onChange={() => setTime({ mode: "delay", value: 5, unit: "sec" })} label="After delay" />
                    {triggerType === "page_load" && (
                      <Radio checked={triggerTime.mode === "scroll"} onChange={() => setTime({ mode: "scroll", value: 50, unit: "pct" })} label="After scroll" />
                    )}
                  </div>
                  {triggerTime.mode === "delay" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
                      <span style={{ fontSize: 12, color: "#475569" }}>Wait for</span>
                      <input type="number" min={1} value={triggerTime.value} onChange={(e) => setTime({ value: Math.max(1, parseInt(e.target.value, 10) || 1) })} style={{ ...inputStyle, width: 64 }} />
                      <select value={triggerTime.unit} onChange={(e) => setTime({ unit: e.target.value })} style={inputStyle}>
                        <option value="sec">sec(s)</option>
                        <option value="min">min(s)</option>
                      </select>
                    </div>
                  )}
                  {triggerTime.mode === "scroll" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                      <input type="range" min={10} max={100} step={5} value={triggerTime.value} onChange={(e) => setTime({ value: +e.target.value })} style={{ flex: 1, accentColor: ONSITE_TEAL }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: ONSITE_TEAL, width: 36, textAlign: "right" }}>{triggerTime.value}%</span>
                    </div>
                  )}
                  <Helper>{triggerType === "custom_event" && triggerTime.mode === "immediate" ? "Shows as soon as the event is detected." : timeHelper}</Helper>
                </>
              )}
            </div>
          </Step>

          {/* 5 — Pages */}
          <Step n={5} title="Select pages" required>
            <div style={{ display: "flex", gap: 16 }}>
              <Radio checked={data.pageTarget !== "specific"} onChange={() => patch({ pageTarget: "all" })} label="All pages" />
              <Radio checked={data.pageTarget === "specific"} onChange={() => patch({ pageTarget: "specific", pageConditions })} label="Specific pages" />
            </div>
            {data.pageTarget === "specific"
              ? <PageConditions value={pageConditions} onChange={(v) => patch({ pageConditions: v })} />
              : <Helper>This message can show on every page of the store.</Helper>}
          </Step>

          {/* 6 — Local delivery controls */}
          <Step n={6} title="Local delivery controls">
            <DeliveryRow on={delivery.maxShows.on} onToggle={(on) => setDelivery("maxShows", { on })} label="Maximum times to show the message">
              <input type="number" min={1} max={20} value={delivery.maxShows.value} onChange={(e) => setDelivery("maxShows", { value: Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)) })} style={{ ...inputStyle, width: 64 }} />
              <span style={{ fontSize: 12, color: MUTED }}>time(s)</span>
            </DeliveryRow>
            <DeliveryRow on={delivery.minGap.on} onToggle={(on) => setDelivery("minGap", { on })} label="Minimum delay between 2 messages">
              <input type="number" min={1} value={delivery.minGap.value} onChange={(e) => setDelivery("minGap", { value: Math.max(1, parseInt(e.target.value, 10) || 1) })} style={{ ...inputStyle, width: 64 }} />
              <select value={delivery.minGap.unit} onChange={(e) => setDelivery("minGap", { unit: e.target.value })} style={inputStyle}>
                <option value="sec">sec(s)</option>
                <option value="min">min(s)</option>
                <option value="hour">hour(s)</option>
              </select>
            </DeliveryRow>
            <DeliveryRow
              on={delivery.autoDismiss.on && !smartPopup}
              onToggle={(on) => setDelivery("autoDismiss", { on })}
              disabled={smartPopup}
              label="Auto-dismiss message after"
              hint={smartPopup ? "Off while Smart Pop-up is on, so shoppers aren't cut off mid-entry." : null}
            >
              <input type="number" min={5} value={delivery.autoDismiss.seconds} onChange={(e) => setDelivery("autoDismiss", { seconds: Math.max(5, parseInt(e.target.value, 10) || 5) })} style={{ ...inputStyle, width: 64 }} />
              <span style={{ fontSize: 12, color: MUTED }}>seconds</span>
            </DeliveryRow>
          </Step>

          {/* 7 — Output */}
          <Step n={7} title="Output">
            <OutputSection data={data} patch={patch} formCapable={formCapable} />
          </Step>

          <div style={{ padding: "12px 16px 20px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: MUTED }}>
            <Info size={12} /> Changes save automatically.
          </div>
        </div>

        {libraryTab && (
          <OnsiteTemplateLibrary
            initialTab={libraryTab}
            savedTemplates={savedTemplates}
            onUse={(t) => { patch({ template: t, displayType: t.displayType, smartPopup: smartPopup || t.blocks.some((b) => b.type === "form" && b.smart) }); setLibraryTab(null); }}
            onEdit={(t) => { setEditorInitialTemplate(t); setShowEditor(true); setLibraryTab(null); }}
            onClose={() => setLibraryTab(null)}
          />
        )}
      </div>

      {showEditor && (
        <OnsiteTemplateEditorModal
          template={editorInitialTemplate}
          displayType={(editorInitialTemplate ?? data.template)?.displayType ?? data.displayType ?? "popup"}
          onSave={(editorData) => {
            const base = editorInitialTemplate ?? data.template;
            const displayType = base?.displayType ?? data.displayType ?? "popup";
            const isSaved = base?.saved;
            const tpl = {
              ...base,
              id: isSaved ? base.id : `saved_${Date.now()}`,
              name: isSaved ? base.name : base?.id?.startsWith("blank_")
                ? `Custom ${DISPLAY_TYPES.find((d) => d.id === displayType)?.label}`
                : `${base?.name ?? "Onsite template"} (custom)`,
              displayType,
              useCase: base?.useCase ?? "Custom",
              blocks: editorData.blocks,
              bgColor: editorData.bgColor,
              theme: editorData.theme,
              saved: true,
            };
            setSavedTemplates(saveTemplateToLibrary(tpl));
            patch({ template: tpl, displayType });
            setEditorInitialTemplate(null);
          }}
          onClose={() => { setShowEditor(false); setEditorInitialTemplate(null); }}
        />
      )}
    </>
  );
}
