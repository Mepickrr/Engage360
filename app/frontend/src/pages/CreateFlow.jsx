import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchIntelligenceCards } from "@/lib/engageApi";
import { useConversationStore } from "@/store/uiStore";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Sparkles,
  Search,
  MessageCircle,
  Mail,
  MessageSquare,
  Bell,
  Phone,
} from "lucide-react";

// ───────── Channels ─────────
const CHANNEL_META = {
  whatsapp: { icon: MessageCircle, color: "#22C55E", label: "WhatsApp" },
  email: { icon: Mail, color: "#3B82F6", label: "Email" },
  sms: { icon: MessageSquare, color: "#8B5CF6", label: "SMS" },
  push: { icon: Bell, color: "#F59E0B", label: "Push" },
  ai_call: { icon: Phone, color: "#EC4899", label: "AI Call" },
};

function ChannelRow({ channels = [] }) {
  return (
    <div className="flex items-center gap-1.5">
      {channels.map((c) => {
        const m = CHANNEL_META[c];
        if (!m) return null;
        const Icon = m.icon;
        return (
          <span
            key={c}
            className="inline-flex items-center gap-1 text-[10px] font-medium"
            style={{ color: m.color }}
            title={m.label}
          >
            <Icon className="w-3.5 h-3.5" />
          </span>
        );
      })}
    </div>
  );
}

// ───────── AI Recommendation card → channel inference ─────────
const CARD_CHANNEL_HINT = {
  rishi: ["whatsapp"],
  meera: ["whatsapp", "email", "sms"],
  aryan: ["whatsapp", "email"],
  dev: ["whatsapp"],
  zara: ["whatsapp", "email"],
  priya: ["whatsapp"],
};

const FALLBACK_RECS = [
  {
    id: "fb-1",
    title: "Recover Abandoned Checkouts",
    description:
      "Recapture revenue from users who dropped off mid-checkout in the last 7 days.",
    goal: "Est. ₹2.4L recovery",
    channels: ["whatsapp", "email"],
    agent_id: "aryan",
  },
  {
    id: "fb-2",
    title: "Win-Back Lapsed VIPs",
    description:
      "Bring back high-value customers who haven't ordered in 60+ days.",
    goal: "Est. 12% reactivation",
    channels: ["whatsapp", "sms"],
    agent_id: "meera",
  },
  {
    id: "fb-3",
    title: "Payday Engagement Window",
    description:
      "Trigger a campaign for your top buyers during the 1st–5th payday window.",
    goal: "Est. ₹1.8L upside",
    channels: ["whatsapp", "email", "push"],
    agent_id: "aryan",
  },
];

// Best-effort: derive a short title from a card's long headline.
function titleFromHeadline(h) {
  if (!h) return "Recommendation";
  const stop = h.indexOf(".");
  const first = stop > 0 ? h.slice(0, stop) : h;
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}

function mapCardToRec(card) {
  const channels = CARD_CHANNEL_HINT[card.agent_id] || ["whatsapp", "email"];
  const goalStat = (card.stats || [])[0];
  return {
    id: card.id,
    title: titleFromHeadline(card.headline),
    description: card.headline,
    goal: goalStat ? `${goalStat.label}: ${goalStat.value}` : "AI suggested",
    channels,
    agent_id: card.agent_id || "dev",
  };
}

// ───────── Templates ─────────
const TEMPLATE_GROUPS = [
  {
    id: "recommended",
    name: "Recommended",
    items: [
      {
        id: "blank",
        blank: true,
      },
      {
        id: "onboard-single",
        emoji: "👋",
        category: "Onboarding",
        name: "Onboard Customers — Single Channel",
        description:
          "Welcome new customers via one channel with a clean intro sequence.",
        channels: ["email"],
      },
      {
        id: "onboard-multi",
        emoji: "👋",
        category: "Onboarding",
        name: "Onboard Customers — Multi-channel",
        description:
          "Welcome new customers across email, WhatsApp, and SMS.",
        channels: ["email", "whatsapp", "sms"],
      },
    ],
  },
  {
    id: "engagement",
    name: "Engagement Templates",
    items: [
      {
        id: "cart-single",
        emoji: "🛒",
        category: "Engagement",
        name: "Abandoned Cart Reminder — Single Channel",
        description:
          "Nudge cart abandoners with a single, well-timed message.",
        channels: ["whatsapp"],
      },
      {
        id: "cart-multi",
        emoji: "🛒",
        category: "Engagement",
        name: "Abandoned Cart Reminder — Multi Channel",
        description: "Recover carts using WhatsApp + Email + SMS sequence.",
        channels: ["whatsapp", "email", "sms"],
      },
      {
        id: "browse-multi",
        emoji: "🔍",
        category: "Engagement",
        name: "Browse Abandonment — Multi-Channel",
        description: "Re-engage users who browsed but didn't add to cart.",
        channels: ["whatsapp", "email"],
      },
    ],
  },
  {
    id: "conversion",
    name: "Conversion Templates",
    items: [
      {
        id: "checkout-wa-email",
        emoji: "💳",
        category: "Conversion",
        name: "Checkout Recovery — WhatsApp + Email",
        description:
          "Recover users who dropped off at checkout in two channels.",
        channels: ["whatsapp", "email"],
      },
      {
        id: "cod-ai-call",
        emoji: "📞",
        category: "Conversion",
        name: "COD Confirmation — AI Calling",
        description: "Reduce RTO by auto-confirming COD orders via AI call.",
        channels: ["ai_call"],
      },
    ],
  },
  {
    id: "retention",
    name: "Retention Templates",
    items: [
      {
        id: "post-review",
        emoji: "⭐",
        category: "Retention",
        name: "Post-Purchase Review Request",
        description: "Ask happy customers for a review at the right moment.",
        channels: ["whatsapp", "email"],
      },
      {
        id: "post-upsell",
        emoji: "🎁",
        category: "Retention",
        name: "Post-Purchase Upsell — Bundles",
        description: "Suggest complementary bundles after a purchase.",
        channels: ["whatsapp", "email"],
      },
    ],
  },
  {
    id: "reengagement",
    name: "Re-engagement Templates",
    items: [
      {
        id: "winback-30",
        emoji: "↩️",
        category: "Re-engagement",
        name: "Win-Back — 30 Day Lapsed",
        description: "Bring back customers who haven't engaged in 30 days.",
        channels: ["whatsapp", "sms"],
      },
      {
        id: "winback-60",
        emoji: "↩️",
        category: "Re-engagement",
        name: "Win-Back — 60 Day Lapsed",
        description: "Last-chance offer for 60-day lapsed customers.",
        channels: ["whatsapp", "sms", "push"],
      },
    ],
  },
];

const QUICK_PROMPTS = [
  "Re-Engage Inactive Users — Multi-Channel",
  "Abandoned Cart Reminder — Multi-Channel",
  "Feedback Collection Post-Purchase",
  "Upsell to Recent Buyers — Multi-Channel",
  "Win-Back Lapsed VIPs",
  "Post-Delivery Review Request",
];

// ───────── Page ─────────
export default function CreateFlow() {
  const navigate = useNavigate();
  const openWith = useConversationStore((s) => s.openWith);
  const [search, setSearch] = useState("");
  const [prompt, setPrompt] = useState("");

  const { data: cards = [] } = useQuery({
    queryKey: ["intelligence-cards"],
    queryFn: fetchIntelligenceCards,
    staleTime: 60_000,
  });

  const recommendations = useMemo(() => {
    if (!cards || cards.length === 0) return FALLBACK_RECS;
    return cards.slice(0, 3).map(mapCardToRec);
  }, [cards]);

  const goBuilder = () => navigate("/flows/builder/new");
  const goBuilderWithTemplate = (slug) =>
    navigate(`/flows/builder/new?template=${encodeURIComponent(slug)}`);

  const openConvForRec = (rec) => {
    const seed = `Build a flow to ${rec.title.toLowerCase()}. ${rec.description} Use channels: ${rec.channels.join(", ")}.`;
    openWith({
      seedMessage: seed,
      pinnedAgent: rec.agent_id || "dev",
      source: "intelligence_card",
    });
  };

  const submitPrompt = () => {
    const text = prompt.trim();
    if (!text) return;
    openWith({ seedMessage: text, source: "ask_ai" });
    setPrompt("");
  };

  // Filter templates by search (preserving blank canvas in Recommended).
  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TEMPLATE_GROUPS;
    return TEMPLATE_GROUPS.map((g) => {
      const items = g.items.filter((t) => {
        if (t.blank) return g.id === "recommended"; // keep blank always in Recommended
        return (t.name || "").toLowerCase().includes(q);
      });
      return { ...g, items };
    }).filter((g) => g.items.length > 0);
  }, [search]);

  return (
    <div
      className="max-w-[1280px] mx-auto space-y-8"
      data-testid="page-create-flow"
    >
      {/* Header */}
      <header className="bg-surface border-b border-border -mx-6 -mt-6 px-6 pt-5 pb-6">
        <button
          type="button"
          onClick={() => navigate("/flows")}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
          data-testid="create-flow-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Flows
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
              Create Flows
            </h1>
            <p className="text-[13px] text-text-secondary mt-1">
              Start with a template or build from scratch.
            </p>
          </div>
          <button
            type="button"
            onClick={goBuilder}
            data-testid="create-flow-scratch"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
            }}
          >
            <Plus className="w-4 h-4" />
            Create from Scratch
          </button>
        </div>
      </header>

      {/* Section A — AI Recommendation */}
      <section data-testid="create-flow-recs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-text-primary">
              AI Recommendation
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-semibold"
              style={{ backgroundColor: "#10B981" }}
            >
              A
            </span>
            Suggested by Aryan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations.map((rec) => (
            <article
              key={rec.id}
              data-testid={`create-flow-rec-${rec.id}`}
              className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-2.5"
              style={{ minHeight: 210 }}
            >
              <h3 className="text-sm font-semibold text-text-primary leading-tight">
                {rec.title}
              </h3>
              <p className="text-xs text-text-secondary line-clamp-3">
                {rec.description}
              </p>
              <span className="inline-flex self-start items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-tint text-primary">
                {rec.goal}
              </span>
              <ChannelRow channels={rec.channels} />
              <button
                type="button"
                onClick={() => openConvForRec(rec)}
                className="mt-auto w-full py-2 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary-tint transition-colors inline-flex items-center justify-center gap-1.5"
                data-testid={`create-flow-rec-build-${rec.id}`}
              >
                Build the flow
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Section B — AI Flow Assist */}
      <section
        className="bg-gradient-to-br from-purple-50 via-white to-blue-50 border border-border rounded-xl p-6"
        data-testid="create-flow-assist"
      >
        <div className="text-sm text-text-secondary mb-3">
          Create using{" "}
          <span className="font-semibold text-text-primary inline-flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Flow Assist
          </span>
        </div>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submitPrompt();
            }
          }}
          placeholder="Send a wallet expiry renewal reminder flow for wallet customers whose policy expires in 15 days."
          className="w-full bg-surface text-sm resize-none"
          data-testid="create-flow-assist-input"
        />
        <div className="mt-2 flex justify-end min-h-[36px]">
          {prompt.trim().length > 0 && (
            <button
              type="button"
              onClick={submitPrompt}
              data-testid="create-flow-assist-submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-white text-sm font-medium animate-in fade-in"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #6C3AE8 0%, #8B5CF6 100%)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Build with AI
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setPrompt(q)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border bg-surface text-xs text-text-secondary hover:border-primary/60 hover:bg-primary-tint hover:text-primary transition-colors whitespace-nowrap"
              data-testid={`create-flow-chip-${q.slice(0, 12)}`}
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      {/* Section C — Template Library */}
      <section data-testid="create-flow-templates">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">
            Jumpstart using templates
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by use case"
              data-testid="create-flow-template-search"
              className="pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface w-[240px] focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>

        <div className="space-y-7">
          {filteredGroups.map((g) => (
            <div key={g.id}>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <span>{g.name}</span>
                <span className="flex-1 h-px bg-border" />
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {g.items.map((t) => {
                  if (t.blank) {
                    return (
                      <button
                        type="button"
                        key="blank"
                        onClick={goBuilder}
                        data-testid="create-flow-template-blank"
                        className="rounded-lg p-5 text-center flex flex-col items-center justify-center gap-1.5 hover:border-primary transition-colors"
                        style={{
                          border: "2px dashed #D4D4D8",
                          minHeight: 180,
                        }}
                      >
                        <Plus className="w-8 h-8 text-text-muted" />
                        <div className="text-sm font-semibold text-text-primary">
                          Create a blank canvas
                        </div>
                        <div className="text-[11px] text-text-muted">
                          Start from scratch
                        </div>
                      </button>
                    );
                  }
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => goBuilderWithTemplate(t.id)}
                      data-testid={`create-flow-template-${t.id}`}
                      className="bg-surface border border-border rounded-lg p-3.5 text-left flex flex-col gap-2 hover:border-primary hover:shadow-sm transition-all"
                      style={{ minHeight: 180 }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-2xl leading-none">{t.emoji}</span>
                        <span className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                          {t.category}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-text-primary line-clamp-2">
                        {t.name}
                      </div>
                      <div className="text-xs text-text-secondary line-clamp-3 flex-1">
                        {t.description}
                      </div>
                      <ChannelRow channels={t.channels} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <div className="text-center py-12 text-sm text-text-muted">
              No templates match "{search}"
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
