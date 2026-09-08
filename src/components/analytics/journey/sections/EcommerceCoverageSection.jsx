import React from "react";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const FLAG_STYLE = {
  healthy: "bg-emerald-50 text-emerald-700",
  "needs-attention": "bg-amber-50 text-amber-700",
  "no-data-yet": "bg-slate-100 text-slate-600",
  "not-automated": "bg-rose-50 text-rose-700",
};
const FLAG_LABEL = {
  healthy: "Healthy",
  "needs-attention": "Needs Attention",
  "no-data-yet": "No Data Yet",
  "not-automated": "Not Automated",
};

export default function EcommerceCoverageSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-coverage-skeleton" rows={5} />;

  return (
    <div data-testid="journey-coverage-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Ecommerce coverage map</h2>
        <PoweredByLabel source="Flow builder + trigger inference" />
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="journey-coverage-table">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2">Stage</th>
              <th className="px-4 py-2">Journeys</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Total Triggers</th>
              <th className="px-4 py-2">Revenue</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.ecommerceCoverage.map((row) => (
              <tr key={row.stage} className="border-t border-border" data-testid={`journey-coverage-${row.stage.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <td className="px-4 py-2 font-medium">{row.stage}</td>
                <td className="px-4 py-2 tabular-nums">{formatCompactNumber(row.journeyCount)}</td>
                <td className="px-4 py-2 tabular-nums">{formatCompactNumber(row.activeJourneyCount)}</td>
                <td className="px-4 py-2 tabular-nums">{formatCompactNumber(row.totalTriggers)}</td>
                <td className="px-4 py-2 tabular-nums">{formatCompactCurrency(row.revenue)}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${FLAG_STYLE[row.healthFlag]}`}>{FLAG_LABEL[row.healthFlag]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
