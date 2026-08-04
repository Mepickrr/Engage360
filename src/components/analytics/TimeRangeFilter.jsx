import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const OPTIONS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function TimeRangeFilter({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [range, setRange] = useState(undefined);

  const selectedLabel = OPTIONS.find((o) => o.value === value)?.label ?? "Last 7 Days";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setShowCustom(false);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="time-range-trigger"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] font-medium text-text-primary hover:bg-slate-50 transition-colors"
        >
          {selectedLabel}
          <ChevronDown className="w-3.5 h-3.5 text-text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1" data-testid="time-range-menu">
        {!showCustom ? (
          OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid={`time-range-option-${opt.value}`}
              onClick={() => {
                if (opt.value === "custom") {
                  setShowCustom(true);
                  return;
                }
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-slate-50 transition-colors ${
                opt.value === value ? "text-primary font-medium" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <div data-testid="time-range-calendar" className="p-1">
            <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} />
            <button
              type="button"
              data-testid="time-range-custom-apply"
              onClick={() => {
                onChange("last_7_days");
                setOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 rounded-md bg-primary text-white text-[13px] font-medium"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
