import React, { useState } from "react";
import { Upload } from "lucide-react";

const BORDER = "#E5E7EB";
const MUTED = "#94A3B8";
const CAROUSEL_BLUE = "#3D3CB8";
const MAX_CAROUSEL_BODY = 1024;
const MAX_CARD_BODY = 160;
const MAX_CAROUSEL_CARDS = 10;

function Label({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}
function SelectField({ value, onChange, options, style = {} }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "7px 28px 7px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", background: "#fff", appearance: "none", cursor: "pointer", ...style }}>
      {options.map((o) => <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>{typeof o === "string" ? o : o.label}</option>)}
    </select>
  );
}

export function defaultCarouselCard() {
  return { mediaUrl: "", cardBody: "", buttons: [{ type: "QUICK_REPLY", label: "" }] };
}
export function defaultCarouselDraft() {
  return { isCarousel: true, name: "", category: "Marketing", language: "en", body: "", cards: [defaultCarouselCard(), defaultCarouselCard()] };
}

function CarouselCardThumb({ card, index, isSelected, onSelect, onDelete, canDelete }) {
  return (
    <div onClick={onSelect} style={{
      width: 72, flexShrink: 0, borderRadius: 8,
      border: `2px solid ${isSelected ? CAROUSEL_BLUE : BORDER}`,
      background: isSelected ? "#EEF2FF" : "#F8FAFC",
      cursor: "pointer", overflow: "hidden", transition: "border-color 0.15s",
    }}>
      <div style={{ background: CAROUSEL_BLUE, padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Card {index + 1}</span>
        {canDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
        )}
      </div>
      <div style={{ height: 44, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {card.mediaUrl ? <span style={{ fontSize: 16 }}>🖼</span> : <span style={{ fontSize: 14, color: CAROUSEL_BLUE, opacity: 0.35 }}>+</span>}
      </div>
      {(!card.mediaUrl || !card.cardBody) && (
        <div style={{ padding: "3px 4px", textAlign: "center" }}>
          <span style={{ fontSize: 8, color: "#F59E0B", fontWeight: 600 }}>Incomplete</span>
        </div>
      )}
    </div>
  );
}

function CarouselCardEditor({ card, onChange }) {
  const patch = (p) => onChange({ ...card, ...p });
  const patchBtn = (i, p) => {
    const btns = [...(card.buttons || [])];
    btns[i] = { ...btns[i], ...p };
    patch({ buttons: btns });
  };
  return (
    <div style={{ display: "flex", gap: 0, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ width: 116, flexShrink: 0, background: "#F8FAFC", borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "12px 10px" }}>
        <div style={{ width: "100%", height: 76, background: card.mediaUrl ? "#D1FAE5" : "#EEF2FF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: `2px dashed ${BORDER}` }}
          onClick={() => alert("Media upload — connect your media library")}>
          {card.mediaUrl ? <span style={{ fontSize: 28 }}>🖼</span> : (
            <div style={{ textAlign: "center" }}>
              <Upload size={15} style={{ color: CAROUSEL_BLUE, opacity: 0.5 }} />
              <div style={{ fontSize: 9, color: CAROUSEL_BLUE, marginTop: 3, opacity: 0.6 }}>Upload image</div>
            </div>
          )}
        </div>
        <input value={card.mediaUrl || ""} onChange={(e) => patch({ mediaUrl: e.target.value })}
          placeholder="or paste URL" style={{ width: "100%", padding: "4px 6px", fontSize: 10, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }} />
      </div>
      <div style={{ flex: 1, padding: "10px", display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>Card Body</span>
            <span style={{ fontSize: 10, color: MUTED }}>{(card.cardBody || "").length}/{MAX_CARD_BODY}</span>
          </div>
          <textarea value={card.cardBody || ""} onChange={(e) => patch({ cardBody: e.target.value.slice(0, MAX_CARD_BODY) })}
            placeholder="Card message…" rows={3}
            style={{ width: "100%", padding: "6px 8px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
        </div>
        <div>
          <span style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em" }}>Buttons</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 5 }}>
            {(card.buttons || []).map((btn, i) => (
              <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <select value={btn.type} onChange={(e) => patchBtn(i, { type: e.target.value })}
                  style={{ padding: "4px 6px", fontSize: 10, border: `1px solid ${BORDER}`, borderRadius: 6, background: "#fff", outline: "none", cursor: "pointer", flexShrink: 0 }}>
                  <option value="QUICK_REPLY">Reply</option>
                  <option value="URL">URL</option>
                </select>
                <input value={btn.label} onChange={(e) => patchBtn(i, { label: e.target.value.slice(0, 25) })}
                  placeholder="Button text" style={{ flex: 1, padding: "4px 6px", fontSize: 11, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none", minWidth: 0 }} />
                {(card.buttons || []).length > 1 && (
                  <button type="button" onClick={() => patch({ buttons: (card.buttons || []).filter((_, j) => j !== i) })}
                    style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "2px 4px", fontSize: 13 }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#EF4444"} onMouseLeave={(e) => e.currentTarget.style.color = MUTED}>×</button>
                )}
              </div>
            ))}
            {(card.buttons || []).length < 2 && (
              <button type="button" onClick={() => patch({ buttons: [...(card.buttons || []), { type: "QUICK_REPLY", label: "" }] })}
                style={{ fontSize: 10, color: CAROUSEL_BLUE, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "2px 0", fontWeight: 600 }}>
                + Add Another Button
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarouselForm({ initial, onApply, onCancel, onChange }) {
  const [draft, setDraft] = useState(initial?.isCarousel ? initial : defaultCarouselDraft());
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  const patchDraft = (p) => setDraft((d) => {
    const next = { ...d, ...p };
    if (onChange) onChange(next);
    return next;
  });
  const patchCard = (i, updated) => {
    const cards = [...draft.cards];
    cards[i] = updated;
    patchDraft({ cards });
  };
  const addCard = () => {
    if (draft.cards.length >= MAX_CAROUSEL_CARDS) return;
    const cards = [...draft.cards, defaultCarouselCard()];
    patchDraft({ cards });
    setActiveCardIdx(cards.length - 1);
  };
  const deleteCard = (i) => {
    if (draft.cards.length <= 1) return;
    const cards = draft.cards.filter((_, j) => j !== i);
    patchDraft({ cards });
    setActiveCardIdx(Math.min(activeCardIdx, cards.length - 1));
  };

  const activeCard = draft.cards[activeCardIdx] || defaultCarouselCard();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Template Content</div>
        <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>🎠 Carousel · up to {MAX_CAROUSEL_CARDS} cards</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <Label>Category</Label>
          <SelectField value={draft.category || "Marketing"} onChange={(v) => patchDraft({ category: v })} options={["Marketing", "Utility"]} />
        </div>
        <div style={{ flex: 1 }}>
          <Label>Language</Label>
          <SelectField value={draft.language || "en"} onChange={(v) => patchDraft({ language: v })} options={[{ value: "en", label: "English" }, { value: "hi", label: "Hindi" }]} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <Label>Template Body</Label>
          <span style={{ fontSize: 10, color: MUTED }}>{(draft.body || "").length}/{MAX_CAROUSEL_BODY}</span>
        </div>
        <textarea value={draft.body || ""} onChange={(e) => patchDraft({ body: e.target.value.slice(0, MAX_CAROUSEL_BODY) })}
          placeholder="Main message body shared across all cards…" rows={4}
          style={{ width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", resize: "none", lineHeight: 1.55, fontFamily: "inherit" }} />
      </div>

      <div>
        <Label>Cards ({draft.cards.length})</Label>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
          {draft.cards.map((card, i) => (
            <CarouselCardThumb key={i} card={card} index={i} isSelected={activeCardIdx === i}
              onSelect={() => setActiveCardIdx(i)} onDelete={() => deleteCard(i)} canDelete={draft.cards.length > 1} />
          ))}
          {draft.cards.length < MAX_CAROUSEL_CARDS && (
            <div onClick={addCard} style={{
              width: 72, flexShrink: 0, borderRadius: 8, border: `2px dashed ${BORDER}`,
              background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              minHeight: 82, transition: "border-color 0.15s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = CAROUSEL_BLUE}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = BORDER}>
              <span style={{ fontSize: 20, color: MUTED }}>+</span>
            </div>
          )}
        </div>
      </div>

      <CarouselCardEditor card={activeCard} onChange={(updated) => patchCard(activeCardIdx, updated)} />

      <div style={{ display: "flex", gap: 8, paddingTop: 8, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, padding: "9px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "#fff", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
        <button type="button" onClick={() => onApply(draft)}
          style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: CAROUSEL_BLUE, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          Apply Template
        </button>
      </div>
    </div>
  );
}
