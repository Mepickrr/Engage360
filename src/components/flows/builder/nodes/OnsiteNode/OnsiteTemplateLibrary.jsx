import React, { useMemo, useState } from "react";
import { X, Search, Pencil, Check, Sparkles, Eye } from "lucide-react";
import { ONSITE_TEAL, DISPLAY_TYPES } from "./data/mockData";
import {
  ONSITE_TEMPLATE_LIBRARY, BLANK_TEMPLATES, BLANK_DESCRIPTIONS, ONSITE_USE_CASES,
  ONSITE_CONTENT_FILTERS, templateContentTags,
} from "./data/templateLibrary";
import OnsitePreview from "./OnsitePreview";

const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const INK    = "#0F172A";

// Scaled-down live render of a template, used as the card thumbnail.
function Thumb({ template, height = 200, scale = 0.58 }) {
  return (
    <div style={{ height, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "#E2E8F0", pointerEvents: "none" }}>
      <div style={{ width: 480, flexShrink: 0, transform: `scale(${scale})` }}>
        <OnsitePreview draft={template} />
      </div>
    </div>
  );
}

function FilterGroup({ title, options, counts, selected, onToggle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, marginBottom: 8 }}>{title}</div>
      {options.map((o) => (
        <label key={o.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 12.5, color: counts[o.id] ? "#334155" : MUTED, cursor: "pointer" }}>
          <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} style={{ accentColor: ONSITE_TEAL, margin: 0 }} />
          {o.label} ({counts[o.id] || 0})
        </label>
      ))}
    </div>
  );
}

function TemplateCard({ template, onUse, onEdit, onPreview }) {
  const [hover, setHover] = useState(false);
  const dt = DISPLAY_TYPES.find((d) => d.id === template.displayType);
  const smart = template.blocks?.some((b) => b.type === "form" && b.smart);
  return (
    <div
      data-testid={`onsite-template-${template.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: "relative", border: `1.5px solid ${hover ? ONSITE_TEAL : BORDER}`, borderRadius: 10, overflow: "hidden", background: "#fff", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: hover ? "0 6px 18px rgba(15,23,42,0.08)" : "none" }}
    >
      <div style={{ position: "relative" }}>
        <Thumb template={template} />
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ONSITE_TEAL, color: "#fff" }}>{dt?.label}</span>
          {smart && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#FEF3C7", color: "#92400E", display: "flex", alignItems: "center", gap: 3 }}><Sparkles size={9} /> Smart</span>}
          {template.saved && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#E0E7FF", color: "#3730A3" }}>Saved</span>}
        </div>
        {hover && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <button onClick={() => onUse(template)} style={{ width: 150, padding: "8px 0", border: "none", borderRadius: 7, background: ONSITE_TEAL, color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Check size={13} /> Use as is
            </button>
            <button onClick={() => onEdit(template)} style={{ width: 150, padding: "8px 0", border: "none", borderRadius: 7, background: "#fff", color: INK, fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Pencil size={12} /> Customize
            </button>
            <button onClick={() => onPreview(template)} style={{ background: "none", border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={12} /> Preview
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "11px 12px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{template.name}</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{template.useCase}</div>
      </div>
    </div>
  );
}

// Illustration for the blank cards: a monitor with the message placed where it renders.
function BlankArt({ type }) {
  const slot = {
    popup:  { left: "22%", top: "22%", width: "56%", height: "50%" },
    banner: { left: "8%",  top: "10%", width: "84%", height: "16%" },
    nudge:  { left: "62%", top: "52%", width: "30%", height: "30%" },
  }[type];
  return (
    <div style={{ height: 200, background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 150, height: 100, border: "8px solid #CBD5E1", borderRadius: 10, background: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", ...slot, background: "#334155", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: ONSITE_TEAL, fontSize: 18, fontWeight: 700 }}>+</div>
        </div>
        <div style={{ width: 16, height: 14, background: "#CBD5E1" }} />
        <div style={{ width: 50, height: 7, borderRadius: 3, background: "#CBD5E1" }} />
      </div>
    </div>
  );
}

export default function OnsiteTemplateLibrary({ initialTab = "library", savedTemplates = [], onUse, onEdit, onClose }) {
  const [tab, setTab]           = useState(initialTab);
  const [query, setQuery]       = useState("");
  const [source, setSource]     = useState("all");
  const [types, setTypes]       = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [contents, setContents] = useState([]);
  const [previewing, setPreviewing] = useState(null);

  const all = useMemo(() => [...savedTemplates, ...ONSITE_TEMPLATE_LIBRARY], [savedTemplates]);
  const bySource = all.filter((t) => source === "all" || (source === "saved" ? t.saved : !t.saved));

  const count = (pick) => bySource.reduce((acc, t) => { pick(t).forEach((k) => { acc[k] = (acc[k] || 0) + 1; }); return acc; }, {});
  const typeCounts    = count((t) => [t.displayType]);
  const useCaseCounts = count((t) => [t.useCase]);
  const contentCounts = count(templateContentTags);

  const visible = bySource.filter((t) => {
    if (query && !`${t.name} ${t.useCase}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (types.length && !types.includes(t.displayType)) return false;
    if (useCases.length && !useCases.includes(t.useCase)) return false;
    if (contents.length && !templateContentTags(t).some((c) => contents.includes(c))) return false;
    return true;
  });

  const toggle = (set) => (id) => set((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const anyFilter = types.length || useCases.length || contents.length || query;
  const savedCount = all.filter((t) => t.saved).length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div role="dialog" aria-label="Onsite template library" style={{ width: "min(1240px, 100%)", height: "min(860px, 100%)", background: "#fff", borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}>

        {/* Header + tabs */}
        <div style={{ padding: "16px 22px 0", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: INK }}>Choose an onsite template</h2>
            <button onClick={onClose} aria-label="Close" style={{ width: 32, height: 32, border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="#64748B" />
            </button>
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 12 }}>
            {[{ id: "library", label: "Prebuilt and saved templates" }, { id: "scratch", label: "Start from scratch" }].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{ padding: "8px 2px 10px", border: "none", background: "none", cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: tab === t.id ? ONSITE_TEAL : "#475569", borderBottom: `2px solid ${tab === t.id ? ONSITE_TEAL : "transparent"}` }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {tab === "library" ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            {/* Filters */}
            <div style={{ width: 250, flexShrink: 0, borderRight: `1px solid ${BORDER}`, overflowY: "auto", padding: "16px 18px" }}>
              <div style={{ position: "relative", marginBottom: 18 }}>
                <Search size={14} color={MUTED} style={{ position: "absolute", left: 10, top: 9 }} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" style={{ width: "100%", boxSizing: "border-box", padding: "7px 10px 7px 30px", fontSize: 12.5, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none" }} />
              </div>
              <FilterGroup title="Filter by type" options={DISPLAY_TYPES.map((d) => ({ id: d.id, label: d.label }))} counts={typeCounts} selected={types} onToggle={toggle(setTypes)} />
              <FilterGroup title="Filter by use case" options={ONSITE_USE_CASES.map((u) => ({ id: u, label: u }))} counts={useCaseCounts} selected={useCases} onToggle={toggle(setUseCases)} />
              <FilterGroup title="Filter by content" options={ONSITE_CONTENT_FILTERS.map((c) => ({ id: c, label: c }))} counts={contentCounts} selected={contents} onToggle={toggle(setContents)} />
            </div>

            {/* Grid */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 24px", background: "#FAFBFC" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>
                  Templates ({visible.length})
                  {anyFilter && (
                    <button onClick={() => { setTypes([]); setUseCases([]); setContents([]); setQuery(""); }} style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: ONSITE_TEAL, background: "none", border: "none", cursor: "pointer" }}>Clear filters</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { id: "all",      label: `All (${all.length})` },
                    { id: "prebuilt", label: `Pre-built (${ONSITE_TEMPLATE_LIBRARY.length})` },
                    { id: "saved",    label: `Saved templates (${savedCount})` },
                  ].map((s) => (
                    <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: INK, cursor: "pointer" }}>
                      <input type="radio" checked={source === s.id} onChange={() => setSource(s.id)} style={{ accentColor: ONSITE_TEAL, margin: 0 }} />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <div style={{ padding: "60px 0", textAlign: "center", color: MUTED, fontSize: 13 }}>
                  {source === "saved" && !savedCount
                    ? "No saved templates yet. Customize any template and save it to reuse it here."
                    : "No templates match these filters."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 16 }}>
                  {visible.map((t) => <TemplateCard key={t.id} template={t} onUse={onUse} onEdit={onEdit} onPreview={setPreviewing} />)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 22, background: "#FAFBFC" }}>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
              Each blank template comes with a ready layout, so you only change the words, colours and blocks.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 320px))", gap: 18 }}>
              {BLANK_TEMPLATES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onEdit(b)}
                  style={{ padding: 0, textAlign: "left", border: `1.5px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", background: "#fff", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ONSITE_TEAL; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ position: "relative" }}>
                    <BlankArt type={b.displayType} />
                    <span style={{ position: "absolute", top: 8, left: 8, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: ONSITE_TEAL, color: "#fff" }}>Drag and drop</span>
                  </div>
                  <div style={{ padding: "12px 14px", borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: INK }}>{b.name}</div>
                    <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{BLANK_DESCRIPTIONS[b.displayType]}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Large preview */}
      {previewing && (
        <div onClick={() => setPreviewing(null)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "min(640px, 100%)", background: "#fff", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{previewing.name}</div>
              <button onClick={() => setPreviewing(null)} aria-label="Close preview" style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color="#64748B" /></button>
            </div>
            <div style={{ padding: 18 }}><OnsitePreview draft={previewing} /></div>
            <div style={{ padding: "0 18px 18px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { onEdit(previewing); setPreviewing(null); }} style={{ padding: "8px 16px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Customize</button>
              <button onClick={() => { onUse(previewing); setPreviewing(null); }} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: ONSITE_TEAL, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Use as is</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
