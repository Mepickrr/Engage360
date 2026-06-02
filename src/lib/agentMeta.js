// Shared agent metadata used across Agent Home and Conversation Panel.
//
// The colors mirror /app/backend/llm/personas.py so frontend visuals stay
// in lock-step with backend persona data.

import {
  TrendingUp,
  Sparkles,
  Users,
  BarChart3,
  Workflow,
  LifeBuoy,
} from "lucide-react";

export const AGENT_META = {
  aryan: {
    id: "aryan",
    name: "Aryan",
    title: "Growth Strategist",
    domain: "Recovery & Remarketing",
    color: "#10B981",
    icon: TrendingUp,
    askPlaceholder: "Ask Aryan about revenue, recovery, payday plays...",
  },
  zara: {
    id: "zara",
    name: "Zara",
    title: "Creative Lead",
    domain: "Copy & Brand Voice",
    color: "#EC4899",
    icon: Sparkles,
    askPlaceholder: "Ask Zara to draft copy, subject lines, variants...",
  },
  meera: {
    id: "meera",
    name: "Meera",
    title: "Audience Architect",
    domain: "Segments & Cohorts",
    color: "#8B5CF6",
    icon: Users,
    askPlaceholder: "Ask Meera about your audience and segments...",
  },
  rishi: {
    id: "rishi",
    name: "Rishi",
    title: "Performance Analyst",
    domain: "Diagnostics & Reports",
    color: "#3B82F6",
    icon: BarChart3,
    askPlaceholder: "Ask Rishi about performance, drops, weekly briefs...",
  },
  dev: {
    id: "dev",
    name: "Dev",
    title: "Flow Builder",
    domain: "Journeys & Automation",
    color: "#64748B",
    icon: Workflow,
    askPlaceholder: "Tell Dev what to build — flow, journey, sequence...",
  },
  priya: {
    id: "priya",
    name: "Priya",
    title: "Support Lead",
    domain: "Setup & Integrations",
    color: "#F59E0B",
    icon: LifeBuoy,
    askPlaceholder: "Ask Priya about setup, DLT, integrations...",
  },
};

export const AGENT_ORDER = ["aryan", "zara", "meera", "rishi", "dev", "priya"];

export function getAgentMeta(id) {
  return AGENT_META[id] || AGENT_META.aryan;
}

// hex -> rgba with alpha — for soft tints
export function hexAlpha(hex, alpha = 0.1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Relative time formatter used in cards / tasks.
export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.max(0, Math.floor((now - then) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}
