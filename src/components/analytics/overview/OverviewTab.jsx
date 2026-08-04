import React from "react";
import { getOverviewAnalytics } from "@/data/mockOverviewAnalytics";
import { formatCompactCurrency, formatCompactNumber, formatDelta } from "@/lib/analyticsFormat";
import MetricCard from "./MetricCard";
import RoiCard from "./RoiCard";
import SplitBarChart from "./SplitBarChart";
import ComparisonLineChart from "./ComparisonLineChart";
import CustomersAcquiredSection from "./CustomersAcquiredSection";

export default function OverviewTab({ timeRange }) {
  const data = getOverviewAnalytics(timeRange);

  const revenueOverallDelta = formatDelta(data.revenue.overall.deltaPct, data.revenue.overall.deltaAbs, formatCompactCurrency);
  const revenueFastrrDelta = formatDelta(data.revenue.fastrr.deltaPct, data.revenue.fastrr.deltaAbs, formatCompactCurrency);
  const ordersOverallDelta = formatDelta(data.orders.overall.deltaPct, data.orders.overall.deltaAbs, formatCompactNumber);
  const ordersFastrrDelta = formatDelta(data.orders.fastrr.deltaPct, data.orders.fastrr.deltaAbs, formatCompactNumber);

  return (
    <div data-testid="overview-tab" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-2">Revenue</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              testId="metric-revenue-overall"
              label="Overall Revenue"
              value={formatCompactCurrency(data.revenue.overall.value)}
              delta={revenueOverallDelta}
            />
            <MetricCard
              testId="metric-revenue-fastrr"
              label="Fastrr Revenue"
              value={formatCompactCurrency(data.revenue.fastrr.value)}
              delta={revenueFastrrDelta}
              subBadge={`${data.revenue.fastrr.pctOfOverall.toFixed(1)} %`}
            />
          </div>
        </div>

        <div>
          <h2 className="text-[13px] font-semibold text-text-primary mb-2">Orders</h2>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              testId="metric-orders-overall"
              label="Overall Orders"
              value={formatCompactNumber(data.orders.overall.value)}
              delta={ordersOverallDelta}
            />
            <MetricCard
              testId="metric-orders-fastrr"
              label="Fastrr Orders"
              value={formatCompactNumber(data.orders.fastrr.value)}
              delta={ordersFastrrDelta}
              subBadge={`${data.orders.fastrr.pctOfOverall.toFixed(1)} %`}
            />
          </div>
        </div>

        <SplitBarChart
          testId="split-revenue"
          title="Fastrr Revenue split by"
          byService={data.revenueSplit.byService}
          byChannel={data.revenueSplit.byChannel}
          valueFormatter={formatCompactCurrency}
        />

        <ComparisonLineChart
          testId="trend-revenue"
          data={data.revenueTrend}
          seriesLabels={{ overall: "Overall Revenue", fastrr: "Fastrr Revenue" }}
          valueFormatter={formatCompactCurrency}
        />

        <h2 className="text-[13px] font-semibold text-text-primary">Customers Acquired</h2>
        <CustomersAcquiredSection testId="customers-acquired-section" data={data.customersAcquired} trend={data.customersTrend} />
      </div>

      <div className="space-y-4">
        <RoiCard
          testId="roi-card"
          value={data.roi.value}
          totalRevenue={data.roi.totalRevenue}
          totalCost={data.roi.totalCost}
          byChannel={data.roi.byChannel}
        />

        <SplitBarChart
          testId="split-orders"
          title="Fastrr Orders split by"
          byService={data.ordersSplit.byService}
          byChannel={data.ordersSplit.byChannel}
          valueFormatter={formatCompactNumber}
        />

        <ComparisonLineChart
          testId="trend-orders"
          data={data.ordersTrend}
          seriesLabels={{ overall: "Overall Orders", fastrr: "Fastrr Orders" }}
          valueFormatter={formatCompactNumber}
        />
      </div>
    </div>
  );
}
