import React from "react";
import { useNavigate } from "react-router-dom";
import PreviewHeader, { KpiTile } from "@/components/common/PreviewHeader";
import { Plus, Users } from "lucide-react";
import { listSegments } from "@/data/segmentsData";
import { renderBlockSetSummary } from "@/components/flows/builder/triggerV2/triggerHelpers";

const OWNER_COLOR = "#8B5CF6"; // Meera

function timeAgo(iso) {
  const diffMs = Date.parse("2026-07-10T09:00:00.000Z") - Date.parse(iso);
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export default function SegmentsPage() {
  const navigate = useNavigate();
  const segments = listSegments();

  const kpis = [
    { label: "Total segments", value: String(segments.length), testId: "seg-kpi-total" },
    { label: "Active", value: String(segments.filter((s) => s.status === "active").length), testId: "seg-kpi-active" },
    {
      label: "High-value users",
      value: Math.max(...segments.map((s) => s.userCount), 0).toLocaleString("en-IN"),
      testId: "seg-kpi-hv",
    },
    {
      label: "Stale (need refresh)",
      value: String(segments.filter((s) => s.status === "stale").length),
      deltaTone: "negative",
      testId: "seg-kpi-stale",
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-segments">
      <PreviewHeader
        title="Segments"
        subtitle="Build and manage audience segments powering targeting and triggers."
        testIdPrefix="segments"
        actions={
          <button
            type="button"
            data-testid="segments-new-btn"
            onClick={() => navigate("/segments/builder/new")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New segment
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpis.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden" data-testid="segments-table">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Segment</th>
              <th className="px-4 py-2 font-medium">Definition</th>
              <th className="px-4 py-2 font-medium">Users</th>
              <th className="px-4 py-2 font-medium">Refreshed</th>
              <th className="px-4 py-2 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((s) => {
              const def = renderBlockSetSummary(s.audience?.include) || "All users";
              const refreshed = s.status === "stale" ? `Stale · ${timeAgo(s.updatedAt)}` : timeAgo(s.updatedAt);
              return (
                <tr
                  key={s.id}
                  data-testid={`segments-row-${s.id}`}
                  onClick={() => navigate(`/segments/builder/${s.id}`)}
                  className="border-t border-border hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-semibold text-text-primary flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-violet-500" />
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-secondary font-mono">{def}</td>
                  <td className="px-4 py-3 text-[13px] tabular-nums text-text-primary font-semibold">
                    {s.userCount.toLocaleString("en-IN")}
                  </td>
                  <td className={`px-4 py-3 text-[12px] ${s.status === "stale" ? "text-rose-600" : "text-text-muted"}`}>
                    {refreshed}
                  </td>
                  <td className="px-4 py-3">
                    {s.owner === "meera" && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: `${OWNER_COLOR}1A`, color: OWNER_COLOR }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: OWNER_COLOR }} />
                        Owned by Meera
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
