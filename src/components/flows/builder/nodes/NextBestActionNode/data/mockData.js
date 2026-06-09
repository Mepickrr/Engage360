export const NBA_GREEN = "#10B981";

// All channels the NBA node can route to
export const NBA_CHANNEL_OPTIONS = [
  { id: "push",     label: "Push",      emoji: "🔔", color: "#F59E0B" },
  { id: "email",    label: "Email",     emoji: "✉️",  color: "#3B82F6" },
  { id: "sms",      label: "SMS",       emoji: "💬",  color: "#8B5CF6" },
  { id: "whatsapp", label: "WhatsApp",  emoji: "💚",  color: "#25D366" },
  { id: "rcs",      label: "RCS",       emoji: "📩",  color: "#6366F1" },
  { id: "onsite",   label: "Onsite",    emoji: "🖥️",  color: "#14B8A6" },
  { id: "inapp",    label: "InApp",     emoji: "📱",  color: "#7C3AED" },
];

// AI model options
export const NBA_AI_MODELS = [
  { id: "best_channel", label: "Best Channel",     desc: "AI picks the channel most likely to engage each user" },
  { id: "best_time",    label: "Best Channel + Time", desc: "AI picks channel and optimal send time per user"  },
];

// Optimise goal options
export const NBA_GOALS = [
  { id: "engagement",  label: "Engagement"   },
  { id: "conversion",  label: "Conversion"   },
  { id: "revenue",     label: "Revenue"      },
];

export const defaultNBANodeData = {
  label:    "Next Best Action",
  channels: ["push", "email", "sms", "whatsapp"],  // ordered priority list
  model:    "best_channel",
  goal:     "engagement",
  fallback: true,    // send via next-priority channel if top choice fails
  outputConfig: {
    wiredPorts: [],
  },
};
