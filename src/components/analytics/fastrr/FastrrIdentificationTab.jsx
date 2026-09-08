import React, { useEffect, useMemo, useState } from "react";
import FastrrFilterBar from "./FastrrFilterBar";
import AnchorNav from "./AnchorNav";
import HeroBandSection from "./sections/HeroBandSection";
import IdentificationFunnelSection from "./sections/IdentificationFunnelSection";
import EngagementSection from "./sections/EngagementSection";
import ConversionRoiSection from "./sections/ConversionRoiSection";
import SegmentComparisonSection from "./sections/SegmentComparisonSection";
import SmartCardSection from "./sections/SmartCardSection";
import TrendsSection from "./sections/TrendsSection";
import SourceBreakdownSection from "./sections/SourceBreakdownSection";
import { getFastrrIdentificationAnalytics } from "./data/mockFastrrIdentification";

const SECTIONS = [
  { id: "fastrr-hero", label: "Overview" },
  { id: "fastrr-funnel", label: "Funnel" },
  { id: "fastrr-engagement", label: "Engagement" },
  { id: "fastrr-conversion", label: "Conversion & ROI" },
  { id: "fastrr-segments", label: "Segments" },
  { id: "fastrr-smart-card", label: "Smart Card" },
  { id: "fastrr-trends", label: "Trends" },
  { id: "fastrr-source", label: "Source Breakdown" },
];

const LOADING_DELAY_MS = 400;

export default function FastrrIdentificationTab() {
  const [datePreset, setDatePreset] = useState("last_7_days");
  const [compare, setCompare] = useState(true);
  const [channel, setChannel] = useState("All");
  const [isLoading, setIsLoading] = useState(false);

  const filters = useMemo(() => ({ datePreset, compare, channel }), [datePreset, compare, channel]);
  const data = useMemo(() => getFastrrIdentificationAnalytics(filters), [filters]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  return (
    <div data-testid="fastrr-identification-tab" className="space-y-6">
      <FastrrFilterBar
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        compare={compare}
        onCompareChange={setCompare}
        channel={channel}
        onChannelChange={setChannel}
      />
      <AnchorNav sections={SECTIONS} />

      <section id="fastrr-hero"><HeroBandSection data={data.hero} compare={compare} isLoading={isLoading} /></section>
      <section id="fastrr-funnel"><IdentificationFunnelSection data={data.funnel} isLoading={isLoading} /></section>
      <section id="fastrr-engagement"><EngagementSection data={data.engagement} isLoading={isLoading} /></section>
      <section id="fastrr-conversion"><ConversionRoiSection data={data.conversionRoi} isLoading={isLoading} /></section>
      <section id="fastrr-segments"><SegmentComparisonSection data={data.segmentComparison} isLoading={isLoading} /></section>
      <section id="fastrr-smart-card"><SmartCardSection data={data.smartCard} isLoading={isLoading} /></section>
      <section id="fastrr-trends"><TrendsSection data={data.trends} compare={compare} isLoading={isLoading} /></section>
      <section id="fastrr-source"><SourceBreakdownSection data={data.sourceBreakdown} isLoading={isLoading} /></section>
    </div>
  );
}
