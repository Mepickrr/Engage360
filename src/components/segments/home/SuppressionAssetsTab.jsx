import React, { useMemo } from "react";
import SegmentCard from "./SegmentCard";
import { SUPPRESSION_ASSETS } from "@/data/segmentsHomeData";

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

export default function SuppressionAssetsTab({ searchQuery }) {
  const filtered = useMemo(() => filterByQuery(SUPPRESSION_ASSETS, searchQuery), [searchQuery]);

  return (
    <div data-testid="suppression-assets-tab">
      <h2 className="mb-3 text-base font-semibold text-text-primary">Suppression assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <SegmentCard
            key={item.id}
            testId={`suppression-card-${item.id}`}
            name={item.name}
            updated={item.updated}
            description={item.description}
            users={item.users}
          />
        ))}
      </div>
      <div className="mt-4 text-center text-[13px] text-text-muted">{`Showing all ${filtered.length} results`}</div>
    </div>
  );
}
