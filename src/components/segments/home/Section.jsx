import React, { useState } from "react";
import { Info } from "lucide-react";
import SegmentCard from "./SegmentCard";

const DEFAULT_PAGE_SIZE = 9;

// Shared labeled group of SegmentCards with its own independent pagination.
// Used by AllSegmentsTab (one Section per category) and ShopifySegmentsTab
// (a supplementary section below its main grid).
export default function Section({ testId, title, items, banner, pageSize = DEFAULT_PAGE_SIZE, cardTestIdPrefix = "all-card" }) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  if (items.length === 0) return null;

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <section className="mb-8" data-testid={testId}>
      <h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3>
      {banner && (
        <div className="mb-3 flex items-center gap-1.5 text-[13px] text-text-secondary">
          <Info className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          {banner}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard key={item.id} testId={`${cardTestIdPrefix}-${item.id}`} {...item} />
        ))}
      </div>
      <div className="mt-4 text-center text-[13px] text-text-muted">
        {`Showing ${visible.length} out of ${items.length} results`}
        {hasMore && (
          <>
            {" "}
            <button
              type="button"
              className="text-primary font-medium"
              onClick={() => setVisibleCount((c) => c + pageSize)}
            >
              Show more
            </button>
          </>
        )}
      </div>
    </section>
  );
}
