// Pure filter/sort/facet-count helpers for the Communication Logs table.
// Kept free of React and of the mock data module so they're unit-testable
// with plain fixtures. All date-range math is UTC-based on purpose — mixing
// UTC-built timestamps (mockCommunicationLogs.js) with local-timezone day
// boundaries here would make date filtering flaky depending on the runner's
// timezone.

function startOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function addDaysUTC(date, delta) {
  return new Date(date.getTime() + delta * 24 * 60 * 60 * 1000);
}

const PRESET_RANGES = {
  today: (anchor) => ({ from: startOfDayUTC(anchor), to: endOfDayUTC(anchor) }),
  yesterday: (anchor) => {
    const y = addDaysUTC(anchor, -1);
    return { from: startOfDayUTC(y), to: endOfDayUTC(y) };
  },
  last_7_days: (anchor) => ({ from: startOfDayUTC(addDaysUTC(anchor, -6)), to: endOfDayUTC(anchor) }),
  last_30_days: (anchor) => ({ from: startOfDayUTC(addDaysUTC(anchor, -29)), to: endOfDayUTC(anchor) }),
  this_month: (anchor) => ({
    from: new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)),
    to: endOfDayUTC(anchor),
  }),
  last_month: (anchor) => {
    const firstOfThisMonth = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
    const lastMonthEnd = new Date(firstOfThisMonth - 1);
    return {
      from: new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1)),
      to: endOfDayUTC(lastMonthEnd),
    };
  },
};

export function resolveDateRange(preset, customRange, anchor) {
  if (preset === "custom") {
    if (!customRange?.from) return null;
    return { from: startOfDayUTC(customRange.from), to: endOfDayUTC(customRange.to || customRange.from) };
  }
  const resolver = PRESET_RANGES[preset];
  return resolver ? resolver(anchor) : null;
}

const FACET_FIELD_MAP = { types: "type", channels: "channel", statuses: "deliveryStatus", errors: "errorResponse" };

export function filterLogs(logs, filters, options = {}) {
  const exclude = new Set(options.exclude || []);
  const range = filters.dateRange;
  const search = (filters.search || "").trim().toLowerCase();

  return logs.filter((log) => {
    if (range) {
      const sentMs = new Date(log.sentAt).getTime();
      if (sentMs < range.from.getTime() || sentMs > range.to.getTime()) return false;
    }
    for (const key of ["types", "channels", "statuses", "errors"]) {
      if (exclude.has(key)) continue;
      const set = filters[key];
      if (set && set.size > 0 && !set.has(log[FACET_FIELD_MAP[key]])) return false;
    }
    if (search) {
      const haystack = [log.engageId, log.phone, log.email, log.templateName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

export function computeFacetCounts(logs, facetKey) {
  const field = FACET_FIELD_MAP[facetKey];
  const counts = new Map();
  for (const log of logs) {
    const value = log[field];
    if (value == null) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

export function sortLogs(logs, sort) {
  const { field, dir } = sort;
  const sorted = [...logs].sort((a, b) => new Date(a[field]).getTime() - new Date(b[field]).getTime());
  if (dir === "desc") sorted.reverse();
  return sorted;
}

export function formatLogTimestamp(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
