import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Plus, Search, MessageCircle, Mail,
  MessageSquare, Bell, Phone, ChevronRight, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useConversationStore } from "@/store/uiStore";

// ── brand tokens ──────────────────────────────────────────────────────────────
const PRIMARY = "#6C3AE8";

const CHANNEL_ICONS = {
  whatsapp: { Icon: MessageCircle, color: "#25D366", label: "WhatsApp" },
  email:    { Icon: Mail,          color: "#3B82F6", label: "Email"    },
  sms:      { Icon: MessageSquare, color: "#F59E0B", label: "SMS"      },
  push:     { Icon: Bell,          color: "#8B5CF6", label: "Push"     },
  phone:    { Icon: Phone,         color: "#64748B", label: "Phone"    },
};


function ChannelIcon({ type }) {
  const meta = CHANNEL_ICONS[type];
  if (!meta) return null;
  const { Icon, color } = meta;
  return (
    <span
      className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{ backgroundColor: color + "18" }}
      title={meta.label}
    >
      <Icon className="w-3.5 h-3.5" style={{ color }} />
    </span>
  );
}

// ── AI-recommended templates ──────────────────────────────────────────────────
const AI_RECO = [
  {
    id: "r1",
    name: "Cart Recovery",
    desc: "Bring back users who abandoned their cart in the last 24 hours.",
    badge: "High conversion potential",
    channels: ["whatsapp", "email"],
  },
  {
    id: "r2",
    name: "Winback — 60 Day Lapsed",
    desc: "Re-engage customers who haven't ordered in 60+ days.",
    badge: "3.2x ROI expected",
    channels: ["whatsapp", "push"],
  },
  {
    id: "r3",
    name: "Welcome Series",
    desc: "Warm-up journey for first-time signups across channels.",
    badge: "Boosts activation by 24%",
    channels: ["email", "whatsapp"],
  },
];

// ── AI Flow Assist chips ──────────────────────────────────────────────────────
const ASSIST_CHIPS = [
  "Re-Engage Inactive Users — Multi-Channel",
  "Feedback Collection Post-Purchase",
  "Abandoned Cart Reminder — Multi-Channel",
  "Upsell to Recent Buyers — Multi-Channel",
  "Browse Abandonment — Multi-Channel",
  "Post-Delivery Review Request",
  "Win-Back Lapsed VIPs",
];

// ── Template library ──────────────────────────────────────────────────────────
const TEMPLATE_GROUPS = [
  {
    label: "Recommended",
    templates: [
      {
        id: "blank",
        blank: true,
        name: "Create a blank canvas",
      },
      {
        id: "t-onboard-single",
        icon: "🤝",
        name: "Onboard Customers — Single Channel",
        category: "Adoption Templates",
        desc: "This Flow uses a single channel to welcome new customers and guide them towards sign-up. The same channel is then used to nudge customers towards their first purchase.",
        channels: ["email"],
      },
      {
        id: "t-onboard-multi",
        icon: "🤝",
        name: "Onboard Customers — Multi-channel",
        category: "Adoption Templates",
        desc: "This Flow uses multiple channels to welcome new customers and guide them towards sign-up. A/B testing is used to optimise for the best channel to guide towards sign-up.",
        channels: ["email", "whatsapp", "sms"],
      },
    ],
  },
  {
    label: "Engagement Templates",
    templates: [
      {
        id: "t-cart-single",
        icon: "🛒",
        name: "Abandoned Cart Reminder — Single Channel",
        category: "Engagement Templates",
        desc: "77% of shoppers abandon their cart. Reduce your cart abandonment by using this single-channel flow to nudge customers back.",
        channels: ["whatsapp"],
      },
      {
        id: "t-cart-multi",
        icon: "🛒",
        name: "Abandoned Cart Reminder — Multi Channel",
        category: "Engagement Templates",
        desc: "About 12% of online store's daily revenue sits in carts. This Flow uses a multi-channel strategy to reduce abandoned cart instances.",
        channels: ["whatsapp", "email", "sms"],
      },
      {
        id: "t-browse",
        icon: "👁",
        name: "Browse Abandonment — Multi-Channel",
        category: "Engagement Templates",
        desc: "Re-engage customers who browsed categories and dropped off. Use this flow to retarget and drive them back.",
        channels: ["whatsapp", "email"],
      },
    ],
  },
  {
    label: "Conversion Templates",
    templates: [
      {
        id: "t-checkout",
        icon: "💳",
        name: "Checkout Recovery — WhatsApp + Email",
        category: "Conversion Templates",
        desc: "Target users who reached checkout but didn't complete payment. Highest-intent abandonment segment.",
        channels: ["whatsapp", "email"],
      },
      {
        id: "t-cod",
        icon: "📞",
        name: "COD Confirmation — AI Calling",
        category: "Conversion Templates",
        desc: "Reduce RTO on COD orders with AI calling. Confirm intent before dispatch.",
        channels: ["phone"],
      },
    ],
  },
  {
    label: "Retention Templates",
    templates: [
      {
        id: "t-review",
        icon: "⭐",
        name: "Post-Purchase Review Request",
        category: "Retention Templates",
        desc: "Collect product reviews 3 days after delivery. Highest engagement window for review requests.",
        channels: ["whatsapp", "email"],
      },
      {
        id: "t-upsell",
        icon: "📈",
        name: "Post-Purchase Upsell — Bundles",
        category: "Retention Templates",
        desc: "Suggest complementary products to recent buyers. Personalised bundle recommendations.",
        channels: ["whatsapp", "email"],
      },
    ],
  },
  {
    label: "Re-engagement Templates",
    templates: [
      {
        id: "t-winback-30",
        icon: "🔄",
        name: "Win-Back — 30 Day Lapsed",
        category: "Re-engagement Templates",
        desc: "Re-engage customers who haven't ordered in 30+ days with a personalised reminder.",
        channels: ["whatsapp", "email"],
      },
      {
        id: "t-winback-60",
        icon: "🔄",
        name: "Win-Back — 60 Day Lapsed",
        category: "Re-engagement Templates",
        desc: "Deeper re-engagement for users dormant 60+ days. Includes incentive in message 3.",
        channels: ["whatsapp", "email", "sms"],
      },
    ],
  },
];

// ── sub-components ────────────────────────────────────────────────────────────
function AIRecoCard({ tpl, onUse }) {
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col hover:shadow-sm transition-shadow">
      <h3 className="text-[13px] font-semibold text-text-primary mb-1">{tpl.name}</h3>
      <p className="text-[12px] text-text-secondary flex-1 mb-3 leading-relaxed">{tpl.desc}</p>
      <div className="flex items-center gap-1 mb-3">
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[11px] text-primary font-medium">{tpl.badge}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-4">
        {tpl.channels.map((c) => <ChannelIcon key={c} type={c} />)}
      </div>
      <button
        type="button"
        onClick={() => onUse(tpl)}
        className="w-full px-3 py-1.5 rounded-md border border-primary text-primary text-[12px] font-medium hover:bg-primary-tint flex items-center justify-center gap-1"
      >
        Use Template <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TemplateCard({ tpl, onUse }) {
  if (tpl.blank) {
    return (
      <button
        type="button"
        onClick={() => onUse(tpl)}
        className="w-full h-full border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary-tint/30 transition-colors text-text-muted hover:text-primary bg-white"
      >
        <Plus className="w-6 h-6 mb-2" />
        <span className="text-[13px] font-medium">Create a blank canvas</span>
      </button>
    );
  }
  return (
    <div className="bg-white border border-border rounded-lg p-4 flex flex-col hover:shadow-sm transition-shadow h-full">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xl leading-none">{tpl.icon}</span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-text-primary leading-tight">{tpl.name}</div>
          <div className="text-[11px] text-text-muted mt-0.5">{tpl.category}</div>
        </div>
      </div>
      <p className="text-[12px] text-text-secondary flex-1 mb-3 leading-relaxed line-clamp-3">{tpl.desc}</p>
      <div className="flex items-center gap-1.5">
        {tpl.channels.map((c) => <ChannelIcon key={c} type={c} />)}
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function FlowCreateV2Page() {
  const navigate = useNavigate();
  const openWith = useConversationStore((s) => s.openWith);
  const [prompt, setPrompt] = useState("");
  const [search, setSearch] = useState("");
  const chipsRef = useRef(null);

  const handleUseTemplate = (tpl) => {
    if (tpl.blank) {
      navigate("/flows-v2/builder/new");
      return;
    }
    toast.success(`Loading "${tpl.name}" template…`);
    navigate("/flows-v2/builder/new");
  };

  const handleAssistSubmit = () => {
    const text = prompt.trim();
    if (!text) return;
    openWith({
      seedMessage: `${text}\n\nBuild me a complete flow for this. Design the full sequence — trigger, channels, timing — and show me the flow preview.`,
      pinnedAgent: "dev",
      source: "flow_assist",
    });
    setPrompt("");
  };

  const filteredGroups = search.trim()
    ? TEMPLATE_GROUPS.map((g) => ({
        ...g,
        templates: g.templates.filter(
          (t) =>
            !t.blank &&
            (t.name.toLowerCase().includes(search.toLowerCase()) ||
              (t.desc || "").toLowerCase().includes(search.toLowerCase())),
        ),
      })).filter((g) => g.templates.length > 0)
    : TEMPLATE_GROUPS;

  return (
    <div className="space-y-8 animate-fade-in-up max-w-[1200px] mx-auto" data-testid="page-flow-create-v2">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/flows-v2")}
          className="inline-flex items-center gap-1 text-[12px] text-text-muted hover:text-text-secondary mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Flows
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] tracking-tight text-text-primary">
              Create{" "}
              <span className="font-bold">
                Flows
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Start with a template or build from scratch
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => navigate("/flows-v2/builder/new")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border bg-surface text-text-primary text-sm font-medium hover:bg-slate-50"
            >
              Create from Scratch
            </button>
          </div>
        </div>
      </div>

      {/* Template Library */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-text-primary">
            Jumpstart using templates
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by use case"
              className="pl-8 pr-3 py-1.5 text-[12px] rounded-md border border-border bg-white w-[200px] focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <h3 className="text-[13px] font-semibold text-text-primary mb-3">
                {group.label}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                {group.templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="cursor-pointer flex flex-col"
                    onClick={() => handleUseTemplate(tpl)}
                  >
                    <TemplateCard tpl={tpl} onUse={handleUseTemplate} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
