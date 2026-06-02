import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchIntelligenceCards, refreshIntelligenceCard } from "@/lib/engageApi";
import { getAgentMeta, timeAgo, hexAlpha } from "@/lib/agentMeta";
import { useConversationStore } from "@/store/uiStore";
import { RefreshCcw, AlertTriangle, Sparkles, Lightbulb } from "lucide-react";

const URGENCY_BADGE = {
  critical: {
    label: "Critical",
    bg: "bg-rose-50",
    fg: "text-rose-700",
    dot: "bg-rose-500",
    Icon: AlertTriangle,
  },
  opportunity: {
    label: "Opportunity",
    bg: "bg-amber-50",
    fg: "text-amber-700",
    dot: "bg-amber-500",
    Icon: Sparkles,
  },
  insight: {
    label: "Insight",
    bg: "bg-slate-100",
    fg: "text-slate-700",
    dot: "bg-slate-400",
    Icon: Lightbulb,
  },
};

const STATUS_BAR = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
};

function buildCardOpener(card) {
  // For Aryan's "Build" CTAs, route to Dev with an explicit flow-building
  // prompt — the orchestrator + hardening rules will pick flow_brief reliably.
  if (card.agent_id === "aryan" && /build/i.test(card.cta_primary)) {
    return {
      seedMessage: `Build a flow to act on this opportunity: ${card.headline}\n\nDesign the full flow — segment, channels, sequence, timing — and lay out the steps.`,
      pinnedAgent: "dev",
    };
  }
  // Meera's "Build this segment" CTA — pin Meera, ask for a segment definition.
  if (card.agent_id === "meera" && /segment/i.test(card.cta_primary)) {
    return {
      seedMessage: `Build the segment for this opportunity: ${card.headline}\n\nSave the segment definition with the conditions and estimated size.`,
      pinnedAgent: "meera",
    };
  }
  // Default: stay with the suggesting agent and ask to walk through next steps.
  return {
    seedMessage: `I want to act on this: ${card.headline}\n\nWalk me through the recommended next steps.`,
    pinnedAgent: card.agent_id,
  };
}

export default function IntelligenceCards() {
  const queryClient = useQueryClient();
  const openWith = useConversationStore((s) => s.openWith);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["intel-cards"],
    queryFn: fetchIntelligenceCards,
    staleTime: 60_000,
  });

  const refreshMut = useMutation({
    mutationFn: refreshIntelligenceCard,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["intel-cards"] }),
  });

  const handleCta = (card) => {
    const { seedMessage, pinnedAgent } = buildCardOpener(card);
    openWith({
      seedMessage,
      pinnedAgent,
      source: "intelligence_card",
    });
  };

  return (
    <section data-testid="intelligence-cards">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-text-primary">
          What needs your attention
        </h2>
        <span className="text-xs text-text-muted">{cards.length} signals</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`intel-skeleton-${i}`}
              className="h-[220px] bg-surface border border-border rounded-lg animate-pulse"
            />
          ))}

        {!isLoading &&
          cards.map((card) => {
            const meta = getAgentMeta(card.agent_id);
            const badge = URGENCY_BADGE[card.urgency] || URGENCY_BADGE.insight;
            const BadgeIcon = badge.Icon;
            const fresh = timeAgo(card.generated_at);
            return (
              <div
                key={card.id}
                data-testid={`intel-card-${card.agent_id}`}
                className="relative bg-surface border border-border rounded-lg p-4 flex flex-col h-full overflow-hidden"
                style={{ borderTopColor: meta.color, borderTopWidth: 3 }}
              >
                {card.status_bar && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 ${STATUS_BAR[card.status_bar]}`}
                  />
                )}

                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-medium text-text-primary truncate">
                        {meta.name}
                      </div>
                      <div className="text-[10px] text-text-muted truncate">
                        {meta.domain}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${badge.bg} ${badge.fg}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </div>

                {card.collaboration_badge && (
                  <div
                    className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium self-start"
                    style={{
                      backgroundColor: hexAlpha(meta.color, 0.1),
                      color: meta.color,
                    }}
                  >
                    {card.collaboration_badge}
                  </div>
                )}

                {/* Headline */}
                <p className="mt-3 text-[14px] font-medium text-text-primary leading-snug line-clamp-3">
                  {card.headline}
                </p>

                {/* Stats */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {(card.stats || []).map((s) => (
                    <div
                      key={s.label}
                      className="px-2 py-1 rounded-md bg-slate-50 border border-border"
                    >
                      <div className="text-[9px] uppercase tracking-wide text-text-muted">
                        {s.label}
                      </div>
                      <div className="text-[12px] font-semibold text-text-primary">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="mt-auto pt-3 flex items-end justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    Generated {fresh}
                    <button
                      type="button"
                      onClick={() => refreshMut.mutate(card.id)}
                      className="ml-1 p-0.5 hover:text-primary transition-colors"
                      data-testid={`intel-card-refresh-${card.agent_id}`}
                      title="Refresh"
                    >
                      <RefreshCcw className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-[11px] rounded-md border border-border hover:bg-slate-50 text-text-secondary"
                      data-testid={`intel-card-secondary-${card.agent_id}`}
                      onClick={() => handleCta(card)}
                    >
                      {card.cta_secondary}
                    </button>
                    <button
                      type="button"
                      data-testid={`intel-card-primary-${card.agent_id}`}
                      onClick={() => handleCta(card)}
                      className="px-2.5 py-1 text-[11px] font-medium rounded-md text-white"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      {card.cta_primary}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
