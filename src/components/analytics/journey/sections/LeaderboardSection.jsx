import React from "react";
import SortableTable from "../../fastrr/shared/SortableTable";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import SectionEmptyState from "../../fastrr/shared/SectionEmptyState";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const STATUS_STYLE = { live: "bg-emerald-50 text-emerald-700", paused: "bg-amber-50 text-amber-700", draft: "bg-slate-100 text-slate-600" };

const COLUMNS = [
  { key: "name", label: "Journey" },
  { key: "channel", label: "Channel" },
  { key: "status", label: "Status", formatter: (v) => <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_STYLE[v]}`}>{v}</span> },
  { key: "ecommerceStage", label: "Stage" },
  { key: "audienceTargeting", label: "Audience" },
  { key: "triggerType", label: "Trigger", formatter: (v) => v.replace(/_/g, " ") },
  { key: "totalTriggers", label: "Total Triggers", formatter: formatCompactNumber },
  { key: "triggersCapped", label: "Capped", formatter: formatCompactNumber },
  { key: "cancelledTriggers", label: "Cancelled", formatter: formatCompactNumber },
  { key: "customersActive", label: "Active Customers", formatter: formatCompactNumber },
  { key: "messagesSent", label: "Sent", formatter: formatCompactNumber },
  { key: "delivered", label: "Delivered", formatter: formatCompactNumber },
  { key: "read", label: "Read", formatter: formatCompactNumber },
  { key: "clicked", label: "Clicked", formatter: formatCompactNumber },
  { key: "orders", label: "Orders", formatter: formatCompactNumber },
  { key: "revenue", label: "Revenue", formatter: formatCompactCurrency },
  { key: "addToCarts", label: "Add to Carts", formatter: formatCompactNumber },
  { key: "productsViewed", label: "Products Viewed", formatter: formatCompactNumber },
  { key: "uniqueCustomers", label: "Unique Customers", formatter: formatCompactNumber },
];

export default function LeaderboardSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="journey-leaderboard-skeleton" rows={5} />;

  return (
    <div data-testid="journey-leaderboard-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Journey leaderboard</h2>
        <PoweredByLabel source="Flow builder event stream" />
      </div>
      {data.journeys.length === 0 ? (
        <SectionEmptyState testId="journey-leaderboard-empty" />
      ) : (
        <div className="overflow-x-auto">
          <SortableTable testId="journey-leaderboard-table" columns={COLUMNS} rows={data.journeys} defaultSort={{ field: "revenue", dir: "desc" }} rowKey="id" maxRows={11} />
        </div>
      )}
    </div>
  );
}
