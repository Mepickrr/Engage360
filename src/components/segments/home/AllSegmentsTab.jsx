import React, { useMemo } from "react";
import OpportunityCarousel from "./OpportunityCarousel";
import Section from "./Section";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";
import {
  RETENTION_SEGMENTS,
  ACQUISITION_SEGMENTS,
  SEGMENT_LIBRARY,
  SHOPIFY_SEGMENTS,
  SUPPRESSION_ASSETS,
} from "@/data/segmentsHomeData";

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

export default function AllSegmentsTab({ searchQuery }) {
  const fastrrCards = useMemo(
    () => [
      ...ACQUISITION_SEGMENTS.map(normalizeSignalCard),
      ...SEGMENT_LIBRARY.map(normalizeLibraryCard),
    ],
    [],
  );
  const customCards = useMemo(() => listSegments().map(normalizeCustomSegment), []);
  const shopifyCards = useMemo(
    () => [
      ...RETENTION_SEGMENTS.map(normalizeSignalCard),
      ...SHOPIFY_SEGMENTS.map(normalizeShopifyCard),
    ],
    [],
  );
  const suppressionCards = useMemo(() => SUPPRESSION_ASSETS.map(normalizeSuppressionCard), []);

  const filteredFastrr = useMemo(() => filterByQuery(fastrrCards, searchQuery), [fastrrCards, searchQuery]);
  const filteredCustom = useMemo(() => filterByQuery(customCards, searchQuery), [customCards, searchQuery]);
  const filteredShopify = useMemo(() => filterByQuery(shopifyCards, searchQuery), [shopifyCards, searchQuery]);
  const filteredSuppression = useMemo(() => filterByQuery(suppressionCards, searchQuery), [suppressionCards, searchQuery]);

  return (
    <div data-testid="all-segments-tab">
      <OpportunityCarousel />
      <Section testId="all-section-fastrr" title="Fastrr Signals" items={filteredFastrr} />
      <Section testId="all-section-custom" title="Custom segments" items={filteredCustom} />
      <Section testId="all-section-shopify" title="Shopify segments" items={filteredShopify} />
      <Section testId="all-section-suppression" title="Suppression assets" items={filteredSuppression} />
    </div>
  );
}
