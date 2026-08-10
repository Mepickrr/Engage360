import React, { useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";

const DATE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function FacetPopover({ testId, label, options, selected, onChange, disabled, disabledReason }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid={`${testId}-trigger`}
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md border text-[12px] font-medium transition-colors ${
            disabled
              ? "border-border text-text-muted opacity-50 cursor-not-allowed"
              : selected.size > 0
              ? "border-primary text-primary bg-primary-tint"
              : "border-border text-text-primary hover:bg-slate-50"
          }`}
        >
          {label}{selected.size > 0 ? ` (${selected.size})` : ""}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2" data-testid={`${testId}-menu`}>
        {options.length === 0 ? (
          <p className="text-[12px] text-text-muted px-1 py-2">No options in current results.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-auto">
            {options.map((opt) => (
              <label key={opt.value} data-testid={`${testId}-option-${opt.value}`} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-[13px]">
                <Checkbox checked={selected.has(opt.value)} onCheckedChange={() => onChange(toggleInSet(selected, opt.value))} />
                <span className="flex-1">{opt.value}</span>
                <span className="text-text-muted text-[11px]">{opt.count}</span>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function DateRangeFilter({ dateFilter, onChange }) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [draftRange, setDraftRange] = useState(dateFilter.customRange);
  const activeLabel = DATE_PRESETS.find((p) => p.value === dateFilter.preset)?.label || "Last 30 Days";

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setShowCustom(false); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="logs-date-trigger"
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-border text-[12px] font-medium text-text-primary hover:bg-slate-50 transition-colors"
        >
          {activeLabel}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1" data-testid="logs-date-menu">
        {!showCustom ? (
          DATE_PRESETS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-testid={`logs-date-option-${opt.value}`}
              onClick={() => {
                if (opt.value === "custom") { setShowCustom(true); return; }
                onChange({ preset: opt.value, customRange: null });
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-md text-[13px] hover:bg-slate-50 transition-colors ${
                opt.value === dateFilter.preset ? "text-primary font-medium" : "text-text-primary"
              }`}
            >
              {opt.label}
            </button>
          ))
        ) : (
          <div data-testid="logs-date-calendar" className="p-1">
            <Calendar mode="range" selected={draftRange} onSelect={setDraftRange} numberOfMonths={1} />
            <button
              type="button"
              data-testid="logs-date-custom-apply"
              disabled={!draftRange?.from}
              onClick={() => {
                onChange({ preset: "custom", customRange: draftRange });
                setOpen(false);
              }}
              className="w-full mt-2 px-3 py-2 rounded-md bg-primary text-white text-[13px] font-medium disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function LogsFilterBar({
  search, onSearchChange,
  dateFilter, onDateFilterChange,
  typeOptions, typeSelected, onTypeChange,
  channelOptions, channelSelected, onChannelChange,
  statusOptions, statusSelected, onStatusChange,
  errorOptions, errorSelected, onErrorChange,
  onClearAll,
}) {
  const chips = [
    ...[...typeSelected].map((v) => ({ facet: "type", value: v, onRemove: () => onTypeChange(toggleInSet(typeSelected, v)) })),
    ...[...channelSelected].map((v) => ({ facet: "channel", value: v, onRemove: () => onChannelChange(toggleInSet(channelSelected, v)) })),
    ...[...statusSelected].map((v) => ({ facet: "status", value: v, onRemove: () => onStatusChange(toggleInSet(statusSelected, v)) })),
    ...[...errorSelected].map((v) => ({ facet: "error", value: v, onRemove: () => onErrorChange(toggleInSet(errorSelected, v)) })),
  ];
  const hasActiveFilters = chips.length > 0 || dateFilter.preset !== "last_30_days" || search.trim() !== "";

  return (
    <div data-testid="logs-filter-bar" className="space-y-2 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            data-testid="logs-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Engage ID, phone, email, or template..."
            className="pl-9 w-[300px]"
          />
        </div>
        <DateRangeFilter dateFilter={dateFilter} onChange={onDateFilterChange} />
        <FacetPopover testId="logs-filter-type" label="Type" options={typeOptions} selected={typeSelected} onChange={onTypeChange} />
        <FacetPopover testId="logs-filter-channel" label="Channel" options={channelOptions} selected={channelSelected} onChange={onChannelChange} />
        <FacetPopover testId="logs-filter-status" label="Status" options={statusOptions} selected={statusSelected} onChange={onStatusChange} />
        <FacetPopover
          testId="logs-filter-error"
          label="Error Response"
          options={errorOptions}
          selected={errorSelected}
          onChange={onErrorChange}
          disabled={errorOptions.length === 0}
          disabledReason="No errors in current results"
        />
        {hasActiveFilters && (
          <button type="button" data-testid="logs-clear-all" onClick={onClearAll} className="text-[12px] text-primary hover:underline ml-1">
            Clear all
          </button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap" data-testid="logs-active-chips">
          {chips.map((chip) => (
            <span key={`${chip.facet}-${chip.value}`} data-testid={`logs-chip-${chip.facet}-${chip.value}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-text-secondary">
              {chip.value}
              <button type="button" onClick={chip.onRemove} aria-label={`Remove ${chip.value} filter`}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
