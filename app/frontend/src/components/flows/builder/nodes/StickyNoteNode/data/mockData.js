export const STICKY_NOTE_COLORS = {
  yellow: { bg: "#FEF9C3", border: "#EAB308", text: "#713F12" },
  green:  { bg: "#DCFCE7", border: "#22C55E", text: "#14532D" },
  blue:   { bg: "#DBEAFE", border: "#3B82F6", text: "#1E3A8A" },
};

export const STICKY_NOTE_FONT_SIZES = {
  small:  { heading: 13, body: 11 },
  medium: { heading: 16, body: 13 },
  large:  { heading: 18, body: 15 },
  xlarge: { heading: 22, body: 18 },
};

export const STICKY_NOTE_EMOJIS = [
  "😀", "😂", "😍", "😎", "🤔", "😢", "😡", "👍", "👎", "🙏",
  "🎉", "🔥", "💡", "⭐", "❤️", "💯", "✅", "❌", "⚠️", "📌",
  "📝", "📅", "⏰", "🚀", "🎯", "💰", "🛒", "📦", "🎁", "🔔",
  "😊", "😴", "🤝", "👏", "🙌", "💪", "👀", "🚨", "✨", "🏆",
];

export const defaultStickyNoteNodeData = {
  icon: "📌",
  heading: "",
  body: "",
  color: "yellow",
  fontSize: "medium",
};
