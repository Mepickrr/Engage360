import React from "react";
import { Users, ShoppingCart, ArrowRight, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/analyticsFormat";

// Prototype mock data — stands in for the seller's real analytics (website
// visitors, checkout funnel) until that integration exists. The seller never
// edits these; they're presented as system-captured, per product decision.
export const MOCK_STORE_ACTIVITY = {
  visitorsPerDay: 10000,
  abandonedCheckoutPerDay: 4000,
  aov: 100,
};

const DAYS_PER_MONTH = 30;

export function computeRevenueOpportunity(activity = MOCK_STORE_ACTIVITY) {
  const { visitorsPerDay, abandonedCheckoutPerDay, aov } = activity;
  const abandonmentRate = Math.round((abandonedCheckoutPerDay / visitorsPerDay) * 100);
  const dailyRevenueAtRisk = abandonedCheckoutPerDay * aov;
  const monthlyRevenueAtRisk = dailyRevenueAtRisk * DAYS_PER_MONTH;
  return {
    visitorsPerDay,
    abandonedCheckoutPerDay,
    abandonmentRate,
    dailyRevenueAtRisk,
    monthlyRevenueAtRisk,
  };
}

function EyebrowBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-text-secondary mb-3">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success animate-pulse-soft" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Based on your store's recent activity
    </div>
  );
}

function Funnel({ visitorsPerDay, abandonedCheckoutPerDay, abandonmentRate, compact }) {
  return (
    <div className={`flex items-center ${compact ? "gap-2 mb-3" : "gap-4 mb-5"}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className={`font-bold text-text-primary ${compact ? "text-sm" : "text-base"}`}>
            {formatCompactNumber(visitorsPerDay)}
          </div>
          <div className="text-[10px] text-text-secondary leading-tight">
            visitors/day
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center flex-shrink-0">
        <ArrowRight className="w-4 h-4 text-text-muted" />
        {!compact && (
          <span className="text-[10px] font-semibold text-warning whitespace-nowrap">
            {`${abandonmentRate}% abandon`}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-md bg-warning-bg flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-4 h-4 text-warning" />
        </div>
        <div>
          <div className={`font-bold text-text-primary ${compact ? "text-sm" : "text-base"}`}>
            {formatCompactNumber(abandonedCheckoutPerDay)}
          </div>
          <div className="text-[10px] text-text-secondary leading-tight">
            abandoned checkouts/day
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RevenueOpportunityCard({
  variant = "full",
  ctaLabel,
  onCtaClick,
}) {
  const compact = variant === "compact";
  const { visitorsPerDay, abandonedCheckoutPerDay, abandonmentRate, dailyRevenueAtRisk, monthlyRevenueAtRisk } =
    computeRevenueOpportunity();

  return (
    <div
      className={`bg-surface border-l-4 border-warning border-y border-r border-border rounded-lg ${
        compact ? "p-4 mb-6" : "p-6 mb-10"
      }`}
      data-testid="fastrr-revenue-opportunity"
    >
      <EyebrowBadge />

      <h3 className={`font-semibold text-text-primary mb-3 ${compact ? "text-sm" : "text-lg"}`}>
        {compact
          ? "Revenue You're Leaving on the Table"
          : "Here's What Abandoned Checkouts Are Costing You"}
      </h3>

      <Funnel
        visitorsPerDay={visitorsPerDay}
        abandonedCheckoutPerDay={abandonedCheckoutPerDay}
        abandonmentRate={abandonmentRate}
        compact={compact}
      />

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-warning-bg flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-warning" />
        </div>
        <div>
          <div
            className={`font-bold text-text-primary leading-none ${compact ? "text-2xl" : "text-3xl"}`}
            data-testid="fastrr-revenue-opportunity-monthly"
          >
            {formatCompactCurrency(monthlyRevenueAtRisk)}
            <span className="text-sm font-medium text-text-secondary">/month</span>
          </div>
          <div className="text-xs text-text-secondary mt-1">
            {`Estimated revenue at risk — ≈ ${formatCompactCurrency(dailyRevenueAtRisk)}/day left unclaimed`}
          </div>
        </div>
      </div>

      <Button
        type="button"
        size={compact ? "default" : "lg"}
        className="w-full"
        data-testid="fastrr-revenue-opportunity-cta"
        onClick={onCtaClick}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
