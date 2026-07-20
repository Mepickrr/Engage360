import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function emptyDateConfig(attribute = "") {
  return {
    attribute,
    customFieldKey: "",
    direction: "before",
    value: 7,
    unit: "days",
    repeat_annually: true,
  };
}

export const DATE_ATTRIBUTE_GROUPS = [
  {
    label: "Profile Attributes",
    options: [
      { value: "date_of_birth", label: "Date of Birth" },
      { value: "anniversary_date", label: "Anniversary Date" },
    ],
  },
  {
    label: "Custom",
    options: [
      { value: "custom_date_attribute", label: "Custom date attribute" },
    ],
  },
  {
    label: "Derived Dates",
    options: [
      { value: "account_created", label: "Account Created" },
      { value: "first_order_date", label: "Date of First Order" },
      { value: "subscription_start_date", label: "Date of Subscription Start" },
    ],
  },
];

const DIRECTION_OPTIONS = [
  { value: "before", label: "Before" },
  { value: "on", label: "On the date" },
  { value: "after", label: "After" },
];

const UNIT_OPTIONS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
];

export function getAttributeLabel(value) {
  for (const group of DATE_ATTRIBUTE_GROUPS) {
    const opt = group.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  return "Select date";
}

export default function DateRelativeTriggerContent({ dateConfig, setDateConfig }) {
  const isOn = dateConfig.direction === "on";

  const update = (patch) => setDateConfig((prev) => ({ ...prev, ...patch }));

  return (
    <div className="border border-border rounded-lg p-4 bg-surface">
      {/* Section label */}
      <p className="text-[12px] uppercase tracking-wide text-text-muted font-semibold mb-3">
        Create trigger based on Date &amp; Time
      </p>

      {/* Main trigger row */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-primary">
        <span className="font-medium">Trigger</span>

        {/* Direction select */}
        <Select
          value={dateConfig.direction}
          onValueChange={(v) => update({ direction: v })}
        >
          <SelectTrigger className="h-7 text-sm px-2 border-border rounded-md min-w-[110px] w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIRECTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Number + unit (hidden when "on") */}
        {!isOn && (
          <>
            <input
              type="number"
              min={1}
              value={dateConfig.value}
              onChange={(e) =>
                update({ value: Math.max(1, parseInt(e.target.value, 10) || 1) })
              }
              className="h-7 w-14 rounded-md border border-border bg-background px-2 text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Select
              value={dateConfig.unit}
              onValueChange={(v) => update({ unit: v })}
            >
              <SelectTrigger className="h-7 text-sm px-2 border-border rounded-md min-w-[80px] w-auto">
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
          </>
        )}

        <span className="text-text-muted">
          {isOn ? "of user's" : "user's"}
        </span>

        {/* Date attribute select — primary pill style */}
        <Select
          value={dateConfig.attribute}
          onValueChange={(v) => update({ attribute: v })}
        >
          <SelectTrigger
            className="h-7 text-sm px-2 rounded-md border border-primary/40 bg-primary-tint text-primary font-medium min-w-[160px] w-auto"
          >
            <SelectValue placeholder="Select date attribute" />
          </SelectTrigger>
          <SelectContent>
            {DATE_ATTRIBUTE_GROUPS.map((group, gi) => (
              <React.Fragment key={group.label}>
                {gi > 0 && (
                  <div className="my-1 border-t border-border" />
                )}
                <div className="px-2 py-1 text-[11px] uppercase tracking-wide text-text-muted font-semibold">
                  {group.label}
                </div>
                {group.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </React.Fragment>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom date field key — only when Custom date attribute is selected */}
      {dateConfig.attribute === "custom_date_attribute" && (
        <div className="mt-3">
          <label className="text-xs text-text-muted block mb-1">
            Which date field?
          </label>
          <input
            type="text"
            value={dateConfig.customFieldKey ?? ""}
            onChange={(e) => update({ customFieldKey: e.target.value })}
            placeholder="e.g. subscription_renewal_date"
            data-testid="date-relative-custom-field-key"
            className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {/* Separator */}
      <div className="border-t border-dashed border-border pt-3 mt-4">
        {/* Recurrence label */}
        <p className="text-[11px] uppercase tracking-wide text-text-muted font-semibold mb-2">
          Recurrence
        </p>

        {/* Checkbox row */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dateConfig.repeat_annually}
            onChange={(e) => update({ repeat_annually: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-text-primary">Repeat annually</span>
        </label>

        {/* Helper text */}
        <p className="text-xs text-text-muted mt-1">
          When enabled, this flow will automatically trigger each year on the same schedule.
        </p>
      </div>
    </div>
  );
}
