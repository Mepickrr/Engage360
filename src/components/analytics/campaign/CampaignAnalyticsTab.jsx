import React, { useEffect, useMemo, useState } from "react";
import CampaignFilterBar from "./CampaignFilterBar";
import AnchorNav from "../fastrr/AnchorNav";
import CampaignOverviewSection from "./sections/CampaignOverviewSection";
import RoiSection from "./sections/RoiSection";
import ChannelSplitSection from "./sections/ChannelSplitSection";
import CampaignsTableSection from "./sections/CampaignsTableSection";
import AudienceSection from "./sections/AudienceSection";
import EngagementSection from "./sections/EngagementSection";
import ActivityTimelineSection from "./sections/ActivityTimelineSection";
import ChannelHealthSection from "./sections/ChannelHealthSection";
import { getCampaignAnalytics } from "./data/mockCampaignAnalytics";

const SECTIONS = [
  { id: "campaign-overview", label: "Overview" },
  { id: "campaign-roi", label: "ROI" },
  { id: "campaign-channel-split", label: "Channel Split" },
  { id: "campaign-table", label: "Campaigns" },
  { id: "campaign-audience", label: "Audience" },
  { id: "campaign-engagement", label: "Engagement" },
  { id: "campaign-activity", label: "24h Activity" },
  { id: "campaign-health", label: "Channel Health" },
];

const LOADING_DELAY_MS = 400;

export default function CampaignAnalyticsTab() {
  const [dateRange, setDateRange] = useState("last_7_days");
  const [channels, setChannels] = useState(new Set());
  const [audienceSources, setAudienceSources] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const filters = useMemo(
    () => ({ dateRange, channels: [...channels], audienceSources: [...audienceSources] }),
    [dateRange, channels, audienceSources]
  );
  const data = useMemo(() => getCampaignAnalytics(filters), [filters]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div data-testid="campaign-analytics-tab" className="space-y-6">
      <CampaignFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        channels={channels}
        onChannelsChange={setChannels}
        audienceSources={audienceSources}
        onAudienceSourcesChange={setAudienceSources}
      />
      <AnchorNav sections={SECTIONS} />

      <section id="campaign-overview"><CampaignOverviewSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-roi"><RoiSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-channel-split"><ChannelSplitSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-table"><CampaignsTableSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-audience"><AudienceSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-engagement"><EngagementSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-activity"><ActivityTimelineSection data={data} isLoading={isLoading} /></section>
      <section id="campaign-health"><ChannelHealthSection data={data} isLoading={isLoading} /></section>
    </div>
  );
}
