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
  PhoneCall,
} from "lucide-react";
import { defaultAiCallingNodeData } from "@/components/flows/builder/nodes/AiCallingNode/data/mockData";
import { defaultAiCallingV2NodeData } from "@/components/flows/builder/nodes/AiCallingV2Node/data/mockData";
import { defaultAiChatbotNodeData } from "@/components/flows/builder/nodes/AiChatbotNode/data/mockData";
import { defaultRCSNodeData } from "@/components/flows/builder/nodes/RCSNode/data/mockData";
import { defaultAiPredictNodeData } from "@/components/flows/builder/nodes/AiPredictNode/data/mockData";
import { defaultStartFlowNodeData } from "@/components/flows/builder/nodes/StartFlowNode/data/mockData";
import { defaultRazorpayNodeData } from "@/components/flows/builder/nodes/RazorpayNode/data/mockData";
import { defaultSMSNodeData } from "@/components/flows/builder/nodes/SMSNode/data/mockData";
import { defaultPushNodeData } from "@/components/flows/builder/nodes/PushNode/data/mockData";
import { defaultConditionalSplitData } from "@/components/flows/builder/nodes/ConditionalSplitNode/data/mockData";
import { defaultEmailNodeData } from "@/components/flows/builder/nodes/EmailNode/data/mockData";
import { defaultOnsiteNodeData } from "@/components/flows/builder/nodes/OnsiteNode/data/mockData";
import { defaultInAppNodeData } from "@/components/flows/builder/nodes/InAppNode/data/mockData";
import { defaultNBANodeData } from "@/components/flows/builder/nodes/NextBestActionNode/data/mockData";
import { defaultSFONodeData } from "@/components/flows/builder/nodes/SmartFlowOptimizerNode/data/mockData";
import { defaultWebhookNodeData } from "@/components/flows/builder/nodes/WebhookNode/data/mockData";
import { defaultJudgeMeNodeData } from "@/components/flows/builder/nodes/JudgeMeNode/data/mockData";
import { defaultShopifyNodeData } from "@/components/flows/builder/nodes/ShopifyNode/data/mockData";
import { defaultGoogleSheetNodeData } from "@/components/flows/builder/nodes/GoogleSheetNode/data/mockData";
import { defaultStickyNoteNodeData } from "@/components/flows/builder/nodes/StickyNoteNode/data/mockData";

export const CHANNEL_META = {
  whatsapp: { label: "WhatsApp", color: "#10B981", Icon: MessageCircle },
  email: { label: "Email", color: "#3B82F6", Icon: Mail },
  sms: { label: "SMS", color: "#8B5CF6", Icon: MessageSquare },
  push: { label: "Push", color: "#F59E0B", Icon: Bell },
  inapp: { label: "InApp", color: "#7C3AED", Icon: Smartphone },
  rcs: { label: "RCS", color: "#6366F1", Icon: MessageCircleMore },
  aicallingv2: { label: "AI Voice", color: "#4F46E5", Icon: PhoneCall },
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
      { kind: "email", subtype: null, label: "Email", description: "Send Email", Icon: Mail, color: "#3B82F6" },
      { kind: "channel", subtype: "sms", label: "SMS", description: "Send SMS", Icon: MessageSquare, color: "#8B5CF6" },
      { kind: "channel", subtype: "push", label: "Push", description: "Send Push", Icon: Bell, color: "#F59E0B" },
      { kind: "onsite", subtype: null, label: "Onsite", description: "Popup, banner or nudge", Icon: Smartphone, color: "#14B8A6" },
      { kind: "inapp",  subtype: null, label: "InApp",  description: "Native mobile in-app message", Icon: Smartphone, color: "#7C3AED" },
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
    group: "AI",
    items: [
      { kind: "aicalling",         subtype: null, label: "AI Call",              description: "AI-powered voice call",                    Icon: PhoneCall, color: "#4F46E5" },
      { kind: "aichatbot",         subtype: null, label: "AI Chatbot",           description: "Conversational AI for chat channels",       Icon: Zap,       color: "#0891B2" },
      { kind: "aipredict",         subtype: null, label: "AI Predict",           description: "ML-powered audience scoring",               Icon: Zap,       color: "#6D28D9" },
      { kind: "nextbestaction",    subtype: null, label: "Next Best Action",     description: "AI picks the best channel per user",        Icon: Zap,       color: "#10B981" },
      { kind: "smartflowoptimizer",subtype: null, label: "Smart Flow Optimizer", description: "AI optimises across channel variants",      Icon: Zap,       color: "#6366F1" },
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

export function defaultDataForPaletteItem(item) {
  switch (item.kind) {
    case "email":
      return { ...defaultEmailNodeData };
    case "onsite":
      return { ...defaultOnsiteNodeData };
    case "inapp":
      return { ...defaultInAppNodeData };
    case "nextbestaction":
      return { ...defaultNBANodeData };
    case "smartflowoptimizer":
      return { ...defaultSFONodeData };
    case "rcs":
      return { ...defaultRCSNodeData };
    case "aicalling":
      return { ...defaultAiCallingNodeData };
    case "aichatbot":
      return { ...defaultAiChatbotNodeData };
    case "aipredict":
      return { ...defaultAiPredictNodeData };
    case "startflow":
      return { ...defaultStartFlowNodeData };
    case "razorpay":
      return { ...defaultRazorpayNodeData };
    case "judgeme":
      return { ...defaultJudgeMeNodeData };
    case "shopify":
      return { ...defaultShopifyNodeData };
    case "googlesheet":
      return { ...defaultGoogleSheetNodeData };
    case "webhook":
      return { ...defaultWebhookNodeData };
    case "sms":
      return { ...defaultSMSNodeData };
    case "push":
      return { ...defaultPushNodeData };
    case "conditionalsplit":
      return { ...defaultConditionalSplitData };
    case "aicallingv2":
      return { ...defaultAiCallingV2NodeData };
    case "whatsapp":
      return {
        label: "Send WhatsApp",
        template: null,
        variableMap: {},
        wabaNumberId: "waba_1",
        templateType: "Marketing",
        markAsMarketing: true,
        utm: { enabled: false, source: "whatsapp", medium: "journey", campaign: "" },
        aiBestTime: false,
        smartRetry: { enabled: false, mode: "smart", smartWindow: "72", manualSlots: [] },
        fallback: { enabled: false, template: null },
        outputConfig: { mode: "specific", wiredPorts: [] },
      };
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
        label: `Send ${item.label}`,
        channel: item.subtype,
        body: "",
        subject: item.subtype === "email" ? "" : undefined,
      };
    case "wait":
      return { label: "Wait 1 hour", duration_minutes: 60 };
    case "condition":
      return { label: "Condition", field: "purchased_within", operator: "<=", value: 24 };
    case "split":
      return { label: "A/B split", split_pct: [50, 50] };
    case "wait_until":
      return { label: "Wait until event", event_name: "order_placed", timeout_hours: 48 };
    case "end":
      return { label: "End" };
    case "goal":
      return { label: "Goal reached" };
    case "action":
      return {
        label: item.label || "Action",
        channel: item.subtype,
        body: "Click to configure →",
      };
    case "note":
      return { ...defaultStickyNoteNodeData };
    default:
      return { label: item.label };
  }
}

// Map a node `kind` (palette concept) → ReactFlow `type` (renderer key).
// We have 4 renderers: trigger, channel, logic, exit.
export function rendererTypeForKind(kind) {
  if (kind === "trigger") return "trigger";
  if (kind === "email")  return "email";
  if (kind === "onsite") return "onsite";
  if (kind === "inapp")             return "inapp";
  if (kind === "nextbestaction")    return "nextbestaction";
  if (kind === "smartflowoptimizer") return "smartflowoptimizer";
  if (kind === "channel") return "channel";
  if (kind === "end" || kind === "goal") return "exit";
  if (kind === "aicalling")  return "aicalling";
  if (kind === "aichatbot")  return "aichatbot";
  if (kind === "rcs") return "rcs";
  if (kind === "aipredict")  return "aipredict";
  if (kind === "startflow")  return "startflow";
  if (kind === "razorpay")   return "razorpay";
  if (kind === "judgeme")    return "judgeme";
  if (kind === "shopify")    return "shopify";
  if (kind === "googlesheet") return "googlesheet";
  if (kind === "sms")        return "sms";
  if (kind === "push")             return "push";
  if (kind === "conditionalsplit") return "conditionalsplit";
  if (kind === "aicallingv2") return "aicallingv2";
  return "logic"; // wait, condition, split, wait_until
}

export function nodeKindFromType(type) {
  // Stored `type` on the node IS the kind (trigger|channel|wait|condition|split|wait_until|end|goal).
  return type;
}
