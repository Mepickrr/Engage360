import React, { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import SegmentCard from "./SegmentCard";
import { SHOPIFY_SEGMENTS, SHOPIFY_LAST_SYNCED } from "@/data/segmentsHomeData";

const PAGE_SIZE = 9;

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function ShopifySegmentsTab({ searchQuery }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const filtered = useMemo(() => filterByQuery(SHOPIFY_SEGMENTS, searchQuery), [searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="shopify-segments-tab">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary">Your Shopify segments</h2>
        <div className="flex items-center gap-3 text-[12px] text-text-muted">
          <span>{`Last synced on: ${SHOPIFY_LAST_SYNCED}`}</span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-text-secondary hover:bg-slate-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`shopify-card-${item.id}`}
            name={item.name}
            updated={item.updated}
            description={item.rule}
            badge="New"
            onMenuClick={() => {}}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-[13px] text-text-muted">
        {`Showing ${visible.length} out of ${filtered.length} results`}
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
