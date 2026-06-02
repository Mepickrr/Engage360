/**
 * DelayConfig — three-tab delay configuration panel.
 *
 * Tab 1 — Duration:  wait a fixed amount (number + unit)
 * Tab 2 — Schedule:  wait until a Day+Time or Exact Date
 * Tab 3 — Event:     wait relative to a date/time variable (Phase 2)
 *
 * Data shape written to node:
 * {
 *   delayTab:             "duration" | "schedule" | "event",
 *   forValue:             number,
 *   forUnit:              "minutes" | "hours" | "days" | "weeks",
 *   scheduleSubTab:       "daytime" | "exact",
 *   tillDay:              string,
 *   tillTime:             string,
 *   exactDate:            string,
 *   exactTime:            string,
 *   tillTimezone:         string,
 *   useCustomerTimezone:  boolean,
 *   pastDateFallback:     "skip_continue" | "skip_exit",
 *   variableOffsetValue:  number,
 *   variableOffsetUnit:   "minutes" | "hours" | "days",
 *   variableOffsetDir:    "before" | "after",
 *   variableEvent:        string | null,
 *   maxWaitEnabled:       boolean,
 *   maxWaitValue:         number,
 *   maxWaitUnit:          "hours" | "days",
 * }
 */

import React, { useState } from "react";
import {
  Clock, TimerReset, CalendarClock, ChevronDown,
  Search, Plus, Trash2, AlertTriangle, Info,
} from "lucide-react";

// ── tokens ──────────────────────────────────────────────────────
const P      = "#6C3AE8";
const BORDER = "#E5E7EB";
const MUTED  = "#94A3B8";
const TPRI   = "#0F172A";
const TSEC   = "#475569";
const AMBER  = "#F59E0B";
const BGSOFT = "#F7F8FA";

// ── option lists ────────────────────────────────────────────────
const DURATION_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours",   label: "Hours"   },
  { value: "days",    label: "Days"    },
  { value: "weeks",   label: "Weeks"   },
];

const DAY_OPTIONS = [
  { value: "anyday",         label: "Anyday"          },
  { value: "weekday",        label: "Weekday"         },
  { value: "weekend",        label: "Weekend"         },
  { value: "monday",         label: "Monday"          },
  { value: "tuesday",        label: "Tuesday"         },
  { value: "wednesday",      label: "Wednesday"       },
  { value: "thursday",       label: "Thursday"        },
  { value: "friday",         label: "Friday"          },
  { value: "saturday",       label: "Saturday"        },
  { value: "sunday",         label: "Sunday"          },
  { value: "start_of_month", label: "Start of Month"  },
  { value: "end_of_month",   label: "End of Month"    },
];

const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const totalMins = i * 30 + 6 * 60; // 06:00 → 23:30
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return { value: label, label };
});

const OFFSET_UNITS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours",   label: "Hours"   },
  { value: "days",    label: "Days"    },
];

const TIMEZONES = [
  "Asia/Kolkata", "UTC", "Asia/Dubai", "Asia/Singapore",
  "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Berlin",
];

const VARIABLE_GROUPS = [
  { label: "Customer variables",       vars: ["customer.created_at", "customer.last_order_date", "customer.birthday"] },
  { label: "Product variables",        vars: ["product.created_at", "product.updated_at"] },
  { label: "Abandoned cart variables", vars: ["cart.created_at", "cart.updated_at"] },
  { label: "Add To Cart Event",        vars: ["event.add_to_cart.time"] },
  { label: "Local User Responses",     vars: ["local.response_time"] },
  { label: "Api Data Responses",       vars: ["api.timestamp"] },
  { label: "Store variables",          vars: ["store.opening_time"] },
  { label: "Helpdesk variables",       vars: ["ticket.created_at", "ticket.resolved_at"] },
];

// ── small helpers ────────────────────────────────────────────────
function sel(style = {}) {
  return {
    height: 36, padding: "0 28px 0 10px", fontSize: 13,
    border: `1px solid ${BORDER}`, borderRadius: 8,
    background: "#fff", color: TPRI, outline: "none", cursor: "pointer",
    appearance: "none",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat", backgroundPosition: "right 8px center",
    ...style,
  };
}

function SmallSelect({ value, onChange, options, style = {} }) {
  return (
    <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={sel(style)}>
      {options.map((o) => (
        <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
          {typeof o === "string" ? o : o.label}
        </option>
      ))}
    </select>
  );
}

function NumInput({ value, onChange, min = 1, style = {} }) {
  return (
    <input
      type="number"
      min={min}
      value={value}
      onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || min))}
      style={{ height: 36, padding: "0 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", color: TPRI, background: "#fff", ...style }}
    />
  );
}

function FieldLabel({ children }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function SubTab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, padding: "7px 0", fontSize: 12, fontWeight: 500,
        border: "none", cursor: "pointer",
        background: active ? "#fff" : "transparent",
        color: active ? P : MUTED,
        borderRadius: 6,
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ── Variable Picker ──────────────────────────────────────────────
function VariablePicker({ onSelect }) {
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState({});

  const filtered = VARIABLE_GROUPS.map((g) => ({
    ...g,
    vars: g.vars.filter((v) => !q || v.toLowerCase().includes(q.toLowerCase())),
  })).filter((g) => g.vars.length > 0);

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: "#fff", overflow: "hidden", marginTop: 8 }}>
      <div style={{ padding: "8px 12px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: MUTED, pointerEvents: "none" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search variables…"
            style={{ width: "100%", padding: "6px 8px 6px 26px", fontSize: 12, border: `1px solid ${BORDER}`, borderRadius: 6, outline: "none" }}
          />
        </div>
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {filtered.map((group) => (
          <div key={group.label} style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [group.label]: !o[group.label] }))}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "none", border: "none", cursor: "pointer" }}
            >
              <span style={{ fontSize: 12, fontWeight: 500, color: TPRI }}>{group.label}</span>
              <ChevronDown size={12} style={{ color: MUTED, transform: open[group.label] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </button>
            {open[group.label] && (
              <div style={{ paddingBottom: 4 }}>
                {group.vars.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onSelect(v)}
                    style={{ width: "100%", textAlign: "left", padding: "5px 20px", fontSize: 11, color: TSEC, background: "none", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BGSOFT; e.currentTarget.style.color = P; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TSEC; }}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── canvas preview label ─────────────────────────────────────────
function buildPreviewLabel(data) {
  const tab = data?.delayTab ?? "duration";
  if (tab === "duration") {
    const v = data?.forValue ?? 1;
    const u = data?.forUnit ?? "hours";
    const uLabel = u === "minutes" ? (v === 1 ? "minute" : "minutes")
      : u === "hours" ? (v === 1 ? "hour" : "hours")
      : u === "days" ? (v === 1 ? "day" : "days")
      : v === 1 ? "week" : "weeks";
    return `Wait ${v} ${uLabel}`;
  }
  if (tab === "schedule") {
    const sub = data?.scheduleSubTab ?? "daytime";
    if (sub === "daytime") {
      const day  = data?.tillDay  === "anyday" ? "Any day" : (data?.tillDay  || "");
      const time = data?.tillTime || "";
      return `Till ${day} ${time}`.trim();
    }
    return data?.exactDate ? `Till ${data.exactDate}${data?.exactTime ? " " + data.exactTime : ""}` : "Till exact date";
  }
  if (tab === "event") {
    const v = data?.variableOffsetValue ?? 5;
    const u = data?.variableOffsetUnit  ?? "hours";
    const d = data?.variableOffsetDir   ?? "after";
    return data?.variableEvent ? `${v} ${u} ${d} event` : "Event variable not set";
  }
  return "Delay";
}

// ── Duration tab ─────────────────────────────────────────────────
function DurationTab({ data, patch }) {
  const forValue = data?.forValue ?? 1;
  const forUnit  = data?.forUnit  ?? "hours";

  const toMinutes = (v, u) => {
    if (u === "minutes") return v;
    if (u === "hours")   return v * 60;
    if (u === "days")    return v * 1440;
    return v * 10080; // weeks
  };
  const mins = toMinutes(forValue, forUnit);
  const over30days = mins > 43200;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <FieldLabel>Wait for</FieldLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <NumInput
            value={forValue}
            onChange={(v) => patch({ forValue: v })}
            style={{ flex: 1 }}
          />
          <SmallSelect
            value={forUnit}
            onChange={(v) => patch({ forUnit: v })}
            options={DURATION_UNITS}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {over30days && (
        <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#FEF9EC", border: `1px solid #FDE68A`, borderRadius: 8 }}>
          <AlertTriangle size={13} style={{ color: AMBER, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
            This delay is over 30 days. Make sure this is intentional.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Schedule tab ─────────────────────────────────────────────────
function ScheduleTab({ data, patch }) {
  const subTab        = data?.scheduleSubTab       ?? "daytime";
  const tillDay       = data?.tillDay              ?? "anyday";
  const tillTime      = data?.tillTime             ?? "18:00";
  const exactDate     = data?.exactDate            ?? "";
  const exactTime     = data?.exactTime            ?? "18:00";
  const useCtxTZ      = data?.useCustomerTimezone  ?? false;
  const tillTZ        = data?.tillTimezone         ?? "Asia/Kolkata";
  const fallback      = data?.pastDateFallback     ?? "skip_continue";

  const isPast = subTab === "exact" && exactDate && (() => {
    try {
      const dt = new Date(`${exactDate}T${exactTime || "00:00"}:00`);
      return dt < new Date();
    } catch { return false; }
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sub-tab toggle */}
      <div style={{ display: "flex", gap: 4, background: BGSOFT, borderRadius: 8, padding: 4 }}>
        <SubTab label="Day + Time" active={subTab === "daytime"} onClick={() => patch({ scheduleSubTab: "daytime" })} />
        <SubTab label="Exact Date" active={subTab === "exact"}   onClick={() => patch({ scheduleSubTab: "exact"   })} />
      </div>

      {subTab === "daytime" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <FieldLabel>Day</FieldLabel>
            <SmallSelect value={tillDay} onChange={(v) => patch({ tillDay: v })} options={DAY_OPTIONS} style={{ width: "100%" }} />
          </div>
          <div>
            <FieldLabel>Time</FieldLabel>
            <SmallSelect value={tillTime} onChange={(v) => patch({ tillTime: v })} options={TIME_OPTIONS} style={{ width: "100%" }} />
          </div>
        </div>
      )}

      {subTab === "exact" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              value={exactDate}
              onChange={(e) => patch({ exactDate: e.target.value })}
              style={{ width: "100%", height: 36, padding: "0 10px", fontSize: 13, border: `1px solid ${BORDER}`, borderRadius: 8, outline: "none", color: TPRI, background: "#fff" }}
            />
          </div>
          <div>
            <FieldLabel>Time</FieldLabel>
            <SmallSelect value={exactTime} onChange={(v) => patch({ exactTime: v })} options={TIME_OPTIONS} style={{ width: "100%" }} />
          </div>

          {isPast && (
            <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#FEF9EC", border: `1px solid #FDE68A`, borderRadius: 8 }}>
              <AlertTriangle size={13} style={{ color: AMBER, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.5 }}>
                This date is in the past. Choose a fallback below.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Timezone */}
      <div style={{ paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
        <FieldLabel>Timezone</FieldLabel>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: TSEC, marginBottom: 6 }}>
          <input
            type="checkbox"
            checked={useCtxTZ}
            onChange={(e) => patch({ useCustomerTimezone: e.target.checked })}
            style={{ accentColor: P }}
          />
          Use customer's local timezone
        </label>
        {!useCtxTZ && (
          <SmallSelect value={tillTZ} onChange={(v) => patch({ tillTimezone: v })} options={TIMEZONES} style={{ width: "100%" }} />
        )}
      </div>

      {/* Past-date fallback */}
      <div style={{ paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
        <FieldLabel>Past-date fallback</FieldLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { value: "skip_continue", label: "Skip delay and continue" },
            { value: "skip_exit",     label: "Skip and exit the branch" },
          ].map(({ value, label }) => (
            <label key={value} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: TSEC }}>
              <input
                type="radio"
                name="pastDateFallback"
                value={value}
                checked={fallback === value}
                onChange={() => patch({ pastDateFallback: value })}
                style={{ accentColor: P }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Event tab (Phase 2) ──────────────────────────────────────────
function EventTab({ data, patch }) {
  const offVal        = data?.variableOffsetValue ?? 5;
  const offUnit       = data?.variableOffsetUnit  ?? "hours";
  const offDir        = data?.variableOffsetDir   ?? "after";
  const varEvent      = data?.variableEvent       ?? null;
  const maxEnabled    = data?.maxWaitEnabled      ?? false;
  const maxVal        = data?.maxWaitValue        ?? 48;
  const maxUnit       = data?.maxWaitUnit         ?? "hours";

  const [showPicker, setShowPicker] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Phase 2 banner */}
      <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#EEF2FF", border: `1px solid #C7D2FE`, borderRadius: 8 }}>
        <Info size={13} style={{ color: "#6366F1", flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11, color: "#3730A3", lineHeight: 1.5 }}>
          Event-relative delays are a Phase 2 feature. Configure now — it will activate at launch.
        </span>
      </div>

      {/* Offset row */}
      <div>
        <FieldLabel>Wait</FieldLabel>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NumInput value={offVal} onChange={(v) => patch({ variableOffsetValue: v })} min={0} style={{ width: 70 }} />
          <SmallSelect value={offUnit} onChange={(v) => patch({ variableOffsetUnit: v })} options={OFFSET_UNITS} style={{ flex: 1 }} />
          <SmallSelect
            value={offDir}
            onChange={(v) => patch({ variableOffsetDir: v })}
            options={[
              { value: "before", label: "Before" },
              { value: "after",  label: "After"  },
            ]}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Variable picker */}
      <div>
        <FieldLabel>Event / Date variable</FieldLabel>
        {varEvent ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: `1px solid ${BORDER}`, borderRadius: 8, background: BGSOFT }}>
            <span style={{ fontSize: 12, color: TPRI, fontFamily: "monospace" }}>{`{{${varEvent}}}`}</span>
            <button
              type="button"
              onClick={() => patch({ variableEvent: null })}
              style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 2 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "10px 14px",
              border: `1.5px dashed ${showPicker ? P : BORDER}`, borderRadius: 8,
              background: "transparent", cursor: "pointer", color: showPicker ? P : TSEC,
              fontSize: 13, fontWeight: 500, transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = P; e.currentTarget.style.color = P; }}
            onMouseLeave={(e) => { if (!showPicker) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TSEC; } }}
          >
            <Plus size={14} />
            Select date/time variable
          </button>
        )}
        {showPicker && !varEvent && (
          <VariablePicker
            onSelect={(v) => { patch({ variableEvent: v }); setShowPicker(false); }}
          />
        )}
      </div>

      {/* Max wait cap */}
      <div style={{ paddingTop: 4, borderTop: `1px solid ${BORDER}` }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={maxEnabled}
            onChange={(e) => patch({ maxWaitEnabled: e.target.checked })}
            style={{ accentColor: P }}
          />
          <span style={{ fontSize: 12, fontWeight: 500, color: TPRI }}>Set maximum wait cap</span>
        </label>
        {maxEnabled && (
          <div>
            <FieldLabel>Wait at most</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <NumInput value={maxVal} onChange={(v) => patch({ maxWaitValue: v })} style={{ flex: 1 }} />
              <SmallSelect
                value={maxUnit}
                onChange={(v) => patch({ maxWaitUnit: v })}
                options={[
                  { value: "hours", label: "Hours" },
                  { value: "days",  label: "Days"  },
                ]}
                style={{ flex: 1 }}
              />
            </div>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 6, lineHeight: 1.5 }}>
              If the event variable has not resolved after this time, the user continues through the flow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
const TABS = [
  { id: "duration", label: "Duration", Icon: Clock       },
  { id: "schedule", label: "Schedule", Icon: CalendarClock},
  { id: "event",    label: "Event",    Icon: TimerReset   },
];

export default function DelayConfig({ data, patch }) {
  // Migrate old delayMode shape
  const rawTab = data?.delayTab;
  const activeTab = rawTab ?? (data?.delayMode === "till" ? "schedule" : "duration");

  const preview = buildPreviewLabel({ ...data, delayTab: activeTab });

  return (
    <div style={{ color: TPRI }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Clock size={16} style={{ color: AMBER }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TPRI }}>Delay Node</div>
          <div style={{ fontSize: 11, color: MUTED }}>Pause flow execution</div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => patch({ delayTab: id })}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "10px 4px 8px",
                border: "none", borderBottom: `2px solid ${active ? P : "transparent"}`,
                background: active ? "#F5F3FF" : "transparent",
                cursor: "pointer", color: active ? P : MUTED,
                fontSize: 10, fontWeight: 500,
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
              {id === "event" && (
                <span style={{ fontSize: 8, fontWeight: 600, background: "#EEF2FF", color: "#6366F1", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.05em" }}>
                  PHASE 2
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding: "16px 16px 20px" }}>
        {activeTab === "duration" && <DurationTab data={data} patch={patch} />}
        {activeTab === "schedule" && <ScheduleTab data={data} patch={patch} />}
        {activeTab === "event"    && <EventTab    data={data} patch={patch} />}
      </div>

      {/* Canvas preview */}
      <div style={{ margin: "0 16px 20px", padding: "10px 12px", background: BGSOFT, border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
          Canvas label preview
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={12} style={{ color: AMBER, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: TPRI }}>{preview}</span>
        </div>
      </div>
    </div>
  );
}
