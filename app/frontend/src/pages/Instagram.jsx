import React from "react";
import PreviewHeader, { KpiTile, previewToast } from "@/components/common/PreviewHeader";
import { Instagram, MessageCircle, Zap } from "lucide-react";

const KPIS = [
  { label: "DMs sent (30d)", value: "3,412", delta: "+22%", testId: "insta-kpi-sent" },
  { label: "DMs opened", value: "84.6%", delta: "+1.8pp", testId: "insta-kpi-opened" },
  { label: "Conversions", value: "412", delta: "+34", testId: "insta-kpi-conv" },
  { label: "Stories engaged", value: "8.9K", delta: "+11%", testId: "insta-kpi-stories" },
];

const AUTOMATIONS = [
  {
    id: "a1",
    title: "Comment-to-DM · Product link",
    body: 'When users comment "LINK" on a reel, instantly DM them the product page.',
    status: "Active",
    runs: "1,204 runs",
  },
  {
    id: "a2",
    title: "Story reply auto-reply",
    body: "Friendly auto-reply to every story reaction with a 10% off code.",
    status: "Active",
    runs: "612 runs",
  },
  {
    id: "a3",
    title: "Welcome DM for new followers",
    body: "First-time followers get a warm welcome and a curated 'shop our best' carousel.",
    status: "Paused",
    runs: "—",
  },
];

export default function InstagramPage() {
  return (
    <div className="max-w-[1400px] mx-auto" data-testid="page-instagram">
      <PreviewHeader
        title="Instagram"
        subtitle="DM automation + comment-to-DM flows for creators and brands."
        badge="New"
        testIdPrefix="insta"
      />

      {/* Connect card */}
      <div
        data-testid="insta-connect-card"
        className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white p-6 flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Instagram className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold">Connect your Instagram account</div>
            <div className="text-sm text-white/90 mt-0.5">
              Authenticate once to unlock DM automation, comment-to-DM flows, and story reply triggers.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => previewToast()}
          data-testid="insta-connect-btn"
          className="px-4 py-2 rounded-md bg-white text-[#DD2A7B] text-sm font-semibold hover:bg-white/95"
        >
          Connect Account
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => (
          <KpiTile key={k.testId} {...k} />
        ))}
      </div>

      <h2 className="text-base font-semibold text-text-primary mb-3">Automations</h2>
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        data-testid="insta-automations-grid"
      >
        {AUTOMATIONS.map((a) => (
          <div
            key={a.id}
            data-testid={`insta-automation-${a.id}`}
            className="bg-surface border border-border rounded-lg p-4 flex flex-col"
          >
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-md bg-primary-tint flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-text-primary">{a.title}</div>
                <div className="text-[12px] text-text-secondary mt-0.5 line-clamp-2">{a.body}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px]">
              <span
                className={
                  a.status === "Active"
                    ? "inline-flex items-center gap-1 text-emerald-700"
                    : "inline-flex items-center gap-1 text-amber-700"
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    a.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
                {a.status}
              </span>
              <span className="text-text-muted">{a.runs}</span>
            </div>
            <button
              type="button"
              onClick={() => previewToast()}
              data-testid={`insta-automation-${a.id}-edit`}
              className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline self-start"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              View flow
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
