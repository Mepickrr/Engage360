import React, { useEffect, useMemo, useState } from "react";
import SegmentCard from "./SegmentCard";
import SegmentedToggle from "./SegmentedToggle";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";

const SUB_TABS = [
  { value: "filter", label: "Filter-based" },
  { value: "csv", label: "CSV Upload" },
];

const PAGE_SIZE = 9;

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function CustomSegmentsTab({ searchQuery, subTab, onSubTabChange }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [subTab]);

  const handleSubTabChange = (value) => {
    onSubTabChange(value);
  };

  const bySubTab = useMemo(
    () => listSegments().filter((s) => (s.creationMethod || "filter") === subTab),
    [subTab],
  );
  const filtered = useMemo(() => filterByQuery(bySubTab, searchQuery), [bySubTab, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="custom-segments-tab">
      <SegmentedToggle testIdPrefix="custom" options={SUB_TABS} value={subTab} onChange={handleSubTabChange} />

      <h2 className="mt-4 mb-3 text-base font-semibold text-text-primary">Custom segments</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((s) => (
          <SegmentCard
            key={s.id}
            testId={`custom-card-${s.id}`}
            name={s.name}
            updated={new Date(s.updatedAt).toLocaleString("en-IN")}
            description={subTab === "filter" ? renderBlockSetSummary(s.audience?.include) || "All users" : undefined}
            users={s.userCount?.toLocaleString("en-IN")}
            badge={subTab === "filter" ? "Filters" : undefined}
            onMenuClick={() => {}}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        Showing {visible.length} out of {filtered.length} results
        {hasMore && (
          <>
            {" "}
            <button type="button" className="text-primary font-medium" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
