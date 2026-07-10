import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import {
  INAPP_VIOLET,
  INAPP_DISPLAY_TYPES,
  INAPP_PLATFORM_OPTIONS,
  INAPP_TRIGGER_TYPES,
  NUDGE_PLACEMENTS,
  ANIMATIONS,
  INAPP_DELIVERY_OPTIONS,
  INAPP_TEMPLATE_STYLE_CONFIGS,
  defaultInAppNodeData,
} from "./data/mockData";
import { getInAppTemplateAnalytics, INAPP_ANALYTICS_METRICS } from "./data/mockInAppAnalytics";
import InAppTemplateEditorModal from "./TemplateEditorModal";
import UnifiedTemplateModal from "../WhatsAppNode/UnifiedTemplateModal";
import InAppPreview from "./InAppPreview";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const PRIMARY = INAPP_VIOLET;

// ── Shared UI ──────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 40, height: 22, borderRadius: 11, background: on ? PRIMARY : "#E2E8F0", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, flexShrink: 0, transition: "background 0.2s" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "transform 0.2s", transform: on ? "translateX(18px)" : "translateX(0)" }} />
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer" }}>
      {options.map((o) => <option key={typeof o === "string" ? o : o.id} value={typeof o === "string" ? o : o.id}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}

// ── Display Type Picker ────────────────────────────────────────
function DisplayTypePicker({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>Choose Display Type</div>
      <div style={{ fontSize: 11, color: "#64748B", marginBottom: 16 }}>Select the format of your in-app message</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {INAPP_DISPLAY_TYPES.map((dt) => {
          const isHovered = hovered === dt.id;
          return (
            <div key={dt.id} onClick={() => onSelect(dt.id)} onMouseEnter={() => setHovered(dt.id)} onMouseLeave={() => setHovered(null)}
              style={{
                position: "relative", display: "flex", alignItems: "flex-start", gap: 12, padding: 12,
                border: `${isHovered ? "2px" : "1.5px"} solid ${isHovered ? PRIMARY : BORDER}`,
                borderRadius: 10, cursor: "pointer", background: isHovered ? "#F5F3FF" : "#fff",
              }}>
              {dt.popular && (
                <div style={{ position: "absolute", top: 6, right: 8, fontSize: 8, fontWeight: 700, color: "#065F46", background: "#DCFCE7", borderRadius: 4, padding: "1px 5px" }}>Popular</div>
              )}
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{dt.emoji}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{dt.label}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, lineHeight: 1.4 }}>{dt.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template Tab ───────────────────────────────────────────────
function TemplateTab({ data, patch }) {
  const [showPicker,  setShowPicker]  = useState(false);
  const [showEditor,  setShowEditor]  = useState(false);
  const [editorInitialTemplate, setEditorInitialTemplate] = useState(null);
  const [customTemplatesByType, setCustomTemplatesByType] = useState({});

  const { displayType, template } = data;

  const openCreate = () => { setEditorInitialTemplate(null); setShowEditor(true); };
  const openEdit   = (tpl) => { setEditorInitialTemplate(tpl); setShowEditor(true); };

  if (showEditor) {
    return (
      <InAppTemplateEditorModal
        displayType={displayType}
        template={editorInitialTemplate}
        onSave={(updated) => {
          const base = editorInitialTemplate ?? { id: `ia_new_${Date.now()}`, name: "Custom Template", displayType, useCase: "Custom" };
          const tpl = { ...base, ...updated, status: "Active", lastUpdated: new Date().toISOString().slice(0, 10) };
          setCustomTemplatesByType((prev) => {
            const existing = prev[displayType] || [];
            const already = existing.find((t) => t.id === tpl.id);
            return { ...prev, [displayType]: already ? existing.map((t) => (t.id === tpl.id ? tpl : t)) : [...existing, tpl] };
          });
          patch({ template: tpl });
          setShowEditor(false);
          setEditorInitialTemplate(null);
        }}
        onClose={() => { setShowEditor(false); setEditorInitialTemplate(null); }}
      />
    );
  }

  if (!displayType) {
    return <DisplayTypePicker onSelect={(dt) => { patch({ displayType: dt }); setShowPicker(true); }} />;
  }

  const dt = INAPP_DISPLAY_TYPES.find((d) => d.id === displayType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Template browse modal — hover Edit/Analytics/Select cards, real
          non-cropped preview, same shared component SMS/RCS/Push/Onsite use.
          Edit / "+ Create new" delegate out to the existing full-screen
          block editor rather than fitting a drag-and-drop canvas into the
          modal's form slot. */}
      {showPicker && (
        <UnifiedTemplateModal
          open
          styleId={displayType}
          styleLabel={dt?.label || "Template"}
          customTemplates={customTemplatesByType[displayType] || []}
          configRegistry={INAPP_TEMPLATE_STYLE_CONFIGS}
          accentColor={PRIMARY}
          PreviewComponent={InAppPreview}
          metaInsightsStyleIds={[]}
          getAnalytics={getInAppTemplateAnalytics}
          analyticsMetrics={INAPP_ANALYTICS_METRICS}
          onRequestExternalEditor={(tpl) => { openEdit(tpl); setShowPicker(false); }}
          onSave={(t) => { patch({ template: t, displayType: t.displayType }); setShowPicker(false); }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Display type chip */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "#F5F3FF", borderRadius: 20, border: `1px solid #DDD6FE`, alignSelf: "flex-start" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#5B21B6" }}>{dt?.emoji} {dt?.label}</span>
        <span style={{ fontSize: 11, color: MUTED }}>·</span>
        <span onClick={() => patch({ displayType: null, template: null })} style={{ fontSize: 11, color: PRIMARY, cursor: "pointer", fontWeight: 500 }}>Change</span>
      </div>

      {/* Template selection */}
      {!template ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowPicker(true)} style={{
            flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
            background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>☰</div>
            Prebuilt templates
          </button>
          <button onClick={openCreate} style={{
            flex: 1, padding: "14px 10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10,
            background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = "#475569"; }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>+</div>
            Start from scratch
          </button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Real content preview — sized to fit, not cropped */}
          <div style={{ padding: 10 }}>
            <InAppPreview draft={template} />
          </div>
          {/* Info + actions */}
          <div style={{ padding: "8px 12px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{template.name}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{template.useCase}</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 8, background: "#DCFCE7", color: "#065F46", fontWeight: 700, flexShrink: 0 }}>{template.status || "Active"}</span>
          </div>
          <div style={{ borderTop: `1px solid ${BORDER}`, display: "flex" }}>
            <button onClick={() => openEdit(template)} style={{ flex: 1, padding: "8px", background: "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, color: PRIMARY }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F5F3FF"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>Edit Template</button>
            <div style={{ width: 1, background: BORDER }} />
            <button onClick={() => patch({ template: null })} style={{ flex: 1, padding: "8px", background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#EF4444" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#FEF2F2"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>× Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ───────────────────────────────────────────────
function SettingsTab({ data, patch }) {
  const {
    platforms = ["android", "ios"],
    mirrorPlatforms = true,
    triggerType = "screen_load",
    triggerEvent = "",
    triggerDelay = 0,
    displayType,
    placement = "bottom",
    bgType = "color",
    bgColor = "#FFFFFF",
    bgImageUrl = "",
    entryAnimation = "none",
    exitAnimation = "none",
    showCloseButton = true,
    closeButtonStyle = "black_filled",
  } = data;

  const togglePlatform = (pid) => {
    if (platforms.includes(pid)) {
      if (platforms.length === 1) return;
      patch({ platforms: platforms.filter((p) => p !== pid) });
    } else {
      patch({ platforms: [...platforms, pid] });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* Platform */}
      <div>
        <Label>Platform</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {INAPP_PLATFORM_OPTIONS.map((opt) => {
            const active = platforms.includes(opt.id);
            return (
              <button key={opt.id} onClick={() => togglePlatform(opt.id)} style={{
                flex: 1, padding: "8px 6px", border: `1.5px solid ${active ? PRIMARY : BORDER}`,
                borderRadius: 8, background: active ? "#F5F3FF" : "#fff",
                color: active ? PRIMARY : "#64748B", fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
              }}>
                {opt.icon} {opt.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Toggle on={mirrorPlatforms} onChange={(v) => patch({ mirrorPlatforms: v })} />
          <span style={{ fontSize: 12, color: "#475569" }}>Mirror platforms (same template for Android & iOS)</span>
        </div>
      </div>

      {/* Trigger */}
      <div>
        <Label>Trigger</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {INAPP_TRIGGER_TYPES.map((t) => {
            const active = triggerType === t.id;
            return (
              <div key={t.id} onClick={() => patch({ triggerType: t.id })} style={{
                display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px",
                border: `1.5px solid ${active ? PRIMARY : BORDER}`, borderRadius: 8, cursor: "pointer",
                background: active ? "#F5F3FF" : "#fff",
              }}>
                <div style={{ marginTop: 2, width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? PRIMARY : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {active && <div style={{ width: 6, height: 6, borderRadius: "50%", background: PRIMARY }} />}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{t.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
        {triggerType === "custom_event" && (
          <input value={triggerEvent} onChange={(e) => patch({ triggerEvent: e.target.value })} placeholder="Event name (e.g. add_to_cart)"
            style={{ marginTop: 8, width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        )}
      </div>

      {/* Trigger delay */}
      <div>
        <Label>Trigger Delay</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" min={0} value={triggerDelay} onChange={(e) => patch({ triggerDelay: parseInt(e.target.value) || 0 })}
            style={{ width: 70, padding: "7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
          <span style={{ fontSize: 12, color: MUTED }}>{triggerDelay === 0 ? "seconds (immediately)" : "seconds after trigger"}</span>
        </div>
      </div>

      {/* Placement — Nudge only */}
      {displayType === "nudge" && (
        <div>
          <Label>Nudge Placement</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {NUDGE_PLACEMENTS.map((p) => (
              <button key={p.id} onClick={() => patch({ placement: p.id })} style={{
                flex: 1, padding: "8px", border: `1.5px solid ${placement === p.id ? PRIMARY : BORDER}`,
                borderRadius: 8, background: placement === p.id ? "#F5F3FF" : "#fff",
                color: placement === p.id ? PRIMARY : "#64748B", fontSize: 12, fontWeight: placement === p.id ? 600 : 400, cursor: "pointer",
              }}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Background */}
      <div>
        <Label>Background</Label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {[{ id: "color", label: "Color" }, { id: "image", label: "Image URL" }].map((opt) => (
            <button key={opt.id} onClick={() => patch({ bgType: opt.id })} style={{
              flex: 1, padding: "7px", border: `1.5px solid ${bgType === opt.id ? PRIMARY : BORDER}`,
              borderRadius: 8, background: bgType === opt.id ? "#F5F3FF" : "#fff",
              color: bgType === opt.id ? PRIMARY : "#64748B", fontSize: 11, fontWeight: bgType === opt.id ? 600 : 400, cursor: "pointer",
            }}>{opt.label}</button>
          ))}
        </div>
        {bgType === "color" ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="color" value={bgColor} onChange={(e) => patch({ bgColor: e.target.value })}
              style={{ width: 40, height: 32, border: `1px solid ${BORDER}`, borderRadius: 6, cursor: "pointer", padding: 2 }} />
            <span style={{ fontSize: 12, color: "#475569", fontFamily: "monospace" }}>{bgColor}</span>
          </div>
        ) : (
          <input value={bgImageUrl} onChange={(e) => patch({ bgImageUrl: e.target.value })} placeholder="https://cdn.example.com/banner.png"
            style={{ width: "100%", padding: "7px 10px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        )}
        <div style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>Accepted formats: PNG, JPEG, JPG, GIF</div>
      </div>

      {/* Animation */}
      <div>
        <Label>Animation</Label>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Entry</div>
            <SelectField value={entryAnimation} onChange={(v) => patch({ entryAnimation: v })} options={ANIMATIONS} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 4 }}>Exit</div>
            <SelectField value={exitAnimation} onChange={(v) => patch({ exitAnimation: v })} options={ANIMATIONS} />
          </div>
        </div>
      </div>

      {/* Close button */}
      <div>
        <Label>Close Button</Label>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Toggle on={showCloseButton} onChange={(v) => patch({ showCloseButton: v })} />
          <span style={{ fontSize: 12, color: "#475569" }}>Show close button</span>
        </div>
        {showCloseButton && (
          <SelectField
            value={closeButtonStyle}
            onChange={(v) => patch({ closeButtonStyle: v })}
            options={[
              { id: "black_filled", label: "Black Filled" },
              { id: "white_filled", label: "White Filled" },
              { id: "black_outline", label: "Black Outline" },
            ]}
          />
        )}
      </div>
    </div>
  );
}

// ── Output Tab ─────────────────────────────────────────────────
const BRANCH_OPTIONS = INAPP_DELIVERY_OPTIONS.filter((o) => o.id !== "next_step");

function OutputTab({ data, patch }) {
  const outputCfg       = data?.outputConfig ?? { routingMode: "next_step", deliveryOutputs: [], wiredPorts: [] };
  const routingMode     = outputCfg.routingMode ?? "next_step";
  const selectedBranches = outputCfg.deliveryOutputs ?? [];

  const setMode = (mode) => {
    patch({ outputConfig: { ...outputCfg, routingMode: mode, deliveryOutputs: mode === "next_step" ? [] : (selectedBranches.length ? selectedBranches : ["shown"]) } });
  };

  const toggleBranch = (id) => {
    const next = selectedBranches.includes(id) ? selectedBranches.filter((x) => x !== id) : [...selectedBranches, id];
    patch({ outputConfig: { ...outputCfg, deliveryOutputs: next } });
  };

  const radioStyle = (active) => ({
    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px",
    border: `1.5px solid ${active ? PRIMARY : BORDER}`,
    borderRadius: 10, cursor: "pointer", background: active ? "#F5F3FF" : "#fff",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, margin: 0, lineHeight: 1.6 }}>
        Choose how this node routes users after the message is shown.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={radioStyle(routingMode === "next_step")} onClick={() => setMode("next_step")}>
          <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "next_step" ? PRIMARY : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {routingMode === "next_step" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: PRIMARY }} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Next Step</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>All users proceed to the same next node.</div>
          </div>
        </div>

        <div style={radioStyle(routingMode === "interaction")} onClick={() => setMode("interaction")}>
          <div style={{ marginTop: 2, width: 15, height: 15, borderRadius: "50%", border: `2px solid ${routingMode === "interaction" ? PRIMARY : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {routingMode === "interaction" && <div style={{ width: 7, height: 7, borderRadius: "50%", background: PRIMARY }} />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>Interaction-based</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>Branch users based on how they interact with the message.</div>
          </div>
        </div>
      </div>

      {routingMode === "interaction" && (
        <div>
          <Label>Select Interaction Branches</Label>
          <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            {BRANCH_OPTIONS.map((opt, i) => {
              const selected = selectedBranches.includes(opt.id);
              return (
                <div key={opt.id} onClick={() => toggleBranch(opt.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: i < BRANCH_OPTIONS.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: selected ? "#F5F3FF" : "#fff", cursor: "pointer",
                }}>
                  <input type="checkbox" readOnly checked={selected} style={{ accentColor: PRIMARY, width: 14, height: 14 }} />
                  <span style={{ fontSize: 13, color: "#0F172A" }}>{opt.label}</span>
                </div>
              );
            })}
          </div>
          {selectedBranches.length === 0 && (
            <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Select at least one interaction to create output ports.</p>
          )}
        </div>
      )}

      <div style={{ background: "#F8FAFC", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#475569" }}>Output ports on canvas</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
          {routingMode === "next_step" ? 1 : Math.max(selectedBranches.length, 1)}
        </span>
      </div>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────
const TABS = [
  { id: "template", label: "Template" },
  { id: "settings", label: "Settings" },
  { id: "output",   label: "Output"   },
];

export default function InAppRightPanel({ node, updateNodeData, removeNode }) {
  const [tab, setTab] = useState("template");
  const data  = node?.data  ?? defaultInAppNodeData;
  const patch = (p) => updateNodeData(node.id, p);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: PRIMARY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Smartphone size={14} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={data.label ?? "InApp Message"}
              onChange={(e) => patch({ label: e.target.value })}
              style={{ width: "100%", fontSize: 13, fontWeight: 700, color: "#0F172A", border: "none", outline: "none", background: "transparent", padding: 0 }}
            />
            <div style={{ fontSize: 10, color: MUTED }}>InApp · Android & iOS</div>
          </div>
          <button onClick={() => removeNode(node.id)} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>Delete</button>
        </div>
        {/* Tab row */}
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: -10 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "7px 4px", fontSize: 11, fontWeight: tab === t.id ? 700 : 400,
              background: "none", border: "none", cursor: "pointer",
              color: tab === t.id ? PRIMARY : MUTED,
              borderBottom: `2px solid ${tab === t.id ? PRIMARY : "transparent"}`,
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", position: "relative" }}>
        {tab === "template" && <TemplateTab data={data} patch={patch} />}
        {tab === "settings" && <SettingsTab data={data} patch={patch} />}
        {tab === "output"   && <OutputTab   data={data} patch={patch} />}
      </div>
    </div>
  );
}
