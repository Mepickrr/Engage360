import React, { useMemo, useState } from "react";
import SegmentCard from "./SegmentCard";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";
import {
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  SHOPIFY_SEGMENTS,
  SUPPRESSION_ASSETS,
} from "@/data/segmentsHomeData";

const PAGE_SIZE = 9;

function normalizeSignalCard(item) {
  return {
    id: `signal-${item.id}`,
    name: item.name,
    Icon: item.Icon,
    updated: item.updated,
    description: item.description,
    users: item.users,
    footerRight: item.avgRevenuePerUser ? `Average revenue per user : ${item.avgRevenuePerUser}` : undefined,
  };
}

function normalizeLibraryCard(item) {
  return { id: `lib-${item.id}`, name: item.name, updated: item.updated, description: item.description, users: item.users };
}

function normalizeCustomSegment(s) {
  return {
    id: `custom-${s.id}`,
    name: s.name,
    updated: new Date(s.updatedAt).toLocaleString("en-IN"),
    description: renderBlockSetSummary(s.audience?.include) || "All users",
    users: s.userCount?.toLocaleString("en-IN"),
    badge: (s.creationMethod || "filter") === "filter" ? "Filters" : undefined,
  };
}

function normalizeShopifyCard(item) {
  return { id: `shopify-${item.id}`, name: item.name, updated: item.updated, description: item.rule, badge: "New" };
}

function normalizeSuppressionCard(item) {
  return { id: `suppression-${item.id}`, name: item.name, updated: item.updated, description: item.description, users: item.users };
}

function filterByQuery(items, query) {
  if (!query.trim()) return items;
  const q = query.trim().toLowerCase();
  return items.filter((item) => item.name.toLowerCase().includes(q));
}

// Round-robin merge so every source is represented early in the grid instead
// of one large source (e.g. the 10-item RETENTION_SEGMENTS) monopolizing the
// first page before pagination/search ever reach the other sources.
function interleave(groups) {
  const maxLength = Math.max(...groups.map((group) => group.length));
  const result = [];
  for (let i = 0; i < maxLength; i += 1) {
    for (const group of groups) {
      if (i < group.length) result.push(group[i]);
    }
  }
  return result;
}

export default function AllSegmentsTab({ searchQuery }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allCards = useMemo(
    () =>
      interleave([
        RETENTION_SEGMENTS.map(normalizeSignalCard),
        ACQUISITION_SEGMENTS.map(normalizeSignalCard),
        SEGMENT_LIBRARY.map(normalizeLibraryCard),
        listSegments().map(normalizeCustomSegment),
        SHOPIFY_SEGMENTS.map(normalizeShopifyCard),
        SUPPRESSION_ASSETS.map(normalizeSuppressionCard),
      ]),
    [],
  );

  const filtered = useMemo(() => filterByQuery(allCards, searchQuery), [allCards, searchQuery]);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div data-testid="all-segments-tab">
      <h2 className="mb-3 text-base font-semibold text-text-primary">All segments</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visible.map((item) => (
          <SegmentCard key={item.id} testId={`all-card-${item.id}`} {...item} />
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
