import React, { useMemo, useState } from "react";
import { X, Search } from "lucide-react";
import { PRIMARY, BORDER, MUTED, FieldRenderer } from "./FormFields";
import WhatsAppBubblePreview from "./WhatsAppBubblePreview";
import CarouselForm from "./CarouselForm";
import ListMessageForm from "./ListMessageForm";
import CollectInputForm from "./CollectInputForm";
import { TEMPLATE_STYLE_CONFIGS, COLLECT_INPUT_PRESETS } from "./data/templateStyleConfigs";

const WA_GREEN = "#25D366";

function templateSummaryText(t) {
  if (t.isCarousel) return t.body || "";
  if (t.isListMessage) return t.body || "";
  if (t.isCollectInput) return t.questionMessage || "";
  return t.body || "";
}

function TemplateCard({ template, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, cursor: "pointer", background: "#fff", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = WA_GREEN)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{template.name}</div>
      <p style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {templateSummaryText(template)}
      </p>
    </div>
  );
}

function BrowseView({ styleLabel, templates, onSelect, onCreateNew, onClose }) {
  const [search, setSearch] = useState("");
  const filtered = templates.filter((t) => (t.name || "").toLowerCase().includes(search.toLowerCase()) || templateSummaryText(t).toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Select a {styleLabel} template</h2>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <X size={16} style={{ color: "#64748B" }} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search templates…"
            style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", boxSizing: "border-box" }} />
        </div>
        <button type="button" onClick={onCreateNew} style={{ padding: "8px 16px", background: PRIMARY, color: "#fff", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
          + Create new
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: MUTED, padding: "40px 0", fontSize: 13 }}>No templates found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {filtered.map((t) => <TemplateCard key={t.id} template={t} onSelect={() => onSelect(t)} />)}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 20px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: MUTED }}>{filtered.length} template{filtered.length !== 1 ? "s" : ""} found</span>
        <button onClick={onClose} style={{ padding: "7px 18px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer", color: "#475569" }}>Cancel</button>
      </div>
    </div>
  );
}

function GenericEditForm({ fields, draft, onPatch }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {fields.map((field) => <FieldRenderer key={field.key} field={field} draft={draft} onPatch={onPatch} />)}
    </div>
  );
}

export default function UnifiedTemplateModal({ open, styleId, styleLabel, presetInputType, initialTemplate, customTemplates = [], onSave, onClose }) {
  const config = TEMPLATE_STYLE_CONFIGS[styleId];
  const [mode, setMode] = useState(initialTemplate ? "edit" : "browse");
  const [draft, setDraft] = useState(() => initialTemplate || config?.defaultDraft || {});

  const allTemplates = useMemo(() => [...(config?.mockTemplates || []), ...customTemplates], [config, customTemplates]);

  if (!open || !config) return null;

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const openBlankDraft = () => {
    let blank = config.defaultDraft;
    if (styleId === "collect_input" && presetInputType && COLLECT_INPUT_PRESETS[presetInputType]) {
      blank = { ...blank, ...COLLECT_INPUT_PRESETS[presetInputType] };
    }
    setDraft(blank);
    setMode("edit");
  };

  const openExisting = (tpl) => {
    setDraft(tpl);
    setMode("edit");
  };

  const handleSave = (finalDraft) => onSave(finalDraft || draft);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "min(92vw, 900px)", maxHeight: "90vh", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", display: "flex" }}>
        {mode === "browse" ? (
          <div style={{ width: "100%" }}>
            <BrowseView styleLabel={styleLabel} templates={allTemplates} onSelect={openExisting} onCreateNew={openBlankDraft} onClose={onClose} />
          </div>
        ) : config.fields ? (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16, borderRight: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{initialTemplate ? "Edit Template" : `Create ${styleLabel} Template`}</div>
              <GenericEditForm fields={config.fields} draft={draft} onPatch={patch} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: 9, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={() => handleSave()} style={{ flex: 2, padding: 9, border: "none", borderRadius: 8, background: WA_GREEN, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Save</button>
              </div>
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <WhatsAppBubblePreview draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: "0 0 55%", overflowY: "auto", padding: 24, borderRight: `1px solid ${BORDER}` }}>
              {styleId === "carousel" && <CarouselForm initial={draft.isCarousel ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "list" && <ListMessageForm initial={draft.isListMessage ? draft : null} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
              {styleId === "collect_input" && <CollectInputForm initial={draft.isCollectInput ? draft : null} defaultInputType={draft.inputType} onChange={setDraft} onApply={handleSave} onCancel={onClose} />}
            </div>
            <div style={{ flex: "0 0 45%", background: "#F8FAFC", padding: 20, overflowY: "auto" }}>
              <WhatsAppBubblePreview draft={draft} previewKind={config.previewKind} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
