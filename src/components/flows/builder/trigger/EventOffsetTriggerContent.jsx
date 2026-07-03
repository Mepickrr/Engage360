import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function emptyEventOffsetConfig(eventName = "") {
  return { event: eventName, value: 1, unit: "Hours" };
}

const UNIT_OPTIONS = [
  { value: "Hours", label: "Hours" },
  { value: "Days", label: "Days" },
  { value: "Weeks", label: "Weeks" },
];

export default function EventOffsetTriggerContent({ config, setConfig }) {
  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }));

  return (
    <div
      className="border border-border rounded-lg p-4 bg-surface"
      data-testid="event-offset-step1"
    >
      <p className="text-[12px] uppercase tracking-wide text-text-muted font-semibold mb-3">
        Create trigger based on Date &amp; Time
      </p>

      <div className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
        <span className="font-medium">Trigger</span>

        <input
          type="number"
          min={1}
          value={config.value}
          onChange={(e) =>
            update({ value: Math.max(1, parseInt(e.target.value, 10) || 1) })
          }
          data-testid="event-offset-value-input"
          className="h-7 w-14 rounded-md border border-border bg-background px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
        />

        <Select value={config.unit} onValueChange={(v) => update({ unit: v })}>
          <SelectTrigger
            data-testid="event-offset-unit-select"
            className="h-7 text-sm px-2 border-border rounded-md min-w-[90px] w-auto"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-text-muted">
          after <span className="font-medium text-text-primary">{config.event}</span> fires
        </span>
      </div>
    </div>
  );
}
