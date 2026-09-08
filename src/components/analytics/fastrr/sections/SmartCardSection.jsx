import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import PoweredByLabel from "../shared/PoweredByLabel";
import SectionSkeleton from "../shared/SectionSkeleton";
import MetricTooltip from "../shared/MetricTooltip";
import { formatPercent, formatSeconds } from "@/lib/analyticsFormat";

const TICK = { fontSize: 10 };

export default function SmartCardSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton testId="fastrr-smart-card-skeleton" rows={4} />;

  return (
    <div data-testid="fastrr-smart-card-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-text-primary">Smart Card deep-dive</h2>
        <PoweredByLabel source="Fastrr checkout SDK" />
      </div>

      <div className="bg-primary-tint border border-primary/40 rounded-lg p-5" data-testid="fastrr-smart-card-conversion">
        <span className="text-[11px] uppercase tracking-wide text-primary font-medium">Conversion Rate: Smart Card vs Standard</span>
        <div className="mt-2 flex items-center gap-8">
          <div><div className="text-[11px] text-text-muted">Smart-Card-assisted</div><div className="text-2xl font-semibold text-primary tabular-nums">{formatPercent(data.conversionRate.smartCard)}</div></div>
          <div><div className="text-[11px] text-text-muted">Standard checkout</div><div className="text-2xl font-semibold text-text-primary tabular-nums">{formatPercent(data.conversionRate.standard)}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-rates">
          <div className="text-[11px] text-text-muted">Autofill Trigger Rate</div>
          <div className="text-lg font-semibold tabular-nums">{formatPercent(data.autofillTriggerRate)}</div>
          <div className="flex items-center gap-1 mt-2">
            <div className="text-[11px] text-text-muted">Acceptance Rate</div>
            <MetricTooltip
              name="Acceptance Rate"
              formula="Sessions where prefill was used unedited ÷ Sessions where Smart Card fired × 100"
              description="Share of autofilled sessions the shopper accepted without editing."
            />
          </div>
          <div className="text-lg font-semibold tabular-nums">{formatPercent(data.acceptanceRate)}</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-checkout-time">
          <div className="text-[11px] text-text-muted">Checkout time — Smart Card</div>
          <div className="text-lg font-semibold tabular-nums">{formatSeconds(data.checkoutTimeSeconds.smartCard)}</div>
          <div className="text-[11px] text-text-muted mt-2">Checkout time — Manual</div>
          <div className="text-lg font-semibold tabular-nums">{formatSeconds(data.checkoutTimeSeconds.manual)}</div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-field-edit-rates">
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">Per-field edit rate after autofill</h3>
        <div className="grid grid-cols-4 gap-2">
          {data.fieldEditRates.map((f) => (
            <div key={f.field} className="text-center" data-testid={`fastrr-field-edit-rate-${f.field.toLowerCase()}`}>
              <div className="text-[11px] text-text-muted">{f.field}</div>
              <div className="text-[13px] font-semibold tabular-nums">{formatPercent(f.editRate)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4" data-testid="fastrr-smart-card-dropoff">
        <h3 className="text-[13px] font-semibold text-text-primary mb-3">Drop-off per checkout step, with vs without Smart Card</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dropoffByStep} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
              <XAxis dataKey="step" tick={TICK} stroke="#94A3B8" />
              <YAxis tick={TICK} stroke="#94A3B8" tickFormatter={(v) => formatPercent(v)} />
              <Tooltip formatter={(v) => formatPercent(v)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="withSmartCard" name="With Smart Card" fill="#6C3AE8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="withoutSmartCard" name="Without Smart Card" fill="#94A3B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
