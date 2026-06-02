import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchFlows,
  pauseFlow,
  resumeFlow,
  deleteFlow,
} from "@/lib/flowsApi";
import StatusPill from "@/components/flows/StatusPill";
import ChannelChip from "@/components/flows/ChannelChip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, GitBranch, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

function formatINRShort(value) {
  if (!value) return "₹0";
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

function PerformanceCell({ performance }) {
  if (!performance || !performance.entered) return <span className="text-text-muted">—</span>;
  return (
    <div className="text-[11px] text-text-secondary">
      Entered <span className="font-medium text-text-primary">{performance.entered}</span>
      {" · "}Conv <span className="font-medium text-text-primary">{performance.conversion_rate.toFixed(1)}%</span>
      {performance.revenue_inr ? (
        <>
          {" · "}
          <span className="font-medium text-text-primary">
            {formatINRShort(performance.revenue_inr)}
          </span>
        </>
      ) : null}
    </div>
  );
}

function KpiCard({ label, value, testId }) {
  return (
    <div
      className="bg-surface border border-border rounded-lg px-4 py-3"
      data-testid={testId}
    >
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </div>
      <div className="text-xl font-semibold text-text-primary tabular-nums mt-1">
        {value}
      </div>
    </div>
  );
}

export default function FlowsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["flows"],
    queryFn: fetchFlows,
    staleTime: 30_000,
  });

  const counts = useMemo(() => {
    const c = { total: flows.length, active: 0, paused: 0, draft: 0 };
    flows.forEach((f) => {
      c[f.status] = (c[f.status] || 0) + 1;
    });
    return c;
  }, [flows]);

  const filtered = useMemo(() => {
    return flows.filter((f) => {
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (search && !f.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [flows, search, statusFilter]);

  const pauseMut = useMutation({
    mutationFn: pauseFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow paused");
    },
  });
  const resumeMut = useMutation({
    mutationFn: resumeFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow resumed");
    },
  });
  const deleteMut = useMutation({
    mutationFn: deleteFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flows"] });
      toast.success("Flow deleted");
    },
  });

  return (
    <div
      className="space-y-6 animate-fade-in-up max-w-[1400px] mx-auto"
      data-testid="page-flows"
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-text-primary">
            Flows
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Automated multi-channel customer journeys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              data-testid="flows-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search flows..."
              className="pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-surface w-[220px] focus:outline-none focus:border-primary/60"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger
              className="w-[140px] h-9 text-sm"
              data-testid="flows-status-filter"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            data-testid="flows-create-btn"
            onClick={() => navigate("/flows/builder/new")}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary-hover"
          >
            <Plus className="w-4 h-4" />
            Create flow
          </button>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="flows-kpis">
        <KpiCard label="Total flows" value={counts.total} testId="flows-kpi-total" />
        <KpiCard label="Active" value={counts.active || 0} testId="flows-kpi-active" />
        <KpiCard label="Paused" value={counts.paused || 0} testId="flows-kpi-paused" />
        <KpiCard label="Drafts" value={counts.draft || 0} testId="flows-kpi-draft" />
      </div>

      {/* Table */}
      <div
        className="bg-surface border border-border rounded-lg overflow-hidden"
        data-testid="flows-table"
      >
        {isLoading ? (
          <div className="p-12 text-center text-text-muted text-sm">Loading flows...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center" data-testid="flows-empty-state">
            <GitBranch className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <div className="text-sm font-medium text-text-primary">
              No flows match your filters
            </div>
            {flows.length === 0 && (
              <button
                type="button"
                onClick={() => navigate("/flows/builder/new")}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Create your first flow
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Channels</th>
                <th className="px-4 py-2 font-medium">Audience</th>
                <th className="px-4 py-2 font-medium">Performance</th>
                <th className="px-4 py-2 font-medium">Updated</th>
                <th className="px-4 py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr
                  key={f.id}
                  data-testid={`flow-row-${f.id}`}
                  className="border-t border-border hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3 max-w-md">
                    <Link
                      to={`/flows/builder/${f.id}`}
                      data-testid={`flow-link-${f.id}`}
                      className="font-semibold text-text-primary hover:text-primary"
                    >
                      {f.name}
                    </Link>
                    <div className="text-[12px] text-text-secondary mt-0.5 line-clamp-1">
                      {f.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={f.status} testId={`flow-status-${f.id}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {(f.channels || []).map((c) => (
                        <ChannelChip key={c} channel={c} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {f.audience ? (
                      <>
                        <div className="font-medium text-text-primary truncate max-w-[200px]">
                          {f.audience.segment_name}
                        </div>
                        <div className="text-text-muted">
                          {new Intl.NumberFormat("en-IN").format(
                            f.audience.estimated_users || 0,
                          )}{" "}
                          users
                        </div>
                      </>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PerformanceCell performance={f.performance} />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-muted whitespace-nowrap">
                    {f.updated_at
                      ? formatDistanceToNow(new Date(f.updated_at), { addSuffix: true })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          data-testid={`flow-actions-${f.id}`}
                          className="p-1 hover:bg-slate-100 rounded-md"
                        >
                          <MoreVertical className="w-4 h-4 text-text-secondary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/flows/builder/${f.id}`}>View / Edit</Link>
                        </DropdownMenuItem>
                        {f.status === "active" && (
                          <DropdownMenuItem
                            onSelect={() => pauseMut.mutate(f.id)}
                            data-testid={`flow-action-pause-${f.id}`}
                          >
                            Pause
                          </DropdownMenuItem>
                        )}
                        {f.status === "paused" && (
                          <DropdownMenuItem
                            onSelect={() => resumeMut.mutate(f.id)}
                            data-testid={`flow-action-resume-${f.id}`}
                          >
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => deleteMut.mutate(f.id)}
                          className="text-rose-600"
                          data-testid={`flow-action-delete-${f.id}`}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
