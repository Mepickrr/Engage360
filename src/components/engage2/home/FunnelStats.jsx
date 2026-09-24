import React from "react";
import { Users, Fingerprint, ShoppingCart, TrendingDown } from "lucide-react";
import { computeRevenueOpportunity } from "@/components/engage2/RevenueOpportunityCard2";
import { JOURNEYS } from "@/components/engage2/journey-dashboard/data";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/analyticsFormat";

// aov mirrors MOCK_STORE_ACTIVITY.aov (100) — computeRevenueOpportunity()
// doesn't return aov directly, and this funnel needs it for a
// cart+checkout-specific (not checkout-only) missed-opportunity figure.
const AOV = 100;

function volumeFor(journeyType) {
  return JOURNEYS.find((j) => j.journeyType === journeyType && j.audience === "Known")
    .estimatedDailyVolume;
}

export default function FunnelStats() {
  const { visitorsPerDay, identifiedPerDay } = computeRevenueOpportunity();
  const cartCheckoutPerDay = volumeFor("Abandoned Cart") + volumeFor("Abandoned Checkout");
  const missedOpportunityPerDay = cartCheckoutPerDay * AOV;
  const identifiedPct = Math.round((identifiedPerDay / visitorsPerDay) * 100);
  const cartCheckoutPct = Math.round((cartCheckoutPerDay / visitorsPerDay) * 100);

  const stats = [
    {
      key: "total-visitors",
      icon: Users,
      iconClass: "bg-primary-tint text-primary",
      value: formatCompactNumber(visitorsPerDay),
      label: "Total visitors",
      note: "Unique sessions on your store",
      barPct: 100,
    },
    {
      key: "identified-shoppers",
      icon: Fingerprint,
      iconClass: "bg-primary-tint text-primary",
      value: formatCompactNumber(identifiedPerDay),
      label: "Identified shoppers",
      note: `${identifiedPct}% reachable on WhatsApp via Fastrr`,
      barPct: identifiedPct,
    },
    {
      key: "abandoned-carts-checkouts",
      icon: ShoppingCart,
      iconClass: "bg-warning-bg text-warning",
      value: formatCompactNumber(cartCheckoutPerDay),
      label: "Abandoned carts & checkouts",
      note: "Left with items, without paying",
      barPct: cartCheckoutPct,
    },
    {
      key: "missed-opportunity",
      icon: TrendingDown,
      iconClass: "bg-destructive/10 text-destructive",
      value: formatCompactCurrency(missedOpportunityPerDay),
      label: "Missed opportunity",
      note: "Value of carts not converted, per day",
      barPct: 100,
      danger: true,
    },
  ];

  return (
    <div className="mb-10" data-testid="funnel-stats">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Mystore1 · Last 30 days
          </div>
          <h2 className="text-2xl font-bold text-text-primary mt-1">
            Where your shoppers drop off
          </h2>
        </div>
        <span className="text-sm text-text-secondary">Live from your Fastrr checkout data</span>
      </div>
      <div className="flex flex-wrap gap-4">
        {[stats.slice(0, 2), stats.slice(2)].map((pair, pairIdx) => (
          <div
            key={pairIdx}
            className="flex-1 min-w-[280px] grid grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden"
          >
            {pair.map((s) => (
              <div
                key={s.key}
                className={`p-5 ${s.danger ? "bg-destructive/10" : "bg-surface"}`}
                data-testid={`funnel-stat-${s.key}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${s.iconClass}`}
                  >
                    <s.icon className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-semibold text-text-secondary">{s.label}</span>
                </div>
                <div
                  className={`text-2xl font-bold ${s.danger ? "text-destructive" : "text-text-primary"}`}
                >
                  {s.value}
                </div>
                <div className="h-1.5 rounded-full bg-border mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.danger ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, s.barPct)}%` }}
                  />
                </div>
                <div className="text-xs text-text-secondary mt-2">{s.note}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
