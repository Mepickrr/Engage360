import React from "react";
import SortableTable from "../../fastrr/shared/SortableTable";
import PoweredByLabel from "../../fastrr/shared/PoweredByLabel";
import SectionSkeleton from "../../fastrr/shared/SectionSkeleton";
import SectionEmptyState from "../../fastrr/shared/SectionEmptyState";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/analyticsFormat";

const nullable = (fmt) => (v) => (v == null ? "--" : fmt(v));

const COLUMNS = [
  { key: "name", label: "Campaign" },
  { key: "channel", label: "Channel" },
  { key: "audienceSource", label: "Audience Source" },
  { key: "customers", label: "Customers", formatter: formatCompactNumber },
  { key: "delivered", label: "Delivered", formatter: formatCompactNumber },
  { key: "read", label: "Read", formatter: nullable(formatCompactNumber) },
  { key: "clicked", label: "Clicked", formatter: nullable(formatCompactNumber) },
  { key: "orders", label: "Orders", formatter: formatCompactNumber },
  { key: "revenue", label: "Revenue", formatter: formatCompactCurrency },
  { key: "addToCarts", label: "Add to Carts", formatter: nullable(formatCompactNumber) },
  { key: "productsViewed", label: "Products Viewed", formatter: nullable(formatCompactNumber) },
];

export default function CampaignsTableSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="campaign-table-skeleton" rows={5} />;

  return (
    <div data-testid="campaign-table-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Campaigns by revenue</h2>
        <PoweredByLabel source="Shiprocket order sync" />
      </div>
      {data.campaigns.length === 0 ? (
        <SectionEmptyState testId="campaign-table-empty" />
      ) : (
        <SortableTable
          testId="campaign-table"
          columns={COLUMNS}
          rows={data.campaigns}
          defaultSort={{ field: "revenue", dir: "desc" }}
          rowKey="id"
          maxRows={10}
        />
      )}
    </div>
  );
}
