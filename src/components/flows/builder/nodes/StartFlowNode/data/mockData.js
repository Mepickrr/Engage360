import {
  MessageCircle, Mail, MessageSquare, Bell, Smartphone, MessageCircleMore, PhoneCall,
} from "lucide-react";

export const FLOW_STATUSES = [
  { id: "all",       label: "All" },
  { id: "active",    label: "Active",    fg: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0", dot: "#22C55E" },
  { id: "inactive",  label: "Inactive",  fg: "#DC2626", bg: "#FEF2F2", border: "#FECACA", dot: "#EF4444" },
  { id: "test_mode", label: "Test Mode", fg: "#B45309", bg: "#FFFBEB", border: "#FDE68A", dot: "#F59E0B" },
  { id: "archived",  label: "Archived",  fg: "#475569", bg: "#F8FAFC", border: "#E2E8F0", dot: "#94A3B8" },
];

export const CHANNEL_ICONS = {
  whatsapp: { Icon: MessageCircle,     color: "#10B981" },
  email:    { Icon: Mail,              color: "#3B82F6" },
  sms:      { Icon: MessageSquare,     color: "#8B5CF6" },
  push:     { Icon: Bell,              color: "#F59E0B" },
  inapp:    { Icon: Smartphone,        color: "#14B8A6" },
  rcs:      { Icon: MessageCircleMore, color: "#6366F1" },
  aicall:   { Icon: PhoneCall,         color: "#4F46E5" },
};

// Warning shown on canvas node when linked flow is inactive or archived
export function flowNeedsWarning(status) {
  return status === "inactive" || status === "archived";
}

export const MOCK_FLOWS = [
  {
    id: "f1",
    name: "Abandoned Cart Recovery",
    status: "active",
    channels: ["whatsapp", "email"],
    trigger: "Event · cart_abandoned",
    updatedAt: "2 hours ago",
    nodeCount: 7,
    preview: "cart",
  },
  {
    id: "f2",
    name: "Abandoned Add to Cart",
    status: "inactive",
    channels: ["sms", "push"],
    trigger: "Event · add_to_cart",
    updatedAt: "3 days ago",
    nodeCount: 5,
    preview: "simple",
  },
  {
    id: "f3",
    name: "Abandon Checkout Dragon Flow",
    status: "test_mode",
    channels: ["whatsapp", "email", "sms"],
    trigger: "Event · checkout_started",
    updatedAt: "1 day ago",
    nodeCount: 9,
    preview: "branched",
  },
  {
    id: "f4",
    name: "Abandon Checkout Omnichannel",
    status: "test_mode",
    channels: ["whatsapp", "email", "push", "sms"],
    trigger: "Event · checkout_started",
    updatedAt: "5 hours ago",
    nodeCount: 12,
    preview: "branched",
  },
  {
    id: "f5",
    name: "Address Update WA",
    status: "active",
    channels: ["whatsapp"],
    trigger: "Event · address_updated",
    updatedAt: "Just now",
    nodeCount: 4,
    preview: "simple",
  },
  {
    id: "f6",
    name: "Address Update AI Agent",
    status: "test_mode",
    channels: ["aicall", "whatsapp"],
    trigger: "Webhook · address_update",
    updatedAt: "2 days ago",
    nodeCount: 6,
    preview: "cart",
  },
  {
    id: "f7",
    name: "Win-Back Campaign",
    status: "active",
    channels: ["email", "push"],
    trigger: "Segment · lapsed_users",
    updatedAt: "4 days ago",
    nodeCount: 8,
    preview: "branched",
  },
  {
    id: "f8",
    name: "Post-Purchase Follow Up",
    status: "inactive",
    channels: ["email", "sms"],
    trigger: "Event · order_placed",
    updatedAt: "1 week ago",
    nodeCount: 5,
    preview: "simple",
  },
  {
    id: "f9",
    name: "Flash Sale Blast",
    status: "archived",
    channels: ["push", "inapp", "sms"],
    trigger: "Schedule · one-time",
    updatedAt: "2 months ago",
    nodeCount: 3,
    preview: "simple",
  },
  {
    id: "f10",
    name: "VIP Loyalty Nurture",
    status: "active",
    channels: ["whatsapp", "email", "rcs"],
    trigger: "Segment · vip_buyers",
    updatedAt: "6 hours ago",
    nodeCount: 10,
    preview: "branched",
  },
];

export const defaultStartFlowNodeData = {
  label: "Start Flow",
  linkedFlowId: null,
  linkedFlowName: null,
  linkedFlowStatus: null,
};
