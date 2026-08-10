import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeRangeFilter from "@/components/analytics/TimeRangeFilter";
import ComingSoonPanel from "@/components/analytics/ComingSoonPanel";
import OverviewTab from "@/components/analytics/overview/OverviewTab";
import CommunicationLogsTab from "@/components/analytics/logs/CommunicationLogsTab";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "campaign", label: "Campaign" },
  { value: "journey", label: "Journey" },
  { value: "reports", label: "Reports" },
  { value: "logs", label: "Communication Logs" },
];

export default function AnalyticsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("last_7_days");

  const activeTab = TABS.some((t) => t.value === tab) ? tab : "overview";

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-analytics">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">Analytics</h1>
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      <Tabs value={activeTab} onValueChange={(next) => navigate(`/analytics/${next}`)} className="mb-4">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {activeTab === "overview" && <OverviewTab timeRange={timeRange} />}
      {activeTab === "campaign" && <ComingSoonPanel tabName="Campaign" testId="analytics-tab-campaign" />}
      {activeTab === "journey" && <ComingSoonPanel tabName="Journey" testId="analytics-tab-journey" />}
      {activeTab === "reports" && <ComingSoonPanel tabName="Reports" testId="analytics-tab-reports" />}
      {activeTab === "logs" && <CommunicationLogsTab />}
    </div>
  );
}
