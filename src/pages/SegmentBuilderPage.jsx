import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, Pencil, Download, Megaphone, Users, RotateCcw, BarChart3 } from "lucide-react";
import { previewToast } from "@/components/common/PreviewHeader";
import AudienceFilterBuilder from "@/components/flows/builder/trigger/audience/AudienceFilterBuilder";
import SegmentSummaryView from "@/components/segments/SegmentSummaryView";
import SegmentReachabilityPanel from "@/components/segments/SegmentReachabilityPanel";
import SampleUsersModal from "@/components/segments/SampleUsersModal";
import SegmentQueryResults from "@/components/segments/SegmentQueryResults";
import { renderBlockSetSummary } from "@/components/flows/builder/trigger/triggerHelpers";
import {
  getSegment,
  createSegment,
  updateSegment,
  emptySegmentAudience,
  listQueryHistory,
  logQueryRun,
} from "@/data/segmentsData";

const BLOCK_TYPES = [
  { id: "property", label: "User property" },
  { id: "behavior", label: "User behavior" },
  { id: "affinity", label: "User affinity" },
  { id: "segment", label: "Custom segment" },
];

function describeQueryEntry(audience) {
  return renderBlockSetSummary(audience?.include) || "All users";
}

function hasAnyCondition(blockSet) {
  return (blockSet?.blocks || []).some((b) => {
    if (b.type === "segment") return (b.segments || []).filter(Boolean).length > 0;
    // property/behavior/affinity condition rows are pre-seeded blank on mount
    // (see UserPropertyConditions et al.), so require an actual selection.
    return (b.conditions || []).some((c) => c.property || c.event);
  });
}

export default function SegmentBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useMemo(() => (id ? getSegment(id) : null), [id]);

  const [name, setName] = useState(existing?.name || "");
  const [audience, setAudience] = useState(existing?.audience || emptySegmentAudience());
  const [isEditing, setIsEditing] = useState(!id);
  const [refreshing, setRefreshing] = useState(false);
  const [showSampleUsers, setShowSampleUsers] = useState(false);
  const [queryHistory, setQueryHistory] = useState(() => listQueryHistory());

  const isCreateMode = !id;

  const handleResetFilter = () => {
    const isDirty = name.trim() !== "" || hasAnyCondition(audience.include) || hasAnyCondition(audience.exclude);
    if (isDirty && !window.confirm("Reset all filters and the segment name?")) return;
    setName("");
    setAudience(emptySegmentAudience());
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast("Give this segment a name before saving.");
      return;
    }
    if (!hasAnyCondition(audience.include)) {
      toast("Add at least one condition before saving.");
      return;
    }
    if (isCreateMode) {
      createSegment({ name: name.trim(), audience });
      toast("Segment created.");
    } else {
      updateSegment(id, { name: name.trim(), audience });
      toast("Segment updated.");
    }
    navigate("/segments");
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      previewToast();
    }, 700);
  };

  const setIncludeBlockSet = (b) => setAudience({ ...audience, include: b });
  const setExcludeBlockSet = (b) => setAudience({ ...audience, exclude: b });
  const setExcludeEnabled = (enabled) => setAudience({ ...audience, exclude_enabled: enabled });

  const handleShowCount = () => {
    if (!hasAnyCondition(audience.include)) {
      toast("Add at least one condition to see the count.");
      return;
    }
    logQueryRun({ audience, source: "Segment Builder" });
    setQueryHistory(listQueryHistory());
    toast("Count updated — logged below in Query results.");
  };

  const handleEditQueryEntry = (entry) => {
    setIsEditing(true);
    setAudience(entry.audience);
  };

  const handleCreateSegmentFromEntry = (entry) => {
    const autoName = `${describeQueryEntry(entry.audience)} (${new Date(entry.queryTime).toLocaleDateString("en-IN")})`.slice(0, 80);
    createSegment({ name: autoName, audience: entry.audience });
    toast("Segment created from this query.");
    navigate("/segments");
  };

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-segment-builder">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate("/segments")}
            data-testid="segment-builder-back"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Segments
          </button>
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled segment"
              data-testid="segment-builder-name-input"
              className="text-[28px] font-semibold tracking-tight text-text-primary bg-transparent border-b border-transparent focus:border-border focus:outline-none w-full max-w-xl"
            />
          ) : (
            <h1 className="text-[28px] font-semibold tracking-tight text-text-primary" data-testid="segment-builder-name">
              {name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-1">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleResetFilter}
                data-testid="segment-builder-reset"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset filter
              </button>
              <button
                type="button"
                onClick={() => previewToast()}
                data-testid="segment-builder-create-campaign"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Create campaign
              </button>
              <button
                type="button"
                onClick={handleSave}
                data-testid="segment-builder-save"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
              >
                {isCreateMode ? "Create segment" : "Save changes"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                data-testid="segment-builder-refresh"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                data-testid="segment-builder-edit"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => previewToast()}
                data-testid="segment-builder-export"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                type="button"
                onClick={() => previewToast()}
                data-testid="segment-builder-create-campaign"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-secondary border border-border rounded-md hover:bg-slate-50"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Create campaign
              </button>
              <button
                type="button"
                onClick={() => setShowSampleUsers(true)}
                data-testid="segment-builder-sample-users"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
              >
                <Users className="w-3.5 h-3.5" />
                Show sample users
              </button>
            </>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6">
          {isEditing ? (
            <>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
                  Filter users by
                </div>
                <AudienceFilterBuilder
                  blockSet={audience.include}
                  onChange={setIncludeBlockSet}
                  testIdPrefix="segment-include"
                  blockTypes={BLOCK_TYPES}
                  excludeSegmentName={name}
                />
              </div>

              <div className="border-t border-border pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!audience.exclude_enabled}
                    onChange={(e) => setExcludeEnabled(e.target.checked)}
                    data-testid="segment-exclude-toggle"
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium text-text-primary">Exclude users</span>
                </label>
                {audience.exclude_enabled && (
                  <div className="mt-3">
                    <AudienceFilterBuilder
                      blockSet={audience.exclude}
                      onChange={setExcludeBlockSet}
                      testIdPrefix="segment-exclude"
                      blockTypes={BLOCK_TYPES}
                      excludeSegmentName={name}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleShowCount}
                  data-testid="segment-builder-show-count"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Show count
                </button>
              </div>
            </>
          ) : (
            <SegmentSummaryView audience={audience} />
          )}
        </div>

        <SegmentReachabilityPanel
          audience={audience}
          staleUpdatedAt={!isEditing ? existing?.updatedAt : null}
          recomputing={refreshing}
        />
      </div>

      <SegmentQueryResults
        entries={queryHistory}
        onEdit={handleEditQueryEntry}
        onCreateSegment={handleCreateSegmentFromEntry}
        onCreateCampaign={() => previewToast()}
        onShowSampleUsers={() => setShowSampleUsers(true)}
      />

      {showSampleUsers && <SampleUsersModal onClose={() => setShowSampleUsers(false)} />}
    </div>
  );
}
