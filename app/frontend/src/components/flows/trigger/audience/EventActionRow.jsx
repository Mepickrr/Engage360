import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import catalogueData from "@/data/eventCatalogue.json";
import TwoPanelDropdown from "../TwoPanelDropdown";

// Shared row: [Has Done / Has Not Done ▾] [Event picker ▾] [trash]
// Used by Step 1 Exit Trigger and Step 2 Exclude Users blocks.

const QUALIFIERS = [
  { id: "has_done", label: "Has Done" },
  { id: "has_not_done", label: "Has Not Done" },
];

function useAllEventGroups() {
  return useMemo(() => {
    const out = {};
    const cat = catalogueData.catalogue || {};
    for (const header of Object.keys(cat)) {
      // Skip the canonical "ALL" data bucket — its events already appear
      // under their specific headers below.
      if (header === "ALL" || header === "All") continue;
      for (const sec of Object.keys(cat[header])) {
        const list = cat[header][sec] || [];
        if (!list.length) continue;
        out[`${header} · ${sec}`] = list.map((e) => ({
          name: e.name,
          description: e.description || "",
          source: e.source || "",
          device_tag: e.device_tag || [],
        }));
      }
    }
    return out;
  }, []);
}

export default function EventActionRow({
  value,
  onChange,
  onRemove,
  testId = "event-action-row",
}) {
  const groups = useAllEventGroups();
  const qualifier = value?.qualifier || "has_done";
  const event = value?.event || "";

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid={testId}
    >
      <Select
        value={qualifier}
        onValueChange={(v) => onChange({ ...value, qualifier: v })}
      >
        <SelectTrigger
          className="h-9 text-sm min-w-[150px]"
          data-testid={`${testId}-qualifier`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {QUALIFIERS.map((q) => (
            <SelectItem key={q.id} value={q.id}>
              {q.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <TwoPanelDropdown
        value={event}
        onChange={(v) => onChange({ ...value, event: v })}
        groups={groups}
        placeholder="Select event"
        testId={`${testId}-event`}
      />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto p-1.5 text-text-muted hover:text-rose-600 rounded-md hover:bg-rose-50"
          data-testid={`${testId}-remove`}
          aria-label="Remove row"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function emptyEventAction() {
  return { qualifier: "has_done", event: "" };
}
