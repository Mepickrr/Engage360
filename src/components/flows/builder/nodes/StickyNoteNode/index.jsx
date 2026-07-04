import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useReactFlow } from "reactflow";
import StickyNoteToolbar from "./StickyNoteToolbar";
import EmojiPicker from "./EmojiPicker";
import { STICKY_NOTE_COLORS, STICKY_NOTE_FONT_SIZES } from "./data/mockData";

const HEADING_MAX = 30;
const BODY_MAX = 1000;

export default function StickyNoteNode({ id, data, selected }) {
  const { setNodes } = useReactFlow();
  const bodyRef = useRef(null);
  const [activeField, setActiveField] = useState(null); // "heading" | "body" | null
  const [showHeadingEmoji, setShowHeadingEmoji] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);

  const color = data?.color || "yellow";
  const fontSize = data?.fontSize || "medium";
  const palette = STICKY_NOTE_COLORS[color];
  const sizes = STICKY_NOTE_FONT_SIZES[fontSize];

  // contentEditable is uncontrolled: seed its DOM content once on mount only,
  // so React re-renders from later data patches never touch the DOM and reset the caret.
  useLayoutEffect(() => {
    if (bodyRef.current) bodyRef.current.innerHTML = data?.body || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patchData = useCallback((patch) => {
    setNodes((nodes) => nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)));
  }, [id, setNodes]);

  const handleHeadingChange = (e) => {
    patchData({ heading: e.target.value.slice(0, HEADING_MAX) });
  };

  const handleBodyInput = (e) => {
    const text = e.currentTarget.innerText || "";
    if (text.length > BODY_MAX) {
      e.currentTarget.innerText = text.slice(0, BODY_MAX);
    }
    patchData({ body: e.currentTarget.innerHTML });
  };

  const handleFormat = (command) => {
    bodyRef.current?.focus();
    document.execCommand(command);
    patchData({ body: bodyRef.current?.innerHTML || "" });
  };

  const handleEmojiSelect = (emoji) => {
    if (activeField === "heading") {
      patchData({ icon: emoji });
      return;
    }
    bodyRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    patchData({ body: bodyRef.current?.innerHTML || "" });
  };

  return (
    <div
      data-testid="sticky-note-node"
      style={{
        position: "relative", width: 220, background: palette.bg,
        border: `1px solid ${palette.border}`, borderRadius: 10,
        boxShadow: selected ? `0 0 0 2px ${palette.border}` : "0 1px 2px rgba(0,0,0,0.06)",
      }}
    >
      {selected && (
        <StickyNoteToolbar
          color={color}
          onColorChange={(c) => patchData({ color: c })}
          onFormat={handleFormat}
          fontSize={fontSize}
          onFontSizeChange={(s) => patchData({ fontSize: s })}
          onEmojiSelect={handleEmojiSelect}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px 4px" }}>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => { setActiveField("heading"); setShowHeadingEmoji((v) => !v); }}
            style={{ fontSize: sizes.heading, lineHeight: 1, border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
            title="Change icon"
          >
            {data?.icon || "📌"}
          </button>
          {showHeadingEmoji && (
            <EmojiPicker
              onSelect={(emoji) => { patchData({ icon: emoji }); setShowHeadingEmoji(false); }}
              onClose={() => setShowHeadingEmoji(false)}
            />
          )}
        </div>
        <input
          value={data?.heading || ""}
          onChange={handleHeadingChange}
          onFocus={() => setActiveField("heading")}
          placeholder="Add a heading..."
          maxLength={HEADING_MAX}
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: sizes.heading, fontWeight: 700, color: palette.text,
          }}
        />
      </div>

      <div style={{ position: "relative" }}>
        {!bodyFocused && !data?.body && (
          <span style={{
            position: "absolute", top: 4, left: 12, fontSize: sizes.body, color: "#94A3B8", pointerEvents: "none",
          }}>
            Add a note...
          </span>
        )}
        <div
          ref={bodyRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => { setActiveField("body"); setBodyFocused(true); }}
          onBlur={() => setBodyFocused(false)}
          onInput={handleBodyInput}
          style={{
            padding: "4px 12px 12px", fontSize: sizes.body, color: palette.text,
            lineHeight: 1.5, outline: "none", minHeight: 40, wordBreak: "break-word",
          }}
        />
      </div>
    </div>
  );
}
