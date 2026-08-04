import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TICK = { fontSize: 10 };

export default function SplitBarChart({ testId, title, byService, byChannel, valueFormatter }) {
  const [view, setView] = useState("service");
  const data = view === "service" ? byService : byChannel;

  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-text-primary">{title}</h3>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            data-testid={`${testId}-toggle-service`}
            onClick={() => setView("service")}
            className={`px-3 py-1 text-[11px] font-medium ${view === "service" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
          >
            Service
          </button>
          <button
            type="button"
            data-testid={`${testId}-toggle-channel`}
            onClick={() => setView("channel")}
            className={`px-3 py-1 text-[11px] font-medium ${view === "channel" ? "bg-primary text-white" : "bg-white text-text-primary"}`}
          >
            Channel
          </button>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="#E5E7EB" strokeDasharray="2 2" />
            <XAxis type="number" tick={TICK} stroke="#94A3B8" tickFormatter={valueFormatter} />
            <YAxis type="category" dataKey="label" tick={TICK} stroke="#94A3B8" width={80} />
            <Tooltip formatter={(v) => valueFormatter(v)} contentStyle={{ fontSize: 11 }} />
            <Bar dataKey="value" fill="#6C3AE8" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
