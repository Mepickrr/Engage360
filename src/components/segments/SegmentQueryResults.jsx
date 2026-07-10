import React, { useState } from "react";
import { ChevronRight, RefreshCw, MoreVertical } from "lucide-react";
import { estimateAudience } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/trigger/triggerHelpers";
import { previewToast } from "@/components/common/PreviewHeader";
import SegmentReachabilityPanel from "./SegmentReachabilityPanel";

function describeEntry(audience) {
  const includeText = renderBlockSetSummary(audience?.include) || "All users";
  if (!audience?.exclude_enabled) return includeText;
  const excludeText = renderBlockSetSummary(audience.exclude);
  return excludeText ? `${includeText} and exclude users in (${excludeText})` : includeText;
}

function formatQueryTime(iso) {
  const d = new Date(iso);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const date = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  return { time, date };
}

// "Query results" history table shown below the filter builder — every
// query that's been run (via Show Count), regardless of whether it was
// ever saved as a named segment. Frontend-only mock, seeded + appended to
// in memory (see src/data/segmentsData.js's queryHistory).
export default function SegmentQueryResults({ entries, onEdit, onCreateSegment, onCreateCampaign, onShowSampleUsers }) {
  const [expandedId, setExpandedId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  const handleRefresh = (e, id) => {
    e.stopPropagation();
    setRefreshingId(id);
    setTimeout(() => setRefreshingId(null), 600);
  };

  return (
    <div className="mt-8" data-testid="segment-query-results">
      <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
        Query results
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="w-8" />
              <th className="px-3 py-2 font-medium">Query time</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium text-right">User count</th>
              <th className="px-3 py-2 font-medium text-right">Reachable users</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const estimate = estimateAudience(entry.audience);
              const { time, date } = formatQueryTime(entry.queryTime);
              const isExpanded = expandedId === entry.id;
              return (
                <React.Fragment key={entry.id}>
                  <tr
                    data-testid={`query-result-row-${entry.id}`}
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="pl-3">
                      <ChevronRight className={`w-3.5 h-3.5 text-text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-muted whitespace-nowrap">
                      {time}
                      <div>{date}</div>
                    </td>
                    <td className="px-3 py-3 text-[12px] text-text-secondary font-mono max-w-md">{describeEntry(entry.audience)}</td>
                    <td className="px-3 py-3 text-[12px] text-text-muted">{entry.source}</td>
                    <td className="px-3 py-3 text-[13px] tabular-nums text-text-primary font-semibold text-right">
                      {refreshingId === entry.id ? "…" : estimate.userCount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3 text-[13px] tabular-nums text-text-primary font-semibold text-right">
                      {refreshingId === entry.id ? "…" : estimate.reachableUsers.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1 justify-end relative">
                        <button
                          type="button"
                          onClick={(e) => handleRefresh(e, entry.id)}
                          data-testid={`query-result-refresh-${entry.id}`}
                          className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-slate-100"
                          aria-label="Refresh"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === entry.id ? "animate-spin" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === entry.id ? null : entry.id);
                          }}
                          data-testid={`query-result-menu-${entry.id}`}
                          className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-slate-100"
                          aria-label="More actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {openMenuId === entry.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }} />
                            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
                              <MenuItem label="Edit" onClick={() => { setOpenMenuId(null); onEdit(entry); }} />
                              <MenuItem label="Export" onClick={() => { setOpenMenuId(null); previewToast(); }} />
                              <MenuItem label="Create segment" onClick={() => { setOpenMenuId(null); onCreateSegment(entry); }} />
                              <MenuItem label="Create campaign" onClick={() => { setOpenMenuId(null); onCreateCampaign(entry); }} />
                              <MenuItem label="Show sample users" onClick={() => { setOpenMenuId(null); onShowSampleUsers(entry); }} />
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="border-t border-border bg-slate-50/40">
                      <td colSpan={7} className="p-4">
                        <div className="max-w-sm">
                          <SegmentReachabilityPanel audience={entry.audience} sticky={false} />
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MenuItem({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary-tint hover:text-primary transition-colors whitespace-nowrap"
    >
      {label}
    </button>
  );
}

