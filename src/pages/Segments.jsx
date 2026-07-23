import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import { listSegments } from "@/data/segmentsData";
import OpportunityCarousel from "@/components/segments/home/OpportunityCarousel";
import NewSegmentModal from "@/components/segments/home/NewSegmentModal";
import ImportSegmentCsvModal from "@/components/segments/home/ImportSegmentCsvModal";
import AllSegmentsTab from "@/components/segments/home/AllSegmentsTab";
import FastrrSignalsTab from "@/components/segments/home/FastrrSignalsTab";
import CustomSegmentsTab from "@/components/segments/home/CustomSegmentsTab";
import ShopifySegmentsTab from "@/components/segments/home/ShopifySegmentsTab";
import SuppressionAssetsTab from "@/components/segments/home/SuppressionAssetsTab";

export default function SegmentsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [customSubTab, setCustomSubTab] = useState("filter");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewSegmentModal, setShowNewSegmentModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);

  const segments = listSegments();
  const kpis = [
    { label: "Total segments", value: String(segments.length), testId: "seg-kpi-total" },
    { label: "Active", value: String(segments.filter((s) => s.status === "active").length), testId: "seg-kpi-active" },
    {
      label: "High-value users",
      value: Math.max(...segments.map((s) => s.userCount), 0).toLocaleString("en-IN"),
      testId: "seg-kpi-hv",
    },
    {
      label: "Stale (need refresh)",
      value: String(segments.filter((s) => s.status === "stale").length),
      deltaTone: "negative",
      testId: "seg-kpi-stale",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-segments">
      <PreviewHeader
        title="Segment management"
        testIdPrefix="segments"
        actions={
          <button
            type="button"
            data-testid="segments-new-btn"
            onClick={() => setShowNewSegmentModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create new segment
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          data-testid="segments-search-input"
          type="text"
          placeholder="Search.."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All segments</TabsTrigger>
          <TabsTrigger value="fastrr">
            Fastrr Signals{" "}
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
              New
            </span>
          </TabsTrigger>
          <TabsTrigger value="custom">Custom segments</TabsTrigger>
          <TabsTrigger value="shopify">Shopify segments</TabsTrigger>
          <TabsTrigger value="suppression">Suppression assets</TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {kpis.map((k) => (
            <KpiTile key={k.testId} {...k} />
          ))}
        </div>

        <OpportunityCarousel />

        <TabsContent value="all">
          <AllSegmentsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="fastrr">
          <FastrrSignalsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="custom">
          <CustomSegmentsTab searchQuery={searchQuery} subTab={customSubTab} onSubTabChange={setCustomSubTab} />
        </TabsContent>
        <TabsContent value="shopify">
          <ShopifySegmentsTab searchQuery={searchQuery} />
        </TabsContent>
        <TabsContent value="suppression">
          <SuppressionAssetsTab searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>

      <NewSegmentModal
        open={showNewSegmentModal}
        onClose={() => setShowNewSegmentModal(false)}
        onSelectFilters={() => {
          setShowNewSegmentModal(false);
          navigate("/segments/builder/new");
        }}
        onSelectCsv={() => {
          setShowNewSegmentModal(false);
          setShowCsvModal(true);
        }}
      />

      <ImportSegmentCsvModal
        open={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        onCreated={() => {
          setActiveTab("custom");
          setCustomSubTab("csv");
        }}
      />
    </div>
  );
}
