import React, { useMemo, useState } from "react";
import { Info } from "lucide-react";
import SegmentCard from "./SegmentCard";
import SegmentedToggle from "./SegmentedToggle";
import {
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  RETENTION_INFO_BANNER,
  ACQUISITION_INFO_BANNER,
  SEGMENT_LIBRARY_INFO_BANNER,
} from "@/data/segmentsHomeData";

const SUB_TABS = [
  { value: "retention", label: "Retention segments" },
  { value: "acquisition", label: "Acquisition segments" },
  { value: "library", label: "Segment library" },
];

const SOURCE = {
  retention: { data: RETENTION_SEGMENTS, banner: RETENTION_INFO_BANNER, pageSize: RETENTION_SEGMENTS.length },
  acquisition: { data: ACQUISITION_SEGMENTS, banner: ACQUISITION_INFO_BANNER, pageSize: 3 },
  library: { data: SEGMENT_LIBRARY, banner: SEGMENT_LIBRARY_INFO_BANNER, pageSize: 8 },
};

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function FastrrSignalsTab({ searchQuery }) {
  const [subTab, setSubTab] = useState("retention");
  const [visibleCount, setVisibleCount] = useState(SOURCE.retention.pageSize);

  const handleSubTabChange = (value) => {
    setSubTab(value);
    setVisibleCount(SOURCE[value].pageSize);
  };

  const { data, banner } = SOURCE[subTab];
  const filtered = useMemo(() => filterByQuery(data, searchQuery), [data, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="fastrr-signals-tab">
      <SegmentedToggle testIdPrefix="fastrr" options={SUB_TABS} value={subTab} onChange={handleSubTabChange} />

      <div className="mt-3 mb-4 flex items-center gap-1.5 text-[13px] text-text-secondary">
        <Info className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
        {banner}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`fastrr-card-${item.id}`}
            name={item.name}
            Icon={item.Icon}
            updated={item.updated}
            description={item.description}
            users={item.users}
            footerRight={item.avgRevenuePerUser ? `Average revenue per user : ${item.avgRevenuePerUser}` : undefined}
            onMenuClick={subTab !== "acquisition" ? () => {} : undefined}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        <span>{`Showing ${visible.length} out of ${filtered.length} results`}</span>
        {hasMore && (
          <>
            {" "}
            <button
              type="button"
              className="text-primary font-medium"
              onClick={() => setVisibleCount((c) => c + SOURCE[subTab].pageSize)}
            >
              Show more
            </button>
          </>
        )}
      </div>
    </div>
  );
}
