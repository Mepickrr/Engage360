import React, { useMemo, useState } from "react";
import { ACTIVITY_LOG_TIME_OPTIONS, ACTIVITY_LOG_ACTIONS, DEFAULT_ACTIVITY_LOGS } from "./constants";

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function rangeFor(timeFilter, customFrom, customTo, now) {
  if (timeFilter === "Last 7 Days") return { from: startOfDay(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)), to: now };
  if (timeFilter === "This Month") return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (timeFilter === "Last Month") {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { from, to };
  }
  if (timeFilter === "Custom Range") {
    if (!customFrom) return null;
    return { from: startOfDay(new Date(customFrom)), to: customTo ? new Date(new Date(customTo).setHours(23, 59, 59, 999)) : now };
  }
  return null; // "All Time"
}

function formatTimestamp(isoString) {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy} , ${hours}:${minutes} ${ampm}`;
}

export default function ActivityLogTab({ members }) {
  const [timeFilter, setTimeFilter] = useState("Last 7 Days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("");

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    const range = rangeFor(timeFilter, customFrom, customTo, now);
    return DEFAULT_ACTIVITY_LOGS.filter((log) => {
      if (range) {
        const t = new Date(log.createdAt).getTime();
        if (t < range.from.getTime() || t > range.to.getTime()) return false;
      }
      if (actionFilter && log.action !== actionFilter) return false;
      if (memberFilter && log.memberName !== memberFilter) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [timeFilter, customFrom, customTo, actionFilter, memberFilter, now]);

  return (
    <div data-testid="team-activity-log">
      <h3 className="text-base font-semibold text-text-primary mb-3">Activity Log</h3>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <select
          data-testid="activity-log-time-filter"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white text-text-secondary"
        >
          {ACTIVITY_LOG_TIME_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        {timeFilter === "Custom Range" && (
          <>
            <input
              type="date"
              data-testid="activity-log-custom-from"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-white text-text-secondary"
            />
            <input
              type="date"
              data-testid="activity-log-custom-to"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-2 border border-border rounded-md text-sm bg-white text-text-secondary"
            />
          </>
        )}

        <select
          data-testid="activity-log-action-filter"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white text-text-secondary"
        >
          <option value="">Activity type</option>
          {ACTIVITY_LOG_ACTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>

        <select
          data-testid="activity-log-member-filter"
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          className="px-3 py-2 border border-border rounded-md text-sm bg-white text-text-secondary"
        >
          <option value="">Agents</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Agent Name</th>
              <th className="px-4 py-2 font-medium">Activity type</th>
              <th className="px-4 py-2 font-medium">Description</th>
              <th className="px-4 py-2 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-text-muted" data-testid="activity-log-empty">
                  No activity matches your filters.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="border-t border-border" data-testid={`activity-log-row-${log.id}`}>
                  <td className="px-4 py-3 text-[13px] font-medium text-text-primary">{log.memberName}</td>
                  <td className="px-4 py-3 text-[12px] uppercase tracking-wide text-text-secondary">{log.action}</td>
                  <td className="px-4 py-3 text-[13px] text-text-secondary">{log.description}</td>
                  <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">{formatTimestamp(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
