import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStoreStats } from "@/lib/engageApi";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

function formatINR(value) {
  if (value >= 100000)
    return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 2)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(value);
}

const KPI_DEFS = [
  { key: "revenue", label: "Revenue", format: (v) => formatINR(v) },
  { key: "total_orders", label: "Total Orders", format: (v) => formatNumber(v) },
  { key: "unique_users", label: "Unique Users", format: (v) => formatNumber(v) },
  { key: "active_flows", label: "Active Flows", format: (v) => v.toString() },
];

function DeltaChip({ pct }) {
  if (pct == null || pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-text-muted bg-slate-100 px-1.5 py-0.5 rounded-full">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }
  const positive = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
        positive
          ? "text-emerald-700 bg-emerald-50"
          : "text-rose-700 bg-rose-50"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {positive ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function StoreStatsRow() {
  const { data, isLoading } = useQuery({
    queryKey: ["store-stats"],
    queryFn: fetchStoreStats,
    staleTime: 60_000,
  });

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="store-stats-row"
    >
      {KPI_DEFS.map((kpi) => {
        const entry = data?.[kpi.key];
        return (
          <div
            key={kpi.key}
            data-testid={`kpi-${kpi.key}`}
            className="bg-surface border border-border rounded-lg p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <span className="text-[11px] uppercase tracking-wide text-text-muted font-medium">
                {kpi.label}
              </span>
              {entry && <DeltaChip pct={entry.delta_pct} />}
            </div>
            <div className="mt-2 text-2xl font-semibold text-text-primary tabular-nums">
              {isLoading || !entry ? "—" : kpi.format(entry.value)}
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">
              {entry?.period || ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}
