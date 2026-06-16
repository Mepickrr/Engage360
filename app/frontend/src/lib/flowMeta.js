// Channel + status visual metadata shared across Flows list and Builder.
//
// Keeping all channel/status colors in one place so the list page, status
// pills, channel chips, and the node renderers stay in sync.

import {
  Mail,
  MessageCircle,
  MessageSquare,
  Bell,
  Smartphone,
  MessageCircleMore,
  Zap,
  Users,
  Calendar,
  Webhook,
  Clock,
  GitFork,
  SplitSquareVertical,
  TimerReset,
  CircleStop,
  Target,
} from "lucide-react";

export const CHANNEL_META = {
  whatsapp: { label: "WhatsApp", color: "#10B981", Icon: MessageCircle },
  email: { label: "Email", color: "#3B82F6", Icon: Mail },
  sms: { label: "SMS", color: "#8B5CF6", Icon: MessageSquare },
  push: { label: "Push", color: "#F59E0B", Icon: Bell },
  inapp: { label: "In-app", color: "#14B8A6", Icon: Smartphone },
  rcs: { label: "RCS", color: "#6366F1", Icon: MessageCircleMore },
};

export const STATUS_META = {
  active: { label: "Active", fg: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  paused: { label: "Paused", fg: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500" },
  draft: { label: "Draft", fg: "text-slate-700", bg: "bg-slate-100", dot: "bg-slate-400" },
};

// Palette catalogue — drives both the left palette and node-type defaults.
export const PALETTE_CATALOGUE = [
  {
    group: "Triggers",
    items: [
      { kind: "trigger", subtype: "event", label: "Event", description: "When an event happens", Icon: Zap, color: "#6C3AE8", singleton: true },
      { kind: "trigger", subtype: "segment", label: "Segment entry", description: "User enters a segment", Icon: Users, color: "#6C3AE8", singleton: true },
      { kind: "trigger", subtype: "schedule", label: "Schedule", description: "Time-based trigger", Icon: Calendar, color: "#6C3AE8", singleton: true },
      { kind: "trigger", subtype: "webhook", label: "API webhook", description: "Webhook from your stack", Icon: Webhook, color: "#6C3AE8", singleton: true },
    ],
  },
  {
    group: "Channels",
    items: [
      { kind: "channel", subtype: "whatsapp", label: "WhatsApp", description: "Send WhatsApp", Icon: MessageCircle, color: "#10B981" },
      { kind: "channel", subtype: "email", label: "Email", description: "Send Email", Icon: Mail, color: "#3B82F6" },
      { kind: "channel", subtype: "sms", label: "SMS", description: "Send SMS", Icon: MessageSquare, color: "#8B5CF6" },
      { kind: "channel", subtype: "push", label: "Push", description: "Send Push", Icon: Bell, color: "#F59E0B" },
      { kind: "channel", subtype: "inapp", label: "In-app", description: "Show in-app message", Icon: Smartphone, color: "#14B8A6" },
      { kind: "channel", subtype: "rcs", label: "RCS", description: "Send RCS message", Icon: MessageCircleMore, color: "#6366F1" },
    ],
  },
  {
    group: "Logic",
    items: [
      { kind: "wait", subtype: null, label: "Wait / Delay", description: "Pause the flow", Icon: Clock, color: "#64748B" },
      { kind: "condition", subtype: null, label: "Condition", description: "If / else branch", Icon: GitFork, color: "#F59E0B" },
      { kind: "split", subtype: null, label: "A/B Split", description: "Random split", Icon: SplitSquareVertical, color: "#8B5CF6" },
      { kind: "wait_until", subtype: null, label: "Wait until event", description: "Pause until a condition", Icon: TimerReset, color: "#64748B" },
    ],
  },
  {
    group: "Exits",
    items: [
      { kind: "end", subtype: null, label: "End", description: "Flow finishes", Icon: CircleStop, color: "#64748B" },
      { kind: "goal", subtype: null, label: "Goal reached", description: "Conversion goal hit", Icon: Target, color: "#10B981" },
    ],
  },
];

import { defaultWebhookNodeData } from "@/components/flows/builder/nodes/WebhookNode/data/mockData";

export function defaultDataForPaletteItem(item) {
  switch (item.kind) {
    case "webhook":
      return { ...defaultWebhookNodeData };
    case "trigger":
      return {
        label:
          item.subtype === "event"
            ? "Cart abandoned"
            : item.subtype === "segment"
              ? "Segment entry"
              : item.subtype === "schedule"
                ? "Schedule"
                : "API webhook",
        trigger_type: item.subtype,
        event_name: item.subtype === "event" ? "cart_abandoned" : null,
      };
    case "channel":
      return {
        label: `Send ${item.label || item.name || ""}`.trim(),
        channel: item.subtype,
        body: "",
        subject: item.subtype === "email" ? "" : undefined,
      };
    case "wait":
      return { label: item.name || "Wait 1 hour", duration_minutes: 60 };
    case "condition":
      return {
        label: item.name || "Condition",
        field: "purchased_within",
        operator: "<=",
        value: 24,
      };
    case "split":
      return { label: "A/B split", split_pct: [50, 50] };
    case "wait_until":
      return { label: "Wait until event", event_name: "order_placed", timeout_hours: 48 };
    case "end":
      return { label: "End" };
    case "goal":
      return { label: "Goal reached" };
    case "generic":
      return { label: item.name || item.label || "Component" };
    default:
      return { label: item.label || item.name || "Component" };
  }
}

// Map a node `kind` (palette concept) → ReactFlow `type` (renderer key).
// We have 4 renderers: trigger, channel, logic, exit.
export function rendererTypeForKind(kind) {
  if (kind === "trigger") return "trigger";
  if (kind === "channel") return "channel";
  if (kind === "end" || kind === "goal") return "exit";
  return "logic"; // wait, condition, split, wait_until
}

export function nodeKindFromType(type) {
  // Stored `type` on the node IS the kind (trigger|channel|wait|condition|split|wait_until|end|goal).
  return type;
}
