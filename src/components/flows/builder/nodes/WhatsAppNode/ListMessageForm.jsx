import React, { useState } from "react";
import { Trash2 } from "lucide-react";

const WA_GREEN  = "#25D366";
const PRIMARY   = "#6C3AE8";
const BORDER    = "#E5E7EB";
const MUTED     = "#94A3B8";

const MAX_BODY          = 1024;
const MAX_HEADER        = 60;
const MAX_FOOTER        = 60;
const MAX_BUTTON        = 20;
const MAX_SECTION_TITLE = 24;
const MAX_ROW_TITLE     = 24;
const MAX_ROW_DESC      = 72;
const MAX_SECTIONS      = 10;
const MAX_ROWS_TOTAL    = 10;

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function CharInput({ value, onChange, max, placeholder, multiline, rows }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div>
      <Tag
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={multiline ? (rows || 4) : undefined}
        style={{
          width: "100%", padding: "7px 10px", fontSize: 13,
          border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none",
          fontFamily: "inherit", resize: multiline ? "none" : undefined,
          lineHeight: multiline ? 1.55 : undefined,
        }}
      />
      <div style={{ fontSize: 10, color: MUTED, textAlign: "right", marginTop: 2 }}>
        {value.length}/{max}
      </div>
    </div>
  );
}

function defaultRow(globalIdx) {
  return { id: `row_${globalIdx + 1}`, title: "", description: "" };
}

function defaultSection(globalRowIdx) {
  return { title: "", rows: [defaultRow(globalRowIdx)] };
}

function defaultDraft() {
  return {
    isListMessage: true,
    header: "",
    body: "",
    footer: "",
    buttonText: "",
    sections: [defaultSection(0)],
    _nextRowIdx: 1,
  };
}

export default function ListMessageForm({ initial, onApply, onCancel }) {
  const [draft, setDraft] = useState(() => {
    if (initial?.isListMessage) {
      const allRows = (initial.sections ?? []).flatMap((s) => s.rows ?? []);
      const maxIdx = allRows.reduce((m, r) => {
        const n = parseInt(r.id?.replace("row_", "") ?? "0", 10);
        return isNaN(n) ? m : Math.max(m, n);
      }, 0);
      return { ...initial, _nextRowIdx: maxIdx + 1 };
    }
    return defaultDraft();
  });

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));

  const totalRows = draft.sections.reduce(
    (sum, s) => sum + (s.rows?.length ?? 0), 0
  );

  const canApply =
    draft.body.trim().length > 0 &&
    draft.buttonText.trim().length > 0 &&
    draft.sections.some((s) => s.rows.some((r) => r.title.trim().length > 0));

  const updateSection = (si, update) =>
    patch({ sections: draft.sections.map((s, i) => (i === si ? { ...s, ...update } : s)) });

  const deleteSection = (si) => {
    if (draft.sections.length <= 1) return;
    patch({ sections: draft.sections.filter((_, i) => i !== si) });
  };

  const addSection = () => {
    if (draft.sections.length >= MAX_SECTIONS) return;
    setDraft((d) => ({
      ...d,
      _nextRowIdx: d._nextRowIdx + 1,
      sections: [...d.sections, defaultSection(d._nextRowIdx)],
    }));
  };

  const addRow = (si) => {
    if (totalRows >= MAX_ROWS_TOTAL) return;
    setDraft((d) => ({
      ...d,
      _nextRowIdx: d._nextRowIdx + 1,
      sections: d.sections.map((s, i) =>
        i === si ? { ...s, rows: [...s.rows, defaultRow(d._nextRowIdx)] } : s
      ),
    }));
  };

  const deleteRow = (si, ri) => {
    const section = draft.sections[si];
    if (draft.sections.length === 1 && section.rows.length <= 1) return;
    if (section.rows.length <= 1) {
      patch({ sections: draft.sections.filter((_, i) => i !== si) });
    } else {
      patch({
        sections: draft.sections.map((s, i) =>
          i === si ? { ...s, rows: s.rows.filter((_, j) => j !== ri) } : s
        ),
      });
    }
  };

  const updateRow = (si, ri, update) =>
    patch({
      sections: draft.sections.map((s, i) =>
        i === si
          ? { ...s, rows: s.rows.map((r, j) => (j === ri ? { ...r, ...update } : r)) }
          : s
      ),
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Heading */}
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Configure List Message</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>📋 Interactive list · session message</div>
      </div>

      {/* Body */}
      <div>
        <Label>Body Text</Label>
        <CharInput
          value={draft.body}
          onChange={(v) => patch({ body: v })}
          max={MAX_BODY}
          placeholder="Message body shown to the customer…"
          multiline
        />
      </div>

      {/* Button label */}
      <div>
        <Label>Button Label</Label>
        <CharInput
          value={draft.buttonText}
          onChange={(v) => patch({ buttonText: v })}
          max={MAX_BUTTON}
          placeholder="e.g. Choose an option"
        />
      </div>

      {/* Header (optional) */}
      <div>
        <Label>Header (Optional)</Label>
        <CharInput
          value={draft.header}
          onChange={(v) => patch({ header: v })}
          max={MAX_HEADER}
          placeholder="Short header text…"
        />
      </div>

      {/* Footer (optional) */}
      <div>
        <Label>Footer (Optional)</Label>
        <CharInput
          value={draft.footer}
          onChange={(v) => patch({ footer: v })}
          max={MAX_FOOTER}
          placeholder="Optional footer text…"
        />
      </div>

      {/* Sections */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Label>Sections</Label>
          <span style={{ fontSize: 10, color: MUTED }}>{totalRows} / {MAX_ROWS_TOTAL} rows used</span>
        </div>

        {draft.sections.map((section, si) => (
          <div key={si} style={{ border: `1px solid ${BORDER}`, borderRadius: 8, marginBottom: 8, overflow: "hidden" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "#F8FAFC", borderBottom: `1px solid ${BORDER}` }}>
              <input
                value={section.title}
                onChange={(e) => updateSection(si, { title: e.target.value.slice(0, MAX_SECTION_TITLE) })}
                placeholder={`Section ${si + 1} title (optional)`}
                style={{ flex: 1, padding: "4px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit" }}
              />
              <button
                type="button"
                onClick={() => deleteSection(si)}
                disabled={draft.sections.length <= 1}
                style={{ background: "none", border: "none", padding: 4, cursor: draft.sections.length <= 1 ? "not-allowed" : "pointer", color: draft.sections.length <= 1 ? MUTED : "#EF4444" }}
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Rows */}
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {section.rows.map((row, ri) => {
                const isOnlyRow = draft.sections.length === 1 && section.rows.length <= 1;
                return (
                  <div key={ri} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <input
                        value={row.title}
                        onChange={(e) => updateRow(si, ri, { title: e.target.value.slice(0, MAX_ROW_TITLE) })}
                        placeholder="Row title"
                        style={{ width: "100%", padding: "5px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit" }}
                      />
                      <input
                        value={row.description}
                        onChange={(e) => updateRow(si, ri, { description: e.target.value.slice(0, MAX_ROW_DESC) })}
                        placeholder="Description (optional)"
                        style={{ width: "100%", padding: "5px 8px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", fontFamily: "inherit", color: MUTED }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteRow(si, ri)}
                      disabled={isOnlyRow}
                      style={{ background: "none", border: "none", padding: 4, marginTop: 2, cursor: isOnlyRow ? "not-allowed" : "pointer", color: isOnlyRow ? MUTED : "#EF4444" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {totalRows < MAX_ROWS_TOTAL && (
                <button
                  type="button"
                  onClick={() => addRow(si)}
                  style={{ alignSelf: "flex-start", fontSize: 11, color: PRIMARY, fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  + Add Row
                </button>
              )}
            </div>
          </div>
        ))}

        {draft.sections.length < MAX_SECTIONS && (
          <button
            type="button"
            onClick={addSection}
            style={{ width: "100%", padding: "8px", border: `1.5px dashed ${BORDER}`, borderRadius: 8, background: "transparent", cursor: "pointer", fontSize: 12, color: "#475569", textAlign: "center" }}
          >
            + Add Section
          </button>
        )}
      </div>

      {/* Cancel / Apply */}
      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const { _nextRowIdx, ...applyDraft } = draft;
            onApply(applyDraft);
          }}
          disabled={!canApply}
          title={!canApply ? "Fill in body, button label, and at least one row title" : undefined}
          style={{
            flex: 1, padding: "9px", border: "none", borderRadius: 8,
            background: canApply ? WA_GREEN : "#E2E8F0",
            color: canApply ? "#fff" : MUTED,
            fontSize: 13, fontWeight: 600,
            cursor: canApply ? "pointer" : "not-allowed",
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
