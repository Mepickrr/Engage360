import React, { useEffect, useMemo, useState } from "react";
import JourneyFilterBar from "./JourneyFilterBar";
import AnchorNav from "../fastrr/AnchorNav";
import OverviewSection from "./sections/OverviewSection";
import RoiSection from "./sections/RoiSection";
import StartTriggerSection from "./sections/StartTriggerSection";
import AudienceSection from "./sections/AudienceSection";
import ChannelSplitSection from "./sections/ChannelSplitSection";
import EcommerceCoverageSection from "./sections/EcommerceCoverageSection";
import LeaderboardSection from "./sections/LeaderboardSection";
import EngagementSection from "./sections/EngagementSection";
import ActivityOverTimeSection from "./sections/ActivityOverTimeSection";
import RetentionSection from "./sections/RetentionSection";
import ChannelHealthSection from "./sections/ChannelHealthSection";
import { getJourneyAnalytics } from "./data/mockJourneyAnalytics";

const SECTIONS = [
  { id: "journey-overview", label: "Overview" },
  { id: "journey-roi", label: "ROI" },
  { id: "journey-start-trigger", label: "Start Triggers" },
  { id: "journey-audience", label: "Audience" },
  { id: "journey-channel-split", label: "Channel Split" },
  { id: "journey-coverage", label: "Coverage Map" },
  { id: "journey-leaderboard", label: "Leaderboard" },
  { id: "journey-engagement", label: "Engagement" },
  { id: "journey-activity", label: "Activity" },
  { id: "journey-retention", label: "Retention" },
  { id: "journey-health", label: "Channel Health" },
];

const LOADING_DELAY_MS = 400;

export default function JourneyAnalyticsTab() {
  const [dateRange, setDateRange] = useState("last_7_days");
  const [channels, setChannels] = useState(new Set());
  const [audiences, setAudiences] = useState(new Set());
  const [stages, setStages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const filters = useMemo(
    () => ({ dateRange, channels: [...channels], audiences: [...audiences], stages: [...stages] }),
    [dateRange, channels, audiences, stages]
  );
  const data = useMemo(() => getJourneyAnalytics(filters), [filters]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div data-testid="journey-analytics-tab" className="space-y-6">
      <JourneyFilterBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        channels={channels}
        onChannelsChange={setChannels}
        audiences={audiences}
        onAudiencesChange={setAudiences}
        stages={stages}
        onStagesChange={setStages}
      />
      <AnchorNav sections={SECTIONS} />

      <section id="journey-overview"><OverviewSection data={data} isLoading={isLoading} /></section>
      <section id="journey-roi"><RoiSection data={data} isLoading={isLoading} /></section>
      <section id="journey-start-trigger"><StartTriggerSection data={data} isLoading={isLoading} /></section>
      <section id="journey-audience"><AudienceSection data={data} isLoading={isLoading} /></section>
      <section id="journey-channel-split"><ChannelSplitSection data={data} isLoading={isLoading} /></section>
      <section id="journey-coverage"><EcommerceCoverageSection data={data} isLoading={isLoading} /></section>
      <section id="journey-leaderboard"><LeaderboardSection data={data} isLoading={isLoading} /></section>
      <section id="journey-engagement"><EngagementSection data={data} isLoading={isLoading} /></section>
      <section id="journey-activity"><ActivityOverTimeSection data={data} isLoading={isLoading} /></section>
      <section id="journey-retention"><RetentionSection data={data} isLoading={isLoading} /></section>
      <section id="journey-health"><ChannelHealthSection data={data} isLoading={isLoading} /></section>
    </div>
  );
}
