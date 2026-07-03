import React, { useEffect, useRef } from "react";
import { STICKY_NOTE_EMOJIS } from "./data/mockData";

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-testid="sticky-note-emoji-picker"
      style={{
        position: "absolute", top: "100%", left: 0, marginTop: 4, zIndex: 20,
        display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2,
        padding: 8, background: "#fff", border: "1px solid #E5E7EB",
        borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.12)", width: 208,
      }}
    >
      {STICKY_NOTE_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          style={{
            width: 22, height: 22, border: "none", background: "transparent",
            cursor: "pointer", fontSize: 14, borderRadius: 4,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
