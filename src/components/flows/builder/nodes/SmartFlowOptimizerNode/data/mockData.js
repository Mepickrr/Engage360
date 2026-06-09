export const SFO_INDIGO = "#6366F1";

export const SFO_CHANNEL_OPTIONS = [
  { id: "push",     label: "Push",     emoji: "🔔", color: "#F59E0B" },
  { id: "email",    label: "Email",    emoji: "✉️",  color: "#3B82F6" },
  { id: "sms",      label: "SMS",      emoji: "💬",  color: "#8B5CF6" },
  { id: "whatsapp", label: "WhatsApp", emoji: "💚",  color: "#25D366" },
  { id: "rcs",      label: "RCS",      emoji: "📩",  color: "#6366F1" },
  { id: "onsite",   label: "Onsite",   emoji: "🖥️",  color: "#14B8A6" },
  { id: "inapp",    label: "InApp",    emoji: "📱",  color: "#7C3AED" },
];

export const SFO_GOALS = [
  { id: "ctr",        label: "Click Rate"     },
  { id: "conversion", label: "Conversion"     },
  { id: "revenue",    label: "Revenue"        },
];

export const SFO_DISTRIBUTIONS = [
  { id: "auto",   label: "Auto-optimise",  desc: "AI gradually shifts traffic to the best-performing branch" },
  { id: "equal",  label: "Equal split",    desc: "Each branch gets equal traffic throughout the experiment"  },
  { id: "manual", label: "Manual",         desc: "Set exact traffic percentages for each branch"             },
];

export const defaultSFONodeData = {
  label: "Smart Flow Optimizer",
  branches: [
    { id: "sfo_b1", label: "Branch 1", channel: "email"    },
    { id: "sfo_b2", label: "Branch 2", channel: "whatsapp" },
  ],
  optimizeFor:      "ctr",
  distribution:     "auto",
  winnerThreshold:  95,   // confidence % before declaring a winner
  minSampleSize:    500,  // users per branch before results are considered
  outputConfig: {
    wiredPorts: [],
  },
};
