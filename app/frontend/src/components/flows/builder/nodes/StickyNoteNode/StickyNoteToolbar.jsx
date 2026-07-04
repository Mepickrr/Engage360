import React, { useState } from "react";
import { Bold, Italic, Underline, Strikethrough, Smile, ChevronDown } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import { STICKY_NOTE_COLORS, STICKY_NOTE_FONT_SIZES } from "./data/mockData";

const FORMAT_BUTTONS = [
  { command: "bold",          icon: Bold,          title: "Bold" },
  { command: "strikeThrough", icon: Strikethrough, title: "Strikethrough" },
  { command: "underline",     icon: Underline,      title: "Underline" },
  { command: "italic",        icon: Italic,        title: "Italic" },
];

function iconBtnStyle() {
  return {
    width: 24, height: 24, borderRadius: 5, border: "none", background: "transparent",
    cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: "center",
  };
}

export default function StickyNoteToolbar({
  color, onColorChange, onFormat, fontSize, onFontSizeChange, onEmojiSelect,
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  return (
    <div
      data-testid="sticky-note-toolbar"
      onMouseDown={(e) => e.preventDefault()}
      style={{
        position: "absolute", bottom: "100%", left: 0, marginBottom: 6,
        display: "flex", alignItems: "center", gap: 4, padding: "4px 6px",
        background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)", zIndex: 10, whiteSpace: "nowrap",
      }}
    >
      {Object.entries(STICKY_NOTE_COLORS).map(([key, val]) => (
        <button
          key={key}
          type="button"
          title={key}
          onClick={() => onColorChange(key)}
          style={{
            width: 16, height: 16, borderRadius: "50%", background: val.bg,
            border: `2px solid ${color === key ? val.border : "transparent"}`,
            cursor: "pointer", padding: 0,
          }}
        />
      ))}

      <div style={{ width: 1, height: 18, background: "#E5E7EB", margin: "0 2px" }} />

      {FORMAT_BUTTONS.map(({ command, icon: Icon, title }) => (
        <button
          key={command}
          type="button"
          title={title}
          onClick={() => onFormat(command)}
          style={iconBtnStyle()}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F1F5F9"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Icon size={13} />
        </button>
      ))}

      <div style={{ position: "relative" }}>
        <button type="button" title="Emoji" onClick={() => setShowEmoji((v) => !v)} style={iconBtnStyle()}>
          <Smile size={13} />
        </button>
        {showEmoji && (
          <EmojiPicker
            onSelect={(emoji) => { onEmojiSelect(emoji); setShowEmoji(false); }}
            onClose={() => setShowEmoji(false)}
          />
        )}
      </div>

      <div style={{ width: 1, height: 18, background: "#E5E7EB", margin: "0 2px" }} />

      <div style={{ position: "relative" }}>
        <button
          type="button"
          title="Text size"
          onClick={() => setShowSizeMenu((v) => !v)}
          style={{ ...iconBtnStyle(), width: "auto", padding: "0 6px", gap: 2, fontSize: 11, fontWeight: 600 }}
        >
          Aa <ChevronDown size={10} />
        </button>
        {showSizeMenu && (
          <div style={{
            position: "absolute", bottom: "100%", left: 0, marginBottom: 4, background: "#fff",
            border: "1px solid #E5E7EB", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            overflow: "hidden", zIndex: 10,
          }}>
            {Object.keys(STICKY_NOTE_FONT_SIZES).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => { onFontSizeChange(size); setShowSizeMenu(false); }}
                style={{
                  display: "block", width: "100%", padding: "6px 12px", textAlign: "left", border: "none",
                  background: fontSize === size ? "#F1F5F9" : "transparent", cursor: "pointer",
                  fontSize: 12, color: "#0F172A",
                }}
              >
                {`${size[0].toUpperCase()}${size === "xlarge" ? "L" : ""} — ${size[0].toUpperCase() + size.slice(1)}`}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
