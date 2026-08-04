import React from "react";
import { TrendingUp } from "lucide-react";
import { formatCompactCurrency } from "@/lib/analyticsFormat";

const CHANNELS = [
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Email" },
  { key: "instagram", label: "Instagram" },
  { key: "sms", label: "SMS" },
  { key: "rcs", label: "RCS" },
  { key: "aiCalling", label: "AI Calling" },
  { key: "aiChatbot", label: "AI Chatbot" },
];

export default function RoiCard({ testId, value, totalRevenue, totalCost, byChannel }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-tint text-primary">
            <TrendingUp className="w-4 h-4" />
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-wide text-text-muted font-medium">Return on Investment</div>
            <div className="text-2xl font-semibold text-text-primary tabular-nums">{value.toFixed(2)}X</div>
          </div>
        </div>
        <div className="text-right text-[11px] text-text-muted leading-5">
          <div>Total Revenue Generated: {formatCompactCurrency(totalRevenue)}</div>
          <div>Total Cost: {formatCompactCurrency(totalCost)}</div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {CHANNELS.map(({ key, label }) => (
          <div key={key} className="bg-slate-50 rounded-md p-2 text-center" data-testid={`roi-channel-${key}`}>
            <div className="text-[10px] text-text-muted font-medium">{label}</div>
            <div className="text-[14px] font-semibold text-text-primary tabular-nums">{(byChannel[key] ?? 0).toFixed(2)}X</div>
          </div>
        ))}
      </div>
    </div>
  );
}
