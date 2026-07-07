import React, { useMemo, useState } from "react";
import { useFlowBuilderStore } from "@/store/flowBuilderStore";
import { getNodeAnalytics } from "@/data/mockAnalytics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Info, ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown, Pencil } from "lucide-react";

function formatINR(value) {
  if (!value) return "₹0";
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  return `₹${new Intl.NumberFormat("en-IN").format(value)}`;
}

// Stable Recharts style/option props — module-scope identity prevents
// unnecessary chart re-renders.
const TICK_STYLE = { fontSize: 10 };
const TOOLTIP_CONTENT_STYLE = { fontSize: 11 };
const TOOLTIP_LABEL_STYLE = { fontSize: 11 };
const LINE_DOT_STYLE = { r: 2 };
const LINE_ACTIVE_DOT_STYLE = { r: 4 };

function Kpi({ label, value, testId }) {
  return (
    <div
      className="bg-surface border border-border rounded-md px-3 py-2"
      data-testid={testId}
    >
      <div className="text-[10px] uppercase tracking-wide text-text-muted font-medium">
        {label}
      </div>
      <div className="text-lg font-semibold text-text-primary tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}

function RateComparison({ label, thisTemplate, similarTemplates }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-1 text-[11px] text-text-primary mb-2">
        <span>{label}</span>
        <Info size={11} className="text-text-muted" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-text-muted mb-0.5">This template</div>
          <div className="text-xl font-semibold text-orange-500 tabular-nums">
            {thisTemplate}%
          </div>
        </div>
        <div className="border-l border-border pl-2">
          <div className="text-[10px] text-text-muted mb-0.5">Similar templates</div>
          <div className="text-xl font-semibold text-text-primary tabular-nums">
            {similarTemplates}%
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaInsightCard({ insight }) {
  const [recIndex, setRecIndex] = useState(0);
  const [feedback, setFeedback] = useState(null); // "up" | "down" | null
  const recommendations = insight?.recommendations || [];
  const current = recommendations[recIndex];

  return (
    <div
      className="bg-surface border border-border rounded-md p-3"
      data-testid="analytics-meta-insight"
    >
      <div className="flex items-center gap-1 text-[13px] font-semibold text-text-primary">
        Template benchmarks
        <Info size={12} className="text-text-muted" />
      </div>
      {insight?.date_range && (
        <div className="text-[10px] text-text-muted mt-0.5 mb-3">
          {insight.date_range}
        </div>
      )}

      {insight?.read_rate && (
        <RateComparison
          label="Your read rate is lower than others"
          thisTemplate={insight.read_rate.this_template}
          similarTemplates={insight.read_rate.similar_templates}
        />
      )}
      {insight?.click_rate && (
        <RateComparison
          label="Your click rate is lower than others"
          thisTemplate={insight.click_rate.this_template}
          similarTemplates={insight.click_rate.similar_templates}
        />
      )}

      {current && (
        <>
          <div className="border-t border-border my-3" />
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-[12px] font-semibold text-text-primary">Recommendations</div>
              <div className="text-[10px] text-text-muted">Actions you can take</div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous recommendation"
                disabled={recIndex === 0}
                onClick={() => setRecIndex((i) => Math.max(0, i - 1))}
                className="h-6 w-6 flex items-center justify-center rounded border border-border disabled:opacity-40 hover:bg-app-bg"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                type="button"
                aria-label="Next recommendation"
                disabled={recIndex === recommendations.length - 1}
                onClick={() => setRecIndex((i) => Math.min(recommendations.length - 1, i + 1))}
                className="h-6 w-6 flex items-center justify-center rounded border border-border disabled:opacity-40 hover:bg-app-bg"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div className="bg-app-bg border border-border rounded-md p-3">
            <div className="text-[12px] font-medium text-text-primary mb-1">
              {current.title}
            </div>
            <div className="text-[11px] text-text-muted leading-snug mb-3">
              {current.body}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-[11px] px-2.5 py-1 rounded border border-border text-text-primary hover:bg-surface"
              >
                See details
              </button>
              <button
                type="button"
                className="text-[11px] px-2.5 py-1 rounded border border-border text-text-primary hover:bg-surface inline-flex items-center gap-1"
              >
                <Pencil size={10} /> Edit template
              </button>
            </div>
          </div>

          {recommendations.length > 1 && (
            <div className="flex items-center justify-center gap-1 mt-2">
              {recommendations.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i === recIndex ? "bg-primary" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="border-t border-border my-3" />
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-text-primary">
          Are these benchmarks and recommendations useful?
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Useful"
            onClick={() => setFeedback("up")}
            className={`h-6 w-6 flex items-center justify-center rounded border ${
              feedback === "up" ? "border-primary text-primary" : "border-border text-text-muted"
            }`}
          >
            <ThumbsUp size={12} />
          </button>
          <button
            type="button"
            aria-label="Not useful"
            onClick={() => setFeedback("down")}
            className={`h-6 w-6 flex items-center justify-center rounded border ${
              feedback === "down" ? "border-primary text-primary" : "border-border text-text-muted"
            }`}
          >
            <ThumbsDown size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function generateSparklineData(entered) {
  // 7 days of plausible conversion daily values that average to total entered.
  const base = entered / 7;
  return Array.from({ length: 7 }).map((_, i) => {
    const variance = (Math.sin(i * 1.2) + Math.cos(i)) * 0.18;
    return {
      day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      entered: Math.max(0, Math.round(base * (1 + variance))),
    };
  });
}

export default function AnalyticsTab() {
  const flowId = useFlowBuilderStore((s) => s.flowId);
  const meta = useFlowBuilderStore((s) => s.meta);
  const nodes = useFlowBuilderStore((s) => s.nodes);
  const status = meta?.status;
  const perf = meta?.performance || {};

  const whatsappNode = useMemo(
    () => nodes.find((n) => n.type === "whatsapp"),
    [nodes],
  );
  const metaInsight = whatsappNode
    ? getNodeAnalytics(flowId, whatsappNode.id)?.meta_insight
    : null;

  const sparkData = useMemo(
    () => generateSparklineData(perf.entered || 0),
    [perf.entered],
  );

  // Per-node breakdown — fan-out by sequence.
  const nodeBreakdown = useMemo(() => {
    const entered = perf.entered || 0;
    if (!entered) return [];
    const ordered = [...nodes].sort(
      (a, b) => (a.position?.y || 0) - (b.position?.y || 0),
    );
    let remaining = entered;
    return ordered.map((n, i) => {
      // Each step retains 75–98% of the prior (loose attrition model).
      const drop = 0.96 - i * 0.05;
      const next = Math.max(0, Math.round(remaining * Math.max(drop, 0.65)));
      const rate = remaining ? (next / remaining) * 100 : 0;
      const row = {
        id: n.id,
        label: n.data?.label || n.type,
        type: n.type,
        in: remaining,
        out: next,
        rate,
      };
      remaining = next;
      return row;
    });
  }, [nodes, perf.entered]);

  if (status === "draft") {
    return (
      <div
        className="h-full flex items-center justify-center p-6 text-center"
        data-testid="analytics-disabled"
      >
        <div>
          <div className="text-sm font-medium text-text-primary mb-1">
            Analytics will light up once this flow is published.
          </div>
          <div className="text-[12px] text-text-muted">
            Drafts don't collect performance data yet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto"
      data-testid="right-analytics-tab"
    >
      <div className="p-4 flex flex-col gap-4 pb-6">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          <Kpi label="Entered" value={(perf.entered || 0).toLocaleString("en-IN")} testId="analytics-entered" />
          <Kpi label="Completed" value={(perf.completed || 0).toLocaleString("en-IN")} testId="analytics-completed" />
          <Kpi label="Conversion" value={`${(perf.conversion_rate || 0).toFixed(1)}%`} testId="analytics-conv" />
          <Kpi label="Revenue" value={formatINR(perf.revenue_inr)} testId="analytics-revenue" />
        </div>

        {/* Sparkline */}
        <div className="bg-surface border border-border rounded-md p-3">
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-3">
            7-day entry trend
          </div>
          <div className="h-36" data-testid="analytics-sparkline">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
                <XAxis dataKey="day" tick={TICK_STYLE} stroke="#94A3B8" />
                <YAxis tick={TICK_STYLE} stroke="#94A3B8" width={36} />
                <RechartsTooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                />
                <Line
                  type="monotone"
                  dataKey="entered"
                  stroke="#6C3AE8"
                  strokeWidth={2}
                  dot={LINE_DOT_STYLE}
                  activeDot={LINE_ACTIVE_DOT_STYLE}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-node delivery */}
        <div>
          <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
            Per-node delivery
          </div>
          {nodeBreakdown.length === 0 ? (
            <div className="text-[11px] text-text-muted px-1">No data yet.</div>
          ) : (
            <div className="flex flex-col gap-1.5" data-testid="analytics-nodes">
              {nodeBreakdown.map((row) => (
                <div
                  key={row.id}
                  className="bg-surface border border-border rounded-md px-3 py-2"
                >
                  <div className="text-[12px] font-medium text-text-primary truncate mb-0.5">
                    {row.label}
                  </div>
                  <div className="text-[10px] text-text-muted mb-1.5">
                    {row.in.toLocaleString("en-IN")} → {row.out.toLocaleString("en-IN")} delivered ({row.rate.toFixed(1)}%)
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(100, row.rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meta Insight */}
        {whatsappNode && (
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium mb-2">
              Meta Insight
            </div>
            {metaInsight ? (
              <MetaInsightCard insight={metaInsight} />
            ) : (
              <div className="bg-surface border border-border rounded-md px-3 py-2 text-[11px] text-text-muted">
                No Meta insight available yet for this flow.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
